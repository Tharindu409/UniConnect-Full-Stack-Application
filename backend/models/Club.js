import mongoose from "mongoose";

// ================= MEMBER SUB-SCHEMA =================
const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: [
        "member",
        "executive",
        "vice_president",
        "president",
        "treasurer",
        "secretary",
        "assistant_secretary",
        "assistant_treasurer",
        "event_coordinator",
        "project_coordinator",
      ],
      default: "member",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// ================= JOIN REQUEST SUB-SCHEMA =================
const joinRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rejectionReason: {
      type: String,
    },
  },
  { timestamps: true }
);

// ================= MAIN CLUB SCHEMA =================
const clubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: [
        "Engineering",
        "Academic",
        "Environment",
        "Creative",
        "Business",
        "Cultural",
        "Sports",
        "Arts",
      ],
      required: true,
    },

    tags: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["pending", "active", "rejected"],
      default: "pending",
    },

    // ================= PRESIDENT =================
    president: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      name: String,
      email: String,
    },

    // ================= CLUB ADMIN =================
    clubAdmin: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      name: String,
      email: String,
    },

    // ================= MEMBERS =================
    members: {
      type: [memberSchema],
      default: [],
    },

    // ================= JOIN REQUESTS =================
    joinRequests: {
      type: [joinRequestSchema],
      default: [],
    },

    logo: {
  type: String,
  default: "",
},

    // ================= CONSTITUTION FILE =================
    constitution: {
      fileUrl: {
        type: String,
      },
      fileName: {
        type: String,
      },
      filePath: {
        type: String,
      },
      uploadedAt: {
        type: Date,
      },
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      version: {
        type: Number,
      },
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvedAt: Date,

    rejectionReason: String,
  },
  { timestamps: true }
);

// ================= METHODS =================

// Check if user is an active member
clubSchema.methods.isMember = function (userId) {
  return this.members.some(
    (m) => m.user && m.user.toString() === String(userId) && m.status === "active"
  );
};

// Check if user has pending request
clubSchema.methods.hasPendingJoinRequest = function (userId) {
  return this.joinRequests.some(
    (r) => r.user && r.user.toString() === String(userId) && r.status === "pending"
  );
};

// Add join request
clubSchema.methods.addJoinRequest = function (userId) {
  const exists = this.hasPendingJoinRequest(userId) || this.isMember(userId);

  if (exists) {
    throw new Error("Already a member or request pending");
  }

  this.joinRequests.push({
    user: userId,
    status: "pending",
    requestedAt: new Date(),
  });
};

// Approve join request
clubSchema.methods.approveJoinRequest = function (requestId, approvedBy) {
  const request = this.joinRequests.id(requestId);

  if (!request) {
    throw new Error("Request not found");
  }

  if (request.status !== "pending") {
    throw new Error("Request already processed");
  }

  request.status = "approved";
  request.approvedBy = approvedBy;

  const alreadyMember = this.members.some(
    (m) => m.user && m.user.toString() === String(request.user)
  );

  if (!alreadyMember) {
    this.members.push({
      user: request.user,
      role: "member",
      status: "active",
      joinedAt: new Date(),
    });
  }
};

// Reject join request
clubSchema.methods.rejectJoinRequest = function (
  requestId,
  rejectedBy,
  reason
) {
  const request = this.joinRequests.id(requestId);

  if (!request) {
    throw new Error("Request not found");
  }

  request.status = "rejected";
  request.rejectedBy = rejectedBy;
  request.rejectionReason = reason || "Rejected";
};

// ================= EXPORT =================
const Club = mongoose.model("Club", clubSchema);

export default Club;