import React, { useState } from 'react';
import { useActivityScrollTop } from '../../hooks/useActivityScrollTop';
import { ORIGINAL_IRIS_DATASET, SPECIES_MAP } from '../../data/irisDataset';
import type { IrisRecord, IrisSpecies } from '../../types/iris';
import { stratifiedSplitDataset } from '../../algorithms/evaluation';
import { predictKNN } from '../../algorithms/knn';
import { trainDecisionTree, traceDecisionPath } from '../../algorithms/decisionTree';
import { ActivityProgress } from './ActivityProgress';
import { PrimaryButton } from '../common/PrimaryButton';
import { SecondaryButton } from '../common/SecondaryButton';
import {
  Layers,
  Cpu,
  Sliders,
  Play,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Target,
  GitBranch,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { ActivityChecklist } from './ActivityChecklist';

interface Module07ActivityProps {
  isCompleted: boolean;
  onComplete: () => void;
}

type FeatureKey = keyof Omit<IrisRecord, 'id' | 'species'>;

const FEATURE_NAMES: Record<FeatureKey, string> = {
  sepalLength: '꽃받침 길이 (cm)',
  sepalWidth: '꽃받침 너비 (cm)',
  petalLength: '꽃잎 길이 (cm)',
  petalWidth: '꽃잎 너비 (cm)',
};

export const Module07Activity: React.FC<Module07ActivityProps> = ({ isCompleted: _isCompleted, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const topRef = useActivityScrollTop<HTMLDivElement>(currentStep);

  // Step 1: Split ratio
  const [splitRatio, setSplitRatio] = useState<number>(0.8); // 80:20

  // Step 2: Algorithm
  const [algorithm, setAlgorithm] = useState<'knn' | 'decisionTree'>('knn');

  // Step 3: Hyperparameters
  const [kParam, setKParam] = useState<number>(5);
  const [depthParam, setDepthParam] = useState<number>(3);
  const [isTrained, setIsTrained] = useState<boolean>(false);

  // Step 4: New Data Prediction
  const [newPoint, setNewPoint] = useState<Record<FeatureKey, number>>({
    sepalLength: 6.0,
    sepalWidth: 3.0,
    petalLength: 4.8,
    petalWidth: 1.6,
  });
  const [predictedSpecies, setPredictedSpecies] = useState<IrisSpecies | null>(null);

  // Compute stratified split
  const splitResult = stratifiedSplitDataset(ORIGINAL_IRIS_DATASET, splitRatio, 42);

  const handleTrainModel = () => {
    setIsTrained(true);
    setPredictedSpecies(null);
  };

  const handlePredictNewSample = () => {
    if (algorithm === 'knn') {
      const res = predictKNN(splitResult.trainData, newPoint, ['petalLength', 'petalWidth'], kParam);
      setPredictedSpecies(res.predictedSpecies);
    } else {
      const tree = trainDecisionTree(splitResult.trainData, ['sepalLength', 'sepalWidth', 'petalLength', 'petalWidth'], depthParam);
      const trace = traceDecisionPath(tree, newPoint);
      setPredictedSpecies(trace.predictedSpecies);
    }
  };

  // Checklist items
  const checklistItems = [
    { id: 'split', label: '학습용/테스트용 데이터 분할 비율 선택', isCompleted: currentStep >= 1 },
    { id: 'algorithm', label: '기계학습 알고리즘 선택 (k-NN 또는 의사결정트리)', isCompleted: currentStep >= 2 },
    { id: 'train', label: '하이퍼파라미터 설정 및 모델 구축/훈련 실행', isCompleted: isTrained },
    { id: 'predict', label: '새로운 붓꽃 수치 데이터 예측 실행', isCompleted: predictedSpecies !== null },
  ];

  return (
    <div className="space-y-6 scroll-mt-24" ref={topRef}>
      {/* Activity Progress */}
      <ActivityProgress
        currentStep={currentStep}
        totalSteps={totalSteps}
        title={
          currentStep === 1
            ? '1. 데이터 분할 (Train / Test)'
            : currentStep === 2
            ? '2. 알고리즘 선택'
            : currentStep === 3
            ? '3. 하이퍼파라미터 설정 및 모델 훈련'
            : currentStep === 4
            ? '4. 새 데이터 품종 예측'
            : '5. 모델 만들기 완료'
        }
      />

      {/* Intro Question & Flow Banner (Section 7) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
            [공식 6단계 과정] ⑤ 모델 학습
          </span>
          <span className="text-xs text-slate-500 font-medium">07 모델 만들기</span>
        </div>

        <h2 className="text-xl font-black text-slate-900">
          [모델은 어떻게 만들어질까?]
        </h2>

        {/* 5-Stage Sequential Pipeline */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-center text-[11px] font-bold pt-1">
          <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700">1. 데이터 준비</div>
          <div className="p-2 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-950">2. 데이터 분리</div>
          <div className="p-2 rounded-xl bg-teal-100 border border-teal-300 text-teal-950">3. 알고리즘 선택</div>
          <div className="p-2 rounded-xl bg-blue-100 border border-blue-300 text-blue-950">4. 모델 학습</div>
          <div className="p-2 rounded-xl bg-purple-100 border border-purple-300 text-purple-950">5. 새 데이터 예측</div>
        </div>
      </div>

      {/* STEP 1: 데이터 분할 (Train / Test) */}
      {currentStep === 1 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Layers size={20} className="text-emerald-600" />
              <span>활동 1: 학습용 vs 테스트용 데이터 분할 (Train / Test Split)</span>
            </h3>

            {/* Educational Section 8 Explanations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                <span className="font-extrabold text-emerald-900 block text-xs">📘 학습용 데이터 (Train Data)</span>
                <p className="text-emerald-800 leading-relaxed font-medium">
                  "모델이 붓꽃 데이터의 패턴과 규칙을 배우는 데 사용하는 데이터입니다."
                </p>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-1">
                <span className="font-extrabold text-blue-900 block text-xs">📙 테스트용 데이터 (Test Data)</span>
                <p className="text-blue-800 leading-relaxed font-medium">
                  "학습이 끝난 모델이 일반화되어 성능이 잘 작동하는지 최종 확인하는 검증용 데이터입니다."
                </p>
              </div>
            </div>

            {/* Split Ratio Selector & Visual Representation */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
              <span className="font-extrabold text-slate-900 block text-sm">
                데이터 분할 비율 선택 (기본 권장: 80:20):
              </span>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { ratio: 0.6, label: '60 : 40' },
                  { ratio: 0.7, label: '70 : 30' },
                  { ratio: 0.8, label: '80 : 20 (권장)' },
                ].map(item => (
                  <button
                    key={item.ratio}
                    onClick={() => setSplitRatio(item.ratio)}
                    className={`p-3 rounded-xl border font-bold font-mono transition-all min-h-[44px] cursor-pointer ${
                      splitRatio === item.ratio
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Visual Breakdown Cards (Section 8) */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-center text-xs">
                  전체 데이터 (150개) 분할 결과 시각화
                </span>

                <div className="grid grid-cols-2 gap-3 text-center font-mono">
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-[11px] text-emerald-800 block font-sans">학습용 (Train)</span>
                    <span className="text-xl font-black text-emerald-900">{splitResult.trainData.length}개</span>
                    <span className="text-[10px] text-emerald-700 block font-sans">(규칙 학습용)</span>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-[11px] text-blue-800 block font-sans">테스트용 (Test)</span>
                    <span className="text-xl font-black text-blue-900">{splitResult.testData.length}개</span>
                    <span className="text-[10px] text-blue-700 block font-sans">(성능 검증용)</span>
                  </div>
                </div>

                <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-center text-amber-950 font-bold text-[11px]">
                  ⚠️ <strong>중요 원칙:</strong> 테스트 데이터({splitResult.testData.length}개)는 공정한 평가를 위해 학습 시 절대로 모델에 미리 보여주지(학습에 사용하지) 않습니다.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: 알고리즘 선택 */}
      {currentStep === 2 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Cpu size={20} className="text-teal-600" />
              <span>활동 2: 모델 구축에 사용할 알고리즘 선택하기</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <button
                onClick={() => setAlgorithm('knn')}
                className={`p-5 rounded-2xl border-2 text-left space-y-2 transition-all cursor-pointer ${
                  algorithm === 'knn'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-md ring-2 ring-emerald-300'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center gap-2 font-black text-sm text-emerald-900">
                  <Target size={18} className="text-emerald-600" />
                  <span>k-NN (최근접 이웃)</span>
                </div>
                <p className="text-slate-600 leading-relaxed font-medium text-[11px]">
                  주변에 위치한 가장 가까운 k개 이웃 데이터점의 품종 다수결 득표로 예측합니다.
                </p>
              </button>

              <button
                onClick={() => setAlgorithm('decisionTree')}
                className={`p-5 rounded-2xl border-2 text-left space-y-2 transition-all cursor-pointer ${
                  algorithm === 'decisionTree'
                    ? 'border-teal-600 bg-teal-50 text-teal-950 shadow-md ring-2 ring-teal-300'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300'
                }`}
              >
                <div className="flex items-center gap-2 font-black text-sm text-teal-900">
                  <GitBranch size={18} className="text-teal-600" />
                  <span>의사결정트리 (Decision Tree)</span>
                </div>
                <p className="text-slate-600 leading-relaxed font-medium text-[11px]">
                  YES/NO 스무고개 형태의 가짓수 조건 분지 규칙 나무 구조를 구성하여 분류합니다.
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: 하이퍼파라미터 설정 및 모델 훈련 */}
      {currentStep === 3 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Sliders size={20} className="text-teal-600" />
              <span>활동 3: 설정(하이퍼파라미터) 조정 및 모델 구축</span>
            </h3>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
              {algorithm === 'knn' ? (
                <div className="space-y-2">
                  <span className="font-extrabold text-slate-900 block">k-NN 이웃 개수 (k) 설정:</span>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 3, 5, 7].map(kVal => (
                      <button
                        key={kVal}
                        onClick={() => {
                          setKParam(kVal);
                          setIsTrained(false);
                        }}
                        className={`p-3 rounded-xl font-bold font-mono text-sm cursor-pointer ${
                          kParam === kVal ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-300'
                        }`}
                      >
                        k={kVal}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="font-extrabold text-slate-900 block">의사결정트리 최대 깊이 (maxDepth) 설정:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[2, 3, 4].map(d => (
                      <button
                        key={d}
                        onClick={() => {
                          setDepthParam(d);
                          setIsTrained(false);
                        }}
                        className={`p-3 rounded-xl font-bold text-xs cursor-pointer ${
                          depthParam === d ? 'bg-teal-600 text-white' : 'bg-white text-slate-700 border border-slate-300'
                        }`}
                      >
                        깊이 {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Train Button */}
              <div className="pt-2">
                <PrimaryButton size="lg" fullWidth onClick={handleTrainModel} icon={<Play size={18} />}>
                  {algorithm === 'knn' ? '훈련 데이터 준비 및 이웃 구조 연동' : '의사결정트리 모델 학습 실행'}
                </PrimaryButton>
              </div>

              {/* Section 9 Wording Differentiation */}
              {isTrained && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold space-y-1 animate-fadeIn">
                  <span className="text-sm block font-extrabold text-emerald-900">
                    {algorithm === 'knn' ? '✓ 훈련 데이터 준비 완료 (예측 준비 완료)' : '✓ 모델 학습 완료 (규칙 구축 완료)'}
                  </span>
                  <p className="text-[11px] font-medium text-emerald-800">
                    {algorithm === 'knn'
                      ? `학습용 데이터 ${splitResult.trainData.length}개가 k-NN(k=${kParam}) 예측 파이프라인에 연결되었습니다.`
                      : `학습용 데이터 ${splitResult.trainData.length}개로 깊이 ${depthParam}의 의사결정나무 판단 규칙이 생성되었습니다.`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: 새 데이터 품종 예측 */}
      {currentStep === 4 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Play size={20} className="text-purple-600" />
              <span>활동 4: 구축된 모델로 새로운 붓꽃 수치 데이터 예측하기</span>
            </h3>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <span className="font-bold text-slate-900 block">새로 수집된 붓꽃 측정치 조정:</span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                {(['sepalLength', 'sepalWidth', 'petalLength', 'petalWidth'] as FeatureKey[]).map(feat => (
                  <div key={feat} className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-500 block font-sans">{FEATURE_NAMES[feat]}</span>
                    <input
                      type="number"
                      step="0.1"
                      value={newPoint[feat]}
                      onChange={e => {
                        const v = parseFloat(e.target.value) || 0;
                        setNewPoint(prev => ({ ...prev, [feat]: v }));
                      }}
                      className="w-full font-bold text-slate-900 border-b border-slate-300 font-mono text-xs focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <PrimaryButton size="md" fullWidth onClick={handlePredictNewSample} icon={<Sparkles size={18} />}>
                  구축된 모델로 품종 예측하기
                </PrimaryButton>
              </div>

              {predictedSpecies && (
                <div className="p-4 rounded-xl bg-purple-600 text-white text-xs font-bold space-y-1 animate-fadeIn shadow-xs">
                  <span className="font-extrabold text-sm block">
                    현재 모델 예측 결과: {SPECIES_MAP[predictedSpecies].korean} ({predictedSpecies})
                  </span>
                  <p className="text-purple-100 text-[11px] font-medium">
                    입력된 4가지 속성을 바탕으로 {algorithm === 'knn' ? `k-NN(k=${kParam})` : `의사결정트리(깊이 ${depthParam})`} 모델이 위와 같이 판정하였습니다.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: 모델 만들기 완료 (Section 10 transition) */}
      {currentStep === 5 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900">07 모델 만들기 학습 완료</h3>
              <p className="text-xs text-slate-500">ML 5단계: 모델 학습 완료</p>
            </div>

            {/* Section 24 Summary Sentence */}
            <div className="p-4 rounded-2xl bg-emerald-600 text-white text-center font-extrabold text-sm shadow-sm max-w-xl mx-auto">
              "모델은 학습용 데이터로 규칙을 배우고 새로운 데이터를 예측합니다."
            </div>

            {/* Section 10 Transition Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3 max-w-xl mx-auto text-xs">
              <span className="font-extrabold text-slate-900 block text-sm">
                🤔 다음 학습 연결 질문:
              </span>
              <p className="text-slate-700 font-bold text-sm leading-relaxed">
                "모델을 만들었다면, 이 모델이 얼마나 잘 작동하는지는 어떻게 확인할까요?"
              </p>
              <div className="pt-2">
                <PrimaryButton size="lg" fullWidth onClick={onComplete} icon={<ArrowRight size={20} />}>
                  08 모델 평가하러 가기 (성능 평가)
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Checklist */}
      <ActivityChecklist
        items={checklistItems}
        onProceedNext={() => setCurrentStep(s => Math.min(totalSteps, s + 1))}
        isLastStep={currentStep === totalSteps}
      />

      {/* Internal Step Control Navigation */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
        <SecondaryButton
          size="md"
          disabled={currentStep === 1}
          onClick={() => setCurrentStep(s => Math.max(1, s - 1))}
          icon={<ChevronLeft size={16} />}
        >
          이전 단계
        </SecondaryButton>

        {currentStep < totalSteps ? (
          <PrimaryButton
            size="md"
            onClick={() => setCurrentStep(s => Math.min(totalSteps, s + 1))}
            icon={<ChevronRight size={16} />}
            className="flex-row-reverse"
          >
            다음 단계
          </PrimaryButton>
        ) : (
          <span className="text-xs text-emerald-700 font-bold">마지막 단계</span>
        )}
      </div>
    </div>
  );
};
