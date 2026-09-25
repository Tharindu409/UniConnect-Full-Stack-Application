import React, { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Handshake,
  Pencil,
  RefreshCw,
  Sparkles,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import {
  getClubMentors,
  getMentorRequests,
  updateMentorshipRequestStatus,
  createMentorProfile,
  getMyMentorProfile,
  updateMyMentorProfile,
  deleteMyMentorProfile,
} from "../../services/mentorshipService";
import CreateMentorProfile from "./CreateMentorProfile";

const initialForm = {
  title: "",
  bio: "",
  skills: "",
  interests: "",
  expertiseLevel: "Intermediate",
  availability: "Available",
  maxMentees: 5,
};

const normalizeStatus = (status) => {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "active") return "accepted";
  return normalized;
};

const statusBadgeClass = (status) => {
  const normalized = normalizeStatus(status);

  if (normalized === "accepted") return "bg-green-100 text-green-700";
  if (normalized === "rejected") return "bg-red-100 text-red-700";
  if (normalized === "completed") return "bg-blue-100 text-blue-700";
  if (normalized === "cancelled") return "bg-slate-200 text-slate-700";

  return "bg-yellow-100 text-yellow-700";
};

const availabilityBadgeClass = (availability) => {
  const normalized = String(availability || "").toLowerCase();

  if (normalized === "available") return "bg-green-100 text-green-700";
  if (normalized === "busy") return "bg-amber-100 text-amber-700";

  return "bg-slate-200 text-slate-700";
};

const normalizeListField = (value) => {
  if (Array.isArray(value)) return value.join(", ");
  return String(value || "");
};

const splitList = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const StatCard = ({ title, value, subtitle, icon: Icon, accent = "blue" }) => {
  const accentClasses =
    accent === "orange"
      ? "bg-[#fff4ec] text-[#F36C21]"
      : accent === "violet"
      ? "bg-[#eef2ff] text-[#4f46e5]"
      : "bg-[#eef4ff] text-[#0B1E8A]";

  return (
    <div className="rounded-[24px] border border-[#0B1E8A]/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            {title}
          </p>
          <h3 className="mt-3 text-3xl font-black text-[#0B1E8A]">{value}</h3>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        </div>

        <div
          className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${accentClasses}`}
        >
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ title, description, action }) => {
  return (
    <div className="rounded-[28px] border border-dashed border-[#0B1E8A]/15 bg-white px-6 py-12 text-center shadow-sm">
      <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#0B1E8A]">
        <Sparkles size={24} />
      </div>
      <h3 className="mt-4 text-xl font-black text-[#0B1E8A]">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
};

const MentorshipTab = ({ clubId, currentUser, dashboard }) => {
  const [mentors, setMentors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [deletingProfile, setDeletingProfile] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [existingProfile, setExistingProfile] = useState(null);
  const [activeSection, setActiveSection] = useState("profile");
  const [profileFormMode, setProfileFormMode] = useState("create");
  const [showProfileForm, setShowProfileForm] = useState(false);

  const currentUserId = String(currentUser?._id || "");
  const isSystemAdmin =
    String(currentUser?.role || "").trim().toUpperCase() === "SYSTEM_ADMIN";
  const canManageClub =
    isSystemAdmin || Boolean(dashboard?.permissions?.canManageClub);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [mentorsData, mentorRequestsData, myProfileData] = await Promise.all([
        getClubMentors(clubId),
        getMentorRequests(),
        getMyMentorProfile(clubId),
      ]);

      const mentorList = Array.isArray(mentorsData)
        ? mentorsData
        : mentorsData?.data || [];

      const requestList = Array.isArray(mentorRequestsData)
        ? mentorRequestsData
        : mentorRequestsData?.data || [];

      const myProfile = myProfileData?.data || myProfileData || null;

      const clubMentorIds = new Set(
        mentorList.map((item) => String(item?.mentor?._id || item?.mentor || ""))
      );

      const filteredRequests = requestList.filter((request) => {
        const requestClubId = String(request?.club?._id || request?.club || "");
        const requestMentorId = String(
          request?.mentor?._id || request?.mentor || ""
        );

        if (requestClubId === String(clubId)) return true;
        if (clubMentorIds.has(requestMentorId)) return true;

        return false;
      });

      setMentors(mentorList);
      setRequests(filteredRequests);
      setExistingProfile(myProfile);
      setProfileFormMode(myProfile ? "edit" : "create");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to load mentorship data");
      setMentors([]);
      setRequests([]);
      setExistingProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clubId) {
      loadData();
    }
  }, [clubId]);

  const myMentorProfileIds = useMemo(() => {
    return new Set(
      mentors
        .filter(
          (item) =>
            String(item?.mentor?._id || item?.mentor || "") === currentUserId
        )
        .map((item) => String(item?.mentor?._id || item?.mentor || ""))
    );
  }, [mentors, currentUserId]);

  const visibleRequests = useMemo(() => {
    if (canManageClub) return requests;

    return requests.filter((request) => {
      const mentorId = String(request?.mentor?._id || request?.mentor || "");
      return myMentorProfileIds.has(mentorId);
    });
  }, [requests, canManageClub, myMentorProfileIds]);

  const pendingRequests = useMemo(() => {
    return visibleRequests.filter(
      (request) => normalizeStatus(request?.status) === "pending"
    );
  }, [visibleRequests]);

  const otherRequests = useMemo(() => {
    return visibleRequests.filter(
      (request) => normalizeStatus(request?.status) !== "pending"
    );
  }, [visibleRequests]);

  const usedCapacity = Number(existingProfile?.currentMentees || 0);
  const maxCapacity = Number(existingProfile?.maxMentees || 0);
  const capacityPercentage =
    maxCapacity > 0 ? Math.min(100, Math.round((usedCapacity / maxCapacity) * 100)) : 0;

  const profileFormInitialData = useMemo(() => {
    if (!existingProfile) return initialForm;

    return {
      title: existingProfile.title || "",
      bio: existingProfile.bio || "",
      skills: normalizeListField(existingProfile.skills),
      interests: normalizeListField(existingProfile.interests),
      expertiseLevel: existingProfile.expertiseLevel || "Intermediate",
      availability: existingProfile.availability || "Available",
      maxMentees: Number(existingProfile.maxMentees || 5),
    };
  }, [existingProfile]);

  const openCreateForm = () => {
    setError("");
    setSuccess("");
    setProfileFormMode("create");
    setShowProfileForm(true);
    setActiveSection("profile");
  };

  const openEditForm = () => {
    setError("");
    setSuccess("");
    setProfileFormMode("edit");
    setShowProfileForm(true);
    setActiveSection("profile");
  };

  const closeProfileForm = () => {
    setShowProfileForm(false);
    setError("");
  };

  const handleSubmitProfile = async (payload) => {
    try {
      setSubmittingProfile(true);
      setError("");
      setSuccess("");

      const formattedPayload = {
        title: String(payload.title || "").trim(),
        bio: String(payload.bio || "").trim(),
        skills: Array.isArray(payload.skills) ? payload.skills : splitList(payload.skills),
        interests: Array.isArray(payload.interests)
          ? payload.interests
          : splitList(payload.interests),
        expertiseLevel: payload.expertiseLevel,
        availability: payload.availability,
        maxMentees: Number(payload.maxMentees),
      };

      if (existingProfile?._id && profileFormMode === "edit") {
        await updateMyMentorProfile(clubId, formattedPayload);
        setSuccess("Mentor profile updated successfully");
      } else {
        await createMentorProfile(clubId, formattedPayload);
        setSuccess("Mentor profile created successfully");
      }

      setShowProfileForm(false);
      await loadData();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to save mentor profile");
      setSuccess("");
    } finally {
      setSubmittingProfile(false);
    }
  };

  const handleDeleteProfile = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your mentor profile?"
    );

    if (!confirmed) return;

    try {
      setDeletingProfile(true);
      setError("");
      setSuccess("");

      const res = await deleteMyMentorProfile(clubId);
      setSuccess(res?.message || "Mentor profile deleted successfully");
      setExistingProfile(null);
      setShowProfileForm(false);
      setProfileFormMode("create");
      await loadData();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message || "Failed to delete mentor profile"
      );
    } finally {
      setDeletingProfile(false);
    }
  };

  const handleUpdateStatus = async (requestId, status) => {
    try {
      setActionLoadingId(requestId);
      setError("");
      setSuccess("");

      await updateMentorshipRequestStatus(requestId, { status });

      setSuccess(`Request ${normalizeStatus(status)} successfully`);
      await loadData();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          `Failed to ${normalizeStatus(status)} request`
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderMentorCard = (mentorProfile) => {
    const mentorUser = mentorProfile.mentor || {};
    const mentorId = String(mentorUser._id || mentorProfile.mentor);
    const isOwnProfile = mentorId === currentUserId;

    return (
      <div
        key={mentorProfile._id}
        className="rounded-[28px] border border-[#0B1E8A]/10 bg-white p-5 shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#0B1E8A]">
              <UserRound size={22} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <h4 className="text-lg font-black text-[#0B1E8A] break-words">
                {mentorProfile.title ||
                  mentorUser.fullName ||
                  mentorUser.name ||
                  "Mentor"}
              </h4>

              {isOwnProfile && (
                <span className="rounded-full border border-[#F36C21]/15 bg-[#fff4ec] px-3 py-1 text-xs font-semibold text-[#F36C21]">
                  Your Profile
                </span>
              )}

              {mentorProfile.isActive === false && (
                <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  Inactive
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-600">
          {mentorProfile.bio || "No bio added yet."}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold text-[#0B1E8A]">
            {mentorProfile.expertiseLevel || "Not set"}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${availabilityBadgeClass(
              mentorProfile.availability
            )}`}
          >
            {mentorProfile.availability || "Not set"}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            Capacity: {Number(mentorProfile.currentMentees || 0)}/
            {Number(mentorProfile.maxMentees || 0)}
          </span>
        </div>

        <div className="mt-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Skills
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(mentorProfile.skills || []).length > 0 ? (
              mentorProfile.skills.map((skill, index) => (
                <span
                  key={index}
                  className="rounded-full border border-[#0B1E8A]/10 bg-white px-3 py-1 text-xs font-medium text-[#0B1E8A]"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500">No skills added</span>
            )}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Interests
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(mentorProfile.interests || []).length > 0 ? (
              mentorProfile.interests.map((interest, index) => (
                <span
                  key={index}
                  className="rounded-full border border-[#F36C21]/15 bg-[#fff9f5] px-3 py-1 text-xs font-medium text-[#F36C21]"
                >
                  {interest}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500">No interests added</span>
            )}
          </div>
        </div>

        {isOwnProfile && (
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openEditForm}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#0B1E8A]/15 bg-white px-4 py-2.5 text-sm font-semibold text-[#0B1E8A] hover:bg-[#f5f8ff]"
            >
              <Pencil size={16} />
              Edit
            </button>

            <button
              type="button"
              onClick={handleDeleteProfile}
              disabled={deletingProfile}
              className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
            >
              <Trash2 size={16} />
              {deletingProfile ? "Deleting..." : "Delete"}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {(error || success) && (
        <div
          className={`rounded-[24px] border px-5 py-4 text-sm font-medium shadow-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-[#0B1E8A]/10 bg-[#eef4ff] text-[#0B1E8A]"
          }`}
        >
          {error || success}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="My Profile"
          value={existingProfile ? "Active" : "None"}
          subtitle={
            existingProfile
              ? `${usedCapacity}/${maxCapacity || 0} mentees assigned`
              : "Create your mentor profile"
          }
          icon={BriefcaseBusiness}
          accent="blue"
        />

        <StatCard
          title="Available Mentors"
          value={mentors.filter((m) => m?.isActive !== false).length}
          subtitle="Active mentor profiles in this club"
          icon={Users}
          accent="violet"
        />

        <StatCard
          title="Pending Requests"
          value={pendingRequests.length}
          subtitle="Requests waiting for review"
          icon={Handshake}
          accent="orange"
        />
      </div>

      <div className="rounded-[28px] border border-[#0B1E8A]/10 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#F36C21]">
              Mentorship Management
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#0B1E8A]">
              Manage mentor profiles and requests
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              My Profile, Mentors, and Requests are separated for a cleaner workflow.
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#0B1E8A]/15 bg-white px-4 py-3 text-sm font-semibold text-[#0B1E8A] hover:bg-[#f5f8ff] disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setActiveSection("profile")}
            className={`rounded-2xl px-5 py-3 text-sm font-semibold border transition ${
              activeSection === "profile"
                ? "bg-[#0B1E8A] border-[#0B1E8A] text-white"
                : "bg-white border-[#0B1E8A]/15 text-[#0B1E8A] hover:bg-[#f5f8ff]"
            }`}
          >
            My Profile
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("mentors")}
            className={`rounded-2xl px-5 py-3 text-sm font-semibold border transition ${
              activeSection === "mentors"
                ? "bg-[#0B1E8A] border-[#0B1E8A] text-white"
                : "bg-white border-[#0B1E8A]/15 text-[#0B1E8A] hover:bg-[#f5f8ff]"
            }`}
          >
            Mentors
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("requests")}
            className={`rounded-2xl px-5 py-3 text-sm font-semibold border transition ${
              activeSection === "requests"
                ? "bg-[#F36C21] border-[#F36C21] text-white"
                : "bg-white border-[#F36C21]/20 text-[#F36C21] hover:bg-[#fff4ec]"
            }`}
          >
            Requests ({visibleRequests.length})
          </button>
        </div>
      </div>

      {activeSection === "profile" && (
        <div className="space-y-6">
          {showProfileForm ? (
            <CreateMentorProfile
              mode={profileFormMode}
              initialData={profileFormInitialData}
              loading={submittingProfile}
              onSubmit={handleSubmitProfile}
              onCancel={closeProfileForm}
            />
          ) : existingProfile ? (
            <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
              <div className="rounded-[28px] border border-[#0B1E8A]/10 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#F36C21]">
                      My Mentor Profile
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-[#0B1E8A]">
                      {existingProfile.title || "Mentor Profile"}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Your mentor profile in this club.
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      existingProfile.isActive === false
                        ? "border border-slate-200 bg-slate-100 text-slate-700"
                        : "border border-green-200 bg-green-50 text-green-700"
                    }`}
                  >
                    {existingProfile.isActive === false ? "Inactive" : "Active"}
                  </span>
                </div>

                <p className="mt-5 text-sm leading-7 text-slate-600">
                  {existingProfile.bio || "No bio added yet."}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold text-[#0B1E8A]">
                    {existingProfile.expertiseLevel || "Intermediate"}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${availabilityBadgeClass(
                      existingProfile.availability
                    )}`}
                  >
                    {existingProfile.availability || "Available"}
                  </span>
                </div>

                <div className="mt-6">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Skills
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(existingProfile.skills || []).length > 0 ? (
                      existingProfile.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="rounded-full border border-[#0B1E8A]/10 bg-white px-3 py-1 text-xs font-medium text-[#0B1E8A]"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">No skills added</span>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Interests
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(existingProfile.interests || []).length > 0 ? (
                      existingProfile.interests.map((interest, index) => (
                        <span
                          key={index}
                          className="rounded-full border border-[#F36C21]/15 bg-[#fff9f5] px-3 py-1 text-xs font-medium text-[#F36C21]"
                        >
                          {interest}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">
                        No interests added
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-7 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={openEditForm}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#0B1E8A] px-5 py-3 text-sm font-bold text-white hover:bg-[#09186f]"
                  >
                    <Pencil size={16} />
                    Edit Profile
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteProfile}
                    disabled={deletingProfile}
                    className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-700 hover:bg-red-100 disabled:opacity-60"
                  >
                    <Trash2 size={16} />
                    {deletingProfile ? "Deleting..." : "Delete Profile"}
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[28px] border border-[#0B1E8A]/10 bg-white p-6 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Capacity
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-[#0B1E8A]">
                    {usedCapacity}/{maxCapacity || 0}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Current mentees versus maximum capacity.
                  </p>

                  <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-[#edf2ff]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#0B1E8A] to-[#F36C21]"
                      style={{ width: `${capacityPercentage}%` }}
                    />
                  </div>

                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {capacityPercentage}% used
                  </p>
                </div>

                <div className="rounded-[28px] border border-[#0B1E8A]/10 bg-white p-6 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Quick Overview
                  </p>

                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <div className="flex items-center justify-between rounded-2xl bg-[#f8faff] px-4 py-3">
                      <span>Availability</span>
                      <span className="font-semibold text-[#0B1E8A]">
                        {existingProfile.availability || "Available"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-[#f8faff] px-4 py-3">
                      <span>Expertise</span>
                      <span className="font-semibold text-[#0B1E8A]">
                        {existingProfile.expertiseLevel || "Intermediate"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-[#f8faff] px-4 py-3">
                      <span>Visible in mentor list</span>
                      <span className="font-semibold text-green-700">
                        {existingProfile.isActive === false ? "No" : "Yes"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              title="You have not created a mentor profile yet"
              description="Create your mentor profile to let students discover your skills, interests, expertise, and availability."
              action={
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#F36C21] px-5 py-3 text-sm font-bold text-white hover:bg-[#dc5f17]"
                >
                  <Sparkles size={16} />
                  Create Mentor Profile
                </button>
              }
            />
          )}
        </div>
      )}

      {activeSection === "mentors" && (
        <div className="rounded-[28px] border border-[#0B1E8A]/10 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#F36C21]">
                Mentor Directory
              </p>
              <h3 className="mt-2 text-2xl font-black text-[#0B1E8A]">
                Available Mentors
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Browse all active mentor profiles created for this club.
              </p>
            </div>

            <span className="rounded-full border border-[#0B1E8A]/10 bg-[#f8faff] px-3 py-1 text-sm font-semibold text-[#0B1E8A]">
              {mentors.length} total
            </span>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-slate-500">Loading mentors...</p>
          ) : mentors.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="No mentors found"
                description="There are no mentor profiles in this club yet."
              />
            </div>
          ) : (
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {mentors.map((mentorProfile) => renderMentorCard(mentorProfile))}
            </div>
          )}
        </div>
      )}

      {activeSection === "requests" && (
        <div className="space-y-6">
          <div className="rounded-[28px] border border-[#0B1E8A]/10 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#F36C21]">
              Mentorship Requests
            </p>
            <h3 className="mt-2 text-2xl font-black text-[#0B1E8A]">
              Review and manage requests
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Pending requests are shown first, followed by request history.
            </p>
          </div>

          <div className="rounded-[28px] border border-[#0B1E8A]/10 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h4 className="text-xl font-black text-[#0B1E8A]">
                  Pending Requests
                </h4>
                <p className="mt-2 text-sm text-slate-500">
                  Requests waiting for review.
                </p>
              </div>

              <span className="rounded-full border border-[#F36C21]/15 bg-[#fff4ec] px-3 py-1 text-sm font-semibold text-[#F36C21]">
                {pendingRequests.length} pending
              </span>
            </div>

            {loading ? (
              <p className="mt-6 text-sm text-slate-500">Loading requests...</p>
            ) : pendingRequests.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  title="No pending mentorship requests"
                  description="You do not have any mentorship requests waiting for review right now."
                />
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {pendingRequests.map((request) => {
                  const requestId = String(request?._id || "");

                  return (
                    <div
                      key={requestId}
                      className="rounded-[24px] border border-[#0B1E8A]/10 bg-[#f8faff] p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div>
                            <h5 className="text-lg font-black text-[#0B1E8A]">
                              {request?.student?.fullName ||
                                request?.student?.name ||
                                "Student"}
                            </h5>
                            <p className="mt-2 text-sm text-slate-600">
                              {request?.message || "No message provided"}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(
                                request?.status
                              )}`}
                            >
                              {normalizeStatus(request?.status) || "pending"}
                            </span>

                            {request?.matchScore !== undefined && (
                              <span className="inline-flex rounded-full border border-[#0B1E8A]/10 bg-white px-3 py-1 text-xs font-semibold text-[#0B1E8A]">
                                Match Score: {request.matchScore}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateStatus(requestId, "accepted")
                            }
                            disabled={actionLoadingId === requestId}
                            className="rounded-2xl bg-[#F36C21] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
                          >
                            {actionLoadingId === requestId ? "Saving..." : "Accept"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateStatus(requestId, "rejected")
                            }
                            disabled={actionLoadingId === requestId}
                            className="rounded-2xl border border-[#0B1E8A]/15 bg-white px-5 py-3 text-sm font-bold text-[#0B1E8A] disabled:opacity-60"
                          >
                            {actionLoadingId === requestId ? "Saving..." : "Reject"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-[#0B1E8A]/10 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h4 className="text-xl font-black text-[#0B1E8A]">
                  Request History
                </h4>
                <p className="mt-2 text-sm text-slate-500">
                  Accepted, rejected, completed, and cancelled requests.
                </p>
              </div>

              <span className="rounded-full border border-[#0B1E8A]/10 bg-[#f8faff] px-3 py-1 text-sm font-semibold text-[#0B1E8A]">
                {otherRequests.length} total
              </span>
            </div>

            {loading ? (
              <p className="mt-6 text-sm text-slate-500">Loading history...</p>
            ) : otherRequests.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  title="No request history yet"
                  description="Processed mentorship requests will appear here."
                />
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {otherRequests.map((request) => {
                  const requestId = String(request?._id || "");

                  return (
                    <div
                      key={requestId}
                      className="rounded-[24px] border border-[#0B1E8A]/10 bg-white p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <h5 className="text-lg font-black text-[#0B1E8A]">
                            {request?.student?.fullName ||
                              request?.student?.name ||
                              "Student"}
                          </h5>

                          <p className="mt-2 text-sm text-slate-600">
                            {request?.message || "No message provided"}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(
                                request?.status
                              )}`}
                            >
                              {normalizeStatus(request?.status) || "pending"}
                            </span>

                            {request?.matchScore !== undefined && (
                              <span className="inline-flex rounded-full border border-[#0B1E8A]/10 bg-[#f8faff] px-3 py-1 text-xs font-semibold text-[#0B1E8A]">
                                Match Score: {request.matchScore}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-[#f8faff] px-4 py-3 text-sm text-slate-500">
                          Final status saved
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorshipTab;