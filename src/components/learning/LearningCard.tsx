import React from 'react';

interface LearningCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export const LearningCard: React.FC<LearningCardProps> = ({
  title,
  subtitle,
  children,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4 pb-3 border-b border-slate-100">
          {title && <h3 className="text-lg font-bold text-slate-900">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};
