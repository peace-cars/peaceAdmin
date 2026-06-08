import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TrendingUp, TrendingDown } from 'lucide-react';

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

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-3xl border border-border-subtle/70 bg-surface-card/95 p-4 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)] backdrop-blur-xl transition-all md:p-5',
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted md:text-[12px]">
              {label}
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <h4 className="text-xl font-black tracking-[-0.04em] text-text-main md:text-2xl">
                {value}
              </h4>
              {delta !== undefined && (
                <div
                  className={cn('text-[12px] font-semibold flex items-center gap-0.5', deltaColor)}
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
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl md:h-11 md:w-11',
                iconBgColors[color] || iconBgColors.indigo,
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
