import { useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { 
  Todo, 
  Subtask, 
  Priority, 
  Status, 
  SortOption, 
  FilterOption,
} from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { 
  isToday, 
  isThisWeek, 
  isPast, 
  startOfDay,
  compareAsc,
  compareDesc 
} from 'date-fns';

// Initial dummy data to make the app feel alive on first load
const INITIAL_TODOS: Todo[] = [
  {
    id: uuidv4(),
    title: 'Plan your perfect day',
    description: 'Review today’s priorities and block focused time for deep work.',
    priority: 'high',
    status: 'pending',
    category: 'personal',
    tags: ['focus', 'important'],
    subtasks: [],
    dueDate: new Date(),
    reminderDate: null,
    isRecurring: false,
    recurringPattern: null,
    estimatedMinutes: 20,
    actualMinutes: null,
    pomodorosCompleted: 0,
    attachments: [],
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
    order: 0,
    isFavorite: true,
  },
  {
    id: uuidv4(),
    title: 'Finish UI polish for FlowState',
    description: 'Tighten spacing, hover states and animations on header and sidebar.',
    priority: 'critical',
    status: 'in_progress',
    category: 'work',
    tags: ['urgent', 'focus'],
    subtasks: [],
    dueDate: new Date(new Date().setHours(new Date().getHours() + 3)),
    reminderDate: null,
    isRecurring: false,
    recurringPattern: null,
    estimatedMinutes: 90,
    actualMinutes: null,
    pomodorosCompleted: 1,
    attachments: [],
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
    order: 1,
    isFavorite: true,
  },
  {
    id: uuidv4(),
    title: 'Deep work: Learn advanced TypeScript',
    description: 'Watch one high‑quality talk and take brief notes.',
    priority: 'medium',
    status: 'pending',
    category: 'learning',
    tags: ['focus', 'creative'],
    subtasks: [],
    dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    reminderDate: null,
    isRecurring: true,
    recurringPattern: {
      frequency: 'daily',
      interval: 1,
    },
    estimatedMinutes: 45,
    actualMinutes: null,
    pomodorosCompleted: 0,
    attachments: [],
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
    order: 2,
    isFavorite: false,
  },
  {
    id: uuidv4(),
    title: 'Move body: 20‑minute walk',
    description: 'Quick walk outside to reset your brain and boost energy.',
    priority: 'low',
    status: 'pending',
    category: 'health',
    tags: ['quick'],
    subtasks: [],
    dueDate: new Date(new Date().setHours(20, 0, 0, 0)),
    reminderDate: null,
    isRecurring: true,
    recurringPattern: {
      frequency: 'daily',
      interval: 1,
    },
    estimatedMinutes: 20,
    actualMinutes: null,
    pomodorosCompleted: 0,
    attachments: [],
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
    order: 3,
    isFavorite: false,
  },
  {
    id: uuidv4(),
    title: 'Inbox zero: clean your workspace',
    description: 'Tidy desk, close unused tabs, and clear quick notifications.',
    priority: 'medium',
    status: 'completed',
    category: 'home',
    tags: ['quick'],
    subtasks: [],
    dueDate: new Date(),
    reminderDate: null,
    isRecurring: false,
    recurringPattern: null,
    estimatedMinutes: 10,
    actualMinutes: 8,
    pomodorosCompleted: 0,
    attachments: [],
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: new Date(),
    order: 4,
    isFavorite: false,
  },
];

interface UseTodosReturn {
  todos: Todo[];
  addTodo: (todo: Partial<Todo>) => Todo;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  deleteTodo: (id: string) => void;
  toggleComplete: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addSubtask: (todoId: string, title: string) => void;
  toggleSubtask: (todoId: string, subtaskId: string) => void;
  deleteSubtask: (todoId: string, subtaskId: string) => void;
  reorderTodos: (startIndex: number, endIndex: number) => void;
  duplicateTodo: (id: string) => Todo | null;
  archiveTodo: (id: string) => void;
  bulkDelete: (ids: string[]) => void;
  bulkComplete: (ids: string[]) => void;
  bulkArchive: (ids: string[]) => void;
  clearCompleted: () => void;
  getFilteredTodos: (filter: FilterOption, categoryId: string | null, tagIds: string[], searchQuery: string) => Todo[];
  getSortedTodos: (todos: Todo[], sortOption: SortOption) => Todo[];
  getTodosByStatus: (status: Status) => Todo[];
  getTodoStats: () => { total: number; completed: number; pending: number; overdue: number };
}

export function useTodos(): UseTodosReturn {
  const [todos, setTodos] = useLocalStorage<Todo[]>('flowstate-todos', INITIAL_TODOS);

  const addTodo = useCallback((todoData: Partial<Todo>): Todo => {
    const newTodo: Todo = {
      id: uuidv4(),
      title: todoData.title || 'Untitled Task',
      description: todoData.description || '',
      priority: todoData.priority || DEFAULT_SETTINGS.defaultPriority,
      status: 'pending',
      category: todoData.category || null,
      tags: todoData.tags || [],
      subtasks: todoData.subtasks || [],
      dueDate: todoData.dueDate || null,
      reminderDate: todoData.reminderDate || null,
      isRecurring: todoData.isRecurring || false,
      recurringPattern: todoData.recurringPattern || null,
      estimatedMinutes: todoData.estimatedMinutes || null,
      actualMinutes: null,
      pomodorosCompleted: 0,
      attachments: todoData.attachments || [],
      notes: todoData.notes || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
      order: todos.length,
      isFavorite: todoData.isFavorite || false,
    };

    setTodos(prev => [newTodo, ...prev]);
    return newTodo;
  }, [todos.length, setTodos]);

  const updateTodo = useCallback((id: string, updates: Partial<Todo>) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id 
        ? { ...todo, ...updates, updatedAt: new Date() }
        : todo
    ));
  }, [setTodos]);

  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  }, [setTodos]);

  const toggleComplete = useCallback((id: string) => {
    setTodos(prev => prev.map(todo => {
      if (todo.id === id) {
        const isCompleting = todo.status !== 'completed';
        return {
          ...todo,
          status: isCompleting ? 'completed' : 'pending',
          completedAt: isCompleting ? new Date() : null,
          updatedAt: new Date(),
        };
      }
      return todo;
    }));
  }, [setTodos]);

  const toggleFavorite = useCallback((id: string) => {
    setTodos(prev => prev.map(todo =>
      todo.id === id
        ? { ...todo, isFavorite: !todo.isFavorite, updatedAt: new Date() }
        : todo
    ));
  }, [setTodos]);

  const addSubtask = useCallback((todoId: string, title: string) => {
    const newSubtask: Subtask = {
      id: uuidv4(),
      title,
      completed: false,
      createdAt: new Date(),
    };

    setTodos(prev => prev.map(todo =>
      todo.id === todoId
        ? { ...todo, subtasks: [...todo.subtasks, newSubtask], updatedAt: new Date() }
        : todo
    ));
  }, [setTodos]);

  const toggleSubtask = useCallback((todoId: string, subtaskId: string) => {
    setTodos(prev => prev.map(todo => {
      if (todo.id === todoId) {
        return {
          ...todo,
          subtasks: todo.subtasks.map(st =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          ),
          updatedAt: new Date(),
        };
      }
      return todo;
    }));
  }, [setTodos]);

  const deleteSubtask = useCallback((todoId: string, subtaskId: string) => {
    setTodos(prev => prev.map(todo =>
      todo.id === todoId
        ? { 
            ...todo, 
            subtasks: todo.subtasks.filter(st => st.id !== subtaskId),
            updatedAt: new Date(),
          }
        : todo
    ));
  }, [setTodos]);

  const reorderTodos = useCallback((startIndex: number, endIndex: number) => {
    setTodos(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result.map((todo, index) => ({ ...todo, order: index }));
    });
  }, [setTodos]);

  const duplicateTodo = useCallback((id: string): Todo | null => {
    const original = todos.find(t => t.id === id);
    if (!original) return null;

    const duplicate: Todo = {
      ...original,
      id: uuidv4(),
      title: `${original.title} (Copy)`,
      status: 'pending',
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      order: todos.length,
      subtasks: original.subtasks.map(st => ({
        ...st,
        id: uuidv4(),
        completed: false,
      })),
    };

    setTodos(prev => [duplicate, ...prev]);
    return duplicate;
  }, [todos, setTodos]);

  const archiveTodo = useCallback((id: string) => {
    setTodos(prev => prev.map(todo =>
      todo.id === id
        ? { ...todo, status: 'archived' as Status, updatedAt: new Date() }
        : todo
    ));
  }, [setTodos]);

  const bulkDelete = useCallback((ids: string[]) => {
    setTodos(prev => prev.filter(todo => !ids.includes(todo.id)));
  }, [setTodos]);

  const bulkComplete = useCallback((ids: string[]) => {
    setTodos(prev => prev.map(todo =>
      ids.includes(todo.id)
        ? { ...todo, status: 'completed' as Status, completedAt: new Date(), updatedAt: new Date() }
        : todo
    ));
  }, [setTodos]);

  const bulkArchive = useCallback((ids: string[]) => {
    setTodos(prev => prev.map(todo =>
      ids.includes(todo.id)
        ? { ...todo, status: 'archived' as Status, updatedAt: new Date() }
        : todo
    ));
  }, [setTodos]);

  const clearCompleted = useCallback(() => {
    setTodos(prev => prev.filter(todo => todo.status !== 'completed'));
  }, [setTodos]);

  const getFilteredTodos = useCallback((
    filter: FilterOption,
    categoryId: string | null,
    tagIds: string[],
    searchQuery: string
  ): Todo[] => {
    return todos.filter(todo => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          todo.title.toLowerCase().includes(query) ||
          todo.description.toLowerCase().includes(query) ||
          todo.notes.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (categoryId && todo.category !== categoryId) return false;

      // Tags filter
      if (tagIds.length > 0 && !tagIds.some(tagId => todo.tags.includes(tagId))) return false;

      // Status filter
      switch (filter) {
        case 'today':
          return todo.status !== 'archived' && 
                 todo.status !== 'completed' &&
                 todo.dueDate && isToday(new Date(todo.dueDate));
        case 'week':
          return todo.status !== 'archived' && 
                 todo.status !== 'completed' &&
                 todo.dueDate && isThisWeek(new Date(todo.dueDate));
        case 'overdue':
          return todo.status !== 'archived' && 
                 todo.status !== 'completed' &&
                 todo.dueDate && isPast(startOfDay(new Date(todo.dueDate))) && 
                 !isToday(new Date(todo.dueDate));
        case 'completed':
          return todo.status === 'completed';
        case 'archived':
          return todo.status === 'archived';
        default:
          return todo.status !== 'archived';
      }
    });
  }, [todos]);

  const getSortedTodos = useCallback((todosToSort: Todo[], sortOption: SortOption): Todo[] => {
    const sorted = [...todosToSort];
    
    switch (sortOption) {
      case 'dueDate':
        return sorted.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return compareAsc(new Date(a.dueDate), new Date(b.dueDate));
        });
      case 'priority':
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      case 'createdAt':
        return sorted.sort((a, b) => 
          compareDesc(new Date(a.createdAt), new Date(b.createdAt))
        );
      case 'alphabetical':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'custom':
      default:
        return sorted.sort((a, b) => a.order - b.order);
    }
  }, []);

  const getTodosByStatus = useCallback((status: Status): Todo[] => {
    return todos.filter(todo => todo.status === status);
  }, [todos]);

  const getTodoStats = useMemo(() => () => {
    const total = todos.filter(t => t.status !== 'archived').length;
    const completed = todos.filter(t => t.status === 'completed').length;
    const pending = todos.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
    const overdue = todos.filter(t => 
      t.status !== 'completed' && 
      t.status !== 'archived' &&
      t.dueDate && 
      isPast(startOfDay(new Date(t.dueDate))) &&
      !isToday(new Date(t.dueDate))
    ).length;

    return { total, completed, pending, overdue };
  }, [todos]);

  return {
    todos,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleComplete,
    toggleFavorite,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    reorderTodos,
    duplicateTodo,
    archiveTodo,
    bulkDelete,
    bulkComplete,
    bulkArchive,
    clearCompleted,
    getFilteredTodos,
    getSortedTodos,
    getTodosByStatus,
    getTodoStats,
  };
}

export default useTodos;
