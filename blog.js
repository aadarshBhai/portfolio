// Blog Page JavaScript

// API Configuration - will be set by config.js
const API_BASE_URL = window.API_BASE_URL || 'http://127.0.0.1:5000/api';

// Blog posts data - will be loaded from API
let blogPosts = [];

// Default sample data - REMOVED (no demo blogs)
const defaultPosts = [];

// Load posts from API
async function loadPosts() {
    try {
        const response = await fetch(`${API_BASE_URL}/posts`, { method: 'GET' });
        if (!response.ok) {
            throw new Error(`Failed to load posts: ${response.status}`);
        }
        blogPosts = await response.json();
        console.log('Loaded posts from MongoDB:', blogPosts.length);
        console.log('Posts data:', blogPosts);
    } catch (error) {
        console.error('Error loading posts from MongoDB API:', error);
        blogPosts = [];
    }

    // Always render posts after loading
    renderBlogPosts();
}

// Filter functionality
const filterButtons = document.querySelectorAll('.filter-btn');
const blogGrid = document.getElementById('blogGrid');
const emptyState = document.getElementById('emptyState');

// Initialize
loadPosts();

// Debug function - check browser console
window.checkBlogPosts = function () {
    console.log('Current blog posts:', blogPosts);
    console.log('localStorage data:', localStorage.getItem('blogPosts'));
    return blogPosts;
};

// Manual refresh function for testing
window.refreshBlogPosts = function () {
    console.log('Manually refreshing blog posts...');
    loadPosts();
    return blogPosts;
};

// Force sync from admin
window.syncFromAdmin = function () {
    const stored = localStorage.getItem('blogPosts');
    if (stored) {
        blogPosts = JSON.parse(stored);
        renderBlogPosts();
        console.log('Synced from admin:', blogPosts.length, 'posts');
    }
    return blogPosts;
};

// Force refresh all blog data
window.forceRefreshBlog = function () {
    console.log('Force refreshing blog data...');
    localStorage.clear(); // Clear any potential issues
    loadPosts(); // Reload everything
    return blogPosts;
};

// Check localStorage directly
window.checkLocalStorage = function () {
    const data = localStorage.getItem('blogPosts');
    console.log('Raw localStorage data:', data);
    if (data) {
        const parsed = JSON.parse(data);
        console.log('Parsed localStorage posts:', parsed);
        return parsed;
    }
    return [];
};

// Clear all demo data and start fresh
window.clearDemoData = function () {
    localStorage.removeItem('blogPosts');
    blogPosts = [];
    renderBlogPosts();
    console.log('All demo data cleared - starting fresh!');
    return blogPosts;
};

// Comprehensive debug function
window.debugBlog = function () {
    console.log('=== BLOG DEBUG INFO ===');
    console.log('1. blogPosts variable:', blogPosts);
    console.log('2. localStorage raw:', localStorage.getItem('blogPosts'));
    console.log('3. blogGrid element:', blogGrid);
    console.log('4. emptyState element:', emptyState);
    console.log('5. Published posts:', blogPosts.filter(post => post.published));
    console.log('6. Blog grid HTML:', blogGrid.innerHTML);
    console.log('=== END DEBUG ===');
    return {
        blogPosts,
        localStorageData: localStorage.getItem('blogPosts'),
        blogGridElement: blogGrid,
        emptyStateElement: emptyState
    };
};

// Check API directly
window.checkAPI = async function () {
    try {
        console.log('Checking API directly...');
        const response = await fetch(`${API_BASE_URL}/posts`);
        const posts = await response.json();
        console.log('API Response:', posts);
        console.log('Published posts from API:', posts.filter(p => p.published));
        console.log('First post details:', posts[0]);
        return posts;
    } catch (error) {
        console.error('API Error:', error);
        return [];
    }
};

// Force render with API data
window.forceRender = async function () {
    try {
        const response = await fetch(`${API_BASE_URL}/posts`);
        const posts = await response.json();
        console.log('Force rendering posts:', posts);
        blogPosts = posts;
        renderBlogPosts();
        return posts;
    } catch (error) {
        console.error('Force render error:', error);
        return [];
    }
};

// Test API connection
window.testAPI = async function () {
    try {
        console.log('Testing API connection...');
        const response = await fetch(`${API_BASE_URL}/test`);
        const result = await response.json();
        console.log('API Test Result:', result);
        return result;
    } catch (error) {
        console.error('API Test Error:', error);
        return null;
    }
};

// Check blog grid visibility
window.checkVisibility = function () {
    console.log('=== VISIBILITY CHECK ===');
    console.log('blogGrid element:', blogGrid);
    console.log('blogGrid display:', window.getComputedStyle(blogGrid).display);
    console.log('blogGrid children:', blogGrid.children.length);

    const cards = document.querySelectorAll('.blog-card');
    console.log('Blog cards found:', cards.length);

    cards.forEach((card, index) => {
        const styles = window.getComputedStyle(card);
        console.log(`Card ${index}:`, {
            display: styles.display,
            visibility: styles.visibility,
            height: styles.height,
            width: styles.width
        });
    });

    return {
        gridElement: blogGrid,
        gridDisplay: window.getComputedStyle(blogGrid).display,
        cardsCount: cards.length,
        cardsStyles: Array.from(cards).map(card => window.getComputedStyle(card))
    };
};

// Force make cards visible
window.forceVisible = function () {
    console.log('Forcing cards to be visible...');
    const cards = document.querySelectorAll('.blog-card');
    cards.forEach((card, index) => {
        card.style.cssText = `
            display: block !important;
            visibility: visible !important;
            position: relative !important;
            height: auto !important;
            width: 100% !important;
            background: white !important;
            border: 1px solid #ddd !important;
            padding: 1rem !important;
            margin-bottom: 1rem !important;
        `;
        console.log(`Card ${index} forced visible`);
    });

    blogGrid.style.cssText = `
        display: grid !important;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)) !important;
        gap: 2rem !important;
        width: 100% !important;
    `;

    console.log('Cards forced to be visible');
};

