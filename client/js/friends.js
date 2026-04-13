// Get current user data
function getCurrentUser() {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const anonymousName = localStorage.getItem("anonymousName");
    
    return { token, userId, anonymousName };
}

// Load friends list
async function loadFriends() {
    const { userId } = getCurrentUser();
    
    try {
        const response = await fetch(`${API_BASE}/friends/list/${userId}`);
        const friends = await response.json();
        
        const friendsList = document.getElementById("friendsList");
        
        if (friends.length === 0) {
            friendsList.innerHTML = '<div class="empty-message">No friends yet. Add some friends to get started!</div>';
            return;
        }
        
        friendsList.innerHTML = friends.map(f => {
            const isFriendInitiator = f.userId._id === userId;
            const friend = isFriendInitiator ? f.friendId : f.userId;
            const friendUserId = friend._id;
            
            return `
                <div class="user-item">
                    <div class="user-info">
                        <div class="user-name">${friend.anonymousName}</div>
                        <div class="user-email">${friend.email}</div>
                    </div>
                    <div class="user-actions">
                        <button class="btn-primary" onclick="openMessage('${friendUserId}', '${friend.anonymousName}')">Message</button>
                        <button class="btn-danger" onclick="removeFriend('${f._id}')">Remove</button>
                    </div>
                </div>
            `;
        }).join("");
    } catch (error) {
        console.error("Error loading friends:", error);
    }
}

// Load friend requests
async function loadFriendRequests() {
    const { userId } = getCurrentUser();
    
    try {
        const response = await fetch(`${API_BASE}/friends/requests/${userId}`);
        const requests = await response.json();
        
        const requestsDiv = document.getElementById("friendRequests");
        
        if (requests.length === 0) {
            requestsDiv.innerHTML = '<div class="empty-message">No pending requests</div>';
            return;
        }
        
        requestsDiv.innerHTML = requests.map(r => `
            <div class="user-item">
                <div class="user-info">
                    <div class="user-name">${r.userId.anonymousName}</div>
                    <div class="user-email">${r.userId.email}</div>
                </div>
                <div class="user-actions">
                    <button class="btn-success" onclick="acceptFriendRequest('${r._id}')">Accept</button>
                    <button class="btn-danger" onclick="rejectFriendRequest('${r._id}')">Reject</button>
                </div>
            </div>
        `).join("");
    } catch (error) {
        console.error("Error loading requests:", error);
    }
}

// Accept friend request
async function acceptFriendRequest(requestId) {
    try {
        const response = await fetch(`${API_BASE}/friends/accept/${requestId}`, {
            method: "PUT"
        });
        
        if (response.ok) {
            alert("Friend request accepted!");
            loadFriends();
            loadFriendRequests();
        }
    } catch (error) {
        console.error("Error accepting request:", error);
    }
}

// Reject friend request
async function rejectFriendRequest(requestId) {
    try {
        const response = await fetch(`${API_BASE}/friends/reject/${requestId}`, {
            method: "DELETE"
        });
        
        if (response.ok) {
            alert("Friend request rejected");
            loadFriendRequests();
        }
    } catch (error) {
        console.error("Error rejecting request:", error);
    }
}

// Remove friend
async function removeFriend(friendshipId) {
    if (confirm("Are you sure you want to remove this friend?")) {
        try {
            const response = await fetch(`${API_BASE}/friends/remove/${friendshipId}`, {
                method: "DELETE"
            });
            
            if (response.ok) {
                alert("Friend removed");
                loadFriends();
            }
        } catch (error) {
            console.error("Error removing friend:", error);
        }
    }
}

// Send friend request
async function sendFriendRequest(friendId) {
    const { userId } = getCurrentUser();
    
    try {
        const response = await fetch(`${API_BASE}/friends/request/${friendId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId })
        });
        
        if (response.ok) {
            alert("Friend request sent!");
            document.getElementById("searchInput").value = "";
            document.getElementById("searchResults").innerHTML = "";
        } else {
            const error = await response.json();
            alert(error.msg || "Failed to send friend request");
        }
    } catch (error) {
        console.error("Error sending request:", error);
    }
}

// Open message (redirect to messages page)
function openMessage(friendId, friendName) {
    localStorage.setItem("selectedFriendId", friendId);
    localStorage.setItem("selectedFriendName", friendName);
    window.location.href = "messages.html";
}

// Logout
function logout() {
    localStorage.clear();
}

// Load on page load
document.addEventListener("DOMContentLoaded", () => {
    loadFriends();
    loadFriendRequests();
    
    // Search functionality
    document.getElementById("searchInput").addEventListener("input", async (e) => {
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            document.getElementById("searchResults").innerHTML = "";
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}/auth/search?anonymousName=${query}`);
            const results = await response.json();
            const { userId } = getCurrentUser();
            
            document.getElementById("searchResults").innerHTML = results
                .filter(user => user._id !== userId)
                .map(user => `
                    <div class="user-item">
                        <div class="user-info">
                            <div class="user-name">${user.anonymousName}</div>
                            <div class="user-email">${user.email}</div>
                        </div>
                        <button class="btn-primary" onclick="sendFriendRequest('${user._id}')">Add Friend</button>
                    </div>
                `).join("");
        } catch (error) {
            console.error("Error searching users:", error);
        }
    });
});
