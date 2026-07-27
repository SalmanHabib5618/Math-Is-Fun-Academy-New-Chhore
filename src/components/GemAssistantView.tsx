import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Bot, 
  Send, 
  Trash2, 
  Copy, 
  Check, 
  Settings, 
  BookOpen, 
  GraduationCap, 
  FileText, 
  HelpCircle, 
  User as UserIcon, 
  Sliders, 
  Lightbulb, 
  ChevronRight, 
  RefreshCw,
  Plus,
  ShieldAlert,
  Zap,
  Cpu,
  BrainCircuit,
  MessageSquare,
  Sparkle,
  ExternalLink
} from 'lucide-react';
import { User, GemPersona, Note, Test, Announcement } from '../types';

interface GemAssistantViewProps {
  user: User;
  notes?: Note[];
  tests?: Test[];
  announcements?: Announcement[];
  onRefresh?: () => void;
  isFloatingModal?: boolean;
  onCloseModal?: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  gemPersonaName?: string;
}

const PRESET_GEMS: GemPersona[] = [
  {
    id: 'user-custom-gem',
    name: 'My Custom Gem (Gemini Link)',
    description: 'Directly integrated from your official Custom Gem link: https://gemini.google.com/gem/1HaQJlWVvbH3yANhjvJd5xqnQOXXX0RUU',
    iconName: 'Sparkles',
    badge: 'Your Custom Gem',
    shareUrl: 'https://gemini.google.com/gem/1HaQJlWVvbH3yANhjvJd5xqnQOXXX0RUU?usp=sharing',
    targetRole: 'both',
    systemInstruction: `You are the Official Custom Gem AI Assistant for Math Is Fun Academy (Integrated from Google Gemini Gem 1HaQJlWVvbH3yANhjvJd5xqnQOXXX0RUU).
You serve both Teachers and Students as a dedicated mathematics co-pilot and teaching assistant.

Core Responsibilities:
1. FOR STUDENTS: Provide step-by-step math problem breakdowns, formulas, clear explanations, practice problems, and study guidance.
2. FOR TEACHERS: Assist in designing 45-minute lesson plans, pop quizzes, unit tests, rubrics, homework sheets, and parent updates.
3. ADAPTIVE PEDAGOGY: Maintain a warm, encouraging, highly articulate tone, use clean step-by-step formatting, and tailor answers to the user's specific role and grade level.`
  },
  {
    id: 'math-solver',
    name: 'Math Genius & Step Solver',
    description: 'Specializes in breaking down algebraic equations, calculus, geometry, and word problems step-by-step.',
    iconName: 'Calculator',
    badge: 'Core Tutor',
    targetRole: 'both',
    systemInstruction: `You are the "Math Genius & Step Solver" Gem for Math Is Fun Academy.
Your core mission is to help students and teachers master mathematics with clarity and confidence.
When solving math problems:
1. Provide a step-by-step breakdown with clear headings.
2. State any relevant formulas or theorems used.
3. Show intermediate arithmetic and algebraic operations.
4. Highlight the final answer clearly in bold or inside a box summary.
5. Offer 1 optional tip or sanity check to verify the answer.`
  },
  {
    id: 'lesson-planner',
    name: 'Lesson & Quiz Architect',
    description: 'Designed for Teachers: Generates 45-minute lesson plans, pop quizzes, unit tests, and scoring rubrics.',
    iconName: 'FileText',
    badge: 'Teacher Gem',
    targetRole: 'teacher',
    systemInstruction: `You are the "Lesson & Quiz Architect" Gem for Math Is Fun Academy.
Your primary role is assisting teachers in creating curriculum-aligned teaching materials.
You generate:
1. Structured 45-minute lesson plans (warm-up, direct instruction, guided practice, independent work, exit ticket).
2. Multiple choice questions (MCQs), short answer questions, and word problems with full answer keys and step-by-step solutions.
3. Differentiated practice problems for struggling, average, and advanced students.
4. Professional announcement drafts and parent progress updates.`
  },
  {
    id: 'socratic-tutor',
    name: 'Socratic Study Buddy',
    description: 'Designed for Students: Asks guiding questions and hints rather than giving direct answers immediately.',
    iconName: 'GraduationCap',
    badge: 'Student Gem',
    targetRole: 'student',
    systemInstruction: `You are the "Socratic Study Buddy" Gem for Math Is Fun Academy.
Your role is to act as an encouraging, patient study mentor for students.
Guidelines:
1. Do NOT give direct answers immediately unless explicitly asked.
2. Provide gentle hints, ask guiding questions, and encourage the student to think through the problem.
3. Use relatable analogies, visual explanations, and positive reinforcement.
4. Help students prepare for upcoming tests and quizzes with quick revision questions.`
  },
  {
    id: 'custom-gem',
    name: 'Custom Gem Studio',
    description: 'Configure your own personalized Custom Gem system instructions and persona tailored to your needs.',
    iconName: 'Settings',
    badge: 'User Defined',
    targetRole: 'both',
    systemInstruction: `You are a specialized Custom Gem AI Assistant created by the user for Math Is Fun Academy.
Follow all user guidance, fulfill requests accurately, and maintain an engaging, highly competent educational approach.`
  }
];

