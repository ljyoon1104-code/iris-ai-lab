import React from 'react';
import { Database, AlertTriangle } from 'lucide-react';

export interface LabDataStatusBadgeProps {
  totalCount: number;
  usableCount: number;
  excludedCount: number;
}

export const LabDataStatusBadge: React.FC<LabDataStatusBadgeProps> = ({
  totalCount,
  usableCount,
  excludedCount,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono">
      <div className="flex items-center gap-2">
        <Database size={14} className="text-slate-600 shrink-0" />
        <span className="font-sans font-extrabold text-slate-800">[현재 Prepared Dataset]</span>
        <span className="font-bold text-slate-700">
          사용 가능: <strong className="text-emerald-700 font-black">{usableCount}</strong> / {totalCount}
        </span>
        {excludedCount > 0 && (
          <span className="text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-bold border border-amber-200">
            분석 제외: {excludedCount}
          </span>
        )}
      </div>

      {excludedCount > 0 && (
        <span className="text-[11px] font-sans text-amber-800 font-medium flex items-center gap-1">
          <AlertTriangle size={12} className="text-amber-600 shrink-0" />
          <span>수치로 계산할 수 없거나 현재 알고리즘에 필요한 형태가 아닌 데이터는 이 실험에서 제외됩니다.</span>
        </span>
      )}
    </div>
  );
};
