 import mongoose from "mongoose";

const sessionLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    ipAddress: String,

    device: String,

    loginTime: {
      type: Date,
      default: Date.now,
    },

    logoutTime: Date,
  },
  { timestamps: true }
);

export default mongoose.model("SessionLog", sessionLogSchema);
