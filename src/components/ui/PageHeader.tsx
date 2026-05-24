import React from 'react';
import { cn } from '../../lib/utils';

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, subtitle, icon, actions, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col gap-4 mb-6',
          className
        )}
        {...props}
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="text-primary-main shrink-0">
                {React.cloneElement(icon as React.ReactElement, { size: 24, strokeWidth: 2 } as any)}
              </div>
            )}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-text-main tracking-tight">{title}</h1>
              {subtitle && <p className="text-[13px] text-text-muted leading-relaxed">{subtitle}</p>}
            </div>
          </div>
          {actions && (
            <div className="w-full md:w-auto shrink-0 mt-2 md:mt-0 overflow-x-auto no-scrollbar pb-1 -mb-1">
              {actions}
            </div>
          )}
        </div>
      </div>
    );
  }
);

PageHeader.displayName = 'PageHeader';
