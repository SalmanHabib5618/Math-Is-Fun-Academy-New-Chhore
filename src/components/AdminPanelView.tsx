import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  UserPlus, 
  Trash2, 
  Edit3, 
  Mail, 
  Key, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  GraduationCap, 
  Briefcase, 
  CreditCard, 
  Calendar, 
  BookOpen, 
  Bell, 
  FileText,
  Eye,
  EyeOff,
  RefreshCw,
  X,
  Plus,
  TrendingUp,
  Sliders,
  Check,
  UserCheck,
  Database,
  Cloud,
  History,
  Copy,
  Activity,
  Zap,
  Sparkles,
  ShieldCheck,
  Layers,
  BarChart3,
  PieChart
} from 'lucide-react';
import { User, Announcement, Note, Test, Result, Attendance, Fee } from '../types';

interface AdminStats {
  studentsCount: number;
  teachersCount: number;
  adminsCount: number;
  announcementsCount: number;
  notesCount: number;
  testsCount: number;
  gradedResultsCount: number;
  totalFeesInvoiced: number;
  totalFeesPaid: number;
  totalFeesUnpaid: number;
  attendanceRate: number;
}

interface AdminPanelViewProps {
  user: User;
  onRefresh: () => void;
}

export default function AdminPanelView({ user, onRefresh }: AdminPanelViewProps) {
  // Directory state
  const [usersList, setUsersList] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher' | 'admin'>('all');

  // User Creation State
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [newClass, setNewClass] = useState('Grade 10');
  const [newBatch, setNewBatch] = useState('Advanced Physics & Calculus');
  const [newParentContact, setNewParentContact] = useState('');
  const [newSubject, setNewSubject] = useState('Mathematics');
  const [newTeacherContact, setNewTeacherContact] = useState('');

  // Edit User State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [editClass, setEditClass] = useState('');
  const [editBatch, setEditBatch] = useState('');
  const [editParentContact, setEditParentContact] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editTeacherContact, setEditTeacherContact] = useState('');

  // Delete Confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Password Visibility states (map of userId -> boolean)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Google Sheets Integration State
  const [syncing, setSyncing] = useState(false);
  const [creatingDirectSheet, setCreatingDirectSheet] = useState(false);
  const [createdSheetUrl, setCreatedSheetUrl] = useState('');
  const [syncHistory, setSyncHistory] = useState<any[]>([]);
  const [sheetUrl, setSheetUrl] = useState('');
  const [isUpdatingUrl, setIsUpdatingUrl] = useState(false);
  const [showScriptCode, setShowScriptCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const headers = {
    'x-user-id': user.id,
    'x-user-role': user.role,
    'Content-Type': 'application/json'
  };

  const fetchSheetUrl = async () => {
    try {
      const res = await fetch('/api/admin/sheets/config', { headers });
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setSheetUrl(data.scriptUrl);
        }
      }
    } catch (err) {
      console.error('Error fetching sheets script URL:', err);
    }
  };

  const handleUpdateSheetUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingUrl(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/admin/sheets/config', {
        method: 'POST',
        headers,
        body: JSON.stringify({ scriptUrl: sheetUrl })
      });
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && data.success) {
          setSuccessMsg(data.message || 'Google Sheets Web App URL updated successfully.');
          setSheetUrl(data.scriptUrl);
          await fetchSyncHistory();
        } else {
          setError(data.error || 'Failed to update Google Sheets Web App URL.');
        }
      } else {
        const text = await res.text();
        setError(`Failed to update URL (HTTP ${res.status}): ${text.substring(0, 150)}`);
      }
    } catch (err: any) {
      setError(`Failed to update URL: ${err.message || err}`);
    } finally {
      setIsUpdatingUrl(false);
    }
  };

  const fetchSyncHistory = async () => {
    try {
      const res = await fetch('/api/admin/sheets/sync-history', { headers });
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setSyncHistory(data);
        }
      }
    } catch (err) {
      console.error('Error fetching sheets sync history:', err);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/admin/sheets/sync-all', {
        method: 'POST',
        headers
      });
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && data.success) {
          setSuccessMsg(data.message || 'Entire center database synced to Google Sheets successfully.');
          await fetchSyncHistory();
          await fetchAdminData();
        } else {
          setError(data.error || 'Failed to sync database to Google Sheets.');
        }
      } else {
        const text = await res.text();
        if (text.includes('<!doctype') || text.includes('<html')) {
          setError('Sync failure: Google Sheets sync failed because the server or Google Web App returned an HTML login page or 403 Access Denied. Please ensure your Google Apps Script is deployed as a Web App shared with "Anyone".');
        } else {
          setError(`Sync failure (HTTP ${res.status}): ${text.substring(0, 150)}`);
        }
      }
    } catch (err: any) {
      setError(`Sync failure: ${err.message || err}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleDirectCreateSheet = async () => {
    setCreatingDirectSheet(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/admin/sheets/create-direct', {
        method: 'POST',
        headers,
        body: JSON.stringify({ title: 'Math Is Fun Academy - Master Portal Data' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Google Spreadsheet successfully created and populated directly in Google Drive!');
        setCreatedSheetUrl(data.spreadsheetUrl || '');
        await fetchSyncHistory();
      } else {
        setError(data.error || 'Failed to create Google Spreadsheet directly.');
      }
    } catch (err: any) {
      setError(`Direct sheet creation error: ${err.message || err}`);
    } finally {
      setCreatingDirectSheet(false);
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/stats', { headers })
      ]);

      if (!usersRes.ok || !statsRes.ok) {
        throw new Error('Failed to retrieve administrator control datasets.');
      }

      const usersContentType = usersRes.headers.get('content-type');
      const statsContentType = statsRes.headers.get('content-type');

      const usersData = (usersRes.ok && usersContentType && usersContentType.includes('application/json'))
        ? await usersRes.json()
        : [];
      const statsData = (statsRes.ok && statsContentType && statsContentType.includes('application/json'))
        ? await statsRes.json()
        : null;

      setUsersList(usersData);
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching admin portal details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    fetchSyncHistory();
    fetchSheetUrl();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          name: newName,
          role: newRole,
          className: newClass,
          batch: newBatch,
          parentContact: newParentContact,
          subject: newSubject,
          teacherContact: newTeacherContact
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user.');
      }

      setSuccessMsg(`User ${newName} successfully created as ${newRole}!`);
      setIsAddingUser(false);
      
      // Reset creation form
      setNewEmail('');
      setNewPassword('');
      setNewName('');
      setNewRole('student');
      setNewClass('Grade 10');
      setNewBatch('Advanced Physics & Calculus');
      setNewParentContact('');
      setNewSubject('Mathematics');
      setNewTeacherContact('');

      // Refresh datasets
      fetchAdminData();
      onRefresh(); // trigger parent app sync too
    } catch (err: any) {
      setError(err.message || 'Could not register user.');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          email: editEmail,
          password: editPassword || undefined, // send only if modified
          name: editName,
          role: editRole,
          className: editRole === 'student' ? editClass : undefined,
          batch: editRole === 'student' ? editBatch : undefined,
          parentContact: editRole === 'student' ? editParentContact : undefined,
          subject: editRole === 'teacher' ? editSubject : undefined,
          teacherContact: editRole === 'teacher' ? editTeacherContact : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update user.');
      }

      setSuccessMsg(`User ${editName} successfully updated!`);
      setEditingUser(null);
      
      // Refresh
      fetchAdminData();
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Could not update user info.');
    }
  };

  const handleDeleteUser = async (targetId: string) => {
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/admin/users/${targetId}`, {
        method: 'DELETE',
        headers
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete user.');
      }

      setSuccessMsg('User and associated academic history successfully removed.');
      setDeleteConfirmId(null);
      
      // Refresh
      fetchAdminData();
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Could not remove user account.');
    }
  };

  const startEditUser = (u: any) => {
    setEditingUser(u);
    setEditEmail(u.email);
    setEditPassword(''); // empty means keep existing on backend
    setEditName(u.name);
    setEditRole(u.role);
    setEditClass(u.class || 'Grade 10');
    setEditBatch(u.batch || 'Advanced Physics & Calculus');
    setEditParentContact(u.parentContact || '');
    setEditSubject(u.subject || 'Mathematics');
    setEditTeacherContact(u.teacherContact || '');
  };

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const filteredUsers = usersList.filter(u => {
    // Hide admins from the directory list so only Students and Teachers are manageable
    if (u.role === 'admin') return false;

    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.class && u.class.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.batch && u.batch.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'all' ? true : u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8" id="admin-panel-container">
      
      {/* Upper header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Shield className="h-4 w-4" />
            Center Master Admin Dashboard
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Administrative Directory & Metrics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Welcome, Admin. You have superuser privileges to read, write, update passwords, and manage all center details.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition cursor-pointer border border-slate-200 dark:border-slate-700"
          id="admin-refresh-btn"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Reload Portal Datasets
        </button>
      </div>

      {/* Notifications banner */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center justify-between" id="admin-success-alert">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl text-rose-700 dark:text-rose-400 text-xs font-semibold flex items-center justify-between" id="admin-error-alert">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-500 animate-bounce" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Stats Cards Dashboard */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="admin-stats-grid">
          {/* Card 1: Users overview */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs" id="stat-card-users">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Accounts Breakdown</span>
              <div className="p-1.5 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-lg">
                <Users className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3.5 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {stats.studentsCount + stats.teachersCount}
              </span>
              <span className="text-xs text-slate-400 font-medium">Total Registered</span>
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 text-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <div>
                <span className="block text-emerald-500 dark:text-emerald-400 text-xs font-extrabold">{stats.studentsCount}</span>
                Students
              </div>
              <div className="border-l border-slate-100 dark:border-slate-800">
                <span className="block text-indigo-500 dark:text-indigo-400 text-xs font-extrabold">{stats.teachersCount}</span>
                Teachers
              </div>
            </div>
          </div>

          {/* Card 2: Academic assets count */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs" id="stat-card-resources">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Educational Activity</span>
              <div className="p-1.5 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 rounded-lg">
                <BookOpen className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3.5 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {stats.notesCount + stats.testsCount}
              </span>
              <span className="text-xs text-slate-400 font-medium">Active Resources</span>
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 text-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <div>
                <span className="block text-amber-500 dark:text-amber-400 text-xs font-extrabold">{stats.announcementsCount}</span>
                Announce
              </div>
              <div className="border-x border-slate-100 dark:border-slate-800">
                <span className="block text-purple-500 dark:text-purple-400 text-xs font-extrabold">{stats.notesCount}</span>
                Notes
              </div>
              <div>
                <span className="block text-pink-500 dark:text-pink-400 text-xs font-extrabold">{stats.testsCount}</span>
                Tests
              </div>
            </div>
          </div>

          {/* Card 3: Financial summaries */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs" id="stat-card-finance">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Tuition Fees Overview</span>
              <div className="p-1.5 bg-rose-500/10 text-rose-500 dark:text-rose-400 rounded-lg">
                <CreditCard className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3.5 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Rs. {stats.totalFeesInvoiced.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 font-medium">Total Invoiced</span>
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 text-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <div className="border-r border-slate-100 dark:border-slate-800">
                <span className="block text-emerald-500 dark:text-emerald-400 text-xs font-extrabold">Rs. {stats.totalFeesPaid}</span>
                Paid Recvd
              </div>
              <div>
                <span className="block text-rose-500 dark:text-rose-400 text-xs font-extrabold">Rs. {stats.totalFeesUnpaid}</span>
                Due Outstanding
              </div>
            </div>
          </div>

          {/* Card 4: Attendance rate */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs" id="stat-card-attendance">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Attendance Rate</span>
              <div className="p-1.5 bg-sky-500/10 text-sky-500 dark:text-sky-400 rounded-lg">
                <Calendar className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3.5">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {stats.attendanceRate}%
              </span>
              <span className="text-xs text-slate-400 font-medium ml-2">Global Attendance</span>
            </div>
            <div className="mt-4">
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-sky-500 to-indigo-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${stats.attendanceRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Center Command & Real-Time Operational Health Hub */}
      {stats && (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white rounded-2xl p-6 border border-indigo-900/40 shadow-xl relative overflow-hidden my-6" id="center-command-hub">
          {/* Subtle Ambient Light Gradients */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header Row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-800/80 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <Activity className="h-6 w-6 text-indigo-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white tracking-tight">Center Command & Operational Radar</h2>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Live Health 98%
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Real-time center telemetry, batch health scores, and automated fee realization metrics.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleManualSync}
                disabled={syncing}
                className="px-3 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl border border-indigo-500/40 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Zap className="h-3.5 w-3.5 text-amber-300" />
                <span>Instant Cloud Mirror</span>
              </button>
            </div>
          </div>

          {/* Grid Layout: 3 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 relative z-10">
            {/* Column 1: Financial Realization Radar */}
            <div className="bg-slate-900/80 backdrop-blur-xs p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-indigo-400" /> Revenue Realization Radar
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {((stats.totalFeesPaid / (stats.totalFeesInvoiced || 1)) * 100).toFixed(1)}% Yield
                  </span>
                </div>

                <div className="my-3">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-2xl font-black text-white">Rs. {stats.totalFeesPaid.toLocaleString()}</span>
                    <span className="text-[11px] text-slate-400 font-medium">of Rs. {stats.totalFeesInvoiced.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800 p-0.5">
                    <div
                      className="bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (stats.totalFeesPaid / (stats.totalFeesInvoiced || 1)) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Collected Revenue</span>
                    <span className="font-bold text-emerald-400">Rs. {stats.totalFeesPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pending Invoices</span>
                    <span className="font-bold text-amber-400">Rs. {stats.totalFeesUnpaid.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                <span>Collection Target</span>
                <span className="text-indigo-300 font-semibold flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-400" /> High Yield State
                </span>
              </div>
            </div>

            {/* Column 2: Active Batches & Class Health */}
            <div className="bg-slate-900/80 backdrop-blur-xs p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-purple-400" /> Active Center Batches
                  </span>
                  <span className="text-xs font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                    3 Batches
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-bold text-slate-200 text-xs">Physics & Calculus</h4>
                      <p className="text-[10px] text-slate-400">Grade 10-12 • Morning Batch</p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/20">
                      96% Present
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-bold text-slate-200 text-xs">Foundation Math</h4>
                      <p className="text-[10px] text-slate-400">Grade 9 • Evening Batch</p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/20">
                      92% Present
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-bold text-slate-200 text-xs">Weekend Test Series</h4>
                      <p className="text-[10px] text-slate-400">All Grades • Special Batch</p>
                    </div>
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold rounded border border-indigo-500/20">
                      Scheduled
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                <span>Class Attendance Index</span>
                <span className="font-bold text-sky-400">{stats.attendanceRate}% Active</span>
              </div>
            </div>

            {/* Column 3: Security & Data Connectivity Guard */}
            <div className="bg-slate-900/80 backdrop-blur-xs p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" /> Security & Sync Matrix
                  </span>
                  <span className="text-xs font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    Encrypted
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Cloud className="h-3.5 w-3.5 text-emerald-400" /> Google Sheets Mirror
                    </span>
                    <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[10px]">
                      Connected
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-indigo-400" /> Active System Logins
                    </span>
                    <span className="font-bold text-indigo-300">
                      {stats.studentsCount + stats.teachersCount + stats.adminsCount} Accounts
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-purple-400" /> Published Material
                    </span>
                    <span className="font-bold text-purple-300">
                      {stats.notesCount + stats.testsCount} Files
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                <span>System Role Guard</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Admin Protected
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google Sheets Sync Hub */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs" id="sheets-sync-hub">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Cloud className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Google Sheets Sync Hub</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Sync teacher/student logins, billing records, and announcements directly to spreadsheet</p>
            </div>
          </div>
          {syncHistory.some(log => log.status === 'FAILED') ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full text-xs font-bold animate-pulse" id="sheets-sync-status-badge">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              Sync Failing
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold" id="sheets-sync-status-badge">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Connected & Active
            </div>
          )}
        </div>

        {syncHistory.some(log => log.status === 'FAILED') && (
          <div className="mb-6 p-4.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl text-rose-800 dark:text-rose-300 text-xs flex flex-col gap-2" id="sheets-sync-failure-alert-card">
            <div className="flex items-center gap-2 font-black text-rose-700 dark:text-rose-400">
              <AlertCircle className="h-4.5 w-4.5 text-rose-500 animate-bounce" />
              <span>Google Sheets Sync is failing! Google Web App returned an HTML login page.</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
              Google Apps Script returned an HTML page instead of JSON. This is usually a 403 or login redirect, meaning your Apps Script Web App sharing settings are private. 
              Please scroll down to the troubleshooting guide below to configure "Who has access" to "Anyone" and redeploy.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls */}
          <div className="lg:col-span-5 space-y-4">
            <form onSubmit={handleUpdateSheetUrl} className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200/50 dark:border-slate-85/50 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-violet-500" />
                Configure Google Web App URL
              </h4>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Google Apps Script Web App Endpoint</label>
                <input
                  type="url"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  required
                  className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingUrl}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  isUpdatingUrl 
                    ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                }`}
              >
                {isUpdatingUrl ? 'Updating Web App URL...' : 'Save & Update Script URL'}
              </button>
            </form>

            <button
              onClick={handleManualSync}
              disabled={syncing}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
                syncing
                  ? 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Force Syncing Datasets...' : 'Trigger Full Database Sync'}
            </button>

            <button
              onClick={handleDirectCreateSheet}
              disabled={creatingDirectSheet}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
                creatingDirectSheet
                  ? 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
              }`}
            >
              <Cloud className={`h-4 w-4 ${creatingDirectSheet ? 'animate-bounce' : ''}`} />
              {creatingDirectSheet ? 'Creating Google Sheet in Drive...' : 'Create & Export New Sheet to Google Drive'}
            </button>

            {createdSheetUrl && (
              <a
                href={createdSheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between hover:underline transition"
              >
                <span>📊 Open Direct Google Spreadsheet in Drive</span>
                <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold">Open</span>
              </a>
            )}
          </div>

          {/* Log / History */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200/50 dark:border-slate-85/50 overflow-hidden flex flex-col h-[230px]">
              <div className="p-3 bg-slate-100/70 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-800/60 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5 text-indigo-500" />
                  Background Sync History Log
                </span>
                <button 
                  onClick={fetchSyncHistory} 
                  className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Refresh Log
                </button>
              </div>

              <div className="p-3 overflow-y-auto space-y-2 flex-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {syncHistory.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400 dark:text-slate-500">
                    No sync triggers recorded in this session yet. Perform an action (like updating a user, creating an announcement, or marking a fee paid) to trigger real-time log pushes.
                  </div>
                ) : (
                  syncHistory.map((log, index) => (
                    <div 
                      key={index}
                      className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded-sm font-black text-[9px] uppercase tracking-wide ${
                            log.action === 'login' ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300' :
                            log.action === 'create' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' :
                            log.action === 'pay' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' :
                            'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300'
                          }`}>
                            {log.action}
                          </span>
                          <span className="font-bold text-slate-700 dark:text-slate-300 capitalize">{log.type}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 break-words line-clamp-2">
                          {log.details}
                        </p>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1 shrink-0">
                        <span className={`px-1.5 py-0.5 rounded-full font-black text-[9px] ${
                          log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' :
                          log.status === 'PENDING' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' :
                          'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
                        }`}>
                          {log.status}
                        </span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Warning & Troubleshooting Instructions for 403 / Access Denied Errors */}
        <div className="mt-6 p-5 bg-amber-50 dark:bg-amber-950/10 border border-amber-200/60 dark:border-amber-800/20 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">Fixing "Access Denied / HTTP 403" Errors</h4>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                Google Apps Script Web Apps require strict authorization configurations to allow background webhooks to sync successfully. If your sync events fail with a <code className="font-mono bg-amber-100 dark:bg-amber-900/30 px-1 py-0.5 rounded text-rose-600 dark:text-rose-400 font-bold">403</code> or <code className="font-mono bg-amber-100 dark:bg-amber-900/30 px-1 py-0.5 rounded text-rose-600 dark:text-rose-400 font-bold">Access Denied</code> error, follow these steps to fix your Google deployment:
              </p>
              
              <ol className="list-decimal list-inside text-xs space-y-2 text-amber-800/90 dark:text-amber-300/90 pl-1 mt-2">
                <li>
                  Open your <strong className="text-amber-900 dark:text-amber-400">Google Apps Script project</strong> at <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-amber-700">script.google.com</a>.
                </li>
                <li>
                  At the top right, click the blue <strong className="text-amber-900 dark:text-amber-400">Deploy</strong> button and choose <strong className="text-amber-900 dark:text-amber-400">New deployment</strong> (or <strong className="text-amber-900 dark:text-amber-400">Manage deployments</strong>).
                </li>
                <li>
                  Make sure the cog icon has selected <strong className="text-amber-900 dark:text-amber-400">Web app</strong>.
                </li>
                <li>
                  Configure the two critical settings exactly like this:
                  <ul className="list-disc list-inside pl-5 mt-1 space-y-1">
                    <li>Execute as: <strong className="text-amber-950 dark:text-amber-200">Me (your-email@gmail.com)</strong></li>
                    <li>Who has access: <strong className="text-amber-950 dark:text-amber-200 text-emerald-700 dark:text-emerald-400">Anyone</strong> (Do NOT choose "Anyone with Google Account" or "Only myself")</li>
                  </ul>
                </li>
                <li>
                  Click <strong className="text-amber-900 dark:text-amber-400">Deploy</strong>. If prompted, authorize Google permissions.
                </li>
                <li>
                  Copy the newly generated <strong className="text-amber-900 dark:text-amber-400">Web app URL</strong>, paste it into the "Configure Google Web App URL" input field above, and click <strong className="text-amber-900 dark:text-amber-400">Save & Update Script URL</strong>!
                </li>
              </ol>

              {/* Collapsible Apps Script Code Block */}
              <div className="mt-4 border-t border-amber-200/40 pt-4">
                <button
                  onClick={() => setShowScriptCode(!showScriptCode)}
                  type="button"
                  className="px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-400 font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  {showScriptCode ? 'Hide Apps Script Source Code' : '📋 Show Apps Script Source Code to copy'}
                </button>

                {showScriptCode && (
                  <div className="mt-3 space-y-2">
                    <p className="text-[11px] text-amber-800 dark:text-amber-400">
                      Create an empty spreadsheet in Google Sheets, click <strong className="font-bold">Extensions &gt; Apps Script</strong>, clear any existing code, paste this exact script, and click <strong className="font-bold">Save</strong>:
                    </p>
                    <div className="relative">
                      <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-[10px] overflow-x-auto max-h-[300px] border border-slate-800 scrollbar-thin">
{`/**
 * Google Apps Script Web App for Tuition Center Management System
 * Paste this entire script into script.google.com and deploy as a Web App!
 */

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    
    const action = payload.action;
    const type = payload.type;
    const data = payload.data;
    
    if (action === "sync_all" && type === "database") {
      syncAllDatabase(sheet, data);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Full database sync completed." }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (type === "user" || type === "auth") {
      syncSingleUser(sheet, action, data);
    } else if (type === "fee") {
      syncSingleFee(sheet, action, data);
    } else if (type === "announcement") {
      syncSingleAnnouncement(sheet, action, data);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Incremental sync completed." }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet(spreadsheet, name, headers) {
  let s = spreadsheet.getSheetByName(name);
  if (!s) {
    s = spreadsheet.insertSheet(name);
    s.appendRow(headers);
    s.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e2e8f0");
  }
  return s;
}

function syncAllDatabase(spreadsheet, db) {
  if (db.users) {
    const s = getOrCreateSheet(spreadsheet, "Users", ["ID", "Name", "Email", "Role", "Class", "Batch", "Parent Contact"]);
    s.clearContents();
    s.appendRow(["ID", "Name", "Email", "Role", "Class", "Batch", "Parent Contact"]);
    db.users.forEach(u => {
      s.appendRow([u.id, u.name, u.email, u.role, u.class || "", u.batch || "", u.parentContact || ""]);
    });
  }
  if (db.fees) {
    const s = getOrCreateSheet(spreadsheet, "Fees", ["Invoice ID", "Student ID", "Student Name", "Amount", "Month", "Due Date", "Status", "Paid Date"]);
    s.clearContents();
    s.appendRow(["Invoice ID", "Student ID", "Student Name", "Amount", "Month", "Due Date", "Status", "Paid Date"]);
    db.fees.forEach(f => {
      s.appendRow([f.id, f.studentId, f.studentName, f.amount, f.month, f.dueDate, f.status, f.paidDate || ""]);
    });
  }
  if (db.announcements) {
    const s = getOrCreateSheet(spreadsheet, "Announcements", ["ID", "Title", "Content", "Created At", "Created By"]);
    s.clearContents();
    s.appendRow(["ID", "Title", "Content", "Created At", "Created By"]);
    db.announcements.forEach(a => {
      s.appendRow([a.id, a.title, a.content, a.createdAt, a.createdBy]);
    });
  }
  if (db.attendance) {
    const s = getOrCreateSheet(spreadsheet, "Attendance", ["ID", "Student ID", "Student Name", "Date", "Status", "Remarks"]);
    s.clearContents();
    s.appendRow(["ID", "Student ID", "Student Name", "Date", "Status", "Remarks"]);
    db.attendance.forEach(a => {
      s.appendRow([a.id, a.studentId, a.studentName, a.date, a.status, a.remarks || ""]);
    });
  }
  if (db.tests) {
    const s = getOrCreateSheet(spreadsheet, "Tests", ["Test ID", "Title", "Subject", "Max Marks", "Date", "Created By"]);
    s.clearContents();
    s.appendRow(["Test ID", "Title", "Subject", "Max Marks", "Date", "Created By"]);
    db.tests.forEach(t => {
      s.appendRow([t.id, t.title, t.subject, t.maxMarks, t.date, t.createdBy]);
    });
  }
  if (db.results) {
    const s = getOrCreateSheet(spreadsheet, "Results", ["Result ID", "Test ID", "Test Title", "Student ID", "Student Name", "Marks Obtained", "Max Marks", "Remarks"]);
    s.clearContents();
    s.appendRow(["Result ID", "Test ID", "Test Title", "Student ID", "Student Name", "Marks Obtained", "Max Marks", "Remarks"]);
    db.results.forEach(r => {
      s.appendRow([r.id, r.testId, r.testTitle, r.studentId, r.studentName, r.marksObtained, r.maxMarks, r.remarks || ""]);
    });
  }
  if (db.notes) {
    const s = getOrCreateSheet(spreadsheet, "Notes", ["ID", "Title", "Subject", "Description", "File Name", "Created At", "Created By"]);
    s.clearContents();
    s.appendRow(["ID", "Title", "Subject", "Description", "File Name", "Created At", "Created By"]);
    db.notes.forEach(n => {
      s.appendRow([n.id, n.title, n.subject, n.description, n.fileName || "", n.createdAt, n.createdBy]);
    });
  }
}

function syncSingleUser(spreadsheet, action, u) {
  const s = getOrCreateSheet(spreadsheet, "Users", ["ID", "Name", "Email", "Role", "Class", "Batch", "Parent Contact"]);
  if (action === "delete") {
    const data = s.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === u.id) {
        s.deleteRow(i + 1);
        break;
      }
    }
    return;
  }
  const data = s.getDataRange().getValues();
  let foundRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === u.id) {
      foundRow = i + 1;
      break;
    }
  }
  const rowData = [u.id, u.name, u.email, u.role, u.class || "", u.batch || "", u.parentContact || ""];
  if (foundRow !== -1) {
    s.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    s.appendRow(rowData);
  }
}

function syncSingleFee(spreadsheet, action, f) {
  const s = getOrCreateSheet(spreadsheet, "Fees", ["Invoice ID", "Student ID", "Student Name", "Amount", "Month", "Due Date", "Status", "Paid Date"]);
  const data = s.getDataRange().getValues();
  let foundRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === f.id) {
      foundRow = i + 1;
      break;
    }
  }
  const rowData = [f.id, f.studentId, f.studentName, f.amount, f.month, f.dueDate, f.status, f.paidDate || ""];
  if (foundRow !== -1) {
    s.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    s.appendRow(rowData);
  }
}

function syncSingleAnnouncement(spreadsheet, action, a) {
  const s = getOrCreateSheet(spreadsheet, "Announcements", ["ID", "Title", "Content", "Created At", "Created By"]);
  if (action === "delete") {
    const data = s.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === a.id) {
        s.deleteRow(i + 1);
        break;
      }
    }
    return;
  }
  const data = s.getDataRange().getValues();
  let foundRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === a.id) {
      foundRow = i + 1;
      break;
    }
  }
  const rowData = [a.id, a.title, a.content, a.createdAt, a.createdBy];
  if (foundRow !== -1) {
    s.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    s.appendRow(rowData);
  }
}`}
                      </pre>
                      <button
                        onClick={() => {
                          const code = `/**
 * Google Apps Script Web App for Tuition Center Management System
 * Paste this entire script into script.google.com and deploy as a Web App!
 */

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    
    const action = payload.action;
    const type = payload.type;
    const data = payload.data;
    
    if (action === "sync_all" && type === "database") {
      syncAllDatabase(sheet, data);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Full database sync completed." }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (type === "user" || type === "auth") {
      syncSingleUser(sheet, action, data);
    } else if (type === "fee") {
      syncSingleFee(sheet, action, data);
    } else if (type === "announcement") {
      syncSingleAnnouncement(sheet, action, data);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Incremental sync completed." }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet(spreadsheet, name, headers) {
  let s = spreadsheet.getSheetByName(name);
  if (!s) {
    s = spreadsheet.insertSheet(name);
    s.appendRow(headers);
    s.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e2e8f0");
  }
  return s;
}

function syncAllDatabase(spreadsheet, db) {
  if (db.users) {
    const s = getOrCreateSheet(spreadsheet, "Users", ["ID", "Name", "Email", "Role", "Class", "Batch", "Parent Contact"]);
    s.clearContents();
    s.appendRow(["ID", "Name", "Email", "Role", "Class", "Batch", "Parent Contact"]);
    db.users.forEach(u => {
      s.appendRow([u.id, u.name, u.email, u.role, u.class || "", u.batch || "", u.parentContact || ""]);
    });
  }
  if (db.fees) {
    const s = getOrCreateSheet(spreadsheet, "Fees", ["Invoice ID", "Student ID", "Student Name", "Amount", "Month", "Due Date", "Status", "Paid Date"]);
    s.clearContents();
    s.appendRow(["Invoice ID", "Student ID", "Student Name", "Amount", "Month", "Due Date", "Status", "Paid Date"]);
    db.fees.forEach(f => {
      s.appendRow([f.id, f.studentId, f.studentName, f.amount, f.month, f.dueDate, f.status, f.paidDate || ""]);
    });
  }
  if (db.announcements) {
    const s = getOrCreateSheet(spreadsheet, "Announcements", ["ID", "Title", "Content", "Created At", "Created By"]);
    s.clearContents();
    s.appendRow(["ID", "Title", "Content", "Created At", "Created By"]);
    db.announcements.forEach(a => {
      s.appendRow([a.id, a.title, a.content, a.createdAt, a.createdBy]);
    });
  }
  if (db.attendance) {
    const s = getOrCreateSheet(spreadsheet, "Attendance", ["ID", "Student ID", "Student Name", "Date", "Status", "Remarks"]);
    s.clearContents();
    s.appendRow(["ID", "Student ID", "Student Name", "Date", "Status", "Remarks"]);
    db.attendance.forEach(a => {
      s.appendRow([a.id, a.studentId, a.studentName, a.date, a.status, a.remarks || ""]);
    });
  }
  if (db.tests) {
    const s = getOrCreateSheet(spreadsheet, "Tests", ["Test ID", "Title", "Subject", "Max Marks", "Date", "Created By"]);
    s.clearContents();
    s.appendRow(["Test ID", "Title", "Subject", "Max Marks", "Date", "Created By"]);
    db.tests.forEach(t => {
      s.appendRow([t.id, t.title, t.subject, t.maxMarks, t.date, t.createdBy]);
    });
  }
  if (db.results) {
    const s = getOrCreateSheet(spreadsheet, "Results", ["Result ID", "Test ID", "Test Title", "Student ID", "Student Name", "Marks Obtained", "Max Marks", "Remarks"]);
    s.clearContents();
    s.appendRow(["Result ID", "Test ID", "Test Title", "Student ID", "Student Name", "Marks Obtained", "Max Marks", "Remarks"]);
    db.results.forEach(r => {
      s.appendRow([r.id, r.testId, r.testTitle, r.studentId, r.studentName, r.marksObtained, r.maxMarks, r.remarks || ""]);
    });
  }
  if (db.notes) {
    const s = getOrCreateSheet(spreadsheet, "Notes", ["ID", "Title", "Subject", "Description", "File Name", "Created At", "Created By"]);
    s.clearContents();
    s.appendRow(["ID", "Title", "Subject", "Description", "File Name", "Created At", "Created By"]);
    db.notes.forEach(n => {
      s.appendRow([n.id, n.title, n.subject, n.description, n.fileName || "", n.createdAt, n.createdBy]);
    });
  }
}

function syncSingleUser(spreadsheet, action, u) {
  const s = getOrCreateSheet(spreadsheet, "Users", ["ID", "Name", "Email", "Role", "Class", "Batch", "Parent Contact"]);
  if (action === "delete") {
    const data = s.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === u.id) {
        s.deleteRow(i + 1);
        break;
      }
    }
    return;
  }
  const data = s.getDataRange().getValues();
  let foundRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === u.id) {
      foundRow = i + 1;
      break;
    }
  }
  const rowData = [u.id, u.name, u.email, u.role, u.class || "", u.batch || "", u.parentContact || ""];
  if (foundRow !== -1) {
    s.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    s.appendRow(rowData);
  }
}

