// Blog Admin JavaScript

// API Configuration - will be set by config.js
const API_BASE_URL = window.API_BASE_URL || 'http://127.0.0.1:5000/api';

// Generic helper for JSON API requests
async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
        },
        ...options,
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Request failed with status ${response.status}`);
    }

    return await response.json();
}

// Load all posts (including drafts) from the API
async function fetchAllPosts() {
    try {
        return await apiRequest('/posts?all=true', { method: 'GET' });
    } catch (error) {
        console.error('Failed to load posts from API:', error);
        showNotification('Failed to load posts from server', 'error');
        return [];
    }
}

// Get next post ID
async function getNextId() {
    const posts = await fetchAllPosts();
    return posts.length > 0 ? Math.max(...posts.map(p => {
        const numericId = parseInt(p.id, 10);
        return isNaN(numericId) ? 0 : numericId;
    })) + 1 : Date.now();
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Update statistics (takes posts array)
function updateStatistics(posts) {
    const totalPostsElem = document.getElementById('totalPosts');
    if (totalPostsElem) totalPostsElem.textContent = posts.length;
}

// Update recent posts list (takes posts array)
function updateRecentPosts(posts) {
    const recentPosts = posts.slice(0, 5);
    const list = document.getElementById('recentPostsList');
    if (!list) return;

    list.innerHTML = recentPosts.map(post => `
        <li><a href="#" data-id="${post.id || post._id}" class="edit-post-link">${post.title}</a></li>
    `).join('');

    // Add click handlers
    document.querySelectorAll('.edit-post-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const id = link.dataset.id;
            loadPostToEditor(id);
        });
    });
}

// Load post into editor
async function loadPostToEditor(id) {
    const posts = await fetchAllPosts();
    const post = posts.find(p => (p.id === id || p._id === id));

    if (post) {
        document.getElementById('postId').value = post.id || post._id;
        document.getElementById('postTitleInput').value = post.title;
        document.getElementById('postExcerptInput').value = post.excerpt;
        document.getElementById('postDateInput').value = post.date || new Date().toISOString().split('T')[0];
        document.getElementById('postImageInput').value = post.image || '';
        document.getElementById('postContentInput').value = post.content || '';
        document.getElementById('postPublishedInput').checked = post.published;

        document.getElementById('editorTitle').textContent = 'Edit Post';
        updatePreview();

        // Scroll to editor
        document.querySelector('.editor-container').scrollIntoView({ behavior: 'smooth' });
    }
}

// Clear editor form
function clearEditor() {
    const form = document.getElementById('blogPostForm');
    if (form) form.reset();
    document.getElementById('postId').value = '';
    document.getElementById('editorTitle').textContent = 'Create New Post';

    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('postDateInput').value = today;

    updatePreview();
}

// Update preview
function updatePreview() {
    const titleElem = document.getElementById('previewTitle');
    const excerptElem = document.getElementById('previewExcerpt');
    const dateElem = document.getElementById('previewDate');
    const imageElem = document.getElementById('previewImage');

    if (!titleElem) return;

    const title = document.getElementById('postTitleInput').value || 'Your Title Here';
    const excerpt = document.getElementById('postExcerptInput').value || 'Your excerpt will appear here...';
    const date = document.getElementById('postDateInput').value;
    const dateFormatted = date ? formatDate(date) : 'Date';
    const image = document.getElementById('postImageInput').value || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22400%22 height=%22300%22/%3E%3Ctext fill=%22%23999%22 font-family=%22sans-serif%22 font-size=%2224%22 dy=%2210.5%22 font-weight=%22bold%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22%3EBlog Image%3C/text%3E%3C/svg%3E';

    titleElem.textContent = title;
    excerptElem.textContent = excerpt;
    if (dateElem) dateElem.textContent = dateFormatted;
    if (imageElem) imageElem.src = image;
}

// Save (publish or draft) via API
async function savePost(publish = true) {
    const form = document.getElementById('blogPostForm');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    let currentPostId = document.getElementById('postId').value;
    const isUpdate = !!currentPostId;

    const postData = {
        title: document.getElementById('postTitleInput').value,
        excerpt: document.getElementById('postExcerptInput').value,
        category: 'blog', // Default category since selector was removed
        categoryName: 'Blog',
        date: document.getElementById('postDateInput').value,
        dateFormatted: formatDate(document.getElementById('postDateInput').value),
        image: document.getElementById('postImageInput').value || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22400%22 height=%22300%22/%3E%3Ctext fill=%22%23999%22 font-family=%22sans-serif%22 font-size=%2224%22 dy=%2210.5%22 font-weight=%22bold%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22%3EBlog Image%3C/text%3E%3C/svg%3E',
        content: document.getElementById('postContentInput').value,
        published: publish || document.getElementById('postPublishedInput').checked
    };

    try {
        let savedPost;

        if (isUpdate) {
            // Update existing post
            savedPost = await apiRequest(`/posts/${currentPostId}`, {
                method: 'PUT',
                body: JSON.stringify(postData),
            });
        } else {
            // Create new post
            savedPost = await apiRequest('/posts', {
                method: 'POST',
                body: JSON.stringify(postData),
            });
            // Store generated ID in the hidden field for future edits
            document.getElementById('postId').value = savedPost.id || savedPost._id;
        }

        await refreshAdminUI();
        showNotification(publish ? 'Post published!' : 'Draft saved!', 'success');
        if (publish) clearEditor();

    } catch (error) {
        console.error('Failed to save post:', error);
        showNotification('Failed to save post', 'error');
    }
}

// Delete post via API
async function deletePost(id) {
    if (!confirm('Are you sure you want to delete this post?')) {
        return;
    }

    try {
        await apiRequest(`/posts/${id}`, { method: 'DELETE' });
        await refreshAdminUI();
        showNotification('Post deleted successfully!', 'success');
    } catch (error) {
        console.error('Delete failed:', error);
        showNotification('Failed to delete post', 'error');
    }
}

// Load posts table (takes posts array)
function loadPostsTable(posts) {
    const tbody = document.getElementById('postsTableBody');
    if (!tbody) return;

    if (posts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No posts yet.</td></tr>';
        return;
    }

    tbody.innerHTML = posts.map(post => `
        <tr>
            <td>${post.title}</td>
            <td>${post.dateFormatted || post.date}</td>
            <td><span class="status-badge ${post.published ? 'published' : 'draft'}">${post.published ? 'Published' : 'Draft'}</span></td>
            <td>
                <div class="table-actions">
                    <button class="table-btn edit-btn" data-id="${post.id || post._id}">Edit</button>
                    <button class="table-btn danger delete-btn" data-id="${post.id || post._id}">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');

    // Add event listeners
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            loadPostToEditor(btn.dataset.id);
            closeModal();
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            deletePost(btn.dataset.id);
        });
    });
}

