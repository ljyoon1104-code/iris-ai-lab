import React, { useState } from 'react';
import { ORIGINAL_IRIS_DATASET } from '../../data/irisDataset';
import {
  runKMeansWithHistory,
  type FeatureKey,
  type KMeansStepState,
} from '../../algorithms/kmeans';
import { PrimaryButton } from '../common/PrimaryButton';
import { SecondaryButton } from '../common/SecondaryButton';
import { PieChart, Play, RotateCcw, Eye, Sliders, HelpCircle } from 'lucide-react';

const FEATURE_NAMES: Record<FeatureKey, string> = {
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

const CLUSTER_COLORS = ['#10b981', '#0d9488', '#0891b2', '#f59e0b'];

export const KMeansLab: React.FC = () => {
  const [xAxis, setXAxis] = useState<FeatureKey>('petalLength');
  const [yAxis, setYAxis] = useState<FeatureKey>('petalWidth');

  const [k, setK] = useState<number>(3);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [userObservationChoice, setUserObservationChoice] = useState<string | null>(null);

  // Compute full k-means history deterministically (seed 42)
  const history: KMeansStepState[] = runKMeansWithHistory(ORIGINAL_IRIS_DATASET, xAxis, yAxis, k, 42);
  const currState = history[Math.min(currentStepIndex, history.length - 1)];

  const handleNextStep = () => {
    setCurrentStepIndex(idx => Math.min(history.length - 1, idx + 1));
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
  };

  const svgWidth = 460;
  const svgHeight = 320;
  const padding = 45;

  const xSpec = FEATURE_MIN_MAX[xAxis];
  const ySpec = FEATURE_MIN_MAX[yAxis];

  const getSvgX = (val: number) =>
    padding + ((val - xSpec.min) / (xSpec.max - xSpec.min)) * (svgWidth - 2 * padding);

  const getSvgY = (val: number) =>
    svgHeight - padding - ((val - ySpec.min) / (ySpec.max - ySpec.min)) * (svgHeight - 2 * padding);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="font-extrabold text-slate-900 block flex items-center gap-1.5">
            <Sliders size={16} className="text-teal-600" />
            <span>[무엇을 바꿀 수 있나요?]</span>
          </span>
          <p className="text-slate-600 leading-relaxed font-medium">
            군집 수 <strong>K(2, 3, 4개)</strong>와 축 속성을 변경하고, 클러스터링을 한 단계씩(Step-by-Step) 진행할 수 있습니다.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="font-extrabold text-slate-900 block flex items-center gap-1.5">
            <Eye size={16} className="text-blue-600" />
            <span>[무엇을 관찰하면 되나요?]</span>
          </span>
          <p className="text-slate-600 leading-relaxed font-medium">
            중심점(★)이 평균 위치로 이동하면서 주변 데이터 점들의 속해 있는 군집 색상이 어떻게 자동으로 바뀌는지 관찰하세요.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <PieChart size={20} className="text-teal-600" />
            <span>K-평균 군집화 (K-Means Clustering) 비지도학습 시뮬레이터</span>
          </h3>

          <div className="flex items-center gap-2">
            <SecondaryButton size="sm" onClick={handleReset} icon={<RotateCcw size={14} />}>
              단계 초기화
            </SecondaryButton>
            <PrimaryButton size="sm" onClick={handleNextStep} disabled={currState.isConverged} icon={<Play size={14} />}>
              다음 단계 (Step {currentStepIndex + 1})
            </PrimaryButton>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="font-bold text-slate-700 block mb-1">군집 수 K 선택:</span>
            <div className="grid grid-cols-3 gap-1.5">
              {[2, 3, 4].map(kVal => (
                <button
                  key={kVal}
                  onClick={() => {
                    setK(kVal);
                    setCurrentStepIndex(0);
                  }}
                  className={`p-2.5 rounded-xl font-mono font-bold text-xs cursor-pointer min-h-[44px] ${
                    k === kVal ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  K = {kVal}개
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="font-bold text-slate-700 block mb-1">X축 속성:</span>
            <select
              value={xAxis}
              onChange={e => {
                setXAxis(e.target.value as FeatureKey);
                setCurrentStepIndex(0);
              }}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs min-h-[44px] cursor-pointer"
            >
              <option value="petalLength">꽃잎 길이 (petalLength)</option>
              <option value="sepalLength">꽃받침 길이 (sepalLength)</option>
              <option value="sepalWidth">꽃받침 너비 (sepalWidth)</option>
              <option value="petalWidth">꽃잎 너비 (petalWidth)</option>
            </select>
          </div>

          <div>
            <span className="font-bold text-slate-700 block mb-1">Y축 속성:</span>
            <select
              value={yAxis}
              onChange={e => {
                setYAxis(e.target.value as FeatureKey);
                setCurrentStepIndex(0);
              }}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs min-h-[44px] cursor-pointer"
            >
              <option value="petalWidth">꽃잎 너비 (petalWidth)</option>
              <option value="petalLength">꽃잎 길이 (petalLength)</option>
              <option value="sepalLength">꽃받침 길이 (sepalLength)</option>
              <option value="sepalWidth">꽃받침 너비 (sepalWidth)</option>
            </select>
          </div>
        </div>

        {/* Step Banner */}
        <div className="p-4 rounded-xl bg-teal-600 text-white text-xs space-y-2 shadow-xs">
          <div className="flex items-center justify-between font-bold border-b border-teal-500 pb-2">
            <span>시뮬레이션 진행 단계: Step {currState.stepNumber}</span>
            {currState.isConverged && (
              <span className="bg-emerald-400 text-slate-950 px-2 py-0.5 rounded font-black text-[10px]">
                ✓ 군집 수렴 완료 (수정 종료)
              </span>
            )}
          </div>

          <p className="text-teal-100 font-medium leading-relaxed">
            {currState.actionDescription}
          </p>
        </div>

        {/* SVG Scatter Plot */}
        <div className="w-full overflow-x-auto bg-slate-50 p-3 rounded-xl border border-slate-200">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto min-w-[320px]">
            {/* Axis */}
            <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#cbd5e1" strokeWidth="2" />
            <line x1={padding} y1={padding} x2={padding} y2={svgHeight - padding} stroke="#cbd5e1" strokeWidth="2" />

            {/* Labels */}
            <text x={svgWidth / 2} y={svgHeight - 10} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#475569">
              {FEATURE_NAMES[xAxis]}
            </text>
            <text x="15" y={svgHeight / 2} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#475569" transform={`rotate(-90 15 ${svgHeight / 2})`}>
              {FEATURE_NAMES[yAxis]}
            </text>

            {/* Points colored by cluster assignment */}
            {currState.clusters.map((cl, cIdx) => {
              const color = CLUSTER_COLORS[cIdx % CLUSTER_COLORS.length];
              return cl.records.map(r => {
                const cx = getSvgX(r[xAxis]);
                const cy = getSvgY(r[yAxis]);
                return <circle key={r.id} cx={cx} cy={cy} r="4" fill={color} opacity="0.75" />;
              });
            })}

            {/* Centroid Stars */}
            {currState.centroids.map((c, idx) => {
              const cx = getSvgX(c.x);
              const cy = getSvgY(c.y);
              const color = CLUSTER_COLORS[idx % CLUSTER_COLORS.length];

              return (
                <g key={idx}>
                  <circle cx={cx} cy={cy} r="10" fill={color} fillOpacity="0.4" stroke="#ffffff" strokeWidth="2" />
                  <polygon
                    points={`${cx},${cy-7} ${cx+2.5},${cy-2} ${cx+7},${cy-2} ${cx+3.5},${cy+2} ${cx+5},${cy+7} ${cx},${cy+4} ${cx-5},${cy+7} ${cx-3.5},${cy+2} ${cx-7},${cy-2} ${cx-2.5},${cy-2}`}
                    fill="#ffffff"
                    stroke="#000000"
                    strokeWidth="1"
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Observation Question Card (Section 5) */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
        <span className="font-extrabold text-slate-900 block text-sm flex items-center gap-1.5">
          <HelpCircle size={16} className="text-teal-600" />
          <span>[핵심 관찰 질문] 중심점 이동과 데이터 나뉨</span>
        </span>

        <p className="text-slate-700 font-medium leading-relaxed">
          질문: <strong>중심점이 이동하면서 데이터가 나뉘는 모습은 어떻게 달라지나요?</strong>
        </p>

        <div className="space-y-2">
          {[
            {
              key: 'ans1',
              label: '중심점이 각 데이터점들의 평균 위치로 이동함에 따라 가까운 점들이 재배정되며 군집 경계가 점점 안정적으로 정돈됩니다.',
            },
            {
              key: 'ans2',
              label: '중심점이 이동해도 데이터점들의 무리 색상이나 그룹 형태는 아무 변화 없이 완전히 무작위로 섞입니다.',
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
                ✓ <strong>정답입니다!</strong> K-means는 중심점을 각 클러스터의 중심(평균)으로 업데이트하고 가장 가까운 점을 다시 묶는 과정을 수렴할 때까지 반복합니다.
              </span>
            ) : (
              <span>
                X 다시 확인해보세요. 중심점이 이동하면서 각 점들이 가장 가까운 중심점 그룹으로 모이게 되므로 수렴할 때까지 점들이 정돈된 무리를 형성합니다.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
