import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema(
  {
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: [
        "MEMBER",
        "PRESIDENT",
        "VICE_PRESIDENT",
        "SECRETARY",
        "ASSISTANT_SECRETARY",
        "TREASURER",
        "ASSISTANT_TREASURER",
        "EVENT_COORDINATOR",
        "PROJECT_COORDINATOR",
        "EXECUTIVE_COMMITTEE_MEMBER",
      ],
      default: "MEMBER",
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

membershipSchema.index({ club: 1, user: 1 }, { unique: true });

const Membership = mongoose.model("Membership", membershipSchema);

export default Membership;