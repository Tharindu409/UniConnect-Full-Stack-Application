import React, { useEffect, useMemo, useState } from "react";
import { Bar, Pie, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  BarChart3,
  CalendarDays,
  Users,
  Activity,
  RefreshCw,
  Download,
} from "lucide-react";
import API from "../../components/Auth/axios";
import { getActiveClubs } from "../../services/clubService";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const formatNumber = (value) => Intl.NumberFormat().format(Number(value || 0));

const safeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const getClubId = (club) => String(club?._id || club?.id || "");

const getClubName = (club) => String(club?.name || "Unnamed Club");

const getActiveMemberCount = (club) => {
  if (!Array.isArray(club?.members)) return 0;

  return club.members.filter((member) => {
    const status = normalizeText(member?.status);
    return status === "approved" || status === "active";
  }).length;
};

const getPendingJoinRequestCount = (club) => {
  if (!Array.isArray(club?.joinRequests)) return 0;
  return club.joinRequests.filter(
    (request) => normalizeText(request?.status) === "pending"
  ).length;
};

const getEventDate = (event) => {
  const raw =
    event?.eventDate ||
    event?.date ||
    event?.startDate ||
    event?.createdAt ||
    null;

  const parsed = raw ? new Date(raw) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
};

const getRegistrationDeadlineDate = (event) => {
  const raw = event?.registrationDeadline || event?.deadline || null;
  const parsed = raw ? new Date(raw) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
};

const isWithinRange = (date, rangeDays) => {
  if (!date) return false;

  const now = new Date();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(now.getDate() - (rangeDays - 1));

  return date >= start && date <= now;
};

const isUpcomingEvent = (event) => {
  const now = new Date();
  const eventDate = getEventDate(event);
  return eventDate ? eventDate >= now : false;
};

const isRegistrationOpen = (event) => {
  const deadline = getRegistrationDeadlineDate(event);
  if (!deadline) return false;
  return deadline >= new Date();
};