// Notification system
function showNotification(message, type = 'info') {
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#4CAF50' : '#2196F3'};
            color: white;
            border-radius: 4px;
            z-index: 10000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        document.body.appendChild(notification);
    }

    notification.textContent = message;
    notification.style.background = type === 'success' ? '#4CAF50' : '#2196F3';
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
    }, 3000);
}

// Modal functions
function openModal() {
    refreshAdminUI();
    const modal = document.getElementById('postsModal');
    if (modal) modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('postsModal');
    if (modal) modal.style.display = 'none';
}

// Toolbar actions
function insertMarkdown(action) {
    const textarea = document.getElementById('postContentInput');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let replacement = selectedText;

    switch (action) {
        case 'bold': replacement = `**${selectedText}**`; break;
        case 'italic': replacement = `*${selectedText}*`; break;
        case 'heading': replacement = `\n## ${selectedText}\n`; break;
        case 'quote': replacement = `\n> ${selectedText}\n`; break;
        case 'list': replacement = `\n- ${selectedText}\n`; break;
        case 'link': replacement = `[${selectedText}](url)`; break;
    }

    textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    textarea.focus();
    textarea.setSelectionRange(start, start + replacement.length);
}

// Initialize listeners
async function init() {
    // Buttons
    const newPostBtn = document.getElementById('newPostBtn');
    if (newPostBtn) newPostBtn.addEventListener('click', clearEditor);

    const viewPostsBtn = document.getElementById('viewPostsBtn');
    if (viewPostsBtn) viewPostsBtn.addEventListener('click', openModal);

    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

    const publishBtn = document.getElementById('publishBtn');
    if (publishBtn) publishBtn.addEventListener('click', () => savePost(true));

    const saveDraftBtn = document.getElementById('saveDraftBtn');
    if (saveDraftBtn) saveDraftBtn.addEventListener('click', () => savePost(false));

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Logout?')) {
                sessionStorage.clear();
                localStorage.removeItem('blogAdminAuth');
                window.location.href = 'index.html';
            }
        });
    }

    // Live preview
    ['postTitleInput', 'postExcerptInput', 'postDateInput', 'postImageInput', 'postContentInput'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updatePreview);
    });

    // Toolbar
    document.querySelectorAll('.toolbar-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            insertMarkdown(btn.dataset.action);
        });
    });

    // Initial load
    await refreshAdminUI();
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('postDateInput');
    if (dateInput) dateInput.value = today;
    updatePreview();
}

// Fetch data once and update all admin UI pieces
async function refreshAdminUI() {
    const posts = await fetchAllPosts();
    updateStatistics(posts);
    updateRecentPosts(posts);
    if (document.getElementById('postsModal')?.style.display === 'flex') {
        loadPostsTable(posts);
    }
}

// Run init
init();
