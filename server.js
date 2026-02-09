const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;
const DATA_FILE = path.join(__dirname, 'posts.json');

// Helper to load posts
function loadPosts() {
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

// Helper to save posts
function savePosts(posts) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2), 'utf8');
    } catch (err) {
        console.error('Error writing posts file:', err);
    }
}

// Initial load
let blogPosts = loadPosts();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// API Routes
app.get('/api/posts', (req, res) => {
    // Reload from file to ensure freshness
    blogPosts = loadPosts();

    let posts = blogPosts;

    // Filter by published status unless '?all=true' is provided
    if (req.query.all !== 'true') {
        posts = blogPosts.filter(post => post.published === true);
    }

    console.log('=== GET /api/posts ===');
    console.log('Query:', req.query);
    console.log('Total posts in storage:', blogPosts.length);
    console.log('Returned posts:', posts.length);

    res.json(posts);
});

app.get('/api/posts/:id', (req, res) => {
    // Reload from file to ensure freshness
    blogPosts = loadPosts();

    // Find post by ID (handle both string and number comparison if needed)
    const post = blogPosts.find(p => p.id === req.params.id || p.id == req.params.id);

    if (post) {
        console.log('=== GET /api/posts/:id ===');
        console.log('Found post:', post.title);
        res.json(post);
    } else {
        console.log('=== GET /api/posts/:id ===');
        console.log('Post not found:', req.params.id);
        res.status(404).json({ error: 'Post not found' });
    }
});

app.post('/api/posts', (req, res) => {
    console.log('=== POST /api/posts RECEIVED ===');

    const post = {
        id: Date.now().toString(),
        ...req.body,
        createdAt: new Date()
    };

    blogPosts.unshift(post);
    savePosts(blogPosts);

    console.log('Created post:', post.title);
    res.json(post);
});

app.put('/api/posts/:id', (req, res) => {
    const index = blogPosts.findIndex(p => p.id === req.params.id);
    if (index !== -1) {
        blogPosts[index] = { ...blogPosts[index], ...req.body };
        savePosts(blogPosts);
        console.log('Updated post:', blogPosts[index].title);
        res.json(blogPosts[index]);
    } else {
        res.status(404).json({ error: 'Post not found' });
    }
});

app.delete('/api/posts/:id', (req, res) => {
    const initialLength = blogPosts.length;
    blogPosts = blogPosts.filter(p => p.id !== req.params.id);

    if (blogPosts.length < initialLength) {
        savePosts(blogPosts);
        console.log('Deleted post:', req.params.id);
        res.json({ message: 'Post deleted' });
    } else {
        res.status(404).json({ error: 'Post not found' });
    }
});

// Debug endpoint
app.get('/api/debug', (req, res) => {
    res.json({
        message: 'Debug info',
        totalPosts: blogPosts.length,
        persistence: 'file-based',
        dataFile: DATA_FILE
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Simple blog server running on http://127.0.0.1:${PORT}`);
    console.log(`Data file: ${DATA_FILE}`);
});
