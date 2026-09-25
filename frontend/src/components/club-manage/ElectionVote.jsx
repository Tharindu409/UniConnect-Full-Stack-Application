import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getElectionById,
  voteElection,
  getElectionResults,
} from "../../services/electionService";

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

const formatDateTime = (value) => {
  if (!value) return "Not specified";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not specified";
  return date.toLocaleString();
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
  if (!election || election.status === "cancelled") return false;

  const now = new Date();
  const votingStart = new Date(election.votingStartDate);
  const votingEnd = new Date(election.votingEndDate);

  return now >= votingStart && now <= votingEnd;
};

const getStatusBadgeClass = (status) => {
  if (status === "upcoming") return "bg-blue-100 text-blue-700";
  if (status === "ongoing") return "bg-green-100 text-green-700";
  if (status === "completed") return "bg-slate-100 text-slate-700";
  if (status === "cancelled") return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-700";
};

export default function ElectionVote() {
  const { clubId, electionId } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [election, setElection] = useState(null);
  const [results, setResults] = useState(null);
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [submittingVote, setSubmittingVote] = useState(false);
  const [pageError, setPageError] = useState("");
  const [voteMessage, setVoteMessage] = useState("");

  const currentUserRole = normalizeRole(currentUser?.role);

  const currentUserId =
    currentUser?._id?.toString?.() ||
    currentUser?.id?.toString?.() ||
    currentUser?.userId?.toString?.() ||
    "";

  const clubMemberRole = useMemo(() => {
    const member = election?.club?.members?.find((memberItem) => {
      const memberUserId =
        memberItem?.user?._id?.toString?.() ||
        memberItem?.user?.id?.toString?.() ||
        memberItem?.user?.userId?.toString?.() ||
        memberItem?.user?.toString?.() ||
        memberItem?._id?.toString?.() ||
        memberItem?.memberId?.toString?.();

      const memberStatus = String(memberItem?.status || "")
        .trim()
        .toLowerCase();

      return (
        String(memberUserId) === String(currentUserId) &&
        ["active", "approved"].includes(memberStatus)
      );
    });

    return normalizeRole(member?.role);
  }, [election, currentUserId]);

  const isSystemAdmin = currentUserRole === "SYSTEM_ADMIN";
  const isClubManager = MANAGEMENT_ROLES.includes(clubMemberRole);
  const isMember = clubMemberRole === "MEMBER";

  const hasVoted = useMemo(() => {
    if (!election || !currentUserId) return false;
    if (!Array.isArray(election.voters)) return false;

    return election.voters.some((voter) => {
      const voterUserId =
        voter?.user?._id?.toString?.() ||
        voter?.user?.id?.toString?.() ||
        voter?.user?.userId?.toString?.() ||
        voter?.user?.toString?.() ||
        "";

      return String(voterUserId) === String(currentUserId);
    });
  }, [election, currentUserId]);

  const votedCandidateIndex = useMemo(() => {
    if (!election || !currentUserId) return null;
    if (!Array.isArray(election.voters)) return null;

    const voteRecord = election.voters.find((voter) => {
      const voterUserId =
        voter?.user?._id?.toString?.() ||
        voter?.user?.id?.toString?.() ||
        voter?.user?.userId?.toString?.() ||
        voter?.user?.toString?.() ||
        "";

      return String(voterUserId) === String(currentUserId);
    });

    return voteRecord ? Number(voteRecord.candidateIndex) : null;
  }, [election, currentUserId]);

  const electionStatus = useMemo(() => {
    return getElectionStatus(election);
  }, [election]);

  const loadElection = async () => {
    const res = await getElectionById(electionId);
    const data = res?.election || res;
    setElection(data);
    return data;
  };

  const loadResults = async () => {
    try {
      setResultsLoading(true);
      const res = await getElectionResults(electionId);
      setResults(res);
    } catch (error) {
      console.error("Error loading election results:", error);
      setResults(null);
    } finally {
      setResultsLoading(false);
    }
  };

  const loadPage = async () => {
    try {
      setLoading(true);
      setPageError("");

      const electionData = await loadElection();

      if (
        getElectionStatus(electionData) === "completed" ||
        Array.isArray(electionData?.candidates)
      ) {
        await loadResults();
      }
    } catch (error) {
      console.error("Error loading election:", error);
      setPageError(
        error?.response?.data?.message || "Failed to load election"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (electionId) {
      loadPage();
    }
  }, [electionId]);

  useEffect(() => {
    if (hasVoted) {
      loadResults();
    }
  }, [hasVoted]);

  const canVote =
    isMember &&
    isVotingOpen(election) &&
    !hasVoted &&
    Array.isArray(election?.candidates) &&
    election.candidates.length > 0;

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <p className="text-slate-600">Loading election...</p>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-700">{pageError}</p>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <p className="text-slate-600">Election not found.</p>
      </div>
    );
  }

  const handleVoteSubmit = async () => {
    if (selectedCandidateIndex === null || selectedCandidateIndex === undefined) {
      setVoteMessage("Please select a candidate first.");
      return;
    }

    try {
      setSubmittingVote(true);
      setVoteMessage("");

      await voteElection(electionId, {
        candidateIndex: selectedCandidateIndex,
      });

      setVoteMessage("Vote submitted successfully.");

      await loadElection();
      await loadResults();
    } catch (error) {
      console.error("Error submitting vote:", error);
      setVoteMessage(
        error?.response?.data?.message || "Failed to submit vote"
      );
    } finally {
      setSubmittingVote(false);
    }
  };

  return (
  <div className="space-y-6">

    {/* HEADER CARD */}
    <div className="rounded-3xl border border-[#0B1E8A]/10 bg-[#0B1E8A]/5 p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

        <div>
          <button
            type="button"
            onClick={() => navigate(`/clubs/${clubId}/manage`)}
            className="mb-4 inline-flex items-center rounded-xl border border-[#0B1E8A]/20 px-4 py-2 text-sm font-medium text-[#0B1E8A] hover:bg-[#0B1E8A]/5"
          >
            Back to Club Dashboard
          </button>

          <h1 className="text-3xl font-black text-[#0B1E8A]">
            {election.title || "Election"}
          </h1>

          <p className="mt-2 text-gray-600">
            {election.description || "No description provided."}
          </p>

          <div className="mt-4 flex flex-wrap gap-3">

            <span className="rounded-full bg-[#0B1E8A]/10 px-4 py-2 text-sm font-semibold text-[#0B1E8A]">
              {election.position || "Position not specified"}
            </span>

            <span
              className={`rounded-full px-4 py-2 text-sm font-semibold ${getStatusBadgeClass(
                electionStatus
              )}`}
            >
              {electionStatus}
            </span>

            {isVotingOpen(election) && (
              <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                Voting Open
              </span>
            )}

            <span className="rounded-full bg-[#0B1E8A]/10 px-4 py-2 text-sm font-semibold text-[#0B1E8A]">
              {isSystemAdmin
                ? "System Admin"
                : isClubManager
                ? "Club Management"
                : isMember
                ? "Member"
                : "Viewer"}
            </span>

          </div>
        </div>
      </div>

      {/* DATES */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {[
          ["Nomination Start", election.nominationStartDate],
          ["Nomination End", election.nominationEndDate],
          ["Voting Start", election.votingStartDate],
          ["Voting End", election.votingEndDate],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-[#0B1E8A]/10 bg-white p-4"
          >
            <p className="text-sm font-semibold text-[#0B1E8A]">{label}</p>
            <p className="mt-1 text-gray-600">
              {formatDateTime(value)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-[#0B1E8A]/10 bg-white p-4">
        <p className="text-sm font-semibold text-[#0B1E8A]">Eligibility</p>
        <p className="mt-1 text-gray-600">
          {election.eligibility || "No eligibility rules specified."}
        </p>
      </div>
    </div>

    {/* CANDIDATES */}
    <div className="rounded-3xl border border-[#0B1E8A]/10 bg-[#0B1E8A]/5 p-6 shadow-sm">
      <div className="mb-4 flex justify-between">
        <h2 className="text-2xl font-black text-[#0B1E8A]">Candidates</h2>
        <span className="text-sm font-semibold text-[#F36C21]">
          {election.candidates?.length || 0} total
        </span>
      </div>

      <div className="space-y-4">
        {election.candidates?.map((candidate, index) => {
          const isSelected = selectedCandidateIndex === index;
          const isMyVote = votedCandidateIndex === index;

          return (
            <label
              key={index}
              className={`block rounded-2xl border p-4 transition ${
                isSelected
                  ? "border-[#F36C21] bg-[#F36C21]/10"
                  : "border-[#0B1E8A]/10 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  checked={isSelected}
                  disabled={!canVote}
                  onChange={() => setSelectedCandidateIndex(index)}
                />

                <div>
                  <h3 className="font-semibold text-[#0B1E8A]">
                    {candidate.name || `Candidate ${index + 1}`}
                  </h3>

                  {isMyVote && (
                    <p className="text-sm text-green-600">Your vote</p>
                  )}
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {canVote && (
        <button
          onClick={handleVoteSubmit}
          disabled={submittingVote}
          className="mt-6 rounded-xl bg-[#F36C21] px-6 py-3 text-white font-bold hover:bg-orange-600"
        >
          {submittingVote ? "Submitting..." : "Submit Vote"}
        </button>
      )}
    </div>

    {/* RESULTS */}
    <div className="rounded-3xl border border-[#0B1E8A]/10 bg-[#0B1E8A]/5 p-6 shadow-sm">
      <h2 className="text-2xl font-black text-[#0B1E8A] mb-4">
        Results
      </h2>

      {results?.results?.map((r, i) => (
        <div key={i} className="mb-4">
          <div className="flex justify-between text-sm font-semibold text-[#0B1E8A]">
            <span>{r.name}</span>
            <span>{r.percentage}%</span>
          </div>

          <div className="h-3 bg-[#0B1E8A]/10 rounded-full mt-2 overflow-hidden">
            <div
              className="h-3 bg-[#F36C21]"
              style={{ width: `${r.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>

  </div>
);
}