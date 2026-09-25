import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import campusBackground from "../../images/SLIIT-malabe.jpg";
import appLogo from "../../images/uniconnect-logo.svg";
import heroOne from "../../images/hero1.jpg";
import heroTwo from "../../images/hero3.jpg";
import {
  Newspaper,
  FolderOpen,
  BarChart3,
  Users,
  Building2,
  Award,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
} from "lucide-react";

const LandingPage = () => {
  const heroSlides = [
    {
      image: heroOne,
      title: "Build Better Campus Communities With UniConnect.",
      date: "     ",
      time: "",
    },
    {
      image: heroTwo,
      title: "Join & Manage Events Easily.",
      date: "",
      time: "",
    },
    {
      image: campusBackground,
      title: "Uni Connect: Your Campus, Your Community.",
      date: "",
      time: "",
    },
  ];

  const [activeSlide, setActiveSlide] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeLandingTab, setActiveLandingTab] = useState("faculties");

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Communities", href: "#communities" },
    { label: "About", href: "#about" },
    { label: "Impact", href: "#impact" },
  ];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 16);
    };

    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSlideChange = (index) => {
    setActiveSlide(index);
  };

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const featureCards = [
    {
      title: "Club Management",
      description:
        "Create, manage, and grow student clubs with approvals, memberships, and activities in one place.",
      icon: Building2,
    },
    {
      title: "Mentor Matching",
      description:
        "Connect students with mentors and guide them through academic and career growth.",
      icon: Users,
    },
    {
      title: "Skill Tracking",
      description:
        "Showcase student talents, achievements, certifications, and progress across campus life.",
      icon: Sparkles,
    },
    {
      title: "Badge Portfolio",
      description:
        "Recognize student involvement with verified badges, awards, and accomplishment records.",
      icon: Award,
    },
  ];

  const facultyCards = [
    {
      title: "Computing",
      text: "Technology, software, AI, cybersecurity, and innovation-driven learning communities.",
    },
    {
      title: "Engineering",
      text: "Hands-on projects, robotics, sustainable systems, and technical problem solving.",
    },
    {
      title: "Business",
      text: "Entrepreneurship, leadership, finance, marketing, and collaborative ventures.",
    },
    {
      title: "Humanities & Design",
      text: "Creative communities, communication, media, arts, and social impact initiatives.",
    },
  ];

  const communityCards = [
    {
      title: "Student Clubs",
      text: "Join academic, social, creative, and leadership clubs to expand your network.",
    },
    {
      title: "Project Teams",
      text: "Collaborate on real university and community projects with peers from many faculties.",
    },
    {
      title: "Campus News",
      text: "Stay informed with announcements, highlights, event updates, and success stories.",
    },
    {
      title: "Event Insights",
      text: "Track club event performance and see analytics that help communities grow smarter.",
    },
  ];

  const landingTabs = {
    faculties: {
      label: "Faculties",
      title: "Explore by Faculty",
      subtitle: "Discover student communities and opportunities from each school.",
      cards: facultyCards,
    },
    communities: {
      label: "Communities",
      title: "Campus Communities",
      subtitle: "Join groups, meet peers, and build meaningful networks.",
      cards: communityCards,
    },
    opportunities: {
      label: "Opportunities",
      title: "Growth Opportunities",
      subtitle: "Find practical experiences to grow your profile and confidence.",
      cards: [
        {
          title: "Hackathons",
          text: "Compete in real-world challenges, collaborate with teams, and ship innovative solutions.",
        },
        {
          title: "Mentorship Sessions",
          text: "Book one-on-one mentor sessions for career, projects, and academic guidance.",
        },
        {
          title: "Leadership Tracks",
          text: "Join structured programs focused on communication, planning, and execution skills.",
        },
        {
          title: "Volunteer Drives",
          text: "Contribute to social-impact projects and earn recognized campus activity credits.",
        },
      ],
    },
    spotlight: {
      label: "Spotlight",
      title: "Campus Spotlight",
      subtitle: "Quick dummy insights for demos and presentations.",
      cards: [
        {
          title: "120+ Active Clubs",
          text: "From coding circles to cultural societies, student communities are growing every semester.",
        },
        {
          title: "350+ Published Projects",
          text: "Students showcase apps, research, and industry work in a central project feed.",
        },
        {
          title: "Weekly Event Calendar",
          text: "Track workshops, competitions, and networking events in one organized timeline.",
        },
        {
          title: "Verified Badges",
          text: "Achievement badges make accomplishments visible for portfolios and internships.",
        },
      ],
    },
  };

  const aboutHighlights = [
    {
      title: "One Student Platform",
      text: "UniConnect centralizes clubs, events, projects, and student achievements into one seamless experience.",
    },
    {
      title: "Built for Collaboration",
      text: "Students, mentors, and admins can coordinate faster with clear workflows and real-time visibility.",
    },
    {
      title: "Evidence of Growth",
      text: "From badges to project portfolios, students can present meaningful proof of participation and skills.",
    },
  ];

  const impactStats = [
    { label: "Active Communities", value: "120+" },
    { label: "Student Projects", value: "350+" },
    { label: "Monthly Events", value: "90+" },
    { label: "Mentorship Matches", value: "1,000+" },
  ];

  return (
  <div className="min-h-screen text-white overflow-x-hidden bg-white">
    {/* Top bar */}
    <div className="h-1 w-full bg-gradient-to-r from-[#0B1E8A] via-[#2F4FE3] to-[#F36C21]" />

    {/* Navbar */}
    <nav
      className={`fixed top-0 left-0 w-full z-50 border-b transition-all duration-300 ${
        isScrolled
          ? "border-slate-200/90 bg-[#E5EAF9] shadow-[0_10px_30px_rgba(15,23,42,0.12)]"
          : "border-slate-200/70 bg-[#E5EAF9]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="h-14 w-14 rounded-full bg-white p-1 shadow-md shadow-[#f0932b]/25 ring-1 ring-[#f0932b]/40">
            <img src={appLogo} className="h-full w-full rounded-full object-cover" />
          </div>
          <div>
            <span className="text-xl font-black text-[#0B1E8A] block">UniConnect</span>
            <span className="text-[10px] font-bold text-[#d97706] uppercase tracking-[0.16em]">
              Student Network Portal
            </span>
          </div>
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-2 space-x-2">
          {navLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#0B1E8A] hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Auth */}
        <div className="hidden md:flex items-center space-x-3">
          <Link
            to="/login"
            className="font-bold text-sm px-4 py-2 rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-[#0B1E8A] hover:text-[#0B1E8A]"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="bg-[#0B1E8A] text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-[#0B1E8A]/30 hover:bg-[#122ca8] transition"
          >
            Sign Up
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700"
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pb-4 pt-3">
          <div className="space-y-2">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-[#0B1E8A] hover:text-[#0B1E8A]"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-full border border-slate-300 px-4 py-2 text-center text-sm font-bold text-slate-700"
            >
              Login
            </Link>
            <Link
              to="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-full bg-[#0B1E8A] px-4 py-2 text-center text-sm font-bold text-white"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </nav>

    {/* Hero */}
    <section className="max-w-[92rem] mx-auto px-4 pt-32 pb-16">
      <div className="relative overflow-hidden rounded-[32px] border border-white/25 bg-white/10 shadow-2xl backdrop-blur-sm">
        <div className="relative h-[230px] sm:h-[320px] lg:h-[500px]">
          {heroSlides.map((slide, index) => (
            <div
              key={slide.title}
              className={`absolute inset-0 transition-opacity duration-[900ms] ease-in-out ${
                activeSlide === index ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
              }`}
              aria-hidden={activeSlide !== index}
            >
              <img src={slide.image} alt={slide.title} className="h-full w-full object-cover" />

              <div className="absolute inset-0 bg-gradient-to-r from-[#021057]/65 via-[#04218e]/35 to-transparent" />

              <div className="absolute inset-y-0 left-0 flex max-w-full sm:max-w-[70%] flex-col justify-center px-6 sm:px-10">
                <h1 className="text-2xl font-black uppercase leading-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl sm:leading-none">
                  {slide.title}
                </h1>
                <div className="mt-4 inline-flex w-fit items-center gap-3 rounded-full bg-[#ff007f]/90 px-4 py-2 text-white sm:px-5">
                  <span className="text-2xl font-black sm:text-4xl">{slide.date.split(" ")[0]}</span>
                  <span className="text-sm font-black uppercase leading-tight sm:text-lg">
                    {slide.date.split(" ")[1]}
                  </span>
                </div>
                <p className="mt-3 inline-block w-fit rounded-full bg-yellow-300 px-4 py-1 text-sm font-black uppercase text-[#051763] sm:text-lg">
                  {slide.time}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/register"
                    className="rounded-full bg-[#F36C21] px-5 py-2 text-sm font-bold text-white transition hover:bg-orange-600 sm:px-6 sm:py-3"
                  >
                    Join Now
                  </Link>
                  <Link
                    to="/login"
                    className="rounded-full border border-white/80 px-5 py-2 text-sm font-bold text-white transition hover:bg-white hover:text-[#0B1E8A] sm:px-6 sm:py-3"
                  >
                    Student Login
                  </Link>
                </div>
              </div>
            </div>
          ))}

          <div className="absolute bottom-6 left-1/2 z-20 hidden -translate-x-1/2 gap-2 sm:flex">
            {heroSlides.map((_, dotIndex) => (
              <button
                key={`dot-${dotIndex}`}
                type="button"
                onClick={() => handleSlideChange(dotIndex)}
                className={`h-2.5 rounded-full transition-all ${
                  activeSlide === dotIndex ? "w-8 bg-white" : "w-2.5 bg-white/60"
                }`}
                aria-label={`Go to slide ${dotIndex + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handlePrevSlide}
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/50 bg-[#0B1E8A]/70 p-2 text-white transition hover:bg-[#0B1E8A]"
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            type="button"
            onClick={handleNextSlide}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/50 bg-[#0B1E8A]/70 p-2 text-white transition hover:bg-[#0B1E8A]"
            aria-label="Next slide"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link
          to="/news-only"
          className="rounded-xl border border-white/20 bg-[#0B1E8A]/70 p-4 text-white transition hover:bg-[#0B1E8A]/90"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">Campus News Hub</p>
              <p className="text-xs text-gray-300">Latest announcements</p>
            </div>
            <Newspaper className="text-[#F36C21]" />
          </div>
        </Link>

        <Link
          to="/project-feed"
          className="rounded-xl border border-white/20 bg-[#0B1E8A]/70 p-4 text-white transition hover:bg-[#0B1E8A]/90"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">Student Projects</p>
              <p className="text-xs text-gray-300">Explore work</p>
            </div>
            <FolderOpen className="text-[#F36C21]" />
          </div>
        </Link>

        <Link
          to="/analysis"
          className="rounded-xl border border-white/20 bg-[#0B1E8A]/70 p-4 text-white transition hover:bg-[#0B1E8A]/90"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">Event Analytics</p>
              <p className="text-xs text-gray-300">Insights & trends</p>
            </div>
            <BarChart3 className="text-[#F36C21]" />
          </div>
        </Link>
      </div>
    </section>

    {/* Landing Tabs */}
    <section id="communities" className="max-w-7xl mx-auto px-4 pb-16">
      <div className="rounded-3xl border border-white/20 bg-[#07144f]/75 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f6b04f]">
              Landing Preview Data
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black text-white">
              {landingTabs[activeLandingTab].title}
            </h2>
            <p className="mt-2 text-sm text-slate-200">
              {landingTabs[activeLandingTab].subtitle}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(landingTabs).map(([key, tab]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveLandingTab(key)}
              className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                activeLandingTab === key
                  ? "border-[#f6b04f] bg-[#f6b04f] text-[#08135e]"
                  : "border-white/20 bg-white/5 text-white hover:border-white/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {landingTabs[activeLandingTab].cards.map((card) => (
            <article
              key={card.title}
              className="rounded-2xl border border-white/15 bg-white/5 p-4 transition hover:-translate-y-1 hover:border-[#f6b04f]/70"
            >
              <h3 className="text-base font-black text-white">{card.title}</h3>
              <p className="mt-2 text-sm text-slate-200 leading-relaxed">{card.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    {/* About Section */}
    <section id="about" className="max-w-7xl mx-auto px-4 pb-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B1E8A]">About</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-black text-[#0B1E8A]">
          A Connected Campus Experience
        </h2>
        <p className="mt-3 max-w-3xl text-sm sm:text-base text-slate-600">
          UniConnect is designed to help universities run student ecosystems with clarity,
          engagement, and measurable outcomes.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {aboutHighlights.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <h3 className="text-base font-black text-[#0B1E8A]">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    {/* Impact Section */}
    <section id="impact" className="max-w-7xl mx-auto px-4 pb-16">
      <div className="rounded-3xl border border-[#0B1E8A]/20 bg-[#EAF0FF] p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B1E8A]">Impact</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-black text-[#0B1E8A]">
          Platform Outcomes at a Glance
        </h2>

        <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
          {impactStats.map((item) => (
            <article
              key={item.label}
              className="rounded-2xl border border-[#0B1E8A]/15 bg-white p-5 text-center"
            >
              <p className="text-3xl font-black text-[#0B1E8A]">{item.value}</p>
              <p className="mt-2 text-sm font-semibold text-slate-600">{item.label}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    {/* Features Section */}
    <section id="features" className="py-20 bg-white text-[#0B1E8A]">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-black">Everything You Need</h2>

        <div className="grid md:grid-cols-4 gap-5 mt-10">
          {featureCards.map(({ title, description, icon: Icon }) => (
            <div
              key={title}
              className="bg-white border border-[#0B1E8A]/10 p-5 rounded-xl shadow hover:shadow-lg"
            >
              <div className="h-12 w-12 bg-[#0B1E8A]/10 flex items-center justify-center rounded-xl mb-4">
                <Icon className="text-[#0B1E8A]" />
              </div>
              <h3 className="font-black">{title}</h3>
              <p className="text-sm text-gray-600 mt-2">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-[#0B1E8A] text-white p-10 rounded-xl flex flex-col gap-6 text-center sm:text-left sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-2xl font-black">Start your journey today</h3>
            <p className="text-sm mt-2 text-gray-200">
              Join UniConnect and explore everything.
            </p>
          </div>
          <Link
            to="/register"
            className="bg-[#F36C21] px-6 py-3 rounded-lg font-bold hover:bg-orange-600"
          >
            Get Started
          </Link>
        </div>
      </div>
    </section>

    {/* Footer */}
    <footer className="relative overflow-hidden bg-[#06145f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(243,108,33,0.2),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_40%)]" />

      <div className="relative max-w-7xl mx-auto px-4 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <img src={appLogo} alt="UniConnect" className="h-10 w-10 rounded-lg" />
              <div>
                <p className="text-lg font-black tracking-tight">UniConnect</p>
                <p className="text-xs text-white/70">Student Engagement Platform</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/80">
              Build stronger campus communities with seamless club management, event
              collaboration, and student growth tools.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-black uppercase tracking-[0.18em] text-[#f6b04f]">
              Quick Links
            </h4>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              {navLinks.map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="hover:text-white transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition-colors">
                  Register
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-black uppercase tracking-[0.18em] text-[#f6b04f]">
              Contact
            </h4>
            <ul className="mt-4 space-y-3 text-sm text-white/80">
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="mt-0.5 text-[#f6b04f]" />
                <span>SLIIT Malabe Campus, New Kandy Road, Malabe</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={16} className="text-[#f6b04f]" />
                <span>+94 11 754 4801</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={16} className="text-[#f6b04f]" />
                <span>hello@uniconnect.edu</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-black uppercase tracking-[0.18em] text-[#f6b04f]">
              Follow Us
            </h4>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="#"
                aria-label="Facebook"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
              >
                <Facebook size={18} />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
              >
                <Instagram size={18} />
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
              >
                <Linkedin size={18} />
              </a>
            </div>
            <p className="mt-4 text-xs text-white/60">Version 1.0 | Built for Campus Life</p>
          </div>
        </div>

        <div className="mt-10 border-t border-white/15 pt-5 text-xs text-white/60 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} UniConnect. All rights reserved.</p>
          <p>Designed for students, clubs, and university communities.</p>
        </div>
      </div>
    </footer>
  </div>
);
};

export default LandingPage;