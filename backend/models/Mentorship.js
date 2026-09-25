import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema(
  {
    date: Date,
    topic: String,
    notes: String,
    duration: Number,
  },
  { _id: false }
);

const feedbackSchema = new mongoose.Schema(
  {
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    mentee: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const mentorshipSchema = new mongoose.Schema(
  {
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
    },
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MentorshipRequest",
      default: null,
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mentee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      trim: true,
      default: "",
    },

    message: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["active", "completed", "cancelled", "rejected"],
      default: "active",
    },

    goals: {
      type: [String],
      default: [],
    },

    expertise: {
      type: [String],
      default: [],
    },

    interests: {
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

    startDate: Date,
    endDate: Date,

    meetings: {
      type: [meetingSchema],
      default: [],
    },

    feedback: {
      type: feedbackSchema,
      default: null,
    },
  },
  { timestamps: true }
);

mentorshipSchema.index({ club: 1, mentor: 1, mentee: 1 }, { unique: true });

export default mongoose.model("Mentorship", mentorshipSchema);