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
      <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          <span>활동 진행도</span>
          <span className="text-slate-400 font-normal">|</span>
          <span className="text-slate-900">{title}</span>
        </span>
        <span className="text-emerald-700 font-extrabold">{currentStep} / {totalSteps} 단계</span>
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
