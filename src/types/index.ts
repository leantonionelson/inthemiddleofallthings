// User types
export interface User {
  id: string;
  email: string;
  displayName: string;
  isGuest: boolean;
  createdAt: Date;
  lastActive: Date;
}

// Symbol types
export interface Symbol {
  id: string;
  name: string;
  svg: string;
  meaning: string;
  tags: string[];
  createdAt: string;
  userId: string;
  evolutionHistory?: {
    timestamp: string;
    context: string;
    previousSvg?: string;
  }[];
}

export interface SymbolMetadata {
  evolvedFrom?: string;
  context: string;
  tags: string[];
  morphHistory: SymbolMorph[];
  complexity: number;
  density: number;
}

export interface SymbolMorph {
  timestamp: Date;
  trigger: string; // 'highlight', 'reflection', 'interaction'
  changes: string[];
}

// Content types
export interface BookChapter {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  part: string;
  chapterNumber: number;
  totalChapters: number;
  isRead?: boolean;
  lastPosition?: number;
  tags?: string[];
}

export interface BookContent {
  introduction: BookChapter;
  chapters: BookChapter[];
  outro: BookChapter;
}

export interface Meditation {
  id: string;
  title: string;
  content: string;
  tags: string[];
  filename: string;
  isRead?: boolean;
  lastPosition?: number;
}

export interface Story {
  id: string;
  title: string;
  content: string;
  tags: string[];
  filename: string;
  isRead?: boolean;
  lastPosition?: number;
}

export interface LearnModule {
  id: string;
  title: string;
  content: string;
  section: string;
  moduleNumber: number;
  totalModules: number;
  tags: string[];
  isRead?: boolean;
  lastPosition?: number;
}

export interface LearnSection {
  name: string;
  description: string;
  order: number;
}

export interface ReflectionEntry {
  id: string;
  title: string;
  content: string;
  symbol?: Symbol;
  createdAt: string;
  updatedAt: string;
  userId: string;
  highlightText?: string;
  chapterContext?: string;
}

// Settings types
export interface UserSettings {
  userId: string;
  darkMode: boolean | 'auto';
  notificationPreferences: NotificationPreferences;
  accessibilityPrefs: AccessibilityPreferences;
}

export interface NotificationPreferences {
  dailyReflections: boolean;
  symbolEvolution: boolean;
  newChapters: boolean;
}

export interface AccessibilityPreferences {
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  screenReader: boolean;
  reducedMotion: boolean;
}

// UI State types
export interface AppState {
  currentUser: User | null;
  isAuthenticated: boolean;
  darkMode: boolean;
  currentChapter: BookChapter | null;
  isLoading: boolean;
  error: string | null;
}

// Audio types
export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  isLiveAudio: boolean;
}

// Navigation types
export interface NavigationState {
  currentPage: string;
  showPersistentTriad: boolean;
}

// Highlight and reflection types
export interface TextHighlight {
  id: string;
  text: string;
  chapterId: string;
  chapterTitle: string;
  timestamp: Date;
  position: {
    start: number;
    end: number;
  };
  reflection?: ReflectionEntry;
}

// Routes
export enum AppRoute {
  HOME = '/',
  AUTH = '/auth',
  READ = '/read',
  READER = '/reader',
  MEDITATIONS = '/meditations',
  STORIES = '/stories',
  DO = '/do',
  LEARN = '/learn',
  SETTINGS = '/settings',
  SYMBOLS = '/symbols'
}

 