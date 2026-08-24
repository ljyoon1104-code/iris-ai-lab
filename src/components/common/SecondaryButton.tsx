import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'secondary' | 'white-outline';
  icon?: React.ReactNode;
}

export const SecondaryButton: React.FC<ButtonProps> = ({
  children,
  fullWidth = false,
  size = 'md',
  variant = 'secondary',
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm font-medium',
    md: 'px-5 py-3 text-base font-semibold',
    lg: 'px-6 py-4 text-lg font-bold',
  };

  const variantClasses = {
    secondary:
      'bg-white border-2 border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 active:bg-slate-100 focus-visible:ring-slate-400 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400',
    'white-outline':
      'bg-white/15 border-2 border-white/40 text-white shadow-sm hover:bg-white/25 hover:border-white/60 hover:text-white active:bg-white/30 focus-visible:ring-white disabled:bg-white/5 disabled:border-white/20 disabled:text-white/40 font-bold',
  };

  return (
    <button
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl
        transition-all duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        disabled:cursor-not-allowed disabled:shadow-none
        min-h-[48px] cursor-pointer
        ${fullWidth ? 'w-full' : ''}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
