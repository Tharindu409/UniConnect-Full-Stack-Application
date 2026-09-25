import mongoose from "mongoose";
import Expense from "../models/Expense.js";
import Club from "../models/Club.js";

const SYSTEM_ADMIN = "SYSTEM_ADMIN";

const ROLE_ALIASES = {
  EXECUTIVE: "EXECUTIVE_COMMITTEE_MEMBER",
};

const MANAGE_ROLES = [
  "PRESIDENT",
  "VICE_PRESIDENT",
  "TREASURER",
  "SECRETARY",
  "ASSISTANT_SECRETARY",
  "ASSISTANT_TREASURER",
  "EVENT_COORDINATOR",
  "PROJECT_COORDINATOR",
  "EXECUTIVE_COMMITTEE_MEMBER",
];

const normalizeRole = (role) => {
  const normalized = String(role || "")
    .trim()
    .replace(/\s+/g, "_")
    .toUpperCase();

  return ROLE_ALIASES[normalized] || normalized;
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const sameId = (a, b) => String(a?._id || a) === String(b?._id || b);

const getActiveClubMember = (club, userId) => {
  if (!club?.members?.length || !userId) return null;

  return club.members.find((member) => {
    const memberUserId =
      member?.user?._id?.toString?.() ||
      member?.user?.toString?.() ||
      member?._id?.toString?.() ||
      member?.memberId?.toString?.();

    const status = String(member?.status || "").trim().toLowerCase();

    return String(memberUserId) === String(userId) && ["active", "approved"].includes(status);
  });
};

const isAssignedClubAdminForClub = (club, userId) =>
  Boolean(club?.clubAdmin?.user && sameId(club.clubAdmin.user, userId));

const canManageClubExpenses = (user, club) => {
  const userRole = normalizeRole(user?.role);

  if (userRole === SYSTEM_ADMIN) return false;
  if (isAssignedClubAdminForClub(club, user?._id)) return true;
  if (club?.president?.user && sameId(club.president.user, user?._id)) return true;

  const member = getActiveClubMember(club, user?._id);
  const memberRole = normalizeRole(member?.role || member?.memberRole || member?.position || "");
  return MANAGE_ROLES.includes(memberRole);
};

const canViewClubExpenses = (user, club) => {
  const userRole = normalizeRole(user?.role);

  if (userRole === SYSTEM_ADMIN) return true;
  if (isAssignedClubAdminForClub(club, user?._id)) return true;

  const member = getActiveClubMember(club, user?._id);
  return Boolean(member);
};

const validateUploadedReceipt = (file) => {
  if (!file) return "";

  const allowedMimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return "Only PDF, JPG, JPEG, PNG, and WEBP files are allowed";
  }

  if (file.size > 5 * 1024 * 1024) {
    return "Receipt file must be 5MB or less";
  }

  return "";
};

const validateExpensePayload = (body, isUpdate = false) => {
  const errors = {};

  const title = body.title?.trim?.() || "";
  const category = body.category || "";
  const amount = Number(body.amount);
  const vendor = body.vendor?.trim?.() || "";
  const paymentMethod = body.paymentMethod || "";
  const description = body.description?.trim?.() || "";
  const expenseDate = body.expenseDate;

  if (!isUpdate || "title" in body) {
    if (!title) {
      errors.title = "Expense title is required";
    } else if (title.length < 3) {
      errors.title = "Expense title must be at least 3 characters";
    } else if (title.length > 120) {
      errors.title = "Expense title cannot exceed 120 characters";
    }
  }

  if (!isUpdate || "category" in body) {
    const allowedCategories = [
      "Event",
      "Travel",
      "Food",
      "Marketing",
      "Printing",
      "Equipment",
      "Stationery",
      "Utilities",
      "Other",
    ];

    if (!category) {
      errors.category = "Category is required";
    } else if (!allowedCategories.includes(category)) {
      errors.category = "Invalid expense category";
    }
  }

  if (!isUpdate || "amount" in body) {
    if (body.amount === undefined || body.amount === null || body.amount === "") {
      errors.amount = "Amount is required";
    } else if (Number.isNaN(amount) || amount <= 0) {
      errors.amount = "Amount must be greater than 0";
    } else if (amount > 10000000) {
      errors.amount = "Amount is too large";
    }
  }

  if (!isUpdate || "expenseDate" in body) {
    if (!expenseDate) {
      errors.expenseDate = "Expense date is required";
    } else {
      const parsedDate = new Date(expenseDate);
      if (Number.isNaN(parsedDate.getTime())) {
        errors.expenseDate = "Invalid expense date";
      } else if (parsedDate > new Date()) {
        errors.expenseDate = "Expense date cannot be in the future";
      }
    }
  }

  if (vendor.length > 100) {
    errors.vendor = "Vendor name cannot exceed 100 characters";
  }

  const allowedPaymentMethods = ["", "Cash", "Bank Transfer", "Card", "Online Payment", "Other"];

  if (paymentMethod && !allowedPaymentMethods.includes(paymentMethod)) {
    errors.paymentMethod = "Invalid payment method";
  }

  if (description.length > 500) {
    errors.description = "Description cannot exceed 500 characters";
  }

  return errors;
};

