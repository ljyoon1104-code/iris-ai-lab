import React from 'react';

interface ActivityProgressProps {
  currentStep: number;
  totalSteps: number;
  title: string;
}

export const ActivityProgress: React.FC<ActivityProgressProps> = ({
  currentStep,
  totalSteps,
  title,
}) => {
  const percentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="bg-slate-100 rounded-xl p-3 border border-slate-200 mb-5">
      <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
        <span className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
          <span className="shrink-0">활동 진행도</span>
          <span className="text-slate-400 font-normal hidden sm:inline">|</span>
          <span className="text-slate-900 break-words [word-break:keep-all] min-w-0">{title}</span>
        </span>
        <span className="text-emerald-700 font-extrabold shrink-0">{currentStep} / {totalSteps} 단계</span>
      </div>
      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
        <div
          className="bg-emerald-600 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
