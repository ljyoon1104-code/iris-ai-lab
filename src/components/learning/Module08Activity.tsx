import React, { useState, useEffect } from 'react';
import { useActivityScrollTop } from '../../hooks/useActivityScrollTop';
import { ORIGINAL_IRIS_DATASET, SPECIES_MAP } from '../../data/irisDataset';
import {
  stratifiedSplitDataset,
  evaluateClassifier,
  type ExperimentResult,
} from '../../algorithms/evaluation';
import { ActivityProgress } from './ActivityProgress';
import { PromptCard } from './PromptCard';
import { PrimaryButton } from '../common/PrimaryButton';
import { SecondaryButton } from '../common/SecondaryButton';
import {
  Award,
  BarChart3,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  Trophy,
} from 'lucide-react';

interface Module08ActivityProps {
  isCompleted: boolean;
  onComplete: () => void;
}

const LOCAL_STORAGE_EXP_KEY = 'iris_ai_lab_experiments';

export const Module08Activity: React.FC<Module08ActivityProps> = ({ isCompleted, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const topRef = useActivityScrollTop<HTMLDivElement>(currentStep);

  // Experiment setup state for current iteration
  const [algorithm, setAlgorithm] = useState<'knn' | 'decisionTree'>('knn');
  const [splitRatio, setSplitRatio] = useState<number>(0.8); // 80:20
  const [kParam, setKParam] = useState<number>(5);
  const [depthParam, setDepthParam] = useState<number>(3);

  // Saved experiments list (Max 3)
  const [experiments, setExperiments] = useState<ExperimentResult[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_EXP_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedFinalExpId, setSelectedFinalExpId] = useState<string | null>(null);

  // Sync experiments to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_EXP_KEY, JSON.stringify(experiments));
    } catch (e) {
      console.error(e);
    }
  }, [experiments]);

  // Execute evaluation on current setup
  const runCurrentEvaluation = (): ExperimentResult => {
    const split = stratifiedSplitDataset(ORIGINAL_IRIS_DATASET, splitRatio, 42);
    const params = algorithm === 'knn' ? { k: kParam } : { maxDepth: depthParam };
    const evalRes = evaluateClassifier(algorithm, split.trainData, split.testData, params);

    const ratioLabel = `${Math.round(splitRatio * 100)}:${Math.round((1 - splitRatio) * 100)}`;
    const paramLabel = algorithm === 'knn' ? `k = ${kParam}` : `깊이 = ${depthParam}`;

    return {
      id: `exp_${Date.now()}`,
      algorithm,
      algorithmLabel: algorithm === 'knn' ? 'k-NN' : '의사결정트리',
      splitRatioLabel: ratioLabel,
      parametersLabel: paramLabel,
      trainCount: split.trainData.length,
      testCount: split.testData.length,
      accuracyPercent: evalRes.confusionMatrix.accuracyPercent,
      correctCount: evalRes.confusionMatrix.correctCount,
      confusionMatrix: evalRes.confusionMatrix,
      misclassifiedSamples: evalRes.misclassified,
    };
  };

  const currentEval = runCurrentEvaluation();

  const handleSaveCurrentExperiment = () => {
    if (experiments.length >= 3) return;
    const newExp = {
      ...currentEval,
      id: `실험 ${experiments.length + 1}`,
    };
    setExperiments(prev => [...prev, newExp]);
  };

  const handleResetExperiments = () => {
    setExperiments([]);
    setSelectedFinalExpId(null);
  };

  // Find best accuracy experiment
  const bestExp = experiments.reduce((best, curr) => {
    if (!best || curr.accuracyPercent > best.accuracyPercent) return curr;
    return best;
  }, null as ExperimentResult | null);

  const promptText = `붓꽃 분류 모델에서 현재 ${currentEval.algorithmLabel}(${currentEval.parametersLabel}, 분할 ${currentEval.splitRatioLabel})의 정확도가 ${currentEval.accuracyPercent}%였다. 성능 개선을 위해 시도해볼 2가지 가설을 제시해줘.`;

  return (
    <div className="space-y-6 scroll-mt-24" ref={topRef}>
      {/* Activity Progress */}
      <ActivityProgress
        currentStep={currentStep}
        totalSteps={totalSteps}
        title={
          currentStep === 1
            ? '1. 테스트 데이터 성능 평가 & 혼동행렬'
            : currentStep === 2
            ? '2. 틀린 예측 (오분류) 분석'
            : currentStep === 3
            ? '3. 조건 변경 재실험 (최대 3회)'
            : currentStep === 4
            ? '4. 실험 비교 & 최종 모델 선택'
            : '5. 전체 머신러닝 학습 완료'
        }
      />

      {/* STEP 1: 테스트 데이터 성능 평가 & 혼동행렬 */}
      {currentStep === 1 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <BarChart3 size={20} className="text-emerald-600" />
              <span>활동 1: 테스트 데이터 성능 평가 & 3×3 혼동행렬 (Confusion Matrix)</span>
            </h3>

            {/* Test Accuracy Summary Metric Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-5 rounded-2xl bg-emerald-600 text-white space-y-1 shadow-sm">
                <span className="text-emerald-200 font-bold uppercase tracking-wider text-[11px] block">
                  테스트 데이터 정확도 (Test Accuracy)
                </span>
                <div className="text-3xl font-black font-mono">
                  {currentEval.accuracyPercent}%
                </div>
                <p className="text-emerald-100 text-[11px] pt-1">
                  테스트 데이터 {currentEval.testCount}개 중 {currentEval.correctCount}개를 맞혔습니다.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-extrabold text-slate-900 block text-xs">현재 평가 모델 조건:</span>
                <ul className="space-y-1 text-slate-700 font-medium">
                  <li>알고리즘: <strong>{currentEval.algorithmLabel}</strong></li>
                  <li>분할 비율: <strong>{currentEval.splitRatioLabel} (Train {currentEval.trainCount} / Test {currentEval.testCount})</strong></li>
                  <li>하이퍼파라미터: <strong>{currentEval.parametersLabel}</strong></li>
                </ul>
              </div>
            </div>

            {/* 3x3 Confusion Matrix */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-900">3 × 3 혼동행렬 (Confusion Matrix)</span>
                <span className="text-slate-500 font-medium">실제 품종 (행) vs 예측 품종 (열)</span>
              </div>

              <div className="w-full overflow-x-auto bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="min-w-[340px] text-xs font-mono text-center space-y-2">
                  {/* Column Header */}
                  <div className="grid grid-cols-4 gap-2 font-bold text-slate-700 border-b border-slate-300 pb-2">
                    <span className="text-slate-400">실제 \ 예측</span>
                    <span>세토사</span>
                    <span>버시컬러</span>
                    <span>버지니카</span>
                  </div>

                  {/* Rows */}
                  {currentEval.confusionMatrix.rows.map(actSp => (
                    <div key={actSp} className="grid grid-cols-4 gap-2 items-center">
                      <span className="font-bold text-slate-800 text-left truncate">
                        {SPECIES_MAP[actSp].korean}
                      </span>
                      {currentEval.confusionMatrix.cols.map(predSp => {
                        const count = currentEval.confusionMatrix.matrix[actSp][predSp];
                        const isDiagonal = actSp === predSp;

                        return (
                          <div
                            key={predSp}
                            className={`p-2.5 rounded-xl font-bold transition-all ${
                              isDiagonal
                                ? count > 0
                                  ? 'bg-emerald-500 text-white shadow-xs'
                                  : 'bg-slate-200 text-slate-500'
                                : count > 0
                                ? 'bg-rose-500 text-white font-extrabold'
                                : 'bg-white border border-slate-200 text-slate-400'
                            }`}
                          >
                            {count}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: 틀린 예측 (오분류) 분석 */}
      {currentStep === 2 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <HelpCircle size={20} className="text-amber-600" />
              <span>활동 2: 틀린 예측 (오분류 데이터) 분석하기</span>
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              현재 모델이 예측에 실패한 테스트 레코드({currentEval.misclassifiedSamples.length}개)를 살펴보고 원인을 탐구해보세요.
            </p>

            {currentEval.misclassifiedSamples.length === 0 ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 font-bold text-center space-y-1">
                <span className="text-base block">🎉 틀린 예측이 0개입니다!</span>
                <p className="font-normal text-slate-600">현재 테스트 데이터 30개를 모두 100% 정확하게 맞혔습니다.</p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {currentEval.misclassifiedSamples.map((sample, sIdx) => (
                  <div key={sample.record.id} className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-rose-950">오분류 데이터 #{sIdx + 1} (ID #{sample.record.id})</span>
                      <span className="bg-rose-200 text-rose-900 px-2 py-0.5 rounded font-mono">
                        실제: {SPECIES_MAP[sample.actualSpecies].korean} ➔ 예측: {SPECIES_MAP[sample.predictedSpecies].korean}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] text-slate-800 bg-white p-2.5 rounded-lg border border-rose-200">
                      <div>꽃받침 길이: {sample.record.sepalLength}cm</div>
                      <div>꽃받침 너비: {sample.record.sepalWidth}cm</div>
                      <div>꽃잎 길이: {sample.record.petalLength}cm</div>
                      <div>꽃잎 너비: {sample.record.petalWidth}cm</div>
                    </div>
                  </div>
                ))}

                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 leading-relaxed">
                  💡 두 품종(버시컬러와 버지니카)의 측정 수치가 서로 겹치는 경계 영역에 있는 경우 오분류가 발생할 수 있습니다.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: 조건 변경 재실험 (최대 3회) */}
      {currentStep === 3 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <RotateCcw size={20} className="text-emerald-600" />
              <span>활동 3: 조건 변경 재실험 (최대 3회 실험 저장)</span>
            </h3>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
              <span className="font-extrabold text-slate-900 block text-sm">
                새로운 조건으로 설정 변경:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Algorithm Choice */}
                <div>
                  <span className="font-bold text-slate-700 block mb-1">알고리즘:</span>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => setAlgorithm('knn')}
                      className={`p-2 rounded-lg border font-bold text-xs cursor-pointer min-h-[44px] ${
                        algorithm === 'knn' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700'
                      }`}
                    >
                      k-NN
                    </button>
                    <button
                      onClick={() => setAlgorithm('decisionTree')}
                      className={`p-2 rounded-lg border font-bold text-xs cursor-pointer min-h-[44px] ${
                        algorithm === 'decisionTree' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-700'
                      }`}
                    >
                      의사결정트리
                    </button>
                  </div>
                </div>

                {/* Split Ratio */}
                <div>
                  <span className="font-bold text-slate-700 block mb-1">분할 비율 (Train:Test):</span>
                  <div className="grid grid-cols-3 gap-1">
                    {[0.6, 0.7, 0.8].map(r => (
                      <button
                        key={r}
                        onClick={() => setSplitRatio(r)}
                        className={`p-2 rounded-lg border font-bold text-xs cursor-pointer min-h-[44px] ${
                          splitRatio === r ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700'
                        }`}
                      >
                        {Math.round(r * 100)}:{Math.round((1 - r) * 100)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hyperparameter */}
                <div>
                  <span className="font-bold text-slate-700 block mb-1">
                    {algorithm === 'knn' ? 'k (이웃 수)' : '최대 깊이 (maxDepth)'}:
                  </span>
                  {algorithm === 'knn' ? (
                    <div className="grid grid-cols-4 gap-1">
                      {[1, 3, 5, 7].map(v => (
                        <button
                          key={v}
                          onClick={() => setKParam(v)}
                          className={`p-2 rounded-lg border font-bold text-xs cursor-pointer min-h-[44px] ${
                            kParam === v ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1">
                      {[2, 3, 4].map(v => (
                        <button
                          key={v}
                          onClick={() => setDepthParam(v)}
                          className={`p-2 rounded-lg border font-bold text-xs cursor-pointer min-h-[44px] ${
                            depthParam === v ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-700'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Current Calculated Accuracy Preview */}
              <div className="p-3 bg-white rounded-lg border border-slate-300 font-bold flex items-center justify-between">
                <span>계산된 테스트 정확도:</span>
                <span className="font-mono text-emerald-700 font-extrabold text-sm">{currentEval.accuracyPercent}%</span>
              </div>
            </div>

            {/* Save Experiment Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <SecondaryButton size="sm" onClick={handleResetExperiments} icon={<RotateCcw size={16} />}>
                실험 기록 초기화
              </SecondaryButton>

              <PrimaryButton
                size="md"
                onClick={handleSaveCurrentExperiment}
                disabled={experiments.length >= 3}
                icon={<Award size={18} />}
              >
                {experiments.length >= 3
                  ? '최대 3개 실험 저장 완료'
                  : `현재 조건으로 실험 ${experiments.length + 1} 저장하기`}
              </PrimaryButton>
            </div>

            {/* AI Prompt Section */}
            <div className="pt-2 space-y-1">
              <PromptCard promptText={promptText} title="AI 성능 개선 가설 생성 프롬프트" />
              <p className="text-[11px] text-amber-800 font-bold">
                ⚠️ AI의 추천은 하나의 가설일 뿐이며, 실제로 더 좋아지는지는 웹앱 실험을 통해 직접 확인합니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: 실험 비교 & 최종 모델 선택 */}
      {currentStep === 4 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Trophy size={20} className="text-amber-500" />
              <span>활동 4: 저장된 실험 비교 & 최종 모델 선택</span>
            </h3>

            {experiments.length === 0 ? (
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 font-bold text-center space-y-1">
                <span className="text-base block">저장된 실험 기록이 없습니다!</span>
                <p className="font-normal text-slate-600">이전 3단계에서 [실험 저장하기] 버튼을 눌러 최소 2개 이상의 실험을 기록해주세요.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Experiments Comparison Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {experiments.map(exp => {
                    const isBest = bestExp?.id === exp.id;
                    const isSelected = selectedFinalExpId === exp.id;

                    return (
                      <div
                        key={exp.id}
                        onClick={() => setSelectedFinalExpId(exp.id)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2.5 ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50 text-purple-950 shadow-md ring-2 ring-purple-300'
                            : isBest
                            ? 'border-amber-400 bg-amber-50/70 text-slate-900'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between font-extrabold">
                          <span className="text-sm">{exp.id} ({exp.algorithmLabel})</span>
                          {isBest && (
                            <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1">
                              <Trophy size={12} /> 이번 실험 최고 정확도
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 font-medium text-[11px] text-slate-600">
                          <div>분할 비율: <strong>{exp.splitRatioLabel}</strong></div>
                          <div>하이퍼파라미터: <strong>{exp.parametersLabel}</strong></div>
                          <div>테스트 데이터: <strong>{exp.testCount}개 중 {exp.correctCount}개 맞춤 ({exp.accuracyPercent}%)</strong></div>
                        </div>

                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 font-mono text-center">
                          <span className="text-[11px] text-slate-500 block">정확도</span>
                          <span className="text-lg font-black text-emerald-700">{exp.accuracyPercent}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Final Model Selection Criteria Checklist */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <span className="font-bold text-slate-900 block text-sm">💡 최종 모델 선택 시 다각도 고려 기준:</span>
                  <ul className="space-y-1 text-[11px] text-slate-600 list-disc list-inside">
                    <li><strong>테스트 정확도:</strong> 독립된 검증 데이터에서 전체 중 얼마나 높은 비율로 정답을 맞혔는가?</li>
                    <li><strong>오분류 양상:</strong> 특정 특정 품종(버시컬러 vs 버지니카)을 집중적으로 헷갈려하는지 점검.</li>
                    <li><strong>해석 용이성:</strong> 의사결정트리처럼 판단 조건을 사람이 이해하고 설명하기 쉬운가?</li>
                    <li><strong>설정 복잡도:</strong> 하이퍼파라미터 설정이나 데이터 요구사항이 지나치게 복잡하지 않은가?</li>
                  </ul>
                </div>

                {selectedFinalExpId && (
                  <div className="p-4 rounded-xl bg-purple-600 text-white text-xs font-bold space-y-1 animate-fadeIn shadow-xs">
                    <span className="font-extrabold text-sm block">
                      최종 선택된 모델: {experiments.find(e => e.id === selectedFinalExpId)?.id} ({experiments.find(e => e.id === selectedFinalExpId)?.algorithmLabel})
                    </span>
                    <p className="text-purple-100 text-[11px] font-medium">
                      성능과 조건(정확도 {experiments.find(e => e.id === selectedFinalExpId)?.accuracyPercent}%)을 종합적으로 고려하여 최종 배포 모델로 확정하셨습니다.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 5: 전체 머신러닝 학습 완료 */}
      {currentStep === 5 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto shadow-xs">
              <Trophy size={36} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900">
                🎉 Iris AI Lab 전체 학습 과정 완수!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
                AI 활용법부터 데이터 준비, 전처리, 학습 방법, 알고리즘 시뮬레이션, 모델 제작 및 성능 평가까지 기계학습 문제 해결 전체 6단계를 직접 완료하셨습니다.
              </p>
            </div>

            {/* Key Summary Sentence Banner */}
            <div className="p-4 rounded-2xl bg-emerald-600 text-white text-center font-extrabold text-sm shadow-sm max-w-xl mx-auto">
              "테스트 결과를 확인하고 조건을 바꾸며 모델을 개선할 수 있습니다."
            </div>

            {/* Completed 6 Steps Roadmap Review */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-bold text-left max-w-2xl mx-auto">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">✓ 1. 문제 정의</div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">✓ 2. 데이터 수집</div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">✓ 3. 데이터 전처리</div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">✓ 4. 유형/알고리즘 선정</div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">✓ 5. 모델 학습</div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">✓ 6. 성능 평가 및 수정</div>
            </div>

            <div className="pt-2">
              {isCompleted && (
                <div className="text-xs font-bold text-emerald-700 bg-emerald-100 p-2.5 rounded-xl block mb-2">
                  ✓ 이미 전체 8개 영역 학습이 모두 완료되었습니다. 자유롭게 언제든 다시 복습할 수 있습니다.
                </div>
              )}
              <PrimaryButton size="lg" fullWidth onClick={onComplete} icon={<CheckCircle2 size={22} />}>
                Iris AI Lab 전체 완료 수료하기
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
