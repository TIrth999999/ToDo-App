import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Calendar, 
  Clock, 
  Flag, 
  Tag, 
  Folder, 
  Plus,
  Trash2,
  Repeat,
  Bell,
  FileText,
  CheckSquare,
} from 'lucide-react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import type { Todo, Priority, Subtask } from '../types';
import { PRIORITY_CONFIG } from '../types';
import { useApp } from '../context/AppContext';
import { useTodos } from '../hooks';

interface TodoFormProps {
  isOpen: boolean;
  onClose: () => void;
  editTodoId?: string | null;
}

function TodoFormComponent({ isOpen, onClose, editTodoId }: TodoFormProps) {
  const { categories, tags } = useApp();
  const { todos, addTodo, updateTodo } = useTodos();
  
  const editingTodo = editTodoId ? todos.find(t => t.id === editTodoId) : null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [notes, setNotes] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (editingTodo) {
      setTitle(editingTodo.title);
      setDescription(editingTodo.description);
      setPriority(editingTodo.priority);
      setCategory(editingTodo.category);
      setSelectedTags(editingTodo.tags);
      setDueDate(editingTodo.dueDate ? format(new Date(editingTodo.dueDate), 'yyyy-MM-dd') : '');
      setDueTime(editingTodo.dueDate ? format(new Date(editingTodo.dueDate), 'HH:mm') : '');
      setEstimatedMinutes(editingTodo.estimatedMinutes?.toString() || '');
      setNotes(editingTodo.notes);
      setSubtasks(editingTodo.subtasks);
      setIsRecurring(editingTodo.isRecurring);
    } else {
      resetForm();
    }
  }, [editingTodo]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setCategory(null);
    setSelectedTags([]);
    setDueDate('');
    setDueTime('');
    setEstimatedMinutes('');
    setNotes('');
    setSubtasks([]);
    setNewSubtask('');
    setIsRecurring(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const dueDatetime = dueDate 
      ? new Date(`${dueDate}${dueTime ? 'T' + dueTime : 'T23:59'}`)
      : null;

    const todoData: Partial<Todo> = {
      title: title.trim(),
      description: description.trim(),
      priority,
      category,
      tags: selectedTags,
      dueDate: dueDatetime,
      estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
      notes: notes.trim(),
      subtasks,
      isRecurring,
    };

    if (editTodoId) {
      updateTodo(editTodoId, todoData);
    } else {
      addTodo(todoData);
    }

    resetForm();
    onClose();
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    
    const subtask: Subtask = {
      id: uuidv4(),
      title: newSubtask.trim(),
      completed: false,
      createdAt: new Date(),
    };
    
    setSubtasks([...subtasks, subtask]);
    setNewSubtask('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: 'spring', damping: 25, stiffness: 300 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: 20,
      transition: { duration: 0.2 }
    },
  };

  const priorities: Priority[] = ['low', 'medium', 'high', 'critical'];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-backdrop"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
        >
          <motion.div
            className="modal todo-form-modal"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{editTodoId ? 'Edit Task' : 'Create New Task'}</h2>
              <motion.button
                className="close-btn"
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={20} />
              </motion.button>
            </div>

            <form onSubmit={handleSubmit} className="todo-form">
              {/* Title */}
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Task title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input title-input"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <textarea
                  placeholder="Add description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input description-input"
                  rows={2}
                />
              </div>

              {/* Priority & Category Row */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <Flag size={14} /> Priority
                  </label>
                  <div className="priority-selector">
                    {priorities.map((p) => (
                      <motion.button
                        key={p}
                        type="button"
                        className={`priority-option ${priority === p ? 'active' : ''}`}
                        onClick={() => setPriority(p)}
                        style={{ 
                          backgroundColor: priority === p ? PRIORITY_CONFIG[p].color : 'transparent',
                          borderColor: PRIORITY_CONFIG[p].color,
                          color: priority === p ? 'white' : PRIORITY_CONFIG[p].color,
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {PRIORITY_CONFIG[p].label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Folder size={14} /> Category
                  </label>
                  <select
                    value={category || ''}
                    onChange={(e) => setCategory(e.target.value || null)}
                    className="form-select"
                  >
                    <option value="">No category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Time Row */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <Calendar size={14} /> Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Clock size={14} /> Time
                  </label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Clock size={14} /> Estimate
                  </label>
                  <input
                    type="number"
                    placeholder="minutes"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(e.target.value)}
                    className="form-input"
                    min="1"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="form-group">
                <label className="form-label">
                  <Tag size={14} /> Tags
                </label>
                <div className="tags-selector">
                  {tags.map((tag) => (
                    <motion.button
                      key={tag.id}
                      type="button"
                      className={`tag-option ${selectedTags.includes(tag.id) ? 'active' : ''}`}
                      onClick={() => handleTagToggle(tag.id)}
                      style={{ 
                        backgroundColor: selectedTags.includes(tag.id) ? tag.color : `${tag.color}20`,
                        color: selectedTags.includes(tag.id) ? 'white' : tag.color,
                        borderColor: tag.color,
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {tag.name}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Subtasks */}
              <div className="form-group">
                <label className="form-label">
                  <CheckSquare size={14} /> Subtasks
                </label>
                <div className="subtasks-input">
                  <input
                    type="text"
                    placeholder="Add a subtask..."
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                    className="form-input"
                  />
                  <motion.button
                    type="button"
                    onClick={handleAddSubtask}
                    className="add-subtask-btn"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus size={16} />
                  </motion.button>
                </div>
                
                {subtasks.length > 0 && (
                  <ul className="subtasks-list-form">
                    {subtasks.map((subtask) => (
                      <motion.li 
                        key={subtask.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                      >
                        <span>{subtask.title}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubtask(subtask.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">
                  <FileText size={14} /> Notes
                </label>
                <textarea
                  placeholder="Add notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-input notes-input"
                  rows={3}
                />
              </div>

              {/* Options Row */}
              <div className="form-options">
                <label className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                  />
                  <Repeat size={14} />
                  <span>Recurring task</span>
                </label>
              </div>

              {/* Submit */}
              <div className="form-actions">
                <motion.button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  className="btn btn-primary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!title.trim()}
                >
                  {editTodoId ? 'Save Changes' : 'Create Task'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const TodoForm = memo(TodoFormComponent);
export default TodoForm;
