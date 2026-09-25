import mongoose from "mongoose";
import ClubMeeting from "../models/ClubMeeting.js";
import Club from "../models/Club.js";

const SYSTEM_ADMIN = "SYSTEM_ADMIN";

const ROLE_ALIASES = {
  EXECUTIVE: "EXECUTIVE_COMMITTEE_MEMBER",
};

const MEETING_MANAGER_ROLES = [
  "PRESIDENT",
  "VICE_PRESIDENT",
  "SECRETARY",
  "TREASURER",
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

const sameId = (a, b) => String(a?._id || a) === String(b?._id || b);

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const isSystemAdmin = (user) => normalizeRole(user?.role) === SYSTEM_ADMIN;

const getActiveClubMember = (club, userId) => {
  if (!club?.members?.length || !userId) return null;

  return club.members.find((member) => {
    const status = String(member?.status || "").trim().toLowerCase();
    return member?.user && sameId(member.user, userId) && ["active", "approved"].includes(status);
  });
};

const isAssignedClubAdminForClub = (club, userId) =>
  Boolean(club?.clubAdmin?.user && sameId(club.clubAdmin.user, userId));

const canManageClubMeetings = async (user, clubId) => {
  const club = await Club.findById(clubId);
  if (!club) return false;

  if (isAssignedClubAdminForClub(club, user?._id)) return true;
  if (club?.president?.user && sameId(club.president.user, user?._id)) return true;

  const member = getActiveClubMember(club, user?._id);
  if (!member) return false;

  return MEETING_MANAGER_ROLES.includes(normalizeRole(member.role));
};

const ensureMeetingDates = (startDate, endDate, { allowPastStart = false } = {}) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { error: "Invalid meeting start/end date" };
  }

  if (!allowPastStart && start < new Date()) {
    return { error: "Meeting start date/time cannot be in the past" };
  }

  if (end <= start) {
    return { error: "End date/time must be after start date/time" };
  }

  return { start, end };
};

export const createClubMeeting = async (req, res) => {
  try {
    const { club, title, description, category, venue, startDate, endDate } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!club || !title || !description || !category || !venue || !startDate || !endDate) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    if (!isValidObjectId(club)) {
      return res.status(400).json({ message: "Invalid club ID" });
    }

    const existingClub = await Club.findById(club);
    if (!existingClub) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (isSystemAdmin(req.user)) {
      return res.status(403).json({ message: "System admin cannot create meeting requests" });
    }

    const allowed = await canManageClubMeetings(req.user, club);
    if (!allowed) {
      return res.status(403).json({
        message:
          "Only club admin and authorized club officers can create meeting requests",
      });
    }

    const dateCheck = ensureMeetingDates(startDate, endDate);
    if (dateCheck.error) {
      return res.status(400).json({ message: dateCheck.error });
    }

    const imagePath = req.file?.filename ? `/uploads/${req.file.filename}` : "";

    const meeting = await ClubMeeting.create({
      club,
      title: title.trim(),
      description: description.trim(),
      category,
      venue: venue.trim(),
      startDate: dateCheck.start,
      endDate: dateCheck.end,
      image: imagePath,
      approvalStatus: "pending",
      approvalComment: "",
      createdBy: req.user._id,
    });

    const populated = await ClubMeeting.findById(meeting._id)
      .populate("club", "name")
      .populate("createdBy", "fullName email")
      .populate("approvedBy", "fullName email")
      .populate("rejectedBy", "fullName email");

    return res.status(201).json({
      message: "Meeting request submitted for approval",
      meeting: populated,
    });
  } catch (error) {
    console.error("createClubMeeting error:", error);
    return res.status(500).json({ message: error.message || "Failed to create meeting" });
  }
};

export const getClubMeetings = async (req, res) => {
  try {
    const { clubId } = req.params;

    if (!isValidObjectId(clubId)) {
      return res.status(400).json({ message: "Invalid club ID" });
    }

    const filter = { club: clubId };

    if (isSystemAdmin(req.user)) {
      filter.approvalStatus = "pending";
    } else {
      const allowed = await canManageClubMeetings(req.user, clubId);
      if (!allowed) {
        filter.approvalStatus = "approved";
      }
    }

    const meetings = await ClubMeeting.find(filter)
      .populate("club", "name")
      .populate("createdBy", "fullName email")
      .populate("approvedBy", "fullName email")
      .populate("rejectedBy", "fullName email")
      .sort({ createdAt: -1 });

    return res.status(200).json(meetings);
  } catch (error) {
    console.error("getClubMeetings error:", error);
    return res.status(500).json({ message: "Failed to fetch meetings" });
  }
};

export const getPendingClubMeetings = async (req, res) => {
  try {
    if (!isSystemAdmin(req.user)) {
      return res.status(403).json({ message: "Only system admin can view pending meetings" });
    }

    const meetings = await ClubMeeting.find({ approvalStatus: "pending" })
      .populate("club", "name")
      .populate("createdBy", "fullName email")
      .sort({ createdAt: -1 });

    return res.status(200).json(meetings);
  } catch (error) {
    console.error("getPendingClubMeetings error:", error);
    return res.status(500).json({ message: "Failed to fetch pending meetings" });
  }
};

