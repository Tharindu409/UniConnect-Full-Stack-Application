import mongoose from "mongoose";

const electionSchema = new mongoose.Schema(
  {
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: [true, "Club is required"],
    },

    title: {
      type: String,
      required: [true, "Election title is required"],
      trim: true,
      maxlength: [120, "Election title cannot exceed 120 characters"],
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },

    position: {
      type: String,
      required: [true, "Position is required"],
      enum: [
        "President",
        "Vice President",
        "Secretary",
        "Assistant Secretary",
        "Treasurer",
        "Assistant Treasurer",
        "Executive Committee Member",
        "Event Coordinator",
        "Project Coordinator",
        "Other",
      ],
    },

    nominationStartDate: {
      type: Date,
      required: [true, "Nomination start date is required"],
    },

    nominationEndDate: {
      type: Date,
      required: [true, "Nomination end date is required"],
    },

    votingStartDate: {
      type: Date,
      required: [true, "Voting start date is required"],
    },

    votingEndDate: {
      type: Date,
      required: [true, "Voting end date is required"],
    },

    eligibility: {
      type: String,
      trim: true,
      maxlength: [500, "Eligibility cannot exceed 500 characters"],
      default: "",
    },

    maxCandidates: {
      type: Number,
      min: [1, "Max candidates must be at least 1"],
      default: null,
    },

    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming",
    },

    candidates: [
      {
        name: {
          type: String,
          required: [true, "Candidate name is required"],
          trim: true,
          maxlength: [100, "Candidate name cannot exceed 100 characters"],
        },
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
        votes: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
    ],

    voters: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        candidateIndex: {
          type: Number,
          required: true,
          min: 0,
        },
        votedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Election = mongoose.model("Election", electionSchema);

export default Election;