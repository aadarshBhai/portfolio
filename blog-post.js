// Blog Post Page JavaScript

// Get post ID from URL (MongoDB ObjectId string)
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('id');

// Format date helper function
function formatDate(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return dateString;
    }

    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// API Configuration
const API_BASE_URL = window.API_BASE_URL || 'http://127.0.0.1:5000/api';

// Sample fallback (for offline or local testing)
const samplePosts = {
    1: { id: 1, title: "Welcome to My Blog", category: "news-politics", date: "2026-02-09", content: "..." }
};

// Load post from API
async function loadPost() {
    let post = null;
    if (postId) {
        try {
            const response = await fetch(`${API_BASE_URL}/posts/${postId}`);
            if (response.ok) post = await response.json();
        } catch (error) { console.error('Error fetching post:', error); }
    }

    if (post) {
        displayPost(post);
        loadRelatedPosts(post.category, post._id || post.id);
        setupSocialSharing(post);
    } else {
        document.getElementById('postTitle').textContent = "Post Not Found";
    }
}

// Display Post Content
function displayPost(post) {
    document.getElementById('postTitle').textContent = post.title;
    document.getElementById('postExcerpt').textContent = post.excerpt;
    document.getElementById('postCategory').textContent = post.categoryName || post.category;
    document.getElementById('postDate').textContent = formatDate(post.createdAt || post.date);
    document.getElementById('postContent').innerHTML = post.content;
    document.getElementById('postViews').textContent = post.views || 0;
    document.getElementById('postShares').textContent = post.shares || 0;
    document.getElementById('postComments').textContent = (post.comments || []).length;
    document.getElementById('currentPost').textContent = post.title;

    if (post.image) document.getElementById('postImage').src = post.image;

    loadComments();
}

// Social Sharing Setup
function setupSocialSharing(post) {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(post.title);
    document.getElementById('shareTwitter').href = `https://twitter.com/intent/tweet?text=${title}&url=${url}`;
    document.getElementById('shareLinkedIn').href = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    document.getElementById('shareFacebook').href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
}

// Load Comments
async function loadComments() {
    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`);
        if (response.ok) {
            const comments = await response.json();
            const container = document.getElementById('commentsContainer');
            document.getElementById('commentsCount').textContent = comments.length;
            document.getElementById('postComments').textContent = comments.length;

            if (comments.length === 0) {
                container.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
            } else {
                container.innerHTML = comments.map(c => `
                    <div class="comment">
                        <div class="comment-header">
                            <strong>${c.name}</strong>
                            <span class="comment-date">${formatDate(c.createdAt)}</span>
                        </div>
                        <div class="comment-content">${c.content}</div>
                    </div>
                `).join('');
            }
        }
    } catch (e) { console.error('Error loading comments:', e); }
}

// Submit Comment
async function submitComment(event) {
    event.preventDefault();
    const name = document.getElementById('commentName').value;
    const email = document.getElementById('commentEmail').value;
    const content = document.getElementById('commentContent').value;

    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, content })
        });

        if (response.ok) {
            document.getElementById('newCommentForm').reset();
            loadComments();
        }
    } catch (e) { console.error('Error submitting comment:', e); }
}

// Share Increment
async function incrementShare(event, platform) {
    event.preventDefault();
    try {
        await fetch(`${API_BASE_URL}/posts/${postId}/share`, { method: 'POST' });
        const sharesElement = document.getElementById('postShares');
        sharesElement.textContent = (parseInt(sharesElement.textContent) || 0) + 1;

        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(document.getElementById('postTitle').textContent);
        let shareUrl = platform === 'twitter' ? `https://twitter.com/intent/tweet?text=${title}&url=${url}` :
            platform === 'linkedin' ? `https://www.linkedin.com/sharing/share-offsite/?url=${url}` :
                `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        window.open(shareUrl, '_blank', 'width=600,height=400');
    } catch (e) { console.error('Error sharing:', e); }
}

// Load Related Posts
async function loadRelatedPosts(category, currentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/posts`);
        if (response.ok) {
            const posts = await response.json();
            const related = posts.filter(p => p.category === category && (p._id || p.id) !== currentId && p.published).slice(0, 3);
            const container = document.getElementById('relatedPosts');

            if (related.length === 0) {
                document.getElementById('related-posts').style.display = 'none';
            } else {
                container.innerHTML = related.map(p => `
                    <article class="blog-card reveal">
                        <div class="blog-image">
                            <img src="${p.image}" alt="${p.title}" onerror="this.src='data:image/svg+xml,%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22400%22 height=%22300%22/%3E%3Ctext fill=%22%23999%22 font-family=%22sans-serif%22 font-size=%2224%22 dy=%2210.5%22 font-weight=%22bold%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22%3EBlog Image%3C/text%3E%3C/svg%3E'">
                        </div>
                        <div class="blog-content">
                            <div class="blog-meta">
                                <span class="blog-category">${p.categoryName || p.category}</span>
                                <span class="blog-date">${formatDate(p.createdAt || p.date)}</span>
                            </div>
                            <h3>${p.title}</h3>
                            <p>${p.excerpt}</p>
                            <a href="blog-post.html?id=${p._id || p.id}" class="read-more">Read More →</a>
                        </div>
                    </article>
                `).join('');
            }
        }
    } catch (e) { console.error('Error loading related:', e); }
}

// Init
if (postId) {
    loadPost();
    document.getElementById('newCommentForm').addEventListener('submit', submitComment);
    document.getElementById('shareTwitter').addEventListener('click', (e) => incrementShare(e, 'twitter'));
    document.getElementById('shareLinkedIn').addEventListener('click', (e) => incrementShare(e, 'linkedin'));
    document.getElementById('shareFacebook').addEventListener('click', (e) => incrementShare(e, 'facebook'));
}
