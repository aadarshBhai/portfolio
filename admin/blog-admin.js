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

// Category name mapping
const categoryNames = {
    'news-politics': 'News and Politics',
    'passive-earning': 'Passive Earning',
    'business-startup': 'Business and Startup'
};

// Get next post ID
function getNextId() {
    const posts = loadPosts();
    return posts.length > 0 ? Math.max(...posts.map(p => p.id)) + 1 : 1;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Update statistics (takes posts array)
function updateStatistics(posts) {
    document.getElementById('totalPosts').textContent = posts.length;

    const categories = new Set(posts.map(p => p.category));
    document.getElementById('totalCategories').textContent = categories.size;
}

// Update recent posts list (takes posts array)
function updateRecentPosts(posts) {
    const recentPosts = posts.slice(0, 5);
    const list = document.getElementById('recentPostsList');

    list.innerHTML = recentPosts.map(post => `
        <li><a href="#" data-id="${post.id}" class="edit-post-link">${post.title}</a></li>
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
    const post = posts.find(p => p.id === id);

    if (post) {
        document.getElementById('postId').value = post.id;
        document.getElementById('postTitleInput').value = post.title;
        document.getElementById('postExcerptInput').value = post.excerpt;
        document.getElementById('postCategoryInput').value = post.category;
        document.getElementById('postDateInput').value = post.date;
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
    document.getElementById('blogPostForm').reset();
    document.getElementById('postId').value = '';
    document.getElementById('editorTitle').textContent = 'Create New Post';

    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('postDateInput').value = today;

    updatePreview();
}

// Update preview
function updatePreview() {
    const title = document.getElementById('postTitleInput').value || 'Your Title Here';
    const excerpt = document.getElementById('postExcerptInput').value || 'Your excerpt will appear here...';
    const category = document.getElementById('postCategoryInput').value;
    const categoryName = categoryNames[category] || 'Category';
    const date = document.getElementById('postDateInput').value;
    const dateFormatted = date ? formatDate(date) : 'Date';
    const image = document.getElementById('postImageInput').value || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22400%22 height=%22300%22/%3E%3Ctext fill=%22%23999%22 font-family=%22sans-serif%22 font-size=%2224%22 dy=%2210.5%22 font-weight=%22bold%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22%3EBlog Image%3C/text%3E%3C/svg%3E';

    document.getElementById('previewTitle').textContent = title;
    document.getElementById('previewExcerpt').textContent = excerpt;
    document.getElementById('previewCategory').textContent = categoryName;
    document.getElementById('previewDate').textContent = dateFormatted;
    document.getElementById('previewImage').src = image;
}

// Save (publish or draft) via API
async function savePost(publish = true) {
    const form = document.getElementById('blogPostForm');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const postId = document.getElementById('postId').value;
    const category = document.getElementById('postCategoryInput').value;

    const postData = {
        title: document.getElementById('postTitleInput').value,
        excerpt: document.getElementById('postExcerptInput').value,
        category: category,
        categoryName: categoryNames[category],
        date: document.getElementById('postDateInput').value,
        dateFormatted: formatDate(document.getElementById('postDateInput').value),
        image: document.getElementById('postImageInput').value || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22400%22 height=%22300%22/%3E%3Ctext fill=%22%23999%22 font-family=%22sans-serif%22 font-size=%2224%22 dy=%2210.5%22 font-weight=%22bold%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22%3EBlog Image%3C/text%3E%3C/svg%3E',
        content: document.getElementById('postContentInput').value,
        published: publish && document.getElementById('postPublishedInput').checked
    };

    try {
        let savedPost;

        if (postId) {
            // Update existing post
            savedPost = await apiRequest(`/posts/${postId}`, {
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
            document.getElementById('postId').value = savedPost.id;
        }

        // Refresh admin UI with latest data
        await refreshAdminUI();

        if (publish) {
            // For published posts, stay on the admin page
            showNotification('Post published successfully!', 'success');
            clearEditor();
        } else {
            // For drafts, stay on the admin page
            showNotification('Draft saved successfully!', 'success');
            clearEditor();
        }
    } catch (error) {
        console.error('Failed to save post via API:', error);
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
        console.error('Failed to delete post via API:', error);
        showNotification('Failed to delete post', 'error');
    }
}

// Load posts table (takes posts array)
function loadPostsTable(posts) {
    const tbody = document.getElementById('postsTableBody');

    if (posts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No posts yet. Create your first post!</td></tr>';
        return;
    }

    tbody.innerHTML = posts.map(post => `
        <tr>
            <td>${post.title}</td>
            <td>${post.categoryName}</td>
            <td>${post.dateFormatted}</td>
            <td><span class="status-badge ${post.published ? 'published' : 'draft'}">${post.published ? 'Published' : 'Draft'}</span></td>
            <td>
                <div class="table-actions">
                    <button class="table-btn edit-btn" data-id="${post.id}">Edit</button>
                    <button class="table-btn danger delete-btn" data-id="${post.id}">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');

    // Add event listeners
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            loadPostToEditor(id);
            closeModal();
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            deletePost(id);
        });
    });
}

