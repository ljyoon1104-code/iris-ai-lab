import React from 'react';
import type { IrisRecord } from '../../types/iris';
import type { KNNPredictionResult } from '../../algorithms/knn';
import { SpeciesBadge } from '../common/SpeciesBadge';
import { SpeciesMarker } from '../common/SpeciesMarker';
import { getSpeciesConfig, ALL_SPECIES_LIST } from '../../constants/species';
import { Target, Info, CheckCircle2 } from 'lucide-react';

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

interface KNNPredictionVisualizerProps {
  trainData: IrisRecord[];
  newPoint: {
    sepalLength: number;
    sepalWidth: number;
    petalLength: number;
    petalWidth: number;
  };
  kParam: number;
  knnResult: KNNPredictionResult | null;
  featureKeys?: [FeatureKey, FeatureKey];
}

export const KNNPredictionVisualizer: React.FC<KNNPredictionVisualizerProps> = ({
  trainData,
  newPoint,
  kParam,
  knnResult,
  featureKeys,
}) => {
  const [xKey, yKey] = featureKeys || (['petalLength', 'petalWidth'] as [FeatureKey, FeatureKey]);

  // SVG Dimensions and Plot Bounds
  const svgWidth = 460;
  const svgHeight = 290;
  const plotLeft = 45;
  const plotRight = 435;
  const plotTop = 25;
  const plotBottom = 245;
  const plotW = plotRight - plotLeft;
  const plotH = plotBottom - plotTop;

  // Dynamic Coordinate Domain from trainData and specs
  const xSpec = FEATURE_MIN_MAX[xKey];
  const ySpec = FEATURE_MIN_MAX[yKey];

  const axisMinX = Math.min(xSpec.min, ...trainData.map(r => (typeof r[xKey] === 'number' ? (r[xKey] as number) : xSpec.min)));
  const axisMaxX = Math.max(xSpec.max, ...trainData.map(r => (typeof r[xKey] === 'number' ? (r[xKey] as number) : xSpec.max)));
  const axisMinY = Math.min(ySpec.min, ...trainData.map(r => (typeof r[yKey] === 'number' ? (r[yKey] as number) : ySpec.min)));
  const axisMaxY = Math.max(ySpec.max, ...trainData.map(r => (typeof r[yKey] === 'number' ? (r[yKey] as number) : ySpec.max)));

  const mapX = (v: number) =>
    plotLeft + ((Math.max(axisMinX, Math.min(axisMaxX, v)) - axisMinX) / (axisMaxX - axisMinX || 1)) * plotW;
  const mapY = (v: number) =>
    plotBottom - ((Math.max(axisMinY, Math.min(axisMaxY, v)) - axisMinY) / (axisMaxY - axisMinY || 1)) * plotH;

  const safeX =
    typeof newPoint?.[xKey] === 'number' && !isNaN(newPoint[xKey])
      ? newPoint[xKey]
      : (axisMinX + axisMaxX) / 2;
  const safeY =
    typeof newPoint?.[yKey] === 'number' && !isNaN(newPoint[yKey])
      ? newPoint[yKey]
      : (axisMinY + axisMaxY) / 2;

  const newX = mapX(safeX);
  const newY = mapY(safeY);

  // Position badge above or below point without clipping
  const badgeW = 54;
  const badgeX = Math.max(plotLeft + badgeW / 2 + 2, Math.min(plotRight - badgeW / 2 - 2, newX));
  const badgeY = newY < plotTop + 24 ? newY + 18 : newY - 14;

  // Set of neighbor record IDs for fast lookup
  const neighborIds = new Set(knnResult?.neighbors.map(n => n.record.id) || []);

  // Determine winning species info and tie break
  const winningDetails = knnResult?.voteDetails[0];
  const winningConf = winningDetails ? getSpeciesConfig(winningDetails.species) : null;
  const isTieBroken =
    knnResult &&
    knnResult.voteDetails[1] &&
    knnResult.voteDetails[1].count === knnResult.voteDetails[0].count &&
    knnResult.voteDetails[0].count > 0;

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 text-xs animate-fadeIn">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-1.5 font-extrabold text-sm text-slate-900">
            <Target size={17} className="text-emerald-600" />
            <span>k-NN은 어떤 이웃을 참고했을까?</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {FEATURE_NAMES[xKey]}와 {FEATURE_NAMES[yKey]} 특성을 기준으로 가장 가까운 학습용 데이터(Train)를 찾습니다.
          </p>
        </div>

        {/* Model Config Compact Tags */}
        <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold">
          <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
            k-NN (k = {kParam})
          </span>
          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
            학습용(Train) {trainData.length}개 기준
          </span>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="flex items-center gap-2 flex-wrap text-[11px] font-bold text-slate-600 justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {ALL_SPECIES_LIST.map(spKey => (
            <SpeciesBadge key={spKey} species={spKey} size="xs" />
          ))}
        </div>

        <div className="inline-flex items-center gap-1 text-[11px] font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-300">
          <span>★</span>
          <span>새 입력 관측점</span>
        </div>
      </div>

      {/* Responsive SVG Scatterplot */}
      <div className="w-full overflow-hidden bg-slate-50 p-2 sm:p-3 rounded-2xl border border-slate-200 select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto rounded-xl bg-white shadow-2xs border border-slate-100"
        >
          {/* Coordinate Grid Lines */}
          {[0.25, 0.5, 0.75].map(ratio => {
            const xVal = axisMinX + ratio * (axisMaxX - axisMinX);
            const yVal = axisMinY + ratio * (axisMaxY - axisMinY);
            return (
              <React.Fragment key={`grid-${ratio}`}>
                <line
                  x1={mapX(xVal)}
                  y1={plotTop}
                  x2={mapX(xVal)}
                  y2={plotBottom}
                  stroke="#f1f5f9"
                  strokeDasharray="3 3"
                />
                <line
                  x1={plotLeft}
                  y1={mapY(yVal)}
                  x2={plotRight}
                  y2={mapY(yVal)}
                  stroke="#f1f5f9"
                  strokeDasharray="3 3"
                />
              </React.Fragment>
            );
          })}

          {/* Axes */}
          <line
            x1={plotLeft}
            y1={plotBottom}
            x2={plotRight}
            y2={plotBottom}
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />
          <line
            x1={plotLeft}
            y1={plotTop}
            x2={plotLeft}
            y2={plotBottom}
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />

          {/* Axis Ticks & Labels */}
          <text x={plotLeft} y={plotBottom + 13} textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">
            {axisMinX}
          </text>
          <text x={plotRight} y={plotBottom + 13} textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">
            {axisMaxX}
          </text>
          <text x={(plotLeft + plotRight) / 2} y={plotBottom + 26} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#334155">
            {FEATURE_NAMES[xKey]}
          </text>

          <text x={plotLeft - 8} y={plotBottom} textAnchor="end" fontSize="9" fill="#64748b" fontFamily="monospace">
            {axisMinY}
          </text>
          <text x={plotLeft - 8} y={plotTop + 4} textAnchor="end" fontSize="9" fill="#64748b" fontFamily="monospace">
            {axisMaxY}
          </text>
          <text
            x="13"
            y={(plotTop + plotBottom) / 2}
            textAnchor="middle"
            fontSize="10"
            fontWeight="bold"
            fill="#334155"
            transform={`rotate(-90 13 ${(plotTop + plotBottom) / 2})`}
          >
            {FEATURE_NAMES[yKey]}
          </text>

          {/* Exact k Nearest Neighbor Connecting Lines (only if prediction executed) */}
          {knnResult &&
            knnResult.neighbors.map((n, i) => {
              const nX = mapX(n.record[xKey]);
              const nY = mapY(n.record[yKey]);
              const midX = (newX + nX) / 2;
              const midY = (newY + nY) / 2;

              return (
                <g key={`knn-line-${n.record.id}-${i}`}>
                  <line
                    x1={newX}
                    y1={newY}
                    x2={nX}
                    y2={nY}
                    stroke="#475569"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />
                  {/* Rank Badge at Midpoint */}
                  <circle cx={midX} cy={midY} r="6.5" fill="#334155" />
                  <text
                    x={midX}
                    y={midY + 3}
                    textAnchor="middle"
                    fontSize="7.5"
                    fontWeight="bold"
                    fill="#ffffff"
                  >
                    {i + 1}
                  </text>
                </g>
              );
            })}

          {/* Train Data Points (Exact Shapes: Circle, Triangle, Square) */}
          {trainData.map(r => {
            const cx = mapX(r[xKey]);
            const cy = mapY(r[yKey]);
            const isNeighbor = neighborIds.has(r.id);

            return (
              <SpeciesMarker
                key={r.id}
                species={r.species}
                cx={cx}
                cy={cy}
                size={isNeighbor ? 7 : 4.5}
                stroke={isNeighbor ? '#0f172a' : '#ffffff'}
                strokeWidth={isNeighbor ? 2.5 : 1}
                opacity={isNeighbor ? 1 : 0.7}
              />
            );
          })}

          {/* Query Point (★ 새 입력) in Neutral Dark Slate */}
          <g>
            <circle
              cx={newX}
              cy={newY}
              r="14"
              fill="#0f172a"
              fillOpacity="0.12"
              stroke="#334155"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              className="animate-pulse"
            />
            <circle cx={newX} cy={newY} r="7.5" fill="#1e293b" stroke="#ffffff" strokeWidth="2" />
            <text x={newX} y={newY + 3} textAnchor="middle" fontSize="9" fontWeight="black" fill="#ffffff">
              ★
            </text>
            <rect
              x={badgeX - badgeW / 2}
              y={badgeY - 10}
              width={badgeW}
              height="15"
              rx="4"
              fill="#1e293b"
            />
            <text
              x={badgeX}
              y={badgeY + 1}
              textAnchor="middle"
              fontSize="9"
              fontWeight="black"
              fill="#ffffff"
            >
              ★ 새 입력
            </text>
          </g>
        </svg>
      </div>

      {/* Coordinate & Educational Feature Notes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
        <div>
          <span>현재 관측 위치: </span>
          <strong className="text-slate-800 font-mono">{FEATURE_NAMES[xKey]} {newPoint[xKey]}cm</strong>
          <span> · </span>
          <strong className="text-slate-800 font-mono">{FEATURE_NAMES[yKey]} {newPoint[yKey]}cm</strong>
        </div>
        <span className="text-[10px] text-slate-400">
          ※ k-NN 예측 거리는 04에서 선정한 {FEATURE_NAMES[xKey]}·{FEATURE_NAMES[yKey]} 2개 특성으로 계산됩니다.
        </span>
      </div>

      {/* Before Prediction: Guiding Notice */}
      {!knnResult && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2">
          <Info size={16} className="text-emerald-600 shrink-0" />
          <span>
            위의 <strong>[구축된 모델로 품종 예측하기]</strong> 버튼을 누르면 가장 가까운 k={kParam}개의 학습용 데이터(Train)를 찾아 연결선과 투표 결과를 보여줍니다.
          </span>
        </div>
      )}

      {/* After Prediction: 3-Step Rationale Sequence */}
      {knnResult && (
        <div className="space-y-4 pt-1 animate-fadeIn">
          {/* Step 1: k Nearest Neighbors Ranking */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
                <span>가장 가까운 이웃 {kParam}개 (거리 순위)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">유클리드 거리 기준 오름차순</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {knnResult.neighbors.map((n, idx) => (
                <div
                  key={`rank-${n.record.id}-${idx}`}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <SpeciesBadge species={n.record.species} size="xs" />
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-xs text-slate-800">
                      {n.distance} cm
                    </span>
                    <span className="block text-[9px] text-slate-400 font-mono">
                      {n.record[xKey]} × {n.record[yKey]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 2: Majority Vote Breakdown */}
          <div className="space-y-2">
            <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">2</span>
              <span>이웃들의 투표 결과 (다수결)</span>
            </span>

            <div className="grid grid-cols-3 gap-2 text-center">
              {ALL_SPECIES_LIST.map(sp => {
                const conf = getSpeciesConfig(sp);
                const voteCount = knnResult.votes[sp] || 0;
                const isWinner = winningDetails?.species === sp;

                return (
                  <div
                    key={`vote-${sp}`}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      isWinner
                        ? 'border-emerald-600 bg-emerald-50/90 text-emerald-950 ring-2 ring-emerald-200 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 font-bold text-xs">
                      <span style={{ color: conf.hexColor }}>{conf.symbol}</span>
                      <span>{conf.koreanName}</span>
                    </div>
                    <div className="font-mono font-black text-lg mt-1">
                      {voteCount} <span className="text-xs font-sans font-medium">표</span>
                    </div>
                    {isWinner && (
                      <span className="inline-block mt-1 text-[10px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                        최다 득표
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tie-breaking note if occurred */}
            {isTieBroken && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 text-[11px] font-bold">
                💡 <strong>동률 처리:</strong> {winningConf?.koreanName}와 다른 품종의 득표수가 같아, 이웃들과의 평균 거리({winningDetails?.avgDistance}cm)가 더 가까운 {winningConf?.koreanName}(으)로 판정되었습니다.
              </div>
            )}
          </div>

          {/* Step 3: Final Prediction & Explanation */}
          <div className="p-4 rounded-xl bg-emerald-600 text-white space-y-2 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500 pb-2">
              <span className="text-emerald-100 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 size={16} />
                최종 k-NN 판정 결과 (k={kParam})
              </span>
              <SpeciesBadge species={knnResult.predictedSpecies} showEnglish size="md" variant="solid" />
            </div>

            <p className="text-emerald-50 text-xs leading-relaxed font-medium">
              k={kParam}일 때 가장 가까운 {kParam}개 붓꽃 중 {winningConf?.symbol} {winningConf?.koreanName}가 {winningDetails?.count}표로 가장 많아, 모델이 최종적으로 <strong>{winningConf?.koreanName}</strong>(으)로 예측하였습니다.
            </p>
          </div>
        </div>
      )}

      {/* Train/Test Isolation Context Notice */}
      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[10px] text-slate-500 leading-relaxed font-medium">
        🔒 <strong>데이터 분리 원칙:</strong> 위 산점도에는 Step 3에서 예측 기준으로 준비한 Train 데이터({trainData.length}개)만 표시됩니다. Test 데이터는 모델이 학습 및 예측 과정에서 미리 볼 수 없도록 08 성능 평가 단계 전까지 격리되어 있습니다.
      </div>
    </div>
  );
};
