import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: [true, "Club is required"],
    },

    title: {
      type: String,
      required: [true, "Expense title is required"],
      trim: true,
      maxlength: [120, "Expense title cannot exceed 120 characters"],
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Event",
        "Travel",
        "Food",
        "Marketing",
        "Printing",
        "Equipment",
        "Stationery",
        "Utilities",
        "Other",
      ],
    },

    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },

    expenseDate: {
      type: Date,
      required: [true, "Expense date is required"],
    },

    vendor: {
      type: String,
      trim: true,
      maxlength: [100, "Vendor name cannot exceed 100 characters"],
      default: "",
    },

    paymentMethod: {
      type: String,
      enum: ["Cash", "Bank Transfer", "Card", "Online Payment", "Other", ""],
      default: "",
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },

    receiptUrl: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    rejectionReason: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Rejection reason cannot exceed 500 characters"],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;