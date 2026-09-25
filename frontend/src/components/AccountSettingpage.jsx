
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from './Auth/axios';

const AccountSettingsPage  = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    faculty: '',
    yearOfStudy: '',
    lastLogin: '',
  });
  const [notifications, setNotifications] = useState(true);
  const [privacy, setPrivacy] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        setError('');
        const { data } = await API.get('/student/dashboard');
        const user = data?.user || {};
        const profile = data?.profile || {};

        setProfileData({
          fullName: user.fullName || 'Unknown User',
          email: user.email || '-',
          faculty: profile.faculty || user.faculty || '-',
          yearOfStudy: profile.yearOfStudy || user.yearOfStudy || '-',
          lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Not available',
        });

        const rawPrefs = localStorage.getItem('accountSettingsPrefs');
        if (rawPrefs) {
          const prefs = JSON.parse(rawPrefs);
          if (typeof prefs.notifications === 'boolean') setNotifications(prefs.notifications);
          if (typeof prefs.privacy === 'boolean') setPrivacy(prefs.privacy);
        }
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load account settings.');
        toast.error(err?.response?.data?.message || 'Failed to load account settings.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'accountSettingsPrefs',
      JSON.stringify({ notifications, privacy })
    );
  }, [notifications, privacy]);

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Delete your account permanently? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      setIsDeleting(true);
      const { data } = await API.delete('/auth/me');

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('authUser');
      localStorage.removeItem('accountSettingsPrefs');

      toast.success(data?.message || 'Account deleted successfully');
      navigate('/login', { replace: true });
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to delete account';
      toast.error(message);
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="max-w-3xl mx-auto p-6 text-gray-500">Loading account settings...</div>;
  }

 return (
  <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
    <h1 className="text-3xl font-black text-[#0a1e8c]">Account Settings</h1>

    {error && (
      <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm font-medium">
        {error}
      </div>
    )}

    <div className="space-y-6">
      <section className="bg-white p-8 rounded-3xl shadow-sm border border-[#0a1e8c]/20">
        <h3 className="text-xl font-bold mb-6 text-[#0a1e8c]">Login & Security</h3>

        <div className="space-y-6">
          <div className="flex items-center justify-between py-4 border-b border-[#0a1e8c]/10">
            <div>
              <p className="text-sm font-bold text-[#4a5b86] uppercase tracking-widest mb-1">
                Account Holder
              </p>
              <p className="font-bold text-[#0a1e8c]">{profileData.fullName}</p>
            </div>
            <span className="px-3 py-1 text-xs font-black text-[#f37021] bg-[#fff4ec] border border-[#f37021]/30 rounded-full">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between py-4 border-b border-[#0a1e8c]/10">
            <div>
              <p className="text-sm font-bold text-[#4a5b86] uppercase tracking-widest mb-1">
                Email Address
              </p>
              <p className="font-bold text-[#0a1e8c]">{profileData.email}</p>
            </div>
            <span className="px-4 py-2 text-sm font-bold text-[#4a5b86] border border-[#0a1e8c]/20 rounded-xl bg-[#f5f8ff]">
              Managed by Profile
            </span>
          </div>

          <div className="flex items-center justify-between py-4 border-b border-[#0a1e8c]/10">
            <div>
              <p className="text-sm font-bold text-[#4a5b86] uppercase tracking-widest mb-1">
                Password
              </p>
              <p className="font-bold text-[#0a1e8c]">••••••••••••</p>
            </div>
            <Link
              to="/settings/password"
              className="px-4 py-2 text-sm font-bold text-[#f37021] border border-[#f37021]/40 rounded-xl hover:bg-[#fff4ec] transition-colors"
            >
              Change Password
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-[#f5f8ff] border border-[#0a1e8c]/20 p-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#4a5b86]">
                Faculty
              </p>
              <p className="font-bold text-[#0a1e8c] mt-1">{profileData.faculty}</p>
            </div>

            <div className="rounded-xl bg-[#f5f8ff] border border-[#0a1e8c]/20 p-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#4a5b86]">
                Year of Study
              </p>
              <p className="font-bold text-[#0a1e8c] mt-1">{profileData.yearOfStudy}</p>
            </div>
          </div>

          <p className="text-xs text-[#4a5b86]">
            Last login: {profileData.lastLogin}
          </p>
        </div>
      </section>

      <section className="bg-white p-8 rounded-3xl shadow-sm border border-[#0a1e8c]/20">
        <h3 className="text-xl font-bold mb-6 text-[#0a1e8c]">Preferences</h3>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-[#0a1e8c]">Email Notifications</h4>
              <p className="text-sm text-[#4a5b86]">
                Receive weekly updates on clubs and events.
              </p>
            </div>

            <button
              onClick={() => setNotifications(!notifications)}
              className={`w-14 h-8 rounded-full transition-all flex items-center px-1 ${
                notifications
                  ? 'bg-[#f37021] justify-end'
                  : 'bg-[#e6edff] justify-start'
              }`}
            >
              <div className="w-6 h-6 bg-white rounded-full shadow-md"></div>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-[#0a1e8c]">Private Profile</h4>
              <p className="text-sm text-[#4a5b86]">
                Hide your profile from non-club members.
              </p>
            </div>

            <button
              onClick={() => setPrivacy(!privacy)}
              className={`w-14 h-8 rounded-full transition-all flex items-center px-1 ${
                privacy
                  ? 'bg-[#f37021] justify-end'
                  : 'bg-[#e6edff] justify-start'
              }`}
            >
              <div className="w-6 h-6 bg-white rounded-full shadow-md"></div>
            </button>
          </div>

          <p className="text-xs text-[#4a5b86]">
            Preferences are saved automatically on this device.
          </p>
        </div>
      </section>

      <section className="bg-white p-8 rounded-3xl shadow-sm border border-[#f37021]/30">
        <h3 className="text-xl font-bold mb-2 text-[#f37021]">Danger Zone</h3>

        <p className="text-sm text-[#4a5b86] mb-6">
          Delete your account and profile data from UniConnect. This cannot be undone.
        </p>

        <button
          onClick={handleDeleteAccount}
          disabled={isDeleting}
          className="px-6 py-2 bg-[#fff4ec] text-[#f37021] font-bold rounded-xl border border-[#f37021]/30 hover:bg-[#ffe8db] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isDeleting ? 'Deleting Account...' : 'Delete Account'}
        </button>
      </section>
    </div>
  </div>
);
};

export default AccountSettingsPage;
