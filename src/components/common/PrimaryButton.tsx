import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'white';
  icon?: React.ReactNode;
}

export const PrimaryButton: React.FC<ButtonProps> = ({
  children,
  fullWidth = false,
  size = 'md',
  variant = 'primary',
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3.5 py-2 text-xs sm:text-sm font-medium',
    md: 'px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base font-semibold',
    lg: 'px-5 sm:px-6 py-3 sm:py-4 text-base sm:text-lg font-bold',
  };

  const variantClasses = {
    primary:
      'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 active:bg-emerald-800 focus-visible:ring-emerald-500 disabled:bg-slate-300 disabled:text-slate-500',
    white:
      'bg-white text-emerald-950 shadow-md hover:bg-emerald-50 hover:text-emerald-950 active:bg-emerald-100 active:text-emerald-950 focus-visible:ring-white disabled:bg-slate-200 disabled:text-slate-400',
  };

  return (
    <button
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl
        transition-all duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        disabled:cursor-not-allowed disabled:shadow-none
        min-h-[44px] cursor-pointer max-w-full
        ${fullWidth ? 'w-full' : ''}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="min-w-0 break-words [word-break:keep-all] text-center leading-tight whitespace-normal">
        {children}
      </span>
    </button>
  );
};
