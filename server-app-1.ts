import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import {
  getDB,
  saveDB,
  initDB,
  User,
  Announcement,
  Note,
  Test,
  Result,
  Attendance,
  Fee
} from './server/db.js';
import { syncToGoogleSheets, syncAllToGoogleSheets, getSyncHistory, getScriptUrl, setScriptUrl, createDirectSpreadsheet } from './server/sheets.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from './server/gmail.js';

let cachedApp: express.Express | null = null;

// buildApp() creates (and caches) the Express app with all routes registered.
// Unlike the original server.ts, this never calls app.listen() — that's the
// caller's job (see server.ts for local dev, api/index.ts for Vercel).
export async function buildApp(): Promise<express.Express> {
  if (cachedApp) return cachedApp;

  const app = express();

  // Initialize Firestore seed data (creates the admin user doc if missing)
  await initDB();

  app.use(express.json({ limit: '20mb' }));

  const requireTeacher = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'teacher' && userRole !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Teacher or Admin access required.' });
      return;
    }
    next();
  };

  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Admin access required.' });
      return;
    }
    next();
  };

  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: Session missing.' });
      return;
    }
    next();
  };

  // --- API ROUTES ---

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const db = await getDB();
    const user = db.users.find(u =>
      u.email.toLowerCase() === email.toLowerCase() ||
      u.name.toLowerCase() === email.toLowerCase()
    );

    if (!user || user.passwordHash !== password) {
      res.status(401).json({ error: 'Invalid name, email or password.' });
      return;
    }

    const { passwordHash, ...userResponse } = user;
    syncToGoogleSheets('login', 'auth', userResponse);
    res.json(userResponse);
  });

  app.post('/api/auth/register', async (req, res) => {
    const { email, password, name, role, className, batch, parentContact, subject, teacherContact } = req.body;
    if (!email || !password || !name || !role) {
      res.status(400).json({ error: 'Required fields missing: email, password, name, role.' });
      return;
    }

    if (role === 'admin') {
      res.status(403).json({ error: 'Forbidden: Administrator accounts cannot be registered publicly. They must be created by an existing administrator.' });
      return;
    }

    const db = await getDB();
    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      res.status(409).json({ error: 'Email already registered.' });
      return;
    }

    const newUser: User = {
      id: `${role}-${Date.now()}`,
      email: email.toLowerCase(),
      name,
      role: role as 'student' | 'teacher',
      passwordHash: password,
      ...(role === 'student' ? {
        class: className || 'Unassigned',
        batch: batch || 'General Batch',
        parentContact: parentContact || ''
      } : {
        subject: subject || 'General',
        teacherContact: teacherContact || ''
      })
    };

    db.users.push(newUser);
    await saveDB(db);

    sendWelcomeEmail(newUser.email, newUser.name, newUser.role).catch(err => {
      console.error('[Gmail Automation Error]:', err);
    });

    const { passwordHash, ...userResponse } = newUser;
    syncToGoogleSheets('register', 'user', userResponse);
    res.status(201).json(userResponse);
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Please enter your registered email address or full name.' });
      return;
    }

    const db = await getDB();
    const cleanSearch = email.trim().toLowerCase();
    const user = db.users.find(u =>
      u.email.toLowerCase() === cleanSearch ||
      u.name.toLowerCase() === cleanSearch
    );

    if (!user) {
      res.status(404).json({ error: `No account found for "${email}". Please verify your registered email address or sign up.` });
      return;
    }

    if (user.role === 'admin') {
      res.status(403).json({ error: 'Access Denied: Admin portal is secured. Admin password cannot be reset via Forgot Password method.' });
      return;
    }

    const tempPassword = `Math${Math.floor(100000 + Math.random() * 900000)}!`;
    user.passwordHash = tempPassword;
    await saveDB(db);

    sendPasswordResetEmail(user.email, user.name, tempPassword).catch(err => {
      console.error('[Gmail Automation Error]:', err);
    });

    syncToGoogleSheets('forgot_password', 'auth', { id: user.id, email: user.email, name: user.name });

    res.json({
      success: true,
      message: `A new password has been generated and dispatched to ${user.email}.`,
      tempPassword,
      email: user.email,
      name: user.name
    });
  });

  app.get('/api/users/profile', requireAuth, async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    const db = await getDB();
    const user = db.users.find(u => u.id === userId);

    if (!user) {
      res.status(404).json({ error: 'User profile not found.' });
      return;
    }

    const { passwordHash, ...userResponse } = user;
    res.json(userResponse);
  });

  app.get('/api/students', requireAuth, requireTeacher, async (req, res) => {
    const db = await getDB();
    const students = db.users
      .filter(u => u.role === 'student')
      .map(({ passwordHash, ...student }) => student);
    res.json(students);
  });

  app.get('/api/announcements', requireAuth, async (req, res) => {
    const db = await getDB();
    const sorted = [...db.announcements].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json(sorted);
  });

  app.post('/api/announcements', requireAuth, requireTeacher, async (req, res) => {
    const { title, content, createdBy } = req.body;
    if (!title || !content) {
      res.status(400).json({ error: 'Title and content are required.' });
      return;
    }

    const db = await getDB();
    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title,
      content,
      createdAt: new Date().toISOString(),
      createdBy: createdBy || 'Teacher'
    };

    db.announcements.push(newAnn);
    await saveDB(db);
    syncToGoogleSheets('create', 'announcement', newAnn);
    res.status(201).json(newAnn);
  });

  app.delete('/api/announcements/:id', requireAuth, requireTeacher, async (req, res) => {
    const { id } = req.params;
    const db = await getDB();
    const index = db.announcements.findIndex(a => a.id === id);

    if (index === -1) {
      res.status(404).json({ error: 'Announcement not found.' });
      return;
    }

    const deletedAnn = db.announcements[index];
    db.announcements.splice(index, 1);
    await saveDB(db);
    syncToGoogleSheets('delete', 'announcement', { id, title: deletedAnn.title });
    res.json({ success: true, message: 'Announcement deleted.' });
  });

  app.get('/api/notes', requireAuth, async (req, res) => {
    const db = await getDB();
    const sorted = [...db.notes].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json(sorted);
  });

  app.post('/api/notes', requireAuth, requireTeacher, async (req, res) => {
    const { title, subject, description, fileName, fileSize, fileContent, createdBy } = req.body;
    if (!title || !subject || !description) {
      res.status(400).json({ error: 'Title, subject and description are required.' });
      return;
    }

    const db = await getDB();
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title,
      subject,
      description,
      fileName: fileName || undefined,
      fileSize: fileSize || undefined,
      fileContent: fileContent || undefined,
      createdAt: new Date().toISOString(),
      createdBy: createdBy || 'Teacher'
    };

    db.notes.push(newNote);
    await saveDB(db);
    res.status(201).json(newNote);
  });

  app.delete('/api/notes/:id', requireAuth, requireTeacher, async (req, res) => {
    const { id } = req.params;
    const db = await getDB();
    const index = db.notes.findIndex(n => n.id === id);

    if (index === -1) {
      res.status(404).json({ error: 'Note not found.' });
      return;
    }

    db.notes.splice(index, 1);
    await saveDB(db);
    res.json({ success: true, message: 'Study note deleted.' });
  });

  app.get('/api/tests', requireAuth, async (req, res) => {
    const db = await getDB();
    res.json(db.tests);
  });

  app.post('/api/tests', requireAuth, requireTeacher, async (req, res) => {
    const { title, subject, maxMarks, date, createdBy } = req.body;
    if (!title || !subject || !maxMarks || !date) {
      res.status(400).json({ error: 'Title, subject, maxMarks and date are required.' });
      return;
    }

    const db = await getDB();
    const newTest: Test = {
      id: `test-${Date.now()}`,
      title,
      subject,
      maxMarks: Number(maxMarks),
      date,
      createdAt: new Date().toISOString(),
      createdBy: createdBy || 'Teacher'
    };

    db.tests.push(newTest);
    await saveDB(db);
    res.status(201).json(newTest);
  });

  app.delete('/api/tests/:id', requireAuth, requireTeacher, async (req, res) => {
    const { id } = req.params;
    const db = await getDB();
    const index = db.tests.findIndex(t => t.id === id);

    if (index === -1) {
      res.status(404).json({ error: 'Test not found.' });
      return;
    }

    db.results = db.results.filter(r => r.testId !== id);
    db.tests.splice(index, 1);
    await saveDB(db);
    res.json({ success: true, message: 'Test and associated results deleted.' });
  });

  app.get('/api/results', requireAuth, async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;
    const db = await getDB();

    if (userRole === 'teacher' || userRole === 'admin') {
      res.json(db.results);
    } else {
      const studentResults = db.results.filter(r => r.studentId === userId);
      res.json(studentResults);
    }
  });

  app.post('/api/results', requireAuth, requireTeacher, async (req, res) => {
    const { testId, testTitle, studentId, studentName, marksObtained, maxMarks, remarks } = req.body;
    if (!testId || !testTitle || !studentId || !studentName || marksObtained === undefined || !maxMarks) {
      res.status(400).json({ error: 'Missing grading fields.' });
      return;
    }

    const db = await getDB();
    const existingIndex = db.results.findIndex(r => r.testId === testId && r.studentId === studentId);

    const newResult: Result = {
      id: existingIndex !== -1 ? db.results[existingIndex].id : `res-${Date.now()}`,
      testId,
      testTitle,
      studentId,
      studentName,
      marksObtained: Number(marksObtained),
      maxMarks: Number(maxMarks),
      remarks: remarks || '',
      createdAt: new Date().toISOString()
    };

    if (existingIndex !== -1) {
      db.results[existingIndex] = newResult;
    } else {
      db.results.push(newResult);
    }

    await saveDB(db);
    res.status(201).json(newResult);
  });

  app.delete('/api/results/:id', requireAuth, requireTeacher, async (req, res) => {
    const { id } = req.params;
    const db = await getDB();
    const index = db.results.findIndex(r => r.id === id);

    if (index === -1) {
      res.status(404).json({ error: 'Result record not found.' });
      return;
    }

    db.results.splice(index, 1);
    await saveDB(db);
    res.json({ success: true, message: 'Result record deleted.' });
  });

  app.get('/api/attendance', requireAuth, async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;
    const db = await getDB();

    if (userRole === 'teacher' || userRole === 'admin') {
      res.json(db.attendance);
    } else {
      const studentAttendance = db.attendance.filter(a => a.studentId === userId);
      res.json(studentAttendance);
    }
  });

  app.post('/api/attendance', requireAuth, requireTeacher, async (req, res) => {
    const { attendanceRecords } = req.body;
    if (!attendanceRecords || !Array.isArray(attendanceRecords)) {
      res.status(400).json({ error: 'Attendance records array required.' });
      return;
    }

    const db = await getDB();
    for (const record of attendanceRecords) {
      const { studentId, studentName, date, status, remarks } = record;
      if (!studentId || !studentName || !date || !status) continue;

      const index = db.attendance.findIndex(
        a => a.studentId === studentId && a.date === date
      );

      const updatedRecord: Attendance = {
        id: index !== -1 ? db.attendance[index].id : `att-${Date.now()}-${studentId}`,
        studentId,
        studentName,
        date,
        status,
        remarks: remarks || ''
      };

      if (index !== -1) {
        db.attendance[index] = updatedRecord;
      } else {
        db.attendance.push(updatedRecord);
      }
    }

    await saveDB(db);
    res.json({ success: true, message: 'Attendance records updated successfully.' });
  });

  app.get('/api/fees', requireAuth, async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;
    const db = await getDB();

    if (userRole === 'teacher' || userRole === 'admin') {
      res.json(db.fees);
    } else {
      const studentFees = db.fees.filter(f => f.studentId === userId);
      res.json(studentFees);
    }
  });

  app.post('/api/fees', requireAuth, requireTeacher, async (req, res) => {
    const { studentId, studentName, amount, dueDate, month } = req.body;
    if (!studentId || !studentName || !amount || !dueDate || !month) {
      res.status(400).json({ error: 'Required billing fields missing.' });
      return;
    }

    const db = await getDB();
    const newFee: Fee = {
      id: `fee-${Date.now()}`,
      studentId,
      studentName,
      amount: Number(amount),
      dueDate,
      status: 'Unpaid',
      month
    };

    db.fees.push(newFee);
    await saveDB(db);
    syncToGoogleSheets('create', 'fee', newFee);
    res.status(201).json(newFee);
  });

  app.post('/api/fees/pay/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const db = await getDB();
    const fee = db.fees.find(f => f.id === id);

    if (!fee) {
      res.status(404).json({ error: 'Fee invoice not found.' });
      return;
    }

    fee.status = status || 'Paid';
    if (fee.status === 'Paid') {
      fee.paidDate = new Date().toISOString().split('T')[0];
    } else {
      fee.paidDate = undefined;
    }

    await saveDB(db);
    syncToGoogleSheets('pay', 'fee', fee);
    res.json(fee);
  });

  // --- AI GEM ASSISTANT CHATBOT API ---
  app.post('/api/ai/chat', requireAuth, async (req, res) => {
    try {
      const { messages, gemPersona, userRole, contextData } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: 'Messages array is required.' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({
          error: 'Gemini API Key is missing on the server. Please check environment configuration or Settings > Secrets.'
        });
        return;
      }

      const ai = new GoogleGenAI({ apiKey });

      let systemInstruction = gemPersona?.systemInstruction ||
        `You are the official AI Gem Assistant for Math Is Fun Academy. You are a warm, encouraging, expert mathematics tutor and pedagogical teaching assistant.
You assist both Teachers (creating lesson plans, quiz questions, worksheets, homework rubrics) and Students (solving math problems step-by-step, explaining concepts, preparing for exams).
Always structure mathematical expressions clearly, use step-by-step formatting, and adapt your tone to be supportive and articulate.`;

      if (gemPersona?.name) {
        systemInstruction = `[Active Gem Persona: ${gemPersona.name}]\n` + systemInstruction;
      }

      if (userRole) {
        systemInstruction += `\n\n[User Role Context]\nThe user interacting with you is a "${userRole}". Tailor your response appropriately to help a ${userRole}.`;
      }

      if (contextData && typeof contextData === 'object') {
        systemInstruction += `\n\n[Academy Portal Context]\nHere is current relevant data from Math Is Fun Academy portal:\n${JSON.stringify(contextData, null, 2)}`;
      }

      const contents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const reply = response.text || "I apologize, but I couldn't generate a response. Please try asking again.";
      res.json({ reply });
    } catch (err: any) {
      console.error('AI Gem Chatbot Error:', err);
      res.status(500).json({ error: err.message || 'Failed to process AI chat request.' });
    }
  });

  // --- ADMIN APIs ---
  app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
    const db = await getDB();
    res.json(db.users);
  });

  app.post('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
    const { email, password, name, role, className, batch, parentContact, subject, teacherContact } = req.body;
    if (!email || !password || !name || !role) {
      res.status(400).json({ error: 'Required fields missing: email, password, name, role.' });
      return;
    }

    const db = await getDB();
    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      res.status(409).json({ error: 'Email already registered.' });
      return;
    }

    const newUser: User = {
      id: `${role}-${Date.now()}`,
      email: email.toLowerCase(),
      name,
      role: role as 'student' | 'teacher' | 'admin',
      passwordHash: password,
      ...(role === 'student' ? {
        class: className || 'Unassigned',
        batch: batch || 'General Batch',
        parentContact: parentContact || ''
      } : role === 'teacher' ? {
        subject: subject || 'General',
        teacherContact: teacherContact || ''
      } : {})
    };

    db.users.push(newUser);
    await saveDB(db);

    sendWelcomeEmail(newUser.email, newUser.name, newUser.role).catch(err => {
      console.error('[Gmail Automation Error]:', err);
    });

    syncToGoogleSheets('create', 'user', newUser);
    res.status(201).json(newUser);
  });

  app.put('/api/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { email, password, name, role, className, batch, parentContact, subject, teacherContact } = req.body;

    const db = await getDB();
    const index = db.users.findIndex(u => u.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (email && email.toLowerCase() !== db.users[index].email.toLowerCase()) {
      const clash = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (clash) {
        res.status(409).json({ error: 'Email already in use.' });
        return;
      }
      db.users[index].email = email.toLowerCase();
    }

    if (name) db.users[index].name = name;
    if (password) db.users[index].passwordHash = password;
    if (role) db.users[index].role = role as any;

    if (db.users[index].role === 'student') {
      db.users[index].class = className || db.users[index].class || 'Unassigned';
      db.users[index].batch = batch || db.users[index].batch || 'General Batch';
      db.users[index].parentContact = parentContact !== undefined ? parentContact : (db.users[index].parentContact || '');
      delete db.users[index].subject;
      delete db.users[index].teacherContact;
    } else if (db.users[index].role === 'teacher') {
      db.users[index].subject = subject !== undefined ? subject : (db.users[index].subject || 'General');
      db.users[index].teacherContact = teacherContact !== undefined ? teacherContact : (db.users[index].teacherContact || '');
      delete db.users[index].class;
      delete db.users[index].batch;
      delete db.users[index].parentContact;
    } else {
      delete db.users[index].class;
      delete db.users[index].batch;
      delete db.users[index].parentContact;
      delete db.users[index].subject;
      delete db.users[index].teacherContact;
    }

    await saveDB(db);
    syncToGoogleSheets('update', 'user', db.users[index]);
    res.json(db.users[index]);
  });

  app.delete('/api/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const db = await getDB();
    const index = db.users.findIndex(u => u.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const deletedUser = db.users[index];
    db.users.splice(index, 1);

    if (deletedUser.role === 'student') {
      db.results = db.results.filter(r => r.studentId !== id);
      db.attendance = db.attendance.filter(a => a.studentId !== id);
      db.fees = db.fees.filter(f => f.studentId !== id);
    }

    await saveDB(db);
    syncToGoogleSheets('delete', 'user', { id, name: deletedUser.name, role: deletedUser.role });
    res.json({ success: true, message: `User ${deletedUser.name} deleted successfully.` });
  });

  app.post('/api/admin/sheets/sync-all', requireAuth, requireAdmin, async (req, res) => {
    try {
      const result = await syncAllToGoogleSheets();
      if (result.success) {
        res.json({ success: true, message: 'Entire database synced to Google Sheets successfully.' });
      } else {
        res.status(502).json({ error: result.error || 'Google Sheets Web App rejected the sync or returned an error.' });
      }
    } catch (err: any) {
      res.status(500).json({ error: `Failed to initiate sync: ${err.message || err}` });
    }
  });

  app.post('/api/admin/sheets/create-direct', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { title } = req.body || {};
      const result = await createDirectSpreadsheet(title);
      if (result.success) {
        res.json({
          success: true,
          message: 'Google Spreadsheet created and populated successfully in Google Drive!',
          spreadsheetUrl: result.spreadsheetUrl,
          spreadsheetId: result.spreadsheetId
        });
      } else {
        res.status(500).json({ error: result.error || 'Failed to create Google Spreadsheet.' });
      }
    } catch (err: any) {
      res.status(500).json({ error: `Direct creation failed: ${err.message || err}` });
    }
  });

  app.get('/api/admin/sheets/sync-history', requireAuth, requireAdmin, (req, res) => {
    res.json(getSyncHistory());
  });

  app.get('/api/admin/sheets/config', requireAuth, requireAdmin, (req, res) => {
    res.json({ scriptUrl: getScriptUrl() });
  });

  app.post('/api/admin/sheets/config', requireAuth, requireAdmin, (req, res) => {
    const { scriptUrl } = req.body;
    if (!scriptUrl || !scriptUrl.trim().startsWith('https://')) {
      return res.status(400).json({ error: 'Invalid Google Sheets Web App URL. It must begin with https://' });
    }
    setScriptUrl(scriptUrl);
    res.json({ success: true, message: 'Google Sheets Script URL updated successfully.', scriptUrl: getScriptUrl() });
  });

  app.get('/api/admin/stats', requireAuth, requireAdmin, async (req, res) => {
    const db = await getDB();

    const studentsCount = db.users.filter(u => u.role === 'student').length;
    const teachersCount = db.users.filter(u => u.role === 'teacher').length;
    const adminsCount = db.users.filter(u => u.role === 'admin').length;

    const announcementsCount = db.announcements.length;
    const notesCount = db.notes.length;
    const testsCount = db.tests.length;
    const gradedResultsCount = db.results.length;

    const totalFeesInvoiced = db.fees.reduce((sum, f) => sum + f.amount, 0);
    const totalFeesPaid = db.fees.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0);
    const totalFeesUnpaid = db.fees.filter(f => f.status === 'Unpaid' || f.status === 'Pending').reduce((sum, f) => sum + f.amount, 0);

    const totalAttendanceDays = db.attendance.length;
    const presentCount = db.attendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
    const attendanceRate = totalAttendanceDays > 0 ? Math.round((presentCount / totalAttendanceDays) * 100) : 100;

    res.json({
      studentsCount,
      teachersCount,
      adminsCount,
      announcementsCount,
      notesCount,
      testsCount,
      gradedResultsCount,
      totalFeesInvoiced,
      totalFeesPaid,
      totalFeesUnpaid,
      attendanceRate
    });
  });

  // Serve the built frontend when NOT running on Vercel.
  // On Vercel, static files are served directly by the platform (see vercel.json),
  // so this block is skipped there.
  if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  cachedApp = app;
  return app;
}
