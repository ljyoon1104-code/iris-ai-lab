import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface ChoiceCardProps {
  optionKey: string;
  label: string;
  subText?: string;
  isSelected: boolean;
  status?: 'default' | 'correct' | 'incorrect';
  onClick: () => void;
  disabled?: boolean;
}

export const ChoiceCard: React.FC<ChoiceCardProps> = ({
  optionKey,
  label,
  subText,
  isSelected,
  status = 'default',
  onClick,
  disabled = false,
}) => {
  let borderClasses = 'border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40';
  let badgeClasses = 'bg-slate-100 text-slate-700';

  if (isSelected) {
    borderClasses = 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20';
    badgeClasses = 'bg-emerald-600 text-white';
  }

  if (status === 'correct') {
    borderClasses = 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/30';
    badgeClasses = 'bg-emerald-600 text-white';
  } else if (status === 'incorrect') {
    borderClasses = 'border-rose-300 bg-rose-50 text-rose-950';
    badgeClasses = 'bg-rose-600 text-white';
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer min-h-[52px] flex flex-col sm:flex-row sm:items-start justify-between gap-3 max-w-full ${borderClasses} ${
        disabled ? 'opacity-80 cursor-default' : ''
      }`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <span className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${badgeClasses}`}>
          {optionKey}
        </span>
        <div className="space-y-1 min-w-0">
          <p className="text-xs sm:text-sm font-bold leading-snug break-words [word-break:keep-all]">{label}</p>
          {subText && <p className="text-xs text-slate-500 font-normal leading-relaxed break-words [word-break:keep-all]">{subText}</p>}
        </div>
      </div>

      {status === 'correct' && (
        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 shrink-0 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300 self-start sm:self-auto">
          <CheckCircle2 size={15} />
          <span>✓ 정답입니다</span>
        </span>
      )}

      {status === 'incorrect' && (
        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-rose-700 shrink-0 bg-rose-100 px-2.5 py-1 rounded-full border border-rose-300 self-start sm:self-auto">
          <XCircle size={15} />
          <span>X 다시 생각해보세요</span>
        </span>
      )}
    </button>
  );
};
