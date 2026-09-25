import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../components/Auth/axios";
import { getMyClubs } from "../services/clubService";
import {
  TrendingUp,
  Users,
  MessageSquare,
  Calendar,
  ArrowRight,
  Sparkles,
  BadgeCheck,
  Activity,
  BookOpen,
  Star,
  ArrowUpRight,
} from "lucide-react";

const StatCard = ({ title, value, icon: Icon, tone }) => {
  const tones = {
    blue: "bg-[#eef3ff] text-[#0a1e8c]",
    orange: "bg-[#fff4ec] text-[#f37021]",
    green: "bg-emerald-50 text-emerald-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };

  return (
  <div className="rounded-[24px] border border-white/70 bg-white/90 p-5 shadow-[0_14px_40px_rgba(10,30,140,0.08)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(10,30,140,0.12)]">
    <div className="flex items-center gap-4">
      <div className={`rounded-2xl p-3 ${tones[tone] || tones.blue}`}>
      <Icon size={20} />
      </div>
      <div>
        <p className="text-sm text-[#4a5b86]">{title}</p>
        <p className="text-2xl font-black tracking-tight text-[#0a1e8c]">{value}</p>
      </div>
    </div>
  </div>
  );
};

const ActivityItem = ({ icon: Icon, title, subtitle, accent = "blue" }) => {
  const accentMap = {
    blue: "bg-[#eef3ff] text-[#0a1e8c]",
    orange: "bg-[#fff4ec] text-[#f37021]",
    green: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#0a1e8c]/10 bg-[#f8fbff] p-3.5">
      <div className={`rounded-xl p-2.5 ${accentMap[accent] || accentMap.blue}`}>
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-[#0a1e8c]">{title}</p>
        <p className="text-xs leading-5 text-[#516072]">{subtitle}</p>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const [profile , setProfile] = useState(null);
  const [joinedClubs, setJoinedClubs] = useState([]);
  const navigate = useNavigate();
  const displayFaculty = profile?.faculty || user?.faculty || "Not set";
  const displayYear = profile?.yearOfStudy || user?.yearOfStudy || "Not set";

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const dashboardRes = await API.get("/student/dashboard");

        setUser(dashboardRes.data.user);
        setProfile(dashboardRes.data.profile);
        const clubsRes = await getMyClubs();

const myClubs = Array.isArray(clubsRes)
  ? clubsRes
  : Array.isArray(clubsRes?.data)
  ? clubsRes.data
  : [];

setJoinedClubs(myClubs);
      } catch (err) {
        localStorage.clear();
        navigate("/login");
      }
    };

    fetchDashboardData();
  }, [navigate]);

  if (!user) return <div className="p-10 text-gray-500">Loading dashboard...</div>;

 return (
  <div className="relative min-h-screen overflow-hidden bg-[#f6f8ff] p-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div className="absolute -left-12 top-8 h-72 w-72 rounded-full bg-[#0a1e8c]/10 blur-3xl" />
    <div className="absolute right-0 top-28 h-80 w-80 rounded-full bg-[#f37021]/10 blur-3xl" />
    <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />

    <div className="relative space-y-8">
      <div className="overflow-hidden rounded-[30px] border border-white/70 bg-white/90 shadow-[0_24px_64px_rgba(10,30,140,0.10)] backdrop-blur-xl">
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0a1e8c] via-[#1028a9] to-[#1d49d8] px-5 py-5 text-white sm:px-7 sm:py-7 lg:px-8 lg:py-8">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute left-8 top-8 h-24 w-24 rounded-full border border-white/40" />
            <div className="absolute right-10 top-10 h-16 w-16 rounded-full border border-white/30" />
            <div className="absolute bottom-4 right-24 h-28 w-28 rounded-full border border-white/20" />
            <div className="absolute left-1/2 top-1/2 h-px w-full -translate-x-1/2 bg-white/15" />
          </div>

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-white/85">
                <Sparkles size={13} />
                Student workspace
              </div>

              <h1 className="mt-4 max-w-2xl text-2xl font-black tracking-[-0.06em] sm:text-3xl lg:text-4xl">
                Welcome back, {user.fullName}
                <span className="ml-2 inline-block align-middle">👋</span>
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80 sm:text-base sm:leading-7">
                Faculty: {displayFaculty} • Year {displayYear} • Keep your profile, skills, clubs, and activity in one place.
              </p>

              {/* Dashboard hero action buttons removed as requested */}
            </div>

            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md rounded-[30px] border border-white/20 bg-white/10 p-5 backdrop-blur-md">
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#f37021]/30 blur-2xl" />
                <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-sky-300/20 blur-2xl" />

                <div className="relative grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[24px] bg-white/10 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">Profile Strength</p>
                    <div className="mt-3 flex items-end justify-between">
                      <p className="text-4xl font-black">86%</p>
                      <BadgeCheck className="text-emerald-300" size={28} />
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/15">
                      <div className="h-2 w-[86%] rounded-full bg-emerald-300" />
                    </div>
                  </div>

                  <div className="rounded-[24px] bg-white/10 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">Club Memberships</p>
                    <div className="mt-3 flex items-end justify-between">
                      <p className="text-4xl font-black">{joinedClubs.length}</p>
                      <Users className="text-white/80" size={28} />
                    </div>
                    <p className="mt-3 text-sm text-white/75">Active in campus communities</p>
                  </div>

                  {/* Quick insight card removed as requested */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Role" value={user.role} icon={Users} tone="indigo" />
        <StatCard title="Joined Clubs" value={joinedClubs.length} icon={Users} tone="blue" />
        <StatCard title="Account Status" value={user.isActive ? "Active" : "Inactive"} icon={TrendingUp} tone="green" />
        <StatCard title="Email Verified" value={user.isEmailVerified ? "Yes" : "No"} icon={MessageSquare} tone="orange" />
        <StatCard title="Member Since" value={new Date(user.createdAt).toLocaleDateString()} icon={Calendar} tone="blue" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_55px_rgba(10,30,140,0.08)] backdrop-blur-xl">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-[#eef3ff] p-3 text-[#0a1e8c]">
              <BookOpen size={18} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#0a1e8c]">Profile Summary</h3>
              <p className="text-sm text-[#516072]">Your account details and current campus status.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-[#0a1e8c]/10 bg-[#f8fbff] p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#4a5b86]">Email</p>
              <p className="mt-2 break-all text-base font-semibold text-[#0a1e8c]">{user.email}</p>
            </div>
            <div className="rounded-[24px] border border-[#0a1e8c]/10 bg-[#f8fbff] p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#4a5b86]">Student ID</p>
              <p className="mt-2 text-base font-semibold text-[#0a1e8c]">{user.studentId}</p>
            </div>
            <div className="rounded-[24px] border border-[#0a1e8c]/10 bg-[#f8fbff] p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#4a5b86]">Faculty</p>
              <p className="mt-2 text-base font-semibold text-[#0a1e8c]">{displayFaculty}</p>
            </div>
            <div className="rounded-[24px] border border-[#0a1e8c]/10 bg-[#f8fbff] p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#4a5b86]">Year</p>
              <p className="mt-2 text-base font-semibold text-[#0a1e8c]">{displayYear}</p>
            </div>
          </div>

          <Link
            to="/profile"
            className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#f37021] hover:underline"
          >
            View Full Profile <ArrowRight size={14} />
          </Link>
        </div>

        <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_55px_rgba(10,30,140,0.08)] backdrop-blur-xl">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-[#fff4ec] p-3 text-[#f37021]">
              <Star size={18} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#0a1e8c]">Recent Activity</h3>
              <p className="text-sm text-[#516072]">Your latest profile actions.</p>
            </div>
          </div>

          <div className="space-y-3">
            <ActivityItem icon={BadgeCheck} title="Completed profile setup" subtitle="Your basic account details are ready." accent="green" />
            <ActivityItem icon={Sparkles} title="Added new skill" subtitle="You can keep skills updated anytime." accent="orange" />
            <ActivityItem icon={Calendar} title="Joined campus workspace" subtitle="Stay active with your student community." accent="blue" />
          </div>
        </div>

        <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_55px_rgba(10,30,140,0.08)] backdrop-blur-xl">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-[#eef3ff] p-3 text-[#0a1e8c]">
              <Users size={18} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#0a1e8c]">Your Clubs</h3>
              <p className="text-sm text-[#516072]">A quick view of communities you belong to.</p>
            </div>
          </div>

          {joinedClubs.length > 0 ? (
            <div className="space-y-3">
              {joinedClubs.slice(0, 5).map((club) => (
                <div
                  key={club._id || club.id || club.name}
                  className="rounded-2xl border border-[#0a1e8c]/10 bg-[#f8fbff] px-4 py-3 text-sm font-semibold text-[#0a1e8c]"
                >
                  {club.name}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#0a1e8c]/15 bg-[#f8fbff] p-5 text-sm text-[#516072]">
              No joined clubs yet.
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
};

export default DashboardPage;
