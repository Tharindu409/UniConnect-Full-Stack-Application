import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  studentName: {
    type: String,
    required: [true, "Student name is required"],
    trim: true,
  },
  studentEmail: {
    type: String,
    required: [true, "Student email is required"],
    trim: true,
    lowercase: true,
  },
  contactNumber: {
    type: String,
    required: [true, "Contact number is required"],
    trim: true,
  },
  specialRequests: {
    type: String,
    trim: true,
    default: "",
  },
  status: {
    type: String,
    enum: ["registered", "waitlist"],
    default: "registered",
  },
  registeredAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent duplicate registrations for same event + email
registrationSchema.index({ eventId: 1, studentEmail: 1 }, { unique: true });

const Registration = mongoose.model("Registration", registrationSchema);

export default Registration;