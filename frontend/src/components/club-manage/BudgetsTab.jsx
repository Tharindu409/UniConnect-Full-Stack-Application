import React, { useEffect, useMemo, useState } from "react";
import {
  DollarSign,
  RefreshCw,
  BadgeCheck,
  CheckCircle2,
  XCircle,
  Pencil,
  X,
} from "lucide-react";
import {
  getClubBudgets,
  createBudgetRequest,
  approveBudgetRequest,
  rejectBudgetRequest,
  updateBudgetRequest,
} from "../../services/budgetService";

const initialBudgetForm = {
  title: "",
  amount: "",
  description: "",
  category: "General",
};

const budgetCategories = [
  "General",
  "Events",
  "Travel",
  "Equipment",
  "Marketing",
  "Operations",
  "Training",
  "Competition",
];

const statusClassMap = {
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  pending: "bg-amber-100 text-amber-700",
};

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const budgetCreatorRoles = [
  "president",
  "vice_president",
  "treasurer",
  "secretary",
  "assistant_secretary",
  "assistant_treasurer",
  "event_coordinator",
  "project_coordinator",
  "executive_committee_member",
  "club_admin",
];

const getCurrentUser = () => {
  try {
    return (
      JSON.parse(localStorage.getItem("userInfo")) ||
      JSON.parse(localStorage.getItem("user")) ||
      JSON.parse(localStorage.getItem("authUser")) ||
      null
    );
  } catch {
    return null;
  }
};

const BudgetsTab = ({ clubId, club, membership, permissions }) => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [budgetForm, setBudgetForm] = useState(initialBudgetForm);
  const [editingBudgetId, setEditingBudgetId] = useState("");

  const currentUser = getCurrentUser();
  const userRole = normalizeText(currentUser?.role);
  const membershipRole = normalizeText(membership?.role);
  const parentRole = normalizeText(membership?.parentRole);

  const isSystemAdmin = userRole.toUpperCase() === "SYSTEM_ADMIN";

  const canManageBudgets = useMemo(() => {
    if (permissions?.canManageClub) return true;
    if (parentRole === "system_admin") return true;
    if (parentRole === "club_admin") return true;
    return budgetCreatorRoles.includes(membershipRole);
  }, [permissions, parentRole, membershipRole]);

  const canCreateBudgetRequests = !isSystemAdmin && canManageBudgets;
  const canApproveRejectBudgets = isSystemAdmin;

  const loadBudgets = async () => {
    try {
      setLoading(true);
      setMessage("");

      const res = await getClubBudgets(clubId);
      const budgetData = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.budgets)
        ? res.budgets
        : [];

      setBudgets(budgetData);
    } catch (error) {
      console.error("Error loading budgets:", error);
      setBudgets([]);
      setMessage(
        error?.response?.data?.message || "Failed to load budget requests"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clubId) {
      loadBudgets();
    }
  }, [clubId]);

  const handleInputChange = (key, value) => {
    setBudgetForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setMessage("");
  };

  const validateForm = () => {
    const nextErrors = {};

    const title = budgetForm.title.trim();
    const amount = Number(budgetForm.amount);
    const description = budgetForm.description.trim();
    const category = budgetForm.category;

    if (!title) {
      nextErrors.title = "Title is required";
    } else if (title.length < 3) {
      nextErrors.title = "Title must be at least 3 characters";
    } else if (title.length > 100) {
      nextErrors.title = "Title must be less than 100 characters";
    }

    if (budgetForm.amount === "" || budgetForm.amount === null) {
      nextErrors.amount = "Amount is required";
    } else if (Number.isNaN(amount)) {
      nextErrors.amount = "Amount must be a valid number";
    } else if (amount <= 0) {
      nextErrors.amount = "Amount must be greater than 0";
    } else if (amount > 10000000) {
      nextErrors.amount = "Amount is too large";
    }

    if (!description) {
      nextErrors.description = "Description is required";
    } else if (description.length < 10) {
      nextErrors.description = "Description must be at least 10 characters";
    } else if (description.length > 500) {
      nextErrors.description = "Description must be less than 500 characters";
    }

    if (!category || !budgetCategories.includes(category)) {
      nextErrors.category = "Please select a valid category";
    }

    return nextErrors;
  };

  const resetForm = () => {
    setBudgetForm(initialBudgetForm);
    setErrors({});
    setEditingBudgetId("");
  };

  const handleEdit = (budget) => {
    setEditingBudgetId(budget?._id || "");
    setBudgetForm({
      title: budget?.title || "",
      amount: budget?.amount ?? "",
      description: budget?.description || "",
      category: budget?.category || "General",
    });
    setErrors({});
    setMessage("");
  };

  const handleCancelEdit = () => {
    resetForm();
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canCreateBudgetRequests) {
      setMessage("You are not allowed to submit budget requests for this club.");
      return;
    }

    const validationErrors = validateForm();
    setErrors(validationErrors);
    setMessage("");

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        clubId,
        title: budgetForm.title.trim(),
        amount: Number(budgetForm.amount),
        description: budgetForm.description.trim(),
        category: budgetForm.category,
      };

      if (editingBudgetId) {
        await updateBudgetRequest(editingBudgetId, payload);
        setMessage("Budget request updated successfully");
      } else {
        await createBudgetRequest(payload);
        setMessage("Budget request submitted successfully");
      }

      resetForm();
      await loadBudgets();
    } catch (error) {
      console.error("Error saving budget request:", error);
      setMessage(
        error?.response?.data?.message ||
          (editingBudgetId
            ? "Failed to update budget request"
            : "Failed to submit budget request")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (budgetId) => {
    try {
      setActionLoadingId(budgetId);
      setMessage("");
      await approveBudgetRequest(budgetId, {});
      setMessage("Budget request approved successfully");
      await loadBudgets();
    } catch (error) {
      console.error("Error approving budget request:", error);
      setMessage(
        error?.response?.data?.message || "Failed to approve budget request"
      );
    } finally {
      setActionLoadingId("");
    }
  };

  const handleReject = async (budgetId) => {
    const reason = window.prompt("Enter rejection reason (optional):", "") || "";

    try {
      setActionLoadingId(budgetId);
      setMessage("");
      await rejectBudgetRequest(budgetId, { reason });
      setMessage("Budget request rejected successfully");
      await loadBudgets();
    } catch (error) {
      console.error("Error rejecting budget request:", error);
      setMessage(
        error?.response?.data?.message || "Failed to reject budget request"
      );
    } finally {
      setActionLoadingId("");
    }
  };

  const totalRequested = useMemo(() => {
    return budgets.reduce((sum, item) => sum + Number(item?.amount || 0), 0);
  }, [budgets]);

  const pendingCount = useMemo(() => {
    return budgets.filter(
      (item) => String(item?.status || "").toLowerCase() === "pending"
    ).length;
  }, [budgets]);

  const approvedCount = useMemo(() => {
    return budgets.filter(
      (item) => String(item?.status || "").toLowerCase() === "approved"
    ).length;
  }, [budgets]);

  const getStatusClass = (status) => {
    const normalized = String(status || "pending").toLowerCase();
    return statusClassMap[normalized] || "bg-slate-100 text-slate-700";
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-[#0B1E8A]/10 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-[#F36C21] font-semibold text-sm">
              <DollarSign size={18} />
              Budget Management
            </div>

            <h2 className="mt-2 text-2xl font-black text-[#0B1E8A]">
              {club?.name ? `${club.name} Budget Requests` : "Budget Requests"}
            </h2>

            <p className="mt-2 text-sm text-gray-600 max-w-2xl">
              {isSystemAdmin
                ? "Review, approve, or reject submitted budget requests."
                : "View and manage budget requests."}
            </p>
          </div>

          <button
            type="button"
            onClick={loadBudgets}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#0B1E8A]/20 text-[#0B1E8A] font-semibold hover:bg-[#0B1E8A]/5"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-[#0B1E8A]/10 p-4 bg-[#0B1E8A]/5">
            <p className="text-sm text-gray-600">Total Requests</p>
            <h3 className="text-3xl font-black text-[#0B1E8A]">
              {budgets.length}
            </h3>
          </div>

          <div className="rounded-2xl border border-[#0B1E8A]/10 p-4 bg-[#0B1E8A]/5">
            <p className="text-sm text-gray-600">Pending</p>
            <h3 className="text-3xl font-black text-[#F36C21]">
              {pendingCount}
            </h3>
          </div>

          <div className="rounded-2xl border border-[#0B1E8A]/10 p-4 bg-[#0B1E8A]/5">
            <p className="text-sm text-gray-600">Approved</p>
            <h3 className="text-3xl font-black text-[#0B1E8A]">
              {approvedCount}
            </h3>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-[#0B1E8A]/10 bg-[#0B1E8A]/5 px-4 py-3">
          <div className="flex items-center gap-2 text-[#0B1E8A]">
            <BadgeCheck size={16} className="text-[#F36C21]" />
            <span className="text-sm font-semibold">
              Total requested amount: Rs. {totalRequested.toLocaleString()}
            </span>
          </div>
        </div>

        {message && (
          <div className="mt-4 rounded-xl bg-[#F36C21]/10 text-[#F36C21] px-4 py-3 text-sm font-medium">
            {message}
          </div>
        )}
      </div>

      <div
        className={`grid ${
          canCreateBudgetRequests ? "xl:grid-cols-2" : ""
        } gap-6`}
      >
        <div className="bg-white rounded-3xl border border-[#0B1E8A]/10 p-6 shadow-sm">
          <h3 className="text-xl font-black text-[#0B1E8A] mb-4">
            Submitted Requests
          </h3>

          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : budgets.length === 0 ? (
            <div className="border border-dashed border-[#0B1E8A]/20 p-6 text-center text-gray-500">
              No budget requests found.
            </div>
          ) : (
            <div className="space-y-4">
              {budgets.map((budget) => {
                const isPending = normalizeText(budget.status) === "pending";
                const isBusy = actionLoadingId === budget._id;
                const canEditThisBudget =
                  canCreateBudgetRequests && isPending && !isSystemAdmin;

                return (
                  <div
                    key={budget._id}
                    className="border border-[#0B1E8A]/10 p-4 rounded-xl"
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-[#0B1E8A]">
                          {budget.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {budget.description}
                        </p>
                        {budget.category && (
                          <span className="mt-2 inline-block text-xs font-semibold px-3 py-1 rounded-full bg-[#0B1E8A]/5 text-[#0B1E8A]">
                            {budget.category}
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="font-black text-[#0B1E8A]">
                          Rs. {Number(budget.amount || 0).toLocaleString()}
                        </p>
                        <span
                          className={`mt-2 inline-block text-xs font-bold px-3 py-1 rounded-full ${getStatusClass(
                            budget.status
                          )}`}
                        >
                          {budget.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      {canEditThisBudget && (
                        <button
                          type="button"
                          onClick={() => handleEdit(budget)}
                          className="flex items-center gap-2 border border-[#0B1E8A]/20 px-4 py-2 rounded-lg text-[#0B1E8A] hover:bg-[#0B1E8A]/5"
                        >
                          <Pencil size={16} />
                          Edit
                        </button>
                      )}

                      {canApproveRejectBudgets && isPending && (
                        <>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleApprove(budget._id)}
                            className="flex items-center gap-2 bg-[#F36C21] px-4 py-2 rounded-lg text-white hover:bg-orange-600 disabled:opacity-60"
                          >
                            <CheckCircle2 size={16} />
                            Approve
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleReject(budget._id)}
                            className="flex items-center gap-2 border border-[#0B1E8A]/20 px-4 py-2 rounded-lg text-[#0B1E8A] hover:bg-[#0B1E8A]/5 disabled:opacity-60"
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {canCreateBudgetRequests && (
          <div className="bg-white rounded-3xl border border-[#0B1E8A]/10 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-xl font-black text-[#0B1E8A]">
                {editingBudgetId ? "Edit Budget Request" : "Create Budget Request"}
              </h3>

              {editingBudgetId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#0B1E8A]/20 text-[#0B1E8A] font-semibold hover:bg-[#0B1E8A]/5"
                >
                  <X size={16} />
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  value={budgetForm.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Title"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-[#F36C21] outline-none"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-500">{errors.title}</p>
                )}
              </div>

              <div>
                <input
                  type="number"
                  value={budgetForm.amount}
                  onChange={(e) => handleInputChange("amount", e.target.value)}
                  placeholder="Amount"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-[#F36C21] outline-none"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-500">{errors.amount}</p>
                )}
              </div>

              <div>
                <select
                  value={budgetForm.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-[#F36C21] outline-none"
                >
                  {budgetCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-500">{errors.category}</p>
                )}
              </div>

              <div>
                <textarea
                  rows="4"
                  value={budgetForm.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Description"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-[#F36C21] outline-none"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.description}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-[#F36C21] text-white font-semibold hover:bg-orange-600 disabled:opacity-60"
              >
                {submitting
                  ? editingBudgetId
                    ? "Updating..."
                    : "Submitting..."
                  : editingBudgetId
                  ? "Update Budget Request"
                  : "Submit Budget Request"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetsTab;