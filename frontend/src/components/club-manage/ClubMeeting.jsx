import React, { useEffect, useMemo, useState } from "react";
import {
  getClubMeetings,
  getPendingClubMeetings,
  createClubMeeting,
  approveClubMeeting,
  rejectClubMeeting,
  deleteClubMeeting,
} from "../../services/clubmeetingService";

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:5000";

const initialForm = {
  title: "",
  description: "",
  category: "Meeting",
  venue: "",
  startDate: "",
  endDate: "",
  image: null,
};

const initialErrors = {
  title: "",
  description: "",
  category: "",
  venue: "",
  startDate: "",
  endDate: "",
  image: "",
};

const MEETING_CATEGORIES = [
  "Workshop",
  "Seminar",
  "Competition",
  "Meeting",
  "Social",
  "Awareness",
  "Fundraiser",
  "Training",
  "Other",
];

const normalizeRole = (role) => String(role || "").trim().toLowerCase();

const ALLOWED_CREATOR_ROLES = [
  "club_admin",
  "executive_committee_member",
  "president",
  "vice_president",
  "secretary",
  "treasurer",
];

const pad = (num) => String(num).padStart(2, "0");

const toDateTimeLocalValue = (date) => {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getSameDaySameTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return toDateTimeLocalValue(date);
};

const getMeetingStatus = (meeting) => {
  if (!meeting) return "unknown";

  const rawStatus = String(meeting.status || "").trim().toLowerCase();
  if (rawStatus) return rawStatus;

  const now = new Date();
  const start = new Date(meeting.startDate);
  const end = new Date(meeting.endDate);

  if (!Number.isNaN(end.getTime()) && end < now) return "completed";
  if (!Number.isNaN(start.getTime()) && start > now) return "upcoming";
  if (
    !Number.isNaN(start.getTime()) &&
    !Number.isNaN(end.getTime()) &&
    start <= now &&
    end >= now
  ) {
    return "ongoing";
  }

  return "unknown";
};

const getStatusBadgeClass = (status) => {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "approved" || normalized === "upcoming") {
    return "bg-[#eef4ff] text-[#2f5ea8]";
  }

  if (normalized === "pending") {
    return "bg-[#fff4ec] text-[#f37021]";
  }

  if (normalized === "rejected" || normalized === "cancelled") {
    return "bg-red-50 text-red-600";
  }

  if (normalized === "completed") {
    return "bg-slate-100 text-slate-700";
  }

  if (normalized === "ongoing") {
    return "bg-green-100 text-green-700";
  }

  return "bg-slate-100 text-slate-700";
};

