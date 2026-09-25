import express from "express";
import {
  requestMembership,
  getClubMembers,
  getPendingRequests,
  approveMembership,
  rejectMembership,
  updateMemberRole,
  removeMember,
  getJoinStatus,
} from "../controllers/membershipController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// student join request
router.post("/:clubId/request", protect, requestMembership);

// get join status for logged in user
router.get("/:clubId/status", protect, getJoinStatus);

// get approved members
router.get("/:clubId/members", protect, getClubMembers);

// get pending requests
router.get("/:clubId/requests", protect, getPendingRequests);

// approve / reject / update role / remove
router.put("/:clubId/members/:memberId/approve", protect, approveMembership);
router.put("/:clubId/members/:memberId/reject", protect, rejectMembership);
router.put("/:clubId/members/:memberId/role", protect, updateMemberRole);
router.delete("/:clubId/members/:memberId", protect, removeMember);

export default router;