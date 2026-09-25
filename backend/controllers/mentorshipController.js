import MentorProfile from "../models/MentorProfile.js";
import MentorshipRequest from "../models/MentorshipRequest.js";
import Mentorship from "../models/Mentorship.js";
import Club from "../models/Club.js";

const normalizeArray = (arr = []) => {
  if (Array.isArray(arr)) {
    return [
      ...new Set(
        arr.map((item) => String(item || "").trim()).filter(Boolean)
      ),
    ];
  }

  if (typeof arr === "string") {
    return [
      ...new Set(
        arr
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      ),
    ];
  }

  return [];
};

const normalizeRequestStatus = (status) => {
  const normalized = String(status || "").trim().toLowerCase();

  if (normalized === "active") return "accepted";
  if (normalized === "accept") return "accepted";
  if (normalized === "reject") return "rejected";
  if (normalized === "complete") return "completed";
  if (normalized === "cancel") return "cancelled";

  return normalized;
};

const levelMap = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Expert: 4,
};

const calculateMatchScore = (studentData, mentorProfile) => {
  const studentSkills = normalizeArray(studentData.studentSkills || []).map((item) =>
    item.toLowerCase()
  );
  const studentInterests = normalizeArray(studentData.studentInterests || []).map(
    (item) => item.toLowerCase()
  );
  const mentorSkills = normalizeArray(mentorProfile.skills || []).map((item) =>
    item.toLowerCase()
  );
  const mentorInterests = normalizeArray(mentorProfile.interests || []).map(
    (item) => item.toLowerCase()
  );

  const commonSkills = studentSkills.filter((skill) =>
    mentorSkills.includes(skill)
  ).length;

  const commonInterests = studentInterests.filter((interest) =>
    mentorInterests.includes(interest)
  ).length;

  const skillScore =
    studentSkills.length > 0 ? commonSkills / studentSkills.length : 0;

  const interestScore =
    studentInterests.length > 0 ? commonInterests / studentInterests.length : 0;

  const studentLevelValue = levelMap[studentData.studentLevel] || 1;
  const mentorLevelValue = levelMap[mentorProfile.expertiseLevel] || 2;

  let levelScore = 0;
  if (mentorLevelValue >= studentLevelValue) {
    levelScore = 1;
  } else if (mentorLevelValue + 1 === studentLevelValue) {
    levelScore = 0.5;
  }

  const currentMentees = Number(mentorProfile.currentMentees || 0);
  const maxMentees = Number(mentorProfile.maxMentees || 0);

  const capacityScore = currentMentees < maxMentees ? 1 : 0;

  const availabilityScore =
    mentorProfile.availability === "Available"
      ? 1
      : mentorProfile.availability === "Busy"
      ? 0.5
      : 0;

  const finalScore =
    skillScore * 0.4 +
    interestScore * 0.25 +
    levelScore * 0.15 +
    capacityScore * 0.1 +
    availabilityScore * 0.1;

  return Number((finalScore * 100).toFixed(0));
};

const validateMentorProfileInput = ({
  title,
  bio,
  skills,
  interests,
  expertiseLevel,
  availability,
  maxMentees,
}) => {
  const trimmedTitle = String(title || "").trim();
  const trimmedBio = String(bio || "").trim();
  const parsedSkills = normalizeArray(skills);
  const parsedInterests = normalizeArray(interests);
  const parsedMaxMentees = Number(maxMentees);

  if (!trimmedTitle) {
    return { isValid: false, message: "Title is required" };
  }

  if (trimmedTitle.length < 2) {
    return { isValid: false, message: "Title must be at least 2 characters" };
  }

  if (!trimmedBio) {
    return { isValid: false, message: "Bio is required" };
  }

  if (trimmedBio.length > 500) {
    return { isValid: false, message: "Bio cannot exceed 500 characters" };
  }

  if (parsedSkills.length === 0) {
    return { isValid: false, message: "At least one skill is required" };
  }

  if (parsedInterests.length === 0) {
    return { isValid: false, message: "At least one interest is required" };
  }

  if (
    expertiseLevel &&
    !["Beginner", "Intermediate", "Advanced", "Expert"].includes(expertiseLevel)
  ) {
    return { isValid: false, message: "Invalid expertise level" };
  }

  if (
    availability &&
    !["Available", "Busy", "Unavailable"].includes(availability)
  ) {
    return { isValid: false, message: "Invalid availability" };
  }

  if (!Number.isFinite(parsedMaxMentees) || parsedMaxMentees < 1) {
    return { isValid: false, message: "Max mentees must be at least 1" };
  }

  return {
    isValid: true,
    data: {
      title: trimmedTitle,
      bio: trimmedBio,
      skills: parsedSkills,
      interests: parsedInterests,
      expertiseLevel: expertiseLevel || "Intermediate",
      availability: availability || "Available",
      maxMentees: parsedMaxMentees,
    },
  };
};

const populateMentorshipRequest = async (requestId) => {
  return MentorshipRequest.findById(requestId)
    .populate("student", "name fullName email profilePicture")
    .populate("mentor", "name fullName email profilePicture")
    .populate("club", "name");
};

const populateMentorship = async (mentorshipId) => {
  return Mentorship.findById(mentorshipId)
    .populate("mentor", "name fullName email profilePicture role")
    .populate("mentee", "name fullName email profilePicture role")
    .populate("club", "name")
    .populate("request");
};

// Create mentor profile
export const createMentorProfile = async (req, res) => {
  try {
    const { clubId } = req.params;

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    const existing = await MentorProfile.findOne({
      club: clubId,
      mentor: req.user._id,
    });

    if (existing) {
      return res.status(400).json({
        message: "You already have a mentor profile in this club",
      });
    }

    const validation = validateMentorProfileInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.message });
    }

    const mentorProfile = await MentorProfile.create({
      club: clubId,
      mentor: req.user._id,
      ...validation.data,
    });

    const populated = await MentorProfile.findById(mentorProfile._id)
      .populate("mentor", "name fullName email profilePicture role")
      .populate("club", "name");

    return res.status(201).json(populated);
  } catch (error) {
    console.error("createMentorProfile error:", error);
    return res.status(500).json({ message: "Failed to create mentor profile" });
  }
};

// Get my mentor profile
export const getMyMentorProfile = async (req, res) => {
  try {
    const { clubId } = req.params;

    const profile = await MentorProfile.findOne({
      club: clubId,
      mentor: req.user._id,
    })
      .populate("mentor", "name fullName email profilePicture role")
      .populate("club", "name");

    if (!profile) {
      return res.status(200).json(null);
    }

    return res.status(200).json(profile);
  } catch (error) {
    console.error("getMyMentorProfile error:", error);
    return res.status(500).json({ message: "Failed to fetch mentor profile" });
  }
};

// Update my mentor profile
export const updateMyMentorProfile = async (req, res) => {
  try {
    const { clubId } = req.params;

    const mentorProfile = await MentorProfile.findOne({
      club: clubId,
      mentor: req.user._id,
    });

    if (!mentorProfile) {
      return res.status(404).json({
        message: "Mentor profile not found for this club",
      });
    }

    const validation = validateMentorProfileInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.message });
    }

    mentorProfile.title = validation.data.title;
    mentorProfile.bio = validation.data.bio;
    mentorProfile.skills = validation.data.skills;
    mentorProfile.interests = validation.data.interests;
    mentorProfile.expertiseLevel = validation.data.expertiseLevel;
    mentorProfile.availability = validation.data.availability;
    mentorProfile.maxMentees = validation.data.maxMentees;

    if (mentorProfile.currentMentees > mentorProfile.maxMentees) {
      mentorProfile.currentMentees = mentorProfile.maxMentees;
    }

    await mentorProfile.save();

    const populated = await MentorProfile.findById(mentorProfile._id)
      .populate("mentor", "name fullName email profilePicture role")
      .populate("club", "name");

    return res.status(200).json(populated);
  } catch (error) {
    console.error("updateMyMentorProfile error:", error);
    return res.status(500).json({ message: "Failed to update mentor profile" });
  }
};

