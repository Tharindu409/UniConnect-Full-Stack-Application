import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  eventTitle: {
    type: String,
    required: [true, "Event title is required"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true,
  },
  eventCategory: {
    type: String,
    required: [true, "Event category is required"],
    enum: ["Social Event", "Workshop", "Competition", "Academics", "Other"],
  },
  customCategory: {
    type: String,
    trim: true,
  },
  eventDate: {
    type: Date,
    required: [true, "Event date is required"],
  },
  startTime: {
    type: String,
    required: [true, "Start time is required"],
  },
  endTime: {
    type: String,
    required: [true, "End time is required"],
  },
  venue: {
    type: String,
    required: [true, "Venue is required"],
    trim: true,
  },
  studentCapacity: {
    type: Number,
    required: [true, "Student capacity is required"],
    min: [1, "Capacity must be at least 1"],
  },
  organisingClubName: {
    type: String,
    required: [true, "Organising club name is required"],
    trim: true,
  },
  organiserName: {
    type: String,
    required: [true, "Organiser name is required"],
    trim: true,
  },
  organiserPhone: {
    type: String,
    required: [true, "Organiser phone number is required"],
    trim: true,
  },
  registrationDeadline: {
    type: Date,
    required: [true, "Registration deadline is required"],
  },
  eventPoster: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Event = mongoose.model("Event", eventSchema);

export default Event;