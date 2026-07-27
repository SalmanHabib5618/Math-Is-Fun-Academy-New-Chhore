import React, { useState } from 'react';
import { FileSpreadsheet, Calendar, Plus, Trash2, ShieldAlert, Award } from 'lucide-react';
import { User, Test } from '../types';

interface TestsViewProps {
  user: User;
  tests: Test[];
  onRefresh: () => Promise<void>;
}

export default function TestsView({ user, tests, onRefresh }: TestsViewProps) {
  const isTeacher = user.role === 'teacher';

  // State for new schedule
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [maxMarks, setMaxMarks] = useState(100);
  const [date, setDate] = useState('');
  
  // Posting states
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Submit test schedule
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    setLoading(true);
    setSuccess('');
    setError('');

    try {
      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-role': user.role
        },
        body: JSON.stringify({
          title,
          subject,
          maxMarks,
          date,
          createdBy: user.name
        })
      });

      if (!res.ok) {
        throw new Error('Failed to schedule test');
      }

      setTitle('');
      setDate('');
      setSuccess('Test schedule posted and broadcasted successfully!');
      await onRefresh();
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving test.');
    } finally {
      setLoading(false);
    }
  };

  // Delete test
  const handleDelete = async (testId: string) => {
    if (!window.confirm('Are you sure you want to delete this test schedule? This will also purge all graded transcripts associated with this test.')) return;

    try {
      const res = await fetch(`/api/tests/${testId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.id,
          'x-user-role': user.role
        }
      });

      if (!res.ok) {
        throw new Error('Failed to delete test');
      }

      await onRefresh();
    } catch (err: any) {
      setError('Could not delete test. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Test Timetables & Schedules</h2>
          <p className="text-xs text-slate-500 mt-0.5">Stay aware of upcoming periodic review assessments, quizzes, and mock exams.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Scheduler Form (Teachers only) */}
        {isTeacher && (
          <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-slate-200 h-fit">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
              <Calendar className="h-4.5 w-4.5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">Schedule New Test</h3>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-xs font-medium">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-600 text-xs font-medium">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Test / Exam Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 4: Kinematics Mid-quiz"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs text-slate-800 placeholder-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Subject Stream
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs text-slate-800 bg-white"
                  >
                    <option value="Physics">Physics</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Maximum Marks
                  </label>
                  <input
                    type="number"
                    required
                    min={10}
                    max={100}
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Assessment Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 text-xs font-semibold rounded text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer"
              >
                {loading ? 'Posting...' : 'Schedule Exam'}
              </button>
            </form>
          </div>
        )}

        {/* Schedules list panel */}
        <div className={isTeacher ? 'lg:col-span-8 space-y-4' : 'lg:col-span-12 space-y-4'}>
          {tests.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tests.map(test => {
                const testDate = new Date(test.date);
                const isUpcoming = testDate.getTime() >= new Date().setHours(0,0,0,0);
                
                return (
                  <div
                    key={test.id}
                    className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition duration-200 flex flex-col justify-between"
                  >
                    <div>
                      {/* Badge line */}
                      <div className="flex items-center justify-between mb-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          test.subject === 'Physics'
                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {test.subject}
                        </span>
                        
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          isUpcoming
                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}>
                          {isUpcoming ? '● Upcoming' : 'Completed'}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight leading-snug mb-1">
                        {test.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mb-4">Posted by: {test.createdBy}</p>
                    </div>

                    {/* Meta details footer */}
                    <div className="flex items-center justify-between pt-3.5 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>{testDate.toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1">
                          <Award className="h-3 w-3 text-blue-600" /> Max: {test.maxMarks}M
                        </span>
                        {isTeacher && (
                          <button
                            onClick={() => handleDelete(test.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition cursor-pointer"
                            title="Delete test"
                            aria-label="Delete test"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              <FileSpreadsheet className="h-10 w-10 text-slate-200 mx-auto mb-2" />
              <p className="text-xs">No exam or quiz schedules have been posted.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
