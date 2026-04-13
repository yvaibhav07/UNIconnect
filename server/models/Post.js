const adminMiddleware = require("../middleware/adminMiddleware");
const User = require("../models/User");
const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
    content: String,
    author: String,
    tags: { type: [String], default: [] },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    upvotes: { type: Number, default: 0 },
    comments: [
        {
            _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
            content: String,
            author: String,
            createdAt: { type: Date, default: Date.now }
        }
    ],
    createdAt: { type: Date, default: Date.now }
});



module.exports = mongoose.model("Post", PostSchema);
