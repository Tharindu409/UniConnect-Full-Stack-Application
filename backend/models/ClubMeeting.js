import mongoose from "mongoose";

const MEETING_CATEGORIES = [
  "Workshop",
  "Seminar",
  "Competition",
  "Meeting",
  "Social",
  "Awareness",
  "Fundraiser",
  "Training",
  "Other",
];

const MEETING_STATUSES = ["upcoming", "ongoing", "completed", "cancelled"];
const APPROVAL_STATUSES = ["pending", "approved", "rejected"];

const clubMeetingSchema = new mongoose.Schema(
  {
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: [true, "Club is required"],
      index: true,
    },

    title: {
      type: String,
      required: [true, "Meeting title is required"],
      trim: true,
      minlength: [3, "Meeting title must be at least 3 characters"],
      maxlength: [120, "Meeting title cannot exceed 120 characters"],
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      enum: MEETING_CATEGORIES,
    },

    venue: {
      type: String,
      required: [true, "Venue is required"],
      trim: true,
      maxlength: [200, "Venue cannot exceed 200 characters"],
    },

    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },

    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },

    status: {
      type: String,
      enum: MEETING_STATUSES,
      default: "upcoming",
    },

    image: {
      type: String,
      default: "",
    },

    approvalStatus: {
      type: String,
      enum: APPROVAL_STATUSES,
      default: "pending",
      index: true,
    },

    approvalComment: {
      type: String,
      trim: true,
      maxlength: [500, "Approval comment cannot exceed 500 characters"],
      default: "",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by is required"],
    },
  },
  {
    timestamps: true,
  }
);

clubMeetingSchema.pre("validate", function () {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    this.invalidate("endDate", "End date must be after start date");
  }
});

clubMeetingSchema.pre("save", function () {
  const now = new Date();

  if (this.status !== "cancelled" && this.startDate && this.endDate) {
    if (now < this.startDate) {
      this.status = "upcoming";
    } else if (now >= this.startDate && now <= this.endDate) {
      this.status = "ongoing";
    } else if (now > this.endDate) {
      this.status = "completed";
    }
  }
});

export default mongoose.model("ClubMeeting", clubMeetingSchema);