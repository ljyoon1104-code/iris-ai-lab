import React, { useState, useRef } from 'react';
import { ORIGINAL_IRIS_DATASET } from '../../data/irisDataset';
import {
  trainLinearRegression,
  predictLinearRegression,
  type FeatureKey,
} from '../../algorithms/linearRegression';
import { LineChart, Sliders, Eye, HelpCircle, MousePointerClick } from 'lucide-react';

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

export const LinearRegressionLab: React.FC = () => {
  const [xAxis, setXAxis] = useState<FeatureKey>('petalLength');
  const [yAxis, setYAxis] = useState<FeatureKey>('petalWidth');

  const [inputX, setInputX] = useState<number>(4.5);
  const [isManualMode, setIsManualMode] = useState<boolean>(false);
  const [manualSlope, setManualSlope] = useState<number>(0.3);
  const [manualIntercept, setManualIntercept] = useState<number>(0.0);

  const [userObservationChoice, setUserObservationChoice] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Train OLS model
  const regResult = trainLinearRegression(ORIGINAL_IRIS_DATASET, xAxis, yAxis);
  const predictedY = predictLinearRegression(regResult.slope, regResult.intercept, inputX);
  const manualPredY = predictLinearRegression(manualSlope, manualIntercept, inputX);

  // SVG bounds
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

  const activeSlope = isManualMode ? manualSlope : regResult.slope;
  const activeIntercept = isManualMode ? manualIntercept : regResult.intercept;
  const activePredY = isManualMode ? manualPredY : predictedY;

  const lineX1Val = xSpec.min;
  const lineY1Val = predictLinearRegression(activeSlope, activeIntercept, lineX1Val);
  const lineX2Val = xSpec.max;
  const lineY2Val = predictLinearRegression(activeSlope, activeIntercept, lineX2Val);

  const handleDirectNumberInput = (rawVal: string) => {
    const parsed = parseFloat(rawVal);
    if (!isNaN(parsed)) {
      const clamped = Math.min(xSpec.max, Math.max(xSpec.min, parsed));
      setInputX(Math.round(clamped * 10) / 10);
    }
  };

  // Pointerdown on chart to change X value
  const handlePlotPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;

    const svgX = (clientX / rect.width) * svgWidth;
    const clampedSvgX = Math.max(paddingLeft, Math.min(svgWidth - paddingRight, svgX));

    const domainX = xSpec.min + ((clampedSvgX - paddingLeft) / plotW) * (xSpec.max - xSpec.min);
    const roundedX = Math.round(domainX * 10) / 10;
    setInputX(Math.min(xSpec.max, Math.max(xSpec.min, roundedX)));
  };

  const predSvgX = getSvgX(inputX);
  const predSvgY = getSvgY(activePredY);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="font-extrabold text-slate-900 block flex items-center gap-1.5">
            <Sliders size={16} className="text-emerald-600" />
            <span>[무엇을 바꿀 수 있나요?]</span>
          </span>
          <p className="text-slate-600 leading-relaxed font-medium">
            x축/y축 측정 수치 속성을 고르고, <strong>숫자를 직접 입력하거나 회귀 그래프의 원하는 x 위치를 터치</strong>하여 입력값에 따른 예측치를 즉시 계산할 수 있습니다.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="font-extrabold text-slate-900 block flex items-center gap-1.5">
            <Eye size={16} className="text-blue-600" />
            <span>[무엇을 관찰하면 되나요?]</span>
          </span>
          <p className="text-slate-600 leading-relaxed font-medium">
            최소자승법(OLS)으로 계산된 최적 회귀 직선($y = ax + b$) 위에서 <strong>x값에 따라 예측점(●)이 움직이는 모습과 R² 설명력</strong>을 관찰하세요.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <LineChart size={20} className="text-emerald-600" />
            <span>선형회귀 (Linear Regression) 추론 & 인터랙티브 예측 시뮬레이터</span>
          </h3>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsManualMode(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                !isManualMode ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              최소자승법 자동 계산
            </button>
            <button
              onClick={() => setIsManualMode(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                isManualMode ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              수동 기울기 조정
            </button>
          </div>
        </div>

        {/* Axis Selections & Direct Number Input */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="font-bold text-slate-700 block mb-1">독립변수 X축 (원인 수치):</span>
            <select
              value={xAxis}
              onChange={e => setXAxis(e.target.value as FeatureKey)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs min-h-[44px] cursor-pointer"
            >
              <option value="petalLength">꽃잎 길이 (petalLength)</option>
              <option value="sepalLength">꽃받침 길이 (sepalLength)</option>
              <option value="sepalWidth">꽃받침 너비 (sepalWidth)</option>
              <option value="petalWidth">꽃잎 너비 (petalWidth)</option>
            </select>
          </div>

          <div>
            <span className="font-bold text-slate-700 block mb-1">종속변수 Y축 (예측 대상 수치):</span>
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

          <div>
            <span className="font-bold text-slate-700 block mb-1">입력 X값 (cm) 직접 타이핑:</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.1"
                min={xSpec.min}
                max={xSpec.max}
                inputMode="decimal"
                value={inputX}
                onChange={e => handleDirectNumberInput(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs font-mono text-emerald-700 min-h-[44px] bg-emerald-50/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-slate-600 font-mono text-xs shrink-0 font-bold">cm</span>
            </div>
          </div>
        </div>

        {/* Manual Sliders if manual mode */}
        {isManualMode && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-3">
            <span className="font-extrabold text-amber-950 block">🛠️ 수동 직선 방정식 조정 (y = a·x + b)</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between font-bold text-amber-900 mb-1">
                  <span>기울기 a</span>
                  <span className="font-mono">{manualSlope.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-1.5"
                  max="1.5"
                  step="0.05"
                  value={manualSlope}
                  onChange={e => setManualSlope(parseFloat(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between font-bold text-amber-900 mb-1">
                  <span>절편 b</span>
                  <span className="font-mono">{manualIntercept.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-3.0"
                  max="3.0"
                  step="0.1"
                  value={manualIntercept}
                  onChange={e => setManualIntercept(parseFloat(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Result Equation Banner */}
        <div className="p-4 rounded-xl bg-emerald-600 text-white text-xs space-y-2 shadow-xs">
          <div className="flex items-center justify-between font-bold border-b border-emerald-500 pb-2">
            <span>도출된 선형 회귀 방정식 (Linear Model)</span>
            <span className="font-mono font-black text-sm bg-emerald-700/80 px-2 py-0.5 rounded border border-emerald-500">
              R² 설명력: {(regResult.rSquared * 100).toFixed(1)}%
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-emerald-100 text-[11px] block">추정 방정식</span>
              <span className="text-lg font-black font-mono">
                y = {activeSlope.toFixed(2)} × x {activeIntercept >= 0 ? `+ ${activeIntercept.toFixed(2)}` : `- ${Math.abs(activeIntercept).toFixed(2)}`}
              </span>
            </div>

            <div className="sm:text-right">
              <span className="text-emerald-100 text-[11px] block">입력 X = {inputX}cm 일 때 예측 Y값</span>
              <span className="text-2xl font-black font-mono text-amber-300">{activePredY.toFixed(2)} cm</span>
            </div>
          </div>
        </div>

        {/* Interactive SVG Plot */}
        <div className="space-y-2 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <MousePointerClick size={16} className="text-emerald-600" />
              <span>회귀선 및 실시간 예측점 시각화</span>
            </span>
            <span className="text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 text-[11px]">
              👉 숫자를 직접 입력하거나 그래프의 원하는 x 위치를 터치해보세요!
            </span>
          </div>

          <div className="w-full overflow-hidden bg-slate-50 p-2 sm:p-3 rounded-2xl border border-slate-200 touch-none select-none">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              onPointerDown={handlePlotPointerDown}
              className="w-full h-auto cursor-crosshair rounded-xl bg-white shadow-2xs border border-slate-100"
            >
              {/* Axis */}
              <line x1={paddingLeft} y1={svgHeight - paddingBottom} x2={svgWidth - paddingRight} y2={svgHeight - paddingBottom} stroke="#cbd5e1" strokeWidth="2" />
              <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={svgHeight - paddingBottom} stroke="#cbd5e1" strokeWidth="2" />

              {/* Grid Lines */}
              <line x1={paddingLeft} y1={paddingTop} x2={svgWidth - paddingRight} y2={paddingTop} stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1={svgWidth - paddingRight} y1={paddingTop} x2={svgWidth - paddingRight} y2={svgHeight - paddingBottom} stroke="#f1f5f9" strokeDasharray="3 3" />

              {/* Labels & Ticks */}
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

              {/* Data points */}
              {ORIGINAL_IRIS_DATASET.map(r => (
                <circle
                  key={r.id}
                  cx={getSvgX(r[xAxis])}
                  cy={getSvgY(r[yAxis])}
                  r="3.5"
                  fill="#059669"
                  opacity="0.45"
                />
              ))}

              {/* Regression Line */}
              <line
                x1={getSvgX(lineX1Val)}
                y1={getSvgY(lineY1Val)}
                x2={getSvgX(lineX2Val)}
                y2={getSvgY(lineY2Val)}
                stroke="#0f172a"
                strokeWidth="3"
              />

              {/* Vertical Guide Line to Prediction Point */}
              <line
                x1={predSvgX}
                y1={svgHeight - paddingBottom}
                x2={predSvgX}
                y2={predSvgY}
                stroke="#f43f5e"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {/* Horizontal Guide Line to Prediction Point */}
              <line
                x1={paddingLeft}
                y1={predSvgY}
                x2={predSvgX}
                y2={predSvgY}
                stroke="#f43f5e"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {/* Prediction Point on Regression Line */}
              <g>
                <circle
                  cx={predSvgX}
                  cy={predSvgY}
                  r="14"
                  fill="#f43f5e"
                  fillOpacity="0.2"
                  stroke="#f43f5e"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  className="animate-pulse"
                />
                <circle
                  cx={predSvgX}
                  cy={predSvgY}
                  r="7"
                  fill="#f43f5e"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                />
                <rect x={predSvgX - 40} y={predSvgY - 24} width="80" height="16" rx="4" fill="#0f172a" />
                <text x={predSvgX} y={predSvgY - 12} textAnchor="middle" fontSize="9" fontWeight="black" fill="#ffffff" fontFamily="monospace">
                  x: {inputX} ➔ y: {activePredY.toFixed(2)}
                </text>
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* Observation Question Card (Section 5) */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
        <span className="font-extrabold text-slate-900 block text-sm flex items-center gap-1.5">
          <HelpCircle size={16} className="text-emerald-600" />
          <span>[핵심 관찰 질문] 점들의 모임 형태와 직선 예측</span>
        </span>

        <p className="text-slate-700 font-medium leading-relaxed">
          질문: <strong>점들이 직선 주변에 가까이 모여 있을수록 직선으로 수치를 예측하기 쉬울까요?</strong>
        </p>

        <div className="space-y-2">
          {[
            {
              key: 'ans1',
              label: '네. 데이터 점들이 직선에 가까이 촘촘하게 뭉쳐 있을수록 오차가 적어 선형 예측이 쉬워집니다.',
            },
            {
              key: 'ans2',
              label: '아니요. 점들이 흩어져 있을수록 직선으로 예측하기가 훨씬 쉽습니다.',
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
                ✓ <strong>정답입니다!</strong> 상관관계가 강하여 점들이 직선 근처에 길게 늘어설수록 잔차(오차)가 작아져 정확한 수치 추정이 가능해집니다.
              </span>
            ) : (
              <span>
                X 다시 확인해보세요. 점들이 흩어져 있으면 오차가 매우 커지므로, 점들이 직선 근처에 길게 모여 있을 때 선형회귀 예측이 용이해집니다.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
