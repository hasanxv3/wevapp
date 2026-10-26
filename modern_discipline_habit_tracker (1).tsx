import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Home, CheckSquare, Calendar as CalendarIcon, Clock, User, Plus, Flame,
  Trophy, Zap, BarChart2, Settings, Bell, Moon, Sun, Play, Pause, RotateCcw,
  Volume2, VolumeX, Edit3, Trash2, Check, X, ChevronLeft, ChevronRight,
  Award, Target, BookOpen, Dumbbell, Brain, Coffee, Sparkles, Shield,
  Download, Upload, RefreshCw, Globe, Lock, Eye, EyeOff, ArrowUpRight,
  CheckCircle2, Circle, AlertCircle, Sliders, Heart, Code, Compass, Smile
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Cell
} from 'recharts';
import { initializeApp } from 'firebase/app';
import {
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore, doc, setDoc, onSnapshot
} from 'firebase/firestore';

// --- FIREBASE INITIALIZATION ---
let app = null;
let auth = null;
let db = null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'discipline-pro-app';

try {
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    const firebaseConfig = JSON.parse(__firebase_config);
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (err) {
  console.warn('Firebase initialization skipped or unavailable:', err);
}

// --- DATE UTILITIES ---
const formatDateKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getPastDateKey = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return formatDateKey(d);
};

const getDayShortName = (dateKey, lang = 'en') => {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const locales = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', bn: 'bn-BD' };
  return date.toLocaleDateString(locales[lang] || 'en-US', { weekday: 'short' });
};

const TODAY_KEY = formatDateKey(new Date());

// --- TRANSLATIONS / MULTI-LANGUAGE DICTIONARY ---
const TRANSLATIONS = {
  en: {
    home: 'Home',
    habits: 'Habits',
    routine: 'Routine',
    focus: 'Focus',
    profile: 'Profile',
    disciplineScore: 'Discipline Score',
    dailyProgress: 'Daily Progress',
    currentStreak: 'Active Streak',
    quickAdd: 'Quick Add',
    todaysRoutine: "Today's Routine",
    todaysHabits: "Today's Habits",
    weeklyProductivity: 'Weekly Discipline & Output',
    quoteOfTheDay: 'Daily Stoic & Discipline Maxim',
    focusTimer: 'Deep Focus Chamber',
    analytics: 'Progress Analytics',
    gamification: 'Ranks & Challenges',
    settings: 'Preferences & System'
  },
  es: {
    home: 'Inicio',
    habits: 'Hábitos',
    routine: 'Rutina',
    focus: 'Enfoque',
    profile: 'Perfil',
    disciplineScore: 'Puntuación de Disciplina',
    dailyProgress: 'Progreso Diario',
    currentStreak: 'Racha Activa',
    quickAdd: 'Añadir Rápido',
    todaysRoutine: 'Rutina de Hoy',
    todaysHabits: 'Hábitos de Hoy',
    weeklyProductivity: 'Productividad Semanal',
    quoteOfTheDay: 'Máxima de Disciplina',
    focusTimer: 'Cámara de Enfoque',
    analytics: 'Analítica de Progreso',
    gamification: 'Rangos y Desafíos',
    settings: 'Ajustes y Sistema'
  },
  fr: {
    home: 'Accueil',
    habits: 'Habitudes',
    routine: 'Routine',
    focus: 'Focus',
    profile: 'Profil',
    disciplineScore: 'Score de Discipline',
    dailyProgress: 'Progrès Quotidien',
    currentStreak: 'Série Active',
    quickAdd: 'Ajout Rapide',
    todaysRoutine: "Routine d'Aujourd'hui",
    todaysHabits: 'Habitudes du Jour',
    weeklyProductivity: 'Productivité Hebdomadaire',
    quoteOfTheDay: 'Maxime du Jour',
    focusTimer: 'Chambre de Concentration',
    analytics: 'Analytique de Progrès',
    gamification: 'Rangs et Défis',
    settings: 'Paramètres'
  },
  de: {
    home: 'Start',
    habits: 'Gewohnheiten',
    routine: 'Routine',
    focus: 'Fokus',
    profile: 'Profil',
    disciplineScore: 'Disziplin-Wert',
    dailyProgress: 'Tagesfortschritt',
    currentStreak: 'Aktuelle Serie',
    quickAdd: 'Schnell Hinzufügen',
    todaysRoutine: 'Heutige Routine',
    todaysHabits: 'Heutige Gewohnheiten',
    weeklyProductivity: 'Wöchentliche Leistung',
    quoteOfTheDay: 'Zitat des Tages',
    focusTimer: 'Fokus-Kammer',
    analytics: 'Fortschrittsanalyse',
    gamification: 'Ränge & Aufgaben',
    settings: 'Einstellungen'
  },
  bn: {
    home: 'হোম',
    habits: 'অভ্যাস',
    routine: 'রুটিন',
    focus: 'ফোকাস',
    profile: 'প্রোফাইল',
    disciplineScore: 'শৃঙ্খলা স্কোর',
    dailyProgress: 'দৈনিক অগ্রগতি',
    currentStreak: 'চলমান স্ট্রিক',
    quickAdd: 'নতুন যোগ করুন',
    todaysRoutine: 'আজকের রুটিন',
    todaysHabits: 'আজকের অভ্যাসসমূহ',
    weeklyProductivity: 'সাপ্তাহিক অগ্রগতি',
    quoteOfTheDay: 'আজকের অনুপ্রেরণা',
    focusTimer: 'মনোযোগ কক্ষ',
    analytics: 'অগ্রগতি বিশ্লেষণ',
    gamification: 'র‍্যাঙ্ক এবং চ্যালেঞ্জ',
    settings: 'সেটিংস এবং সিস্টেম'
  }
};

// --- MOTIVATIONAL QUOTES ---
const QUOTES = [
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "You have power over your mind — not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "He who conquers himself is the mightiest warrior.", author: "Confucius" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "Suffer the pain of discipline or suffer the pain of regret.", author: "Jim Rohn" },
  { text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King" }
];

// --- ICON MAP ---
const ICON_MAP = {
  Dumbbell, BookOpen, Brain, Code, Coffee, Sun, Moon, Target, Heart, Compass, Zap, Sparkles, Shield, Smile
};

// --- ROUTINE CATEGORIES ---
const ROUTINE_CATEGORIES = [
  { id: 'Wake & Sleep', label: 'Wake-up & Sleep', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30', icon: 'Sun' },
  { id: 'Exercise', label: 'Exercise & Physical', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: 'Dumbbell' },
  { id: 'Study', label: 'Study & Learning', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', icon: 'Brain' },
  { id: 'Reading', label: 'Reading Books', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', icon: 'BookOpen' },
  { id: 'Skill', label: 'Skill Development', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30', icon: 'Code' },
  { id: 'Mindfulness', label: 'Prayer & Meditation', color: 'text-teal-400 bg-teal-500/10 border-teal-500/30', icon: 'Heart' },
  { id: 'Projects', label: 'Personal Projects', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30', icon: 'Target' },
  { id: 'Custom', label: 'Custom Routine', color: 'text-slate-300 bg-slate-500/10 border-slate-500/30', icon: 'Sparkles' }
];

// --- RANKS & LEVELS ---
const RANKS = [
  { minLevel: 1, title: 'Novice Seeker', badge: '🌱', color: 'from-slate-400 to-slate-600' },
  { minLevel: 3, title: 'Initiate of Order', badge: '⚡', color: 'from-blue-400 to-indigo-600' },
  { minLevel: 5, title: 'Disciplined Disciple', badge: '🛡️', color: 'from-violet-400 to-purple-600' },
  { minLevel: 8, title: 'Relentless Vanguard', badge: '🔥', color: 'from-amber-400 to-orange-600' },
  { minLevel: 12, title: 'Architect of Will', badge: '👑', color: 'from-fuchsia-400 to-rose-600' },
  { minLevel: 20, title: 'Master of Self', badge: '🌌', color: 'from-cyan-300 via-violet-500 to-fuchsia-500' }
];

const getRankForLevel = (level) => {
  let current = RANKS[0];
  for (const r of RANKS) {
    if (level >= r.minLevel) current = r;
  }
  return current;
};

// --- INITIAL STARTER STATE ---
const createInitialState = () => {
  const d0 = getPastDateKey(0);
  const d1 = getPastDateKey(1);
  const d2 = getPastDateKey(2);
  const d3 = getPastDateKey(3);
  const d4 = getPastDateKey(4);
  const d5 = getPastDateKey(5);
  const d6 = getPastDateKey(6);

  return {
    profile: {
      name: 'Alex Mercer',
      title: 'Stoic Practitioner & Builder',
      bio: 'Forging unbreakable daily systems through deliberate focus and consistency.',
      avatar: '🛡️',
      wakeTime: '06:00',
      sleepTime: '22:30',
      dailyHabitGoal: 4,
      dailyFocusGoal: 90,
      theme: 'dark',
      language: 'en',
      leaderboardOptIn: true,
      notifications: {
        habits: true,
        routines: true,
        sleep: true,
        planning: true
      }
    },
    xp: 640,
    claimedChallenges: [],
    habits: [
      {
        id: 'h-1',
        name: 'Morning Hydration & Mobility',
        category: 'Health',
        frequency: 'daily',
        targetDaysPerWeek: 7,
        icon: 'Dumbbell',
        color: '#10b981',
        createdAt: d6,
        completedDates: { [d6]: true, [d5]: true, [d4]: true, [d3]: true, [d2]: true, [d1]: true, [d0]: true }
      },
      {
        id: 'h-2',
        name: 'Read 25 Pages of Non-Fiction',
        category: 'Wisdom',
        frequency: 'daily',
        targetDaysPerWeek: 7,
        icon: 'BookOpen',
        color: '#f59e0b',
        createdAt: d6,
        completedDates: { [d6]: true, [d5]: false, [d4]: true, [d3]: true, [d2]: true, [d1]: true, [d0]: false }
      },
      {
        id: 'h-3',
        name: 'Deep Skill Coding / Architecture',
        category: 'Career',
        frequency: 'daily',
        targetDaysPerWeek: 6,
        icon: 'Code',
        color: '#8b5cf6',
        createdAt: d6,
        completedDates: { [d6]: true, [d5]: true, [d4]: true, [d3]: false, [d2]: true, [d1]: true, [d0]: true }
      },
      {
        id: 'h-4',
        name: 'Mindfulness & Evening Reflection',
        category: 'Mind',
        frequency: 'daily',
        targetDaysPerWeek: 7,
        icon: 'Heart',
        color: '#06b6d4',
        createdAt: d6,
        completedDates: { [d6]: false, [d5]: true, [d4]: true, [d3]: true, [d2]: false, [d1]: true, [d0]: false }
      },
      {
        id: 'h-5',
        name: 'Zero Refined Sugar & Clean Fuel',
        category: 'Health',
        frequency: 'weekly',
        targetDaysPerWeek: 5,
        icon: 'Shield',
        color: '#ec4899',
        createdAt: d6,
        completedDates: { [d6]: true, [d5]: true, [d4]: false, [d3]: true, [d2]: true, [d1]: false, [d0]: false }
      }
    ],
    routines: [
      {
        id: 'r-1',
        title: 'Rise at Dawn & Cold Water Protocol',
        time: '06:00',
        duration: 20,
        category: 'Wake & Sleep',
        reminder: true,
        completedDates: { [d6]: true, [d5]: true, [d4]: true, [d3]: true, [d2]: true, [d1]: true, [d0]: true }
      },
      {
        id: 'r-2',
        title: 'Meditation & Stoic Journaling',
        time: '06:30',
        duration: 25,
        category: 'Mindfulness',
        reminder: true,
        completedDates: { [d6]: true, [d5]: true, [d4]: false, [d3]: true, [d2]: true, [d1]: true, [d0]: true }
      },
      {
        id: 'r-3',
        title: 'Strength & Zone 2 Conditioning',
        time: '07:15',
        duration: 45,
        category: 'Exercise',
        reminder: true,
        completedDates: { [d6]: true, [d5]: false, [d4]: true, [d3]: true, [d2]: true, [d1]: true, [d0]: false }
      },
      {
        id: 'r-4',
        title: 'Deep Work Block: Core Study / Project',
        time: '09:00',
        duration: 90,
        category: 'Study',
        reminder: true,
        completedDates: { [d6]: true, [d5]: true, [d4]: true, [d3]: true, [d2]: false, [d1]: true, [d0]: false }
      },
      {
        id: 'r-5',
        title: 'Skill Mastery & Deliberate Practice',
        time: '14:30',
        duration: 60,
        category: 'Skill',
        reminder: false,
        completedDates: { [d6]: false, [d5]: true, [d4]: true, [d3]: true, [d2]: true, [d1]: false, [d0]: false }
      },
      {
        id: 'r-6',
        title: 'Evening Reading & Digital Sunset',
        time: '21:15',
        duration: 45,
        category: 'Reading',
        reminder: true,
        completedDates: { [d6]: true, [d5]: true, [d4]: true, [d3]: false, [d2]: true, [d1]: true, [d0]: false }
      },
      {
        id: 'r-7',
        title: 'Lights Out & Recovery Sleep',
        time: '22:30',
        duration: 450,
        category: 'Wake & Sleep',
        reminder: true,
        completedDates: { [d6]: true, [d5]: true, [d4]: true, [d3]: true, [d2]: true, [d1]: true, [d0]: false }
      }
    ],
    focusSessions: [
      { id: 'f-1', date: d6, duration: 50, mode: 'Deep Work', taskTitle: 'System Architecture Study', timestamp: '09:50' },
      { id: 'f-2', date: d5, duration: 45, mode: 'Pomodoro', taskTitle: 'Algorithmic Problem Solving', timestamp: '11:00' },
      { id: 'f-3', date: d4, duration: 75, mode: 'Deep Work', taskTitle: 'Core Project Sprint', timestamp: '10:30' },
      { id: 'f-4', date: d3, duration: 50, mode: 'Deep Work', taskTitle: 'Book Synthesis Notes', timestamp: '15:20' },
      { id: 'f-5', date: d2, duration: 60, mode: 'Custom Focus', taskTitle: 'Full-Stack Module Build', timestamp: '14:00' },
      { id: 'f-6', date: d1, duration: 85, mode: 'Deep Work', taskTitle: 'Deep Research & Writing', timestamp: '16:10' },
      { id: 'f-7', date: d0, duration: 25, mode: 'Pomodoro', taskTitle: 'Morning Priority Sprint', timestamp: '08:45' }
    ]
  };
};

// --- HELPER: CALCULATE HABIT STREAK ---
const calculateHabitStreak = (completedDates = {}) => {
  let streak = 0;
  let checkDay = 0;
  const todayKey = getPastDateKey(0);
  if (!completedDates[todayKey]) {
    checkDay = 1;
  }
  while (checkDay < 365) {
    const key = getPastDateKey(checkDay);
    if (completedDates[key]) {
      streak++;
      checkDay++;
    } else {
      break;
    }
  }
  return streak;
};

export default function App() {
  // --- NAVIGATION & CORE STATE ---
  const [activeTab, setActiveTab] = useState('home');
  const [profileSubTab, setProfileSubTab] = useState('gamification'); // 'gamification' | 'analytics' | 'settings'
  const [appData, setAppData] = useState(createInitialState);
  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState('local'); // 'local' | 'syncing' | 'synced'
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [toasts, setToasts] = useState([]);

  // --- MODALS & FORMS STATE ---
  const [quickAddModalOpen, setQuickAddModalOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState('habit'); // 'habit' | 'routine'

  // Habit Modal State
  const [editingHabit, setEditingHabit] = useState(null);
  const [habitForm, setHabitForm] = useState({
    name: '',
    category: 'Health',
    frequency: 'daily',
    targetDaysPerWeek: 7,
    icon: 'Dumbbell',
    color: '#8b5cf6'
  });
  const [selectedHabitCalendar, setSelectedHabitCalendar] = useState('all');

  // Routine Modal State
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [routineForm, setRoutineForm] = useState({
    title: '',
    time: '08:00',
    duration: 30,
    category: 'Study',
    reminder: true
  });
  const [routineFilter, setRoutineFilter] = useState('All');

  // Focus Mode State
  const [focusPreset, setFocusPreset] = useState('pomodoro'); // 'pomodoro' (25), 'deep' (50), 'shortBreak' (5), 'longBreak' (15), 'custom'
  const [customMinutes, setCustomMinutes] = useState(40);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalFocusSeconds, setTotalFocusSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [linkedTaskTitle, setLinkedTaskTitle] = useState('Deep Work Priority Block');
  const [ambientSoundOn, setAmbientSoundOn] = useState(false);
  const audioCtxRef = useRef(null);
  const noiseNodeRef = useRef(null);

  // Analytics Timeframe
  const [analyticsRange, setAnalyticsRange] = useState('7d'); // '7d' | '30d'

  // Import JSON input ref
  const fileInputRef = useRef(null);

  // --- TOAST HELPER ---
  const showToast = (title, message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-3), { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  // --- FIREBASE AUTHENTICATION & DATA SYNC ---
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.warn('Auth fallback to session state:', e);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    setSyncStatus('syncing');
    const userStateDoc = doc(db, 'artifacts', appId, 'users', user.uid, 'disciplineStore', 'mainState');
    const unsubscribe = onSnapshot(
      userStateDoc,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && data.habits && data.routines && data.profile) {
            setAppData(data);
          }
        } else {
          setDoc(userStateDoc, appData).catch(() => {});
        }
        setSyncStatus('synced');
      },
      (err) => {
        console.warn('Firestore snapshot warning:', err);
        setSyncStatus('local');
      }
    );
    return () => unsubscribe();
  }, [user]);

  const persistAppData = (updater) => {
    setAppData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (user && db) {
        setSyncStatus('syncing');
        const userStateDoc = doc(db, 'artifacts', appId, 'users', user.uid, 'disciplineStore', 'mainState');
        setDoc(userStateDoc, next)
          .then(() => setSyncStatus('synced'))
          .catch(() => setSyncStatus('local'));
      }
      return next;
    });
  };

  // --- SYNTHESIZED AMBIENT BROWN/WHITE FOCUS NOISE ---
  const stopAmbientAudio = () => {
    try {
      if (noiseNodeRef.current) {
        noiseNodeRef.current.disconnect();
        noiseNodeRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const toggleAmbientAudio = () => {
    if (ambientSoundOn) {
      stopAmbientAudio();
      setAmbientSoundOn(false);
      showToast('Zen Audio Muted', 'Ambient focus soundscape turned off.', 'info');
    } else {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 0.12; // Soft soothing brown noise gain
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 420;

        whiteNoise.connect(filter);
        filter.connect(ctx.destination);
        whiteNoise.start(0);
        noiseNodeRef.current = filter;
        setAmbientSoundOn(true);
        showToast('Deep Zen Audio Active', 'Soothing low-frequency focus soundscape enabled.', 'success');
      } catch (e) {
        showToast('Audio Restricted', 'Interact with the page first to enable Web Audio.', 'warning');
      }
    }
  };

  useEffect(() => {
    return () => stopAmbientAudio();
  }, []);

  // --- FOCUS TIMER COUNTDOWN ---
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimerRunning(false);
          handleCompleteFocusSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, totalFocusSeconds, focusPreset, linkedTaskTitle]);

  const handleCompleteFocusSession = () => {
    const durationMins = Math.max(1, Math.round(totalFocusSeconds / 60));
    const isBreak = focusPreset === 'shortBreak' || focusPreset === 'longBreak';
    if (isBreak) {
      showToast('Break Complete', 'Rest period finished. Ready for your next focus sprint!', 'info');
      return;
    }
    const earnedXp = Math.max(10, Math.round((durationMins / 5) * 10));
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newSession = {
      id: `f-${Date.now()}`,
      date: TODAY_KEY,
      duration: durationMins,
      mode: focusPreset === 'pomodoro' ? 'Pomodoro' : focusPreset === 'deep' ? 'Deep Work' : 'Custom Focus',
      taskTitle: linkedTaskTitle || 'Focused Execution',
      timestamp: timeStr
    };

    persistAppData((prev) => ({
      ...prev,
      xp: prev.xp + earnedXp,
      focusSessions: [newSession, ...prev.focusSessions]
    }));

    showToast(
      `Focus Session Logged! (+${earnedXp} XP)`,
      `${durationMins} mins recorded toward "${linkedTaskTitle}".`,
      'success'
    );
  };

  const selectFocusPreset = (preset, mins) => {
    setIsTimerRunning(false);
    setFocusPreset(preset);
    const secs = mins * 60;
    setTotalFocusSeconds(secs);
    setTimeLeft(secs);
  };

  // --- DYNAMIC METRICS & SCORE ENGINE ---
  const metrics = useMemo(() => {
    const { habits, routines, focusSessions, xp, profile } = appData;

    // Today's Habit Stats
    const totalHabitsCount = habits.length || 1;
    const completedHabitsToday = habits.filter((h) => h.completedDates && h.completedDates[TODAY_KEY]).length;
    const habitRateToday = Math.round((completedHabitsToday / totalHabitsCount) * 100);

    // Today's Routine Stats
    const totalRoutinesCount = routines.length || 1;
    const completedRoutinesToday = routines.filter((r) => r.completedDates && r.completedDates[TODAY_KEY]).length;
    const routineRateToday = Math.round((completedRoutinesToday / totalRoutinesCount) * 100);

    // Today's Focus Minutes
    const focusMinutesToday = focusSessions
      .filter((s) => s.date === TODAY_KEY)
      .reduce((acc, cur) => acc + (Number(cur.duration) || 0), 0);
    const focusGoal = profile.dailyFocusGoal || 90;
    const focusRateToday = Math.min(100, Math.round((focusMinutesToday / focusGoal) * 100));

    // Daily Discipline Score (0 - 100) weighted: 40% Habits, 40% Routines, 20% Focus
    const disciplineScore = Math.min(
      100,
      Math.round(habitRateToday * 0.4 + routineRateToday * 0.4 + focusRateToday * 0.2)
    );

    // Combined Daily Tasks & Habits Progress
    const totalItemsToday = habits.length + routines.length;
    const completedItemsToday = completedHabitsToday + completedRoutinesToday;
    const overallProgressPercent =
      totalItemsToday > 0 ? Math.round((completedItemsToday / totalItemsToday) * 100) : 0;

    // Best & Overall Active Streak
    const habitStreaks = habits.map((h) => calculateHabitStreak(h.completedDates));
    const maxHabitStreak = habitStreaks.length > 0 ? Math.max(...habitStreaks) : 0;

    // Calculate consecutive days where user completed at least 50% of habits/routines
    let masterStreak = 0;
    for (let i = 0; i < 60; i++) {
      const key = getPastDateKey(i);
      const hDone = habits.filter((h) => h.completedDates?.[key]).length;
      const rDone = routines.filter((r) => r.completedDates?.[key]).length;
      if (hDone + rDone >= Math.max(1, Math.floor(totalItemsToday * 0.4))) {
        masterStreak++;
      } else if (i > 0) {
        break;
      }
    }

    // Level & XP calculation (200 XP per level)
    const level = Math.floor(xp / 200) + 1;
    const currentLevelXp = xp % 200;
    const xpProgressPercent = Math.round((currentLevelXp / 200) * 100);
    const rank = getRankForLevel(level);

    // Weekly Productivity Data (Last 7 days)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const key = getPastDateKey(i);
      const hDone = habits.filter((h) => h.completedDates?.[key]).length;
      const rDone = routines.filter((r) => r.completedDates?.[key]).length;
      const fMins = focusSessions
        .filter((s) => s.date === key)
        .reduce((a, b) => a + (Number(b.duration) || 0), 0);

      const hPct = Math.round((hDone / totalHabitsCount) * 100);
      const rPct = Math.round((rDone / totalRoutinesCount) * 100);
      const fPct = Math.min(100, Math.round((fMins / focusGoal) * 100));
      const dayScore = Math.min(100, Math.round(hPct * 0.4 + rPct * 0.4 + fPct * 0.2));

      weeklyData.push({
        dateKey: key,
        day: getDayShortName(key, profile.language),
        score: dayScore,
        habitsCompleted: hDone,
        routinesCompleted: rDone,
        focusMinutes: fMins
      });
    }

    // 30-Day Analytics Data
    const monthlyData = [];
    for (let i = 29; i >= 0; i--) {
      const key = getPastDateKey(i);
      const hDone = habits.filter((h) => h.completedDates?.[key]).length;
      const rDone = routines.filter((r) => r.completedDates?.[key]).length;
      const fMins = focusSessions
        .filter((s) => s.date === key)
        .reduce((a, b) => a + (Number(b.duration) || 0), 0);
      const dayScore = Math.min(
        100,
        Math.round(
          (hDone / totalHabitsCount) * 40 +
            (rDone / totalRoutinesCount) * 40 +
            Math.min(1, fMins / focusGoal) * 20
        )
      );
      monthlyData.push({
        dateKey: key,
        label: key.slice(5),
        score: dayScore,
        focusMinutes: fMins,
        habitsCompleted: hDone
      });
    }

    return {
      completedHabitsToday,
      totalHabitsCount: habits.length,
      habitRateToday,
      completedRoutinesToday,
      totalRoutinesCount: routines.length,
      routineRateToday,
      focusMinutesToday,
      focusGoal,
      focusRateToday,
      disciplineScore,
      overallProgressPercent,
      completedItemsToday,
      totalItemsToday,
      masterStreak: Math.max(masterStreak, maxHabitStreak),
      level,
      currentLevelXp,
      xpProgressPercent,
      rank,
      weeklyData,
      monthlyData
    };
  }, [appData]);

  // --- ACTIONS: TOGGLE HABIT & ROUTINE ---
  const toggleHabitCompletion = (habitId, dateKey = TODAY_KEY) => {
    persistAppData((prev) => {
      let xpDelta = 0;
      const updatedHabits = prev.habits.map((h) => {
        if (h.id !== habitId) return h;
        const currentlyDone = !!(h.completedDates && h.completedDates[dateKey]);
        const nextDates = { ...(h.completedDates || {}), [dateKey]: !currentlyDone };
        xpDelta = !currentlyDone ? 20 : -20;
        return { ...h, completedDates: nextDates };
      });
      if (xpDelta > 0) {
        showToast('Habit Completed! +20 XP', 'Consistency compounds into mastery.', 'success');
      }
      return {
        ...prev,
        xp: Math.max(0, prev.xp + xpDelta),
        habits: updatedHabits
      };
    });
  };

  const toggleRoutineCompletion = (routineId, dateKey = TODAY_KEY) => {
    persistAppData((prev) => {
      let xpDelta = 0;
      const updatedRoutines = prev.routines.map((r) => {
        if (r.id !== routineId) return r;
        const currentlyDone = !!(r.completedDates && r.completedDates[dateKey]);
        const nextDates = { ...(r.completedDates || {}), [dateKey]: !currentlyDone };
        xpDelta = !currentlyDone ? 15 : -15;
        return { ...r, completedDates: nextDates };
      });
      if (xpDelta > 0) {
        showToast('Routine Block Completed! +15 XP', 'Your daily structure grows stronger.', 'success');
      }
      return {
        ...prev,
        xp: Math.max(0, prev.xp + xpDelta),
        routines: updatedRoutines
      };
    });
  };

  // --- ACTIONS: SAVE / DELETE HABIT ---
  const handleSaveHabit = (e) => {
    e.preventDefault();
    if (!habitForm.name.trim()) {
      showToast('Validation Error', 'Please enter a valid habit name.', 'warning');
      return;
    }
    if (editingHabit) {
      persistAppData((prev) => ({
        ...prev,
        habits: prev.habits.map((h) =>
          h.id === editingHabit.id ? { ...h, ...habitForm, name: habitForm.name.trim() } : h
        )
      }));
      showToast('Habit Updated', `"${habitForm.name}" has been updated.`, 'success');
    } else {
      const newHabit = {
        id: `h-${Date.now()}`,
        ...habitForm,
        name: habitForm.name.trim(),
        createdAt: TODAY_KEY,
        completedDates: {}
      };
      persistAppData((prev) => ({
        ...prev,
        habits: [...prev.habits, newHabit]
      }));
      showToast('Habit Forged', `"${newHabit.name}" added to your daily arsenal.`, 'success');
    }
    setEditingHabit(null);
    setHabitForm({ name: '', category: 'Health', frequency: 'daily', targetDaysPerWeek: 7, icon: 'Dumbbell', color: '#8b5cf6' });
    setQuickAddModalOpen(false);
  };

  const handleDeleteHabit = (id) => {
    persistAppData((prev) => ({
      ...prev,
      habits: prev.habits.filter((h) => h.id !== id)
    }));
    showToast('Habit Removed', 'Habit removed from tracker.', 'info');
  };

  // --- ACTIONS: SAVE / DELETE ROUTINE ---
  const handleSaveRoutine = (e) => {
    e.preventDefault();
    if (!routineForm.title.trim()) {
      showToast('Validation Error', 'Please enter a routine activity title.', 'warning');
      return;
    }
    if (editingRoutine) {
      persistAppData((prev) => ({
        ...prev,
        routines: prev.routines.map((r) =>
          r.id === editingRoutine.id ? { ...r, ...routineForm, title: routineForm.title.trim() } : r
        )
      }));
      showToast('Routine Updated', `"${routineForm.title}" updated in schedule.`, 'success');
    } else {
      const newRoutine = {
        id: `r-${Date.now()}`,
        ...routineForm,
        title: routineForm.title.trim(),
        duration: Number(routineForm.duration) || 30,
        completedDates: {}
      };
      persistAppData((prev) => ({
        ...prev,
        routines: [...prev.routines, newRoutine]
      }));
      showToast('Routine Scheduled', `"${newRoutine.title}" set for ${newRoutine.time}.`, 'success');
    }
    setEditingRoutine(null);
    setRoutineForm({ title: '', time: '08:00', duration: 30, category: 'Study', reminder: true });
    setQuickAddModalOpen(false);
  };

  const handleDeleteRoutine = (id) => {
    persistAppData((prev) => ({
      ...prev,
      routines: prev.routines.filter((r) => r.id !== id)
    }));
    showToast('Routine Deleted', 'Scheduled block removed.', 'info');
  };

  // --- EXPORT / IMPORT / RESET DATA ---
  const handleExportData = () => {
    const dataStr = JSON.stringify(appData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aether-discipline-backup-${TODAY_KEY}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup Exported', 'Your discipline data JSON file has been downloaded.', 'success');
  };

  const handleImportData = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed && Array.isArray(parsed.habits) && Array.isArray(parsed.routines)) {
          persistAppData(parsed);
          showToast('Data Restored', 'Your backup was successfully imported!', 'success');
        } else {
          showToast('Invalid File', 'JSON structure does not match AETHER format.', 'warning');
        }
      } catch (err) {
        showToast('Import Failed', 'Could not parse the JSON file.', 'warning');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemoData = () => {
    const fresh = createInitialState();
    persistAppData(fresh);
    showToast('System Reset', 'Default starter habits, routines, and analytics restored.', 'info');
  };

  // --- THEME & TRANSLATION SHORTCUTS ---
  const isDark = appData.profile.theme !== 'light';
  const t = TRANSLATIONS[appData.profile.language] || TRANSLATIONS.en;

  // --- GAMIFICATION CHALLENGES ---
  const challenges = useMemo(() => {
    const totalFocusSessions = appData.focusSessions.length;
    return [
      {
        id: 'ch-daily-trifecta',
        title: 'Daily Trifecta Protocol',
        desc: 'Complete at least 3 Habits and 3 Routine blocks today.',
        progress: Math.min(3, metrics.completedHabitsToday) + Math.min(3, metrics.completedRoutinesToday),
        target: 6,
        xpReward: 75,
        type: 'Daily'
      },
      {
        id: 'ch-deep-focus-90',
        title: 'Monk Mode Immersion',
        desc: 'Accumulate 90+ minutes of Focus Timer sessions today.',
        progress: Math.min(90, metrics.focusMinutesToday),
        target: 90,
        xpReward: 100,
        type: 'Daily'
      },
      {
        id: 'ch-streak-5',
        title: 'Unbroken Chain (5 Days)',
        desc: 'Maintain an active discipline streak of at least 5 days.',
        progress: Math.min(5, metrics.masterStreak),
        target: 5,
        xpReward: 150,
        type: 'Weekly'
      },
      {
        id: 'ch-focus-veteran',
        title: 'Relentless Executor',
        desc: 'Complete 10 total Deep Focus timer sessions.',
        progress: Math.min(10, totalFocusSessions),
        target: 10,
        xpReward: 200,
        type: 'Milestone'
      }
    ];
  }, [metrics, appData.focusSessions]);

  const claimChallengeReward = (challenge) => {
    if (appData.claimedChallenges?.includes(challenge.id)) return;
    persistAppData((prev) => ({
      ...prev,
      xp: prev.xp + challenge.xpReward,
      claimedChallenges: [...(prev.claimedChallenges || []), challenge.id]
    }));
    showToast(`Challenge Claimed! +${challenge.xpReward} XP`, `Completed "${challenge.title}"`, 'success');
  };

  // --- SORTED ROUTINES ---
  const sortedRoutines = useMemo(() => {
    return [...appData.routines]
      .filter((r) => routineFilter === 'All' || r.category === routineFilter)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appData.routines, routineFilter]);

  // --- FORMAT SECONDS TO MM:SS ---
  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 font-sans selection:bg-violet-500 selection:text-white ${
        isDark ? 'bg-[#090A0F] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* AMBIENT BACKGROUND GLOWS */}
      {isDark && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-[130px]" />
          <div className="absolute -bottom-40 left-1/3 w-80 h-80 bg-purple-600/8 rounded-full blur-[110px]" />
        </div>
      )}

      {/* TOAST NOTIFICATIONS OVERLAY */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 ${
              isDark
                ? 'bg-zinc-900/95 border-zinc-800 text-slate-100'
                : 'bg-white/95 border-slate-200 text-slate-900'
            }`}
          >
            <div
              className={`p-2 rounded-xl shrink-0 ${
                toast.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : toast.type === 'warning'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-violet-500/20 text-violet-400'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : toast.type === 'warning' ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold tracking-tight">{toast.title}</p>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                {toast.message}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* MAIN LAYOUT SHELL */}
      <div className="relative z-10 flex min-h-screen">
        {/* DESKTOP SIDEBAR NAVIGATION */}
        <aside
          className={`hidden md:flex flex-col w-64 lg:w-72 shrink-0 border-r transition-colors ${
            isDark
              ? 'bg-[#0D0E15]/90 border-zinc-800/80 backdrop-blur-xl'
              : 'bg-white border-slate-200'
          }`}
        >
          {/* Brand Logo */}
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-600/25">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-wider text-lg">AETHER</span>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30">
                    PRO
                  </span>
                </div>
                <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                  Discipline & Mastery OS
                </p>
              </div>
            </div>
          </div>

          {/* User Level & Rank Card in Sidebar */}
          <div className="px-4 mb-6">
            <div
              onClick={() => {
                setActiveTab('profile');
                setProfileSubTab('gamification');
              }}
              className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                isDark
                  ? 'bg-zinc-900/60 border-zinc-800/90 hover:border-violet-500/40'
                  : 'bg-slate-100/80 border-slate-200 hover:border-violet-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30 flex items-center justify-center text-xl">
                  {appData.profile.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{appData.profile.name}</p>
                  <p className="text-xs text-violet-400 font-medium truncate">
                    Lvl {metrics.level} • {metrics.rank.title}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>XP Progress</span>
                  <span className="font-mono font-semibold text-violet-400">
                    {metrics.currentLevelXp} / 200 XP
                  </span>
                </div>
                <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-slate-200'}`}>
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
                    style={{ width: `${metrics.xpProgressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Primary Navigation Links */}
          <nav className="flex-1 px-4 space-y-1.5">
            {[
              { id: 'home', label: t.home, icon: Home, badge: `${metrics.disciplineScore}%` },
              { id: 'habits', label: t.habits, icon: CheckSquare, badge: `${metrics.completedHabitsToday}/${metrics.totalHabitsCount}` },
              { id: 'routine', label: t.routine, icon: CalendarIcon, badge: `${metrics.completedRoutinesToday}/${metrics.totalRoutinesCount}` },
              { id: 'focus', label: t.focus, icon: Clock, badge: isTimerRunning ? formatTimer(timeLeft) : null },
              { id: 'profile', label: t.profile, icon: User, badge: null }
            ].map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/20'
                      : isDark
                      ? 'text-zinc-400 hover:text-slate-100 hover:bg-zinc-800/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-md font-mono ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : isDark
                          ? 'bg-zinc-800 text-zinc-400'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Quick Add & Footer */}
          <div className="p-4 space-y-3 border-t border-zinc-800/50">
            <button
              onClick={() => {
                setEditingHabit(null);
                setEditingRoutine(null);
                setQuickAddModalOpen(true);
              }}
              className="w-full py-3 px-4 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border border-violet-500/30 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{t.quickAdd}</span>
            </button>
            <div className="flex items-center justify-between px-2 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    syncStatus === 'synced' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                {syncStatus === 'synced' ? 'Cloud Synced' : 'Session Active'}
              </span>
              <button
                onClick={() =>
                  persistAppData((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, theme: isDark ? 'light' : 'dark' }
                  }))
                }
                className="p-1.5 rounded-lg hover:bg-zinc-800/50 text-zinc-400 hover:text-white transition"
                title="Toggle Theme"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-700" />}
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 pb-24 md:pb-10">
          {/* TOP HEADER BAR */}
          <header
            className={`sticky top-0 z-30 border-b backdrop-blur-xl px-4 sm:px-8 py-4 flex items-center justify-between transition-colors ${
              isDark
                ? 'bg-[#090A0F]/80 border-zinc-800/80'
                : 'bg-white/85 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Mobile Logo */}
              <div className="md:hidden w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-600/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight">
                  {activeTab === 'home' && t.home}
                  {activeTab === 'habits' && t.habits}
                  {activeTab === 'routine' && t.routine}
                  {activeTab === 'focus' && t.focusTimer}
                  {activeTab === 'profile' && t.profile}
                </h1>
                <p className={`text-xs hidden sm:block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Header Right Badges */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Active Streak Pill */}
              <div
                onClick={() => setActiveTab('habits')}
                className={`cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                  isDark
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                    : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}
              >
                <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{metrics.masterStreak}d Streak</span>
              </div>

              {/* XP & Level Pill */}
              <div
                onClick={() => {
                  setActiveTab('profile');
                  setProfileSubTab('gamification');
                }}
                className={`cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                  isDark
                    ? 'bg-violet-500/10 border-violet-500/30 text-violet-300 hover:bg-violet-500/20'
                    : 'bg-violet-50 border-violet-200 text-violet-700'
                }`}
              >
                <Zap className="w-4 h-4 text-violet-400" />
                <span>{appData.xp} XP</span>
              </div>

              {/* Quick Add Button */}
              <button
                onClick={() => {
                  setEditingHabit(null);
                  setEditingRoutine(null);
                  setQuickAddModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-violet-600/20 transition"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{t.quickAdd}</span>
              </button>
            </div>
          </header>

          {/* PAGE CONTENT CONTAINER */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
            {/* ========================================================= */}
            {/* 1. HOME DASHBOARD                                         */}
            {/* ========================================================= */}
            {activeTab === 'home' && (
              <div className="space-y-6">
                {/* Top Hero Metric Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Daily Discipline Score Ring */}
                  <div
                    className={`p-5 rounded-3xl border flex items-center justify-between ${
                      isDark
                        ? 'bg-gradient-to-br from-zinc-900/90 via-zinc-900/60 to-violet-950/30 border-zinc-800/90'
                        : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                        {t.disciplineScore}
                      </span>
                      <div className="text-3xl font-extrabold mt-1 tracking-tight">
                        {metrics.disciplineScore}
                        <span className="text-lg font-normal text-zinc-500">/100</span>
                      </div>
                      <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        {metrics.disciplineScore >= 80
                          ? 'Elite Execution Today'
                          : metrics.disciplineScore >= 50
                          ? 'Solid Momentum Building'
                          : 'Execute Your Next Block'}
                      </p>
                    </div>
                    {/* SVG Progress Ring */}
                    <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          fill="none"
                          stroke={isDark ? '#27272a' : '#e2e8f0'}
                          strokeWidth="6"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          fill="none"
                          stroke="url(#scoreGrad)"
                          strokeWidth="6"
                          strokeDasharray={2 * Math.PI * 26}
                          strokeDashoffset={
                            2 * Math.PI * 26 * (1 - metrics.disciplineScore / 100)
                          }
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#6366f1" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <Shield className="w-5 h-5 text-violet-400 absolute" />
                    </div>
                  </div>

                  {/* Card 2: Daily Task & Habit Completion */}
                  <div
                    className={`p-5 rounded-3xl border flex flex-col justify-between ${
                      isDark ? 'bg-zinc-900/70 border-zinc-800/90' : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        {t.dailyProgress}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        {metrics.overallProgressPercent}%
                      </span>
                    </div>
                    <div className="my-2">
                      <div className="text-2xl font-bold">
                        {metrics.completedItemsToday}{' '}
                        <span className="text-sm font-normal text-zinc-500">
                          / {metrics.totalItemsToday} Completed
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        {metrics.totalItemsToday - metrics.completedItemsToday} remaining actions today
                      </p>
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-slate-200'}`}>
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                        style={{ width: `${metrics.overallProgressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Card 3: Current Habit Streak */}
                  <div
                    className={`p-5 rounded-3xl border flex flex-col justify-between ${
                      isDark ? 'bg-zinc-900/70 border-zinc-800/90' : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        {t.currentStreak}
                      </span>
                      <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
                    </div>
                    <div className="my-2">
                      <div className="text-2xl font-bold">
                        {metrics.masterStreak} <span className="text-sm font-normal text-zinc-500">Days</span>
                      </div>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        Habits Today: {metrics.completedHabitsToday}/{metrics.totalHabitsCount}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {metrics.weeklyData.map((d) => (
                        <div
                          key={d.dateKey}
                          title={`${d.day}: ${d.score}%`}
                          className={`flex-1 h-1.5 rounded-full ${
                            d.score >= 50
                              ? 'bg-amber-400'
                              : d.score > 0
                              ? 'bg-amber-500/40'
                              : isDark
                              ? 'bg-zinc-800'
                              : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Card 4: Deep Focus Time Today */}
                  <div
                    onClick={() => setActiveTab('focus')}
                    className={`cursor-pointer p-5 rounded-3xl border flex flex-col justify-between transition ${
                      isDark
                        ? 'bg-zinc-900/70 border-zinc-800/90 hover:border-indigo-500/40'
                        : 'bg-white border-slate-200 shadow-sm hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        Deep Focus Today
                      </span>
                      <Clock className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="my-2">
                      <div className="text-2xl font-bold">
                        {metrics.focusMinutesToday}{' '}
                        <span className="text-sm font-normal text-zinc-500">
                          / {metrics.focusGoal}m
                        </span>
                      </div>
                      <p className="text-xs text-indigo-400 mt-0.5 flex items-center gap-1">
                        <span>Launch Focus Timer</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </p>
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-slate-200'}`}>
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                        style={{ width: `${metrics.focusRateToday}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Motivational Quote Banner */}
                <div
                  className={`p-5 sm:p-6 rounded-3xl border relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isDark
                      ? 'bg-gradient-to-r from-violet-950/40 via-zinc-900/90 to-indigo-950/40 border-violet-500/25'
                      : 'bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-200'
                  }`}
                >
                  <div className="space-y-1 max-w-3xl">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t.quoteOfTheDay}</span>
                    </div>
                    <p className="text-base sm:text-lg font-medium italic leading-relaxed">
                      "{QUOTES[quoteIndex].text}"
                    </p>
                    <p className={`text-xs font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                      — {QUOTES[quoteIndex].author}
                    </p>
                  </div>
                  <button
                    onClick={() => setQuoteIndex((prev) => (prev + 1) % QUOTES.length)}
                    className={`shrink-0 px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                      isDark
                        ? 'bg-zinc-900/80 border-zinc-700 hover:border-violet-500 text-zinc-300'
                        : 'bg-white border-slate-300 hover:border-violet-500 text-slate-700'
                    }`}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Next Maxim</span>
                  </button>
                </div>

                {/* Main Split Grid: Today's Habits & Today's Routine */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Today's Habits & Weekly Chart (7 cols) */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Today's Habits Checklist */}
                    <div
                      className={`p-6 rounded-3xl border ${
                        isDark ? 'bg-zinc-900/60 border-zinc-800/90' : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h2 className="text-base font-bold">{t.todaysHabits}</h2>
                          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                            One-tap completion (+20 XP per habit)
                          </p>
                        </div>
                        <button
                          onClick={() => setActiveTab('habits')}
                          className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1"
                        >
                          <span>All Habits</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {appData.habits.map((habit) => {
                          const isDone = !!(habit.completedDates && habit.completedDates[TODAY_KEY]);
                          const streak = calculateHabitStreak(habit.completedDates);
                          const IconComp = ICON_MAP[habit.icon] || Dumbbell;

                          return (
                            <div
                              key={habit.id}
                              onClick={() => toggleHabitCompletion(habit.id, TODAY_KEY)}
                              className={`cursor-pointer group p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                                isDone
                                  ? isDark
                                    ? 'bg-emerald-950/20 border-emerald-500/30'
                                    : 'bg-emerald-50/70 border-emerald-200'
                                  : isDark
                                  ? 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
                                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                <button
                                  type="button"
                                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                                    isDone
                                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                                      : isDark
                                      ? 'bg-zinc-800 text-zinc-500 group-hover:border-violet-500 border border-zinc-700'
                                      : 'bg-white text-slate-400 border border-slate-300'
                                  }`}
                                >
                                  {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : < IconComp className="w-3.5 h-3.5" />}
                                </button>
                                <div className="min-w-0">
                                  <p
                                    className={`text-sm font-semibold truncate transition ${
                                      isDone ? 'line-through opacity-60' : ''
                                    }`}
                                  >
                                    {habit.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                                      {habit.category}
                                    </span>
                                    <span className="text-[11px] text-amber-400 flex items-center gap-0.5 font-medium">
                                      <Flame className="w-3 h-3 fill-amber-400" /> {streak}d
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <span
                                className={`text-xs font-mono px-2.5 py-1 rounded-lg ${
                                  isDone
                                    ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                                    : isDark
                                    ? 'bg-zinc-800 text-zinc-400'
                                    : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {isDone ? 'Done' : '+20 XP'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Weekly Productivity Chart */}
                    <div
                      className={`p-6 rounded-3xl border ${
                        isDark ? 'bg-zinc-900/60 border-zinc-800/90' : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-base font-bold">{t.weeklyProductivity}</h2>
                          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                            Real-time 7-day discipline score trajectory
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setActiveTab('profile');
                            setProfileSubTab('analytics');
                          }}
                          className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1"
                        >
                          <span>Full Analytics</span>
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={metrics.weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.45} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke={isDark ? '#27272a' : '#e2e8f0'}
                            />
                            <XAxis
                              dataKey="day"
                              stroke={isDark ? '#71717a' : '#64748b'}
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              domain={[0, 100]}
                              stroke={isDark ? '#71717a' : '#64748b'}
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: isDark ? '#18181b' : '#ffffff',
                                borderColor: isDark ? '#27272a' : '#e2e8f0',
                                borderRadius: '12px',
                                fontSize: '12px'
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="score"
                              name="Discipline Score"
                              stroke="#8b5cf6"
                              strokeWidth={3}
                              fillOpacity={1}
                              fill="url(#colorScore)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Today's Chronological Routine (5 cols) */}
                  <div className="lg:col-span-5">
                    <div
                      className={`p-6 rounded-3xl border h-full flex flex-col justify-between ${
                        isDark ? 'bg-zinc-900/60 border-zinc-800/90' : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h2 className="text-base font-bold">{t.todaysRoutine}</h2>
                            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                              Chronological daily timeline (+15 XP)
                            </p>
                          </div>
                          <button
                            onClick={() => setActiveTab('routine')}
                            className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1"
                          >
                            <span>Planner</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          {sortedRoutines.map((item) => {
                            const isDone = !!(item.completedDates && item.completedDates[TODAY_KEY]);
                            const catObj =
                              ROUTINE_CATEGORIES.find((c) => c.id === item.category) ||
                              ROUTINE_CATEGORIES[ROUTINE_CATEGORIES.length - 1];

                            return (
                              <div
                                key={item.id}
                                onClick={() => toggleRoutineCompletion(item.id, TODAY_KEY)}
                                className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                  isDone
                                    ? isDark
                                      ? 'bg-indigo-950/20 border-indigo-500/30'
                                      : 'bg-indigo-50/70 border-indigo-200'
                                    : isDark
                                    ? 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
                                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition ${
                                      isDone
                                        ? 'bg-indigo-500 text-white'
                                        : isDark
                                        ? 'border border-zinc-700 bg-zinc-800'
                                        : 'border border-slate-300 bg-white'
                                    }`}
                                  >
                                    {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                  </div>
                                  <div className="min-w-0">
                                    <p
                                      className={`text-sm font-semibold truncate ${
                                        isDone ? 'line-through opacity-60' : ''
                                      }`}
                                    >
                                      {item.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-xs font-mono text-violet-400 font-medium">
                                        {item.time}
                                      </span>
                                      <span className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                                        • {item.duration}m
                                      </span>
                                      <span
                                        className={`text-[10px] px-2 py-0.5 rounded-full border ${catObj.color}`}
                                      >
                                        {item.category}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setQuickAddType('routine');
                          setEditingRoutine(null);
                          setQuickAddModalOpen(true);
                        }}
                        className={`mt-4 w-full py-3 rounded-2xl border border-dashed text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                          isDark
                            ? 'border-zinc-700 hover:border-violet-500 text-zinc-400 hover:text-violet-300'
                            : 'border-slate-300 hover:border-violet-500 text-slate-600'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Time Block to Schedule</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 2. HABIT TRACKER & INTERACTIVE CALENDAR                   */}
            {/* ========================================================= */}
            {activeTab === 'habits' && (
              <div className="space-y-6">
                {/* Top Summary Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">Habit Architecture & Consistency Matrix</h2>
                    <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      Tap any day in the 7-day matrix to log or adjust completion history.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setQuickAddType('habit');
                      setEditingHabit(null);
                      setHabitForm({
                        name: '',
                        category: 'Health',
                        frequency: 'daily',
                        targetDaysPerWeek: 7,
                        icon: 'Dumbbell',
                        color: '#8b5cf6'
                      });
                      setQuickAddModalOpen(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-violet-600/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New Habit</span>
                  </button>
                </div>

                {/* 7-Day Interactive Habit Matrix */}
                <div
                  className={`rounded-3xl border overflow-hidden ${
                    isDark ? 'bg-zinc-900/60 border-zinc-800/90' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`border-b text-xs uppercase ${isDark ? 'border-zinc-800 text-zinc-400' : 'border-slate-200 text-slate-500'}`}>
                          <th className="py-4 px-5 font-semibold min-w-[220px]">Habit & Category</th>
                          {[6, 5, 4, 3, 2, 1, 0].map((daysAgo) => {
                            const key = getPastDateKey(daysAgo);
                            return (
                              <th key={key} className="py-4 px-2 text-center font-semibold min-w-[54px]">
                                <div>{getDayShortName(key, appData.profile.language)}</div>
                                <div className="text-[10px] font-mono opacity-70">{key.slice(8)}</div>
                              </th>
                            );
                          })}
                          <th className="py-4 px-4 text-center font-semibold">Streak</th>
                          <th className="py-4 px-4 text-right font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {appData.habits.map((habit) => {
                          const streak = calculateHabitStreak(habit.completedDates);
                          const IconComp = ICON_MAP[habit.icon] || Dumbbell;

                          return (
                            <tr
                              key={habit.id}
                              className={`transition ${
                                isDark ? 'hover:bg-zinc-800/30' : 'hover:bg-slate-50'
                              }`}
                            >
                              <td className="py-4 px-5">
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                    style={{
                                      backgroundColor: `${habit.color || '#8b5cf6'}20`,
                                      color: habit.color || '#8b5cf6'
                                    }}
                                  >
                                    <IconComp className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-sm">{habit.name}</p>
                                    <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                                      {habit.category} • {habit.frequency} ({habit.targetDaysPerWeek}d/wk)
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {[6, 5, 4, 3, 2, 1, 0].map((daysAgo) => {
                                const key = getPastDateKey(daysAgo);
                                const done = !!(habit.completedDates && habit.completedDates[key]);
                                return (
                                  <td key={key} className="py-4 px-2 text-center">
                                    <button
                                      onClick={() => toggleHabitCompletion(habit.id, key)}
                                      className={`w-8 h-8 rounded-xl mx-auto flex items-center justify-center transition-all ${
                                        done
                                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 scale-100'
                                          : isDark
                                          ? 'bg-zinc-800/90 text-zinc-600 hover:bg-zinc-700'
                                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                      }`}
                                      title={`${habit.name} on ${key}`}
                                    >
                                      {done ? <Check className="w-4 h-4 stroke-[3]" /> : <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />}
                                    </button>
                                  </td>
                                );
                              })}

                              <td className="py-4 px-4 text-center">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                  <Flame className="w-3.5 h-3.5 fill-amber-400" />
                                  {streak}d
                                </span>
                              </td>

                              <td className="py-4 px-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingHabit(habit);
                                      setHabitForm({
                                        name: habit.name,
                                        category: habit.category,
                                        frequency: habit.frequency || 'daily',
                                        targetDaysPerWeek: habit.targetDaysPerWeek || 7,
                                        icon: habit.icon || 'Dumbbell',
                                        color: habit.color || '#8b5cf6'
                                      });
                                      setQuickAddType('habit');
                                      setQuickAddModalOpen(true);
                                    }}
                                    className="p-2 rounded-lg text-zinc-400 hover:text-violet-400 hover:bg-zinc-800/60 transition"
                                    title="Edit Habit"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteHabit(habit.id)}
                                    className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/60 transition"
                                    title="Delete Habit"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 28-Day Habit Completion Heatmap Calendar & Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div
                    className={`lg:col-span-7 p-6 rounded-3xl border ${
                      isDark ? 'bg-zinc-900/60 border-zinc-800/90' : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                      <div>
                        <h3 className="text-base font-bold">28-Day Consistency Calendar</h3>
                        <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                          Visual history of completed vs missed habit days
                        </p>
                      </div>
                      <select
                        value={selectedHabitCalendar}
                        onChange={(e) => setSelectedHabitCalendar(e.target.value)}
                        className={`px-3 py-2 rounded-xl border text-xs font-semibold outline-none ${
                          isDark
                            ? 'bg-zinc-900 border-zinc-700 text-slate-200'
                            : 'bg-slate-50 border-slate-300 text-slate-800'
                        }`}
                      >
                        <option value="all">All Habits Combined</option>
                        {appData.habits.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: 28 }).map((_, idx) => {
                        const daysAgo = 27 - idx;
                        const key = getPastDateKey(daysAgo);
                        let intensity = 0;
                        if (selectedHabitCalendar === 'all') {
                          const doneCount = appData.habits.filter((h) => h.completedDates?.[key]).length;
                          intensity = appData.habits.length > 0 ? doneCount / appData.habits.length : 0;
                        } else {
                          const targetH = appData.habits.find((h) => h.id === selectedHabitCalendar);
                          intensity = targetH?.completedDates?.[key] ? 1 : 0;
                        }

                        return (
                          <div
                            key={key}
                            onClick={() => {
                              if (selectedHabitCalendar !== 'all') {
                                toggleHabitCompletion(selectedHabitCalendar, key);
                              }
                            }}
                            className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center transition ${
                              selectedHabitCalendar !== 'all' ? 'cursor-pointer hover:scale-105' : ''
                            } ${
                              intensity >= 0.8
                                ? 'bg-violet-600 border-violet-500 text-white shadow-md shadow-violet-600/20'
                                : intensity >= 0.4
                                ? 'bg-violet-600/40 border-violet-500/40 text-violet-200'
                                : intensity > 0
                                ? 'bg-violet-600/20 border-violet-500/20 text-violet-300'
                                : isDark
                                ? 'bg-zinc-900 border-zinc-800 text-zinc-500'
                                : 'bg-slate-100 border-slate-200 text-slate-400'
                            }`}
                          >
                            <span className="text-[10px] uppercase opacity-75">
                              {getDayShortName(key, appData.profile.language)}
                            </span>
                            <span className="text-xs font-mono font-bold mt-0.5">{key.slice(8)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Habit Performance Breakdown */}
                  <div
                    className={`lg:col-span-5 p-6 rounded-3xl border flex flex-col justify-between ${
                      isDark ? 'bg-zinc-900/60 border-zinc-800/90' : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div>
                      <h3 className="text-base font-bold mb-1">Habit Completion Rates</h3>
                      <p className={`text-xs mb-5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        7-day adherence and missed habit tracking
                      </p>

                      <div className="space-y-4">
                        {appData.habits.map((h) => {
                          let last7Done = 0;
                          for (let i = 0; i < 7; i++) {
                            if (h.completedDates?.[getPastDateKey(i)]) last7Done++;
                          }
                          const target = h.targetDaysPerWeek || 7;
                          const rate = Math.min(100, Math.round((last7Done / target) * 100));
                          const missed = Math.max(0, target - last7Done);

                          return (
                            <div key={h.id} className="space-y-1.5">
                              <div className="flex justify-between text-xs">
                                <span className="font-semibold truncate">{h.name}</span>
                                <span className="font-mono text-zinc-400">
                                  {last7Done}/{target}d ({rate}%) • {missed} missed
                                </span>
                              </div>
                              <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-slate-200'}`}>
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${rate}%`,
                                    backgroundColor: h.color || '#8b5cf6'
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div
                      className={`mt-6 p-4 rounded-2xl border text-xs ${
                        isDark ? 'bg-zinc-950/60 border-zinc-800 text-zinc-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className="font-semibold text-violet-400">Coach Insight:</span> Never miss twice in a row. Even a 10% effort keeps the identity of a disciplined practitioner alive.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 3. DAILY ROUTINE PLANNER                                  */}
            {/* ========================================================= */}
            {activeTab === 'routine' && (
              <div className="space-y-6">
                {/* Header & Add Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">Chronological Daily Routine Planner</h2>
                    <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      Design your ideal day from wake-up protocol to evening recovery.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setQuickAddType('routine');
                      setEditingRoutine(null);
                      setRoutineForm({
                        title: '',
                        time: '08:00',
                        duration: 30,
                        category: 'Study',
                        reminder: true
                      });
                      setQuickAddModalOpen(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-violet-600/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Routine Activity</span>
                  </button>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {['All', ...ROUTINE_CATEGORIES.map((c) => c.id)].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setRoutineFilter(cat)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                        routineFilter === cat
                          ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                          : isDark
                          ? 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Timeline List */}
                <div className="space-y-3">
                  {sortedRoutines.map((routine) => {
                    const isDone = !!(routine.completedDates && routine.completedDates[TODAY_KEY]);
                    const catObj =
                      ROUTINE_CATEGORIES.find((c) => c.id === routine.category) ||
                      ROUTINE_CATEGORIES[ROUTINE_CATEGORIES.length - 1];
                    const IconComp = ICON_MAP[catObj.icon] || Sparkles;

                    return (
                      <div
                        key={routine.id}
                        className={`p-4 sm:p-5 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isDone
                            ? isDark
                              ? 'bg-indigo-950/20 border-indigo-500/30'
                              : 'bg-indigo-50/70 border-indigo-200'
                            : isDark
                            ? 'bg-zinc-900/60 border-zinc-800/90 hover:border-zinc-700'
                            : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start sm:items-center gap-4">
                          {/* Time Badge */}
                          <div
                            className={`px-3.5 py-2 rounded-2xl font-mono text-sm font-bold text-center shrink-0 border ${
                              isDone
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                : isDark
                                ? 'bg-zinc-950 border-zinc-800 text-violet-400'
                                : 'bg-slate-100 border-slate-200 text-violet-700'
                            }`}
                          >
                            <div>{routine.time}</div>
                            <div className="text-[10px] font-normal opacity-75">{routine.duration} min</div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium flex items-center gap-1 ${catObj.color}`}>
                                <IconComp className="w-3 h-3" />
                                {catObj.label}
                              </span>
                              {routine.reminder && (
                                <span className="text-[11px] text-amber-400 flex items-center gap-1">
                                  <Bell className="w-3 h-3" /> Reminder Active
                                </span>
                              )}
                            </div>
                            <h3 className={`text-base font-bold ${isDone ? 'line-through opacity-60' : ''}`}>
                              {routine.title}
                            </h3>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-800/50">
                          <button
                            onClick={() => toggleRoutineCompletion(routine.id, TODAY_KEY)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                              isDone
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/20'
                            }`}
                          >
                            <Check className="w-4 h-4 stroke-[2.5]" />
                            <span>{isDone ? 'Completed' : 'Complete (+15 XP)'}</span>
                          </button>
                          <button
                            onClick={() => {
                              setEditingRoutine(routine);
                              setRoutineForm({
                                title: routine.title,
                                time: routine.time,
                                duration: routine.duration,
                                category: routine.category,
                                reminder: routine.reminder
                              });
                              setQuickAddType('routine');
                              setQuickAddModalOpen(true);
                            }}
                            className="p-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                            title="Edit Routine"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRoutine(routine.id)}
                            className="p-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition"
                            title="Delete Routine"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 4. DISTRACTION-FREE FOCUS MODE & POMODORO TIMER           */}
            {/* ========================================================= */}
            {activeTab === 'focus' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Focus Timer Chamber (7 cols) */}
                <div
                  className={`lg:col-span-7 p-6 sm:p-8 rounded-3xl border flex flex-col items-center justify-between relative overflow-hidden ${
                    isDark
                      ? 'bg-gradient-to-b from-zinc-900/90 via-[#0D0E17] to-indigo-950/30 border-zinc-800/90'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  {/* Preset Mode Buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-2 w-full z-10">
                    {[
                      { id: 'pomodoro', label: 'Pomodoro (25m)', mins: 25 },
                      { id: 'deep', label: 'Deep Work (50m)', mins: 50 },
                      { id: 'shortBreak', label: 'Short Break (5m)', mins: 5 },
                      { id: 'longBreak', label: 'Long Break (15m)', mins: 15 },
                      { id: 'custom', label: `Custom (${customMinutes}m)`, mins: customMinutes }
                    ].map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => selectFocusPreset(preset.id, preset.mins)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                          focusPreset === preset.id
                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25'
                            : isDark
                            ? 'bg-zinc-800/80 text-zinc-400 hover:text-white'
                            : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Minutes Slider if Custom is selected */}
                  {focusPreset === 'custom' && !isTimerRunning && (
                    <div className="mt-4 flex items-center gap-3 w-full max-w-xs">
                      <span className="text-xs text-zinc-400">Duration:</span>
                      <input
                        type="range"
                        min="5"
                        max="120"
                        step="5"
                        value={customMinutes}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCustomMinutes(val);
                          setTotalFocusSeconds(val * 60);
                          setTimeLeft(val * 60);
                        }}
                        className="flex-1 accent-violet-500"
                      />
                      <span className="text-xs font-mono font-bold text-violet-400">{customMinutes}m</span>
                    </div>
                  )}

                  {/* Circular SVG Timer Display */}
                  <div className="my-8 relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 240 240">
                      <circle
                        cx="120"
                        cy="120"
                        r="104"
                        fill="none"
                        stroke={isDark ? '#18181b' : '#f1f5f9'}
                        strokeWidth="10"
                      />
                      <circle
                        cx="120"
                        cy="120"
                        r="104"
                        fill="none"
                        stroke="url(#timerGrad)"
                        strokeWidth="10"
                        strokeDasharray={2 * Math.PI * 104}
                        strokeDashoffset={
                          2 * Math.PI * 104 * (1 - timeLeft / Math.max(1, totalFocusSeconds))
                        }
                        strokeLinecap="round"
                        className="transition-all duration-700"
                      />
                      <defs>
                        <linearGradient id="timerGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#38bdf8" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                      <span className="text-xs font-semibold uppercase tracking-widest text-violet-400">
                        {isTimerRunning ? 'Locked In' : 'Ready'}
                      </span>
                      <div className="text-5xl sm:text-6xl font-mono font-extrabold tracking-tight my-1">
                        {formatTimer(timeLeft)}
                      </div>
                      <p className={`text-xs truncate max-w-[180px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        {linkedTaskTitle}
                      </p>
                    </div>
                  </div>

                  {/* Linked Task Selector & Controls */}
                  <div className="w-full max-w-md space-y-4 z-10">
                    <div>
                      <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                        Focus Target / Linked Objective:
                      </label>
                      <input
                        type="text"
                        value={linkedTaskTitle}
                        onChange={(e) => setLinkedTaskTitle(e.target.value)}
                        placeholder="What are you focusing on right now?"
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition ${
                          isDark
                            ? 'bg-zinc-900 border-zinc-800 focus:border-violet-500 text-white'
                            : 'bg-slate-50 border-slate-300 focus:border-violet-500 text-slate-900'
                        }`}
                      />
                    </div>

                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => setIsTimerRunning((prev) => !prev)}
                        className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-violet-600/25 transition"
                      >
                        {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                        <span>{isTimerRunning ? 'Pause Session' : 'Start Focus Session'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsTimerRunning(false);
                          setTimeLeft(totalFocusSeconds);
                        }}
                        className={`p-3.5 rounded-2xl border transition ${
                          isDark
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                            : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                        }`}
                        title="Reset Timer"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </button>

                      <button
                        onClick={toggleAmbientAudio}
                        className={`p-3.5 rounded-2xl border transition ${
                          ambientSoundOn
                            ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                            : isDark
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                            : 'bg-slate-100 border-slate-200 text-slate-600'
                        }`}
                        title="Toggle Zen Focus Audio"
                      >
                        {ambientSoundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Focus Session History & Stats (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                  <div
                    className={`p-6 rounded-3xl border ${
                      isDark ? 'bg-zinc-900/60 border-zinc-800/90' : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <h3 className="text-base font-bold mb-1">Daily Focus Statistics</h3>
                    <p className={`text-xs mb-4 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      Earn +10 XP for every 5 minutes of completed deep focus.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                        <span className="text-xs text-zinc-400">Today's Focus</span>
                        <p className="text-2xl font-bold text-indigo-400 mt-1">{metrics.focusMinutesToday}m</p>
                      </div>
                      <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                        <span className="text-xs text-zinc-400">Total Sessions</span>
                        <p className="text-2xl font-bold text-violet-400 mt-1">{appData.focusSessions.length}</p>
                      </div>
                    </div>

                    <button
                      onClick={handleCompleteFocusSession}
                      className="mt-4 w-full py-2.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition"
                    >
                      + Log Current Focus Block Immediately
                    </button>
                  </div>

                  {/* Session History Log */}
                  <div
                    className={`p-6 rounded-3xl border ${
                      isDark ? 'bg-zinc-900/60 border-zinc-800/90' : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <h3 className="text-base font-bold mb-3">Recent Focus Log</h3>
                    <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                      {appData.focusSessions.map((session) => (
                        <div
                          key={session.id}
                          className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                            isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{session.taskTitle}</p>
                            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                              {session.mode} • {session.date} at {session.timestamp}
                            </p>
                          </div>
                          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-400 shrink-0">
                            {session.duration} min
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 5. PROFILE, GAMIFICATION, ANALYTICS & SETTINGS            */}
            {/* ========================================================= */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Profile Hero Card */}
                <div
                  className={`p-6 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
                    isDark
                      ? 'bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-violet-950/40 border-zinc-800'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-3xl shadow-xl shadow-violet-600/25">
                      {appData.profile.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-bold">{appData.profile.name}</h2>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                          {metrics.rank.badge} Level {metrics.level} • {metrics.rank.title}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        {appData.profile.bio}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs font-mono text-violet-400">
                        <span>Total XP: {appData.xp}</span>
                        <span>•</span>
                        <span>Streak: {metrics.masterStreak} Days</span>
                      </div>
                    </div>
                  </div>

                  {/* Sub-navigation Pills */}
                  <div className="flex items-center gap-2 self-stretch md:self-auto">
                    {[
                      { id: 'gamification', label: t.gamification, icon: Trophy },
                      { id: 'analytics', label: t.analytics, icon: BarChart2 },
                      { id: 'settings', label: t.settings, icon: Settings }
                    ].map((tab) => {
                      const IconComp = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setProfileSubTab(tab.id)}
                          className={`flex-1 md:flex-initial px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
                            profileSubTab === tab.id
                              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                              : isDark
                              ? 'bg-zinc-800/80 text-zinc-400 hover:text-white'
                              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <IconComp className="w-4 h-4" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SUB-TAB 1: GAMIFICATION, CHALLENGES & LEADERBOARD */}
                {profileSubTab === 'gamification' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Active Challenges (7 cols) */}
                    <div
                      className={`lg:col-span-7 p-6 rounded-3xl border space-y-4 ${
                        isDark ? 'bg-zinc-900/60 border-zinc-800/90' : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <div>
                        <h3 className="text-base font-bold">Daily & Weekly Discipline Quests</h3>
                        <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                          Complete real milestones to claim bonus XP and elevate your rank.
                        </p>
                      </div>

                      <div className="space-y-3">
                        {challenges.map((ch) => {
                          const isCompleted = ch.progress >= ch.target;
                          const isClaimed = appData.claimedChallenges?.includes(ch.id);
                          const pct = Math.min(100, Math.round((ch.progress / ch.target) * 100));

                          return (
                            <div
                              key={ch.id}
                              className={`p-4 rounded-2xl border ${
                                isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-400">
                                      {ch.type}
                                    </span>
                                    <h4 className="text-sm font-bold">{ch.title}</h4>
                                  </div>
                                  <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                                    {ch.desc}
                                  </p>
                                </div>

                                {isClaimed ? (
                                  <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                                    Claimed ✓
                                  </span>
                                ) : isCompleted ? (
                                  <button
                                    onClick={() => claimChallengeReward(ch)}
                                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-md shadow-amber-500/20 shrink-0 animate-pulse"
                                  >
                                    Claim +{ch.xpReward} XP
                                  </button>
                                ) : (
                                  <span className="text-xs font-mono text-violet-400 shrink-0">
                                    +{ch.xpReward} XP
                                  </span>
                                )}
                              </div>

                              <div className="mt-3">
                                <div className="flex justify-between text-[11px] mb-1">
                                  <span className="text-zinc-400">Progress</span>
                                  <span className="font-mono">
                                    {ch.progress} / {ch.target} ({pct}%)
                                  </span>
                                </div>
                                <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-slate-200'}`}>
                                  <div
                                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Optional Discipline Leaderboard (5 cols) */}
                    <div
                      className={`lg:col-span-5 p-6 rounded-3xl border flex flex-col justify-between ${
                        isDark ? 'bg-zinc-900/60 border-zinc-800/90' : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-base font-bold">Discipline Vanguard Board</h3>
                            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                              Global consistency rankings
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              persistAppData((prev) => ({
                                ...prev,
                                profile: {
                                  ...prev.profile,
                                  leaderboardOptIn: !prev.profile.leaderboardOptIn
                                }
                              }))
                            }
                            className="text-xs text-violet-400 hover:underline flex items-center gap-1"
                          >
                            {appData.profile.leaderboardOptIn ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5" /> Hide Board
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" /> Enable Board
                              </>
                            )}
                          </button>
                        </div>

                        {appData.profile.leaderboardOptIn ? (
                          <div className="space-y-2.5">
                            {[
                              { name: 'Elena Vance', xp: 1420, streak: 19, avatar: '⚡', isUser: false },
                              { name: 'Marcus Sterling', xp: 980, streak: 14, avatar: '🔥', isUser: false },
                              {
                                name: `${appData.profile.name} (You)`,
                                xp: appData.xp,
                                streak: metrics.masterStreak,
                                avatar: appData.profile.avatar,
                                isUser: true
                              },
                              { name: 'Kenji Takahashi', xp: 590, streak: 6, avatar: '🗡️', isUser: false },
                              { name: 'Aria Montgomery', xp: 440, streak: 5, avatar: '🌌', isUser: false }
                            ]
                              .sort((a, b) => b.xp - a.xp)
                              .map((entry, idx) => (
                                <div
                                  key={entry.name}
                                  className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                                    entry.isUser
                                      ? 'bg-violet-600/15 border-violet-500/40'
                                      : isDark
                                      ? 'bg-zinc-900/90 border-zinc-800'
                                      : 'bg-slate-50 border-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="w-5 text-xs font-mono font-bold text-zinc-400">
                                      #{idx + 1}
                                    </span>
                                    <span className="text-lg">{entry.avatar}</span>
                                    <div>
                                      <p className="text-sm font-semibold">{entry.name}</p>
                                      <p className="text-[11px] text-amber-400">🔥 {entry.streak}d streak</p>
                                    </div>
                                  </div>
                                  <span className="text-xs font-mono font-bold text-violet-400">
                                    {entry.xp} XP
                                  </span>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="py-12 text-center space-y-2">
                            <Lock className="w-8 h-8 text-zinc-500 mx-auto" />
                            <p className="text-sm font-semibold">Leaderboard Disabled</p>
                            <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                              You have chosen private solo focus mode. Enable anytime above to compare progress.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB-TAB 2: PROGRESS ANALYTICS */}
                {profileSubTab === 'analytics' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold">Deep Performance & Consistency Analytics</h3>
                        <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                          Visualizing your discipline trajectory and focus hours over time
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {[
                          { id: '7d', label: 'Last 7 Days' },
                          { id: '30d', label: 'Last 30 Days' }
                        ].map((r) => (
                          <button
                            key={r.id}
                            onClick={() => setAnalyticsRange(r.id)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                              analyticsRange === r.id
                                ? 'bg-violet-600 text-white'
                                : isDark
                                ? 'bg-zinc-900 border border-zinc-800 text-zinc-400'
                                : 'bg-white border border-slate-200 text-slate-600'
                            }`}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Chart 1: Discipline Score Trajectory */}
                      <div
                        className={`p-6 rounded-3xl border ${
                          isDark ? 'bg-zinc-900/60 border-zinc-800/90' : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        <h4 className="text-sm font-bold mb-4">
                          Discipline Score Performance ({analyticsRange === '7d' ? '7 Days' : '30 Days'})
                        </h4>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={analyticsRange === '7d' ? metrics.weeklyData : metrics.monthlyData}
                              margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient id="analyticGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5} />
                                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272a' : '#e2e8f0'} />
                              <XAxis
                                dataKey={analyticsRange === '7d' ? 'day' : 'label'}
                                stroke={isDark ? '#71717a' : '#64748b'}
                                fontSize={11}
                              />
                              <YAxis domain={[0, 100]} stroke={isDark ? '#71717a' : '#64748b'} fontSize={11} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: isDark ? '#18181b' : '#ffffff',
                                  borderColor: isDark ? '#27272a' : '#e2e8f0',
                                  borderRadius: '12px',
                                  fontSize: '12px'
                                }}
                              />
                              <Area
                                type="monotone"
                                dataKey="score"
                                name="Discipline Score"
                                stroke="#8b5cf6"
                                strokeWidth={2.5}
                                fill="url(#analyticGrad)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Chart 2: Daily Focus Minutes Bar Chart */}
                      <div
                        className={`p-6 rounded-3xl border ${
                          isDark ? 'bg-zinc-900/60 border-zinc-800/90' : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        <h4 className="text-sm font-bold mb-4">
                          Deep Focus Minutes Logged ({analyticsRange === '7d' ? '7 Days' : '30 Days'})
                        </h4>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={analyticsRange === '7d' ? metrics.weeklyData : metrics.monthlyData}
                              margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272a' : '#e2e8f0'} />
                              <XAxis
                                dataKey={analyticsRange === '7d' ? 'day' : 'label'}
                                stroke={isDark ? '#71717a' : '#64748b'}
                                fontSize={11}
                              />
                              <YAxis stroke={isDark ? '#71717a' : '#64748b'} fontSize={11} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: isDark ? '#18181b' : '#ffffff',
                                  borderColor: isDark ? '#27272a' : '#e2e8f0',
                                  borderRadius: '12px',
                                  fontSize: '12px'
                                }}
                              />
                              <Bar dataKey="focusMinutes" name="Focus Minutes" fill="#6366f1" radius={[6, 6, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB-TAB 3: SETTINGS, NOTIFICATIONS & DATA BACKUP */}
                {profileSubTab === 'settings' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Profile & Goals Configuration (7 cols) */}
                    <div
                      className={`lg:col-span-7 p-6 rounded-3xl border space-y-5 ${
                        isDark ? 'bg-zinc-900/60 border-zinc-800/90' : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <h3 className="text-base font-bold">Identity, Schedule & Daily Goals</h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-400 mb-1">Display Name</label>
                          <input
                            type="text"
                            value={appData.profile.name}
                            onChange={(e) =>
                              persistAppData((prev) => ({
                                ...prev,
                                profile: { ...prev.profile, name: e.target.value }
                              }))
                            }
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                              isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-slate-50 border-slate-300'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-zinc-400 mb-1">Avatar Badge</label>
                          <div className="flex items-center gap-2">
                            {['🛡️', '⚡', '🔥', '👑', '🌌', '🗡️'].map((av) => (
                              <button
                                key={av}
                                type="button"
                                onClick={() =>
                                  persistAppData((prev) => ({
                                    ...prev,
                                    profile: { ...prev.profile, avatar: av }
                                  }))
                                }
                                className={`w-10 h-10 rounded-xl border text-lg flex items-center justify-center transition ${
                                  appData.profile.avatar === av
                                    ? 'border-violet-500 bg-violet-500/20'
                                    : isDark
                                    ? 'border-zinc-800 bg-zinc-900'
                                    : 'border-slate-200 bg-slate-100'
                                }`}
                              >
                                {av}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-zinc-400 mb-1">Target Wake-Up Time</label>
                          <input
                            type="time"
                            value={appData.profile.wakeTime}
                            onChange={(e) =>
                              persistAppData((prev) => ({
                                ...prev,
                                profile: { ...prev.profile, wakeTime: e.target.value }
                              }))
                            }
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                              isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-slate-50 border-slate-300'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-zinc-400 mb-1">Target Sleep Time</label>
                          <input
                            type="time"
                            value={appData.profile.sleepTime}
                            onChange={(e) =>
                              persistAppData((prev) => ({
                                ...prev,
                                profile: { ...prev.profile, sleepTime: e.target.value }
                              }))
                            }
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                              isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-slate-50 border-slate-300'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-zinc-400 mb-1">
                            Daily Deep Focus Goal (Minutes)
                          </label>
                          <input
                            type="number"
                            min="15"
                            max="480"
                            value={appData.profile.dailyFocusGoal}
                            onChange={(e) =>
                              persistAppData((prev) => ({
                                ...prev,
                                profile: { ...prev.profile, dailyFocusGoal: Number(e.target.value) || 60 }
                              }))
                            }
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                              isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-slate-50 border-slate-300'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-zinc-400 mb-1">Interface Language</label>
                          <select
                            value={appData.profile.language}
                            onChange={(e) =>
                              persistAppData((prev) => ({
                                ...prev,
                                profile: { ...prev.profile, language: e.target.value }
                              }))
                            }
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                              isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-slate-50 border-slate-300'
                            }`}
                          >
                            <option value="en">English (US)</option>
                            <option value="es">Español</option>
                            <option value="fr">Français</option>
                            <option value="de">Deutsch</option>
                            <option value="bn">বাংলা (Bengali)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Notifications, Theme & Backup Management (5 cols) */}
                    <div className="lg:col-span-5 space-y-6">
                      <div
                        className={`p-6 rounded-3xl border space-y-4 ${
                          isDark ? 'bg-zinc-900/60 border-zinc-800/90' : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        <h3 className="text-base font-bold">Notifications & Appearance</h3>

                        {/* Theme Switch */}
                        <div className="flex items-center justify-between py-2">
                          <div>
                            <p className="text-sm font-semibold">Color Theme</p>
                            <p className="text-xs text-zinc-400">Obsidian Dark vs Minimal Light</p>
                          </div>
                          <button
                            onClick={() =>
                              persistAppData((prev) => ({
                                ...prev,
                                profile: { ...prev.profile, theme: isDark ? 'light' : 'dark' }
                              }))
                            }
                            className="px-3.5 py-2 rounded-xl border border-violet-500/30 bg-violet-500/15 text-violet-300 text-xs font-semibold flex items-center gap-2"
                          >
                            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            <span>{isDark ? 'Switch to Light' : 'Switch to Dark'}</span>
                          </button>
                        </div>

                        {/* Notification Toggles */}
                        {[
                          { key: 'habits', label: 'Daily Habit Reminders' },
                          { key: 'routines', label: 'Routine Block Alerts' },
                          { key: 'sleep', label: 'Sleep & Wake-up Schedule' }
                        ].map((item) => {
                          const enabled = appData.profile.notifications?.[item.key] ?? true;
                          return (
                            <div key={item.key} className="flex items-center justify-between py-1.5">
                              <span className="text-sm">{item.label}</span>
                              <button
                                onClick={() => {
                                  persistAppData((prev) => ({
                                    ...prev,
                                    profile: {
                                      ...prev.profile,
                                      notifications: {
                                        ...(prev.profile.notifications || {}),
                                        [item.key]: !enabled
                                      }
                                    }
                                  }));
                                  showToast('Notification Updated', `${item.label} ${!enabled ? 'enabled' : 'muted'}.`, 'info');
                                }}
                                className={`w-11 h-6 rounded-full transition-colors p-0.5 ${
                                  enabled ? 'bg-violet-600' : isDark ? 'bg-zinc-800' : 'bg-slate-300'
                                }`}
                              >
                                <div
                                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                                    enabled ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Data Export / Import / Reset */}
                      <div
                        className={`p-6 rounded-3xl border space-y-3 ${
                          isDark ? 'bg-zinc-900/60 border-zinc-800/90' : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        <h3 className="text-base font-bold">Data Management & Backup</h3>
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            onClick={handleExportData}
                            className="py-2.5 px-3 rounded-xl border border-zinc-700 hover:border-violet-500 text-xs font-semibold flex items-center justify-center gap-2 transition"
                          >
                            <Download className="w-4 h-4 text-violet-400" />
                            <span>Export JSON</span>
                          </button>

                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="py-2.5 px-3 rounded-xl border border-zinc-700 hover:border-violet-500 text-xs font-semibold flex items-center justify-center gap-2 transition"
                          >
                            <Upload className="w-4 h-4 text-indigo-400" />
                            <span>Import Backup</span>
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleImportData}
                            className="hidden"
                          />
                        </div>

                        <button
                          onClick={handleResetDemoData}
                          className="w-full py-2.5 px-3 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center justify-center gap-2 transition"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Reset Demo Data to Default</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav
        className={`md:hidden fixed bottom-0 inset-x-0 z-40 border-t backdrop-blur-xl px-2 py-2 flex items-center justify-around ${
          isDark ? 'bg-[#090A0F]/95 border-zinc-800' : 'bg-white/95 border-slate-200'
        }`}
      >
        {[
          { id: 'home', label: t.home, icon: Home },
          { id: 'habits', label: t.habits, icon: CheckSquare },
          { id: 'routine', label: t.routine, icon: CalendarIcon },
          { id: 'focus', label: t.focus, icon: Clock },
          { id: 'profile', label: t.profile, icon: User }
        ].map((item) => {
          const IconComp = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition ${
                active ? 'text-violet-400 font-semibold' : isDark ? 'text-zinc-500' : 'text-slate-500'
              }`}
            >
              <IconComp className="w-5 h-5" />
              <span className="text-[10px] mt-1">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ========================================================= */}
      {/* MODAL: CREATE / EDIT HABIT OR ROUTINE                     */}
      {/* ========================================================= */}
      {quickAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div
            className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuickAddType('habit')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    quickAddType === 'habit'
                      ? 'bg-violet-600 text-white'
                      : isDark
                      ? 'bg-zinc-800 text-zinc-400'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {editingHabit ? 'Edit Habit' : 'New Habit'}
                </button>
                <button
                  type="button"
                  onClick={() => setQuickAddType('routine')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    quickAddType === 'routine'
                      ? 'bg-violet-600 text-white'
                      : isDark
                      ? 'bg-zinc-800 text-zinc-400'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {editingRoutine ? 'Edit Routine' : 'New Routine Block'}
                </button>
              </div>
              <button
                onClick={() => setQuickAddModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {quickAddType === 'habit' ? (
              <form onSubmit={handleSaveHabit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Habit Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 30 Mins Strength Training"
                    value={habitForm.name}
                    onChange={(e) => setHabitForm({ ...habitForm, name: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                      isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Category</label>
                    <select
                      value={habitForm.category}
                      onChange={(e) => setHabitForm({ ...habitForm, category: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                        isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-slate-50 border-slate-300'
                      }`}
                    >
                      <option value="Health">Health & Fitness</option>
                      <option value="Wisdom">Reading & Wisdom</option>
                      <option value="Career">Skill & Career</option>
                      <option value="Mind">Mindfulness & Stoicism</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Target Days / Week</label>
                    <select
                      value={habitForm.targetDaysPerWeek}
                      onChange={(e) =>
                        setHabitForm({
                          ...habitForm,
                          targetDaysPerWeek: Number(e.target.value),
                          frequency: Number(e.target.value) === 7 ? 'daily' : 'weekly'
                        })
                      }
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                        isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-slate-50 border-slate-300'
                      }`}
                    >
                      {[7, 6, 5, 4, 3, 2, 1].map((d) => (
                        <option key={d} value={d}>
                          {d} days / week {d === 7 ? '(Daily)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Select Icon & Accent</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {['Dumbbell', 'BookOpen', 'Brain', 'Code', 'Heart', 'Shield', 'Zap', 'Target'].map((ic) => {
                      const Ico = ICON_MAP[ic];
                      return (
                        <button
                          key={ic}
                          type="button"
                          onClick={() => setHabitForm({ ...habitForm, icon: ic })}
                          className={`p-2.5 rounded-xl border transition ${
                            habitForm.icon === ic
                              ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                              : isDark
                              ? 'border-zinc-800 bg-zinc-950 text-zinc-400'
                              : 'border-slate-200 bg-slate-50 text-slate-600'
                          }`}
                        >
                          <Ico className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-violet-600/25"
                >
                  {editingHabit ? 'Save Habit Changes' : 'Forge Habit'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSaveRoutine} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Activity Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Deep Work: System Design"
                    value={routineForm.title}
                    onChange={(e) => setRoutineForm({ ...routineForm, title: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                      isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Scheduled Time</label>
                    <input
                      type="time"
                      required
                      value={routineForm.time}
                      onChange={(e) => setRoutineForm({ ...routineForm, time: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                        isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-slate-50 border-slate-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Duration (Mins)</label>
                    <input
                      type="number"
                      min="5"
                      max="600"
                      value={routineForm.duration}
                      onChange={(e) => setRoutineForm({ ...routineForm, duration: Number(e.target.value) })}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                        isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-slate-50 border-slate-300'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Routine Category</label>
                  <select
                    value={routineForm.category}
                    onChange={(e) => setRoutineForm({ ...routineForm, category: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                      isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    {ROUTINE_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-violet-600/25"
                >
                  {editingRoutine ? 'Update Routine Block' : 'Add to Daily Schedule'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}