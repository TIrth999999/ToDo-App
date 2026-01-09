import React, { createContext, useContext, useCallback, useMemo, useEffect } from 'react';
import type { 
  AppSettings, 
  Category, 
  Tag, 
  ViewMode, 
  SortOption, 
  FilterOption,
  ThemeMode,
  UserStats,
} from '../types';
import { 
  DEFAULT_SETTINGS,
  DEFAULT_CATEGORIES,
  DEFAULT_TAGS,
  DEFAULT_STATS,
} from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { isToday, startOfDay, differenceInDays } from 'date-fns';

interface AppContextValue {
  // Settings
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  
  // Theme
  theme: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  
  // Categories
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  
  // Tags
  tags: Tag[];
  addTag: (tag: Omit<Tag, 'id'>) => void;
  updateTag: (id: string, updates: Partial<Tag>) => void;
  deleteTag: (id: string) => void;
  
  // View state
  currentView: ViewMode;
  setCurrentView: (view: ViewMode) => void;
  currentFilter: FilterOption;
  setCurrentFilter: (filter: FilterOption) => void;
  currentSort: SortOption;
  setCurrentSort: (sort: SortOption) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (id: string | null) => void;
  selectedTags: string[];
  setSelectedTags: (ids: string[]) => void;
  
  // Stats
  stats: UserStats;
  updateStats: (updates: Partial<UserStats>) => void;
  incrementTasksCompleted: () => void;
  
  // UI State
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  editingTodoId: string | null;
  setEditingTodoId: (id: string | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Settings
  const [settings, setSettings] = useLocalStorage<AppSettings>('flowstate-settings', DEFAULT_SETTINGS);
  
  // Categories & Tags
  const [categories, setCategories] = useLocalStorage<Category[]>('flowstate-categories', DEFAULT_CATEGORIES);
  const [tags, setTags] = useLocalStorage<Tag[]>('flowstate-tags', DEFAULT_TAGS);
  
  // View State
  const [currentView, setCurrentView] = useLocalStorage<ViewMode>('flowstate-view', 'list');
  const [currentFilter, setCurrentFilter] = useLocalStorage<FilterOption>('flowstate-filter', 'all');
  const [currentSort, setCurrentSort] = useLocalStorage<SortOption>('flowstate-sort', 'custom');
  const [searchQuery, setSearchQuery] = useLocalStorage<string>('flowstate-search', '');
  const [selectedCategory, setSelectedCategory] = useLocalStorage<string | null>('flowstate-selected-category', null);
  const [selectedTags, setSelectedTags] = useLocalStorage<string[]>('flowstate-selected-tags', []);
  
  // Stats
  const [stats, setStats] = useLocalStorage<UserStats>('flowstate-stats', DEFAULT_STATS);
  
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useLocalStorage<boolean>('flowstate-sidebar', true);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingTodoId, setEditingTodoId] = React.useState<string | null>(null);

  // Compute effective theme
  const effectiveTheme = useMemo((): 'light' | 'dark' => {
    if (settings.theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return settings.theme;
  }, [settings.theme]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    document.documentElement.style.colorScheme = effectiveTheme;
  }, [effectiveTheme]);

  // Check for streak updates
  useEffect(() => {
    const lastActiveDate = stats.lastActiveDate ? new Date(stats.lastActiveDate) : null;
    const today = startOfDay(new Date());
    
    if (lastActiveDate) {
      const daysDiff = differenceInDays(today, startOfDay(lastActiveDate));
      
      if (daysDiff > 1) {
        // Streak broken
        setStats(prev => ({ ...prev, currentStreak: 0, lastActiveDate: new Date() }));
      } else if (daysDiff === 1) {
        // New day, streak continues
        setStats(prev => ({ 
          ...prev, 
          lastActiveDate: new Date(),
          tasksCompletedToday: 0,
        }));
      }
    }
  }, [stats.lastActiveDate, setStats]);

  // Settings
  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, [setSettings]);

  const setTheme = useCallback((theme: ThemeMode) => {
    setSettings(prev => ({ ...prev, theme }));
  }, [setSettings]);

  // Categories
  const addCategory = useCallback((category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: crypto.randomUUID(),
    };
    setCategories(prev => [...prev, newCategory]);
  }, [setCategories]);

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(cat => 
      cat.id === id ? { ...cat, ...updates } : cat
    ));
  }, [setCategories]);

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));
  }, [setCategories]);

  // Tags
  const addTag = useCallback((tag: Omit<Tag, 'id'>) => {
    const newTag: Tag = {
      ...tag,
      id: crypto.randomUUID(),
    };
    setTags(prev => [...prev, newTag]);
  }, [setTags]);

  const updateTag = useCallback((id: string, updates: Partial<Tag>) => {
    setTags(prev => prev.map(tag => 
      tag.id === id ? { ...tag, ...updates } : tag
    ));
  }, [setTags]);

  const deleteTag = useCallback((id: string) => {
    setTags(prev => prev.filter(tag => tag.id !== id));
  }, [setTags]);

  // Stats
  const updateStats = useCallback((updates: Partial<UserStats>) => {
    setStats(prev => ({ ...prev, ...updates }));
  }, [setStats]);

  const incrementTasksCompleted = useCallback(() => {
    setStats(prev => {
      const lastActiveDate = prev.lastActiveDate ? new Date(prev.lastActiveDate) : null;
      const today = new Date();
      const isNewDay = !lastActiveDate || !isToday(lastActiveDate);
      
      const newCurrentStreak = isNewDay ? prev.currentStreak + 1 : prev.currentStreak;
      const newLongestStreak = Math.max(prev.longestStreak, newCurrentStreak);
      
      return {
        ...prev,
        totalTasksCompleted: prev.totalTasksCompleted + 1,
        tasksCompletedToday: isNewDay ? 1 : prev.tasksCompletedToday + 1,
        tasksCompletedThisWeek: prev.tasksCompletedThisWeek + 1,
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastActiveDate: today,
        productivityScore: Math.min(100, prev.productivityScore + 2),
      };
    });
  }, [setStats]);

  // UI
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, [setIsSidebarOpen]);

  const value = useMemo<AppContextValue>(() => ({
    settings,
    updateSettings,
    theme: settings.theme,
    effectiveTheme,
    setTheme,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    tags,
    addTag,
    updateTag,
    deleteTag,
    currentView,
    setCurrentView,
    currentFilter,
    setCurrentFilter,
    currentSort,
    setCurrentSort,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedTags,
    setSelectedTags,
    stats,
    updateStats,
    incrementTasksCompleted,
    isSidebarOpen,
    toggleSidebar,
    isAddModalOpen,
    setIsAddModalOpen,
    editingTodoId,
    setEditingTodoId,
  }), [
    settings,
    updateSettings,
    effectiveTheme,
    setTheme,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    tags,
    addTag,
    updateTag,
    deleteTag,
    currentView,
    setCurrentView,
    currentFilter,
    setCurrentFilter,
    currentSort,
    setCurrentSort,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedTags,
    setSelectedTags,
    stats,
    updateStats,
    incrementTasksCompleted,
    isSidebarOpen,
    toggleSidebar,
    isAddModalOpen,
    editingTodoId,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
