import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RefreshCw, Sun, Moon } from 'lucide-react';
import { User, Announcement, Note, Test, Result, Attendance, Fee, DashboardTab } from './types';
import Login from './components/Login';
import TopNavbar from './components/TopNavbar';
import DashboardOverview from './components/DashboardOverview';
import AnnouncementsView from './components/AnnouncementsView';
import AttendanceView from './components/AttendanceView';
import NotesView from './components/NotesView';
import TestsView from './components/TestsView';
import ResultsView from './components/ResultsView';
import FeesView from './components/FeesView';
import StudentsListView from './components/StudentsListView';
import AdminPanelView from './components/AdminPanelView';
import FacultyView from './components/FacultyView';
import GemAssistantView from './components/GemAssistantView';

export default function App() {
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('apex_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // Toggle Theme helper
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Sync theme with HTML root class
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('apex_theme', theme);
  }, [theme]);

  // Session Recovery
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('apex_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
    const saved = localStorage.getItem('apex_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as User;
        if (parsed.role === 'admin') return 'admin_panel';
      } catch (e) {
        // ignore
      }
    }
    return 'overview';
  });
  
  // Database States
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [students, setStudents] = useState<User[]>([]);

  // Sync / Loading state
  const [syncing, setSyncing] = useState(false);

  // Floating AI Chatbot overlay state
  const [isFloatingGemOpen, setIsFloatingGemOpen] = useState(false);

  // Sync data from Express server
  const syncDatabase = async (currentUser: User) => {
    if (!currentUser) return;
    setSyncing(true);

    const headers = {
      'x-user-id': currentUser.id,
      'x-user-role': currentUser.role,
      'Content-Type': 'application/json'
    };

    try {
      // Parallel fetches for efficiency
      const [annRes, notesRes, testsRes, resultsRes, attRes, feesRes] = await Promise.all([
        fetch('/api/announcements', { headers }),
        fetch('/api/notes', { headers }),
        fetch('/api/tests', { headers }),
        fetch('/api/results', { headers }),
        fetch('/api/attendance', { headers }),
        fetch('/api/fees', { headers })
      ]);

      const [annData, notesData, testsData, resultsData, attData, feesData] = await Promise.all([
        annRes.json(),
        notesRes.json(),
        testsRes.json(),
        resultsRes.json(),
        attRes.json(),
        feesRes.json()
      ]);

      if (annRes.ok) setAnnouncements(annData);
      if (notesRes.ok) setNotes(notesData);
      if (testsRes.ok) setTests(testsData);
      if (resultsRes.ok) setResults(resultsData);
      if (attRes.ok) setAttendance(attData);
      if (feesRes.ok) setFees(feesData);

      // If user is teacher or admin, also load active students roster
      if (currentUser.role === 'teacher' || currentUser.role === 'admin') {
        const studRes = await fetch('/api/students', { headers });
        if (studRes.ok) {
          const studData = await studRes.json();
          setStudents(studData);
        }
      }
    } catch (error) {
      console.error('Error syncing database stats:', error);
    } finally {
      setSyncing(false);
    }
  };

  // Sync on mount or user changes
  useEffect(() => {
    if (user) {
      syncDatabase(user);
    }
  }, [user]);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('apex_user', JSON.stringify(loggedInUser));
    setActiveTab(loggedInUser.role === 'admin' ? 'admin_panel' : 'overview');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('apex_user');
    // Reset local cache
    setAnnouncements([]);
    setNotes([]);
    setTests([]);
    setResults([]);
    setAttendance([]);
    setFees([]);
    setStudents([]);
    setActiveTab('overview');
  };

  // Helper trigger for sub-components to refresh datasets
  const handleRefresh = async () => {
    if (user) {
      await syncDatabase(user);
    }
  };

  // Switch rendered tabs
  const renderTabContent = () => {
    if (!user) return null;

    switch (activeTab) {
      case 'overview':
        return (
          <DashboardOverview
            user={user}
            announcements={announcements}
            notes={notes}
            tests={tests}
            results={results}
            attendance={attendance}
            fees={fees}
            setActiveTab={setActiveTab}
          />
        );
      case 'announcements':
        return (
          <AnnouncementsView
            user={user}
            announcements={announcements}
            onRefresh={handleRefresh}
          />
        );
      case 'attendance':
        return (
          <AttendanceView
            user={user}
            attendance={attendance}
            students={students}
            onRefresh={handleRefresh}
          />
        );
      case 'notes':
        return (
          <NotesView
            user={user}
            notes={notes}
            onRefresh={handleRefresh}
          />
        );
      case 'tests':
        return (
          <TestsView
            user={user}
            tests={tests}
            onRefresh={handleRefresh}
          />
        );
      case 'results':
        return (
          <ResultsView
            user={user}
            tests={tests}
            students={students}
            results={results}
            onRefresh={handleRefresh}
          />
        );
      case 'fees':
        if (user.role === 'admin') {
          return (
            <FeesView
              user={user}
              students={students}
              fees={fees}
              onRefresh={handleRefresh}
            />
          );
        }
        return null;
      case 'students':
        if (user.role === 'teacher' || user.role === 'admin') {
          return <StudentsListView students={students} />;
        }
        return null;
      case 'admin_panel':
        if (user.role === 'admin') {
          return <AdminPanelView user={user} onRefresh={handleRefresh} />;
        }
        return null;
      case 'faculty':
        if (user.role === 'admin') {
          return <FacultyView user={user} onRefresh={handleRefresh} />;
        }
        return null;
      case 'ai_gem':
        return (
          <GemAssistantView
            user={user}
            notes={notes}
            tests={tests}
            announcements={announcements}
            onRefresh={handleRefresh}
          />
        );
      default:
        return null;
    }
  };

  // Render Login page if session is missing
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} theme={theme} onToggleTheme={toggleTheme} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans relative">
      
      {/* Top Navigation Bar with branding & quick actions */}
      <TopNavbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
        syncing={syncing}
        onRefresh={handleRefresh}
      />

      {/* Dynamic content rendering with modern fluid layout */}
      <main className="flex-1 p-5 sm:p-8 md:p-10 overflow-y-auto w-full max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating AI Gem Chatbot Button (Accessible from any tab) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsFloatingGemOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500 hover:from-indigo-500 hover:to-amber-400 text-white font-bold rounded-full shadow-[0_0_25px_rgba(99,102,241,0.5)] border border-amber-300/40 transition-all transform hover:scale-105 cursor-pointer"
          title="Open AI Gem Chatbot"
        >
          <Sparkles className="h-5 w-5 animate-pulse" />
          <span className="hidden sm:inline text-xs font-extrabold tracking-wider uppercase">AI Gem Chat</span>
        </button>
      </div>

      {/* Floating AI Gem Assistant Modal Overlay */}
      <AnimatePresence>
        {isFloatingGemOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-3xl"
            >
              <GemAssistantView
                user={user}
                notes={notes}
                tests={tests}
                announcements={announcements}
                onRefresh={handleRefresh}
                isFloatingModal={true}
                onCloseModal={() => setIsFloatingGemOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
