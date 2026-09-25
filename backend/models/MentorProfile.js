import mongoose from "mongoose";

const mentorProfileSchema = new mongoose.Schema(
  {
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      trim: true,
      default: "",
    },
    bio: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },
    skills: {
      type: [String],
      default: [],
    },
    interests: {
      type: [String],
      default: [],
    },
    expertiseLevel: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
      default: "Intermediate",
    },
    availability: {
      type: String,
      enum: ["Available", "Busy", "Unavailable"],
      default: "Available",
    },
    maxMentees: {
      type: Number,
      default: 5,
      min: 1,
    },
    currentMentees: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

mentorProfileSchema.index({ club: 1, mentor: 1 }, { unique: true });

export default mongoose.model("MentorProfile", mentorProfileSchema);