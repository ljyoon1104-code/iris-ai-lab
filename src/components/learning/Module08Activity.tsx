import React, { useState, useEffect, useMemo } from 'react';
import { useActivityScrollTop } from '../../hooks/useActivityScrollTop';
import { ORIGINAL_IRIS_DATASET, SPECIES_MAP } from '../../data/irisDataset';
import {
  stratifiedSplitDataset,
  evaluateClassifier,
  type ExperimentResult,
} from '../../algorithms/evaluation';
import { loadActiveModelConfig } from '../../utils/storage';
import type { IrisSpecies } from '../../types/iris';
import { SpeciesBadge, SpeciesLabel } from '../common/SpeciesBadge';
import { SpeciesMarker } from '../common/SpeciesMarker';
import { ALL_SPECIES_LIST } from '../../constants/species';
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
import { ActivityChecklist } from './ActivityChecklist';

interface Module08ActivityProps {
  isCompleted: boolean;
  onComplete: () => void;
}

const LOCAL_STORAGE_EXP_KEY = 'iris_ai_lab_experiments';

export const Module08Activity: React.FC<Module08ActivityProps> = ({ isCompleted, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const topRef = useActivityScrollTop<HTMLDivElement>(currentStep);

  // Load configuration transferred from Module 07 if present, otherwise default fallback
  const [initialModelConfig] = useState(() => loadActiveModelConfig());

  // Experiment setup state for current iteration
  const [algorithm, setAlgorithm] = useState<'knn' | 'decisionTree'>(() => initialModelConfig?.algorithm || 'knn');
  const [splitRatio, setSplitRatio] = useState<number>(() => initialModelConfig?.splitRatio || 0.8);
  const [kParam, setKParam] = useState<number>(() => initialModelConfig?.kParam || 5);
  const [depthParam, setDepthParam] = useState<number>(() => initialModelConfig?.depthParam || 3);

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

  // Track user evaluation interactions for completion criteria
  const [hasCheckedMatrix, setHasCheckedMatrix] = useState(false);
  const [hasReevaluated, setHasReevaluated] = useState(false);

  const [act5Confirmed, setAct5Confirmed] = useState(false);

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
      setHasCheckedMatrix(false);
      setHasReevaluated(false);
      setAlgorithm('knn');
      setSplitRatio(0.8);
      setKParam(5);
      setDepthParam(3);
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

  const currentEval = useMemo<{ actual: IrisSpecies; predicted: IrisSpecies; count: number } | null | any>(() => {
    return runCurrentEvaluation();
  }, [algorithm, splitRatio, kParam, depthParam]);

  // Unified step completion check
  const isStepCompleted = useMemo(() => {
    switch (currentStep) {
      case 1:
        return quizUserAnswer !== null || hasCheckedMatrix;
      case 2:
        return currentEval.misclassifiedSamples.length === 0 || selectedMisclassifiedId !== null;
      case 3:
        return experiments.length > 0 || hasReevaluated;
      case 4:
        return selectedFinalExpId !== null;
      case 5:
        return act5Confirmed;
      default:
        return true;
    }
  }, [
    currentStep,
    quizUserAnswer,
    hasCheckedMatrix,
    currentEval.misclassifiedSamples.length,
    selectedMisclassifiedId,
    experiments.length,
    hasReevaluated,
    selectedFinalExpId,
    act5Confirmed,
  ]);

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

  // Auto-select initial cell
  useEffect(() => {
    if (!selectedCell) {
      if (mostConfusedPair) {
        setSelectedCell({ actual: mostConfusedPair.actual, predicted: mostConfusedPair.predicted });
      } else {
        setSelectedCell({ actual: 'Iris-versicolor', predicted: 'Iris-virginica' });
      }
    }
  }, [mostConfusedPair, selectedCell]);

  const handleSaveCurrentExperiment = () => {
    if (experiments.length >= 3) return;
    const newExp = {
      ...currentEval,
      id: `실험 ${experiments.length + 1}`,
    };
    setExperiments(prev => [...prev, newExp]);
    setHasReevaluated(true);
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

  // Checklist items
  const checklistItems = [
    { id: 'acc', label: '독립 테스트 데이터 정확도(%) 확인', isCompleted: true },
    { id: 'cm', label: '3×3 혼동행렬 확인 및 셀 터치 해석', isCompleted: hasCheckedMatrix },
    { id: 'mis', label: '오분류 샘플 및 2D 산점도 위치 관찰', isCompleted: currentStep >= 2 },
    { id: 'reeval', label: '조건 변경 재평가 및 저장 (최소 1회)', isCompleted: hasReevaluated || experiments.length > 0 },
  ];

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

      {/* Role Distinction Intro Banner (Section 11) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
            [공식 6단계 과정] ⑥ 성능 평가 및 수정
          </span>
          <span className="text-xs text-slate-500 font-medium">07(만들기) vs 08(평가하기)</span>
        </div>

        <h2 className="text-xl font-black text-slate-900">
          [이 모델은 얼마나 잘 작동할까? 이 모델을 믿어도 될까?]
        </h2>

        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          07에서 만든 모델을 **독립된 테스트 데이터(30개)**에 적용하여 정확도 수치와 혼동행렬 오분류 원인을 다각도로 평가합니다.
        </p>

        {initialModelConfig && (
          <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 font-bold">
            <span className="text-emerald-700">✓ 07에서 만든 모델 설정을 불러왔습니다:</span>
            <span className="bg-white px-2 py-0.5 rounded border border-emerald-300 font-mono text-[11px]">
              {initialModelConfig.algorithm === 'knn' ? `k-NN (k=${initialModelConfig.kParam})` : `의사결정트리 (깊이 ${initialModelConfig.depthParam})`} · 분할 {Math.round(initialModelConfig.splitRatio * 100)}:{Math.round((1 - initialModelConfig.splitRatio) * 100)}
            </span>
          </div>
        )}
      </div>

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

          {/* Section 9 & 13: 2-Step Explanation Tabs */}
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

            {/* Step 1 or Step 2 Explanation Box (Section 13) */}
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
                  ① <strong>행 (줄 ↓)</strong>: 데이터의 **실제 정답 품종 (Actual)**<br />
                  ② <strong>열 (칸 →)</strong>: 기계학습 모델이 출력한 **예측 품종 (Predicted)**
                </p>
                <p className="text-[11px] text-blue-900/80 font-medium">
                  ※ 행과 열이 교차하는 칸의 숫자를 읽으면 "실제 어떤 품종을 어떤 품종으로 몇 개 헷갈렸는지"를 정확히 알 수 있습니다.
                </p>
              </div>
            )}

            {/* Section 12 & 17: Accuracy Explanation & Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-extrabold text-slate-900 block text-xs">📊 정확도 (Accuracy)</span>
                <p className="text-slate-600 leading-relaxed font-medium">
                  "전체 테스트 데이터 중 모델이 맞게 분류한 비율" ({currentEval.correctCount} / {currentEval.testCount} = {currentEval.accuracyPercent}%)
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-extrabold text-slate-900 block text-xs">🧩 혼동행렬 (Confusion Matrix)</span>
                <p className="text-slate-600 leading-relaxed font-medium">
                  "어떤 품종을 어떤 품종으로 헷갈려서 틀렸는가?" 세부 오분류 조합을 분석합니다.
                </p>
              </div>
            </div>
          </div>

          {/* Test Performance & 3x3 Matrix Container */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            {/* Section 12: Top Metric Cards with Actual Count & Ratio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-5 rounded-2xl bg-emerald-600 text-white space-y-1 shadow-sm">
                <span className="text-emerald-200 font-bold uppercase tracking-wider text-[11px] block">
                  테스트 데이터 정확도 (Test Accuracy)
                </span>
                <div className="text-3xl font-black font-mono">
                  {currentEval.accuracyPercent}%
                </div>
                <p className="text-emerald-100 text-[11px] pt-1">
                  전체 테스트 데이터 {currentEval.testCount}개 중 <strong>{currentEval.correctCount}개 정답</strong> ({currentEval.testCount - currentEval.correctCount}개 오답)
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

            {/* 3x3 Interactive Confusion Matrix Table */}
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

              <div className="w-full overflow-x-auto bg-slate-50 p-2 sm:p-4 rounded-2xl border border-slate-200">
                <div className="w-full text-xs font-mono text-center space-y-1.5 sm:space-y-2">
                  {/* Column Headers */}
                  <div className="grid grid-cols-4 gap-1 sm:gap-2 font-bold text-slate-800 border-b border-slate-300 pb-2">
                    <div className="text-emerald-900 bg-emerald-100 p-1 sm:p-2 rounded-lg font-extrabold text-[9px] sm:text-[11px] flex items-center justify-center">
                      실제\예측
                    </div>
                    <div className="p-1 sm:p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                      <SpeciesBadge species="Iris-setosa" size="xs" />
                    </div>
                    <div className="p-1 sm:p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                      <SpeciesBadge species="Iris-versicolor" size="xs" />
                    </div>
                    <div className="p-1 sm:p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                      <SpeciesBadge species="Iris-virginica" size="xs" />
                    </div>
                  </div>

                  {/* Matrix Rows */}
                  {currentEval.confusionMatrix.rows.map((actSp: IrisSpecies) => (
                    <div key={actSp} className="grid grid-cols-4 gap-1 sm:gap-2 items-center">
                      {/* Row Header (Actual Species) */}
                      <div className="p-1.5 sm:p-2 bg-white rounded-lg border border-slate-200 font-bold text-slate-900 text-left flex items-center">
                        <SpeciesBadge species={actSp} size="xs" />
                      </div>

                      {/* 3 Column Cells */}
                      {currentEval.confusionMatrix.cols.map((predSp: IrisSpecies) => {
                        const count = currentEval.confusionMatrix.matrix[actSp][predSp];
                        const isDiagonal = actSp === predSp;
                        const isSelected = selectedCell?.actual === actSp && selectedCell?.predicted === predSp;

                        return (
                          <button
                            key={predSp}
                            onClick={() => {
                              setSelectedCell({ actual: actSp, predicted: predSp });
                              setHasCheckedMatrix(true);
                            }}
                            className={`p-1.5 sm:p-3 rounded-xl font-bold transition-all min-h-[44px] sm:min-h-[50px] cursor-pointer flex flex-col items-center justify-center relative ${
                              isSelected ? 'ring-3 ring-blue-400 scale-102 z-10 shadow-md' : ''
                            } ${
                              isDiagonal
                                ? 'bg-emerald-500 text-white border-2 border-emerald-600 shadow-xs'
                                : count > 0
                                ? 'bg-rose-500 text-white font-extrabold border-2 border-rose-600 shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <span className="text-sm sm:text-base font-black font-mono leading-none">{count}</span>
                            <span className="text-[8px] sm:text-[9px] opacity-90 font-sans mt-0.5">
                              {isDiagonal ? '✓정답' : count > 0 ? '오답' : '0개'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Cell Natural Language Card (Section 15) */}
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

                      <div className="text-sm font-bold text-slate-100 pt-1 leading-relaxed">
                        {isDiagonal ? (
                          <div className="flex items-center gap-1 flex-wrap">
                            <span>👉 실제</span>
                            <SpeciesLabel species={selectedCell.actual} size="xs" />
                            <span>{count}개를 모델이 모두</span>
                            <SpeciesLabel species={selectedCell.predicted} size="xs" />
                            <span>로 정확하게 맞혔습니다 (정답).</span>
                          </div>
                        ) : count > 0 ? (
                          <div className="flex items-center gap-1 flex-wrap">
                            <span>👉 실제</span>
                            <SpeciesLabel species={selectedCell.actual} size="xs" />
                            <span>였지만 모델은</span>
                            <SpeciesLabel species={selectedCell.predicted} size="xs" />
                            <span>로 잘못 판단(오분류)한 데이터가 {count}개 있습니다.</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 flex-wrap">
                            <span>👉 실제</span>
                            <SpeciesLabel species={selectedCell.actual} size="xs" />
                            <span>를</span>
                            <SpeciesLabel species={selectedCell.predicted} size="xs" />
                            <span>로 잘못 판단한 데이터가 0개로, 두 품종을 서로 헷갈리지 않았습니다.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Overall Misclassification Summary & Most Confused Pair (Section 14) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <span className="font-extrabold text-slate-900 block text-sm flex items-center gap-1.5">
                <HelpCircle size={16} className="text-rose-600" />
                <span>[혼동행렬 핵심 질문] 모델이 가장 많이 헷갈린 두 품종은?</span>
              </span>

              {/* Most Confused Pair Result */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 font-bold space-y-0.5">
                <span className="text-amber-900 block font-extrabold">
                  🔥 [가장 많이 헷갈린 품종 조합]
                </span>
                {mostConfusedPair ? (
                  <div className="text-xs flex items-center gap-1 flex-wrap">
                    <span>이 모델은 실제</span>
                    <SpeciesLabel species={mostConfusedPair.actual} size="xs" />
                    <span>를</span>
                    <SpeciesLabel species={mostConfusedPair.predicted} size="xs" />
                    <span>로 가장 많이 잘못 예측했습니다 (총 <strong className="text-rose-700 font-black">{mostConfusedPair.count}개</strong>).</span>
                  </div>
                ) : (
                  <p className="text-xs text-emerald-800">
                    "이번 테스트에서는 잘못 분류된 데이터가 전혀 없습니다!"
                  </p>
                )}
              </div>
            </div>

            {/* Interactive Reading Quiz */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <span className="font-extrabold text-slate-900 block text-sm flex items-center gap-1.5">
                <HelpCircle size={16} className="text-blue-600" />
                <span>혼동행렬 직접 읽기 퀴즈</span>
              </span>

              <div className="text-slate-700 font-medium flex items-center gap-1 flex-wrap">
                <span>질문: 실제</span>
                <SpeciesLabel species={quizTargetPair.actual} size="xs" />
                <span>를</span>
                <SpeciesLabel species={quizTargetPair.predicted} size="xs" />
                <span>로 잘못 예측한 데이터는 몇 개인가요?</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {quizOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => {
                      setQuizUserAnswer(opt);
                      setHasCheckedMatrix(true);
                    }}
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
                      ✓ <strong>정답입니다!</strong> 행(실제 {SPECIES_MAP[quizTargetPair.actual].korean})과 열(예측 {SPECIES_MAP[quizTargetPair.predicted].korean})이 만나는 위치를 올바르게 읽으셨습니다.
                    </span>
                  ) : (
                    <span>
                      X 다시 혼동행렬 표를 확인해보세요. 실제 줄과 예측 칸이 교차하는 수치는 <strong>{quizCorrectCount}개</strong>입니다.
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
                {/* Misclassified Samples List (Section 16) */}
                <div className="space-y-2">
                  <span className="font-extrabold text-slate-900 block">
                    오분류 레코드 목록 (클릭하여 산점도 상 위치 확인):
                  </span>

                  <div className="space-y-2">
                    {currentEval.misclassifiedSamples.map((sample: any, sIdx: number) => {
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
                              실제: {SPECIES_MAP[sample.actualSpecies as keyof typeof SPECIES_MAP].korean} ➔ 예측: {SPECIES_MAP[sample.predictedSpecies as keyof typeof SPECIES_MAP].korean}
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

                {/* 2D Scatter Plot with Highlighted Misclassified Point */}
                {selectedMisclassifiedId ? (
                  (() => {
                    const targetSample = currentEval.misclassifiedSamples.find((s: any) => s.record.id === selectedMisclassifiedId);
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

                        {/* Accessible Legend Bar */}
                        <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                          <span className="font-extrabold text-slate-700 text-xs shrink-0">품종 범례:</span>
                          {ALL_SPECIES_LIST.map(spKey => (
                            <SpeciesBadge key={spKey} species={spKey} showEnglish size="xs" />
                          ))}
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200 sm:ml-auto">
                            <span>★</span>
                            <span>오분류 레코드 #{targetRec.id}</span>
                          </span>
                        </div>

                        {/* SVG 2D Scatter Plot */}
                        <div className="w-full overflow-x-auto bg-white p-3 rounded-lg border border-slate-200">
                          <svg viewBox="0 0 460 260" className="w-full h-auto min-w-[300px]">
                            <line x1="45" y1="220" x2="440" y2="220" stroke="#cbd5e1" strokeWidth="2" />
                            <line x1="45" y1="20" x2="45" y2="220" stroke="#cbd5e1" strokeWidth="2" />

                            <text x="240" y="250" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#475569">
                              꽃잎 길이 (cm)
                            </text>
                            <text x="15" y="120" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#475569" transform="rotate(-90 15 120)">
                              꽃잎 너비 (cm)
                            </text>

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

                                    return (
                                      <SpeciesMarker
                                        key={r.id}
                                        species={r.species}
                                        cx={cx}
                                        cy={cy}
                                        size={isTarget ? 6.5 : 4}
                                        opacity={isTarget ? 1 : 0.45}
                                        stroke={isTarget ? '#000000' : '#ffffff'}
                                        strokeWidth={isTarget ? 2 : 0.8}
                                      />
                                    );
                                  })}

                                  {(() => {
                                    const tX = mapX(targetRec.petalLength);
                                    const tY = mapY(targetRec.petalWidth);

                                    return (
                                      <g>
                                        {/* Outer Red Dashed Ring for Misclassification Highlight */}
                                        <circle cx={tX} cy={tY} r="14" fill="#e11d48" fillOpacity="0.2" stroke="#e11d48" strokeWidth="2" strokeDasharray="3 3" />
                                        {/* True Species Marker Preserved */}
                                        <SpeciesMarker
                                          species={targetRec.species}
                                          cx={tX}
                                          cy={tY}
                                          size={7}
                                          opacity={1}
                                          stroke="#000000"
                                          strokeWidth={2}
                                        />
                                      </g>
                                    );
                                  })()}
                                </g>
                              );
                            })()}
                          </svg>
                        </div>

                        {/* Observation Question Section 16 */}
                        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-950 font-medium space-y-1.5">
                          <span className="font-extrabold text-amber-900 block flex items-center gap-1.5">
                            <span>🤔 질문: 이 데이터는 왜 두 품종 사이에서 헷갈리기 쉬웠을까요?</span>
                          </span>
                          <div className="flex items-center gap-1 flex-wrap">
                            <span>이 오분류 레코드 #{targetRec.id} (실제</span>
                            <SpeciesBadge species={targetSample.actualSpecies} size="xs" />
                            <span>➔ 모델 예측</span>
                            <SpeciesBadge species={targetSample.predictedSpecies} size="xs" />
                            <span>)는</span>
                            <span className="inline-flex items-center gap-1 font-bold">
                              <SpeciesLabel species="Iris-versicolor" size="xs" />
                              <span>와</span>
                              <SpeciesLabel species="Iris-virginica" size="xs" />
                              <span>데이터점들이 서로 가깝게 분포하는 경계 부근</span>
                            </span>
                            <span>에 위치해 있어, 이러한 밀집 영역에서는 오분류가 발생할 수 있습니다.</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-600 font-medium">
                    👉 위 목록에서 오분류 레코드를 클릭하면 2D 산점도 상 위치와 품종 혼동 원인을 확인할 수 있습니다.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: 조건 변경 재실험 */}
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
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: 실험 비교 & 최종 모델 선택 (Section 18 & 19) */}
      {currentStep === 4 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Trophy size={20} className="text-amber-500" />
              <span>활동 4: 저장된 실험 비교 & 최종 모델 선택 (다각도 관점 비교)</span>
            </h3>

            {experiments.length === 0 ? (
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 font-bold text-center space-y-1">
                <span className="text-base block">저장된 실험 기록이 없습니다!</span>
                <p className="font-normal text-slate-600">이전 3단계에서 [실험 저장하기] 버튼을 눌러 최소 2개 이상의 실험을 기록해주세요.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Section 18 & 19 Model Comparison Cards with Clean Refined Wording */}
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
                              <Trophy size={12} /> 이번 실험 최고 정확도
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

                        {/* Most Confused Pair in Confusion Matrix */}
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

                {/* Section 18: Primary Comparison Criteria Box */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <span className="font-bold text-slate-900 block text-sm">💡 모델 비교 3가지 핵심 기준:</span>
                  <ul className="space-y-1 text-slate-700 font-medium list-disc list-inside">
                    <li><strong>1. 테스트 정확도(%):</strong> 이번 실험 조건에서 전체 중 얼마나 높은 비율로 정답을 맞혔는가?</li>
                    <li><strong>2. 오분류 양상:</strong> 어떤 특정 품종끼리 집중적으로 헷갈리는지 검토.</li>
                    <li><strong>3. 설명하기 쉬운가:</strong> 의사결정트리처럼 판단 이유를 사람이 직관적으로 설명할 수 있는가?</li>
                  </ul>
                  <p className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-200 font-medium">
                    💡 <strong>참고:</strong> k-NN은 2개 특성(꽃잎 길이·너비), 의사결정트리는 4개 특성 전체를 활용하므로, 이번 실험의 정확도 차이만으로 알고리즘의 절대적인 우열을 단정할 수는 없습니다.
                  </p>
                </div>

                {selectedFinalExpId && (
                  <div className="p-4 rounded-xl bg-purple-600 text-white text-xs font-bold space-y-1 animate-fadeIn shadow-xs">
                    <span className="font-extrabold text-sm block">
                      최종 선택된 모델: {experiments.find(e => e.id === selectedFinalExpId)?.id} ({experiments.find(e => e.id === selectedFinalExpId)?.algorithmLabel})
                    </span>
                    <p className="text-purple-100 text-[11px] font-medium">
                      정확도({experiments.find(e => e.id === selectedFinalExpId)?.accuracyPercent}%)와 오분류 양상을 종합적으로 고려하여 이 문제에 더 적절해 보이는 모델로 선택하셨습니다.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 5: 전체 머신러닝 학습 완료 (Section 24 & 25) */}
      {currentStep === 5 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Key Takeaways Card */}
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

          {/* Section 24 Summary Sentence */}
          <div className="p-4 rounded-2xl bg-emerald-600 text-white text-center font-extrabold text-sm shadow-sm max-w-xl mx-auto">
            "정확도와 혼동행렬을 함께 보면 모델의 성능을 더 자세히 이해할 수 있습니다."
          </div>

          {/* Section 25 Ending Page Connection */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2 max-w-xl mx-auto text-xs">
            <span className="font-bold text-slate-900 block text-sm">💡 전체 학습 완료 피드백:</span>
            <p className="text-slate-600 font-medium leading-relaxed">
              "모델의 결과를 평가하고 개선하면서 이 문제에 더 적절한 모델을 스스로 선택할 수 있습니다."
            </p>
          </div>

          <div className="pt-2 text-center space-y-2">
            {isCompleted && (
              <div className="text-xs font-bold text-emerald-700 bg-emerald-100 p-2.5 rounded-xl block mb-2 max-w-xl mx-auto">
                ✓ 이미 전체 8개 영역 학습이 모두 완료되었습니다. 언제든 다시 복습할 수 있습니다.
              </div>
            )}
            {!act5Confirmed && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-center space-y-2 max-w-xl mx-auto">
                <p className="text-xs text-slate-600 font-medium">혼동행렬 핵심 정리 5가지를 확인한 뒤 아래 수료 버튼을 눌러주세요.</p>
                <SecondaryButton size="sm" onClick={() => setAct5Confirmed(true)}>
                  내용 확인 완료
                </SecondaryButton>
              </div>
            )}
            <PrimaryButton
              size="lg"
              fullWidth
              disabled={!act5Confirmed}
              onClick={onComplete}
              icon={<CheckCircle2 size={22} className="max-w-xl mx-auto" />}
            >
              Iris AI Lab 전체 완료 수료하기
            </PrimaryButton>
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
      <div className="space-y-2 pt-3 border-t border-slate-200">
        {!isStepCompleted && currentStep < totalSteps && (
          <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-center font-medium animate-fadeIn">
            {currentStep === 1 && '💡 혼동행렬 셀을 클릭하거나 퀴즈에 응답하면 다음 활동으로 이동할 수 있습니다.'}
            {currentStep === 2 && '💡 오분류 데이터 레코드를 선택해 산점도 상 위치를 확인하면 다음 활동으로 이동할 수 있습니다.'}
            {currentStep === 3 && '💡 새로운 조건으로 모델을 1회 이상 재평가 및 저장하면 다음 활동으로 이동할 수 있습니다.'}
            {currentStep === 4 && '💡 최종 최적 모델 카드를 1개 선택하면 다음 활동으로 이동할 수 있습니다.'}
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          <SecondaryButton
            size="md"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep(s => Math.max(1, s - 1))}
            icon={<ChevronLeft size={16} />}
          >
            이전 활동
          </SecondaryButton>

          {currentStep < totalSteps ? (
            <PrimaryButton
              size="md"
              disabled={!isStepCompleted}
              onClick={() => setCurrentStep(s => Math.min(totalSteps, s + 1))}
              icon={<ChevronRight size={16} />}
              className="flex-row-reverse"
            >
              다음 활동
            </PrimaryButton>
          ) : (
            <span className="text-xs text-emerald-700 font-bold">마지막 활동</span>
          )}
        </div>
      </div>
    </div>
  );
};
