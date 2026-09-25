import express from "express";
import { uploadEventImage } from "../middleware/uploadMiddleware.js";
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController.js";

const router = express.Router();

router.post("/", uploadEventImage.single("eventPoster"), createEvent);
router.get("/", getAllEvents);
router.get("/:id", getEventById);
router.put("/:id", uploadEventImage.single("eventPoster"), updateEvent);
router.delete("/:id", deleteEvent);

export default router;