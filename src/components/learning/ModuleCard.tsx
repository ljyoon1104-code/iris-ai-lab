import React from 'react';
import type { ModuleInfo } from '../../types';
import {
  Bot,
  Sparkles,
  Database,
  Search,
  Layers,
  Cpu,
  Wrench,
  BarChart3,
  ChevronRight,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface ModuleCardProps {
  module: ModuleInfo;
  isCompleted: boolean;
  onSelect: (id: number) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Bot: <Bot size={22} />,
  Sparkles: <Sparkles size={22} />,
  Database: <Database size={22} />,
  Search: <Search size={22} />,
  Layers: <Layers size={22} />,
  Cpu: <Cpu size={22} />,
  Wrench: <Wrench size={22} />,
  BarChart3: <BarChart3 size={22} />,
};

export const ModuleCard: React.FC<ModuleCardProps> = ({ module, isCompleted, onSelect }) => {
  const icon = ICON_MAP[module.iconName] || <Sparkles size={22} />;

  return (
    <div
      onClick={() => onSelect(module.id)}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(module.id);
        }
      }}
      aria-label={`${module.code} ${module.title} 영역 학습 시작하기`}
      className="group relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-500/60 transition-all duration-200 cursor-pointer flex flex-col justify-between focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <div>
        {/* Card Header: Code Badge & Status */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center font-extrabold text-xs tracking-wider px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
              {module.code}
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors shrink-0">
              {icon}
            </div>
          </div>

          {/* Status badge: text + icon */}
          {isCompleted ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              <CheckCircle2 size={13} />
              <span>완료</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
              <Clock size={13} />
              <span>학습 전</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors mb-1.5 break-words [word-break:keep-all]">
          {module.title}
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal break-words [word-break:keep-all]">
          {module.shortDesc}
        </p>
      </div>

      {/* Card Footer: Action Indicator */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500 group-hover:text-emerald-600">
        <span>약 {module.estimatedMinutes}분 소요</span>
        <span className="flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
          <span>학습하기</span>
          <ChevronRight size={16} />
        </span>
      </div>
    </div>
  );
};
