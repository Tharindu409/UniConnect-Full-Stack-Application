import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../Auth/axios";

const ELECTION_POSITIONS = [
  "President",
  "Vice President",
  "Secretary",
  "Assistant Secretary",
  "Treasurer",
  "Assistant Treasurer",
  "executive_committee_member",
  "Event Coordinator",
  "Project Coordinator",
  "Other",
];

const initialForm = {
  title: "",
  description: "",
  position: "",
  nominationStartDate: "",
  nominationStartTime: "",
  nominationEndDate: "",
  nominationEndTime: "",
  votingStartDate: "",
  votingStartTime: "",
  votingEndDate: "",
  votingEndTime: "",
  eligibility: "",
  maxCandidates: "",
  candidates: [""],
};

const MANAGEMENT_ROLES = [
  "PRESIDENT",
  "VICE_PRESIDENT",
  "SECRETARY",
  "TREASURER",
  "executive_committee_member",
  "ASSISTANT_SECRETARY",
  "ASSISTANT_TREASURER",
  "EVENT_COORDINATOR",
  "PROJECT_COORDINATOR",
];

const MEMBER_ROLES = ["MEMBER", ...MANAGEMENT_ROLES];

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .replace(/\s+/g, "_")
    .toUpperCase();

const getCurrentUser = () => {
  try {
    return (
      JSON.parse(localStorage.getItem("userInfo")) ||
      JSON.parse(localStorage.getItem("user")) ||
      JSON.parse(localStorage.getItem("authUser")) ||
      null
    );
  } catch {
    return null;
  }
};

const pad = (value) => String(value).padStart(2, "0");

const getTodayDateString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}`;
};

const getCurrentTimeString = () => {
  const now = new Date();
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const parseLocalDateTime = (date, time) => {
  if (!date || !time) return null;
  const parsed = new Date(`${date}T${time}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toInputDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
};

const toInputTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";

  const datePart = d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const timePart = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `${datePart} • ${timePart}`;
};

const getElectionStatus = (election) => {
  if (!election) return "upcoming";

  const now = new Date();
  const nominationStart = new Date(election.nominationStartDate);
  const votingEnd = new Date(election.votingEndDate);

  if (election.status === "cancelled") return "cancelled";
  if (now < nominationStart) return "upcoming";
  if (now > votingEnd) return "completed";
  return "ongoing";
};

const isVotingOpen = (election) => {
  if (!election) return false;

  const now = new Date();
  const votingStart = new Date(election.votingStartDate);
  const votingEnd = new Date(election.votingEndDate);

  if (election.status === "cancelled") return false;
  return now >= votingStart && now <= votingEnd;
};

