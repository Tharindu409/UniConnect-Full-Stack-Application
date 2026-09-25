import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import Club from "../models/Club.js";
import User from "../models/User.js";
import Membership from "../models/Membership.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const sameId = (a, b) => {
  if (!a || !b) return false;
  return String(a._id || a) === String(b._id || b);
};

const isSystemAdmin = (req) => normalizeText(req.user?.role) === "system_admin";

const cleanupUploadedFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("File cleanup error:", error.message);
  }
};

const normalizeRole = (role) =>
  typeof role === "string" ? role.trim().toLowerCase() : "";

const allowedMemberRoles = [
  "member",
  "executive",
  "vice_president",
  "president",
  "treasurer",
  "secretary",
  "assistant_secretary",
  "assistant_treasurer",
  "event_coordinator",
  "project_coordinator",
];

const singleHolderRoles = [
  "president",
  "vice_president",
  "secretary",
  "treasurer",
];

const clubAdminChildRoles = [
  "executive",
  "vice_president",
  "president",
  "treasurer",
  "secretary",
  "assistant_secretary",
  "assistant_treasurer",
  "event_coordinator",
  "project_coordinator",
];

const allowedCategories = [
  "Engineering",
  "Academic",
  "Environment",
  "Creative",
  "Business",
  "Cultural",
  "Sports",
  "Arts",
];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const buildConstitutionPayload = (file, userId, version = 1) => {
  if (!file) return null;

  return {
    fileUrl: `/uploads/${file.filename}`,
    fileName: file.originalname,
    filePath: file.path,
    uploadedAt: new Date(),
    uploadedBy: userId,
    version,
  };
};

const getAbsoluteConstitutionPath = (constitution = {}) => {
  if (constitution?.filePath) {
    return path.resolve(constitution.filePath);
  }

  if (constitution?.fileUrl) {
    const relativePath = String(constitution.fileUrl).replace(/^\/+/, "");
    return path.resolve(process.cwd(), relativePath);
  }

  return null;
};

const getAbsoluteLogoPath = (logo = "") => {
  if (!logo) return null;
  const relativePath = String(logo).replace(/^\/+/, "");
  return path.resolve(process.cwd(), relativePath);
};

const getActiveMembership = (club, userId) => {
  if (!club?.members || !Array.isArray(club.members)) return null;

  return (
    club.members.find(
      (m) =>
        m?.user &&
        sameId(m.user, userId) &&
        normalizeText(m.status) === "active"
    ) || null
  );
};

const getRequesterClubRole = (club, userId) => {
  const membership = getActiveMembership(club, userId);
  return membership?.role ? normalizeRole(membership.role) : null;
};

const isChildAdminRole = (role) =>
  clubAdminChildRoles.includes(normalizeRole(role));

const isAssignedClubAdminForClub = (club, userId) => {
  return Boolean(club?.clubAdmin?.user && sameId(club.clubAdmin.user, userId));
};

const canManageClub = (req, club) => {
  if (isSystemAdmin(req)) return true;

  const userId = req.user?._id || req.user?.id;

  if (isAssignedClubAdminForClub(club, userId)) return true;
  if (club?.president?.user && sameId(club.president.user, userId)) return true;

  const requesterRole = getRequesterClubRole(club, userId);

  return [
    "president",
    "vice_president",
    "treasurer",
    "secretary",
    "assistant_secretary",
    "assistant_treasurer",
    "event_coordinator",
    "project_coordinator",
    "executive",
  ].includes(requesterRole);
};

const canAccessClubDashboard = (req, club) => {
  if (isSystemAdmin(req)) return true;

  const userId = req.user?._id || req.user?.id;

  if (isAssignedClubAdminForClub(club, userId)) return true;
  if (club?.president?.user && sameId(club.president.user, userId)) return true;

  const membership = getActiveMembership(club, userId);
  return Boolean(membership);
};

const getMembershipRoleLabel = (req, club) => {
  if (isSystemAdmin(req)) return "SYSTEM_ADMIN";

  const userId = req.user?._id || req.user?.id;

  if (isAssignedClubAdminForClub(club, userId)) return "club_admin";
  if (club?.president?.user && sameId(club.president.user, userId)) {
    return "president";
  }

  const membership = getActiveMembership(club, userId);
  return membership?.role || "member";
};

const demoteExistingSingleRoleHolder = (club, roleToAssign, targetUserId) => {
  if (!singleHolderRoles.includes(roleToAssign)) return;

  club.members.forEach((member) => {
    if (
      !sameId(member.user, targetUserId) &&
      normalizeRole(member.role) === roleToAssign
    ) {
      member.role = "executive";
    }
  });
};

const syncPresidentReference = async (club, presidentUserId) => {
  if (!presidentUserId) {
    club.president = undefined;
    return;
  }

  const presidentUser = await User.findById(presidentUserId).select(
    "fullName email"
  );

  club.president = {
    user: presidentUserId,
    name: presidentUser?.fullName || "",
    email: presidentUser?.email || "",
  };
};

const ensurePresidentReferenceMatchesMembers = async (club) => {
  const currentPresident = club.members.find(
    (m) => normalizeRole(m.role) === "president"
  );

  if (currentPresident) {
    await syncPresidentReference(club, currentPresident.user);
  } else {
    club.president = undefined;
  }
};

const syncUserParentRoleById = async (userId) => {
  if (!userId || !isValidObjectId(userId)) return;

  const user = await User.findById(userId);
  if (!user) return;

  if (normalizeText(user.role) === "system_admin") {
    return;
  }

  const clubs = await Club.find({
    "members.user": user._id,
    "members.status": "active",
  }).select("members clubAdmin");

  let shouldBeClubAdmin = false;

  for (const club of clubs) {
    if (isAssignedClubAdminForClub(club, user._id)) {
      shouldBeClubAdmin = true;
      break;
    }

    const membership = club.members.find(
      (member) =>
        member?.user &&
        sameId(member.user, user._id) &&
        normalizeText(member.status) === "active"
    );

    if (membership && isChildAdminRole(membership.role)) {
      shouldBeClubAdmin = true;
      break;
    }
  }

  const nextRole = shouldBeClubAdmin ? "CLUB_ADMIN" : "STUDENT";

  if (user.role !== nextRole) {
    user.role = nextRole;
    await user.save();
  }
};

const syncParentRolesForClubMembers = async (club) => {
  if (!club?.members || !Array.isArray(club.members)) return;

  const uniqueUserIds = [
    ...new Set(
      club.members
        .filter((member) => member?.user)
        .map((member) => String(member.user._id || member.user))
    ),
  ];

  for (const userId of uniqueUserIds) {
    await syncUserParentRoleById(userId);
  }
};

// ==================== MEMBERSHIP COLLECTION SYNC HELPERS ====================

const mapClubRoleToMembershipRole = (role) => {
  const normalized = normalizeRole(role);

  switch (normalized) {
    case "president":
      return "PRESIDENT";
    case "vice_president":
      return "VICE_PRESIDENT";
    case "secretary":
      return "SECRETARY";
    case "assistant_secretary":
      return "ASSISTANT_SECRETARY";
    case "treasurer":
      return "TREASURER";
    case "assistant_treasurer":
      return "ASSISTANT_TREASURER";
    case "event_coordinator":
      return "EVENT_COORDINATOR";
    case "project_coordinator":
      return "PROJECT_COORDINATOR";
    case "executive":
      return "EXECUTIVE_COMMITTEE_MEMBER";
    case "member":
    default:
      return "MEMBER";
  }
};

const mapClubStatusToMembershipStatus = (status) => {
  const normalized = normalizeText(status);

  if (normalized === "active") return "APPROVED";
  if (normalized === "pending") return "PENDING";
  if (normalized === "rejected") return "REJECTED";
  return "PENDING";
};

