import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    images: {
      type: [String],
      validate: [(arr) => arr.length <= 3, "Max 3 images allowed"],
      default: [],
    },
    category: {
      type: String,
      default: "",
      trim: true,
    },
    clubName: {
      type: String,
      default: "",
      trim: true,
    },
    projectDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Completed", "Ongoing", "Planned"],
      default: "Ongoing",
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    likedBy: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Project", projectSchema);