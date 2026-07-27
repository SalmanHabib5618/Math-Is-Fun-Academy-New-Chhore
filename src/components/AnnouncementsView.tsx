import React, { useState } from 'react';
import { Bell, Megaphone, Trash2, Calendar, User, Sparkles } from 'lucide-react';
import { User as UserType, Announcement } from '../types';

interface AnnouncementsViewProps {
  user: UserType;
  announcements: Announcement[];
  onRefresh: () => Promise<void>;
}

export default function AnnouncementsView({ user, announcements, onRefresh }: AnnouncementsViewProps) {
  const canManage = user.role === 'teacher' || user.role === 'admin';
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-role': user.role
        },
        body: JSON.stringify({
          title,
          content,
          createdBy: user.name
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to post announcement');
      }

      setTitle('');
      setContent('');
      setSuccess('Announcement broadcasted successfully!');
      await onRefresh();
    } catch (err: any) {
      setError(err.message || 'Error occurred while broadcasting.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (annId: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const res = await fetch(`/api/announcements/${annId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.id,
          'x-user-role': user.role
        }
      });

      if (!res.ok) {
        throw new Error('Failed to delete announcement');
      }

      await onRefresh();
    } catch (err: any) {
      setError('Failed to delete announcement. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Tuition Board & Announcements</h2>
          <p className="text-xs text-slate-500 mt-0.5">Stay updated with official bulletins, holiday lists, and scheduled mock exam timetables.</p>
        </div>
      </div>

      {/* Grid Layout for Forms (Teacher only) and Bulletin list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Post Form column for Teachers */}
        {canManage && (
          <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-slate-200 h-fit">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
              <Megaphone className="h-4.5 w-4.5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">Post New Bulletin</h3>
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
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Bulletin Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 📅 Mock Exams Schedule"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs text-slate-800 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Message Content
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Provide explicit instructions, dates, timings or download requirements..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs text-slate-800 placeholder-slate-400 leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 text-xs font-semibold rounded text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer"
              >
                {loading ? 'Posting...' : 'Broadcast Notice'}
              </button>
            </form>
          </div>
        )}

        {/* Announcements List Panel */}
        <div className={canManage ? 'lg:col-span-8 space-y-4' : 'lg:col-span-12 space-y-4'}>
          {announcements.length > 0 ? (
            announcements.map((ann, idx) => (
              <div
                key={ann.id}
                id={`ann-card-${ann.id}`}
                className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition duration-200 group relative"
              >
                {/* Visual Top Ribbon highlight for the latest note */}
                {idx === 0 && (
                  <span className="absolute top-0 left-6 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
                    <Sparkles className="h-3 w-3" /> New
                  </span>
                )}

                <div className="flex justify-between items-start gap-4 mb-2.5">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight leading-snug">
                    {ann.title}
                  </h3>
                  {canManage && (
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Delete notice"
                      aria-label="Delete notice"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mb-3.5 font-medium border-b border-slate-50 pb-2.5">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-slate-300" /> {ann.createdBy}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-300" /> {new Date(ann.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {/* Announcement text content */}
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                  {ann.content}
                </p>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
              <Bell className="h-10 w-10 text-slate-200 mx-auto mb-2" />
              <p className="text-xs">No announcements or bulleting notifications have been posted yet.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