const syncMembershipForClubMember = async (clubId, member) => {
  const userId = member?.user?._id || member?.user;

  if (!clubId || !userId || !isValidObjectId(clubId) || !isValidObjectId(userId)) {
    return;
  }

  await Membership.findOneAndUpdate(
    {
      club: clubId,
      user: userId,
    },
    {
      club: clubId,
      user: userId,
      role: mapClubRoleToMembershipRole(member.role),
      status: mapClubStatusToMembershipStatus(member.status),
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
};

const syncMembershipsForClub = async (club) => {
  if (!club?._id || !Array.isArray(club.members)) return;

  for (const member of club.members) {
    await syncMembershipForClubMember(club._id, member);
  }
};

const deleteMembershipForClubUser = async (clubId, userId) => {
  if (!clubId || !userId || !isValidObjectId(clubId) || !isValidObjectId(userId)) {
    return;
  }

  await Membership.deleteOne({
    club: clubId,
    user: userId,
  });
};

// ==================== CLUB MANAGEMENT ====================

// Create Club
export const createClub = async (req, res) => {
  try {
    const { name, description, category, presidentName, presidentEmail, tags } =
      req.body;

    const logoFile = req.files?.logo?.[0] || null;
    const constitutionFile = req.files?.constitution?.[0] || null;

    if (!name || !String(name).trim()) {
      cleanupUploadedFile(logoFile?.path);
      cleanupUploadedFile(constitutionFile?.path);
      return res.status(400).json({
        success: false,
        message: "Club name is required",
      });
    }

    if (!description || !String(description).trim()) {
      cleanupUploadedFile(logoFile?.path);
      cleanupUploadedFile(constitutionFile?.path);
      return res.status(400).json({
        success: false,
        message: "Description is required",
      });
    }

    if (!category || !allowedCategories.includes(category)) {
      cleanupUploadedFile(logoFile?.path);
      cleanupUploadedFile(constitutionFile?.path);
      return res.status(400).json({
        success: false,
        message: `Invalid category. Allowed: ${allowedCategories.join(", ")}`,
      });
    }

    if (!presidentName || !String(presidentName).trim()) {
      cleanupUploadedFile(logoFile?.path);
      cleanupUploadedFile(constitutionFile?.path);
      return res.status(400).json({
        success: false,
        message: "President name is required",
      });
    }

    if (!presidentEmail || !String(presidentEmail).trim()) {
      cleanupUploadedFile(logoFile?.path);
      cleanupUploadedFile(constitutionFile?.path);
      return res.status(400).json({
        success: false,
        message: "President email is required",
      });
    }

    const normalizedPresidentEmail = String(presidentEmail).trim().toLowerCase();

    if (!emailRegex.test(normalizedPresidentEmail)) {
      cleanupUploadedFile(logoFile?.path);
      cleanupUploadedFile(constitutionFile?.path);
      return res.status(400).json({
        success: false,
        message: "Invalid president email",
      });
    }

    const normalizedName = String(name).trim();

    const existingClub = await Club.findOne({ name: normalizedName });
    if (existingClub) {
      cleanupUploadedFile(logoFile?.path);
      cleanupUploadedFile(constitutionFile?.path);
      return res.status(400).json({
        success: false,
        message: "Club with this name already exists",
      });
    }

    const logo = logoFile ? `/uploads/${logoFile.filename}` : "";
    const constitutionData = buildConstitutionPayload(
      constitutionFile,
      req.user.id,
      1
    );

    let presidentUser = await User.findOne({ email: normalizedPresidentEmail });

    if (!presidentUser) {
      const tempPassword = Math.random().toString(36).slice(-8);

      presidentUser = await User.create({
        fullName: String(presidentName).trim(),
        email: normalizedPresidentEmail,
        password: tempPassword,
        role: "CLUB_ADMIN",
        studentId: `TEMP${Date.now()}`,
        faculty: "To be updated",
        yearOfStudy: "To be updated",
        isActive: true,
        isEmailVerified: false,
      });
    } else if (normalizeText(presidentUser.role) !== "system_admin") {
      presidentUser.role = "CLUB_ADMIN";
      await presidentUser.save();
    }

    const normalizedTags = Array.isArray(tags)
      ? tags.map((tag) => String(tag).trim()).filter(Boolean)
      : typeof tags === "string"
      ? tags
          .split(",")
          .map((tag) => String(tag).trim())
          .filter(Boolean)
      : [];

    const club = new Club({
      name: normalizedName,
      description: String(description).trim(),
      category,
      tags: normalizedTags,
      logo,
      constitution: constitutionData,
      president: {
        user: presidentUser._id,
        name: presidentUser.fullName,
        email: presidentUser.email,
      },
      createdBy: req.user.id,
      status: "pending",
      members: [
        {
          user: presidentUser._id,
          role: "president",
          status: "active",
          joinedAt: new Date(),
        },
      ],
    });

    await club.save();
    await syncMembershipsForClub(club);
    await syncUserParentRoleById(presidentUser._id);

    res.status(201).json({
      success: true,
      message: constitutionData && logo
        ? "Club, logo, and constitution uploaded successfully, pending approval"
        : constitutionData
        ? "Club and constitution uploaded successfully, pending approval"
        : logo
        ? "Club and logo uploaded successfully, pending approval"
        : "Club created successfully and pending approval",
      data: club,
    });
  } catch (error) {
    console.error("Error creating club:", error);
    cleanupUploadedFile(req.files?.logo?.[0]?.path);
    cleanupUploadedFile(req.files?.constitution?.[0]?.path);

    res.status(500).json({
      success: false,
      message: "Failed to create club",
      error: error.message,
    });
  }
};

// Get all clubs
export const getAllClubs = async (req, res) => {
  try {
    const clubs = await Club.find({})
      .populate("members.user", "fullName email role")
      .populate("president.user", "fullName email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: clubs,
    });
  } catch (error) {
    console.error("Error fetching clubs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch clubs",
      error: error.message,
    });
  }
};

