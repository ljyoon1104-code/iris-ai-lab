import React, { useState } from 'react';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { Modal } from '../common/Modal';

export interface ChecklistItem {
  id: string;
  label: string;
  isCompleted: boolean;
}

interface ActivityChecklistProps {
  title?: string;
  items: ChecklistItem[];
  onProceedNext: () => void;
  isLastStep?: boolean;
}

export const ActivityChecklist: React.FC<ActivityChecklistProps> = ({
  title = '이번 활동에서 해볼 것',
  items,
  onProceedNext,
  isLastStep = false,
}) => {
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);

  const completedCount = items.filter(i => i.isCompleted).length;

  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs">
      <div className="flex items-center justify-between font-extrabold text-slate-900">
        <span className="flex items-center gap-1.5 text-sm">
          <Sparkles size={16} className="text-emerald-600" />
          <span>[{title}]</span>
        </span>
        <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
          {completedCount} / {items.length} 완료
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-medium text-slate-700">
        {items.map(item => (
          <div
            key={item.id}
            className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
              item.isCompleted
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold'
                : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            {item.isCompleted ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <Circle size={16} className="text-slate-400 shrink-0" />
            )}
            <span className="truncate">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Gentle warning modal if items are uncompleted */}
      <Modal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        title="활동 확인 안내"
      >
        <div className="space-y-4 text-xs text-slate-700">
          <p className="font-bold text-slate-900 leading-relaxed text-sm">
            💡 아직 확인하지 않은 주요 추천 활동이 있습니다.
          </p>
          <p className="text-slate-600 leading-relaxed">
            더 깊이 있는 관찰을 위해 체크리스트 항목을 먼저 확인해볼 수 있습니다. 지금 바로 다음으로 이동하시겠습니까?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsPromptModalOpen(false)}
              className="px-4 py-2.5 font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer min-h-[44px]"
            >
              계속 살펴보기
            </button>
            <button
              onClick={() => {
                setIsPromptModalOpen(false);
                onProceedNext();
              }}
              className="px-4 py-2.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer min-h-[44px]"
            >
              {isLastStep ? '완료하기' : '그래도 다음으로'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
