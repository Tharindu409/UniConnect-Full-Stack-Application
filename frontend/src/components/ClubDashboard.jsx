import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  CalendarDays,
  Vote,
  Settings,
  Wallet,
  Download,
  FileText,
  Clock3,
  MapPin,
  Handshake,
  ArrowRight,
} from "lucide-react";
import { getClubDashboard } from "../services/clubService";
import { getClubBudgets } from "../services/budgetService";
import { getClubExpenses } from "../services/expenseService";
import { getClubMeetings } from "../services/clubmeetingService";
import { getClubElections } from "../services/electionService";
import { getClubMentors } from "../services/mentorshipService";
import MentorshipSection from "../components/club-manage/MentorshipSection";

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

const StatCard = ({ icon: Icon, title, value, subtitle }) => (
  <div className="rounded-[28px] border border-[#0a1e8c]/12 bg-white p-6 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-[#4a5b86]">{title}</p>
        <h2 className="mt-4 text-4xl font-black tracking-tight text-[#0a1e8c]">
          {value}
        </h2>
        <p className="mt-3 text-sm font-medium text-[#f37021]">{subtitle}</p>
      </div>

      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5f8ff] text-[#0a1e8c]">
        <Icon size={24} />
      </div>
    </div>
  </div>
);

const SectionHeader = ({ title, subtitle, right }) => (
  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <h2 className="text-2xl font-black text-[#0a1e8c]">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-[#4a5b86]">{subtitle}</p> : null}
    </div>
    {right ? <div>{right}</div> : null}
  </div>
);

const EmptyState = ({ text }) => (
  <div className="rounded-2xl border border-dashed border-[#0a1e8c]/15 bg-[#f9fbff] px-4 py-10 text-center text-sm text-[#4a5b86]">
    {text}
  </div>
);

const ClubDashboard = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [elections, setElections] = useState([]);
  const [mentors, setMentors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [budgetsLoading, setBudgetsLoading] = useState(true);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [meetingsLoading, setMeetingsLoading] = useState(true);
  const [electionsLoading, setElectionsLoading] = useState(true);
  const [mentorshipsLoading, setMentorshipsLoading] = useState(true);
  const [downloadingConstitution, setDownloadingConstitution] = useState(false);

  const loadDashboard = async () => {
    try {
      const res = await getClubDashboard(clubId);
      setDashboard(res?.data || res);
    } catch (error) {
      console.error("Error loading club dashboard:", error);
      toast.error(error?.response?.data?.message || "Failed to load club dashboard");
      navigate("/my-clubs");
    }
  };

  const loadBudgets = async () => {
    try {
      setBudgetsLoading(true);
      const res = await getClubBudgets(clubId);
      setBudgets(Array.isArray(res) ? res : res?.data || []);
    } catch (error) {
      console.error("Error loading budgets:", error);
      setBudgets([]);
    } finally {
      setBudgetsLoading(false);
    }
  };

  const loadExpenses = async () => {
    try {
      setExpensesLoading(true);
      const res = await getClubExpenses(clubId);
      setExpenses(Array.isArray(res) ? res : res?.data || []);
    } catch (error) {
      console.error("Error loading expenses:", error);
      setExpenses([]);
    } finally {
      setExpensesLoading(false);
    }
  };

  const loadMeetings = async () => {
    try {
      setMeetingsLoading(true);
      const res = await getClubMeetings(clubId);
      setMeetings(Array.isArray(res) ? res : res?.data || []);
    } catch (error) {
      console.error("Error loading meetings:", error);
      setMeetings([]);
    } finally {
      setMeetingsLoading(false);
    }
  };

  const loadElections = async () => {
    try {
      setElectionsLoading(true);
      const res = await getClubElections(clubId);
      setElections(Array.isArray(res) ? res : res?.data || []);
    } catch (error) {
      console.error("Error loading elections:", error);
      setElections([]);
    } finally {
      setElectionsLoading(false);
    }
  };

  const loadMentorshipStats = async () => {
    try {
      setMentorshipsLoading(true);
      const mentorRes = await getClubMentors(clubId);
      setMentors(Array.isArray(mentorRes) ? mentorRes : mentorRes?.data || []);
    } catch (error) {
      console.error("Error loading mentorship stats:", error);
      setMentors([]);
    } finally {
      setMentorshipsLoading(false);
    }
  };

  const loadPageData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadDashboard(),
        loadBudgets(),
        loadExpenses(),
        loadMeetings(),
        loadElections(),
        loadMentorshipStats(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clubId) {
      loadPageData();
    }
  }, [clubId]);

  useEffect(() => {
    if (dashboard?.club?.name) {
      document.title = `${dashboard.club.name} Club Dashboard`;
    } else {
      document.title = "Club Dashboard";
    }

    return () => {
      document.title = "UniConnect";
    };
  }, [dashboard]);

  const totalBudgetAmount = useMemo(() => {
    return budgets.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [budgets]);

  const totalExpenseAmount = useMemo(() => {
    return expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [expenses]);

  const activeElectionCount = useMemo(() => {
    return elections.filter((item) => {
      const status = String(item?.status || "").toLowerCase();
      return status === "ongoing";
    }).length;
  }, [elections]);

  const upcomingMeetingCount = useMemo(() => {
    const now = new Date();
    return meetings.filter((item) => {
      const meetingDate = new Date(
        item?.startDate || item?.date || item?.meetingDate
      );
      return !Number.isNaN(meetingDate.getTime()) && meetingDate >= now;
    }).length;
  }, [meetings]);

  const activeMentorshipCount = useMemo(() => {
    return mentors.filter((item) => {
      return item?.isActive !== false && item?.availability !== "Unavailable";
    }).length;
  }, [mentors]);

  const formatDate = (value) => {
    if (!value) return "Date not specified";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date not specified";
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  };

  const formatDateTime = (value) => {
    if (!value) return "Not specified";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not specified";
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatTimeOnly = (value) => {
    if (!value) return "Not specified";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not specified";
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatMeetingSchedule = (startValue, endValue) => {
    if (!startValue && !endValue) return "Date not specified";

    const start = startValue ? new Date(startValue) : null;
    const end = endValue ? new Date(endValue) : null;

    const validStart = start && !Number.isNaN(start.getTime());
    const validEnd = end && !Number.isNaN(end.getTime());

    if (!validStart && !validEnd) return "Date not specified";
    if (validStart && !validEnd) return formatDateTime(startValue);
    if (!validStart && validEnd) return formatDateTime(endValue);

    const sameDay = start.toDateString() === end.toDateString();

    if (sameDay) {
      return `${formatDate(startValue)} • ${formatTimeOnly(
        startValue
      )} - ${formatTimeOnly(endValue)}`;
    }

    return `${formatDateTime(startValue)} - ${formatDateTime(endValue)}`;
  };

  const getElectionStatusBadge = (status) => {
    const normalized = String(status || "").toLowerCase();

    if (normalized === "upcoming") return "bg-blue-100 text-blue-700";
    if (normalized === "ongoing") return "bg-green-100 text-green-700";
    if (normalized === "completed") return "bg-slate-100 text-slate-700";
    if (normalized === "cancelled") return "bg-red-100 text-red-700";

    return "bg-slate-100 text-slate-700";
  };

  const handleDownloadConstitution = () => {
    const fileUrl = club?.constitution?.fileUrl;

    console.log("Constitution URL:", fileUrl);

    if (!fileUrl) {
      toast.error("No constitution file found");
      return;
    }

    const fullUrl = fileUrl.startsWith("http")
      ? fileUrl
      : `${API_BASE_URL}${fileUrl}`;

    const link = document.createElement("a");
    link.href = fullUrl;
    link.download =
      club?.constitution?.fileName ||
      `${club?.name || "club"}_constitution.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (loading) {
    return <div className="text-slate-600">Loading club dashboard...</div>;
  }

  if (!dashboard) {
    return <div className="text-slate-600">No dashboard data found.</div>;
  }

  const { club, membership, permissions } = dashboard;
  const hasConstitution = Boolean(
    club?.constitution?.fileUrl || club?.constitution?.fileName
  );

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-[32px] border border-[#0a1e8c]/12 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-[#0a1e8c] via-[#162d9f] to-[#2b43bd] px-6 py-7 text-white md:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              {club?.logo && (
                <img
                  src={getImageSrc(club.logo)}
                  alt={`${club.name || "Club"} logo`}
                  className="h-20 w-20 rounded-2xl object-cover border border-white/15 bg-white/10 shadow-sm"
                />
              )}

              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-white/70">
                  {club?.name ? `${club.name} Club Dashboard` : "Club Dashboard"}
                </p>

                <h1 className="mt-3 text-3xl font-black tracking-tight">
                  {club?.name || "Club"}
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/85">
                  {club?.description || "No club description available."}
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="rounded-full bg-white/12 px-4 py-2 text-sm font-semibold text-white">
                    {club?.category || "General"}
                  </span>

                  <span className="rounded-full bg-white/12 px-4 py-2 text-sm font-semibold text-white">
                    Role: {membership?.role || "member"}
                  </span>

                  <span className="rounded-full bg-[#f37021] px-4 py-2 text-sm font-semibold text-white">
                    Members: {club?.memberCount || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {permissions?.canManageClub && (
                <button
                  type="button"
                  onClick={() => navigate(`/clubs/${club._id}/manage`)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#0a1e8c] hover:bg-[#eef4ff]"
                >
                  <Settings size={18} />
                  Manage Club
                </button>
              )}

              {hasConstitution && (
                <button
                  type="button"
                  onClick={handleDownloadConstitution}
                  disabled={downloadingConstitution}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/15 disabled:opacity-60"
                >
                  <Download size={18} />
                  {downloadingConstitution
                    ? "Downloading..."
                    : "Download Constitution"}
                </button>
              )}
            </div>
          </div>
        </div>

        {hasConstitution && (
          <div className="border-t border-[#0a1e8c]/10 bg-[#f8faff] px-6 py-4 md:px-8">
            <div className="inline-flex items-center gap-2 rounded-xl border border-[#0a1e8c]/10 bg-white px-4 py-2 text-sm text-[#4a5b86]">
              <FileText size={16} />
              <span>{club?.constitution?.fileName || "constitution.pdf"}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Vote}
          title="Active Elections"
          value={activeElectionCount}
          subtitle="currently open"
        />
        <StatCard
          icon={CalendarDays}
          title="Upcoming Meetings"
          value={upcomingMeetingCount}
          subtitle="meetings to attend"
        />
        <StatCard
          icon={Handshake}
          title="Available Mentors"
          value={mentorshipsLoading ? "..." : activeMentorshipCount}
          subtitle="ready to help"
        />
        <StatCard
          icon={Wallet}
          title="Expenses"
          value={expenses.length}
          subtitle={`Total Rs. ${totalExpenseAmount.toLocaleString()}`}
        />
      </div>

      <div className="rounded-[30px] border border-[#0a1e8c]/12 bg-white p-6 shadow-sm">
        <SectionHeader
          title="Elections"
          subtitle="Track ongoing and upcoming election activities."
          right={
            <span className="rounded-full bg-[#fff4ec] px-3 py-1 text-sm font-semibold text-[#f37021]">
              {elections.length} total
            </span>
          }
        />

        {electionsLoading ? (
          <p className="text-[#4a5b86]">Loading elections...</p>
        ) : elections.length === 0 ? (
          <EmptyState text="No elections found." />
        ) : (
          <div className="space-y-4">
            {elections.map((election) => (
              <div
                key={election._id}
                onClick={() =>
                  navigate(`/clubs/${clubId}/elections/${election._id}`)
                }
                className="cursor-pointer rounded-2xl border border-[#0a1e8c]/10 bg-[#fcfdff] p-5 transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-[#0a1e8c]">
                      {election.title || "Untitled Election"}
                    </h3>

                    <p className="mt-1 text-sm font-medium text-[#4a5b86]">
                      {election.position || "Position not specified"}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-[#4a5b86]">
                      {election.description || "No description provided"}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-[#4a5b86]">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 size={14} />
                        Voting: {formatDateTime(election.votingStartDate)}
                      </span>

                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={14} />
                        Ends: {formatDateTime(election.votingEndDate)}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-[#4a5b86]">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={14} />
                        Nominations: {formatDateTime(election.nominationStartDate)}
                      </span>

                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={14} />
                        To {formatDateTime(election.nominationEndDate)}
                      </span>
                    </div>

                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0a1e8c]">
                      View Election <ArrowRight size={16} />
                    </div>
                  </div>

                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getElectionStatusBadge(
                      election.status
                    )}`}
                  >
                    {election.status || "Unknown"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[30px] border border-[#0a1e8c]/12 bg-white p-6 shadow-sm">
        <SectionHeader
          title="Upcoming Meetings"
          subtitle="See what’s coming up and where to be."
          right={
            <span className="rounded-full bg-[#fff4ec] px-3 py-1 text-sm font-semibold text-[#f37021]">
              {meetings.length} total
            </span>
          }
        />

        {meetingsLoading ? (
          <p className="text-[#4a5b86]">Loading meetings...</p>
        ) : meetings.length === 0 ? (
          <EmptyState text="No meetings found." />
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting) => {
              const meetingImage =
                meeting.imageUrl ||
                meeting.eventPoster ||
                meeting.poster ||
                meeting.image ||
                meeting.banner ||
                "";

              return (
                <div
                  key={meeting._id}
                  className="rounded-2xl border border-[#0a1e8c]/10 bg-[#fcfdff] p-5"
                >
                  <div className="flex items-start gap-4">
                    {meetingImage ? (
                      <img
                        src={getImageSrc(meetingImage)}
                        alt={meeting.title || meeting.name || "Meeting"}
                        className="h-20 w-20 rounded-2xl object-cover border border-[#0a1e8c]/10"
                      />
                    ) : null}

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-[#0a1e8c]">
                        {meeting.title || meeting.name || "Untitled Meeting"}
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-[#4a5b86]">
                        {meeting.description || "No description provided"}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#4a5b86]">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays size={14} />
                          {formatMeetingSchedule(
                            meeting.startDate ||
                              meeting.date ||
                              meeting.meetingDate,
                            meeting.endDate
                          )}
                        </span>

                        <span className="inline-flex items-center gap-1">
                          <MapPin size={14} />
                          {meeting.location ||
                            meeting.venue ||
                            "Location not specified"}
                        </span>
                      </div>

                      <div className="mt-3 inline-flex rounded-full bg-[#f5f8ff] px-3 py-1 text-xs font-semibold text-[#0a1e8c]">
                        Category: {meeting.category || "Meeting"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-[32px] border border-[#0a1e8c]/12 bg-white p-2 shadow-sm">
        <MentorshipSection clubId={clubId} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-[30px] border border-[#0a1e8c]/12 bg-white p-6 shadow-sm">
          <SectionHeader
            title="Expenses"
            subtitle="Students can view these records but cannot edit them."
            right={
              <span className="rounded-full bg-[#fff4ec] px-3 py-1 text-sm font-semibold text-[#f37021]">
                {expenses.length} records
              </span>
            }
          />

          {expensesLoading ? (
            <p className="text-[#4a5b86]">Loading expense records...</p>
          ) : expenses.length === 0 ? (
            <EmptyState text="No expense records found." />
          ) : (
            <div className="space-y-4">
              {expenses.map((expense) => (
                <div
                  key={expense._id}
                  className="rounded-2xl border border-[#0a1e8c]/10 bg-[#fcfdff] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-[#0a1e8c]">
                        {expense.title || "Untitled Expense"}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-[#4a5b86]">
                        {expense.description || "No description provided"}
                      </p>
                      <p className="mt-3 text-sm text-[#4a5b86]">
                        Category: {expense.category || "General"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-black text-[#0a1e8c]">
                        Rs. {Number(expense.amount || 0).toLocaleString()}
                      </p>
                      <span className="mt-2 inline-flex rounded-full bg-[#f5f8ff] px-3 py-1 text-xs font-semibold text-[#0a1e8c]">
                        {expense.status || "recorded"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {permissions?.canManageClub && (
          <div className="rounded-[30px] border border-[#0a1e8c]/12 bg-white p-6 shadow-sm">
            <SectionHeader
              title="Budget Requests"
              subtitle="Review the budget requests submitted for this club."
              right={
                <span className="rounded-full bg-[#fff4ec] px-3 py-1 text-sm font-semibold text-[#f37021]">
                  {budgets.length} requests
                </span>
              }
            />

            {budgetsLoading ? (
              <p className="text-[#4a5b86]">Loading budget requests...</p>
            ) : budgets.length === 0 ? (
              <EmptyState text="No budget requests found." />
            ) : (
              <div className="space-y-4">
                {budgets.map((budget) => (
                  <div
                    key={budget._id}
                    className="rounded-2xl border border-[#0a1e8c]/10 bg-[#fcfdff] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-[#0a1e8c]">
                          {budget.title || "Untitled Budget Request"}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-[#4a5b86]">
                          {budget.description || "No description provided"}
                        </p>
                        <p className="mt-3 text-sm text-[#4a5b86]">
                          Category: {budget.category || "General"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-black text-[#0a1e8c]">
                          Rs. {Number(budget.amount || 0).toLocaleString()}
                        </p>
                        <span className="mt-2 inline-flex rounded-full bg-[#fff4ec] px-3 py-1 text-xs font-semibold text-[#f37021]">
                          {budget.status || "pending"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 rounded-2xl border border-[#0a1e8c]/10 bg-[#f8faff] px-4 py-4 text-sm font-medium text-[#4a5b86]">
              Total Requested:{" "}
              <span className="font-bold text-[#0a1e8c]">
                Rs. {totalBudgetAmount.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubDashboard;