import mongoose from "mongoose";

// Parent / global app roles only
const USER_ROLES = ["STUDENT", "CLUB_ADMIN", "SYSTEM_ADMIN"];

// Club-specific child roles should NOT be stored here.
// They should be stored per club inside Club.members.role.
// Example:
// User.role = "CLUB_ADMIN"
// Club.members.role = "president"

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    studentId: {
      type: String,
      required: true,
      trim: true,
    },

    // Parent role only
    role: {
      type: String,
      enum: USER_ROLES,
      default: "STUDENT",
    },

    faculty: {
      type: String,
      required: true,
      trim: true,
    },

    yearOfStudy: {
      type: String,
      required: true,
      trim: true,
    },

    skills: {
      type: [String],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    passwordResetToken: {
      type: String,
      default: null,
    },

    passwordResetExpires: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Optional helper methods
userSchema.methods.isSystemAdmin = function () {
  return this.role === "SYSTEM_ADMIN";
};

userSchema.methods.isClubAdmin = function () {
  return this.role === "CLUB_ADMIN";
};

userSchema.methods.isStudent = function () {
  return this.role === "STUDENT";
};

export { USER_ROLES };
export default mongoose.model("User", userSchema);