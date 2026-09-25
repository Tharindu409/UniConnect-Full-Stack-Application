import React, { useEffect, useState } from "react";
// No image import needed for SVG graphic
import { Link, useNavigate } from "react-router-dom";
import { Award, Sparkles, CalendarDays, BadgeCheck } from "lucide-react";
import API from "../components/Auth/axios";

const ProfileViewPage = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMe = async () => {
      try {
     const res = await API.get("/student/dashboard");
        setUser(res.data.user);
        setProfile(res.data.profile);  
      } catch (err) {
        console.error(err);
        localStorage.clear();
        navigate("/login");
      }
    };
    fetchMe();
  }, [navigate]);

  if (!user || !profile) {
    return <div className="p-10 text-gray-500">Loading profile...</div>;
  }

  const skillRows = Array.isArray(profile.skillDetails) && profile.skillDetails.length > 0
    ? profile.skillDetails.map((detail) => {
        const skillObj = detail?.skill;
        return {
          id: skillObj?._id || detail?._id,
          name: skillObj?.name || "Unknown Skill",
          proficiency: detail?.proficiency || "Intermediate",
          category: skillObj?.category || "",
          relatedActivity: detail?.relatedActivity || "",
        };
      })
    : (profile.skills || []).map((skill) => ({
        id: skill?._id,
        name: skill?.name || "Unknown Skill",
        proficiency: "Intermediate",
        category: skill?.category || "",
        relatedActivity: "",
      }));

  const badges = Array.isArray(profile.badges) ? profile.badges : [];
  const latestBadge = badges[0] || null;

return (
  <div className="max-w-4xl mx-auto space-y-6 p-5 bg-[#ffffff] min-h-screen">

    {/* Banner with Avatar on Right */}
    <div className="relative bg-gradient-to-r from-[#0a1e8c] via-[#0c249f] to-[#08166f] h-32 rounded-3xl shadow-md border border-[#f37021]/30 flex items-center justify-between mb-2 px-8">
      <div />
      {/* Glossy SVG Avatar Graphic on right */}
      <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg border-4 border-[#0a1e8c] bg-white">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-20">
          <defs>
            <radialGradient id="avatarGloss" cx="60%" cy="30%" r="80%">
              <stop offset="0%" stop-color="#4fc3f7" />
              <stop offset="80%" stop-color="#1563e7" />
            </radialGradient>
            <linearGradient id="avatarShine" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop stop-color="#fff" stop-opacity="0.7" />
              <stop offset="1" stop-color="#fff" stop-opacity="0" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="48" fill="url(#avatarGloss)" />
          <ellipse cx="50" cy="40" rx="20" ry="20" fill="#fff" />
          <ellipse cx="50" cy="75" rx="28" ry="15" fill="#fff" fill-opacity="0.85" />
          <ellipse cx="70" cy="30" rx="12" ry="6" fill="url(#avatarShine)" />
        </svg>
      </div>
    </div>

    {/* Header */}
    <div className="flex justify-between items-end">
      <div>
        <h1 className="text-2xl font-black text-[#0a1e8c] sm:text-3xl">{user.fullName}</h1>
        <p className="mt-1 text-sm text-[#f37021] font-bold sm:text-base">{profile.faculty}</p>
      </div>

      <Link
        to="/profile/edit"
        className="bg-[#f37021] text-white px-3.5 py-2 rounded-lg text-sm font-bold hover:bg-[#d85f1b] transition sm:px-4"
      >
        Edit Profile
      </Link>
    </div>

    {/* Info Card */}
    <div className="bg-white p-6 rounded-xl shadow-sm border border-[#0a1e8c]/20 space-y-2">
      <p className="text-[#0a1e8c]"><b>Email:</b> {user.email}</p>
      <p className="text-[#0a1e8c]"><b>Student ID:</b> {user.studentId}</p>
      <p className="text-[#0a1e8c]"><b>Faculty:</b> {profile.faculty}</p>
      <p className="text-[#0a1e8c]"><b>Year:</b> {profile.yearOfStudy}</p>
      <p className="text-[#0a1e8c]"><b>Role:</b> {user.role}</p>
    </div>

    {/* Bio */}
    <div>
      <h2 className="text-lg font-black mb-3 text-[#0a1e8c]">Bio</h2>
      <p className="text-[#4a5b86]">{profile.bio || "No bio available"}</p>
    </div>

    {/* Skills */}
    <section className="bg-white p-6 rounded-xl shadow-sm border border-[#0a1e8c]/20">
      <h3 className="text-lg font-black mb-3 text-[#0a1e8c]">Skills</h3>

      {!skillRows || skillRows.length === 0 ? (
        <p className="text-[#6b7bb5] text-sm">No skills added yet</p>
      ) : (
        <div className="space-y-2">
          {skillRows.map((skill) => (
            <div
              key={skill.id}
              className="px-3 py-2 rounded-lg bg-[#f5f8ff] text-[#0a1e8c] text-sm border border-[#0a1e8c]/20"
            >
              <p className="font-bold">{skill.name}</p>
              <p className="text-xs text-[#f37021]">
                {skill.category ? `${skill.category.replace("_", " ")} • ` : ""}
                {skill.proficiency}
                {skill.relatedActivity ? ` • ${skill.relatedActivity}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}

      <Link
        to="/skills/add"
        className="inline-block mt-3 text-[#f37021] text-sm font-bold hover:text-[#d85f1b] transition"
      >
        + Add Skill
      </Link>
    </section>

    {/* Badges Section */}
    <section className="space-y-4">
      <div className="relative overflow-hidden bg-[#0a1e8c] text-white p-4.5 rounded-2xl border border-[#f37021]/30 shadow-lg sm:p-5">
        <div className="absolute -top-16 -right-12 w-36 h-36 rounded-full bg-[#f37021]/10 blur-2xl" />
        <div className="absolute -bottom-20 -left-10 w-44 h-44 rounded-full bg-[#f37021]/20 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <p className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] font-extrabold text-[#f37021]">
              <Sparkles size={12} />
              Achievement Showcase
            </p>

            <h3 className="mt-2 text-xl font-extrabold tracking-tight text-white sm:text-2xl">
              Badges
            </h3>

            <p className="text-xs text-white/80 mt-1 sm:text-sm">
              Your recognitions and accomplishments in UniConnect.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 border border-[#f37021]/30 px-3 py-2.5 min-w-[112px]">
              <p className="text-[9px] uppercase tracking-widest text-[#f37021] font-bold">
                Total Earned
              </p>
              <p className="text-xl font-black text-white sm:text-2xl">{badges.length}</p>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-[#f37021]/20 border border-[#f37021]/30 text-[#f37021] flex items-center justify-center sm:w-14 sm:h-14">
              <Award size={22} />
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
);
};

export default ProfileViewPage;
