import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { uploadEventImage } from "../middleware/uploadMiddleware.js";
import {
  createClubMeeting,
  getClubMeetings,
  getPendingClubMeetings,
  getClubMeetingById,
  updateClubMeeting,
  approveClubMeeting,
  rejectClubMeeting,
  deleteClubMeeting,
} from "../controllers/clubmeetingController.js";

const router = express.Router();

// Get all approved/visible meetings for a club
router.get("/club/:clubId", protect, getClubMeetings);

// Get all pending meeting requests for system admin
router.get(
  "/pending/all",
  protect,
  authorizeRoles("SYSTEM_ADMIN"),
  getPendingClubMeetings
);

// Get one meeting by meeting id
router.get("/:id", protect, getClubMeetingById);

// Create meeting request
router.post("/", protect, uploadEventImage.single("image"), createClubMeeting);

// Update meeting request
router.put("/:id", protect, uploadEventImage.single("image"), updateClubMeeting);

// Approve meeting request
router.put(
  "/:id/approve",
  protect,
  authorizeRoles("SYSTEM_ADMIN"),
  approveClubMeeting
);

// Reject meeting request
router.put(
  "/:id/reject",
  protect,
  authorizeRoles("SYSTEM_ADMIN"),
  rejectClubMeeting
);

// Delete meeting request
router.delete("/:id", protect, deleteClubMeeting);

export default router;