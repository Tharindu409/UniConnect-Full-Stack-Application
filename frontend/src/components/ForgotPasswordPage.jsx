import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API from './Auth/axios';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const res = await API.post('/auth/forgot-password', { email: email.trim() });
      setSuccess(res.data?.message || 'If an account exists for that email, a reset link has been sent.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="min-h-screen bg-[#f7faff] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 className="text-center text-3xl font-black text-[#1b2230]">
        Forgot password
      </h2>
      <p className="mt-2 text-center text-sm text-[#516072]">
        Enter your account email to receive a reset link.
      </p>
    </div>

    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white py-8 px-4 shadow-sm sm:rounded-2xl sm:px-10 border border-[#d7e2f6]">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && <p className="text-sm text-[#b42318]">{error}</p>}
          {success && <p className="text-sm text-[#2f5ea8]">{success}</p>}

          <div>
            <label className="block text-sm font-medium text-[#1b2230]">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full border border-[#d7e2f6] rounded-lg px-3 py-2 shadow-sm bg-[#f8fbff] text-[#1b2230] focus:outline-none focus:ring-2 focus:ring-[#2f5ea8] focus:border-[#2f5ea8]"
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full py-3 px-4 rounded-xl text-sm font-bold text-[#f8fbff] bg-[#2f5ea8] hover:bg-[#3a6dbc] disabled:opacity-60 transition"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <div className="text-center text-sm">
            <Link
              to="/login"
              className="text-[#2f5ea8] hover:underline font-bold"
            >
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  </div>
);
};

export default ForgotPasswordPage;
