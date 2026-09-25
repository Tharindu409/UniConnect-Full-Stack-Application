
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from './Auth/axios';

const ChangePasswordPage  = () => {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e ) => {
    e.preventDefault();

    if (form.newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await API.put('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/settings');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };
return (
  <div className="max-w-md mx-auto space-y-6 animate-in slide-in-from-top-4 duration-300">
    <Link
      to="/settings"
      className="flex items-center text-[#2f5ea8] font-bold hover:underline"
    >
      <span className="mr-2">⬅️</span> Back to Settings
    </Link>

    <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#d7e2f6]">
      <h1 className="text-2xl font-black text-[#1b2230] mb-6">
        Change Password
      </h1>

      {success ? (
        <div className="py-8 text-center space-y-4">
          <div className="w-16 h-16 bg-[#eaf1ff] text-[#2f5ea8] rounded-full flex items-center justify-center text-3xl mx-auto">
            ✓
          </div>
          <h2 className="text-xl font-bold text-[#1b2230]">
            Password Updated!
          </h2>
          <p className="text-sm text-[#516072]">
            Your security settings have been updated. Redirecting...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="text-sm text-[#b42318]">{error}</p>}

          <div>
            <label className="block text-sm font-bold text-[#1b2230] uppercase tracking-wider mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={form.currentPassword}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, currentPassword: e.target.value }))
              }
              required
              className="w-full rounded-xl border border-[#d7e2f6] bg-[#f8fbff] px-4 py-3 text-[#1b2230] focus:ring-2 focus:ring-[#2f5ea8] focus:border-[#2f5ea8] outline-none transition-all"
            />
          </div>

          <hr className="border-[#dbe6f8]" />

          <div>
            <label className="block text-sm font-bold text-[#1b2230] uppercase tracking-wider mb-2">
              New Password
            </label>
            <input
              type="password"
              value={form.newPassword}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, newPassword: e.target.value }))
              }
              required
              className="w-full rounded-xl border border-[#d7e2f6] bg-[#f8fbff] px-4 py-3 text-[#1b2230] focus:ring-2 focus:ring-[#2f5ea8] focus:border-[#2f5ea8] outline-none transition-all"
            />
            <p className="text-[10px] text-[#516072] mt-2 font-bold uppercase tracking-widest">
              Minimum 8 characters with numbers
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#1b2230] uppercase tracking-wider mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
              }
              required
              className="w-full rounded-xl border border-[#d7e2f6] bg-[#f8fbff] px-4 py-3 text-[#1b2230] focus:ring-2 focus:ring-[#2f5ea8] focus:border-[#2f5ea8] outline-none transition-all"
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full py-4 bg-[#2f5ea8] text-white rounded-2xl font-black text-lg shadow-sm hover:bg-[#3a6dbc] transition-all disabled:opacity-60"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      )}
    </div>
  </div>
);
};

export default ChangePasswordPage;
