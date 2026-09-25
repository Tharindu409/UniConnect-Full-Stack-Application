import mongoose from "mongoose";
import Election from "../models/Election.js";
import Club from "../models/Club.js";

const SYSTEM_ADMIN = "SYSTEM_ADMIN";

const MANAGE_ROLES = [
  "PRESIDENT",
  "VICE_PRESIDENT",
  "TREASURER",
  "SECRETARY",
  "EXECUTIVE_COMMITTEE_MEMBER",
  "ASSISTANT_SECRETARY",
  "ASSISTANT_TREASURER",
  "EVENT_COORDINATOR",
  "PROJECT_COORDINATOR",
];

const VIEW_MEMBER_ROLES = [
  "MEMBER",
  "EXECUTIVE_COMMITTEE_MEMBER",
  "VICE_PRESIDENT",
  "PRESIDENT",
  "TREASURER",
  "SECRETARY",
  "ASSISTANT_SECRETARY",
  "ASSISTANT_TREASURER",
  "EVENT_COORDINATOR",
  "PROJECT_COORDINATOR",
];

const ELECTION_POSITIONS = [
  "President",
  "Vice President",
  "Secretary",
  "Assistant Secretary",
  "Treasurer",
  "Assistant Treasurer",
  "Executive Committee Member",
  "Event Coordinator",
  "Project Coordinator",
  "Other",
];

const ELECTION_STATUSES = ["upcoming", "ongoing", "completed", "cancelled"];

const ROLE_ALIASES = {
  EXECUTIVE: "EXECUTIVE_COMMITTEE_MEMBER",
};

const normalizeRole = (role) => {
  const normalized = String(role || "")
    .trim()
    .replace(/\s+/g, "_")
    .toUpperCase();

  return ROLE_ALIASES[normalized] || normalized;
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const computeElectionStatus = (election) => {
  if (String(election?.status || "").toLowerCase() === "cancelled") {
    return "cancelled";
  }

  const now = new Date();
  const nominationStart = new Date(election.nominationStartDate);
  const votingEnd = new Date(election.votingEndDate);

  if (
    Number.isNaN(nominationStart.getTime()) ||
    Number.isNaN(votingEnd.getTime())
  ) {
    return election.status || "upcoming";
  }

  if (now < nominationStart) return "upcoming";
  if (now > votingEnd) return "completed";
  return "ongoing";
};

const isVotingWindowOpen = (election) => {
  if (String(election?.status || "").toLowerCase() === "cancelled") {
    return false;
  }

  const now = new Date();
  const votingStart = new Date(election.votingStartDate);
  const votingEnd = new Date(election.votingEndDate);

  if (
    Number.isNaN(votingStart.getTime()) ||
    Number.isNaN(votingEnd.getTime())
  ) {
    return false;
  }

  return now >= votingStart && now <= votingEnd;
};

const getActiveClubMember = (club, userId) => {
  if (!club?.members?.length || !userId) return null;

  return club.members.find((member) => {
    const memberUserId =
      member?.user?._id?.toString?.() ||
      member?.user?.toString?.() ||
      member?._id?.toString?.() ||
      member?.memberId?.toString?.();

    const memberStatus = String(member?.status || "").trim().toLowerCase();

    return (
      String(memberUserId) === String(userId) &&
      ["active", "approved"].includes(memberStatus)
    );
  });
};

const getClubMemberRole = (club, userId) => {
  const member = getActiveClubMember(club, userId);
  return normalizeRole(member?.role || "");
};

const canManageElections = (user, club) => {
  const memberRole = getClubMemberRole(club, user?._id);
  return MANAGE_ROLES.includes(memberRole);
};

const canViewElections = (user, club) => {
  const userRole = normalizeRole(user?.role);

  if (userRole === SYSTEM_ADMIN) return true;

  const memberRole = getClubMemberRole(club, user?._id);
  if (VIEW_MEMBER_ROLES.includes(memberRole)) return true;

  return String(club?.status || "").toLowerCase() === "active";
};

const canVoteInElection = (user, club) => {
  const memberRole = getClubMemberRole(club, user?._id);
  return VIEW_MEMBER_ROLES.includes(memberRole);
};

const validateElectionPayload = (body, isUpdate = false) => {
  const errors = {};

  const title = body.title?.trim?.() || "";
  const description = body.description?.trim?.() || "";
  const position = body.position || "";
  const nominationStartDate = body.nominationStartDate;
  const nominationEndDate = body.nominationEndDate;
  const votingStartDate = body.votingStartDate;
  const votingEndDate = body.votingEndDate;
  const eligibility = body.eligibility?.trim?.() || "";

  const maxCandidates =
    body.maxCandidates === "" ||
    body.maxCandidates === null ||
    body.maxCandidates === undefined
      ? null
      : Number(body.maxCandidates);

  if (!isUpdate || "title" in body) {
    if (!title) {
      errors.title = "Election title is required";
    } else if (title.length < 3) {
      errors.title = "Election title must be at least 3 characters";
    } else if (title.length > 120) {
      errors.title = "Election title cannot exceed 120 characters";
    }
  }

  if (!isUpdate || "description" in body) {
    if (!description) {
      errors.description = "Description is required";
    } else if (description.length < 10) {
      errors.description = "Description must be at least 10 characters";
    } else if (description.length > 1000) {
      errors.description = "Description cannot exceed 1000 characters";
    }
  }

  if (!isUpdate || "position" in body) {
    if (!position) {
      errors.position = "Position is required";
    } else if (!ELECTION_POSITIONS.includes(position)) {
      errors.position = "Invalid election position";
    }
  }

  if (!isUpdate || "nominationStartDate" in body) {
    if (!nominationStartDate) {
      errors.nominationStartDate = "Nomination start date is required";
    } else if (Number.isNaN(new Date(nominationStartDate).getTime())) {
      errors.nominationStartDate = "Invalid nomination start date";
    }
  }

  if (!isUpdate || "nominationEndDate" in body) {
    if (!nominationEndDate) {
      errors.nominationEndDate = "Nomination end date is required";
    } else if (Number.isNaN(new Date(nominationEndDate).getTime())) {
      errors.nominationEndDate = "Invalid nomination end date";
    }
  }

  if (!isUpdate || "votingStartDate" in body) {
    if (!votingStartDate) {
      errors.votingStartDate = "Voting start date is required";
    } else if (Number.isNaN(new Date(votingStartDate).getTime())) {
      errors.votingStartDate = "Invalid voting start date";
    }
  }

  if (!isUpdate || "votingEndDate" in body) {
    if (!votingEndDate) {
      errors.votingEndDate = "Voting end date is required";
    } else if (Number.isNaN(new Date(votingEndDate).getTime())) {
      errors.votingEndDate = "Invalid voting end date";
    }
  }

  if (
    nominationStartDate &&
    nominationEndDate &&
    !Number.isNaN(new Date(nominationStartDate).getTime()) &&
    !Number.isNaN(new Date(nominationEndDate).getTime())
  ) {
    const nominationStart = new Date(nominationStartDate);
    const nominationEnd = new Date(nominationEndDate);

    if (nominationStart >= nominationEnd) {
      errors.nominationEndDate =
        "Nomination end date must be after nomination start date";
    }
  }

  if (
    votingStartDate &&
    votingEndDate &&
    !Number.isNaN(new Date(votingStartDate).getTime()) &&
    !Number.isNaN(new Date(votingEndDate).getTime())
  ) {
    const votingStart = new Date(votingStartDate);
    const votingEnd = new Date(votingEndDate);

    if (votingStart >= votingEnd) {
      errors.votingEndDate = "Voting end date must be after voting start date";
    }
  }

  if (
    nominationEndDate &&
    votingStartDate &&
    !Number.isNaN(new Date(nominationEndDate).getTime()) &&
    !Number.isNaN(new Date(votingStartDate).getTime())
  ) {
    const nominationEnd = new Date(nominationEndDate);
    const votingStart = new Date(votingStartDate);

    if (votingStart <= nominationEnd) {
      errors.votingStartDate =
        "Voting start date must be after nomination end date";
    }
  }

  if (eligibility.length > 500) {
    errors.eligibility = "Eligibility cannot exceed 500 characters";
  }

  if ((!isUpdate || "maxCandidates" in body) && maxCandidates !== null) {
    if (Number.isNaN(maxCandidates) || maxCandidates <= 0) {
      errors.maxCandidates = "Max candidates must be greater than 0";
    } else if (maxCandidates > 1000) {
      errors.maxCandidates = "Max candidates is too large";
    }
  }

  if ((!isUpdate || "status" in body) && body.status !== undefined) {
    if (body.status && !ELECTION_STATUSES.includes(body.status)) {
      errors.status = "Invalid election status";
    }
  }

  return errors;
};

export const getElectionsByClub = async (req, res) => {
  try {
    const { clubId } = req.params;

    if (!isValidObjectId(clubId)) {
      return res.status(400).json({ message: "Invalid club ID" });
    }

    const club = await Club.findById(clubId).populate(
      "members.user",
      "name email role"
    );

    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (!canViewElections(req.user, club)) {
      return res.status(403).json({
        message: "You are not authorized to view this club's elections",
      });
    }

    const elections = await Election.find({ club: clubId })
      .populate("createdBy", "name email role")
      .populate("updatedBy", "name email role")
      .populate("candidates.user", "name email role")
      .populate("voters.user", "name email role")
      .sort({ nominationStartDate: 1, createdAt: -1 });

    const updatedElections = await Promise.all(
      elections.map(async (election) => {
        const computedStatus = computeElectionStatus(election);

        if (
          election.status !== "cancelled" &&
          election.status !== computedStatus
        ) {
          election.status = computedStatus;
          await election.save();
        }

        return election;
      })
    );

    return res.status(200).json(updatedElections);
  } catch (error) {
    console.error("getElectionsByClub error:", error);
    return res.status(500).json({
      message: "Failed to fetch elections",
      error: error.message,
    });
  }
};

export const getElectionById = async (req, res) => {
  try {
    const { electionId } = req.params;

    if (!isValidObjectId(electionId)) {
      return res.status(400).json({ message: "Invalid election ID" });
    }

    const election = await Election.findById(electionId)
      .populate("createdBy", "name email role")
      .populate("updatedBy", "name email role")
      .populate("candidates.user", "name email role")
      .populate("voters.user", "name email role")
      .populate({
        path: "club",
        populate: {
          path: "members.user",
          select: "name email role",
        },
      });

    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    if (!canViewElections(req.user, election.club)) {
      return res.status(403).json({
        message: "You are not authorized to view this election",
      });
    }

    const computedStatus = computeElectionStatus(election);

    if (election.status !== "cancelled" && election.status !== computedStatus) {
      election.status = computedStatus;
      await election.save();
    }

    return res.status(200).json(election);
  } catch (error) {
    console.error("getElectionById error:", error);
    return res.status(500).json({
      message: "Failed to fetch election",
      error: error.message,
    });
  }
};

export const createElection = async (req, res) => {
  try {
    const {
      clubId,
      title,
      description,
      position,
      nominationStartDate,
      nominationEndDate,
      votingStartDate,
      votingEndDate,
      eligibility,
      maxCandidates,
      candidates,
    } = req.body;

    if (!clubId || !isValidObjectId(clubId)) {
      return res.status(400).json({ message: "Valid clubId is required" });
    }

    const validationErrors = validateElectionPayload(req.body);

    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    const club = await Club.findById(clubId).populate(
      "members.user",
      "name email role"
    );

    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (!canManageElections(req.user, club)) {
      return res.status(403).json({
        message: "You are not authorized to create elections for this club",
      });
    }

    const preparedCandidates = Array.isArray(candidates)
      ? candidates
          .map((candidate) => ({
            name: candidate?.name?.trim?.() || "",
            user:
              candidate?.user && isValidObjectId(candidate.user)
                ? candidate.user
                : null,
            votes: 0,
          }))
          .filter((candidate) => candidate.name)
      : [];

    if (
      maxCandidates !== null &&
      maxCandidates !== "" &&
      maxCandidates !== undefined &&
      preparedCandidates.length > Number(maxCandidates)
    ) {
      return res.status(400).json({
        message: "Candidate count exceeds maxCandidates",
      });
    }

    const newElection = await Election.create({
      club: clubId,
      title: title.trim(),
      description: description.trim(),
      position,
      nominationStartDate,
      nominationEndDate,
      votingStartDate,
      votingEndDate,
      eligibility: eligibility?.trim?.() || "",
      maxCandidates:
        maxCandidates === "" ||
        maxCandidates === null ||
        maxCandidates === undefined
          ? null
          : Number(maxCandidates),
      status: "upcoming",
      candidates: preparedCandidates,
      voters: [],
      createdBy: req.user._id,
    });

    const populatedElection = await Election.findById(newElection._id)
      .populate("createdBy", "name email role")
      .populate("updatedBy", "name email role")
      .populate("candidates.user", "name email role")
      .populate("voters.user", "name email role");

    return res.status(201).json({
      message: "Election created successfully",
      election: populatedElection,
    });
  } catch (error) {
    console.error("createElection error:", error);
    return res.status(500).json({
      message: "Failed to create election",
      error: error.message,
    });
  }
};

export const updateElection = async (req, res) => {
  try {
    const { electionId } = req.params;

    if (!isValidObjectId(electionId)) {
      return res.status(400).json({ message: "Invalid election ID" });
    }

    const validationErrors = validateElectionPayload(req.body, true);

    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    const election = await Election.findById(electionId).populate({
      path: "club",
      populate: {
        path: "members.user",
        select: "name email role",
      },
    });

    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    if (!canManageElections(req.user, election.club)) {
      return res.status(403).json({
        message: "You are not authorized to update this election",
      });
    }

    if (req.body.title !== undefined) election.title = req.body.title.trim();
    if (req.body.description !== undefined) {
      election.description = req.body.description.trim();
    }
    if (req.body.position !== undefined) {
      election.position = req.body.position;
    }
    if (req.body.nominationStartDate !== undefined) {
      election.nominationStartDate = req.body.nominationStartDate;
    }
    if (req.body.nominationEndDate !== undefined) {
      election.nominationEndDate = req.body.nominationEndDate;
    }
    if (req.body.votingStartDate !== undefined) {
      election.votingStartDate = req.body.votingStartDate;
    }
    if (req.body.votingEndDate !== undefined) {
      election.votingEndDate = req.body.votingEndDate;
    }
    if (req.body.eligibility !== undefined) {
      election.eligibility = req.body.eligibility?.trim?.() || "";
    }
    if (req.body.maxCandidates !== undefined) {
      election.maxCandidates =
        req.body.maxCandidates === "" || req.body.maxCandidates === null
          ? null
          : Number(req.body.maxCandidates);
    }
    if (req.body.status !== undefined && req.body.status !== "") {
      election.status = req.body.status;
    }

    if (Array.isArray(req.body.candidates)) {
      if (Array.isArray(election.voters) && election.voters.length > 0) {
        return res.status(400).json({
          message: "Candidates cannot be replaced after voting has started",
        });
      }

      const preparedCandidates = req.body.candidates
        .map((candidate) => ({
          name: candidate?.name?.trim?.() || "",
          user:
            candidate?.user && isValidObjectId(candidate.user)
              ? candidate.user
              : null,
          votes: 0,
        }))
        .filter((candidate) => candidate.name);

      if (
        election.maxCandidates !== null &&
        preparedCandidates.length > Number(election.maxCandidates)
      ) {
        return res.status(400).json({
          message: "Candidate count exceeds maxCandidates",
        });
      }

      election.candidates = preparedCandidates;
      election.voters = [];
    }

    election.updatedBy = req.user._id;

    if (election.status !== "cancelled") {
      election.status = computeElectionStatus(election);
    }

    await election.save();

    const updatedElection = await Election.findById(election._id)
      .populate("createdBy", "name email role")
      .populate("updatedBy", "name email role")
      .populate("candidates.user", "name email role")
      .populate("voters.user", "name email role");

    return res.status(200).json({
      message: "Election updated successfully",
      election: updatedElection,
    });
  } catch (error) {
    console.error("updateElection error:", error);
    return res.status(500).json({
      message: "Failed to update election",
      error: error.message,
    });
  }
};

export const deleteElection = async (req, res) => {
  try {
    const { electionId } = req.params;

    if (!isValidObjectId(electionId)) {
      return res.status(400).json({ message: "Invalid election ID" });
    }

    const election = await Election.findById(electionId).populate({
      path: "club",
      populate: {
        path: "members.user",
        select: "name email role",
      },
    });

    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    if (!canManageElections(req.user, election.club)) {
      return res.status(403).json({
        message: "You are not authorized to delete this election",
      });
    }

    await election.deleteOne();

    return res.status(200).json({
      message: "Election deleted successfully",
    });
  } catch (error) {
    console.error("deleteElection error:", error);
    return res.status(500).json({
      message: "Failed to delete election",
      error: error.message,
    });
  }
};

export const getAllElections = async (req, res) => {
  try {
    const userRole = normalizeRole(req.user?.role);

    if (userRole !== SYSTEM_ADMIN) {
      return res.status(403).json({
        message: "Only system admins can view all elections",
      });
    }

    const elections = await Election.find({})
      .populate("club", "name status category")
      .populate("createdBy", "name email role")
      .populate("updatedBy", "name email role")
      .populate("candidates.user", "name email role")
      .populate("voters.user", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json(elections);
  } catch (error) {
    console.error("getAllElections error:", error);
    return res.status(500).json({
      message: "Failed to fetch all elections",
      error: error.message,
    });
  }
};

export const voteElection = async (req, res) => {
  try {
    const { electionId } = req.params;
    const { candidateIndex } = req.body;

    if (!isValidObjectId(electionId)) {
      return res.status(400).json({ message: "Invalid election ID" });
    }

    const election = await Election.findById(electionId);

    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    const club = await Club.findById(election.club).populate(
      "members.user",
      "name email role"
    );

    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (!canVoteInElection(req.user, club)) {
      return res.status(403).json({
        message: "Only club members can vote in this election",
      });
    }

    if (!isVotingWindowOpen(election)) {
      return res.status(400).json({
        message: "Voting is not active",
      });
    }

    const parsedCandidateIndex = Number(candidateIndex);

    if (
      Number.isNaN(parsedCandidateIndex) ||
      parsedCandidateIndex < 0 ||
      parsedCandidateIndex >= election.candidates.length
    ) {
      return res.status(400).json({
        message: "Invalid candidate",
      });
    }

    const alreadyVoted = election.voters.find(
      (voter) => String(voter.user) === String(req.user._id)
    );

    if (alreadyVoted) {
      return res.status(400).json({
        message: "You have already voted",
      });
    }

    election.candidates[parsedCandidateIndex].votes += 1;

    election.voters.push({
      user: req.user._id,
      candidateIndex: parsedCandidateIndex,
      votedAt: new Date(),
    });

    if (election.status !== "cancelled") {
      election.status = computeElectionStatus(election);
    }

    await election.save();

    return res.status(200).json({
      message: "Vote submitted successfully",
    });
  } catch (error) {
    console.error("voteElection error:", error);
    return res.status(500).json({
      message: "Failed to submit vote",
      error: error.message,
    });
  }
};

export const getElectionResults = async (req, res) => {
  try {
    const { electionId } = req.params;

    if (!isValidObjectId(electionId)) {
      return res.status(400).json({ message: "Invalid election ID" });
    }

    const election = await Election.findById(electionId).populate(
      "candidates.user",
      "name email role"
    );

    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    const club = await Club.findById(election.club).populate(
      "members.user",
      "name email role"
    );

    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (!canViewElections(req.user, club)) {
      return res.status(403).json({
        message: "You are not authorized to view these results",
      });
    }

    const totalVotes = election.candidates.reduce(
      (sum, candidate) => sum + Number(candidate.votes || 0),
      0
    );

    const results = election.candidates.map((candidate, index) => ({
      index,
      name: candidate.name,
      user: candidate.user || null,
      votes: Number(candidate.votes || 0),
      percentage:
        totalVotes > 0
          ? ((Number(candidate.votes || 0) / totalVotes) * 100).toFixed(1)
          : "0.0",
    }));

    return res.status(200).json({
      electionId: election._id,
      title: election.title,
      position: election.position,
      status: computeElectionStatus(election),
      totalVotes,
      results,
    });
  } catch (error) {
    console.error("getElectionResults error:", error);
    return res.status(500).json({
      message: "Failed to fetch election results",
      error: error.message,
    });
  }
};