import React, { useState } from 'react';
import { 
  GraduationCap, 
  LayoutDashboard, 
  Bell, 
  CalendarCheck, 
  BookOpen, 
  FileSpreadsheet, 
  FileText, 
  CreditCard, 
  Users, 
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  RefreshCw,
  Sparkles,
  Calculator,
  ShieldCheck
} from 'lucide-react';
import { User, DashboardTab } from '../types';

interface TopNavbarProps {
  user: User;
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  syncing: boolean;
  onRefresh: () => void;
}

export default function TopNavbar({ 
  user, 
  activeTab, 
  setActiveTab, 
  onLogout, 
  theme, 
  onToggleTheme,
  syncing,
  onRefresh
}: TopNavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { 
      id: 'overview', 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      roles: ['student', 'teacher'],
      activeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.1)] font-extrabold',
      hoverClass: 'hover:text-emerald-200 hover:bg-emerald-500/5 hover:border-emerald-500/20',
      mobileActiveClass: 'bg-emerald-500/10 text-emerald-400'
    },
    { 
      id: 'announcements', 
      label: 'Announcements', 
      icon: Bell, 
      roles: ['student', 'teacher', 'admin'],
      activeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.1)] font-extrabold',
      hoverClass: 'hover:text-amber-200 hover:bg-amber-500/5 hover:border-amber-500/20',
      mobileActiveClass: 'bg-amber-500/10 text-amber-400'
    },
    { 
      id: 'attendance', 
      label: 'Attendance', 
      icon: CalendarCheck, 
      roles: ['student', 'teacher'],
      activeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/40 shadow-[0_0_12px_rgba(14,165,233,0.1)] font-extrabold',
      hoverClass: 'hover:text-sky-200 hover:bg-sky-500/5 hover:border-sky-500/20',
      mobileActiveClass: 'bg-sky-500/10 text-sky-400'
    },
    { 
      id: 'notes', 
      label: 'Study Notes', 
      icon: BookOpen, 
      roles: ['student', 'teacher'],
      activeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.1)] font-extrabold',
      hoverClass: 'hover:text-purple-200 hover:bg-purple-500/5 hover:border-purple-500/20',
      mobileActiveClass: 'bg-purple-500/10 text-purple-400'
    },
    { 
      id: 'tests', 
      label: 'Tests Schedule', 
      icon: FileSpreadsheet, 
      roles: ['student', 'teacher'],
      activeClass: 'bg-pink-500/15 text-pink-300 border-pink-500/40 shadow-[0_0_12px_rgba(236,72,153,0.1)] font-extrabold',
      hoverClass: 'hover:text-pink-200 hover:bg-pink-500/5 hover:border-pink-500/20',
      mobileActiveClass: 'bg-pink-500/10 text-pink-400'
    },
    { 
      id: 'results', 
      label: 'Exam Results', 
      icon: FileText, 
      roles: ['student', 'teacher'],
      activeClass: 'bg-orange-500/15 text-orange-300 border-orange-500/40 shadow-[0_0_12px_rgba(249,115,22,0.1)] font-extrabold',
      hoverClass: 'hover:text-orange-200 hover:bg-orange-500/5 hover:border-orange-500/20',
      mobileActiveClass: 'bg-orange-500/10 text-orange-400'
    },
    { 
      id: 'fees', 
      label: 'Fees & Billing', 
      icon: CreditCard, 
      roles: ['admin'],
      activeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.1)] font-extrabold',
      hoverClass: 'hover:text-rose-200 hover:bg-rose-500/5 hover:border-rose-500/20',
      mobileActiveClass: 'bg-rose-500/10 text-rose-400'
    },
    { 
      id: 'faculty', 
      label: 'Faculty', 
      icon: GraduationCap, 
      roles: ['admin'],
      activeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.1)] font-extrabold',
      hoverClass: 'hover:text-indigo-200 hover:bg-indigo-500/5 hover:border-indigo-500/20',
      mobileActiveClass: 'bg-indigo-500/10 text-indigo-400'
    },
    { 
      id: 'students', 
      label: 'Students List', 
      icon: Users, 
      roles: ['teacher'],
      activeClass: 'bg-teal-500/15 text-teal-300 border-teal-500/40 shadow-[0_0_12px_rgba(20,184,166,0.1)] font-extrabold',
      hoverClass: 'hover:text-teal-200 hover:bg-teal-500/5 hover:border-teal-500/20',
      mobileActiveClass: 'bg-teal-500/10 text-teal-400'
    },
    { 
      id: 'admin_panel', 
      label: 'System Logins', 
      icon: ShieldCheck, 
      roles: ['admin'],
      activeClass: 'bg-violet-500/15 text-violet-300 border-violet-500/40 shadow-[0_0_12px_rgba(139,92,246,0.1)] font-extrabold',
      hoverClass: 'hover:text-violet-200 hover:bg-violet-500/5 hover:border-violet-500/20',
      mobileActiveClass: 'bg-violet-500/10 text-violet-400'
    },
    { 
      id: 'ai_gem', 
      label: 'AI Gem Assistant', 
      icon: Sparkles, 
      roles: ['student', 'teacher', 'admin'],
      activeClass: 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-amber-300 border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.25)] font-extrabold animate-pulse',
      hoverClass: 'hover:text-amber-200 hover:bg-amber-500/10 hover:border-amber-400/30',
      mobileActiveClass: 'bg-amber-500/10 text-amber-300 font-bold'
    },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user.role));

  const handleTabClick = (tabId: DashboardTab) => {
    setActiveTab(tabId);
    setIsOpen(false);
  };

  return (
    <header className="w-full bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 text-white shadow-md border-b border-indigo-900/40 sticky top-0 z-50 overflow-hidden">
      {/* Subtle Grid Texture Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-40" />
      
      {/* Ambient Glows */}
      <div className="absolute -top-6 right-1/4 w-96 h-24 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-6 left-1/3 w-72 h-20 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Multicolor Top Stripe */}
      <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-amber-400 via-emerald-400 via-cyan-400 via-indigo-500 to-pink-500 relative z-10" />
      
      {/* Upper Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500/20 to-rose-500/20 rounded-lg border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <Calculator className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-wider uppercase text-white bg-gradient-to-r from-amber-200 via-rose-200 to-indigo-200 bg-clip-text">
                  Math Is Fun Academy
                </span>
                <span className="hidden sm:inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse animate-duration-1000" title="Portal Active" />
              </div>
              <p className="text-[10px] text-amber-300 font-mono tracking-wider uppercase">Interactive Math Tuition</p>
            </div>
          </div>

          {/* Center-Left Navigation Tabs for Desktop */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 ml-6">
            {filteredItems.map(item => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id as DashboardTab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border cursor-pointer ${
                    isActive
                      ? `${item.activeClass}`
                      : `text-slate-300 border-transparent ${item.hoverClass}`
                  }`}
                >
                  <IconComponent className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Area Controls for Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {/* Sync DB Button */}
            <button
              onClick={onRefresh}
              disabled={syncing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-200 hover:text-white border border-indigo-800/40 text-[11px] font-bold tracking-wider uppercase transition cursor-pointer"
              title="Synchronize database records"
            >
              <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{syncing ? 'Syncing' : 'Sync Portal'}</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-md bg-indigo-900/40 hover:bg-indigo-900/70 text-indigo-200 hover:text-white border border-indigo-800/40 transition cursor-pointer"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon className="h-4 w-4 text-indigo-300" /> : <Sun className="h-4 w-4 text-amber-400" />}
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-indigo-900/40">
              <div className="h-8 w-8 rounded-full bg-indigo-900 border border-indigo-800/40 flex items-center justify-center font-bold text-xs text-white shadow-xs">
                {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div className="text-left hidden lg:block max-w-[100px]">
                <h4 className="font-semibold text-xs text-slate-100 truncate">{user.name}</h4>
                <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-indigo-300">
                  {user.role}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="p-1.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-200 hover:text-rose-100 border border-rose-500/10 transition cursor-pointer"
              title="Sign Out of Portal"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {/* Hamburger Menu & Mobile Action Buttons */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onToggleTheme}
              className="p-1.5 text-indigo-200 hover:text-white cursor-pointer"
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5 text-amber-400" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 text-indigo-200 hover:text-white cursor-pointer focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Underbar Horizontal Navigation (Only shown on medium screens MD but hidden on LG/XL to keep primary cleaner) */}
      <div className="hidden md:block lg:hidden bg-slate-950/40 border-t border-indigo-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 overflow-x-auto scrollbar-none">
          <nav className="flex items-center gap-2 whitespace-nowrap">
            {filteredItems.map(item => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id as DashboardTab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border cursor-pointer ${
                    isActive
                      ? `${item.activeClass}`
                      : `text-slate-300 border-transparent ${item.hoverClass}`
                  }`}
                >
                  <IconComponent className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Drawer Menu Content */}
      <div className={`fixed top-16 right-0 left-0 bg-slate-950 text-slate-100 border-b border-indigo-900/60 shadow-xl transition-all duration-300 md:hidden z-50 transform origin-top ${
        isOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 pointer-events-none'
      }`}>
        <div className="px-4 py-3 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* User Info Header */}
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-indigo-950 to-slate-900 rounded-lg border border-indigo-900/40">
            <div className="h-10 w-10 rounded-full bg-indigo-900 flex items-center justify-center font-bold text-sm text-white border border-indigo-800/50">
              {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">{user.name}</h4>
              <p className="text-xs text-indigo-300">{user.email}</p>
              <div className="flex gap-1.5 mt-1">
                <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-[9px] font-mono rounded">
                  {user.role}
                </span>
                {user.role === 'student' && user.class && (
                  <span className="px-1.5 py-0.5 bg-slate-950 text-indigo-400 border border-indigo-800/60 text-[9px] font-mono rounded">
                    {user.class}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tabs Listing */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-2 mb-1.5">Navigation Menu</p>
            {filteredItems.map(item => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id as DashboardTab)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition duration-150 border cursor-pointer ${
                    isActive
                      ? `${item.activeClass}`
                      : `text-slate-300 border-transparent ${item.hoverClass}`
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="pt-3 border-t border-indigo-900/40 space-y-2">
            <button
              onClick={() => {
                onRefresh();
                setIsOpen(false);
              }}
              disabled={syncing}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-900 hover:bg-indigo-800 text-white rounded text-xs font-bold transition cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Sync Portal Data'}</span>
            </button>

            <button
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-950/40 hover:bg-red-900/30 text-red-300 hover:text-red-200 border border-red-950 rounded text-xs font-bold transition cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out of Portal</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
