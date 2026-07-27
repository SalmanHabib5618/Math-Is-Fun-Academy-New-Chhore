import React, { useState, useRef } from 'react';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Trash2, 
  Download, 
  FileText, 
  Sparkles, 
  Upload, 
  Filter, 
  Eye, 
  X, 
  FileUp 
} from 'lucide-react';
import { User, Note } from '../types';

interface NotesViewProps {
  user: User;
  notes: Note[];
  onRefresh: () => Promise<void>;
}

export default function NotesView({ user, notes, onRefresh }: NotesViewProps) {
  const isTeacher = user.role === 'teacher';
  
  // Search & Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');

  // New Note state
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<{ name: string; size: string; content: string } | null>(null);
  
  // DragnDrop states
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal Note Previewer states
  const [previewNote, setPreviewNote] = useState<Note | null>(null);

  // Posting States
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Extract unique subjects
  const subjectsList = ['All', ...new Set(notes.map(n => n.subject))];

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (fileObj: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const sizeMB = (fileObj.size / (1024 * 1024)).toFixed(1);
      setFile({
        name: fileObj.name,
        size: `${sizeMB} MB`,
        content: base64
      });
    };
    reader.readAsDataURL(fileObj);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // Submit new Note
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setLoading(true);
    setSuccess('');
    setError('');

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-role': user.role
        },
        body: JSON.stringify({
          title,
          subject,
          description,
          fileName: file?.name || 'lecture_notes.pdf',
          fileSize: file?.size || '1.0 MB',
          fileContent: file?.content || 'VmVyeSBwb2xpc2hlZCBjbGFzcyBub3Rlcy4uLg==',
          createdBy: user.name
        })
      });

      if (!res.ok) {
        throw new Error('Failed to upload study note');
      }

      setTitle('');
      setDescription('');
      setFile(null);
      setSuccess('Study material uploaded and cataloged!');
      await onRefresh();
    } catch (err: any) {
      setError(err.message || 'Error uploading file.');
    } finally {
      setLoading(false);
    }
  };

  // Delete note
  const handleDelete = async (noteId: string) => {
    if (!window.confirm('Are you sure you want to delete this study note?')) return;

    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.id,
          'x-user-role': user.role
        }
      });

      if (!res.ok) {
        throw new Error('Failed to delete note');
      }

      await onRefresh();
    } catch (err: any) {
      setError('Could not delete note. Please try again.');
    }
  };

  // Download simulation helper
  const handleDownload = (note: Note) => {
    if (!note.fileContent) return;
    
    const link = document.createElement('a');
    link.href = note.fileContent;
    link.download = note.fileName || 'notes.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter logic
  const filteredNotes = notes.filter(note => {
    const matchesSearch = 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      note.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.subject.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSubject = subjectFilter === 'All' || note.subject === subjectFilter;

    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Study Material & Notes</h2>
          <p className="text-xs text-slate-500 mt-0.5">Access revision guides, downloadable test banks, and classroom presentation slides.</p>
        </div>
      </div>

      {/* Grid: Upload form (Teachers only) and Notes list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Teacher Upload Panel */}
        {isTeacher && (
          <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-slate-200 h-fit space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileUp className="h-4.5 w-4.5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">Upload Material</h3>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-xs font-medium">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-600 text-xs font-medium">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kinematics Chapter 4 Slide deck"
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
                    Demo Size
                  </label>
                  <span className="block px-3 py-2 bg-slate-50 border border-slate-200 text-[11px] text-slate-500 rounded font-mono truncate">
                    {file ? file.size : 'No file picked'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Description / Syllabus Covered
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Summarize the core topics covered..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs text-slate-800 placeholder-slate-400"
                />
              </div>

              {/* Usability mandate: File Upload supporting both Drag-and-Drop and Manual Selection */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Attachment File
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50/10'
                      : file
                      ? 'border-blue-500 bg-blue-50/5'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
                  />
                  <Upload className={`h-6 w-6 ${file ? 'text-blue-600' : 'text-slate-400'}`} />
                  <div>
                    <span className="text-[10px] font-semibold text-slate-700 block">
                      {file ? file.name : 'Click to upload or drag file here'}
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      PDF, DOCX, PPTX (Max 10MB)
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 text-xs font-semibold rounded text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer"
              >
                {loading ? 'Uploading...' : 'Publish Study Notes'}
              </button>
            </form>
          </div>
        )}

        {/* Notes listings Panel */}
        <div className={isTeacher ? 'lg:col-span-8 space-y-4' : 'lg:col-span-12 space-y-4'}>
          {/* Filters controls row */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search notes, topics, keys..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs text-slate-800 placeholder-slate-400"
              />
            </div>

            {/* Subject Filters pillbox */}
            <div className="flex gap-1 overflow-x-auto w-full sm:w-auto scrollbar-none">
              {subjectsList.map(sub => {
                const isSel = subjectFilter === sub;
                return (
                  <button
                    key={sub}
                    onClick={() => setSubjectFilter(sub)}
                    className={`px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      isSel
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredNotes.length > 0 ? (
              filteredNotes.map(note => (
                <div 
                  key={note.id} 
                  className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition duration-200 flex flex-col justify-between"
                >
                  <div>
                    {/* Header line with Subject pill */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        note.subject === 'Physics'
                          ? 'bg-blue-50 text-blue-600 border border-blue-200'
                          : note.subject === 'Mathematics'
                          ? 'bg-slate-100 text-slate-700 border border-slate-200'
                          : note.subject === 'Chemistry'
                          ? 'bg-blue-50/50 text-blue-800 border border-blue-200/50'
                          : 'bg-amber-50 text-amber-600 border border-amber-200'
                      }`}>
                        {note.subject}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-medium">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm sm:text-md mb-1.5 tracking-tight line-clamp-1" title={note.title}>
                      {note.title}
                    </h4>
                    
                    <p className="text-slate-500 text-xs leading-relaxed mb-4 line-clamp-2">
                      {note.description}
                    </p>
                  </div>

                  {/* Actions footer bar */}
                  <div className="flex items-center justify-between pt-3.5 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-semibold">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="truncate max-w-[100px]">{note.fileName || 'notes.pdf'}</span>
                      <span>({note.fileSize || '1.2 MB'})</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setPreviewNote(note)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                        title="Preview notes document"
                        aria-label="Preview notes document"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(note)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                        title="Download notes file"
                        aria-label="Download notes file"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      {isTeacher && (
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition cursor-pointer"
                          title="Delete study notes"
                          aria-label="Delete study notes"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                <BookOpen className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                <p className="text-xs">No study materials match your search parameters.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* --- PREVIEW TRANSCRIPT MODAL --- */}
      {previewNote && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-xl w-full flex flex-col overflow-hidden max-h-[85vh]">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4.5 w-4.5 text-blue-400" />
                <h4 className="font-bold text-xs sm:text-sm truncate max-w-xs">{previewNote.title}</h4>
              </div>
              <button
                onClick={() => setPreviewNote(null)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
                aria-label="Close notes preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <span className="bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                  {previewNote.subject}
                </span>
                <span className="text-[11px] text-slate-400 ml-3 font-medium">Uploaded by: {previewNote.createdBy}</span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded">
                <h5 className="font-semibold text-slate-800 text-xs uppercase tracking-wider mb-1">Topics & Description</h5>
                <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-line">{previewNote.description}</p>
              </div>

              {/* Mock reader pane visual */}
              <div className="border border-slate-200 rounded p-8 bg-slate-50 flex flex-col items-center justify-center text-center">
                <FileText className="h-10 w-10 text-blue-600 mb-2" />
                <span className="text-xs font-bold text-slate-700 block">{previewNote.fileName || 'notes.pdf'}</span>
                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">Secure PDF document &bull; {previewNote.fileSize || '1.0 MB'}</span>
                
                <button
                  onClick={() => {
                    handleDownload(previewNote);
                    setPreviewNote(null);
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded transition cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" /> Download Full Syllabus PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
