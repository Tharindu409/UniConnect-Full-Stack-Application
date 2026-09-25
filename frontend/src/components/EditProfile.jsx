import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from './Auth/axios';

const ProfileEditPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    degreeProgram: '',
    faculty: '',
    yearOfStudy: '',
    bio: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get('/student/dashboard');
        setUser(res.data.user);
        const profile = res.data.profile || {};
        setFormData({
          degreeProgram: profile.degreeProgram || '',
          faculty: profile.faculty || res.data.user.faculty || '',
          yearOfStudy: profile.yearOfStudy || res.data.user.yearOfStudy || '',
          bio: profile.bio || ''
        });
        setLoading(false);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load profile');
        navigate('/profile');
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await API.put('/student/profile', {
        degreeProgram: formData.degreeProgram,
        faculty: formData.faculty,
        yearOfStudy: parseInt(formData.yearOfStudy),
        bio: formData.bio
      });
      
      toast.success('Profile updated successfully!');
      navigate('/profile');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-gray-500">Loading profile...</div>;
  }

 return (
  <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-[#d7e2f6] animate-in fade-in duration-500">

    <h1 className="text-2xl font-black mb-8 text-[#1b2230]">
      Edit Profile Information
    </h1>

    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Read-only */}
      <div className="bg-[#f8fbff] p-4 rounded-lg border border-[#d7e2f6]">
        <h3 className="text-sm font-bold text-[#2f5ea8] mb-3">
          Account Information (Read-only)
        </h3>

        <div className="space-y-2 text-sm text-[#1b2230]">
          <p><span className="font-semibold">Full Name:</span> {user?.fullName}</p>
          <p><span className="font-semibold">Email:</span> {user?.email}</p>
          <p><span className="font-semibold">Student ID:</span> {user?.studentId}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">

        {/* Degree */}
        <div className="col-span-2">
          <label className="block text-sm font-bold text-[#1b2230] mb-1">
            Degree Program
          </label>
          <input
            type="text"
            value={formData.degreeProgram}
            onChange={(e) => setFormData({ ...formData, degreeProgram: e.target.value })}
            placeholder="e.g., BSc (Hons) in Information Technology"
            className="w-full border border-[#d7e2f6] bg-[#f8fbff] rounded-lg px-4 py-2 text-[#1b2230] focus:ring-2 focus:ring-[#2f5ea8] focus:border-[#2f5ea8]"
          />
        </div>

        {/* Faculty */}
        <div>
          <label className="block text-sm font-bold text-[#1b2230] mb-1">
            Faculty
          </label>
          <select
            value={formData.faculty}
            onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
            className="w-full border border-[#d7e2f6] bg-[#f8fbff] rounded-lg px-4 py-2 text-[#1b2230] focus:ring-2 focus:ring-[#2f5ea8]"
          >
            <option value="">Select Faculty</option>
            <option value="Engineering">Engineering</option>
            <option value="Business">Business</option>
            <option value="Computing">Computing</option>
            <option value="Medicine">Medicine</option>
          </select>
        </div>

        {/* Year */}
        <div>
          <label className="block text-sm font-bold text-[#1b2230] mb-1">
            Year of Study
          </label>
          <select
            value={formData.yearOfStudy}
            onChange={(e) => setFormData({ ...formData, yearOfStudy: e.target.value })}
            className="w-full border border-[#d7e2f6] bg-[#f8fbff] rounded-lg px-4 py-2 text-[#1b2230] focus:ring-2 focus:ring-[#2f5ea8]"
          >
            <option value="">Select Year</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>
        </div>

        {/* Bio */}
        <div className="col-span-2">
          <label className="block text-sm font-bold text-[#1b2230] mb-1">
            Bio
          </label>
          <textarea
            rows={4}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Tell us about yourself..."
            maxLength={500}
            className="w-full border border-[#d7e2f6] bg-[#f8fbff] rounded-lg px-4 py-2 text-[#1b2230] focus:ring-2 focus:ring-[#2f5ea8]"
          />
          <p className="text-xs text-[#516072] mt-1">
            {formData.bio.length}/500 characters
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end space-x-4 pt-6">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="px-6 py-2 border border-[#d7e2f6] text-[#516072] rounded-xl font-medium hover:bg-[#f8fbff] transition"
          disabled={saving}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="px-6 py-2 bg-[#2f5ea8] text-white rounded-xl font-bold hover:bg-[#3a6dbc] transition disabled:opacity-60"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

    </form>
  </div>
);
};

export default ProfileEditPage;