export const getClubMeetingById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid meeting ID" });
    }

    const meeting = await ClubMeeting.findById(req.params.id)
      .populate("club", "name clubAdmin president")
      .populate("createdBy", "fullName email")
      .populate("approvedBy", "fullName email")
      .populate("rejectedBy", "fullName email");

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (isSystemAdmin(req.user)) {
      if (meeting.approvalStatus !== "pending") {
        return res.status(403).json({ message: "System admin can only access pending meetings here" });
      }

      return res.status(200).json(meeting);
    }

    const allowed = await canManageClubMeetings(req.user, meeting.club?._id || meeting.club);
    if (!allowed && meeting.approvalStatus !== "approved") {
      return res.status(403).json({ message: "Not authorized to view this meeting" });
    }

    return res.status(200).json(meeting);
  } catch (error) {
    console.error("getClubMeetingById error:", error);
    return res.status(500).json({ message: "Failed to fetch meeting" });
  }
};

export const updateClubMeeting = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid meeting ID" });
    }

    const meeting = await ClubMeeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (isSystemAdmin(req.user)) {
      return res.status(403).json({ message: "System admin cannot edit meeting requests" });
    }

    const allowed = await canManageClubMeetings(req.user, meeting.club);
    if (!allowed) {
      return res.status(403).json({ message: "Only authorized club officers can update meeting requests" });
    }

    if (req.body.title !== undefined) meeting.title = req.body.title.trim();
    if (req.body.description !== undefined) meeting.description = req.body.description.trim();
    if (req.body.category !== undefined) meeting.category = req.body.category;
    if (req.body.venue !== undefined) meeting.venue = req.body.venue.trim();
    if (req.body.startDate !== undefined) meeting.startDate = new Date(req.body.startDate);
    if (req.body.endDate !== undefined) meeting.endDate = new Date(req.body.endDate);

    const dateCheck = ensureMeetingDates(meeting.startDate, meeting.endDate);
    if (dateCheck.error) {
      return res.status(400).json({ message: dateCheck.error });
    }

    meeting.startDate = dateCheck.start;
    meeting.endDate = dateCheck.end;

    if (req.file?.filename) {
      meeting.image = `/uploads/${req.file.filename}`;
    }

    meeting.approvalStatus = "pending";
    meeting.approvalComment = "";
    meeting.approvedBy = null;
    meeting.approvedAt = null;
    meeting.rejectedBy = null;
    meeting.rejectedAt = null;

    await meeting.save();

    const updated = await ClubMeeting.findById(meeting._id)
      .populate("club", "name")
      .populate("createdBy", "fullName email");

    return res.status(200).json({
      message: "Meeting updated and resubmitted for approval",
      meeting: updated,
    });
  } catch (error) {
    console.error("updateClubMeeting error:", error);
    return res.status(500).json({ message: error.message || "Failed to update meeting" });
  }
};

export const approveClubMeeting = async (req, res) => {
  try {
    const { approvalComment } = req.body || {};

    if (!isSystemAdmin(req.user)) {
      return res.status(403).json({ message: "Only system admin can approve meetings" });
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid meeting ID" });
    }

    const meeting = await ClubMeeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    meeting.approvalStatus = "approved";
    meeting.approvalComment = approvalComment || "";
    meeting.approvedBy = req.user._id;
    meeting.approvedAt = new Date();
    meeting.rejectedBy = null;
    meeting.rejectedAt = null;

    await meeting.save();

    const updated = await ClubMeeting.findById(meeting._id)
      .populate("club", "name")
      .populate("createdBy", "fullName email")
      .populate("approvedBy", "fullName email");

    return res.status(200).json({
      message: "Meeting approved successfully",
      meeting: updated,
    });
  } catch (error) {
    console.error("approveClubMeeting error:", error);
    return res.status(500).json({ message: "Failed to approve meeting" });
  }
};

export const rejectClubMeeting = async (req, res) => {
  try {
    const { approvalComment } = req.body || {};

    if (!isSystemAdmin(req.user)) {
      return res.status(403).json({ message: "Only system admin can reject meetings" });
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid meeting ID" });
    }

    const meeting = await ClubMeeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    meeting.approvalStatus = "rejected";
    meeting.approvalComment = approvalComment || "";
    meeting.rejectedBy = req.user._id;
    meeting.rejectedAt = new Date();
    meeting.approvedBy = null;
    meeting.approvedAt = null;

    await meeting.save();

    const updated = await ClubMeeting.findById(meeting._id)
      .populate("club", "name")
      .populate("createdBy", "fullName email")
      .populate("rejectedBy", "fullName email");

    return res.status(200).json({
      message: "Meeting rejected successfully",
      meeting: updated,
    });
  } catch (error) {
    console.error("rejectClubMeeting error:", error);
    return res.status(500).json({ message: "Failed to reject meeting" });
  }
};

export const deleteClubMeeting = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid meeting ID" });
    }

    const meeting = await ClubMeeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (isSystemAdmin(req.user)) {
      return res.status(403).json({ message: "System admin cannot delete meetings from this page" });
    }

    const allowed = await canManageClubMeetings(req.user, meeting.club);
    if (!allowed) {
      return res.status(403).json({ message: "Not authorized to delete this meeting" });
    }

    await meeting.deleteOne();

    return res.status(200).json({ message: "Meeting deleted successfully" });
  } catch (error) {
    console.error("deleteClubMeeting error:", error);
    return res.status(500).json({ message: "Failed to delete meeting" });
  }
};
