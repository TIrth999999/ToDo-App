import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  X,
  Coffee,
  Zap,
  Target,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePomodoro } from '../hooks';
import { useTodos } from '../hooks';

interface PomodoroTimerProps {
  isExpanded: boolean;
  onToggle: () => void;
}

function PomodoroTimerComponent({ isExpanded, onToggle }: PomodoroTimerProps) {
  const { settings } = useApp();
  const { todos } = useTodos();
  const {
    timeRemaining,
    isRunning,
    isPaused,
    currentPhase,
    completedPomodoros,
    currentTodoId,
    startPomodoro,
    pausePomodoro,
    resumePomodoro,
    skipPhase,
    resetPomodoro,
    formatTime,
    progress,
  } = usePomodoro(settings);

  const currentTodo = currentTodoId ? todos.find(t => t.id === currentTodoId) : null;

  const phaseConfig = {
    work: { label: 'Focus Time', icon: <Zap size={20} />, color: '#ef4444' },
    shortBreak: { label: 'Short Break', icon: <Coffee size={20} />, color: '#10b981' },
    longBreak: { label: 'Long Break', icon: <Coffee size={20} />, color: '#6366f1' },
  };

  const currentConfig = phaseConfig[currentPhase];

  // Calculate circle dimensions
  const size = isExpanded ? 200 : 60;
  const strokeWidth = isExpanded ? 8 : 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      className={`pomodoro-timer ${isExpanded ? 'expanded' : 'collapsed'}`}
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            className="pomodoro-expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Header */}
            <div className="pomodoro-header">
              <div className="phase-indicator" style={{ color: currentConfig.color }}>
                {currentConfig.icon}
                <span>{currentConfig.label}</span>
              </div>
              <motion.button
                className="minimize-btn"
                onClick={onToggle}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={18} />
              </motion.button>
            </div>

            {/* Timer Circle */}
            <div className="timer-circle-container">
              <svg width={size} height={size} className="timer-circle">
                {/* Background circle */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="var(--border-color)"
                  strokeWidth={strokeWidth}
                />
                {/* Progress circle */}
                <motion.circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={currentConfig.color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </svg>
              <div className="timer-display">
                <span className="timer-time">{formatTime(timeRemaining)}</span>
                <span className="timer-phase">{currentConfig.label}</span>
              </div>
            </div>

            {/* Current Task */}
            {currentTodo && (
              <div className="current-task">
                <Target size={14} />
                <span>{currentTodo.title}</span>
              </div>
            )}

            {/* Controls */}
            <div className="pomodoro-controls">
              {!isRunning ? (
                <motion.button
                  className="control-btn primary"
                  onClick={() => startPomodoro()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ backgroundColor: currentConfig.color }}
                >
                  <Play size={24} />
                  <span>Start</span>
                </motion.button>
              ) : isPaused ? (
                <motion.button
                  className="control-btn primary"
                  onClick={resumePomodoro}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ backgroundColor: currentConfig.color }}
                >
                  <Play size={24} />
                  <span>Resume</span>
                </motion.button>
              ) : (
                <motion.button
                  className="control-btn primary"
                  onClick={pausePomodoro}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ backgroundColor: currentConfig.color }}
                >
                  <Pause size={24} />
                  <span>Pause</span>
                </motion.button>
              )}

              <motion.button
                className="control-btn secondary"
                onClick={resetPomodoro}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RotateCcw size={18} />
              </motion.button>

              <motion.button
                className="control-btn secondary"
                onClick={skipPhase}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <SkipForward size={18} />
              </motion.button>
            </div>

            {/* Stats */}
            <div className="pomodoro-stats">
              <div className="stat">
                <span className="stat-value">{completedPomodoros}</span>
                <span className="stat-label">Pomodoros</span>
              </div>
              <div className="stat">
                <span className="stat-value">{settings.pomodorosUntilLongBreak - (completedPomodoros % settings.pomodorosUntilLongBreak)}</span>
                <span className="stat-label">Until Long Break</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            className="pomodoro-collapsed"
            onClick={onToggle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            style={{ borderColor: isRunning ? currentConfig.color : 'var(--border-color)' }}
          >
            <svg width={size} height={size} className="timer-circle-mini">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="var(--border-color)"
                strokeWidth={strokeWidth}
              />
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={currentConfig.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            </svg>
            <div className="mini-timer">
              <span className="mini-time">{formatTime(timeRemaining)}</span>
              {isRunning && !isPaused && (
                <motion.div
                  className="running-indicator"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  style={{ backgroundColor: currentConfig.color }}
                />
              )}
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export const PomodoroTimer = memo(PomodoroTimerComponent);
export default PomodoroTimer;
