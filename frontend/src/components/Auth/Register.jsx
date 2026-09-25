import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  Sparkles,
  Users,
  UserCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import API from "../Auth/axios";
import appLogo from "../../../images/uniconnect.png";
import studentImage from "../../../images/students.jpeg";

const validateRegisterForm = (values, confirmPassword) => {
  const errors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!values.fullName.trim()) {
    errors.fullName = "Full name is required";
  }

  if (!values.studentId.trim()) {
    errors.studentId = "Student ID is required";
  }

  if (!values.email.trim()) {
    errors.email = "Email is required";
  } else if (!emailRegex.test(values.email)) {
    errors.email = "Enter a valid email address";
  }

  if (!values.faculty) {
    errors.faculty = "Faculty is required";
  }

  if (!values.yearOfStudy) {
    errors.yearOfStudy = "Year of study is required";
  }

  if (!values.password) {
    errors.password = "Password is required";
  } else if (values.password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Confirm password is required";
  } else if (values.password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  return errors;
};

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    studentId: "",
    role: "STUDENT",
    faculty: "",
    yearOfStudy: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setSubmitError("");
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    setSubmitError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateRegisterForm(formData, confirmPassword);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      setSubmitError("");
      const res = await API.post("/auth/register", formData);
      localStorage.setItem("token", res.data.token);

      const user = res.data?.user || {};
      const { password, ...safeUser } = user;
      localStorage.setItem("user", JSON.stringify(safeUser));

      const role = String(safeUser?.role || "").trim().toUpperCase();
      const isAdmin = role === "SYSTEM_ADMIN" || role === "CLUB_ADMIN";
      toast.success("Registration successful!");
      navigate(isAdmin ? "/admin" : "/dashboard");
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#edf2ff] text-[#0f1f5f]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(243,108,33,0.14),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(15,31,120,0.14),_transparent_28%),linear-gradient(135deg,_#edf2ff_0%,_#f9fbff_48%,_#fff3ea_100%)]" />
      <div className="absolute left-[-4rem] top-24 h-72 w-72 rounded-full bg-[#0b1e8a]/10 blur-3xl" />
      <div className="absolute bottom-[-5rem] right-[-4rem] h-80 w-80 rounded-full bg-[#f36c21]/12 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="relative overflow-hidden rounded-[32px] border border-white/60 bg-[#0b1e8a] p-8 text-white shadow-[0_30px_90px_rgba(11,30,138,0.35)] lg:p-10">
            <div className="absolute inset-0">
              <img src={studentImage} alt="Students" className="h-full w-full object-cover object-center opacity-55" />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(11,30,138,0.36),rgba(11,30,138,0.18))]" />
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => navigate("/", { replace: true })}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-white/80">
                <Sparkles size={13} />
                Join UniConnect
              </span>
            </div>

            <div className="relative mt-14 max-w-xl">
               <br/>
               <br/>
              <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] sm:text-5xl">
                Create your UniConnect account
              </h1>
               <br />
               <br />
               <br/>
               <br/>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: Users, label: "Campus network" },
                  { icon: BadgeCheck, label: "Verified profile" },
                  { icon: Sparkles, label: "Personalized dashboard" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur-sm"
                  >
                    <Icon size={18} className="text-[#ffd7c0]" />
                    <p className="mt-3 text-sm font-semibold text-white/90">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="relative flex items-center">
            <div className="w-full max-w-[560px] rounded-[32px] border border-white/70 bg-white/90 p-4 shadow-[0_18px_50px_rgba(15,31,95,0.12)] backdrop-blur-xl sm:p-5">
              <div className="mb-4">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f36c21]">
                  Sign up
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#10236a] sm:text-[1.75rem]">
                  Start your account
                </h2>
                <p className="mt-2 text-sm leading-5 text-[#66739a]">
                  Fill in your details to create a student account and access the full
                  UniConnect experience.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 gap-3 md:grid-cols-2"
                noValidate
              >
                {submitError && (
                  <div className="md:col-span-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                    {submitError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#33406f]">Full name</label>
                  <div className="relative">
                    <UserCircle2 size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b96b8]" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Your full name"
                      className={`w-full rounded-2xl border bg-[#f8faff] py-3.5 pl-11 pr-4 text-sm text-[#10236a] outline-none transition focus:border-[#f36c21] focus:bg-white focus:ring-4 focus:ring-[#f36c21]/10 ${
                        errors.fullName ? "border-red-400" : "border-[#d9e1f5]"
                      }`}
                    />
                  </div>
                  {errors.fullName && <p className="text-xs font-medium text-red-600">{errors.fullName}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#33406f]">Student ID</label>
                  <div className="relative">
                    <BadgeCheck size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b96b8]" />
                    <input
                      type="text"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleChange}
                      placeholder="ITxxxxxxx"
                      className={`w-full rounded-2xl border bg-[#f8faff] py-3.5 pl-11 pr-4 text-sm text-[#10236a] outline-none transition focus:border-[#f36c21] focus:bg-white focus:ring-4 focus:ring-[#f36c21]/10 ${
                        errors.studentId ? "border-red-400" : "border-[#d9e1f5]"
                      }`}
                    />
                  </div>
                  {errors.studentId && <p className="text-xs font-medium text-red-600">{errors.studentId}</p>}
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-sm font-semibold text-[#33406f]">Email</label>
                  <div className="relative">
                    <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b96b8]" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="name@example.com"
                      className={`w-full rounded-2xl border bg-[#f8faff] py-3.5 pl-11 pr-4 text-sm text-[#10236a] outline-none transition focus:border-[#f36c21] focus:bg-white focus:ring-4 focus:ring-[#f36c21]/10 ${
                        errors.email ? "border-red-400" : "border-[#d9e1f5]"
                      }`}
                    />
                  </div>
                  {errors.email && <p className="text-xs font-medium text-red-600">{errors.email}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#33406f]">Faculty</label>
                  <div className="relative">
                    <GraduationCap size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b96b8]" />
                    <select
                      name="faculty"
                      value={formData.faculty}
                      onChange={handleChange}
                      className={`w-full rounded-2xl border bg-[#f8faff] py-3.5 pl-11 pr-4 text-sm text-[#10236a] outline-none transition focus:border-[#f36c21] focus:bg-white focus:ring-4 focus:ring-[#f36c21]/10 ${
                        errors.faculty ? "border-red-400" : "border-[#d9e1f5]"
                      }`}
                    >
                      <option value="">Select faculty</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Business">Business</option>
                      <option value="Computing">Computing</option>
                      <option value="Medicine">Medicine</option>
                    </select>
                  </div>
                  {errors.faculty && <p className="text-xs font-medium text-red-600">{errors.faculty}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#33406f]">Year of study</label>
                  <div className="relative">
                    <Users size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b96b8]" />
                    <select
                      name="yearOfStudy"
                      value={formData.yearOfStudy}
                      onChange={handleChange}
                      className={`w-full rounded-2xl border bg-[#f8faff] py-3.5 pl-11 pr-4 text-sm text-[#10236a] outline-none transition focus:border-[#f36c21] focus:bg-white focus:ring-4 focus:ring-[#f36c21]/10 ${
                        errors.yearOfStudy ? "border-red-400" : "border-[#d9e1f5]"
                      }`}
                    >
                      <option value="">Select year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                  {errors.yearOfStudy && <p className="text-xs font-medium text-red-600">{errors.yearOfStudy}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#33406f]">Password</label>
                  <div className="relative">
                    <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b96b8]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      className={`w-full rounded-2xl border bg-[#f8faff] py-3.5 pl-11 pr-14 text-sm text-[#10236a] outline-none transition focus:border-[#f36c21] focus:bg-white focus:ring-4 focus:ring-[#f36c21]/10 ${
                        errors.password ? "border-red-400" : "border-[#d9e1f5]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-2 py-1 text-[#0b1e8a] transition hover:bg-[#eef2ff]"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs font-medium text-red-600">{errors.password}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#33406f]">Confirm password</label>
                  <div className="relative">
                    <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b96b8]" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={handleConfirmPasswordChange}
                      placeholder="Repeat your password"
                      className={`w-full rounded-2xl border bg-[#f8faff] py-3.5 pl-11 pr-14 text-sm text-[#10236a] outline-none transition focus:border-[#f36c21] focus:bg-white focus:ring-4 focus:ring-[#f36c21]/10 ${
                        errors.confirmPassword ? "border-red-400" : "border-[#d9e1f5]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-2 py-1 text-[#0b1e8a] transition hover:bg-[#eef2ff]"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs font-medium text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>

                <div className="md:col-span-2 pt-0.5">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-[#f36c21] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(243,108,33,0.24)] transition hover:-translate-y-0.5 hover:bg-[#e7631c] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    {loading ? "Creating account..." : "Create account"}
                  </button>
                </div>

                <div className="md:col-span-2 pt-0.5 text-center text-sm text-[#66739a]">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-bold text-[#0b1e8a] transition hover:text-[#f36c21]"
                  >
                    Log in
                  </Link>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Register;


