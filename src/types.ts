export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
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
  createdBy: string;
}

export interface Note {
  id: string;
  title: string;
  subject: string;
  description: string;
  fileName?: string;
  fileSize?: string;
  fileContent?: string; // Base64 or text content of the uploaded note
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
  status: 'Present' | 'Absent' ;
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

export interface GemPersona {
  id: string;
  name: string;
  description: string;
  iconName: string;
  badge: string;
  systemInstruction: string;
  targetRole: 'both' | 'teacher' | 'student';
  shareUrl?: string;
}

export type DashboardTab =
  | 'overview'
  | 'announcements'
  | 'attendance'
  | 'notes'
  | 'tests'
  | 'results'
  | 'fees'
  | 'students'
  | 'admin_panel'
  | 'faculty'
  | 'ai_gem';
