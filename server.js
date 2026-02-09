const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, 'posts.json');

// --- MongoDB Schema ---
const postSchema = new mongoose.Schema({
    id: String, // Keep string ID for compatibility
    title: String,
    excerpt: String,
    category: String,
    categoryName: String,
    date: String,
    dateFormatted: String,
    image: String, // We'll store relatively short base64 strings or URLs here
    content: String,
    published: Boolean,
    createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);

// --- Persistence Helpers ---
let useMongoDB = false;

// Connect to MongoDB if URI is present
if (process.env.MONGO_URI) {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => {
            console.log('Connected to MongoDB');
            useMongoDB = true;
        })
        .catch(err => {
            console.error('MongoDB connection error:', err);
            console.log('Falling back to file system storage');
        });
} else {
    console.log('No MONGO_URI found. Using file system storage.');
}

// Helper to load posts
async function loadPosts() {
    if (useMongoDB) {
        try {
            // Sort by createdAt descending
            const posts = await Post.find().sort({ createdAt: -1 });
            // Map Mongoose documents to plain objects if needed, but they are JSON compatible
            return posts;
        } catch (err) {
            console.error('Error fetching from MongoDB:', err);
            return [];
        }
    } else {
        // File System Fallback
        try {
            if (fs.existsSync(DATA_FILE)) {
                const data = fs.readFileSync(DATA_FILE, 'utf8');
                return JSON.parse(data);
            }
        } catch (err) {
            console.error('Error reading posts file:', err);
        }
        return [];
    }
}

// Helper to save a new post
async function createPost(postData) {
    if (useMongoDB) {
        const post = new Post(postData);
        return await post.save();
    } else {
        const posts = await loadPosts();
        posts.unshift(postData);
        fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2), 'utf8');
        return postData;
    }
}

// Helper to update a post
async function updatePost(id, updateData) {
    if (useMongoDB) {
        // Find by custom 'id' field, not _id
        return await Post.findOneAndUpdate({ id: id }, updateData, { new: true });
    } else {
        const posts = await loadPosts();
        const index = posts.findIndex(p => p.id === id);
        if (index !== -1) {
            posts[index] = { ...posts[index], ...updateData };
            fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2), 'utf8');
            return posts[index];
        }
        return null;
    }
}

// Helper to delete a post
async function deletePost(id) {
    if (useMongoDB) {
        return await Post.findOneAndDelete({ id: id });
    } else {
        let posts = await loadPosts();
        const initialLength = posts.length;
        posts = posts.filter(p => p.id !== id);
        if (posts.length < initialLength) {
            fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2), 'utf8');
            return true;
        }
        return false;
    }
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images
app.use(express.static(path.join(__dirname)));

// API Routes
app.get('/api/posts', async (req, res) => {
    let posts = await loadPosts();

    // Filter by published status unless '?all=true' is provided
    if (req.query.all !== 'true') {
        posts = posts.filter(post => post.published === true);
    }

    console.log(`GET /api/posts - Returning ${posts.length} posts (Source: ${useMongoDB ? 'MongoDB' : 'File System'})`);
    res.json(posts);
});

app.get('/api/posts/:id', async (req, res) => {
    const posts = await loadPosts();
    const post = posts.find(p => p.id === req.params.id || p.id == req.params.id);

    if (post) {
        res.json(post);
    } else {
        res.status(404).json({ error: 'Post not found' });
    }
});

app.post('/api/posts', async (req, res) => {
    try {
        const postData = {
            id: Date.now().toString(),
            ...req.body,
            createdAt: new Date()
        };

        const savedPost = await createPost(postData);
        console.log('Created post:', savedPost.title);
        res.json(savedPost);
    } catch (err) {
        console.error('Error creating post:', err);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

app.put('/api/posts/:id', async (req, res) => {
    try {
        const updatedPost = await updatePost(req.params.id, req.body);
        if (updatedPost) {
            console.log('Updated post:', updatedPost.title);
            res.json(updatedPost);
        } else {
            res.status(404).json({ error: 'Post not found' });
        }
    } catch (err) {
        console.error('Error updating post:', err);
        res.status(500).json({ error: 'Failed to update post' });
    }
});

app.delete('/api/posts/:id', async (req, res) => {
    try {
        const success = await deletePost(req.params.id);
        if (success) {
            console.log('Deleted post:', req.params.id);
            res.json({ message: 'Post deleted' });
        } else {
            res.status(404).json({ error: 'Post not found' });
        }
    } catch (err) {
        console.error('Error deleting post:', err);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// Debug endpoint
app.get('/api/debug', async (req, res) => {
    const posts = await loadPosts();
    res.json({
        message: 'Debug info',
        totalPosts: posts.length,
        persistence: useMongoDB ? 'MongoDB' : 'File System',
        envPort: process.env.PORT,
        mongoUriPresent: !!process.env.MONGO_URI
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', persistence: useMongoDB ? 'MongoDB' : 'File System' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Persistence mode: ${useMongoDB ? 'MongoDB' : 'File System'}`);
});