function syncSingleFee(spreadsheet, action, f) {
  const s = getOrCreateSheet(spreadsheet, "Fees", ["Invoice ID", "Student ID", "Student Name", "Amount", "Month", "Due Date", "Status", "Paid Date"]);
  const data = s.getDataRange().getValues();
  let foundRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === f.id) {
      foundRow = i + 1;
      break;
    }
  }
  const rowData = [f.id, f.studentId, f.studentName, f.amount, f.month, f.dueDate, f.status, f.paidDate || ""];
  if (foundRow !== -1) {
    s.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    s.appendRow(rowData);
  }
}

function syncSingleAnnouncement(spreadsheet, action, a) {
  const s = getOrCreateSheet(spreadsheet, "Announcements", ["ID", "Title", "Content", "Created At", "Created By"]);
  if (action === "delete") {
    const data = s.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === a.id) {
        s.deleteRow(i + 1);
        break;
      }
    }
    return;
  }
  const data = s.getDataRange().getValues();
  let foundRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === a.id) {
      foundRow = i + 1;
      break;
    }
  }
  const rowData = [a.id, a.title, a.content, a.createdAt, a.createdBy];
  if (foundRow !== -1) {
    s.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    s.appendRow(rowData);
  }
}`;
                          navigator.clipboard.writeText(code);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 3000);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition text-xs flex items-center gap-1 cursor-pointer"
                        title="Copy Apps Script code"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {copiedCode ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Adding User Drawer / Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs" id="admin-new-user-section">
        <button 
          onClick={() => setIsAddingUser(!isAddingUser)}
          className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition cursor-pointer"
          id="admin-add-toggle-btn"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Create a New Account</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Instantly provision an administrator, teacher, or student profile.</p>
            </div>
          </div>
          <div className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg">
            {isAddingUser ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </div>
        </button>

        {isAddingUser && (
          <form onSubmit={handleCreateUser} className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 space-y-4" autoComplete="off" id="admin-new-user-form">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                <input 
                  type="text" 
                  required 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white shadow-xs focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                  placeholder="e.g. Clara Oswald"
                  id="new-user-name"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white shadow-xs focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                  placeholder="e.g. clara@tuition.com"
                  id="new-user-email"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Account Password</label>
                <input 
                  type="text" 
                  required 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white shadow-xs focus:ring-2 focus:ring-violet-500 focus:outline-hidden font-mono"
                  placeholder="Password plain-text"
                  id="new-user-password"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">User Role</label>
                <select
                  value={newRole}
                  onChange={(e: any) => setNewRole(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white shadow-xs focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                  id="new-user-role"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>

              {newRole === 'student' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Class Grade</label>
                    <select
                      value={newClass}
                      onChange={(e) => setNewClass(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white shadow-xs focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                      id="new-user-class"
                    >
                      <option value="Grade 8">Grade 8</option>
                      <option value="Grade 9">Grade 9</option>
                      <option value="Grade 10">Grade 10</option>
                      <option value="Grade 11">Grade 11</option>
                      <option value="Grade 12">Grade 12</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Assigned Batch</label>
                    <input 
                      type="text" 
                      value={newBatch}
                      onChange={(e) => setNewBatch(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white shadow-xs focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                      placeholder="e.g. Advanced Foundation"
                      id="new-user-batch"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Parent Contact No. (Pakistan format)</label>
                    <input 
                      type="text" 
                      value={newParentContact}
                      onChange={(e) => setNewParentContact(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white shadow-xs focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                      placeholder="e.g. +92 300 1234567"
                      id="new-user-contact"
                    />
                  </div>
                </>
              )}

              {newRole === 'teacher' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Specialized Subject</label>
                    <select
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white shadow-xs focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                      id="new-user-subject"
                    >
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="English">English</option>
                      <option value="Computer Science">Computer Science</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Teacher Contact No. (Pakistan format)</label>
                    <input 
                      type="text" 
                      value={newTeacherContact}
                      onChange={(e) => setNewTeacherContact(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white shadow-xs focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                      placeholder="e.g. +92 300 1234567"
                      id="new-user-teacher-contact"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAddingUser(false)}
                className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1.5"
                id="new-user-submit-btn"
              >
                <UserCheck className="h-3.5 w-3.5" />
                Submit and Create Account
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Editing User Modal Overlay */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="admin-edit-modal">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Modify User Profile</h3>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-4" autoComplete="off">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                <input 
                  type="text" 
                  required 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white shadow-xs focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                  id="edit-user-name"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white shadow-xs focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                  id="edit-user-email"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Password Hash/Plain (Leave blank to keep unchanged)</label>
                <input 
                  type="text" 
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white shadow-xs focus:ring-2 focus:ring-violet-500 focus:outline-hidden font-mono"
                  placeholder="Type new password, or leave empty"
                  id="edit-user-password"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Account Role</label>
                <select
                  value={editRole}
                  onChange={(e: any) => setEditRole(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white shadow-xs focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                  id="edit-user-role"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>

              {editRole === 'student' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Grade Level</label>
                    <select
                      value={editClass}
                      onChange={(e) => setEditClass(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white shadow-xs focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                      id="edit-user-class"
                    >
                      <option value="Grade 8">Grade 8</option>
                      <option value="Grade 9">Grade 9</option>
                      <option value="Grade 10">Grade 10</option>
                      <option value="Grade 11">Grade 11</option>
                      <option value="Grade 12">Grade 12</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Parent Phone No. (Pakistan format)</label>
                    <input 
                      type="text" 
                      value={editParentContact}
                      onChange={(e) => setEditParentContact(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white shadow-xs focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                      placeholder="e.g. +92 300 1234567"
                      id="edit-user-contact"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Assigned Academic Batch</label>
                    <input 
                      type="text" 
                      value={editBatch}
                      onChange={(e) => setEditBatch(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white shadow-xs focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                      id="edit-user-batch"
                    />
                  </div>
                </div>
              )}

              {editRole === 'teacher' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Specialized Subject</label>
                    <select
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white shadow-xs focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                      id="edit-user-subject"
                    >
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="English">English</option>
                      <option value="Computer Science">Computer Science</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Teacher Contact No. (Pakistan format)</label>
                    <input 
                      type="text" 
                      value={editTeacherContact}
                      onChange={(e) => setEditTeacherContact(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white shadow-xs focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                      placeholder="e.g. +92 300 1234567"
                      id="edit-user-teacher-contact"
                    />
                  </div>
                </div>
              )}

              {editRole === 'teacher' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Specialized Subject</label>
                    <select
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white shadow-xs focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                      id="edit-user-subject"
                    >
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="English">English</option>
                      <option value="Computer Science">Computer Science</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Teacher Contact No. (Pakistan format)</label>
                    <input 
                      type="text" 
                      value={editTeacherContact}
                      onChange={(e) => setEditTeacherContact(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white shadow-xs focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                      placeholder="e.g. +92 300 1234567"
                      id="edit-user-teacher-contact"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition shadow-xs cursor-pointer"
                  id="edit-user-submit"
                >
                  Update Account Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Directory Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs" id="admin-user-directory-panel">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Active Portal Directory</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Search, filter, edit credentials or remove users entirely from the database.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            {/* Search inputs */}
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, email, batch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-white shadow-xs focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                id="admin-directory-search"
              />
            </div>

            {/* Role Filter tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200/60 dark:border-slate-800/60">
              {(['all', 'student', 'teacher'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setRoleFilter(tab)}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider transition duration-150 cursor-pointer ${
                    roleFilter === tab
                      ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Directory Listings Table */}
        {loading ? (
          <div className="p-12 text-center" id="directory-loading">
            <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading master center user databases...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center" id="directory-empty">
            <Users className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No portal members found</p>
            <p className="text-xs text-slate-400 mt-1">Try expanding your search parameters or query filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto" id="admin-directory-table-container">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-4">User Details</th>
                  <th className="py-3 px-4">Role Badge</th>
                  <th className="py-3 px-4">Credential Plain-Text</th>
                  <th className="py-3 px-4">Classes/Batches</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredUsers.map(u => {
                  const isVisible = visiblePasswords[u.id] || false;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 text-slate-700 dark:text-slate-300 text-xs transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs border ${
                            u.role === 'student' 
                              ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20' 
                              : u.role === 'teacher' 
                                ? 'bg-indigo-500/15 text-indigo-600 border-indigo-500/20' 
                                : 'bg-violet-500/15 text-violet-600 border-violet-500/20'
                          }`}>
                            {u.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
                              {u.name}
                              {u.id === user.id && (
                                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9px] font-bold rounded">You</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                          u.role === 'student' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/20' 
                            : u.role === 'teacher' 
                              ? 'bg-indigo-50 dark:bg-indigo-950/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-900/20' 
                              : 'bg-violet-50 dark:bg-violet-950/10 text-violet-600 dark:text-violet-400 border-violet-200/50 dark:border-violet-900/20'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span>{isVisible ? (u as any).passwordHash || 'N/A' : '••••••••'}</span>
                          <button 
                            onClick={() => togglePasswordVisibility(u.id)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                          >
                            {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                        {u.role === 'student' ? (
                          <div>
                            <span className="font-semibold text-slate-700 dark:text-slate-300 block">{u.class || 'Unassigned'}</span>
                            <span className="text-[10px] truncate max-w-[150px] block">{u.batch || 'General Batch'}</span>
                          </div>
                        ) : u.role === 'teacher' ? (
                          <div>
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400 block">{u.subject || 'General'}</span>
                            <span className="text-[10px] truncate max-w-[150px] block font-mono">{u.teacherContact || 'No Contact'}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-[10px]">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {deleteConfirmId === u.id ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-[10px] font-bold text-rose-500 mr-1 animate-pulse">Confirm?</span>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="px-2 py-1 bg-rose-600 text-white font-bold rounded hover:bg-rose-700 text-[10px] transition cursor-pointer"
                            >
                              Yes, Delete
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-400 font-bold rounded text-[10px] transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => startEditUser(u)}
                              className="p-1.5 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/30 border border-slate-200/50 dark:border-slate-700/50 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                              title="Edit credentials / metadata"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            {u.id !== user.id && (
                              <button
                                onClick={() => setDeleteConfirmId(u.id)}
                                className="p-1.5 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/30 border border-slate-200/50 dark:border-slate-700/50 rounded-lg text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                                title="Delete account profile"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