const toCSVValue = (value) => {
  const stringValue = String(value ?? "");
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const downloadCSV = (rows, filename = "export.csv") => {
  const csv = rows.map((row) => row.map(toCSVValue).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const StatCard = ({ title, value, subtitle, icon: Icon }) => (
  <div className="relative overflow-hidden rounded-[28px] border border-[#0a1e8c]/10 bg-white p-5 shadow-[0_10px_30px_rgba(10,30,140,0.08)]">
    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0a1e8c] via-[#0c249f] to-[#f37021]" />
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-[#4a5b86]">{title}</p>
        <p className="mt-2 text-3xl font-black text-[#0a1e8c]">
          {formatNumber(value)}
        </p>
        {subtitle ? (
          <p className="mt-1 text-xs font-medium text-[#7b8ab2]">{subtitle}</p>
        ) : null}
      </div>
      <div className="rounded-2xl border border-[#f37021]/20 bg-[#fff4ec] p-3 text-[#f37021] shadow-sm">
        <Icon size={20} />
      </div>
    </div>
  </div>
);

const buildMonthlyTrend = (events) => {
  const now = new Date();
  const monthLabels = [];
  const monthMap = new Map();

  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const label = date.toLocaleDateString(undefined, {
      month: "short",
      year: "2-digit",
    });

    monthLabels.push({ key, label });
    monthMap.set(key, 0);
  }

  events.forEach((event) => {
    const eventDate = getEventDate(event);
    if (!eventDate) return;

    const key = `${eventDate.getFullYear()}-${eventDate.getMonth()}`;
    if (monthMap.has(key)) {
      monthMap.set(key, monthMap.get(key) + 1);
    }
  });

  return {
    labels: monthLabels.map((item) => item.label),
    datasets: [
      {
        label: "Events",
        data: monthLabels.map((item) => monthMap.get(item.key) || 0),
        borderColor: "#0a1e8c",
        backgroundColor: "rgba(10,30,140,0.10)",
        fill: true,
        tension: 0.35,
        pointRadius: 4,
      },
    ],
  };
};

const getEventTitle = (event) =>
  event?.eventTitle || event?.title || "Untitled Event";

const getEventCategory = (event) => {
  if (event?.eventCategory === "Other") {
    return event?.customCategory || "Other";
  }
  return event?.eventCategory || event?.category || "Other";
};

const getEventVenue = (event) =>
  String(event?.venue || event?.location || "Unknown Venue").trim() ||
  "Unknown Venue";

const getEventCapacity = (event) =>
  Number(event?.studentCapacity || event?.capacity || 0);

const getOrganisingClubName = (event) =>
  String(
    event?.organisingClubName ||
      event?.clubName ||
      event?.club?.name ||
      event?.organizingClubName ||
      ""
  ).trim();

const normalizeEventRecord = (event) => ({
  ...event,
  eventTitle: getEventTitle(event),
  eventCategory: event?.eventCategory || event?.category || "Other",
  customCategory: event?.customCategory || "",
  eventDate:
    event?.eventDate || event?.date || event?.startDate || event?.createdAt || "",
  startTime: event?.startTime || "",
  endTime: event?.endTime || "",
  venue: getEventVenue(event),
  studentCapacity: getEventCapacity(event),
  organisingClubName: getOrganisingClubName(event),
  organiserName: event?.organiserName || event?.organizerName || "",
  organiserPhone: event?.organiserPhone || event?.organizerPhone || "",
  registrationDeadline: event?.registrationDeadline || event?.deadline || "",
});

const ClubEventAnalysis = () => {
  const [rangePreset, setRangePreset] = useState("30d");
  const [rangeDays, setRangeDays] = useState(30);
  const [selectedClub, setSelectedClub] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");

  const loadAnalytics = async (showRefreshState = false) => {
    try {
      setError("");

      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [clubsResponse, eventsResponse] = await Promise.all([
        getActiveClubs(),
        API.get("/events"),
      ]);

      const clubData = safeArray(clubsResponse);
      const eventData = safeArray(eventsResponse?.data).map(normalizeEventRecord);

      setClubs(clubData);
      setEvents(eventData);
    } catch (loadError) {
      console.error("Failed to load analytics:", loadError);
      setError(
        loadError?.response?.data?.message || "Failed to load analytics data"
      );
      setClubs([]);
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  useEffect(() => {
    document.title = "Club Analytics";
    return () => {
      document.title = "UniConnect";
    };
  }, []);

  const rangedEvents = useMemo(() => {
    return events.filter((event) => isWithinRange(getEventDate(event), rangeDays));
  }, [events, rangeDays]);

  const clubMetrics = useMemo(() => {
    return clubs.map((club) => {
      const clubId = getClubId(club);
      const clubName = getClubName(club);

      const matchedEvents = rangedEvents.filter(
        (event) =>
          normalizeText(getOrganisingClubName(event)) === normalizeText(clubName)
      );

      const categoryMap = new Map();

      matchedEvents.forEach((event) => {
        const category = getEventCategory(event);
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      });

      return {
        clubId,
        name: clubName,
        members: getActiveMemberCount(club),
        pendingJoinRequests: getPendingJoinRequestCount(club),
        totalEvents: matchedEvents.length,
        upcomingEvents: matchedEvents.filter(isUpcomingEvent).length,
        registrationOpenEvents: matchedEvents.filter(isRegistrationOpen).length,
        totalCapacity: matchedEvents.reduce(
          (sum, event) => sum + getEventCapacity(event),
          0
        ),
        matchedEvents,
        categoryMap,
      };
    });
  }, [clubs, rangedEvents]);

  const selectedClubMetrics = useMemo(() => {
    if (selectedClub === "All") return null;
    return (
      clubMetrics.find((club) => String(club.clubId) === String(selectedClub)) ||
      null
    );
  }, [clubMetrics, selectedClub]);

  const visibleClubMetrics = useMemo(() => {
    if (selectedClub === "All") return clubMetrics;
    return selectedClubMetrics ? [selectedClubMetrics] : [];
  }, [clubMetrics, selectedClub, selectedClubMetrics]);

  const visibleEvents = useMemo(() => {
    if (selectedClub === "All") return rangedEvents;

    const selected = selectedClubMetrics?.name;
    if (!selected) return [];

    return rangedEvents.filter(
      (event) =>
        normalizeText(getOrganisingClubName(event)) === normalizeText(selected)
    );
  }, [rangedEvents, selectedClub, selectedClubMetrics]);

  const kpis = useMemo(() => {
    return visibleClubMetrics.reduce(
      (acc, club) => {
        acc.totalMembers += club.members;
        acc.totalEvents += club.totalEvents;
        acc.upcomingEvents += club.upcomingEvents;
        acc.registrationOpenEvents += club.registrationOpenEvents;
        acc.pendingJoinRequests += club.pendingJoinRequests;
        acc.totalCapacity += club.totalCapacity;
        return acc;
      },
      {
        totalMembers: 0,
        totalEvents: 0,
        upcomingEvents: 0,
        registrationOpenEvents: 0,
        pendingJoinRequests: 0,
        totalCapacity: 0,
      }
    );
  }, [visibleClubMetrics]);

  const membersBarData = useMemo(() => {
    return {
      labels: visibleClubMetrics.map((club) => club.name),
      datasets: [
        {
          label: "Active Members",
          data: visibleClubMetrics.map((club) => club.members),
          backgroundColor:
            selectedClub === "All"
              ? "rgba(10,30,140,0.88)"
              : visibleClubMetrics.map((club) =>
                  String(club.clubId) === String(selectedClub)
                    ? "rgba(10,30,140,0.95)"
                    : "rgba(203,213,225,0.6)"
                ),
          borderRadius: 10,
        },
      ],
    };
  }, [visibleClubMetrics, selectedClub]);

  const eventsPerClubData = useMemo(() => {
    return {
      labels: visibleClubMetrics.map((club) => club.name),
      datasets: [
        {
          label: "Events",
          data: visibleClubMetrics.map((club) => club.totalEvents),
          backgroundColor: "rgba(243,112,33,0.85)",
          borderRadius: 10,
        },
      ],
    };
  }, [visibleClubMetrics]);

  const categoryBreakdownData = useMemo(() => {
    const categoryMap = new Map();

    visibleEvents.forEach((event) => {
      const category = getEventCategory(event);
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    const labels = Array.from(categoryMap.keys());
    const values = Array.from(categoryMap.values());

    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            "#0a1e8c",
            "#0c249f",
            "#f37021",
            "#1d4ed8",
            "#fb923c",
            "#1e3a8a",
            "#fdba74",
          ],
          borderWidth: 0,
        },
      ],
    };
  }, [visibleEvents]);

  const venueBreakdownData = useMemo(() => {
    const venueMap = new Map();

    visibleEvents.forEach((event) => {
      const venue = getEventVenue(event);
      venueMap.set(venue, (venueMap.get(venue) || 0) + 1);
    });

    const labels = Array.from(venueMap.keys());
    const values = Array.from(venueMap.values());

    return {
      labels,
      datasets: [
        {
          label: "Events by Venue",
          data: values,
          backgroundColor: "rgba(12,36,159,0.85)",
          borderRadius: 8,
        },
      ],
    };
  }, [visibleEvents]);

  const monthlyTrendData = useMemo(() => {
    return buildMonthlyTrend(visibleEvents);
  }, [visibleEvents]);

  const clubOptions = useMemo(() => {
    return clubMetrics.map((club) => ({
      value: club.clubId,
      label: club.name,
    }));
  }, [clubMetrics]);

  const exportMembersCSV = () => {
    const rows = [
      ["Club", "Active Members", "Pending Join Requests"],
      ...visibleClubMetrics.map((club) => [
        club.name,
        club.members,
        club.pendingJoinRequests,
      ]),
    ];
    downloadCSV(rows, "club_members_analytics.csv");
  };

  const exportEventsCSV = () => {
    const rows = [
      [
        "Event Title",
        "Category",
        "Event Date",
        "Start Time",
        "End Time",
        "Venue",
        "Student Capacity",
        "Organising Club",
        "Organiser Name",
        "Organiser Phone",
        "Registration Deadline",
      ],
      ...visibleEvents.map((event) => [
        getEventTitle(event),
        getEventCategory(event),
        event.eventDate || "",
        event.startTime || "",
        event.endTime || "",
        getEventVenue(event),
        getEventCapacity(event),
        getOrganisingClubName(event),
        event.organiserName || "",
        event.organiserPhone || "",
        event.registrationDeadline || "",
      ]),
    ];
    downloadCSV(rows, "event_analytics.csv");
  };

  const chartContainerClass =
    "rounded-[30px] border border-[#0a1e8c]/10 bg-white p-6 shadow-[0_10px_30px_rgba(10,30,140,0.08)]";

  return (
    <div className="min-h-full bg-[#ffffff]">
      <div className="relative overflow-hidden rounded-[34px] border border-[#0a1e8c]/10 bg-gradient-to-r from-[#f5f8ff] via-white to-[#fff4ec] px-6 py-8 shadow-[0_12px_40px_rgba(10,30,140,0.08)]">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0a1e8c] via-[#0c249f] to-[#f37021]" />
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#f37021]/20 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#f37021] shadow-sm">
              <BarChart3 size={14} />
              Club & Event Analytics
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-[#0a1e8c] sm:text-4xl">
              Visual insights for clubs and events
            </h1>
            <p className="mt-2 max-w-3xl text-sm font-medium text-[#4a5b86] sm:text-base">
              This dashboard uses active clubs and real event records from the
              backend.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => loadAnalytics(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#0a1e8c]/15 bg-white px-4 py-3 text-sm font-bold text-[#0a1e8c] transition hover:-translate-y-0.5 hover:bg-[#f5f8ff] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              type="button"
              onClick={exportMembersCSV}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#0a1e8c]/15 bg-white px-4 py-3 text-sm font-bold text-[#0a1e8c] transition hover:-translate-y-0.5 hover:bg-[#f5f8ff]"
            >
              <Download size={16} />
              Export Members
            </button>

            <button
              type="button"
              onClick={exportEventsCSV}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#0a1e8c] to-[#0c249f] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#0a1e8c]/20 transition hover:-translate-y-0.5"
            >
              <Download size={16} />
              Export Events
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 rounded-[28px] border border-[#0a1e8c]/10 bg-white p-5 shadow-[0_8px_24px_rgba(10,30,140,0.06)] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold text-[#0a1e8c]">Range:</span>

          <button
            type="button"
            onClick={() => {
              setRangePreset("7d");
              setRangeDays(7);
            }}
            className={`rounded-2xl px-4 py-2.5 text-sm font-bold transition ${
              rangePreset === "7d"
                ? "bg-[#0a1e8c] text-white shadow-md"
                : "border border-[#0a1e8c]/15 bg-white text-[#0a1e8c] hover:bg-[#f5f8ff]"
            }`}
          >
            7d
          </button>

          <button
            type="button"
            onClick={() => {
              setRangePreset("30d");
              setRangeDays(30);
            }}
            className={`rounded-2xl px-4 py-2.5 text-sm font-bold transition ${
              rangePreset === "30d"
                ? "bg-[#0a1e8c] text-white shadow-md"
                : "border border-[#0a1e8c]/15 bg-white text-[#0a1e8c] hover:bg-[#f5f8ff]"
            }`}
          >
            30d
          </button>

          <button
            type="button"
            onClick={() => {
              setRangePreset("90d");
              setRangeDays(90);
            }}
            className={`rounded-2xl px-4 py-2.5 text-sm font-bold transition ${
              rangePreset === "90d"
                ? "bg-[#0a1e8c] text-white shadow-md"
                : "border border-[#0a1e8c]/15 bg-white text-[#0a1e8c] hover:bg-[#f5f8ff]"
            }`}
          >
            90d
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-bold text-[#0a1e8c]">Club:</label>
          <select
            value={selectedClub}
            onChange={(event) => setSelectedClub(event.target.value)}
            className="rounded-2xl border border-[#0a1e8c]/15 bg-white px-4 py-3 text-sm font-semibold text-[#0a1e8c] outline-none transition focus:border-[#0a1e8c]"
          >
            <option value="All">All Clubs</option>
            {clubOptions.map((club) => (
              <option key={club.value} value={club.value}>
                {club.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setSelectedClub("All");
              setRangePreset("30d");
              setRangeDays(30);
            }}
            className="rounded-2xl border border-[#f37021]/20 bg-[#fff4ec] px-4 py-3 text-sm font-bold text-[#f37021] transition hover:-translate-y-0.5"
          >
            Reset
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-[28px] border border-[#0a1e8c]/10 bg-white"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Active Members"
              value={kpis.totalMembers}
              subtitle={
                selectedClub === "All" ? "Across active clubs" : "For selected club"
              }
              icon={Users}
            />
            <StatCard
              title="Events in Range"
              value={kpis.totalEvents}
              subtitle={`Last ${rangeDays} days`}
              icon={CalendarDays}
            />
            <StatCard
              title="Upcoming Events"
              value={kpis.upcomingEvents}
              subtitle="Based on event date"
              icon={Activity}
            />
            <StatCard
              title="Registration Open"
              value={kpis.registrationOpenEvents}
              subtitle="Registration deadline not passed"
              icon={BarChart3}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className={chartContainerClass}>
              <div className="mb-4">
                <h3 className="text-lg font-black text-[#0a1e8c]">
                  Members per Club
                </h3>
                <p className="text-sm font-medium text-[#7b8ab2]">
                  Active members from club records
                </p>
              </div>
              <div className="h-[340px]">
                <Bar
                  data={membersBarData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                  }}
                />
              </div>
            </div>

            <div className={chartContainerClass}>
              <div className="mb-4">
                <h3 className="text-lg font-black text-[#0a1e8c]">
                  Events per Club
                </h3>
                <p className="text-sm font-medium text-[#7b8ab2]">
                  Count of events using organising club name
                </p>
              </div>
              <div className="h-[340px]">
                <Bar
                  data={eventsPerClubData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                  }}
                />
              </div>
            </div>

            <div className={chartContainerClass}>
              <div className="mb-4">
                <h3 className="text-lg font-black text-[#0a1e8c]">
                  Event Category Breakdown
                </h3>
                <p className="text-sm font-medium text-[#7b8ab2]">
                  Distribution by event category
                </p>
              </div>
              <div className="h-[340px]">
                <Pie
                  data={categoryBreakdownData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: "bottom" },
                    },
                  }}
                />
              </div>
            </div>

            <div className={chartContainerClass}>
              <div className="mb-4">
                <h3 className="text-lg font-black text-[#0a1e8c]">
                  Event Trend
                </h3>
                <p className="text-sm font-medium text-[#7b8ab2]">
                  Event counts over the last 6 months
                </p>
              </div>
              <div className="h-[340px]">
                <Line
                  data={monthlyTrendData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className={chartContainerClass}>
              <div className="mb-4">
                <h3 className="text-lg font-black text-[#0a1e8c]">
                  Venue Popularity
                </h3>
                <p className="text-sm font-medium text-[#7b8ab2]">
                  Events grouped by venue
                </p>
              </div>
              <div className="h-[340px]">
                <Doughnut
                  data={venueBreakdownData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: "bottom" },
                    },
                  }}
                />
              </div>
            </div>

            <div className={chartContainerClass}>
              <div className="mb-4">
                <h3 className="text-lg font-black text-[#0a1e8c]">
                  Club Summary
                </h3>
                <p className="text-sm font-medium text-[#7b8ab2]">
                  Quick summary for the selected range
                </p>
              </div>

              <div className="space-y-3">
                {visibleClubMetrics.length === 0 ? (
                  <div className="rounded-2xl border border-[#0a1e8c]/10 bg-[#f8fbff] px-4 py-5 text-sm font-semibold text-[#4a5b86]">
                    No analytics data available.
                  </div>
                ) : (
                  visibleClubMetrics.map((club) => (
                    <div
                      key={club.clubId}
                      className="rounded-2xl border border-[#0a1e8c]/10 bg-[#f8fbff] px-4 py-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h4 className="text-base font-black text-[#0a1e8c]">
                            {club.name}
                          </h4>
                          <p className="mt-1 text-xs font-medium text-[#7b8ab2]">
                            Members: {formatNumber(club.members)} • Events:{" "}
                            {formatNumber(club.totalEvents)} • Capacity:{" "}
                            {formatNumber(club.totalCapacity)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-[#eef3ff] px-3 py-1 text-xs font-black text-[#0a1e8c]">
                            Upcoming {formatNumber(club.upcomingEvents)}
                          </span>
                          <span className="rounded-full bg-[#fff4ec] px-3 py-1 text-xs font-black text-[#f37021]">
                            Reg Open {formatNumber(club.registrationOpenEvents)}
                          </span>
                          <span className="rounded-full bg-[#f5f8ff] px-3 py-1 text-xs font-black text-[#0c249f]">
                            Pending Join {formatNumber(club.pendingJoinRequests)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ClubEventAnalysis;