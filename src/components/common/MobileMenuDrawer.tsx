import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, Flower2 } from 'lucide-react';
import { MODULES } from '../../data/modules';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  completedModuleIds: number[];
  onSelectModule: (id: number) => void;
  progressPercent?: number;
}

export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({
  isOpen,
  onClose,
  completedModuleIds,
  onSelectModule,
  progressPercent,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    // Body scroll lock
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Escape key handler
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Desktop breakpoint resize listener (>= 768px)
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      {/* Viewport Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel decoupled from Header Stacking Context */}
      <aside
        className="relative z-50 w-full max-w-sm sm:max-w-md bg-white h-[100dvh] max-h-[100dvh] flex flex-col shadow-2xl pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Flower2 size={18} className="stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 truncate">Iris AI Lab 메뉴</h2>
              {progressPercent !== undefined && (
                <p className="text-xs text-slate-500 font-medium">
                  전체 진행률: <span className="text-emerald-700 font-bold">{progressPercent}%</span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer shrink-0"
            aria-label="메뉴 닫기"
          >
            <X size={22} />
          </button>
        </div>

        {/* Drawer Body - Scrollable Area */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">학습 영역 목록</h3>
            <p className="text-xs text-slate-500 font-medium">원하는 학습 영역으로 바로 이동할 수 있습니다.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {MODULES.map(mod => {
              const isCompleted = completedModuleIds.includes(mod.id);
              return (
                <button
                  key={mod.id}
                  onClick={() => {
                    onSelectModule(mod.id);
                    onClose();
                  }}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all cursor-pointer min-h-[48px] min-w-0 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      {mod.code}
                    </span>
                    <span className="font-semibold text-sm text-slate-800 min-w-0 whitespace-normal break-words [word-break:keep-all]">
                      {mod.title}
                    </span>
                  </div>
                  {isCompleted ? (
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  ) : (
                    <span className="text-xs text-slate-400 shrink-0">대기</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </div>,
    document.body
  );
};
