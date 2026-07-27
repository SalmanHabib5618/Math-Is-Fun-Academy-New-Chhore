import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, BookOpen, ShieldCheck, UserCheck, ArrowRight, Sparkles, Sun, Moon, Calculator, Eye, EyeOff, KeyRound, Mail, CheckCircle2, X, Send } from 'lucide-react';
import { User } from '../types';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function Login({ onLoginSuccess, theme, onToggleTheme }: LoginProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [className, setClassName] = useState('Grade 10');
  const [batch, setBatch] = useState('Advanced Physics & Calculus');
  const [parentContact, setParentContact] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [teacherContact, setTeacherContact] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailReadOnly, setEmailReadOnly] = useState(true);
  const [passwordReadOnly, setPasswordReadOnly] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password state
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState<{ message: string; tempPassword: string; email: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Quick login handler
  const handleQuickLogin = (demoRole: 'student' | 'teacher' | 'admin') => {
    setError('');
    setEmail('');
    setPassword('');
    setName('');
    setRole(demoRole);
    if (demoRole === 'admin') {
      setIsSignUp(false);
    } else {
      setIsSignUp(true);
    }
    setEmailReadOnly(false);
    setPasswordReadOnly(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login';
      const body = isSignUp
        ? { email, password, name, role, className, batch, parentContact, subject, teacherContact }
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess(data as User);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch password');
      }
      setForgotSuccess({
        message: data.message,
        tempPassword: data.tempPassword,
        email: data.email,
      });
    } catch (err: any) {
      setForgotError(err.message || 'Error requesting password reset.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div id="login-container" className="min-h-screen flex flex-col md:grid md:grid-cols-12 bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300 relative overflow-hidden">
      
      {/* Multicolor Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-400 via-emerald-400 via-cyan-400 via-indigo-500 to-pink-500 z-50" />

      {/* Visual Brand Panel */}
      <div className="md:col-span-5 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-8 md:p-12 flex flex-col justify-between text-white relative overflow-hidden min-h-[340px] md:min-h-screen border-b md:border-b-0 md:border-r border-indigo-950/50">
        
        {/* Subtle Grid Texture Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-60" />

        {/* Dynamic Glow Effects */}
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-indigo-500/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-[50%] h-[30%] bg-pink-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Brand Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500/20 to-rose-500/20 rounded-lg border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <Calculator className="h-6 w-6 text-amber-400 animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-wider uppercase text-white block">
                Math Is Fun
              </span>
              <span className="text-[9px] text-amber-300 font-mono tracking-wider uppercase">Academy Portal</span>
            </div>
          </div>
          
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 text-slate-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer flex items-center justify-center"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4 text-indigo-300" />
            ) : (
              <Sun className="h-4 w-4 text-amber-400" />
            )}
          </button>
        </div>

        {/* Brand Pitch */}
        <div className="my-auto py-8 md:py-0 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 rounded border border-amber-500/20 text-xs text-amber-300 font-bold uppercase tracking-wider mb-4 shadow-sm">
              <Sparkles className="h-3 w-3 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} /> 
              Transforming Math Learning
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-4 text-slate-100 bg-gradient-to-r from-amber-200 via-rose-200 to-indigo-200 bg-clip-text">
              Math Is Fun Academy
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-md leading-relaxed font-medium">
              Welcome to the ultimate hub for modern mathematics. Track your practice worksheets, exam schedules, and test performance in an interactive gamified space!
            </p>
          </motion.div>
        </div>

        {/* Brand Footer */}
        <div className="text-xs text-slate-400 border-t border-slate-800/60 pt-4 mt-auto relative z-10 flex justify-between">
          <span>© 2026 Math Is Fun Academy Inc.</span>
          <span className="uppercase tracking-widest text-[9px] font-mono font-bold text-amber-400">Secure Gateway</span>
        </div>
      </div>

      {/* Forms Panel */}
      <div className="md:col-span-7 flex items-center justify-center p-6 sm:p-10 md:p-16 bg-white dark:bg-slate-950 transition-colors duration-300 relative">
        {/* Subtle background decoration for form panel */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--color-indigo-50),transparent_40%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.04),transparent_40%)] pointer-events-none" />
        
        <div className="w-full max-w-md relative z-10">
          {/* Form Header */}
          <div className="text-center md:text-left mb-8">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 text-[10px] font-bold uppercase tracking-wider rounded-lg mb-4">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Academy Secure Portal
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isSignUp ? 'Create your account' : 'Welcome Back'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              {isSignUp 
                ? 'Sign up to track your study progress, schedules, and fee balances.' 
                : 'Sign in to access your customized student or tutor portal.'}
            </p>
          </div>

          {/* Quick Demo Badges */}
          {!isSignUp && (
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6 shadow-xs">
              <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-2.5 text-center md:text-left">
                ⚡ Quick Demo Access
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  id="quick-student-login"
                  onClick={() => handleQuickLogin('student')}
                  className="flex flex-col sm:flex-row items-center justify-center gap-1.5 p-2 bg-white dark:bg-slate-900 hover:bg-emerald-50/20 dark:hover:bg-emerald-500/10 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg text-xs font-bold transition duration-200 shadow-xs cursor-pointer"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  id="quick-teacher-login"
                  onClick={() => handleQuickLogin('teacher')}
                  className="flex flex-col sm:flex-row items-center justify-center gap-1.5 p-2 bg-white dark:bg-slate-900 hover:bg-indigo-50/20 dark:hover:bg-indigo-500/10 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg text-xs font-bold transition duration-200 shadow-xs cursor-pointer"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Teacher</span>
                </button>
                <button
                  type="button"
                  id="quick-admin-login"
                  onClick={() => handleQuickLogin('admin')}
                  className="flex flex-col sm:flex-row items-center justify-center gap-1.5 p-2 bg-white dark:bg-slate-900 hover:bg-violet-50/20 dark:hover:bg-violet-500/10 border border-slate-200 dark:border-slate-800 hover:border-violet-500 dark:hover:border-violet-500 text-slate-700 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 rounded-lg text-xs font-bold transition duration-200 shadow-xs cursor-pointer"
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  <span>Admin</span>
                </button>
              </div>
            </div>
          )}

          {/* Role Toggle Selector */}
          {isSignUp && (
            <div className="space-y-3 mb-6">
              <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-md transition duration-200 cursor-pointer ${
                    role === 'student'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Student Signup
                </button>
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-md transition duration-200 cursor-pointer ${
                    role === 'teacher'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Teacher Signup
                </button>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center italic bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200/40 dark:border-slate-800/40">
                🛡️ Note: System Admin accounts are protected and can only be set up internally by existing administrators.
              </p>
            </div>
          )}

          {/* Feedback Area */}
          {error && (
            <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            {isSignUp && (
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Connor"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 transition"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                {isSignUp ? 'Email Address' : 'Email Address or Full Name'}
              </label>
              <input
                type={isSignUp ? 'email' : 'text'}
                required
                autoComplete={isSignUp ? "email" : "username"}
                placeholder={isSignUp ? "e.g. user@example.com" : "Enter email or full name"}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-xs text-slate-800 dark:text-slate-100 transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                  }}
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-xs text-slate-800 dark:text-slate-100 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {isSignUp && role === 'student' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Grade/Class
                  </label>
                  <select
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-xs text-slate-800 dark:text-slate-100 transition"
                  >
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Batch
                  </label>
                  <input
                    type="text"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    placeholder="e.g. Science A"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 transition"
                  />
                </div>
              </div>
            )}

            {isSignUp && role === 'student' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Parent's Contact No. (Pakistan format: +92 300 1234567 or 03xx-xxxxxxx)
                </label>
                <input
                  type="tel"
                  value={parentContact}
                  onChange={(e) => setParentContact(e.target.value)}
                  placeholder="e.g. +92 300 1234567"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 transition"
                />
              </div>
            )}

            {isSignUp && role === 'teacher' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Specialized Subject
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-xs text-slate-800 dark:text-slate-100 transition"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="English">English</option>
                    <option value="Computer Science">Computer Science</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Contact No. (Pakistan)
                  </label>
                  <input
                    type="tel"
                    value={teacherContact}
                    onChange={(e) => setTeacherContact(e.target.value)}
                    placeholder="e.g. +92 300 1234567"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 transition"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 text-xs font-extrabold rounded-xl text-white flex items-center justify-center gap-2 transition duration-200 cursor-pointer shadow-md ${
                loading
                  ? 'bg-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/10'
              }`}
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : isSignUp ? (
                <>
                  Create Account <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Forgot Password Link under Sign In button */}
            {!isSignUp && (
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  id="forgot-password-link"
                  onClick={() => {
                    setForgotError('');
                    setForgotSuccess(null);
                    setForgotEmail(email || '');
                    setShowForgotPasswordModal(true);
                  }}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline transition cursor-pointer flex items-center gap-1"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Forgot Password?
                </button>
              </div>
            )}
          </form>

          {/* Toggle Link */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                const nextSignUp = !isSignUp;
                setIsSignUp(nextSignUp);
                setError('');
                if (nextSignUp) {
                  setRole('student');
                }
              }}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline transition cursor-pointer"
            >
              {isSignUp 
                ? 'Already have an account? Sign In' 
                : "Don't have an account? Sign Up as Student/Teacher"}
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative overflow-hidden">
            {/* Top Accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-amber-400 to-rose-500" />
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Forgot Password?</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Password recovery & dispatch</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotSuccess ? (
              <div className="space-y-4 py-2">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-xs space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>Password Dispatched!</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                    A new password has been generated for <strong>{forgotSuccess.email}</strong>. Use this password at the time of your next sign in:
                  </p>
                  <div className="p-3 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800/60 rounded-lg flex items-center justify-between font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400 tracking-wider">
                    <span>{forgotSuccess.tempPassword}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(forgotSuccess.tempPassword);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="text-[10px] px-2 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded border border-indigo-200 dark:border-indigo-800 font-sans cursor-pointer transition"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(forgotSuccess.email);
                      setPassword(forgotSuccess.tempPassword);
                      setEmailReadOnly(false);
                      setPasswordReadOnly(false);
                      setShowForgotPasswordModal(false);
                    }}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Use & Sign In Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Enter your registered student or teacher email address below to reset your password.
                </p>
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl text-[11px] text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
                  🔒 <strong>Admin Portal Protection:</strong> Administrator accounts are secured and cannot be reset through the forgot password method.
                </div>

                {forgotError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-semibold">
                    {forgotError}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Registered Email or Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. student@tuition.com"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-xs text-slate-800 dark:text-slate-100 transition"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(false)}
                    className="flex-1 py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {forgotLoading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span>Send Password</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
