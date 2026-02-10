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

// Sample blog posts data
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
            <p>Throughout my journey working with communities in rural and semi-urban areas, I've learned that sharing knowledge and experiences is crucial for collective growth. This blog serves as a platform to:</p>

            <ul>
                <li>Document insights from field work and community engagement</li>
                <li>Share best practices in stakeholder coordination</li>
                <li>Reflect on leadership lessons learned on the ground</li>
                <li>Connect with others passionate about social impact</li>
            </ul>

            <h2>What to Expect</h2>
            <p>I'll be writing about various topics related to my work, including community mobilization strategies, project management insights, and personal reflections on creating sustainable change.</p>

            <blockquote>
                "The best way to find yourself is to lose yourself in the service of others." - Mahatma Gandhi
            </blockquote>

            <h3>Community Development Focus</h3>
            <p>Having worked with organizations like Dasrath Manjhi Shikshan Sansthan and Ujjawal Shiksha Foundation, I've seen firsthand the power of grassroots mobilization. My posts will often draw from these real-world experiences.</p>

            <h2>Let's Connect</h2>
            <p>I believe in the power of dialogue and collaboration. Feel free to reach out if any of these topics resonate with you or if you'd like to discuss potential collaborations in the social impact space.</p>

            <p>Thank you for being here, and I look forward to this journey together!</p>
        `
    },
    2: {
        id: 2,
        title: "Leadership Lessons from the Field",
        excerpt: "Insights and lessons learned from grassroots leadership experiences in community mobilization and stakeholder engagement.",
        category: "leadership",
        categoryName: "Leadership",
        date: "2026-01-10",
        dateFormatted: "January 10, 2026",
        image: "assets/blog-placeholder2.jpg",
        content: `
            <p>Leadership in community development is vastly different from corporate leadership. It requires empathy, patience, and a deep understanding of local contexts.</p>

            <h2>Key Lessons Learned</h2>
            <p>Over the years, I've learned several crucial lessons about leading community-based initiatives:</p>

            <h3>1. Listen First, Act Later</h3>
            <p>The most effective leaders in community development are those who spend more time listening than talking. Understanding the community's needs, aspirations, and concerns is the foundation of impactful work.</p>

            <h3>2. Build Trust Through Consistency</h3>
            <p>Trust isn't built overnight. It requires consistent presence, reliable follow-through, and genuine commitment to the community's welfare.</p>

            <blockquote>
                "Leadership is not about being in charge. It's about taking care of those in your charge." - Simon Sinek
            </blockquote>

            <h3>3. Empower Local Champions</h3>
            <p>The most sustainable change comes from within the community. As external facilitators, our role is to identify and empower local champions who can continue the work long after we're gone.</p>

            <h2>Challenges and Growth</h2>
            <p>Every challenge in the field has been an opportunity for growth. From coordinating with diverse stakeholders to navigating resource constraints, each experience has shaped my understanding of effective leadership.</p>

            <h3>Practical Takeaways</h3>
            <ul>
                <li>Always respect local knowledge and customs</li>
                <li>Be flexible and adapt to changing circumstances</li>
                <li>Celebrate small wins to maintain momentum</li>
                <li>Document everything for learning and accountability</li>
                <li>Build systems, not dependencies</li>
            </ul>

            <p>These lessons continue to guide my work and inform my approach to community engagement and leadership development.</p>
        `
    },
    3: {
        id: 3,
        title: "Creating Sustainable Change",
        excerpt: "Exploring sustainable approaches to social impact work in rural and semi-urban communities.",
        category: "social-impact",
        categoryName: "Social Impact",
        date: "2026-01-05",
        dateFormatted: "January 5, 2026",
        image: "assets/blog-placeholder3.jpg",
        content: `
            <p>Sustainability in social impact work goes beyond environmental concerns—it's about creating lasting change that persists even when external support ends.</p>

            <h2>The Sustainability Challenge</h2>
            <p>Many well-intentioned social programs fail because they don't account for long-term sustainability. They create dependency rather than empowerment.</p>

            <h3>Four Pillars of Sustainable Impact</h3>
            <p>Through my work, I've identified four essential pillars for creating sustainable change:</p>

            <h3>1. Local Ownership</h3>
            <p>Communities must feel ownership over initiatives from day one. This means involving them in planning, implementation, and decision-making processes.</p>

            <h3>2. Capacity Building</h3>
            <p>Rather than doing things for communities, we should focus on building their capacity to do things themselves. This includes skills training, knowledge transfer, and leadership development.</p>

            <blockquote>
                "Give a man a fish and you feed him for a day. Teach him how to fish and you feed him for a lifetime."
            </blockquote>

            <h3>3. Resource Mobilization</h3>
            <p>Teaching communities to identify and mobilize their own resources—both financial and non-financial—ensures sustainability beyond external funding cycles.</p>

            <h3>4. Systemic Integration</h3>
            <p>When possible, integrate initiatives with existing government schemes and local institutions to ensure continuity and scale.</p>

            <h2>Real-World Application</h2>
            <p>During my work with the Donate One Rupee initiative, we focused on mobilizing local resources rather than relying solely on external donations. This approach fostered ownership and ensured the initiative could continue independently.</p>

            <h3>Measuring Sustainability</h3>
            <ul>
                <li>Are local leaders emerging and taking charge?</li>
                <li>Can the program function without external facilitators?</li>
                <li>Are community members contributing their own resources?</li>
                <li>Is there a clear handover and exit strategy?</li>
            </ul>

            <h2>Moving Forward</h2>
            <p>Creating sustainable change is challenging but possible. It requires patience, humility, and a genuine commitment to empowering communities rather than creating dependencies.</p>

            <p>The question we must always ask ourselves: Will this initiative still exist and thrive five years from now without our direct involvement? If the answer is no, we need to rethink our approach.</p>
        `
    }
};

// Load post from API (with sample fallback)
async function loadPost() {
    let post = null;

    // Try to fetch from API
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

    // If not found in API, fall back to sample posts using numeric id
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

        // Hide meta and image
        document.querySelector('.post-meta').style.display = 'none';
        document.querySelector('.post-featured-image').style.display = 'none';

        // Center align
        document.querySelector('.post-header').style.textAlign = 'center';
        document.getElementById('postContent').style.textAlign = 'center';
    }
}

// Display the post
function displayPost(post) {
    document.getElementById('postTitle').textContent = post.title;
    document.getElementById('postExcerpt').textContent = post.excerpt;
    document.getElementById('postCategory').textContent = post.categoryName || 'Passive Income';

    // Handle date formatting
    let dateStr = post.date;
    if (post.createdAt) {
        dateStr = new Date(post.createdAt).toISOString().split('T')[0];
    }
    document.getElementById('postDate').textContent = formatDate(dateStr);

    document.getElementById('postContent').innerHTML = post.content;

    // Update stats
    document.getElementById('postViews').textContent = post.views || 0;
    document.getElementById('postShares').textContent = post.shares || 0;
    document.getElementById('postComments').textContent = (post.comments || []).length;

    // Set image
    const postImage = document.getElementById('postImage');
    if (post.image) {
        postImage.src = post.image;
    }

    // Update breadcrumb
    document.getElementById('currentPost').textContent = post.title;

    // Load comments
    loadComments();
}

// Simple Markdown Parser
function parseMarkdown(markdown) {
    if (!markdown) return '';

    let html = markdown
        // Headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Blockquotes
        .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
        // Bold
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/__(.*)__/gim, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/_(.*)_/gim, '<em>$1</em>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank">$1</a>')
        // Lists (unordered)
        .replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>')
        .replace(/^\s*\*\s+(.*$)/gim, '<li>$1</li>');

    // Wrap lists (simple heuristic)
    html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
    // Fix multiple ULs (merge adjacent ULs)
    html = html.replace(/<\/ul>\s*<ul>/gim, '');

    // Paragraphs (handling newlines)
    // Split by double newlines to create paragraphs, but ignore block elements
    html = html.split(/\n\n+/).map(para => {
        if (para.trim().match(/^(<h|<ul|<blockquote)/)) {
            return para;
        }
        return `<p>${para.replace(/\n/g, '<br>')}</p>`;
    }).join('');

    return html;
}

// Load related posts
async function loadRelatedPosts(category, currentPostId) {
    let allPosts = [];

    try {
        const response = await fetch(`${API_BASE_URL}/posts`, { method: 'GET' });
        if (response.ok) {
            allPosts = await response.json();
        } else {
            console.error('Failed to fetch related posts from API:', response.status);
        }
    } catch (error) {
        console.error('Error fetching related posts from API:', error);
    }

    if (!allPosts.length) {
        // Fallback to sample posts if API call fails
        allPosts = Object.values(samplePosts);
    }

    // Filter related posts
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
                    <span class="blog-date">${post.dateFormatted}</span>
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
    const excerpt = encodeURIComponent(post.excerpt);

    document.getElementById('shareTwitter').href = `https://twitter.com/intent/tweet?text=${title}&url=${url}`;
    document.getElementById('shareLinkedIn').href = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    document.getElementById('shareFacebook').href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
}

