const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB Configuration
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb+srv://aadarshgolucky:A%40Wrpcp3.%40737xx@cluster0.oss7hwd.mongodb.net/blog?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'blog';
const COLLECTION_NAME = 'posts';

let db = null;
let postsCollection = null;

// Connect to MongoDB with migration logic
async function connectAndMigrate() {
    try {
        console.log('=== CONNECTING TO MONGODB ===');
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db(DB_NAME);
        postsCollection = db.collection(COLLECTION_NAME);
        console.log('✅ Connected to MongoDB Atlas');

        // Migration Check: If DB is empty and posts.json exists, migrate data
        const count = await postsCollection.countDocuments();
        if (count === 0) {
            console.log('📦 MongoDB collection is empty. Checking for local migration data...');
            const storageDir = process.env.RENDER === 'true' ? '/tmp' : __dirname;
            const POSTS_FILE = path.join(__dirname, 'posts.json'); // Always look in current dir first for initial migration

            if (fs.existsSync(POSTS_FILE)) {
                try {
                    const data = fs.readFileSync(POSTS_FILE, 'utf8');
                    const localPosts = JSON.parse(data);
                    if (localPosts.length > 0) {
                        console.log(`🚚 Migrating ${localPosts.length} posts from posts.json to MongoDB...`);
                        await postsCollection.insertMany(localPosts);
                        console.log('✅ Migration successful');
                    }
                } catch (err) {
                    console.error('❌ Migration failed:', err);
                }
            } else {
                console.log('ℹ️ No local posts.json found for migration.');
            }
        } else {
            console.log(`✅ Loaded ${count} posts from MongoDB Atlas`);
        }
        return true;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        return false;
    }
}

// Middleware
app.use(cors({
    origin: ['https://aadarshgolucky.netlify.app', 'http://localhost:8000', 'http://127.0.0.1:8000', 'http://localhost:5000', 'http://127.0.0.1:5000'],
    credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Helper to sanitize post for JSON response
function postToJSON(post) {
    if (!post) return null;
    const json = { ...post };
    if (!json.id && json._id) {
        json.id = json._id.toString();
    }
    // Don't delete _id as it might be useful for some clients, 
    // but ensure 'id' is present for frontend compatibility
    return json;
}

// API Routes

// Get all posts
app.get('/api/posts', async (req, res) => {
    try {
        const showAll = req.query.all === 'true';
        const query = showAll ? {} : { published: true };
        const posts = await postsCollection.find(query).sort({ createdAt: -1 }).toArray();
        res.json(posts.map(postToJSON));
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// Get single post
app.get('/api/posts/:id', async (req, res) => {
    try {
        const id = req.params.id;
        let post;

        if (ObjectId.isValid(id)) {
            post = await postsCollection.findOne({ _id: new ObjectId(id) });
        } else {
            post = await postsCollection.findOne({ id: id });
        }

        if (post) {
            // Async view increment (don't wait for response)
            postsCollection.updateOne({ _id: post._id }, { $inc: { views: 1 } }).catch(console.error);
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

// Create post
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
        res.json(postToJSON(insertedPost));
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// Update post
app.put('/api/posts/:id', async (req, res) => {
    try {
        const id = req.params.id;
        let filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id: id };

        // Remove _id and id from body to avoid update errors
        const updateData = { ...req.body };
        delete updateData._id;
        delete updateData.id;

        const result = await postsCollection.findOneAndUpdate(
            filter,
            { $set: updateData },
            { returnDocument: 'after' }
        );

        if (result) {
            res.json(postToJSON(result));
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
        const id = req.params.id;
        let filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id: id };

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

// Post action: Share
app.post('/api/posts/:id/share', async (req, res) => {
    try {
        const id = req.params.id;
        let filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id: id };

        const result = await postsCollection.findOneAndUpdate(
            filter,
            { $inc: { shares: 1 } },
            { returnDocument: 'after' }
        );

        if (result) {
            res.json({ shares: result.shares });
        } else {
            res.status(404).json({ error: 'Post not found' });
        }
    } catch (error) {
        console.error('Error sharing post:', error);
        res.status(500).json({ error: 'Failed to share post' });
    }
});

// Post action: Comment
app.post('/api/posts/:id/comments', async (req, res) => {
    try {
        const id = req.params.id;
        let filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id: id };

        const comment = {
            id: new ObjectId().toString(),
            name: req.body.name,
            email: req.body.email,
            content: req.body.content,
            createdAt: new Date(),
            approved: true // Auto-approve for now based on previous server-mongo logic
        };

        const result = await postsCollection.findOneAndUpdate(
            filter,
            {
                $push: { comments: comment },
                $inc: { commentsCount: 1 }
            },
            { returnDocument: 'after' }
        );

        if (result) {
            res.json(comment);
        } else {
            res.status(404).json({ error: 'Post not found' });
        }
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Health check
app.get('/api/health', async (req, res) => {
    try {
        const isConnected = !!postsCollection;
        const count = isConnected ? await postsCollection.countDocuments() : 0;
        res.json({
            status: isConnected ? 'ok' : 'error',
            storage: 'mongodb-atlas',
            connected: isConnected,
            totalPosts: count,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    const connected = await connectAndMigrate();
    if (!connected) {
        console.error('⚠️ Server starting without database connection. Persistence will be UNAVAILABLE.');
    }
});
