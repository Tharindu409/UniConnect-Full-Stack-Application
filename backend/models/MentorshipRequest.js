import mongoose from "mongoose";

const mentorshipRequestSchema = new mongoose.Schema(
  {
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      trim: true,
      default: "",
    },
    studentSkills: {
      type: [String],
      default: [],
    },
    studentInterests: {
      type: [String],
      default: [],
    },
    studentLevel: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
      default: "Beginner",
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "completed", "rejected", "cancelled"],
      default: "pending",
    },
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

mentorshipRequestSchema.index(
  { club: 1, student: 1, mentor: 1, status: 1 },
  { name: "club_student_mentor_status_idx" }
);

export default mongoose.model("MentorshipRequest", mentorshipRequestSchema);