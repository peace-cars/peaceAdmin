import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTheme } from '../../lib/ThemeContext';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface KpiTileProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  delta?: number;
  deltaType?: 'increase' | 'decrease' | 'neutral';
  icon?: React.ReactNode;
  color?: string;
}

export const KpiTile = React.forwardRef<HTMLDivElement, KpiTileProps>(
  ({ className, label, value, delta, deltaType, icon, color = 'indigo', ...props }, ref) => {
    const { cardAccent } = useTheme();

    const iconBgColors: Record<string, string> = {
      indigo: 'bg-primary-main/10 text-primary-main',
      emerald: 'bg-success/10 text-success',
      amber: 'bg-warning/10 text-warning',
      rose: 'bg-error/10 text-error',
    };

    const deltaColor =
      deltaType === 'increase'
        ? 'text-success'
        : deltaType === 'decrease'
          ? 'text-error'
          : 'text-text-muted';

    // Determine container and text styling based on cardAccent
    let containerAccentClass = 'border border-border-subtle/70 bg-surface-card/95 text-text-main shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)]';
    let labelColorClass = 'text-text-muted';
    let valueColorClass = 'text-text-main';
    let iconOverrideClass = '';
    let deltaOverrideColor = '';

    if (cardAccent.startsWith('solid-')) {
      labelColorClass = 'text-white/70';
      valueColorClass = 'text-white';
      deltaOverrideColor = 'text-white/90';
      
      if (cardAccent === 'solid-blue') {
        containerAccentClass = 'bg-blue-600 border-blue-700 text-white shadow-[0_10px_30px_-10px_rgba(37,99,235,0.4)]';
        iconOverrideClass = 'bg-white/20 text-white';
      } else if (cardAccent === 'solid-green') {
        containerAccentClass = 'bg-emerald-600 border-emerald-700 text-white shadow-[0_10px_30px_-10px_rgba(5,150,105,0.4)]';
        iconOverrideClass = 'bg-white/20 text-white';
      } else if (cardAccent === 'solid-amber') {
        containerAccentClass = 'bg-amber-500 border-amber-600 text-white shadow-[0_10px_30px_-10px_rgba(245,158,11,0.4)]';
        iconOverrideClass = 'bg-white/20 text-white';
      } else if (cardAccent === 'solid-rose') {
        containerAccentClass = 'bg-rose-600 border-rose-700 text-white shadow-[0_10px_30px_-10px_rgba(225,29,72,0.4)]';
        iconOverrideClass = 'bg-white/20 text-white';
      } else if (cardAccent === 'solid-purple') {
        containerAccentClass = 'bg-purple-600 border-purple-700 text-white shadow-[0_10px_30px_-10px_rgba(147,51,234,0.4)]';
        iconOverrideClass = 'bg-white/20 text-white';
      }
    } else if (cardAccent.startsWith('light-')) {
      if (cardAccent === 'light-blue') {
        containerAccentClass = 'bg-blue-50/70 border-blue-200 text-blue-900 shadow-[0_10px_30px_-18px_rgba(37,99,235,0.2)] dark:bg-blue-950/20 dark:border-blue-900/40 dark:text-blue-200';
        labelColorClass = 'text-blue-700/80 dark:text-blue-300/80';
        valueColorClass = 'text-blue-950 dark:text-blue-100';
        iconOverrideClass = 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
      } else if (cardAccent === 'light-green') {
        containerAccentClass = 'bg-emerald-50/70 border-emerald-200 text-emerald-900 shadow-[0_10px_30px_-18px_rgba(5,150,105,0.2)] dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-200';
        labelColorClass = 'text-emerald-700/80 dark:text-emerald-300/80';
        valueColorClass = 'text-emerald-950 dark:text-emerald-100';
        iconOverrideClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300';
      } else if (cardAccent === 'light-amber') {
        containerAccentClass = 'bg-amber-50/70 border-amber-200 text-amber-900 shadow-[0_10px_30px_-18px_rgba(245,158,11,0.2)] dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-200';
        labelColorClass = 'text-amber-700/80 dark:text-amber-300/80';
        valueColorClass = 'text-amber-950 dark:text-amber-100';
        iconOverrideClass = 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300';
      } else if (cardAccent === 'light-rose') {
        containerAccentClass = 'bg-rose-50/70 border-rose-200 text-rose-900 shadow-[0_10px_30px_-18px_rgba(225,29,72,0.2)] dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-200';
        labelColorClass = 'text-rose-700/80 dark:text-rose-300/80';
        valueColorClass = 'text-rose-950 dark:text-rose-100';
        iconOverrideClass = 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300';
      } else if (cardAccent === 'light-purple') {
        containerAccentClass = 'bg-purple-50/70 border-purple-200 text-purple-900 shadow-[0_10px_30px_-18px_rgba(147,51,234,0.2)] dark:bg-purple-950/20 dark:border-purple-900/40 dark:text-purple-200';
        labelColorClass = 'text-purple-700/80 dark:text-purple-300/80';
        valueColorClass = 'text-purple-950 dark:text-purple-100';
        iconOverrideClass = 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300';
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-3xl backdrop-blur-xl transition-all duration-300 md:p-5 p-4',
          containerAccentClass,
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <p className={cn("text-[11px] font-semibold uppercase tracking-[0.18em] md:text-[12px]", labelColorClass)}>
              {label}
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <h4 className={cn("text-xl font-black tracking-[-0.04em] md:text-2xl", valueColorClass)}>
                {value}
              </h4>
              {delta !== undefined && (
                <div
                  className={cn('text-[12px] font-semibold flex items-center gap-0.5', deltaOverrideColor || deltaColor)}
                >
                  {deltaType === 'increase' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {delta}%
                </div>
              )}
            </div>
          </div>
          {icon && (
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl md:h-11 md:w-11 transition-all duration-300',
                iconOverrideClass || iconBgColors[color] || iconBgColors.indigo,
              )}
            >
              {icon}
            </div>
          )}
        </div>
      </div>
    );
  },
);

KpiTile.displayName = 'KpiTile';

