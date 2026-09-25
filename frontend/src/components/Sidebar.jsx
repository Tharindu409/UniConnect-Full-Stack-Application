import React from 'react';
import { Link } from 'react-router-dom';

const SidebarLink = ({ to, label, icon: Icon, active, collapsed }) => {
  return (
    <Link
      to={to}
      className={`
        group relative flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
        focus:outline-none focus:ring-2 focus:ring-[#f37021]/40
        ${
          active
            ? 'bg-white text-[#0a1e8c] shadow-lg shadow-[#0a1e8c]/10 border border-[#0a1e8c]/20 translate-x-1'
            : 'text-white/80 hover:bg-[#0a1e8c] hover:text-white hover:shadow-sm hover:translate-x-1 border border-transparent'
        }
      `}
    >
      {active && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-white via-white to-white opacity-100" />
      )}

      <div
        className={`
          relative z-10 flex items-center justify-center transition-all duration-300
          ${
            active
              ? 'scale-110 text-[#0a1e8c]'
              : 'group-hover:scale-110 group-hover:text-white'
          }
        `}
      >
        <div
          className={`
            pointer-events-none absolute inset-0 rounded-xl blur-md opacity-0 transition
            ${
              active
                ? 'opacity-30 bg-[#0a1e8c]'
                : 'group-hover:opacity-20 bg-[#f37021]'
            }
          `}
        />

        <Icon
          size={20}
          strokeWidth={active ? 2.5 : 2}
          className="relative z-10 shrink-0"
        />
      </div>

      {!collapsed && (
        <div className="relative z-10 flex items-center justify-between flex-1 min-w-0">
          <span
            className={`truncate text-[13px] font-bold tracking-tight whitespace-nowrap transition-all duration-300 ${
              active ? 'text-[#0a1e8c]' : 'text-inherit'
            }`}
          >
            {label}
          </span>

          {active && (
            <span className="ml-3 h-2 w-2 shrink-0 rounded-full bg-[#f37021] shadow-[0_0_10px_rgba(243,112,33,0.6)]" />
          )}
        </div>
      )}

      {active && collapsed && (
        <span className="absolute right-2 z-10 h-2 w-2 rounded-full bg-[#f37021] shadow-lg shadow-[#f37021]/40 animate-pulse" />
      )}

      {collapsed && (
        <div className="pointer-events-none absolute left-full ml-4 px-3 py-1.5 bg-[#0a1e8c] text-white text-[11px] font-black rounded-xl opacity-0 invisible -translate-x-2 group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap z-[120] shadow-xl border border-[#f37021]/20 uppercase tracking-widest">
          {label}
        </div>
      )}

      {active && !collapsed && (
        <div className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#f37021] rounded-r-full shadow-[0_0_10px_rgba(243,112,33,0.7)] z-10" />
      )}
    </Link>
  );
};

export default SidebarLink;