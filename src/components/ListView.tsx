import { memo, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpDown, 
  CheckCircle2, 
  Trash2,
  Archive,
  ChevronDown,
} from 'lucide-react';
import { TodoItem } from './TodoItem';
import { useApp } from '../context/AppContext';
import { useTodos } from '../hooks';
import type { SortOption } from '../types';

interface ListViewProps {
  onStartPomodoro: (todoId: string) => void;
}

function ListViewComponent({ onStartPomodoro }: ListViewProps) {
  const { 
    currentFilter, 
    currentSort, 
    setCurrentSort,
    selectedCategory,
    selectedTags,
    searchQuery,
    settings,
    categories,
  } = useApp();
  
  const { 
    getFilteredTodos, 
    getSortedTodos, 
    bulkComplete,
    bulkDelete,
    bulkArchive,
    clearCompleted,
    getTodoStats,
  } = useTodos();

  const [selectedTodos, setSelectedTodos] = useState<string[]>([]);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Get filtered and sorted todos
  const filteredTodos = useMemo(() => {
    return getFilteredTodos(currentFilter, selectedCategory, selectedTags, searchQuery);
  }, [currentFilter, selectedCategory, selectedTags, searchQuery, getFilteredTodos]);

  const sortedTodos = useMemo(() => {
    return getSortedTodos(filteredTodos, currentSort);
  }, [filteredTodos, currentSort, getSortedTodos]);

  // Separate completed and pending todos
  const { pendingTodos, completedTodos } = useMemo(() => {
    const pending = sortedTodos.filter(t => t.status !== 'completed');
    const completed = sortedTodos.filter(t => t.status === 'completed');
    return { pendingTodos: pending, completedTodos: completed };
  }, [sortedTodos]);

  const stats = getTodoStats();

  // Human‑readable label for current filter/category in the main view
  const filterLabel = useMemo(() => {
    let base: string;
    switch (currentFilter) {
      case 'today':
        base = 'Today';
        break;
      case 'week':
        base = 'This week';
        break;
      case 'overdue':
        base = 'Overdue';
        break;
      case 'completed':
        base = 'Completed tasks';
        break;
      case 'archived':
        base = 'Archived tasks';
        break;
      default:
        base = 'All tasks';
    }

    if (selectedCategory) {
      const cat = categories.find(c => c.id === selectedCategory);
      if (cat) {
        return `${cat.name} • ${base}`;
      }
    }

    return base;
  }, [currentFilter, selectedCategory, categories]);

  const handleBulkAction = useCallback((action: 'complete' | 'delete' | 'archive') => {
    switch (action) {
      case 'complete':
        bulkComplete(selectedTodos);
        break;
      case 'delete':
        bulkDelete(selectedTodos);
        break;
      case 'archive':
        bulkArchive(selectedTodos);
        break;
    }
    setSelectedTodos([]);
  }, [selectedTodos, bulkComplete, bulkDelete, bulkArchive]);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'custom', label: 'Custom Order' },
    { value: 'dueDate', label: 'Due Date' },
    { value: 'priority', label: 'Priority' },
    { value: 'createdAt', label: 'Created Date' },
    { value: 'alphabetical', label: 'Alphabetical' },
  ];

  return (
    <div className="list-view">
      {/* List Header */}
      <div className="list-header">
        <div className="list-info">
          <div className="list-info-main">
            <span className="task-count">
              {stats.pending} task{stats.pending !== 1 ? 's' : ''} remaining
            </span>
            {stats.overdue > 0 && (
              <span className="overdue-count">
                {stats.overdue} overdue
              </span>
            )}
          </div>
          <span className="current-filter-label">
            {filterLabel}
          </span>
        </div>

        <div className="list-actions">
          {/* Sort Dropdown */}
          <div className="sort-dropdown">
            <motion.button
              className="sort-btn"
              onClick={() => setShowSortMenu(!showSortMenu)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ArrowUpDown size={16} />
              <span>Sort</span>
              <ChevronDown size={14} />
            </motion.button>

            <AnimatePresence>
              {showSortMenu && (
                <motion.div
                  className="sort-menu"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      className={currentSort === option.value ? 'active' : ''}
                      onClick={() => {
                        setCurrentSort(option.value);
                        setShowSortMenu(false);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bulk Actions */}
          {selectedTodos.length > 0 && (
            <motion.div
              className="bulk-actions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <span className="selected-count">{selectedTodos.length} selected</span>
              <motion.button
                className="bulk-btn complete"
                onClick={() => handleBulkAction('complete')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Complete selected"
              >
                <CheckCircle2 size={16} />
              </motion.button>
              <motion.button
                className="bulk-btn archive"
                onClick={() => handleBulkAction('archive')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Archive selected"
              >
                <Archive size={16} />
              </motion.button>
              <motion.button
                className="bulk-btn delete"
                onClick={() => handleBulkAction('delete')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Delete selected"
              >
                <Trash2 size={16} />
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Todo List */}
      <div className="todo-list">
        {sortedTodos.length === 0 ? (
          <motion.div
            className="empty-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="empty-illustration">
              <span className="empty-icon">✨</span>
            </div>
            <h3>No tasks here</h3>
            <p>
              {currentFilter === 'completed' 
                ? "You haven't completed any tasks yet. Keep going!"
                : currentFilter === 'overdue'
                ? "Great job! You have no overdue tasks."
                : "Create a new task to get started on your journey to productivity."}
            </p>
          </motion.div>
        ) : (
          <>
            {/* Pending Tasks */}
            <div className="todo-section">
              <AnimatePresence mode="popLayout">
                {pendingTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onStartPomodoro={onStartPomodoro}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Completed Tasks */}
            {completedTodos.length > 0 && settings.showCompletedTasks && currentFilter !== 'completed' && (
              <div className="todo-section completed-section">
                <div className="section-header">
                  <span className="section-title">
                    <CheckCircle2 size={16} />
                    Completed ({completedTodos.length})
                  </span>
                  <motion.button
                    className="clear-completed-btn"
                    onClick={clearCompleted}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Clear all
                  </motion.button>
                </div>
                <AnimatePresence mode="popLayout">
                  {completedTodos.slice(0, 5).map((todo) => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      onStartPomodoro={onStartPomodoro}
                    />
                  ))}
                </AnimatePresence>
                {completedTodos.length > 5 && (
                  <button className="show-more-btn">
                    Show {completedTodos.length - 5} more
                  </button>
                )}
              </div>
            )}

            {/* Show all completed when filtered */}
            {currentFilter === 'completed' && (
              <AnimatePresence mode="popLayout">
                {sortedTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onStartPomodoro={onStartPomodoro}
                  />
                ))}
              </AnimatePresence>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export const ListView = memo(ListViewComponent);
export default ListView;
