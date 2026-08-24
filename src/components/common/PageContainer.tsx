import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children, className = '' }) => {
  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 text-slate-900`}>
      <main className={`flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 safe-padding-bottom ${className}`}>
        {children}
      </main>
    </div>
  );
};
