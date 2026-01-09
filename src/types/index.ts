// ============================================
// FLOWSTATE - Premium Todo Application Types
// ============================================

export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Status = 'pending' | 'in_progress' | 'completed' | 'archived';
export type ViewMode = 'list' | 'kanban' | 'calendar';
export type ThemeMode = 'light' | 'dark' | 'auto';
export type SortOption = 'dueDate' | 'priority' | 'createdAt' | 'alphabetical' | 'custom';
export type FilterOption = 'all' | 'today' | 'week' | 'overdue' | 'completed' | 'archived';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  todoCount?: number;
}

export interface Todo {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  category: string | null;
  tags: string[];
  subtasks: Subtask[];
  dueDate: Date | null;
  reminderDate: Date | null;
  isRecurring: boolean;
  recurringPattern: RecurringPattern | null;
  estimatedMinutes: number | null;
  actualMinutes: number | null;
  pomodorosCompleted: number;
  attachments: Attachment[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  order: number;
  isFavorite: boolean;
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[];
  endDate?: Date;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

export interface PomodoroSession {
  id: string;
  todoId: string | null;
  startTime: Date;
  endTime: Date | null;
  duration: number;
  type: 'work' | 'shortBreak' | 'longBreak';
  completed: boolean;
}

export interface UserStats {
  totalTasksCompleted: number;
  currentStreak: number;
  longestStreak: number;
  totalPomodorosCompleted: number;
  totalMinutesFocused: number;
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
  productivityScore: number;
  lastActiveDate: Date | null;
}

export interface DailyGoal {
  id: string;
  date: Date;
  targetTasks: number;
  completedTasks: number;
  targetPomodoros: number;
  completedPomodoros: number;
  targetMinutes: number;
  completedMinutes: number;
}

export interface AppSettings {
  theme: ThemeMode;
  defaultView: ViewMode;
  defaultPriority: Priority;
  pomodoroDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  pomodorosUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  showCompletedTasks: boolean;
  showSubtasks: boolean;
  dailyGoalTasks: number;
  weeklyGoalTasks: number;
}

export interface AppState {
  todos: Todo[];
  categories: Category[];
  tags: Tag[];
  settings: AppSettings;
  stats: UserStats;
  currentFilter: FilterOption;
  currentSort: SortOption;
  currentView: ViewMode;
  searchQuery: string;
  selectedCategory: string | null;
  selectedTags: string[];
  pomodoroSessions: PomodoroSession[];
  dailyGoals: DailyGoal[];
}

// Default values
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'personal', name: 'Personal', icon: '👤', color: '#6366f1' },
  { id: 'work', name: 'Work', icon: '💼', color: '#f59e0b' },
  { id: 'health', name: 'Health', icon: '🏃', color: '#10b981' },
  { id: 'learning', name: 'Learning', icon: '📚', color: '#8b5cf6' },
  { id: 'finance', name: 'Finance', icon: '💰', color: '#06b6d4' },
  { id: 'home', name: 'Home', icon: '🏠', color: '#f43f5e' },
];

export const DEFAULT_TAGS: Tag[] = [
  { id: 'urgent', name: 'Urgent', color: '#ef4444' },
  { id: 'important', name: 'Important', color: '#f59e0b' },
  { id: 'quick', name: 'Quick Win', color: '#10b981' },
  { id: 'focus', name: 'Deep Focus', color: '#6366f1' },
  { id: 'creative', name: 'Creative', color: '#ec4899' },
  { id: 'meeting', name: 'Meeting', color: '#8b5cf6' },
];

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  defaultView: 'list',
  defaultPriority: 'medium',
  pomodoroDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  pomodorosUntilLongBreak: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  soundEnabled: true,
  notificationsEnabled: true,
  showCompletedTasks: true,
  showSubtasks: true,
  dailyGoalTasks: 5,
  weeklyGoalTasks: 25,
};

export const DEFAULT_STATS: UserStats = {
  totalTasksCompleted: 0,
  currentStreak: 0,
  longestStreak: 0,
  totalPomodorosCompleted: 0,
  totalMinutesFocused: 0,
  tasksCompletedToday: 0,
  tasksCompletedThisWeek: 0,
  productivityScore: 0,
  lastActiveDate: null,
};

export const PRIORITY_CONFIG = {
  low: { label: 'Low', color: '#64748b', bgColor: '#f1f5f9', icon: '○' },
  medium: { label: 'Medium', color: '#f59e0b', bgColor: '#fef3c7', icon: '◐' },
  high: { label: 'High', color: '#f97316', bgColor: '#ffedd5', icon: '◕' },
  critical: { label: 'Critical', color: '#ef4444', bgColor: '#fee2e2', icon: '●' },
};

export const MOTIVATIONAL_QUOTES = [
  "The secret of getting ahead is getting started.",
  "Focus on being productive instead of busy.",
  "Small steps lead to big achievements.",
  "Your future is created by what you do today.",
  "Progress, not perfection.",
  "Every task completed is a victory.",
  "Stay focused, stay determined, stay unstoppable.",
  "Make each day your masterpiece.",
  "The only way to do great work is to love what you do.",
  "Believe you can and you're halfway there.",
];