// Get active clubs only
export const getActiveClubs = async (req, res) => {
  try {
    const clubs = await Club.find({ status: "active" })
      .populate("members.user", "fullName email role")
      .populate("president.user", "fullName email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: clubs,
    });
  } catch (error) {
    console.error("Error fetching active clubs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch active clubs",
      error: error.message,
    });
  }
};

// Get only pending clubs
export const getPendingClubs = async (req, res) => {
  try {
    const clubs = await Club.find({ status: "pending" })
      .populate("members.user", "fullName email role")
      .populate("president.user", "fullName email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: clubs,
    });
  } catch (error) {
    console.error("Error fetching pending clubs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending clubs",
      error: error.message,
    });
  }
};

// Get club by ID
export const getClubById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid club ID",
      });
    }

    const club = await Club.findById(id)
      .populate("members.user", "fullName email role")
      .populate("president.user", "fullName email role")
      .populate("joinRequests.user", "fullName email studentId role");

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    res.status(200).json({
      success: true,
      data: club,
    });
  } catch (error) {
    console.error("Error fetching club:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch club",
      error: error.message,
    });
  }
};

// Get club dashboard
export const getClubDashboard = async (req, res) => {
  try {
    const { clubId } = req.params;

    if (!isValidObjectId(clubId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid club ID",
      });
    }

    const club = await Club.findById(clubId)
      .populate("members.user", "fullName email role")
      .populate("president.user", "fullName email role");

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    if (!canAccessClubDashboard(req, club)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this club dashboard",
      });
    }

    const userId = req.user?._id || req.user?.id;
    const membership = getActiveMembership(club, userId);

    const isMember = !!membership;
    const isPresident =
      club?.president?.user && sameId(club.president.user, userId);
    const isSysAdmin = isSystemAdmin(req);

    const memberCount = club.members.filter(
      (member) => normalizeText(member.status) === "active"
    ).length;

    const pendingJoinRequestCount = Array.isArray(club.joinRequests)
      ? club.joinRequests.filter(
          (request) => normalizeText(request.status) === "pending"
        ).length
      : 0;

    const permissions = {
      canManageClub: canManageClub(req, club),
      isSystemAdmin: isSysAdmin,
      isAssignedClubAdmin: isAssignedClubAdminForClub(club, userId),
      parentRole: req.user?.role || "STUDENT",
    };

    res.status(200).json({
      success: true,
      data: {
        club: {
          _id: club._id,
          name: club.name,
          description: club.description,
          category: club.category,
          status: club.status,
          logo: club.logo || null,
          president: club.president,
          constitution: club.constitution || null,
          memberCount,
          pendingJoinRequestCount,
        },
        membership: {
          isMember: isMember || isPresident || isSysAdmin,
          role: getMembershipRoleLabel(req, club),
          parentRole: req.user?.role || "STUDENT",
        },
        permissions,
        stats: {
          activeElections: 0,
          upcomingEvents: 0,
          activeMentorships: 0,
          expenses: 0,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching club dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch club dashboard",
      error: error.message,
    });
  }
};

