const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function (req, res, next) {
    const token = req.headers.authorization;

    if (!token) return res.status(401).json({ msg: "No token" });

    try {
        const decoded = jwt.verify(token, "secretkey");
        const user = await User.findById(decoded.id);

        if (user.role !== "admin")
            return res.status(403).json({ msg: "Admin only" });

        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ msg: "Invalid token" });
    }
};