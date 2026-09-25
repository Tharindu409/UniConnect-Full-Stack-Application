import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },

    userName: String,

    text: String,
  },
  { timestamps: true }
);

export default mongoose.model("Comment", commentSchema);