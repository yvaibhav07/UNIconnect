
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/post");
const friendRoutes = require("./routes/friend");
const messageRoutes = require("./routes/message");

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from client folder
app.use(express.static(path.join(__dirname, '../client')));

// Use environment variable for MongoDB URI
const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/anonymous-campus";

mongoose.connect(mongoURI)
.then(()=> console.log("MongoDB Connected"))
.catch(err => console.log(err));

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/messages", messageRoutes);

// Serve index.html for any unmatched routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));
