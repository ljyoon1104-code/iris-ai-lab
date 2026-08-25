import React from 'react';
import { ORIGINAL_IRIS_DATASET, SPECIES_MAP } from '../../data/irisDataset';
import { predictKNN } from '../../algorithms/knn';
import { trainDecisionTree, traceDecisionPath, type FeatureKey } from '../../algorithms/decisionTree';
import { Target, GitBranch, Sparkles, Scale } from 'lucide-react';

interface AlgorithmComparisonProps {
  point: Record<FeatureKey, number>;
  k: number;
  maxDepth: number;
}

export const AlgorithmComparison: React.FC<AlgorithmComparisonProps> = ({
  point,
  k = 5,
  maxDepth = 3,
}) => {
  const knnResult = predictKNN(ORIGINAL_IRIS_DATASET, point, ['petalLength', 'petalWidth'], k);
  const tree = trainDecisionTree(ORIGINAL_IRIS_DATASET, ['sepalLength', 'sepalWidth', 'petalLength', 'petalWidth'], maxDepth);
  const treeResult = traceDecisionPath(tree, point);

  const isMatching = knnResult.predictedSpecies === treeResult.predictedSpecies;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
        <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <Scale size={18} className="text-emerald-600 shrink-0" />
          <span className="break-words [word-break:keep-all]">동일한 새 붓꽃 데이터에 대한 알고리즘 비교</span>
        </h4>
        <span className="text-[11px] sm:text-xs font-bold font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg break-words">
          꽃잎 길이: {point.petalLength}cm | 꽃잎 너비: {point.petalWidth}cm
        </span>
      </div>

      {/* Side-by-Side Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {/* k-NN Card */}
        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
          <div className="flex items-center justify-between font-bold text-emerald-950">
            <span className="flex items-center gap-1.5">
              <Target size={16} className="text-emerald-600" />
              k-NN (최근접 이웃)
            </span>
            <span className="text-emerald-700">k = {k}</span>
          </div>

          <div className="p-3 bg-white rounded-lg border border-emerald-200">
            <span className="text-[11px] text-slate-500 block">예측 결과</span>
            <span className="font-extrabold text-sm text-emerald-950">
              {SPECIES_MAP[knnResult.predictedSpecies].korean} ({knnResult.predictedSpecies})
            </span>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed">
            판단 원리: 2차원 공간에서 가장 가까운 {k}개 이웃 데이터와의 다수결 투표
          </p>
        </div>

        {/* Decision Tree Card */}
        <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 space-y-2">
          <div className="flex items-center justify-between font-bold text-teal-950">
            <span className="flex items-center gap-1.5">
              <GitBranch size={16} className="text-teal-600" />
              의사결정트리 (Decision Tree)
            </span>
            <span className="text-teal-700">깊이 = {maxDepth}</span>
          </div>

          <div className="p-3 bg-white rounded-lg border border-teal-200">
            <span className="text-[11px] text-slate-500 block">예측 결과</span>
            <span className="font-extrabold text-sm text-teal-950">
              {SPECIES_MAP[treeResult.predictedSpecies].korean} ({treeResult.predictedSpecies})
            </span>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed">
            판단 원리: {treeResult.steps.length}개 속성 조건문(≤ / &gt;) 가지를 순차적으로 통과
          </p>
        </div>
      </div>

      {/* Comparison Insight Box */}
      <div className={`p-4 rounded-xl text-xs leading-relaxed font-semibold space-y-1 ${
        isMatching
          ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
          : 'bg-amber-100 text-amber-950 border border-amber-300'
      }`}>
        <div className="font-extrabold text-sm flex items-center gap-1.5">
          <Sparkles size={16} />
          <span>
            {isMatching
              ? '✓ 두 알고리즘의 예측 결과가 일치합니다!'
              : '💡 두 알고리즘의 예측 결과가 다릅니다!'}
          </span>
        </div>
        <p className="font-medium text-[11px]">
          {isMatching
            ? '공간상 거리를 기반으로 한 k-NN과 조건문을 따라가는 의사결정트리가 모두 동일한 품종을 지목하였습니다.'
            : 'k-NN은 주변 가까운 이웃의 분포를 참고하고, 의사결정트리는 수치 임계 조건 가지를 따라가기 때문에 경계 영역의 데이터에서는 서로 다른 예측이 도출될 수 있습니다.'}
        </p>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-900 text-white text-center font-extrabold text-xs">
        "k-NN은 가까운 데이터를 참고하고, 의사결정트리는 조건을 따라 판단합니다."
      </div>
    </div>
  );
};
