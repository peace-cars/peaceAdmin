import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CommonProps {
  label?: string;
  error?: string;
  className?: string;
}

interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>, CommonProps {
  icon?: React.ReactNode;
  onChange?: (value: string) => void;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, icon, className, onChange, value, ...props }, ref) => {
    return (
      <div className={cn("space-y-1.5 w-full", className)}>
        {label && <label className="text-[13px] font-medium text-text-secondary ml-0.5">{label}</label>}
        <div className="relative group/field">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within/field:text-primary-main">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            value={value ?? ""}
            onChange={(e) => onChange?.(e.target.value)}
            className={cn(
              "w-full bg-surface-card border border-border-subtle rounded-xl h-12 px-4 text-[15px] text-text-main placeholder:text-text-dim focus:outline-none focus:border-primary-main focus:ring-2 focus:ring-primary-main/15 transition-all",
              icon && "pl-12",
              error && "border-error focus:border-error focus:ring-error/15",
            )}
            {...props}
          />
        </div>
        {error && <p className="text-[12px] text-error font-medium ml-0.5">{error}</p>}
      </div>
    );
  }
);

interface TextAreaFieldProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'>, CommonProps {
  onChange?: (value: string) => void;
}

export const TextAreaField = React.forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ label, error, className, onChange, value, ...props }, ref) => {
    return (
      <div className={cn("space-y-1.5 w-full", className)}>
        {label && <label className="text-[13px] font-medium text-text-secondary ml-0.5">{label}</label>}
        <textarea
          ref={ref}
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn(
            "w-full bg-surface-card border border-border-subtle rounded-xl py-3 px-4 text-[15px] text-text-main placeholder:text-text-dim focus:outline-none focus:border-primary-main focus:ring-2 focus:ring-primary-main/15 transition-all min-h-[120px] resize-none",
            error && "border-error focus:border-error focus:ring-error/15",
          )}
          {...props}
        />
        {error && <p className="text-[12px] text-error font-medium ml-0.5">{error}</p>}
      </div>
    );
  }
);

interface SelectFieldProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'>, CommonProps {
  options: (string | { value: string; label: string })[];
  onChange?: (value: string) => void;
}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, options, className, value, onChange, ...props }, ref) => {
    const standardizedOptions = options.map(opt => 
      typeof opt === 'string' ? { value: opt, label: opt } : opt
    );

    return (
      <div className={cn("space-y-1.5 w-full", className)}>
        {label && <label className="text-[13px] font-medium text-text-secondary ml-0.5">{label}</label>}
        <div className="relative group/field">
          <select
            ref={ref}
            value={value ?? ""}
            onChange={(e) => onChange?.(e.target.value)}
            className={cn(
              "w-full bg-surface-card border border-border-subtle rounded-xl h-12 px-4 text-[15px] text-text-main focus:outline-none focus:border-primary-main focus:ring-2 focus:ring-primary-main/15 transition-all appearance-none cursor-pointer",
              error && "border-error focus:border-error focus:ring-error/15",
            )}
            {...props}
          >
            <option value="" disabled>Select {label || 'option'}</option>
            {standardizedOptions.map((opt, idx) => (
              <option key={`${opt.value}-${idx}`} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
        {error && <p className="text-[12px] text-error font-medium ml-0.5">{error}</p>}
      </div>
    );
  }
);

TextField.displayName = 'TextField';
TextAreaField.displayName = 'TextAreaField';
SelectField.displayName = 'SelectField';
