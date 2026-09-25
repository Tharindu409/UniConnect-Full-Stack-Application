import mongoose from "mongoose";

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    normalizedName: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    category: {
      type: String,
      enum: ["TECHNICAL", "SOFT_SKILL", "MANAGEMENT", "DESIGN"],
      default: "TECHNICAL",
    },

    description: {
      type: String,
      default: "",
      maxlength: 300,
      trim: true,
    },
  },
  { timestamps: true }
);

skillSchema.pre("validate", function setNormalizedName() {
  if (this.name) {
    this.normalizedName = this.name.trim().toLowerCase();
  }
});

export default mongoose.model("Skill", skillSchema);
