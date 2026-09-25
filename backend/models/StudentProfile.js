 import mongoose from "mongoose";

const skillDetailSchema = new mongoose.Schema(
  {
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Skill",
      required: true,
    },
    proficiency: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
      default: "Intermediate",
    },
    relatedActivity: {
      type: String,
      default: "",
      trim: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const joinedClubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: "General",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    members: {
      type: Number,
      default: 0,
      min: 0,
    },
    role: {
      type: String,
      enum: ["President", "Member", "Admin"],
      default: "Member",
    },
    image: {
      type: String,
      default: "",
      trim: true,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: [String],
      default: [],
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const certificateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    issuer: {
      type: String,
      default: "UniConnect",
      trim: true,
    },
    credentialId: {
      type: String,
      default: "",
      trim: true,
    },
    verificationUrl: {
      type: String,
      default: "",
      trim: true,
    },
    certificateUrl: {
      type: String,
      default: "",
      trim: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    status: {
      type: String,
      enum: ["ACTIVE"],
      default: "ACTIVE",
    },
    signature: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: true }
);

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    universityId: String,

    degreeProgram: String,

    faculty: String,

    yearOfStudy: Number,

    bio: {
      type: String,
      default: "",
      maxlength: 500,
    },

    skills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Skill",
      },
    ],

    skillDetails: [skillDetailSchema],

    badges: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Badge",
      },
    ],

    joinedClubs: {
      type: [joinedClubSchema],
      default: [],
    },

    certificates: {
      type: [certificateSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("StudentProfile", studentProfileSchema);
