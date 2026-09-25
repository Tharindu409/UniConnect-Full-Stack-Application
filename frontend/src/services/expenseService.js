import API from "../components/Auth/axios";

// Get all expenses / financial records for one club
export const getClubExpenses = async (clubId) => {
  const res = await API.get(`/expenses/club/${clubId}`);
  return res.data;
};

// Get single expense by id
export const getExpenseById = async (expenseId) => {
  const res = await API.get(`/expenses/${expenseId}`);
  return res.data;
};

// Create expense with multipart/form-data
export const createExpense = async (formData) => {
  const res = await API.post("/expenses", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

// Update expense with multipart/form-data
export const updateExpense = async (expenseId, formData) => {
  const res = await API.put(`/expenses/${expenseId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

// Delete expense
export const deleteExpense = async (expenseId) => {
  const res = await API.delete(`/expenses/${expenseId}`);
  return res.data;
};

// Approve expense
export const approveExpense = async (expenseId, payload = {}) => {
  const res = await API.put(`/expenses/${expenseId}/approve`, payload);
  return res.data;
};

// Reject expense
export const rejectExpense = async (expenseId, payload = {}) => {
  const res = await API.put(`/expenses/${expenseId}/reject`, payload);
  return res.data;
};