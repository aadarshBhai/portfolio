// Blog Post Page JavaScript

// Get post ID from URL (MongoDB ObjectId string)
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('id');

// Format date helper function
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// API Configuration
const API_BASE_URL = window.API_BASE_URL || 'http://127.0.0.1:5000/api';

// Load post from API
async function loadPost() {
    if (!postId) {
        const titleEl = document.getElementById('postTitle');
        if (titleEl) titleEl.textContent = "No post ID provided";
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}`);
        if (response.ok) {
            const post = await response.json();
            displayPost(post);
            loadRelatedPosts(post._id || post.id);
            setupSocialSharing(post);
        } else {
            const titleEl = document.getElementById('postTitle');
            if (titleEl) titleEl.textContent = "Post Not Found";
        }
    } catch (error) {
        console.error('Error fetching post:', error);
        const titleEl = document.getElementById('postTitle');
        if (titleEl) titleEl.textContent = "Error loading post";
    }
}

// Display Post Content
function displayPost(post) {
    const safeSetText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    const safeSetHTML = (id, html) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    };

    // Update Page Content
    safeSetText('postTitle', post.title);
    safeSetText('postExcerpt', post.excerpt);
    safeSetText('postDate', formatDate(post.createdAt || post.date));
    safeSetHTML('postContent', post.content);
    safeSetText('postViews', post.views || 0);
    safeSetText('postShares', post.shares || 0);
    safeSetText('postComments', (post.comments || []).length);
    safeSetText('currentPost', post.title);

    const postImage = document.getElementById('postImage');
    if (postImage && post.image) {
        postImage.src = post.image;
        postImage.alt = post.title; // Better SEO
    }

    // Dynamic SEO Updates
    document.title = `${post.title} | Aadarsh Kumar Blog`;

    // Update Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = "description";
        document.head.appendChild(metaDesc);
    }
    const description = post.excerpt || `${post.title} - A blog post by Aadarsh Kumar`;
    metaDesc.content = description;

    // Update OG & Twitter Tags
    const updateMeta = (id, content, attr = 'content') => {
        const el = document.getElementById(id);
        if (el) el.setAttribute(attr, content);
    };

    updateMeta('og-url', window.location.href);
    updateMeta('og-title', post.title);
    updateMeta('og-desc', description);
    updateMeta('og-image', post.image || '');

    updateMeta('twitter-url', window.location.href);
    updateMeta('twitter-title', post.title);
    updateMeta('twitter-desc', description);
    updateMeta('twitter-image', post.image || '');

    // Add JSON-LD Structured Data for Google
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.excerpt,
        "image": post.image || "",
        "author": {
            "@type": "Person",
            "name": "Aadarsh Kumar"
        },
        "datePublished": post.createdAt || post.date,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": window.location.href
        }
    };

    let script = document.getElementById('blog-schema');
    if (!script) {
        script = document.createElement('script');
        script.id = 'blog-schema';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
    }
    script.text = JSON.stringify(schemaData);

    loadComments();
}

// Social Sharing Setup
function setupSocialSharing(post) {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(post.title);

    const twitterBtn = document.getElementById('shareTwitter');
    const linkedInBtn = document.getElementById('shareLinkedIn');
    const facebookBtn = document.getElementById('shareFacebook');

    if (twitterBtn) twitterBtn.href = `https://twitter.com/intent/tweet?text=${title}&url=${url}`;
    if (linkedInBtn) linkedInBtn.href = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    if (facebookBtn) facebookBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
}

// Load Comments
async function loadComments() {
    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`);
        if (response.ok) {
            const comments = await response.json();
            const container = document.getElementById('commentsContainer');
            const countEl = document.getElementById('commentsCount');
            const postCountEl = document.getElementById('postComments');

            if (countEl) countEl.textContent = comments.length;
            if (postCountEl) postCountEl.textContent = comments.length;

            if (container) {
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
        }
    } catch (e) {
        console.error('Error loading comments:', e);
    }
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
        fetch(`${API_BASE_URL}/posts/${postId}/share`, { method: 'POST' });
        const sharesElement = document.getElementById('postShares');
        if (sharesElement) {
            sharesElement.textContent = (parseInt(sharesElement.textContent) || 0) + 1;
        }

        const url = encodeURIComponent(window.location.href);
        const titleEl = document.getElementById('postTitle');
        const title = titleEl ? encodeURIComponent(titleEl.textContent) : 'Blog Post';

        let shareUrl = platform === 'twitter' ? `https://twitter.com/intent/tweet?text=${title}&url=${url}` :
            platform === 'linkedin' ? `https://www.linkedin.com/sharing/share-offsite/?url=${url}` :
                `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        window.open(shareUrl, '_blank', 'width=600,height=400');
    } catch (e) { console.error('Error sharing:', e); }
}

// Load Latest Posts (Instead of Related by Category)
async function loadRelatedPosts(currentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/posts`);
        if (response.ok) {
            const posts = await response.json();
            // Just show latest 3 posts excluding current one
            const related = posts
                .filter(p => (p._id || p.id) !== currentId && p.published)
                .slice(0, 3);

            const container = document.getElementById('relatedPosts');
            const section = document.getElementById('related-posts');

            if (related.length === 0) {
                if (section) section.style.display = 'none';
            } else if (container) {
                container.innerHTML = related.map(p => `
                    <article class="blog-card reveal">
                        <div class="blog-image">
                            <img src="${p.image || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22400%22 height=%22300%22/%3E%3Ctext fill=%22%23999%22 font-family=%22sans-serif%22 font-size=%2224%22 dy=%2210.5%22 font-weight=%22bold%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22%3EBlog Image%3C/text%3E%3C/svg%3E'}" alt="${p.title}">
                        </div>
                        <div class="blog-content">
                            <div class="blog-meta">
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
    } catch (e) { console.error('Error loading latest posts:', e); }
}

// Init
if (postId) {
    loadPost();
    const commentForm = document.getElementById('newCommentForm');
    if (commentForm) commentForm.addEventListener('submit', submitComment);

    ['shareTwitter', 'shareLinkedIn', 'shareFacebook'].forEach(id => {
        const el = document.getElementById(id);
        const platform = id.replace('share', '').toLowerCase();
        if (el) el.addEventListener('click', (e) => incrementShare(e, platform));
    });
}
