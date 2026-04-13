// BUG FIX: Check authentication on page load
window.addEventListener("load", function() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "index.html";
    return;
  }
  loadPosts();
  setInterval(loadPosts, 5000);
});

let selectedTags = [];

function toggleTag(tag) {
  const btn = document.querySelector(`.tag-btn[onclick="toggleTag('${tag}')"]`);
  if (selectedTags.includes(tag)) {
    selectedTags = selectedTags.filter(t => t !== tag);
    if (btn) btn.classList.remove("active");
  } else {
    if (selectedTags.length >= 5) {
      alert("Maximum 5 tags allowed!");
      return;
    }
    selectedTags.push(tag);
    if (btn) btn.classList.add("active");
  }
  updateTagDisplay();
}

function updateTagDisplay() {
  const tagDiv = document.getElementById("selectedTags");
  tagDiv.innerHTML = selectedTags.map(tag =>
    `<span class="tag-selected">${tag} <button class="tag-remove" onclick="toggleTag('${tag}')">×</button></span>`
  ).join('');
}

async function createPost() {
  const content = document.getElementById("postContent").value.trim();
  if (!content) { alert("Please write something before posting!"); return; }

  const author = localStorage.getItem("anonymousName") || "Anonymous";
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API_BASE}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token   // BUG FIX: send auth token
      },
      body: JSON.stringify({ content, author, tags: selectedTags })
    });

    if (!res.ok) {
      const data = await res.json();
      alert("❌ " + (data.error || "Failed to create post"));
      return;
    }

    document.getElementById("postContent").value = "";
    selectedTags = [];
    updateTagDisplay();
    // Reset tag button states
    document.querySelectorAll(".tag-btn").forEach(b => b.classList.remove("active"));
    loadPosts();
  } catch (error) {
    console.error("Error creating post:", error);
    alert("❌ Connection error. Please try again.");
  }
}

function formatTime(date) {
  const now = new Date();
  const postDate = new Date(date);
  const diff = now - postDate;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return postDate.toLocaleDateString();
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

async function loadPosts() {
  try {
    const res = await fetch(`${API_BASE}/posts`);
    const posts = await res.json();
    const div = document.getElementById("posts");
    const emptyState = document.getElementById("emptyState");
    div.innerHTML = "";

    if (!posts.length) { emptyState.style.display = "block"; return; }
    emptyState.style.display = "none";

    posts.forEach(p => {
      const tagsHTML = p.tags && p.tags.length
        ? `<div class="post-tags">${p.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}</div>` : '';

      const commentsHTML = p.comments && p.comments.length
        ? `<div class="comments-section">
            <div class="comments-header">💬 ${p.comments.length} Comment${p.comments.length !== 1 ? 's' : ''}</div>
            <div class="comments-list">
              ${p.comments.map(c => `
                <div class="comment">
                  <div class="comment-header">
                    <span class="comment-author">👤 ${escapeHtml(c.author)}</span>
                    <span class="comment-time">${formatTime(c.createdAt)}</span>
                  </div>
                  <div class="comment-content">${escapeHtml(c.content)}</div>
                  <button class="delete-comment-btn" onclick="deleteComment('${p._id}', '${c._id}')">🗑️ Delete</button>
                </div>`).join('')}
            </div>
          </div>` : '';

      div.innerHTML += `
        <div class="post">
          <div class="post-header">
            <div>
              <div class="post-author">👤 ${escapeHtml(p.author)}</div>
              <div class="post-time">${formatTime(p.createdAt)}</div>
            </div>
          </div>
          <div class="post-content">${escapeHtml(p.content)}</div>
          ${tagsHTML}
          <div class="post-actions">
            <button onclick="upvote('${p._id}')">👍 Upvote (${p.upvotes || 0})</button>
            <button onclick="toggleCommentForm('${p._id}')">💬 Reply</button>
            <button class="delete-btn" onclick="deletePost('${p._id}')">🗑️ Delete</button>
          </div>
          ${commentsHTML}
          <div class="comment-form" id="comment-form-${p._id}" style="display:none;">
            <textarea class="comment-input" id="comment-input-${p._id}" placeholder="Write a reply..."></textarea>
            <div class="comment-form-actions">
              <button class="btn-cancel" onclick="toggleCommentForm('${p._id}')">Cancel</button>
              <button class="btn-submit" onclick="submitComment('${p._id}')">Submit Reply</button>
            </div>
          </div>
        </div>`;
    });
  } catch (error) {
    console.error("Error loading posts:", error);
  }
}

function toggleCommentForm(postId) {
  const form = document.getElementById(`comment-form-${postId}`);
  if (form.style.display === "none") {
    form.style.display = "block";
    document.getElementById(`comment-input-${postId}`).focus();
  } else {
    form.style.display = "none";
  }
}

async function submitComment(postId) {
  const input = document.getElementById(`comment-input-${postId}`);
  const content = input.value.trim();
  if (!content) { alert("Please write a comment!"); return; }
  const author = localStorage.getItem("anonymousName") || "Anonymous";
  try {
    const res = await fetch(`${API_BASE}/posts/${postId}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, author })
    });
    if (!res.ok) { alert("Failed to post comment"); return; }
    input.value = "";
    loadPosts();
  } catch (error) {
    console.error("Error posting comment:", error);
    alert("❌ Connection error.");
  }
}

async function deleteComment(postId, commentId) {
  if (!confirm("Delete this comment?")) return;
  try {
    await fetch(`${API_BASE}/posts/${postId}/comment/${commentId}`, { method: "DELETE" });
    loadPosts();
  } catch (error) {
    console.error("Error deleting comment:", error);
  }
}

async function upvote(id) {
  try {
    await fetch(`${API_BASE}/posts/upvote/` + id, { method: "PUT" });
    loadPosts();
  } catch (error) {
    console.error("Error upvoting:", error);
  }
}

async function deletePost(id) {
  if (!confirm("Are you sure you want to delete this post?")) return;
  try {
    await fetch(`${API_BASE}/posts/` + id, { method: "DELETE" });
    loadPosts();
  } catch (error) {
    console.error("Error deleting post:", error);
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("anonymousName");
  localStorage.removeItem("userId");
  window.location.href = "index.html";
}

function goToProfile() { window.location.href = "profile.html"; }
