import React, { useState, useRef, useMemo } from 'react';
import { ORIGINAL_IRIS_DATASET } from '../../data/irisDataset';
import type { IrisRecord, ErrorIrisRecord } from '../../types/iris';
import { predictKNN, findBoundaryCase } from '../../algorithms/knn';
import { getUsableIrisRecords } from '../../utils/irisHelpers';
import { LabDataStatusBadge } from './LabDataStatusBadge';
import { SecondaryButton } from '../common/SecondaryButton';
import { SpeciesBadge } from '../common/SpeciesBadge';
import { SpeciesMarker } from '../common/SpeciesMarker';
import { ALL_SPECIES_LIST } from '../../constants/species';
import { Target, Sparkles, HelpCircle, Eye, Sliders, MousePointerClick } from 'lucide-react';
import { SELECTED_FEATURES_KEY } from '../../utils/storage';

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

export interface KNNLabProps {
  dataset?: ErrorIrisRecord[];
  onInteract?: () => void;
}

export const KNNLab: React.FC<KNNLabProps> = ({ dataset, onInteract }) => {
  const [xAxis, setXAxis] = useState<FeatureKey>(() => {
    try {
      const saved = localStorage.getItem(SELECTED_FEATURES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 2) return parsed[0] as FeatureKey;
      }
    } catch {}
    return 'petalLength';
  });

  const [yAxis, setYAxis] = useState<FeatureKey>(() => {
    try {
      const saved = localStorage.getItem(SELECTED_FEATURES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 2) return parsed[1] as FeatureKey;
      }
    } catch {}
    return 'petalWidth';
  });

  const [saved04Features] = useState<[FeatureKey, FeatureKey] | null>(() => {
    try {
      const saved = localStorage.getItem(SELECTED_FEATURES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 2) {
          return [parsed[0] as FeatureKey, parsed[1] as FeatureKey];
        }
      }
    } catch {}
    return null;
  });

  const [newPoint, setNewPoint] = useState<Record<FeatureKey, number>>({
    sepalLength: 6.0,
    sepalWidth: 3.0,
    petalLength: 4.8,
    petalWidth: 1.6,
  });

  const [rawInputs, setRawInputs] = useState<Record<FeatureKey, string>>({
    sepalLength: '6.0',
    sepalWidth: '3.0',
    petalLength: '4.8',
    petalWidth: '1.6',
  });

  const [k, setK] = useState<number>(5);
  const [isBoundaryLoaded, setIsBoundaryLoaded] = useState(false);
  const [userObservationChoice, setUserObservationChoice] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Safe dataset filtering: require finite numeric values for chosen axes and canonical species
  const effectiveDataset = dataset || (ORIGINAL_IRIS_DATASET as any[]);

  const { usableData, excludedCount, usableCount, totalCount } = useMemo(
    () => getUsableIrisRecords(effectiveDataset, [xAxis, yAxis], true),
    [effectiveDataset, xAxis, yAxis]
  );

  // Compute prediction with current settings on usable dataset
  const knnResult = useMemo(
    () => predictKNN(usableData as IrisRecord[], newPoint, [xAxis, yAxis], k),
    [usableData, newPoint, xAxis, yAxis, k]
  );

  const handleAdjustValue = (feat: FeatureKey, delta: number) => {
    const spec = FEATURE_MIN_MAX[feat];
    setNewPoint(prev => {
      const nextVal = Math.round((prev[feat] + delta) * 10) / 10;
      const clamped = Math.min(spec.max, Math.max(spec.min, nextVal));
      setRawInputs(r => ({ ...r, [feat]: String(clamped) }));
      return { ...prev, [feat]: clamped };
    });
    setIsBoundaryLoaded(false);
    onInteract?.();
  };

  const handleDirectNumberInput = (feat: FeatureKey, rawVal: string) => {
    let cleaned = rawVal;
    if (/^0[0-9]/.test(cleaned)) {
      cleaned = cleaned.replace(/^0+(?=[1-9])/, '');
    }
    setRawInputs(prev => ({ ...prev, [feat]: cleaned }));

    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed)) {
      setNewPoint(prev => ({ ...prev, [feat]: Math.round(parsed * 10) / 10 }));
      setIsBoundaryLoaded(false);
      onInteract?.();
    }
  };

  const handleBlurInput = (feat: FeatureKey) => {
    const spec = FEATURE_MIN_MAX[feat];
    const str = (rawInputs[feat] || '').trim();
    if (str === '' || isNaN(Number(str))) {
      setRawInputs(prev => ({ ...prev, [feat]: String(newPoint[feat]) }));
    } else {
      const parsed = parseFloat(str);
      const clamped = Math.min(spec.max, Math.max(spec.min, Math.round(parsed * 10) / 10));
      setNewPoint(prev => ({ ...prev, [feat]: clamped }));
      setRawInputs(prev => ({ ...prev, [feat]: String(clamped) }));
    }
  };

  const handleLoadBoundaryCase = () => {
    const bCase = findBoundaryCase(usableData as IrisRecord[], [xAxis, yAxis]);
    if (bCase) {
      setNewPoint(prev => ({
        ...prev,
        ...bCase.point,
      }));
      setRawInputs(prev => ({
        ...prev,
        sepalLength: String(bCase.point.sepalLength ?? prev.sepalLength),
        sepalWidth: String(bCase.point.sepalWidth ?? prev.sepalWidth),
        petalLength: String(bCase.point.petalLength ?? prev.petalLength),
        petalWidth: String(bCase.point.petalWidth ?? prev.petalWidth),
      }));
      setIsBoundaryLoaded(true);
      onInteract?.();
    }
  };

  const apply04Features = () => {
    if (saved04Features) {
      setXAxis(saved04Features[0]);
      setYAxis(saved04Features[1]);
    }
  };

  // SVG coordinate transformation logic with dynamic bounds for outliers
  const svgWidth = 460;
  const svgHeight = 300;
  const plotLeft = 50;
  const plotRight = 430;
  const plotTop = 30;
  const plotBottom = 250;
  const plotW = plotRight - plotLeft;
  const plotH = plotBottom - plotTop;

  const xSpec = FEATURE_MIN_MAX[xAxis];
  const ySpec = FEATURE_MIN_MAX[yAxis];

  const axisMinX = Math.min(xSpec.min, ...usableData.map(r => (typeof r[xAxis] === 'number' ? (r[xAxis] as number) : xSpec.min)));
  const axisMaxX = Math.max(xSpec.max, ...usableData.map(r => (typeof r[xAxis] === 'number' ? (r[xAxis] as number) : xSpec.max)));
  const axisMinY = Math.min(ySpec.min, ...usableData.map(r => (typeof r[yAxis] === 'number' ? (r[yAxis] as number) : ySpec.min)));
  const axisMaxY = Math.max(ySpec.max, ...usableData.map(r => (typeof r[yAxis] === 'number' ? (r[yAxis] as number) : ySpec.max)));

  const mapX = (v: number) => plotLeft + ((v - axisMinX) / (axisMaxX - axisMinX || 1)) * plotW;
  const mapY = (v: number) => plotBottom - ((v - axisMinY) / (axisMaxY - axisMinY || 1)) * plotH;

  // Pointer Event to convert screen touch/click -> exact dataset domain coordinates
  const handlePlotPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const svgX = (clientX / rect.width) * svgWidth;
    const svgY = (clientY / rect.height) * svgHeight;

    // Constrain to plot area
    const clampedSvgX = Math.max(plotLeft, Math.min(plotRight, svgX));
    const clampedSvgY = Math.max(plotTop, Math.min(plotBottom, svgY));

    const domainX = axisMinX + ((clampedSvgX - plotLeft) / plotW) * (axisMaxX - axisMinX);
    const domainY = axisMinY + ((plotBottom - clampedSvgY) / plotH) * (axisMaxY - axisMinY);

    const roundedX = Math.round(domainX * 10) / 10;
    const roundedY = Math.round(domainY * 10) / 10;

    const clX = Math.min(axisMaxX, Math.max(axisMinX, roundedX));
    const clY = Math.min(axisMaxY, Math.max(axisMinY, roundedY));
    setNewPoint(prev => ({
      ...prev,
      [xAxis]: clX,
      [yAxis]: clY,
    }));
    setRawInputs(r => ({
      ...r,
      [xAxis]: String(clX),
      [yAxis]: String(clY),
    }));
    setIsBoundaryLoaded(false);
    onInteract?.();
  };

  const newX = mapX(newPoint[xAxis]);
  const newY = mapY(newPoint[yAxis]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 04 Connection Banner */}
      {saved04Features && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="space-y-0.5">
            <span className="font-extrabold text-sm text-emerald-900 flex items-center gap-1.5">
              <Sparkles size={16} className="text-amber-500" />
              <span>04 데이터 전처리 연동 안내</span>
            </span>
            <p className="text-emerald-800">
              전처리 단계에서 선택하신 핵심 속성 <strong>[{FEATURE_NAMES[saved04Features[0]]}]</strong> 및 <strong>[{FEATURE_NAMES[saved04Features[1]]}]</strong>(으)로 k-NN 시뮬레이션을 먼저 진행해볼 수 있습니다.
            </p>
          </div>
          <button
            onClick={apply04Features}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shrink-0 transition-colors"
          >
            04 선택 속성 적용하기
          </button>
        </div>
      )}

      {/* Prepared Dataset Status Badge */}
      <LabDataStatusBadge totalCount={totalCount} usableCount={usableCount} excludedCount={excludedCount} />

      {/* Lab Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="font-extrabold text-slate-900 block flex items-center gap-1.5">
            <Sliders size={16} className="text-emerald-600" />
            <span>[무엇을 바꿀 수 있나요?]</span>
          </span>
          <p className="text-slate-600 leading-relaxed font-medium">
            이웃 수 <strong>k값(1, 3, 5, 7)</strong>과 축 속성을 바꾸고, <strong>산점도 그래프를 직접 터치/클릭</strong>하거나 숫자 입력으로 새로운 붓꽃 위치를 자유롭게 이동시킬 수 있습니다.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="font-extrabold text-slate-900 block flex items-center gap-1.5">
            <Eye size={16} className="text-blue-600" />
            <span>[무엇을 관찰하면 되나요?]</span>
          </span>
          <p className="text-slate-600 leading-relaxed font-medium">
            k값을 바꿀 때 가장 가까운 <strong>정확히 k개의 이웃 연결선</strong>과 거리 순위, 그리고 최종 예측 품종 다수결 결과가 어떻게 달라지는지 관찰하세요.
          </p>
        </div>
      </div>

      {/* Control Panel Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Target size={20} className="text-emerald-600" />
            <span>k-NN (최근접 이웃) 조건 설정 & 인터랙티브 탐색</span>
          </h3>

          <SecondaryButton size="sm" onClick={handleLoadBoundaryCase} icon={<Sparkles size={14} className="text-amber-500" />}>
            경계선 헷갈리는 모호한 사례 불러오기
          </SecondaryButton>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* k Value Selection */}
          <div>
            <span className="font-bold text-slate-700 block mb-1.5">이웃 개수 k 설정 (연결선 개수):</span>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 3, 5, 7].map(kVal => (
                <button
                  key={kVal}
                  onClick={() => {
                    setK(kVal);
                    setIsBoundaryLoaded(false);
                    onInteract?.();
                  }}
                  className={`p-2.5 rounded-xl font-mono font-bold text-sm cursor-pointer min-h-[44px] transition-all ${
                    k === kVal
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  k={kVal}
                </button>
              ))}
            </div>
          </div>

          {/* X Axis */}
          <div>
            <span className="font-bold text-slate-700 block mb-1.5">X축 속성:</span>
            <select
              value={xAxis}
              onChange={e => setXAxis(e.target.value as FeatureKey)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs min-h-[44px] cursor-pointer"
            >
              <option value="petalLength">꽃잎 길이 (petalLength)</option>
              <option value="petalWidth">꽃잎 너비 (petalWidth)</option>
              <option value="sepalLength">꽃받침 길이 (sepalLength)</option>
              <option value="sepalWidth">꽃받침 너비 (sepalWidth)</option>
            </select>
          </div>

          {/* Y Axis */}
          <div>
            <span className="font-bold text-slate-700 block mb-1.5">Y축 속성:</span>
            <select
              value={yAxis}
              onChange={e => setYAxis(e.target.value as FeatureKey)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs min-h-[44px] cursor-pointer"
            >
              <option value="petalWidth">꽃잎 너비 (petalWidth)</option>
              <option value="petalLength">꽃잎 길이 (petalLength)</option>
              <option value="sepalLength">꽃받침 길이 (sepalLength)</option>
              <option value="sepalWidth">꽃받침 너비 (sepalWidth)</option>
            </select>
          </div>
        </div>

        {/* Input sliders & text inputs for New Data Point */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="font-extrabold text-slate-900 block">
              새로운 붓꽃 측정치 조정 ({FEATURE_NAMES[xAxis]} vs {FEATURE_NAMES[yAxis]}):
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              💡 숫자 박스에 직접 타이핑하거나 슬라이더, 산점도 터치로 변경할 수 있습니다.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[xAxis, yAxis].map(feat => {
              const spec = FEATURE_MIN_MAX[feat];
              const val = newPoint[feat];

              return (
                <div key={feat} className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center font-bold text-slate-800">
                    <span>{FEATURE_NAMES[feat]}</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={rawInputs[feat] !== undefined ? rawInputs[feat] : String(val)}
                        onChange={e => handleDirectNumberInput(feat, e.target.value)}
                        onBlur={() => handleBlurInput(feat)}
                        placeholder={String(val)}
                        className="w-20 p-1.5 text-right font-mono font-black text-emerald-700 border border-slate-300 rounded-lg bg-emerald-50/50 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                        setRawInputs(prev => ({ ...prev, [feat]: String(nV) }));
                        setIsBoundaryLoaded(false);
                      }}
                      className="w-full accent-emerald-600 cursor-pointer"
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

        {/* Prediction Output Metric Card */}
        <div className="p-4 bg-emerald-700 text-white rounded-xl space-y-2 text-xs shadow-xs">
          <div className="flex items-center justify-between border-b border-emerald-600 pb-2">
            <span className="font-black text-sm uppercase tracking-wider">k-NN 다수결 분류 결과 (k={k})</span>
            {isBoundaryLoaded && (
              <span className="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded text-[10px]">
                경계 사례 테스트 중
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-emerald-100 text-[11px] block mb-1">예측된 품종</span>
              <SpeciesBadge species={knnResult.predictedSpecies} showEnglish size="lg" variant="solid" />
            </div>

            <div className="sm:text-right">
              <span className="text-emerald-100 text-[11px] block mb-1">가장 가까운 k={k}개 이웃 득표율</span>
              <div className="flex flex-wrap gap-1.5 sm:justify-end">
                {ALL_SPECIES_LIST.map(spKey => {
                  const voteCount = knnResult.votes[spKey] || 0;
                  return (
                    <span key={spKey} className="inline-flex items-center gap-1 font-mono text-xs font-bold bg-white/90 text-slate-800 px-2 py-1 rounded-lg border border-emerald-400">
                      <SpeciesBadge species={spKey} size="xs" variant="subtle" />
                      <span>: {voteCount}표</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive SVG 2D Scatter Plot */}
        <div className="space-y-2 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <MousePointerClick size={16} className="text-emerald-600" />
              <span>2D 산점도 (터치/클릭하여 새 붓꽃 위치 이동 & 최근접 {k}개 연결선)</span>
            </span>
            <span className="text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 text-[11px]">
              👉 그래프의 원하는 위치를 터치하거나 클릭해보세요!
            </span>
          </div>

          {/* Accessible Legend Bar with Exact Shapes */}
          <div className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="font-extrabold text-slate-700 text-xs shrink-0">품종 범례:</span>
            {ALL_SPECIES_LIST.map(spKey => (
              <SpeciesBadge key={spKey} species={spKey} showEnglish size="xs" />
            ))}
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200 sm:ml-auto">
              <span>★</span>
              <span>새 입력 관측점</span>
            </span>
          </div>

          <div className="w-full overflow-hidden bg-slate-50 p-2 sm:p-3 rounded-2xl border border-slate-200 touch-none select-none">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              onPointerDown={handlePlotPointerDown}
              className="w-full h-auto cursor-crosshair rounded-xl bg-white shadow-2xs border border-slate-100"
            >
              {/* Axes */}
              <line x1={plotLeft} y1={plotBottom} x2={plotRight} y2={plotBottom} stroke="#cbd5e1" strokeWidth="2" />
              <line x1={plotLeft} y1={plotTop} x2={plotLeft} y2={plotBottom} stroke="#cbd5e1" strokeWidth="2" />

              {/* Grid Lines */}
              <line x1={plotLeft} y1={plotTop} x2={plotRight} y2={plotTop} stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1={plotRight} y1={plotTop} x2={plotRight} y2={plotBottom} stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1={plotLeft} y1={(plotTop + plotBottom) / 2} x2={plotRight} y2={(plotTop + plotBottom) / 2} stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1={(plotLeft + plotRight) / 2} y1={plotTop} x2={(plotLeft + plotRight) / 2} y2={plotBottom} stroke="#f1f5f9" strokeDasharray="3 3" />

              {/* Axis Ticks & Labels */}
              <text x={plotLeft} y={plotBottom + 14} textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">
                {axisMinX}
              </text>
              <text x={plotRight} y={plotBottom + 14} textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">
                {axisMaxX}
              </text>
              <text x={(plotLeft + plotRight) / 2} y={plotBottom + 18} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#334155">
                {FEATURE_NAMES[xAxis]}
              </text>

              <text x={plotLeft - 10} y={plotBottom} textAnchor="end" fontSize="9" fill="#64748b" fontFamily="monospace">
                {axisMinY}
              </text>
              <text x={plotLeft - 10} y={plotTop + 6} textAnchor="end" fontSize="9" fill="#64748b" fontFamily="monospace">
                {axisMaxY}
              </text>
              <text x="15" y={(plotTop + plotBottom) / 2} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#334155" transform={`rotate(-90 15 ${(plotTop + plotBottom) / 2})`}>
                {FEATURE_NAMES[yAxis]}
              </text>

              {/* Exact k Neighbor connecting lines */}
              {knnResult.neighbors.map((n, i) => {
                const nX = mapX(n.record[xAxis]);
                const nY = mapY(n.record[yAxis]);
                return (
                  <g key={`neighbor-line-${n.record.id}-${i}`}>
                    <line
                      x1={newX}
                      y1={newY}
                      x2={nX}
                      y2={nY}
                      stroke="#f43f5e"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                    />
                    {/* Number Badge at Midpoint */}
                    <circle
                      cx={(newX + nX) / 2}
                      cy={(newY + nY) / 2}
                      r="7"
                      fill="#f43f5e"
                    />
                    <text
                      x={(newX + nX) / 2}
                      y={(newY + nY) / 2 + 3}
                      textAnchor="middle"
                      fontSize="8"
                      fontWeight="bold"
                      fill="#ffffff"
                    >
                      {i + 1}
                    </text>
                  </g>
                );
              })}

              {/* Dataset Points with Exact Shapes (Circle: Setosa, Triangle: Versicolor, Square: Virginica) */}
              {usableData.map(r => {
                const cx = mapX(r[xAxis] as number);
                const cy = mapY(r[yAxis] as number);
                const isNeighbor = knnResult.neighbors.some(n => n.record.id === r.id);

                return (
                  <SpeciesMarker
                    key={r.id}
                    species={r.species as any}
                    cx={cx}
                    cy={cy}
                    size={isNeighbor ? 6.5 : 4.5}
                    stroke={isNeighbor ? '#000000' : '#ffffff'}
                    strokeWidth={isNeighbor ? 2 : 1}
                    opacity={isNeighbor ? 1 : 0.75}
                  />
                );
              })}

              {/* New Query Point */}
              {(() => {
                const badgeW = 54;
                const badgeX = Math.max(plotLeft + badgeW / 2 + 2, Math.min(plotRight - badgeW / 2 - 2, newX));
                const badgeY = newY < plotTop + 28 ? newY + 20 : newY - 14;
                return (
                  <g>
                    <circle cx={newX} cy={newY} r="15" fill="#f43f5e" fillOpacity="0.2" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="3 3" className="animate-pulse" />
                    <circle cx={newX} cy={newY} r="7" fill="#f43f5e" stroke="#ffffff" strokeWidth="2.5" />
                    <rect x={badgeX - badgeW / 2} y={badgeY - 10} width={badgeW} height="15" rx="4" fill="#f43f5e" />
                    <text x={badgeX} y={badgeY + 1} textAnchor="middle" fontSize="9" fontWeight="black" fill="#ffffff">
                      ★ 새 입력
                    </text>
                  </g>
                );
              })()}
            </svg>
          </div>

          {/* Current Query Point Summary Card */}
          <div className="p-3.5 bg-rose-50/80 rounded-xl border border-rose-200 text-xs flex flex-wrap items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-rose-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                ★
              </span>
              <div>
                <span className="font-extrabold text-slate-900 block">현재 새 붓꽃 관측점 좌표</span>
                <span className="text-[11px] text-rose-900 font-medium">
                  {FEATURE_NAMES[xAxis].split(' ')[0]}: <strong className="font-mono">{newPoint[xAxis]}cm</strong> &nbsp;|&nbsp; {FEATURE_NAMES[yAxis].split(' ')[0]}: <strong className="font-mono">{newPoint[yAxis]}cm</strong>
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block font-semibold mb-0.5">k={k} 다수결 예측 결과</span>
              <SpeciesBadge species={knnResult.predictedSpecies} showEnglish size="sm" />
            </div>
          </div>

          {/* Nearest Neighbors Ranked Distance Cards */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-extrabold text-slate-800 block text-xs flex items-center justify-between">
              <span>🎯 가장 가까운 k={k}개 이웃 거리 순위:</span>
              <span className="text-[11px] text-slate-500 font-mono">유클리드 거리 기준 오름차순</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {knnResult.neighbors.map((n, i) => (
                <div key={n.record.id} className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div>
                      <SpeciesBadge species={n.record.species} size="xs" />
                      <span className="text-[10px] text-slate-500 font-mono block">ID #{n.record.id}</span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-emerald-700 font-bold text-xs">{n.distance.toFixed(2)} cm</span>
                    <span className="text-[10px] text-slate-500 block">거리</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Observation Question Card (Section 5) */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
          <span className="font-extrabold text-slate-900 block text-sm flex items-center gap-1.5">
            <HelpCircle size={16} className="text-emerald-600" />
            <span>[핵심 관찰 질문] k-NN 이웃 개수(k)와 분류 결과</span>
          </span>

          <p className="text-slate-700 font-medium leading-relaxed">
            질문: <strong>k 값이 커지면 모델은 주변 몇 개의 데이터를 참고하게 되나요? k 값을 바꾸면 새로운 데이터의 분류 결과가 달라질 수 있을까요?</strong>
          </p>

          <div className="space-y-2">
            {[
              {
                key: 'ans1',
                label: '네. k 값이 커질수록 더 많은 이웃(k개)의 표를 종합하므로, 경계에 있는 데이터의 예측 결과가 달라질 수 있습니다.',
              },
              {
                key: 'ans2',
                label: '아니요. k 값을 아무리 바꾸어도 분류 결과는 항상 완전히 동일합니다.',
              },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => {
                  setUserObservationChoice(opt.key);
                  onInteract?.();
                }}
                className={`w-full text-left p-3 rounded-xl border font-bold transition-all min-h-[44px] cursor-pointer ${
                  userObservationChoice === opt.key
                    ? opt.key === 'ans1'
                      ? 'bg-emerald-600 text-white border-emerald-600'
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
                  ? 'bg-emerald-50 text-emerald-950 border border-emerald-200'
                  : 'bg-rose-50 text-rose-950 border border-rose-200'
              }`}
            >
              {userObservationChoice === 'ans1' ? (
                <span>
                  ✓ <strong>정답입니다!</strong> k-NN은 가장 가까운 k개의 이웃 다수결 득표에 의해 분류가 결정되므로, k값이 변화하면 다수표를 얻는 품종이 바뀌어 예측 결과가 달라질 수 있습니다.
                </span>
              ) : (
                <span>
                  X 다시 확인해보세요. k=1일 때는 가장 가까운 1개 점만 참고하지만, k=7일 때는 7개 점을 참고하므로 경계 영역에서 예측 품종 결과가 달라질 수 있습니다.
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
