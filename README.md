# 📐 Math Is Fun Academy — Full-Stack Tuition Center Portal

A full-stack academy management platform tailored for **Math Is Fun Academy**. Designed to streamline administration, faculty workflows, student learning, and parent oversight through a role-based dashboard, AI math assistant, and automated Google Workspace integrations.

---

## ✨ Features & Capabilities

### 🔐 Role-Based Access Control (RBAC)
* **Administrator**: Manage all users (Students, Faculty, Admins), handle fee invoices, manage database records, trigger Google Sheets synchronization/export, and broadcast announcements.
* **Faculty / Teacher**: Record student attendance, create tests & upload test results, post study notes and worksheets, and track student performance.
* **Student**: View personalized progress metrics, download subject study notes, view test grades & class rankings, check fee payment statuses, and use the AI Gem Math Assistant.
* **Parent**: Monitor attendance percentages, review academic test scores, check fee invoice dues, and receive academy updates.

---

### 📚 Core Portal Modules

1. **📊 Dashboard Overview**
   * Role-specific metrics and statistics (total enrolled students, active faculty, pending fees, average attendance rate).
   * Quick action cards and recent activity feeds.

2. **📝 Study Notes & Materials**
   * Upload and categorize study guides, formula sheets, and practice worksheets by class grade and subject.
   * Tag search, category filtering, and direct material downloads.

3. **✏️ Tests & Examinations**
   * Schedule upcoming tests with subject, date, and maximum marks.
   * Record individual student scores and auto-calculate pass percentages and rankings.

4. **📅 Attendance Management**
   * Date-wise student attendance logging (Present, Absent, Late).
   * Filter records by batch, class, or individual student with monthly attendance percentage calculations.

5. **💳 Fee Invoice Management**
   * Generate fee invoices with due dates and payment tracking (Paid, Pending, Overdue).
   * Record payment dates and track total revenue vs. outstanding dues.

6. **📢 Announcements & Notices**
   * Post academy-wide notices, exam schedules, and holiday announcements with pin/priority features.

7. **🤖 AI Gem Math Assistant**
   * Integrated AI tutor powered by **Google Gemini API** (`@google/genai`).
   * Provides step-by-step solutions to math problems, explains complex theorems, and generates custom math quiz questions.

8. **🌐 Google Workspace Automation**
   * **Google Sheets Sync & Export**: Direct integration with Google Sheets API to export master data (Users, Fees, Attendance, Tests, Announcements) into spreadsheets stored in Google Drive.
   * **Gmail Automation**: Automated dispatch of welcome emails upon account creation and password reset alerts via the Google Gmail API (`gmail.send` scope).

---

## 🛠️ Tech Stack

* **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion (`motion/react`), Lucide React icons.
* **Backend**: Express.js (Node.js runtime), REST API endpoints.
* **AI & Intelligence**: `@google/genai` (Google Gemini API).
* **Workspace Integration**: `googleapis` (Gmail API, Google Sheets API, Google Drive API).
* **Build & Dev Tools**: Vite, `esbuild`, `tsx`, TypeScript compiler.

---

## 📁 Project Structure

```text
├── server/
│   ├── db.ts          # Local JSON database & persistence handler
│   ├── sheets.ts      # Google Sheets & Drive API export logic
│   └── gmail.ts       # Gmail API automated email sender
├── server.ts          # Main Express API server & static asset serving
├── src/
│   ├── components/    # Modular React UI views (Dashboard, Fees, Attendance, etc.)
│   ├── App.tsx        # Main application router and state holder
│   ├── types.ts       # Shared TypeScript interfaces & types
│   └── index.css      # Tailwind CSS styling entry
├── data/              # Local storage for portal database and sync logs
├── metadata.json      # Platform configuration & capability descriptors
└── README.md          # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

* **Node.js**: v18.x or higher
* **npm** or **bun** package manager

### Environment Variables

Configure environment variables in your runtime or `.env` file:

```env
# Required for AI Gem Assistant features
GEMINI_API_KEY=your_gemini_api_key_here
```

### Installation & Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The application will start on `http://localhost:3000`.

3. **Type Checking & Linting**:
   ```bash
   npm run lint
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```

5. **Start Production Server**:
   ```bash
   npm start
   ```

---

## 🔒 Security & OAuth Permissions

* **Gemini API**: Managed server-side in `server.ts` to prevent key exposure to client browsers.
* **Google Workspace Scopes**:
  * `https://www.googleapis.com/auth/gmail.send` (Sending automated notifications)
  * `https://www.googleapis.com/auth/spreadsheets` (Creating and updating Google Sheets)
  * `https://www.googleapis.com/auth/drive` (Storing exported files in Google Drive)

---

## 📄 License

This project is maintained for **Math Is Fun Academy**. All rights reserved.
