const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// In-memory storage (fallback)
let blogPosts = [];

// Middleware
app.use(cors({
    origin: ['https://your-netlify-site.netlify.app', 'http://localhost:8000', 'https://127.0.0.1:8000'],
    credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// API Routes
app.get('/api/posts', (req, res) => {
    const publishedPosts = blogPosts.filter(post => post.published === true);
    console.log('=== GET /api/posts ===');
    console.log('Total posts in memory:', blogPosts.length);
    console.log('Published posts:', publishedPosts.length);
    console.log('Posts:', publishedPosts.map(p => ({ title: p.title, published: p.published })));
    res.json(publishedPosts);
});

app.post('/api/posts', (req, res) => {
    console.log('=== POST /api/posts RECEIVED ===');
    console.log('Request body:', req.body);
    
    const post = {
        id: Date.now().toString(),
        ...req.body,
        createdAt: new Date()
    };
    blogPosts.unshift(post);
    console.log('Created post:', post.title);
    console.log('Post published status:', post.published);
    console.log('Total posts:', blogPosts.length);
    console.log('Published posts:', blogPosts.filter(p => p.published === true).length);
    console.log('Full post object:', post);
    res.json(post);
});

app.put('/api/posts/:id', (req, res) => {
    const index = blogPosts.findIndex(p => p.id === req.params.id);
    if (index !== -1) {
        blogPosts[index] = { ...blogPosts[index], ...req.body };
        console.log('Updated post:', blogPosts[index].title);
        res.json(blogPosts[index]);
    } else {
        res.status(404).json({ error: 'Post not found' });
    }
});

app.delete('/api/posts/:id', (req, res) => {
    blogPosts = blogPosts.filter(p => p.id !== req.params.id);
    console.log('Deleted post:', req.params.id);
    res.json({ message: 'Post deleted' });
});

// Debug endpoint
app.get('/api/debug', (req, res) => {
    console.log('=== DEBUG ENDPOINT CALLED ===');
    console.log('Current blogPosts array:', blogPosts);
    res.json({ 
        message: 'Debug info',
        timestamp: new Date().toISOString(),
        totalPosts: blogPosts.length,
        publishedPosts: blogPosts.filter(p => p.published === true).length,
        allPosts: blogPosts,
        publishedPostsOnly: blogPosts.filter(p => p.published === true)
    });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Simple server is working',
        timestamp: new Date().toISOString(),
        totalPosts: blogPosts.length,
        publishedPosts: blogPosts.filter(p => p.published === true).length,
        posts: blogPosts.map(p => ({ title: p.title, published: p.published }))
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Simple blog server running on port ${PORT}`);
    console.log('API endpoints available at: /api');
});
