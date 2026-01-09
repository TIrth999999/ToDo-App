import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Header, 
  Sidebar, 
  TodoForm, 
  PomodoroTimer, 
  ListView, 
  KanbanView, 
  CalendarView,
  Analytics,
} from './components';
import { AppProvider, useApp } from './context/AppContext';
import { useKeyboardShortcuts, useTodos } from './hooks';
import './App.css';

function AppContent() {
  const { 
    currentView, 
    isSidebarOpen, 
    isAddModalOpen, 
    setIsAddModalOpen,
    editingTodoId,
    setEditingTodoId,
  } = useApp();
  
  useTodos(); // Initialize todos hook
  
  const [isPomodoroExpanded, setIsPomodoroExpanded] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Start pomodoro for a task
  const handleStartPomodoro = useCallback(() => {
    setIsPomodoroExpanded(true);
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'n', ctrl: true, action: () => setIsAddModalOpen(true), description: 'New task' },
    { key: 'k', ctrl: true, action: () => document.querySelector<HTMLInputElement>('.search-input')?.focus(), description: 'Search' },
    { key: 'Escape', action: () => { setIsAddModalOpen(false); setEditingTodoId(null); }, description: 'Close modal' },
    { key: 'a', ctrl: true, shift: true, action: () => setShowAnalytics(prev => !prev), description: 'Toggle analytics' },
  ]);

  // Close editing modal when clicking outside
  const handleCloseModal = useCallback(() => {
    setIsAddModalOpen(false);
    setEditingTodoId(null);
  }, [setIsAddModalOpen, setEditingTodoId]);

  // Render current view
  const renderView = () => {
    switch (currentView) {
      case 'kanban':
        return <KanbanView onStartPomodoro={handleStartPomodoro} />;
      case 'calendar':
        return <CalendarView onStartPomodoro={handleStartPomodoro} />;
      default:
        return <ListView onStartPomodoro={handleStartPomodoro} />;
    }
  };

  return (
    <div className="app">
      {/* Background Effects */}
      <div className="app-background">
        <div className="gradient-orb orb-1" />
        <div className="gradient-orb orb-2" />
        <div className="gradient-orb orb-3" />
        <div className="noise-overlay" />
      </div>

      {/* Header */}
      <Header onAddClick={() => setIsAddModalOpen(true)} />

      {/* Main Layout */}
      <div className="app-layout">
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} />

        {/* Main Content */}
        <main className={`main-content ${isSidebarOpen ? 'with-sidebar' : ''}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="view-container"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Right Panel - Analytics (optional) */}
        <AnimatePresence>
          {showAnalytics && (
            <motion.aside
              className="analytics-sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Analytics />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Pomodoro Timer */}
      <PomodoroTimer 
        isExpanded={isPomodoroExpanded} 
        onToggle={() => setIsPomodoroExpanded(!isPomodoroExpanded)} 
      />

      {/* Analytics Toggle */}
      <motion.button
        className="analytics-toggle"
        onClick={() => setShowAnalytics(prev => !prev)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Toggle Analytics (Ctrl+Shift+A)"
      >
        📊
      </motion.button>

      {/* Todo Form Modal */}
      <TodoForm 
        isOpen={isAddModalOpen || !!editingTodoId} 
        onClose={handleCloseModal}
        editTodoId={editingTodoId}
      />

    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
