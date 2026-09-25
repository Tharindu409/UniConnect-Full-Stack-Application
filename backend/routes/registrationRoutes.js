import express from "express";
import {
  registerForEvent,
  getEventRegistrations,
  getEventSlots,
  removeRegistration,
} from "../controllers/registrationController.js";

const router = express.Router();

router.post("/", registerForEvent);
router.get("/event/:eventId", getEventRegistrations);
router.get("/slots/:eventId", getEventSlots);
router.delete("/:id", removeRegistration);

export default router;