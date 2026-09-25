import React, { useEffect, useMemo, useState } from "react";
import {
  createMentorshipRequest,
  getMyMentorshipRequests,
  getMyMentorships,
  getRecommendedMentors,
} from "../../services/mentorshipService";
import { BadgeCheck, Sparkles, UserRound, Handshake } from "lucide-react";

const normalizeStatus = (status) => String(status || "").trim().toLowerCase();

const MentorshipSection = ({ clubId }) => {
  const [form, setForm] = useState({
    studentSkills: "",
    studentInterests: "",
    studentLevel: "Beginner",
  });

  const [recommendedMentors, setRecommendedMentors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [acceptedMentorships, setAcceptedMentorships] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const splitList = (value) =>
    String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const loadData = async () => {
    try {
      const [requestData, mentorshipData] = await Promise.all([
        getMyMentorshipRequests(),
        getMyMentorships(),
      ]);

      setRequests(Array.isArray(requestData) ? requestData : []);
      setAcceptedMentorships(Array.isArray(mentorshipData) ? mentorshipData : []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (clubId) {
      loadData();
    }
  }, [clubId]);

  const handleRecommend = async () => {
    try {
      setLoading(true);
      setMessage("");
      setMessageType("");

      const payload = {
        studentSkills: splitList(form.studentSkills),
        studentInterests: splitList(form.studentInterests),
        studentLevel: form.studentLevel,
      };

      const data = await getRecommendedMentors(clubId, payload);
      setRecommendedMentors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setMessage(
        error?.response?.data?.message || "Failed to get mentor recommendations"
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestMentorship = async (mentorId) => {
    try {
      setMessage("");
      setMessageType("");

      if (!mentorId) {
        setMessage("Invalid mentor selected");
        setMessageType("error");
        return;
      }

      const payload = {
        mentorId,
        message: "",
        studentSkills: splitList(form.studentSkills),
        studentInterests: splitList(form.studentInterests),
        studentLevel: form.studentLevel,
      };

      await createMentorshipRequest(clubId, payload);
      setMessage("Mentorship request sent successfully");
      setMessageType("success");
      await loadData();
    } catch (error) {
      console.error(error);
      setMessage(
        error?.response?.data?.message || "Failed to send mentorship request"
      );
      setMessageType("error");
    }
  };

  const pendingRequests = useMemo(() => {
    return requests.filter(
      (item) => normalizeStatus(item?.status) === "pending"
    );
  }, [requests]);

  const activeMentorships = useMemo(() => {
    return acceptedMentorships.filter(
      (item) => normalizeStatus(item?.status) === "active"
    );
  }, [acceptedMentorships]);

  const pendingMentorIds = useMemo(() => {
    return new Set(
      pendingRequests.map((item) => String(item?.mentor?._id || item?.mentor))
    );
  }, [pendingRequests]);

  const activeMentorIds = useMemo(() => {
    return new Set(
      activeMentorships.map((item) => String(item?.mentor?._id || item?.mentor))
    );
  }, [activeMentorships]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {message && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
            messageType === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-[#0a1e8c]/10 bg-[#eef4ff] text-[#0a1e8c]"
          }`}
        >
          {message}
        </div>
      )}

      <div className="rounded-3xl border border-[#0a1e8c]/15 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black text-[#0a1e8c]">Mentorships</h3>
            <p className="mt-2 text-sm text-slate-500">
              Find mentors and get smart recommendations.
            </p>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full bg-[#fff4ec] px-4 py-2 text-sm font-semibold text-[#f37021]">
            <Sparkles size={16} />
            {recommendedMentors.length > 0
              ? `${recommendedMentors.length} shown`
              : "Find mentors"}
          </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-bold text-[#0a1e8c]">
              Your Skills
            </label>
            <input
              value={form.studentSkills}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, studentSkills: e.target.value }))
              }
              placeholder="Leadership, Public Speaking"
              className="w-full rounded-2xl border border-[#0a1e8c]/15 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-[#0a1e8c]">
              Your Interests
            </label>
            <input
              value={form.studentInterests}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  studentInterests: e.target.value,
                }))
              }
              placeholder="Debating, Communication"
              className="w-full rounded-2xl border border-[#0a1e8c]/15 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-[#0a1e8c]">
              Your Level
            </label>
            <select
              value={form.studentLevel}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, studentLevel: e.target.value }))
              }
              className="w-full rounded-2xl border border-[#0a1e8c]/15 px-4 py-3"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleRecommend}
            disabled={loading}
            className="rounded-2xl bg-[#f37021] px-5 py-3 text-sm font-bold text-white"
          >
            {loading ? "Finding..." : "Find Best Mentors"}
          </button>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {recommendedMentors.map((mentor) => {
            const mentorId = String(mentor?.mentor?._id || mentor?.mentor || "");
            const hasPending = pendingMentorIds.has(mentorId);
            const hasActive = activeMentorIds.has(mentorId);

            return (
              <div
                key={mentor._id}
                className="rounded-3xl border border-[#0a1e8c]/10 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5f8ff] text-[#0a1e8c]">
                    <UserRound size={22} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-lg font-black text-[#0a1e8c]">
                      {mentor.title ||
                        mentor?.mentor?.fullName ||
                        mentor?.mentor?.name}
                    </h4>
                    <p className="mt-2 text-sm text-slate-600">{mentor.bio}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold text-[#0a1e8c]">
                    Score: {mentor.matchScore}
                  </span>
                  <span className="rounded-full bg-[#fff4ec] px-3 py-1 text-xs font-semibold text-[#f37021]">
                    {mentor.availability}
                  </span>
                </div>

                <p className="mt-3 text-sm text-slate-600">
                  Level: {mentor.expertiseLevel}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Capacity: {mentor.currentMentees}/{mentor.maxMentees}
                </p>

                <p className="mt-3 text-sm text-slate-600">
                  Skills: {(mentor.skills || []).join(", ")}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Interests: {(mentor.interests || []).join(", ")}
                </p>

                <button
                  type="button"
                  onClick={() => handleRequestMentorship(mentorId)}
                  disabled={hasPending || hasActive}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#0a1e8c] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Handshake size={16} />
                  {hasActive
                    ? "Mentorship Active"
                    : hasPending
                    ? "Request Pending"
                    : "Request Mentorship"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-[#0a1e8c]/15 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-black text-[#0a1e8c]">
          My Mentorship Requests
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          Track your mentorship request updates for this club.
        </p>

        <div className="mt-5 space-y-4">
          {pendingRequests.length === 0 ? (
            <p className="text-sm text-slate-500">No mentorship requests yet.</p>
          ) : (
            pendingRequests.map((request) => (
              <div
                key={request._id}
                className="rounded-2xl border border-[#0a1e8c]/10 p-4"
              >
                <h4 className="font-bold text-[#0a1e8c]">
                  {request?.mentor?.fullName || request?.mentor?.name || "Mentor"}
                </h4>
                <p className="mt-1 text-sm text-slate-600">
                  Status: {request.status}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Match Score: {request.matchScore}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-3xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-bold text-white shadow-sm">
              <BadgeCheck size={16} />
              ACTIVE MENTORSHIPS
            </div>

            <h3 className="mt-4 text-2xl font-black text-green-800">
              Accepted Mentorships
            </h3>
            <p className="mt-2 text-sm text-green-700/90">
              These are your currently active mentorship relationships.
            </p>
          </div>

          <div className="rounded-2xl bg-white/80 px-4 py-3 text-center shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-green-700">
              Active Count
            </p>
            <p className="mt-1 text-3xl font-black text-green-800">
              {activeMentorships.length}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {activeMentorships.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-green-300 bg-white/70 px-4 py-8 text-center text-sm text-green-800">
              No accepted mentorships yet.
            </div>
          ) : (
            activeMentorships.map((mentorship) => (
              <div
                key={mentorship._id}
                className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                      <UserRound size={22} />
                    </div>

                    <div>
                      <h4 className="text-lg font-black text-green-800">
                        {mentorship?.mentor?.fullName ||
                          mentorship?.mentor?.name ||
                          "Mentor"}
                      </h4>

                      <p className="mt-1 text-sm text-green-700">
                        Your mentorship is now active and connected.
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white">
                          ACTIVE
                        </span>

                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                          Match Score: {mentorship.matchScore}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800">
                    <p className="font-semibold">
                      Started:{" "}
                      {mentorship.startDate
                        ? new Date(mentorship.startDate).toLocaleDateString()
                        : "-"}
                    </p>
                    <p className="mt-1 text-green-700">
                      Status: {mentorship.status}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorshipSection;