import React, { useEffect, useMemo, useState } from "react";
import {
  Award,
  CalendarCheck2,
  Lightbulb,
  Minus,
  Plus,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

const initialFormState = {
  title: "",
  bio: "",
  skills: "",
  interests: "",
  expertiseLevel: "Intermediate",
  availability: "Available",
  maxMentees: 5,
};

const splitList = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const CreateMentorProfile = ({
  mode = "create",
  initialData = initialFormState,
  loading = false,
  onSubmit,
  onCancel,
}) => {
  const [form, setForm] = useState(initialData);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm({
      ...initialFormState,
      ...initialData,
    });
    setErrors({});
  }, [initialData]);

  const skillsPreview = useMemo(() => splitList(form.skills), [form.skills]);
  const interestsPreview = useMemo(
    () => splitList(form.interests),
    [form.interests]
  );

  const bioLength = String(form.bio || "").length;

  const validate = () => {
    const nextErrors = {};
    const trimmedTitle = String(form.title || "").trim();
    const trimmedBio = String(form.bio || "").trim();
    const parsedSkills = splitList(form.skills);
    const parsedInterests = splitList(form.interests);
    const parsedMaxMentees = Number(form.maxMentees);

    if (!trimmedTitle) {
      nextErrors.title = "Display name is required";
    } else if (trimmedTitle.length < 2) {
      nextErrors.title = "Display name must be at least 2 characters";
    } else if (trimmedTitle.length > 100) {
      nextErrors.title = "Display name must be less than 100 characters";
    }

    if (!trimmedBio) {
      nextErrors.bio = "Bio is required";
    } else if (trimmedBio.length < 20) {
      nextErrors.bio = "Bio should be at least 20 characters";
    } else if (trimmedBio.length > 500) {
      nextErrors.bio = "Bio cannot exceed 500 characters";
    }

    if (parsedSkills.length === 0) {
      nextErrors.skills = "Enter at least one skill";
    }

    if (parsedInterests.length === 0) {
      nextErrors.interests = "Enter at least one interest";
    }

    if (!Number.isFinite(parsedMaxMentees) || parsedMaxMentees < 1) {
      nextErrors.maxMentees = "Max mentees must be at least 1";
    } else if (parsedMaxMentees > 30) {
      nextErrors.maxMentees = "Max mentees cannot be more than 30";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleCapacityChange = (direction) => {
    setForm((prev) => {
      const currentValue = Number(prev.maxMentees) || 1;
      const nextValue =
        direction === "increase"
          ? Math.min(30, currentValue + 1)
          : Math.max(1, currentValue - 1);

      return {
        ...prev,
        maxMentees: nextValue,
      };
    });

    setErrors((prev) => ({
      ...prev,
      maxMentees: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    const payload = {
      title: String(form.title || "").trim(),
      bio: String(form.bio || "").trim(),
      skills: splitList(form.skills),
      interests: splitList(form.interests),
      expertiseLevel: form.expertiseLevel,
      availability: form.availability,
      maxMentees: Number(form.maxMentees),
    };

    await onSubmit?.(payload);
  };

  return (
    <div className="rounded-[28px] border border-[#0B1E8A]/10 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-[#0B1E8A]/10 bg-gradient-to-r from-[#0B1E8A] to-[#2439b7] px-6 py-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
              Mentor Profile
            </p>
            <h2 className="mt-2 text-2xl font-black">
              {mode === "edit" ? "Update Mentor Profile" : "Create Mentor Profile"}
            </h2>
            <p className="mt-2 text-sm text-white/80">
              Add your mentor details so students can find and connect with you.
            </p>
          </div>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 hover:bg-white/15 transition"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 lg:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-[#0B1E8A]">
                Display Name
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                maxLength={100}
                placeholder="Nadeesha Perera"
                className="w-full rounded-2xl border border-[#0B1E8A]/15 bg-white px-4 py-3 text-[#0B1E8A] outline-none focus:border-[#F36C21] focus:ring-4 focus:ring-[#F36C21]/15"
              />
              <p className="mt-2 text-xs text-slate-500">
                This is stored in the backend title field.
              </p>
              {errors.title && (
                <p className="mt-1 text-sm font-medium text-red-600">
                  {errors.title}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[#0B1E8A]">
                Bio
              </label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={5}
                maxLength={500}
                placeholder="Helps students overcome stage fear and build strong communication and leadership skills."
                className="w-full rounded-2xl border border-[#0B1E8A]/15 bg-white px-4 py-3 text-[#0B1E8A] outline-none focus:border-[#F36C21] focus:ring-4 focus:ring-[#F36C21]/15"
              />
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Keep it clear and short.
                </span>
                <span className="font-semibold text-slate-500">
                  {bioLength}/500
                </span>
              </div>
              {errors.bio && (
                <p className="mt-1 text-sm font-medium text-red-600">
                  {errors.bio}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[#0B1E8A]">
                Skills
              </label>
              <input
                type="text"
                name="skills"
                value={form.skills}
                onChange={handleChange}
                placeholder="Public Speaking, Leadership"
                className="w-full rounded-2xl border border-[#0B1E8A]/15 bg-white px-4 py-3 text-[#0B1E8A] outline-none focus:border-[#F36C21] focus:ring-4 focus:ring-[#F36C21]/15"
              />
              <p className="mt-2 text-xs text-slate-500">
                Separate each skill with a comma.
              </p>
              {errors.skills && (
                <p className="mt-1 text-sm font-medium text-red-600">
                  {errors.skills}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[#0B1E8A]">
                Interests
              </label>
              <input
                type="text"
                name="interests"
                value={form.interests}
                onChange={handleChange}
                placeholder="Personal Development, Team Building"
                className="w-full rounded-2xl border border-[#0B1E8A]/15 bg-white px-4 py-3 text-[#0B1E8A] outline-none focus:border-[#F36C21] focus:ring-4 focus:ring-[#F36C21]/15"
              />
              <p className="mt-2 text-xs text-slate-500">
                Separate each interest with a comma.
              </p>
              {errors.interests && (
                <p className="mt-1 text-sm font-medium text-red-600">
                  {errors.interests}
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-bold text-[#0B1E8A]">
                  Expertise Level
                </label>
                <select
                  name="expertiseLevel"
                  value={form.expertiseLevel}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-[#0B1E8A]/15 bg-white px-4 py-3 text-[#0B1E8A] outline-none focus:border-[#F36C21] focus:ring-4 focus:ring-[#F36C21]/15"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#0B1E8A]">
                  Availability
                </label>
                <select
                  name="availability"
                  value={form.availability}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-[#0B1E8A]/15 bg-white px-4 py-3 text-[#0B1E8A] outline-none focus:border-[#F36C21] focus:ring-4 focus:ring-[#F36C21]/15"
                >
                  <option value="Available">Available</option>
                  <option value="Busy">Busy</option>
                  <option value="Unavailable">Unavailable</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#0B1E8A]">
                  Max Mentees
                </label>
                <div className="flex items-center rounded-2xl border border-[#0B1E8A]/15 bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleCapacityChange("decrease")}
                    className="inline-flex h-[50px] w-12 items-center justify-center text-[#0B1E8A] hover:bg-[#f5f8ff]"
                  >
                    <Minus size={16} />
                  </button>

                  <input
                    type="number"
                    min="1"
                    max="30"
                    name="maxMentees"
                    value={form.maxMentees}
                    onChange={handleChange}
                    className="h-[50px] w-full border-x border-[#0B1E8A]/10 text-center text-[#0B1E8A] outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => handleCapacityChange("increase")}
                    className="inline-flex h-[50px] w-12 items-center justify-center text-[#0B1E8A] hover:bg-[#f5f8ff]"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {errors.maxMentees && (
                  <p className="mt-1 text-sm font-medium text-red-600">
                    {errors.maxMentees}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[24px] border border-[#0B1E8A]/10 bg-[#f8faff] p-5">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#F36C21]" />
                <h3 className="text-sm font-black uppercase tracking-[0.18em] text-[#0B1E8A]">
                  Live Preview
                </h3>
              </div>

              <div className="mt-4 rounded-[24px] border border-[#0B1E8A]/10 bg-white p-5 shadow-sm">
                <div className="min-w-0">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B1E8A]/8 text-[#0B1E8A]">
                    <UserRound size={22} />
                  </div>

                  <h4 className="mt-4 text-lg font-black text-[#0B1E8A] break-words">
                    {form.title?.trim() || "Mentor display name"}
                  </h4>

                  <p className="mt-2 text-sm text-slate-600">
                    {form.bio?.trim() || "Your bio preview will appear here."}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold text-[#0B1E8A]">
                    {form.expertiseLevel || "Intermediate"}
                  </span>
                  <span className="rounded-full bg-[#fff4ec] px-3 py-1 text-xs font-semibold text-[#F36C21]">
                    {form.availability || "Available"}
                  </span>
                  <span className="rounded-full bg-[#f5f7fb] px-3 py-1 text-xs font-semibold text-slate-700">
                    Capacity: 0/{Number(form.maxMentees || 0)}
                  </span>
                </div>

                <div className="mt-5">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Skills
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {skillsPreview.length > 0 ? (
                      skillsPreview.map((skill, index) => (
                        <span
                          key={`${skill}-${index}`}
                          className="rounded-full border border-[#0B1E8A]/10 bg-white px-3 py-1 text-xs font-medium text-[#0B1E8A]"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">No skills yet</span>
                    )}
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Interests
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {interestsPreview.length > 0 ? (
                      interestsPreview.map((interest, index) => (
                        <span
                          key={`${interest}-${index}`}
                          className="rounded-full border border-[#F36C21]/15 bg-[#fff9f5] px-3 py-1 text-xs font-medium text-[#F36C21]"
                        >
                          {interest}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">
                        No interests yet
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-[#0B1E8A]/10 bg-white p-5">
              <h3 className="text-sm font-black uppercase tracking-[0.18em] text-[#0B1E8A]">
                Tips
              </h3>

              <div className="mt-4 space-y-3">
                <div className="flex gap-3 rounded-2xl bg-[#f8faff] p-3">
                  <Lightbulb size={18} className="mt-0.5 text-[#F36C21]" />
                  <p className="text-sm text-slate-600">
                    Use the display name you want students to see.
                  </p>
                </div>

                <div className="flex gap-3 rounded-2xl bg-[#f8faff] p-3">
                  <Award size={18} className="mt-0.5 text-[#0B1E8A]" />
                  <p className="text-sm text-slate-600">
                    Add skills that match what students search for.
                  </p>
                </div>

                <div className="flex gap-3 rounded-2xl bg-[#f8faff] p-3">
                  <CalendarCheck2
                    size={18}
                    className="mt-0.5 text-[#0B1E8A]"
                  />
                  <p className="text-sm text-slate-600">
                    Keep max mentees realistic and manageable.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-[#0B1E8A]/10 pt-6">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-2xl bg-[#F36C21] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#dc5f17] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? mode === "edit"
                ? "Updating..."
                : "Creating..."
              : mode === "edit"
              ? "Update Mentor Profile"
              : "Create Mentor Profile"}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-2xl border border-[#0B1E8A]/15 bg-white px-6 py-3 text-sm font-bold text-[#0B1E8A] hover:bg-[#f5f8ff] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CreateMentorProfile;