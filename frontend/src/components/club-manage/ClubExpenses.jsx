import React, { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  Search,
  CheckCircle2,
  XCircle,
  Paperclip,
} from "lucide-react";
import {
  getClubExpenses,
  createExpense,
  deleteExpense,
  approveExpense,
  rejectExpense,
} from "../../services/expenseService";

const expenseCategories = [
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

const initialForm = {
  title: "",
  amount: "",
  description: "",
  category: "Event",
  vendor: "",
  paymentMethod: "",
  receiptFile: null,
};

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const expenseCreatorRoles = [
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

const statusClassMap = {
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  pending: "bg-amber-100 text-amber-700",
};

const paymentMethods = [
  "",
  "Cash",
  "Bank Transfer",
  "Card",
  "Online Payment",
  "Other",
];

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:5000";

const ClubExpenses = ({ clubId, club, membership, permissions }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  const currentUser = getCurrentUser();
  const userRole = normalizeText(currentUser?.role);
  const membershipRole = normalizeText(membership?.role);
  const parentRole = normalizeText(membership?.parentRole);

  const isSystemAdmin = userRole.toUpperCase() === "SYSTEM_ADMIN";

  const canManageExpenses = useMemo(() => {
    if (permissions?.canManageClub) return true;
    if (parentRole === "system_admin") return true;
    if (parentRole === "club_admin") return true;
    return expenseCreatorRoles.includes(membershipRole);
  }, [permissions, parentRole, membershipRole]);

  const canCreateExpenses = !isSystemAdmin && canManageExpenses;
  const canApproveRejectExpenses = isSystemAdmin;

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setMessage("");
      const res = await getClubExpenses(clubId);

      const expenseData = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : [];

      setExpenses(expenseData);
    } catch (error) {
      console.error("Error loading expenses:", error);
      setExpenses([]);
      setMessage(error?.response?.data?.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clubId) {
      loadExpenses();
    }
  }, [clubId]);

  const filteredExpenses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return expenses;

    return expenses.filter((expense) =>
      [
        expense.title,
        expense.description,
        expense.category,
        expense.status,
        expense.vendor,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [expenses, search]);

  const totalAmount = useMemo(
    () => expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [expenses]
  );

  const approvedCount = useMemo(
    () =>
      expenses.filter(
        (item) => normalizeText(item.status || "pending") === "approved"
      ).length,
    [expenses]
  );

  const pendingCount = useMemo(
    () =>
      expenses.filter(
        (item) => normalizeText(item.status || "pending") === "pending"
      ).length,
    [expenses]
  );

  const handleInputChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setMessage("");
  };

  const validateForm = () => {
    const newErrors = {};

    const title = form.title.trim();
    const amount = Number(form.amount);
    const description = form.description.trim();
    const vendor = form.vendor.trim();
    const file = form.receiptFile;

    if (!title) {
      newErrors.title = "Title is required";
    } else if (title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    } else if (title.length > 120) {
      newErrors.title = "Title cannot exceed 120 characters";
    }

    if (form.amount === "" || form.amount === null) {
      newErrors.amount = "Amount is required";
    } else if (Number.isNaN(amount)) {
      newErrors.amount = "Amount must be a valid number";
    } else if (amount <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }

    if (!form.category || !expenseCategories.includes(form.category)) {
      newErrors.category = "Please select a valid category";
    }

    if (!description) {
      newErrors.description = "Description is required";
    } else if (description.length > 500) {
      newErrors.description = "Description cannot exceed 500 characters";
    }

    if (vendor.length > 100) {
      newErrors.vendor = "Vendor cannot exceed 100 characters";
    }

    if (form.paymentMethod && !paymentMethods.includes(form.paymentMethod)) {
      newErrors.paymentMethod = "Please select a valid payment method";
    }

    if (file) {
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];

      if (!allowedTypes.includes(file.type)) {
        newErrors.receiptFile =
          "Only PDF, JPG, JPEG, PNG, and WEBP files are allowed";
      } else if (file.size > 5 * 1024 * 1024) {
        newErrors.receiptFile = "Receipt file must be 5MB or less";
      }
    }

    return newErrors;
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();

    if (!canCreateExpenses) {
      setMessage("You are not allowed to create expenses for this club.");
      return;
    }

    const validationErrors = validateForm();
    setErrors(validationErrors);
    setMessage("");

    if (Object.keys(validationErrors).length > 0) return;

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("clubId", clubId);
      formData.append("title", form.title.trim());
      formData.append("amount", String(Number(form.amount)));
      formData.append("description", form.description.trim());
      formData.append("category", form.category);
      formData.append("expenseDate", new Date().toISOString());
      formData.append("vendor", form.vendor.trim());
      formData.append("paymentMethod", form.paymentMethod || "");

      if (form.receiptFile) {
        formData.append("receipt", form.receiptFile);
      }

      await createExpense(formData);
      setMessage("Expense request created successfully");
      setForm(initialForm);
      setErrors({});
      await loadExpenses();
    } catch (error) {
      console.error("Error creating expense:", error);
      setMessage(error?.response?.data?.message || "Failed to create expense");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!canCreateExpenses) {
      setMessage("You are not allowed to delete expenses for this club.");
      return;
    }

    const confirmed = window.confirm("Delete this expense?");
    if (!confirmed) return;

    try {
      setMessage("");
      await deleteExpense(expenseId);
      setMessage("Expense deleted successfully");
      await loadExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
      setMessage(error?.response?.data?.message || "Failed to delete expense");
    }
  };

  const handleApprove = async (expenseId) => {
    try {
      setActionLoadingId(expenseId);
      setMessage("");
      await approveExpense(expenseId, {});
      setMessage("Expense approved successfully");
      await loadExpenses();
    } catch (error) {
      console.error("Error approving expense:", error);
      setMessage(error?.response?.data?.message || "Failed to approve expense");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleReject = async (expenseId) => {
    const reason = window.prompt("Enter rejection reason (optional):", "") || "";

    try {
      setActionLoadingId(expenseId);
      setMessage("");
      await rejectExpense(expenseId, { reason });
      setMessage("Expense rejected successfully");
      await loadExpenses();
    } catch (error) {
      console.error("Error rejecting expense:", error);
      setMessage(error?.response?.data?.message || "Failed to reject expense");
    } finally {
      setActionLoadingId("");
    }
  };

  const getStatusClass = (status) => {
    const normalized = normalizeText(status || "pending");
    return statusClassMap[normalized] || "bg-slate-100 text-slate-700";
  };

  const getReceiptUrl = (receiptPath) => {
    if (!receiptPath) return "";
    if (receiptPath.startsWith("http://") || receiptPath.startsWith("https://")) {
      return receiptPath;
    }
    return `${API_BASE_URL}${receiptPath}`;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="bg-white rounded-3xl border border-[#0B1E8A]/10 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-3">
              <Wallet className="text-[#F36C21]" size={20} />
              <h2 className="text-xl font-black text-[#0B1E8A]">
                {club?.name ? `${club.name} Expenses` : "Expenses"}
              </h2>
            </div>

            <p className="mt-2 text-sm text-gray-600">
              {isSystemAdmin
                ? "Review, approve, or reject submitted expenses."
                : "Track and manage club expense records."}
            </p>
          </div>

          <div className="relative w-full lg:w-80">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expenses..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F36C21]"
            />
          </div>
        </div>

        {message && (
          <div className="mb-4 rounded-xl bg-[#F36C21]/10 text-[#F36C21] px-4 py-3 text-sm">
            {message}
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-3">
          <span className="px-4 py-2 rounded-full bg-[#0B1E8A]/5 text-[#0B1E8A] text-sm font-semibold">
            Records: {expenses.length}
          </span>
          <span className="px-4 py-2 rounded-full bg-[#F36C21]/10 text-[#F36C21] text-sm font-semibold">
            Pending: {pendingCount}
          </span>
          <span className="px-4 py-2 rounded-full bg-[#0B1E8A]/10 text-[#0B1E8A] text-sm font-semibold">
            Approved: {approvedCount}
          </span>
          <span className="px-4 py-2 rounded-full bg-[#0B1E8A]/5 text-[#0B1E8A] text-sm font-semibold">
            Total: Rs. {totalAmount.toLocaleString()}
          </span>
        </div>

        {loading ? (
          <div className="text-gray-500">Loading expenses...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#0B1E8A]/15 px-4 py-10 text-center text-gray-500">
            No expense records found.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExpenses.map((expense) => {
              const isPending = normalizeText(expense.status) === "pending";
              const isBusy = actionLoadingId === expense._id;

              return (
                <div
                  key={expense._id}
                  className="rounded-2xl border border-[#0B1E8A]/10 p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-bold text-[#0B1E8A]">
                          {expense.title}
                        </h3>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(
                            expense.status
                          )}`}
                        >
                          {expense.status || "pending"}
                        </span>

                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#0B1E8A]/5 text-[#0B1E8A]">
                          {expense.category || "Other"}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-gray-600">
                        {expense.description || "No description provided"}
                      </p>

                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="rounded-xl bg-[#0B1E8A]/5 px-3 py-2">
                          <p className="text-xs font-semibold text-gray-500">
                            Amount
                          </p>
                          <p className="text-sm font-bold text-[#0B1E8A]">
                            Rs. {Number(expense.amount || 0).toLocaleString()}
                          </p>
                        </div>

                        <div className="rounded-xl bg-[#0B1E8A]/5 px-3 py-2">
                          <p className="text-xs font-semibold text-gray-500">
                            Vendor
                          </p>
                          <p className="text-sm font-bold text-[#0B1E8A]">
                            {expense.vendor || "-"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-[#0B1E8A]/5 px-3 py-2">
                          <p className="text-xs font-semibold text-gray-500">
                            Payment
                          </p>
                          <p className="text-sm font-bold text-[#0B1E8A]">
                            {expense.paymentMethod || "-"}
                          </p>
                        </div>
                      </div>

                      {expense.receiptUrl && (
                        <a
                          href={getReceiptUrl(expense.receiptUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#F36C21] hover:underline"
                        >
                          <Paperclip size={15} />
                          View Receipt
                        </a>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 lg:w-[220px]">
                      {canApproveRejectExpenses && isPending && (
                        <>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleApprove(expense._id)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1E8A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#08166f] disabled:opacity-60"
                          >
                            <CheckCircle2 size={16} />
                            Approve
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleReject(expense._id)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F36C21] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#d85f1b] disabled:opacity-60"
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                        </>
                      )}

                      {canCreateExpenses && (
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(expense._id)}
                          className="rounded-xl border border-[#0B1E8A]/15 px-4 py-2.5 text-sm font-semibold text-[#0B1E8A] hover:bg-[#0B1E8A]/5"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {canCreateExpenses && (
        <div className="bg-white rounded-3xl border border-[#0B1E8A]/10 p-6 shadow-sm">
          <h3 className="text-xl font-black text-[#0B1E8A] mb-4">
            Create Expense
          </h3>

          <form onSubmit={handleCreateExpense} className="space-y-4">
            <div>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Expense title"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F36C21]"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            <div>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                placeholder="Amount"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F36C21]"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>

            <div>
              <select
                value={form.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F36C21]"
              >
                {expenseCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category}</p>
              )}
            </div>

            <div>
              <input
                type="text"
                value={form.vendor}
                onChange={(e) => handleInputChange("vendor", e.target.value)}
                placeholder="Vendor"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F36C21]"
              />
              {errors.vendor && (
                <p className="mt-1 text-sm text-red-600">{errors.vendor}</p>
              )}
            </div>

            <div>
              <select
                value={form.paymentMethod}
                onChange={(e) =>
                  handleInputChange("paymentMethod", e.target.value)
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F36C21]"
              >
                {paymentMethods.map((method) => (
                  <option key={method || "empty"} value={method}>
                    {method || "Select payment method"}
                  </option>
                ))}
              </select>
              {errors.paymentMethod && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.paymentMethod}
                </p>
              )}
            </div>

            <div>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Description"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F36C21]"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
            </div>

            <div>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(e) =>
                  handleInputChange("receiptFile", e.target.files?.[0] || null)
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none"
              />
              {errors.receiptFile && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.receiptFile}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#F36C21] px-4 py-3 text-sm font-semibold text-white hover:bg-[#d85f1b] disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Create Expense"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ClubExpenses;