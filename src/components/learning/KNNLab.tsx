import React, { useState } from 'react';
import { ORIGINAL_IRIS_DATASET, SPECIES_MAP } from '../../data/irisDataset';
import type { IrisRecord } from '../../types/iris';
import { predictKNN, findBoundaryCase } from '../../algorithms/knn';
import { SecondaryButton } from '../common/SecondaryButton';
import { Target, Sparkles } from 'lucide-react';

type FeatureKey = keyof Omit<IrisRecord, 'id' | 'species'>;

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

export const KNNLab: React.FC = () => {
  const [xAxis, setXAxis] = useState<FeatureKey>('petalLength');
  const [yAxis, setYAxis] = useState<FeatureKey>('petalWidth');

  const [newPoint, setNewPoint] = useState<Record<FeatureKey, number>>({
    sepalLength: 6.0,
    sepalWidth: 3.0,
    petalLength: 4.8,
    petalWidth: 1.6,
  });

  const [k, setK] = useState<number>(5);
  const [isBoundaryLoaded, setIsBoundaryLoaded] = useState(false);

  // Compute prediction with current settings
  const knnResult = predictKNN(ORIGINAL_IRIS_DATASET, newPoint, [xAxis, yAxis], k);

  const handleAdjustValue = (feat: FeatureKey, delta: number) => {
    const spec = FEATURE_MIN_MAX[feat];
    setNewPoint(prev => {
      const nextVal = Math.round((prev[feat] + delta) * 10) / 10;
      const clamped = Math.min(spec.max, Math.max(spec.min, nextVal));
      return { ...prev, [feat]: clamped };
    });
    setIsBoundaryLoaded(false);
  };

  const handleLoadBoundaryCase = () => {
    const bCase = findBoundaryCase(ORIGINAL_IRIS_DATASET, [xAxis, yAxis]);
    if (bCase) {
      setNewPoint(prev => ({
        ...prev,
        ...bCase.point,
      }));
      setIsBoundaryLoaded(true);
    }
  };

  // SVG Scatter plot bounds
  const xSpec = FEATURE_MIN_MAX[xAxis];
  const ySpec = FEATURE_MIN_MAX[yAxis];

  const svgWidth = 460;
  const svgHeight = 320;
  const padding = 45;

  const getSvgX = (val: number) =>
    padding + ((val - xSpec.min) / (xSpec.max - xSpec.min)) * (svgWidth - 2 * padding);

  const getSvgY = (val: number) =>
    svgHeight - padding - ((val - ySpec.min) / (ySpec.max - ySpec.min)) * (svgHeight - 2 * padding);

  const newSvgX = getSvgX(newPoint[xAxis]);
  const newSvgY = getSvgY(newPoint[yAxis]);

  const neighborIds = new Set(knnResult.neighbors.map(n => n.record.id));

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 space-y-1">
        <span className="font-extrabold text-sm text-emerald-900 block flex items-center gap-1.5">
          <Target size={18} className="text-emerald-600" />
          <span>k-NN (k-Nearest Neighbors) 최근접 이웃 시뮬레이터</span>
        </span>
        <p className="leading-relaxed">
          새로운 붓꽃 좌표 <strong>★</strong> 위치에서 가장 가까운 <strong>k개 이웃 데이터</strong>의 품종을 확인하고 다수결 투표로 최종 품종을 예측합니다.
        </p>
      </div>

      {/* Axis Selector & Control Panel */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-800">2차원 산점도 축 설정:</span>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-semibold">X축:</span>
              <select
                value={xAxis}
                onChange={e => setXAxis(e.target.value as FeatureKey)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
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
                onChange={e => setYAxis(e.target.value as FeatureKey)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
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

        {/* New Point Position Controls */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">새 붓꽃 (★) 좌표 조절:</span>
            <SecondaryButton size="sm" onClick={handleLoadBoundaryCase} icon={<Sparkles size={14} />}>
              경계 사례 보기 (k=1 vs k=5)
            </SecondaryButton>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[xAxis, yAxis].map(f => (
              <div key={f} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">{FEATURE_NAMES[f]}</span>
                  <span className="font-extrabold text-emerald-800 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono">
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
                    onChange={e => {
                      setNewPoint(prev => ({ ...prev, [f]: parseFloat(e.target.value) }));
                      setIsBoundaryLoaded(false);
                    }}
                    className="w-full accent-emerald-600 min-h-[44px]"
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

        {/* k Value Choice Buttons */}
        <div className="space-y-2 pt-1">
          <span className="text-xs font-bold text-slate-900 block">이웃 수 (k) 선택:</span>
          <div className="grid grid-cols-4 gap-2">
            {[1, 3, 5, 7].map(val => (
              <button
                key={val}
                onClick={() => setK(val)}
                className={`p-3 rounded-xl border-2 text-xs font-extrabold transition-all min-h-[48px] cursor-pointer ${
                  k === val
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                k = {val}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Scatter Plot Visualization */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-slate-900">Iris 150개 산점도 & k={k} 최근접 이웃 연결</span>
          <span className="text-slate-500">
            X: {FEATURE_NAMES[xAxis]} | Y: {FEATURE_NAMES[yAxis]}
          </span>
        </div>

        <div className="w-full overflow-x-auto flex justify-center bg-slate-50/70 p-2 rounded-xl border border-slate-200">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full max-w-[500px] h-auto">
            {/* Background Grid Lines */}
            <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#cbd5e1" strokeWidth="1.5" />
            <line x1={padding} y1={padding} x2={padding} y2={svgHeight - padding} stroke="#cbd5e1" strokeWidth="1.5" />

            {/* Dashed Connecting Lines from ★ to Nearest Neighbors */}
            {knnResult.neighbors.map(n => {
              const nx = getSvgX(n.record[xAxis]);
              const ny = getSvgY(n.record[yAxis]);
              return (
                <line
                  key={`line_${n.record.id}`}
                  x1={newSvgX}
                  y1={newSvgY}
                  x2={nx}
                  y2={ny}
                  stroke="#059669"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />
              );
            })}

            {/* 150 Dataset Points */}
            {ORIGINAL_IRIS_DATASET.map(r => {
              const cx = getSvgX(r[xAxis]);
              const cy = getSvgY(r[yAxis]);
              const isNeighbor = neighborIds.has(r.id);

              let fill = '#10b981'; // setosa green
              if (r.species === 'Iris-versicolor') fill = '#0d9488'; // versicolor teal
              if (r.species === 'Iris-virginica') fill = '#0891b2'; // virginica cyan

              return (
                <g key={r.id}>
                  {r.species === 'Iris-setosa' && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isNeighbor ? 7 : 4}
                      fill={fill}
                      stroke={isNeighbor ? '#000' : 'none'}
                      strokeWidth={isNeighbor ? 2 : 0}
                      opacity={neighborIds.size > 0 && !isNeighbor ? 0.35 : 0.9}
                    />
                  )}
                  {r.species === 'Iris-versicolor' && (
                    <polygon
                      points={`${cx},${cy - (isNeighbor ? 7 : 5)} ${cx - (isNeighbor ? 7 : 5)},${cy + (isNeighbor ? 7 : 5)} ${cx + (isNeighbor ? 7 : 5)},${cy + (isNeighbor ? 7 : 5)}`}
                      fill={fill}
                      stroke={isNeighbor ? '#000' : 'none'}
                      strokeWidth={isNeighbor ? 2 : 0}
                      opacity={neighborIds.size > 0 && !isNeighbor ? 0.35 : 0.9}
                    />
                  )}
                  {r.species === 'Iris-virginica' && (
                    <rect
                      x={cx - (isNeighbor ? 6 : 4)}
                      y={cy - (isNeighbor ? 6 : 4)}
                      width={isNeighbor ? 12 : 8}
                      height={isNeighbor ? 12 : 8}
                      fill={fill}
                      stroke={isNeighbor ? '#000' : 'none'}
                      strokeWidth={isNeighbor ? 2 : 0}
                      opacity={neighborIds.size > 0 && !isNeighbor ? 0.35 : 0.9}
                    />
                  )}
                </g>
              );
            })}

            {/* New Input Point ★ */}
            <g>
              <circle cx={newSvgX} cy={newSvgY} r="14" fill="#f59e0b" opacity="0.3" />
              <text
                x={newSvgX}
                y={newSvgY + 4}
                textAnchor="middle"
                fontSize="16"
                fontWeight="bold"
                fill="#b45309"
              >
                ★
              </text>
            </g>

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
          <span className="flex items-center gap-1 text-emerald-800">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> 세토사 (●)
          </span>
          <span className="flex items-center gap-1 text-teal-800">
            <span className="w-3 h-3 bg-teal-600 inline-block clip-triangle"></span> 버시컬러 (▲)
          </span>
          <span className="flex items-center gap-1 text-cyan-900">
            <span className="w-3 h-3 bg-cyan-600 inline-block"></span> 버지니카 (■)
          </span>
          <span className="flex items-center gap-1 text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
            ★ 새 붓꽃
          </span>
        </div>
      </div>

      {/* Nearest Neighbors List & Votes Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Nearest k Neighbors Table */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
          <span className="text-xs font-extrabold text-slate-900 block">
            가까운 {k}개 이웃 목록 (거리순 정렬)
          </span>
          <div className="space-y-2 text-xs">
            {knnResult.neighbors.map((n, idx) => (
              <div key={n.record.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-800">
                  {idx + 1}. ID #{n.record.id} ({SPECIES_MAP[n.record.species].korean})
                </span>
                <span className="font-mono text-emerald-700 font-extrabold bg-emerald-100 px-2 py-0.5 rounded">
                  거리: {n.distance} cm
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Majority Vote & Final Result Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
          <span className="text-xs font-extrabold text-slate-900 block">다수결 투표 결과</span>

          <div className="space-y-2 text-xs font-bold">
            {knnResult.voteDetails.map(vd => (
              <div key={vd.species} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span>{SPECIES_MAP[vd.species].korean}</span>
                <span className="font-mono text-slate-900">{vd.count}표</span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-emerald-600 text-white text-xs space-y-1 shadow-xs">
            <span className="font-extrabold text-base block">
              최종 예측: {SPECIES_MAP[knnResult.predictedSpecies].korean} ({knnResult.predictedSpecies})
            </span>
            <p className="text-emerald-100 text-[11px] leading-relaxed">{knnResult.reason}</p>
          </div>
        </div>
      </div>

      {/* Boundary Case Alert Banner if active */}
      {isBoundaryLoaded && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-1 animate-fadeIn">
          <span className="font-extrabold text-sm block">💡 경계 사례 관찰 포인트:</span>
          <p className="leading-relaxed">
            현재 좌표(꽃잎 길이 4.5cm, 너비 1.7cm)는 세토사와 버시컬러/버지니카의 경계선 부근입니다.<br />
            <strong>k=1일 때</strong>는 가장 인접한 단 하나의 이웃(버지니카)만 보고 판단하지만, <strong>k=5일 때</strong>는 넓은 영역의 다수결(버시컬러)로 예측이 바뀔 수 있음을 관찰할 수 있습니다!
          </p>
        </div>
      )}

      {/* Observation Reflection Question Card */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs space-y-2 shadow-xs">
        <span className="font-extrabold text-amber-300 block text-sm flex items-center gap-1.5">
          🧐 생각하기 (관찰 질문)
        </span>
        <p className="font-bold text-slate-100">
          "k값을 1, 3, 5, 7로 바꾸었을 때 참고하는 이웃의 분포와 최종 예측 결과는 어떻게 달라졌나요?"
        </p>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          💡 k가 무조건 크거나 작다고 좋은 것은 아닙니다. 데이터 노이즈와 경계 특성에 맞는 적절한 k를 선택해야 합니다.
        </p>
      </div>
    </div>
  );
};
