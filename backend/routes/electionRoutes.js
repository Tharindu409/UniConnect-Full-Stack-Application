import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getElectionsByClub,
  getElectionById,
  createElection,
  updateElection,
  deleteElection,
  getAllElections,
  voteElection,
  getElectionResults,
} from "../controllers/electionController.js";

const router = express.Router();

router.get("/all", protect, getAllElections);
router.get("/club/:clubId", protect, getElectionsByClub);
router.post("/:electionId/vote", protect, voteElection);
router.get("/:electionId/results", protect, getElectionResults);
router.get("/:electionId", protect, getElectionById);
router.post("/", protect, createElection);
router.put("/:electionId", protect, updateElection);
router.delete("/:electionId", protect, deleteElection);

export default router;