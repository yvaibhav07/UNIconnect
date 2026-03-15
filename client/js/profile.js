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
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

async function loadProfile() {
    try {
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("token");

        if (!userId || !token) {
            window.location.href = "index.html";
            return;
        }

        const res = await fetch(`http://localhost:5001/api/auth/profile/${userId}`);
        const profile = await res.json();

        if (!res.ok) {
            alert("Failed to load profile");
            return;
        }

        // Update profile header
        document.getElementById("profileName").textContent = profile.anonymousName;
        document.getElementById("profileRole").textContent = `Role: ${profile.role === "admin" ? "👨‍💼 Admin" : "👨‍🎓 Student"}`;
        document.getElementById("profileJoinDate").textContent = `Joined: ${new Date(profile.createdAt).toLocaleDateString()}`;

        // Update stats
        document.getElementById("postsCount").textContent = profile.postsCount;
        document.getElementById("commentsCount").textContent = profile.commentsCount;

        // Display user posts
        const postsDiv = document.getElementById("userPosts");
        const emptyState = document.getElementById("emptyPostsState");

        postsDiv.innerHTML = "";

        if (profile.userPosts.length === 0) {
            emptyState.style.display = "block";
            return;
        }

        emptyState.style.display = "none";

        profile.userPosts.forEach(p => {
            const tagsHTML = p.tags && p.tags.length > 0 
                ? `<div class="post-tags">${p.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}</div>`
                : '';

            const commentsCount = p.comments ? p.comments.length : 0;

            const postHTML = `
                <div class="post">
                    <div class="post-header">
                        <div>
                            <div class="post-author">👤 ${p.author}</div>
                            <div class="post-time">${formatTime(p.createdAt)}</div>
                        </div>
                    </div>
                    <div class="post-content">${escapeHtml(p.content)}</div>
                    ${tagsHTML}
                    <div class="post-meta">
                        <span>👍 ${p.upvotes || 0} Upvotes</span>
                        <span>💬 ${commentsCount} Comments</span>
                    </div>
                </div>
            `;
            postsDiv.innerHTML += postHTML;
        });
    } catch (error) {
        console.error("Error loading profile:", error);
        alert("Failed to load profile");
    }
}

function goToDashboard() {
    window.location.href = "dashboard.html";
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("anonymousName");
    localStorage.removeItem("userId");
    window.location.href = "index.html";
}

// Load profile when page loads
window.addEventListener("load", loadProfile);
