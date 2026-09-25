import React, { useState, useEffect } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Auth
import Register from "./components/Auth/Register";
import Login from "./components/Auth/Login";

// Public
import LandingPage from "./components/landingPage";
import VerificationPage from "./components/VerificationPage";

// Core
import Dashboard from "./components/Dashboard";
import Profile from "./components/Profile";
import Layout from "./components/Layout";

// Profile
import ProfileEditPage from "./components/EditProfile";
import AddSkillPage from "./components/AddSkillsPage";
import SkillsListPage from "./components/SkillListPage";
import ChangePasswordPage from "./components/ChangePasswordPage";
import ResetPasswordPage from "./components/ResetPasswordPage";
import ForgotPasswordPage from "./components/ForgotPasswordPage";
import AccountSettingsPage from "./components/AccountSettingpage";
import BadgeCertificationPage from "./components/BadgeCertificationPage";

// Admin
import AdminPanel from "./components/AdminPanel";

// Club
import MyClubs from "./components/MyClubs";
import ClubDashboard from "./components/ClubDashboard";
import ClubManage from "./components/club-manage/ClubManage";
import ElectionVote from "./components/club-manage/ElectionVote";

// Protection
import ProtectedRoute from "./components/ProtectedRoute";

// News Module
import NewsOnlyPage from "./components/NewsPages/NewsOnlyPage";
import NewsPage from "./components/NewsPages/NewsPage";
import ProjectFeed from "./components/pages/ProjectFeed";
import UploadProject from "./components/pages/UploadProject";
import ClubEventAnalysis from "./components/pages/ClubEventAnalysis";
import NewsEditor from "./components/pages/NewsEditor";
import NewsForm from "./components/NewsComponents/NewsForm.jsx";
import NewsItem from "./components/NewsComponents/NewsItem.jsx";
import NewsList from "./components/NewsComponents/NewsList.jsx";

// Event Module
import CreateEvent from "./components/CreateEvent.jsx";
import EventCalendar from "./components/EventCalendar.jsx";
import EventRegistration from "./components/EventRegistration.jsx";
import ManageEvents from "./components/ManageEvents.jsx";
import EventDetails from "./components/EventDetails.jsx";
import StudentEvents from "./components/StudentEvents.jsx";

import "./App.css";

function App() {
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
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

const user = getCurrentUser();
    if (user) {
      setUserRole(user.role);
    }
  }, []);

  const handleNewsSubmit = (payload) => {
    console.log("News submitted:", payload);
  };

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        gutter={12}
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "16px",
            fontSize: "14px",
            padding: "14px 16px",
            boxShadow: "0 18px 40px rgba(15, 31, 95, 0.12)",
          },
          success: {
            style: {
              background: "#ecfdf5",
              color: "#065f46",
              border: "1px solid #a7f3d0",
            },
          },
          error: {
            style: {
              background: "#fef2f2",
              color: "#991b1b",
              border: "1px solid #fecaca",
            },
          },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/verify/:credentialId" element={<VerificationPage />} />

        {/* Admin Route */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["SYSTEM_ADMIN", "CLUB_ADMIN"]}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<ProfileEditPage />} />

          <Route path="/skills" element={<SkillsListPage />} />
          <Route path="/skills/add" element={<AddSkillPage />} />

          <Route path="/settings" element={<AccountSettingsPage />} />
          <Route path="/settings/password" element={<ChangePasswordPage />} />

          <Route path="/badges" element={<BadgeCertificationPage />} />

          <Route path="/my-clubs" element={<MyClubs />} />
          <Route path="/clubs/:clubId" element={<ClubDashboard />} />
          <Route path="/clubs/:clubId/manage" element={<ClubManage />} />
          <Route
            path="/clubs/:clubId/elections/:electionId"
            element={<ElectionVote />}
          />

          {/* News Module Routes */}
          <Route path="/club-news" element={<NewsOnlyPage />} />
          <Route path="/club-projects" element={<ProjectFeed />} />
          <Route path="/upload-project" element={<UploadProject />} />
          <Route path="/club-analytics" element={<ClubEventAnalysis />} />
          <Route path="/manage-news" element={<NewsPage />} />
          <Route path="/manage-news/new" element={<NewsEditor />} />
          <Route path="/manage-news/edit/:id" element={<NewsEditor />} />
          <Route
            path="/newsForm"
            element={<NewsForm onSubmit={handleNewsSubmit} />}
          />
          <Route path="/newsItem" element={<NewsItem />} />
          <Route path="/newsList" element={<NewsList />} />

          {/* Event Module Routes */}
          <Route path="/calendar" element={<EventCalendar />} />
          <Route
            path="/event-registration"
            element={<EventRegistration userRole={userRole} />}
          />
          <Route path="/event/:id" element={<EventDetails />} />
          <Route path="/all-events" element={<StudentEvents />} />

          <Route
            path="/create-event"
            element={
              <ProtectedRoute allowedRoles={["CLUB_ADMIN", "SYSTEM_ADMIN"]}>
                <CreateEvent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-event/:id"
            element={
              <ProtectedRoute allowedRoles={["CLUB_ADMIN", "SYSTEM_ADMIN"]}>
                <CreateEvent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-events"
            element={
              <ProtectedRoute allowedRoles={["CLUB_ADMIN", "SYSTEM_ADMIN"]}>
                <ManageEvents />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;