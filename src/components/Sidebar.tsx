import React, { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Inbox, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Archive,
  Star,
  TrendingUp,
  Zap,
  Target,
  Flame,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTodos } from '../hooks';
import type { FilterOption } from '../types';

interface SidebarProps {
  isOpen: boolean;
}

const filterItems: { id: FilterOption; icon: React.ReactNode; label: string; color: string }[] = [
  { id: 'all', icon: <Inbox size={18} />, label: 'All Tasks', color: '#6366f1' },
  { id: 'today', icon: <Calendar size={18} />, label: 'Today', color: '#10b981' },
  { id: 'week', icon: <Clock size={18} />, label: 'This Week', color: '#f59e0b' },
  { id: 'overdue', icon: <AlertCircle size={18} />, label: 'Overdue', color: '#ef4444' },
  { id: 'completed', icon: <CheckCircle2 size={18} />, label: 'Completed', color: '#8b5cf6' },
  { id: 'archived', icon: <Archive size={18} />, label: 'Archived', color: '#64748b' },
];

function SidebarComponent({ isOpen }: SidebarProps) {
  const { 
    currentFilter, 
    setCurrentFilter,
    selectedCategory,
    setSelectedCategory,
    categories,
    stats,
  } = useApp();
  
  const { todos, getFilteredTodos } = useTodos();

  // Calculate counts for each filter
  const filterCounts = useMemo(() => {
    const counts: Record<FilterOption, number> = {
      all: getFilteredTodos('all', null, [], '').length,
      today: getFilteredTodos('today', null, [], '').length,
      week: getFilteredTodos('week', null, [], '').length,
      overdue: getFilteredTodos('overdue', null, [], '').length,
      completed: getFilteredTodos('completed', null, [], '').length,
      archived: getFilteredTodos('archived', null, [], '').length,
    };
    return counts;
  }, [getFilteredTodos]);

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    todos.forEach(todo => {
      if (todo.category && todo.status !== 'archived') {
        counts[todo.category] = (counts[todo.category] || 0) + 1;
      }
    });
    return counts;
  }, [todos]);

  // Calculate favorites count
  const favoritesCount = useMemo(() => {
    return todos.filter(t => t.isFavorite && t.status !== 'archived').length;
  }, [todos]);

  const sidebarVariants = {
    open: { 
      width: 280, 
      opacity: 1,
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    closed: { 
      width: 0, 
      opacity: 0,
      transition: { duration: 0.3, ease: 'easeIn' }
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.05, duration: 0.3 },
    }),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          className="sidebar"
          variants={sidebarVariants}
          initial="closed"
          animate="open"
          exit="closed"
        >
          {/* Stats Quick View */}
          <div className="sidebar-stats">
            <motion.div 
              className="stat-card"
              whileHover={{ scale: 1.02 }}
            >
              <div className="stat-icon streak">
                <Flame size={18} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.currentStreak}</span>
                <span className="stat-label">Day Streak</span>
              </div>
            </motion.div>
            
            <motion.div 
              className="stat-card"
              whileHover={{ scale: 1.02 }}
            >
              <div className="stat-icon productivity">
                <TrendingUp size={18} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.productivityScore}%</span>
                <span className="stat-label">Productivity</span>
              </div>
            </motion.div>
          </div>

          {/* Daily Goal Progress */}
          <div className="daily-goal-section">
            <div className="daily-goal-header">
              <Target size={16} />
              <span>Daily Goal</span>
              <span className="goal-progress-text">
                {stats.tasksCompletedToday} / 5
              </span>
            </div>
            <div className="goal-progress-bar">
              <motion.div 
                className="goal-progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (stats.tasksCompletedToday / 5) * 100)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Quick Filters */}
          <nav className="sidebar-nav">
            <div className="nav-section">
              <h3 className="nav-section-title">Quick Filters</h3>
              <ul className="nav-list">
                {filterItems.map((item, index) => (
                  <motion.li
                    key={item.id}
                    custom={index}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <button
                      className={`nav-item ${currentFilter === item.id && !selectedCategory ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentFilter(item.id);
                        setSelectedCategory(null);
                      }}
                    >
                      <span className="nav-icon" style={{ color: item.color }}>
                        {item.icon}
                      </span>
                      <span className="nav-label">{item.label}</span>
                      {filterCounts[item.id] > 0 && (
                        <span className="nav-count">{filterCounts[item.id]}</span>
                      )}
                    </button>
                  </motion.li>
                ))}
                
                {/* Favorites */}
                <motion.li
                  custom={filterItems.length}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <button className="nav-item">
                    <span className="nav-icon" style={{ color: '#eab308' }}>
                      <Star size={18} />
                    </span>
                    <span className="nav-label">Favorites</span>
                    {favoritesCount > 0 && (
                      <span className="nav-count">{favoritesCount}</span>
                    )}
                  </button>
                </motion.li>
              </ul>
            </div>

            {/* Categories */}
            <div className="nav-section">
              <h3 className="nav-section-title">
                <span>Categories</span>
                <button className="add-category-btn">+</button>
              </h3>
              <ul className="nav-list">
                {categories.map((category, index) => (
                  <motion.li
                    key={category.id}
                    custom={index}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <button
                      className={`nav-item ${selectedCategory === category.id ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setCurrentFilter('all');
                      }}
                    >
                      <span className="nav-icon category-icon">
                        {category.icon}
                      </span>
                      <span className="nav-label">{category.name}</span>
                      {categoryCounts[category.id] > 0 && (
                        <span 
                          className="nav-count"
                          style={{ backgroundColor: `${category.color}20`, color: category.color }}
                        >
                          {categoryCounts[category.id]}
                        </span>
                      )}
                    </button>
                  </motion.li>
                ))}
              </ul>
            </div>
          </nav>

          {/* Focus Mode Promo */}
          <motion.div 
            className="focus-mode-card"
            whileHover={{ scale: 1.02 }}
          >
            <div className="focus-mode-icon">
              <Zap size={24} />
            </div>
            <div className="focus-mode-content">
              <h4>Focus Mode</h4>
              <p>Minimize distractions and boost productivity</p>
            </div>
          </motion.div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export const Sidebar = memo(SidebarComponent);
export default Sidebar;
