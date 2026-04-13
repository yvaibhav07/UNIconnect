const express = require("express");
const Post = require("../models/Post");
const router = express.Router();
const adminMiddleware = require("../middleware/adminMiddleware");
const User = require("../models/User");

router.post("/", async (req, res) => {
  try {
    const { content, author, tags } = req.body;
    const parsedTags = Array.isArray(tags)
      ? tags.filter(tag => tag.trim() !== "").slice(0, 5) : [];
    const post = new Post({ content, author, tags: parsedTags });
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/", async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  res.json(posts);
});

// BUG FIX: null check before incrementing upvotes
router.put("/upvote/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    post.upvotes += 1;
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:id/comment", async (req, res) => {
  try {
    const { content, author } = req.body;
    if (!content || !author) return res.status(400).json({ error: "Comment and author are required" });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    post.comments.push({ content, author, createdAt: new Date() });
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:postId/comment/:commentId", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found" });
    post.comments = post.comments.filter(c => c._id.toString() !== req.params.commentId);
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Post deleted", post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/delete-user/:id", adminMiddleware, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ msg: "User not found" });
  await require("../models/Post").deleteMany({ author: user.anonymousName });
  await User.findByIdAndDelete(req.params.id);
  res.json({ msg: "User and posts deleted" });
});

router.delete("/delete-post/:id", adminMiddleware, async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  res.json({ msg: "Post deleted" });
});

module.exports = router;
