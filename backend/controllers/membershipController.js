import mongoose from "mongoose";
import Membership from "../models/Membership.js";
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

const getClubAndValidate = async (clubId) => {
  if (!isValidObjectId(clubId)) {
    return { error: { status: 400, message: "Invalid club ID" } };
  }

  const club = await Club.findById(clubId);
  if (!club) {
    return { error: { status: 404, message: "Club not found" } };
  }

  return { club };
};

const getActiveClubMember = (club, userId) => {
  if (!club?.members?.length || !userId) return null;

  return club.members.find((member) => {
    const status = String(member?.status || "").trim().toLowerCase();
    return member?.user && sameId(member.user, userId) && ["active", "approved"].includes(status);
  });
};

const isAssignedClubAdminForClub = (club, userId) =>
  Boolean(club?.clubAdmin?.user && sameId(club.clubAdmin.user, userId));

const canManageMembership = (req, club) => {
  const userRole = normalizeRole(req.user?.role);
  const userId = req.user?._id || req.user?.id;

  if (userRole === SYSTEM_ADMIN) return true;
  if (isAssignedClubAdminForClub(club, userId)) return true;
  if (club?.president?.user && sameId(club.president.user, userId)) return true;

  const member = getActiveClubMember(club, userId);
  return MANAGE_ROLES.includes(normalizeRole(member?.role));
};

const ensureClubMemberEntry = async (club, membership) => {
  const existingMember = club.members?.find((member) => sameId(member.user, membership.user));

  const mappedRole = normalizeRole(membership.role) === "EXECUTIVE_COMMITTEE_MEMBER"
    ? "executive"
    : String(membership.role || "MEMBER").trim().toLowerCase();

  if (existingMember) {
    existingMember.role = mappedRole;
    existingMember.status = "active";
    existingMember.joinedAt = existingMember.joinedAt || new Date();
  } else {
    club.members.push({
      user: membership.user,
      role: mappedRole,
      status: "active",
      joinedAt: new Date(),
    });
  }

  await club.save();
};

const removeClubMemberEntry = async (club, userId) => {
  club.members = (club.members || []).filter((member) => !sameId(member.user, userId));

  if (club?.president?.user && sameId(club.president.user, userId)) {
    club.president = undefined;
  }

  await club.save();
};

export const requestMembership = async (req, res) => {
  try {
    const { clubId } = req.params;
    const userId = req.user._id;

    const { club, error } = await getClubAndValidate(clubId);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const existing = await Membership.findOne({ club: clubId, user: userId });

    if (existing) {
      if (existing.status === "PENDING") {
        return res.status(400).json({ message: "Join request already pending" });
      }
      if (existing.status === "APPROVED") {
        return res.status(400).json({ message: "You are already a member of this club" });
      }

      existing.status = "PENDING";
      existing.role = "MEMBER";
      await existing.save();

      return res.status(200).json({
        message: "Join request submitted again",
        membership: existing,
      });
    }

    const membership = await Membership.create({
      club: clubId,
      user: userId,
      role: "MEMBER",
      status: "PENDING",
    });

    return res.status(201).json({
      message: "Join request submitted successfully",
      membership,
    });
  } catch (error) {
    console.error("requestMembership error:", error);
    res.status(500).json({ message: "Server error while requesting membership" });
  }
};

export const getClubMembers = async (req, res) => {
  try {
    const { clubId } = req.params;

    const { error } = await getClubAndValidate(clubId);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const members = await Membership.find({
      club: clubId,
      status: "APPROVED",
    }).populate("user", "fullName name email studentId profileImage");

    res.status(200).json(members);
  } catch (error) {
    console.error("getClubMembers error:", error);
    res.status(500).json({ message: "Failed to fetch members" });
  }
};

export const getPendingRequests = async (req, res) => {
  try {
    const { clubId } = req.params;

    const { club, error } = await getClubAndValidate(clubId);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    if (!canManageMembership(req, club)) {
      return res.status(403).json({ message: "Not authorized to view pending requests" });
    }

    const requests = await Membership.find({
      club: clubId,
      status: "PENDING",
    })
      .populate("user", "fullName name email profileImage avatar")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    console.error("getPendingRequests error:", error);
    res.status(500).json({ message: "Server error while fetching join requests" });
  }
};

