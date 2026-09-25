import express from "express";
import {
  getDashboard,
  updateProfile,
  addSkill,
  removeSkill,
  getBadges,
  deleteCertificate,
} from "../controllers/studentController.js";

import { protect } from "../middleware/authMiddleware.js";


const router = express.Router();

// All routes are protected
router.use(protect);

 router.get("/dashboard", getDashboard);

 router.put("/profile", updateProfile);

// ADD skill
router.post("/skills", addSkill);

// REMOVE skill
router.delete("/skills/:skillId", removeSkill);

// DELETE certificate
router.delete("/certificates/:certificateId", deleteCertificate);

// GET badges
router.get("/badges", getBadges);




export default router;