// Update club
export const updateClub = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, tags } = req.body;

    if (!isValidObjectId(id)) {
      cleanupUploadedFile(req.file?.path);
      return res.status(400).json({
        success: false,
        message: "Invalid club ID",
      });
    }

    const club = await Club.findById(id);

    if (!club) {
      cleanupUploadedFile(req.file?.path);
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    if (!canManageClub(req, club)) {
      cleanupUploadedFile(req.file?.path);
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this club",
      });
    }

    if (name !== undefined) {
      const normalizedName = String(name).trim();

      if (!normalizedName) {
        cleanupUploadedFile(req.file?.path);
        return res.status(400).json({
          success: false,
          message: "Club name cannot be empty",
        });
      }

      const duplicate = await Club.findOne({
        name: normalizedName,
        _id: { $ne: id },
      });

      if (duplicate) {
        cleanupUploadedFile(req.file?.path);
        return res.status(400).json({
          success: false,
          message: "Another club with this name already exists",
        });
      }

      club.name = normalizedName;
    }

    if (description !== undefined) {
      const normalizedDescription = String(description).trim();

      if (!normalizedDescription) {
        cleanupUploadedFile(req.file?.path);
        return res.status(400).json({
          success: false,
          message: "Description cannot be empty",
        });
      }

      club.description = normalizedDescription;
    }

    if (category !== undefined) {
      if (!allowedCategories.includes(category)) {
        cleanupUploadedFile(req.file?.path);
        return res.status(400).json({
          success: false,
          message: `Invalid category. Allowed: ${allowedCategories.join(", ")}`,
        });
      }

      club.category = category;
    }

    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        club.tags = tags.map((tag) => String(tag).trim()).filter(Boolean);
      } else if (typeof tags === "string") {
        club.tags = tags
          .split(",")
          .map((tag) => String(tag).trim())
          .filter(Boolean);
      } else {
        cleanupUploadedFile(req.file?.path);
        return res.status(400).json({
          success: false,
          message: "Tags must be an array or comma separated string",
        });
      }
    }

    if (req.file) {
      const oldLogoPath = getAbsoluteLogoPath(club.logo);

      club.logo = `/uploads/${req.file.filename}`;

      if (
        oldLogoPath &&
        oldLogoPath !== path.resolve(req.file.path) &&
        fs.existsSync(oldLogoPath)
      ) {
        cleanupUploadedFile(oldLogoPath);
      }
    }

    await club.save();

    res.status(200).json({
      success: true,
      message: "Club updated successfully",
      data: club,
    });
  } catch (error) {
    console.error("Error updating club:", error);
    cleanupUploadedFile(req.file?.path);
    res.status(500).json({
      success: false,
      message: "Failed to update club",
      error: error.message,
    });
  }
};

// Upload constitution
export const uploadConstitution = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      cleanupUploadedFile(req.file?.path);
      return res.status(400).json({
        success: false,
        message: "Invalid club ID",
      });
    }

    const club = await Club.findById(id);

    if (!club) {
      cleanupUploadedFile(req.file?.path);
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    if (!canManageClub(req, club)) {
      cleanupUploadedFile(req.file?.path);
      return res.status(403).json({
        success: false,
        message: "You are not authorized to upload constitution",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No constitution file uploaded",
      });
    }

    const oldConstitution = club.constitution;
    const nextVersion = (club.constitution?.version || 0) + 1;

    club.constitution = buildConstitutionPayload(req.file, req.user.id, nextVersion);

    await club.save();

    const oldAbsolutePath = getAbsoluteConstitutionPath(oldConstitution);
    if (oldAbsolutePath && oldAbsolutePath !== path.resolve(req.file.path)) {
      cleanupUploadedFile(oldAbsolutePath);
    }

    res.status(200).json({
      success: true,
      message: "Constitution uploaded successfully",
      data: club.constitution,
    });
  } catch (error) {
    console.error("Error uploading constitution:", error);
    cleanupUploadedFile(req.file?.path);
    res.status(500).json({
      success: false,
      message: "Failed to upload constitution",
      error: error.message,
    });
  }
};

// Download constitution
export const downloadConstitution = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid club ID",
      });
    }

    const club = await Club.findById(id).select("name constitution status");

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    if (!club.constitution?.filePath && !club.constitution?.fileUrl) {
      return res.status(404).json({
        success: false,
        message: "Constitution not uploaded for this club",
      });
    }

    const absolutePath = getAbsoluteConstitutionPath(club.constitution);

    if (!absolutePath || !fs.existsSync(absolutePath)) {
      return res.status(404).json({
        success: false,
        message: "Constitution file not found on server",
      });
    }

    return res.download(
      absolutePath,
      club.constitution.fileName || `${club.name}-constitution.pdf`
    );
  } catch (error) {
    console.error("Error downloading constitution:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download constitution",
      error: error.message,
    });
  }
};