export const getClubExpenses = async (req, res) => {
  try {
    const { clubId } = req.params;

    if (!isValidObjectId(clubId)) {
      return res.status(400).json({ message: "Invalid club ID" });
    }

    const club = await Club.findById(clubId).populate("members.user", "name email role");
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (!canViewClubExpenses(req.user, club)) {
      return res.status(403).json({
        message: "You are not authorized to view this club's expenses",
      });
    }

    const expenses = await Expense.find({ club: clubId })
      .populate("createdBy", "name fullName email role")
      .populate("updatedBy", "name fullName email role")
      .sort({ expenseDate: -1, createdAt: -1 });

    return res.status(200).json(expenses);
  } catch (error) {
    console.error("getClubExpenses error:", error);
    return res.status(500).json({
      message: "Failed to fetch club expenses",
      error: error.message,
    });
  }
};

export const getExpenseById = async (req, res) => {
  try {
    const { expenseId } = req.params;

    if (!isValidObjectId(expenseId)) {
      return res.status(400).json({ message: "Invalid expense ID" });
    }

    const expense = await Expense.findById(expenseId)
      .populate("createdBy", "name fullName email role")
      .populate("updatedBy", "name fullName email role")
      .populate({
        path: "club",
        populate: {
          path: "members.user",
          select: "name fullName email role",
        },
      });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    if (!canViewClubExpenses(req.user, expense.club)) {
      return res.status(403).json({ message: "You are not authorized to view this expense" });
    }

    return res.status(200).json(expense);
  } catch (error) {
    console.error("getExpenseById error:", error);
    return res.status(500).json({
      message: "Failed to fetch expense",
      error: error.message,
    });
  }
};

export const createExpense = async (req, res) => {
  try {
    const { clubId, title, category, amount, expenseDate, vendor, paymentMethod, description } = req.body;

    if (!clubId || !isValidObjectId(clubId)) {
      return res.status(400).json({ message: "Valid clubId is required" });
    }

    const validationErrors = validateExpensePayload(req.body);
    const receiptError = validateUploadedReceipt(req.file);

    if (receiptError) validationErrors.receipt = receiptError;

    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({ message: "Validation failed", errors: validationErrors });
    }

    const club = await Club.findById(clubId).populate("members.user", "name email role");
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (!canManageClubExpenses(req.user, club)) {
      return res.status(403).json({
        message: "You are not authorized to create expenses for this club",
      });
    }

    const newExpense = await Expense.create({
      club: clubId,
      title: title.trim(),
      category,
      amount: Number(amount),
      expenseDate,
      vendor: vendor?.trim?.() || "",
      paymentMethod: paymentMethod || "",
      description: description?.trim?.() || "",
      receiptUrl: req.file ? `/uploads/${req.file.filename}` : "",
      status: "pending",
      rejectionReason: "",
      createdBy: req.user._id,
    });

    const populatedExpense = await Expense.findById(newExpense._id)
      .populate("createdBy", "name fullName email role")
      .populate("updatedBy", "name fullName email role");

    return res.status(201).json({
      message: "Expense created successfully",
      expense: populatedExpense,
    });
  } catch (error) {
    console.error("createExpense error:", error);
    return res.status(500).json({
      message: "Failed to create expense",
      error: error.message,
    });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;

    if (!isValidObjectId(expenseId)) {
      return res.status(400).json({ message: "Invalid expense ID" });
    }

    const validationErrors = validateExpensePayload(req.body, true);
    const receiptError = validateUploadedReceipt(req.file);

    if (receiptError) validationErrors.receipt = receiptError;

    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({ message: "Validation failed", errors: validationErrors });
    }

    const expense = await Expense.findById(expenseId).populate({
      path: "club",
      populate: {
        path: "members.user",
        select: "name fullName email role",
      },
    });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    if (!canManageClubExpenses(req.user, expense.club)) {
      return res.status(403).json({
        message: "You are not authorized to update this expense",
      });
    }

    if (req.body.title !== undefined) expense.title = req.body.title.trim();
    if (req.body.category !== undefined) expense.category = req.body.category;
    if (req.body.amount !== undefined) expense.amount = Number(req.body.amount);
    if (req.body.expenseDate !== undefined) expense.expenseDate = req.body.expenseDate;
    if (req.body.vendor !== undefined) expense.vendor = req.body.vendor?.trim?.() || "";
    if (req.body.paymentMethod !== undefined) expense.paymentMethod = req.body.paymentMethod || "";
    if (req.body.description !== undefined) expense.description = req.body.description?.trim?.() || "";
    if (req.file) expense.receiptUrl = `/uploads/${req.file.filename}`;

    expense.status = "pending";
    expense.rejectionReason = "";
    expense.updatedBy = req.user._id;

    await expense.save();

    const updatedExpense = await Expense.findById(expense._id)
      .populate("createdBy", "name fullName email role")
      .populate("updatedBy", "name fullName email role");

    return res.status(200).json({
      message: "Expense updated successfully",
      expense: updatedExpense,
    });
  } catch (error) {
    console.error("updateExpense error:", error);
    return res.status(500).json({
      message: "Failed to update expense",
      error: error.message,
    });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;

    if (!isValidObjectId(expenseId)) {
      return res.status(400).json({ message: "Invalid expense ID" });
    }

    const expense = await Expense.findById(expenseId).populate({
      path: "club",
      populate: {
        path: "members.user",
        select: "name fullName email role",
      },
    });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    if (!canManageClubExpenses(req.user, expense.club)) {
      return res.status(403).json({ message: "You are not authorized to delete this expense" });
    }

    await expense.deleteOne();

    return res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("deleteExpense error:", error);
    return res.status(500).json({
      message: "Failed to delete expense",
      error: error.message,
    });
  }
};

