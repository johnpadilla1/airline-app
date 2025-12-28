import React from 'react';
import { StatPillProps } from '@/shared/types';

/**
 * StatPill Component
 * 
 * Status filter button displaying flight statistics with visual indicators.
 * Used for filtering flights by status in the dashboard.
 * 
 * @example
 * ```tsx
 * <StatPill 
 *   label="On Time" 
 *   value={42} 
 *   color="emerald" 
 *   active={statusFilter === FlightStatus.ON_TIME}
 *   onClick={() => handleFilter(FlightStatus.ON_TIME)} 
 * />
 * ```
 */
const StatPill = React.memo<StatPillProps>(({ label, value, color = 'slate', active, onClick }) => {
  const style: { dot: string; text: string; activeBg: string } = {
    slate: {
      dot: 'bg-slate-400',
      text: 'text-slate-600 dark:text-slate-300',
      activeBg: 'bg-slate-100 dark:bg-slate-800',
    },
    emerald: {
      dot: 'bg-emerald-500',
      text: 'text-emerald-600 dark:text-emerald-400',
      activeBg: 'bg-emerald-50 dark:bg-emerald-500/20',
    },
    cyan: {
      dot: 'bg-cyan-500',
      text: 'text-cyan-600 dark:text-cyan-400',
      activeBg: 'bg-cyan-50 dark:bg-cyan-500/20',
    },
    violet: {
      dot: 'bg-violet-500',
      text: 'text-violet-600 dark:text-violet-400',
      activeBg: 'bg-violet-50 dark:bg-violet-500/20',
    },
    amber: {
      dot: 'bg-amber-500',
      text: 'text-amber-600 dark:text-amber-400',
      activeBg: 'bg-amber-50 dark:bg-amber-500/20',
    },
    red: {
      dot: 'bg-red-500',
      text: 'text-red-600 dark:text-red-400',
      activeBg: 'bg-red-50 dark:bg-red-500/20',
    },
    teal: {
      dot: 'bg-teal-500',
      text: 'text-teal-600 dark:text-teal-400',
      activeBg: 'bg-teal-50 dark:bg-teal-500/20',
    },
    white: {
      dot: 'bg-white dark:bg-slate-300',
      text: 'text-slate-600 dark:text-slate-300',
      activeBg: 'bg-slate-100 dark:bg-slate-700',
    },
  }[color] || {
    dot: 'bg-slate-400',
    text: 'text-slate-600 dark:text-slate-300',
    activeBg: 'bg-slate-100 dark:bg-slate-800',
  };

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
        transition-all duration-200 border
        ${active ? `${style.activeBg} ${style.text} border-current/30 shadow-sm` : 'bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-white/10'}
      `}
      aria-pressed={active}
      aria-label={`Filter by ${label}: ${value} flights`}
      type="button"
    >
      <span className={`w-2 h-2 rounded-full ${style.dot}`} aria-hidden="true" />
      <span>{label}</span>
      <span className={`font-bold ${active ? '' : 'text-slate-900 dark:text-white'}`}>{value}</span>
    </button>
  );
});

StatPill.displayName = 'StatPill';

export default StatPill;
