import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  label?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label = '학습 진행도',
  showText = true,
  size = 'md',
  className = '',
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const heightClasses = {
    sm: 'h-2',
    md: 'h-3.5',
    lg: 'h-5',
  };

  return (
    <div className={`w-full ${className}`}>
      {showText && (
        <div className="flex justify-between items-center mb-1.5 text-sm font-semibold text-slate-700">
          <span>{label}</span>
          <span className="text-emerald-700 font-bold">{clampedProgress}%</span>
        </div>
      )}
      <div
        className={`w-full bg-slate-200 rounded-full overflow-hidden ${heightClasses[size]}`}
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} ${clampedProgress}%`}
      >
        <div
          className="bg-emerald-500 h-full rounded-full transition-all duration-300 ease-out shadow-inner"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};