export const getAllExpenses = async (req, res) => {
  try {
    const userRole = normalizeRole(req.user?.role);

    if (userRole !== SYSTEM_ADMIN) {
      return res.status(403).json({ message: "Only system admins can view all expenses" });
    }

    const expenses = await Expense.find({})
      .populate("club", "name status")
      .populate("createdBy", "name fullName email role")
      .populate("updatedBy", "name fullName email role")
      .sort({ createdAt: -1 });

    return res.status(200).json(expenses);
  } catch (error) {
    console.error("getAllExpenses error:", error);
    return res.status(500).json({
      message: "Failed to fetch all expenses",
      error: error.message,
    });
  }
};

export const approveExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;

    if (!isValidObjectId(expenseId)) {
      return res.status(400).json({ message: "Invalid expense ID" });
    }

    const userRole = normalizeRole(req.user?.role);
    if (userRole !== SYSTEM_ADMIN) {
      return res.status(403).json({ message: "Only system admins can approve expenses" });
    }

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    expense.status = "approved";
    expense.rejectionReason = "";
    expense.updatedBy = req.user._id;

    await expense.save();

    const updatedExpense = await Expense.findById(expense._id)
      .populate("createdBy", "name fullName email role")
      .populate("updatedBy", "name fullName email role");

    return res.status(200).json({
      message: "Expense approved successfully",
      expense: updatedExpense,
    });
  } catch (error) {
    console.error("approveExpense error:", error);
    return res.status(500).json({
      message: "Failed to approve expense",
      error: error.message,
    });
  }
};

export const rejectExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { reason } = req.body || {};

    if (!isValidObjectId(expenseId)) {
      return res.status(400).json({ message: "Invalid expense ID" });
    }

    const userRole = normalizeRole(req.user?.role);
    if (userRole !== SYSTEM_ADMIN) {
      return res.status(403).json({ message: "Only system admins can reject expenses" });
    }

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    expense.status = "rejected";
    expense.rejectionReason = String(reason || "").trim();
    expense.updatedBy = req.user._id;

    await expense.save();

    const updatedExpense = await Expense.findById(expense._id)
      .populate("createdBy", "name fullName email role")
      .populate("updatedBy", "name fullName email role");

    return res.status(200).json({
      message: "Expense rejected successfully",
      expense: updatedExpense,
    });
  } catch (error) {
    console.error("rejectExpense error:", error);
    return res.status(500).json({
      message: "Failed to reject expense",
      error: error.message,
    });
  }
};
