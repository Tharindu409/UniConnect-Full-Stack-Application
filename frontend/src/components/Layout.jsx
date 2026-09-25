import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  Zap,
  Trophy,
  LogOut,
  ShieldCheck,
  Settings,
  CalendarDays,
  Calendar,
  Newspaper,
  FolderKanban,
  BarChart3,
  Layers3,
  Compass,
  Wrench,
} from 'lucide-react';
import SidebarLink from './Sidebar';
import Header from './Header';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (error) {
      return {};
    }
  })();

  const userRole = storedUser.role || storedUser?.user?.role || '';
  const canSeeAdminPanel =
    userRole === 'SYSTEM_ADMIN' ||
    userRole === 'CLUB_ADMIN' ||
    userRole === 'ADMIN';

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280 && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
      if (window.innerWidth >= 1280 && !isSidebarOpen) {
        setIsSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  const navigation = [
    {
      section: 'Core',
      icon: Layers3,
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/profile', label: 'Profile', icon: User },
        { to: '/skills', label: 'Skills', icon: Zap },
        { to: '/badges', label: 'Badges', icon: Trophy },
      ],
    },
    {
      section: 'Activities',
      icon: CalendarDays,
      items: [
        { to: '/all-events', label: 'All Events', icon: CalendarDays },
        { to: '/calendar', label: 'Calendar', icon: Calendar },
      ],
    },
    {
      section: 'Community',
      icon: Compass,
      items: [
        { to: '/my-clubs', label: 'My Clubs', icon: ShieldCheck },
        { to: '/club-news', label: 'News', icon: Newspaper },
        { to: '/club-projects', label: 'Projects', icon: FolderKanban },
        { to: '/club-analytics', label: 'Analytics', icon: BarChart3 },
        ...(canSeeAdminPanel
          ? [{ to: '/admin', label: 'Admin Panel', icon: ShieldCheck }]
          : []),
      ],
    },
    {
      section: 'Settings',
      icon: Wrench,
      items: [{ to: '/settings', label: 'Settings', icon: Settings }],
    },
  ];

  const isActiveRoute = (to) => {
    return location.pathname === to;
  };

  const hideSidebarOnRoute =
    location.pathname.startsWith('/manage-news') ||
    location.pathname === '/upload-project';

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#ffffff]">
      {!hideSidebarOnRoute && (
        <>
          {isMobileMenuOpen && (
            <button
              type="button"
              className="fixed inset-0 z-[60] bg-slate-900/50 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close sidebar"
            />
          )}
          {/* Sidebar */}
          <aside
            className={`fixed lg:static inset-y-0 left-0 z-[70] flex flex-col bg-[#0a1e8c] text-white border-r border-[#f37021]/30 transition-all duration-300 ${
              isSidebarOpen ? 'w-72' : 'w-24'
            } ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
          >
            <div className="h-20 flex items-center px-6 border-b border-[#f37021]/30 shrink-0">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="font-black text-xl text-white hover:text-[#f37021] transition bg-transparent border-none p-0 m-0 cursor-pointer"
              >
                {isSidebarOpen ? 'UniConnect' : 'U'}
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-6 sidebar-scrollbar">
              {navigation.map((section, index) => {
                const SectionIcon = section.icon;

                return (
                  <div key={section.section} className="space-y-2">
                    {isSidebarOpen && (
                      <>
                        <p className="px-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-white/70 opacity-90">
                          <SectionIcon size={12} />
                          {section.section}
                        </p>
                        {index !== 0 && (
                          <div className="mx-3 h-px bg-[#f37021]/30" />
                        )}
                      </>
                    )}

                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <SidebarLink
                          key={item.to}
                          to={item.to}
                          label={item.label}
                          icon={item.icon}
                          active={isActiveRoute(item.to)}
                          collapsed={!isSidebarOpen}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </nav>

            <div className="p-4 border-t border-[#f37021]/30 shrink-0">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-[#f37021] hover:text-white font-bold transition"
              >
                <LogOut size={18} />
                {isSidebarOpen && 'Logout'}
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {!hideSidebarOnRoute && (
          <Header
            onToggleSidebar={() => setIsMobileMenuOpen((v) => !v)}
            userName={storedUser.fullName || storedUser.name}
            avatar={storedUser.avatar}
            onLogout={handleLogout}
          />
        )}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 animate-in fade-in slide-in-from-bottom-2 duration-500 bg-[#ffffff] text-[#0a1e8c]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;