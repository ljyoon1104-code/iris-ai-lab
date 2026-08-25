import React, { useState } from 'react';
import { ORIGINAL_IRIS_DATASET, SPECIES_MAP } from '../../data/irisDataset';
import {
  trainDecisionTree,
  traceDecisionPath,
  type DecisionTreeNode,
  type FeatureKey,
} from '../../algorithms/decisionTree';
import { GitBranch, Sliders, Eye, HelpCircle } from 'lucide-react';

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

  const [userObservationChoice, setUserObservationChoice] = useState<string | null>(null);

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
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-center text-xs font-bold text-emerald-950 shadow-xs">
          <span className="text-[10px] text-emerald-700 block font-mono">최종 예측 리프 노드</span>
          <span className="text-sm text-emerald-900 block font-extrabold">{SPECIES_MAP[node.predictedSpecies!].korean}</span>
          <span className="text-[10px] text-slate-500 block font-normal">(샘플 수: {node.samples}개)</span>
        </div>
      );
    }

    return (
      <div className="space-y-2 text-center text-xs">
        <div className="p-3 bg-teal-50 border border-teal-300 rounded-xl font-bold text-teal-950 inline-block shadow-xs">
          <span className="text-[10px] text-teal-700 block font-mono">분지 조건 노드 (깊이 {node.depth})</span>
          <span className="text-sm font-black block">
            {FEATURE_LABELS[node.feature!]} &le; {node.threshold}cm
          </span>
          <span className="text-[10px] text-slate-500 block font-normal">(샘플: {node.samples}개 / Gini: {node.gini.toFixed(3)})</span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-2 border-t-2 border-emerald-500 space-y-1">
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
              Yes (&le; {node.threshold}cm)
            </span>
            {node.left && renderTreeNode(node.left)}
          </div>
          <div className="p-2 border-t-2 border-rose-500 space-y-1">
            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
              No (&gt; {node.threshold}cm)
            </span>
            {node.right && renderTreeNode(node.right)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Overview Cards: What can I change? & What should I observe? */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="font-extrabold text-slate-900 block flex items-center gap-1.5">
            <Sliders size={16} className="text-teal-600" />
            <span>[무엇을 바꿀 수 있나요?]</span>
          </span>
          <p className="text-slate-600 leading-relaxed font-medium">
            트리의 <strong>최대 깊이 (maxDepth 2, 3, 4)</strong>와 붓꽃 측정 수치를 직접 조정할 수 있습니다.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="font-extrabold text-slate-900 block flex items-center gap-1.5">
            <Eye size={16} className="text-blue-600" />
            <span>[무엇을 관찰하면 되나요?]</span>
          </span>
          <p className="text-slate-600 leading-relaxed font-medium">
            깊이가 늘어날수록 생성되는 YES/NO 판단 규칙의 개수와 최종 예측 노드가 어떻게 분지되는지 관찰하세요.
          </p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <GitBranch size={20} className="text-teal-600" />
            <span>의사결정트리 (Decision Tree) 조건 및 깊이 설정</span>
          </h3>
        </div>

        <div className="space-y-2 text-xs">
          <span className="font-bold text-slate-700 block">최대 깊이 (maxDepth) 선택:</span>
          <div className="grid grid-cols-3 gap-2">
            {[2, 3, 4].map(d => (
              <button
                key={d}
                onClick={() => setMaxDepth(d)}
                className={`p-3 rounded-xl font-bold transition-all min-h-[44px] cursor-pointer ${
                  maxDepth === d
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                깊이 {d} ({d === 2 ? '단순' : d === 3 ? '보통' : '복잡'})
              </button>
            ))}
          </div>
        </div>

        {/* Input sliders for New Data Point */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
          <span className="font-extrabold text-slate-900 block">
            새로운 붓꽃 데이터 수치 조절:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map(feat => {
              const spec = FEATURE_MIN_MAX[feat];
              const val = newPoint[feat];

              return (
                <div key={feat} className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>{FEATURE_LABELS[feat]}</span>
                    <span className="font-mono text-teal-700 font-black">{val} cm</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAdjustValue(feat, -0.2)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded font-mono font-bold text-xs cursor-pointer min-h-[36px]"
                    >
                      -0.2
                    </button>
                    <input
                      type="range"
                      min={spec.min}
                      max={spec.max}
                      step={spec.step}
                      value={val}
                      onChange={e => {
                        const nV = parseFloat(e.target.value);
                        setNewPoint(prev => ({ ...prev, [feat]: nV }));
                      }}
                      className="w-full accent-teal-600 cursor-pointer"
                    />
                    <button
                      onClick={() => handleAdjustValue(feat, 0.2)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded font-mono font-bold text-xs cursor-pointer min-h-[36px]"
                    >
                      +0.2
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Prediction Path Card */}
        <div className="p-4 bg-teal-600 text-white rounded-xl space-y-2 text-xs shadow-xs">
          <div className="flex items-center justify-between border-b border-teal-500 pb-2 font-bold">
            <span>추론 규칙 이동 경로 (Decision Path)</span>
            <span className="text-teal-200 font-mono">깊이 {maxDepth}</span>
          </div>

          <div className="space-y-1">
            <span className="text-teal-100 text-[11px] block">통과한 조건 단계:</span>
            <div className="space-y-1 font-mono text-[11px]">
              {trace.steps.map((s, idx) => (
                <div key={idx} className="bg-teal-700/60 p-2 rounded border border-teal-500">
                  {s.stepNumber}단계: {s.featureLabel} ({s.value}cm) {s.conditionMet ? '≤' : '>'} {s.threshold}cm ➔ {s.nextDescription}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-teal-500 flex items-center justify-between">
            <span className="text-teal-100 font-bold">최종 판단 품종:</span>
            <span className="text-xl font-black text-white">{SPECIES_MAP[trace.predictedSpecies].korean}</span>
          </div>
        </div>

        {/* Tree Visual Area */}
        <div className="space-y-2 text-xs">
          <span className="font-bold text-slate-800 block">생성된 의사결정트리 구조</span>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl overflow-x-auto">
            {renderTreeNode(tree)}
          </div>
        </div>

        {/* Observation Question Card (Section 5) */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
          <span className="font-extrabold text-slate-900 block text-sm flex items-center gap-1.5">
            <HelpCircle size={16} className="text-teal-600" />
            <span>[핵심 관찰 질문] 의사결정트리의 깊이와 규칙의 관계</span>
          </span>

          <p className="text-slate-700 font-medium leading-relaxed">
            질문: <strong>트리의 깊이가 깊어질수록 판단 규칙은 단순해질까요, 복잡해질까요?</strong>
          </p>

          <div className="space-y-2">
            {[
              {
                key: 'ans1',
                label: '트리의 깊이가 깊어질수록 더 많은 판단 질문(분지 규칙)이 추가되어 모델이 복잡해집니다.',
              },
              {
                key: 'ans2',
                label: '트리의 깊이가 깊어질수록 조건 질문이 적어져 판단 규칙이 더 단순해집니다.',
              },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => setUserObservationChoice(opt.key)}
                className={`w-full text-left p-3 rounded-xl border font-bold transition-all min-h-[44px] cursor-pointer ${
                  userObservationChoice === opt.key
                    ? opt.key === 'ans1'
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {userObservationChoice && (
            <div
              className={`p-3 rounded-lg text-xs leading-relaxed animate-fadeIn ${
                userObservationChoice === 'ans1'
                  ? 'bg-teal-50 text-teal-950 border border-teal-200'
                  : 'bg-rose-50 text-rose-950 border border-rose-200'
              }`}
            >
              {userObservationChoice === 'ans1' ? (
                <span>
                  ✓ <strong>정답입니다!</strong> 트리의 깊이(maxDepth)가 커지면 세부 조건을 계속 물어보게 되어 판단 구조가 더욱 정밀해지고 복잡해집니다.
                </span>
              ) : (
                <span>
                  X 다시 확인해보세요. 깊이가 2일 때는 조건이 2~3개에 불과하지만, 깊이가 4로 깊어지면 훨씬 더 많은 YES/NO 질문 가지가 생겨 복잡해집니다.
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
