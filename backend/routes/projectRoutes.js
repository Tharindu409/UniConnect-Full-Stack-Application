import express from "express";
import { uploadEventImage } from "../middleware/uploadMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

import {
  createProject,
  getProjects,
  deleteProject,
  updateProject,
  likeProject,
  addComment,
  getComments,
  deleteComment,
} from "../controllers/projectController.js";

const router = express.Router();

router.post("/create", uploadEventImage.array("images", 3), createProject);
router.get("/", getProjects);
router.put("/:id", uploadEventImage.array("images", 3), updateProject);
router.delete("/:id", deleteProject);
router.put("/like/:id", protect, likeProject);
router.post("/comment/:id", protect, addComment);
router.get("/comments/:id", getComments);
router.delete("/comment/:id", deleteComment);

export default router;