import React, { useState } from 'react';
import { Flower2, Menu, RotateCcw } from 'lucide-react';
import { Modal } from './Modal';
import { MobileMenuDrawer } from './MobileMenuDrawer';

interface HeaderProps {
  progressPercent: number;
  completedModuleIds: number[];
  onSelectModule: (id: number) => void;
  onGoHome: () => void;
  onResetProgress: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  progressPercent,
  completedModuleIds,
  onSelectModule,
  onGoHome,
  onResetProgress,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetCompleteNoticeOpen, setIsResetCompleteNoticeOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-2.5 text-slate-900 font-extrabold text-lg sm:text-xl tracking-tight hover:opacity-90 transition-opacity cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg p-1"
          aria-label="Iris AI Lab 홈으로 이동"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Flower2 size={22} className="stroke-[2.2]" />
          </div>
          <span className="flex items-center gap-1.5">
            <span>Iris AI Lab</span>
            <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
              붓꽃 데이터 기계학습
            </span>
          </span>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Header Progress Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
            <span>진행률</span>
            <span className="text-emerald-700 font-bold">{progressPercent}%</span>
          </div>

          {/* Reset progress button */}
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            title="학습 기록 초기화"
            aria-label="학습 기록 초기화"
          >
            <RotateCcw size={18} />
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="학습 메뉴 열기"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <MobileMenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        completedModuleIds={completedModuleIds}
        onSelectModule={onSelectModule}
        progressPercent={progressPercent}
      />


      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        title="학습기록을 초기화할까요?"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            학습 진행률과 저장된 실험기록이 모두 삭제됩니다.<br />
            삭제한 기록은 복구할 수 없습니다.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsResetConfirmOpen(false)}
              className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer min-h-[44px]"
            >
              취소
            </button>
            <button
              onClick={() => {
                onResetProgress();
                setIsResetConfirmOpen(false);
                setIsResetCompleteNoticeOpen(true);
              }}
              className="px-4 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer min-h-[44px]"
            >
              모두 초기화
            </button>
          </div>
        </div>
      </Modal>

      {/* Reset Completion Notice Modal */}
      <Modal
        isOpen={isResetCompleteNoticeOpen}
        onClose={() => setIsResetCompleteNoticeOpen(false)}
        title="초기화 완료"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700 font-bold leading-relaxed">
            학습 진행률과 실험기록을 모두 초기화했습니다.
          </p>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setIsResetCompleteNoticeOpen(false)}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer min-h-[44px]"
            >
              확인
            </button>
          </div>
        </div>
      </Modal>
    </header>
  );
};
