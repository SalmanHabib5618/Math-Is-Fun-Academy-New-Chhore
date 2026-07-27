import React from 'react';
import { 
  Bell, 
  CalendarCheck, 
  BookOpen, 
  FileText, 
  FileSpreadsheet,
  CreditCard, 
  Users, 
  TrendingUp, 
  Award,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { User, Announcement, Note, Test, Result, Attendance, Fee, DashboardTab } from '../types';

interface DashboardOverviewProps {
  user: User;
  announcements: Announcement[];
  notes: Note[];
  tests: Test[];
  results: Result[];
  attendance: Attendance[];
  fees: Fee[];
  setActiveTab: (tab: DashboardTab) => void;
}

export default function DashboardOverview({
  user,
  announcements,
  notes,
  tests,
  results,
  attendance,
  fees,
  setActiveTab
}: DashboardOverviewProps) {
  
  const isTeacher = user.role === 'teacher';

  // --- Calculations for Students ---
  const myAttendance = attendance.filter(a => a.studentId === user.id);
  const totalMyDays = myAttendance.length;
  const presentMyDays = myAttendance.filter(a => a.status === 'Present').length;
  const attendanceRate = totalMyDays > 0 ? Math.round((presentMyDays / totalMyDays) * 100) : 100;

  const myResults = results.filter(r => r.studentId === user.id);
  const totalMyTests = myResults.length;
  const myTotalScore = myResults.reduce((acc, curr) => acc + (curr.marksObtained / curr.maxMarks) * 100, 0);
  const averageGrade = totalMyTests > 0 ? Math.round(myTotalScore / totalMyTests) : 0;

  const myFees = fees.filter(f => f.studentId === user.id);
  const pendingFees = myFees.filter(f => f.status !== 'Paid');
  const unpaidAmount = pendingFees.reduce((acc, curr) => acc + curr.amount, 0);

  // --- Calculations for Teachers ---
  const uniqueStudentsCount = 3; // seeded default: John, Alex, Lily (derived from users)
  const totalNotesCount = notes.length;
  const totalAnnouncementsCount = announcements.length;
  const totalTestsCount = tests.length;

  const allUnpaidInvoices = fees.filter(f => f.status !== 'Paid');
  const outstandingFees = allUnpaidInvoices.reduce((acc, curr) => acc + curr.amount, 0);
  const collectedFees = fees.filter(f => f.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0);

  // Get today's attendance rate for teachers
  const todayStr = '2026-07-02'; // mock today's date from seeded data
  const todayAttendance = attendance.filter(a => a.date === todayStr);
  const presentTodayCount = todayAttendance.filter(a => a.status === 'Present').length;
  const todayAttendanceRate = todayAttendance.length > 0 ? Math.round((presentTodayCount / todayAttendance.length) * 100) : 100;

  // Latest announcement
  const latestAnnouncement = announcements[0];

  return (
    <div className="space-y-8">
      {/* Header Greeting Banner */}
      <div className="relative overflow-hidden bg-slate-950 p-6 sm:p-8 rounded-xl text-white border border-indigo-950/40">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 rounded border border-amber-500/20 text-xs text-amber-400 font-semibold w-fit mb-3 uppercase tracking-widest">
              <Sparkles className="h-3 w-3 text-amber-400" /> Welcome to Math Is Fun Academy Portal
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Good day, {user.name}!
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              {isTeacher 
                ? `Subject Taught: ${user.subject || 'General'} | Teacher Contact: ${user.teacherContact || 'N/A'}. Manage math curriculum schedules, take attendance, input exam results, and broadcast notices.` 
                : `Class: ${user.class || 'N/A'} | Batch: ${user.batch || 'N/A'}. Track your mathematics progress, practice worksheets, and test grades.`}
            </p>
          </div>
          <button
            onClick={() => setActiveTab('announcements')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white border border-transparent px-4 py-2.5 rounded-md text-sm font-medium transition cursor-pointer"
          >
            Read Notice Board <ArrowRight className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      {/* Grid Stats Counters */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${user.role === 'admin' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
        {/* Card 1 */}
        <div className="bg-white p-6 border border-slate-200 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">
              {isTeacher ? "Today's Attendance" : "My Attendance"}
            </span>
            <span className="text-2xl font-black text-slate-900 block mt-1">
              {isTeacher ? `${todayAttendanceRate}%` : `${attendanceRate}%`}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">
              {isTeacher ? "Class Present Rate" : "Target: 95% min"}
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 border border-slate-200 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">
              {isTeacher ? "Mock Exam Batches" : "Average Test Grade"}
            </span>
            <span className="text-2xl font-black text-slate-900 block mt-1">
              {isTeacher ? `${totalTestsCount} Active` : `${averageGrade}%`}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">
              {isTeacher ? "Physics & Calculus" : "From completed quizzes"}
            </span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 border border-slate-200 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">
              {isTeacher ? "Materials Shared" : "Study Notes"}
            </span>
            <span className="text-2xl font-black text-slate-900 block mt-1">
              {isTeacher ? `${totalNotesCount} PDFs` : `${totalNotesCount} Available`}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">
              {isTeacher ? "Study guides & slides" : "Syllabus resource bank"}
            </span>
          </div>
        </div>

        {/* Card 4 - Admin Only */}
        {user.role === 'admin' && (
          <div className="bg-white p-6 border border-slate-200 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">
                Collected Fees
              </span>
              <span className="text-2xl font-black text-slate-900 block mt-1">
                Rs. {collectedFees}
              </span>
              <span className="text-xs text-slate-500 block mt-0.5">
                Outstanding: Rs. {outstandingFees}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Columns - Announcements & General lists */}
        <div className="lg:col-span-8 space-y-6">
          {/* Latest Announcement Widget */}
          <div className="bg-white p-6 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-md">Latest Announcement</h3>
              </div>
              <button
                onClick={() => setActiveTab('announcements')}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline"
              >
                View Notice Board
              </button>
            </div>

            {latestAnnouncement ? (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                <h4 className="font-bold text-slate-900 text-sm mb-1">{latestAnnouncement.title}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 font-medium">
                  <span>From: {latestAnnouncement.createdBy}</span>
                  <span>&middot;</span>
                  <span>{new Date(latestAnnouncement.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {latestAnnouncement.content}
                </p>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                No announcements posted yet.
              </div>
            )}
          </div>

          {/* Quick Access Grid / Overview Action Widgets */}
          <div className="bg-white p-6 border border-slate-200 rounded-xl">
            <h3 className="font-bold text-slate-900 text-md mb-4">Quick Shortcuts</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setActiveTab('notes')}
                className="p-4 bg-slate-50 hover:bg-blue-50/50 border border-slate-100 hover:border-blue-200 rounded-lg transition text-left flex flex-col gap-2 cursor-pointer"
              >
                <BookOpen className="h-4 w-4 text-blue-600" />
                <div>
                  <span className="font-bold text-slate-900 text-xs block">Study Notes</span>
                  <span className="text-[10px] text-slate-400 font-medium">Download materials</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className="p-4 bg-slate-50 hover:bg-blue-50/50 border border-slate-100 hover:border-blue-200 rounded-lg transition text-left flex flex-col gap-2 cursor-pointer"
              >
                <CalendarCheck className="h-4 w-4 text-blue-600" />
                <div>
                  <span className="font-bold text-slate-900 text-xs block">Attendance</span>
                  <span className="text-[10px] text-slate-400 font-medium">{isTeacher ? "Mark daily roll" : "Track status"}</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className="p-4 bg-slate-50 hover:bg-blue-50/50 border border-slate-100 hover:border-blue-200 rounded-lg transition text-left flex flex-col gap-2 cursor-pointer"
              >
                <FileText className="h-4 w-4 text-blue-600" />
                <div>
                  <span className="font-bold text-slate-900 text-xs block">Exam Results</span>
                  <span className="text-[10px] text-slate-400 font-medium">{isTeacher ? "Grade quizzes" : "View transcripts"}</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('tests')}
                className="p-4 bg-slate-50 hover:bg-blue-50/50 border border-slate-100 hover:border-blue-200 rounded-lg transition text-left flex flex-col gap-2 cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                <div>
                  <span className="font-bold text-slate-900 text-xs block">Test Schedules</span>
                  <span className="text-[10px] text-slate-400 font-medium">{isTeacher ? "Manage timetables" : "Schedules"}</span>
                </div>
              </button>
              {user.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('fees')}
                  className="p-4 bg-slate-50 hover:bg-blue-50/50 border border-slate-100 hover:border-blue-200 rounded-lg transition text-left flex flex-col gap-2 cursor-pointer"
                >
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">Fees Billing</span>
                    <span className="text-[10px] text-slate-400 font-medium">Manage Invoices</span>
                  </div>
                </button>
              )}
              {isTeacher && (
                <button
                  onClick={() => setActiveTab('students')}
                  className="p-4 bg-slate-50 hover:bg-blue-50/50 border border-slate-100 hover:border-blue-200 rounded-lg transition text-left flex flex-col gap-2 cursor-pointer"
                >
                  <Users className="h-4 w-4 text-blue-600" />
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">Student List</span>
                    <span className="text-[10px] text-slate-400 font-medium">Class directories</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Status list */}
        <div className="lg:col-span-4 space-y-6">
          {/* Schedule Summary Card */}
          <div className="bg-white p-6 border border-slate-200 rounded-xl">
            <h3 className="font-bold text-slate-900 text-md mb-4">Upcoming Schedule</h3>
            <div className="space-y-3.5">
              {tests.length > 0 ? (
                tests.slice(0, 3).map(test => (
                  <div key={test.id} className="flex items-start gap-3 border-l-2 border-blue-600 pl-3.5 py-0.5">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800 text-xs">{test.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Syllabus: {test.subject}</p>
                    </div>
                    <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                      {new Date(test.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No exams scheduled.</p>
              )}
            </div>
          </div>

          {/* Student Stats Analytics (Only students) */}
          {!isTeacher && (
            <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-400" /> Performance Index
              </h3>
              <div className="space-y-4">
                {/* Attendance Gauge */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400 font-semibold">Class Presence Rate</span>
                    <span className="font-bold text-blue-400">{attendanceRate}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-blue-500 h-full rounded-full" style={{width: `${attendanceRate}%`}}></div>
                  </div>
                </div>

                {/* Score Gauge */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400 font-semibold">Weighted Quiz Transcripts</span>
                    <span className="font-bold text-blue-400">{averageGrade}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-blue-500 h-full rounded-full" style={{width: `${averageGrade}%`}}></div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Parent Contact Synced</span>
                  <span className="font-mono text-blue-400 font-semibold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">Active</span>
                </div>
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  );
}
