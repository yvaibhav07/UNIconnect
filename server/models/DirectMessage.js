const mongoose = require("mongoose");

const DirectMessageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderName: { type: String, required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverName: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("DirectMessage", DirectMessageSchema);
