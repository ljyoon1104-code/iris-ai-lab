import React, { useState } from 'react';
import { ORIGINAL_IRIS_DATASET } from '../../data/irisDataset';
import {
  trainLinearRegression,
  predictLinearRegression,
  getResidualSamples,
  type FeatureKey,
} from '../../algorithms/linearRegression';
import { SecondaryButton } from '../common/SecondaryButton';
import { LineChart, Sliders } from 'lucide-react';

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

  // Train OLS model
  const regResult = trainLinearRegression(ORIGINAL_IRIS_DATASET, xAxis, yAxis);
  const predictedY = predictLinearRegression(regResult.slope, regResult.intercept, inputX);
  const manualPredY = predictLinearRegression(manualSlope, manualIntercept, inputX);
  const residuals = getResidualSamples(ORIGINAL_IRIS_DATASET, regResult.slope, regResult.intercept, xAxis, yAxis, 3);

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

  // Regression line endpoints
  const lineX1 = xSpec.min;
  const lineY1 = predictLinearRegression(regResult.slope, regResult.intercept, lineX1);
  const lineX2 = xSpec.max;
  const lineY2 = predictLinearRegression(regResult.slope, regResult.intercept, lineX2);

  // Manual line endpoints
  const manY1 = predictLinearRegression(manualSlope, manualIntercept, lineX1);
  const manY2 = predictLinearRegression(manualSlope, manualIntercept, lineX2);

  const inputSvgX = getSvgX(inputX);
  const inputSvgY = getSvgY(predictedY);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 space-y-1">
        <span className="font-extrabold text-sm text-emerald-900 block flex items-center gap-1.5">
          <LineChart size={18} className="text-emerald-600" />
          <span>선형 회귀 (Linear Regression) 시뮬레이터</span>
        </span>
        <p className="leading-relaxed">
          두 수치형 속성 간의 분포 패턴을 가장 잘 표현하는 최적 직선($y = ax + b$)을 찾아 수치 값을 예측합니다.
        </p>
      </div>

      {/* Axis Selector & Control Panel */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-800">속성 (Feature) 설정:</span>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-semibold">독립변수 (X):</span>
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
              <span className="text-slate-500 font-semibold">종속변수 (y):</span>
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

        {/* Real-time X Predictor Control */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900">
              새 입력값 X ({FEATURE_NAMES[xAxis]}) 조절:
            </span>
            <span className="font-extrabold text-emerald-800 bg-white px-2.5 py-1 rounded border border-slate-300 font-mono text-sm">
              X = {inputX} cm
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setInputX(x => Math.max(xSpec.min, Math.round((x - 0.1) * 10) / 10))}
              className="w-10 h-10 bg-white border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer text-base"
            >
              -
            </button>
            <input
              type="range"
              min={xSpec.min}
              max={xSpec.max}
              step={xSpec.step}
              value={inputX}
              onChange={e => setInputX(parseFloat(e.target.value))}
              className="w-full accent-emerald-600 min-h-[44px]"
            />
            <button
              onClick={() => setInputX(x => Math.min(xSpec.max, Math.round((x + 0.1) * 10) / 10))}
              className="w-10 h-10 bg-white border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer text-base"
            >
              +
            </button>
          </div>

          {/* Realtime Predicted Y Output */}
          <div className="p-3 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-between shadow-xs">
            <span>컴퓨터 회귀선 실시간 예측값 (y):</span>
            <span className="text-base font-mono font-black">{predictedY} cm</span>
          </div>
        </div>

        {/* Manual Fitting Mode Toggle */}
        <div className="pt-1 flex justify-end">
          <SecondaryButton
            size="sm"
            onClick={() => setIsManualMode(!isManualMode)}
            icon={<Sliders size={14} />}
          >
            {isManualMode ? '컴퓨터 최적 직선 전용 보기' : '직선을 직접 맞춰보기 (수동 조절)'}
          </SecondaryButton>
        </div>

        {/* Manual Fit Sliders */}
        {isManualMode && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 space-y-3 text-xs animate-fadeIn">
            <span className="font-extrabold text-amber-900 block flex items-center gap-1.5">
              <Sliders size={16} />
              <span>학생 수동 직선 조절 패널 (기울기 & 절편)</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="font-bold text-slate-700 block mb-1">
                  기울기 a (Slope): {manualSlope}
                </span>
                <input
                  type="range"
                  min="-1.0"
                  max="1.5"
                  step="0.05"
                  value={manualSlope}
                  onChange={e => setManualSlope(parseFloat(e.target.value))}
                  className="w-full accent-amber-600 min-h-[44px]"
                />
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">
                  절편 b (Intercept): {manualIntercept}
                </span>
                <input
                  type="range"
                  min="-3.0"
                  max="3.0"
                  step="0.1"
                  value={manualIntercept}
                  onChange={e => setManualIntercept(parseFloat(e.target.value))}
                  className="w-full accent-amber-600 min-h-[44px]"
                />
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-amber-200 text-amber-950 font-bold flex justify-between">
              <span>수동 직선 예측값: {manualPredY} cm</span>
              <span>컴퓨터 최적 직선 예측값: {predictedY} cm</span>
            </div>
          </div>
        )}
      </div>

      {/* SVG Scatter Plot & Regression Line */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-slate-900">Iris 150개 점 & 회귀 직선 ($y = ax + b$)</span>
          <span className="font-mono text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded">
            {regResult.equationString} ($R^2 = {regResult.rSquared}$)
          </span>
        </div>

        <div className="w-full overflow-x-auto flex justify-center bg-slate-50/70 p-2 rounded-xl border border-slate-200">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full max-w-[500px] h-auto">
            {/* Grid Axes Lines */}
            <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#cbd5e1" strokeWidth="1.5" />
            <line x1={padding} y1={padding} x2={padding} y2={svgHeight - padding} stroke="#cbd5e1" strokeWidth="1.5" />

            {/* 150 Iris Points */}
            {ORIGINAL_IRIS_DATASET.map(r => {
              const cx = getSvgX(r[xAxis]);
              const cy = getSvgY(r[yAxis]);
              return (
                <circle
                  key={r.id}
                  cx={cx}
                  cy={cy}
                  r="3.5"
                  fill="#059669"
                  opacity="0.6"
                />
              );
            })}

            {/* OLS Regression Line (Green Solid) */}
            <line
              x1={getSvgX(lineX1)}
              y1={getSvgY(lineY1)}
              x2={getSvgX(lineX2)}
              y2={getSvgY(lineY2)}
              stroke="#047857"
              strokeWidth="3.5"
            />

            {/* Manual Line if enabled (Amber Dashed) */}
            {isManualMode && (
              <line
                x1={getSvgX(lineX1)}
                y1={getSvgY(manY1)}
                x2={getSvgX(lineX2)}
                y2={getSvgY(manY2)}
                stroke="#d97706"
                strokeWidth="2.5"
                strokeDasharray="6 4"
              />
            )}

            {/* Input Point X Marker (Orange) */}
            <circle cx={inputSvgX} cy={inputSvgY} r="7" fill="#f59e0b" stroke="#b45309" strokeWidth="2" />

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
          <span className="flex items-center gap-1.5 text-emerald-800">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span> 실제 데이터 점 (150개)
          </span>
          <span className="flex items-center gap-1.5 text-emerald-950">
            <span className="w-5 h-1 bg-emerald-700 inline-block"></span> 최적 회귀선
          </span>
          {isManualMode && (
            <span className="flex items-center gap-1.5 text-amber-700">
              <span className="w-5 h-1 bg-amber-600 border-dashed inline-block"></span> 학생 수동 직선
            </span>
          )}
          <span className="flex items-center gap-1.5 text-amber-700">
            ● 예측 지점 (X={inputX}cm, y={predictedY}cm)
          </span>
        </div>
      </div>

      {/* Actual vs Predicted Sample Comparison */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <span className="text-xs font-extrabold text-slate-900 block">
          실제 데이터와 회귀선 예측값 비교 샘플
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          {residuals.map(sample => (
            <div key={sample.recordId} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block text-[11px]">ID #{sample.recordId} (X = {sample.xValue}cm)</span>
              <div className="text-[11px] text-slate-700">실제 값: <strong>{sample.actualY} cm</strong></div>
              <div className="text-[11px] text-emerald-800">예측 값: <strong>{sample.predictedY} cm</strong></div>
              <div className="text-[11px] text-amber-800 font-bold">오차(잔차): {sample.residual} cm</div>
            </div>
          ))}
        </div>

        <div className="p-3.5 rounded-xl bg-slate-100 text-xs text-slate-700 leading-relaxed font-medium">
          💡 <strong>핵심 가이드:</strong> 회귀선이 모든 실제 점과 100% 일치하지는 않으며, 데이터 전체의 경향성을 나타내는 직선을 통해 미래 수치 값을 예측합니다.
        </div>
      </div>

      {/* Observation Reflection Question Card */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs space-y-2 shadow-xs">
        <span className="font-extrabold text-teal-300 block text-sm flex items-center gap-1.5">
          🧐 생각하기 (관찰 질문)
        </span>
        <p className="font-bold text-slate-100">
          "왜 회귀선의 예측값(추정선)과 모든 실제 점의 수치가 정확히 일치하지 않고 오차(잔차)가 존재할까요?"
        </p>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          💡 실제 수치 데이터는 노이즈와 다양한 환경 요소가 섞여 있으므로, 선형 회귀는 전체 점들의 오차 합을 최소화하는 전반적 추측 선($y=ax+b$)을 찾아 미래 수치를 예측합니다.
        </p>
      </div>
    </div>
  );
};
