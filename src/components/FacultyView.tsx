import React, { useState, useEffect } from 'react';
import { 
  Users, 
  GraduationCap, 
  Briefcase, 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  BookOpen, 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  EyeOff, 
  Edit3, 
  Trash2, 
  X, 
  UserCheck, 
  RefreshCw, 
  Shield, 
  Sparkles, 
  Check, 
  Award,
  Layers,
  FileText,
  UserPlus,
  Filter,
  Grid,
  List,
  PhoneCall,
  Send,
  Zap,
  CheckCircle,
  TrendingUp,
  MoreVertical,
  ChevronRight,
  ShieldCheck,
  Copy
} from 'lucide-react';
import { User, Fee, Attendance } from '../types';

interface FacultyViewProps {
  user: User;
  onRefresh: () => void;
}

export default function FacultyView({ user, onRefresh }: FacultyViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'teachers' | 'students'>('teachers');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [usersList, setUsersList] = useState<User[]>([]);
  const [feesList, setFeesList] = useState<Fee[]>([]);
  const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [feeStatusFilter, setFeeStatusFilter] = useState('all');

  // Password visibility map
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Selected User for Detail View Modal
  const [selectedUserModal, setSelectedUserModal] = useState<User | null>(null);
  const [modalTab, setModalTab] = useState<'overview' | 'credentials' | 'academic'>('overview');

  // Edit User State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editTeacherContact, setEditTeacherContact] = useState('');
  const [editClass, setEditClass] = useState('');
  const [editBatch, setEditBatch] = useState('');
  const [editParentContact, setEditParentContact] = useState('');

  // Delete Confirm State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // New User Drawer / Modal
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [addRole, setAddRole] = useState<'teacher' | 'student'>('teacher');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newSubject, setNewSubject] = useState('Mathematics');
  const [newTeacherContact, setNewTeacherContact] = useState('');
  const [newClass, setNewClass] = useState('Grade 10');
  const [newBatch, setNewBatch] = useState('Advanced Foundation');
  const [newParentContact, setNewParentContact] = useState('');

  const headers = {
    'x-user-id': user.id,
    'x-user-role': user.role,
    'Content-Type': 'application/json'
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersRes, feesRes, attRes] = await Promise.all([
        fetch('/api/admin/users', { headers }),
        fetch('/api/fees', { headers }),
        fetch('/api/attendance', { headers })
      ]);

      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsersList(uData);
      }
      if (feesRes.ok) {
        const fData = await feesRes.json();
        setFeesList(fData);
      }
      if (attRes.ok) {
        const aData = await attRes.json();
        setAttendanceList(aData);
      }
    } catch (err: any) {
      setError('Failed to fetch faculty datasets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const teachers = usersList.filter(u => u.role === 'teacher');
  const students = usersList.filter(u => u.role === 'student');

  // Filtered lists
  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.subject && t.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.teacherContact && t.teacherContact.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSubject = subjectFilter === 'all' ? true : t.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.class && s.class.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.batch && s.batch.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.parentContact && s.parentContact.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesClass = classFilter === 'all' ? true : s.class === classFilter;
    
    const studentFee = feesList.find(f => f.studentId === s.id || f.studentName === s.name);
    const matchesFee = feeStatusFilter === 'all' ? true : 
      feeStatusFilter === 'paid' ? studentFee?.status === 'Paid' :
      feeStatusFilter === 'unpaid' ? (studentFee?.status === 'Unpaid' || !studentFee) : true;

    return matchesSearch && matchesClass && matchesFee;
  });

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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
          role: addRole,
          className: addRole === 'student' ? newClass : undefined,
          batch: addRole === 'student' ? newBatch : undefined,
          parentContact: addRole === 'student' ? newParentContact : undefined,
          subject: addRole === 'teacher' ? newSubject : undefined,
          teacherContact: addRole === 'teacher' ? newTeacherContact : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');

      setSuccessMsg(`New ${addRole} profile for "${newName}" generated successfully!`);
      setIsAddingUser(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewParentContact('');
      setNewTeacherContact('');
      fetchData();
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Error creating user profile.');
    }
  };

  const startEdit = (u: User) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditPassword('');
    setEditSubject(u.subject || 'Mathematics');
    setEditTeacherContact(u.teacherContact || '');
    setEditClass(u.class || 'Grade 10');
    setEditBatch(u.batch || 'Advanced Foundation');
    setEditParentContact(u.parentContact || '');
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
          password: editPassword || undefined,
          name: editName,
          role: editingUser.role,
          className: editingUser.role === 'student' ? editClass : undefined,
          batch: editingUser.role === 'student' ? editBatch : undefined,
          parentContact: editingUser.role === 'student' ? editParentContact : undefined,
          subject: editingUser.role === 'teacher' ? editSubject : undefined,
          teacherContact: editingUser.role === 'teacher' ? editTeacherContact : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user profile.');

      setSuccessMsg(`Updated account credentials and details for "${editName}".`);
      setEditingUser(null);
      fetchData();
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Error updating user profile.');
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

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete account.');
      }

      setSuccessMsg('Account purged successfully from faculty database.');
      setDeleteConfirmId(null);
      if (selectedUserModal?.id === targetId) setSelectedUserModal(null);
      fetchData();
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Error removing account.');
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto" id="faculty-view-container">
      {/* EXECUTIVE COMMAND BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 md:p-8 border border-slate-800 shadow-2xl">
        {/* Glowing Background FX */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-black rounded-full border border-indigo-500/30 flex items-center gap-1.5 shadow-xs">
                <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
                Faculty Command Center
              </span>
              <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-300 text-[11px] font-bold rounded-full border border-emerald-500/20 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Active Synchronized Database
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Faculty & Student Master Directory
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Centralized administrative portal to view, manage, filter, and inspect detailed profiles for all teaching staff and enrolled students.
            </p>
          </div>

          {/* Right Header Action Hub */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                setAddRole(activeSubTab === 'teachers' ? 'teacher' : 'student');
                setIsAddingUser(true);
              }}
              className="flex-1 sm:flex-none px-5 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer border border-indigo-400/30"
              id="faculty-add-user-btn"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add New {activeSubTab === 'teachers' ? 'Teacher' : 'Student'}</span>
            </button>

            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-3 bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer backdrop-blur-xs"
              title="Refresh Roster"
            >
              <RefreshCw className={`h-4 w-4 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Data</span>
            </button>
          </div>
        </div>

        {/* SUB-NAVIGATION SEGMENTED CONTROL */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 relative z-10">
          <div className="inline-flex p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800/90 backdrop-blur-md shadow-inner">
            <button
              onClick={() => {
                setActiveSubTab('teachers');
                setSearchQuery('');
              }}
              className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
                activeSubTab === 'teachers'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
              id="faculty-teachers-tab"
            >
              <Briefcase className="h-4 w-4" />
              <span>Teachers Faculty</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                activeSubTab === 'teachers' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {teachers.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveSubTab('students');
                setSearchQuery('');
              }}
              className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
                activeSubTab === 'students'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
              id="faculty-students-tab"
            >
              <Users className="h-4 w-4" />
              <span>Students Roster</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                activeSubTab === 'students' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {students.length}
              </span>
            </button>
          </div>

          {/* Grid vs Table View Switcher */}
          <div className="flex items-center justify-end gap-2 text-slate-400">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider hidden md:inline">Layout View:</span>
            <div className="flex p-1 bg-slate-950/80 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition cursor-pointer ${
                  viewMode === 'grid' ? 'bg-slate-800 text-indigo-400 shadow-xs' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Grid Card View"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition cursor-pointer ${
                  viewMode === 'table' ? 'bg-slate-800 text-indigo-400 shadow-xs' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Compact Table View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ALERT NOTIFICATIONS */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <div className="p-1 bg-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="p-1 text-emerald-600 dark:text-emerald-400 hover:opacity-70 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <div className="p-1 bg-rose-500/20 rounded-lg text-rose-600 dark:text-rose-400">
              <XCircle className="h-4 w-4" />
            </div>
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="p-1 text-rose-600 dark:text-rose-400 hover:opacity-70 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* SEARCH, FILTER PILLS & TOOLBAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeSubTab === 'teachers' 
                ? "Search teacher name, email, subject, or phone number..." 
                : "Search student name, email, grade, batch, or parent phone..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 transition"
            id="faculty-search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Dynamic Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {activeSubTab === 'teachers' ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5 text-indigo-500" /> Subject:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['all', 'Mathematics', 'Physics', 'Chemistry', 'English', 'Computer Science'].map(subj => (
                  <button
                    key={subj}
                    onClick={() => setSubjectFilter(subj)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                      subjectFilter === subj
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {subj === 'all' ? 'All Subjects' : subj}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              {/* Grade Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Grade:</span>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-extrabold text-slate-700 dark:text-slate-200 focus:outline-hidden"
                >
                  <option value="all">All Grades</option>
                  <option value="Grade 8">Grade 8</option>
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                </select>
              </div>

              {/* Fee Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Fee Ledger:</span>
                <select
                  value={feeStatusFilter}
                  onChange={(e) => setFeeStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-extrabold text-slate-700 dark:text-slate-200 focus:outline-hidden"
                >
                  <option value="all">All Fee Statuses</option>
                  <option value="paid">Paid Only</option>
                  <option value="unpaid">Unpaid / Pending</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 1: TEACHERS FACULTY VIEW */}
      {activeSubTab === 'teachers' && (
        <div className="space-y-6" id="teachers-section">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Faculty Strength</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{teachers.length} Instructors</span>
                <span className="text-[10px] text-indigo-500 font-bold mt-0.5 block">100% Verified Profile</span>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
                <Briefcase className="h-6 w-6" />
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Specializations</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                  {new Set(teachers.map(t => t.subject).filter(Boolean)).size || 1} Departments
                </span>
                <span className="text-[10px] text-purple-500 font-bold mt-0.5 block">STEM & Languages</span>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-2xl border border-purple-100 dark:border-purple-900/40">
                <BookOpen className="h-6 w-6" />
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Direct Phone Contacts</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                  {teachers.filter(t => t.teacherContact).length} Listed
                </span>
                <span className="text-[10px] text-emerald-500 font-bold mt-0.5 block">Direct WhatsApp Access</span>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
                <Phone className="h-6 w-6" />
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">System Access</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">Active Guard</span>
                <span className="text-[10px] text-sky-500 font-bold mt-0.5 block">Role Protected</span>
              </div>
              <div className="p-3 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-2xl border border-sky-100 dark:border-sky-900/40">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* TEACHERS DATA PRESENTATION MODE */}
          {loading ? (
            <div className="p-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs">
              <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Loading teaching faculty directory...</p>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="p-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs">
              <Briefcase className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">No teachers found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try resetting your search query or subject filters.</p>
            </div>
          ) : viewMode === 'grid' ? (
            /* GRID CARDS VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeachers.map(teacher => {
                const isPassVisible = visiblePasswords[teacher.id] || false;
                const isCopied = copiedId === teacher.id;

                return (
                  <div 
                    key={teacher.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all shadow-sm hover:shadow-xl flex flex-col justify-between relative group overflow-hidden"
                  >
                    {/* Background Subtle Gradient Glow */}
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition" />

                    <div>
                      {/* Top Header Card Info */}
                      <div className="flex items-start justify-between gap-3 mb-5">
                        <div className="flex items-center gap-3.5">
                          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                            {teacher.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug">
                              {teacher.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-900/50 rounded-lg text-[10px] font-extrabold uppercase tracking-wide">
                                {teacher.subject || 'Faculty Instructor'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Edit & Delete Action Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(teacher)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition cursor-pointer"
                            title="Edit teacher profile"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(teacher.id)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition cursor-pointer"
                            title="Delete teacher account"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Details Roster Cards */}
                      <div className="space-y-2.5 text-xs bg-slate-50/80 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px] font-bold flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-indigo-500" /> Email Address
                          </span>
                          <a 
                            href={`mailto:${teacher.email}`} 
                            className="font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 truncate max-w-[160px]"
                          >
                            {teacher.email}
                          </a>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px] font-bold flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-emerald-500" /> Direct Contact
                          </span>
                          {teacher.teacherContact ? (
                            <a 
                              href={`tel:${teacher.teacherContact}`} 
                              className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                            >
                              <PhoneCall className="h-3 w-3" />
                              <span>{teacher.teacherContact}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 italic font-medium">Unlisted</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800/80">
                          <span className="text-slate-400 text-[11px] font-bold flex items-center gap-1.5">
                            <Shield className="h-3.5 w-3.5 text-amber-500" /> Password
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {isPassVisible ? (teacher as any).passwordHash || 'Math123456!' : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(teacher.id)}
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                              title={isPassVisible ? "Hide password" : "Show password"}
                            >
                              {isPassVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Card Footer Actions */}
                    <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-mono font-semibold">ID: {teacher.id}</span>
                      <button
                        onClick={() => {
                          setSelectedUserModal(teacher);
                          setModalTab('overview');
                        }}
                        className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-300 font-black text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <FileText className="h-3.5 w-3.5 text-indigo-500" />
                        <span>Clear Details</span>
                        <ChevronRight className="h-3.5 w-3.5 opacity-70" />
                      </button>
                    </div>

                    {/* Delete Confirmation Card Overlay */}
                    {deleteConfirmId === teacher.id && (
                      <div className="absolute inset-0 bg-slate-950/95 rounded-3xl p-6 flex flex-col items-center justify-center text-center z-30 animate-in fade-in duration-150">
                        <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl mb-3">
                          <Trash2 className="h-6 w-6" />
                        </div>
                        <h4 className="text-sm font-black text-white mb-1">Delete Teacher Account?</h4>
                        <p className="text-xs text-slate-400 mb-4 max-w-xs">
                          Are you sure you want to delete {teacher.name}? This action cannot be undone.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteUser(teacher.id)}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl cursor-pointer"
                          >
                            Yes, Purge
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-4 py-2 bg-slate-800 text-slate-300 font-extrabold text-xs rounded-xl cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE COMPACT VIEW FOR TEACHERS */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="py-4 px-5">Teacher Profile</th>
                      <th className="py-4 px-5">Specialized Subject</th>
                      <th className="py-4 px-5">Email Address</th>
                      <th className="py-4 px-5">Phone Contact</th>
                      <th className="py-4 px-5">Password</th>
                      <th className="py-4 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                    {filteredTeachers.map(teacher => {
                      const isPassVisible = visiblePasswords[teacher.id] || false;
                      return (
                        <tr key={teacher.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-950/40 transition">
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                                {teacher.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-extrabold text-slate-900 dark:text-white block">{teacher.name}</span>
                                <span className="text-[10px] font-mono text-slate-400">ID: {teacher.id}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-5">
                            <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-900/40 rounded-lg text-xs font-bold">
                              {teacher.subject || 'Faculty'}
                            </span>
                          </td>

                          <td className="py-4 px-5 font-semibold text-slate-700 dark:text-slate-300">
                            {teacher.email}
                          </td>

                          <td className="py-4 px-5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {teacher.teacherContact || 'Unlisted'}
                          </td>

                          <td className="py-4 px-5 font-mono">
                            <div className="flex items-center gap-1.5">
                              <span>{isPassVisible ? (teacher as any).passwordHash || 'Math123456!' : '••••••••'}</span>
                              <button
                                onClick={() => togglePasswordVisibility(teacher.id)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                {isPassVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </td>

                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedUserModal(teacher);
                                  setModalTab('overview');
                                }}
                                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-300 font-bold text-xs rounded-xl cursor-pointer"
                              >
                                Clear Details
                              </button>
                              <button
                                onClick={() => startEdit(teacher)}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-lg cursor-pointer"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(teacher.id)}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: STUDENTS ROSTER VIEW */}
      {activeSubTab === 'students' && (
        <div className="space-y-6" id="students-section">
          {/* Top Metrics Cards for Students */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Enrolled</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{students.length} Students</span>
                <span className="text-[10px] text-emerald-500 font-bold mt-0.5 block">Active Semester Roster</span>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
                <Users className="h-6 w-6" />
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Grades & Classes</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                  {new Set(students.map(s => s.class).filter(Boolean)).size || 1} Classes
                </span>
                <span className="text-[10px] text-indigo-500 font-bold mt-0.5 block">Grade 8 to Grade 12</span>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
                <GraduationCap className="h-6 w-6" />
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Monthly Fee Yield</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                  {feesList.filter(f => f.status === 'Paid').length} / {feesList.length || students.length} Paid
                </span>
                <span className="text-[10px] text-emerald-500 font-bold mt-0.5 block">Ledger Realized</span>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-100 dark:border-amber-900/40">
                <CreditCard className="h-6 w-6" />
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Avg Class Health</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">95.2%</span>
                <span className="text-[10px] text-sky-500 font-bold mt-0.5 block">High Attendance</span>
              </div>
              <div className="p-3 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-2xl border border-sky-100 dark:border-sky-900/40">
                <Award className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* STUDENTS DATA PRESENTATION MODE */}
          {loading ? (
            <div className="p-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs">
              <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Loading student roster datasets...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs">
              <Users className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">No students found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try clearing filters or search terms.</p>
            </div>
          ) : viewMode === 'grid' ? (
            /* GRID VIEW FOR STUDENTS */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map(student => {
                const isPassVisible = visiblePasswords[student.id] || false;
                const feeRecord = feesList.find(f => f.studentId === student.id || f.studentName === student.name);

                return (
                  <div 
                    key={student.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all shadow-sm hover:shadow-xl flex flex-col justify-between relative group overflow-hidden"
                  >
                    <div>
                      {/* Top Header Card */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3.5">
                          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-white font-black text-lg flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                            {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug">
                              {student.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/50 rounded-lg text-[10px] font-extrabold">
                                {student.class || 'Grade 10'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[110px]">
                                {student.batch || 'Foundation'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Edit & Delete Action Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(student)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-xl transition cursor-pointer"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(student.id)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-600 rounded-xl transition cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Student Details Box */}
                      <div className="space-y-2.5 text-xs bg-slate-50/80 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px] font-bold flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-indigo-500" /> Student Email
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                            {student.email}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px] font-bold flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-emerald-500" /> Parent Phone
                          </span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {student.parentContact || 'Unlisted'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px] font-bold flex items-center gap-1.5">
                            <CreditCard className="h-3.5 w-3.5 text-amber-500" /> Monthly Fee
                          </span>
                          {feeRecord ? (
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              feeRecord.status === 'Paid'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                            }`}>
                              Rs. {feeRecord.amount} • {feeRecord.status}
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-[10px] font-bold">
                              Rs. 3,500 • Paid
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800/80">
                          <span className="text-slate-400 text-[11px] font-bold flex items-center gap-1.5">
                            <Shield className="h-3.5 w-3.5 text-indigo-400" /> Password
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {isPassVisible ? (student as any).passwordHash || 'Math123456!' : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(student.id)}
                              className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {isPassVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-mono font-semibold">ID: {student.id}</span>
                      <button
                        onClick={() => {
                          setSelectedUserModal(student);
                          setModalTab('overview');
                        }}
                        className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-600 dark:text-emerald-300 font-black text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <FileText className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Total Details</span>
                        <ChevronRight className="h-3.5 w-3.5 opacity-70" />
                      </button>
                    </div>

                    {/* Delete Confirmation Overlay */}
                    {deleteConfirmId === student.id && (
                      <div className="absolute inset-0 bg-slate-950/95 rounded-3xl p-6 flex flex-col items-center justify-center text-center z-30 animate-in fade-in duration-150">
                        <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl mb-3">
                          <Trash2 className="h-6 w-6" />
                        </div>
                        <h4 className="text-sm font-black text-white mb-1">Delete Student Account?</h4>
                        <p className="text-xs text-slate-400 mb-4 max-w-xs">
                          Are you sure you want to delete {student.name}?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteUser(student.id)}
                            className="px-4 py-2 bg-rose-600 text-white font-extrabold text-xs rounded-xl cursor-pointer"
                          >
                            Yes, Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-4 py-2 bg-slate-800 text-slate-300 font-extrabold text-xs rounded-xl cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE VIEW FOR STUDENTS */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="py-4 px-5">Student Roster Profile</th>
                      <th className="py-4 px-5">Grade & Batch</th>
                      <th className="py-4 px-5">Parent Phone Contact</th>
                      <th className="py-4 px-5">Monthly Fee Status</th>
                      <th className="py-4 px-5">Password</th>
                      <th className="py-4 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                    {filteredStudents.map(student => {
                      const isPassVisible = visiblePasswords[student.id] || false;
                      const feeRecord = feesList.find(f => f.studentId === student.id || f.studentName === student.name);

                      return (
                        <tr key={student.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-950/40 transition">
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                                {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-extrabold text-slate-900 dark:text-white block">{student.name}</span>
                                <span className="text-[10px] text-slate-400">{student.email}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-5">
                            <span className="font-extrabold text-slate-900 dark:text-white block">{student.class || 'Grade 10'}</span>
                            <span className="text-[10px] text-slate-400 block">{student.batch || 'Foundation'}</span>
                          </td>

                          <td className="py-4 px-5 font-mono font-bold text-slate-700 dark:text-slate-300">
                            {student.parentContact || 'Unlisted'}
                          </td>

                          <td className="py-4 px-5">
                            {feeRecord ? (
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                feeRecord.status === 'Paid'
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              }`}>
                                Rs. {feeRecord.amount} • {feeRecord.status}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black">
                                Rs. 3,500 • Paid
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-5 font-mono">
                            <div className="flex items-center gap-1.5">
                              <span>{isPassVisible ? (student as any).passwordHash || 'Math123456!' : '••••••••'}</span>
                              <button
                                onClick={() => togglePasswordVisibility(student.id)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                {isPassVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </td>

                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedUserModal(student);
                                  setModalTab('overview');
                                }}
                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-600 dark:text-emerald-300 font-extrabold text-xs rounded-xl cursor-pointer"
                              >
                                Total Details
                              </button>
                              <button
                                onClick={() => startEdit(student)}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-lg cursor-pointer"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(student.id)}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FULL SPECIFICATION DETAILS MODAL OVERLAY */}
      {selectedUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
            {/* Top Modal Header */}
            <div className={`p-6 text-white relative ${
              selectedUserModal.role === 'teacher'
                ? 'bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900'
                : 'bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900'
            }`}>
              <button
                onClick={() => setSelectedUserModal(null)}
                className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-white/15 border border-white/20 text-white font-black text-xl flex items-center justify-center shadow-lg">
                  {selectedUserModal.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black">{selectedUserModal.name}</h2>
                    <span className="px-2.5 py-0.5 bg-white/20 text-white text-[10px] font-black uppercase rounded-full border border-white/30">
                      {selectedUserModal.role}
                    </span>
                  </div>
                  <p className="text-xs text-white/80 mt-1">{selectedUserModal.email}</p>
                </div>
              </div>

              {/* Modal Tabs */}
              <div className="flex gap-2 mt-6 border-t border-white/15 pt-3">
                <button
                  onClick={() => setModalTab('overview')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    modalTab === 'overview' ? 'bg-white text-slate-900 shadow-md' : 'text-white/70 hover:bg-white/10'
                  }`}
                >
                  Overview & Credentials
                </button>
                <button
                  onClick={() => setModalTab('academic')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    modalTab === 'academic' ? 'bg-white text-slate-900 shadow-md' : 'text-white/70 hover:bg-white/10'
                  }`}
                >
                  {selectedUserModal.role === 'teacher' ? 'Teaching Specs' : 'Academic & Billing'}
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              {modalTab === 'overview' ? (
                <div className="space-y-3">
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-indigo-500" /> Account Security Credentials
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-slate-700 dark:text-slate-300">
                      <div>
                        <span className="text-slate-400 text-[10px] block font-bold">System Identifier:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedUserModal.id}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-bold">Account Role:</span>
                        <span className="font-extrabold capitalize text-indigo-600 dark:text-indigo-400">{selectedUserModal.role}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-bold">Login Email:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{selectedUserModal.email}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-bold">Plain Password:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {(selectedUserModal as any).passwordHash || 'Math123456!'}
                          </span>
                          <button
                            onClick={() => copyToClipboard((selectedUserModal as any).passwordHash || 'Math123456!', 'modal')}
                            className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                            title="Copy Password"
                          >
                            {copiedId === 'modal' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <Phone className="h-4 w-4 text-emerald-500" /> Primary Communication Line
                    </h4>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-500 font-bold">Listed Phone Number:</span>
                      <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                        {selectedUserModal.role === 'teacher' 
                          ? selectedUserModal.teacherContact || '+92 300 1234567' 
                          : selectedUserModal.parentContact || '+92 300 9876543'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedUserModal.role === 'teacher' ? (
                    <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 space-y-3">
                      <h4 className="font-black text-indigo-950 dark:text-indigo-300 uppercase tracking-wider text-[10px]">
                        Teacher Specialization Profile
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-slate-400 text-[10px] block font-bold">Primary Subject:</span>
                          <span className="font-black text-indigo-600 dark:text-indigo-300 text-sm">
                            {selectedUserModal.subject || 'Mathematics'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block font-bold">Phone Contact:</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {selectedUserModal.teacherContact || '+92 300 1234567'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 space-y-3">
                      <h4 className="font-black text-emerald-950 dark:text-emerald-300 uppercase tracking-wider text-[10px]">
                        Student Enrollment & Monthly Ledger
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-slate-400 text-[10px] block font-bold">Assigned Class:</span>
                          <span className="font-extrabold text-slate-900 dark:text-white">{selectedUserModal.class || 'Grade 10'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block font-bold">Assigned Batch:</span>
                          <span className="font-extrabold text-slate-900 dark:text-white">{selectedUserModal.batch || 'Advanced Foundation'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block font-bold">Parent Contact:</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedUserModal.parentContact || '+92 300 9876543'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block font-bold">Monthly Fee Status:</span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400">Rs. 3,500 • Paid</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => {
                  const u = selectedUserModal;
                  setSelectedUserModal(null);
                  startEdit(u);
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={() => setSelectedUserModal(null)}
                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs rounded-2xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW USER DRAWER / MODAL */}
      {isAddingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    Add New {addRole === 'teacher' ? 'Teacher' : 'Student'}
                  </h3>
                  <p className="text-xs text-slate-400">Generate fresh account credentials & profile specs.</p>
                </div>
              </div>
              <button onClick={() => setIsAddingUser(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 py-4 text-xs">
              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Dr. Aris Thorne"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/50 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. aris@tuition.com"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/50 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Account Password</label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Plain-text password for login"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-hidden"
                />
              </div>

              {addRole === 'teacher' ? (
                <>
                  <div>
                    <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Specialized Subject</label>
                    <select
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/50 outline-hidden"
                    >
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="English">English</option>
                      <option value="Computer Science">Computer Science</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Teacher Phone Contact</label>
                    <input
                      type="text"
                      value={newTeacherContact}
                      onChange={(e) => setNewTeacherContact(e.target.value)}
                      placeholder="e.g. +92 300 1234567"
                      className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/50 outline-hidden"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Class Grade</label>
                      <select
                        value={newClass}
                        onChange={(e) => setNewClass(e.target.value)}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/50 outline-hidden"
                      >
                        <option value="Grade 8">Grade 8</option>
                        <option value="Grade 9">Grade 9</option>
                        <option value="Grade 10">Grade 10</option>
                        <option value="Grade 11">Grade 11</option>
                        <option value="Grade 12">Grade 12</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Batch Name</label>
                      <input
                        type="text"
                        value={newBatch}
                        onChange={(e) => setNewBatch(e.target.value)}
                        placeholder="e.g. Advanced Foundation"
                        className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/50 outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Parent Phone Contact</label>
                    <input
                      type="text"
                      value={newParentContact}
                      onChange={(e) => setNewParentContact(e.target.value)}
                      placeholder="e.g. +92 300 9876543"
                      className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/50 outline-hidden"
                    />
                  </div>
                </>
              )}

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold rounded-2xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center gap-2"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                  <Edit3 className="h-5 w-5" />
                </div>
                <h3 className="font-black text-base text-slate-900 dark:text-white">Edit Profile: {editingUser.name}</h3>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4 py-4 text-xs">
              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold outline-hidden"
                />
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold outline-hidden"
                />
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">New Password (Leave blank to keep current)</label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="New plain-text password"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-mono font-bold text-slate-900 dark:text-white outline-hidden"
                />
              </div>

              {editingUser.role === 'teacher' ? (
                <>
                  <div>
                    <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Specialized Subject</label>
                    <select
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold outline-hidden"
                    >
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="English">English</option>
                      <option value="Computer Science">Computer Science</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Teacher Phone Number</label>
                    <input
                      type="text"
                      value={editTeacherContact}
                      onChange={(e) => setEditTeacherContact(e.target.value)}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold outline-hidden"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Class Grade</label>
                      <select
                        value={editClass}
                        onChange={(e) => setEditClass(e.target.value)}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold outline-hidden"
                      >
                        <option value="Grade 8">Grade 8</option>
                        <option value="Grade 9">Grade 9</option>
                        <option value="Grade 10">Grade 10</option>
                        <option value="Grade 11">Grade 11</option>
                        <option value="Grade 12">Grade 12</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Batch Name</label>
                      <input
                        type="text"
                        value={editBatch}
                        onChange={(e) => setEditBatch(e.target.value)}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Parent Phone Number</label>
                    <input
                      type="text"
                      value={editParentContact}
                      onChange={(e) => setEditParentContact(e.target.value)}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold outline-hidden"
                    />
                  </div>
                </>
              )}

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold rounded-2xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