// Get club members
export const getClubMembers = async (req, res) => {
  try {
    const { clubId } = req.params;

    if (!isValidObjectId(clubId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid club ID",
      });
    }

    const club = await Club.findById(clubId).populate(
      "members.user",
      "fullName name email studentId role"
    );

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    if (!canManageClub(req, club) && !isSystemAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view club members",
      });
    }

    const normalizedMembers = (club.members || []).map((member) => ({
      membershipId: String(member.user?._id || member.user || ""),
      user: member.user || null,
      role: member.role || "member",
      status: member.status || "active",
      joinedAt: member.joinedAt || null,
    }));

    res.status(200).json({
      success: true,
      data: normalizedMembers,
    });
  } catch (error) {
    console.error("Error fetching club members:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch club members",
      error: error.message,
    });
  }
};

// Add member
export const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;

    if (!isValidObjectId(id) || !isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid club ID or user ID",
      });
    }

    const normalizedRole = role ? normalizeRole(role) : "member";

    if (!allowedMemberRoles.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed: ${allowedMemberRoles.join(", ")}`,
      });
    }

    const club = await Club.findById(id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    if (!canManageClub(req, club)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to add members",
      });
    }

    const userExists = await User.findById(userId);

    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const alreadyMember = club.members.some((m) => sameId(m.user, userId));

    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: "User is already a member",
      });
    }

    demoteExistingSingleRoleHolder(club, normalizedRole, userId);

    club.members.push({
      user: userId,
      role: normalizedRole,
      status: "active",
      joinedAt: new Date(),
    });

    if (normalizedRole === "president") {
      await syncPresidentReference(club, userExists._id);
    }

    await club.save();
    await syncMembershipsForClub(club);
    await syncUserParentRoleById(userId);
    await syncParentRolesForClubMembers(club);

    res.status(200).json({
      success: true,
      message: "Member added successfully",
      data: club,
    });
  } catch (error) {
    console.error("Error adding member:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add member",
      error: error.message,
    });
  }
};

// Remove member
export const removeMember = async (req, res) => {
  try {
    const { id } = req.params;
    const targetUserId = req.params.userId || req.params.memberId;

    if (!isValidObjectId(id) || !isValidObjectId(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid club ID or user ID",
      });
    }

    const club = await Club.findById(id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    if (!canManageClub(req, club)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to remove members",
      });
    }

    const memberExists = club.members.some((m) => sameId(m.user, targetUserId));

    if (!memberExists) {
      return res.status(404).json({
        success: false,
        message: "User is not a member of this club",
      });
    }

    const isCurrentPresident =
      club.president?.user && sameId(club.president.user, targetUserId);

    if (isCurrentPresident) {
      return res.status(400).json({
        success: false,
        message: "Cannot remove the current president. Assign a new president first.",
      });
    }

    club.members = club.members.filter((m) => !sameId(m.user, targetUserId));
    await ensurePresidentReferenceMatchesMembers(club);
    await club.save();
    await deleteMembershipForClubUser(id, targetUserId);
    await syncUserParentRoleById(targetUserId);

    res.status(200).json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Error removing member:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove member",
      error: error.message,
    });
  }
};

// Update member role
export const updateMemberRole = async (req, res) => {
  try {
    const { clubId } = req.params;
    const targetUserId = req.params.userId || req.params.memberId;
    const { role } = req.body;

    if (!isValidObjectId(clubId) || !isValidObjectId(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid club ID or user ID",
      });
    }

    const normalizedRole = normalizeRole(role);

    if (!normalizedRole || !allowedMemberRoles.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed: ${allowedMemberRoles.join(", ")}`,
      });
    }

    const club = await Club.findById(clubId);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    if (!canManageClub(req, club)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to change member roles",
      });
    }

    const member = club.members.find((m) => sameId(m.user, targetUserId));

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "User is not a member of this club",
      });
    }

    const previousRole = normalizeRole(member.role);

    demoteExistingSingleRoleHolder(club, normalizedRole, targetUserId);
    member.role = normalizedRole;

    if (normalizedRole === "president") {
      await syncPresidentReference(club, targetUserId);
    }

    if (previousRole === "president" && normalizedRole !== "president") {
      await ensurePresidentReferenceMatchesMembers(club);
    }

    await club.save();
    await syncMembershipsForClub(club);
    await syncParentRolesForClubMembers(club);

    res.status(200).json({
      success: true,
      message: "Member role updated successfully",
      data: member,
    });
  } catch (error) {
    console.error("Error updating member role:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update member role",
      error: error.message,
    });
  }
};

