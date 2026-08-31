import React, { useState } from 'react';
import { ORIGINAL_IRIS_DATASET, SPECIES_MAP } from '../../data/irisDataset';
import {
  trainDecisionTree,
  traceDecisionPath,
  type DecisionTreeNode,
  type FeatureKey,
} from '../../algorithms/decisionTree';
import { GitBranch, Sliders, Eye, HelpCircle, CheckCircle2, HelpCircle as QuestionIcon, ArrowDown, Sparkles } from 'lucide-react';

const FEATURE_LABELS: Record<FeatureKey, string> = {
  sepalLength: '꽃받침 길이',
  sepalWidth: '꽃받침 너비',
  petalLength: '꽃잎 길이',
  petalWidth: '꽃잎 너비',
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

  const handleDirectNumberInput = (feat: FeatureKey, rawVal: string) => {
    const spec = FEATURE_MIN_MAX[feat];
    const parsed = parseFloat(rawVal);
    if (!isNaN(parsed)) {
      const clamped = Math.min(spec.max, Math.max(spec.min, parsed));
      setNewPoint(prev => ({ ...prev, [feat]: Math.round(clamped * 10) / 10 }));
    }
  };

  const handleApplySample = (sampleType: 'setosa' | 'versicolor' | 'virginica') => {
    if (sampleType === 'setosa') {
      setNewPoint({ sepalLength: 5.1, sepalWidth: 3.5, petalLength: 1.4, petalWidth: 0.2 });
    } else if (sampleType === 'versicolor') {
      setNewPoint({ sepalLength: 5.7, sepalWidth: 2.8, petalLength: 4.1, petalWidth: 1.3 });
    } else {
      setNewPoint({ sepalLength: 6.3, sepalWidth: 3.3, petalLength: 6.0, petalWidth: 2.5 });
    }
  };

  const isNodeOnPath = (node: DecisionTreeNode, currentPoint: Record<FeatureKey, number>): boolean => {
    let curr: DecisionTreeNode | null | undefined = tree;
    while (curr) {
      if (curr === node) return true;
      if (curr.isLeaf) break;
      const val = currentPoint[curr.feature!];
      if (val <= curr.threshold!) {
        curr = curr.left;
      } else {
        curr = curr.right;
      }
    }
    return false;
  };

  const renderTreeNode = (node: DecisionTreeNode, isRoot: boolean = false) => {
    const onPath = isNodeOnPath(node, newPoint);

    if (node.isLeaf) {
      const spInfo = SPECIES_MAP[node.predictedSpecies!];
      const isSetosa = node.predictedSpecies === 'Iris-setosa';
      const isVersicolor = node.predictedSpecies === 'Iris-versicolor';

      const leafBg = isSetosa ? 'bg-emerald-50 border-emerald-400 text-emerald-950' : isVersicolor ? 'bg-blue-50 border-blue-400 text-blue-950' : 'bg-purple-50 border-purple-400 text-purple-950';

      return (
        <div className={`p-3.5 rounded-2xl border-2 text-center transition-all ${leafBg} ${
          onPath ? 'ring-4 ring-teal-500 shadow-md scale-105 font-black' : 'opacity-85 shadow-xs'
        }`}>
          <div className="flex items-center justify-center gap-1 mb-1">
            <CheckCircle2 size={14} className={isSetosa ? 'text-emerald-600' : isVersicolor ? 'text-blue-600' : 'text-purple-600'} />
            <span className="text-[10px] uppercase font-bold tracking-wider">C. 최종 예측 노드</span>
          </div>
          <span className="text-base font-black block">{spInfo.korean}</span>
          <span className="text-[10px] opacity-75 font-mono">({spInfo.english})</span>
          {onPath && (
            <div className="mt-1.5 px-2 py-0.5 bg-teal-600 text-white rounded-md text-[10px] font-bold">
              ✓ 현재 데이터의 최종 결론
            </div>
          )}
        </div>
      );
    }

    const featLabel = FEATURE_LABELS[node.feature!];
    const threshold = node.threshold!;
    const val = newPoint[node.feature!];
    const goesLeft = val <= threshold;

    return (
      <div className="flex flex-col items-center space-y-3">
        <div
          className={`p-3.5 rounded-2xl border-2 text-center transition-all min-w-[210px] max-w-[260px] ${
            isRoot
              ? 'bg-teal-700 text-white border-teal-800'
              : 'bg-teal-50 text-teal-950 border-teal-300'
          } ${
            onPath
              ? isRoot
                ? 'ring-4 ring-teal-300 shadow-md'
                : 'ring-4 ring-teal-500 shadow-md bg-teal-100 font-extrabold'
              : 'opacity-90 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5 mb-1 text-[10px] font-bold opacity-90">
            <QuestionIcon size={13} />
            <span>{isRoot ? 'A. 시작 질문 노드' : `B. 중간 판단 노드 (깊이 ${node.depth})`}</span>
          </div>

          <span className="text-xs font-black block leading-snug">
            "{featLabel}가 {threshold}cm 이하인가요?"
          </span>

          <div className={`mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-mono ${
            isRoot ? 'bg-teal-800 text-teal-100' : 'bg-teal-200 text-teal-900'
          }`}>
            {node.feature} ≤ {threshold}cm
          </div>

          {onPath && (
            <div className={`mt-1.5 text-[10px] font-bold rounded px-1.5 py-0.5 ${
              isRoot ? 'bg-amber-400 text-slate-950' : 'bg-teal-700 text-white'
            }`}>
              👉 현재 값: {val}cm ({goesLeft ? 'YES 가지로 이동' : 'NO 가지로 이동'})
            </div>
          )}
        </div>

        <div className="w-full grid grid-cols-2 gap-3 sm:gap-6 pt-1">
          <div className="flex flex-col items-center space-y-2">
            <div className="flex flex-col items-center">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border transition-all ${
                onPath && goesLeft
                  ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-300 shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 opacity-70'
              }`}>
                예 (≤ {threshold}cm)
              </span>
              <ArrowDown size={14} className={onPath && goesLeft ? 'text-emerald-600 stroke-[3]' : 'text-slate-400'} />
            </div>
            {node.left && renderTreeNode(node.left, false)}
          </div>

          <div className="flex flex-col items-center space-y-2">
            <div className="flex flex-col items-center">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border transition-all ${
                onPath && !goesLeft
                  ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-300 shadow-xs'
                  : 'bg-rose-50 text-rose-800 border-rose-200 opacity-70'
              }`}>
                아니오 (&gt; {threshold}cm)
              </span>
              <ArrowDown size={14} className={onPath && !goesLeft ? 'text-rose-600 stroke-[3]' : 'text-slate-400'} />
            </div>
            {node.right && renderTreeNode(node.right, false)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="font-extrabold text-slate-900 block flex items-center gap-1.5">
            <Sliders size={16} className="text-teal-600" />
            <span>[무엇을 바꿀 수 있나요?]</span>
          </span>
          <p className="text-slate-600 leading-relaxed font-medium">
            트리의 <strong>최대 깊이 (maxDepth 2, 3, 4)</strong>와 붓꽃 측정 수치를 직접 조정하거나 예시 샘플을 즉시 불러올 수 있습니다.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="font-extrabold text-slate-900 block flex items-center gap-1.5">
            <Eye size={16} className="text-blue-600" />
            <span>[무엇을 관찰하면 되나요?]</span>
          </span>
          <p className="text-slate-600 leading-relaxed font-medium">
            질문 노드(A/B)를 거쳐 <strong>예/아니오 갈림길을 따라 초록색/장미색으로 강조되는 실시간 판단 경로</strong>와 최종 예측 결론을 관찰하세요.
          </p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <GitBranch size={20} className="text-teal-600" />
            <span>의사결정트리 (Decision Tree) 시각적 탐색 & 판단 경로 추적</span>
          </h3>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Sparkles size={13} className="text-amber-500" /> 빠른 예시:
            </span>
            <button
              onClick={() => handleApplySample('setosa')}
              className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-bold rounded-lg text-[11px] cursor-pointer"
            >
              세토사 예시
            </button>
            <button
              onClick={() => handleApplySample('versicolor')}
              className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-950 font-bold rounded-lg text-[11px] cursor-pointer"
            >
              버시컬러 예시
            </button>
            <button
              onClick={() => handleApplySample('virginica')}
              className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-950 font-bold rounded-lg text-[11px] cursor-pointer"
            >
              버지니카 예시
            </button>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <span className="font-bold text-slate-700 block">트리 최대 깊이 (maxDepth) 설정:</span>
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
                깊이 {d} ({d === 2 ? '단순한 규칙' : d === 3 ? '표준 규칙' : '정밀한 규칙'})
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="font-extrabold text-slate-900 block">
              새로운 붓꽃 측정 수치 조절:
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              💡 수치를 변경하면 트리의 질문을 통과하는 경로가 실시간으로 바뀝니다.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map(feat => {
              const spec = FEATURE_MIN_MAX[feat];
              const val = newPoint[feat];

              return (
                <div key={feat} className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center font-bold text-slate-800">
                    <span>{FEATURE_LABELS[feat]}</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step={spec.step}
                        min={spec.min}
                        max={spec.max}
                        value={val}
                        onChange={e => handleDirectNumberInput(feat, e.target.value)}
                        className="w-20 p-1.5 text-right font-mono font-black text-teal-700 border border-slate-300 rounded-lg bg-teal-50/50 text-xs"
                      />
                      <span className="text-slate-600 font-mono">cm</span>
                    </div>
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

        <div className="p-4 bg-teal-700 text-white rounded-2xl space-y-3 text-xs shadow-xs">
          <div className="flex items-center justify-between border-b border-teal-600 pb-2 font-bold">
            <span className="text-sm font-black flex items-center gap-1.5">
              <span>🧭 [이 데이터는 이렇게 판단했습니다]</span>
            </span>
            <span className="text-teal-200 font-mono text-[11px]">깊이 {maxDepth}</span>
          </div>

          <div className="space-y-1.5">
            {trace.steps.map((s, idx) => (
              <div key={idx} className="bg-teal-800/80 p-2.5 rounded-xl border border-teal-600 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0">
                  {s.stepNumber}
                </span>
                <div className="flex-1 text-[11px]">
                  <span>
                    <strong>{s.featureLabel}</strong> 측정값({s.value}cm)이 기준({s.threshold}cm)보다{' '}
                    <strong className={s.conditionMet ? 'text-emerald-300' : 'text-rose-300'}>
                      {s.conditionMet ? '이하(YES)' : '초과(NO)'}
                    </strong>
                    이므로 ➔ <strong>{s.nextDescription}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-teal-600 flex items-center justify-between">
            <div>
              <span className="text-teal-200 text-[11px] block">최종 도달 예측 품종</span>
              <span className="text-xl font-black text-white">{SPECIES_MAP[trace.predictedSpecies].korean}</span>
            </div>
            <span className="text-xs bg-teal-800 px-3 py-1.5 rounded-lg border border-teal-500 font-mono font-bold">
              {trace.predictedSpecies}
            </span>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="font-bold text-slate-800 block">
              위 ➔ 아래로 읽는 의사결정트리 질문 구조 (실시간 활성 경로 강조):
            </span>
            <span className="text-[11px] text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              💡 초록색/장미색 테두리가 켜진 노드가 현재 데이터가 지나가는 길입니다.
            </span>
          </div>

          <div className="p-4 sm:p-6 bg-slate-50 border border-slate-200 rounded-2xl overflow-x-auto min-h-[300px]">
            <div className="min-w-[480px] flex justify-center py-2">
              {renderTreeNode(tree, true)}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
          <span className="font-extrabold text-slate-900 block text-sm flex items-center gap-1.5">
            <HelpCircle size={16} className="text-teal-600" />
            <span>[핵심 관찰 질문] 의사결정트리의 깊이와 규칙의 관계</span>
          </span>

          <p className="text-slate-700 font-medium leading-relaxed">
            질문: <strong>트리의 깊이가 깊어질수록 판단 규칙은 어떻게 변화할까요?</strong>
          </p>

          <div className="space-y-2">
            {[
              {
                key: 'ans1',
                label: '트리의 깊이가 깊어질수록 더 많은 판단 질문(분지 규칙)이 추가되어 모델이 정교해지고 복잡해집니다.',
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
                  ✓ <strong>정답입니다!</strong> 트리의 깊이가 깊어질수록 더 많은 질문 노드가 생겨나 데이터를 더 세밀하게 쪼개지만, 지나치게 깊어지면 훈련 데이터에만 과도하게 맞추는 과대적합(Overfitting) 위험이 생깁니다.
                </span>
              ) : (
                <span>
                  X 다시 확인해보세요. 트리의 깊이가 깊어지면 아래로 가지가 더 많이 갈라져 질문 조건이 늘어나므로 모델이 더 복잡해집니다.
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
