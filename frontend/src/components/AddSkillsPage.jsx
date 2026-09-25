import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from './Auth/axios';

const AddSkillPage  = () => {
  const navigate = useNavigate();
  const [skillName, setSkillName] = useState('');
  const [proficiency, setProficiency] = useState('Intermediate');
  const [category, setCategory] = useState('TECHNICAL');
  const [relatedActivity, setRelatedActivity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!skillName.trim()) return;

    try {
      setLoading(true);
      setError('');
      await API.post('/student/skills', {
        skillName: skillName.trim(),
        proficiency,
        category,
        relatedActivity: relatedActivity.trim(),
      });
      toast.success('Skill added successfully');
      navigate('/skills');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to add skill';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f6f8ff] px-4 py-5 sm:px-6 lg:px-8">
      <div className="absolute left-[-4rem] top-24 h-72 w-72 rounded-full bg-[#0a1e8c]/10 blur-3xl" />
      <div className="absolute right-[-4rem] bottom-12 h-72 w-72 rounded-full bg-[#f37021]/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-4xl gap-5 lg:grid-cols-[0.88fr_1.12fr]">
        <section className="overflow-hidden rounded-[28px] border border-white/70 bg-[#0a1e8c] p-7 text-white shadow-[0_20px_55px_rgba(10,30,140,0.20)]">
          <div className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-white/80">
            Skill Builder
          </div>

          <h1 className="mt-5 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
            Add a new skill
          </h1>

          <p className="mt-3 max-w-md text-sm leading-6 text-white/80 sm:text-base">
            Capture what you know, how strong you are, and where that skill is being used so your profile feels complete and credible.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              'Showcase technical expertise',
              'Track related club activities',
              'Keep your profile up to date',
              'Remove skills anytime'
            ].map((item) => (
              <div key={item} className="rounded-[18px] border border-white/10 bg-white/10 p-3.5 backdrop-blur-sm">
                <p className="text-sm font-semibold text-white/90">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_55px_rgba(10,30,140,0.08)] backdrop-blur-xl sm:p-7">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f37021]">
              Add skill
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#0a1e8c] sm:text-3xl">
              Skill details
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#516072]">
              Fill in the information below to attach a skill to your profile.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#516072]">Skill Name</label>
              <input 
                type="text" 
                placeholder="e.g. Python, Graphic Design, Project Management"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                className="w-full rounded-2xl border border-[#d7e2f6] bg-[#f8fbff] px-4 py-2.5 text-[#1b2230] outline-none transition focus:border-[#0a1e8c] focus:bg-white focus:ring-4 focus:ring-[#0a1e8c]/10"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#516072]">Proficiency Level</label>
              <div className="grid grid-cols-2 gap-2.5">
                {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setProficiency(level)}
                    className={`rounded-2xl border px-4 py-2.5 text-sm font-bold transition-all ${
                      proficiency === level
                        ? 'border-[#0a1e8c] bg-[#0a1e8c] text-white shadow-lg shadow-[#0a1e8c]/20'
                        : 'border-[#d7e2f6] bg-white text-[#516072] hover:border-[#0a1e8c]/25 hover:bg-[#f5f8ff]'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#516072]">Skill Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-2xl border border-[#d7e2f6] bg-[#f8fbff] px-4 py-2.5 text-[#1b2230] outline-none transition focus:border-[#0a1e8c] focus:bg-white focus:ring-4 focus:ring-[#0a1e8c]/10"
              >
                <option value="TECHNICAL">Technical</option>
                <option value="SOFT_SKILL">Soft Skill</option>
                <option value="MANAGEMENT">Management</option>
                <option value="DESIGN">Design</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#516072]">Related Club/Activity (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. Robotics Club"
                value={relatedActivity}
                onChange={(e) => setRelatedActivity(e.target.value)}
                className="w-full rounded-2xl border border-[#d7e2f6] bg-[#f8fbff] px-4 py-2.5 text-[#1b2230] outline-none transition focus:border-[#0a1e8c] focus:bg-white focus:ring-4 focus:ring-[#0a1e8c]/10"
              />
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-2xl bg-[#f37021] px-5 py-3 font-bold text-white shadow-[0_14px_28px_rgba(243,112,33,0.24)] transition hover:-translate-y-0.5 hover:bg-[#e86619] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Adding...' : 'Add to Profile'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/skills')}
                className="rounded-2xl border border-[#d7e2f6] bg-white px-5 py-3 font-bold text-[#516072] transition hover:border-[#0a1e8c]/25 hover:bg-[#f5f8ff] hover:text-[#0a1e8c]"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default AddSkillPage;