// Approve club
export const approveClub = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid club ID",
      });
    }

    const club = await Club.findById(id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    club.status = "active";
    club.approvedAt = new Date();
    club.approvedBy = req.user.id;
    club.rejectionReason = "";

    await club.save();
    await syncMembershipsForClub(club);

    res.status(200).json({
      success: true,
      message: "Club approved successfully",
      data: club,
    });
  } catch (error) {
    console.error("Error approving club:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve club",
      error: error.message,
    });
  }
};

// Reject club
export const rejectClub = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid club ID",
      });
    }

    const club = await Club.findById(id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    club.status = "rejected";
    club.rejectionReason = reason?.trim() || "No reason provided";

    await club.save();
    await syncMembershipsForClub(club);

    res.status(200).json({
      success: true,
      message: "Club rejected successfully",
      data: club,
    });
  } catch (error) {
    console.error("Error rejecting club:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject club",
      error: error.message,
    });
  }
};

// Delete club
export const deleteClub = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid club ID",
      });
    }

    const club = await Club.findById(id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    const oldConstitution = club.constitution;
    const oldLogo = club.logo;

    const affectedUserIds = [
      ...new Set(
        (club.members || [])
          .filter((member) => member?.user)
          .map((member) => String(member.user._id || member.user))
      ),
    ];

    await Membership.deleteMany({ club: id });
    await club.deleteOne();

    const oldAbsolutePath = getAbsoluteConstitutionPath(oldConstitution);
    if (oldAbsolutePath) {
      cleanupUploadedFile(oldAbsolutePath);
    }

    const oldLogoPath = getAbsoluteLogoPath(oldLogo);
    if (oldLogoPath) {
      cleanupUploadedFile(oldLogoPath);
    }

    for (const affectedUserId of affectedUserIds) {
      await syncUserParentRoleById(affectedUserId);
    }

    res.status(200).json({
      success: true,
      message: "Club deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting club:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete club",
      error: error.message,
    });
  }
};

// ==================== MY CLUBS ====================

export const getMyClubs = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    const clubs = await Club.find({
      members: {
        $elemMatch: {
          user: userId,
          status: "active",
        },
      },
    })
      .populate("members.user", "fullName email role")
      .populate("president.user", "fullName email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: clubs.length,
      data: clubs,
    });
  } catch (error) {
    console.error("Error fetching my clubs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your clubs",
      error: error.message,
    });
  }
};

// ==================== JOIN REQUEST CONTROLLERS ====================

export const requestJoinClub = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid club ID",
      });
    }

    const club = await Club.findById(id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    if (club.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "This club is not accepting new members",
      });
    }

    club.addJoinRequest(req.user.id);
    await club.save();

    await Membership.findOneAndUpdate(
      {
        club: club._id,
        user: req.user.id,
      },
      {
        club: club._id,
        user: req.user.id,
        role: "MEMBER",
        status: "PENDING",
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Join request sent successfully",
      data: {
        clubId: club._id,
        clubName: club.name,
        status: "pending",
      },
    });
  } catch (error) {
    console.error("Error requesting to join club:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to send join request",
    });
  }
};

export const getJoinRequests = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid club ID",
      });
    }

    const club = await Club.findById(id).populate(
      "joinRequests.user",
      "fullName email studentId faculty yearOfStudy role"
    );

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    if (!canManageClub(req, club) && !isSystemAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Only club managers or system admin can view join requests",
      });
    }

    const pendingRequests = club.joinRequests.filter(
      (r) => normalizeText(r.status) === "pending"
    );

    res.status(200).json({
      success: true,
      data: pendingRequests,
      total: pendingRequests.length,
    });
  } catch (error) {
    console.error("Error fetching join requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch join requests",
      error: error.message,
    });
  }
};

export const getAllJoinRequests = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid club ID",
      });
    }

    const club = await Club.findById(id)
      .populate(
        "joinRequests.user",
        "fullName email studentId faculty yearOfStudy role"
      )
      .populate("joinRequests.approvedBy", "fullName email role")
      .populate("joinRequests.rejectedBy", "fullName email role");

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    if (!canManageClub(req, club) && !isSystemAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Only club managers or system admin can view join requests",
      });
    }

    let requests = club.joinRequests;

    if (status && status !== "all") {
      requests = requests.filter(
        (r) => normalizeText(r.status) === normalizeText(status)
      );
    }

    res.status(200).json({
      success: true,
      data: requests,
      total: requests.length,
      summary: {
        pending: club.joinRequests.filter(
          (r) => normalizeText(r.status) === "pending"
        ).length,
        approved: club.joinRequests.filter(
          (r) => normalizeText(r.status) === "approved"
        ).length,
        rejected: club.joinRequests.filter(
          (r) => normalizeText(r.status) === "rejected"
        ).length,
      },
    });
  } catch (error) {
    console.error("Error fetching all join requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch join requests",
      error: error.message,
    });
  }
};

