import React, { useState, useEffect } from 'react';
import { ORIGINAL_IRIS_DATASET, SPECIES_MAP } from '../../data/irisDataset';
import type { IrisRecord, IrisSpecies } from '../../types/iris';
import { predictKNN, findBoundaryCase } from '../../algorithms/knn';
import { SecondaryButton } from '../common/SecondaryButton';
import { Target, Sparkles, HelpCircle, Eye, Sliders } from 'lucide-react';
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

export const KNNLab: React.FC = () => {
  const [xAxis, setXAxis] = useState<FeatureKey>('petalLength');
  const [yAxis, setYAxis] = useState<FeatureKey>('petalWidth');

  const [saved04Features, setSaved04Features] = useState<[FeatureKey, FeatureKey] | null>(null);

  const [newPoint, setNewPoint] = useState<Record<FeatureKey, number>>({
    sepalLength: 6.0,
    sepalWidth: 3.0,
    petalLength: 4.8,
    petalWidth: 1.6,
  });

  const [k, setK] = useState<number>(5);
  const [isBoundaryLoaded, setIsBoundaryLoaded] = useState(false);
  const [userObservationChoice, setUserObservationChoice] = useState<string | null>(null);

  // Load selected features from Module 04 if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SELECTED_FEATURES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 2) {
          setSaved04Features([parsed[0] as FeatureKey, parsed[1] as FeatureKey]);
        }
      }
    } catch {}
  }, []);

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

  const apply04Features = () => {
    if (saved04Features) {
      setXAxis(saved04Features[0]);
      setYAxis(saved04Features[1]);
    }
  };

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

      {/* Lab Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="font-extrabold text-slate-900 block flex items-center gap-1.5">
            <Sliders size={16} className="text-emerald-600" />
            <span>[무엇을 바꿀 수 있나요?]</span>
          </span>
          <p className="text-slate-600 leading-relaxed font-medium">
            이웃 수 <strong>k값(1, 3, 5, 7)</strong>과 축 속성, 그리고 새로운 붓꽃 데이터 수치를 직접 조절할 수 있습니다.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="font-extrabold text-slate-900 block flex items-center gap-1.5">
            <Eye size={16} className="text-blue-600" />
            <span>[무엇을 관찰하면 되나요?]</span>
          </span>
          <p className="text-slate-600 leading-relaxed font-medium">
            k값을 바꿀 때 가장 가까운 k개 이웃 데이터점의 분포와 최종 분류 결과(품종)가 어떻게 달라지는지 관찰하세요.
          </p>
        </div>
      </div>

      {/* Control Panel Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Target size={20} className="text-emerald-600" />
            <span>k-NN (최근접 이웃) 조건 설정</span>
          </h3>

          <SecondaryButton size="sm" onClick={handleLoadBoundaryCase} icon={<Sparkles size={14} className="text-amber-500" />}>
            경계선 헷갈리는 모호한 사례 불러오기
          </SecondaryButton>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* k Value Selection */}
          <div>
            <span className="font-bold text-slate-700 block mb-1.5">이웃 개수 k 설정:</span>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 3, 5, 7].map(kVal => (
                <button
                  key={kVal}
                  onClick={() => {
                    setK(kVal);
                    setIsBoundaryLoaded(false);
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
              <option value="sepalLength">꽃받침 길이 (sepalLength)</option>
              <option value="sepalWidth">꽃받침 너비 (sepalWidth)</option>
              <option value="petalLength">꽃잎 길이 (petalLength)</option>
              <option value="petalWidth">꽃잎 너비 (petalWidth)</option>
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
              <option value="sepalLength">꽃받침 길이 (sepalLength)</option>
              <option value="sepalWidth">꽃받침 너비 (sepalWidth)</option>
              <option value="petalLength">꽃잎 길이 (petalLength)</option>
              <option value="petalWidth">꽃잎 너비 (petalWidth)</option>
            </select>
          </div>
        </div>

        {/* Input sliders for New Data Point */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
          <span className="font-extrabold text-slate-900 block">
            새로운 붓꽃 측정치 조정 ({FEATURE_NAMES[xAxis]} vs {FEATURE_NAMES[yAxis]}):
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[xAxis, yAxis].map(feat => {
              const spec = FEATURE_MIN_MAX[feat];
              const val = newPoint[feat];

              return (
                <div key={feat} className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>{FEATURE_NAMES[feat]}</span>
                    <span className="font-mono text-emerald-700 font-black">{val} cm</span>
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
        <div className="p-4 bg-emerald-600 text-white rounded-xl space-y-2 text-xs shadow-xs">
          <div className="flex items-center justify-between border-b border-emerald-500 pb-2">
            <span className="font-black text-sm uppercase tracking-wider">k-NN 분류 결과 (k={k})</span>
            {isBoundaryLoaded && (
              <span className="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded text-[10px]">
                경계 사례 테스트 중
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-emerald-100 text-[11px] block">예측된 품종</span>
              <span className="text-xl font-black">{SPECIES_MAP[knnResult.predictedSpecies].korean}</span>
              <span className="text-[11px] text-emerald-200 block font-mono">({knnResult.predictedSpecies})</span>
            </div>

            <div className="text-right">
              <span className="text-emerald-100 text-[11px] block">가장 가까운 k={k}개 이웃 득표율</span>
              <div className="font-mono text-sm font-bold">
                {Object.entries(knnResult.votes)
                  .map(([sp, cnt]) => `${SPECIES_MAP[sp as IrisSpecies].korean}: ${cnt}표`)
                  .join(' / ')}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive SVG 2D Scatter Plot */}
        <div className="space-y-2 text-xs">
          <span className="font-bold text-slate-800 block">
            2D 산점도 및 최근접 {k}개 이웃 이음선 시각화
          </span>

          <div className="w-full overflow-x-auto bg-slate-50 p-3 rounded-xl border border-slate-200">
            <svg viewBox="0 0 460 300" className="w-full h-auto min-w-[320px]">
              {(() => {
                const xMin = FEATURE_MIN_MAX[xAxis].min;
                const xMax = FEATURE_MIN_MAX[xAxis].max;
                const yMin = FEATURE_MIN_MAX[yAxis].min;
                const yMax = FEATURE_MIN_MAX[yAxis].max;

                const mapX = (v: number) => 50 + ((v - xMin) / (xMax - xMin)) * 380;
                const mapY = (v: number) => 260 - ((v - yMin) / (yMax - yMin)) * 220;

                const newX = mapX(newPoint[xAxis]);
                const newY = mapY(newPoint[yAxis]);

                return (
                  <g>
                    {/* Axes */}
                    <line x1="45" y1="260" x2="445" y2="260" stroke="#cbd5e1" strokeWidth="2" />
                    <line x1="45" y1="20" x2="45" y2="260" stroke="#cbd5e1" strokeWidth="2" />

                    {/* Labels */}
                    <text x="245" y="290" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#475569">
                      {FEATURE_NAMES[xAxis]}
                    </text>
                    <text x="15" y="140" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#475569" transform="rotate(-90 15 140)">
                      {FEATURE_NAMES[yAxis]}
                    </text>

                    {/* Neighbor connecting lines */}
                    {knnResult.neighbors.map((n, i) => {
                      const nX = mapX(n.record[xAxis]);
                      const nY = mapY(n.record[yAxis]);
                      return (
                        <line
                          key={i}
                          x1={newX}
                          y1={newY}
                          x2={nX}
                          y2={nY}
                          stroke="#e11d48"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                        />
                      );
                    })}

                    {/* Dataset Points */}
                    {ORIGINAL_IRIS_DATASET.map(r => {
                      const cx = mapX(r[xAxis]);
                      const cy = mapY(r[yAxis]);
                      const isNeighbor = knnResult.neighbors.some(n => n.record.id === r.id);

                      if (r.species === 'Iris-setosa') {
                        return <circle key={r.id} cx={cx} cy={cy} r={isNeighbor ? '5' : '3'} fill="#10b981" stroke={isNeighbor ? '#000' : 'none'} strokeWidth="1.5" />;
                      } else if (r.species === 'Iris-versicolor') {
                        return <rect key={r.id} x={cx - 3} y={cy - 3} width="6" height="6" fill="#3b82f6" stroke={isNeighbor ? '#000' : 'none'} strokeWidth="1.5" rx="1" />;
                      } else {
                        return <polygon key={r.id} points={`${cx},${cy-4} ${cx+4},${cy+3} ${cx-4},${cy+3}`} fill="#8b5cf6" stroke={isNeighbor ? '#000' : 'none'} strokeWidth="1.5" />;
                      }
                    })}

                    {/* New Query Point */}
                    <g>
                      <circle cx={newX} cy={newY} r="12" fill="#e11d48" fillOpacity="0.3" stroke="#e11d48" strokeWidth="2" strokeDasharray="3 3" />
                      <circle cx={newX} cy={newY} r="6" fill="#e11d48" stroke="#ffffff" strokeWidth="2" />
                      <text x={newX} y={newY - 14} textAnchor="middle" fontSize="10" fontWeight="black" fill="#e11d48">
                        새 입력값
                      </text>
                    </g>
                  </g>
                );
              })()}
            </svg>
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
                onClick={() => setUserObservationChoice(opt.key)}
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
