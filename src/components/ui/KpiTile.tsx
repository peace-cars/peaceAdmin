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

    const deltaColor = deltaType === 'increase' ? 'text-success' : deltaType === 'decrease' ? 'text-error' : 'text-text-muted';

    return (
      <div
        ref={ref}
        className={cn(
          'bg-surface-card rounded-2xl p-5 border border-border-subtle transition-all',
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-[13px] font-medium text-text-muted">{label}</p>
            <div className="flex items-center gap-2">
              <h4 className="text-2xl font-bold text-text-main tracking-tight">{value}</h4>
              {delta !== undefined && (
                <div className={cn('text-[12px] font-semibold flex items-center gap-0.5', deltaColor)}>
                  {deltaType === 'increase' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {delta}%
                </div>
              )}
            </div>
          </div>
          {icon && (
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', iconBgColors[color] || iconBgColors.indigo)}>
              {icon}
            </div>
          )}
        </div>
      </div>
    );
  }
);

KpiTile.displayName = 'KpiTile';
