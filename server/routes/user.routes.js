import express from "express";
import User from "../models/User.js";
import verifyToken  from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/search", verifyToken, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const users = await User.find({
      $or: [
        { email: { $regex: q, $options: "i" } },
        { username: { $regex: q, $options: "i" } }
      ]
    }).select("username email _id");

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
