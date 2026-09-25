import { Navigate } from "react-router-dom";

const normalizeRole = (role) => {
  const value = String(role || "").trim().toUpperCase();
  if (value === "SYSTEM_ADMIN" || value === "ADMIN") return "SYSTEM_ADMIN";
  if (value === "CLUB_ADMIN") return "CLUB_ADMIN";
  return "STUDENT";
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const storedUser =
  JSON.parse(localStorage.getItem("userInfo")) ||
  JSON.parse(localStorage.getItem("user")) ||
  JSON.parse(localStorage.getItem("authUser")) ||
  {};
    const userRole = normalizeRole(storedUser?.role);
    const isAllowed = allowedRoles.map(normalizeRole).includes(userRole);

    if (!isAllowed) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
