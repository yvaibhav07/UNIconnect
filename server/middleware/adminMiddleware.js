const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function (req, res, next) {
<<<<<<< HEAD
    const authHeader = req.headers.authorization;

    if (!authHeader) return res.status(401).json({ msg: "No token" });

    // Extract token from "Bearer <token>" format
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
=======
    const token = req.headers.authorization;

    if (!token) return res.status(401).json({ msg: "No token" });
>>>>>>> 2991f2d95e751c5f5365365daf6baddc2e756510

    try {
        const decoded = jwt.verify(token, "secretkey");
        const user = await User.findById(decoded.id);

<<<<<<< HEAD
        if (!user) return res.status(404).json({ msg: "User not found" });
        
        if (user.role !== "admin")
            return res.status(403).json({ msg: "Access denied: Admin only" });
=======
        if (user.role !== "admin")
            return res.status(403).json({ msg: "Admin only" });
>>>>>>> 2991f2d95e751c5f5365365daf6baddc2e756510

        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ msg: "Invalid token" });
    }
};