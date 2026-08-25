import React, { useState } from 'react';
import { ORIGINAL_IRIS_DATASET } from '../../data/irisDataset';
import {
  trainLinearRegression,
  predictLinearRegression,
  type FeatureKey,
} from '../../algorithms/linearRegression';
import { LineChart, Sliders, Eye, HelpCircle } from 'lucide-react';

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

  // Train OLS model
  const regResult = trainLinearRegression(ORIGINAL_IRIS_DATASET, xAxis, yAxis);
  const predictedY = predictLinearRegression(regResult.slope, regResult.intercept, inputX);
  const manualPredY = predictLinearRegression(manualSlope, manualIntercept, inputX);

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

  const activeSlope = isManualMode ? manualSlope : regResult.slope;
  const activeIntercept = isManualMode ? manualIntercept : regResult.intercept;
  const activePredY = isManualMode ? manualPredY : predictedY;

  const lineX1Val = xSpec.min;
  const lineY1Val = predictLinearRegression(activeSlope, activeIntercept, lineX1Val);
  const lineX2Val = xSpec.max;
  const lineY2Val = predictLinearRegression(activeSlope, activeIntercept, lineX2Val);

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
            x축/y축 측정 수치 속성, 입력 x값, 그리고 직접 기울기/절편을 수동 조정할 수 있습니다.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="font-extrabold text-slate-900 block flex items-center gap-1.5">
            <Eye size={16} className="text-blue-600" />
            <span>[무엇을 관찰하면 되나요?]</span>
          </span>
          <p className="text-slate-600 leading-relaxed font-medium">
            데이터 점들의 대략적 위치와 기울기 직선($y=ax+b$)의 오차(잔차) 분포 형태를 관찰하세요.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <LineChart size={20} className="text-teal-600" />
            <span>선형회귀 (Linear Regression) 추론 시뮬레이터</span>
          </h3>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsManualMode(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                !isManualMode ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              최소자승법 자동 계산
            </button>
            <button
              onClick={() => setIsManualMode(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                isManualMode ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              수동 기울기 조정
            </button>
          </div>
        </div>

        {/* Axis Selections */}
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
            <span className="font-bold text-slate-700 block mb-1">입력 X값 (cm):</span>
            <input
              type="number"
              step="0.1"
              min={xSpec.min}
              max={xSpec.max}
              value={inputX}
              onChange={e => setInputX(parseFloat(e.target.value) || xSpec.min)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs font-mono min-h-[44px]"
            />
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
        <div className="p-4 rounded-xl bg-teal-600 text-white text-xs space-y-2 shadow-xs">
          <div className="flex items-center justify-between font-bold border-b border-teal-500 pb-2">
            <span>도출된 선형 회귀 방정식 (Linear Model)</span>
            <span className="font-mono font-black text-sm">R² 설명력: {(regResult.rSquared * 100).toFixed(1)}%</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-teal-100 text-[11px] block">추정 방정식</span>
              <span className="text-lg font-black font-mono">
                y = {activeSlope.toFixed(2)} × x {activeIntercept >= 0 ? `+ ${activeIntercept.toFixed(2)}` : `- ${Math.abs(activeIntercept).toFixed(2)}`}
              </span>
            </div>

            <div className="text-right">
              <span className="text-teal-100 text-[11px] block">입력 X = {inputX}cm 예측 Y값</span>
              <span className="text-2xl font-black font-mono text-amber-300">{activePredY.toFixed(2)} cm</span>
            </div>
          </div>
        </div>

        {/* SVG Plot */}
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

            {/* Data points */}
            {ORIGINAL_IRIS_DATASET.map(r => (
              <circle
                key={r.id}
                cx={getSvgX(r[xAxis])}
                cy={getSvgY(r[yAxis])}
                r="3.5"
                fill="#0d9488"
                opacity="0.5"
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

            {/* Prediction Point */}
            <circle
              cx={getSvgX(inputX)}
              cy={getSvgY(activePredY)}
              r="7"
              fill="#e11d48"
              stroke="#ffffff"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>

      {/* Observation Question Card (Section 5) */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
        <span className="font-extrabold text-slate-900 block text-sm flex items-center gap-1.5">
          <HelpCircle size={16} className="text-teal-600" />
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