// Create test post
window.createTestPost = async function () {
    try {
        console.log('Creating test post...');
        const testPost = {
            title: 'Test Blog Post',
            excerpt: 'This is a test post to verify the blog system is working',
            category: 'news-politics',
            categoryName: 'News and Politics',
            date: '2024-02-09',
            dateFormatted: 'February 9, 2024',
            image: '',
            content: 'This is test content for the blog post.',
            published: true
        };

        const response = await fetch(`${API_BASE_URL}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testPost)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Test post created:', result);
            await loadPosts(); // Refresh posts
            return result;
        } else {
            console.error('Failed to create test post');
            return null;
        }
    } catch (error) {
        console.error('Error creating test post:', error);
        return null;
    }
};

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Skip refresh button
        if (button.id === 'refreshBtn') {
            return;
        }

        // Update active state
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const category = button.dataset.category;
        filterPosts(category);
    });
});

// Refresh button functionality
const refreshBtn = document.getElementById('refreshBtn');
if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
        // Add spinning animation
        refreshBtn.style.animation = 'spin 1s linear';

        // Force refresh from API
        await loadPosts();

        // Remove animation after 1 second
        setTimeout(() => {
            refreshBtn.style.animation = '';
        }, 1000);

        console.log('Posts refreshed manually');
    });
}

// Add spin animation
const spinStyle = document.createElement('style');
spinStyle.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    .refresh-btn {
        padding: 0.75rem 1rem;
        background: var(--text-primary);
        color: var(--bg-primary);
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: var(--transition);
    }
    .refresh-btn:hover {
        background: #333;
    }
`;
document.head.appendChild(spinStyle);

function filterPosts(category) {
    const blogCards = document.querySelectorAll('.blog-card');
    let visibleCount = 0;

    blogCards.forEach(card => {
        const cardCategory = card.dataset.category;

        if (category === 'all' || cardCategory === category) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    // Show/hide empty state
    if (visibleCount === 0) {
        blogGrid.style.display = 'none';
        emptyState.style.display = 'block';
    } else {
        blogGrid.style.display = 'grid';
        emptyState.style.display = 'none';
    }
}

// Render blog posts
function renderBlogPosts() {
    console.log('renderBlogPosts called, blogPosts:', blogPosts);
    console.log('blogGrid element:', blogGrid);
    console.log('emptyState element:', emptyState);

    // Handle both MongoDB _id and regular id
    const publishedPosts = blogPosts.filter(post => {
        const isPublished = post.published === true || post.published === 'true';
        console.log(`Post "${post.title}" published:`, isPublished);
        return isPublished;
    });

    console.log('Published posts:', publishedPosts);
    console.log('Published posts count:', publishedPosts.length);

    if (publishedPosts.length === 0) {
        console.log('No published posts found');
        blogGrid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    console.log('Rendering posts to grid...');
    const postsHTML = publishedPosts.map(post => {
        // Use _id from MongoDB or fallback to id
        const postId = post._id || post.id;
        console.log('Rendering post:', post);
        console.log('Post ID:', postId);

        return `
        <article class="blog-card reveal" data-category="${post.category}">
            <div class="blog-image">
                <img src="${post.image || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22400%22 height=%22300%22/%3E%3Ctext fill=%22%23999%22 font-family=%22sans-serif%22 font-size=%2224%22 dy=%2210.5%22 font-weight=%22bold%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22%3EBlog Image%3C/text%3E%3C/svg%3E'}" alt="${post.title}">
            </div>
            <div class="blog-content">
                <div class="blog-meta">
                    <span class="blog-category">${post.categoryName || post.category}</span>
                    <span class="blog-date">${post.dateFormatted || post.date}</span>
                </div>
                <h3>${post.title}</h3>
                <p>${post.excerpt}</p>
            </div>
        </article> `
    }).join('');

    console.log('Generated HTML length:', postsHTML.length);
    console.log('Setting blogGrid innerHTML...');
    blogGrid.innerHTML = postsHTML;
    console.log('Blog grid innerHTML set successfully');

    // Re-apply reveal animations
    if (typeof window.refreshReveal === 'function') {
        window.refreshReveal();
    } else if (typeof revealOnScroll === 'function') {
        revealOnScroll();
    }

    blogGrid.style.display = 'grid';
    emptyState.style.display = 'none';
    console.log('Blog grid display set to grid');
}

// Real-time sync with server
function startRealTimeSync() {
    // Poll API every 5 seconds for new posts (reduced frequency to avoid conflicts)
    setInterval(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/posts`);
            const latestPosts = await response.json();

            // Check if posts have changed
            if (JSON.stringify(latestPosts) !== JSON.stringify(blogPosts)) {
                console.log('New posts detected from API, updating...');
                blogPosts = latestPosts;
                renderBlogPosts();

                // Show notification for new posts
                if (latestPosts.length > blogPosts.length) {
                    showNewPostNotification();
                }
            }
        } catch (error) {
            console.error('Error checking for updates:', error);
        }
    }, 5000); // Check every 5 seconds
}

// Show notification for new posts
function showNewPostNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    notification.textContent = '🎉 New blog post published!';
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Call on page load if posts were updated
if (blogGrid) {
    // Start real-time sync
    startRealTimeSync();

    // Also check on page visibility change (when user switches tabs)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            console.log('Page became visible, checking for updates...');
            loadPosts();
        }
    });

    // Initial render
    renderBlogPosts();
}
