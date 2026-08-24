import React, { useState } from 'react';
import { useActivityScrollTop } from '../../hooks/useActivityScrollTop';
import { ORIGINAL_IRIS_DATASET, SPECIES_MAP } from '../../data/irisDataset';
import type { IrisRecord, IrisSpecies } from '../../types/iris';
import { stratifiedSplitDataset } from '../../algorithms/evaluation';
import { predictKNN } from '../../algorithms/knn';
import { trainDecisionTree, traceDecisionPath } from '../../algorithms/decisionTree';
import { ActivityProgress } from './ActivityProgress';
import { ChoiceCard } from './ChoiceCard';
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
} from 'lucide-react';

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

export const Module07Activity: React.FC<Module07ActivityProps> = ({ isCompleted, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const topRef = useActivityScrollTop<HTMLDivElement>(currentStep);

  // Step 1: Split quiz & ratio
  const [quiz1Answer, setQuiz1Answer] = useState<boolean | null>(null);
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
            ? '3. 하이퍼파라미터 설정 및 모델 학습'
            : currentStep === 4
            ? '4. 새 데이터 품종 예측'
            : '5. 모델 만들기 완료'
        }
      />

      {/* STEP 1: 데이터 분할 (Train/Test) */}
      {currentStep === 1 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Layers size={20} className="text-emerald-600" />
              <span>활동 1: 데이터를 훈련(Train)과 테스트(Test)로 나열 분할하기</span>
            </h3>

            {/* Quiz */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-900 block">
                질문: 모델을 학습시키는 데 사용한 데이터 그대로 모델의 실력을 평가해도 될까?
              </span>
              <div className="grid grid-cols-2 gap-2">
                <ChoiceCard
                  optionKey="1"
                  label="괜찮다 (학습 데이터로 평가)"
                  isSelected={quiz1Answer === false}
                  status={quiz1Answer === false ? 'incorrect' : 'default'}
                  onClick={() => setQuiz1Answer(false)}
                />
                <ChoiceCard
                  optionKey="2"
                  label="별도의 테스트 데이터로 평가해야 한다"
                  isSelected={quiz1Answer === true}
                  status={quiz1Answer === true ? 'correct' : 'default'}
                  onClick={() => setQuiz1Answer(true)}
                />
              </div>

              {quiz1Answer === true && (
                <div className="p-3.5 rounded-lg bg-emerald-100 text-xs text-emerald-950 animate-fadeIn">
                  ✓ 올바른 판단입니다! 공부할 때 푼 문제지로 시험을 보면 암기만으로 점수가 높게 나올 수 있으므로, 진짜 실력을 검증하려면 <strong>독립된 테스트 데이터</strong>가 필요합니다.
                </div>
              )}
            </div>

            {/* Ratio Selection */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-slate-900 block">
                Train : Test 데이터 분할 비율 선택:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { ratio: 0.6, label: '60 : 40' },
                  { ratio: 0.7, label: '70 : 30' },
                  { ratio: 0.8, label: '80 : 20 (추천)' },
                ].map(r => (
                  <button
                    key={r.ratio}
                    onClick={() => setSplitRatio(r.ratio)}
                    className={`p-3 rounded-xl border-2 text-xs font-extrabold transition-all min-h-[48px] cursor-pointer ${
                      splitRatio === r.ratio
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Real Distribution Display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-1">
                  <span className="font-extrabold text-blue-900 block">
                    📘 훈련 데이터 (Train Data): {splitResult.trainData.length}개
                  </span>
                  <p className="text-slate-600 text-[11px]">
                    세토사 {splitResult.trainCounts['Iris-setosa']}개 | 버시컬러 {splitResult.trainCounts['Iris-versicolor']}개 | 버지니카 {splitResult.trainCounts['Iris-virginica']}개
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <span className="font-extrabold text-emerald-900 block">
                    📗 테스트 데이터 (Test Data): {splitResult.testData.length}개
                  </span>
                  <p className="text-slate-600 text-[11px]">
                    세토사 {splitResult.testCounts['Iris-setosa']}개 | 버시컬러 {splitResult.testCounts['Iris-versicolor']}개 | 버지니카 {splitResult.testCounts['Iris-virginica']}개
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: 알고리즘 선택 */}
      {currentStep === 2 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Cpu size={20} className="text-emerald-600" />
              <span>활동 2: 지도학습 분류 알고리즘 선택</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              붓꽃 품종 분류 모델을 만들 때 사용할 머신러닝 알고리즘을 선택하세요.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => {
                  setAlgorithm('knn');
                  setIsTrained(false);
                }}
                className={`p-4 rounded-2xl border-2 text-xs transition-all cursor-pointer space-y-2 ${
                  algorithm === 'knn'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between font-extrabold text-sm text-emerald-900">
                  <span className="flex items-center gap-1.5">
                    <Target size={18} className="text-emerald-600" />
                    k-NN (최근접 이웃)
                  </span>
                  {algorithm === 'knn' && <CheckCircle2 size={18} className="text-emerald-600" />}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  새로운 데이터 좌표에서 가장 가까운 k개 이웃 데이터와의 다수결 투표로 분류합니다.
                </p>
              </div>

              <div
                onClick={() => {
                  setAlgorithm('decisionTree');
                  setIsTrained(false);
                }}
                className={`p-4 rounded-2xl border-2 text-xs transition-all cursor-pointer space-y-2 ${
                  algorithm === 'decisionTree'
                    ? 'border-teal-600 bg-teal-50 text-teal-950 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300'
                }`}
              >
                <div className="flex items-center justify-between font-extrabold text-sm text-teal-900">
                  <span className="flex items-center gap-1.5">
                    <GitBranch size={18} className="text-teal-600" />
                    의사결정트리 (Decision Tree)
                  </span>
                  {algorithm === 'decisionTree' && <CheckCircle2 size={18} className="text-teal-600" />}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  속성 조건(Gini 불순도 기반)을 스무고개처럼 비교하며 가지를 따라 분류합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: 하이퍼파라미터 설정 & 모델 학습 */}
      {currentStep === 3 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Sliders size={20} className="text-emerald-600" />
              <span>활동 3: 하이퍼파라미터 설정 및 모델 학습</span>
            </h3>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <span className="font-extrabold text-slate-900 block text-sm">
                선택된 알고리즘: {algorithm === 'knn' ? 'k-NN (최근접 이웃)' : '의사결정트리'}
              </span>

              {algorithm === 'knn' ? (
                <div className="space-y-2">
                  <span className="font-bold text-slate-800 block">이웃 수 (k) 선택:</span>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 3, 5, 7].map(val => (
                      <button
                        key={val}
                        onClick={() => {
                          setKParam(val);
                          setIsTrained(false);
                        }}
                        className={`p-3 rounded-xl border-2 text-xs font-extrabold transition-all min-h-[48px] cursor-pointer ${
                          kParam === val
                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        k = {val}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="font-bold text-slate-800 block">트리 최대 깊이 (maxDepth) 선택:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[2, 3, 4].map(val => (
                      <button
                        key={val}
                        onClick={() => {
                          setDepthParam(val);
                          setIsTrained(false);
                        }}
                        className={`p-3 rounded-xl border-2 text-xs font-extrabold transition-all min-h-[48px] cursor-pointer ${
                          depthParam === val
                            ? 'border-teal-600 bg-teal-600 text-white shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        깊이 {val}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 font-medium">
                💡 <strong>하이퍼파라미터:</strong> 사람이 학습 전에 직접 지정해주는 설정값 ($k$ 또는 최대 깊이)
              </div>
            </div>

            {/* Train Execution */}
            <div className="pt-2 text-center space-y-3">
              <PrimaryButton size="lg" fullWidth onClick={handleTrainModel} icon={<Play size={20} />}>
                훈련 데이터 ({splitResult.trainData.length}개)로 모델 학습하기
              </PrimaryButton>

              {isTrained && (
                <div className="p-4 rounded-2xl bg-emerald-600 text-white text-xs font-bold space-y-1 shadow-xs animate-fadeIn">
                  <span className="font-extrabold text-sm block">✓ 모델 학습 완성!</span>
                  <p className="text-emerald-100 font-medium">
                    {algorithm === 'knn'
                      ? `훈련 데이터 ${splitResult.trainData.length}개 저장 및 k=${kParam} 이웃 계산 준비가 완료되었습니다.`
                      : `훈련 데이터 ${splitResult.trainData.length}개로 maxDepth=${depthParam} 의사결정트리가 생성되었습니다.`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: 새 데이터 예측 */}
      {currentStep === 4 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">
              활동 4: 학습된 모델로 새 붓꽃 품종 예측해보기
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              새로운 붓꽃의 수치 속성을 입력하고 현재 학습 완료된 모델로 품종을 예측해보세요.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {(Object.keys(FEATURE_NAMES) as FeatureKey[]).map(f => (
                <div key={f} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-700">{FEATURE_NAMES[f]}</span>
                    <span className="text-emerald-800 font-mono bg-white px-2 py-0.5 rounded border border-slate-300">
                      {newPoint[f]} cm
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="8.0"
                    step="0.1"
                    value={newPoint[f]}
                    onChange={e =>
                      setNewPoint(prev => ({ ...prev, [f]: parseFloat(e.target.value) }))
                    }
                    className="w-full accent-emerald-600 min-h-[44px]"
                  />
                </div>
              ))}
            </div>

            <div className="pt-2">
              <PrimaryButton size="md" fullWidth onClick={handlePredictNewSample} icon={<CheckCircle2 size={18} />}>
                새 붓꽃 품종 예측 실행
              </PrimaryButton>
            </div>

            {predictedSpecies && (
              <div className="p-4 rounded-xl bg-emerald-600 text-white text-xs font-bold space-y-1 animate-fadeIn shadow-xs">
                <span className="font-extrabold text-sm block">
                  현재 모델 예측 결과: {SPECIES_MAP[predictedSpecies].korean} ({predictedSpecies})
                </span>
                <p className="text-emerald-100 text-[11px] font-medium">
                  입력된 4가지 속성을 바탕으로 학습된 {algorithm === 'knn' ? `k-NN(k=${kParam})` : `의사결정트리(깊이 ${depthParam})`} 모델이 위와 같이 판정하였습니다.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 5: 모델 만들기 완료 */}
      {currentStep === 5 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900">07 모델 만들기 성공</h3>
              <p className="text-xs text-slate-500">ML 5단계: 모델 학습 완료</p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-600 text-white text-center font-extrabold text-sm shadow-sm">
              "훈련 데이터를 이용해 새로운 데이터를 예측할 준비를 합니다."
            </div>

            <div className="pt-2 text-center space-y-2">
              {isCompleted && (
                <div className="text-xs font-bold text-emerald-700 bg-emerald-100 p-2 rounded-xl inline-block">
                  ✓ 07 모델 만들기가 완료되었습니다. 언제든 다시 설정을 변경해볼 수 있습니다.
                </div>
              )}
              <PrimaryButton size="lg" fullWidth onClick={onComplete} icon={<CheckCircle2 size={20} />}>
                07 모델 만들기 완료 & 평가로 이동
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

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
