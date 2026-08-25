import React, { useState, useMemo } from 'react';
import { useActivityScrollTop } from '../../hooks/useActivityScrollTop';
import { ActivityProgress } from './ActivityProgress';
import { ChoiceCard } from './ChoiceCard';
import { PromptCard } from './PromptCard';
import { PrimaryButton } from '../common/PrimaryButton';
import { SecondaryButton } from '../common/SecondaryButton';
import { Modal } from '../common/Modal';
import {
  ORIGINAL_IRIS_DATASET,
  ERROR_IRIS_DATASET,
  ERROR_IRIS_ANSWERS,
  SPECIES_MAP,
} from '../../data/irisDataset';
import type { ErrorIrisRecord, ErrorIssueType } from '../../types/iris';
import { cloneDataset } from '../../utils/irisHelpers';
import {
  type FeatureKey,
  NUMERIC_FEATURE_LABELS,
  calculateMean,
  calculateMedian,
  calculateQuartiles,
  calculateBoxPlotStats,
  calculateHistogramBins,
  calculateCorrelationMatrix,
  extractValidNumericValues,
} from '../../utils/statistics';
import {
  Search,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  Layers,
  BookOpen,
  BarChart2,
  TrendingUp,
  Grid,
  Sparkles,
  Info,
} from 'lucide-react';

interface Module04ActivityProps {
  isCompleted: boolean;
  onComplete: () => void;
}

