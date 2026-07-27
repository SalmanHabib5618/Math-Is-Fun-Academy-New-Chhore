import fs from 'fs';
import path from 'path';

// Define DB Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  passwordHash: string; // simpler plain text or simple hash for development demo
  class?: string;
  batch?: string;
  parentContact?: string;
  subject?: string;
  teacherContact?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  createdBy: string; // Teacher name
}

export interface Note {
  id: string;
  title: string;
  subject: string;
  description: string;
  fileName?: string;
  fileSize?: string;
  fileContent?: string; // Base64 or plain text content
  createdAt: string;
  createdBy: string;
}

export interface Test {
  id: string;
  title: string;
  subject: string;
  maxMarks: number;
  date: string;
  createdAt: string;
  createdBy: string;
}

export interface Result {
  id: string;
  testId: string;
  testTitle: string;
  studentId: string;
  studentName: string;
  marksObtained: number;
  maxMarks: number;
  remarks: string;
  createdAt: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late';
  remarks?: string;
}

export interface Fee {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Unpaid' | 'Pending';
  paidDate?: string;
  month: string;
}

export interface DatabaseSchema {
  users: User[];
  announcements: Announcement[];
  notes: Note[];
  tests: Test[];
  results: Result[];
  attendance: Attendance[];
  fees: Fee[];
}

const DB_DIR = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'tuition_db.json');
const SEED_FILE = path.join(process.cwd(), 'data', 'tuition_db.json');

// High-quality Initial Seed Data - Contains ONLY Admin user, no default demo student/teacher records
const defaultData: DatabaseSchema = {
  users: [
    {
      id: 'admin-main',
      email: 'sh7788059@gmail.com',
      name: 'Salman Habib',
      role: 'admin',
      passwordHash: '4410775421191'
    }
  ],
  announcements: [],
  notes: [],
  tests: [],
  results: [],
  attendance: [],
  fees: []
};

// Ensure database directory and file exist
export function initDB() {
  if (!fs.existsSync(DB_DIR)) {
    try {
      fs.mkdirSync(DB_DIR, { recursive: true });
    } catch (e) {
      console.error('Error creating DB directory:', e);
    }
  }
  if (!fs.existsSync(DB_FILE)) {
    let initialContent = defaultData;
    if (fs.existsSync(SEED_FILE)) {
      try {
        const seedData = fs.readFileSync(SEED_FILE, 'utf-8');
        initialContent = JSON.parse(seedData);
      } catch (e) {
        console.error('Error reading seed DB file:', e);
      }
    }
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialContent, null, 2), 'utf-8');
      console.log('Database initialized with seed data.');
    } catch (e) {
      console.error('Error writing DB file:', e);
    }
  } else {
    // Check and clean up old default demo records if present
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const db = JSON.parse(data) as DatabaseSchema;
      
      const demoUserIds = ['teacher-sarah', 'student-john', 'student-alex', 'student-lily'];
      const demoAnnIds = ['ann-1', 'ann-2'];
      const demoNoteIds = ['note-1', 'note-2'];
      const demoTestIds = ['test-1', 'test-2'];
      const demoResIds = ['res-1', 'res-2', 'res-3', 'res-4'];
      const demoAttIds = ['att-1', 'att-2', 'att-3', 'att-4', 'att-5', 'att-6', 'att-7', 'att-8', 'att-9'];
      const demoFeeIds = ['fee-1', 'fee-2', 'fee-3', 'fee-4', 'fee-5'];

      let modified = false;

      // Filter demo users out
      if (db.users) {
        const filteredUsers = db.users.filter(u => !demoUserIds.includes(u.id) && u.email !== 'teacher@tuition.com' && u.email !== 'student@tuition.com' && u.email !== 'alex@tuition.com' && u.email !== 'lily@tuition.com');
        if (filteredUsers.length !== db.users.length) {
          db.users = filteredUsers;
          modified = true;
        }
      } else {
        db.users = [];
        modified = true;
      }

      // Enforce Admin user exists with correct password
      const adminUser = db.users.find(u => u.role === 'admin');
      if (!adminUser) {
        db.users.unshift({
          id: 'admin-main',
          email: 'sh7788059@gmail.com',
          name: 'Salman Habib',
          role: 'admin',
          passwordHash: '4410775421191'
        });
        modified = true;
      } else {
        if (adminUser.passwordHash !== '4410775421191') {
          adminUser.passwordHash = '4410775421191';
          modified = true;
        }
      }

      // Clean default demo records from collections
      if (db.announcements) {
        const filtered = db.announcements.filter(a => !demoAnnIds.includes(a.id));
        if (filtered.length !== db.announcements.length) { db.announcements = filtered; modified = true; }
      }
      if (db.notes) {
        const filtered = db.notes.filter(n => !demoNoteIds.includes(n.id));
        if (filtered.length !== db.notes.length) { db.notes = filtered; modified = true; }
      }
      if (db.tests) {
        const filtered = db.tests.filter(t => !demoTestIds.includes(t.id));
        if (filtered.length !== db.tests.length) { db.tests = filtered; modified = true; }
      }
      if (db.results) {
        const filtered = db.results.filter(r => !demoResIds.includes(r.id) && !demoUserIds.includes(r.studentId));
        if (filtered.length !== db.results.length) { db.results = filtered; modified = true; }
      }
      if (db.attendance) {
        const filtered = db.attendance.filter(a => !demoAttIds.includes(a.id) && !demoUserIds.includes(a.studentId));
        if (filtered.length !== db.attendance.length) { db.attendance = filtered; modified = true; }
      }
      if (db.fees) {
        const filtered = db.fees.filter(f => !demoFeeIds.includes(f.id) && !demoUserIds.includes(f.studentId));
        if (filtered.length !== db.fees.length) { db.fees = filtered; modified = true; }
      }

      if (modified) {
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
        console.log('Database cleaned: removed default demo records.');
      }
    } catch (e) {
      console.error('Error auto-seeding admin / cleaning DB to existing file:', e);
    }
  }
}

// Get entire database
export function getDB(): DatabaseSchema {
  initDB();
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data) as DatabaseSchema;
  } catch (error) {
    console.error('Error reading database file, returning defaults', error);
    return defaultData;
  }
}

// Save database
export function saveDB(data: DatabaseSchema) {
  initDB();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to database file', error);
  }
}
