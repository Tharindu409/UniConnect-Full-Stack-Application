import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import API from "./Auth/axios";
import {
  BadgeCheck,
  GraduationCap,
  Search,
  ShieldAlert,
  UserPlus,
  UserCheck,
  Users,
  X,
  Building2,
  Layers3,
  FolderCog,
  FileText,
  Newspaper,
  FolderOpen,
  PlusCircle,
  Pencil,
  Trash2,
  ExternalLink,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  ChevronRight,
  TimerReset,
  UsersRound,
  LogOut,
} from "lucide-react";

const initialUserForm = {
  fullName: "",
  email: "",
  password: "",
  studentId: "",
  faculty: "",
  yearOfStudy: "",
  role: "STUDENT",
  isActive: true,
  isEmailVerified: false,
  degreeProgram: "",
  bio: "",
};

const initialRewardForm = {
  badgeId: "",
  certificateTitle: "",
  issuer: "UniConnect",
  verificationUrl: "",
};

const initialBadgeForm = {
  title: "",
  description: "",
  criteria: "",
  icon: "",
};

const initialClubForm = {
  name: "",
  description: "",
  category: "Academic",
  presidentName: "",
  presidentEmail: "",
};

const initialNewsForm = {
  title: "",
  summary: "",
  content: "",
  category: "General",
  author: "",
  isPublished: true,
};

const initialProjectForm = {
  title: "",
  description: "",
  category: "Web",
  ownerName: "",
  githubUrl: "",
  liveUrl: "",
  imageUrl: "",
  status: "published",
};

const initialEventForm = {
  title: "",
  description: "",
  category: "General",
  club: "",
  venue: "",
  date: "",
  time: "",
  imageUrl: "",
  status: "upcoming",
};

const StatCard = ({ title, value, icon: Icon, tone }) => (
  <div className="group relative overflow-hidden rounded-[26px] border border-[#0a1e8c]/10 bg-white p-5 shadow-[0_10px_30px_rgba(10,30,140,0.06)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(10,30,140,0.12)]">
    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0a1e8c] via-[#0c249f] to-[#f37021]" />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-[#4a5b86]">{title}</p>
        <p className="mt-2 text-3xl font-black text-[#0a1e8c]">{value}</p>
      </div>
      <div className={`rounded-xl p-3 shadow-sm ${tone}`}>
        <Icon size={18} />
      </div>
    </div>
  </div>
);

const EventMetricCard = ({ title, value, subtitle, icon: Icon, tone = "blue" }) => {
  const tones = {
    blue: "border-[#0a1e8c]/20 bg-[#f5f8ff] text-[#0a1e8c]",
    green: "border-[#f37021]/20 bg-[#fff4ec] text-[#f37021]",
    amber: "border-[#f37021]/20 bg-[#fff4ec] text-[#f37021]",
    purple: "border-[#0c249f]/20 bg-[#eef3ff] text-[#0c249f]",
    red: "border-red-200 bg-red-50 text-red-600",
  };

  return (
    <div className="group relative overflow-hidden rounded-[26px] border border-[#0a1e8c]/10 bg-white p-5 shadow-[0_10px_30px_rgba(10,30,140,0.06)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(10,30,140,0.12)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0a1e8c] via-[#0c249f] to-[#f37021]" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-3xl font-black leading-none text-[#0a1e8c]">{value}</p>
          <p className="mt-2 text-sm font-bold text-[#0a1e8c]">{title}</p>
          {subtitle ? <p className="mt-1 text-xs text-[#4a5b86]">{subtitle}</p> : null}
        </div>
        <div className={`rounded-2xl border p-3 shadow-sm ${tones[tone] || tones.blue}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
};

const getEventDateValue = (event) => {
  if (!event?.date && !event?.eventDate) return null;
  const dateStr = event.date || event.eventDate;
  const parsed = new Date(dateStr);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

// UPDATED: Uses registeredCount from slots API (same as reference code)
const getEventRegistrationCount = (event) => {
  const count = event?.registeredCount ?? 0;
  return Number.isFinite(Number(count)) ? Number(count) : 0;
};

// UPDATED: Uses totalCapacity or studentCapacity (same as reference code)
const getEventCapacity = (event) => {
  const capacity = event?.totalCapacity ?? event?.studentCapacity ?? 0;
  return Number.isFinite(Number(capacity)) ? Number(capacity) : 0;
};

// UPDATED: Uses waitlistCount (same as reference code)
const getWaitlistCount = (event) => {
  const count = event?.waitlistCount ?? 0;
  return Number.isFinite(Number(count)) ? Number(count) : 0;
};

const formatEventDate = (dateValue) => {
  if (!dateValue) return "Date not set";
  return dateValue.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatEventTime = (event, dateValue) => {
  if (event?.time || event?.startTime) return event.time || event.startTime;
  if (!dateValue) return "Time not set";
  return dateValue.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
};

const getEventAccentClass = (category = "") => {
  const value = String(category).toLowerCase();
  if (["competition", "hackathon"].includes(value)) return "bg-[#f37021]";
  if (["cultural", "social", "seminar"].includes(value)) return "bg-[#0c249f]";
  if (["sports"].includes(value)) return "bg-[#0a1e8c]";
  if (["conference", "workshop"].includes(value)) return "bg-[#f37021]";
  return "bg-[#0a1e8c]";
};

const getEventCategoryBadgeClass = (category = "") => {
  const value = String(category).toLowerCase();
  if (["competition", "hackathon"].includes(value)) return "bg-[#fff4ec] text-[#f37021]";
  if (["cultural", "social", "seminar"].includes(value)) return "bg-[#eef3ff] text-[#0c249f]";
  if (["sports"].includes(value)) return "bg-[#f5f8ff] text-[#0a1e8c]";
  if (["conference", "workshop"].includes(value)) return "bg-[#fff4ec] text-[#f37021]";
  return "bg-[#f5f8ff] text-[#0a1e8c]";
};

const getEventStatusBadgeClass = (status = "") => {
  const value = String(status).toLowerCase();
  if (value === "completed") return "bg-[#f5f8ff] text-[#0a1e8c]";
  if (value === "ongoing") return "bg-[#fff4ec] text-[#f37021]";
  if (value === "cancelled") return "bg-red-50 text-red-600";
  return "bg-[#fff4ec] text-[#f37021]";
};

const Modal = ({ title, icon: Icon, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a1e8c]/35 p-4 backdrop-blur-md">
    <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-[#0a1e8c]/10 bg-white shadow-[0_25px_80px_rgba(10,30,140,0.22)] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-[#0a1e8c]/10 bg-gradient-to-r from-[#f5f8ff] via-white to-[#fff4ec] px-6 py-4">
        <h3 className="flex items-center gap-2 text-lg font-black text-[#0a1e8c]">
          {Icon ? <Icon size={18} /> : null}
          {title}
        </h3>
        <button
          onClick={onClose}
          className="rounded-xl p-2 text-[#4a5b86] transition hover:bg-[#f5f8ff] hover:text-[#0a1e8c]"
          type="button"
        >
          <X size={16} />
        </button>
      </div>
      <div className="max-h-[80vh] overflow-y-auto p-6">{children}</div>
    </div>
  </div>
);

const tabButtonClass = (active) =>
  `inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all ${
    active
      ? "bg-gradient-to-r from-[#0a1e8c] to-[#0c249f] text-white shadow-lg"
      : "bg-white text-[#0a1e8c] border border-[#0a1e8c]/15 hover:bg-[#f5f8ff] hover:-translate-y-0.5"
  }`;

const USER_ROLE_OPTIONS = ["STUDENT", "CLUB_ADMIN", "SYSTEM_ADMIN"];

const categories = [
  "Engineering",
  "Academic",
  "Environment",
  "Creative",
  "Business",
  "Cultural",
  "Sports",
  "Arts",
];

const newsCategories = [
  "General",
  "Events",
  "Announcements",
  "Achievements",
  "Academic",
  "Technology",
];

const projectCategories = [
  "Web",
  "Mobile",
  "AI",
  "Research",
  "Community",
  "Design",
  "Other",
];

const eventCategories = [
  "General",
  "Workshop",
  "Seminar",
  "Competition",
  "Conference",
  "Cultural",
  "Sports",
  "Hackathon",
];

const eventStatusOptions = ["upcoming", "ongoing", "completed", "cancelled"];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getStoredUser = () => {
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

const AdminPanel = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [clubSearch, setClubSearch] = useState("");
  const [newsSearch, setNewsSearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [eventSearch, setEventSearch] = useState("");

  const [users, setUsers] = useState([]);
  const [badges, setBadges] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [newsList, setNewsList] = useState([]);
  const [projects, setProjects] = useState([]);
  const [events, setEvents] = useState([]);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedNewsId, setSelectedNewsId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [me, setMe] = useState(() => getStoredUser());

  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [hasClubAccess, setHasClubAccess] = useState(false);

  const [activeTab, setActiveTab] = useState(() =>
    String(getStoredUser()?.role || "").toUpperCase() === "CLUB_ADMIN"
      ? "clubs"
      : "overview"
  );

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showClubModal, setShowClubModal] = useState(false);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);

  const [form, setForm] = useState(initialUserForm);
  const [rewardForm, setRewardForm] = useState(initialRewardForm);
  const [certificateImageFile, setCertificateImageFile] = useState(null);
  const [badgeForm, setBadgeForm] = useState(initialBadgeForm);
  const [clubForm, setClubForm] = useState(initialClubForm);
  const [constitutionFile, setConstitutionFile] = useState(null);
  const [newsForm, setNewsForm] = useState(initialNewsForm);
  const [projectForm, setProjectForm] = useState(initialProjectForm);
  const [eventForm, setEventForm] = useState(initialEventForm);

  const role = me?.role || "";
  const isSystemAdmin = role === "SYSTEM_ADMIN";
  const isClubAdmin = role === "CLUB_ADMIN";

  const canManageUsers = isSystemAdmin;
  const canManageBadges = isSystemAdmin;
  const canCreateClub = isSystemAdmin;
  const canApproveRejectClub = isSystemAdmin;
  const canDeleteClub = isSystemAdmin;
  const canSeeClubTab = isSystemAdmin || isClubAdmin;
  const canManageNews = isSystemAdmin;
  const canManageProjects = isSystemAdmin;
  const canManageEvents = isSystemAdmin;

  const presidentEmailError =
    clubForm.presidentEmail.trim() &&
    !emailRegex.test(clubForm.presidentEmail.trim().toLowerCase())
      ? "Enter a valid president email address"
      : "";

  const constitutionFileError =
    constitutionFile && constitutionFile.type !== "application/pdf"
      ? "Please upload a PDF file for the constitution"
      : "";

  const resetUserForm = () => {
    setSelectedUserId("");
    setForm(initialUserForm);
  };

  const resetClubForm = () => {
    setClubForm(initialClubForm);
    setConstitutionFile(null);
  };

  const resetNewsForm = () => {
    setSelectedNewsId("");
    setNewsForm(initialNewsForm);
  };

  const resetProjectForm = () => {
    setSelectedProjectId("");
    setProjectForm(initialProjectForm);
  };

  const resetEventForm = () => {
    setSelectedEventId("");
    setEventForm(initialEventForm);
  };

  const handleUserInputChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleClubInputChange = (key, value) => {
    setClubForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleNewsInputChange = (key, value) => {
    setNewsForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleProjectInputChange = (key, value) => {
    setProjectForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleEventInputChange = (key, value) => {
    setEventForm((prev) => ({ ...prev, [key]: value }));
  };

  // UPDATED: loadAdminData now fetches real-time registration counts
  // from /registrations/slots/:id for each event (same as reference code)
  const loadAdminData = async () => {
    setMessage("");
    setIsLoading(true);

    let nextMessage = "";
    let nextMe = me;
    let nextUsers = [];
    let nextBadges = [];
    let nextClubs = [];
    let nextNews = [];
    let nextProjects = [];
    let nextEvents = [];
    let nextHasAdminAccess = false;
    let nextHasClubAccess = false;

    try {
      try {
        const meRes = await API.get("/auth/me");
        nextMe = meRes.data || null;
      } catch {
        nextMe = getStoredUser();
      }

      let userList = [];
      let clubList = [];
      let fetchedNews = [];
      let fetchedProjects = [];
      let fetchedEvents = [];

      try {
        const usersRes = await API.get("/admin/users");
        userList = Array.isArray(usersRes.data) ? usersRes.data : [];
        nextUsers = userList;
        nextHasAdminAccess = true;
      } catch {
        nextUsers = [];
        nextHasAdminAccess = false;
      }

      try {
        const badgesRes = await API.get("/admin/badges");
        nextBadges = Array.isArray(badgesRes.data?.data)
          ? badgesRes.data.data
          : Array.isArray(badgesRes.data)
          ? badgesRes.data
          : [];
      } catch {
        nextBadges = [];
      }

      try {
        const clubsRes = await API.get("/clubs");
        clubList = Array.isArray(clubsRes.data?.data)
          ? clubsRes.data.data
          : Array.isArray(clubsRes.data)
          ? clubsRes.data
          : [];
        nextClubs = clubList;
        nextHasClubAccess = true;
      } catch {
        nextClubs = [];
        nextHasClubAccess = false;
      }

      try {
        const newsRes = await API.get("/news");
        fetchedNews = Array.isArray(newsRes.data?.data)
          ? newsRes.data.data
          : Array.isArray(newsRes.data)
          ? newsRes.data
          : [];
        nextNews = fetchedNews;
      } catch {
        nextNews = [];
      }

      try {
        const projectsRes = await API.get("/projects");
        fetchedProjects = Array.isArray(projectsRes.data?.data)
          ? projectsRes.data.data
          : Array.isArray(projectsRes.data)
          ? projectsRes.data
          : [];
        nextProjects = fetchedProjects;
      } catch {
        nextProjects = [];
      }

      // UPDATED: Fetch events with real-time registration counts
      // using /registrations/slots/:id for each event
      try {
        const eventsRes = await API.get("/events");
        fetchedEvents = Array.isArray(eventsRes.data?.data)
          ? eventsRes.data.data
          : Array.isArray(eventsRes.data)
          ? eventsRes.data
          : [];

        // Fetch real-time registration counts for each event
        const eventsWithCounts = await Promise.all(
          fetchedEvents.map(async (event) => {
            try {
              const slotsRes = await API.get(`/registrations/slots/${event._id}`);

              // Calculate correct status based on date
              const eventDate = new Date(event.eventDate || event.date);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              eventDate.setHours(0, 0, 0, 0);

              let actualStatus = event.status || "upcoming";

              if (actualStatus !== "completed" && actualStatus !== "cancelled") {
                if (eventDate < today) {
                  actualStatus = "completed";
                } else if (eventDate.getTime() === today.getTime()) {
                  actualStatus = "ongoing";
                } else {
                  actualStatus = "upcoming";
                }
              }

              return {
                ...event,
                title: event.eventTitle || event.title,
                description: event.description,
                category: event.eventCategory || event.category,
                club: event.club || { name: event.organisingClubName },
                date: event.eventDate || event.date,
                time: event.startTime || event.time,
                venue: event.venue,
                status: actualStatus,
                imageUrl: event.imageUrl || event.eventPoster,
                // Real-time counts from Registration collection
                registeredCount: slotsRes.data?.registeredCount || 0,
                waitlistCount: slotsRes.data?.waitlistCount || 0,
                totalCapacity: slotsRes.data?.totalCapacity || event.studentCapacity || 0,
                remainingSlots: slotsRes.data?.remainingSlots || 0,
              };
            } catch (error) {
              // Fallback if slots API fails for this event
              const eventDate = new Date(event.eventDate || event.date);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              eventDate.setHours(0, 0, 0, 0);

              let actualStatus = event.status || "upcoming";

              if (actualStatus !== "completed" && actualStatus !== "cancelled") {
                if (eventDate < today) {
                  actualStatus = "completed";
                } else if (eventDate.getTime() === today.getTime()) {
                  actualStatus = "ongoing";
                } else {
                  actualStatus = "upcoming";
                }
              }

              return {
                ...event,
                title: event.eventTitle || event.title,
                description: event.description,
                category: event.eventCategory || event.category,
                club: event.club || { name: event.organisingClubName },
                date: event.eventDate || event.date,
                time: event.startTime || event.time,
                venue: event.venue,
                status: actualStatus,
                imageUrl: event.imageUrl || event.eventPoster,
                registeredCount: 0,
                waitlistCount: 0,
                totalCapacity: event.studentCapacity || 0,
                remainingSlots: 0,
              };
            }
          })
        );

        nextEvents = eventsWithCounts;
      } catch {
        nextEvents = [];
      }

      if (
        !userList.length &&
        !clubList.length &&
        !fetchedNews.length &&
        !fetchedProjects.length &&
        !fetchedEvents.length
      ) {
        nextMessage = "Some admin modules are unavailable.";
      }
    } catch (error) {
      nextMessage = error?.response?.data?.message || "Failed to load admin data";
    } finally {
      setMe(nextMe);
      setUsers(nextUsers);
      setBadges(nextBadges);
      setClubs(nextClubs);
      setNewsList(nextNews);
      setProjects(nextProjects);
      setEvents(nextEvents);
      setHasAdminAccess(nextHasAdminAccess);
      setHasClubAccess(nextHasClubAccess);
      setMessage(nextMessage);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    if (isClubAdmin && !isSystemAdmin) {
      setActiveTab("clubs");
    }
  }, [isClubAdmin, isSystemAdmin]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;

    return users.filter((student) =>
      [
        student.studentId,
        student.fullName,
        student.email,
        student.faculty,
        student.role,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [search, users]);

  const filteredClubs = useMemo(() => {
    const q = clubSearch.trim().toLowerCase();
    if (!q) return clubs;

    return clubs.filter((club) =>
      [
        club.name,
        club.description,
        club.category,
        club.status,
        club.president?.name,
        club.president?.email,
        club.constitution?.fileName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [clubSearch, clubs]);

  const filteredNews = useMemo(() => {
    const q = newsSearch.trim().toLowerCase();
    if (!q) return newsList;

    return newsList.filter((item) =>
      [item.title, item.summary, item.content, item.category, item.author]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [newsSearch, newsList]);

  const filteredProjects = useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    if (!q) return projects;

    return projects.filter((item) =>
      [item.title, item.description, item.category, item.ownerName, item.status]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [projectSearch, projects]);

  const filteredEvents = useMemo(() => {
    const q = eventSearch.trim().toLowerCase();
    if (!q) return events;

    return events.filter((item) =>
      [
        item.title,
        item.description,
        item.category,
        item.venue,
        item.status,
        item.club?.name,
        item.clubName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [eventSearch, events]);

  const totalStudents = users.filter((u) => u.role === "STUDENT").length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const inactiveUsers = users.filter((u) => !u.isActive).length;
  const activeMentors = 0;

  const totalClubs = clubs.length;
  const activeClubs = clubs.filter((c) => c.status === "active").length;
  const pendingClubs = clubs.filter((c) => c.status === "pending").length;
  const rejectedClubs = clubs.filter((c) => c.status === "rejected").length;

  const totalNews = newsList.length;
  const publishedNews = newsList.filter((n) => n.isPublished !== false).length;

  const totalProjects = projects.length;
  const publishedProjects = projects.filter(
    (p) => (p.status || "").toLowerCase() === "published"
  ).length;

  const totalEvents = events.length;

  // UPDATED: Count by status (accurate because status is set based on date)
  const upcomingEvents = events.filter(
    (e) => String(e.status || "").toLowerCase() === "upcoming"
  ).length;

  const ongoingEvents = events.filter(
    (e) => String(e.status || "").toLowerCase() === "ongoing"
  ).length;

  const completedEvents = events.filter(
    (e) => String(e.status || "").toLowerCase() === "completed"
  ).length;

  // UPDATED: Uses getEventRegistrationCount which now reads
  // registeredCount fetched from /registrations/slots/:id
  const totalRegistrations = events.reduce(
    (sum, item) => sum + getEventRegistrationCount(item),
    0
  );

  const totalWaitlist = events.reduce((sum, item) => sum + getWaitlistCount(item), 0);
  const totalCapacity = events.reduce((sum, item) => sum + getEventCapacity(item), 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // UPDATED: pastEvents now just checks status (already calculated correctly)
  const pastEvents = events.filter((item) => {
    const status = String(item?.status || "").toLowerCase();
    return status === "completed" || status === "cancelled";
  }).length;

  const openEditModal = (user) => {
    setSelectedUserId(user._id);
    setForm({
      fullName: user.fullName || "",
      email: user.email || "",
      password: "",
      studentId: user.studentId || "",
      faculty: user.faculty || user.profile?.faculty || "",
      yearOfStudy: user.yearOfStudy || user.profile?.yearOfStudy || "",
      role: user.role || "STUDENT",
      isActive: Boolean(user.isActive),
      isEmailVerified: Boolean(user.isEmailVerified),
      degreeProgram: user.profile?.degreeProgram || "",
      bio: user.profile?.bio || "",
    });
    setShowEditUserModal(true);
  };

  const openRewardModal = (user) => {
    setSelectedUserId(user._id);
    setRewardForm(initialRewardForm);
    setCertificateImageFile(null);
    setShowRewardModal(true);
  };

  const openEditNewsModal = (item) => {
    setSelectedNewsId(item._id);
    setNewsForm({
      title: item.title || "",
      summary: item.summary || "",
      content: item.content || "",
      category: item.category || "General",
      author: item.author || "",
      isPublished: item.isPublished !== false,
    });
    setShowNewsModal(true);
  };

  const openEditProjectModal = (item) => {
    setSelectedProjectId(item._id);
    setProjectForm({
      title: item.title || "",
      description: item.description || "",
      category: item.category || "Web",
      ownerName: item.ownerName || "",
      githubUrl: item.githubUrl || "",
      liveUrl: item.liveUrl || "",
      imageUrl: item.imageUrl || "",
      status: item.status || "published",
    });
    setShowProjectModal(true);
  };

  const openEditEventModal = (item) => {
    setSelectedEventId(item._id);
    setEventForm({
      title: item.title || item.eventTitle || "",
      description: item.description || "",
      category: item.category || item.eventCategory || "General",
      club: item.club?.name || item.club || item.organisingClubName || "",
      venue: item.venue || "",
      date: item.date
        ? String(item.date).slice(0, 10)
        : item.eventDate
        ? String(item.eventDate).slice(0, 10)
        : "",
      time: item.time || item.startTime || "",
      imageUrl: item.imageUrl || item.eventPoster || "",
      status: item.status || "upcoming",
    });
    setShowEventModal(true);
  };

  const handleSaveUser = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!isSystemAdmin) {
      setMessage("Only system admins can manage users.");
      return;
    }

    try {
      setIsSaving(true);

      if (selectedUserId) {
        await API.put(`/admin/users/${selectedUserId}`, {
          ...form,
          password: form.password || undefined,
        });
        setMessage("User updated successfully");
      } else {
        await API.post("/admin/users", form);
        setMessage("User created successfully");
      }

      await loadAdminData();
      resetUserForm();
      setShowAddUserModal(false);
      setShowEditUserModal(false);
    } catch (error) {
      setMessage(error?.response?.data?.message || "Failed to save user");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!isSystemAdmin) {
      setMessage("Only system admins can delete users.");
      return;
    }

    const ok = window.confirm("Delete this user and profile permanently?");
    if (!ok) return;

    try {
      await API.delete(`/admin/users/${userId}`);
      setMessage("User deleted successfully");
      await loadAdminData();
    } catch (error) {
      setMessage(error?.response?.data?.message || "Failed to delete user");
    }
  };

  const handleAssignReward = async (event) => {
    event.preventDefault();

    if (!isSystemAdmin) {
      setMessage("Only system admins can assign rewards.");
      return;
    }

    if (!selectedUserId) {
      setMessage("Select a user first");
      return;
    }

    if (!rewardForm.badgeId && !rewardForm.certificateTitle.trim()) {
      setMessage("Select a badge and/or enter a certificate title");
      return;
    }

    try {
      const formData = new FormData();

      Object.entries(rewardForm).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ""
        ) {
          formData.append(key, value);
        }
      });

      if (certificateImageFile) {
        formData.append("certificateImage", certificateImageFile);
      }

      await API.post(`/admin/users/${selectedUserId}/rewards`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setRewardForm(initialRewardForm);
      setCertificateImageFile(null);
      setMessage("Badge/certificate assigned successfully");
      setShowRewardModal(false);
      await loadAdminData();
    } catch (error) {
      setMessage(error?.response?.data?.message || "Failed to assign reward");
    }
  };

  const handleCreateBadge = async (event) => {
    event.preventDefault();

    if (!isSystemAdmin) {
      setMessage("Only system admins can create badges.");
      return;
    }

    if (!badgeForm.title.trim()) {
      setMessage("Badge title is required");
      return;
    }

    try {
      await API.post("/admin/badges", badgeForm);
      setBadgeForm(initialBadgeForm);
      setMessage("Badge created successfully");
      setShowBadgeModal(false);
      await loadAdminData();
    } catch (error) {
      setMessage(error?.response?.data?.message || "Failed to create badge");
    }
  };

  const handleCreateClub = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!isSystemAdmin) {
      setMessage("Only system admins can create clubs.");
      return;
    }

    const normalizedName = clubForm.name.trim();
    const normalizedDescription = clubForm.description.trim();
    const normalizedPresidentName = clubForm.presidentName.trim();
    const normalizedPresidentEmail = clubForm.presidentEmail.trim().toLowerCase();

    if (!normalizedName) {
      setMessage("Club name is required.");
      return;
    }

    if (!normalizedDescription) {
      setMessage("Club description is required.");
      return;
    }

    if (!normalizedPresidentName) {
      setMessage("President name is required.");
      return;
    }

    if (!normalizedPresidentEmail) {
      setMessage("President email is required.");
      return;
    }

    if (!emailRegex.test(normalizedPresidentEmail)) {
      setMessage("Please enter a valid president email address.");
      return;
    }

    if (constitutionFile && constitutionFile.type !== "application/pdf") {
      setMessage("Please upload a valid PDF constitution.");
      return;
    }

    try {
      setIsSaving(true);

      const formData = new FormData();
      formData.append("name", normalizedName);
      formData.append("description", normalizedDescription);
      formData.append("category", clubForm.category);
      formData.append("presidentName", normalizedPresidentName);
      formData.append("presidentEmail", normalizedPresidentEmail);

      if (constitutionFile) {
        formData.append("constitution", constitutionFile);
      }

      await API.post("/clubs", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage(
        constitutionFile
          ? "Club and constitution uploaded successfully"
          : "Club created successfully"
      );
      setShowClubModal(false);
      resetClubForm();
      await loadAdminData();
    } catch (error) {
      setMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to create club"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleClubStatus = async (clubId, status) => {
    if (!isSystemAdmin) {
      setMessage("Only system admins can update club status.");
      return;
    }

    try {
      if (status === "active") {
        await API.put(`/clubs/${clubId}/approve`);
      } else if (status === "rejected") {
        await API.put(`/clubs/${clubId}/reject`, {
          reason: "Rejected by system admin",
        });
      }

      setMessage("Club status updated successfully");
      await loadAdminData();
    } catch (error) {
      setMessage(error?.response?.data?.message || "Failed to update club status");
    }
  };

  const handleDeleteClub = async (clubId) => {
    if (!isSystemAdmin) {
      setMessage("Only system admins can delete clubs.");
      return;
    }

    const ok = window.confirm("Delete this club permanently?");
    if (!ok) return;

    try {
      await API.delete(`/clubs/${clubId}`);
      setMessage("Club deleted successfully");
      toast.success("Club deleted successfully");
      await loadAdminData();
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to delete club";
      setMessage(message);
      toast.error(message);
    }
  };

  const handleSaveNews = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!isSystemAdmin) {
      setMessage("Only system admins can manage news.");
      toast.error("Only system admins can manage news.");
      return;
    }

    if (
      !newsForm.title.trim() ||
      !newsForm.summary.trim() ||
      !newsForm.content.trim()
    ) {
      setMessage("Title, summary, and content are required for news.");
      toast.error("Title, summary, and content are required for news.");
      return;
    }

    try {
      setIsSaving(true);

      if (selectedNewsId) {
        await API.put(`/news/${selectedNewsId}`, newsForm);
        setMessage("News updated successfully");
        toast.success("News updated successfully");
      } else {
        await API.post("/news", newsForm);
        setMessage("News created successfully");
        toast.success("News created successfully");
      }

      resetNewsForm();
      setShowNewsModal(false);
      await loadAdminData();
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to save news";
      setMessage(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNews = async (newsId) => {
    if (!isSystemAdmin) {
      setMessage("Only system admins can delete news.");
      toast.error("Only system admins can delete news.");
      return;
    }

    const ok = window.confirm("Delete this news item permanently?");
    if (!ok) return;

    try {
      await API.delete(`/news/${newsId}`);
      setMessage("News deleted successfully");
      toast.success("News deleted successfully");
      await loadAdminData();
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to delete news";
      setMessage(message);
      toast.error(message);
    }
  };

  const handleSaveProject = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!isSystemAdmin) {
      setMessage("Only system admins can manage projects.");
      toast.error("Only system admins can manage projects.");
      return;
    }

    if (!projectForm.title.trim() || !projectForm.description.trim()) {
      setMessage("Project title and description are required.");
      toast.error("Project title and description are required.");
      return;
    }

    try {
      setIsSaving(true);

      if (selectedProjectId) {
        await API.put(`/projects/${selectedProjectId}`, projectForm);
        setMessage("Project updated successfully");
        toast.success("Project updated successfully");
      } else {
        await API.post("/projects", projectForm);
        setMessage("Project created successfully");
        toast.success("Project created successfully");
      }

      resetProjectForm();
      setShowProjectModal(false);
      await loadAdminData();
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to save project";
      setMessage(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!isSystemAdmin) {
      setMessage("Only system admins can delete projects.");
      toast.error("Only system admins can delete projects.");
      return;
    }

    const ok = window.confirm("Delete this project permanently?");
    if (!ok) return;

    try {
      await API.delete(`/projects/${projectId}`);
      setMessage("Project deleted successfully");
      toast.success("Project deleted successfully");
      await loadAdminData();
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to delete project";
      setMessage(message);
      toast.error(message);
    }
  };

  const handleSaveEvent = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!isSystemAdmin) {
      setMessage("Only system admins can manage events.");
      return;
    }

    if (!eventForm.title.trim()) {
      setMessage("Event title is required.");
      return;
    }

    if (!eventForm.date) {
      setMessage("Event date is required.");
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        eventTitle: eventForm.title,
        description: eventForm.description,
        eventCategory: eventForm.category,
        organisingClubName: eventForm.club,
        venue: eventForm.venue,
        eventDate: eventForm.date,
        startTime: eventForm.time,
        eventPoster: eventForm.imageUrl,
        status: eventForm.status,
      };

      if (selectedEventId) {
        await API.put(`/events/${selectedEventId}`, payload);
        setMessage("Event updated successfully");
      } else {
        await API.post("/events", payload);
        setMessage("Event created successfully");
      }

      resetEventForm();
      setShowEventModal(false);
      await loadAdminData();
    } catch (error) {
      setMessage(error?.response?.data?.message || "Failed to save event");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!isSystemAdmin) {
      setMessage("Only system admins can delete events.");
      return;
    }

    const ok = window.confirm("Delete this event permanently?");
    if (!ok) return;

    try {
      await API.delete(`/events/${eventId}`);
      setMessage("Event deleted successfully");
      await loadAdminData();
    } catch (error) {
      setMessage(error?.response?.data?.message || "Failed to delete event");
    }
  };

  const openClubWorkspace = (club) => {
    navigate(`/clubs/${club._id}`);
  };

  const openClubManage = (club) => {
    navigate(`/clubs/${club._id}/manage`);
  };

  const openAnalysisPage = () => {
    navigate("/analysis");
  };

  const openNewsPage = () => {
    navigate("/club-news");
  };

  const openUploadProjectPage = () => {
    navigate("/upload-project");
  };

  const openManageEventsPage = () => {
    navigate("/manage-events");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userInfo");
    sessionStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-1 pb-8">
      {/* TOP HEADER */}
      <div className="rounded-[32px] border border-[#0a1e8c]/10 bg-gradient-to-r from-[#f5f8ff] via-white to-[#fff4ec] p-7 shadow-[0_18px_50px_rgba(10,30,140,0.08)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#f37021]">
              Admin Console
            </p>

            <h1 className="mt-2 text-3xl font-black text-[#0a1e8c]">
              {isSystemAdmin
                ? "System Administration Panel"
                : "Club Administration Panel"}
            </h1>

            <p className="mt-2 text-sm text-[#4a5b86] max-w-3xl">
              {isSystemAdmin
                ? "Manage platform users, clubs, events, badges, news, and projects from one place."
                : "As a club admin, you can open and manage clubs from this panel."}
            </p>

            {me && (
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[#4a5b86]">
                <span>
                  Logged in as:{" "}
                  <span className="font-bold text-[#0a1e8c]">{me.fullName}</span>
                </span>
                <span className="inline-flex items-center rounded-full bg-[#fff4ec] px-3 py-1 font-bold text-[#f37021] ring-1 ring-[#f37021]/20">
                  {me.role}
                </span>
              </div>
            )}

            {message && (
              <div className="mt-4 inline-flex rounded-2xl border border-[#0a1e8c]/15 bg-[#f5f8ff] px-4 py-2 text-sm font-semibold text-[#0a1e8c]">
                {message}
              </div>
            )}
          </div>

          <div className="flex justify-start lg:justify-end">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#f37021] text-white text-sm font-bold shadow-[0_12px_24px_rgba(243,112,33,0.22)] hover:bg-[#d85f1b] transition-all duration-300 hover:-translate-y-0.5"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* TAB BAR */}
      <div className="rounded-[28px] border border-[#0a1e8c]/10 bg-white p-2 shadow-[0_8px_24px_rgba(10,30,140,0.04)] backdrop-blur-sm">
        <div className="flex flex-wrap gap-3">
          {isSystemAdmin && (
            <button
              onClick={() => setActiveTab("overview")}
              className={tabButtonClass(activeTab === "overview")}
            >
              <Layers3 size={16} />
              Overview
            </button>
          )}

          {canManageUsers && (
            <button
              onClick={() => setActiveTab("users")}
              className={tabButtonClass(activeTab === "users")}
            >
              <Users size={16} />
              Users
            </button>
          )}

          {canSeeClubTab && (
            <button
              onClick={() => setActiveTab("clubs")}
              className={tabButtonClass(activeTab === "clubs")}
            >
              <Building2 size={16} />
              Clubs
            </button>
          )}

          {canManageEvents && (
            <button
              onClick={() => setActiveTab("events")}
              className={tabButtonClass(activeTab === "events")}
            >
              <CalendarDays size={16} />
              Events
            </button>
          )}

          {canManageNews && (
            <button
              onClick={() => navigate("/manage-news")}
              className={tabButtonClass(false)}
            >
              <Newspaper size={16} />
              News
            </button>
          )}

          {canManageProjects && (
            <button onClick={openUploadProjectPage} className={tabButtonClass(false)}>
              <FolderOpen size={16} />
              Projects
            </button>
          )}

          {canManageBadges && (
            <button
              onClick={() => setActiveTab("badges")}
              className={tabButtonClass(activeTab === "badges")}
            >
              <BadgeCheck size={16} />
              Badges
            </button>
          )}
        </div>
      </div>

      {activeTab === "overview" && isSystemAdmin && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <StatCard
              title="Total Students"
              value={totalStudents}
              icon={GraduationCap}
              tone="bg-[#f5f8ff] text-[#0a1e8c]"
            />
            <StatCard
              title="Active Users"
              value={activeUsers}
              icon={UserCheck}
              tone="bg-[#fff4ec] text-[#f37021]"
            />
            <StatCard
              title="Total Events"
              value={totalEvents}
              icon={CalendarDays}
              tone="bg-[#eef3ff] text-[#0c249f]"
            />
            <StatCard
              title="Projects"
              value={totalProjects}
              icon={FolderOpen}
              tone="bg-[#fff4ec] text-[#f37021]"
            />
          </div>

          <div className="rounded-[28px] border border-[#0a1e8c]/10 bg-white p-6 shadow-[0_14px_40px_rgba(10,30,140,0.07)] backdrop-blur-sm">
            <h2 className="text-xl font-black text-[#0a1e8c]">System Summary</h2>
            <p className="mt-2 text-sm text-[#4a5b86]">
              Manage users, clubs, events, news, projects, and badges from this panel.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => setActiveTab("clubs")}
                className="px-4 py-2.5 rounded-2xl bg-[#0a1e8c] text-white text-sm font-bold shadow-md hover:bg-[#08166f] transition"
              >
                Open Club Management
              </button>

              <button
                onClick={() => setActiveTab("users")}
                className="px-4 py-2.5 rounded-2xl border border-[#0a1e8c]/15 bg-white text-[#0a1e8c] text-sm font-bold shadow-sm hover:bg-[#f5f8ff] hover:-translate-y-0.5 transition"
              >
                Open User Management
              </button>

              <button
                onClick={() => setActiveTab("events")}
                className="px-4 py-2.5 rounded-2xl border border-[#0a1e8c]/15 bg-white text-[#0a1e8c] text-sm font-bold shadow-sm hover:bg-[#f5f8ff] hover:-translate-y-0.5 transition"
              >
                Open Event Management
              </button>

              <button
                onClick={() => navigate("/manage-news")}
                className="px-4 py-2.5 rounded-2xl border border-[#0a1e8c]/15 bg-white text-[#0a1e8c] text-sm font-bold shadow-sm hover:bg-[#f5f8ff] hover:-translate-y-0.5 transition"
              >
                Open News Management
              </button>

              <button
                onClick={openUploadProjectPage}
                className="px-4 py-2.5 rounded-2xl border border-[#0a1e8c]/15 bg-white text-[#0a1e8c] text-sm font-bold shadow-sm hover:bg-[#f5f8ff] hover:-translate-y-0.5 transition"
              >
                Open Project Management
              </button>

              <button
                onClick={openManageEventsPage}
                className="px-4 py-2.5 rounded-2xl border border-[#f37021]/20 bg-[#fff4ec] text-[#f37021] text-sm font-bold shadow-sm hover:bg-[#ffe8d8] hover:-translate-y-0.5 transition"
              >
                Go to ManageEvents
              </button>

              <button
                onClick={openNewsPage}
                className="px-4 py-2.5 rounded-2xl border border-[#0a1e8c]/15 bg-[#f5f8ff] text-[#0a1e8c] text-sm font-bold shadow-sm hover:bg-[#e9efff] hover:-translate-y-0.5 transition"
              >
                Go to NewsPage
              </button>

              <button
                onClick={openUploadProjectPage}
                className="px-4 py-2.5 rounded-2xl border border-[#f37021]/20 bg-[#fff4ec] text-[#f37021] text-sm font-bold shadow-sm hover:bg-[#ffe8d8] hover:-translate-y-0.5 transition"
              >
                Go to UploadProject
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === "users" && canManageUsers && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <StatCard
              title="Total Students"
              value={totalStudents}
              icon={GraduationCap}
              tone="bg-[#f5f8ff] text-[#0a1e8c]"
            />
            <StatCard
              title="Active Users"
              value={activeUsers}
              icon={UserCheck}
              tone="bg-[#fff4ec] text-[#f37021]"
            />
            <StatCard
              title="Mentors"
              value={activeMentors}
              icon={Users}
              tone="bg-[#eef3ff] text-[#0c249f]"
            />
            <StatCard
              title="Inactive Users"
              value={inactiveUsers}
              icon={ShieldAlert}
              tone="bg-red-50 text-red-600"
            />
          </div>

          <div className="rounded-[28px] border border-[#0a1e8c]/10 bg-white p-6 shadow-[0_14px_40px_rgba(10,30,140,0.07)] backdrop-blur-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
              <h2 className="text-xl font-black text-[#0a1e8c]">Manage Users</h2>

              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => {
                    resetUserForm();
                    setShowAddUserModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0a1e8c] text-white text-sm font-bold shadow-md hover:bg-[#08166f] transition"
                >
                  <UserPlus size={16} /> Add New User
                </button>

                <button
                  onClick={() => setShowBadgeModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#f37021] text-white text-sm font-bold shadow-md hover:bg-[#d85f1b] transition"
                >
                  <BadgeCheck size={16} /> Create Badge
                </button>
              </div>

              <div className="relative w-full lg:w-96">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7bb5]"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, ID, faculty..."
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-2xl border border-[#0a1e8c]/15 bg-white/90 shadow-sm focus:outline-none focus:ring-4 focus:ring-[#0a1e8c]/10 text-[#0a1e8c]"
                />
              </div>
            </div>

            {isLoading ? (
              <p className="text-sm text-[#4a5b86]">Loading users...</p>
            ) : !hasAdminAccess ? (
              <p className="text-sm text-[#4a5b86]">
                User management is unavailable for your current role.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[#0a1e8c]/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f5f8ff] border-b border-[#0a1e8c]/10 text-left text-[#4a5b86]">
                      <th className="py-3 pr-4 pl-4">Student ID</th>
                      <th className="py-3 pr-4">Name</th>
                      <th className="py-3 pr-4">Email</th>
                      <th className="py-3 pr-4">Faculty</th>
                      <th className="py-3 pr-4">Year</th>
                      <th className="py-3 pr-4">Role</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr
                        key={student._id}
                        className="border-b border-[#0a1e8c]/10 hover:bg-[#f5f8ff]/60 transition"
                      >
                        <td className="py-3 pr-4 pl-4 font-semibold text-[#0a1e8c]">
                          {student.studentId}
                        </td>
                        <td className="py-3 pr-4 text-[#0a1e8c]">{student.fullName}</td>
                        <td className="py-3 pr-4 text-[#4a5b86]">{student.email}</td>
                        <td className="py-3 pr-4 text-[#4a5b86]">
                          {student.faculty || student.profile?.faculty || "-"}
                        </td>
                        <td className="py-3 pr-4 text-[#4a5b86]">
                          {student.yearOfStudy || student.profile?.yearOfStudy || "-"}
                        </td>
                        <td className="py-3 pr-4 text-[#4a5b86]">{student.role}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                              student.isActive
                                ? "bg-[#fff4ec] text-[#f37021] border border-[#f37021]/20"
                                : "bg-[#f5f8ff] text-[#0a1e8c]"
                            }`}
                          >
                            {student.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <div className="inline-flex gap-2 flex-wrap justify-end">
                            <button
                              onClick={() => openEditModal(student)}
                              className="px-3 py-1.5 rounded-xl border border-[#0a1e8c]/15 bg-white text-[#0a1e8c] hover:bg-[#f5f8ff] hover:-translate-y-0.5 transition text-xs font-semibold shadow-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => openRewardModal(student)}
                              className="px-3 py-1.5 rounded-lg border border-[#f37021]/20 text-[#f37021] hover:bg-[#fff4ec] text-xs font-semibold"
                            >
                              Reward
                            </button>
                            <button
                              onClick={() => handleDeleteUser(student._id)}
                              className="px-3 py-1.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition text-xs font-semibold"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!filteredStudents.length && (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-[#4a5b86]">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "clubs" && canSeeClubTab && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <StatCard
              title={isSystemAdmin ? "Total Clubs" : "Available Clubs"}
              value={totalClubs}
              icon={Building2}
              tone="bg-[#f5f8ff] text-[#0a1e8c]"
            />
            <StatCard
              title="Active Clubs"
              value={activeClubs}
              icon={FolderCog}
              tone="bg-[#fff4ec] text-[#f37021]"
            />
            <StatCard
              title="Pending Clubs"
              value={pendingClubs}
              icon={ShieldAlert}
              tone="bg-[#eef3ff] text-[#0c249f]"
            />
            <StatCard
              title="Rejected Clubs"
              value={rejectedClubs}
              icon={X}
              tone="bg-red-50 text-red-600"
            />
          </div>

          <div className="rounded-[28px] border border-[#0a1e8c]/10 bg-white p-6 shadow-[0_14px_40px_rgba(10,30,140,0.07)] backdrop-blur-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
              <h2 className="text-xl font-black text-[#0a1e8c]">
                {isSystemAdmin ? "Manage Clubs" : "Club Workspaces"}
              </h2>

              <div className="flex gap-3">
                {canCreateClub && (
                  <button
                    onClick={() => {
                      resetClubForm();
                      setShowClubModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0a1e8c] text-white text-sm font-bold shadow-md hover:bg-[#08166f] transition"
                  >
                    <Building2 size={16} /> Create Club
                  </button>
                )}
              </div>

              <div className="relative w-full lg:w-96">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7bb5]"
                />
                <input
                  value={clubSearch}
                  onChange={(e) => setClubSearch(e.target.value)}
                  placeholder="Search clubs by name, category, status..."
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-2xl border border-[#0a1e8c]/15 bg-white/90 shadow-sm focus:outline-none focus:ring-4 focus:ring-[#0a1e8c]/10 text-[#0a1e8c]"
                />
              </div>
            </div>

            {!isSystemAdmin && (
              <div className="mb-5 rounded-[22px] border border-[#f37021]/20 bg-[#fff4ec] px-4 py-3 text-sm text-[#f37021] shadow-sm">
                You can open and manage clubs from this panel, but you cannot create,
                approve, reject, or delete clubs.
              </div>
            )}

            {isLoading ? (
              <p className="text-sm text-[#4a5b86]">Loading clubs...</p>
            ) : !hasClubAccess ? (
              <p className="text-sm text-[#4a5b86]">
                Club management data is unavailable for your current role.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[#0a1e8c]/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f5f8ff] border-b border-[#0a1e8c]/10 text-left text-[#4a5b86]">
                      <th className="py-3 pr-4 pl-4">Name</th>
                      <th className="py-3 pr-4">Category</th>
                      <th className="py-3 pr-4">President</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3 pr-4">Members</th>
                      <th className="py-3 pr-4">Constitution</th>
                      <th className="py-3 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClubs.map((club) => (
                      <tr
                        key={club._id}
                        className="border-b border-[#0a1e8c]/10 hover:bg-[#f5f8ff]/60 transition"
                      >
                        <td className="py-3 pr-4 pl-4">
                          <div>
                            <p className="font-semibold text-[#0a1e8c]">{club.name}</p>
                            <p className="text-xs text-[#4a5b86] line-clamp-1">
                              {club.description}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-[#4a5b86]">{club.category}</td>
                        <td className="py-3 pr-4 text-[#4a5b86]">
                          {club.president?.name || "-"}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border border-[#0a1e8c]/15 bg-[#f5f8ff] text-[#0a1e8c]">
                            {club.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-[#4a5b86]">
                          {club.members?.length || 0}
                        </td>
                        <td className="py-3 pr-4 text-[#4a5b86]">
                          {club.constitution?.fileName ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#f37021] bg-[#fff4ec] border border-[#f37021]/20 px-2 py-1 rounded-full">
                              <FileText size={12} />
                              {club.constitution.fileName}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <div className="inline-flex flex-wrap gap-2 justify-end">
                            <button
                              onClick={() => openClubWorkspace(club)}
                              className="px-3 py-1.5 rounded-xl border border-[#0a1e8c]/15 bg-white text-[#0a1e8c] hover:bg-[#f5f8ff] hover:-translate-y-0.5 transition text-xs font-semibold shadow-sm"
                            >
                              Open
                            </button>

                            <button
                              onClick={() => openClubManage(club)}
                              className="px-3 py-1.5 rounded-lg border border-[#f37021]/20 text-[#f37021] hover:bg-[#fff4ec] text-xs font-semibold"
                            >
                              Manage
                            </button>

                            {canApproveRejectClub && club.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleClubStatus(club._id, "active")}
                                  className="px-3 py-1.5 rounded-lg border border-[#0a1e8c]/20 text-[#0a1e8c] hover:bg-[#f5f8ff] text-xs font-semibold"
                                >
                                  Approve
                                </button>

                                <button
                                  onClick={() => handleClubStatus(club._id, "rejected")}
                                  className="px-3 py-1.5 rounded-lg border border-[#f37021]/20 text-[#f37021] hover:bg-[#fff4ec] text-xs font-semibold"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {canDeleteClub && (
                              <button
                                onClick={() => handleDeleteClub(club._id)}
                                className="px-3 py-1.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition text-xs font-semibold"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!filteredClubs.length && (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-[#4a5b86]">
                          No clubs found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "events" && canManageEvents && (
        <>
          {/* UPDATED: 3 stat cards only - Total Registrations card removed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            <StatCard
              title="Total Events"
              value={totalEvents}
              icon={CalendarDays}
              tone="bg-[#f5f8ff] text-[#0a1e8c]"
            />
            <StatCard
              title="Upcoming Events"
              value={upcomingEvents}
              icon={CheckCircle2}
              tone="bg-[#fff4ec] text-[#f37021]"
            />
            <StatCard
              title="Past Events"
              value={pastEvents}
              icon={Clock3}
              tone="bg-[#eef3ff] text-[#0c249f]"
            />
          </div>

          <div className="rounded-[28px] border border-[#0a1e8c]/10 bg-white p-6 shadow-[0_14px_40px_rgba(10,30,140,0.07)] backdrop-blur-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => navigate("/create-event")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0a1e8c] text-white text-sm font-bold shadow-md hover:bg-[#08166f] transition"
                >
                  <PlusCircle size={16} /> Create New Event
                </button>

                <button
                  onClick={openManageEventsPage}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#f37021] text-white text-sm font-bold shadow-md hover:bg-[#d85f1b] transition"
                >
                  <CalendarDays size={16} /> Manage Events
                </button>

                <button
                  onClick={() => navigate("/event-registration")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-[#0a1e8c]/15 bg-[#f5f8ff] text-[#0a1e8c] text-sm font-bold shadow-sm hover:bg-[#e9efff] transition"
                >
                  <Users size={16} /> View Registrations
                </button>
              </div>

              <div className="relative w-full lg:w-96">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7bb5]"
                />
                <input
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  placeholder="Search by title, club, venue, status..."
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-2xl border border-[#0a1e8c]/15 bg-white/90 shadow-sm focus:outline-none focus:ring-4 focus:ring-[#0a1e8c]/10 text-[#0a1e8c]"
                />
              </div>
            </div>

            {isLoading ? (
              <p className="text-sm text-[#4a5b86]">Loading events...</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[#0a1e8c]/10">
                <table className="w-full text-sm">
                  <thead>
                    {/* UPDATED: Registrations column removed from header */}
                    <tr className="bg-[#f5f8ff] border-b border-[#0a1e8c]/10 text-left text-[#4a5b86]">
                      <th className="py-3 pr-4 pl-4">Event</th>
                      <th className="py-3 pr-4">Category</th>
                      <th className="py-3 pr-4">Venue</th>
                      <th className="py-3 pr-4">Date</th>
                      <th className="py-3 pr-4">Time</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredEvents.map((item) => {
                      const dateValue = getEventDateValue(item);

                      return (
                        <tr
                          key={item._id}
                          className="border-b border-[#0a1e8c]/10 hover:bg-[#f5f8ff]/60 transition"
                        >
                          <td className="py-3 pr-4 pl-4">
                            <div>
                              <p className="font-semibold text-[#0a1e8c]">
                                {item.title || "Untitled Event"}
                              </p>
                              <p className="text-xs text-[#4a5b86] line-clamp-1">
                                {item.description || "No description available"}
                              </p>
                            </div>
                          </td>

                          <td className="py-3 pr-4 text-[#4a5b86]">
                            {item.category || "-"}
                          </td>

                          <td className="py-3 pr-4 text-[#4a5b86]">
                            {item.venue || "-"}
                          </td>

                          <td className="py-3 pr-4 text-[#4a5b86]">
                            {formatEventDate(dateValue)}
                          </td>

                          <td className="py-3 pr-4 text-[#4a5b86]">
                            {formatEventTime(item, dateValue)}
                          </td>

                          <td className="py-3 pr-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getEventStatusBadgeClass(
                                item.status
                              )}`}
                            >
                              {item.status || "upcoming"}
                            </span>
                          </td>

                          {/* UPDATED: Registrations column data removed */}
                          <td className="py-3 pr-4 text-right">
                            <div className="inline-flex gap-2 flex-wrap justify-end">
                              <button
                                onClick={() => openEditEventModal(item)}
                                className="px-3 py-1.5 rounded-xl border border-[#0a1e8c]/15 bg-white text-[#0a1e8c] hover:bg-[#f5f8ff] hover:-translate-y-0.5 transition text-xs font-semibold shadow-sm"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => navigate(`/event/${item._id}`)}
                                className="px-3 py-1.5 rounded-lg border border-[#f37021]/20 text-[#f37021] hover:bg-[#fff4ec] text-xs font-semibold"
                              >
                                View
                              </button>

                              <button
                                onClick={() => handleDeleteEvent(item._id)}
                                className="px-3 py-1.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition text-xs font-semibold"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {!filteredEvents.length && (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-[#4a5b86]">
                          No events found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "badges" && canManageBadges && (
        <div className="rounded-[28px] border border-[#0a1e8c]/10 bg-white p-6 shadow-[0_14px_40px_rgba(10,30,140,0.07)] backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-[#0a1e8c]">Badge Management</h2>
              <p className="mt-1 text-sm text-[#4a5b86]">
                Create and issue badges for user recognition.
              </p>
            </div>

            <button
              onClick={() => setShowBadgeModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#f37021] text-white text-sm font-bold shadow-md hover:bg-[#d85f1b] transition"
            >
              <BadgeCheck size={16} /> Create Badge
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {badges.map((badge) => (
              <div
                key={badge._id}
                className="rounded-2xl border border-[#0a1e8c]/10 p-4 bg-[#f5f8ff]"
              >
                <p className="font-bold text-[#0a1e8c]">{badge.title}</p>
                <p className="text-sm text-[#4a5b86] mt-2">{badge.description}</p>
              </div>
            ))}
            {!badges.length && (
              <p className="text-sm text-[#4a5b86]">No badges created yet.</p>
            )}
          </div>
        </div>
      )}

      {showAddUserModal && (
        <Modal
          title="Add New User"
          icon={UserPlus}
          onClose={() => setShowAddUserModal(false)}
        >
          <form onSubmit={handleSaveUser} className="space-y-3">
            <input
              value={form.fullName}
              onChange={(e) => handleUserInputChange("fullName", e.target.value)}
              placeholder="Full Name"
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
              required
            />
            <input
              value={form.email}
              onChange={(e) => handleUserInputChange("email", e.target.value)}
              placeholder="Email"
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
              required
            />
            <input
              type="password"
              value={form.password}
              onChange={(e) => handleUserInputChange("password", e.target.value)}
              placeholder="Password"
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
              required
            />
            <input
              value={form.studentId}
              onChange={(e) => handleUserInputChange("studentId", e.target.value)}
              placeholder="Student ID"
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
              required
            />
            <input
              value={form.faculty}
              onChange={(e) => handleUserInputChange("faculty", e.target.value)}
              placeholder="Faculty"
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
            />
            <input
              value={form.yearOfStudy}
              onChange={(e) => handleUserInputChange("yearOfStudy", e.target.value)}
              placeholder="Year Of Study"
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
            />
            <input
              value={form.degreeProgram}
              onChange={(e) => handleUserInputChange("degreeProgram", e.target.value)}
              placeholder="Degree Program"
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
            />
            <textarea
              value={form.bio}
              onChange={(e) => handleUserInputChange("bio", e.target.value)}
              placeholder="Bio"
              rows={3}
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
            />
            <select
              value={form.role}
              onChange={(e) => handleUserInputChange("role", e.target.value)}
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
            >
              {USER_ROLE_OPTIONS.map((roleOption) => (
                <option key={roleOption} value={roleOption}>
                  {roleOption}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 text-sm text-[#0a1e8c]">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => handleUserInputChange("isActive", e.target.checked)}
                />
                Active
              </label>

              <label className="flex items-center gap-2 text-sm text-[#0a1e8c]">
                <input
                  type="checkbox"
                  checked={form.isEmailVerified}
                  onChange={(e) =>
                    handleUserInputChange("isEmailVerified", e.target.checked)
                  }
                />
                Email Verified
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="px-4 py-2 rounded-xl border border-[#0a1e8c]/15 text-[#0a1e8c]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-[#0a1e8c] text-white font-bold"
              >
                {isSaving ? "Saving..." : "Create User"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showEditUserModal && (
        <Modal
          title="Edit User"
          icon={Pencil}
          onClose={() => setShowEditUserModal(false)}
        >
          <form onSubmit={handleSaveUser} className="space-y-3">
            <input
              value={form.fullName}
              onChange={(e) => handleUserInputChange("fullName", e.target.value)}
              placeholder="Full Name"
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
              required
            />
            <input
              value={form.email}
              onChange={(e) => handleUserInputChange("email", e.target.value)}
              placeholder="Email"
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
              required
            />
            <input
              type="password"
              value={form.password}
              onChange={(e) => handleUserInputChange("password", e.target.value)}
              placeholder="New Password (optional)"
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
            />
            <input
              value={form.studentId}
              onChange={(e) => handleUserInputChange("studentId", e.target.value)}
              placeholder="Student ID"
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
            />
            <input
              value={form.faculty}
              onChange={(e) => handleUserInputChange("faculty", e.target.value)}
              placeholder="Faculty"
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
            />
            <input
              value={form.yearOfStudy}
              onChange={(e) => handleUserInputChange("yearOfStudy", e.target.value)}
              placeholder="Year Of Study"
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
            />
            <input
              value={form.degreeProgram}
              onChange={(e) => handleUserInputChange("degreeProgram", e.target.value)}
              placeholder="Degree Program"
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
            />
            <textarea
              value={form.bio}
              onChange={(e) => handleUserInputChange("bio", e.target.value)}
              placeholder="Bio"
              rows={3}
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
            />
            <select
              value={form.role}
              onChange={(e) => handleUserInputChange("role", e.target.value)}
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
            >
              {USER_ROLE_OPTIONS.map((roleOption) => (
                <option key={roleOption} value={roleOption}>
                  {roleOption}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 text-sm text-[#0a1e8c]">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => handleUserInputChange("isActive", e.target.checked)}
                />
                Active
              </label>

              <label className="flex items-center gap-2 text-sm text-[#0a1e8c]">
                <input
                  type="checkbox"
                  checked={form.isEmailVerified}
                  onChange={(e) =>
                    handleUserInputChange("isEmailVerified", e.target.checked)
                  }
                />
                Email Verified
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowEditUserModal(false)}
                className="px-4 py-2 rounded-xl border border-[#0a1e8c]/15 text-[#0a1e8c]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-[#0a1e8c] text-white font-bold"
              >
                {isSaving ? "Saving..." : "Update User"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showRewardModal && (
        <Modal
          title="Assign Reward"
          icon={BadgeCheck}
          onClose={() => setShowRewardModal(false)}
        >
          <form onSubmit={handleAssignReward} className="space-y-3">
            <select
              value={rewardForm.badgeId}
              onChange={(e) =>
                setRewardForm((prev) => ({ ...prev, badgeId: e.target.value }))
              }
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
            >
              <option value="">Select Badge</option>
              {badges.map((badge) => (
                <option key={badge._id} value={badge._id}>
                  {badge.title}
                </option>
              ))}
            </select>

            <input
              value={rewardForm.certificateTitle}
              onChange={(e) =>
                setRewardForm((prev) => ({
                  ...prev,
                  certificateTitle: e.target.value,
                }))
              }
              placeholder="Certificate Title"
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
            />

            <input
              value={rewardForm.issuer}
              onChange={(e) =>
                setRewardForm((prev) => ({ ...prev, issuer: e.target.value }))
              }
              placeholder="Issuer"
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
            />

            <input
              value={rewardForm.verificationUrl}
              onChange={(e) =>
                setRewardForm((prev) => ({
                  ...prev,
                  verificationUrl: e.target.value,
                }))
              }
              placeholder="Verification URL"
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
            />

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCertificateImageFile(e.target.files?.[0] || null)}
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
            />

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowRewardModal(false)}
                className="px-4 py-2 rounded-xl border border-[#0a1e8c]/15 text-[#0a1e8c]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#f37021] text-white font-bold"
              >
                Assign Reward
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showBadgeModal && (
        <Modal
          title="Create Badge"
          icon={BadgeCheck}
          onClose={() => setShowBadgeModal(false)}
        >
          <form onSubmit={handleCreateBadge} className="space-y-3">
            <input
              value={badgeForm.title}
              onChange={(e) =>
                setBadgeForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Badge Title"
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
              required
            />
            <textarea
              value={badgeForm.description}
              onChange={(e) =>
                setBadgeForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Description"
              rows={3}
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
            />
            <textarea
              value={badgeForm.criteria}
              onChange={(e) =>
                setBadgeForm((prev) => ({ ...prev, criteria: e.target.value }))
              }
              placeholder="Criteria"
              rows={3}
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
            />
            <input
              value={badgeForm.icon}
              onChange={(e) =>
                setBadgeForm((prev) => ({ ...prev, icon: e.target.value }))
              }
              placeholder="Icon name / URL"
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
            />

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowBadgeModal(false)}
                className="px-4 py-2 rounded-xl border border-[#0a1e8c]/15 text-[#0a1e8c]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#f37021] text-white font-bold"
              >
                Create Badge
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showClubModal && (
        <Modal
          title="Create Club"
          icon={Building2}
          onClose={() => setShowClubModal(false)}
        >
          <form onSubmit={handleCreateClub} className="space-y-3">
            <input
              value={clubForm.name}
              onChange={(e) => handleClubInputChange("name", e.target.value)}
              placeholder="Club Name"
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
              required
            />
            <textarea
              value={clubForm.description}
              onChange={(e) => handleClubInputChange("description", e.target.value)}
              placeholder="Club Description"
              rows={3}
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
              required
            />
            <select
              value={clubForm.category}
              onChange={(e) => handleClubInputChange("category", e.target.value)}
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <input
              value={clubForm.presidentName}
              onChange={(e) => handleClubInputChange("presidentName", e.target.value)}
              placeholder="President Name"
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
              required
            />
            <input
              value={clubForm.presidentEmail}
              onChange={(e) => handleClubInputChange("presidentEmail", e.target.value)}
              placeholder="President Email"
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
              required
            />
            {presidentEmailError && (
              <p className="text-xs text-red-600">{presidentEmailError}</p>
            )}

            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setConstitutionFile(e.target.files?.[0] || null)}
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
            />
            {constitutionFileError && (
              <p className="text-xs text-red-600">{constitutionFileError}</p>
            )}

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowClubModal(false)}
                className="px-4 py-2 rounded-xl border border-[#0a1e8c]/15 text-[#0a1e8c]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-[#0a1e8c] text-white font-bold"
              >
                {isSaving ? "Saving..." : "Create Club"}
              </button>
            </div>
          </form>
        </Modal>
      )}

{showNewsModal && (
  <Modal title="News Form" icon={Newspaper} onClose={() => setShowNewsModal(false)}>
    <form onSubmit={handleSaveNews} className="space-y-3">
      <input
        value={newsForm.title}
        onChange={(e) => handleNewsInputChange("title", e.target.value)}
        placeholder="News Title"
        className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
        required
      />
      <input
        value={newsForm.summary}
        onChange={(e) => handleNewsInputChange("summary", e.target.value)}
        placeholder="Summary"
        className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
        required
      />
      <textarea
        value={newsForm.content}
        onChange={(e) => handleNewsInputChange("content", e.target.value)}
        placeholder="Content"
        rows={5}
        className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
        required
      />
      <select
        value={newsForm.category}
        onChange={(e) => handleNewsInputChange("category", e.target.value)}
        className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
      >
        {newsCategories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
      <input
        value={newsForm.author}
        onChange={(e) => handleNewsInputChange("author", e.target.value)}
        placeholder="Author"
        className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
      />
      <input
        value={newsForm.imageUrl}
        onChange={(e) => handleNewsInputChange("imageUrl", e.target.value)}
        placeholder="Image URL"
        className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
      />
      <label className="flex items-center gap-2 text-sm text-[#0a1e8c]">
        <input
          type="checkbox"
          checked={newsForm.isPublished}
          onChange={(e) =>
            handleNewsInputChange("isPublished", e.target.checked)
          }
        />
        Published
      </label>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowNewsModal(false)}
                className="px-4 py-2 rounded-xl border border-[#0a1e8c]/15 text-[#0a1e8c]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-[#f37021] text-white font-bold"
              >
                {isSaving ? "Saving..." : selectedNewsId ? "Update News" : "Create News"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showProjectModal && (
        <Modal
          title="Project Form"
          icon={FolderOpen}
          onClose={() => setShowProjectModal(false)}
        >
          <form onSubmit={handleSaveProject} className="space-y-3">
            <input
              value={projectForm.title}
              onChange={(e) => handleProjectInputChange("title", e.target.value)}
              placeholder="Project Title"
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
              required
            />
            <textarea
              value={projectForm.description}
              onChange={(e) =>
                handleProjectInputChange("description", e.target.value)
              }
              placeholder="Description"
              rows={4}
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
              required
            />
            <select
              value={projectForm.category}
              onChange={(e) => handleProjectInputChange("category", e.target.value)}
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
            >
              {projectCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <input
              value={projectForm.ownerName}
              onChange={(e) => handleProjectInputChange("ownerName", e.target.value)}
              placeholder="Owner Name"
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
            />
            <input
              value={projectForm.githubUrl}
              onChange={(e) => handleProjectInputChange("githubUrl", e.target.value)}
              placeholder="GitHub URL"
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
            />
            <input
              value={projectForm.liveUrl}
              onChange={(e) => handleProjectInputChange("liveUrl", e.target.value)}
              placeholder="Live URL"
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
            />
            <input
              value={projectForm.imageUrl}
              onChange={(e) => handleProjectInputChange("imageUrl", e.target.value)}
              placeholder="Image URL"
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
            />
            <select
              value={projectForm.status}
              onChange={(e) => handleProjectInputChange("status", e.target.value)}
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
            >
              <option value="published">published</option>
              <option value="draft">draft</option>
            </select>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowProjectModal(false)}
                className="px-4 py-2 rounded-xl border border-[#0a1e8c]/15 text-[#0a1e8c]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-[#f37021] text-white font-bold"
              >
                {isSaving
                  ? "Saving..."
                  : selectedProjectId
                  ? "Update Project"
                  : "Create Project"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showEventModal && (
        <Modal
          title="Event Form"
          icon={CalendarDays}
          onClose={() => setShowEventModal(false)}
        >
          <form onSubmit={handleSaveEvent} className="space-y-3">
            <input
              value={eventForm.title}
              onChange={(e) => handleEventInputChange("title", e.target.value)}
              placeholder="Event Title"
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
              required
            />
            <textarea
              value={eventForm.description}
              onChange={(e) => handleEventInputChange("description", e.target.value)}
              placeholder="Description"
              rows={4}
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
            />
            <select
              value={eventForm.category}
              onChange={(e) => handleEventInputChange("category", e.target.value)}
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
            >
              {eventCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={eventForm.club}
              onChange={(e) => handleEventInputChange("club", e.target.value)}
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
            >
              <option value="">Select Club</option>
              {clubs.map((club) => (
                <option key={club._id} value={club._id}>
                  {club.name}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={eventForm.venue}
                onChange={(e) => handleEventInputChange("venue", e.target.value)}
                placeholder="Venue"
                className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
              />
              <input
                type="date"
                value={eventForm.date}
                onChange={(e) => handleEventInputChange("date", e.target.value)}
                className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="time"
                value={eventForm.time}
                onChange={(e) => handleEventInputChange("time", e.target.value)}
                className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
              />
              <select
                value={eventForm.status}
                onChange={(e) => handleEventInputChange("status", e.target.value)}
                className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
              >
                {eventStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <input
              value={eventForm.imageUrl}
              onChange={(e) => handleEventInputChange("imageUrl", e.target.value)}
              placeholder="Image URL"
              className="w-full border border-[#0a1e8c]/15 rounded-lg px-3 py-2 text-sm text-[#0a1e8c]"
            />

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowEventModal(false)}
                className="px-4 py-2 rounded-xl border border-[#0a1e8c]/15 text-[#0a1e8c]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-[#f37021] text-white font-bold"
              >
                {isSaving
                  ? "Saving..."
                  : selectedEventId
                  ? "Update Event"
                  : "Create Event"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminPanel;