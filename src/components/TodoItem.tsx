import React, { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Star, 
  Calendar, 
  Clock, 
  MoreHorizontal,
  Edit3,
  Copy,
  Trash2,
  Archive,
  Play,
  ChevronDown,
  ChevronRight,
  Flag,
  MessageSquare,
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast, formatDistanceToNow } from 'date-fns';
import type { Todo } from '../types';
import { PRIORITY_CONFIG } from '../types';
import { useApp } from '../context/AppContext';
import { useTodos } from '../hooks';

interface TodoItemProps {
  todo: Todo;
  onStartPomodoro?: (todoId: string) => void;
  isDragging?: boolean;
}

function TodoItemComponent({ todo, onStartPomodoro, isDragging }: TodoItemProps) {
  const { categories, tags: allTags, setEditingTodoId } = useApp();
  const { toggleComplete, toggleFavorite, toggleSubtask, deleteTodo, duplicateTodo, archiveTodo } = useTodos();
  
  const [showMenu, setShowMenu] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);

  const priorityConfig = PRIORITY_CONFIG[todo.priority];
  const category = categories.find(c => c.id === todo.category);
  const todoTags = allTags.filter(t => todo.tags.includes(t.id));
  
  const isCompleted = todo.status === 'completed';
  const isOverdue = todo.dueDate && isPast(new Date(todo.dueDate)) && !isToday(new Date(todo.dueDate)) && !isCompleted;
  const completedSubtasks = todo.subtasks.filter(st => st.completed).length;

  const formatDueDate = useCallback((date: Date) => {
    const d = new Date(date);
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    if (isPast(d)) return formatDistanceToNow(d, { addSuffix: true });
    return format(d, 'MMM d');
  }, []);

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleComplete(todo.id);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(todo.id);
  };

  const handleMenuAction = (action: string) => {
    switch (action) {
      case 'edit':
        setEditingTodoId(todo.id);
        break;
      case 'duplicate':
        duplicateTodo(todo.id);
        break;
      case 'archive':
        archiveTodo(todo.id);
        break;
      case 'delete':
        deleteTodo(todo.id);
        break;
      case 'pomodoro':
        onStartPomodoro?.(todo.id);
        break;
    }
    setShowMenu(false);
  };

  return (
    <motion.div
      className={`todo-item ${isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue' : ''} ${isDragging ? 'dragging' : ''}`}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      {/* Priority Indicator */}
      <div 
        className="priority-indicator"
        style={{ backgroundColor: priorityConfig.color }}
        title={`${priorityConfig.label} Priority`}
      />

      {/* Checkbox */}
      <motion.button
        className={`todo-checkbox ${isCompleted ? 'checked' : ''}`}
        onClick={handleComplete}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{ 
          borderColor: isCompleted ? '#10b981' : priorityConfig.color,
          backgroundColor: isCompleted ? '#10b981' : 'transparent',
        }}
      >
        <AnimatePresence>
          {isCompleted && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Check size={14} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Main Content */}
      <div className="todo-content" onClick={() => setEditingTodoId(todo.id)}>
        <div className="todo-header">
          <h3 className={`todo-title ${isCompleted ? 'completed' : ''}`}>
            {todo.title}
          </h3>
          
          {todo.isFavorite && (
            <motion.span
              className="favorite-badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <Star size={14} fill="#eab308" />
            </motion.span>
          )}
        </div>

        {todo.description && (
          <p className="todo-description">{todo.description}</p>
        )}

        {/* Meta Information */}
        <div className="todo-meta">
          {/* Due Date */}
          {todo.dueDate && (
            <span className={`meta-item due-date ${isOverdue ? 'overdue' : ''}`}>
              <Calendar size={12} />
              {formatDueDate(new Date(todo.dueDate))}
            </span>
          )}

          {/* Estimated Time */}
          {todo.estimatedMinutes && (
            <span className="meta-item estimate">
              <Clock size={12} />
              {todo.estimatedMinutes}m
            </span>
          )}

          {/* Category */}
          {category && (
            <span 
              className="meta-item category"
              style={{ backgroundColor: `${category.color}20`, color: category.color }}
            >
              {category.icon} {category.name}
            </span>
          )}

          {/* Priority Badge */}
          <span 
            className="meta-item priority"
            style={{ backgroundColor: priorityConfig.bgColor, color: priorityConfig.color }}
          >
            <Flag size={12} />
            {priorityConfig.label}
          </span>

          {/* Tags */}
          {todoTags.length > 0 && (
            <div className="meta-tags">
              {todoTags.slice(0, 2).map(tag => (
                <span 
                  key={tag.id}
                  className="meta-tag"
                  style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
              {todoTags.length > 2 && (
                <span className="meta-tag more">+{todoTags.length - 2}</span>
              )}
            </div>
          )}

          {/* Subtasks Progress */}
          {todo.subtasks.length > 0 && (
            <span className="meta-item subtasks">
              <Check size={12} />
              {completedSubtasks}/{todo.subtasks.length}
            </span>
          )}

          {/* Notes Indicator */}
          {todo.notes && (
            <span className="meta-item notes">
              <MessageSquare size={12} />
            </span>
          )}

          {/* Pomodoros */}
          {todo.pomodorosCompleted > 0 && (
            <span className="meta-item pomodoros">
              🍅 {todo.pomodorosCompleted}
            </span>
          )}
        </div>

        {/* Subtasks Expandable */}
        {todo.subtasks.length > 0 && (
          <div className="subtasks-section">
            <button 
              className="subtasks-toggle"
              onClick={(e) => {
                e.stopPropagation();
                setShowSubtasks(!showSubtasks);
              }}
            >
              {showSubtasks ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span>{todo.subtasks.length} subtask{todo.subtasks.length > 1 ? 's' : ''}</span>
              <div className="subtasks-progress-bar">
                <div 
                  className="subtasks-progress-fill"
                  style={{ width: `${(completedSubtasks / todo.subtasks.length) * 100}%` }}
                />
              </div>
            </button>
            
            <AnimatePresence>
              {showSubtasks && (
                <motion.ul
                  className="subtasks-list"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  {todo.subtasks.map(subtask => (
                    <motion.li 
                      key={subtask.id}
                      className={`subtask-item ${subtask.completed ? 'completed' : ''}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <button
                        className={`subtask-checkbox ${subtask.completed ? 'checked' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSubtask(todo.id, subtask.id);
                        }}
                      >
                        {subtask.completed && <Check size={10} />}
                      </button>
                      <span>{subtask.title}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="todo-actions">
        <motion.button
          className={`action-btn favorite-btn ${todo.isFavorite ? 'active' : ''}`}
          onClick={handleFavorite}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Toggle favorite"
        >
          <Star size={16} fill={todo.isFavorite ? '#eab308' : 'none'} />
        </motion.button>

        <motion.button
          className="action-btn pomodoro-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleMenuAction('pomodoro');
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Start Pomodoro"
        >
          <Play size={16} />
        </motion.button>

        <div className="menu-container">
          <motion.button
            className="action-btn menu-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <MoreHorizontal size={16} />
          </motion.button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                className="action-menu"
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button onClick={() => handleMenuAction('edit')}>
                  <Edit3 size={14} /> Edit
                </button>
                <button onClick={() => handleMenuAction('duplicate')}>
                  <Copy size={14} /> Duplicate
                </button>
                <button onClick={() => handleMenuAction('archive')}>
                  <Archive size={14} /> Archive
                </button>
                <button className="danger" onClick={() => handleMenuAction('delete')}>
                  <Trash2 size={14} /> Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Completion Animation */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div
            className="completion-overlay"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export const TodoItem = memo(TodoItemComponent);
export default TodoItem;
