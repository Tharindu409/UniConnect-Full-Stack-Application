import express from "express";
import {
	register,
	login,
	getMe,
	deleteMe,
	changePassword,
	forgotPassword,
	resetPassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Register new user
router.post("/register", register);

// Login
router.post("/login", login);

// Get current user
router.get("/me", protect, getMe);

// Delete current user account
router.delete("/me", protect, deleteMe);

// Change password for logged in users
router.put("/change-password", protect, changePassword);

// Send reset link to email
router.post("/forgot-password", forgotPassword);

// Reset password using token
router.post("/reset-password/:token", resetPassword);

export default router;
