import React, { useState, useEffect, useMemo } from 'react';
import { useActivityScrollTop } from '../../hooks/useActivityScrollTop';
import { ORIGINAL_IRIS_DATASET, SPECIES_MAP } from '../../data/irisDataset';
import {
  stratifiedSplitDataset,
  evaluateClassifier,
  type ExperimentResult,
} from '../../algorithms/evaluation';
import type { IrisSpecies } from '../../types/iris';
import { ActivityProgress } from './ActivityProgress';
import { PromptCard } from './PromptCard';
import { PrimaryButton } from '../common/PrimaryButton';
import { SecondaryButton } from '../common/SecondaryButton';
import {
  Award,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  Trophy,
  Grid,
  TrendingUp,
  Sparkles,
  BookOpen,
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

  // Interactive Confusion Matrix state
  const [selectedCell, setSelectedCell] = useState<{ actual: IrisSpecies; predicted: IrisSpecies } | null>(null);
  const [explanationLevel, setExplanationLevel] = useState<1 | 2>(1); // 1 = basic, 2 = detailed

  // Interactive Quiz state
  const [quizUserAnswer, setQuizUserAnswer] = useState<number | null>(null);

  // Misclassified sample selection for 2D Scatter plot
  const [selectedMisclassifiedId, setSelectedMisclassifiedId] = useState<number | null>(null);

  // Reflection questions state
  const [reflectionQ1, setReflectionQ1] = useState<string | null>(null);
  const [reflectionQ2, setReflectionQ2] = useState<string | null>(null);

  // Sync experiments to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_EXP_KEY, JSON.stringify(experiments));
    } catch (e) {
      console.error(e);
    }
  }, [experiments]);

  // Listen for global reset event to reset in-memory experiment states
  useEffect(() => {
    const handleReset = () => {
      setExperiments([]);
      setSelectedFinalExpId(null);
      setSelectedCell(null);
      setQuizUserAnswer(null);
      setSelectedMisclassifiedId(null);
      setReflectionQ1(null);
      setReflectionQ2(null);
    };

    window.addEventListener('learning_data_reset', handleReset);
    return () => window.removeEventListener('learning_data_reset', handleReset);
  }, []);

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

  const currentEval = useMemo(() => {
    return runCurrentEvaluation();
  }, [algorithm, splitRatio, kParam, depthParam]);

  // Find most confused pair in currentEval
  const mostConfusedPair = useMemo<{ actual: IrisSpecies; predicted: IrisSpecies; count: number } | null>(() => {
    let maxCount = 0;
    let pair: { actual: IrisSpecies; predicted: IrisSpecies; count: number } | null = null;

    const speciesList: IrisSpecies[] = ['Iris-setosa', 'Iris-versicolor', 'Iris-virginica'];
    speciesList.forEach(act => {
      speciesList.forEach(pred => {
        if (act !== pred) {
          const count = currentEval.confusionMatrix.matrix[act][pred];
          if (count > maxCount) {
            maxCount = count;
            pair = { actual: act, predicted: pred, count };
          }
        }
      });
    });

    return pair;
  }, [currentEval]);

  // Auto-select initial cell or misclassified sample
  useEffect(() => {
    if (!selectedCell) {
      if (mostConfusedPair) {
        setSelectedCell({ actual: mostConfusedPair.actual, predicted: mostConfusedPair.predicted });
      } else {
        setSelectedCell({ actual: 'Iris-versicolor', predicted: 'Iris-virginica' });
      }
    }
  }, [mostConfusedPair, selectedCell]);

  useEffect(() => {
    if (currentEval.misclassifiedSamples.length > 0 && selectedMisclassifiedId === null) {
      setSelectedMisclassifiedId(currentEval.misclassifiedSamples[0].record.id);
    }
  }, [currentEval.misclassifiedSamples, selectedMisclassifiedId]);

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

  // Helper to compute most confused pair for any experiment
  const getExperimentMostConfused = (exp: ExperimentResult): { actual: IrisSpecies; predicted: IrisSpecies; count: number } | null => {
    let maxCount = 0;
    let pair: { actual: IrisSpecies; predicted: IrisSpecies; count: number } | null = null;
    const speciesList: IrisSpecies[] = ['Iris-setosa', 'Iris-versicolor', 'Iris-virginica'];

    speciesList.forEach(act => {
      speciesList.forEach(pred => {
        if (act !== pred) {
          const count = exp.confusionMatrix.matrix[act][pred];
          if (count > maxCount) {
            maxCount = count;
            pair = { actual: act, predicted: pred, count };
          }
        }
      });
    });
    return pair;
  };

  const promptText = `붓꽃 분류 모델에서 현재 ${currentEval.algorithmLabel}(${currentEval.parametersLabel}, 분할 ${currentEval.splitRatioLabel})의 정확도가 ${currentEval.accuracyPercent}%였다. 혼동행렬 오분류 양상(실제 vs 예측)을 토대로 성능 개선을 위한 2가지 가설을 제시해줘.`;

  // Reading Quiz Data (Dynamic)
  const quizTargetPair: { actual: IrisSpecies; predicted: IrisSpecies; count: number } =
    mostConfusedPair || { actual: 'Iris-versicolor', predicted: 'Iris-virginica', count: 0 };
  const quizCorrectCount = quizTargetPair.count;
  const quizOptions = useMemo(() => {
    const opts = new Set<number>([quizCorrectCount, 0, quizCorrectCount + 1, quizCorrectCount + 2]);
    return Array.from(opts).sort((a, b) => a - b);
  }, [quizCorrectCount]);

  return (
    <div className="space-y-6 scroll-mt-24" ref={topRef}>
      {/* Activity Progress */}
      <ActivityProgress
        currentStep={currentStep}
        totalSteps={totalSteps}
        title={
          currentStep === 1
            ? '1. 테스트 성능 평가 & 3×3 혼동행렬'
            : currentStep === 2
            ? '2. 틀린 예측 (오분류) & 2D 산점도 분석'
            : currentStep === 3
            ? '3. 조건 변경 재실험 (최대 3회)'
            : currentStep === 4
            ? '4. 실험 비교 & 최종 모델 선택'
            : '5. 전체 머신러닝 학습 완료'
        }
      />

      {/* STEP 1: 테스트 데이터 성능 평가 & 3×3 혼동행렬 */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Section 1: Intro Banner Card */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5 rounded-2xl shadow-xs space-y-2">
            <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-md inline-block">
              [모델은 무엇을 헷갈렸을까?]
            </span>
            <h3 className="text-xl font-black">정확도(Accuracy) 너머의 혼동행렬(Confusion Matrix)</h3>
            <p className="text-xs text-emerald-100 leading-relaxed">
              "정확도는 모델이 전체에서 얼마나 많이 맞혔는지를 보여줍니다. 하지만 정확도만 보면 어떤 품종을 어떤 품종으로 잘못 판단했는지는 알기 어렵습니다. <strong>혼동행렬</strong>을 보면 모델이 무엇을 맞혔고 무엇을 헷갈렸는지 명확히 확인할 수 있습니다."
            </p>
          </div>

          {/* Section 9 & 10: 2-Step Explanation Tabs & Accuracy vs Confusion Matrix */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <BookOpen size={18} className="text-emerald-600" />
                <span>혼동행렬을 읽는 2단계 핵심 원리</span>
              </span>

              <div className="flex gap-1.5">
                <button
                  onClick={() => setExplanationLevel(1)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[44px] cursor-pointer ${
                    explanationLevel === 1
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  [1단계: 먼저 이것만 기억]
                </button>
                <button
                  onClick={() => setExplanationLevel(2)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[44px] cursor-pointer ${
                    explanationLevel === 2
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  [2단계: 조금 더 자세히]
                </button>
              </div>
            </div>

            {/* Step 1 or Step 2 Explanation Box */}
            {explanationLevel === 1 ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2 animate-fadeIn">
                <span className="font-extrabold text-emerald-900 block text-sm">
                  💡 1단계: 대각선과 대각선 밖의 의미
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-center pt-1 font-bold">
                  <div className="p-3 bg-white rounded-lg border border-emerald-300 text-emerald-800">
                    <span className="text-base block">↘ 대각선 칸</span>
                    <span className="text-emerald-600 text-[11px]">모델이 정답을 맞힌 개수 (성공)</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-rose-300 text-rose-800">
                    <span className="text-base block">↗ ↘ 대각선 밖의 칸</span>
                    <span className="text-rose-600 text-[11px]">다른 품종으로 잘못 분류한 개수 (오답)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 space-y-2 animate-fadeIn">
                <span className="font-extrabold text-blue-900 block text-sm">
                  💡 2단계: 행(줄)과 열(칸)의 구분
                </span>
                <p className="leading-relaxed">
                  - <strong>행 (줄 ↓)</strong>: 데이터의 **실제 정답 품종 (Actual)**<br />
                  - <strong>열 (칸 →)</strong>: 기계학습 모델이 판단한 **예측 품종 (Predicted)**
                </p>
                <p className="text-[11px] text-blue-900/80 font-medium">
                  ※ 행과 열이 교차하는 칸의 숫자를 읽으면 "실제 어떤 품종을 어떤 품종으로 몇 개 헷갈렸는지"를 정확히 알 수 있습니다.
                </p>
              </div>
            )}

            {/* Accuracy vs Confusion Matrix Comparison Card (Section 10) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-extrabold text-slate-900 block text-xs">📊 정확도 (Accuracy)</span>
                <p className="text-slate-600 leading-relaxed font-medium">
                  "전체 데이터 중 모델이 얼마나 많이 맞혔는가?"를 단 하나의 백분율(%) 수치로 보여줍니다.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-extrabold text-slate-900 block text-xs">🧩 혼동행렬 (Confusion Matrix)</span>
                <p className="text-slate-600 leading-relaxed font-medium">
                  "어떤 품종을 어떤 품종으로 헷갈려서 틀렸는가?"를 세부 오분류 조합별로 구체적으로 보여줍니다.
                </p>
              </div>
            </div>
          </div>

          {/* Test Performance & 3x3 Matrix Container */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-5 rounded-2xl bg-emerald-600 text-white space-y-1 shadow-sm">
                <span className="text-emerald-200 font-bold uppercase tracking-wider text-[11px] block">
                  테스트 데이터 정확도 (Test Accuracy)
                </span>
                <div className="text-3xl font-black font-mono">
                  {currentEval.accuracyPercent}%
                </div>
                <p className="text-emerald-100 text-[11px] pt-1">
                  전체 테스트 데이터 {currentEval.testCount}개 중 {currentEval.correctCount}개 맞춤 ({currentEval.testCount - currentEval.correctCount}개 틀림)
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

            {/* 3x3 Interactive Confusion Matrix Table (Section 2, 3, 4, 14, 15) */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Grid size={18} className="text-emerald-600" />
                  <span>3 × 3 혼동행렬 (클릭하여 셀 해석하기)</span>
                </span>
                <span className="text-slate-600 font-bold bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-[11px]">
                  행 ↓ = 실제 품종 | 열 → = 모델의 예측
                </span>
              </div>

              <div className="w-full overflow-x-auto bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="min-w-[320px] text-xs font-mono text-center space-y-2">
                  {/* Column Headers with Explicit Direction (Section 2 & 3) */}
                  <div className="grid grid-cols-4 gap-2 font-bold text-slate-800 border-b border-slate-300 pb-2.5">
                    <div className="text-emerald-900 bg-emerald-100 p-2 rounded-lg font-extrabold text-[11px] flex items-center justify-center">
                      실제 ↓ \ 예측 →
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span>세토사</span>
                      <span className="text-[10px] text-slate-400 block font-normal">Setosa</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span>버시컬러</span>
                      <span className="text-[10px] text-slate-400 block font-normal">Versicolor</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span>버지니카</span>
                      <span className="text-[10px] text-slate-400 block font-normal">Virginica</span>
                    </div>
                  </div>

                  {/* Matrix Rows */}
                  {currentEval.confusionMatrix.rows.map(actSp => (
                    <div key={actSp} className="grid grid-cols-4 gap-2 items-center">
                      {/* Row Header (Actual Species) */}
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-bold text-slate-900 text-left flex flex-col">
                        <span>{SPECIES_MAP[actSp].korean}</span>
                        <span className="text-[9px] text-slate-400 font-normal">실제 {SPECIES_MAP[actSp].english}</span>
                      </div>

                      {/* 3 Column Cells for this Row */}
                      {currentEval.confusionMatrix.cols.map(predSp => {
                        const count = currentEval.confusionMatrix.matrix[actSp][predSp];
                        const isDiagonal = actSp === predSp;
                        const isSelected = selectedCell?.actual === actSp && selectedCell?.predicted === predSp;

                        return (
                          <button
                            key={predSp}
                            onClick={() => setSelectedCell({ actual: actSp, predicted: predSp })}
                            className={`p-3 rounded-xl font-bold transition-all min-h-[50px] cursor-pointer flex flex-col items-center justify-center relative ${
                              isSelected ? 'ring-4 ring-blue-400 scale-105 z-10 shadow-md' : ''
                            } ${
                              isDiagonal
                                ? 'bg-emerald-500 text-white border-2 border-emerald-600 shadow-xs'
                                : count > 0
                                ? 'bg-rose-500 text-white font-extrabold border-2 border-rose-600 shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <span className="text-base font-black font-mono">{count}</span>
                            <span className="text-[9px] opacity-90 font-sans">
                              {isDiagonal ? '✓ 정답' : count > 0 ? '오답' : '0개'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 6: Selected Cell Interpretation Natural Language Card */}
            {selectedCell && (
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 text-xs animate-fadeIn shadow-md">
                <div className="flex items-center justify-between font-bold border-b border-slate-700 pb-2 text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={16} />
                    <span>[선택한 칸 해석]</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    실제 {SPECIES_MAP[selectedCell.actual].korean} ➔ 예측 {SPECIES_MAP[selectedCell.predicted].korean}
                  </span>
                </div>

                {(() => {
                  const count = currentEval.confusionMatrix.matrix[selectedCell.actual][selectedCell.predicted];
                  const isDiagonal = selectedCell.actual === selectedCell.predicted;
                  const actKor = SPECIES_MAP[selectedCell.actual].korean;
                  const predKor = SPECIES_MAP[selectedCell.predicted].korean;

                  return (
                    <div className="space-y-1.5 leading-relaxed">
                      <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-slate-300">
                        <div>실제 품종: <strong className="text-white">{actKor}</strong></div>
                        <div>모델 예측: <strong className="text-white">{predKor}</strong></div>
                        <div>데이터 수: <strong className="text-amber-300">{count}개</strong></div>
                      </div>

                      <p className="text-sm font-bold text-slate-100 pt-1">
                        {isDiagonal
                          ? `👉 실제 [${actKor}] ${count}개를 모델이 모두 [${predKor}]로 정확하게 맞혔습니다 (정답).`
                          : count > 0
                          ? `👉 실제 [${actKor}]이었지만 모델은 [${predKor}]이라고 잘못 판단(오분류)한 데이터가 ${count}개 있습니다.`
                          : `👉 실제 [${actKor}]을 [${predKor}]로 잘못 판단한 데이터가 0개로, 두 품종을 서로 헷갈리지 않았습니다.`}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Section 7: Overall Misclassification Summary & Most Confused Pair */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <span className="font-extrabold text-slate-900 block text-sm">
                📌 전체 오분류 결과 요약
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono font-bold">
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-sans">전체 테스트 수</span>
                  <span className="text-slate-900 text-sm">{currentEval.testCount}개</span>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800">
                  <span className="text-[10px] text-emerald-700 block font-sans">정답 (대각선 합)</span>
                  <span className="text-sm">{currentEval.correctCount}개</span>
                </div>
                <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-200 text-rose-800">
                  <span className="text-[10px] text-rose-700 block font-sans">오답 (대각선 밖)</span>
                  <span className="text-sm">{currentEval.testCount - currentEval.correctCount}개</span>
                </div>
                <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-200 text-blue-900">
                  <span className="text-[10px] text-blue-700 block font-sans">테스트 정확도</span>
                  <span className="text-sm">{currentEval.accuracyPercent}%</span>
                </div>
              </div>

              {/* Most Confused Pair Result */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-950 font-bold space-y-0.5">
                <span className="text-amber-900 block font-extrabold">
                  🔥 [가장 많이 헷갈린 품종 조합]
                </span>
                {mostConfusedPair ? (
                  <p className="text-xs">
                    실제 <strong>{SPECIES_MAP[mostConfusedPair.actual].korean}</strong> ➔ 예측 <strong>{SPECIES_MAP[mostConfusedPair.predicted].korean}</strong> : 총 <strong className="text-rose-700 font-black">{mostConfusedPair.count}개</strong> 오분류
                  </p>
                ) : (
                  <p className="text-xs text-emerald-800">
                    "이번 테스트에서는 잘못 분류된 데이터가 없습니다!"
                  </p>
                )}
              </div>
            </div>

            {/* Section 8: Interactive Reading Quiz (혼동행렬 읽기 퀴즈) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <span className="font-extrabold text-slate-900 block text-sm flex items-center gap-1.5">
                <HelpCircle size={16} className="text-blue-600" />
                <span>혼동행렬 직접 읽기 퀴즈</span>
              </span>

              <p className="text-slate-700 font-medium">
                질문: 실제 <strong>{SPECIES_MAP[quizTargetPair.actual].korean}</strong>를 <strong>{SPECIES_MAP[quizTargetPair.predicted].korean}</strong>(으)로 잘못 예측한 데이터는 몇 개인가요?
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {quizOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setQuizUserAnswer(opt)}
                    className={`p-2.5 rounded-lg border font-bold text-xs min-h-[44px] cursor-pointer transition-all ${
                      quizUserAnswer === opt
                        ? opt === quizCorrectCount
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {opt}개
                  </button>
                ))}
              </div>

              {quizUserAnswer !== null && (
                <div
                  className={`p-3 rounded-lg text-xs leading-relaxed animate-fadeIn ${
                    quizUserAnswer === quizCorrectCount
                      ? 'bg-emerald-50 text-emerald-950 border border-emerald-200'
                      : 'bg-rose-50 text-rose-950 border border-rose-200'
                  }`}
                >
                  {quizUserAnswer === quizCorrectCount ? (
                    <span>
                      ✓ <strong>정답입니다!</strong> 행(실제 {SPECIES_MAP[quizTargetPair.actual].korean})과 열(예측 {SPECIES_MAP[quizTargetPair.predicted].korean})이 만나는 셀의 숫자({quizCorrectCount}개)를 정확히 읽어내셨습니다.
                    </span>
                  ) : (
                    <span>
                      X 다시 혼동행렬 표를 확인해보세요. 실제 줄({SPECIES_MAP[quizTargetPair.actual].korean})과 예측 칸({SPECIES_MAP[quizTargetPair.predicted].korean})이 교차하는 숫자는 <strong>{quizCorrectCount}개</strong>입니다.
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: 틀린 예측 (오분류) & 2D 산점도 분석 */}
      {currentStep === 2 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <HelpCircle size={20} className="text-amber-600" />
              <span>활동 2: 틀린 예측 (오분류 데이터) 세부 및 2D 산점도 분석</span>
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              현재 모델이 예측에 실패한 테스트 레코드({currentEval.misclassifiedSamples.length}개)의 측정 수치와 산점도 상의 위치를 확인해보세요.
            </p>

            {currentEval.misclassifiedSamples.length === 0 ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 font-bold text-center space-y-1">
                <span className="text-base block">🎉 오분류 데이터가 0개입니다!</span>
                <p className="font-normal text-slate-600">현재 테스트 데이터 30개를 모두 100% 정확하게 맞혔습니다.</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Misclassified Samples List */}
                <div className="space-y-2">
                  <span className="font-extrabold text-slate-900 block">
                    오분류 레코드 목록 (클릭하여 산점도 상 위치 확인):
                  </span>

                  <div className="space-y-2">
                    {currentEval.misclassifiedSamples.map((sample, sIdx) => {
                      const isSelected = selectedMisclassifiedId === sample.record.id;

                      return (
                        <div
                          key={sample.record.id}
                          onClick={() => setSelectedMisclassifiedId(sample.record.id)}
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer space-y-2 ${
                            isSelected
                              ? 'border-rose-500 bg-rose-50/70 shadow-xs ring-2 ring-rose-200'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-slate-900">오분류 데이터 #{sIdx + 1} (ID #{sample.record.id})</span>
                            <span className="bg-rose-100 text-rose-900 px-2.5 py-0.5 rounded font-mono font-extrabold">
                              실제: {SPECIES_MAP[sample.actualSpecies].korean} ➔ 예측: {SPECIES_MAP[sample.predictedSpecies].korean}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200">
                            <div>꽃받침 길이: {sample.record.sepalLength}cm</div>
                            <div>꽃받침 너비: {sample.record.sepalWidth}cm</div>
                            <div>꽃잎 길이: {sample.record.petalLength}cm</div>
                            <div>꽃잎 너비: {sample.record.petalWidth}cm</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 13: 2D Scatter Plot with Highlighted Misclassified Point */}
                {selectedMisclassifiedId && (() => {
                  const targetSample = currentEval.misclassifiedSamples.find(s => s.record.id === selectedMisclassifiedId);
                  if (!targetSample) return null;

                  const targetRec = targetSample.record;

                  return (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-fadeIn">
                      <div className="flex items-center justify-between font-extrabold text-slate-900 text-xs">
                        <span className="flex items-center gap-1.5">
                          <TrendingUp size={16} className="text-rose-600" />
                          <span>오분류 레코드 #{targetRec.id} 2D 산점도 위치 시각화</span>
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          (X: 꽃잎길이 {targetRec.petalLength}cm, Y: 꽃잎너비 {targetRec.petalWidth}cm)
                        </span>
                      </div>

                      {/* SVG 2D Scatter Plot */}
                      <div className="w-full overflow-x-auto bg-white p-3 rounded-lg border border-slate-200">
                        <svg viewBox="0 0 460 260" className="w-full h-auto min-w-[300px]">
                          {/* Axis lines */}
                          <line x1="45" y1="220" x2="440" y2="220" stroke="#cbd5e1" strokeWidth="2" />
                          <line x1="45" y1="20" x2="45" y2="220" stroke="#cbd5e1" strokeWidth="2" />

                          {/* Axis labels */}
                          <text x="240" y="250" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#475569">
                            꽃잎 길이 (cm)
                          </text>
                          <text x="15" y="120" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#475569" transform="rotate(-90 15 120)">
                            꽃잎 너비 (cm)
                          </text>

                          {/* Render all ORIGINAL_IRIS_DATASET points as background reference */}
                          {(() => {
                            const minX = 1.0;
                            const maxX = 7.0;
                            const minY = 0.1;
                            const maxY = 2.5;

                            const mapX = (v: number) => 55 + ((v - minX) / (maxX - minX)) * 375;
                            const mapY = (v: number) => 210 - ((v - minY) / (maxY - minY)) * 185;

                            return (
                              <g>
                                {ORIGINAL_IRIS_DATASET.map(r => {
                                  const cx = mapX(r.petalLength);
                                  const cy = mapY(r.petalWidth);
                                  const isTarget = r.id === targetRec.id;

                                  if (r.species === 'Iris-setosa') {
                                    return <circle key={r.id} cx={cx} cy={cy} r="3.5" fill="#10b981" opacity={isTarget ? 1 : 0.4} />;
                                  } else if (r.species === 'Iris-versicolor') {
                                    return <rect key={r.id} x={cx - 3} y={cy - 3} width="6" height="6" fill="#3b82f6" opacity={isTarget ? 1 : 0.4} rx="1" />;
                                  } else {
                                    return <polygon key={r.id} points={`${cx},${cy-4} ${cx+4},${cy+3} ${cx-4},${cy+3}`} fill="#8b5cf6" opacity={isTarget ? 1 : 0.4} />;
                                  }
                                })}

                                {/* Highlighted Target Misclassified Point with Pulsing Ring */}
                                {(() => {
                                  const tX = mapX(targetRec.petalLength);
                                  const tY = mapY(targetRec.petalWidth);

                                  return (
                                    <g>
                                      {/* Outer Pulsing Ring */}
                                      <circle cx={tX} cy={tY} r="14" fill="#e11d48" fillOpacity="0.25" stroke="#e11d48" strokeWidth="2" strokeDasharray="3 3" />
                                      {/* Inner Dot */}
                                      <circle cx={tX} cy={tY} r="7" fill="#e11d48" stroke="#ffffff" strokeWidth="2" />
                                      {/* Callout Label */}
                                      <rect x={Math.min(300, tX - 45)} y={Math.max(25, tY - 28)} width="110" height="20" fill="#0f172a" rx="4" opacity="0.9" />
                                      <text x={Math.min(300, tX - 45) + 55} y={Math.max(25, tY - 28) + 14} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#ffffff">
                                        ★ 오분류 레코드 #{targetRec.id}
                                      </text>
                                    </g>
                                  );
                                })()}
                              </g>
                            );
                          })()}
                        </svg>
                      </div>

                      {/* Observation Insight */}
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-950 font-medium">
                        💡 <strong>관찰 분석:</strong> "이 오분류 레코드 #{targetRec.id}(실제 {SPECIES_MAP[targetSample.actualSpecies].korean} ➔ 예측 {SPECIES_MAP[targetSample.predictedSpecies].korean})는 <strong>버시컬러와 버지니카 데이터점들이 밀집된 경계 부근에 위치</strong>하고 있어, 최근접 이웃(k-NN)이나 분지 조건에서 모델이 헷갈리기 쉽습니다."
                      </div>
                    </div>
                  );
                })()}
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

      {/* STEP 4: 실험 비교 & 최종 모델 선택 (Section 11) */}
      {currentStep === 4 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Trophy size={20} className="text-amber-500" />
              <span>활동 4: 저장된 실험 비교 & 최종 모델 선택 (혼동행렬 비교)</span>
            </h3>

            {experiments.length === 0 ? (
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 font-bold text-center space-y-1">
                <span className="text-base block">저장된 실험 기록이 없습니다!</span>
                <p className="font-normal text-slate-600">이전 3단계에서 [실험 저장하기] 버튼을 눌러 최소 2개 이상의 실험을 기록해주세요.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Experiments Comparison Cards with Confusion Matrix Differences */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {experiments.map(exp => {
                    const isBest = bestExp?.id === exp.id;
                    const isSelected = selectedFinalExpId === exp.id;
                    const expMostConfused = getExperimentMostConfused(exp);

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
                              <Trophy size={12} /> 최고 정확도
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 font-medium text-[11px] text-slate-600">
                          <div>분할 비율: <strong>{exp.splitRatioLabel}</strong></div>
                          <div>하이퍼파라미터: <strong>{exp.parametersLabel}</strong></div>
                          <div>테스트 맞춤: <strong>{exp.testCount}개 중 {exp.correctCount}개 ({exp.accuracyPercent}%)</strong></div>
                        </div>

                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 font-mono text-center">
                          <span className="text-[11px] text-slate-500 block">정확도</span>
                          <span className="text-lg font-black text-emerald-700">{exp.accuracyPercent}%</span>
                        </div>

                        {/* Most Confused Pair in Confusion Matrix (Section 11) */}
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] font-bold text-amber-950">
                          <span className="text-slate-500 block text-[10px] font-sans">가장 많이 헷갈린 경우:</span>
                          {expMostConfused ? (
                            <span>
                              {SPECIES_MAP[expMostConfused.actual].korean} ➔ {SPECIES_MAP[expMostConfused.predicted].korean} ({expMostConfused.count}개)
                            </span>
                          ) : (
                            <span className="text-emerald-700">오분류 0개</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Accuracy vs Confusion Matrix Insight (Section 11) */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <span className="font-bold text-slate-900 block text-sm">💡 혼동행렬을 통한 모델 비교 핵심 관찰:</span>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    "두 모델의 정확도 숫자(%)가 같거나 비슷하더라도, 혼동행렬을 들여다보면 모델마다 틀리는 패턴(어떤 품종끼리 헷갈리는지)은 서로 다를 수 있습니다. 따라서 단순 정확도 수치만 보지 않고 오분류 양상까지 함께 고려해야 최적의 모델을 고를 수 있습니다."
                  </p>
                </div>

                {selectedFinalExpId && (
                  <div className="p-4 rounded-xl bg-purple-600 text-white text-xs font-bold space-y-1 animate-fadeIn shadow-xs">
                    <span className="font-extrabold text-sm block">
                      최종 선택된 모델: {experiments.find(e => e.id === selectedFinalExpId)?.id} ({experiments.find(e => e.id === selectedFinalExpId)?.algorithmLabel})
                    </span>
                    <p className="text-purple-100 text-[11px] font-medium">
                      정확도({experiments.find(e => e.id === selectedFinalExpId)?.accuracyPercent}%)와 혼동행렬 오분류 양상을 종합적으로 검토하여 최종 배포 모델로 확정하셨습니다.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 5: 전체 머신러닝 학습 완료 (Section 16 & 17) */}
      {currentStep === 5 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Key Takeaways Card (Section 16) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen size={20} className="text-emerald-600" />
              <span>학생용 핵심 정리 — [혼동행렬 읽는 법 5가지]</span>
            </h3>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs text-emerald-950 font-medium">
              <ul className="space-y-2 text-[12px] list-none">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">1</span>
                  <span><strong>행 (줄 ↓) = 실제 정답 품종 (Actual)</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">2</span>
                  <span><strong>열 (칸 →) = 모델의 예측 품종 (Predicted)</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">3</span>
                  <span><strong>대각선 (↘) = 모델이 맞힌 경우 (정답)</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">4</span>
                  <span><strong>대각선 밖 (↗ ↘) = 다른 품종으로 잘못 분류한 경우 (오답)</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">5</span>
                  <span><strong>오답 위치를 확인하면 모델이 무엇을 헷갈리는지 원인을 파악할 수 있다.</strong></span>
                </li>
              </ul>
            </div>
          </div>

          {/* Student Reflection Questions (Section 17) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <HelpCircle size={20} className="text-amber-500" />
              <span>[생각하기] 최종 평가 질문</span>
            </h3>

            {/* Q1 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <span className="font-extrabold text-slate-900 block text-sm">
                질문 1: 정확도 수치만 봤을 때 알 수 없었던 정보를 혼동행렬에서는 무엇을 알 수 있었나요?
              </span>
              <div className="space-y-1.5">
                {[
                  { key: 'q1_a1', label: '단순 맞힌 비율 외에 어떤 품종을 어떤 품종으로 헷갈려서 틀렸는지 세부 원인을 알 수 있었습니다.' },
                  { key: 'q1_a2', label: '정확도가 같더라도 오분류 패턴이 다른 모델의 특성을 비교할 수 있었습니다.' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setReflectionQ1(opt.key)}
                    className={`w-full text-left p-3 rounded-lg border text-xs font-bold transition-all min-h-[44px] cursor-pointer ${
                      reflectionQ1 === opt.key
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ✓ {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Q2 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <span className="font-extrabold text-slate-900 block text-sm">
                질문 2: 정확도가 가장 높은 모델이 항상 무조건 제일 좋은 적절한 모델이라고 할 수 있을까요?
              </span>
              <div className="space-y-1.5">
                {[
                  { key: 'q2_a1', label: '아닙니다. 정확도가 조금 낮더라도 오분류 위험이 적거나 설명하기 쉬운 모델이 더 적절할 수 있습니다.' },
                  { key: 'q2_a2', label: '네. 무조건 테스트 정확도 수치가 가장 높은 모델이 무조건 완벽합니다.' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setReflectionQ2(opt.key)}
                    className={`w-full text-left p-3 rounded-lg border text-xs font-bold transition-all min-h-[44px] cursor-pointer ${
                      reflectionQ2 === opt.key
                        ? opt.key === 'q2_a1'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Complete Banner */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto shadow-xs">
              <Trophy size={36} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900">
                🎉 Iris AI Lab 전체 학습 과정 완수!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
                AI 활용법부터 데이터 준비, 전처리, 학습 방법, 알고리즘 시뮬레이션, 모델 제작 및 혼동행렬 기반 성능 평가까지 기계학습 문제 해결 전체 6단계를 완수하셨습니다.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-600 text-white text-center font-extrabold text-sm shadow-sm max-w-xl mx-auto">
              "혼동행렬을 통해 오분류 원인을 분석하고 조건을 바꾸며 모델을 지속적으로 개선할 수 있습니다."
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
