import jwt from "jsonwebtoken";
import User, { USER_ROLES } from "../models/User.js";
import Membership from "../models/Membership.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Normalize system role values
 */
const normalizeRole = (role) => {
  const value = String(role || "").trim().toUpperCase();

  if (value === "ADMIN") return "SYSTEM_ADMIN";

  return USER_ROLES.includes(value) ? value : "STUDENT";
};

/**
 * Normalize membership/club role values
 */
const normalizeClubRoleValue = (role) => {
  return String(role || "").trim().toUpperCase();
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

/**
 * Club membership role authorization middleware
 */
export const authorizeClubRole = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authorized" });
      }

      const { clubId } = req.params;

      const membership = await Membership.findOne({
        club: clubId,
        user: req.user._id,
        status: "APPROVED",
      });

      if (!membership) {
        return res.status(403).json({ message: "You are not a club member" });
      }

      const normalizedAllowedRoles = allowedRoles.map(normalizeClubRoleValue);
      const currentMembershipRole = normalizeClubRoleValue(membership.role);

      if (!normalizedAllowedRoles.includes(currentMembershipRole)) {
        return res.status(403).json({
          message: "You are not allowed to do this action",
        });
      }

      req.membership = membership;
      next();
    } catch (error) {
      console.error("authorizeClubRole error:", error.message);
      return res.status(500).json({ message: "Server error" });
    }
  };
};