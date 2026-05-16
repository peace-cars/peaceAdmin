import React from 'react';
import { cn } from '../../lib/utils';

interface SectionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
}

export const SectionCard = React.forwardRef<HTMLDivElement, SectionCardProps>(
  ({ className, title, subtitle, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-surface-card rounded-2xl border border-border-subtle overflow-hidden',
          className
        )}
        {...props}
      >
        {(title || subtitle) && (
          <div className="px-5 py-4 border-b border-border-subtle">
            {title && <h3 className="text-[15px] font-semibold text-text-main">{title}</h3>}
            {subtitle && <p className="text-[13px] text-text-muted mt-0.5">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    );
  }
);

SectionCard.displayName = 'SectionCard';
