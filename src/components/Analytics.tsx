import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  CheckCircle2, 
  Flame,
  Target,
  Zap,
  Award,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { useApp } from '../context/AppContext';
import { useTodos } from '../hooks';

function AnalyticsComponent() {
  const { stats, settings } = useApp();
  const { todos } = useTodos();

  // Calculate weekly data
  const weeklyData = useMemo(() => {
    const today = new Date();
    const days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const completed = todos.filter(t => 
        t.completedAt && 
        isWithinInterval(new Date(t.completedAt), { start: dayStart, end: dayEnd })
      ).length;
      
      days.push({
        date,
        label: format(date, 'EEE'),
        completed,
      });
    }
    
    return days;
  }, [todos]);

  const maxCompleted = Math.max(...weeklyData.map(d => d.completed), 1);

  // Calculate priority distribution
  const priorityDistribution = useMemo(() => {
    const distribution = { low: 0, medium: 0, high: 0, critical: 0 };
    
    todos.forEach(todo => {
      if (todo.status !== 'archived' && todo.status !== 'completed') {
        distribution[todo.priority]++;
      }
    });
    
    return distribution;
  }, [todos]);

  const totalPending = Object.values(priorityDistribution).reduce((a, b) => a + b, 0);

  // Achievement badges
  const achievements = useMemo(() => {
    const badges = [];
    
    if (stats.currentStreak >= 7) badges.push({ icon: '🔥', label: 'Week Warrior', desc: '7+ day streak' });
    if (stats.totalTasksCompleted >= 100) badges.push({ icon: '💯', label: 'Centurion', desc: '100+ tasks completed' });
    if (stats.longestStreak >= 30) badges.push({ icon: '🏆', label: 'Champion', desc: '30+ day streak' });
    if (stats.productivityScore >= 80) badges.push({ icon: '⚡', label: 'Productivity Pro', desc: '80%+ score' });
    if (stats.totalPomodorosCompleted >= 50) badges.push({ icon: '🍅', label: 'Tomato Master', desc: '50+ pomodoros' });
    
    return badges;
  }, [stats]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      className="analytics-panel"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="analytics-header">
        <BarChart3 size={20} />
        <h2>Your Progress</h2>
      </div>

      {/* Quick Stats */}
      <motion.div className="quick-stats" variants={itemVariants}>
        <div className="stat-card primary">
          <div className="stat-icon">
            <Flame size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.currentStreak}</span>
            <span className="stat-label">Day Streak</span>
          </div>
          <div className="stat-badge">
            {stats.currentStreak >= stats.longestStreak ? '🏆 Best!' : `Best: ${stats.longestStreak}`}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalTasksCompleted}</span>
            <span className="stat-label">Tasks Completed</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Target size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.tasksCompletedToday}/{settings.dailyGoalTasks}</span>
            <span className="stat-label">Today's Goal</span>
          </div>
          <div className="progress-ring">
            <svg viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--border-color)" strokeWidth="3" />
              <circle 
                cx="18" cy="18" r="15" 
                fill="none" 
                stroke="var(--primary-color)" 
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${(stats.tasksCompletedToday / settings.dailyGoalTasks) * 94.2} 94.2`}
                transform="rotate(-90 18 18)"
              />
            </svg>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.productivityScore}%</span>
            <span className="stat-label">Productivity Score</span>
          </div>
        </div>
      </motion.div>

      {/* Weekly Activity Chart */}
      <motion.div className="weekly-chart" variants={itemVariants}>
        <h3>
          <Calendar size={16} />
          This Week's Activity
        </h3>
        <div className="chart-container">
          {weeklyData.map((day, index) => (
            <div key={index} className="chart-bar-container">
              <div className="chart-bar-wrapper">
                <motion.div
                  className="chart-bar"
                  initial={{ height: 0 }}
                  animate={{ height: `${(day.completed / maxCompleted) * 100}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <span className="bar-value">{day.completed}</span>
                </motion.div>
              </div>
              <span className="chart-label">{day.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Priority Distribution */}
      <motion.div className="distribution-section" variants={itemVariants}>
        <h3>
          <Zap size={16} />
          Task Priority
        </h3>
        <div className="priority-bars">
          {Object.entries(priorityDistribution).map(([priority, count]) => {
            const colors: Record<string, string> = {
              low: '#64748b',
              medium: '#f59e0b',
              high: '#f97316',
              critical: '#ef4444',
            };
            const percentage = totalPending > 0 ? (count / totalPending) * 100 : 0;
            
            return (
              <div key={priority} className="priority-bar-item">
                <div className="priority-info">
                  <span className="priority-name">{priority}</span>
                  <span className="priority-count">{count}</span>
                </div>
                <div className="priority-bar-bg">
                  <motion.div
                    className="priority-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5 }}
                    style={{ backgroundColor: colors[priority] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <motion.div className="achievements-section" variants={itemVariants}>
          <h3>
            <Award size={16} />
            Achievements
          </h3>
          <div className="achievements-grid">
            {achievements.map((badge, index) => (
              <motion.div
                key={index}
                className="achievement-badge"
                whileHover={{ scale: 1.05 }}
              >
                <span className="badge-icon">{badge.icon}</span>
                <div className="badge-info">
                  <span className="badge-label">{badge.label}</span>
                  <span className="badge-desc">{badge.desc}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Motivational Message */}
      <motion.div className="motivation-card" variants={itemVariants}>
        <div className="motivation-icon">💪</div>
        <p>
          {stats.tasksCompletedToday >= settings.dailyGoalTasks
            ? "Amazing work! You've crushed your daily goal! 🎉"
            : stats.tasksCompletedToday > 0
            ? `Keep going! ${settings.dailyGoalTasks - stats.tasksCompletedToday} more to reach your goal!`
            : "Start your day strong! Complete your first task."}
        </p>
      </motion.div>
    </motion.div>
  );
}

export const Analytics = memo(AnalyticsComponent);
export default Analytics;
