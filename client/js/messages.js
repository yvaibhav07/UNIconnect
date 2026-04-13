let selectedFriendId = null;
let currentUserId = null;

// Get current user data
function getCurrentUser() {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const anonymousName = localStorage.getItem("anonymousName");
    
    return { token, userId, anonymousName };
}

// Load conversations
async function loadConversations() {
    const { userId } = getCurrentUser();
    currentUserId = userId;
    
    try {
        const response = await fetch(`${API_BASE}/messages/inbox/${userId}`);
        const conversations = await response.json();
        
        const list = document.getElementById("conversationsList");
        
        if (conversations.length === 0) {
            list.innerHTML = '<div class="empty-message" style="padding: 20px; text-align: center; color: #999;">No conversations yet</div>';
            
            // Check if we should create a new conversation with a friend
            const selectedId = localStorage.getItem("selectedFriendId");
            if (selectedId) {
                const selectedName = localStorage.getItem("selectedFriendName");
                selectConversation(selectedId, selectedName);
                localStorage.removeItem("selectedFriendId");
                localStorage.removeItem("selectedFriendName");
            }
            return;
        }
        
        list.innerHTML = conversations.map(msg => {
            const isReceived = msg.senderId.toString() === userId;
            const friendId = isReceived ? msg.senderId : msg.receiverId;
            const otherUser = isReceived ? msg.senderName : msg.receiverName;
            const preview = msg.message.substring(0, 30) + (msg.message.length > 30 ? "..." : "");
            
            return `
                <div class="conversation-item" data-friend-id="${friendId}" onclick="selectConversation('${friendId}', '${otherUser}')">
                    <div class="conversation-name">${otherUser}</div>
                    <div class="conversation-preview">${preview}</div>
                </div>
            `;
        }).join("");
        
        // Select first conversation if one was stored previously
        const selectedId = localStorage.getItem("selectedFriendId");
        if (selectedId) {
            const selectedName = localStorage.getItem("selectedFriendName");
            selectConversation(selectedId, selectedName);
            localStorage.removeItem("selectedFriendId");
            localStorage.removeItem("selectedFriendName");
        }
    } catch (error) {
        console.error("Error loading conversations:", error);
    }
}

// Select a conversation
async function selectConversation(friendId, friendName) {
    selectedFriendId = friendId;
    
    // Update UI - find and mark the conversation as active
    const conversationItems = document.querySelectorAll(".conversation-item");
    conversationItems.forEach(item => {
        item.classList.remove("active");
    });
    
    // Only mark as active if we found the item in the list
    const activeItem = document.querySelector(`[data-friend-id="${friendId}"]`);
    if (activeItem) {
        activeItem.classList.add("active");
    }
    
    // Show chat area
    document.getElementById("chatContent").style.display = "none";
    document.getElementById("chatArea").style.display = "flex";
    document.getElementById("chatHeader").textContent = `Chat with ${friendName}`;
    
    // Load messages
    await loadMessages();
    
    // Auto-refresh messages every 2 seconds
    setInterval(() => {
        if (selectedFriendId === friendId) {
            loadMessages();
        }
    }, 2000);
}

// Load messages for selected conversation
async function loadMessages() {
    const { userId } = getCurrentUser();
    
    try {
        const response = await fetch(`${API_BASE}/messages/conversation/${userId}/${selectedFriendId}`);
        const messages = await response.json();
        
        const messagesArea = document.getElementById("messagesArea");
        messagesArea.innerHTML = messages.map(msg => {
            const isSent = msg.senderId.toString() === userId;
            const time = new Date(msg.createdAt).toLocaleTimeString();
            
            return `
                <div class="message ${isSent ? "sent" : "received"}">
                    <div>
                        <div class="message-content">${escapeHtml(msg.message)}</div>
                        <div class="message-time">${time}</div>
                    </div>
                </div>
            `;
        }).join("");
        
        // Scroll to bottom
        messagesArea.scrollTop = messagesArea.scrollHeight;
    } catch (error) {
        console.error("Error loading messages:", error);
    }
}

// Send message
async function sendMessage() {
    const { userId, anonymousName } = getCurrentUser();
    const messageInput = document.getElementById("messageInput");
    const message = messageInput.value.trim();
    
    if (!message || !selectedFriendId) {
        alert("Please select a friend and type a message");
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/messages/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                senderId: userId,
                senderName: anonymousName,
                receiverId: selectedFriendId,
                receiverName: "Friend", // Will be updated from backend
                message
            })
        });
        
        if (response.ok) {
            messageInput.value = "";
            await loadMessages();
            await loadConversations();
        } else {
            alert("Failed to send message");
        }
    } catch (error) {
        console.error("Error sending message:", error);
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Logout
function logout() {
    localStorage.clear();
}

// Load on page load
document.addEventListener("DOMContentLoaded", () => {
    loadConversations();
    
    // Send message on Enter key
    document.getElementById("messageInput").addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    });
});
