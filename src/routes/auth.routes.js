import express from "express";

import {
  register,
  login,
  profile,
} from "../controllers/auth.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Testing
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Auth Route Working Successfully 🚀",
  });
});

// Authentication
router.post("/register", register);

router.post("/login", login);

// Protected
router.get("/profile", protect, profile);

export default router;