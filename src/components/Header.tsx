import React, { memo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Plus, 
  Menu, 
  LayoutGrid, 
  List, 
  Calendar as CalendarIcon,
  Sun,
  Moon,
  Settings,
  Command,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { ViewMode } from '../types';
import { MOTIVATIONAL_QUOTES } from '../types';

interface HeaderProps {
  onAddClick: () => void;
}

function HeaderComponent({ onAddClick }: HeaderProps) {
  const { 
    toggleSidebar, 
    currentView, 
    setCurrentView, 
    searchQuery, 
    setSearchQuery,
    effectiveTheme,
    setTheme,
  } = useApp();

  const [showQuote, setShowQuote] = useState(false);
  const [quote, setQuote] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Show random quote on mount
    const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    setQuote(randomQuote);
    setShowQuote(true);
    
    const timer = setTimeout(() => setShowQuote(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const viewOptions: { value: ViewMode; icon: React.ReactNode; label: string }[] = [
    { value: 'list', icon: <List size={18} />, label: 'List' },
    { value: 'kanban', icon: <LayoutGrid size={18} />, label: 'Kanban' },
    { value: 'calendar', icon: <CalendarIcon size={18} />, label: 'Calendar' },
  ];

  const handleThemeToggle = () => {
    setTheme(effectiveTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="header">
      <div className="header-left">
        <motion.button 
          className="header-btn menu-btn"
          onClick={toggleSidebar}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </motion.button>
        
        <div className="header-brand">
          <motion.div 
            className="brand-icon"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles size={24} />
          </motion.div>
          <span className="brand-text">FlowState</span>
        </div>
      </div>

      <div className="header-center">
        <AnimatePresence mode="wait">
          {showQuote ? (
            <motion.div
              key="quote"
              className="motivational-quote"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <span className="quote-icon">✨</span>
              {quote}
            </motion.div>
          ) : (
            <motion.div 
              key="search"
              className="search-container"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <Search size={18} className="search-icon" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search tasks... (Ctrl+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <div className="search-shortcut">
                <Command size={12} />
                <span>K</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="header-right">
        <div className="view-switcher">
          {viewOptions.map((option) => (
            <motion.button
              key={option.value}
              className={`view-btn ${currentView === option.value ? 'active' : ''}`}
              onClick={() => setCurrentView(option.value)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={option.label}
            >
              {option.icon}
            </motion.button>
          ))}
        </div>

        <motion.button 
          className="header-btn theme-btn"
          onClick={handleThemeToggle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Toggle theme"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={effectiveTheme}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {effectiveTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </motion.div>
          </AnimatePresence>
        </motion.button>

        <motion.button 
          className="header-btn settings-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Settings"
        >
          <Settings size={20} />
        </motion.button>

        <motion.button
          className="add-task-btn"
          onClick={onAddClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus size={20} />
          <span>Add Task</span>
        </motion.button>
      </div>
    </header>
  );
}

export const Header = memo(HeaderComponent);
export default Header;