// Notification system
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
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
    
    // Show notification
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
    }, 3000);
}

// Modal functions
function openModal() {
    refreshAdminUI();
    document.getElementById('postsModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('postsModal').style.display = 'none';
}

// Toolbar actions (simple markdown helpers)
function insertMarkdown(action) {
    const textarea = document.getElementById('postContentInput');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let replacement = selectedText;

    switch (action) {
        case 'bold':
            replacement = `**${selectedText}**`;
            break;
        case 'italic':
            replacement = `*${selectedText}*`;
            break;
        case 'heading':
            replacement = `\n## ${selectedText}\n`;
            break;
        case 'quote':
            replacement = `\n> ${selectedText}\n`;
            break;
        case 'list':
            replacement = `\n- ${selectedText}\n`;
            break;
        case 'link':
            replacement = `[${selectedText}](url)`;
            break;
    }

    textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    textarea.focus();
    textarea.setSelectionRange(start, start + replacement.length);
}

// Event Listeners
document.getElementById('newPostBtn').addEventListener('click', clearEditor);
document.getElementById('viewPostsBtn').addEventListener('click', openModal);
document.getElementById('closeModalBtn').addEventListener('click', closeModal);
document.getElementById('publishBtn').addEventListener('click', () => savePost(true));
document.getElementById('saveDraftBtn').addEventListener('click', () => savePost(false));

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('blogAdminAuth');
        sessionStorage.removeItem('blogAdminEmail');
        window.location.href = 'admin-login.html';
    }
});

// Preview update on input
['postTitleInput', 'postExcerptInput', 'postCategoryInput', 'postDateInput', 'postImageInput', 'postContentInput'].forEach(id => {
    document.getElementById(id).addEventListener('input', updatePreview);
});

// Also update on change for checkboxes and selects
document.getElementById('postPublishedInput').addEventListener('change', updatePreview);

// Toolbar buttons
document.querySelectorAll('.toolbar-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        insertMarkdown(btn.dataset.action);
    });
});

// Close modal on outside click
document.getElementById('postsModal').addEventListener('click', (e) => {
    if (e.target.id === 'postsModal') {
        closeModal();
    }
});

// Fetch data once and update all admin UI pieces
async function refreshAdminUI() {
    const posts = await fetchAllPosts();
    updateStatistics(posts);
    updateRecentPosts(posts);
    if (document.getElementById('postsModal').style.display === 'flex') {
        loadPostsTable(posts);
    }
}

// Initialize
refreshAdminUI();

// Set default date to today
const today = new Date().toISOString().split('T')[0];
document.getElementById('postDateInput').value = today;

// Initial preview
updatePreview();

// No more localStorage sync needed; data now lives in MongoDB via the API
