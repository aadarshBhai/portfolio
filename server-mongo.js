const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB Atlas Configuration
console.log('Environment variables loaded:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'SET' : 'NOT SET');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb+srv://aadarshgolucky:A%40Wrpcp3.%40737xx@cluster0.oss7hwd.mongodb.net/blog?retryWrites=true&w=majority&appName=Cluster0';
console.log('Using MongoDB URI:', MONGODB_URI.replace(/:A%40.*@/, ':***@'));
const DB_NAME = 'blog';
const COLLECTION_NAME = 'posts';

// MongoDB Connection
let db = null;
let postsCollection = null;

async function connectToMongoDB() {
    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db(DB_NAME);
        postsCollection = db.collection(COLLECTION_NAME);
        console.log('✅ Connected to MongoDB Atlas');
        console.log(`Database: ${DB_NAME}`);
        console.log(`Collection: ${COLLECTION_NAME}`);
        return true;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        return false;
    }
}

// Initialize MongoDB connection
connectToMongoDB();

// Middleware
app.use(cors({
    origin: ['http://127.0.0.1:8000', 'https://aadarshgolucky.netlify.app'],
    credentials: true
}));
app.use(express.json());

// Helper function to convert ObjectId to string
function postToJSON(post) {
    return {
        ...post,
        id: post._id.toString(),
        _id: undefined // Remove MongoDB _id from response
    };
}

// Get all published posts
app.get('/api/posts', async (req, res) => {
    try {
        const showAll = req.query.all === 'true';
        const query = showAll ? {} : { published: true };
        const posts = await postsCollection.find(query).sort({ createdAt: -1 }).toArray();
        const postsWithId = posts.map(postToJSON);
        res.json(postsWithId);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// Get single post by ID
app.get('/api/posts/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        let post;

        // Try to find by ObjectId first
        if (ObjectId.isValid(postId)) {
            post = await postsCollection.findOne({ _id: new ObjectId(postId) });
        } else {
            // Try to find by string id (for backward compatibility)
            post = await postsCollection.findOne({ id: postId });
        }

        if (post) {
            // Increment views
            await postsCollection.updateOne(
                { _id: post._id },
                { $inc: { views: 1 } }
            );
            post.views = (post.views || 0) + 1;
            res.json(postToJSON(post));
        } else {
            res.status(404).json({ error: 'Post not found' });
        }
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ error: 'Failed to fetch post' });
    }
});

// Increment share count
app.post('/api/posts/:id/share', async (req, res) => {
    try {
        const postId = req.params.id;
        let post;

        if (ObjectId.isValid(postId)) {
            post = await postsCollection.findOne({ _id: new ObjectId(postId) });
        } else {
            post = await postsCollection.findOne({ id: postId });
        }

        if (post) {
            const result = await postsCollection.updateOne(
                { _id: post._id },
                { $inc: { shares: 1 } }
            );
            const updatedPost = await postsCollection.findOne({ _id: post._id });
            res.json({ shares: updatedPost.shares || 1 });
        } else {
            res.status(404).json({ error: 'Post not found' });
        }
    } catch (error) {
        console.error('Error incrementing share:', error);
        res.status(500).json({ error: 'Failed to increment share' });
    }
});

// Add comment to post
app.post('/api/posts/:id/comments', async (req, res) => {
    try {
        const postId = req.params.id;
        let post;

        if (ObjectId.isValid(postId)) {
            post = await postsCollection.findOne({ _id: new ObjectId(postId) });
        } else {
            post = await postsCollection.findOne({ id: postId });
        }

        if (post) {
            const comment = {
                id: new ObjectId().toString(),
                ...req.body,
                createdAt: new Date(),
                approved: true
            };

            await postsCollection.updateOne(
                { _id: post._id },
                {
                    $push: { comments: comment },
                    $inc: { commentsCount: 1 }
                }
            );

            res.json(comment);
        } else {
            res.status(404).json({ error: 'Post not found' });
        }
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Get comments for post
app.get('/api/posts/:id/comments', async (req, res) => {
    try {
        const postId = req.params.id;
        let post;

        if (ObjectId.isValid(postId)) {
            post = await postsCollection.findOne({ _id: new ObjectId(postId) });
        } else {
            post = await postsCollection.findOne({ id: postId });
        }

        if (post) {
            const approvedComments = (post.comments || []).filter(c => c.approved);
            res.json(approvedComments);
        } else {
            res.status(404).json({ error: 'Post not found' });
        }
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// Create new post
app.post('/api/posts', async (req, res) => {
    try {
        const post = {
            ...req.body,
            createdAt: new Date(),
            views: 0,
            shares: 0,
            comments: [],
            commentsCount: 0
        };

        const result = await postsCollection.insertOne(post);
        const insertedPost = { ...post, _id: result.insertedId };
        console.log('Created post:', insertedPost.title);
        res.json(postToJSON(insertedPost));
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// Update post
app.put('/api/posts/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        let filter;

        if (ObjectId.isValid(postId)) {
            filter = { _id: new ObjectId(postId) };
        } else {
            filter = { id: postId };
        }

        const result = await postsCollection.updateOne(filter, { $set: req.body });

        if (result.matchedCount > 0) {
            const updatedPost = await postsCollection.findOne(filter);
            res.json(postToJSON(updatedPost));
        } else {
            res.status(404).json({ error: 'Post not found' });
        }
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Failed to update post' });
    }
});

// Delete post
app.delete('/api/posts/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        let filter;

        if (ObjectId.isValid(postId)) {
            filter = { _id: new ObjectId(postId) };
        } else {
            filter = { id: postId };
        }

        const result = await postsCollection.deleteOne(filter);

        if (result.deletedCount > 0) {
            res.json({ message: 'Post deleted successfully' });
        } else {
            res.status(404).json({ error: 'Post not found' });
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const postCount = await postsCollection.countDocuments();
        const publishedCount = await postsCollection.countDocuments({ published: true });

        res.json({
            status: 'ok',
            storage: 'mongodb-atlas',
            database: DB_NAME,
            collection: COLLECTION_NAME,
            connected: !!db,
            totalPosts: postCount,
            publishedPosts: publishedCount,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.json({
            status: 'error',
            storage: 'mongodb-atlas',
            connected: !!db,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Start server
app.listen(PORT, async () => {
    console.log(`MongoDB-based blog server running on port ${PORT}`);
    console.log(`API endpoints available at: /api`);

    // Test connection on startup
    const connected = await connectToMongoDB();
    if (!connected) {
        console.error('⚠️ Failed to connect to MongoDB Atlas');
        console.log('⚠️ Please check your MongoDB URI in environment variables');
    }
});
