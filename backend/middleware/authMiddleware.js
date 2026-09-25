import jwt from "jsonwebtoken";
import User, { USER_ROLES } from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Normalize role values (handles dirty DB values safely)
 */
const normalizeRole = (role) => {
  const value = String(role || "").trim().toUpperCase();

  // Alias support
  if (value === "ADMIN") return "SYSTEM_ADMIN";

  return USER_ROLES.includes(value) ? value : "STUDENT";
};

/**
 * Role helpers
 */
export const isSystemAdminRole = (role) =>
  normalizeRole(role) === "SYSTEM_ADMIN";

export const isClubAdminRole = (role) =>
  normalizeRole(role) === "CLUB_ADMIN";

export const isStudentRole = (role) =>
  normalizeRole(role) === "STUDENT";

/**
 * Protect middleware (JWT authentication)
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "Not authorized, no token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "Not authorized, user not found",
      });
    }

    // Normalize role (CRITICAL 🔥)
    user.role = normalizeRole(user.role);

    req.user = user;

    next();
  } catch (error) {
    console.error("Auth error:", error.message);

    return res.status(401).json({
      message: "Not authorized, invalid or expired token",
    });
  }
};

/**
 * Role-based authorization middleware
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Not authorized, no user found",
      });
    }

    const allowedRoles = roles.map(normalizeRole);
    const currentRole = normalizeRole(req.user.role);

    if (!allowedRoles.includes(currentRole)) {
      return res.status(403).json({
        message: `Forbidden: requires one of [${allowedRoles.join(", ")}]`,
      });
    }

    next();
  };
};