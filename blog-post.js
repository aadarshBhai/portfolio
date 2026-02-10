// Blog Post Page JavaScript

// Get post ID from URL (MongoDB ObjectId string)
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('id');

// Format date helper function
function formatDate(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        // If invalid date, try to parse as string
        return dateString;
    }

    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// API Configuration - will be set by config.js
const API_BASE_URL = window.API_BASE_URL || 'http://127.0.0.1:5000/api';

// Sample blog posts data - Fallback if API fails or for legacy local tests
const samplePosts = {
    1: {
        id: 1,
        title: "Welcome to My Blog",
        excerpt: "This is a placeholder for your first blog post. An introduction to my journey in community development and social impact work.",
        category: "community",
        categoryName: "Community Development",
        date: "2026-01-15",
        dateFormatted: "January 15, 2026",
        image: "assets/blog-placeholder.jpg",
        content: `
            <p>Welcome to my blog! I'm excited to share my thoughts, experiences, and insights on community development, social impact, and leadership.</p>
            <h2>Why This Blog?</h2>
            <p>Throughout my journey working with communities in rural and semi-urban areas, I've learned that sharing knowledge and experiences is crucial for collective growth.</p>
        `
    }
};

// Load post from API (with sample fallback)
async function loadPost() {
    let post = null;

    if (postId) {
        try {
            const response = await fetch(`${API_BASE_URL}/posts/${postId}`, { method: 'GET' });
            if (response.ok) {
                post = await response.json();
            } else if (response.status !== 404) {
                console.error('Failed to fetch post from API:', response.status);
            }
        } catch (error) {
            console.error('Error fetching post from API:', error);
        }
    }

    if (!post) {
        const numericId = parseInt(postId, 10);
        if (!Number.isNaN(numericId)) {
            post = samplePosts[numericId];
        }
    }

    if (post) {
        displayPost(post);
        loadRelatedPosts(post.category, post.id);
        setupSocialSharing(post);
    } else {
        // Post not found
        document.getElementById('postTitle').textContent = "Post Not Found";
        document.getElementById('postExcerpt').textContent = "The blog post you're looking for doesn't exist.";
        document.getElementById('postContent').innerHTML = '<p><a href="blog.html" class="btn-secondary">← Return to Blog</a></p>';

        document.querySelector('.post-meta').style.display = 'none';
        document.querySelector('.post-featured-image').style.display = 'none';
        document.querySelector('.post-header').style.textAlign = 'center';
        document.getElementById('postContent').style.textAlign = 'center';
    }
}

// Display the post
function displayPost(post) {
    document.getElementById('postTitle').textContent = post.title;
    document.getElementById('postExcerpt').textContent = post.excerpt;
    document.getElementById('postCategory').textContent = post.categoryName || 'Passive Income';

    let dateStr = post.date;
    if (post.createdAt) {
        dateStr = new Date(post.createdAt).toISOString().split('T')[0];
    }
    document.getElementById('postDate').textContent = formatDate(dateStr);

    document.getElementById('postContent').innerHTML = post.content;

    // Update stats (views and shares only - comments removed)
    document.getElementById('postViews').textContent = post.views || 0;
    document.getElementById('postShares').textContent = post.shares || 0;

    const postImage = document.getElementById('postImage');
    if (post.image) {
        postImage.src = post.image;
    }

    document.getElementById('currentPost').textContent = post.title;
}

// Load related posts
async function loadRelatedPosts(category, currentPostId) {
    let allPosts = [];

    try {
        const response = await fetch(`${API_BASE_URL}/posts`, { method: 'GET' });
        if (response.ok) {
            allPosts = await response.json();
        }
    } catch (error) {
        console.error('Error fetching related posts from API:', error);
    }

    if (!allPosts.length) {
        allPosts = Object.values(samplePosts);
    }

    const relatedPosts = allPosts
        .filter(post => post.category === category && post.id !== currentPostId && post.published)
        .slice(0, 3);

    const relatedPostsContainer = document.getElementById('relatedPosts');

    if (relatedPosts.length === 0) {
        document.getElementById('related-posts').style.display = 'none';
        return;
    }

    relatedPostsContainer.innerHTML = relatedPosts.map(post => `
        <article class="blog-card reveal">
            <div class="blog-image">
                <img src="${post.image}" alt="${post.title}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22400%22 height=%22300%22/%3E%3Ctext fill=%22%23999%22 font-family=%22sans-serif%22 font-size=%2224%22 dy=%2210.5%22 font-weight=%22bold%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22%3EBlog Image%3C/text%3E%3C/svg%3E'">
            </div>
            <div class="blog-content">
                <div class="blog-meta">
                    <span class="blog-category">${post.categoryName}</span>
                    <span class="blog-date">${formatDate(post.date || post.createdAt)}</span>
                </div>
                <h3>${post.title}</h3>
                <p>${post.excerpt}</p>
            </div>
        </article>
    `).join('');
}

// Setup social sharing
function setupSocialSharing(post) {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(post.title);

    document.getElementById('shareTwitter').href = `https://twitter.com/intent/tweet?text=${title}&url=${url}`;
    document.getElementById('shareLinkedIn').href = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    document.getElementById('shareFacebook').href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
}

// Increment share count and open share dialog
async function incrementShare(event, platform) {
    event.preventDefault();

    try {
        await fetch(`${API_BASE_URL}/posts/${postId}/share`, { method: 'POST' });

        const sharesElement = document.getElementById('postShares');
        const currentShares = parseInt(sharesElement.textContent) || 0;
        sharesElement.textContent = currentShares + 1;

        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(document.getElementById('postTitle').textContent);

        let shareUrl;
        switch (platform) {
            case 'twitter': shareUrl = `https://twitter.com/intent/tweet?text=${title}&url=${url}`; break;
            case 'linkedin': shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`; break;
            case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`; break;
        }

        window.open(shareUrl, '_blank', 'width=600,height=400');
    } catch (error) {
        console.error('Error incrementing share:', error);
    }
}

// Refresh post stats
async function refreshPostStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}`, { method: 'GET' });
        if (response.ok) {
            const post = await response.json();
            document.getElementById('postViews').textContent = post.views || 0;
            document.getElementById('postShares').textContent = post.shares || 0;
        }
    } catch (error) {
        console.error('Error refreshing stats:', error);
    }
}

// Initialize on page load
if (postId) {
    loadPost();

    document.getElementById('shareTwitter').addEventListener('click', (e) => incrementShare(e, 'twitter'));
    document.getElementById('shareLinkedIn').addEventListener('click', (e) => incrementShare(e, 'linkedin'));
    document.getElementById('shareFacebook').addEventListener('click', (e) => incrementShare(e, 'facebook'));

    setInterval(refreshPostStats, 30000);
}
