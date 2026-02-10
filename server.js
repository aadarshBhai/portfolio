const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced persistent storage with fallback
// Use /tmp directory on Render for persistent storage
const isRender = process.env.RENDER === 'true';
const storageDir = isRender ? '/tmp' : __dirname;
const POSTS_FILE = path.join(storageDir, 'posts.json');
const BACKUP_FILE = path.join(storageDir, 'posts-backup.json');

console.log('Storage directory:', storageDir);
console.log('Is Render environment:', isRender);

// Load posts from file with multiple fallbacks
let blogPosts = [];
let inMemoryPosts = []; // In-memory backup

function loadPostsFromFile() {
    console.log('=== LOADING POSTS FROM STORAGE ===');
    try {
        if (fs.existsSync(POSTS_FILE)) {
            const data = fs.readFileSync(POSTS_FILE, 'utf8');
            blogPosts = JSON.parse(data);
            console.log(`✅ Loaded posts from main file: ${blogPosts.length}`);
        } else if (fs.existsSync(BACKUP_FILE)) {
            const data = fs.readFileSync(BACKUP_FILE, 'utf8');
            blogPosts = JSON.parse(data);
            console.log(`✅ Loaded posts from backup file: ${blogPosts.length}`);
        } else {
            // If no files exist, use in-memory backup if available
            if (inMemoryPosts.length > 0) {
                blogPosts = [...inMemoryPosts];
                console.log(`✅ Restored from in-memory backup: ${blogPosts.length}`);
            } else {
                blogPosts = [];
                console.log('⚠️ No existing posts file found, starting fresh');
            }
        }
        
        // Ensure all posts have the new fields
        let updated = false;
        blogPosts.forEach(post => {
            if (post.views === undefined) {
                post.views = 0;
                updated = true;
            }
            if (post.shares === undefined) {
                post.shares = 0;
                updated = true;
            }
            if (post.comments === undefined) {
                post.comments = [];
                updated = true;
            }
        });
        
        if (updated) {
            savePostsToFile();
            console.log('✅ Updated existing posts with new fields');
        }
        
        // Update in-memory backup
        inMemoryPosts = [...blogPosts];
        
    } catch (error) {
        console.error('❌ Error loading posts:', error);
        // Use in-memory backup as last resort
        if (inMemoryPosts.length > 0) {
            blogPosts = [...inMemoryPosts];
            console.log(`✅ Using in-memory backup due to error: ${blogPosts.length}`);
        } else {
            blogPosts = [];
        }
    }
}

// Save posts to file with backup
function savePostsToFile() {
    console.log('=== SAVING POSTS TO STORAGE ===');
    console.log('Posts to save:', blogPosts.length);
    
    try {
        // Save to main file
        fs.writeFileSync(POSTS_FILE, JSON.stringify(blogPosts, null, 2));
        console.log('✅ Saved to main file');
        
        // Create backup
        fs.writeFileSync(BACKUP_FILE, JSON.stringify(blogPosts, null, 2));
        console.log('✅ Created backup file');
        
        // Update in-memory backup
        inMemoryPosts = [...blogPosts];
        console.log('✅ Updated in-memory backup');
        
        console.log('Current posts:', blogPosts.map(p => ({ id: p.id, title: p.title, published: p.published })));
    } catch (error) {
        console.error('❌ Error saving posts:', error);
        // Still update in-memory backup even if file save fails
        inMemoryPosts = [...blogPosts];
    }
}

// Load posts on startup
loadPostsFromFile();

// Auto-save every 30 seconds as additional safety
setInterval(() => {
    if (blogPosts.length > 0) {
        savePostsToFile();
        console.log('🔄 Auto-saved posts');
    }
}, 30000);

// Middleware
app.use(cors({
    origin: ['https://aadarshgolucky.netlify.app', 'http://localhost:8000', 'https://127.0.0.1:8000'],
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

// Get single post by ID
app.get('/api/posts/:id', (req, res) => {
    const postId = req.params.id;
    const post = blogPosts.find(p => p.id === postId);
    console.log('=== GET /api/posts/:id ===');
    console.log('Looking for post ID:', postId);
    console.log('Found post:', post ? post.title : 'Not found');
    
    if (post) {
        // Increment views
        post.views = (post.views || 0) + 1;
        savePostsToFile(); // Save updated view count
        res.json(post);
    } else {
        res.status(404).json({ error: 'Post not found' });
    }
});

// Increment share count
app.post('/api/posts/:id/share', (req, res) => {
    const postId = req.params.id;
    const post = blogPosts.find(p => p.id === postId);
    console.log('=== POST /api/posts/:id/share ===');
    console.log('Sharing post ID:', postId);
    
    if (post) {
        post.shares = (post.shares || 0) + 1;
        savePostsToFile(); // Save updated share count
        res.json({ shares: post.shares });
    } else {
        res.status(404).json({ error: 'Post not found' });
    }
});

// Add comment to post
app.post('/api/posts/:id/comments', (req, res) => {
    const postId = req.params.id;
    const post = blogPosts.find(p => p.id === postId);
    console.log('=== POST /api/posts/:id/comments ===');
    console.log('Adding comment to post ID:', postId);
    
    if (post) {
        const comment = {
            id: Date.now().toString(),
            ...req.body,
            createdAt: new Date(),
            approved: false // Comments need approval
        };
        
        if (!post.comments) {
            post.comments = [];
        }
        post.comments.push(comment);
        savePostsToFile(); // Save updated comments
        res.json(comment);
    } else {
        res.status(404).json({ error: 'Post not found' });
    }
});

// Get comments for post
app.get('/api/posts/:id/comments', (req, res) => {
    const postId = req.params.id;
    const post = blogPosts.find(p => p.id === postId);
    
    if (post) {
        const approvedComments = (post.comments || []).filter(c => c.approved);
        res.json(approvedComments);
    } else {
        res.status(404).json({ error: 'Post not found' });
    }
});

app.post('/api/posts', (req, res) => {
    console.log('=== POST /api/posts RECEIVED ===');
    console.log('Request body:', req.body);
    
    const post = {
        id: Date.now().toString(),
        ...req.body,
        createdAt: new Date(),
        views: 0,
        shares: 0,
        comments: []
    };
    blogPosts.unshift(post);
    savePostsToFile(); // Save to persistent storage
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
        savePostsToFile(); // Save to persistent storage
        console.log('Updated post:', blogPosts[index].title);
        res.json(blogPosts[index]);
    } else {
        res.status(404).json({ error: 'Post not found' });
    }
});

app.delete('/api/posts/:id', (req, res) => {
    blogPosts = blogPosts.filter(p => p.id !== req.params.id);
    savePostsToFile(); // Save to persistent storage
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

// Health check with storage status
app.get('/api/health', (req, res) => {
    const mainFileExists = fs.existsSync(POSTS_FILE);
    const backupFileExists = fs.existsSync(BACKUP_FILE);
    
    res.json({ 
        status: 'ok',
        storage: {
            mainFileExists,
            backupFileExists,
            totalPosts: blogPosts.length,
            publishedPosts: blogPosts.filter(p => p.published === true).length
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Simple blog server running on port ${PORT}`);
    console.log('API endpoints available at: /api');
});