export const approveMembership = async (req, res) => {
  try {
    const { clubId, memberId } = req.params;

    if (!isValidObjectId(memberId)) {
      return res.status(400).json({ message: "Invalid membership ID" });
    }

    const { club, error } = await getClubAndValidate(clubId);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    if (!canManageMembership(req, club)) {
      return res.status(403).json({ message: "Not authorized to approve membership requests" });
    }

    const membership = await Membership.findOne({
      _id: memberId,
      club: clubId,
    }).populate("user", "fullName name email");

    if (!membership) {
      return res.status(404).json({ message: "Membership request not found" });
    }

    membership.status = "APPROVED";
    await membership.save();

    await ensureClubMemberEntry(club, membership);

    res.status(200).json({
      message: "Member approved successfully",
      membership,
    });
  } catch (error) {
    console.error("approveMembership error:", error);
    res.status(500).json({ message: "Server error while approving member" });
  }
};

export const rejectMembership = async (req, res) => {
  try {
    const { clubId, memberId } = req.params;

    if (!isValidObjectId(memberId)) {
      return res.status(400).json({ message: "Invalid membership ID" });
    }

    const { club, error } = await getClubAndValidate(clubId);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    if (!canManageMembership(req, club)) {
      return res.status(403).json({ message: "Not authorized to reject membership requests" });
    }

    const membership = await Membership.findOne({
      _id: memberId,
      club: clubId,
    });

    if (!membership) {
      return res.status(404).json({ message: "Membership request not found" });
    }

    membership.status = "REJECTED";
    await membership.save();

    await removeClubMemberEntry(club, membership.user);

    res.status(200).json({ message: "Membership request rejected successfully" });
  } catch (error) {
    console.error("rejectMembership error:", error);
    res.status(500).json({ message: "Server error while rejecting request" });
  }
};

export const updateMemberRole = async (req, res) => {
  try {
    const { clubId, memberId } = req.params;
    const { role } = req.body;

    const allowedRoles = [
      "MEMBER",
      "PRESIDENT",
      "VICE_PRESIDENT",
      "SECRETARY",
      "ASSISTANT_SECRETARY",
      "TREASURER",
      "ASSISTANT_TREASURER",
      "EVENT_COORDINATOR",
      "PROJECT_COORDINATOR",
      "EXECUTIVE_COMMITTEE_MEMBER",
    ];

    const normalizedRole = normalizeRole(role);

    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (!isValidObjectId(memberId)) {
      return res.status(400).json({ message: "Invalid membership ID" });
    }

    const { club, error } = await getClubAndValidate(clubId);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    if (!canManageMembership(req, club)) {
      return res.status(403).json({ message: "Not authorized to update member roles" });
    }

    const membership = await Membership.findOne({
      _id: memberId,
      club: clubId,
      status: "APPROVED",
    }).populate("user", "fullName name email");

    if (!membership) {
      return res.status(404).json({ message: "Approved member not found" });
    }

    membership.role = normalizedRole;
    await membership.save();

    await ensureClubMemberEntry(club, membership);

    res.status(200).json({
      message: "Member role updated successfully",
      membership,
    });
  } catch (error) {
    console.error("updateMemberRole error:", error);
    res.status(500).json({ message: "Server error while updating role" });
  }
};

export const removeMember = async (req, res) => {
  try {
    const { clubId, memberId } = req.params;

    if (!isValidObjectId(memberId)) {
      return res.status(400).json({ message: "Invalid membership ID" });
    }

    const { club, error } = await getClubAndValidate(clubId);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    if (!canManageMembership(req, club)) {
      return res.status(403).json({ message: "Not authorized to remove members" });
    }

    const membership = await Membership.findOne({
      _id: memberId,
      club: clubId,
      status: "APPROVED",
    });

    if (!membership) {
      return res.status(404).json({ message: "Approved member not found" });
    }

    await Membership.deleteOne({ _id: memberId });
    await removeClubMemberEntry(club, membership.user);

    res.status(200).json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("removeMember error:", error);
    res.status(500).json({ message: "Server error while removing member" });
  }
};

export const getJoinStatus = async (req, res) => {
  try {
    const { clubId } = req.params;
    const userId = req.user._id;

    const membership = await Membership.findOne({
      club: clubId,
      user: userId,
    });

    if (!membership) {
      return res.status(200).json({ status: "NONE" });
    }

    res.status(200).json({
      status: membership.status,
      role: membership.role,
      membershipId: membership._id,
    });
  } catch (error) {
    console.error("getJoinStatus error:", error);
    res.status(500).json({ message: "Server error while checking join status" });
  }
};
