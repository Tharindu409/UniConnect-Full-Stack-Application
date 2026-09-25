import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createBudget,
  getClubBudgets,
  getAllBudgets,
  approveBudget,
  rejectBudget,
  deleteBudget,
} from "../controllers/budgetController.js";

const router = express.Router();

// Create a budget request
router.post("/", protect, createBudget);

// Get all budgets for one club
router.get("/club/:clubId", protect, getClubBudgets);

// System admin - get all budget requests
router.get("/all", protect, getAllBudgets);

// System admin - approve budget request
router.put("/:budgetId/approve", protect, approveBudget);

// System admin - reject budget request
router.put("/:budgetId/reject", protect, rejectBudget);

// Delete budget request
router.delete("/:budgetId", protect, deleteBudget);

export default router;