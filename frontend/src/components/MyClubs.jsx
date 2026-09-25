import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getMyClubs,
  getActiveClubs,
  getJoinStatus,
  requestJoinClub,
  cancelJoinRequest,
  getClubDashboard,
} from "../services/clubService";

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:5000";

const getImageSrc = (imageUrl) => {
  if (!imageUrl) return "";
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;

  return imageUrl.startsWith("/")
    ? `${API_BASE_URL}${imageUrl}`
    : `${API_BASE_URL}/${imageUrl}`;
};

const MyClubs = () => {
  const navigate = useNavigate();

  const [myClubs, setMyClubs] = useState([]);
  const [availableClubs, setAvailableClubs] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [permissionsByClub, setPermissionsByClub] = useState({});
  const [loading, setLoading] = useState(true);

  const loadClubs = async () => {
    try {
      setLoading(true);

      const myRes = await getMyClubs();
      const activeRes = await getActiveClubs();

      const joined = Array.isArray(myRes?.data) ? myRes.data : [];
      const active = Array.isArray(activeRes?.data) ? activeRes.data : [];

      setMyClubs(joined);

      const joinedIds = new Set(joined.map((club) => String(club._id)));
      const available = active.filter((club) => !joinedIds.has(String(club._id)));
      setAvailableClubs(available);

      const statusMap = {};
      for (const club of available) {
        try {
          const statusRes = await getJoinStatus(club._id);
          statusMap[club._id] = statusRes?.data?.status || "none";
        } catch (error) {
          statusMap[club._id] = "none";
        }
      }
      setStatuses(statusMap);

      // Load dashboard permissions for joined clubs
      const permissionsMap = {};
      await Promise.all(
        joined.map(async (club) => {
          try {
            const dashboardRes = await getClubDashboard(club._id);
            const dashboardData = dashboardRes?.data || dashboardRes;

            permissionsMap[club._id] = {
              canManageClub: Boolean(dashboardData?.permissions?.canManageClub),
              membershipRole:
                dashboardData?.membership?.role ||
                club?.membership?.role ||
                "member",
              parentRole:
                dashboardData?.membership?.parentRole ||
                dashboardData?.permissions?.parentRole ||
                "STUDENT",
            };
          } catch (error) {
            permissionsMap[club._id] = {
              canManageClub: false,
              membershipRole: club?.membership?.role || "member",
              parentRole: "STUDENT",
            };
          }
        })
      );

      setPermissionsByClub(permissionsMap);
    } catch (error) {
      console.error("Error loading clubs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClubs();
  }, []);

  const handleJoin = async (clubId) => {
    try {
      await requestJoinClub(clubId);
      toast.success("Join request sent successfully");
      await loadClubs();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to join club");
    }
  };

  const handleCancelRequest = async (clubId) => {
    try {
      await cancelJoinRequest(clubId);
      toast.success("Join request cancelled");
      await loadClubs();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to cancel request");
    }
  };

  const clubSummary = useMemo(() => {
    const managedCount = myClubs.filter(
      (club) => permissionsByClub[club._id]?.canManageClub
    ).length;

    return {
      joinedCount: myClubs.length,
      availableCount: availableClubs.length,
      managedCount,
    };
  }, [myClubs, availableClubs, permissionsByClub]);

  if (loading) {
    return <div className="text-slate-600">Loading clubs...</div>;
  }

 return (
  <div className="space-y-8">
    <div>
      <p className="text-[#4a5b86] mt-2">
        View your joined clubs, manage clubs where your role allows it, and
        discover available clubs.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#0a1e8c]/15">
        <p className="text-sm text-[#4a5b86]">My Clubs</p>
        <h2 className="text-4xl font-bold text-[#0a1e8c] mt-2">
          {clubSummary.joinedCount}
        </h2>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#f37021]/20">
        <p className="text-sm text-[#4a5b86]">Managed Clubs</p>
        <h2 className="text-4xl font-bold text-[#f37021] mt-2">
          {clubSummary.managedCount}
        </h2>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#0a1e8c]/15">
        <p className="text-sm text-[#4a5b86]">Available Clubs</p>
        <h2 className="text-4xl font-bold text-[#0a1e8c] mt-2">
          {clubSummary.availableCount}
        </h2>
      </div>
    </div>

    <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#0a1e8c]/15">
      <h2 className="text-2xl font-bold text-[#0a1e8c] mb-6">Joined Clubs</h2>

      {myClubs.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-[#4a5b86] text-lg">
            You haven't joined any clubs yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {myClubs.map((club) => {
            const clubPermissions = permissionsByClub[club._id] || {};
            const canManageClub = Boolean(clubPermissions.canManageClub);
            const membershipRole = normalizeText(
              clubPermissions.membershipRole || club?.membership?.role || "member"
            );

            return (
              <div
                key={club._id}
                className="rounded-2xl border border-[#0a1e8c]/15 p-5 bg-[#f5f8ff]"
              >
                <div className="flex items-start gap-3">
                  {club?.logo && (
                    <img
                      src={getImageSrc(club.logo)}
                      alt={`${club.name} logo`}
                      className="h-14 w-14 rounded-xl object-cover border border-[#0a1e8c]/15"
                    />
                  )}

                  <div>
                    <h3 className="text-xl font-semibold text-[#0a1e8c]">
                      {club.name}
                    </h3>
                    <p className="text-[#4a5b86] mt-1">{club.description}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-block text-sm font-medium text-[#f37021]">
                    {club.category}
                  </span>

                  <span className="px-3 py-1 rounded-full bg-white border border-[#0a1e8c]/15 text-xs font-semibold text-[#0a1e8c]">
                    Role: {membershipRole || "member"}
                  </span>

                  {canManageClub && (
                    <span className="px-3 py-1 rounded-full bg-[#fff4ec] text-[#f37021] text-xs font-semibold border border-[#f37021]/20">
                      Can Manage
                    </span>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate(`/clubs/${club._id}`)}
                    className="px-5 py-2.5 rounded-xl bg-[#0a1e8c] text-white font-semibold hover:bg-[#08166f] transition"
                  >
                    View Dashboard
                  </button>

                  {canManageClub && (
                    <button
                      onClick={() => navigate(`/clubs/${club._id}/manage`)}
                      className="px-5 py-2.5 rounded-xl border border-[#f37021]/20 bg-[#fff4ec] text-[#f37021] font-semibold hover:bg-[#ffe8d8] transition"
                    >
                      Manage Club
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

    <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#0a1e8c]/15">
      <h2 className="text-2xl font-bold text-[#0a1e8c] mb-6">Available Clubs</h2>

      {availableClubs.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-[#4a5b86] text-lg">No available clubs right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {availableClubs.map((club) => (
            <div
              key={club._id}
              className="rounded-2xl border border-[#0a1e8c]/15 p-5 bg-[#f5f8ff]"
            >
              <div className="flex items-start gap-3">
                {club?.logo && (
                  <img
                    src={getImageSrc(club.logo)}
                    alt={`${club.name} logo`}
                    className="h-14 w-14 rounded-xl object-cover border border-[#0a1e8c]/15"
                  />
                )}

                <div>
                  <h3 className="text-xl font-semibold text-[#0a1e8c]">
                    {club.name}
                  </h3>
                  <p className="text-[#4a5b86] mt-1">{club.description}</p>
                </div>
              </div>

              <p className="text-[#f37021] mt-3 text-sm font-medium">
                {club.category}
              </p>

              <div className="mt-5">
                {statuses[club._id] === "pending" ? (
                  <button
                    onClick={() => handleCancelRequest(club._id)}
                    className="px-5 py-2.5 rounded-xl bg-[#f37021] text-white font-semibold hover:bg-[#d85f1b] transition"
                  >
                    Cancel Request
                  </button>
                ) : (
                  <button
                    onClick={() => handleJoin(club._id)}
                    className="px-5 py-2.5 rounded-xl bg-[#0a1e8c] text-white font-semibold hover:bg-[#08166f] transition"
                  >
                    Join Club
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);
};

export default MyClubs;