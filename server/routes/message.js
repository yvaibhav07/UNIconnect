const express = require("express");
const DirectMessage = require("../models/DirectMessage");
const User = require("../models/User");
const router = express.Router();

// Send direct message
router.post("/send", async (req, res) => {
    try {
        const { senderId, senderName, receiverId, receiverName, message } = req.body;

        if (!message || !senderId || !receiverId) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const directMessage = new DirectMessage({
            senderId,
            senderName,
            receiverId,
            receiverName,
            message
        });

        await directMessage.save();
        res.json({ msg: "Message sent", directMessage });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get conversation between two users
router.get("/conversation/:userId/:friendId", async (req, res) => {
    try {
        const { userId, friendId } = req.params;

        const messages = await DirectMessage.find({
            $or: [
                { senderId: userId, receiverId: friendId },
                { senderId: friendId, receiverId: userId }
            ]
        }).sort({ createdAt: 1 });

        // Mark messages as read
        await DirectMessage.updateMany(
            { senderId: friendId, receiverId: userId, read: false },
            { read: true }
        );

        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all conversations for a user (latest message from each friend)
router.get("/inbox/:userId", async (req, res) => {
    try {
        const messages = await DirectMessage.find({
            $or: [
                { senderId: req.params.userId },
                { receiverId: req.params.userId }
            ]
        }).sort({ createdAt: -1 });

        // Group by conversation partner
        const conversations = {};
        messages.forEach(msg => {
            const partnerId = msg.senderId.toString() === req.params.userId ? 
                msg.receiverId.toString() : msg.senderId.toString();
            
            if (!conversations[partnerId]) {
                conversations[partnerId] = msg;
            }
        });

        res.json(Object.values(conversations));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get unread message count
router.get("/unread/:userId", async (req, res) => {
    try {
        const count = await DirectMessage.countDocuments({
            receiverId: req.params.userId,
            read: false
        });

        res.json({ unreadCount: count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a message
router.delete("/:messageId", async (req, res) => {
    try {
        await DirectMessage.findByIdAndDelete(req.params.messageId);
        res.json({ msg: "Message deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