const ClubMeeting = ({ clubId, club, membership, permissions, currentUser }) => {
  const [meetings, setMeetings] = useState([]);
  const [pendingMeetings, setPendingMeetings] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState(initialErrors);

  const [loading, setLoading] = useState(false);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [adminSubmittingId, setAdminSubmittingId] = useState(null);
  const [approvalComments, setApprovalComments] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const myClubRole = useMemo(() => {
    return normalizeRole(membership?.role);
  }, [membership]);

  const isSystemAdmin = useMemo(() => {
    return (
      String(currentUser?.role || "").trim().toUpperCase() === "SYSTEM_ADMIN"
    );
  }, [currentUser]);

  const canCreateMeeting = useMemo(() => {
    if (!clubId) return false;
    if (isSystemAdmin) return false;
    if (permissions?.canManageClub === true) return true;
    return ALLOWED_CREATOR_ROLES.includes(myClubRole);
  }, [clubId, isSystemAdmin, permissions, myClubRole]);

  const canReviewPendingMeetings = useMemo(() => {
    return isSystemAdmin;
  }, [isSystemAdmin]);

  const nowMin = useMemo(() => toDateTimeLocalValue(new Date()), []);
  const endMin = useMemo(() => {
    return form.startDate || nowMin;
  }, [form.startDate, nowMin]);

  const summary = useMemo(() => {
    const total = meetings.length;
    const pending = meetings.filter(
      (item) => String(item.approvalStatus || "").toLowerCase() === "pending"
    ).length;
    const approved = meetings.filter(
      (item) => String(item.approvalStatus || "").toLowerCase() === "approved"
    ).length;
    const upcoming = meetings.filter(
      (item) => getMeetingStatus(item) === "upcoming"
    ).length;

    return {
      total,
      pending,
      approved,
      upcoming,
    };
  }, [meetings]);

  const loadMeetings = async () => {
    if (!clubId) return;

    try {
      setLoading(true);
      setError("");
      const data = await getClubMeetings(clubId);

      const meetingsData = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];

      setMeetings(meetingsData);
    } catch (err) {
      console.error("Error loading meetings:", err);
      setError(err?.response?.data?.message || "Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  const loadPendingMeetings = async () => {
    if (!canReviewPendingMeetings) {
      setPendingMeetings([]);
      return;
    }

    try {
      setPendingLoading(true);
      setError("");
      const data = await getPendingClubMeetings();
      const allPending = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];

      const filtered = allPending.filter(
        (item) => String(item?.club?._id || item?.club) === String(clubId)
      );

      setPendingMeetings(filtered);
    } catch (err) {
      console.error("Error loading pending meetings:", err);
      setError(
        err?.response?.data?.message || "Failed to load pending meetings"
      );
    } finally {
      setPendingLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, [clubId]);

  useEffect(() => {
    loadPendingMeetings();
  }, [canReviewPendingMeetings, clubId]);

  const validateField = (name, value, nextForm = form) => {
    const now = new Date();

    switch (name) {
      case "title":
        if (!value.trim()) return "Meeting title is required";
        if (value.trim().length < 3) {
          return "Meeting title must be at least 3 characters";
        }
        if (value.trim().length > 120) {
          return "Meeting title cannot exceed 120 characters";
        }
        return "";

      case "description":
        if (!value.trim()) return "Description is required";
        if (value.trim().length < 10) {
          return "Description must be at least 10 characters";
        }
        if (value.trim().length > 2000) {
          return "Description cannot exceed 2000 characters";
        }
        return "";

      case "category":
        if (!value.trim()) return "Category is required";
        return "";

      case "venue":
        if (!value.trim()) return "Venue is required";
        if (value.trim().length > 200) {
          return "Venue cannot exceed 200 characters";
        }
        return "";

      case "startDate": {
        if (!value) return "Start date and time are required";

        const start = new Date(value);

        if (Number.isNaN(start.getTime())) {
          return "Please enter a valid start date and time";
        }

        if (start < now) {
          return "Start date and time cannot be in the past";
        }

        return "";
      }

      case "endDate": {
        if (!value) return "End date and time are required";

        const start = new Date(nextForm.startDate);
        const end = new Date(value);

        if (Number.isNaN(end.getTime())) {
          return "Please enter a valid end date and time";
        }

        if (!nextForm.startDate || Number.isNaN(start.getTime())) {
          return "Please select a valid start date and time first";
        }

        if (start < now) {
          return "Start date and time cannot be in the past";
        }

        if (end <= start) {
          return "End date and time cannot be earlier than or equal to the start date and time";
        }

        return "";
      }

      case "image": {
        if (!value) return "";

        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
        ];

        if (!allowedTypes.includes(value.type)) {
          return "Only JPG, PNG, or WEBP images are allowed";
        }

        const maxSize = 5 * 1024 * 1024;
        if (value.size > maxSize) {
          return "Image size must be 5MB or less";
        }

        return "";
      }

      default:
        return "";
    }
  };

  const validateForm = () => {
    const nextErrors = {
      title: validateField("title", form.title),
      description: validateField("description", form.description),
      category: validateField("category", form.category),
      venue: validateField("venue", form.venue),
      startDate: validateField("startDate", form.startDate, form),
      endDate: validateField("endDate", form.endDate, form),
      image: validateField("image", form.image, form),
    };

    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "image") {
      const file = files?.[0] || null;

      setForm((prev) => ({
        ...prev,
        image: file,
      }));

      setErrors((prev) => ({
        ...prev,
        image: validateField("image", file),
      }));

      return;
    }

    const nextForm = {
      ...form,
      [name]: value,
    };

    if (name === "startDate" && !form.endDate) {
      nextForm.endDate = getSameDaySameTime(value);
    }

    setForm(nextForm);

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value, nextForm),
      ...(name === "startDate" || name === "endDate"
        ? {
            startDate: validateField("startDate", nextForm.startDate, nextForm),
            endDate: validateField("endDate", nextForm.endDate, nextForm),
          }
        : {}),
    }));

    if (error) setError("");
    if (message) setMessage("");
  };

  const resetForm = () => {
    setForm(initialForm);
    setErrors(initialErrors);
    setShowForm(false);

    const fileInput = document.getElementById("club-meeting-image-input");
    if (fileInput) fileInput.value = "";
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!clubId) {
      setError("Club ID is missing");
      return;
    }

    if (!canCreateMeeting) {
      setError("You are not allowed to create meeting requests");
      return;
    }

    const isValid = validateForm();

    if (!isValid) {
      setError("Please fix the highlighted form errors");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("club", clubId);
      formData.append("title", form.title.trim());
      formData.append("description", form.description.trim());
      formData.append("category", form.category);
      formData.append("venue", form.venue.trim());
      formData.append("startDate", form.startDate);
      formData.append("endDate", form.endDate);

      if (form.image) {
        formData.append("image", form.image);
      }

      const res = await createClubMeeting(formData);

      setMessage(res?.message || "Meeting request submitted for approval");
      resetForm();
      await loadMeetings();
      await loadPendingMeetings();
    } catch (err) {
      console.error("Error creating meeting:", err);
      setError(err?.response?.data?.message || "Failed to create meeting");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (meetingId) => {
    try {
      setAdminSubmittingId(meetingId);
      setError("");
      setMessage("");

      const res = await approveClubMeeting(meetingId, {
        approvalComment: approvalComments[meetingId] || "",
      });

      setMessage(res?.message || "Meeting approved successfully");
      await loadPendingMeetings();
      await loadMeetings();
    } catch (err) {
      console.error("Error approving meeting:", err);
      setError(err?.response?.data?.message || "Failed to approve meeting");
    } finally {
      setAdminSubmittingId(null);
    }
  };

  const handleReject = async (meetingId) => {
    try {
      setAdminSubmittingId(meetingId);
      setError("");
      setMessage("");

      const res = await rejectClubMeeting(meetingId, {
        approvalComment: approvalComments[meetingId] || "",
      });

      setMessage(res?.message || "Meeting rejected successfully");
      await loadPendingMeetings();
      await loadMeetings();
    } catch (err) {
      console.error("Error rejecting meeting:", err);
      setError(err?.response?.data?.message || "Failed to reject meeting");
    } finally {
      setAdminSubmittingId(null);
    }
  };

  const handleDelete = async (meetingId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this meeting?"
    );
    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      const res = await deleteClubMeeting(meetingId);
      setMessage(res?.message || "Meeting deleted successfully");
      await loadMeetings();
      await loadPendingMeetings();
    } catch (err) {
      console.error("Error deleting meeting:", err);
      setError(err?.response?.data?.message || "Failed to delete meeting");
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "Not specified";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not specified";
    return date.toLocaleString();
  };

  const getImageSrc = (imagePath) => {
    if (!imagePath) return "";
    if (/^https?:\/\//i.test(imagePath)) return imagePath;

    return imagePath.startsWith("/")
      ? `${API_BASE_URL}${imagePath}`
      : `${API_BASE_URL}/${imagePath}`;
  };

  const filteredMeetings = useMemo(() => {
    return meetings.filter((meeting) => {
      const lifecycleStatus = getMeetingStatus(meeting);
      const approvalStatus = String(
        meeting.approvalStatus || ""
      ).toLowerCase();
      const query = searchTerm.trim().toLowerCase();

      const matchesSearch =
        !query ||
        meeting.title?.toLowerCase().includes(query) ||
        meeting.description?.toLowerCase().includes(query) ||
        meeting.category?.toLowerCase().includes(query) ||
        meeting.venue?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        lifecycleStatus === statusFilter ||
        approvalStatus === statusFilter;

      const matchesCategory =
        categoryFilter === "all" || meeting.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [meetings, searchTerm, statusFilter, categoryFilter]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-[#d7e2f6] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#1b2230]">
              {club?.name ? `${club.name} Meetings` : "Club Meetings"}
            </h2>
            <p className="mt-2 text-sm text-[#516072]">
              Manage and review meetings for this club.
            </p>
          </div>

          {canCreateMeeting && (
            <button
              type="button"
              onClick={() => setShowForm((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2f5ea8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3a6dbc]"
            >
              {showForm ? "Close Form" : "Create Meeting"}
            </button>
          )}
        </div>

        {(message || error) && (
          <div className="mt-4 space-y-2">
            {message && (
              <div className="rounded-xl border border-[#d7e2f6] bg-[#eef4ff] px-4 py-3 text-sm font-semibold text-[#2f5ea8]">
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-[#d7e2f6] bg-[#eef4ff] p-4">
            <p className="text-sm font-semibold text-[#516072]">Total</p>
            <p className="mt-2 text-3xl font-black text-[#1b2230]">
              {summary.total}
            </p>
          </div>

          <div className="rounded-2xl border border-[#d7e2f6] bg-[#eef4ff] p-4">
            <p className="text-sm font-semibold text-[#516072]">Upcoming</p>
            <p className="mt-2 text-3xl font-black text-[#2f5ea8]">
              {summary.upcoming}
            </p>
          </div>

          <div className="rounded-2xl border border-[#d7e2f6] bg-[#eef4ff] p-4">
            <p className="text-sm font-semibold text-[#516072]">Approved</p>
            <p className="mt-2 text-3xl font-black text-[#2f5ea8]">
              {summary.approved}
            </p>
          </div>

          <div className="rounded-2xl border border-[#d7e2f6] bg-[#eef4ff] p-4">
            <p className="text-sm font-semibold text-[#516072]">Pending</p>
            <p className="mt-2 text-3xl font-black text-[#f37021]">
              {summary.pending}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search meetings..."
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
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-xl border border-[#d7e2f6] bg-white px-4 py-3 text-sm text-[#1b2230] outline-none focus:ring-2 focus:ring-[#2f5ea8]"
            >
              <option value="all">All Categories</option>
              {MEETING_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {canCreateMeeting && showForm && (
        <div className="rounded-3xl border border-[#d7e2f6] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-[#1b2230]">
                Create Meeting
              </h3>
              <p className="mt-1 text-sm text-[#516072]">
                Submit a club meeting request with date, venue, category, and
                image.
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

          <form onSubmit={handleCreateMeeting} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-[#516072]">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#d7e2f6] bg-white px-4 py-3 text-sm text-[#1b2230] outline-none focus:ring-2 focus:ring-[#2f5ea8]"
                  placeholder="Enter meeting title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-[#516072]">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-xl border border-[#d7e2f6] bg-white px-4 py-3 text-sm text-[#1b2230] outline-none focus:ring-2 focus:ring-[#2f5ea8]"
                  placeholder="Enter meeting description"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.description}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#516072]">
                  Category
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#d7e2f6] bg-white px-4 py-3 text-sm text-[#1b2230] outline-none focus:ring-2 focus:ring-[#2f5ea8]"
                >
                  {MEETING_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#516072]">
                  Venue
                </label>
                <input
                  type="text"
                  name="venue"
                  value={form.venue}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#d7e2f6] bg-white px-4 py-3 text-sm text-[#1b2230] outline-none focus:ring-2 focus:ring-[#2f5ea8]"
                  placeholder="Enter venue"
                />
                {errors.venue && (
                  <p className="mt-1 text-sm text-red-600">{errors.venue}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#516072]">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={form.startDate}
                  min={nowMin}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#d7e2f6] bg-white px-4 py-3 text-sm text-[#1b2230] outline-none focus:ring-2 focus:ring-[#2f5ea8]"
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.startDate}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#516072]">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={form.endDate}
                  min={endMin}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#d7e2f6] bg-white px-4 py-3 text-sm text-[#1b2230] outline-none focus:ring-2 focus:ring-[#2f5ea8]"
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-[#516072]">
                  Meeting Image
                </label>
                <input
                  id="club-meeting-image-input"
                  type="file"
                  name="image"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={handleChange}
                  className="block w-full text-sm text-[#516072] file:mr-4 file:rounded-xl file:border-0 file:bg-[#eef4ff] file:px-4 file:py-2 file:font-semibold file:text-[#2f5ea8] hover:file:bg-[#d7e2f6]"
                />
                {errors.image && (
                  <p className="mt-1 text-sm text-red-600">{errors.image}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#f37021] px-5 py-2.5 text-white font-semibold hover:bg-[#d85f1b] disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Meeting Request"}
            </button>
          </form>
        </div>
      )}

      {canReviewPendingMeetings && (
        <div className="rounded-3xl border border-[#d7e2f6] bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h3 className="text-xl font-black text-[#1b2230]">
              Pending Meeting Requests
            </h3>
            <p className="mt-1 text-sm text-[#516072]">
              Review and approve or reject pending requests.
            </p>
          </div>

          {pendingLoading ? (
            <p className="text-sm text-[#516072]">Loading pending meetings...</p>
          ) : pendingMeetings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d7e2f6] p-6 text-center text-sm text-[#516072]">
              No pending meeting requests found.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingMeetings.map((meeting) => {
                const isBusy = adminSubmittingId === meeting._id;

                return (
                  <div
                    key={meeting._id}
                    className="rounded-2xl border border-[#d7e2f6] p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h4 className="text-lg font-black text-[#1b2230]">
                            {meeting.title}
                          </h4>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                              meeting.approvalStatus
                            )}`}
                          >
                            {meeting.approvalStatus || "pending"}
                          </span>
                          <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-semibold text-[#2f5ea8]">
                            {meeting.category || "General"}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-[#516072]">
                          {meeting.description || "No description provided"}
                        </p>

                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="rounded-2xl bg-[#eef4ff] p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#2f5ea8]">
                              Start
                            </p>
                            <p className="mt-1 text-sm text-[#1b2230]">
                              {formatDateTime(meeting.startDate)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-[#eef4ff] p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#2f5ea8]">
                              End
                            </p>
                            <p className="mt-1 text-sm text-[#1b2230]">
                              {formatDateTime(meeting.endDate)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 rounded-2xl bg-[#fff4ec] p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#f37021]">
                            Venue
                          </p>
                          <p className="mt-1 text-sm text-[#1b2230]">
                            {meeting.venue || "Not specified"}
                          </p>
                        </div>

                        <div className="mt-4">
                          <textarea
                            rows={3}
                            value={approvalComments[meeting._id] || ""}
                            onChange={(e) =>
                              setApprovalComments((prev) => ({
                                ...prev,
                                [meeting._id]: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-[#d7e2f6] bg-white px-4 py-3 text-sm text-[#1b2230] outline-none focus:ring-2 focus:ring-[#2f5ea8]"
                            placeholder="Optional approval / rejection comment"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 lg:w-[220px]">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleApprove(meeting._id)}
                          className="rounded-xl bg-[#2f5ea8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3a6dbc] disabled:opacity-60"
                        >
                          {isBusy ? "Processing..." : "Approve"}
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleReject(meeting._id)}
                          className="rounded-xl bg-[#f37021] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#d85f1b] disabled:opacity-60"
                        >
                          {isBusy ? "Processing..." : "Reject"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="rounded-3xl border border-[#d7e2f6] bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-xl font-black text-[#1b2230]">
            Meeting Records
          </h3>
          <p className="mt-1 text-sm text-[#516072]">
            Browse created and approved meetings for this club.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-[#516072]">Loading meetings...</p>
        ) : filteredMeetings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d7e2f6] p-6 text-center text-sm text-[#516072]">
            No meetings found.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMeetings.map((meeting) => {
              const badgeStatus =
                meeting.approvalStatus &&
                String(meeting.approvalStatus).toLowerCase() !== "approved"
                  ? meeting.approvalStatus
                  : getMeetingStatus(meeting);

              return (
                <div
                  key={meeting._id}
                  className="overflow-hidden rounded-2xl border border-[#d7e2f6]"
                >
                  {meeting.image && (
                    <img
                      src={getImageSrc(meeting.image)}
                      alt={meeting.title || "Meeting"}
                      className="h-56 w-full object-cover"
                    />
                  )}

                  <div className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h4 className="text-lg font-black text-[#1b2230]">
                            {meeting.title}
                          </h4>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                              badgeStatus
                            )}`}
                          >
                            {badgeStatus || "unknown"}
                          </span>

                          <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-semibold text-[#2f5ea8]">
                            {meeting.category || "General"}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-[#516072]">
                          {meeting.description || "No description provided"}
                        </p>

                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="rounded-2xl bg-[#eef4ff] p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#2f5ea8]">
                              Start
                            </p>
                            <p className="mt-1 text-sm text-[#1b2230]">
                              {formatDateTime(meeting.startDate)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-[#eef4ff] p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#2f5ea8]">
                              End
                            </p>
                            <p className="mt-1 text-sm text-[#1b2230]">
                              {formatDateTime(meeting.endDate)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 rounded-2xl bg-[#fff4ec] p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#f37021]">
                            Venue
                          </p>
                          <p className="mt-1 text-sm text-[#1b2230]">
                            {meeting.venue || "Not specified"}
                          </p>
                        </div>
                      </div>

                      {(permissions?.canManageClub || isSystemAdmin) && (
                        <div className="flex flex-col gap-3 lg:w-[220px]">
                          <button
                            type="button"
                            onClick={() => handleDelete(meeting._id)}
                            className="rounded-xl bg-[#f37021] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#d85f1b]"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubMeeting;