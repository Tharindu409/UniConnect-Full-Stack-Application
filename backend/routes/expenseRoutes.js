import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { uploadReceipt } from "../middleware/uploadMiddleware.js";
import {
  createExpense,
  getClubExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getAllExpenses,
  approveExpense,
  rejectExpense,
} from "../controllers/expenseController.js";

const router = express.Router();

router.get("/all", protect, getAllExpenses);
router.get("/club/:clubId", protect, getClubExpenses);
router.get("/:expenseId", protect, getExpenseById);

router.post("/", protect, uploadReceipt.single("receipt"), createExpense);
router.put("/:expenseId", protect, uploadReceipt.single("receipt"), updateExpense);
router.delete("/:expenseId", protect, deleteExpense);

router.put("/:expenseId/approve", protect, approveExpense);
router.put("/:expenseId/reject", protect, rejectExpense);

export default router;