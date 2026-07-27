import React, { useState } from 'react';
import { FileText, Award, Star, Plus, Trash2, Search, Filter } from 'lucide-react';
import { User, Test, Result } from '../types';

interface ResultsViewProps {
  user: User;
  tests: Test[];
  students: User[]; // Available for teachers to select student
  results: Result[];
  onRefresh: () => Promise<void>;
}

export default function ResultsView({ user, tests, students, results, onRefresh }: ResultsViewProps) {
  const isTeacher = user.role === 'teacher';

  // State for new score entry
  const [selectedTestId, setSelectedTestId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [marksObtained, setMarksObtained] = useState('');
  const [remarks, setRemarks] = useState('');

  // Search & Filtering states
  const [searchQuery, setSearchQuery] = useState('');

  // Grading states
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Grade calculator helper
  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { label: 'A+', color: 'bg-blue-50 text-blue-600 border-blue-200' };
    if (percentage >= 80) return { label: 'A', color: 'bg-blue-50/50 text-blue-700 border-blue-100' };
    if (percentage >= 70) return { label: 'B', color: 'bg-slate-50 text-slate-700 border-slate-200' };
    if (percentage >= 60) return { label: 'C', color: 'bg-slate-50 text-slate-700 border-slate-200' };
    if (percentage >= 50) return { label: 'D', color: 'bg-slate-50 text-slate-700 border-slate-200' };
    return { label: 'F', color: 'bg-red-50 text-red-600 border-red-200' };
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedTestId || !selectedStudentId || marksObtained === '') {
      setError('Please select a test, student, and input valid scores.');
      return;
    }

    const test = tests.find(t => t.id === selectedTestId);
    const student = students.find(s => s.id === selectedStudentId);

    if (!test || !student) {
      setError('Selected exam paper or student not found in roster database.');
      return;
    }

    const marksNum = Number(marksObtained);
    if (marksNum < 0 || marksNum > test.maxMarks) {
      setError(`Marks obtained must be between 0 and the test maximum (${test.maxMarks} marks).`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-role': user.role
        },
        body: JSON.stringify({
          testId: test.id,
          testTitle: test.title,
          studentId: student.id,
          studentName: student.name,
          marksObtained: marksNum,
          maxMarks: test.maxMarks,
          remarks
        })
      });

      if (!res.ok) {
        throw new Error('Failed to submit grading transcripts');
      }

      setMarksObtained('');
      setRemarks('');
      setSuccess(`Grading transcript successfully recorded for ${student.name}!`);
      await onRefresh();
    } catch (err: any) {
      setError(err.message || 'Error occurred while grading.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (resId: string) => {
    if (!window.confirm('Are you sure you want to delete this graded entry?')) return;

    try {
      const res = await fetch(`/api/results/${resId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.id,
          'x-user-role': user.role
        }
      });

      if (!res.ok) {
        throw new Error('Failed to delete grade record');
      }

      await onRefresh();
    } catch (err: any) {
      setError('Could not delete grade record. Please try again.');
    }
  };

  // Filter logic
  const filteredResults = results.filter(res => {
    return (
      res.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.testTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.remarks.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Academic Transcripts & Results</h2>
          <p className="text-xs text-slate-500 mt-0.5">Track consolidated subject performance index, grade distributions, and teacher remarks.</p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Grade Posting Panel (Teachers only) */}
        {isTeacher && (
          <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-slate-200 h-fit">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
              <Plus className="h-4.5 w-4.5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">Post Exam Grade</h3>
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

            <form onSubmit={handleGradeSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Select Exam Paper
                </label>
                <select
                  required
                  value={selectedTestId}
                  onChange={(e) => setSelectedTestId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs text-slate-800 bg-white"
                >
                  <option value="">-- Choose Scheduled Test --</option>
                  {tests.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.maxMarks}M)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Select Student
                </label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs text-slate-800 bg-white"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.class})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Marks Obtained
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  placeholder="e.g. 45"
                  value={marksObtained}
                  onChange={(e) => setMarksObtained(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Teacher Remarks / Feedback
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Excellent proof-writing skills. Keep it up!"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs text-slate-800 placeholder-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 text-xs font-semibold rounded text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer"
              >
                {loading ? 'Recording...' : 'Submit Grade Entry'}
              </button>
            </form>
          </div>
        )}

        {/* Scores & Transcripts display panel */}
        <div className={isTeacher ? 'lg:col-span-8 space-y-4' : 'lg:col-span-12 space-y-4'}>
          
          {/* List header filter box (Only teachers or filter search) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={isTeacher ? "Search student, exam, or remarks..." : "Search quiz papers..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs text-slate-800 placeholder-slate-400"
              />
            </div>
            <span className="text-xs font-mono font-medium text-slate-400 hidden sm:inline">
              Roster database: {filteredResults.length} records
            </span>
          </div>

          {/* Records Display Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredResults.length > 0 ? (
              filteredResults.map(res => {
                const percentage = Math.round((res.marksObtained / res.maxMarks) * 100);
                const grade = getGrade(percentage);
                return (
                  <div
                    key={res.id}
                    className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition duration-200 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Bar with score percent and grade letter badge */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-500 fill-amber-400" /> Score: {res.marksObtained}/{res.maxMarks} ({percentage}%)
                        </span>

                        <span className={`px-2.5 py-0.5 rounded text-xs font-black border uppercase tracking-wider ${grade.color}`}>
                          {grade.label}
                        </span>
                      </div>

                      {/* Student info (Teachers see student name, students only see exam) */}
                      {isTeacher && (
                        <div className="mb-2">
                          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Student</span>
                          <span className="text-xs font-bold text-slate-800 block">{res.studentName}</span>
                        </div>
                      )}

                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight leading-snug mb-1">
                        {res.testTitle}
                      </h4>

                      {/* Remarks block */}
                      <p className="text-slate-500 text-xs leading-relaxed italic bg-slate-50 border border-slate-200 p-3 rounded mt-3">
                        "{res.remarks || 'No remarks provided.'}"
                      </p>
                    </div>

                    {/* Footer Row */}
                    <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 mt-4 text-[10px] text-slate-400">
                      <span className="font-medium">Graded: {new Date(res.createdAt).toLocaleDateString()}</span>
                      {isTeacher && (
                        <button
                          onClick={() => handleDelete(res.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition cursor-pointer"
                          title="Delete grade entry"
                          aria-label="Delete grade entry"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                <FileText className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                <p className="text-xs">No grades or exam result scripts match your parameters.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
