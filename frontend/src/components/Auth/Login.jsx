import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Sparkles,
  ShieldCheck,
  Users,
  BadgeCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import API from "../Auth/axios";
import appLogo from "../../../images/uniconnect.png";
import girlImage from "../../../images/girl.jpeg";

const validateLoginForm = ({ email, password }) => {
  const errors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email.trim()) {
    errors.email = "Email is required";
  } else if (!emailRegex.test(email.trim())) {
    errors.email = "Enter a valid email address";
  }

  if (!password) {
    errors.password = "Password is required";
  } else if (password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }

  return errors;
};

const normalizeRole = (role) => {
  const value = String(role || "").trim().toUpperCase();
  if (value === "ADMIN" || value === "SYSTEM_ADMIN") return "SYSTEM_ADMIN";
  if (value === "CLUB_ADMIN") return "CLUB_ADMIN";
  return "STUDENT";
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setErrors((prev) => ({ ...prev, email: "" }));
    setSubmitError("");
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setErrors((prev) => ({ ...prev, password: "" }));
    setSubmitError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const normalizedEmail = email.trim();
    const validationErrors = validateLoginForm({
      email: normalizedEmail,
      password,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      setSubmitError("");

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userInfo");
      localStorage.removeItem("authUser");

      const res = await API.post("/auth/login", {
        email: normalizedEmail,
        password,
      });

      const token = res?.data?.token;
      const user = res?.data?.user;

      if (!token || !user) {
        throw new Error("Invalid login response");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      const role = normalizeRole(user.role);
      const isAdmin = role === "SYSTEM_ADMIN" || role === "CLUB_ADMIN";

      toast.success("Login successful");

      navigate(isAdmin ? "/admin" : "/dashboard", { replace: true });
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Login failed";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/", { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#edf2ff] text-[#0f1f5f]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(243,108,33,0.14),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(15,31,120,0.14),_transparent_28%),linear-gradient(135deg,_#edf2ff_0%,_#f9fbff_48%,_#fff3ea_100%)]" />
      <div className="absolute left-[-4rem] top-24 h-72 w-72 rounded-full bg-[#0b1e8a]/10 blur-3xl" />
      <div className="absolute bottom-[-5rem] right-[-4rem] h-80 w-80 rounded-full bg-[#f36c21]/12 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="relative overflow-hidden rounded-[32px] border border-white/60 bg-[#0b1e8a] p-8 text-white shadow-[0_30px_90px_rgba(11,30,138,0.35)] lg:p-10">
            <div className="absolute inset-0">
              <img
                src={girlImage}
                alt="Student"
                className="h-full w-full object-cover object-center opacity-55"
              />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(11,30,138,0.36),rgba(11,30,138,0.18))]" />
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-white/80">
                <Sparkles size={13} />
                Secure access
              </span>
            </div>

            <div className="relative mt-14 max-w-xl">
              <br/>
              <br/>

              <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] sm:text-5xl">
                Welcome back to UniConnect
              </h1>
              <p className="mt-4 max-w-lg text-base leading-7 text-white/80 sm:text-lg">
                Sign in to continue managing your clubs, events, badges, and campus
                activity from one clean workspace.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: Users, label: "Campus community" },
                  { icon: BadgeCheck, label: "Verified access" },
                  { icon: ShieldCheck, label: "Role-based dashboard" },
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
            <div className="w-full rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,31,95,0.15)] backdrop-blur-xl sm:p-8">
              <div className="mb-6">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f36c21]">
                  Sign in
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#10236a]">
                  Continue your journey
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#66739a]">
                  Log in to your student or admin account and return to your dashboard.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleLogin} noValidate>
                {submitError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {submitError}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#33406f]">Email address</label>
                  <div className="relative">
                    <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b96b8]" />
                    <input
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      placeholder="name@example.com"
                      className={`w-full rounded-2xl border bg-[#f8faff] py-3.5 pl-11 pr-4 text-sm text-[#10236a] outline-none transition focus:border-[#f36c21] focus:bg-white focus:ring-4 focus:ring-[#f36c21]/10 ${
                        errors.email ? "border-red-400" : "border-[#d9e1f5]"
                      }`}
                    />
                  </div>
                  {errors.email && <p className="text-xs font-medium text-red-600">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#33406f]">Password</label>
                  <div className="relative">
                    <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b96b8]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={handlePasswordChange}
                      placeholder="Enter your password"
                      className={`w-full rounded-2xl border bg-[#f8faff] py-3.5 pl-11 pr-14 text-sm text-[#10236a] outline-none transition focus:border-[#f36c21] focus:bg-white focus:ring-4 focus:ring-[#f36c21]/10 ${
                        errors.password ? "border-red-400" : "border-[#d9e1f5]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-2 py-1 text-xs font-semibold text-[#0b1e8a] transition hover:bg-[#eef2ff]"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs font-medium text-red-600">{errors.password}</p>
                  )}
                </div>

                <div className="flex flex-col gap-3 pt-1 text-sm text-[#5c678e] sm:flex-row sm:items-center sm:justify-between">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-[#c9d3ef] text-[#f36c21] focus:ring-[#f36c21]"
                    />
                    Remember me
                  </label>
                  <Link
                    to="/forgot-password"
                    className="font-semibold text-[#0b1e8a] transition hover:text-[#f36c21]"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-[#f36c21] px-4 py-3.5 text-sm font-bold text-white shadow-[0_14px_28px_rgba(243,108,33,0.28)] transition hover:-translate-y-0.5 hover:bg-[#e7631c] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>

                <p className="pt-2 text-center text-sm text-[#66739a]">
                  Don’t have an account?{" "}
                  <Link
                    to="/register"
                    className="font-bold text-[#0b1e8a] transition hover:text-[#f36c21]"
                  >
                    Create one
                  </Link>
                </p>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;