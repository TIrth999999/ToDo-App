import React, { memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, MoreHorizontal } from 'lucide-react';
import type { Todo, Status } from '../types';
import { TodoItem } from './TodoItem';
import { useApp } from '../context/AppContext';
import { useTodos } from '../hooks';

interface KanbanViewProps {
  onStartPomodoro: (todoId: string) => void;
}

interface KanbanColumnProps {
  status: Status;
  title: string;
  color: string;
  todos: Todo[];
  onStartPomodoro: (todoId: string) => void;
}

interface SortableTodoProps {
  todo: Todo;
  onStartPomodoro: (todoId: string) => void;
}

function SortableTodo({ todo, onStartPomodoro }: SortableTodoProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TodoItem todo={todo} onStartPomodoro={onStartPomodoro} isDragging={isDragging} />
    </div>
  );
}

function KanbanColumn({ status, title, color, todos, onStartPomodoro }: KanbanColumnProps) {
  const { setIsAddModalOpen } = useApp();
  
  return (
    <motion.div
      className="kanban-column"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="column-header" style={{ borderColor: color }}>
        <div className="column-title">
          <span className="column-dot" style={{ backgroundColor: color }} />
          <h3>{title}</h3>
          <span className="column-count">{todos.length}</span>
        </div>
        <div className="column-actions">
          <motion.button
            className="column-action-btn"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={16} />
          </motion.button>
          <motion.button
            className="column-action-btn"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <MoreHorizontal size={16} />
          </motion.button>
        </div>
      </div>

      <SortableContext items={todos.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="column-content">
          <AnimatePresence mode="popLayout">
            {todos.map((todo) => (
              <SortableTodo
                key={todo.id}
                todo={todo}
                onStartPomodoro={onStartPomodoro}
              />
            ))}
          </AnimatePresence>
          
          {todos.length === 0 && (
            <motion.div
              className="column-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p>No tasks</p>
            </motion.div>
          )}
        </div>
      </SortableContext>
    </motion.div>
  );
}

function KanbanViewComponent({ onStartPomodoro }: KanbanViewProps) {
  const { selectedCategory, selectedTags, searchQuery } = useApp();
  const { todos, getFilteredTodos, updateTodo } = useTodos();

  const [activeTodo, setActiveTodo] = React.useState<Todo | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Filter todos
  const filteredTodos = useMemo(() => {
    return getFilteredTodos('all', selectedCategory, selectedTags, searchQuery);
  }, [getFilteredTodos, selectedCategory, selectedTags, searchQuery]);

  // Group todos by status
  const columns = useMemo(() => {
    const grouped: Record<Status, Todo[]> = {
      pending: [],
      in_progress: [],
      completed: [],
      archived: [],
    };

    filteredTodos.forEach(todo => {
      if (todo.status !== 'archived') {
        grouped[todo.status].push(todo);
      }
    });

    return [
      { status: 'pending' as Status, title: 'To Do', color: '#64748b', todos: grouped.pending },
      { status: 'in_progress' as Status, title: 'In Progress', color: '#f59e0b', todos: grouped.in_progress },
      { status: 'completed' as Status, title: 'Done', color: '#10b981', todos: grouped.completed },
    ];
  }, [filteredTodos]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const todo = todos.find(t => t.id === active.id);
    setActiveTodo(todo || null);
  }, [todos]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTodo(null);

    if (!over) return;

    const activeTodoId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column or another todo
    const targetStatus = columns.find(col => 
      col.todos.some(t => t.id === overId) || col.status === overId
    )?.status;

    if (targetStatus) {
      updateTodo(activeTodoId, { status: targetStatus });
    }
  }, [columns, updateTodo]);

  return (
    <div className="kanban-view">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board">
          {columns.map((column) => (
            <KanbanColumn
              key={column.status}
              {...column}
              onStartPomodoro={onStartPomodoro}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTodo && (
            <div className="drag-overlay">
              <TodoItem todo={activeTodo} onStartPomodoro={onStartPomodoro} isDragging />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export const KanbanView = memo(KanbanViewComponent);
export default KanbanView;
