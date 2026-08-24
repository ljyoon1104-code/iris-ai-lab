import React, { useState } from 'react';
import { ORIGINAL_IRIS_DATASET, SPECIES_MAP } from '../../data/irisDataset';
import {
  trainDecisionTree,
  traceDecisionPath,
  type DecisionTreeNode,
  type FeatureKey,
} from '../../algorithms/decisionTree';
import { GitBranch } from 'lucide-react';

const FEATURE_LABELS: Record<FeatureKey, string> = {
  sepalLength: '꽃받침 길이 (cm)',
  sepalWidth: '꽃받침 너비 (cm)',
  petalLength: '꽃잎 길이 (cm)',
  petalWidth: '꽃잎 너비 (cm)',
};

const FEATURE_MIN_MAX: Record<FeatureKey, { min: number; max: number; step: number }> = {
  sepalLength: { min: 4.0, max: 8.0, step: 0.1 },
  sepalWidth: { min: 2.0, max: 4.5, step: 0.1 },
  petalLength: { min: 1.0, max: 7.0, step: 0.1 },
  petalWidth: { min: 0.1, max: 2.5, step: 0.1 },
};

export const DecisionTreeLab: React.FC = () => {
  const [maxDepth, setMaxDepth] = useState<number>(3);
  const [newPoint, setNewPoint] = useState<Record<FeatureKey, number>>({
    sepalLength: 6.0,
    sepalWidth: 3.0,
    petalLength: 4.8,
    petalWidth: 1.6,
  });

  const features: FeatureKey[] = ['sepalLength', 'sepalWidth', 'petalLength', 'petalWidth'];
  const tree = trainDecisionTree(ORIGINAL_IRIS_DATASET, features, maxDepth);
  const trace = traceDecisionPath(tree, newPoint);

  const handleAdjustValue = (feat: FeatureKey, delta: number) => {
    const spec = FEATURE_MIN_MAX[feat];
    setNewPoint(prev => {
      const nextVal = Math.round((prev[feat] + delta) * 10) / 10;
      const clamped = Math.min(spec.max, Math.max(spec.min, nextVal));
      return { ...prev, [feat]: clamped };
    });
  };

  // Render tree node recursively
  const renderTreeNode = (node: DecisionTreeNode) => {
    if (node.isLeaf) {
      return (
        <div className="p-3 rounded-xl bg-emerald-600 text-white text-center font-bold text-xs space-y-1 shadow-xs border border-emerald-700">
          <span className="block text-[11px] text-emerald-200">리프 노드 (최종 판정)</span>
          <span className="text-sm block">{SPECIES_MAP[node.predictedSpecies!].korean}</span>
          <span className="text-[10px] text-emerald-100 block">샘플 수: {node.samples}개</span>
        </div>
      );
    }

    return (
      <div className="p-3 rounded-xl bg-slate-900 text-white text-center text-xs space-y-1.5 shadow-xs border border-slate-700">
        <span className="font-bold text-amber-300 block">
          {FEATURE_LABELS[node.feature!]} ≤ {node.threshold} cm ?
        </span>
        <span className="text-[10px] text-slate-400 block">
          Gini: {node.gini} | 샘플: {node.samples}개
        </span>
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
          <div className="space-y-1">
            <span className="font-bold text-emerald-400 block">Yes (≤)</span>
            {node.left && renderTreeNode(node.left)}
          </div>
          <div className="space-y-1">
            <span className="font-bold text-cyan-400 block">No (&gt;)</span>
            {node.right && renderTreeNode(node.right)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 text-xs text-teal-950 space-y-1">
        <span className="font-extrabold text-sm text-teal-900 block flex items-center gap-1.5">
          <GitBranch size={18} className="text-teal-600" />
          <span>의사결정트리 (Decision Tree) 조건 분기 시뮬레이터</span>
        </span>
        <p className="leading-relaxed">
          데이터 속성값을 조건과 하나씩 비교하며 나무의 가지(Branch)를 따라 이동하여 최종 붓꽃 품종을 판정합니다.
        </p>
      </div>

      {/* Inputs & Controls Panel */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        {/* Depth Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-900">트리 최대 깊이 (maxDepth) 설정:</span>
          <div className="flex gap-2">
            {[2, 3, 4].map(depth => (
              <button
                key={depth}
                onClick={() => setMaxDepth(depth)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all min-h-[44px] cursor-pointer ${
                  maxDepth === depth
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                깊이 {depth}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Inputs */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-900 block">새 붓꽃 4가지 수치 속성값 설정:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map(f => (
              <div key={f} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">{FEATURE_LABELS[f]}</span>
                  <span className="font-extrabold text-teal-900 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono">
                    {newPoint[f]} cm
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAdjustValue(f, -0.1)}
                    className="w-10 h-10 bg-white border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer text-base"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min={FEATURE_MIN_MAX[f].min}
                    max={FEATURE_MIN_MAX[f].max}
                    step={FEATURE_MIN_MAX[f].step}
                    value={newPoint[f]}
                    onChange={e =>
                      setNewPoint(prev => ({ ...prev, [f]: parseFloat(e.target.value) }))
                    }
                    className="w-full accent-teal-600 min-h-[44px]"
                  />
                  <button
                    onClick={() => handleAdjustValue(f, 0.1)}
                    className="w-10 h-10 bg-white border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer text-base"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Decision Path Cards (Mobile Friendly) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <span className="text-xs font-extrabold text-slate-900 block flex items-center gap-1.5">
          <GitBranch size={16} className="text-teal-600" />
          <span>새 붓꽃의 의사결정 경로 (Decision Path Trace)</span>
        </span>

        <div className="space-y-3 text-xs">
          {trace.steps.map(step => (
            <div
              key={step.stepNumber}
              className={`p-3.5 rounded-xl border-2 transition-all space-y-1 ${
                step.conditionMet
                  ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950'
                  : 'border-cyan-500 bg-cyan-50/70 text-cyan-950'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span>
                  {step.stepNumber}단계 조건: {step.featureLabel} ({step.value} cm) ≤ {step.threshold} cm ?
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-extrabold text-[11px] ${
                    step.conditionMet
                      ? 'bg-emerald-600 text-white'
                      : 'bg-cyan-600 text-white'
                  }`}
                >
                  {step.conditionMet ? '예 (Yes)' : '아니오 (No)'}
                </span>
              </div>
              <p className="text-[11px] font-medium leading-relaxed">{step.nextDescription}</p>
            </div>
          ))}

          {/* Final Leaf Result */}
          <div className="p-4 rounded-xl bg-teal-700 text-white shadow-xs space-y-1">
            <span className="font-extrabold text-base block">
              최종 예측: {SPECIES_MAP[trace.predictedSpecies].korean} ({trace.predictedSpecies})
            </span>
            <p className="text-teal-100 text-[11px]">
              {trace.steps.length}개 조건 가지를 거쳐 최종 품종으로 판정되었습니다.
            </p>
          </div>
        </div>
      </div>

      {/* Tree Visualization Box */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-slate-900">의사결정트리 전체 구조 (maxDepth = {maxDepth})</span>
          <span className="text-slate-500">Gini 불순도 기준 지능형 분기</span>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl overflow-x-auto">
          {renderTreeNode(tree)}
        </div>
      </div>

      {/* Observation Reflection Question Card */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs space-y-2 shadow-xs">
        <span className="font-extrabold text-teal-300 block text-sm flex items-center gap-1.5">
          🧐 생각하기 (관찰 질문)
        </span>
        <p className="font-bold text-slate-100">
          "새 붓꽃의 품종을 결정할 때 어떤 속성 조건들을 차례로 확인했나요?"
        </p>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          💡 트리의 깊이가 깊어지면 데이터를 더 세밀하게 나누지만, 조건이 너무 복잡해진 모델이 언제나 가장 좋은 것은 아닙니다.
        </p>
      </div>
    </div>
  );
};
