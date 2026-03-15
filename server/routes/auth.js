
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

router.post("/register", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        if (!email.endsWith(".edu")) {
            return res.status(400).json({ message: "Use university email" });
        }

        const hashed = await bcrypt.hash(password, 10);
        const anonymousName = "User" + Math.floor(Math.random()*10000);

        const user = new User({ email, password: hashed, anonymousName, role: email === "admin@university.edu" ? "admin" : "student"});
        await user.save();

        res.json({ message: "Registered successfully" });
    } catch (error) {
        console.error("Registration error:", error);
        if (error.code === 11000) {
            return res.status(400).json({ message: "Email already exists" });
        }
        res.status(500).json({ message: error.message || "Registration failed" });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ message: "User not found" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: user._id }, "secretkey");

        res.json({ token, anonymousName: user.anonymousName, userId: user._id });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: error.message || "Login failed" });
    }
});

// GET USER PROFILE
router.get("/profile/:userId", async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const Post = require("../models/Post");
        const userPosts = await Post.find({ author: user.anonymousName });
        
        let totalComments = 0;
        userPosts.forEach(post => {
            totalComments += post.comments ? post.comments.length : 0;
        });

        res.json({
            anonymousName: user.anonymousName,
            role: user.role,
            createdAt: user.createdAt,
            postsCount: userPosts.length,
            commentsCount: totalComments,
            userPosts: userPosts
        });
    } catch (error) {
        console.error("Profile error:", error);
        res.status(500).json({ message: error.message || "Failed to fetch profile" });
    }
});

module.exports = router;
