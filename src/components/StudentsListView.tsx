import React, { useState } from 'react';
import { Users, Search, GraduationCap, Phone, Mail, Award, Calendar } from 'lucide-react';
import { User } from '../types';

interface StudentsListViewProps {
  students: User[];
}

export default function StudentsListView({ students }: StudentsListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('All');

  const classes = ['All', ...new Set(students.map(s => s.class || 'Unassigned'))];

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.batch && student.batch.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesClass = classFilter === 'All' || student.class === classFilter;

    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Active Students Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">Browse through enrolled student profiles, search by class streams, and look up parents' contacts.</p>
        </div>
      </div>

      {/* Filter Controls Row */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search students, emails, batches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Classes selector tab */}
        <div className="flex gap-1 overflow-x-auto w-full sm:w-auto scrollbar-none">
          {classes.map(cl => {
            const isSel = classFilter === cl;
            return (
              <button
                key={cl}
                onClick={() => setClassFilter(cl)}
                className={`px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  isSel
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                {cl}
              </button>
            );
          })}
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.length > 0 ? (
          filteredStudents.map(student => (
            <div
              key={student.id}
              className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Profile Header line */}
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="h-11 w-11 bg-slate-100 text-blue-600 font-black rounded-full flex items-center justify-center text-sm border border-slate-200">
                    {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{student.name}</h4>
                    <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 text-[9px] font-bold uppercase tracking-wider rounded mt-1">
                      {student.class || 'Unassigned'}
                    </span>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{student.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">Batch: {student.batch || 'General Batch'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">Parent: {student.parentContact || 'Not Provided'}</span>
                  </div>
                </div>
              </div>

              {/* Status bar */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-medium">System ID: {student.id}</span>
                <span className="font-bold text-[9px] uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">Roster Active</span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            <Users className="h-10 w-10 text-slate-200 mx-auto mb-2" />
            <p className="text-xs">No active student profiles match your search criteria.</p>
          </div>
        )}
      </div>

    </div>
  );
}
