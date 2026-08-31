import React, { useState, useRef } from 'react';
import { ORIGINAL_IRIS_DATASET } from '../../data/irisDataset';
import {
  runKMeansWithHistory,
  runKMeansWithCustomCentroids,
  type FeatureKey,
  type KMeansStepState,
  type Point2D,
} from '../../algorithms/kmeans';
import { PrimaryButton } from '../common/PrimaryButton';
import { SecondaryButton } from '../common/SecondaryButton';
import { PieChart, Play, RotateCcw, Eye, Sliders, HelpCircle, MousePointerClick, Sparkles } from 'lucide-react';

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

const CLUSTER_COLORS = ['#059669', '#2563eb', '#7c3aed', '#d97706'];
const CLUSTER_BG_LIGHT = ['bg-emerald-50 text-emerald-950 border-emerald-300', 'bg-blue-50 text-blue-950 border-blue-300', 'bg-purple-50 text-purple-950 border-purple-300', 'bg-amber-50 text-amber-950 border-amber-300'];

export const KMeansLab: React.FC = () => {
  const [xAxis, setXAxis] = useState<FeatureKey>('petalLength');
  const [yAxis, setYAxis] = useState<FeatureKey>('petalWidth');

  const [k, setK] = useState<number>(3);
  const [initMode, setInitMode] = useState<'manual' | 'auto'>('manual');
  const [userCentroids, setUserCentroids] = useState<Point2D[]>([]);
  const [isExecuted, setIsExecuted] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [userObservationChoice, setUserObservationChoice] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  const xSpec = FEATURE_MIN_MAX[xAxis];
  const ySpec = FEATURE_MIN_MAX[yAxis];

  const svgWidth = 460;
  const svgHeight = 320;
  const paddingLeft = 50;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 50;
  const plotW = svgWidth - paddingLeft - paddingRight;
  const plotH = svgHeight - paddingTop - paddingBottom;

  const getSvgX = (val: number) =>
    paddingLeft + ((val - xSpec.min) / (xSpec.max - xSpec.min)) * plotW;

  const getSvgY = (val: number) =>
    svgHeight - paddingBottom - ((val - ySpec.min) / (ySpec.max - ySpec.min)) * plotH;

  // Compute history based on mode
  let history: KMeansStepState[] = [];
  if (initMode === 'auto') {
    history = runKMeansWithHistory(ORIGINAL_IRIS_DATASET, xAxis, yAxis, k, 42);
  } else if (userCentroids.length === k) {
    history = runKMeansWithCustomCentroids(ORIGINAL_IRIS_DATASET, xAxis, yAxis, userCentroids);
  }

  const currState = history.length > 0 ? history[Math.min(currentStepIndex, history.length - 1)] : null;

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (initMode !== 'manual' || isExecuted) return;
    if (userCentroids.length >= k) return;

    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const svgX = (clientX / rect.width) * svgWidth;
    const svgY = (clientY / rect.height) * svgHeight;

    const clampedSvgX = Math.max(paddingLeft, Math.min(svgWidth - paddingRight, svgX));
    const clampedSvgY = Math.max(paddingTop, Math.min(svgHeight - paddingBottom, svgY));

    const domainX = xSpec.min + ((clampedSvgX - paddingLeft) / plotW) * (xSpec.max - xSpec.min);
    const domainY = ySpec.min + ((svgHeight - paddingBottom - clampedSvgY) / plotH) * (ySpec.max - ySpec.min);

    const newCentroid: Point2D = {
      x: Math.round(domainX * 10) / 10,
      y: Math.round(domainY * 10) / 10,
    };

    setUserCentroids(prev => [...prev, newCentroid]);
  };

  const handleResetCentroids = () => {
    setUserCentroids([]);
    setIsExecuted(false);
    setCurrentStepIndex(0);
  };

  const handleRunKMeans = () => {
    if (initMode === 'manual' && userCentroids.length !== k) return;
    setIsExecuted(true);
    setCurrentStepIndex(0);
  };

  const handleNextStep = () => {
    if (!history || history.length === 0) return;
    setCurrentStepIndex(idx => Math.min(history.length - 1, idx + 1));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="font-extrabold text-slate-900 block flex items-center gap-1.5">
            <Sliders size={16} className="text-blue-600" />
            <span>[무엇을 바꿀 수 있나요?]</span>
          </span>
          <p className="text-slate-600 leading-relaxed font-medium">
            군집 수 <strong>K(2, 3, 4개)</strong>를 정하고, <strong>산점도 그래프를 직접 터치하여 K개의 초기 시작 중심점(★)을 직접 지정</strong>할 수 있습니다.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="font-extrabold text-slate-900 block flex items-center gap-1.5">
            <Eye size={16} className="text-blue-600" />
            <span>[무엇을 관찰하면 되나요?]</span>
          </span>
          <p className="text-slate-600 leading-relaxed font-medium">
            중심점이 각 군집의 평균 위치로 이동하면서 데이터 점들이 가장 가까운 군집으로 자동 재배정되는 수렴 과정을 관찰하세요.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <PieChart size={20} className="text-blue-600" />
            <span>K-평균 군집화 (K-Means Clustering) 비지도학습 시뮬레이터</span>
          </h3>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setInitMode('manual');
                handleResetCentroids();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                initMode === 'manual' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              내가 중심점 직접 찍기
            </button>
            <button
              onClick={() => {
                setInitMode('auto');
                handleResetCentroids();
                setIsExecuted(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                initMode === 'auto' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              자동 초기 중심점
            </button>
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
                    handleResetCentroids();
                  }}
                  className={`p-2.5 rounded-xl font-mono font-bold text-xs cursor-pointer min-h-[44px] ${
                    k === kVal ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
                handleResetCentroids();
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
                handleResetCentroids();
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

        {/* Educational Note Banner */}
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 space-y-1">
          <span className="font-extrabold block text-blue-900 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" />
            <span>[K-means 핵심 개념 안내]</span>
          </span>
          <p className="leading-relaxed text-blue-900">
            • <strong>K는 만들 군집의 개수</strong>입니다.
            <br />• 그래프에 찍는 점은 새로운 데이터가 아니라 <strong>군집화를 시작할 초기 중심점(Centroid)</strong>입니다.
          </p>
        </div>

        {/* Manual Setup Status Bar & Action Buttons */}
        {initMode === 'manual' && !isExecuted && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-extrabold text-sm text-amber-950 block">
                  🎯 그래프에서 시작 중심점 {k}개를 찍어보세요!
                </span>
                <span className="text-amber-800 text-[11px] font-bold">
                  현재 선택: {userCentroids.length} / {k}개 지정됨
                </span>
              </div>

              <div className="flex items-center gap-2">
                <SecondaryButton size="sm" onClick={handleResetCentroids} icon={<RotateCcw size={14} />}>
                  중심점 다시 찍기
                </SecondaryButton>
                <PrimaryButton
                  size="sm"
                  onClick={handleRunKMeans}
                  disabled={userCentroids.length !== k}
                  icon={<Play size={14} />}
                >
                  {userCentroids.length === k ? 'k-means 알고리즘 실행' : `${k - userCentroids.length}개 더 선택 필요`}
                </PrimaryButton>
              </div>
            </div>

            {/* Selected Centroids Chips */}
            {userCentroids.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {userCentroids.map((c, idx) => (
                  <span
                    key={idx}
                    className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 shadow-2xs ${CLUSTER_BG_LIGHT[idx % CLUSTER_BG_LIGHT.length]}`}
                  >
                    <span>중심 {idx + 1}:</span>
                    <span className="font-mono font-black">({c.x}, {c.y})</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step Progression Banner when Executed */}
        {isExecuted && currState && (
          <div className="p-4 rounded-xl bg-blue-600 text-white text-xs space-y-2 shadow-xs">
            <div className="flex items-center justify-between font-bold border-b border-blue-500 pb-2">
              <span>시뮬레이션 진행 단계: Step {currState.stepNumber}</span>
              <div className="flex items-center gap-2">
                {currState.isConverged && (
                  <span className="bg-emerald-400 text-slate-950 px-2 py-0.5 rounded font-black text-[10px]">
                    ✓ 군집 수렴 완료 (종료)
                  </span>
                )}
                <button
                  onClick={handleResetCentroids}
                  className="px-2 py-1 bg-blue-700 hover:bg-blue-800 rounded font-bold text-[10px] cursor-pointer"
                >
                  처음부터 다시
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={currState.isConverged}
                  className="px-2.5 py-1 bg-white text-blue-900 hover:bg-blue-50 rounded font-bold text-[10px] disabled:opacity-50 cursor-pointer"
                >
                  다음 단계 ➔
                </button>
              </div>
            </div>

            <p className="text-blue-100 font-medium leading-relaxed">
              {currState.actionDescription}
            </p>
          </div>
        )}

        {/* Interactive SVG Scatter Plot */}
        <div className="space-y-2 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <MousePointerClick size={16} className="text-blue-600" />
              <span>2D 산점도 {initMode === 'manual' && !isExecuted ? '(터치하여 초기 중심점 지정)' : '(군집화 진행)'}</span>
            </span>
            <span className="text-blue-800 font-bold bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 text-[11px]">
              {initMode === 'manual' && !isExecuted
                ? `👉 그래프를 터치하여 중심점 ${k}개를 지정하세요 (${userCentroids.length}/${k})`
                : '👉 단계별로 중심점이 이동하고 데이터가 군집별로 나뉩니다.'}
            </span>
          </div>

          <div className="w-full overflow-hidden bg-slate-50 p-2 sm:p-3 rounded-2xl border border-slate-200 touch-none select-none">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              onPointerDown={handlePointerDown}
              className="w-full h-auto cursor-crosshair rounded-xl bg-white shadow-2xs border border-slate-100"
            >
              {/* Axis */}
              <line x1={paddingLeft} y1={svgHeight - paddingBottom} x2={svgWidth - paddingRight} y2={svgHeight - paddingBottom} stroke="#cbd5e1" strokeWidth="2" />
              <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={svgHeight - paddingBottom} stroke="#cbd5e1" strokeWidth="2" />

              {/* Grid Lines */}
              <line x1={paddingLeft} y1={paddingTop} x2={svgWidth - paddingRight} y2={paddingTop} stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1={svgWidth - paddingRight} y1={paddingTop} x2={svgWidth - paddingRight} y2={svgHeight - paddingBottom} stroke="#f1f5f9" strokeDasharray="3 3" />

              {/* Labels */}
              <text x={paddingLeft} y={svgHeight - paddingBottom + 14} textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">
                {xSpec.min}
              </text>
              <text x={svgWidth - paddingRight} y={svgHeight - paddingBottom + 14} textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">
                {xSpec.max}
              </text>
              <text x={(paddingLeft + svgWidth - paddingRight) / 2} y={svgHeight - 12} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#334155">
                {FEATURE_NAMES[xAxis]}
              </text>

              <text x={paddingLeft - 8} y={svgHeight - paddingBottom} textAnchor="end" fontSize="9" fill="#64748b" fontFamily="monospace">
                {ySpec.min}
              </text>
              <text x={paddingLeft - 8} y={paddingTop + 6} textAnchor="end" fontSize="9" fill="#64748b" fontFamily="monospace">
                {ySpec.max}
              </text>
              <text x="15" y={(paddingTop + svgHeight - paddingBottom) / 2} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#334155" transform={`rotate(-90 15 ${(paddingTop + svgHeight - paddingBottom) / 2})`}>
                {FEATURE_NAMES[yAxis]}
              </text>

              {/* Unassigned or Assigned Data Points */}
              {!isExecuted ? (
                ORIGINAL_IRIS_DATASET.map(r => (
                  <circle
                    key={r.id}
                    cx={getSvgX(r[xAxis])}
                    cy={getSvgY(r[yAxis])}
                    r="3.5"
                    fill="#94a3b8"
                    opacity="0.6"
                  />
                ))
              ) : currState ? (
                currState.clusters.map((cl, cIdx) => {
                  const color = CLUSTER_COLORS[cIdx % CLUSTER_COLORS.length];
                  return cl.records.map(r => (
                    <circle
                      key={r.id}
                      cx={getSvgX(r[xAxis])}
                      cy={getSvgY(r[yAxis])}
                      r="4"
                      fill={color}
                      opacity="0.8"
                    />
                  ));
                })
              ) : null}

              {/* Centroid Placement Markers (Manual Setup Mode) */}
              {!isExecuted &&
                userCentroids.map((c, idx) => {
                  const cx = getSvgX(c.x);
                  const cy = getSvgY(c.y);
                  const color = CLUSTER_COLORS[idx % CLUSTER_COLORS.length];
                  const badgeW = 44;
                  const badgeX = Math.max(paddingLeft + badgeW / 2 + 2, Math.min(svgWidth - paddingRight - badgeW / 2 - 2, cx));
                  const badgeY = cy < paddingTop + 28 ? cy + 20 : cy - 14;

                  return (
                    <g key={`manual-centroid-${idx}`}>
                      <circle cx={cx} cy={cy} r="16" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="2" strokeDasharray="3 3" className="animate-pulse" />
                      <circle cx={cx} cy={cy} r="8" fill={color} stroke="#ffffff" strokeWidth="2.5" />
                      <rect x={badgeX - badgeW / 2} y={badgeY - 10} width={badgeW} height="15" rx="4" fill="#0f172a" />
                      <text x={badgeX} y={badgeY + 1} textAnchor="middle" fontSize="9" fontWeight="black" fill="#ffffff">
                        ★ C{idx + 1}
                      </text>
                    </g>
                  );
                })}

              {/* Centroid Markers during execution */}
              {isExecuted && currState &&
                currState.centroids.map((c, idx) => {
                  const cx = getSvgX(c.x);
                  const cy = getSvgY(c.y);
                  const color = CLUSTER_COLORS[idx % CLUSTER_COLORS.length];
                  const badgeW = 44;
                  const badgeX = Math.max(paddingLeft + badgeW / 2 + 2, Math.min(svgWidth - paddingRight - badgeW / 2 - 2, cx));
                  const badgeY = cy < paddingTop + 28 ? cy + 20 : cy - 14;

                  return (
                    <g key={`exec-centroid-${idx}`}>
                      <circle cx={cx} cy={cy} r="18" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="2" strokeDasharray="3 3" />
                      <polygon
                        points={`${cx},${cy - 8} ${cx + 2.8},${cy - 2.5} ${cx + 8},${cy - 2.5} ${cx + 4},${cy + 2.5} ${cx + 6},${cy + 8} ${cx},${cy + 4.5} ${cx - 6},${cy + 8} ${cx - 4},${cy + 2.5} ${cx - 8},${cy - 2.5} ${cx - 2.8},${cy - 2.5}`}
                        fill="#ffffff"
                        stroke={color}
                        strokeWidth="2"
                      />
                      <rect x={badgeX - badgeW / 2} y={badgeY - 10} width={badgeW} height="15" rx="4" fill="#0f172a" />
                      <text x={badgeX} y={badgeY + 1} textAnchor="middle" fontSize="9" fontWeight="black" fill="#ffffff">
                        ★ C{idx + 1}
                      </text>
                    </g>
                  );
                })}
            </svg>
          </div>
        </div>
      </div>

      {/* Observation Question Card (Section 5) */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
        <span className="font-extrabold text-slate-900 block text-sm flex items-center gap-1.5">
          <HelpCircle size={16} className="text-blue-600" />
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
                    ? 'bg-blue-600 text-white border-blue-600'
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
                ? 'bg-blue-50 text-blue-950 border border-blue-200'
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
