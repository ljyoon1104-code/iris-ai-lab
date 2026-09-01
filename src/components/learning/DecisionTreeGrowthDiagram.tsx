import React from 'react';
import type { DecisionTreeNode, FeatureKey } from '../../algorithms/decisionTree';
import { SpeciesBadge } from '../common/SpeciesBadge';

const FEATURE_NAMES: Record<FeatureKey, string> = {
  sepalLength: '꽃받침 길이',
  sepalWidth: '꽃받침 너비',
  petalLength: '꽃잎 길이',
  petalWidth: '꽃잎 너비',
};

interface DecisionTreeGrowthDiagramProps {
  tree: DecisionTreeNode;
}

export const DecisionTreeGrowthDiagram: React.FC<DecisionTreeGrowthDiagramProps> = ({ tree }) => {
  if (tree.isLeaf) {
    const isPure = tree.gini === 0 || Object.values(tree.speciesDistribution).filter(v => v > 0).length <= 1;
    return (
      <div
        className={`p-3 rounded-xl border-2 text-center space-y-1.5 shadow-xs min-w-[125px] max-w-[165px] transition-all animate-fadeIn ${
          isPure
            ? 'border-emerald-500 bg-emerald-50/90 text-emerald-950 ring-2 ring-emerald-200'
            : 'border-slate-300 bg-slate-50 text-slate-800'
        }`}
      >
        <div className="flex items-center justify-center gap-1">
          {isPure ? (
            <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
              ✓ 분류 완료
            </span>
          ) : (
            <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded">
              리프 (깊이 도달)
            </span>
          )}
        </div>
        <div className="flex justify-center">
          <SpeciesBadge species={tree.predictedSpecies || 'Iris-setosa'} size="sm" />
        </div>
        <div className="text-[11px] font-bold text-slate-700">
          총 {tree.samples}개
        </div>
        <div className="flex justify-center gap-1.5 text-[9px] font-bold text-slate-600 pt-1 border-t border-slate-200">
          <span className="text-emerald-700">● {tree.speciesDistribution['Iris-setosa']}</span>
          <span className="text-orange-700">▲ {tree.speciesDistribution['Iris-versicolor']}</span>
          <span className="text-purple-700">■ {tree.speciesDistribution['Iris-virginica']}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center animate-fadeIn">
      {/* Question Decision Node */}
      <div className="p-3 rounded-xl border-2 border-teal-600 bg-white text-teal-950 text-center space-y-1 shadow-sm min-w-[150px] max-w-[210px] ring-2 ring-teal-100">
        <span className="text-[10px] font-black text-teal-700 uppercase tracking-wider block">
          판단 질문
        </span>
        <div className="text-xs font-black text-slate-900 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
          {FEATURE_NAMES[tree.feature!] || tree.feature} ≤ {tree.threshold} cm
        </div>
        <div className="text-[10px] font-bold text-slate-500">
          {tree.samples}개 데이터 분기
        </div>
      </div>

      {/* Children branches with connecting labels */}
      <div className="flex items-start gap-4 sm:gap-6 pt-3 relative">
        {/* Left branch */}
        {tree.left && (
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full mb-2 shadow-2xs">
              예 (≤ {tree.threshold})
            </span>
            <DecisionTreeGrowthDiagram tree={tree.left} />
          </div>
        )}

        {/* Right branch */}
        {tree.right && (
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-orange-800 bg-orange-100 border border-orange-300 px-2 py-0.5 rounded-full mb-2 shadow-2xs">
              아니오 (&gt; {tree.threshold})
            </span>
            <DecisionTreeGrowthDiagram tree={tree.right} />
          </div>
        )}
      </div>
    </div>
  );
};
