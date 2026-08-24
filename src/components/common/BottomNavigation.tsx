import React from 'react';
import { Home, Play, Workflow, HelpCircle } from 'lucide-react';

interface BottomNavigationProps {
  currentModuleId: number | null;
  onGoHome: () => void;
  onGoCurrentModule: () => void;
  onOpenWorkflow: () => void;
  onOpenHelp: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentModuleId,
  onGoHome,
  onGoCurrentModule,
  onOpenWorkflow,
  onOpenHelp,
}) => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg"
      aria-label="하단 주 메뉴"
    >
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around">
        <button
          onClick={onGoHome}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors cursor-pointer ${
            currentModuleId === null
              ? 'text-emerald-700 bg-emerald-50 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="홈 학습 목록으로 이동"
        >
          <Home size={20} />
          <span className="text-[11px] mt-0.5 font-medium">홈 목록</span>
        </button>

        <button
          onClick={onGoCurrentModule}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors cursor-pointer ${
            currentModuleId !== null
              ? 'text-emerald-700 bg-emerald-50 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="현재 선택된 학습 영역으로 이동"
        >
          <Play size={20} />
          <span className="text-[11px] mt-0.5 font-medium">학습실</span>
        </button>

        <button
          onClick={onOpenWorkflow}
          className="flex flex-col items-center justify-center w-16 h-12 rounded-xl text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          aria-label="머신러닝 6단계 가이드 보기"
        >
          <Workflow size={20} />
          <span className="text-[11px] mt-0.5 font-medium">ML 6단계</span>
        </button>

        <button
          onClick={onOpenHelp}
          className="flex flex-col items-center justify-center w-16 h-12 rounded-xl text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          aria-label="앱 이용 가이드 보기"
        >
          <HelpCircle size={20} />
          <span className="text-[11px] mt-0.5 font-medium">도움말</span>
        </button>
      </div>
    </nav>
  );
};
