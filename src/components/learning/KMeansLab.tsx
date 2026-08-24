import React, { useState } from 'react';
import { ORIGINAL_IRIS_DATASET } from '../../data/irisDataset';
import {
  runKMeansWithHistory,
  type FeatureKey,
  type KMeansStepState,
} from '../../algorithms/kmeans';
import { PrimaryButton } from '../common/PrimaryButton';
import { SecondaryButton } from '../common/SecondaryButton';
import { PieChart, Play, RotateCcw, Eye } from 'lucide-react';

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
  const [showActualSpecies, setShowActualSpecies] = useState<boolean>(false);

  // Compute full k-means history deterministically (seed 42)
  const history: KMeansStepState[] = runKMeansWithHistory(ORIGINAL_IRIS_DATASET, xAxis, yAxis, k, 42);
  const currState = history[Math.min(currentStepIndex, history.length - 1)];

  const handleNextStep = () => {
    setCurrentStepIndex(idx => Math.min(history.length - 1, idx + 1));
  };

  const handleRunToCompletion = () => {
    setCurrentStepIndex(history.length - 1);
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setShowActualSpecies(false);
  };

  // SVG bounds
  const xSpec = FEATURE_MIN_MAX[xAxis];
  const ySpec = FEATURE_MIN_MAX[yAxis];

  const svgWidth = 460;
  const svgHeight = 320;
  const padding = 45;

  const getSvgX = (val: number) =>
    padding + ((val - xSpec.min) / (xSpec.max - xSpec.min)) * (svgWidth - 2 * padding);

  const getSvgY = (val: number) =>
    svgHeight - padding - ((val - ySpec.min) / (ySpec.max - ySpec.min)) * (svgHeight - 2 * padding);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-950 space-y-1">
        <span className="font-extrabold text-sm text-blue-900 block flex items-center gap-1.5">
          <PieChart size={18} className="text-blue-600" />
          <span>k-means (k-평균 군집화) 비지도학습 시뮬레이터</span>
        </span>
        <p className="leading-relaxed">
          정답 품종(label)을 숨기고 측정 수치 특성의 유사성만을 기준으로 <strong>k개의 군집(Cluster)</strong>으로 묶고 중심점을 이동시킵니다.
        </p>
      </div>

      {/* Axis & k Selection Panel */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-800">2차원 산점도 축 설정:</span>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-semibold">X축:</span>
              <select
                value={xAxis}
                onChange={e => {
                  setXAxis(e.target.value as FeatureKey);
                  handleReset();
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              >
                {(Object.keys(FEATURE_NAMES) as FeatureKey[]).map(f => (
                  <option key={f} value={f} disabled={f === yAxis}>
                    {FEATURE_NAMES[f]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-semibold">Y축:</span>
              <select
                value={yAxis}
                onChange={e => {
                  setYAxis(e.target.value as FeatureKey);
                  handleReset();
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              >
                {(Object.keys(FEATURE_NAMES) as FeatureKey[]).map(f => (
                  <option key={f} value={f} disabled={f === xAxis}>
                    {FEATURE_NAMES[f]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* k Value Buttons */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">군집 수 (k) 선택:</span>
            <span className="text-[11px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-bold">
              💡 k-means의 k는 군집의 수 (k-NN 이웃 수 k와 상이)
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[2, 3, 4].map(val => (
              <button
                key={val}
                onClick={() => {
                  setK(val);
                  handleReset();
                }}
                className={`p-3 rounded-xl border-2 text-xs font-extrabold transition-all min-h-[48px] cursor-pointer ${
                  k === val
                    ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                k = {val} 개 그룹
              </button>
            ))}
          </div>
        </div>

        {/* Step Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <SecondaryButton size="sm" onClick={handleReset} icon={<RotateCcw size={16} />}>
            처음 상태로
          </SecondaryButton>

          <div className="flex items-center gap-2">
            <SecondaryButton
              size="sm"
              onClick={handleNextStep}
              disabled={currState.isConverged}
              icon={<Play size={14} />}
            >
              한 단계 실행 ({currentStepIndex + 1}/{history.length - 1})
            </SecondaryButton>
            <PrimaryButton
              size="sm"
              onClick={handleRunToCompletion}
              disabled={currState.isConverged}
              icon={<Play size={14} />}
            >
              끝까지 수렴 실행
            </PrimaryButton>
          </div>
        </div>
      </div>

      {/* SVG Scatter Plot Visualization */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-slate-900">
            k-means 군집 배치 현황 ({currState.actionDescription})
          </span>
          <span className="font-mono text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded">
            단계: {currState.stepNumber}
          </span>
        </div>

        <div className="w-full overflow-x-auto flex justify-center bg-slate-50/70 p-2 rounded-xl border border-slate-200">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full max-w-[500px] h-auto">
            {/* Grid Axes Lines */}
            <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#cbd5e1" strokeWidth="1.5" />
            <line x1={padding} y1={padding} x2={padding} y2={svgHeight - padding} stroke="#cbd5e1" strokeWidth="1.5" />

            {/* 150 Iris Data Points colored by Cluster */}
            {ORIGINAL_IRIS_DATASET.map(r => {
              const cx = getSvgX(r[xAxis]);
              const cy = getSvgY(r[yAxis]);

              // Find which cluster contains this record
              const clusterIdx = currState.clusters.findIndex(c => c.recordIds.includes(r.id));
              const color = clusterIdx >= 0 ? CLUSTER_COLORS[clusterIdx % CLUSTER_COLORS.length] : '#94a3b8';

              return (
                <circle
                  key={r.id}
                  cx={cx}
                  cy={cy}
                  r="4"
                  fill={color}
                  opacity="0.8"
                />
              );
            })}

            {/* Centroids ★ */}
            {currState.centroids.map((c, cIdx) => {
              const cx = getSvgX(c.x);
              const cy = getSvgY(c.y);
              const color = CLUSTER_COLORS[cIdx % CLUSTER_COLORS.length];

              return (
                <g key={`centroid_${cIdx}`}>
                  <circle cx={cx} cy={cy} r="15" fill={color} opacity="0.3" />
                  <polygon
                    points={`${cx},${cy - 12} ${cx + 4},${cy - 4} ${cx + 12},${cy - 4} ${cx + 6},${cy + 2} ${cx + 8},${cy + 10} ${cx},${cy + 5} ${cx - 8},${cy + 10} ${cx - 6},${cy + 2} ${cx - 12},${cy - 4} ${cx - 4},${cy - 4}`}
                    fill="#1e293b"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <text x={cx} y={cy + 20} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0f172a">
                    ★ 중심 {cIdx + 1}
                  </text>
                </g>
              );
            })}

            {/* Axes Labels */}
            <text x={svgWidth / 2} y={svgHeight - 10} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#475569">
              {FEATURE_NAMES[xAxis]}
            </text>
            <text x="15" y={svgHeight / 2} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#475569" transform={`rotate(-90 15 ${svgHeight / 2})`}>
              {FEATURE_NAMES[yAxis]}
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold pt-2 border-t border-slate-100">
          {currState.centroids.map((_, cIdx) => (
            <span key={cIdx} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: CLUSTER_COLORS[cIdx] }}></span>
              군집 {cIdx + 1} ({currState.clusters[cIdx]?.records.length || 0}개)
            </span>
          ))}
          <span className="flex items-center gap-1 text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">
            ★ 군집 중심점 (Centroid)
          </span>
        </div>
      </div>

      {/* Cluster Details & Reveal Species Comparison */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-900">
            {k}개 군집별 통계 및 정보
          </span>
          <button
            onClick={() => setShowActualSpecies(!showActualSpecies)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold transition-colors cursor-pointer min-h-[44px]"
          >
            <Eye size={16} />
            <span>{showActualSpecies ? '실제 품종 숨기기' : '숨겨진 실제 품종과 비교하기'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {currState.clusters.map(cluster => (
            <div key={cluster.clusterIndex} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: CLUSTER_COLORS[cluster.clusterIndex] }}></span>
                  군집 {cluster.clusterIndex + 1}
                </span>
                <span className="font-mono text-slate-700">{cluster.records.length}개</span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                중심 좌표: ({cluster.centroid.x}, {cluster.centroid.y})
              </p>

              {/* Reveal actual species breakdown if toggled */}
              {showActualSpecies && (
                <div className="pt-2 border-t border-slate-200 space-y-1 text-[11px] font-bold text-slate-800 animate-fadeIn">
                  <span className="text-purple-800 block">실제 품종 구성:</span>
                  <div className="flex justify-between"><span>세토사:</span><span>{cluster.speciesCounts['Iris-setosa']}개</span></div>
                  <div className="flex justify-between"><span>버시컬러:</span><span>{cluster.speciesCounts['Iris-versicolor']}개</span></div>
                  <div className="flex justify-between"><span>버지니카:</span><span>{cluster.speciesCounts['Iris-virginica']}개</span></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {showActualSpecies && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 leading-relaxed font-medium">
            💡 <strong>핵심 가이드:</strong> k-means는 품종 정답(y)을 전혀 모른 채 오직 꽃잎/꽃받침 수치 간 거리와 유사성만으로 그룹을 묶는 비지도학습 알고리즘입니다.
          </div>
        )}
      </div>

      {/* Observation Reflection Question Card */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs space-y-2 shadow-xs">
        <span className="font-extrabold text-blue-300 block text-sm flex items-center gap-1.5">
          🧐 생각하기 (관찰 질문)
        </span>
        <p className="font-bold text-slate-100">
          "군집 수 k를 2, 3, 4로 바꾸었을 때 데이터가 그룹으로 묶이는 모습은 어떻게 달라졌나요?"
        </p>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          💡 k-means에서의 k는 만들어내고 싶은 군집(그룹)의 수입니다. 비지도학습은 사전에 주어진 품종 이름을 알지 못하므로 특징의 유사성을 기준으로 스스로 묶음을 찾아냅니다.
        </p>
      </div>
    </div>
  );
};
