import { memo, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Calendar,
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  addMonths,
  subMonths,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import type { Todo } from '../types';
import { PRIORITY_CONFIG } from '../types';
import { useApp } from '../context/AppContext';
import { useTodos } from '../hooks';

interface CalendarViewProps {
  onStartPomodoro: (todoId: string) => void;
}

interface CalendarDayProps {
  date: Date;
  todos: Todo[];
  isCurrentMonth: boolean;
  isSelected: boolean;
  onClick: () => void;
}

function CalendarDay({ date, todos, isCurrentMonth, isSelected, onClick }: CalendarDayProps) {
  const today = isToday(date);
  const hasTodos = todos.length > 0;

  return (
    <motion.div
      className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${today ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="day-number">{format(date, 'd')}</span>
      
      {hasTodos && (
        <div className="day-todos">
          {todos.slice(0, 3).map((todo) => (
            <div
              key={todo.id}
              className={`day-todo ${todo.status === 'completed' ? 'completed' : ''}`}
              style={{ borderLeftColor: PRIORITY_CONFIG[todo.priority].color }}
            >
              <span className="todo-dot" style={{ backgroundColor: PRIORITY_CONFIG[todo.priority].color }} />
              <span className="todo-title">{todo.title}</span>
            </div>
          ))}
          {todos.length > 3 && (
            <div className="more-todos">+{todos.length - 3} more</div>
          )}
        </div>
      )}

      {hasTodos && (
        <div className="day-indicators">
          {todos.slice(0, 4).map((todo, i) => (
            <span
              key={i}
              className="indicator-dot"
              style={{ backgroundColor: PRIORITY_CONFIG[todo.priority].color }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function CalendarViewComponent({ onStartPomodoro: _onStartPomodoro }: CalendarViewProps) {
  const { setIsAddModalOpen, setEditingTodoId } = useApp();
  const { todos } = useTodos();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get month boundaries
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    let day = calendarStart;
    
    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    
    return days;
  }, [calendarStart, calendarEnd]);

  // Group todos by date
  const todosByDate = useMemo(() => {
    const map: Record<string, Todo[]> = {};
    
    todos.forEach(todo => {
      if (todo.dueDate && todo.status !== 'archived') {
        const dateKey = format(new Date(todo.dueDate), 'yyyy-MM-dd');
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(todo);
      }
    });
    
    return map;
  }, [todos]);

  // Get todos for selected date
  const selectedDateTodos = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return todosByDate[dateKey] || [];
  }, [selectedDate, todosByDate]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="calendar-view">
      <div className="calendar-container">
        {/* Calendar Header */}
        <div className="calendar-header">
          <div className="calendar-nav">
            <motion.button
              onClick={handlePrevMonth}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft size={20} />
            </motion.button>
            <h2>{format(currentDate, 'MMMM yyyy')}</h2>
            <motion.button
              onClick={handleNextMonth}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight size={20} />
            </motion.button>
          </div>
          
          <div className="calendar-actions">
            <motion.button
              className="today-btn"
              onClick={handleToday}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Today
            </motion.button>
            <motion.button
              className="add-btn"
              onClick={() => setIsAddModalOpen(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus size={16} /> Add Task
            </motion.button>
          </div>
        </div>

        {/* Week Days Header */}
        <div className="calendar-weekdays">
          {weekDays.map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="calendar-grid">
          {calendarDays.map((date, index) => {
            const dateKey = format(date, 'yyyy-MM-dd');
            const dayTodos = todosByDate[dateKey] || [];
            
            return (
              <CalendarDay
                key={index}
                date={date}
                todos={dayTodos}
                isCurrentMonth={isSameMonth(date, currentDate)}
                isSelected={selectedDate ? isSameDay(date, selectedDate) : false}
                onClick={() => setSelectedDate(date)}
              />
            );
          })}
        </div>
      </div>

      {/* Selected Date Panel */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            className="selected-date-panel"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="panel-header">
              <Calendar size={18} />
              <h3>{format(selectedDate, 'EEEE, MMMM d')}</h3>
              <motion.button
                className="close-panel"
                onClick={() => setSelectedDate(null)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ×
              </motion.button>
            </div>

            <div className="panel-content">
              {selectedDateTodos.length === 0 ? (
                <div className="no-tasks">
                  <p>No tasks scheduled</p>
                  <motion.button
                    onClick={() => setIsAddModalOpen(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Plus size={14} /> Add task for this day
                  </motion.button>
                </div>
              ) : (
                <ul className="date-todos">
                  {selectedDateTodos.map(todo => (
                    <motion.li
                      key={todo.id}
                      className={`date-todo ${todo.status === 'completed' ? 'completed' : ''}`}
                      onClick={() => setEditingTodoId(todo.id)}
                      whileHover={{ scale: 1.01 }}
                    >
                      <span 
                        className="priority-dot"
                        style={{ backgroundColor: PRIORITY_CONFIG[todo.priority].color }}
                      />
                      <span className="todo-title">{todo.title}</span>
                      <span className="todo-time">
                        {todo.dueDate && format(new Date(todo.dueDate), 'h:mm a')}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const CalendarView = memo(CalendarViewComponent);
export default CalendarView;
