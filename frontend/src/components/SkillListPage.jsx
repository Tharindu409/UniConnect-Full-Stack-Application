
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from './Auth/axios';

const SkillsListPage  = () => {
  const [skillRows, setSkillRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState('');

  const deriveSkillRows = (profile) => {
    if (!profile) return [];

    if (Array.isArray(profile.skillDetails) && profile.skillDetails.length > 0) {
      return profile.skillDetails.map((detail) => {
        const skillObject = detail?.skill;
        const resolvedId =
          (skillObject && skillObject._id) ||
          (typeof skillObject === 'string' ? skillObject : '') ||
          detail?._id ||
          '';

        return {
          id: resolvedId,
          name:
            (skillObject && skillObject.name) ||
            (typeof skillObject === 'string' ? skillObject : '') ||
            'Unknown Skill',
          proficiency: detail?.proficiency || 'Intermediate',
          relatedActivity: detail?.relatedActivity || '',
          category: skillObject?.category || '',
        };
      });
    }

    const fallbackSkills = Array.isArray(profile.skills) ? profile.skills : [];
    return fallbackSkills.map((skill) => ({
      id: typeof skill === 'string' ? '' : skill?._id || '',
      name: typeof skill === 'string' ? skill : skill?.name || 'Unknown Skill',
      proficiency: 'Intermediate',
      relatedActivity: '',
      category: skill?.category || '',
    }));
  };

  const loadSkills = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await API.get('/student/dashboard');
      setSkillRows(deriveSkillRows(res.data?.profile));
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load skills';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const renderedSkills = useMemo(() => skillRows || [], [skillRows]);
  const skillStats = useMemo(() => {
    const total = renderedSkills.length;
    const advancedCount = renderedSkills.filter((skill) =>
      ['Advanced', 'Expert'].includes(skill.proficiency)
    ).length;
    const categories = new Set(
      renderedSkills.map((skill) => skill.category || 'Uncategorized')
    ).size;

    return { total, advancedCount, categories };
  }, [renderedSkills]);

  const getProficiencyTone = (level = '') => {
    const normalized = String(level).toLowerCase();
    if (normalized === 'expert') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (normalized === 'advanced') return 'bg-sky-50 text-sky-700 border-sky-200';
    if (normalized === 'intermediate') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const handleRemove = async (skillId) => {
    try {
      setRemovingId(skillId);
      const res = await API.delete(`/student/skills/${skillId}`);
      setSkillRows(deriveSkillRows(res.data));
      toast.success('Skill removed successfully');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to remove skill';
      setError(message);
      toast.error(message);
    } finally {
      setRemovingId('');
    }
  };


return (
  <div className="relative min-h-screen overflow-hidden bg-[#f6f8ff] px-4 py-6 sm:px-6 lg:px-8">
    <div className="absolute left-[-4rem] top-20 h-72 w-72 rounded-full bg-[#0a1e8c]/10 blur-3xl" />
    <div className="absolute right-[-5rem] bottom-10 h-80 w-80 rounded-full bg-[#f37021]/10 blur-3xl" />

    <div className="relative mx-auto max-w-6xl space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_70px_rgba(10,30,140,0.08)] backdrop-blur-xl sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <Link
            to="/skills/add"
            className="inline-flex items-center justify-center rounded-2xl border border-[#f37021]/20 bg-[#f37021] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#e86619]"
          >
            Add New Skill
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-[#0a1e8c]/10 bg-[#f5f8ff] p-4">
            <p className="text-xs font-black uppercase tracking-widest text-[#4a5b86]">Total Skills</p>
            <p className="mt-2 text-3xl font-black text-[#0a1e8c]">{skillStats.total}</p>
          </div>
          <div className="rounded-3xl border border-[#0a1e8c]/10 bg-[#f5f8ff] p-4">
            <p className="text-xs font-black uppercase tracking-widest text-[#4a5b86]">Advanced + Expert</p>
            <p className="mt-2 text-3xl font-black text-[#0a1e8c]">{skillStats.advancedCount}</p>
          </div>
          <div className="rounded-3xl border border-[#0a1e8c]/10 bg-[#f5f8ff] p-4">
            <p className="text-xs font-black uppercase tracking-widest text-[#4a5b86]">Categories</p>
            <p className="mt-2 text-3xl font-black text-[#0a1e8c]">{skillStats.categories}</p>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-[32px] border border-[#0a1e8c]/12 bg-white shadow-[0_24px_70px_rgba(10,30,140,0.08)]">
        <div className="border-b border-[#0a1e8c]/10 bg-[#f8fbff] px-6 py-5 sm:px-8">
          <p className="text-sm font-semibold text-[#4a5b86]">
            Manage and showcase the professional and technical skills you’ve acquired during your university activities.
          </p>
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-[#4a5b86]">
              <p className="font-medium">Loading skills...</p>
            </div>
          ) : renderedSkills.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-[#0a1e8c]/15 bg-[#f8fbff] px-6 py-14 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
                ✨
              </div>
              <h2 className="text-2xl font-black text-[#0a1e8c]">No skills added yet</h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#516072]">
                Add your first skill to build a stronger profile and highlight what you can do best.
              </p>
              <Link
                to="/skills/add"
                className="mt-6 inline-flex items-center rounded-2xl bg-[#0a1e8c] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#081770]"
              >
                Add a skill
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {renderedSkills.map((skill, index) => {
                const resolvedSkillId = skill?.id || '';
                const skillLabel = skill?.name;

                return (
                  <article
                    key={resolvedSkillId || skillLabel || index}
                    className="group rounded-[24px] border border-[#0a1e8c]/12 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(10,30,140,0.08)]"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#0a1e8c]/15 bg-[#f5f8ff] text-base font-black text-[#0a1e8c]">
                          {index + 1}
                        </div>

                        <div>
                          <h3 className="text-lg font-black text-[#0a1e8c] sm:text-xl">
                            {skillLabel || 'Unknown Skill'}
                          </h3>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${getProficiencyTone(skill?.proficiency)}`}>
                              {skill?.proficiency || 'Intermediate'}
                            </span>
                            {skill?.category && (
                              <span className="rounded-full border border-[#0a1e8c]/15 bg-[#f8fbff] px-2.5 py-0.5 text-[11px] font-bold text-[#4a5b86]">
                                {skill.category.replace('_', ' ')}
                              </span>
                            )}
                          </div>

                          {skill?.relatedActivity && (
                            <p className="mt-2 text-sm leading-5 text-[#516072]">
                              <span className="font-semibold text-[#0a1e8c]">Linked activity:</span> {skill.relatedActivity}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemove(resolvedSkillId)}
                        disabled={!resolvedSkillId || removingId === resolvedSkillId}
                        className="inline-flex items-center justify-center rounded-2xl border border-[#f37021]/25 bg-[#fff4ec] px-3.5 py-2 text-sm font-bold text-[#f37021] transition hover:bg-[#ffe9db] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {removingId === resolvedSkillId ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  </div>
);
};

export default SkillsListPage;
