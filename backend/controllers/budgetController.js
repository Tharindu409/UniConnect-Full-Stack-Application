import mongoose from "mongoose";
import Budget from "../models/Budget.js";
import Club from "../models/Club.js";

const SYSTEM_ADMIN = "SYSTEM_ADMIN";

const ROLE_ALIASES = {
  EXECUTIVE: "EXECUTIVE_COMMITTEE_MEMBER",
};

const BUDGET_CREATOR_ROLES = [
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

const sameId = (a, b) => {
  if (!a || !b) return false;
  return String(a._id || a) === String(b._id || b);
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getActiveMembership = (club, userId) => {
  if (!club?.members || !Array.isArray(club.members)) return null;

  return (
    club.members.find((member) => {
      const status = String(member?.status || "").trim().toLowerCase();
      return member?.user && sameId(member.user, userId) && ["active", "approved"].includes(status);
    }) || null
  );
};

const isSystemAdmin = (user) => normalizeRole(user?.role) === SYSTEM_ADMIN;

const isAssignedClubAdminForClub = (club, userId) => {
  return Boolean(club?.clubAdmin?.user && sameId(club.clubAdmin.user, userId));
};

const canCreateClubBudget = (req, club) => {
  const userId = req.user?._id || req.user?.id;

  if (isSystemAdmin(req.user)) return false;
  if (isAssignedClubAdminForClub(club, userId)) return true;
  if (club?.president?.user && sameId(club.president.user, userId)) return true;

  const membership = getActiveMembership(club, userId);
  if (!membership) return false;

  return BUDGET_CREATOR_ROLES.includes(normalizeRole(membership.role));
};

const canViewClubBudgets = (req, club) => {
  const userId = req.user?._id || req.user?.id;

  if (isSystemAdmin(req.user)) return true;
  if (isAssignedClubAdminForClub(club, userId)) return true;
  if (club?.president?.user && sameId(club.president.user, userId)) return true;

  const membership = getActiveMembership(club, userId);
  if (!membership) return false;

  return normalizeRole(membership.role) !== "MEMBER";
};

export const createBudget = async (req, res) => {
  try {
    const { clubId, club, title, description, amount, category } = req.body;
    const resolvedClubId = clubId || club;

    if (!resolvedClubId || !title || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: "Club ID, title, and amount are required",
      });
    }

    if (!isValidObjectId(resolvedClubId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid club ID",
      });
    }

    const normalizedTitle = String(title).trim();
    const normalizedDescription = description ? String(description).trim() : "";
    const normalizedCategory = category ? String(category).trim() : "General";
    const numericAmount = Number(amount);

    if (!normalizedTitle) {
      return res.status(400).json({
        success: false,
        message: "Budget title is required",
      });
    }

    if (normalizedTitle.length < 3 || normalizedTitle.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Budget title must be between 3 and 100 characters",
      });
    }

    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a valid positive number",
      });
    }

    if (!normalizedDescription) {
      return res.status(400).json({
        success: false,
        message: "Description is required",
      });
    }

    if (normalizedDescription.length < 10 || normalizedDescription.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Description must be between 10 and 500 characters",
      });
    }

    const clubDoc = await Club.findById(resolvedClubId);

    if (!clubDoc) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    if (!canCreateClubBudget(req, clubDoc)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to create budget requests for this club",
      });
    }

    const budget = new Budget({
      club: resolvedClubId,
      title: normalizedTitle,
      description: normalizedDescription,
      category: normalizedCategory,
      amount: numericAmount,
      requestedBy: req.user._id || req.user.id,
      status: "pending",
      approvedAmount: null,
      remarks: "",
      rejectionReason: "",
      approvedBy: null,
      approvedAt: null,
    });

    await budget.save();

    res.status(201).json({
      success: true,
      message: "Budget request created successfully",
      data: budget,
    });
  } catch (error) {
    console.error("Error creating budget:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create budget request",
      error: error.message,
    });
  }
};

export const getClubBudgets = async (req, res) => {
  try {
    const { clubId } = req.params;

    if (!isValidObjectId(clubId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid club ID",
      });
    }

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    if (!canViewClubBudgets(req, club)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view budgets for this club",
      });
    }

    const budgets = await Budget.find({ club: clubId })
      .populate("requestedBy", "fullName email role")
      .populate("approvedBy", "fullName email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: budgets,
    });
  } catch (error) {
    console.error("Error fetching club budgets:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch club budgets",
      error: error.message,
    });
  }
};

export const getAllBudgets = async (req, res) => {
  try {
    if (!isSystemAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view all budget requests",
      });
    }

    const budgets = await Budget.find({})
      .populate("club", "name category")
      .populate("requestedBy", "fullName email role")
      .populate("approvedBy", "fullName email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: budgets,
    });
  } catch (error) {
    console.error("Error fetching all budgets:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch budget requests",
      error: error.message,
    });
  }
};

export const approveBudget = async (req, res) => {
  try {
    const { budgetId } = req.params;
    const { approvedAmount, remarks } = req.body || {};

    if (!isSystemAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to approve budget requests",
      });
    }

    if (!isValidObjectId(budgetId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid budget ID",
      });
    }

    const budget = await Budget.findById(budgetId);
    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget request not found",
      });
    }

    budget.status = "approved";
    budget.approvedAmount =
      approvedAmount === undefined || approvedAmount === null || approvedAmount === ""
        ? budget.amount
        : Number(approvedAmount);
    budget.remarks = remarks ? String(remarks).trim() : "";
    budget.rejectionReason = "";
    budget.approvedBy = req.user._id || req.user.id;
    budget.approvedAt = new Date();

    await budget.save();

    res.status(200).json({
      success: true,
      message: "Budget request approved successfully",
      data: budget,
    });
  } catch (error) {
    console.error("Error approving budget:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve budget request",
      error: error.message,
    });
  }
};

export const rejectBudget = async (req, res) => {
  try {
    const { budgetId } = req.params;
    const { reason, remarks } = req.body || {};

    if (!isSystemAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to reject budget requests",
      });
    }

    if (!isValidObjectId(budgetId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid budget ID",
      });
    }

    const budget = await Budget.findById(budgetId);
    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget request not found",
      });
    }

    budget.status = "rejected";
    budget.rejectionReason = String(reason || remarks || "Rejected").trim();
    budget.remarks = budget.rejectionReason;
    budget.approvedAmount = null;
    budget.approvedBy = req.user._id || req.user.id;
    budget.approvedAt = new Date();

    await budget.save();

    res.status(200).json({
      success: true,
      message: "Budget request rejected successfully",
      data: budget,
    });
  } catch (error) {
    console.error("Error rejecting budget:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject budget request",
      error: error.message,
    });
  }
};

export const deleteBudget = async (req, res) => {
  try {
    const { budgetId } = req.params;

    if (!isValidObjectId(budgetId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid budget ID",
      });
    }

    const budget = await Budget.findById(budgetId);
    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget request not found",
      });
    }

    const isOwner =
      budget.requestedBy &&
      sameId(budget.requestedBy, req.user._id || req.user.id);

    if (!isSystemAdmin(req.user) && !(isOwner && String(budget.status).toLowerCase() === "pending")) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this budget request",
      });
    }

    await budget.deleteOne();

    res.status(200).json({
      success: true,
      message: "Budget request deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting budget:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete budget request",
      error: error.message,
    });
  }
};
