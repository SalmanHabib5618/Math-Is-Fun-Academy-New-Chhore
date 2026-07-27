import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { getDB } from './db.js';

const HISTORY_FILE = path.join(process.cwd(), 'data', 'sync_history.json');

let activeScriptUrl = process.env.GOOGLE_SHEETS_SCRIPT_URL || "";

export function getScriptUrl(): string {
  return activeScriptUrl;
}

export function setScriptUrl(url: string) {
  if (url && url.trim().startsWith('https://')) {
    activeScriptUrl = url.trim();
  }
}

// Global tracking of sync history
export interface SyncLog {
  timestamp: string;
  action: string;
  type: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  details: string;
}

function loadSyncHistory(): SyncLog[] {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const content = fs.readFileSync(HISTORY_FILE, 'utf-8');
      return JSON.parse(content) as SyncLog[];
    }
  } catch (err) {
    console.warn('[Google Sheets Sync] Could not read sync history file, starting fresh:', err);
  }
  return [];
}

const syncHistory: SyncLog[] = loadSyncHistory();

export function getSyncHistory(): SyncLog[] {
  return syncHistory;
}

export function saveSyncHistory() {
  try {
    const dir = path.dirname(HISTORY_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(syncHistory, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Google Sheets Sync] Could not write sync history file:', err);
  }
}

/**
 * Checks if the response body text indicates a Google permission/login/denied HTML page.
 */
function checkHtmlResponse(text: string): boolean {
  const clean = text.trim().toLowerCase();
  return (
    clean.startsWith('<!doctype html') || 
    clean.startsWith('<html') || 
    clean.includes('sign in - google accounts') || 
    clean.includes('you need access') || 
    clean.includes('access denied') || 
    clean.includes('google drive - virus scan warning')
  );
}

/**
 * Sends a background request to the Google Sheets Apps Script Web App.
 * Safe fire-and-forget method with logging.
 */
export function syncToGoogleSheets(action: string, type: string, data: any) {
  const logEntry: SyncLog = {
    timestamp: new Date().toISOString(),
    action,
    type,
    status: 'PENDING',
    details: `Syncing ${type} - ${action}`
  };
  syncHistory.unshift(logEntry);
  if (syncHistory.length > 50) {
    syncHistory.pop();
  }
  saveSyncHistory();

  const payload = {
    action,
    type,
    timestamp: new Date().toISOString(),
    data,
    appUrl: process.env.APP_URL || 'Local Dev'
  };

  console.log(`[Google Sheets Sync] Initiating sync for type: "${type}", action: "${action}" to URL: ${activeScriptUrl}`);

  fetch(activeScriptUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    redirect: 'follow'
  })
    .then(async (response) => {
      const text = await response.text();
      
      if (checkHtmlResponse(text)) {
        logEntry.status = 'FAILED';
        logEntry.details = "Google Apps Script returns HTML (Access Denied / Login Screen). Please set 'Who has access' to 'Anyone' in your Apps Script Web App deployment settings.";
        console.warn(`[Google Sheets Sync] WARNING: Google returned an HTML page instead of JSON. This is usually a 403/login redirect. check your Google Web App sharing settings.`);
        saveSyncHistory();
        return;
      }

      if (response.ok) {
        logEntry.status = 'SUCCESS';
        logEntry.details = `Synced successfully: ${type} ${action}`;
        console.log(`[Google Sheets Sync] SUCCESS: Synced ${type} "${action}"`);
      } else {
        logEntry.status = 'FAILED';
        logEntry.details = `HTTP ${response.status}: ${text.substring(0, 100)}`;
        console.warn(`[Google Sheets Sync] WARNING: HTTP ${response.status} - ${text}`);
      }
      saveSyncHistory();
    })
    .catch((error) => {
      logEntry.status = 'FAILED';
      logEntry.details = error.message || String(error);
      console.warn(`[Google Sheets Sync] WARNING during fetch:`, error);
      saveSyncHistory();
    });
}

/**
 * Syncs the entire current database structure to Google Sheets.
 */
