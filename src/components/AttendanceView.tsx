import React, { useState } from 'react';
import { CalendarCheck, Search, CheckCircle2, AlertTriangle, XCircle, Info, Calendar } from 'lucide-react';
import { User, Attendance } from '../types';

interface AttendanceViewProps {
  user: User;
  attendance: Attendance[];
  students: User[]; // Available for teachers to take attendance
  onRefresh: () => Promise<void>;
}

export default function AttendanceView({ user, attendance, students, onRefresh }: AttendanceViewProps) {
  const isTeacher = user.role === 'teacher';
  
  // States for student view
  const myAttendance = attendance.filter(a => a.studentId === user.id);
  const totalDays = myAttendance.length;
  const presentDays = myAttendance.filter(a => a.status === 'Present').length;
  const absentDays = myAttendance.filter(a => a.status === 'Absent').length;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

  // States for teacher view
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [attendanceForm, setAttendanceForm] = useState<{
    [studentId: string]: {
      status: 'Present' | 'Absent';
      remarks: string;
    };
  }>(() => {
    // Default form preset
    const initial: typeof attendanceForm = {};
    students.forEach(s => {
      initial[s.id] = { status: 'Present', remarks: '' };
    });
    return initial;
  });

  // Handle loading states
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // When date is selected, pre-populate if records exist
  React.useEffect(() => {
    const existingForDate = attendance.filter(a => a.date === selectedDate);
    const newForm: typeof attendanceForm = {};
    
    students.forEach(student => {
      const existingRecord = existingForDate.find(a => a.studentId === student.id);
      if (existingRecord) {
        newForm[student.id] = {
          status: existingRecord.status,
          remarks: existingRecord.remarks || ''
        };
      } else {
        newForm[student.id] = {
          status: 'Present',
          remarks: ''
        };
      }
    });

    setAttendanceForm(newForm);
  }, [selectedDate, attendance, students]);

  const handleStatusChange = (studentId: string, status: 'Present' | 'Absent') => {
    setAttendanceForm(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendanceForm(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks
      }
    }));
  };

  const handleSaveAttendance = async () => {
    setLoading(true);
    setSuccess('');
    setError('');

    const recordsPayload = Object.keys(attendanceForm).map(studentId => {
      const student = students.find(s => s.id === studentId);
      return {
        studentId,
        studentName: student?.name || 'Unknown Student',
        date: selectedDate,
        status: attendanceForm[studentId].status,
        remarks: attendanceForm[studentId].remarks
      };
    });

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-role': user.role
        },
        body: JSON.stringify({ attendanceRecords: recordsPayload })
      });

      if (!res.ok) {
        throw new Error('Failed to save attendance logs');
      }

      setSuccess('Attendance roster saved successfully!');
      await onRefresh();
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving attendance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Class Attendance</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isTeacher 
              ? 'Select class date to record daily presence, marks tardiness, and save batch notes.' 
              : 'Keep track of your active presence, late counters, and review tutor remarks.'}
          </p>
        </div>
      </div>

      {/* --- STUDENT VIEW --- */}
      {!isTeacher && (
        <div className="space-y-6">
          {/* Metrics summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 border border-slate-200 rounded-xl flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Overall Rate</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-slate-800">{attendanceRate}%</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">Satisfactory</span>
              </div>
            </div>

            <div className="bg-white p-5 border border-slate-200 rounded-xl flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Present Days</span>
                <span className="text-lg font-bold text-slate-800">{presentDays} Lectures</span>
              </div>
            </div>

            <div className="bg-white p-5 border border-slate-200 rounded-xl flex items-center gap-3">
              <div className="p-2.5 bg-slate-100 text-slate-600 rounded">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Absent Days</span>
                <span className="text-lg font-bold text-slate-800">{absentDays} Days</span>
              </div>
            </div>
          </div>

          {/* Attendance Log Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-xs sm:text-sm uppercase tracking-wider">Attendance History Logs</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Remarks / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myAttendance.length > 0 ? (
                    myAttendance.map(att => (
                      <tr key={att.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-3.5 font-medium text-slate-800 font-mono">
                          {new Date(att.date).toLocaleDateString(undefined, {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            att.status === 'Present'
                              ? 'bg-blue-50 text-blue-600 border border-blue-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            <span className={`w-1 h-1 rounded-full ${
                              att.status === 'Present' ? 'bg-blue-500' : 'bg-slate-400'
                            }`}></span>
                            {att.status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-slate-500 italic max-w-sm truncate">
                          {att.remarks || 'No remarks added'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-slate-400 text-xs">
                        No attendance history logs recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TEACHER VIEW --- */}
      {isTeacher && (
        <div className="space-y-6">
          {/* Controls bar */}
          <div className="bg-white p-5 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Calendar className="h-4.5 w-4.5 text-blue-600" />
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block shrink-0">
                Roll Call Date:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 text-xs text-slate-800"
              />
            </div>
            
            <button
              onClick={handleSaveAttendance}
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? 'Saving...' : 'Save Roster Entries'}
            </button>
          </div>

          {/* Feedback */}
          {success && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded text-blue-600 text-xs font-medium">
              {success}
            </div>
          )}
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded text-red-600 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Student attendance grid list */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-xs sm:text-sm uppercase tracking-wider">Roll Call List ({students.length} Students)</h3>
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Date: {selectedDate}</span>
            </div>

            <div className="divide-y divide-slate-100">
              {students.map(student => {
                const formVal = attendanceForm[student.id] || { status: 'Present', remarks: '' };
                return (
                  <div key={student.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/20 transition">
                    {/* Student Info */}
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-slate-100 hover:bg-slate-200 rounded flex items-center justify-center font-bold text-slate-700 text-xs transition border border-slate-200">
                        {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{student.name}</h4>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                          {student.class || 'No Grade'} &bull; {student.batch || 'No Batch'}
                        </p>
                      </div>
                    </div>

                    {/* Radio Status Selector toggles */}
                    <div className="flex gap-1 bg-slate-100 p-1 rounded">
                      {(['Present', 'Absent'] as const).map(statusOpt => {
                        const isSel = formVal.status === statusOpt;
                        return (
                          <button
                            key={statusOpt}
                            onClick={() => handleStatusChange(student.id, statusOpt)}
                            type="button"
                            className={`px-3 py-1.5 text-[10px] font-bold rounded transition ${
                              isSel
                                ? statusOpt === 'Present'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-red-600 text-white'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            {statusOpt}
                          </button>
                        );
                      })}
                    </div>

                    {/* Remarks Input field */}
                    <div className="w-full md:w-64">
                      <input
                        type="text"
                        placeholder="Remarks / Note (optional)"
                        value={formVal.remarks}
                        onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/10 text-xs text-slate-700 placeholder-slate-400"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
