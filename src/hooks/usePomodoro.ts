import { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { PomodoroSession, AppSettings } from '../types';
import { useLocalStorage } from './useLocalStorage';

type PomodoroPhase = 'work' | 'shortBreak' | 'longBreak';

interface UsePomodoroReturn {
  timeRemaining: number;
  totalTime: number;
  isRunning: boolean;
  isPaused: boolean;
  currentPhase: PomodoroPhase;
  completedPomodoros: number;
  currentTodoId: string | null;
  sessions: PomodoroSession[];
  startPomodoro: (todoId?: string) => void;
  pausePomodoro: () => void;
  resumePomodoro: () => void;
  stopPomodoro: () => void;
  skipPhase: () => void;
  resetPomodoro: () => void;
  setCurrentTodo: (todoId: string | null) => void;
  formatTime: (seconds: number) => string;
  progress: number;
}

export function usePomodoro(settings: AppSettings): UsePomodoroReturn {
  const [sessions, setSessions] = useLocalStorage<PomodoroSession[]>('flowstate-pomodoro-sessions', []);
  const [completedPomodoros, setCompletedPomodoros] = useLocalStorage<number>('flowstate-completed-pomodoros', 0);
  
  const [currentPhase, setCurrentPhase] = useState<PomodoroPhase>('work');
  const [timeRemaining, setTimeRemaining] = useState(settings.pomodoroDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTodoId, setCurrentTodoId] = useState<string | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartRef = useRef<Date | null>(null);

  const getTotalTime = useCallback((phase: PomodoroPhase): number => {
    switch (phase) {
      case 'work':
        return settings.pomodoroDuration * 60;
      case 'shortBreak':
        return settings.shortBreakDuration * 60;
      case 'longBreak':
        return settings.longBreakDuration * 60;
    }
  }, [settings]);

  const totalTime = getTotalTime(currentPhase);
  const progress = ((totalTime - timeRemaining) / totalTime) * 100;

  const playSound = useCallback((type: 'complete' | 'break') => {
    if (!settings.soundEnabled) return;
    
    // Create audio context for notification sounds
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = type === 'complete' ? 800 : 600;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }, [settings.soundEnabled]);

  const showNotification = useCallback((title: string, body: string) => {
    if (!settings.notificationsEnabled) return;
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/vite.svg' });
    }
  }, [settings.notificationsEnabled]);

  const completePhase = useCallback(() => {
    // Record session
    if (sessionStartRef.current) {
      const session: PomodoroSession = {
        id: uuidv4(),
        todoId: currentTodoId,
        startTime: sessionStartRef.current,
        endTime: new Date(),
        duration: getTotalTime(currentPhase),
        type: currentPhase,
        completed: true,
      };
      setSessions(prev => [...prev, session]);
    }

    if (currentPhase === 'work') {
      const newCount = completedPomodoros + 1;
      setCompletedPomodoros(newCount);
      playSound('complete');
      showNotification('🍅 Pomodoro Complete!', 'Great job! Time for a break.');
      
      // Determine next break
      if (newCount % settings.pomodorosUntilLongBreak === 0) {
        setCurrentPhase('longBreak');
        setTimeRemaining(settings.longBreakDuration * 60);
      } else {
        setCurrentPhase('shortBreak');
        setTimeRemaining(settings.shortBreakDuration * 60);
      }
      
      if (!settings.autoStartBreaks) {
        setIsRunning(false);
      }
    } else {
      playSound('break');
      showNotification('☕ Break Over!', 'Ready to focus again?');
      setCurrentPhase('work');
      setTimeRemaining(settings.pomodoroDuration * 60);
      
      if (!settings.autoStartPomodoros) {
        setIsRunning(false);
      }
    }
    
    sessionStartRef.current = new Date();
  }, [
    currentPhase, 
    currentTodoId, 
    completedPomodoros, 
    settings, 
    getTotalTime,
    setSessions,
    setCompletedPomodoros,
    playSound,
    showNotification
  ]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            completePhase();
            return getTotalTime(currentPhase === 'work' ? 'shortBreak' : 'work');
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, completePhase, currentPhase, getTotalTime]);

  const startPomodoro = useCallback((todoId?: string) => {
    if (todoId) setCurrentTodoId(todoId);
    setIsRunning(true);
    setIsPaused(false);
    sessionStartRef.current = new Date();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const pausePomodoro = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumePomodoro = useCallback(() => {
    setIsPaused(false);
  }, []);

  const stopPomodoro = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    
    // Record incomplete session
    if (sessionStartRef.current) {
      const session: PomodoroSession = {
        id: uuidv4(),
        todoId: currentTodoId,
        startTime: sessionStartRef.current,
        endTime: new Date(),
        duration: getTotalTime(currentPhase) - timeRemaining,
        type: currentPhase,
        completed: false,
      };
      setSessions(prev => [...prev, session]);
    }
    
    sessionStartRef.current = null;
  }, [currentPhase, currentTodoId, timeRemaining, getTotalTime, setSessions]);

  const skipPhase = useCallback(() => {
    completePhase();
  }, [completePhase]);

  const resetPomodoro = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentPhase('work');
    setTimeRemaining(settings.pomodoroDuration * 60);
    sessionStartRef.current = null;
  }, [settings.pomodoroDuration]);

  const setCurrentTodo = useCallback((todoId: string | null) => {
    setCurrentTodoId(todoId);
  }, []);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    timeRemaining,
    totalTime,
    isRunning,
    isPaused,
    currentPhase,
    completedPomodoros,
    currentTodoId,
    sessions,
    startPomodoro,
    pausePomodoro,
    resumePomodoro,
    stopPomodoro,
    skipPhase,
    resetPomodoro,
    setCurrentTodo,
    formatTime,
    progress,
  };
}

export default usePomodoro;