export const approveJoinRequest = async (req, res) => {
  try {
    const { clubId, requestId } = req.params;

    if (!isValidObjectId(clubId) || !isValidObjectId(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid club ID or request ID",
      });
    }

    const club = await Club.findById(clubId);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    if (!canManageClub(req, club) && !isSystemAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Only club managers or system admin can approve requests",
      });
    }

    club.approveJoinRequest(requestId, req.user.id);
    await club.save();

    const approvedRequest = club.joinRequests.id(requestId);
    const approvedUser = await User.findById(approvedRequest.user).select(
      "fullName email role"
    );

    const approvedMember = club.members.find((m) =>
      sameId(m.user, approvedRequest.user)
    );

    if (approvedMember) {
      await syncMembershipForClubMember(club._id, approvedMember);
    } else {
      await Membership.findOneAndUpdate(
        {
          club: club._id,
          user: approvedRequest.user,
        },
        {
          club: club._id,
          user: approvedRequest.user,
          role: "MEMBER",
          status: "APPROVED",
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
    }

    await syncUserParentRoleById(approvedRequest.user);

    res.status(200).json({
      success: true,
      message: "Join request approved",
      data: {
        userId: approvedRequest.user,
        userName: approvedUser?.fullName,
        userEmail: approvedUser?.email,
        joinedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error approving join request:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to approve request",
    });
  }
};

export const rejectJoinRequest = async (req, res) => {
  try {
    const { clubId, requestId } = req.params;
    const { reason } = req.body;

    if (!isValidObjectId(clubId) || !isValidObjectId(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid club ID or request ID",
      });
    }

    const club = await Club.findById(clubId);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    if (!canManageClub(req, club) && !isSystemAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Only club managers or system admin can reject requests",
      });
    }

    const existingRequest = club.joinRequests.id(requestId);
    const rejectedUserId = existingRequest?.user;

    club.rejectJoinRequest(requestId, req.user.id, reason);
    await club.save();

    if (rejectedUserId) {
      await Membership.findOneAndUpdate(
        {
          club: club._id,
          user: rejectedUserId,
        },
        {
          club: club._id,
          user: rejectedUserId,
          role: "MEMBER",
          status: "REJECTED",
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
    }

    res.status(200).json({
      success: true,
      message: "Join request rejected",
    });
  } catch (error) {
    console.error("Error rejecting join request:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to reject request",
    });
  }
};

export const checkJoinStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid club ID",
      });
    }

    const club = await Club.findById(id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    const userId = req.user?._id || req.user?.id;

    const isMember = club.isMember(userId);
    const hasPendingRequest = club.hasPendingJoinRequest(userId);

    let requestStatus = "none";
    let request = null;

    if (isMember) {
      requestStatus = "member";
    } else if (hasPendingRequest) {
      requestStatus = "pending";
      request = club.joinRequests.find(
        (r) => sameId(r.user, userId) && normalizeText(r.status) === "pending"
      );
    } else {
      const rejectedRequest = club.joinRequests.find(
        (r) => sameId(r.user, userId) && normalizeText(r.status) === "rejected"
      );
      if (rejectedRequest) {
        requestStatus = "rejected";
        request = rejectedRequest;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        status: requestStatus,
        request: request
          ? {
              id: request._id,
              requestedAt: request.requestedAt,
              rejectionReason: request.rejectionReason,
            }
          : null,
        isMember,
        hasPendingRequest,
        parentRole: req.user?.role || "STUDENT",
      },
    });
  } catch (error) {
    console.error("Error checking join status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check join status",
      error: error.message,
    });
  }
};

export const cancelJoinRequest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid club ID",
      });
    }

    const club = await Club.findById(id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    const userId = req.user?._id || req.user?.id;

    const requestIndex = club.joinRequests.findIndex(
      (r) => sameId(r.user, userId) && normalizeText(r.status) === "pending"
    );

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "No pending join request found",
      });
    }

    club.joinRequests.splice(requestIndex, 1);
    await club.save();
    await deleteMembershipForClubUser(club._id, userId);

    res.status(200).json({
      success: true,
      message: "Join request cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling join request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel join request",
      error: error.message,
    });
  }
};