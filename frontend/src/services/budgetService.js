import API from "../components/Auth/axios";

// Get budgets
export const getClubBudgets = async (clubId) => {
  const res = await API.get(`/budgets/club/${clubId}`);
  return res.data;
};

// Create budget
export const createBudgetRequest = async (data) => {
  const res = await API.post(`/budgets`, data);
  return res.data;
};


export const updateBudgetRequest = async (budgetId, data) => {
  const res = await API.put(`/budgets/${budgetId}`, data);
  return res.data;
};

// Approve
export const approveBudgetRequest = async (budgetId) => {
  const res = await API.put(`/budgets/${budgetId}/approve`);
  return res.data;
};

// Reject
export const rejectBudgetRequest = async (budgetId, data) => {
  const res = await API.put(`/budgets/${budgetId}/reject`, data);
  return res.data;
};