// Load comments
async function loadComments() {
    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, { method: 'GET' });
        if (response.ok) {
            const comments = await response.json();
            displayComments(comments);
        } else {
            console.error('Failed to load comments:', response.status);
        }
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

// Display comments
function displayComments(comments) {
    const container = document.getElementById('commentsContainer');
    const countElement = document.getElementById('commentsCount');

    countElement.textContent = comments.length;

    if (comments.length === 0) {
        container.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
        return;
    }

    container.innerHTML = comments.map(comment => `
        <div class="comment">
            <div class="comment-header">
                <strong>${comment.name}</strong>
                <span class="comment-date">${formatDate(comment.createdAt)}</span>
            </div>
            <div class="comment-content">${comment.content}</div>
        </div>
    `).join('');
}

// Submit comment
async function submitComment(event) {
    event.preventDefault();

    const name = document.getElementById('commentName').value;
    const email = document.getElementById('commentEmail').value;
    const content = document.getElementById('commentContent').value;

    if (!name || !email || !content) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, content })
        });

        if (response.ok) {
            // Clear form
            document.getElementById('newCommentForm').reset();

            // Show success message
            const form = document.getElementById('commentForm');
            const successMsg = document.createElement('div');
            successMsg.className = 'comment-success';
            successMsg.textContent = 'Comment submitted! It is now visible.';
            form.appendChild(successMsg);

            // Remove message after 5 seconds
            setTimeout(() => {
                if (successMsg.parentNode) {
                    successMsg.parentNode.removeChild(successMsg);
                }
            }, 5000);

            // Refresh comments list and stats
            loadComments();
            refreshPostStats();

        } else {
            alert('Failed to submit comment. Please try again.');
        }
    } catch (error) {
        console.error('Error submitting comment:', error);
        alert('Failed to submit comment. Please try again.');
    }
}

