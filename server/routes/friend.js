const express = require("express");
const Friend = require("../models/Friend");
const User = require("../models/User");
const router = express.Router();

// Send friend request
router.post("/request/:receiverId", async (req, res) => {
    try {
        const { userId } = req.body;
        
        // Check if already friends or request pending
        const existing = await Friend.findOne({
            $or: [
                { userId, friendId: req.params.receiverId },
                { userId: req.params.receiverId, friendId: userId }
            ]
        });

        if (existing) {
            return res.status(400).json({ msg: "Friend request already exists or already friends" });
        }

        const friendRequest = new Friend({
            userId,
            friendId: req.params.receiverId,
            status: "pending"
        });

        await friendRequest.save();
        res.json({ msg: "Friend request sent", friendRequest });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Accept friend request
router.put("/accept/:requestId", async (req, res) => {
    try {
        const friendRequest = await Friend.findByIdAndUpdate(
            req.params.requestId,
            { status: "accepted" },
            { new: true }
        );

        if (!friendRequest) {
            return res.status(404).json({ msg: "Friend request not found" });
        }

        res.json({ msg: "Friend request accepted", friendRequest });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reject friend request
router.delete("/reject/:requestId", async (req, res) => {
    try {
        await Friend.findByIdAndDelete(req.params.requestId);
        res.json({ msg: "Friend request rejected" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get friend list
router.get("/list/:userId", async (req, res) => {
    try {
        const friends = await Friend.find({
            $or: [
                { userId: req.params.userId, status: "accepted" },
                { friendId: req.params.userId, status: "accepted" }
            ]
        }).populate("userId friendId", "anonymousName email");

        res.json(friends);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get pending friend requests
router.get("/requests/:userId", async (req, res) => {
    try {
        const requests = await Friend.find({
            friendId: req.params.userId,
            status: "pending"
        }).populate("userId", "anonymousName email");

        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Remove friend
router.delete("/remove/:friendshipId", async (req, res) => {
    try {
        await Friend.findByIdAndDelete(req.params.friendshipId);
        res.json({ msg: "Friend removed" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
