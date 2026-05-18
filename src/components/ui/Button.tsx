import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-primary-main text-[#FFFFFF] hover:bg-primary-dark shadow-sm active:brightness-90',
      secondary: 'bg-surface-hover text-text-main hover:bg-border-subtle active:scale-[0.97]',
      outline: 'bg-transparent border border-border-strong text-text-secondary hover:bg-surface-hover active:scale-[0.97]',
      ghost: 'bg-transparent text-text-muted hover:bg-surface-hover hover:text-text-main active:scale-[0.97]',
      danger: 'bg-error/10 text-error border border-error/20 hover:bg-error hover:text-[#FFFFFF] active:scale-[0.97]',
    };

    const sizes = {
      sm: 'px-4 h-9 text-[13px] rounded-xl',
      md: 'px-5 h-11 text-[14px] rounded-xl',
      lg: 'px-8 h-12 text-[15px] rounded-2xl',
      icon: 'p-2.5 rounded-xl',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary-main/30 disabled:opacity-50 disabled:pointer-events-none gap-2',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
