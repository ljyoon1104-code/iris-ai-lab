import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const SecondaryButton: React.FC<ButtonProps> = ({
  children,
  fullWidth = false,
  size = 'md',
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

  return (
    <button
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl
        bg-white border-2 border-slate-200 text-slate-700 shadow-sm transition-all duration-150
        hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 active:bg-slate-100 active:scale-[0.99]
        disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none
        min-h-[48px] cursor-pointer
        ${fullWidth ? 'w-full' : ''}
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