// Delete my mentor profile
export const deleteMyMentorProfile = async (req, res) => {
  try {
    const { clubId } = req.params;

    const mentorProfile = await MentorProfile.findOne({
      club: clubId,
      mentor: req.user._id,
    });

    if (!mentorProfile) {
      return res.status(404).json({
        message: "Mentor profile not found for this club",
      });
    }

    const activeMentorships = await Mentorship.countDocuments({
      club: clubId,
      mentor: req.user._id,
      status: "active",
    });

    if (activeMentorships > 0) {
      return res.status(400).json({
        message:
          "Cannot delete mentor profile while you have active mentorships",
      });
    }

    const acceptedRequests = await MentorshipRequest.countDocuments({
      club: clubId,
      mentor: req.user._id,
      status: "accepted",
    });

    if (acceptedRequests > 0) {
      return res.status(400).json({
        message:
          "Cannot delete mentor profile while you have accepted mentorship requests",
      });
    }

    await mentorProfile.deleteOne();

    return res.status(200).json({
      message: "Mentor profile deleted successfully",
    });
  } catch (error) {
    console.error("deleteMyMentorProfile error:", error);
    return res.status(500).json({ message: "Failed to delete mentor profile" });
  }
};

// Get all mentors in a club
export const getClubMentors = async (req, res) => {
  try {
    const { clubId } = req.params;

    const mentors = await MentorProfile.find({
      club: clubId,
      isActive: true,
    })
      .populate("mentor", "name fullName email profilePicture role")
      .sort({ createdAt: -1 });

    return res.status(200).json(mentors);
  } catch (error) {
    console.error("getClubMentors error:", error);
    return res.status(500).json({ message: "Failed to fetch mentors" });
  }
};

// ML-style mentor recommendations
export const getRecommendedMentors = async (req, res) => {
  try {
    const { clubId } = req.params;
    const { studentSkills, studentInterests, studentLevel } = req.body;

    const mentors = await MentorProfile.find({
      club: clubId,
      isActive: true,
    }).populate("mentor", "name fullName email profilePicture role");

    const ranked = mentors
      .map((mentorProfile) => ({
        ...mentorProfile.toObject(),
        matchScore: calculateMatchScore(
          {
            studentSkills,
            studentInterests,
            studentLevel,
          },
          mentorProfile
        ),
      }))
      .sort((a, b) => b.matchScore - a.matchScore);

    return res.status(200).json(ranked);
  } catch (error) {
    console.error("getRecommendedMentors error:", error);
    return res
      .status(500)
      .json({ message: "Failed to generate recommendations" });
  }
};

// Create mentorship request
export const createMentorshipRequest = async (req, res) => {
  try {
    const { clubId } = req.params;
    const {
      mentorId,
      message,
      studentSkills,
      studentInterests,
      studentLevel,
    } = req.body;

    if (!mentorId) {
      return res.status(400).json({ message: "Mentor is required" });
    }

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    const mentorProfile = await MentorProfile.findOne({
      club: clubId,
      mentor: mentorId,
      isActive: true,
    });

    if (!mentorProfile) {
      return res.status(404).json({ message: "Mentor profile not found" });
    }

    if (String(req.user._id) === String(mentorId)) {
      return res.status(400).json({ message: "You cannot request yourself" });
    }

    const existingPending = await MentorshipRequest.findOne({
      club: clubId,
      student: req.user._id,
      mentor: mentorId,
      status: "pending",
    });

    if (existingPending) {
      return res.status(400).json({
        message: "You already have a pending request for this mentor",
      });
    }

    const existingActiveMentorship = await Mentorship.findOne({
      club: clubId,
      mentor: mentorId,
      mentee: req.user._id,
      status: "active",
    });

    if (existingActiveMentorship) {
      return res.status(400).json({
        message: "You already have an active mentorship with this mentor",
      });
    }

    const normalizedStudentSkills = normalizeArray(studentSkills);
    const normalizedStudentInterests = normalizeArray(studentInterests);

    const matchScore = calculateMatchScore(
      {
        studentSkills: normalizedStudentSkills,
        studentInterests: normalizedStudentInterests,
        studentLevel,
      },
      mentorProfile
    );

    const request = await MentorshipRequest.create({
      club: clubId,
      student: req.user._id,
      mentor: mentorId,
      message: String(message || "").trim(),
      studentSkills: normalizedStudentSkills,
      studentInterests: normalizedStudentInterests,
      studentLevel: studentLevel || "Beginner",
      matchScore,
      status: "pending",
    });

    const populated = await populateMentorshipRequest(request._id);

    return res.status(201).json(populated);
  } catch (error) {
    console.error("createMentorshipRequest error:", error);
    return res
      .status(500)
      .json({ message: "Failed to create mentorship request" });
  }
};

// Student's requests
export const getMyMentorshipRequests = async (req, res) => {
  try {
    const requests = await MentorshipRequest.find({
      student: req.user._id,
    })
      .populate("student", "name fullName email profilePicture")
      .populate("mentor", "name fullName email profilePicture")
      .populate("club", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json(requests);
  } catch (error) {
    console.error("getMyMentorshipRequests error:", error);
    return res.status(500).json({ message: "Failed to fetch your requests" });
  }
};

// Student's active / history mentorships from mentorships collection
export const getMyMentorships = async (req, res) => {
  try {
    const mentorships = await Mentorship.find({
      mentee: req.user._id,
    })
      .populate("mentor", "name fullName email profilePicture role")
      .populate("mentee", "name fullName email profilePicture role")
      .populate("club", "name")
      .populate("request")
      .sort({ createdAt: -1 });

    return res.status(200).json(mentorships);
  } catch (error) {
    console.error("getMyMentorships error:", error);
    return res.status(500).json({ message: "Failed to fetch mentorships" });
  }
};

// Requests received by mentor OR visible to club managers / system admin
export const getMentorRequests = async (req, res) => {
  try {
    const userId = String(req.user._id || "");
    const userRole = String(req.user?.role || "").trim().toUpperCase();

    let requests = [];

    if (userRole === "SYSTEM_ADMIN") {
      requests = await MentorshipRequest.find({})
        .populate("student", "name fullName email profilePicture")
        .populate("mentor", "name fullName email profilePicture")
        .populate("club", "name")
        .sort({ createdAt: -1 });

      return res.status(200).json(requests);
    }

    const managedClubs = await Club.find({
      $or: [
        { createdBy: req.user._id },
        { president: req.user._id },
        { "members.user": req.user._id },
      ],
    }).select("_id members createdBy president");

    const managedClubIds = [];
    for (const club of managedClubs) {
      const isPresident = String(club?.president || "") === userId;
      const isCreator = String(club?.createdBy || "") === userId;

      const matchedMember = Array.isArray(club?.members)
        ? club.members.find((member) => String(member?.user) === userId)
        : null;

      const memberRole = String(matchedMember?.role || "")
        .trim()
        .toLowerCase();

      const canManage =
        isPresident ||
        isCreator ||
        [
          "club_admin",
          "president",
          "vice_president",
          "secretary",
          "assistant_secretary",
          "treasurer",
          "assistant_treasurer",
          "event_coordinator",
          "project_coordinator",
          "executive_committee_member",
        ].includes(memberRole);

      if (canManage) {
        managedClubIds.push(club._id);
      }
    }

    if (managedClubIds.length > 0) {
      requests = await MentorshipRequest.find({
        $or: [{ mentor: req.user._id }, { club: { $in: managedClubIds } }],
      })
        .populate("student", "name fullName email profilePicture")
        .populate("mentor", "name fullName email profilePicture")
        .populate("club", "name")
        .sort({ createdAt: -1 });

      return res.status(200).json(requests);
    }

    requests = await MentorshipRequest.find({
      mentor: req.user._id,
    })
      .populate("student", "name fullName email profilePicture")
      .populate("mentor", "name fullName email profilePicture")
      .populate("club", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json(requests);
  } catch (error) {
    console.error("getMentorRequests error:", error);
    return res.status(500).json({ message: "Failed to fetch mentor requests" });
  }
};

// Mentor's mentorships
export const getMentorMentorships = async (req, res) => {
  try {
    const mentorships = await Mentorship.find({
      mentor: req.user._id,
    })
      .populate("mentor", "name fullName email profilePicture role")
      .populate("mentee", "name fullName email profilePicture role")
      .populate("club", "name")
      .populate("request")
      .sort({ createdAt: -1 });

    return res.status(200).json(mentorships);
  } catch (error) {
    console.error("getMentorMentorships error:", error);
    return res.status(500).json({ message: "Failed to fetch mentor mentorships" });
  }
};

// Accept or reject request
export const updateMentorshipRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const status = normalizeRequestStatus(req.body?.status);

    if (!["accepted", "rejected", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const request = await MentorshipRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const isMentor = String(request.mentor) === String(req.user._id);
    const isStudent = String(request.student) === String(req.user._id);
    const isSystemAdmin =
      String(req.user?.role || "").trim().toUpperCase() === "SYSTEM_ADMIN";

    if (!isMentor && !isStudent && !isSystemAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const previousStatus = normalizeRequestStatus(request.status);

    if (status === "accepted") {
      if (!isMentor && !isSystemAdmin) {
        return res
          .status(403)
          .json({ message: "Only the mentor can accept this request" });
      }

      if (previousStatus !== "accepted") {
        const mentorProfile = await MentorProfile.findOne({
          club: request.club,
          mentor: request.mentor,
          isActive: true,
        });

        if (!mentorProfile) {
          return res.status(404).json({ message: "Mentor profile not found" });
        }

        const currentMentees = Number(mentorProfile.currentMentees || 0);
        const maxMentees = Number(mentorProfile.maxMentees || 0);

        if (currentMentees >= maxMentees) {
          return res
            .status(400)
            .json({ message: "Mentor has reached max mentees" });
        }

        mentorProfile.currentMentees = currentMentees + 1;
        await mentorProfile.save();

        const existingMentorship = await Mentorship.findOne({
          club: request.club,
          mentor: request.mentor,
          mentee: request.student,
        });

        if (!existingMentorship) {
          await Mentorship.create({
            club: request.club,
            request: request._id,
            mentor: request.mentor,
            mentee: request.student,
            title: "Accepted Mentorship",
            message: request.message || "",
            status: "active",
            goals: [],
            expertise: normalizeArray(request.studentSkills),
            interests: normalizeArray(request.studentInterests),
            studentLevel: request.studentLevel || "Beginner",
            matchScore: Number(request.matchScore || 0),
            startDate: new Date(),
          });
        } else {
          existingMentorship.request = request._id;
          existingMentorship.message = request.message || existingMentorship.message;
          existingMentorship.expertise = normalizeArray(request.studentSkills);
          existingMentorship.interests = normalizeArray(request.studentInterests);
          existingMentorship.studentLevel =
            request.studentLevel || existingMentorship.studentLevel;
          existingMentorship.matchScore = Number(request.matchScore || 0);
          existingMentorship.status = "active";
          existingMentorship.startDate = existingMentorship.startDate || new Date();
          existingMentorship.endDate = null;
          await existingMentorship.save();
        }
      }
    }

    if (previousStatus === "accepted" && ["rejected", "cancelled", "completed"].includes(status)) {
      const mentorProfile = await MentorProfile.findOne({
        club: request.club,
        mentor: request.mentor,
        isActive: true,
      });

      if (mentorProfile) {
        mentorProfile.currentMentees = Math.max(
          0,
          Number(mentorProfile.currentMentees || 0) - 1
        );
        await mentorProfile.save();
      }

      const mentorship = await Mentorship.findOne({
        club: request.club,
        mentor: request.mentor,
        mentee: request.student,
      });

      if (mentorship) {
        mentorship.status =
          status === "completed"
            ? "completed"
            : status === "rejected"
            ? "rejected"
            : "cancelled";

        mentorship.endDate = new Date();
        mentorship.request = request._id;
        await mentorship.save();
      }
    }

    request.status = status;
    request.respondedAt = new Date();
    await request.save();

    const populated = await populateMentorshipRequest(request._id);

    return res.status(200).json(populated);
  } catch (error) {
    console.error("updateMentorshipRequestStatus error:", error);
    return res.status(500).json({ message: "Failed to update request status" });
  }
};