export default function GemAssistantView({
  user,
  notes = [],
  tests = [],
  announcements = [],
  onRefresh,
  isFloatingModal = false,
  onCloseModal
}: GemAssistantViewProps) {
  // Selected Gem Persona (Default to User's Custom Gem)
  const [selectedGemId, setSelectedGemId] = useState<string>('user-custom-gem');
  const [userGemUrl, setUserGemUrl] = useState<string>(() => {
    return localStorage.getItem('apex_user_gem_url') || 'https://gemini.google.com/gem/1HaQJlWVvbH3yANhjvJd5xqnQOXXX0RUU?usp=sharing';
  });
  const [customSystemPrompt, setCustomSystemPrompt] = useState<string>(() => {
    return localStorage.getItem('apex_custom_gem_prompt') || 
      'You are a Custom Math Gem specialized in Grade 9-12 advanced problem solving, Olympiad math strategies, and exam preparation.';
  });
  const [customGemName, setCustomGemName] = useState<string>(() => {
    return localStorage.getItem('apex_custom_gem_name') || 'My Custom Math Gem';
  });

  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [includeContext, setIncludeContext] = useState<boolean>(true);

  // Messages State
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(`apex_chat_history_${user.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return [
      {
        id: 'welcome-1',
        role: 'model',
        content: `👋 Hello **${user.name}**! I am your **AI Gem Assistant** at Math Is Fun Academy.\n\nI can help you solve complex math problems step-by-step, generate lesson plans and quizzes, or review study notes.\n\nChoose a **Gem Persona** above or try one of the quick suggestions below to get started!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        gemPersonaName: 'Math Genius & Step Solver'
      }
    ];
  });

  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Save chat to local storage
  useEffect(() => {
    localStorage.setItem(`apex_chat_history_${user.id}`, JSON.stringify(messages));
  }, [messages, user.id]);

  // Save custom gem config & URL
  useEffect(() => {
    localStorage.setItem('apex_custom_gem_prompt', customSystemPrompt);
    localStorage.setItem('apex_custom_gem_name', customGemName);
    localStorage.setItem('apex_user_gem_url', userGemUrl);
  }, [customSystemPrompt, customGemName, userGemUrl]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Get active Gem object
  const activeGem = PRESET_GEMS.find(g => g.id === selectedGemId) || PRESET_GEMS[0];

  const currentSystemInstruction = selectedGemId === 'custom-gem' 
    ? `[Active Custom Gem: ${customGemName}]\n${customSystemPrompt}`
    : activeGem.systemInstruction;

  // Handle Send Message
  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    setErrorMsg(null);
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      // Prepare payload for backend
      const payloadMessages = newMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const contextData = includeContext ? {
        recentNotesCount: notes.length,
        notesSample: notes.slice(0, 3).map(n => ({ title: n.title, subject: n.subject, desc: n.description })),
        upcomingTestsCount: tests.length,
        testsSample: tests.slice(0, 3).map(t => ({ title: t.title, subject: t.subject, date: t.date })),
        announcementsSample: announcements.slice(0, 2).map(a => a.title)
      } : undefined;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-role': user.role
        },
        body: JSON.stringify({
          messages: payloadMessages,
          gemPersona: {
            id: activeGem.id,
            name: selectedGemId === 'custom-gem' ? customGemName : activeGem.name,
            systemInstruction: currentSystemInstruction
          },
          userRole: user.role,
          contextData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response from AI Gem Assistant');
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        gemPersonaName: selectedGemId === 'custom-gem' ? customGemName : activeGem.name
      };

      setMessages([...newMessages, botMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMsg(err.message || 'Error communicating with AI. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    if (confirm('Are you sure you want to clear this chat history?')) {
      const resetMsgs: ChatMessage[] = [
        {
          id: `welcome-reset-${Date.now()}`,
          role: 'model',
          content: `Chat history cleared. How can **${selectedGemId === 'custom-gem' ? customGemName : activeGem.name}** assist you now?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          gemPersonaName: selectedGemId === 'custom-gem' ? customGemName : activeGem.name
        }
      ];
      setMessages(resetMsgs);
      localStorage.removeItem(`apex_chat_history_${user.id}`);
    }
  };

  // Quick Prompt Recommendations based on role
  const quickPrompts = user.role === 'teacher' || user.role === 'admin' ? [
    'Create a 5-question Quiz on Quadratic Equations with solutions',
    'Generate a 45-minute lesson plan for Grade 10 Trigonometry',
    'Explain Integration by Parts to a student having difficulty',
    'Draft a parent announcement regarding upcoming Midterm Math Exam'
  ] : [
    'Explain the Pythagorean Theorem step-by-step with a diagram example',
    'Help me solve 2x² - 8x + 6 = 0 step by step',
    'Give me 3 practice problems for Grade 9 Algebra with hints',
    'How do I calculate the area and perimeter of a circle?'
  ];

  return (
    <div className={`flex flex-col bg-slate-900 text-slate-100 rounded-2xl border border-indigo-900/60 shadow-2xl overflow-hidden ${
      isFloatingModal ? 'h-[85vh] max-h-[700px] w-full max-w-2xl' : 'min-h-[750px] w-full'
    }`}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 p-4 border-b border-indigo-900/60 relative flex flex-wrap items-center justify-between gap-3">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-10 w-48 h-12 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.3)] text-white">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base sm:text-lg text-white tracking-wide">
                Custom Gem AI Assistant
              </h2>
              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono rounded-full font-bold">
                gemini-3.6-flash
              </span>
            </div>
            <p className="text-xs text-indigo-200/80">
              Interactive AI Tutor & Assistant for Math Is Fun Academy
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 relative z-10">
          {/* Admin-only Gem Studio Configuration button */}
          {user.role === 'admin' && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
                showSettings 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                  : 'bg-indigo-900/40 text-indigo-200 hover:bg-indigo-900/80 border-indigo-800/40'
              }`}
              title="Admin Gem Studio Settings"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Gem Studio</span>
            </button>
          )}

          <button
            onClick={handleClearChat}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-900/40 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-800 transition cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          {isFloatingModal && onCloseModal && (
            <button
              onClick={onCloseModal}
              className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 text-xs font-bold transition cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Gem Persona Selector Bar */}
      <div className="bg-slate-950/80 px-4 py-2.5 border-b border-indigo-900/40 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
            <BrainCircuit className="h-3.5 w-3.5 text-amber-400" /> Active Gem:
          </span>
          {PRESET_GEMS.map(gem => {
            const isActive = selectedGemId === gem.id;
            return (
              <button
                key={gem.id}
                onClick={() => setSelectedGemId(gem.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                    : 'bg-slate-900/90 text-slate-300 hover:text-white border-slate-800 hover:border-indigo-900'
                }`}
              >
                <Sparkle className={`h-3 w-3 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                <span>{gem.id === 'custom-gem' ? customGemName : gem.name}</span>
              </button>
            );
          })}
        </div>

        {/* Direct Link to User's Gem on Gemini */}
        {(activeGem.shareUrl || selectedGemId === 'user-custom-gem') && (
          <a
            href={activeGem.shareUrl || userGemUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer"
            title="Open official Custom Gem directly on Google Gemini website"
          >
            <span>Open in Gemini</span>
            <ExternalLink className="h-3.5 w-3.5 text-amber-400" />
          </a>
        )}
      </div>

      {/* Custom Gem Studio Settings Drawer (Expandable - Admin Only) */}
      <AnimatePresence>
        {showSettings && user.role === 'admin' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-indigo-950/90 border-b border-indigo-900/80 p-4 sm:p-5 overflow-hidden text-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Custom Gem Configuration Studio</h3>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="text-indigo-300 hover:text-white underline cursor-pointer"
              >
                Done
              </button>
            </div>

            <p className="text-slate-300 leading-relaxed">
              Tailor the behavior, persona, and domain rules for your AI Chatbot. You can link your official <strong className="text-amber-300">Google Gemini Custom Gem URL</strong> or customize system prompts.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Custom Gem Share URL */}
              <div>
                <label className="block text-indigo-200 font-semibold mb-1">Google Gemini Custom Gem Link</label>
                <input
                  type="url"
                  value={userGemUrl}
                  onChange={(e) => setUserGemUrl(e.target.value)}
                  placeholder="https://gemini.google.com/gem/..."
                  className="w-full px-3 py-2 bg-slate-900 border border-indigo-800 rounded-lg text-white text-xs font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              {/* Custom Gem Name */}
              <div>
                <label className="block text-indigo-200 font-semibold mb-1">Custom Gem Name</label>
                <input
                  type="text"
                  value={customGemName}
                  onChange={(e) => setCustomGemName(e.target.value)}
                  placeholder="e.g. Grade 10 Calculus Wizard"
                  className="w-full px-3 py-2 bg-slate-900 border border-indigo-800 rounded-lg text-white text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Portal Context Toggle */}
              <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-lg border border-indigo-900/60">
                <div>
                  <h4 className="font-bold text-indigo-200">Include Portal Context</h4>
                  <p className="text-[11px] text-slate-400">Allows AI to reference uploaded study notes and tests</p>
                </div>
                <input
                  type="checkbox"
                  checked={includeContext}
                  onChange={(e) => setIncludeContext(e.target.checked)}
                  className="h-4 w-4 accent-indigo-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-lg border border-indigo-900/60">
                <div>
                  <h4 className="font-bold text-amber-300">Direct Gem Link Status</h4>
                  <p className="text-[11px] text-slate-300 truncate max-w-[220px]">{userGemUrl}</p>
                </div>
                <a
                  href={userGemUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>Test Link</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Custom System Instruction Textarea */}
            <div>
              <label className="block text-indigo-200 font-semibold mb-1 flex items-center justify-between">
                <span>Custom Gem System Prompt & Persona Instructions</span>
                <span className="text-[10px] text-amber-300 font-mono">Applies when Custom Gem is selected</span>
              </label>
              <textarea
                value={customSystemPrompt}
                onChange={(e) => setCustomSystemPrompt(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-slate-900 border border-indigo-800 rounded-lg text-white text-xs font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none"
                placeholder="Write system rules for your Custom Gem..."
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Conversation Body */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-950/40">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-md">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div className={`max-w-[85%] sm:max-w-[75%] space-y-1 ${isUser ? 'items-end' : 'items-start'}`}>
                {/* Header label for bot message */}
                {!isUser && (
                  <div className="flex items-center gap-2 text-[10px] text-indigo-300 font-mono">
                    <span className="font-bold text-amber-400">{msg.gemPersonaName || activeGem.name}</span>
                    <span>• {msg.timestamp}</span>
                  </div>
                )}

                <div
                  className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    isUser
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-none shadow-md'
                      : 'bg-slate-900 border border-indigo-900/60 text-slate-100 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Actions for Bot Message */}
                {!isUser && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-indigo-200 transition cursor-pointer"
                      title="Copy response to clipboard"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="h-8 w-8 rounded-xl bg-indigo-900 border border-indigo-700 flex items-center justify-center font-bold text-xs text-white shrink-0">
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3 justify-start"
          >
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-amber-500 flex items-center justify-center text-white shrink-0 animate-spin">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="bg-slate-900 border border-indigo-900/60 p-3.5 rounded-2xl rounded-bl-none text-xs text-indigo-300 flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-400" />
              <span>{activeGem.name} is generating a solution...</span>
            </div>
          </motion.div>
        )}

        {/* Error Notice */}
        {errorMsg && (
          <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-200 text-xs flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick Prompt Suggestions */}
      {messages.length < 5 && (
        <div className="px-4 py-2 bg-slate-950/90 border-t border-indigo-900/40">
          <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Lightbulb className="h-3 w-3 text-amber-400" /> Suggested Prompts for {user.role}:
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {quickPrompts.map((promptText, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(promptText)}
                disabled={loading}
                className="px-2.5 py-1 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border border-indigo-800/60 rounded-full text-[11px] whitespace-nowrap transition cursor-pointer hover:border-amber-400/50"
              >
                {promptText}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Footer */}
      <div className="p-3 sm:p-4 bg-slate-950 border-t border-indigo-900/60">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask ${selectedGemId === 'custom-gem' ? customGemName : activeGem.name}...`}
            disabled={loading}
            className="flex-1 bg-slate-900 border border-indigo-800/80 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white rounded-xl font-bold transition flex items-center gap-2 cursor-pointer shadow-md shrink-0"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