export const Module04Activity: React.FC<Module04ActivityProps> = ({ isCompleted, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 8; // 8 structured learning steps
  const topRef = useActivityScrollTop<HTMLDivElement>(currentStep);

  // Completion criteria trackers (Section 36)
  const [visitedStats, setVisitedStats] = useState(false);
  const [visitedHistogram, setVisitedHistogram] = useState(false);
  const [visitedBoxplot, setVisitedBoxplot] = useState(false);
  const [changedScatterPair, setChangedScatterPair] = useState(false);
  const [visitedHeatmap, setVisitedHeatmap] = useState(false);

  // Activity 1 & 2 State (Data Types & X vs y)
  const [act1Answers, setAct1Answers] = useState<Record<string, 'numeric' | 'categorical' | null>>({
    sepalLength: null,
    sepalWidth: null,
    petalLength: null,
    petalWidth: null,
    species: null,
  });

  const [act2Answers, setAct2Answers] = useState<Record<string, 'X' | 'y' | null>>({
    sepalLength: null,
    sepalWidth: null,
    petalLength: null,
    petalWidth: null,
    species: null,
  });

  // Data Detective Working Dataset & Notebook States
  const [workingDataset] = useState<ErrorIrisRecord[]>(() => cloneDataset(ERROR_IRIS_DATASET));
  const [detectiveSetIndex, setDetectiveSetIndex] = useState(0); // 0 to 3 (4 sets of 5)
  const [userFlagged, setUserFlagged] = useState<Record<number, boolean>>({}); // recordId -> isError
  const [userIssueTypes, setUserIssueTypes] = useState<Record<number, ErrorIssueType>>({}); // recordId -> issueType
  const [checkedSets, setCheckedSets] = useState<Record<number, boolean>>({}); // setIndex -> checked
  const [hintLevel, setHintLevel] = useState<number>(0); // 0 to 3
  const [isNotebookOpen, setIsNotebookOpen] = useState<boolean>(false);
  const [showStatsFeatureModal, setShowStatsFeatureModal] = useState<FeatureKey | null>(null);

  // Treatment choices for Step 3
  const [missingTreatment, setMissingTreatment] = useState<'delete' | 'mean' | 'median' | null>(null);
  const [inconsistentTreated, setInconsistentTreated] = useState(false);
  const [invalidTypeTreated, setInvalidTypeTreated] = useState(false);

  // STEP 4: [이상치를 데이터로 확인해볼까?] State
  const [selectedFeature, setSelectedFeature] = useState<FeatureKey>('sepalLength'); // Initial feature with clear outlier
  const [includeErrorInHist, setIncludeErrorInHist] = useState(true);
  const [showIqrCalculationModal, setShowIqrCalculationModal] = useState(false);
  const [outlierActionChoice, setOutlierActionChoice] = useState<string | null>(null);
  const [outlierQAns, setOutlierQAns] = useState<string | null>(null);

  // STEP 5: [속성끼리는 어떤 관계가 있을까?] State
  const [scatterX, setScatterX] = useState<FeatureKey>('petalLength');
  const [scatterY, setScatterY] = useState<FeatureKey>('petalWidth');

  // STEP 6 & 8 Student Reflection States
  const [act6Choice, setAct6Choice] = useState<'petalLength' | 'sepalWidth' | null>(null);
  const [finalReflectionQ1, setFinalReflectionQ1] = useState<string | null>(null);
  const [finalSelectedFeatures, setFinalSelectedFeatures] = useState<FeatureKey[]>([]);

  // Real 3 Normal Iris Records from ORIGINAL_IRIS_DATASET
  const normalSampleSetosa = ORIGINAL_IRIS_DATASET[0]; // ID 1
  const normalSampleVersicolor = ORIGINAL_IRIS_DATASET[50]; // ID 51
  const normalSampleVirginica = ORIGINAL_IRIS_DATASET[100]; // ID 101

  const speciesList = ['Iris-setosa', 'Iris-versicolor', 'Iris-virginica'] as const;
  const speciesAverages = speciesList.map(sp => {
    const records = ORIGINAL_IRIS_DATASET.filter(r => r.species === sp);
    return {
      speciesKey: sp,
      korean: SPECIES_MAP[sp].korean,
      petalLengthMean: calculateMean(records.map(r => r.petalLength)),
      sepalWidthMean: calculateMean(records.map(r => r.sepalWidth)),
    };
  });

  // Detective Sets (4 sets of 5 records)
  const setSize = 5;
  const currentSetRecords = workingDataset.slice(
    detectiveSetIndex * setSize,
    (detectiveSetIndex + 1) * setSize
  );

  const handleToggleFlagged = (id: number, isError: boolean) => {
    setUserFlagged(prev => ({ ...prev, [id]: isError }));
    setCheckedSets(prev => ({ ...prev, [detectiveSetIndex]: false }));
  };

  const handleSelectIssueType = (id: number, type: ErrorIssueType) => {
    setUserIssueTypes(prev => ({ ...prev, [id]: type }));
  };

  const handleCheckSet = () => {
    setCheckedSets(prev => ({ ...prev, [detectiveSetIndex]: true }));
  };

  // Extract clean numeric arrays for Step 4
  const normalValues = useMemo(() => {
    return extractValidNumericValues(ORIGINAL_IRIS_DATASET, selectedFeature);
  }, [selectedFeature]);

  const errorValues = useMemo(() => {
    return extractValidNumericValues(ERROR_IRIS_DATASET, selectedFeature);
  }, [selectedFeature]);

  // Statistics calculation for Step 4
  const normalStats = useMemo(() => {
    const values = normalValues;
    const count = values.length;
    const mean = calculateMean(values);
    const median = calculateMedian(values);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const { q1, q3, iqr } = calculateQuartiles(values);
    return { count, min, max, mean, median, q1, q3, iqr };
  }, [normalValues]);

  const errorStats = useMemo(() => {
    const values = errorValues;
    const count = values.length;
    const mean = calculateMean(values);
    const median = calculateMedian(values);
    const min = values.length > 0 ? Math.min(...values) : 0;
    const max = values.length > 0 ? Math.max(...values) : 0;
    const { q1, q3, iqr } = calculateQuartiles(values);
    return { count, min, max, mean, median, q1, q3, iqr };
  }, [errorValues]);

  const boxPlotData = useMemo(() => {
    const datasetToUse = includeErrorInHist ? errorValues : normalValues;
    return calculateBoxPlotStats(datasetToUse);
  }, [includeErrorInHist, errorValues, normalValues]);

  const histogramData = useMemo(() => {
    const datasetToUse = includeErrorInHist ? errorValues : normalValues;
    return calculateHistogramBins(datasetToUse, 8);
  }, [includeErrorInHist, errorValues, normalValues]);

  // Correlation Matrix for Step 5
  const correlationData = useMemo(() => {
    return calculateCorrelationMatrix(ORIGINAL_IRIS_DATASET);
  }, []);

  const handleScatterXChange = (key: FeatureKey) => {
    if (key === scatterY) {
      // Swap if same
      setScatterY(scatterX);
    }
    setScatterX(key);
    setChangedScatterPair(true);
  };

  const handleScatterYChange = (key: FeatureKey) => {
    if (key === scatterX) {
      // Swap if same
      setScatterX(scatterY);
    }
    setScatterY(key);
    setChangedScatterPair(true);
  };

  const handleToggleFinalFeature = (feat: FeatureKey) => {
    setFinalSelectedFeatures(prev => {
      if (prev.includes(feat)) {
        return prev.filter(f => f !== feat);
      }
      if (prev.length >= 2) {
        return [prev[1], feat];
      }
      return [...prev, feat];
    });
  };

  const promptText =
    "다음 Iris 붓꽃 데이터 레코드에서 결측치(missing), 이상치(outlier), 표현 불일치(inconsistent)가 발생하는 이유와, [기초 통계량 → 히스토그램 → 박스플롯] 및 [산점도 → 히트맵]을 통해 이를 발견하고 판단하는 절차를 고등학생 수준으로 쉽게 설명해줘.";

  return (
    <div className="space-y-6 scroll-mt-24" ref={topRef}>
      {/* Activity Progress */}
      <ActivityProgress
        currentStep={currentStep}
        totalSteps={totalSteps}
        title={
          currentStep === 1
            ? '1. 수치형 vs 범주형 & X/y 구분'
            : currentStep === 2
            ? '2. 정상 관찰 & 데이터 탐정 오류 찾기'
            : currentStep === 3
            ? '3. 오류 종류 판별 및 전처리 조치'
            : currentStep === 4
            ? '4. 이상치를 데이터로 확인해볼까?'
            : currentStep === 5
            ? '5. 속성끼리는 어떤 관계가 있을까?'
            : currentStep === 6
            ? '6. 핵심 속성 연결 관찰'
            : currentStep === 7
            ? '7. 전처리 전/후 상태 비교'
            : '전체 개념 정리 및 학습 완료'
        }
      />

      {/* STEP 1: 수치형 vs 범주형 & X/y 구분 */}
      {currentStep === 1 && (
        <div className="space-y-5 animate-fadeIn">
          {/* Activity 1: Data Types */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Layers size={20} className="text-emerald-600" />
              <span>활동 1: 이 데이터는 어떤 종류일까? (수치형 vs 범주형)</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Iris 데이터의 각 필드가 크기나 양을 나타내는 <strong>수치형(Numeric)</strong>인지, 종류나 그룹을 나타내는 <strong>범주형(Categorical)</strong>인지 구분해보세요.
            </p>

            <div className="space-y-3 pt-1">
              {[
                { key: 'sepalLength', label: '꽃받침 길이 (5.1 cm)', correct: 'numeric' },
                { key: 'sepalWidth', label: '꽃받침 너비 (3.5 cm)', correct: 'numeric' },
                { key: 'petalLength', label: '꽃잎 길이 (1.4 cm)', correct: 'numeric' },
                { key: 'petalWidth', label: '꽃잎 너비 (0.2 cm)', correct: 'numeric' },
                { key: 'species', label: '붓꽃 품종 (세토사)', correct: 'categorical' },
              ].map(item => (
                <div key={item.key} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-900">{item.label}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAct1Answers(prev => ({ ...prev, [item.key]: 'numeric' }))}
                      className={`px-3 py-1.5 rounded-lg border font-bold transition-all min-h-[44px] cursor-pointer ${
                        act1Answers[item.key] === 'numeric'
                          ? item.correct === 'numeric'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      수치형 (Numeric)
                    </button>
                    <button
                      onClick={() => setAct1Answers(prev => ({ ...prev, [item.key]: 'categorical' }))}
                      className={`px-3 py-1.5 rounded-lg border font-bold transition-all min-h-[44px] cursor-pointer ${
                        act1Answers[item.key] === 'categorical'
                          ? item.correct === 'categorical'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      범주형 (Categorical)
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {Object.values(act1Answers).every(val => val !== null) && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 leading-relaxed space-y-1 animate-fadeIn">
                <span className="font-bold text-emerald-900 block text-sm">✓ 완벽하게 구분하셨습니다!</span>
                <p>
                  - <strong>수치형(Numeric)</strong>: 크기나 양을 숫자로 나타내는 데이터 (꽃받침/꽃잎 길이·너비)<br />
                  - <strong>범주형(Categorical)</strong>: 종류, 등급, 그룹을 나타내는 데이터 (세토사/버시컬러/버지니카 품종)
                </p>
              </div>
            )}
          </div>

          {/* Activity 2: X vs y */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Layers size={20} className="text-blue-600" />
              <span>활동 2: 모델이 보고 판단하는 값(X)과 맞혀야 하는 값(y)</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              붓꽃 품종 분류 문제에서 각 속성이 <strong>입력 데이터 X (Feature)</strong>인지 <strong>목표 데이터 y (Label)</strong>인지 지정하세요.
            </p>

            <div className="space-y-2.5">
              {[
                { key: 'sepalLength', label: '꽃받침 길이', correct: 'X' },
                { key: 'sepalWidth', label: '꽃받침 너비', correct: 'X' },
                { key: 'petalLength', label: '꽃잎 길이', correct: 'X' },
                { key: 'petalWidth', label: '꽃잎 너비', correct: 'X' },
                { key: 'species', label: '붓꽃 품종', correct: 'y' },
              ].map(item => (
                <div key={item.key} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{item.label}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAct2Answers(prev => ({ ...prev, [item.key]: 'X' }))}
                      className={`px-3 py-1.5 rounded-lg border font-bold transition-all min-h-[44px] cursor-pointer ${
                        act2Answers[item.key] === 'X'
                          ? item.correct === 'X'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      입력 X (Feature)
                    </button>
                    <button
                      onClick={() => setAct2Answers(prev => ({ ...prev, [item.key]: 'y' }))}
                      className={`px-3 py-1.5 rounded-lg border font-bold transition-all min-h-[44px] cursor-pointer ${
                        act2Answers[item.key] === 'y'
                          ? item.correct === 'y'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      목표 y (Label)
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {Object.values(act2Answers).every(val => val !== null) && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 leading-relaxed animate-fadeIn">
                <span className="font-bold text-blue-900 block">✓ 핵심 정리</span>
                <strong>X</strong>는 기계학습 모델이 판단 재료로 읽는 4개 입력 속성이며, <strong>y</strong>는 모델이 최종적으로 맞혀야 하는 목표 품종 정답입니다.
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: 정상 데이터 관찰 & 데이터 탐정 오류 찾기 */}
      {currentStep === 2 && (
        <div className="space-y-5 animate-fadeIn">
          {/* Notebook Header Notice */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-xs text-emerald-950 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-sm text-emerald-900 flex items-center gap-2">
                <BookOpen size={18} className="text-emerald-600" />
                <span>[탐정 수첩] 정상 데이터는 어떻게 생겼을까?</span>
              </span>
              <button
                onClick={() => setIsNotebookOpen(true)}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-colors cursor-pointer min-h-[44px] shadow-xs"
              >
                탐정 수첩 펼쳐보기 📖
              </button>
            </div>
            <p className="leading-relaxed">
              "먼저 정상 데이터의 모습을 살펴본 뒤, 다른 점이 있는 오류 데이터를 찾아봅시다."
            </p>

            {/* 3 Real Normal Samples Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {[normalSampleSetosa, normalSampleVersicolor, normalSampleVirginica].map(rec => (
                <div key={rec.id} className="p-3.5 rounded-xl bg-white border border-emerald-200 space-y-1.5 text-xs text-slate-800 shadow-xs">
                  <div className="flex justify-between items-center font-extrabold border-b border-emerald-100 pb-1">
                    <span className="text-emerald-900">ID #{rec.id} ({SPECIES_MAP[rec.species].korean})</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">정상 샘플</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 font-mono text-[11px]">
                    <div>꽃받침 길이: <strong>{rec.sepalLength} cm</strong></div>
                    <div>꽃받침 너비: <strong>{rec.sepalWidth} cm</strong></div>
                    <div>꽃잎 길이: <strong>{rec.petalLength} cm</strong></div>
                    <div>꽃잎 너비: <strong>{rec.petalWidth} cm</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detective Challenge Section */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Search size={20} className="text-emerald-600" />
                <span>데이터 탐정 미션 — 이상한 데이터 판별하기</span>
              </h3>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 self-start sm:self-auto">
                탐정 세트 {detectiveSetIndex + 1} / 4
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              20개의 탐정 레코드 중 <strong>12개 오류 행</strong>과 <strong>8개 정상 행</strong>이 섞여 있습니다. 탐정 수첩을 참고하며 정상/오류 여부를 판별하세요.
            </p>

            {/* Set Selection Bar */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[0, 1, 2, 3].map(idx => (
                <button
                  key={idx}
                  onClick={() => {
                    setDetectiveSetIndex(idx);
                    setHintLevel(0);
                  }}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] cursor-pointer ${
                    detectiveSetIndex === idx
                      ? 'bg-slate-900 text-white shadow-xs'
                      : checkedSets[idx]
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  세트 {idx + 1} (ID #{idx * 5 + 101}-#{idx * 5 + 105})
                </button>
              ))}
            </div>

            {/* Records List in current set */}
            <div className="space-y-3 pt-2">
              {currentSetRecords.map(item => {
                const answer = ERROR_IRIS_ANSWERS.find(a => a.recordId === item.id);
                const hasRealError = !!answer;
                const userChoice = userFlagged[item.id];
                const isChecked = checkedSets[detectiveSetIndex];

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border-2 transition-all space-y-2.5 ${
                      isChecked
                        ? userChoice === hasRealError
                          ? 'border-emerald-500 bg-emerald-50/50'
                          : 'border-rose-300 bg-rose-50/50'
                        : userChoice !== undefined
                        ? 'border-blue-400 bg-blue-50/30'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">레코드 ID #{item.id}</span>
                      {isChecked && (
                        <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                          userChoice === hasRealError
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {userChoice === hasRealError ? '✓ 정답입니다' : 'X 다시 관찰해보세요'}
                        </span>
                      )}
                    </div>

                    {/* Record values */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">꽃받침 길이</span>
                        <span className={`font-bold ${item.sepalLength === null || typeof item.sepalLength !== 'number' ? 'text-rose-600 bg-rose-100 px-1 rounded' : 'text-slate-800'}`}>
                          {item.sepalLength === null ? '값 없음 (null)' : `${item.sepalLength}`}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">꽃받침 너비</span>
                        <span className={`font-bold ${item.sepalWidth === null || typeof item.sepalWidth !== 'number' ? 'text-rose-600 bg-rose-100 px-1 rounded' : 'text-slate-800'}`}>
                          {item.sepalWidth === null ? '값 없음 (null)' : `${item.sepalWidth}`}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">꽃잎 길이</span>
                        <span className={`font-bold ${item.petalLength === null || typeof item.petalLength !== 'number' ? 'text-rose-600 bg-rose-100 px-1 rounded' : 'text-slate-800'}`}>
                          {item.petalLength === null ? '값 없음 (null)' : `${item.petalLength}`}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">꽃잎 너비</span>
                        <span className={`font-bold ${item.petalWidth === null || typeof item.petalWidth !== 'number' ? 'text-rose-600 bg-rose-100 px-1 rounded' : 'text-slate-800'}`}>
                          {item.petalWidth === null ? '값 없음 (null)' : `${item.petalWidth}`}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-slate-500 block">품종</span>
                        <span className="font-bold text-slate-900">{item.species}</span>
                      </div>
                    </div>

                    {/* Flag choice buttons */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleToggleFlagged(item.id, false)}
                        className={`flex-1 p-2 rounded-lg text-xs font-bold transition-all min-h-[44px] cursor-pointer border ${
                          userChoice === false
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        ✓ 정상 데이터다
                      </button>
                      <button
                        onClick={() => handleToggleFlagged(item.id, true)}
                        className={`flex-1 p-2 rounded-lg text-xs font-bold transition-all min-h-[44px] cursor-pointer border ${
                          userChoice === true
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        ⚠️ 문제(오류)가 있다
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Set check controls & Progressive 3-Step Hints */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setHintLevel(h => (h >= 3 ? 1 : h + 1))}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-colors cursor-pointer min-h-[44px]"
              >
                <HelpCircle size={16} />
                <span>단계별 힌트 보기 ({hintLevel > 0 ? `${hintLevel}/3 단계` : '클릭'})</span>
              </button>

              <PrimaryButton size="md" onClick={handleCheckSet} icon={<CheckCircle2 size={18} />}>
                세트 {detectiveSetIndex + 1} 결과 판정하기
              </PrimaryButton>
            </div>

            {/* Hint Box Content */}
            {hintLevel > 0 && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-2 animate-fadeIn">
                <span className="font-extrabold text-amber-900 block flex items-center gap-1.5">
                  <HelpCircle size={16} />
                  <span>탐정 힌트 {hintLevel}단계:</span>
                </span>

                {hintLevel === 1 && (
                  <p className="leading-relaxed">
                    💡 <strong>1단계 힌트:</strong> "같은 열(속성)에 있는 다른 데이터의 값과 비교해보세요."
                  </p>
                )}

                {hintLevel === 2 && (
                  <p className="leading-relaxed">
                    💡 <strong>2단계 힌트:</strong> "값이 비어 있지는 않은가요? 숫자에 문자가 붙어 있지는 않은가요? 같은 품종 이름이 다른 방식으로 쓰이지 않았는지 확인해보세요."
                  </p>
                )}

                {hintLevel === 3 && (
                  <div className="space-y-2">
                    <p className="leading-relaxed">
                      💡 <strong>3단계 힌트:</strong> "탐정 수첩의 정상 데이터와 직접 수치를 비교해보세요."
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        onClick={() => setIsNotebookOpen(true)}
                        className="px-3 py-1.5 bg-amber-600 text-white rounded-lg font-bold text-xs hover:bg-amber-700 cursor-pointer min-h-[44px]"
                      >
                        탐정 수첩 펼쳐보기 📖
                      </button>
                      <button
                        onClick={() => setShowStatsFeatureModal('sepalLength')}
                        className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-slate-800 cursor-pointer min-h-[44px]"
                      >
                        꽃받침 길이 정상 수치 범위 통계 확인 📊
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Feature Statistics Modal Triggered */}
            {showStatsFeatureModal && (
              <div className="p-3 bg-slate-900 text-white rounded-xl text-xs space-y-1 font-mono animate-fadeIn">
                <div className="flex justify-between items-center font-bold text-amber-300">
                  <span>ORIGINAL_IRIS_DATASET 꽃받침 길이(sepalLength) 정상 통계 분포</span>
                  <button onClick={() => setShowStatsFeatureModal(null)} className="text-slate-400 hover:text-white">닫기 ✕</button>
                </div>
                {(() => {
                  const s = normalStats;
                  return (
                    <div className="grid grid-cols-4 gap-2 text-center text-[11px] pt-1">
                      <div className="p-1.5 bg-slate-800 rounded">최솟값: {s.min}cm</div>
                      <div className="p-1.5 bg-slate-800 rounded">중앙값: {s.median}cm</div>
                      <div className="p-1.5 bg-slate-800 rounded">평균값: {s.mean}cm</div>
                      <div className="p-1.5 bg-slate-800 rounded">최댓값: {s.max}cm</div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: 오류 종류 판별 및 전처리 조치 */}
      {currentStep === 3 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">
                활동 3: 오류 종류 판별하기 (오류 정답 판정)
              </h3>
              <button
                onClick={() => setIsNotebookOpen(true)}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer min-h-[44px]"
              >
                탐정 수첩 📖
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              발견된 12개 오류 데이터의 세부 문제 유형(결측치, 이상치, 표현 불일치, 데이터형 오류)을 판별하세요.
            </p>

            {/* Error Type Hint Notice */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-800 block">💡 오류 유형별 판별 가이드:</span>
              <ul className="text-[11px] text-slate-600 space-y-0.5 list-disc list-inside font-medium">
                <li><strong>결측치:</strong> 필요한 수치나 품종 값이 비어 있는 곳(null)을 찾아보세요.</li>
                <li><strong>이상치:</strong> 같은 속성의 다른 정상 값들과 비교했을 때 유난히 크거나 작게 튀는 값을 찾아보세요.</li>
                <li><strong>표현 불일치:</strong> 같은 의미인데 대소문자나 쓰는 방식이 서로 다른 품종명 문자를 찾아보세요.</li>
                <li><strong>데이터형 오류:</strong> 숫자여야 하는 값에 'cm' 글자나 단위가 함께 들어가 문자로 인식되는 곳을 찾아보세요.</li>
              </ul>
            </div>

            <div className="space-y-3">
              {ERROR_IRIS_ANSWERS.map(ans => {
                const rec = workingDataset.find(r => r.id === ans.recordId);
                const userType = userIssueTypes[ans.recordId];
                const isCorrectType = userType === ans.issueType;

                return (
                  <div key={ans.recordId} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">레코드 ID #{ans.recordId}</span>
                      {userType && (
                        <span className={`font-extrabold px-2.5 py-0.5 rounded-full ${
                          isCorrectType
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {isCorrectType ? '✓ 판정 성공' : 'X 다시 분류해보세요'}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 font-mono">
                      값: {rec ? JSON.stringify(rec) : ''}
                    </div>

                    {/* Issue type selector buttons */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { type: 'missing', label: '결측치 (Missing)' },
                        { type: 'outlier', label: '이상치 (Outlier)' },
                        { type: 'inconsistent', label: '표현 불일치' },
                        { type: 'invalidType', label: '데이터형 오류' },
                      ].map(t => (
                        <button
                          key={t.type}
                          onClick={() => handleSelectIssueType(ans.recordId, t.type as ErrorIssueType)}
                          className={`p-2 rounded-lg text-xs font-bold transition-all min-h-[44px] cursor-pointer border ${
                            userType === t.type
                              ? isCorrectType
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-rose-600 text-white border-rose-600'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {/* Highlighted explanation upon correct type match */}
                    {isCorrectType && (
                      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 leading-relaxed animate-fadeIn">
                        <span className="font-bold text-emerald-900 block mb-0.5">💡 오류 분석: {ans.description}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Treatment Options Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900">전처리 전략 선택</h3>

            {/* Missing Value Treatment */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <span className="font-extrabold text-slate-900 block text-sm">
                1. 결측치(비어 있는 값) 처리 방법 선택
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <ChoiceCard
                  optionKey="1"
                  label="해당 행 전체 삭제"
                  isSelected={missingTreatment === 'delete'}
                  status="default"
                  onClick={() => setMissingTreatment('delete')}
                />
                <ChoiceCard
                  optionKey="2"
                  label="평균값(Mean)으로 채우기 (추천)"
                  isSelected={missingTreatment === 'mean'}
                  status="correct"
                  onClick={() => setMissingTreatment('mean')}
                />
                <ChoiceCard
                  optionKey="3"
                  label="중앙값(Median)으로 채우기"
                  isSelected={missingTreatment === 'median'}
                  status="default"
                  onClick={() => setMissingTreatment('median')}
                />
              </div>

              {missingTreatment === 'mean' && (
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-950 animate-fadeIn">
                  ✓ <strong>평균치 대체 선택:</strong> 꽃받침 길이 결측치에 대표 평균값(5.84 cm)을 대입하여 데이터 손실 없이 완결성을 확보했습니다.
                </div>
              )}
            </div>

            {/* Inconsistent & InvalidType Auto-clean Actions */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <span className="font-extrabold text-slate-900 block text-sm">
                2. 표현 불일치 & 데이터형 오류 정제 실행
              </span>
              <div className="flex flex-col sm:flex-row gap-2">
                <SecondaryButton
                  size="md"
                  onClick={() => setInconsistentTreated(true)}
                  icon={<CheckCircle2 size={16} />}
                >
                  {inconsistentTreated ? '✓ 표현 불일치 표기 통일 완료' : '표현 불일치 ("versicolor" ➔ "Iris-versicolor") 통일하기'}
                </SecondaryButton>

                <SecondaryButton
                  size="md"
                  onClick={() => setInvalidTypeTreated(true)}
                  icon={<CheckCircle2 size={16} />}
                >
                  {invalidTypeTreated ? '✓ 데이터형 단위문자 제거 완료' : '데이터형 오류 ("5.1cm" ➔ 5.1 숫자) 변환하기'}
                </SecondaryButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: [이상치를 데이터로 확인해볼까?] */}
      {currentStep === 4 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Activity Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-5 rounded-2xl shadow-xs space-y-2">
            <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-md inline-block">
              새 활동 [이상치를 데이터로 확인해볼까?]
            </span>
            <h3 className="text-xl font-black">
              [기초 통계량 → 히스토그램 → 박스플롯]으로 이상치 검증하기
            </h3>
            <p className="text-xs text-amber-100 leading-relaxed">
              눈대중으로 대충 이상치를 지우는 대신, 실제 데이터의 기초 통계량과 분포 그래프를 계산하여 정밀하게 판별합니다.
            </p>
          </div>

          {/* Section 4: Feature Selection Control */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <BarChart2 size={18} className="text-amber-600" />
                <span>관찰할 수치형 속성을 선택하세요:</span>
              </span>

              {/* Feature selector buttons / dropdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full sm:w-auto">
                {(['sepalLength', 'sepalWidth', 'petalLength', 'petalWidth'] as FeatureKey[]).map(feat => (
                  <button
                    key={feat}
                    onClick={() => {
                      setSelectedFeature(feat);
                      setVisitedStats(true);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] cursor-pointer border ${
                      selectedFeature === feat
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {NUMERIC_FEATURE_LABELS[feat].full}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 1. Basic Statistics Comparison (Section 5 & 6) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>1. 기초 통계량 (Basic Statistics) 비교</span>
                <span className="text-xs font-normal text-slate-500">[{NUMERIC_FEATURE_LABELS[selectedFeature].full}]</span>
              </h4>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              정상 원본 데이터(150개)와 오류(이상치 50.0cm/30.0cm 등)가 포함된 데이터의 통계 수치를 비교해보세요.
            </p>

            {/* Comparison Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">통계 항목</th>
                    <th className="p-3 text-emerald-800 bg-emerald-50/50">정상 데이터 (150개)</th>
                    <th className="p-3 text-amber-900 bg-amber-50/50">오류 포함 데이터 (유효수치)</th>
                    <th className="p-3 text-slate-600">변화 / 영향</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                  <tr>
                    <td className="p-3 font-sans font-bold text-slate-900">데이터 개수 (Count)</td>
                    <td className="p-3 font-bold text-emerald-700 bg-emerald-50/20">{normalStats.count}개</td>
                    <td className="p-3 font-bold text-amber-800 bg-amber-50/20">{errorStats.count}개</td>
                    <td className="p-3 text-slate-500 font-sans">유효 숫자만 포함</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans font-bold text-slate-900">최솟값 (Min)</td>
                    <td className="p-3 text-emerald-700 bg-emerald-50/20">{normalStats.min} cm</td>
                    <td className="p-3 text-amber-800 bg-amber-50/20">{errorStats.min} cm</td>
                    <td className="p-3 text-slate-500 font-sans">-</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans font-bold text-slate-900">최댓값 (Max)</td>
                    <td className="p-3 text-emerald-700 bg-emerald-50/20">{normalStats.max} cm</td>
                    <td className="p-3 font-extrabold text-rose-600 bg-amber-50/20">{errorStats.max} cm</td>
                    <td className="p-3 font-bold text-rose-600 font-sans">
                      {errorStats.max > normalStats.max * 2 ? '⚠️ 극단치 존재' : '정상 범위'}
                    </td>
                  </tr>
                  <tr className="bg-amber-50/30">
                    <td className="p-3 font-sans font-bold text-slate-900">평균 (Mean)</td>
                    <td className="p-3 text-emerald-700 font-bold">{normalStats.mean} cm</td>
                    <td className="p-3 text-rose-700 font-extrabold">{errorStats.mean} cm</td>
                    <td className="p-3 font-bold text-rose-600 font-sans">
                      차이: {Math.abs(Math.round((errorStats.mean - normalStats.mean) * 100) / 100)} cm (민감함)
                    </td>
                  </tr>
                  <tr className="bg-blue-50/30">
                    <td className="p-3 font-sans font-bold text-slate-900">중앙값 (Median)</td>
                    <td className="p-3 text-emerald-700 font-bold">{normalStats.median} cm</td>
                    <td className="p-3 text-blue-700 font-extrabold">{errorStats.median} cm</td>
                    <td className="p-3 font-bold text-blue-700 font-sans">
                      차이: {Math.abs(Math.round((errorStats.median - normalStats.median) * 100) / 100)} cm (안정적)
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans font-bold text-slate-900">제1사분위수 (Q1)</td>
                    <td className="p-3 text-emerald-700">{normalStats.q1} cm</td>
                    <td className="p-3 text-amber-800">{errorStats.q1} cm</td>
                    <td className="p-3 text-slate-500 font-sans">하위 25% 위치</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans font-bold text-slate-900">제3사분위수 (Q3)</td>
                    <td className="p-3 text-emerald-700">{normalStats.q3} cm</td>
                    <td className="p-3 text-amber-800">{errorStats.q3} cm</td>
                    <td className="p-3 text-slate-500 font-sans">하위 75% 위치</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans font-bold text-slate-900">사분위 범위 (IQR)</td>
                    <td className="p-3 text-emerald-700 font-bold">{normalStats.iqr} cm</td>
                    <td className="p-3 text-amber-800 font-bold">{errorStats.iqr} cm</td>
                    <td className="p-3 text-slate-500 font-sans">Q3 - Q1 (중앙 50% 범위)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mean vs Median Insight Card (Section 6) */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2">
              <span className="font-extrabold text-amber-900 block text-sm flex items-center gap-1.5">
                <Sparkles size={16} />
                <span>생각하기 — 평균과 중앙값의 차이 관찰</span>
              </span>
              <p className="leading-relaxed">
                "이상치가 포함되자 <strong>평균(Mean)</strong>은 원래값({normalStats.mean}cm)에서 <strong>{errorStats.mean}cm</strong>로 크게 끌려갔지만, <strong>중앙값(Median)</strong>은 원래값({normalStats.median}cm)에서 <strong>{errorStats.median}cm</strong>로 상대적으로 훨씬 적게 영향을 받았습니다."
              </p>
              <p className="text-[11px] text-amber-900/80 font-medium">
                💡 아주 크거나 작은 이상치가 포함될 때, 평균은 민감하게 반응하지만 중앙값은 서열 기준이므로 강건(Robust)하게 유지됩니다.
              </p>
            </div>
          </div>

          {/* 2. Histogram Activity (Section 7 & 8) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>2. 히스토그램 (Histogram) 분포 보기</span>
              </h4>

              {/* Data Toggle Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIncludeErrorInHist(false);
                    setVisitedHistogram(true);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all min-h-[44px] cursor-pointer ${
                    !includeErrorInHist
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  [정상 데이터]
                </button>
                <button
                  onClick={() => {
                    setIncludeErrorInHist(true);
                    setVisitedHistogram(true);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all min-h-[44px] cursor-pointer ${
                    includeErrorInHist
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  [오류 데이터 포함]
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              버튼을 전환하며 <strong>{NUMERIC_FEATURE_LABELS[selectedFeature].full}</strong> 데이터의 분포 형태가 어떻게 바뀌는지 관찰하세요.
            </p>

            {/* SVG Histogram Component */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-full overflow-x-auto">
                <svg viewBox="0 0 500 240" className="w-full h-auto min-w-[320px]">
                  {/* Axis lines */}
                  <line x1="50" y1="190" x2="470" y2="190" stroke="#94a3b8" strokeWidth="2" />
                  <line x1="50" y1="20" x2="50" y2="190" stroke="#94a3b8" strokeWidth="2" />

                  {/* Y-axis Label */}
                  <text x="15" y="105" fontSize="11" fill="#475569" fontWeight="bold">개수</text>

                  {/* X-axis Label */}
                  <text x="230" y="225" fontSize="11" fill="#475569" fontWeight="bold">
                    {NUMERIC_FEATURE_LABELS[selectedFeature].full} (cm)
                  </text>

                  {/* Histogram Bars */}
                  {(() => {
                    const maxCount = Math.max(...histogramData.map(b => b.count), 1);
                    const barAreaWidth = 400;
                    const barWidth = Math.max(10, (barAreaWidth / histogramData.length) - 6);

                    return histogramData.map((bin, idx) => {
                      const barHeight = (bin.count / maxCount) * 140;
                      const xPos = 55 + idx * (barAreaWidth / histogramData.length);
                      const yPos = 190 - barHeight;

                      const isOutlierBin = bin.binStart > 20 || bin.binEnd > 20;

                      return (
                        <g key={idx} className="group cursor-pointer">
                          {/* Bar */}
                          <rect
                            x={xPos}
                            y={yPos}
                            width={barWidth}
                            height={Math.max(2, barHeight)}
                            fill={isOutlierBin ? '#e11d48' : includeErrorInHist ? '#f59e0b' : '#10b981'}
                            rx="3"
                            className="transition-all hover:opacity-80"
                          />
                          {/* Bar Value Text */}
                          <text
                            x={xPos + barWidth / 2}
                            y={Math.max(15, yPos - 5)}
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight="bold"
                            fill={isOutlierBin ? '#e11d48' : '#334155'}
                          >
                            {bin.count > 0 ? `${bin.count}개` : ''}
                          </text>

                          {/* X tick label */}
                          <text
                            x={xPos + barWidth / 2}
                            y="205"
                            textAnchor="middle"
                            fontSize="9"
                            fill="#64748b"
                          >
                            {bin.binStart}
                          </text>
                        </g>
                      );
                    });
                  })()}
                </svg>
              </div>
            </div>

            {/* Histogram Question (Section 8) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <span className="font-extrabold text-slate-900 block text-sm flex items-center gap-1.5">
                <HelpCircle size={16} className="text-amber-600" />
                <span>[히스토그램 생각하기]</span>
              </span>
              <p className="text-slate-700 leading-relaxed font-medium">
                1. 대부분의 데이터는 어느 범위에 모여 있나요?<br />
                2. 오류 데이터를 포함했을 때 오른쪽 멀리 떨어진 50.0cm/30.0cm 이상치가 눈에 잘 띄나요?
              </p>
              <div className="pt-1">
                <button
                  onClick={() => setOutlierQAns('graph')}
                  className={`w-full text-left p-3 rounded-lg border text-xs font-bold cursor-pointer transition-all min-h-[44px] ${
                    outlierQAns === 'graph'
                      ? 'bg-amber-100 border-amber-400 text-amber-950'
                      : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  💡 "표의 긴 숫자 행렬을 일일이 읽을 때보다, 히스토그램 그래프로 볼 때 뚝 떨어진 이상치를 훨씬 쉽게 발견할 수 있습니다!"
                </button>
              </div>
            </div>
          </div>

          {/* 3. Box Plot Activity (Section 9, 10, 11, 12, 13) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>3. 박스플롯 (Box Plot)과 사분위수(IQR)</span>
              </h4>

              {/* How to calculate button (Section 10) */}
              <button
                onClick={() => {
                  setShowIqrCalculationModal(true);
                  setVisitedBoxplot(true);
                }}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-colors cursor-pointer min-h-[44px] flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Info size={16} />
                <span>[어떻게 계산하나요?] 수칙 보기</span>
              </button>
            </div>

            {/* Basic Explanation (Section 10) */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
              <p className="font-bold text-slate-900">📦 박스플롯 기초 읽기:</p>
              <p className="leading-relaxed">
                - <strong>상자(Box)</strong>에는 전체 데이터의 가운데 50%가 들어 있습니다 (Q1 ~ Q3).<br />
                - 상자 밖의 수염(Whisker)에서 멀리 떨어진 점은 <strong>이상치 후보(Outlier Candidate)</strong>로 판별할 수 있습니다.
              </p>
            </div>

            {/* SVG Horizontal Box Plot Component (Section 11) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">
                [{NUMERIC_FEATURE_LABELS[selectedFeature].full}] 가로형 박스플롯
              </span>

              <div className="w-full overflow-x-auto">
                <svg viewBox="0 0 500 160" className="w-full h-auto min-w-[320px]">
                  {(() => {
                    const stats = boxPlotData;
                    const dataMin = Math.min(stats.min, stats.lowerFence);
                    const dataMax = Math.max(stats.max, stats.upperFence);
                    const paddingX = 50;
                    const plotWidth = 400;

                    const getX = (val: number) => {
                      if (dataMax === dataMin) return paddingX + plotWidth / 2;
                      return paddingX + ((val - dataMin) / (dataMax - dataMin)) * plotWidth;
                    };

                    const xMinWhisker = getX(stats.lowerWhisker);
                    const xQ1 = getX(stats.q1);
                    const xMedian = getX(stats.median);
                    const xQ3 = getX(stats.q3);
                    const xMaxWhisker = getX(stats.upperWhisker);

                    const boxY = 40;
                    const boxHeight = 50;
                    const midY = boxY + boxHeight / 2;

                    return (
                      <g>
                        {/* Axis Line */}
                        <line x1={paddingX} y1={130} x2={paddingX + plotWidth} y2={130} stroke="#cbd5e1" strokeWidth="2" />

                        {/* Lower Fence & Upper Fence Lines (dotted) */}
                        <line x1={getX(stats.lowerFence)} y1={20} x2={getX(stats.lowerFence)} y2={120} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 4" />
                        <line x1={getX(stats.upperFence)} y1={20} x2={getX(stats.upperFence)} y2={120} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 4" />

                        {/* Left Whisker Line */}
                        <line x1={xMinWhisker} y1={midY} x2={xQ1} y2={midY} stroke="#475569" strokeWidth="2" />
                        {/* Left Whisker End Cap */}
                        <line x1={xMinWhisker} y1={midY - 15} x2={xMinWhisker} y2={midY + 15} stroke="#475569" strokeWidth="2" />

                        {/* Right Whisker Line */}
                        <line x1={xQ3} y1={midY} x2={xMaxWhisker} y2={midY} stroke="#475569" strokeWidth="2" />
                        {/* Right Whisker End Cap */}
                        <line x1={xMaxWhisker} y1={midY - 15} x2={xMaxWhisker} y2={midY + 15} stroke="#475569" strokeWidth="2" />

                        {/* Box (Q1 to Q3) */}
                        <rect
                          x={xQ1}
                          y={boxY}
                          width={Math.max(4, xQ3 - xQ1)}
                          height={boxHeight}
                          fill="#3b82f6"
                          fillOpacity="0.25"
                          stroke="#2563eb"
                          strokeWidth="2.5"
                          rx="4"
                        />

                        {/* Median Line */}
                        <line x1={xMedian} y1={boxY} x2={xMedian} y2={boxY + boxHeight} stroke="#1d4ed8" strokeWidth="3" />

                        {/* Outlier Dots */}
                        {stats.outliers.map((outlierVal, i) => (
                          <g key={i}>
                            <circle
                              cx={getX(outlierVal)}
                              cy={midY}
                              r="6"
                              fill="#e11d48"
                              stroke="#ffffff"
                              strokeWidth="2"
                            />
                            <text
                              x={getX(outlierVal)}
                              y={midY - 12}
                              textAnchor="middle"
                              fontSize="10"
                              fontWeight="black"
                              fill="#e11d48"
                            >
                              {outlierVal}cm
                            </text>
                          </g>
                        ))}

                        {/* Tick Labels */}
                        <text x={xQ1} y={boxY + boxHeight + 15} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#3b82f6">Q1 ({stats.q1})</text>
                        <text x={xMedian} y={boxY - 8} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1d4ed8">중앙값 ({stats.median})</text>
                        <text x={xQ3} y={boxY + boxHeight + 15} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#3b82f6">Q3 ({stats.q3})</text>
                      </g>
                    );
                  })()}
                </svg>
              </div>

              {/* Exact Statistical Values Text (Section 11) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono pt-2">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-sans">Q1 (25%)</span>
                  <span className="font-bold text-slate-900">{boxPlotData.q1} cm</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-sans">중앙값 (Median)</span>
                  <span className="font-bold text-blue-700">{boxPlotData.median} cm</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-sans">Q3 (75%)</span>
                  <span className="font-bold text-slate-900">{boxPlotData.q3} cm</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-sans">IQR (Q3-Q1)</span>
                  <span className="font-bold text-slate-900">{boxPlotData.iqr} cm</span>
                </div>
                <div className="p-2 bg-rose-50 rounded-lg border border-rose-200 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-rose-700 block font-sans">이상치 후보</span>
                  <span className="font-bold text-rose-700">
                    {boxPlotData.outliers.length > 0 ? `${boxPlotData.outliers.join(', ')} cm` : '없음'}
                  </span>
                </div>
              </div>
            </div>

            {/* Crucial Educational Notice (Section 12) */}
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-2">
              <span className="font-extrabold text-rose-900 block text-sm flex items-center gap-1.5">
                <Info size={16} />
                <span>⚠️ 매우 중요: 이상치와 오류를 구분하기</span>
              </span>
              <p className="leading-relaxed">
                "박스플롯에서 이상치 후보로 잡혔다고 해서 자동으로 무조건 삭제하거나 오류라고 단정해서는 안 됩니다."
              </p>
              <p className="leading-relaxed font-bold bg-white p-2.5 rounded-lg border border-rose-200">
                "이상치는 다른 데이터와 크게 다른 값입니다. 하지만 자연계에 실제로 존재하는 드문 값일 수도 있습니다. 따라서 이상치를 발견하면 먼저 오타(입력 오류)나 측정 오류인지 확인해야 합니다."
              </p>
            </div>

            {/* Outlier Action Decision Activity (Section 13) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <span className="font-extrabold text-slate-900 block text-sm">
                활동 질문: 이상치를 발견했을 때 어떤 처리가 적절할까요?
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { key: 'keep', label: '그대로 사용한다 (실제 정상 수치인 경우)' },
                  { key: 'verify', label: '원본과 비교하여 실제 값인지 확인한다 (추천)' },
                  { key: 'fix', label: '입력 오류(오타)를 수정한다 (e.g. 50cm ➔ 5.1cm)' },
                  { key: 'remove', label: '측정 파손 데이터인 경우 필요하면 제외한다' },
                ].map(opt => (
                  <ChoiceCard
                    key={opt.key}
                    optionKey={opt.key}
                    label={opt.label}
                    isSelected={outlierActionChoice === opt.key}
                    status={outlierActionChoice === opt.key ? 'correct' : 'default'}
                    onClick={() => setOutlierActionChoice(opt.key)}
                  />
                ))}
              </div>

              {outlierActionChoice && (
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-950 animate-fadeIn">
                  ✓ <strong>올바른 판단입니다!</strong> ERROR_IRIS_DATASET의 50.0cm 및 30.0cm는 원본 레코드(5.1cm, 3.0cm)와 비교했을 때 소수점이 빠진 명백한 <strong>입력 오류</strong>입니다. 원본 확인 후 정상 수치로 수정하는 것이 가장 적절합니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: [속성끼리는 어떤 관계가 있을까?] */}
      {currentStep === 5 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Activity Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 rounded-2xl shadow-xs space-y-2">
            <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-md inline-block">
              새 활동 [속성끼리는 어떤 관계가 있을까?]
            </span>
            <h3 className="text-xl font-black">
              [산점도 → 히트맵]으로 두 속성 및 전체 속성 간 관계 확인하기
            </h3>
            <p className="text-xs text-blue-100 leading-relaxed">
              하나의 속성만 보는 것에서 벗어나, 두 속성 간의 양의 관계와 전체 4x4 상관계수 행렬을 관찰합니다.
            </p>
          </div>

          {/* 1. Scatter Plot Activity (Section 15, 16, 17, 18) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-600" />
                <span>1. 산점도 (Scatter Plot) — 두 속성 관계 관찰</span>
              </h4>

              {/* Axis Selector Controls */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 font-bold">X축:</span>
                  <select
                    value={scatterX}
                    onChange={e => handleScatterXChange(e.target.value as FeatureKey)}
                    className="p-2 rounded-lg border border-slate-300 font-bold bg-white text-slate-900 min-h-[44px] cursor-pointer"
                  >
                    {(['sepalLength', 'sepalWidth', 'petalLength', 'petalWidth'] as FeatureKey[]).map(f => (
                      <option key={f} value={f}>{NUMERIC_FEATURE_LABELS[f].full}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-slate-500 font-bold">Y축:</span>
                  <select
                    value={scatterY}
                    onChange={e => handleScatterYChange(e.target.value as FeatureKey)}
                    className="p-2 rounded-lg border border-slate-300 font-bold bg-white text-slate-900 min-h-[44px] cursor-pointer"
                  >
                    {(['sepalLength', 'sepalWidth', 'petalLength', 'petalWidth'] as FeatureKey[]).map(f => (
                      <option key={f} value={f}>{NUMERIC_FEATURE_LABELS[f].full}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SVG Scatter Plot (Section 16 - Color + Shape accessible dots) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200 mb-2">
                <span className="font-bold text-slate-800">
                  ORIGINAL_IRIS_DATASET (150개 레코드 산점도)
                </span>
                {/* Legend */}
                <div className="flex items-center gap-3 font-bold text-[11px]">
                  <span className="flex items-center gap-1 text-emerald-700">
                    <svg width="12" height="12"><circle cx="6" cy="6" r="5" fill="#10b981" /></svg>
                    세토사 (원)
                  </span>
                  <span className="flex items-center gap-1 text-blue-700">
                    <svg width="12" height="12"><rect x="1" y="1" width="10" height="10" fill="#3b82f6" rx="1" /></svg>
                    버시컬러 (네모)
                  </span>
                  <span className="flex items-center gap-1 text-purple-700">
                    <svg width="12" height="12"><polygon points="6,1 11,10 1,10" fill="#8b5cf6" /></svg>
                    버지니카 (세모)
                  </span>
                </div>
              </div>

              <div className="w-full overflow-x-auto">
                <svg viewBox="0 0 480 320" className="w-full h-auto min-w-[320px]">
                  {/* Axis lines */}
                  <line x1="50" y1="270" x2="450" y2="270" stroke="#94a3b8" strokeWidth="2" />
                  <line x1="50" y1="30" x2="50" y2="270" stroke="#94a3b8" strokeWidth="2" />

                  {/* X Axis Label */}
                  <text x="240" y="305" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#334155">
                    X: {NUMERIC_FEATURE_LABELS[scatterX].full} (cm)
                  </text>

                  {/* Y Axis Label */}
                  <text x="20" y="150" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#334155" transform="rotate(-90 20 150)">
                    Y: {NUMERIC_FEATURE_LABELS[scatterY].full} (cm)
                  </text>

                  {/* Scatter Dots */}
                  {(() => {
                    const xVals = ORIGINAL_IRIS_DATASET.map(r => r[scatterX]);
                    const yVals = ORIGINAL_IRIS_DATASET.map(r => r[scatterY]);

                    const minX = Math.min(...xVals);
                    const maxX = Math.max(...xVals);
                    const minY = Math.min(...yVals);
                    const maxY = Math.max(...yVals);

                    const mapSvgX = (v: number) => 60 + ((v - minX) / (maxX - minX || 1)) * 370;
                    const mapSvgY = (v: number) => 260 - ((v - minY) / (maxY - minY || 1)) * 210;

                    return ORIGINAL_IRIS_DATASET.map(r => {
                      const cx = mapSvgX(r[scatterX]);
                      const cy = mapSvgY(r[scatterY]);

                      if (r.species === 'Iris-setosa') {
                        return <circle key={r.id} cx={cx} cy={cy} r="4.5" fill="#10b981" opacity="0.85" />;
                      } else if (r.species === 'Iris-versicolor') {
                        return <rect key={r.id} x={cx - 4} y={cy - 4} width="8" height="8" fill="#3b82f6" opacity="0.85" rx="1" />;
                      } else {
                        const p1 = `${cx},${cy - 5}`;
                        const p2 = `${cx + 5},${cy + 4}`;
                        const p3 = `${cx - 5},${cy + 4}`;
                        return <polygon key={r.id} points={`${p1} ${p2} ${p3}`} fill="#8b5cf6" opacity="0.85" />;
                      }
                    });
                  })()}
                </svg>
              </div>
            </div>

            {/* Scatter Observation Questions (Section 17 & 18) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <span className="font-extrabold text-slate-900 block text-sm flex items-center gap-1.5">
                <HelpCircle size={16} className="text-blue-600" />
                <span>[산점도 관찰하기]</span>
              </span>
              <p className="text-slate-700 leading-relaxed font-medium">
                1. <strong>꽃잎 길이</strong>와 <strong>꽃잎 너비</strong>를 선택했을 때 두 값이 함께 커지는 우상향 경향(양의 관계)이 뚜렷한가요?<br />
                2. 세 품종(세토사, 버시컬러, 버지니카)의 점들이 얼마나 깔끔하게 구별되어 나누어지나요?
              </p>

              {/* Correlation vs Causation Notice (Section 18) */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-950 space-y-1 mt-2">
                <span className="font-bold block">💡 상관관계 ≠ 인과관계 오해 방지 안내:</span>
                <p className="text-[11px] leading-relaxed">
                  "두 수치형 속성이 함께 변하는 정도를 <strong>상관관계</strong>라고 합니다. 한 값이 커질 때 다른 값도 커지는 경향이 있더라도, 한 속성이 다른 속성의 직접 원인이라는 뜻(인과관계)은 아닙니다."
                </p>
              </div>
            </div>
          </div>

          {/* 2. Heatmap Activity (Section 19, 20, 21, 22) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Grid size={18} className="text-indigo-600" />
                <span>2. 상관관계 히트맵 (Correlation Heatmap)</span>
              </h4>
              <button
                onClick={() => setVisitedHeatmap(true)}
                className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-bold text-xs"
              >
                4×4 Pearson 상관계수
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              4개 수치형 속성 간의 Pearson 상관계수(-1 ~ +1)를 한눈에 비교해보세요.
            </p>

            {/* 4x4 Heatmap Matrix Grid (Mobile 375px compact layout) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="grid grid-cols-5 gap-1 text-center font-bold text-[10px] sm:text-xs">
                {/* Empty top-left cell */}
                <div className="p-2 bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center">
                  속성
                </div>

                {/* Column Headers */}
                {correlationData.features.map(f => (
                  <div key={f} className="p-2 bg-slate-200 text-slate-800 rounded-lg flex items-center justify-center font-bold">
                    {NUMERIC_FEATURE_LABELS[f].short}
                  </div>
                ))}

                {/* Matrix Rows */}
                {correlationData.features.map((rowF, i) => (
                  <React.Fragment key={rowF}>
                    {/* Row Header */}
                    <div className="p-2 bg-slate-200 text-slate-800 rounded-lg flex items-center justify-center font-bold">
                      {NUMERIC_FEATURE_LABELS[rowF].short}
                    </div>

                    {/* 4 Cells for this row */}
                    {correlationData.features.map((colF, j) => {
                      const r = correlationData.matrix[i][j];

                      // Color mapping: 1.0 = indigo, >0.8 = deep blue, >0.4 = light blue, <0 = rose/orange
                      let bgColor = 'bg-slate-100 text-slate-800';
                      if (i === j) {
                        bgColor = 'bg-slate-900 text-white font-extrabold';
                      } else if (r >= 0.8) {
                        bgColor = 'bg-blue-600 text-white font-extrabold';
                      } else if (r >= 0.4) {
                        bgColor = 'bg-blue-200 text-blue-900 font-bold';
                      } else if (r >= 0) {
                        bgColor = 'bg-slate-100 text-slate-700 font-medium';
                      } else {
                        bgColor = 'bg-rose-100 text-rose-900 font-bold';
                      }

                      return (
                        <div
                          key={colF}
                          className={`p-2.5 rounded-lg flex items-center justify-center font-mono text-xs sm:text-sm shadow-xs transition-transform hover:scale-105 ${bgColor}`}
                        >
                          {r > 0 && i !== j ? `+${r.toFixed(2)}` : r.toFixed(2)}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>

              {/* Legend (Section 21) */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-[11px] font-bold">
                <span className="text-slate-600 font-sans">상관계수 범위 범례:</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-rose-700">
                    <span className="w-3 h-3 rounded bg-rose-200 inline-block"></span>
                    -1 ← 음의 관계
                  </span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <span className="w-3 h-3 rounded bg-slate-200 inline-block"></span>
                    0 ← 선형 관계 없음
                  </span>
                  <span className="flex items-center gap-1 text-blue-700">
                    <span className="w-3 h-3 rounded bg-blue-600 inline-block"></span>
                    +1 ← 강한 양의 관계
                  </span>
                </div>
              </div>
            </div>

            {/* Heatmap Interpretation Questions (Section 22) */}
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 space-y-2">
              <span className="font-extrabold text-indigo-900 block text-sm flex items-center gap-1.5">
                <HelpCircle size={16} />
                <span>[히트맵 해석 활동]</span>
              </span>
              <p className="leading-relaxed font-medium">
                - <strong>가장 강한 양의 관계</strong>를 보이는 수치 조합: <strong>꽃잎 길이 ↔ 꽃잎 너비 (+0.96)</strong><br />
                - <strong>음의 관계</strong>를 보이는 수치 조합: <strong>꽃받침 너비 ↔ 꽃잎 길이 (-0.42)</strong><br />
                - 산점도에서 본 우상향 모양과 히트맵의 높은 상관계수(+0.96) 숫자가 일치함을 알 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 6: 핵심 속성 관찰 & 연결 */}
      {currentStep === 6 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">
              활동 6: 붓꽃 품종을 분류할 때 가장 중요한 핵심 속성은?
            </h3>

            {/* Connecting Bridge Sentence (Section 23) */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-1.5">
              <span className="font-extrabold text-emerald-900 block text-sm">
                💡 교사/학생 관찰 안내:
              </span>
              <p className="leading-relaxed">
                "모든 속성이 똑같이 중요한 것은 아닙니다. 속성 간 관계와 품종별 분포를 살펴보면 문제 해결에 도움이 되는 핵심 속성을 생각해볼 수 있습니다."
              </p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              3개 품종별 평균 측정치를 비교하고, 품종을 구별하기에 가장 차이가 뚜렷한 속성을 찾아보세요.
            </p>

            {/* Species Averages Table (Section 24) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-900 block">ORIGINAL_IRIS_DATASET 품종별 평균값 관찰:</span>
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                {speciesAverages.map(item => (
                  <div key={item.speciesKey} className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 shadow-xs">
                    <span className="font-bold text-slate-900 block text-sm">{item.korean}</span>
                    <span className="text-[11px] text-emerald-700 font-extrabold block">꽃잎길이 평균: {item.petalLengthMean} cm</span>
                    <span className="text-[11px] text-slate-600 block">꽃받침너비 평균: {item.sepalWidthMean} cm</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Choice Card */}
            <div className="space-y-3 pt-1">
              <span className="text-xs font-bold text-slate-900 block">
                질문: 3개 품종 간 수치 차이가 가장 뚜렷하여 분류에 유용한 속성은?
              </span>
              <div className="grid grid-cols-2 gap-2">
                <ChoiceCard
                  optionKey="1"
                  label="꽃잎 길이 (Petal Length) - 강한 차이"
                  isSelected={act6Choice === 'petalLength'}
                  status={act6Choice === 'petalLength' ? 'correct' : 'default'}
                  onClick={() => setAct6Choice('petalLength')}
                />
                <ChoiceCard
                  optionKey="2"
                  label="꽃받침 너비 (Sepal Width) - 겹치는 범위"
                  isSelected={act6Choice === 'sepalWidth'}
                  status={act6Choice === 'sepalWidth' ? 'incorrect' : 'default'}
                  onClick={() => setAct6Choice('sepalWidth')}
                />
              </div>

              {act6Choice === 'petalLength' && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 leading-relaxed animate-fadeIn">
                  ✓ <strong>정답입니다!</strong> 세토사의 꽃잎 길이 평균은 1.46cm, 버시컬러는 4.26cm, 버지니카는 5.55cm로 3개 품종 간 차이가 매우 뚜렷하여 머신러닝 분류의 핵심 피처(Feature)로 사용됩니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 7: 전처리 전/후 상태 비교 */}
      {currentStep === 7 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">
              활동 7: 전처리 전과 후 데이터 상태 비교하기
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              정제 전 오류 데이터와 전처리 후 깨끗해진 데이터를 비교해보세요.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Before Preprocessing */}
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                <span className="font-extrabold text-rose-950 block text-sm">
                  ⚠️ 전처리 전 (ERROR_IRIS_DATASET)
                </span>
                <ul className="space-y-1 text-slate-700 font-medium">
                  <li>결측치 (null): 4개 레코드</li>
                  <li>이상치 (50.0cm / 30.0cm 등): 2개 레코드</li>
                  <li>표현 불일치 ('versicolor'): 4개 레코드</li>
                  <li>데이터형 오류 ('5.1cm'): 2개 레코드</li>
                  <li className="pt-1 text-rose-700 font-bold">👉 모델 학습 시 런타임 에러 및 성능 저하 유발</li>
                </ul>
              </div>

              {/* After Preprocessing */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                <span className="font-extrabold text-emerald-950 block text-sm">
                  ✓ 전처리 후 (Cleaned Dataset)
                </span>
                <ul className="space-y-1 text-slate-700 font-medium">
                  <li>결측치: 대표 평균/중앙값으로 정제 완료</li>
                  <li>이상치: 원본 대입 오타 수정 완료</li>
                  <li>표현 불일치: 'Iris-' 표준 클래스 통일 완료</li>
                  <li>데이터형 오류: 순수 수치(float) 파싱 완료</li>
                  <li className="pt-1 text-emerald-800 font-bold">👉 기계학습 모델 훈련에 최적화된 상태</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 8: 전체 개념 정리 및 학습 완료 (Section 26 & 27) */}
      {currentStep === 8 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Summary Concept Table (Section 26) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen size={20} className="text-emerald-600" />
              <span>개념 정리 카드 (시각화 기법 요약)</span>
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-1/3">시각화 / 통계 도구</th>
                    <th className="p-3">핵심 역할 및 특징</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-3 font-bold text-slate-900 bg-slate-50">기초 통계량</td>
                    <td className="p-3 text-slate-700">데이터의 대표적인 값(평균, 중앙값)과 범위(최소, 최대, IQR)를 숫자로 정확히 확인</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-900 bg-slate-50">히스토그램</td>
                    <td className="p-3 text-slate-700">수치형 데이터 값이 어떤 구간에 많이 모여 있는지 분포 형태 확인</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-900 bg-slate-50">박스플롯</td>
                    <td className="p-3 text-slate-700">중앙값, 사분위수(Q1, Q3)와 울타리(Fence) 밖의 이상치 후보를 시각적으로 확인</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-900 bg-slate-50">산점도</td>
                    <td className="p-3 text-slate-700">두 수치형 속성의 관계 및 품종별 분포 분리 형태 확인</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-900 bg-slate-50">히트맵</td>
                    <td className="p-3 text-slate-700">여러 수치형 속성 간 상관계수(-1~+1) 관계를 한눈에 수치로 비교</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Student Final Reflection Questions (Section 27) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">
              [학생 생각하기] 최종 정리 질문
            </h3>

            {/* Q1 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <span className="font-extrabold text-slate-900 block text-sm">
                질문 1: 이상치를 찾을 때 표의 숫자만 보는 것보다 통계량과 그래프를 함께 사용하는 것이 왜 도움이 될까요?
              </span>
              <div className="space-y-1.5">
                {[
                  { key: 'a1', label: '그래프를 통해 뚝 떨어진 이상치를 한눈에 파악하고 통계량 수치로 객관적으로 검증할 수 있기 때문입니다.' },
                  { key: 'a2', label: '단순 눈대중보다 IQR 기준 등 명확한 수학적 울타리(Fence)로 판단할 수 있기 때문입니다.' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setFinalReflectionQ1(opt.key)}
                    className={`w-full text-left p-3 rounded-lg border text-xs font-bold transition-all min-h-[44px] cursor-pointer ${
                      finalReflectionQ1 === opt.key
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
                질문 2: 붓꽃 품종을 구분하는 데 도움이 될 것 같은 핵심 속성 2가지를 골라보세요.
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['sepalLength', 'sepalWidth', 'petalLength', 'petalWidth'] as FeatureKey[]).map(feat => (
                  <button
                    key={feat}
                    onClick={() => handleToggleFinalFeature(feat)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all min-h-[44px] cursor-pointer ${
                      finalSelectedFeatures.includes(feat)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {NUMERIC_FEATURE_LABELS[feat].full} {finalSelectedFeatures.includes(feat) ? '✓' : ''}
                  </button>
                ))}
              </div>
              {finalSelectedFeatures.length > 0 && (
                <p className="text-[11px] text-blue-700 font-bold pt-1">
                  선택한 속성: {finalSelectedFeatures.map(f => NUMERIC_FEATURE_LABELS[f].full).join(', ')}
                </p>
              )}
            </div>

            {/* Section 36 Completion Criteria Checklist */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
              <span className="font-extrabold text-emerald-950 block text-sm flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>시각화 탐구 활동 완료 현황 (최소 1회 수행 기준):</span>
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 font-bold text-[11px]">
                <div className={`p-2 rounded-lg text-center ${visitedStats ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-600'}`}>
                  {visitedStats ? '✓' : '○'} 기초 통계량
                </div>
                <div className={`p-2 rounded-lg text-center ${visitedHistogram ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-600'}`}>
                  {visitedHistogram ? '✓' : '○'} 히스토그램
                </div>
                <div className={`p-2 rounded-lg text-center ${visitedBoxplot ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-600'}`}>
                  {visitedBoxplot ? '✓' : '○'} 박스플롯
                </div>
                <div className={`p-2 rounded-lg text-center ${changedScatterPair ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-600'}`}>
                  {changedScatterPair ? '✓' : '○'} 산점도 변경
                </div>
                <div className={`p-2 rounded-lg text-center ${visitedHeatmap ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-600'}`}>
                  {visitedHeatmap ? '✓' : '○'} 히트맵
                </div>
              </div>
            </div>
          </div>

          {/* AI Prompt Section */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <PromptCard promptText={promptText} title="생성형 AI 탐구 프롬프트" />

            <div className="pt-2 text-center">
              {isCompleted && (
                <div className="text-xs font-bold text-emerald-700 bg-emerald-100 p-2.5 rounded-xl block mb-2">
                  ✓ 이미 완료 처리된 영역입니다. 자유롭게 복습할 수 있습니다.
                </div>
              )}
              <PrimaryButton size="lg" fullWidth onClick={onComplete} icon={<CheckCircle2 size={22} />}>
                04 데이터 전처리 학습 완료 처리하기
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

      {/* Modal for [탐정 수첩: 정상 데이터 예시 & 5가지 관찰 포인트] */}
      <Modal
        isOpen={isNotebookOpen}
        onClose={() => setIsNotebookOpen(false)}
        title="📖 [탐정 수첩] 정상 데이터 예시 & 관찰 포인트"
      >
        <div className="space-y-4 text-xs text-slate-800 leading-relaxed">
          <p className="font-medium text-slate-600">
            정상 데이터의 형태와 규칙을 기억하고 문제 데이터를 찾아내보세요!
          </p>

          {/* 3 Normal Sample Cards */}
          <div className="space-y-2">
            <span className="font-extrabold text-slate-900 block text-xs">
              ORIGINAL_IRIS_DATASET 실제 정상 레코드 샘플 3종:
            </span>

            {[normalSampleSetosa, normalSampleVersicolor, normalSampleVirginica].map(rec => (
              <div key={rec.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between items-center font-bold text-emerald-800">
                  <span>ID #{rec.id} (품종: {SPECIES_MAP[rec.species].korean})</span>
                  <span className="text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded">정상 데이터</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] pt-0.5">
                  <div>꽃받침 길이: {rec.sepalLength} cm</div>
                  <div>꽃받침 너비: {rec.sepalWidth} cm</div>
                  <div>꽃잎 길이: {rec.petalLength} cm</div>
                  <div>꽃잎 너비: {rec.petalWidth} cm</div>
                </div>
              </div>
            ))}
          </div>

          {/* 5 Checkpoints */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-emerald-950">
            <span className="font-extrabold text-xs block">✓ 데이터 탐정이 꼭 확인할 5가지 수칙:</span>
            <ul className="space-y-1 text-[11px] list-disc list-inside">
              <li>필요한 측정 수치 및 품종 값이 비어 있지 않습니다.</li>
              <li>길이와 너비 값은 숫자로 기록되어 있습니다.</li>
              <li>값 자체에 'cm' 같은 문자가 붙어 있지 않습니다.</li>
              <li>같은 품종의 이름은 동일한 방식으로 표기됩니다.</li>
              <li>다른 데이터와 비교했을 때 유난히 극단적으로 튀는 값(이상치)이 없습니다.</li>
            </ul>
          </div>

          <div className="pt-2 text-right">
            <PrimaryButton size="sm" onClick={() => setIsNotebookOpen(false)}>
              탐정 수첩 닫고 활동 계속하기
            </PrimaryButton>
          </div>
        </div>
      </Modal>

      {/* Modal for [어떻게 계산하나요?] Boxplot & IQR formula (Section 10) */}
      <Modal
        isOpen={showIqrCalculationModal}
        onClose={() => setShowIqrCalculationModal(false)}
        title="📐 [어떻게 계산하나요?] 사분위수(IQR) 및 박스플롯 이상치 기준"
      >
        <div className="space-y-4 text-xs text-slate-800 leading-relaxed">
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
            <span className="font-extrabold text-amber-900 block text-sm">
              사분위수 범위 (IQR) 계산식:
            </span>
            <div className="p-3 bg-white rounded-lg border border-amber-200 font-mono text-center text-sm font-bold text-amber-950">
              IQR = Q3 - Q1
            </div>
            <p className="text-slate-700 text-[11px]">
              - <strong>Q1 (제1사분위수)</strong>: 데이터를 오름차순으로 정렬했을 때 하위 25% 지점의 값<br />
              - <strong>Q3 (제3사분위수)</strong>: 하위 75% 지점의 값
            </p>
          </div>

          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
            <span className="font-extrabold text-rose-900 block text-sm">
              이상치 후보(Outlier Candidate) 판별 울타리 기준:
            </span>
            <div className="p-3 bg-white rounded-lg border border-rose-200 font-mono text-[11px] font-bold text-rose-950 space-y-1">
              <div>하한 울타리 (Lower Fence) = Q1 - 1.5 × IQR</div>
              <div>상한 울타리 (Upper Fence) = Q3 + 1.5 × IQR</div>
            </div>
            <p className="text-rose-900 text-[11px]">
              💡 <strong>Lower Fence 미만</strong>이거나 <strong>Upper Fence 초과</strong>인 데이터 값은 박스플롯 상에 붉은 점으로 이상치 후보로 표시됩니다.
            </p>
          </div>

          <div className="pt-2 text-right">
            <PrimaryButton size="sm" onClick={() => setShowIqrCalculationModal(false)}>
              닫기
            </PrimaryButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};
