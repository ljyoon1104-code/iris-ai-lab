import React from 'react';
import { ML_STEPS } from '../../data/modules';
import { CheckCircle2 } from 'lucide-react';

interface MLProcessBarProps {
  currentStepNumber?: number;
  className?: string;
}

export const MLProcessBar: React.FC<MLProcessBarProps> = ({ currentStepNumber, className = '' }) => {
  return (
    <div className={`bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs sm:text-sm font-bold text-slate-700 tracking-tight flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          기계학습 문제 해결 6단계 과정
        </h3>
        <span className="text-[11px] font-medium text-slate-500">고등학교 인공지능 기초 교육과정</span>
      </div>

      {/* Grid view for steps */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {ML_STEPS.map(step => {
          const isActive = currentStepNumber === step.stepNumber;
          const isPassed = currentStepNumber ? step.stepNumber < currentStepNumber : false;

          return (
            <div
              key={step.stepNumber}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                isActive
                  ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                  : isPassed
                  ? 'bg-slate-50 border-slate-200 opacity-90'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : isPassed
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Step {step.stepNumber}
                </span>
                {isPassed && <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />}
              </div>
              <p
                className={`text-xs font-bold truncate ${
                  isActive ? 'text-emerald-900' : 'text-slate-800'
                }`}
              >
                {step.title}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
