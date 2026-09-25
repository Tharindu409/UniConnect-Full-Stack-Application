import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ADMIN_LINKS = [
  { to: '/admin', label: 'Admin Dashboard' },
  { to: '/manage-news', label: 'Manage News' },
  { to: '/upload-project', label: 'Upload Project' },
];

const isActiveRoute = (pathname, target) => {
  if (target === '/manage-news') {
    return pathname.startsWith('/manage-news');
  }
  return pathname === target;
};

export default function AdminPagesTopBar({ title, subtitle }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <section className="mb-8 rounded-2xl border border-[#0a1e8c]/10 bg-gradient-to-r from-white via-[#f7faff] to-[#fff6ef] p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#4a5b86]">
            Admin Workspace
          </p>
          <h1 className="mt-1 text-2xl font-black text-[#0a1e8c]">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-[#4a5b86]">{subtitle}</p> : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {ADMIN_LINKS.map((link) => {
            const active = isActiveRoute(location.pathname, link.to);

            return (
              <button
                key={link.to}
                type="button"
                onClick={() => navigate(link.to)}
                className={
                  active
                    ? 'rounded-xl bg-[#0a1e8c] px-4 py-2 text-xs font-bold text-white shadow'
                    : 'rounded-xl border border-[#0a1e8c]/15 bg-white px-4 py-2 text-xs font-bold text-[#0a1e8c] hover:bg-[#f5f8ff]'
                }
              >
                {link.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
