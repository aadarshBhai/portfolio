// Blog Page JavaScript

// API Configuration - will be set by config.js
const API_BASE_URL = window.API_BASE_URL || 'http://127.0.0.1:5000/api';

// Blog posts data - null means not yet loaded, [] means loaded but empty
let blogPosts = null;

// Load posts from API
async function loadPosts() {
    try {
        const response = await fetch(`${API_BASE_URL}/posts`, { method: 'GET' });
        if (!response.ok) {
            throw new Error(`Failed to load posts: ${response.status}`);
        }
        const data = await response.json();

        // Only update if data has actually changed (basic count/ID check)
        const dataChanged = !blogPosts ||
            data.length !== blogPosts.length ||
            JSON.stringify(data.map(p => p.id || p._id)) !== JSON.stringify(blogPosts.map(p => p.id || p._id));

        if (dataChanged) {
            blogPosts = data;
            console.log('Blog posts updated:', blogPosts.length);
            renderBlogPosts();
        }
    } catch (error) {
        console.error('Error loading posts from API:', error);
        if (blogPosts === null) blogPosts = [];
        renderBlogPosts();
    }
}

// UI Elements
const blogGrid = document.getElementById('blogGrid');
const emptyState = document.getElementById('emptyState');

// Initialize
loadPosts();

// Debug function
window.debugBlog = function () {
    console.log('=== BLOG DEBUG INFO ===');
    console.log('1. blogPosts variable:', blogPosts);
    console.log('2. blogGrid element:', blogGrid);
    console.log('3. emptyState element:', emptyState);
    console.log('=== END DEBUG ===');
    return { blogPosts, blogGrid, emptyState };
};

// Render blog posts
function renderBlogPosts() {
    if (!blogGrid || !emptyState) return;

    // If still loading, don't show "empty" state yet
    if (blogPosts === null) {
        blogGrid.innerHTML = '<div class="loading-spinner">Loading posts...</div>';
        return;
    }

    const publishedPosts = blogPosts.filter(post => post.published === true || post.published === 'true');

    if (publishedPosts.length === 0) {
        blogGrid.innerHTML = '';
        blogGrid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    const postsHTML = publishedPosts.map(post => {
        const postId = post._id || post.id;
        return `
        <article class="blog-card reveal">
            <div class="blog-image">
                <img src="${post.image || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22400%22 height=%22300%22/%3E%3Ctext fill=%22%23999%22 font-family=%22sans-serif%22 font-size=%2224%22 dy=%2210.5%22 font-weight=%22bold%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22%3EBlog Image%3C/text%3E%3C/svg%3E'}" alt="${post.title}" loading="lazy">
            </div>
            <div class="blog-content">
                <div class="blog-meta">
                    <span class="blog-date">${post.dateFormatted || post.date}</span>
                </div>
                <h3><a href="blog-post.html?id=${postId}">${post.title}</a></h3>
                <p>${post.excerpt}</p>
            </div>
        </article> `;
    }).join('');

    blogGrid.innerHTML = postsHTML;
    blogGrid.style.display = 'grid';
    emptyState.style.display = 'none';

    // Re-apply reveal animations
    if (typeof window.refreshReveal === 'function') {
        window.refreshReveal();
    } else if (typeof revealOnScroll === 'function') {
        revealOnScroll();
    }
}

// Real-time sync
function startRealTimeSync() {
    setInterval(loadPosts, 10000); // Check every 10 seconds
}

// Page visibility sync
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        loadPosts();
    }
});

// Initial call
if (blogGrid) {
    startRealTimeSync();
}