export async function syncAllToGoogleSheets(): Promise<{ success: boolean; error?: string }> {
  const db = getDB();
  const logEntry: SyncLog = {
    timestamp: new Date().toISOString(),
    action: 'sync_all',
    type: 'database',
    status: 'PENDING',
    details: 'Full database sync requested'
  };
  syncHistory.unshift(logEntry);
  if (syncHistory.length > 50) {
    syncHistory.pop();
  }
  saveSyncHistory();

  const payload = {
    action: 'sync_all',
    type: 'database',
    timestamp: new Date().toISOString(),
    data: {
      users: db.users.map(({ passwordHash, ...u }) => u),
      fees: db.fees,
      announcements: db.announcements,
      attendance: db.attendance,
      tests: db.tests,
      results: db.results,
      notes: db.notes
    },
    appUrl: process.env.APP_URL || 'Local Dev'
  };

  console.log(`[Google Sheets Sync] Initiating FULL database sync to URL: ${activeScriptUrl}`);

  try {
    const response = await fetch(activeScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    const text = await response.text();

    if (checkHtmlResponse(text)) {
      const errMsg = "Access Denied (Google Sheets deployment requires authorization). Go to Extensions > Apps Script > Deploy > Manage Deployments. Set 'Execute as: Me' and 'Who has access: Anyone'.";
      logEntry.status = 'FAILED';
      logEntry.details = errMsg;
      console.warn(`[Google Sheets Sync] WARNING: Google returned HTML login/access page. URL is private.`);
      saveSyncHistory();
      return { success: false, error: errMsg };
    }

    if (response.ok) {
      logEntry.status = 'SUCCESS';
      logEntry.details = 'Full database synced successfully';
      console.log(`[Google Sheets Sync] SUCCESS: Full database sync completed.`);
      saveSyncHistory();
      return { success: true };
    } else {
      const errMsg = `HTTP ${response.status}: ${text.substring(0, 100)}`;
      logEntry.status = 'FAILED';
      logEntry.details = errMsg;
      console.warn(`[Google Sheets Sync] WARNING: HTTP ${response.status} - ${text}`);
      saveSyncHistory();
      return { success: false, error: errMsg };
    }
  } catch (error: any) {
    const errMsg = error.message || String(error);
    logEntry.status = 'FAILED';
    logEntry.details = errMsg;
    console.warn(`[Google Sheets Sync] WARNING during full sync fetch:`, error);
    saveSyncHistory();
    return { success: false, error: errMsg };
  }
}

/**
 * Creates a brand new Google Spreadsheet directly via Google Sheets API (Workspace OAuth integration)
 * and populates it with current Academy Portal data (Users, Fees, Attendance, Tests, Notes).
 */
export async function createDirectSpreadsheet(title: string = "Math Is Fun Academy - Portal Export"): Promise<{ success: boolean; spreadsheetUrl?: string; spreadsheetId?: string; error?: string }> {
  try {
    const auth = new google.auth.GoogleAuth({
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
      ]
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const db = getDB();

    // 1. Create Spreadsheet
    const createRes = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `${title} (${new Date().toISOString().split('T')[0]})`
        },
        sheets: [
          { properties: { title: 'Users' } },
          { properties: { title: 'Fee Invoices' } },
          { properties: { title: 'Attendance' } },
          { properties: { title: 'Tests & Results' } },
          { properties: { title: 'Announcements' } }
        ]
      }
    });

    const spreadsheetId = createRes.data.spreadsheetId;
    const spreadsheetUrl = createRes.data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    if (!spreadsheetId) {
      throw new Error("Spreadsheet ID was not returned by Google Sheets API.");
    }

    // 2. Populate Users sheet
    const usersData = [
      ['ID', 'Name', 'Email', 'Role', 'Class', 'Batch', 'Subject', 'Parent Contact'],
      ...db.users.map(u => [
        u.id, u.name, u.email, u.role, u.class || '', u.batch || '', u.subject || '', u.parentContact || ''
      ])
    ];

    // Populate Fees sheet
    const feesData = [
      ['ID', 'Student Name', 'Amount ($)', 'Due Date', 'Status', 'Month', 'Paid Date'],
      ...db.fees.map(f => [
        f.id, f.studentName, f.amount, f.dueDate, f.status, f.month, f.paidDate || ''
      ])
    ];

    // Populate Attendance sheet
    const attendanceData = [
      ['ID', 'Student ID', 'Student Name', 'Date', 'Status', 'Remarks'],
      ...db.attendance.map(a => [
        a.id, a.studentId, a.studentName || '', a.date, a.status, a.remarks || ''
      ])
    ];

    // Populate Tests sheet
    const testsData = [
      ['ID', 'Title', 'Subject', 'Max Marks', 'Test Date', 'Created By'],
      ...db.tests.map(t => [
        t.id, t.title, t.subject, t.maxMarks, t.date, t.createdBy || ''
      ])
    ];

    // Populate Announcements sheet
    const announcementsData = [
      ['ID', 'Title', 'Content', 'Created By', 'Created At'],
      ...db.announcements.map(an => [
        an.id, an.title, an.content, an.createdBy, an.createdAt
      ])
    ];

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: [
          { range: 'Users!A1', values: usersData },
          { range: 'Fee Invoices!A1', values: feesData },
          { range: 'Attendance!A1', values: attendanceData },
          { range: 'Tests & Results!A1', values: testsData },
          { range: 'Announcements!A1', values: announcementsData }
        ]
      }
    });

    console.log(`[Google Sheets API] Successfully created spreadsheet directly: ${spreadsheetUrl}`);

    const logEntry: SyncLog = {
      timestamp: new Date().toISOString(),
      action: 'direct_create',
      type: 'spreadsheet',
      status: 'SUCCESS',
      details: `Created Google Sheet: ${spreadsheetUrl}`
    };
    syncHistory.unshift(logEntry);
    saveSyncHistory();

    return {
      success: true,
      spreadsheetId,
      spreadsheetUrl
    };

  } catch (err: any) {
    console.error('[Google Sheets API Error]:', err);
    const errMsg = err?.message || String(err);

    const logEntry: SyncLog = {
      timestamp: new Date().toISOString(),
      action: 'direct_create',
      type: 'spreadsheet',
      status: 'FAILED',
      details: errMsg
    };
    syncHistory.unshift(logEntry);
    saveSyncHistory();

    return {
      success: false,
      error: errMsg
    };
  }
}