// Increment share count and open share dialog
async function incrementShare(event, platform) {
    event.preventDefault();

    try {
        // Increment share count on backend
        await fetch(`${API_BASE_URL}/posts/${postId}/share`, { method: 'POST' });

        // Update UI
        const sharesElement = document.getElementById('postShares');
        const currentShares = parseInt(sharesElement.textContent) || 0;
        sharesElement.textContent = currentShares + 1;

        // Open share dialog
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(document.getElementById('postTitle').textContent);

        let shareUrl;
        switch (platform) {
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${title}&url=${url}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                break;
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
            // Update only the stats
            document.getElementById('postViews').textContent = post.views || 0;
            document.getElementById('postShares').textContent = post.shares || 0;
            document.getElementById('postComments').textContent = (post.comments || []).length;
        }
    } catch (error) {
        console.error('Error refreshing stats:', error);
    }
}

// Initialize on page load
if (postId) {
    loadPost();

    // Setup comment form
    const commentForm = document.getElementById('newCommentForm');
    if (commentForm) {
        commentForm.addEventListener('submit', submitComment);
    }

    // Setup share buttons to increment count
    document.getElementById('shareTwitter').addEventListener('click', (e) => incrementShare(e, 'twitter'));
    document.getElementById('shareLinkedIn').addEventListener('click', (e) => incrementShare(e, 'linkedin'));
    document.getElementById('shareFacebook').addEventListener('click', (e) => incrementShare(e, 'facebook'));

    // Refresh stats every 30 seconds for real-time updates
    setInterval(refreshPostStats, 30000);
}
