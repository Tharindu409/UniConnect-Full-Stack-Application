import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Search,
  ShieldCheck,
  Trash2,
  Users,
  XCircle,
  DollarSign,
  Vote,
  CalendarDays,
  Wallet,
  Handshake,
  FileText,
} from "lucide-react";
import {
  approveJoinRequest,
  getAllJoinRequests,
  getClubById,
  getClubDashboard,
  rejectJoinRequest,
  removeClubMember,
  updateClubMemberRole,
  getClubMembers,
} from "../../services/clubService";

import BudgetsTab from "./BudgetsTab";
import Election from "./Election";
import ClubMeeting from "./ClubMeeting";
import ClubExpenses from "./ClubExpenses";
import MentorshipTab from "./MentorshipTab";
import ClubSettingsTab from "./ClubSettingsTab";

const roleOptions = [
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

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:5000";

const getStoredCurrentUser = () => {
  const keys = ["user", "currentUser", "authUser", "userInfo"];

  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // ignore invalid storage
    }
  }

  return null;
};

const ClubManage = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [club, setClub] = useState(null);
  const [joinRequests, setJoinRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(getStoredCurrentUser());

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [memberSearch, setMemberSearch] = useState("");
  const [requestSearch, setRequestSearch] = useState("");
  const [activeTab, setActiveTab] = useState("mentorship");

  const normalizedSystemRole = useMemo(() => {
    return String(currentUser?.role || "").trim().toUpperCase();
  }, [currentUser]);

  const isSystemAdmin = useMemo(() => {
    return normalizedSystemRole === "SYSTEM_ADMIN";
  }, [normalizedSystemRole]);

  const canManageJoinRequests =
    isSystemAdmin || dashboard?.permissions?.canManageClub;
  const canManageMembers =
    isSystemAdmin || dashboard?.permissions?.canManageClub;
  const canManageSettings =
    isSystemAdmin || dashboard?.permissions?.canManageClub;

  const loadData = async () => {
    try {
      setLoading(true);
      setMessage("");

      const storedUser = getStoredCurrentUser();
      setCurrentUser(storedUser);

      const isStoredSystemAdmin =
        String(storedUser?.role || "").trim().toUpperCase() === "SYSTEM_ADMIN";

      const dashboardRes = await getClubDashboard(clubId);
      const dashboardData = dashboardRes?.data || dashboardRes;

      if (!dashboardData?.permissions?.canManageClub && !isStoredSystemAdmin) {
        toast.error("You are not allowed to manage this club");
        navigate(`/clubs/${clubId}`);
        return;
      }

      const [clubRes, requestsRes, membersRes] = await Promise.all([
        getClubById(clubId),
        getAllJoinRequests(clubId, "all"),
        getClubMembers(clubId),
      ]);

      const clubData = clubRes?.data || clubRes;
      const requestsData = requestsRes?.data || requestsRes || [];
      const membersData = Array.isArray(membersRes)
        ? membersRes
        : membersRes?.data || [];

      setDashboard(dashboardData);
      setClub(clubData);
      setJoinRequests(Array.isArray(requestsData) ? requestsData : []);
      setMembers(Array.isArray(membersData) ? membersData : []);
    } catch (error) {
      console.error("Failed to load club management data:", error);
      toast.error(error?.response?.data?.message || "Failed to load club management data");
      navigate("/my-clubs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clubId) {
      loadData();
    }
  }, [clubId]);

  useEffect(() => {
    if (club?.name) {
      document.title = `${club.name} Club Management`;
    } else {
      document.title = "Club Management";
    }

    return () => {
      document.title = "UniConnect";
    };
  }, [club]);

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    const clubMembers = members || [];

    if (!q) return clubMembers;

    return clubMembers.filter((member) =>
      [
        member.user?.fullName,
        member.user?.name,
        member.user?.email,
        member.user?.studentId,
        member.role,
        member.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [members, memberSearch]);

  const filteredRequests = useMemo(() => {
    const q = requestSearch.trim().toLowerCase();

    const pendingRequests = (joinRequests || []).filter(
      (request) => String(request.status || "").toLowerCase() === "pending"
    );

    if (!q) return pendingRequests;

    return pendingRequests.filter((request) =>
      [
        request.user?.fullName,
        request.user?.name,
        request.user?.email,
        request.user?.studentId,
        request.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [joinRequests, requestSearch]);

  const pendingRequestsCount = useMemo(() => {
    return (joinRequests || []).filter(
      (request) => String(request.status || "").toLowerCase() === "pending"
    ).length;
  }, [joinRequests]);

  const memberCount = useMemo(() => {
    return (members || []).filter((member) => {
      const status = String(member.status || "").toLowerCase();
      return status === "approved";
    }).length;
  }, [members]);

  const getImageSrc = (imageUrl) => {
    if (!imageUrl) return "";
    if (/^https?:\/\//i.test(imageUrl)) return imageUrl;

    return imageUrl.startsWith("/")
      ? `${API_BASE_URL}${imageUrl}`
      : `${API_BASE_URL}/${imageUrl}`;
  };

  const handleRoleChange = async (membershipId, newRole) => {
    if (!membershipId) {
      setMessage("Invalid membership ID");
      return;
    }

    try {
      setMessage("");
      await updateClubMemberRole(clubId, membershipId, newRole);
      setMessage("Member role updated successfully");
      toast.success("Member role updated successfully");
      await loadData();
    } catch (error) {
      setMessage(
        error?.response?.data?.message || "Failed to update member role"
      );
      toast.error(error?.response?.data?.message || "Failed to update member role");
    }
  };

  const handleRemoveMember = async (membershipId) => {
    if (!membershipId) {
      setMessage("Invalid membership ID");
      return;
    }

    const confirmed = window.confirm("Remove this member from the club?");
    if (!confirmed) return;

    try {
      setMessage("");
      await removeClubMember(clubId, membershipId);
      setMessage("Member removed successfully");
      toast.success("Member removed successfully");
      await loadData();
    } catch (error) {
      console.error("remove error:", error?.response?.data || error);
      setMessage(error?.response?.data?.message || "Failed to remove member");
      toast.error(error?.response?.data?.message || "Failed to remove member");
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      setMessage("");
      await approveJoinRequest(clubId, requestId);
      setJoinRequests((prev) =>
        prev.filter((request) => request._id !== requestId)
      );
      setMessage("Join request approved successfully");
      toast.success("Join request approved successfully");
      await loadData();
    } catch (error) {
      setMessage(error?.response?.data?.message || "Failed to approve request");
      toast.error(error?.response?.data?.message || "Failed to approve request");
    }
  };

  const handleRejectRequest = async (requestId) => {
    const reason = window.prompt("Enter rejection reason (optional):", "") || "";

    try {
      setMessage("");
      await rejectJoinRequest(clubId, requestId, reason);
      setJoinRequests((prev) =>
        prev.filter((request) => request._id !== requestId)
      );
      setMessage("Join request rejected successfully");
      toast.success("Join request rejected successfully");
      await loadData();
    } catch (error) {
      setMessage(error?.response?.data?.message || "Failed to reject request");
      toast.error(error?.response?.data?.message || "Failed to reject request");
    }
  };

  if (loading) {
    return <div className="text-slate-600">Loading club management...</div>;
  }

  if (!club || !dashboard) {
    return <div className="text-slate-600">No club data found.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl border border-[#0a1e8c]/15 p-7 shadow-sm">
        <div className="flex items-start gap-4">
          {club?.logo && (
            <img
              src={getImageSrc(club.logo)}
              alt={`${club.name || "Club"} logo`}
              className="h-20 w-20 rounded-2xl object-cover border border-[#0a1e8c]/15 shadow-sm"
            />
          )}

          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#f37021]">
              {club?.name ? `${club.name} Club Management` : "Club Management"}
            </p>

            <h1 className="mt-2 text-3xl font-black text-[#0a1e8c]">
              Manage Club
            </h1>

            <p className="mt-2 text-sm text-[#4a5b86]">
              Membership role:{" "}
              <span className="font-semibold text-[#0a1e8c]">
                {isSystemAdmin
                  ? "SYSTEM_ADMIN"
                  : dashboard?.membership?.role || "member"}
              </span>
            </p>
          </div>
        </div>

        {message && (
          <p className="mt-3 text-sm font-semibold text-[#f37021]">
            {message}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => setActiveTab("mentorship")}
            className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl border text-sm font-semibold transition ${
              activeTab === "mentorship"
                ? "bg-[#0a1e8c] border-[#0a1e8c] text-white"
                : "bg-white border-[#0a1e8c]/15 text-[#0a1e8c] hover:bg-[#f5f8ff]"
            }`}
          >
            <Handshake size={16} />
            Mentorship
          </button>

          <button
            onClick={() => setActiveTab("budgets")}
            className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl border text-sm font-semibold transition ${
              activeTab === "budgets"
                ? "bg-[#0a1e8c] border-[#0a1e8c] text-white"
                : "bg-white border-[#0a1e8c]/15 text-[#0a1e8c] hover:bg-[#f5f8ff]"
            }`}
          >
            <DollarSign size={16} />
            Budgets
          </button>

          <button
            onClick={() => setActiveTab("expenses")}
            className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl border text-sm font-semibold transition ${
              activeTab === "expenses"
                ? "bg-[#0a1e8c] border-[#0a1e8c] text-white"
                : "bg-white border-[#0a1e8c]/15 text-[#0a1e8c] hover:bg-[#f5f8ff]"
            }`}
          >
            <Wallet size={16} />
            Expenses
          </button>

          <button
            onClick={() => setActiveTab("events")}
            className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl border text-sm font-semibold transition ${
              activeTab === "events"
                ? "bg-[#0a1e8c] border-[#0a1e8c] text-white"
                : "bg-white border-[#0a1e8c]/15 text-[#0a1e8c] hover:bg-[#f5f8ff]"
            }`}
          >
            <CalendarDays size={16} />
            Meetings
          </button>

          <button
            onClick={() => setActiveTab("elections")}
            className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl border text-sm font-semibold transition ${
              activeTab === "elections"
                ? "bg-[#0a1e8c] border-[#0a1e8c] text-white"
                : "bg-white border-[#0a1e8c]/15 text-[#0a1e8c] hover:bg-[#f5f8ff]"
            }`}
          >
            <Vote size={16} />
            Elections
          </button>

          {canManageJoinRequests && (
            <button
              onClick={() => setActiveTab("joinRequests")}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl border text-sm font-semibold transition ${
                activeTab === "joinRequests"
                  ? "bg-[#f37021] border-[#f37021] text-white"
                  : "bg-white border-[#f37021]/20 text-[#f37021] hover:bg-[#fff4ec]"
              }`}
            >
              <ShieldCheck size={16} />
              Join Requests ({pendingRequestsCount})
            </button>
          )}

          {canManageMembers && (
            <button
              onClick={() => setActiveTab("members")}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl border text-sm font-semibold transition ${
                activeTab === "members"
                  ? "bg-[#0a1e8c] border-[#0a1e8c] text-white"
                  : "bg-white border-[#0a1e8c]/15 text-[#0a1e8c] hover:bg-[#f5f8ff]"
              }`}
            >
              <Users size={16} />
              Members ({memberCount})
            </button>
          )}

          {canManageSettings && (
            <button
              onClick={() => setActiveTab("settings")}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl border text-sm font-semibold transition ${
                activeTab === "settings"
                  ? "bg-[#0a1e8c] border-[#0a1e8c] text-white"
                  : "bg-white border-[#0a1e8c]/15 text-[#0a1e8c] hover:bg-[#f5f8ff]"
              }`}
            >
              <FileText size={16} />
              Settings
            </button>
          )}
        </div>
      </div>

      {activeTab === "mentorship" && (
        <MentorshipTab
          clubId={clubId}
          currentUser={currentUser}
          dashboard={dashboard}
        />
      )}

      {activeTab === "budgets" && (
        <BudgetsTab
          clubId={clubId}
          club={club}
          membership={dashboard?.membership}
          permissions={dashboard?.permissions}
        />
      )}

      {activeTab === "expenses" && (
        <ClubExpenses
          clubId={clubId}
          club={club}
          membership={dashboard?.membership}
          permissions={dashboard?.permissions}
        />
      )}

      {activeTab === "events" && (
        <ClubMeeting
          clubId={clubId}
          club={club}
          membership={dashboard?.membership}
          permissions={dashboard?.permissions}
          currentUser={currentUser}
        />
      )}

      {activeTab === "elections" && (
        <Election
          clubId={clubId}
          club={club}
          membership={dashboard?.membership}
          permissions={dashboard?.permissions}
          currentUser={currentUser}
        />
      )}

      {activeTab === "joinRequests" && canManageJoinRequests && (
        <div className="bg-white rounded-3xl border border-[#0a1e8c]/15 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-2xl font-black text-[#0a1e8c]">
                Join Requests
              </h2>
              <p className="mt-2 text-sm text-[#4a5b86]">
                Review pending join requests for this club.
              </p>
            </div>

            <div className="relative w-full lg:w-96">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5b86]"
              />
              <input
                value={requestSearch}
                onChange={(e) => setRequestSearch(e.target.value)}
                placeholder="Search requests..."
                className="w-full rounded-xl border border-[#0a1e8c]/15 bg-white pl-10 pr-4 py-2.5 text-sm text-[#0a1e8c]"
              />
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[#0a1e8c]/15 px-4 py-10 text-center text-[#4a5b86]">
              No pending join requests found.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredRequests.map((request) => (
                <div
                  key={request._id}
                  className="rounded-3xl border border-[#0a1e8c]/15 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-black text-[#0a1e8c]">
                          {request.user?.fullName ||
                            request.user?.name ||
                            "Unknown Student"}
                        </h3>

                        <span className="rounded-full bg-[#fff4ec] px-3 py-1 text-xs font-semibold text-[#f37021]">
                          {request.status || "pending"}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-[#4a5b86]">
                        {request.user?.email || "-"}
                      </p>
                      <p className="mt-1 text-sm text-[#4a5b86]">
                        {request.user?.studentId || "-"}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApproveRequest(request._id)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0a1e8c] text-white font-semibold hover:bg-[#08166f]"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() => handleRejectRequest(request._id)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f37021] text-white font-semibold hover:bg-[#d85f1b]"
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "members" && canManageMembers && (
        <div className="bg-white rounded-3xl border border-[#0a1e8c]/15 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-2xl font-black text-[#0a1e8c]">Members</h2>
              <p className="mt-2 text-sm text-[#4a5b86]">
                Manage club members, update their roles, and remove access when
                needed.
              </p>
            </div>

            <div className="relative w-full lg:w-96">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5b86]"
              />
              <input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search members..."
                className="w-full rounded-xl border border-[#0a1e8c]/15 bg-white pl-10 pr-4 py-2.5 text-sm text-[#0a1e8c]"
              />
            </div>
          </div>

          {filteredMembers.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[#0a1e8c]/15 px-4 py-10 text-center text-[#4a5b86]">
              No members found.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredMembers.map((member) => {
                const membershipId = member._id;
                if (!membershipId) return null;

                return (
                  <div
                    key={membershipId}
                    className="rounded-3xl border border-[#0a1e8c]/15 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-black text-[#0a1e8c]">
                            {member.user?.fullName ||
                              member.user?.name ||
                              "Unknown Member"}
                          </h3>

                          <span className="rounded-full bg-[#f5f8ff] px-3 py-1 text-xs font-semibold text-[#0a1e8c]">
                            {member.role || "member"}
                          </span>

                          <span className="rounded-full bg-[#fff4ec] px-3 py-1 text-xs font-semibold text-[#f37021]">
                            {member.status || "unknown"}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-[#4a5b86]">
                          {member.user?.email || "-"}
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 lg:w-[240px]">
                        <select
                          value={member.role || "MEMBER"}
                          onChange={(e) =>
                            handleRoleChange(membershipId, e.target.value)
                          }
                          className="rounded-xl border border-[#0a1e8c]/15 bg-white px-4 py-2.5 text-sm font-semibold text-[#0a1e8c]"
                        >
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => handleRemoveMember(membershipId)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f37021] px-4 py-2.5 text-sm font-semibold text-white"
                        >
                          <Trash2 size={16} />
                          Remove Member
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

      {activeTab === "settings" && (
        <ClubSettingsTab club={club} onClubUpdated={loadData} />
      )}
    </div>
  );
};

export default ClubManage;