export default function Election({
  clubId: propClubId,
  club: propClub,
  membership,
  permissions,
  currentUser: propCurrentUser,
}) {
  const { clubId: routeClubId } = useParams();
  const clubId = propClubId || routeClubId;

  const [club, setClub] = useState(propClub || null);
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingElectionId, setEditingElectionId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");

  const currentUser = propCurrentUser || getCurrentUser();
  const userRole = normalizeRole(currentUser?.role);

  const currentUserId =
    currentUser?._id?.toString?.() ||
    currentUser?.id?.toString?.() ||
    currentUser?.userId?.toString?.() ||
    "";

  const todayDate = getTodayDateString();
  const currentTime = getCurrentTimeString();

  useEffect(() => {
    if (propClub) {
      setClub(propClub);
    }
  }, [propClub]);

  const clubMemberRecord = useMemo(() => {
    if (!club?.members || !currentUserId) return null;

    return club.members.find((member) => {
      const memberUserId =
        member?.user?._id?.toString?.() ||
        member?.user?.id?.toString?.() ||
        member?.user?.userId?.toString?.() ||
        member?.user?.toString?.() ||
        member?._id?.toString?.() ||
        member?.memberId?.toString?.();

      const memberStatus = String(member?.status || "")
        .trim()
        .toLowerCase();

      return (
        String(memberUserId) === String(currentUserId) &&
        ["active", "approved"].includes(memberStatus)
      );
    });
  }, [club, currentUserId]);

  const dashboardMembershipRole = normalizeRole(membership?.role);
  const detectedMemberRole = normalizeRole(clubMemberRecord?.role);

  const clubMemberRole =
    dashboardMembershipRole || detectedMemberRole || normalizeRole("");

  const isSystemAdmin = userRole.toUpperCase() === "SYSTEM_ADMIN";

  const canCreateOrManageElections =
    permissions?.canManageClub === true ||
    isSystemAdmin ||
    MANAGEMENT_ROLES.includes(clubMemberRole);

  const canViewElections =
    permissions?.canManageClub === true ||
    isSystemAdmin ||
    MEMBER_ROLES.includes(clubMemberRole) ||
    String(club?.status || "").toLowerCase() === "active";

  const canVoteInElections = [
  "MEMBER",
  "PRESIDENT",
  "VICE_PRESIDENT",
  "EXECUTIVE_COMMITTEE_MEMBER"
].includes(clubMemberRole);

  const getTimeMin = (selectedDate) => {
    return selectedDate === todayDate ? currentTime : "";
  };

  const validateForm = () => {
    const errors = {};
    const now = new Date();

    if (!form.title.trim()) {
      errors.title = "Election title is required";
    } else if (form.title.trim().length < 3) {
      errors.title = "Election title must be at least 3 characters";
    } else if (form.title.trim().length > 120) {
      errors.title = "Election title cannot exceed 120 characters";
    }

    if (!form.description.trim()) {
      errors.description = "Description is required";
    } else if (form.description.trim().length < 10) {
      errors.description = "Description must be at least 10 characters";
    } else if (form.description.trim().length > 1000) {
      errors.description = "Description cannot exceed 1000 characters";
    }

    if (!form.position) {
      errors.position = "Please select a position";
    }

    if (!form.nominationStartDate) {
      errors.nominationStartDate = "Nomination start date is required";
    }
    if (!form.nominationStartTime) {
      errors.nominationStartTime = "Nomination start time is required";
    }
    if (!form.nominationEndDate) {
      errors.nominationEndDate = "Nomination end date is required";
    }
    if (!form.nominationEndTime) {
      errors.nominationEndTime = "Nomination end time is required";
    }
    if (!form.votingStartDate) {
      errors.votingStartDate = "Voting start date is required";
    }
    if (!form.votingStartTime) {
      errors.votingStartTime = "Voting start time is required";
    }
    if (!form.votingEndDate) {
      errors.votingEndDate = "Voting end date is required";
    }
    if (!form.votingEndTime) {
      errors.votingEndTime = "Voting end time is required";
    }

    const nominationStart = parseLocalDateTime(
      form.nominationStartDate,
      form.nominationStartTime
    );
    const nominationEnd = parseLocalDateTime(
      form.nominationEndDate,
      form.nominationEndTime
    );
    const votingStart = parseLocalDateTime(
      form.votingStartDate,
      form.votingStartTime
    );
    const votingEnd = parseLocalDateTime(
      form.votingEndDate,
      form.votingEndTime
    );

    if (nominationStart && nominationStart < now) {
      errors.nominationStartTime = "Nomination start cannot be in the past";
    }

    if (nominationEnd && nominationStart && nominationEnd <= nominationStart) {
      errors.nominationEndTime = "Nomination end must be after nomination start";
    }

    if (votingStart && nominationEnd && votingStart <= nominationEnd) {
      errors.votingStartTime = "Voting start must be after nomination end";
    }

    if (votingEnd && votingStart && votingEnd <= votingStart) {
      errors.votingEndTime = "Voting end must be after voting start";
    }

    if (form.eligibility && form.eligibility.trim().length > 500) {
      errors.eligibility = "Eligibility cannot exceed 500 characters";
    }

    if (form.maxCandidates !== "") {
      const value = Number(form.maxCandidates);
      if (Number.isNaN(value) || value <= 0) {
        errors.maxCandidates = "Max candidates must be greater than 0";
      }
    }

    const cleanedCandidates = form.candidates
      .map((name) => String(name || "").trim())
      .filter(Boolean);

    if (cleanedCandidates.length === 0) {
      errors.candidates = "Add at least one candidate";
    }

    if (
      form.maxCandidates !== "" &&
      cleanedCandidates.length > Number(form.maxCandidates)
    ) {
      errors.candidates = "Candidates exceed max candidates";
    }

    return errors;
  };

  const resetForm = () => {
    setForm(initialForm);
    setFormErrors({});
    setEditingElectionId(null);
    setShowForm(false);
  };

  const fetchClub = async () => {
    if (propClub) {
      setClub(propClub);
      return;
    }

    const res = await API.get(`/clubs/${clubId}`);
    const clubData = res?.data || res;
    setClub(clubData);
  };

  const fetchElections = async () => {
    const res = await API.get(`/elections/club/${clubId}`);
    const data = Array.isArray(res.data) ? res.data : res.data?.elections || [];
    setElections(data);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setPageError("");
      await Promise.all([fetchClub(), fetchElections()]);
    } catch (error) {
      console.error("Load elections error:", error);
      setPageError(
        error?.response?.data?.message || "Failed to load elections"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clubId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleCandidateChange = (index, value) => {
    setForm((prev) => {
      const updated = [...prev.candidates];
      updated[index] = value;
      return {
        ...prev,
        candidates: updated,
      };
    });

    if (formErrors.candidates) {
      setFormErrors((prev) => ({
        ...prev,
        candidates: "",
      }));
    }
  };

  const addCandidateField = () => {
    setForm((prev) => ({
      ...prev,
      candidates: [...prev.candidates, ""],
    }));
  };

  const removeCandidateField = (index) => {
    setForm((prev) => {
      if (prev.candidates.length === 1) return prev;
      return {
        ...prev,
        candidates: prev.candidates.filter((_, i) => i !== index),
      };
    });
  };

  const handleEdit = (election) => {
    setEditingElectionId(election._id);
    setForm({
      title: election.title || "",
      description: election.description || "",
      position: election.position || "",
      nominationStartDate: toInputDate(election.nominationStartDate),
      nominationStartTime: toInputTime(election.nominationStartDate),
      nominationEndDate: toInputDate(election.nominationEndDate),
      nominationEndTime: toInputTime(election.nominationEndDate),
      votingStartDate: toInputDate(election.votingStartDate),
      votingStartTime: toInputTime(election.votingStartDate),
      votingEndDate: toInputDate(election.votingEndDate),
      votingEndTime: toInputTime(election.votingEndDate),
      eligibility: election.eligibility || "",
      maxCandidates:
        election.maxCandidates !== undefined && election.maxCandidates !== null
          ? String(election.maxCandidates)
          : "",
      candidates:
        Array.isArray(election.candidates) && election.candidates.length > 0
          ? election.candidates.map((candidate) => candidate.name || "")
          : [""],
    });
    setFormErrors({});
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (electionId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this election?"
    );
    if (!confirmed) return;

    try {
      await API.delete(`/elections/${electionId}`);
      setElections((prev) => prev.filter((item) => item._id !== electionId));
      toast.success("Election deleted successfully");
    } catch (error) {
      console.error("Delete election error:", error);
      toast.error(error?.response?.data?.message || "Failed to delete election");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) return;

    const nominationStart = parseLocalDateTime(
      form.nominationStartDate,
      form.nominationStartTime
    );
    const nominationEnd = parseLocalDateTime(
      form.nominationEndDate,
      form.nominationEndTime
    );
    const votingStart = parseLocalDateTime(
      form.votingStartDate,
      form.votingStartTime
    );
    const votingEnd = parseLocalDateTime(
      form.votingEndDate,
      form.votingEndTime
    );

    const payload = {
      clubId,
      title: form.title.trim(),
      description: form.description.trim(),
      position: form.position,
      nominationStartDate: nominationStart?.toISOString(),
      nominationEndDate: nominationEnd?.toISOString(),
      votingStartDate: votingStart?.toISOString(),
      votingEndDate: votingEnd?.toISOString(),
      eligibility: form.eligibility.trim(),
      maxCandidates:
        form.maxCandidates === "" ? null : Number(form.maxCandidates),
      candidates: form.candidates
        .map((name) => ({ name: String(name || "").trim() }))
        .filter((candidate) => candidate.name),
    };

    try {
      setSubmitting(true);

      if (editingElectionId) {
        const res = await API.put(`/elections/${editingElectionId}`, payload);
        const updatedElection = res.data?.election || res.data;

        setElections((prev) =>
          prev.map((item) =>
            item._id === editingElectionId ? updatedElection : item
          )
        );
      } else {
        const res = await API.post("/elections", payload);
        const newElection = res.data?.election || res.data;

        setElections((prev) => [newElection, ...prev]);
      }

      toast.success(editingElectionId ? "Election updated successfully" : "Election created successfully");
      resetForm();
    } catch (error) {
      console.error("Submit election error:", error);
      toast.error(error?.response?.data?.message || "Failed to save election");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredElections = useMemo(() => {
    return elections.filter((election) => {
      const computedStatus = getElectionStatus(election);

      const query = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !query ||
        election.title?.toLowerCase().includes(query) ||
        election.description?.toLowerCase().includes(query) ||
        election.position?.toLowerCase().includes(query) ||
        election.eligibility?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || computedStatus === statusFilter;

      const matchesPosition =
        positionFilter === "all" || election.position === positionFilter;

      return matchesSearch && matchesStatus && matchesPosition;
    });
  }, [elections, searchTerm, statusFilter, positionFilter]);

  const summary = useMemo(() => {
    const total = elections.length;
    const upcoming = elections.filter(
      (election) => getElectionStatus(election) === "upcoming"
    ).length;
    const ongoing = elections.filter(
      (election) => getElectionStatus(election) === "ongoing"
    ).length;
    const completed = elections.filter(
      (election) => getElectionStatus(election) === "completed"
    ).length;

    return {
      total,
      upcoming,
      ongoing,
      completed,
    };
  }, [elections]);

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-600">Loading elections...</p>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-medium text-red-700">{pageError}</p>
      </div>
    );
  }

  if (!canViewElections) {
    return (
      <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
        <h3 className="mb-2 text-lg font-semibold text-yellow-800">
          Access Restricted
        </h3>
        <p className="text-sm text-yellow-700">
          You are not allowed to view this club’s elections.
        </p>
      </div>
    );
  }

return (
  <div className="space-y-6">
    <div className="bg-white rounded-3xl border border-[#d7e2f6] p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#1b2230]">Elections</h2>
          <p className="mt-2 text-sm text-[#516072]">
            Manage elections and voting activities.
          </p>
        </div>

        {canCreateOrManageElections && (
          <button
            type="button"
            onClick={() => {
              if (showForm && !editingElectionId) {
                resetForm();
              } else {
                setShowForm(true);
                setEditingElectionId(null);
                setForm(initialForm);
                setFormErrors({});
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2f5ea8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3a6dbc]"
          >
            {showForm && !editingElectionId ? "Close Form" : "Create Election"}
          </button>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-[#d7e2f6] bg-[#eef4ff] p-4">
          <p className="text-sm font-semibold text-[#516072]">Total</p>
          <p className="mt-2 text-3xl font-black text-[#1b2230]">{summary.total}</p>
        </div>

        <div className="rounded-2xl border border-[#d7e2f6] bg-[#eef4ff] p-4">
          <p className="text-sm font-semibold text-[#516072]">Upcoming</p>
          <p className="mt-2 text-3xl font-black text-[#2f5ea8]">{summary.upcoming}</p>
        </div>

        <div className="rounded-2xl border border-[#d7e2f6] bg-[#eef4ff] p-4">
          <p className="text-sm font-semibold text-[#516072]">Ongoing</p>
          <p className="mt-2 text-3xl font-black text-[#f37021]">{summary.ongoing}</p>
        </div>

        <div className="rounded-2xl border border-[#d7e2f6] bg-[#eef4ff] p-4">
          <p className="text-sm font-semibold text-[#516072]">Completed</p>
          <p className="mt-2 text-3xl font-black text-[#1b2230]">{summary.completed}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search elections..."
            className="w-full rounded-xl border border-[#d7e2f6] bg-white px-4 py-3 text-sm text-[#1b2230] outline-none focus:ring-2 focus:ring-[#2f5ea8]"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-[#d7e2f6] bg-white px-4 py-3 text-sm text-[#1b2230] outline-none focus:ring-2 focus:ring-[#2f5ea8]"
          >
            <option value="all">All Statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="w-full rounded-xl border border-[#d7e2f6] bg-white px-4 py-3 text-sm text-[#1b2230] outline-none focus:ring-2 focus:ring-[#2f5ea8]"
          >
            <option value="all">All Positions</option>
            {ELECTION_POSITIONS.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>

    {canCreateOrManageElections && showForm && (
      <div className="rounded-3xl border border-[#d7e2f6] bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-[#1b2230]">
              {editingElectionId ? "Edit Election" : "Create Election"}
            </h3>
            <p className="mt-1 text-sm text-[#516072]">
              Set nomination and voting dates, position, candidates, and eligibility.
            </p>
          </div>

          <button
            type="button"
            onClick={resetForm}
            className="rounded-xl border border-[#d7e2f6] px-4 py-2 text-sm font-semibold text-[#516072] hover:bg-[#eef4ff]"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-[#516072]">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                className="w-full rounded-xl border border-[#d7e2f6] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2f5ea8]"
              />
              {formErrors.title && (
                <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-[#516072]">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="4"
                className="w-full rounded-xl border border-[#d7e2f6] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2f5ea8]"
              />
              {formErrors.description && (
                <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#516072]">
                Position
              </label>
              <select
                name="position"
                value={form.position}
                onChange={handleChange}
                className="w-full rounded-xl border border-[#d7e2f6] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2f5ea8]"
              >
                <option value="">Select position</option>
                {ELECTION_POSITIONS.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
              {formErrors.position && (
                <p className="mt-1 text-sm text-red-600">{formErrors.position}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#516072]">
                Max Candidates
              </label>
              <input
                type="number"
                min="1"
                name="maxCandidates"
                value={form.maxCandidates}
                onChange={handleChange}
                className="w-full rounded-xl border border-[#d7e2f6] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2f5ea8]"
              />
              {formErrors.maxCandidates && (
                <p className="mt-1 text-sm text-red-600">{formErrors.maxCandidates}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#516072]">
                Nomination Start Date
              </label>
              <input
                type="date"
                name="nominationStartDate"
                value={form.nominationStartDate}
                onChange={handleChange}
                min={todayDate}
                className="w-full rounded-xl border border-[#d7e2f6] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2f5ea8]"
              />
              {formErrors.nominationStartDate && (
                <p className="mt-1 text-sm text-red-600">{formErrors.nominationStartDate}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#516072]">
                Nomination Start Time
              </label>
              <input
                type="time"
                name="nominationStartTime"
                value={form.nominationStartTime}
                onChange={handleChange}
                min={getTimeMin(form.nominationStartDate)}
                className="w-full rounded-xl border border-[#d7e2f6] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2f5ea8]"
              />
              {formErrors.nominationStartTime && (
                <p className="mt-1 text-sm text-red-600">{formErrors.nominationStartTime}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#516072]">
                Nomination End Date
              </label>
              <input
                type="date"
                name="nominationEndDate"
                value={form.nominationEndDate}
                onChange={handleChange}
                min={form.nominationStartDate || todayDate}
                className="w-full rounded-xl border border-[#d7e2f6] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2f5ea8]"
              />
              {formErrors.nominationEndDate && (
                <p className="mt-1 text-sm text-red-600">{formErrors.nominationEndDate}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#516072]">
                Nomination End Time
              </label>
              <input
                type="time"
                name="nominationEndTime"
                value={form.nominationEndTime}
                onChange={handleChange}
                className="w-full rounded-xl border border-[#d7e2f6] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2f5ea8]"
              />
              {formErrors.nominationEndTime && (
                <p className="mt-1 text-sm text-red-600">{formErrors.nominationEndTime}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#516072]">
                Voting Start Date
              </label>
              <input
                type="date"
                name="votingStartDate"
                value={form.votingStartDate}
                onChange={handleChange}
                min={form.nominationEndDate || todayDate}
                className="w-full rounded-xl border border-[#d7e2f6] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2f5ea8]"
              />
              {formErrors.votingStartDate && (
                <p className="mt-1 text-sm text-red-600">{formErrors.votingStartDate}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#516072]">
                Voting Start Time
              </label>
              <input
                type="time"
                name="votingStartTime"
                value={form.votingStartTime}
                onChange={handleChange}
                className="w-full rounded-xl border border-[#d7e2f6] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2f5ea8]"
              />
              {formErrors.votingStartTime && (
                <p className="mt-1 text-sm text-red-600">{formErrors.votingStartTime}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#516072]">
                Voting End Date
              </label>
              <input
                type="date"
                name="votingEndDate"
                value={form.votingEndDate}
                onChange={handleChange}
                min={form.votingStartDate || todayDate}
                className="w-full rounded-xl border border-[#d7e2f6] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2f5ea8]"
              />
              {formErrors.votingEndDate && (
                <p className="mt-1 text-sm text-red-600">{formErrors.votingEndDate}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#516072]">
                Voting End Time
              </label>
              <input
                type="time"
                name="votingEndTime"
                value={form.votingEndTime}
                onChange={handleChange}
                className="w-full rounded-xl border border-[#d7e2f6] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2f5ea8]"
              />
              {formErrors.votingEndTime && (
                <p className="mt-1 text-sm text-red-600">{formErrors.votingEndTime}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-[#516072]">
                Eligibility
              </label>
              <textarea
                name="eligibility"
                value={form.eligibility}
                onChange={handleChange}
                rows="3"
                className="w-full rounded-xl border border-[#d7e2f6] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2f5ea8]"
              />
              {formErrors.eligibility && (
                <p className="mt-1 text-sm text-red-600">{formErrors.eligibility}</p>
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-semibold text-[#516072]">
                Candidates
              </label>
              <button
                type="button"
                onClick={addCandidateField}
                className="rounded-xl border border-[#d7e2f6] px-3 py-1.5 text-sm font-semibold text-[#2f5ea8] hover:bg-[#eef4ff]"
              >
                Add Candidate
              </button>
            </div>

            <div className="space-y-3">
              {form.candidates.map((candidate, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    value={candidate}
                    onChange={(e) => handleCandidateChange(index, e.target.value)}
                    placeholder={`Candidate ${index + 1}`}
                    className="flex-1 rounded-xl border border-[#d7e2f6] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2f5ea8]"
                  />
                  {form.candidates.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCandidateField(index)}
                      className="rounded-xl bg-[#f37021] px-4 py-2 text-sm font-semibold text-white hover:bg-[#d85f1b]"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            {formErrors.candidates && (
              <p className="mt-1 text-sm text-red-600">{formErrors.candidates}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-[#d7e2f6] px-5 py-2.5 text-sm font-semibold text-[#516072] hover:bg-[#eef4ff]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#2f5ea8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3a6dbc] disabled:opacity-60"
            >
              {submitting
                ? editingElectionId
                  ? "Updating..."
                  : "Creating..."
                : editingElectionId
                ? "Update Election"
                : "Create Election"}
            </button>
          </div>
        </form>
      </div>
    )}

    {filteredElections.length === 0 ? (
      <div className="rounded-3xl border border-[#d7e2f6] bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-[#516072]">No elections found.</p>
      </div>
    ) : (
      <div className="space-y-4">
        {filteredElections.map((election) => {
          const computedStatus = getElectionStatus(election);

          return (
            <div
              key={election._id}
              className="rounded-3xl border border-[#d7e2f6] bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-black text-[#1b2230]">
                      {election.title}
                    </h3>
                    <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-semibold text-[#2f5ea8]">
                      {computedStatus}
                    </span>
                    <span className="rounded-full bg-[#fff4ec] px-3 py-1 text-xs font-semibold text-[#f37021]">
                      {election.position}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-[#516072]">
                    {election.description}
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-[#eef4ff] p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#2f5ea8]">
                        Nomination
                      </p>
                      <p className="mt-1 text-sm text-[#1b2230]">
                        {formatDateTime(election.nominationStartDate)}
                      </p>
                      <p className="mt-1 text-sm text-[#1b2230]">
                        to {formatDateTime(election.nominationEndDate)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#eef4ff] p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#2f5ea8]">
                        Voting
                      </p>
                      <p className="mt-1 text-sm text-[#1b2230]">
                        {formatDateTime(election.votingStartDate)}
                      </p>
                      <p className="mt-1 text-sm text-[#1b2230]">
                        to {formatDateTime(election.votingEndDate)}
                      </p>
                    </div>
                  </div>

                  {election.eligibility && (
                    <div className="mt-3 rounded-2xl bg-[#fff4ec] p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#f37021]">
                        Eligibility
                      </p>
                      <p className="mt-1 text-sm text-[#1b2230]">
                        {election.eligibility}
                      </p>
                    </div>
                  )}

                  <div className="mt-3">
                    <p className="text-sm font-semibold text-[#516072]">
                      Candidates:
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Array.isArray(election.candidates) &&
                      election.candidates.length > 0 ? (
                        election.candidates.map((candidate, index) => (
                          <span
                            key={index}
                            className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-semibold text-[#2f5ea8]"
                          >
                            {candidate.name || `Candidate ${index + 1}`}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-[#516072]">
                          No candidates added
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 lg:w-[220px]">
                  <Link
                    to={`/clubs/${clubId}/elections/${election._id}`}
                    className="inline-flex items-center justify-center rounded-xl bg-[#2f5ea8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3a6dbc]"
                  >
                    {isVotingOpen(election) && canVoteInElections
                      ? "Vote Now"
                      : "View Election"}
                  </Link>

                  {canCreateOrManageElections && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleEdit(election)}
                        className="rounded-xl border border-[#d7e2f6] px-4 py-2.5 text-sm font-semibold text-[#516072] hover:bg-[#eef4ff]"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(election._id)}
                        className="rounded-xl bg-[#f37021] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#d85f1b]"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);
}