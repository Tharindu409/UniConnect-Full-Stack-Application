import mongoose from "mongoose";

const privacySettingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
    },

    showEmail: {
      type: Boolean,
      default: false,
    },

    showProfilePublic: {
      type: Boolean,
      default: true,
    },
 
  },
  { timestamps: true }
);

export default mongoose.model("PrivacySettings", privacySettingsSchema);
