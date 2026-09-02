import React, { useState, useMemo, useEffect } from 'react';
import { useActivityScrollTop } from '../../hooks/useActivityScrollTop';
import { ActivityProgress } from './ActivityProgress';
import { PromptCard } from './PromptCard';
import { StudentDataCard } from './StudentDataCard';
import { PrimaryButton } from '../common/PrimaryButton';
import { SecondaryButton } from '../common/SecondaryButton';
import { SpeciesLabel } from '../common/SpeciesBadge';
import { Modal } from '../common/Modal';
import {
  ORIGINAL_IRIS_DATASET,
  ERROR_IRIS_DATASET,
  ERROR_IRIS_ANSWERS,
  SPECIES_MAP,
} from '../../data/irisDataset';
import type { ErrorIrisRecord } from '../../types/iris';
import { applyEditsToDataset } from '../../utils/irisHelpers';
import {
  type FeatureKey,
  NUMERIC_FEATURE_LABELS,
  calculateMean,
  calculateMedian,
  calculateMinMax,
  extractValidNumericValues,
  getFeatureDynamicGuidance,
  calculateRangeHistogramBins,
  calculateIsolatedBoxPlotStats,
  calculateCorrelationMatrix,
  type CorrelationCell,
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
  ArrowRight,
  Target,
  RotateCcw,
  Sliders,
  Info,
  Table,
  Check,
  Database,
} from 'lucide-react';
import { ActivityChecklist } from './ActivityChecklist';
import {
  SELECTED_FEATURES_KEY,
  loadModule04Edits,
  saveModule04Edits,
  loadModule04Completion,
  saveModule04Completion,
  DEFAULT_MODULE04_COMPLETION,
  clearModule04DataOnly,
  type Module04Edit,
  type Module04CompletionState,
} from '../../utils/storage';

interface Module04ActivityProps {
  isCompleted: boolean;
  onComplete: () => void;
}

// Activity 1 Attributes configuration
const ACT0_ATTRIBUTES = [
  { id: 'sepalLength', label: '꽃받침 길이 (sepal length)', sample: '5.1 cm', correctType: 'numeric', correctRole: 'X' },
  { id: 'sepalWidth', label: '꽃받침 너비 (sepal width)', sample: '3.5 cm', correctType: 'numeric', correctRole: 'X' },
  { id: 'petalLength', label: '꽃잎 길이 (petal length)', sample: '1.4 cm', correctType: 'numeric', correctRole: 'X' },
  { id: 'petalWidth', label: '꽃잎 너비 (petal width)', sample: '0.2 cm', correctType: 'numeric', correctRole: 'X' },
  { id: 'species', label: '품종 (species)', sample: '세토사 (Iris-setosa)', correctType: 'categorical', correctRole: 'y' },
];

export const Module04Activity: React.FC<Module04ActivityProps> = ({ isCompleted: _isCompleted, onComplete }) => {
  const [currentActivity, setCurrentActivity] = useState(1);
  const totalActivities = 9;
  const topRef = useActivityScrollTop<HTMLDivElement>(currentActivity);

  // Student Edits Log & Hydrated Working Dataset
  const [module04Edits, setModule04Edits] = useState<Module04Edit[]>(() => loadModule04Edits());
  
  const workingDataset = useMemo<ErrorIrisRecord[]>(() => {
    return applyEditsToDataset(ERROR_IRIS_DATASET, module04Edits);
  }, [module04Edits]);

  // Persistent Activity Completion State
  const [activityCompletion, setActivityCompletion] = useState<Module04CompletionState>(() => loadModule04Completion());

  useEffect(() => {
    saveModule04Edits(module04Edits);
  }, [module04Edits]);

  useEffect(() => {
    saveModule04Completion(activityCompletion);
  }, [activityCompletion]);

  // Listen to resets
  useEffect(() => {
    const handleReset = () => {
      setModule04Edits([]);
      setActivityCompletion(DEFAULT_MODULE04_COMPLETION);
      setCurrentActivity(1);
    };
    window.addEventListener('module04_reset', handleReset);
    window.addEventListener('learning_data_reset', handleReset);
    return () => {
      window.removeEventListener('module04_reset', handleReset);
      window.removeEventListener('learning_data_reset', handleReset);
    };
  }, []);

  // Modals & UI States
  const [isNotebookOpen, setIsNotebookOpen] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);

  // ACTIVITY 1: Attribute & Types State (Introductory Activity)
  const [act0DataTypes, setAct0DataTypes] = useState<Record<string, 'numeric' | 'categorical' | null>>({
    sepalLength: null,
    sepalWidth: null,
    petalLength: null,
    petalWidth: null,
    species: null,
  });
  const [isAct0TypeChecked, setIsAct0TypeChecked] = useState<boolean>(false);
  const [act0TypeHintOpen, setAct0TypeHintOpen] = useState<boolean>(false);

  const [act0Roles, setAct0Roles] = useState<Record<string, 'X' | 'y' | null>>({
    sepalLength: null,
    sepalWidth: null,
    petalLength: null,
    petalWidth: null,
    species: null,
  });
  const [isAct0RoleChecked, setIsAct0RoleChecked] = useState<boolean>(false);
  const [act0RoleHintOpen, setAct0RoleHintOpen] = useState<boolean>(false);
  const [selectedSampleCol, setSelectedSampleCol] = useState<string | null>(null);

  // ACTIVITY 2: Intro Q State (Why clean data?)
  const [act1Answer, setAct1Answer] = useState<string | null>(null);

  // ACTIVITY 3: Data Detective Choices for 20 Records
  const [detectiveAnswers, setDetectiveAnswers] = useState<Record<number, string>>({});

  // ACTIVITY 4: Missing Value State (4 Missing Records: 101, 102, 108, 115)
  const [selectedMissingId, setSelectedMissingId] = useState<number>(101);
  const [missingChoice, setMissingChoice] = useState<string | null>(null);
  const [showMissingGroundTruth, setShowMissingGroundTruth] = useState<Record<number, boolean>>({});
  const [missingInputs, setMissingInputs] = useState<Record<number, string>>({});
  const [missingFeedbacks, setMissingFeedbacks] = useState<Record<number, { type: 'success' | 'error'; msg: string }>>({});

  // ACTIVITY 5: Outliers (Step nav 1~5 and Feature tabs sepalLength, sepalWidth, petalLength, petalWidth)
  const [outlierStep, setOutlierStep] = useState<number>(1);
  const [outlierFeature, setOutlierFeature] = useState<FeatureKey>('sepalLength');
  const [showOutlierGroundTruth, setShowOutlierGroundTruth] = useState<Record<number, boolean>>({});
  const [outlierInputs, setOutlierInputs] = useState<Record<number, string>>({});
  const [outlierFeedbacks, setOutlierFeedbacks] = useState<Record<number, { type: 'success' | 'error'; msg: string }>>({});

  // ACTIVITY 6: Inconsistent Labels (4 records) & Invalid Types (2 records)
  const [speciesChoices, setSpeciesChoices] = useState<Record<number, string>>({
    105: '세토사',
    106: '세토사',
    109: '버시컬러',
    114: '버지니카',
  });
  const [typeChoices, setTypeChoices] = useState<Record<number, string>>({});

  // ACTIVITY 7: Scaling & Encoding State
  const [scalingFeature, setScalingFeature] = useState<FeatureKey>('sepalLength');
  const [showScalingFormula, setShowScalingFormula] = useState<boolean>(false);
  const [isScalingExecuted, setIsScalingExecuted] = useState<boolean>(false);
  const [encodingChoice, setEncodingChoice] = useState<string | null>(null);

  // ACTIVITY 8: Full Dataset Review & Pagination State
  const [isModifiedCardsOpen, setIsModifiedCardsOpen] = useState<boolean>(false);
  const [isFullDatasetOpen, setIsFullDatasetOpen] = useState<boolean>(false);
  const [fullDatasetPage, setFullDatasetPage] = useState<number>(1);
  const pageSize = 15;

  // ACTIVITY 9: Scatter, Heatmap, Key Features State
  const [scatterX, setScatterX] = useState<FeatureKey>('petalLength');
  const [scatterY, setScatterY] = useState<FeatureKey>('petalWidth');
  const [selectedFeatures04, setSelectedFeatures04] = useState<FeatureKey[]>(() => {
    try {
      const saved = localStorage.getItem(SELECTED_FEATURES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 2) return parsed;
      }
    } catch {}
    return ['petalLength', 'petalWidth'];
  });

  // Activity 3 completion: all 20 records attempted at least once
  const attemptedDetectiveCount = useMemo(() => Object.keys(detectiveAnswers).length, [detectiveAnswers]);
  const isDetectiveAllAttempted = attemptedDetectiveCount >= workingDataset.length;

  useEffect(() => {
    if (isDetectiveAllAttempted) {
      setActivityCompletion(prev => ({ ...prev, detectiveComplete: true }));
    }
  }, [isDetectiveAllAttempted]);

  // Activity 7 completion: scaling executed at least once and encoding question answered
  const isTransformReady = isScalingExecuted && encodingChoice !== null;

  useEffect(() => {
    if (isTransformReady) {
      setActivityCompletion(prev => ({ ...prev, transformComplete: true }));
    }
  }, [isTransformReady]);

  // Track completion per activity entry (for reviewComplete and relationComplete)
  useEffect(() => {
    if (currentActivity === 8) {
      setActivityCompletion(prev => ({ ...prev, reviewComplete: true }));
    } else if (currentActivity === 9) {
      setActivityCompletion(prev => ({ ...prev, relationComplete: true }));
    }
  }, [currentActivity]);

  // Key Features completion status
  const isKeyFeaturesSelected = selectedFeatures04.length === 2;
  useEffect(() => {
    if (isKeyFeaturesSelected && currentActivity >= 8) {
      setActivityCompletion(prev => ({ ...prev, relationComplete: true }));
    }
  }, [isKeyFeaturesSelected, currentActivity]);

  // Ground Truth Samples
  const normalSampleSetosa = ORIGINAL_IRIS_DATASET[0];
  const normalSampleVersicolor = ORIGINAL_IRIS_DATASET[50];
  const normalSampleVirginica = ORIGINAL_IRIS_DATASET[100];

  // Live Error Count Calculations from workingDataset
  const currentErrorCounts = useMemo(() => {
    let missing = 0;
    let outlier = 0;
    let inconsistent = 0;
    let invalidType = 0;

    workingDataset.forEach(rec => {
      // Missing
      if (rec.sepalLength === null || rec.sepalWidth === null || rec.petalLength === null || rec.petalWidth === null || !rec.species) {
        missing++;
      }
      // Outlier (50cm or 30cm)
      if (typeof rec.sepalLength === 'number' && rec.sepalLength > 20) outlier++;
      if (typeof rec.petalLength === 'number' && rec.petalLength > 20) outlier++;
      // Inconsistent species
      if (rec.species && !['Iris-setosa', 'Iris-versicolor', 'Iris-virginica'].includes(rec.species)) {
        inconsistent++;
      }
      // Invalid string type
      if (typeof rec.sepalLength === 'string' || typeof rec.sepalWidth === 'string' || typeof rec.petalLength === 'string' || typeof rec.petalWidth === 'string') {
        invalidType++;
      }
    });

    return { missing, outlier, inconsistent, invalidType, total: missing + outlier + inconsistent + invalidType };
  }, [workingDataset]);

  // Automatically update activity completion status when error counts reach 0
  useEffect(() => {
    if (currentErrorCounts.missing === 0) {
      setActivityCompletion(prev => ({ ...prev, missingComplete: true }));
    }
    if (currentErrorCounts.outlier === 0) {
      setActivityCompletion(prev => ({ ...prev, outlierComplete: true }));
    }
    if (currentErrorCounts.inconsistent === 0 && currentErrorCounts.invalidType === 0) {
      setActivityCompletion(prev => ({ ...prev, formatTypeComplete: true }));
    }
  }, [currentErrorCounts]);

  const [act8Confirmed, setAct8Confirmed] = useState(false);

  // Unified activity completion check
  const isActivityCompleted = useMemo(() => {
    switch (currentActivity) {
      case 1:
        return isAct0TypeChecked && isAct0RoleChecked;
      case 2:
        return act1Answer !== null;
      case 3:
        return isDetectiveAllAttempted;
      case 4:
        return currentErrorCounts.missing === 0;
      case 5:
        return currentErrorCounts.outlier === 0;
      case 6:
        return currentErrorCounts.inconsistent === 0 && currentErrorCounts.invalidType === 0;
      case 7:
        return isTransformReady;
      case 8:
        return act8Confirmed;
      case 9:
        return selectedFeatures04.length === 2;
      default:
        return true;
    }
  }, [
    currentActivity,
    isAct0TypeChecked,
    isAct0RoleChecked,
    act1Answer,
    isDetectiveAllAttempted,
    currentErrorCounts,
    isTransformReady,
    act8Confirmed,
    selectedFeatures04,
  ]);

  // Feature specific metadata & live guidance generator
  const featureGuidance = useMemo(() => {
    return getFeatureDynamicGuidance(outlierFeature, workingDataset);
  }, [outlierFeature, workingDataset]);

  // Statistics calculation for Activity 4
  const origCleanValues = useMemo(() => extractValidNumericValues(ORIGINAL_IRIS_DATASET, outlierFeature), [outlierFeature]);
  const workingValues = useMemo(() => extractValidNumericValues(workingDataset, outlierFeature), [workingDataset, outlierFeature]);

  const origStats = useMemo(() => ({
    count: origCleanValues.length,
    minMax: calculateMinMax(origCleanValues),
    mean: calculateMean(origCleanValues),
    median: calculateMedian(origCleanValues),
  }), [origCleanValues]);

  const workingStats = useMemo(() => ({
    count: workingValues.length,
    minMax: calculateMinMax(workingValues),
    mean: calculateMean(workingValues),
    median: calculateMedian(workingValues),
  }), [workingValues]);

  // Range-based histogram data and isolated boxplot statistics
  const rangeHistogramData = useMemo(() => {
    return calculateRangeHistogramBins(workingValues, 20.0, 7);
  }, [workingValues]);

  const isolatedBoxPlotData = useMemo(() => {
    return calculateIsolatedBoxPlotStats(workingValues, 20.0);
  }, [workingValues]);

  // Correlation matrix for Activity 8
  const correlationMatrix = useMemo(() => calculateCorrelationMatrix(ORIGINAL_IRIS_DATASET), []);

  // Handlers for student edits
  const handleApplyEdit = (edit: Module04Edit) => {
    setModule04Edits(prev => {
      const filtered = prev.filter(e => !(e.recordId === edit.recordId && e.field === edit.field));
      return [...filtered, edit];
    });
  };

  const handleToggleFeature04 = (feat: FeatureKey) => {
    let nextFeats: FeatureKey[];
    if (selectedFeatures04.includes(feat)) {
      if (selectedFeatures04.length <= 1) return;
      nextFeats = selectedFeatures04.filter(f => f !== feat);
    } else {
      if (selectedFeatures04.length >= 2) {
        nextFeats = [selectedFeatures04[1], feat];
      } else {
        nextFeats = [...selectedFeatures04, feat];
      }
    }
    setSelectedFeatures04(nextFeats);
    try {
      localStorage.setItem(SELECTED_FEATURES_KEY, JSON.stringify(nextFeats));
    } catch (e) {
      console.error(e);
    }
  };

  // Pagination for Activity 7 full preprocessed dataset view
  const totalFullPages = Math.ceil(workingDataset.length / pageSize);
  const currentFullDatasetSlice = useMemo(() => {
    const start = (fullDatasetPage - 1) * pageSize;
    return workingDataset.slice(start, start + pageSize);
  }, [workingDataset, fullDatasetPage]);

  // Unique modified record count
  const uniqueModifiedRecordCount = useMemo(() => {
    return new Set(module04Edits.map(e => e.recordId)).size;
  }, [module04Edits]);

  const promptText = `정제 대상 데이터(결측치, 입력 오류 이상치, 표현 불일치, 자료형 오류)가 포함된 붓꽃 데이터셋을 정제하고 Min-Max 스케일링 및 원-핫 인코딩으로 변환하는 전처리 과정이 기계학습 모델에 미치는 영향을 설명해줘.`;

  // Checklist items
  const checklistItems = [
    { id: 'detective', label: '오류 데이터 찾아보기', isCompleted: activityCompletion.detectiveComplete },
    { id: 'missing', label: '결측치 수정하기', isCompleted: activityCompletion.missingComplete },
    { id: 'outlier', label: '이상치 확인하고 수정하기', isCompleted: activityCompletion.outlierComplete },
    { id: 'formatType', label: '표현/자료형 오류 수정하기', isCompleted: activityCompletion.formatTypeComplete },
    { id: 'transform', label: '스케일링·인코딩 체험하기', isCompleted: activityCompletion.transformComplete },
    { id: 'review', label: '전처리 결과 확인하기', isCompleted: activityCompletion.reviewComplete },
    { id: 'relation', label: '속성 관계 확인하기', isCompleted: activityCompletion.relationComplete },
  ];

  // Formatting helpers for modified records review
  const getErrorReasonLabel = (type: string) => {
    switch (type) {
      case 'missing': return '결측치 채우기';
      case 'outlier': return '잘못 입력된 이상치 수정';
      case 'inconsistent': return '표준 품종 표기 통일';
      case 'invalidType': return '숫자 데이터형 변환';
      default: return '오류 정제';
    }
  };

  const formatBeforeDisplay = (edit: Module04Edit) => {
    if (edit.errorType === 'missing') return '값 없음 (null)';
    if (edit.errorType === 'inconsistent') return `"${edit.before}"`;
    if (edit.errorType === 'invalidType') return `"${edit.before}" (문자)`;
    if (typeof edit.before === 'number') return `${edit.before} cm`;
    return String(edit.before);
  };

  const formatAfterDisplay = (edit: Module04Edit) => {
    if (edit.field === 'species') {
      return edit.after === 'Iris-setosa' ? '세토사 (Iris-setosa)' : edit.after === 'Iris-versicolor' ? '버시컬러 (Iris-versicolor)' : '버지니카 (Iris-virginica)';
    }
    if (typeof edit.after === 'number') return `${edit.after} cm`;
    return String(edit.after);
  };

  // Missing values metadata (4 items: 101, 102, 108, 115)
  const missingItemsConfig = [
    { id: 101, field: 'sepalLength', label: '꽃받침 길이', expected: 5.1, species: '세토사', desc: '데이터 #101의 꽃받침 길이에 값(null)이 빠져 있습니다.' },
    { id: 102, field: 'petalWidth', label: '꽃잎 너비', expected: 0.2, species: '세토사', desc: '데이터 #102의 꽃잎 너비에 값(null)이 빠져 있습니다.' },
    { id: 108, field: 'sepalWidth', label: '꽃받침 너비', expected: 3.2, species: '버시컬러', desc: '데이터 #108의 꽃받침 너비에 값(null)이 빠져 있습니다.' },
    { id: 115, field: 'petalLength', label: '꽃잎 길이', expected: 5.9, species: '버지니카', desc: '데이터 #115의 꽃잎 길이에 값(null)이 빠져 있습니다.' },
  ];

  // Inconsistent species labels metadata (4 items: 105, 106, 109, 114)
  const inconsistentItemsConfig = [
    { id: 105, current: 'setosa', target: 'Iris-setosa', label: '세토사 (Iris-setosa)', desc: '소문자 "setosa" ➔ "Iris-setosa"' },
    { id: 106, current: 'Setosa', target: 'Iris-setosa', label: '세토사 (Iris-setosa)', desc: '대소문자 "Setosa" ➔ "Iris-setosa"' },
    { id: 109, current: 'versicolor', target: 'Iris-versicolor', label: '버시컬러 (Iris-versicolor)', desc: '소문자 "versicolor" ➔ "Iris-versicolor"' },
    { id: 114, current: 'virginica', target: 'Iris-virginica', label: '버지니카 (Iris-virginica)', desc: '소문자 "virginica" ➔ "Iris-virginica"' },
  ];

  // Invalid data type metadata (2 items: 107, 112)
  const invalidTypeItemsConfig = [
    { id: 107, field: 'sepalLength', beforeStr: '5.1cm', expectedNum: 5.1, fieldName: '꽃받침 길이', desc: '데이터 #107 꽃받침 길이에 "5.1cm" 단위 문자열 포함' },
    { id: 112, field: 'petalWidth', beforeStr: '1.5cm', expectedNum: 1.5, fieldName: '꽃잎 너비', desc: '데이터 #112 꽃잎 너비에 "1.5cm" 단위 문자열 포함' },
  ];

  return (
    <div className="space-y-6 scroll-mt-24" ref={topRef}>
      {/* Activity Progress */}
      <ActivityProgress
        currentStep={currentActivity}
        totalSteps={totalActivities}
        title={
          currentActivity === 1
            ? '활동 1. [기본] 데이터의 속성과 종류 알아보기'
            : currentActivity === 2
            ? '활동 2. [개념] 왜 데이터를 정리해야 할까?'
            : currentActivity === 3
            ? '활동 3. [탐정] 데이터에서 문제를 찾아보자'
            : currentActivity === 4
            ? '활동 4. [결측치] 빠진 값을 어떻게 처리할까?'
            : currentActivity === 5
            ? `활동 5. [이상치] 이 값은 정말 이상한 값일까? (${outlierStep}/5 단계)`
            : currentActivity === 6
            ? '활동 6. [표현/자료형] 같은 뜻인데 다르게 적혀 있다면?'
            : currentActivity === 7
            ? '활동 7. [변환] 데이터를 학습하기 좋은 형태로 바꿔보자'
            : currentActivity === 8
            ? '활동 8. [확인] 내가 수정한 데이터 확인하기'
            : '활동 9. [관계] 속성끼리는 어떤 관계가 있을까?'
        }
      />

      {/* Main Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
            [공식 6단계 과정] ③ 데이터 전처리
          </span>
          <span className="text-xs text-slate-500 font-medium">04 데이터 전처리 (총 20개 레코드 실습)</span>
        </div>

        <h2 className="text-xl font-black text-slate-900">
          [데이터 전처리 실습: 12개 오류 수정과 데이터 변환 체험]
        </h2>

        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          데이터의 기본 속성과 형태를 이해한 후, 학생이 직접 20개 붓꽃 데이터(정제 대상 12개 + 정상 8개)를 살펴보고 <strong>결측치(4개)·입력 오류 이상치(2개)·표현 불일치(4개)·자료형 오류(2개)</strong>를 차례대로 정제해봅니다.
        </p>
      </div>

      {/* ACTIVITY 1: 데이터의 속성과 종류 알아보기 (신규 도입 활동) */}
      {currentActivity === 1 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Database size={20} className="text-emerald-600" />
                <span>활동 1: 데이터의 속성과 종류 알아보기</span>
              </h3>
              <span className="text-xs font-mono font-extrabold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                도입: 데이터 구조 이해
              </span>
            </div>

            {/* Core Question Banner */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-2">
              <span className="font-extrabold text-slate-900 text-sm block">
                🤔 핵심 질문
              </span>
              <p className="text-sm font-bold text-emerald-950">
                "붓꽃 데이터 한 줄에는 여러 정보가 들어 있습니다. 이 정보들은 모두 같은 종류의 데이터일까요?"
              </p>
              <p className="text-slate-600">
                기계학습 모델에 데이터를 넣기 전에, 데이터가 어떤 구조로 이루어져 있고 각 정보가 어떤 종류인지 실제 붓꽃 데이터를 보며 직접 살펴봅시다.
              </p>
            </div>

            {/* Section 1: Real Iris Record Observation */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 block">
                  1단계: 실제 붓꽃(Iris) 데이터 1행(Row) 관찰하기
                </span>
                <span className="text-[11px] text-slate-500">
                  * 열(column)을 클릭해 강조해 보세요
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse bg-white rounded-xl overflow-hidden font-mono text-xs border border-slate-200 shadow-2xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-2.5 border-r border-slate-200 font-sans">ID</th>
                      <th className="p-2.5 border-r border-slate-200 font-sans">꽃받침 길이</th>
                      <th className="p-2.5 border-r border-slate-200 font-sans">꽃받침 너비</th>
                      <th className="p-2.5 border-r border-slate-200 font-sans">꽃잎 길이</th>
                      <th className="p-2.5 border-r border-slate-200 font-sans">꽃잎 너비</th>
                      <th className="p-2.5 font-sans">품종</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="divide-x divide-slate-200 font-medium">
                      <td className="p-3 bg-slate-50 text-slate-500 font-bold">1</td>
                      <td
                        onClick={() => setSelectedSampleCol(selectedSampleCol === 'sepalLength' ? null : 'sepalLength')}
                        className={`p-3 cursor-pointer transition-colors ${selectedSampleCol === 'sepalLength' ? 'bg-emerald-100 text-emerald-950 font-bold' : 'hover:bg-slate-50'}`}
                      >
                        5.1 cm
                      </td>
                      <td
                        onClick={() => setSelectedSampleCol(selectedSampleCol === 'sepalWidth' ? null : 'sepalWidth')}
                        className={`p-3 cursor-pointer transition-colors ${selectedSampleCol === 'sepalWidth' ? 'bg-emerald-100 text-emerald-950 font-bold' : 'hover:bg-slate-50'}`}
                      >
                        3.5 cm
                      </td>
                      <td
                        onClick={() => setSelectedSampleCol(selectedSampleCol === 'petalLength' ? null : 'petalLength')}
                        className={`p-3 cursor-pointer transition-colors ${selectedSampleCol === 'petalLength' ? 'bg-emerald-100 text-emerald-950 font-bold' : 'hover:bg-slate-50'}`}
                      >
                        1.4 cm
                      </td>
                      <td
                        onClick={() => setSelectedSampleCol(selectedSampleCol === 'petalWidth' ? null : 'petalWidth')}
                        className={`p-3 cursor-pointer transition-colors ${selectedSampleCol === 'petalWidth' ? 'bg-emerald-100 text-emerald-950 font-bold' : 'hover:bg-slate-50'}`}
                      >
                        0.2 cm
                      </td>
                      <td
                        onClick={() => setSelectedSampleCol(selectedSampleCol === 'species' ? null : 'species')}
                        className={`p-3 cursor-pointer transition-colors font-sans ${selectedSampleCol === 'species' ? 'bg-emerald-100 text-emerald-950 font-bold' : 'hover:bg-slate-50'}`}
                      >
                        <SpeciesLabel species="Iris-setosa" showEnglish size="xs" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Observation Guide */}
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1.5 text-xs text-emerald-950">
                <p className="font-bold text-emerald-900">
                  💡 "한 붓꽃을 설명하기 위해 여러 종류의 정보가 열(column)로 나뉘어 있습니다."
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="p-2.5 bg-white rounded-lg border border-emerald-200">
                    <strong className="text-emerald-900 block mb-0.5">행 (Row)</strong>
                    붓꽃 한 송이(한 개체)의 전체 관측 기록
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-emerald-200">
                    <strong className="text-emerald-900 block mb-0.5">열 (Column)</strong>
                    붓꽃을 설명하는 하나의 속성(특징 항목)
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Attribute Concept & Types */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <span className="text-xs font-extrabold text-slate-900 block">
                2단계: 데이터 속성(Attribute)과 형태(종류) 알아보기
              </span>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <span className="font-extrabold text-slate-900 text-sm block">
                  📌 데이터 속성(Attribute)이란?
                </span>
                <p className="leading-relaxed text-slate-700">
                  <strong>"데이터 속성은 하나의 대상을 설명하는 각각의 특징이나 항목입니다."</strong>
                </p>
                <p className="text-[11px] text-slate-600">
                  붓꽃 데이터의 속성: 꽃받침 길이, 꽃받침 너비, 꽃잎 길이, 꽃잎 너비, 품종 (총 5개 속성)
                </p>
              </div>

              {/* Numerical vs Categorical Comparison Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-indigo-900 text-sm">수치형 데이터 (Numerical)</span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full border border-indigo-200">측정·계산</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-[11px]">
                    "길이, 무게, 온도처럼 <strong>수치로 측정하거나 계산할 수 있는 데이터</strong>"
                  </p>
                  <div className="p-2.5 bg-white rounded-lg border border-indigo-200 text-[11px] space-y-1">
                    <span className="font-bold text-indigo-950 block">붓꽃 데이터 예시:</span>
                    <ul className="list-disc list-inside text-slate-600 space-y-0.5 font-mono">
                      <li>꽃받침 길이: 5.1 cm</li>
                      <li>꽃받침 너비: 3.5 cm</li>
                      <li>꽃잎 길이: 1.4 cm</li>
                      <li>꽃잎 너비: 0.2 cm</li>
                    </ul>
                  </div>
                  <p className="text-[11px] text-indigo-900 font-bold">
                    ✓ 숫자로 표현되어 있고 크기 차이나 계산(평균, 차이 등)이 의미가 있습니다.
                  </p>
                  <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-[10px] text-amber-950 leading-tight">
                    💡 <strong>작은 안내:</strong> 숫자로 적혀 있다는 이유만으로 모두 수치형 특성이 되는 것은 아닙니다. ID처럼 대상을 구별하기 위한 번호도 있습니다.
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-emerald-900 text-sm">범주형 데이터 (Categorical)</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">종류·그룹</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-[11px]">
                    "대상을 <strong>종류나 그룹으로 구분하는 데이터</strong>"
                  </p>
                  <div className="p-2.5 bg-white rounded-lg border border-emerald-200 text-[11px] space-y-1">
                    <span className="font-bold text-emerald-950 block">붓꽃 데이터 예시:</span>
                    <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                      <li>품종: 세토사 (Iris-setosa)</li>
                      <li>품종: 버시컬러 (Iris-versicolor)</li>
                      <li>품종: 버지니카 (Iris-virginica)</li>
                    </ul>
                  </div>
                  <p className="text-[11px] text-emerald-900 font-bold">
                    ✓ 값의 크기를 비교하기보다 어떤 범주(종류)에 속하는지를 나타냅니다.
                  </p>
                  <div className="p-2.5 bg-white rounded-lg border border-emerald-200 text-[10px] text-emerald-950 leading-tight">
                    💡 <strong>비교 포인트:</strong> [수치형] 꽃잎 길이 4.5cm → 측정값 vs [범주형] 버시컬러 → 종류
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Student Judgment 1 (Numerical vs Categorical) */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 block">
                  3단계: [학생 판단 1] 다음 속성을 데이터의 종류에 따라 나누어보세요.
                </span>
                <button
                  onClick={() => setAct0TypeHintOpen(!act0TypeHintOpen)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                >
                  {act0TypeHintOpen ? '힌트 닫기' : '💡 힌트 보기'}
                </button>
              </div>

              {act0TypeHintOpen && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 animate-fadeIn">
                  💡 <strong>사고 힌트:</strong> 값의 크기를 측정하는 정보인지, 종류를 구분하는 정보인지 생각해보세요.
                </div>
              )}

              <div className="space-y-2">
                {ACT0_ATTRIBUTES.map(attr => {
                  const chosen = act0DataTypes[attr.id];
                  const isCorrect = isAct0TypeChecked && chosen === attr.correctType;

                  return (
                    <div
                      key={attr.id}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                        isAct0TypeChecked
                          ? isCorrect
                            ? 'border-emerald-300 bg-emerald-50/40'
                            : 'border-rose-300 bg-rose-50/30'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-xs text-slate-900 block">{attr.label}</span>
                        <span className="text-[11px] text-slate-500 font-mono">예시 수치: {attr.sample}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setAct0DataTypes(prev => ({ ...prev, [attr.id]: 'numeric' }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
                            chosen === 'numeric'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          수치형
                        </button>
                        <button
                          onClick={() => setAct0DataTypes(prev => ({ ...prev, [attr.id]: 'categorical' }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
                            chosen === 'categorical'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          범주형
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-1">
                <PrimaryButton
                  size="md"
                  onClick={() => setIsAct0TypeChecked(true)}
                  icon={<Check size={18} />}
                  fullWidth
                >
                  {isAct0TypeChecked ? '분류 결과 다시 확인하기' : '분류 결과 확인하기'}
                </PrimaryButton>
              </div>

              {isAct0TypeChecked && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-1 animate-fadeIn">
                  <span className="font-extrabold text-emerald-900 block">✓ 수치형/범주형 분류 확인 결과</span>
                  <p className="leading-relaxed">
                    꽃받침 길이, 꽃받침 너비, 꽃잎 길이, 꽃잎 너비는 측정 가능한 <strong>수치형 데이터</strong>이고, 붓꽃 품종은 꽃의 종류를 나타내는 <strong>범주형 데이터</strong>입니다.
                  </p>
                </div>
              )}
            </div>

            {/* Section 4: Feature X vs Target y */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <span className="text-xs font-extrabold text-slate-900 block">
                4단계: 기계학습에서의 역할 — 입력 특성(X, 독립변수)과 예측 목표(y, 종속변수)
              </span>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <p className="font-bold text-slate-900 text-sm">
                  "이번에는 데이터의 '종류'가 아니라 기계학습 문제에서 어떤 역할을 하는지 살펴봅시다."
                </p>
                <p className="text-slate-600 leading-relaxed">
                  머신러닝은 데이터를 그냥 모아두는 것이 아니라, <strong>무엇을 보고(입력) 무엇을 맞힐 것인가(출력)</strong> 역할을 나누어 학습합니다.
                </p>
              </div>

              {/* X and y definitions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sky-900 text-sm">입력 특성 (X, 독립변수)</span>
                    <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full border border-sky-200">모델의 입력</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-[11px]">
                    "모델이 예측할 때 <strong>입력으로 사용하는 데이터</strong>"
                  </p>
                  <p className="text-[11px] text-slate-600">
                    이 앱에서는 모델에 넣어 주는 입력 정보를 <strong>입력 특성(Feature)</strong> 또는 <strong>독립변수(X)</strong>라고 부릅니다.
                  </p>
                  <div className="p-2.5 bg-white rounded-lg border border-sky-200 text-[11px] space-y-1">
                    <div className="font-mono text-slate-700">붓꽃 X: 꽃받침 길이, 꽃받침 너비, 꽃잎 길이, 꽃잎 너비 (4개 특성)</div>
                    <p className="text-[10px] text-sky-900 leading-relaxed font-medium pt-1 border-t border-sky-100">
                      💡 이 데이터셋에는 입력 후보 특성 X가 4개 있지만, 실제 모델을 만들 때는 목적이나 알고리즘에 따라 이 중 일부 특성만 사용할 수도 있습니다.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-rose-900 text-sm">예측 목표 (y, 종속변수)</span>
                    <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full border border-rose-200">예측할 목표</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-[11px]">
                    "모델이 입력 데이터를 이용해 <strong>최종적으로 예측하려는 값</strong>"
                  </p>
                  <p className="text-[11px] text-slate-600">
                    현재 Iris 분류 문제에서는 붓꽃의 품종이 <strong>예측 목표(y)</strong>이자 모델이 맞혀야 하는 <strong>정답 레이블(Label, 종속변수)</strong>입니다.
                  </p>
                  <div className="p-2.5 bg-white rounded-lg border border-rose-200 text-[11px] text-slate-700">
                    붓꽃 y: 품종 (세토사 / 버시컬러 / 버지니카)
                  </div>
                </div>
              </div>

              {/* Visual Flow diagram */}
              <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-200 space-y-2 text-xs">
                <span className="font-bold text-slate-800 block text-[11px]">📊 붓꽃 문제에서의 데이터 흐름</span>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 bg-white rounded-lg border border-slate-200 text-xs">
                  <div className="p-2 bg-sky-50 rounded border border-sky-200 text-center w-full sm:w-auto">
                    <span className="font-bold text-sky-900 block">입력 특성 (X, 독립변수)</span>
                    <span className="text-[10px] text-slate-600">꽃받침/꽃잎 4개 측정값</span>
                  </div>
                  <span className="text-slate-400 font-black">➔</span>
                  <div className="p-2 bg-slate-900 text-white rounded font-bold text-center w-full sm:w-auto">
                    기계학습 모델
                  </div>
                  <span className="text-slate-400 font-black">➔</span>
                  <div className="p-2 bg-rose-50 rounded border border-rose-200 text-center w-full sm:w-auto">
                    <span className="font-bold text-rose-900 block">예측 목표 (y, 종속변수)</span>
                    <span className="text-[10px] text-slate-600">붓꽃 품종 (정답 레이블)</span>
                  </div>
                </div>
              </div>

              {/* CRITICAL WARNING NOTICE */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-1">
                <span className="font-extrabold text-amber-900 block text-xs">
                  ⚠️ 중요한 개념 주의: 형태와 역할은 다릅니다!
                </span>
                <p className="leading-relaxed font-medium">
                  <strong>"수치형/범주형은 데이터의 형태를 구분하는 기준이고, 입력 특성(X)/예측 목표(y)는 기계학습 문제에서 데이터가 맡는 역할을 구분하는 기준입니다."</strong>
                </p>
                <p className="text-[11px] text-slate-600">
                  * 현재 붓꽃 문제에서는 우연히 수치형 측정치 4개가 입력 특성(X, 독립변수)이고 범주형 품종이 예측 목표(y, 종속변수)이지만, 다른 문제(예: 집값이나 온도 예측 같은 회귀 문제)에서는 예측 목표(y)도 숫자가 될 수 있습니다.
                </p>
              </div>
            </div>

            {/* Section 5: Student Judgment 2 (Feature X vs Target y) */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 block">
                  5단계: [학생 판단 2] 붓꽃 품종을 예측하는 현재 문제에서 각 속성은 어떤 역할을 할까요?
                </span>
                <button
                  onClick={() => setAct0RoleHintOpen(!act0RoleHintOpen)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                >
                  {act0RoleHintOpen ? '힌트 닫기' : '💡 힌트 보기'}
                </button>
              </div>

              {act0RoleHintOpen && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 animate-fadeIn">
                  💡 <strong>사고 힌트:</strong> 모델이 입력받는 정보와 최종적으로 맞혀야 하는 값을 구분해보세요.
                </div>
              )}

              <div className="space-y-2">
                {ACT0_ATTRIBUTES.map(attr => {
                  const chosen = act0Roles[attr.id];
                  const isCorrect = isAct0RoleChecked && chosen === attr.correctRole;

                  return (
                    <div
                      key={attr.id}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                        isAct0RoleChecked
                          ? isCorrect
                            ? 'border-emerald-300 bg-emerald-50/40'
                            : 'border-rose-300 bg-rose-50/30'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-xs text-slate-900 block">{attr.label}</span>
                        <span className="text-[11px] text-slate-500 font-mono">예시 수치: {attr.sample}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setAct0Roles(prev => ({ ...prev, [attr.id]: 'X' }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
                            chosen === 'X'
                              ? 'bg-sky-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          입력 특성 (X)
                        </button>
                        <button
                          onClick={() => setAct0Roles(prev => ({ ...prev, [attr.id]: 'y' }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
                            chosen === 'y'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          예측 목표 (y)
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-1">
                <PrimaryButton
                  size="md"
                  onClick={() => setIsAct0RoleChecked(true)}
                  icon={<Check size={18} />}
                  fullWidth
                >
                  {isAct0RoleChecked ? '역할 확인 다시 하기' : '역할 확인하기'}
                </PrimaryButton>
              </div>

              {isAct0RoleChecked && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-1 animate-fadeIn">
                  <span className="font-extrabold text-emerald-900 block">✓ 역할 확인 결과</span>
                  <p className="leading-relaxed">
                    꽃받침과 꽃잎의 4가지 측정값은 모델이 품종을 판별하기 위해 관찰하는 <strong>입력 특성(X, 독립변수)</strong>이고, 최종적으로 알아내려는 품종은 <strong>예측 목표(y, 종속변수)</strong>입니다.
                  </p>
                </div>
              )}
            </div>

            {/* Section 6: Final 2x2 Summary & Connection to Preprocessing */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <span className="text-xs font-extrabold text-slate-900 block">
                6단계: 한눈에 정리 & 데이터 전처리로 연결
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-extrabold text-slate-900 block text-xs">[데이터의 형태 (종류)]</span>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <strong className="text-indigo-900 block">수치형 (Numerical)</strong>
                      숫자로 측정하거나 계산 가능 (꽃잎 길이 등 4개 측정치)
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <strong className="text-emerald-900 block">범주형 (Categorical)</strong>
                      종류나 그룹으로 구분 (붓꽃 품종)
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-extrabold text-slate-900 block text-xs">[기계학습에서의 역할]</span>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <strong className="text-sky-900 block">입력 특성 (X, 독립변수)</strong>
                      모델에 입력으로 제공하는 특성 (4개 측정값)
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <strong className="text-rose-900 block">예측 목표 (y, 종속변수)</strong>
                      모델이 최종 맞혀야 하는 목표 (품종 정답 레이블)
                    </div>
                  </div>
                </div>
              </div>

              {/* Core Takeaway Quote */}
              <div className="p-3.5 bg-slate-900 text-white rounded-xl text-center space-y-1">
                <p className="text-xs font-bold leading-relaxed text-emerald-300">
                  "수치형/범주형은 데이터의 형태, 입력 특성(X)/예측 목표(y)는 기계학습에서의 역할을 나타냅니다."
                </p>
              </div>

              {/* Preprocessing Connection Bridge */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-1.5">
                <span className="font-extrabold text-emerald-900 text-sm block">
                  🚀 이제 본격적인 데이터 전처리로 나아가 봅시다!
                </span>
                <p className="leading-relaxed">
                  데이터의 종류(수치형/범주형)와 역할(X/y)에 따라 <strong>필요한 전처리 방법도 달라질 수 있습니다.</strong>
                </p>
                <p className="text-slate-600">
                  이제 실제 수집된 데이터에 빠진 값이나 잘못 적힌 값 등 어떤 문제가 있는지 살펴보고, 기계학습에 안전하게 사용할 수 있도록 직접 정리해봅시다!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVITY 2: 왜 데이터를 정리해야 할까? */}
      {currentActivity === 2 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Layers size={20} className="text-emerald-600" />
              <span>활동 2. [왜 데이터를 정리해야 할까?]</span>
            </h3>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-2">
              <p className="font-bold text-slate-900 text-sm">
                "기계학습 모델은 데이터를 이용해 규칙을 학습합니다."
              </p>
              <p>
                데이터에 빠진 값(결측치)이나 잘못 입력된 수치가 있으면 모델도 잘못된 규칙을 배울 수 있습니다.
              </p>
            </div>

            {/* Compare Normal vs Problematic Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                <span className="font-extrabold text-emerald-900 block text-xs">✅ 정상 데이터 예시</span>
                <div className="space-y-1 font-mono text-[11px] text-emerald-950">
                  <div>꽃받침 길이: 5.1 cm</div>
                  <div>꽃받침 너비: 3.5 cm</div>
                  <div>꽃잎 길이: 1.4 cm</div>
                  <div>꽃잎 너비: 0.2 cm</div>
                  <div>품종: 세토사 (Iris-setosa)</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                <span className="font-extrabold text-rose-900 block text-xs">⚠️ 문제가 있는 데이터 예시</span>
                <div className="space-y-1 font-mono text-[11px] text-rose-950">
                  <div className="font-bold text-rose-600 bg-rose-100 px-1 rounded">꽃받침 길이: [값 없음]</div>
                  <div>꽃받침 너비: 3.5 cm</div>
                  <div>꽃잎 길이: 1.4 cm</div>
                  <div>꽃잎 너비: 0.2 cm</div>
                  <div>품종: 세토사 (Iris-setosa)</div>
                </div>
              </div>
            </div>

            {/* Student Inquiry */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <span className="font-extrabold text-slate-900 block text-sm">
                질문: 이 문제 있는 데이터를 그대로 기계학습에 사용해도 괜찮을까요?
              </span>

              <div className="space-y-2">
                {[
                  { key: 'ok', label: '괜찮다. 컴퓨터가 알아서 처리할 것이다.' },
                  { key: 'fix', label: '확인하거나 올바른 값으로 수정할 필요가 있다.' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setAct1Answer(opt.key)}
                    className={`w-full text-left p-3 rounded-xl border font-bold transition-all min-h-[44px] cursor-pointer ${
                      act1Answer === opt.key
                        ? opt.key === 'fix'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ○ {opt.label}
                  </button>
                ))}
              </div>

              {act1Answer && (
                <div className={`p-3 rounded-lg font-bold text-xs ${act1Answer === 'fix' ? 'bg-emerald-100 text-emerald-950' : 'bg-rose-100 text-rose-950'}`}>
                  {act1Answer === 'fix'
                    ? '👏 정답입니다! 기계학습 전에 데이터를 확인하고 필요한 부분을 정리하거나 변환하는 과정을 데이터 전처리라고 합니다.'
                    : '💡 데이터를 정제하지 않고 입력하면 계산 오류가 발생하거나 잘못된 모델이 생성됩니다.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ACTIVITY 3: 데이터에서 문제를 찾아보자 (전체 20개 레코드 관찰) */}
      {currentActivity === 3 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Search size={20} className="text-rose-600" />
                <span>활동 3. [데이터에서 문제를 찾아보자] (데이터 탐정: 전체 20개 관찰)</span>
              </h3>
              <span className={`text-xs font-mono font-extrabold px-3 py-1 rounded-full border ${
                isDetectiveAllAttempted
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                판별 진행: {attemptedDetectiveCount} / {workingDataset.length} 개 완료
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              아래 데이터 카드 20개(오류 레코드 12개 + 정상 레코드 8개)를 살펴보고 각 카드의 문제 유형을 직접 판단해보세요. 정상 데이터는 수정하지 않습니다.
            </p>

            {/* Detective Reference Notebook Sample */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <BookOpen size={16} className="text-emerald-600" />
                  <span>📖 탐정 수첩: 정상 데이터 기준값</span>
                </span>
                <SecondaryButton size="sm" onClick={() => setIsNotebookOpen(true)}>
                  수첩 전체 보기
                </SecondaryButton>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {[normalSampleSetosa, normalSampleVersicolor, normalSampleVirginica].map(rec => (
                  <div key={rec.id} className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-[10px]">
                    <div className="font-bold text-emerald-800">ID #{rec.id} ({SPECIES_MAP[rec.species].korean})</div>
                    <div className="text-slate-600">{rec.sepalLength} / {rec.sepalWidth} / {rec.petalLength} / {rec.petalWidth} cm</div>
                  </div>
                ))}
              </div>

              {/* Neutral observation hint */}
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 block">💡 탐정 관찰 요령:</span>
                <p className="leading-relaxed">
                  • 같은 열의 다른 데이터와 비교했을 때 형태(—, 표기법, 단위)나 크기가 유난히 다른 값이 있는지 기준값과 비교해보세요.<br />
                  • 정상적인 데이터는 수정할 필요가 없으므로 [오류 없음]을 선택합니다.
                </p>
              </div>
            </div>

            {/* 20 Data Cards Grid */}
            <div className="space-y-4 pt-2">
              <span className="font-extrabold text-slate-900 text-xs block">
                🕵️ 탐색 대상 전체 20개 데이터 카드 (클릭하여 오류 종류를 판단해보세요):
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {workingDataset.map(rec => {
                  const answerObj = ERROR_IRIS_ANSWERS.find(a => a.recordId === rec.id);
                  const isNormal = !answerObj;
                  const currentAnswer = detectiveAnswers[rec.id];
                  const isCorrect = isNormal
                    ? currentAnswer === 'none'
                    : currentAnswer === answerObj?.issueType;

                  return (
                    <div key={rec.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 text-xs shadow-2xs">
                      <StudentDataCard record={rec} title={`데이터 #${rec.id}`} />

                      <div className="space-y-1.5 pt-1 border-t border-slate-100">
                        <span className="font-bold text-slate-800 block text-[11px]">이 데이터의 문제는 무엇인가요?</span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
                          {[
                            { type: 'missing', label: '결측치' },
                            { type: 'outlier', label: '이상치' },
                            { type: 'inconsistent', label: '표현 불일치' },
                            { type: 'invalidType', label: '데이터형 오류' },
                            { type: 'none', label: '오류 없음' },
                          ].map((opt, optIdx) => {
                            const isSelected = currentAnswer === opt.type;
                            return (
                              <button
                                key={opt.type}
                                onClick={() => setDetectiveAnswers(prev => ({ ...prev, [rec.id]: opt.type }))}
                                className={`p-2 rounded-lg border font-bold text-center cursor-pointer transition-all min-h-[44px] text-[11px] ${
                                  optIdx === 4 ? 'col-span-2 sm:col-span-1' : ''
                                } ${
                                  isSelected
                                    ? isCorrect
                                      ? 'bg-emerald-600 text-white border-emerald-600'
                                      : 'bg-rose-600 text-white border-rose-600'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>

                        {currentAnswer && (
                          <div className={`p-2.5 rounded-lg font-bold text-[11px] leading-relaxed ${
                            isCorrect
                              ? 'bg-emerald-100 text-emerald-950 border border-emerald-200'
                              : 'bg-rose-100 text-rose-950 border border-rose-200'
                          }`}>
                            {isNormal
                              ? currentAnswer === 'none'
                                ? '👏 맞습니다. 이 데이터에서는 수정할 오류가 발견되지 않습니다.'
                                : '💡 이 데이터는 정상 데이터입니다. 값을 다시 살펴보세요.'
                              : currentAnswer === 'none'
                              ? '⚠️ 이 데이터에는 확인해야 할 부분이 있습니다. 다시 살펴보세요.'
                              : currentAnswer === answerObj?.issueType
                              ? '✅ 정확하게 판별했습니다!'
                              : '💡 탐정 수첩 기준값과 비교해보세요.'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVITY 4: 결측치를 수정해보자 (총 4개: #101, #102, #108, #115) */}
      {currentActivity === 4 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <HelpCircle size={20} className="text-amber-600" />
                <span>활동 4. [빠진 값을 어떻게 처리할까?] (결측치 4개 직접 수정)</span>
              </h3>
              <span className="text-xs font-mono font-extrabold px-3 py-1 bg-amber-100 text-amber-900 rounded-full">
                결측치 해결: {4 - currentErrorCounts.missing} / 4 개 완료
              </span>
            </div>

            {/* Missing Items Tab Selector */}
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              {missingItemsConfig.map(item => {
                const rec = workingDataset.find(r => r.id === item.id);
                const isFixed = rec && (rec as any)[item.field] !== null;

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedMissingId(item.id)}
                    className={`px-3 py-2 rounded-xl transition-all cursor-pointer min-h-[44px] flex items-center gap-1.5 ${
                      selectedMissingId === item.id
                        ? 'bg-amber-600 text-white shadow-xs font-black'
                        : isFixed
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>데이터 #{item.id} ({item.label})</span>
                    {isFixed && <span>✓</span>}
                  </button>
                );
              })}
            </div>

            {/* Selected Missing Item Edit Panel */}
            {(() => {
              const item = missingItemsConfig.find(m => m.id === selectedMissingId) || missingItemsConfig[0];
              const isFirstItem = item.id === 101;
              const inputVal = missingInputs[item.id] || '';
              const feedback = missingFeedbacks[item.id];

              return (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1.5">
                    <span className="font-extrabold text-amber-900 block text-sm">
                      📌 결측치 대상 #{item.id} ({item.species}): {item.desc}
                    </span>
                    {!isFirstItem && (
                      <p className="font-bold text-emerald-800">
                        💡 같은 방법으로 다음 결측치도 원본 비교 후 올바른 수치로 수정해보세요.
                      </p>
                    )}
                  </div>

                  {/* First item strategy explanation */}
                  {isFirstItem && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
                      <span className="font-extrabold text-slate-900 block text-sm">
                        질문: 빠진 결측치를 어떻게 처리하면 좋을까요?
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          { key: 'orig', label: '원래 값을 확인하여 채운다 (추천)' },
                          { key: 'mean', label: '전체 평균값/중앙값으로 대체한다' },
                          { key: 'delete', label: '해당 레코드를 데이터에서 제외한다' },
                          { key: 'unknown', label: '잘 모르겠다' },
                        ].map(opt => (
                          <button
                            key={opt.key}
                            onClick={() => setMissingChoice(opt.key)}
                            className={`p-3 rounded-xl border text-left font-bold transition-all min-h-[44px] cursor-pointer ${
                              missingChoice === opt.key
                                ? 'bg-amber-600 text-white border-amber-600'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            ○ {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ground Truth Compare & Direct Entry Input */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">
                        [데이터 #{item.id} 원본 비교 및 수정]
                      </span>
                      <SecondaryButton size="sm" onClick={() => setShowMissingGroundTruth(prev => ({ ...prev, [item.id]: true }))}>
                        원본 데이터와 비교하기
                      </SecondaryButton>
                    </div>

                    {showMissingGroundTruth[item.id] && (
                      <div className="p-3 bg-white rounded-lg border border-slate-200 grid grid-cols-2 gap-2 font-mono text-[11px]">
                        <div className="p-2 bg-rose-50 text-rose-950 rounded">
                          <span className="block font-sans text-[10px] text-rose-700">현재 입력 데이터 (#{item.id})</span>
                          <span className="font-bold">{item.label}: [값 없음]</span>
                        </div>
                        <div className="p-2 bg-emerald-50 text-emerald-950 rounded">
                          <span className="block font-sans text-[10px] text-emerald-700">정답 원본 데이터</span>
                          <span className="font-bold">{item.label}: {item.expected} cm</span>
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                      <label className="font-bold text-slate-800 block">
                        데이터 #{item.id}의 올바른 {item.label} 수치를 입력하세요:
                      </label>

                      <div className="flex items-center gap-2 max-w-xs">
                        <input
                          type="number"
                          step="0.1"
                          placeholder={`예: ${item.expected}`}
                          value={inputVal}
                          onChange={e => setMissingInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                          className="p-2.5 border border-slate-300 rounded-xl font-mono text-sm w-36 focus:ring-2 focus:ring-amber-500"
                        />
                        <span className="font-bold text-slate-600">cm</span>
                        <PrimaryButton
                          size="sm"
                          onClick={() => {
                            const val = parseFloat(inputVal);
                            if (val === item.expected) {
                              handleApplyEdit({
                                recordId: item.id,
                                field: item.field,
                                before: null,
                                after: item.expected,
                                errorType: 'missing',
                              });
                              setMissingFeedbacks(prev => ({ ...prev, [item.id]: { type: 'success', msg: `🎉 빠진 ${item.label} 수치가 ${item.expected}cm로 완벽히 수정되었습니다!` } }));
                            } else {
                              setMissingFeedbacks(prev => ({ ...prev, [item.id]: { type: 'error', msg: `❌ 올바른 수치가 아닙니다. 원본 비교를 확인해보세요. (정답: ${item.expected})` } }));
                            }
                          }}
                        >
                          수정하기
                        </PrimaryButton>
                      </div>

                      {feedback && (
                        <div className={`p-3 rounded-lg font-bold text-xs ${feedback.type === 'success' ? 'bg-emerald-100 text-emerald-950' : 'bg-rose-100 text-rose-950'}`}>
                          {feedback.msg}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ACTIVITY 5: 이상치를 찾아 수정해보자 (구조 개편: 1/5~5/5 네비게이터 공통화 & 범위형 히스토그램 & 박스플롯 축 스케일링) */}
      {currentActivity === 5 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <BarChart2 size={20} className="text-emerald-600" />
                <span>활동 5. [이 값은 정말 이상한 값일까?] (이상치 5단계 탐구)</span>
              </h3>
              <span className="text-xs font-mono font-extrabold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                이상치 해결: {2 - currentErrorCounts.outlier} / 2 개 완료
              </span>
            </div>

            {/* Feature selector tabs */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-bold text-slate-800 text-xs">
                  🔍 탐구할 수치형 속성을 선택하세요:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(['sepalLength', 'sepalWidth', 'petalLength', 'petalWidth'] as FeatureKey[]).map(f => (
                    <button
                      key={f}
                      onClick={() => {
                        setOutlierFeature(f);
                        setOutlierStep(1); // Reset to Step 1 on feature change
                        setShowOutlierGroundTruth({});
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] cursor-pointer ${
                        outlierFeature === f
                          ? 'bg-emerald-600 text-white shadow-xs font-black'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {NUMERIC_FEATURE_LABELS[f].full}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prominent Current Feature Guidance Banner */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-xs text-emerald-950">
                <div className="flex items-center gap-2">
                  <Info size={16} className="text-emerald-700 shrink-0" />
                  <span className="font-extrabold text-emerald-900 text-sm">
                    [현재 살펴보는 속성: {featureGuidance.base.label}]
                  </span>
                </div>
                <p className="font-medium text-emerald-900 leading-relaxed">
                  {featureGuidance.base.description}
                </p>
                <p className="font-bold text-emerald-800 bg-white/70 p-2 rounded-lg border border-emerald-200/60">
                  🎯 관찰 포인트: {featureGuidance.base.observationPoint}
                </p>
              </div>
            </div>

            {/* Outlier 1/5 ~ 5/5 Step Navigator (Decoupled from feature selection - ALWAYS visible for all 4 features) */}
            <div className="flex flex-wrap gap-1.5 text-xs font-bold pt-1">
              {[
                { step: 1, label: '1/5 기초 통계량' },
                { step: 2, label: '2/5 히스토그램' },
                { step: 3, label: '3/5 박스플롯' },
                { step: 4, label: '4/5 원본 확인·수정' },
                { step: 5, label: '5/5 수정 결과 확인' },
              ].map(tab => (
                <button
                  key={tab.step}
                  onClick={() => setOutlierStep(tab.step)}
                  className={`px-3 py-2 rounded-xl transition-all cursor-pointer min-h-[44px] ${
                    outlierStep === tab.step
                      ? 'bg-slate-900 text-white shadow-xs font-black'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Step 1: 1/5 기초 통계량 (OutlierStatisticsStep) */}
            {outlierStep === 1 && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
                <div className="space-y-1">
                  <span className="font-extrabold text-slate-900 text-sm block">
                    1 / 5 [{featureGuidance.base.label}] 기초 통계량 비교
                  </span>
                  <p className="text-slate-600 font-medium leading-relaxed">
                    {featureGuidance.base.statsGuide}
                  </p>
                </div>

                <div className="w-full overflow-x-auto">
                  <table className="w-full text-center border-collapse bg-white rounded-xl overflow-hidden shadow-2xs font-mono text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-2.5 text-left font-sans">통계 지표</th>
                        <th className="p-2.5 text-slate-800 font-sans">정상 원본 데이터</th>
                        <th className="p-2.5 text-slate-800 font-sans">현재 작업 데이터 (workingDataset)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-2.5 text-left font-bold text-slate-700">최솟값 (Min)</td>
                        <td className="p-2.5 font-bold text-slate-800">{origStats.minMax.min} cm</td>
                        <td className="p-2.5 font-bold text-slate-800">{workingStats.minMax.min} cm</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-left font-bold text-slate-700">최댓값 (Max)</td>
                        <td className="p-2.5 font-bold text-slate-800">{origStats.minMax.max} cm</td>
                        <td className="p-2.5 font-bold text-slate-800">
                          {workingStats.minMax.max > 20 ? (
                            <span className="inline-flex items-center gap-1">
                              <span className="font-bold text-slate-900">{workingStats.minMax.max} cm</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                ⚠️ 극단값 포함
                              </span>
                            </span>
                          ) : (
                            <span>{workingStats.minMax.max} cm</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-left font-bold text-slate-700">평균 (Mean)</td>
                        <td className="p-2.5 font-bold text-slate-800">{origStats.mean} cm</td>
                        <td className="p-2.5 font-bold text-slate-800">{workingStats.mean} cm</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-left font-bold text-slate-700">중앙값 (Median)</td>
                        <td className="p-2.5 font-bold text-slate-800">{origStats.median} cm</td>
                        <td className="p-2.5 font-bold text-slate-800">{workingStats.median} cm</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2 text-slate-800">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <BarChart2 size={16} className="text-emerald-600 shrink-0" />
                    <span>[{featureGuidance.base.label}] 기초 통계 해석 & 데이터 관찰:</span>
                  </div>
                  <p className="font-medium leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-700">
                    📊 {featureGuidance.statsDiffNote}
                  </p>
                  <p className={`font-bold p-2.5 rounded-lg border text-[11px] leading-relaxed ${
                    featureGuidance.hasIntentionalError
                      ? 'bg-amber-50 text-amber-950 border-amber-200'
                      : 'bg-emerald-50 text-emerald-950 border-emerald-200'
                  }`}>
                    {featureGuidance.errorGuide}
                  </p>
                </div>

                <div className="pt-2 text-right">
                  <PrimaryButton size="sm" onClick={() => setOutlierStep(2)}>
                    다음: 2/5 히스토그램 보기
                  </PrimaryButton>
                </div>
              </div>
            )}

            {/* Step 2: 2/5 범위형 히스토그램 (OutlierHistogramStep) */}
            {outlierStep === 2 && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
                <div className="space-y-1">
                  <span className="font-extrabold text-slate-900 text-sm block">
                    2 / 5 [{featureGuidance.base.label}] 범위형 히스토그램 (Range-Based Bins)
                  </span>
                  <p className="text-slate-600 font-medium leading-relaxed">
                    {featureGuidance.base.histogramGuide}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <span className="font-bold text-slate-800 text-[11px] block">
                    [{featureGuidance.base.label}] 구간 범위별 데이터 분포 (총 {rangeHistogramData.totalCount}개):
                  </span>

                  <div className="w-full overflow-x-auto">
                    <div className="flex items-end gap-2 h-44 border-b border-slate-300 pb-2 px-2 min-w-[340px]">
                      {rangeHistogramData.normalBins.map((bin, i) => {
                        const maxCount = Math.max(...rangeHistogramData.normalBins.map(b => b.count), 1);
                        const barHeightPercent = Math.max(8, (bin.count / maxCount) * 100);

                        return (
                          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group">
                            <span className="text-[10px] font-bold font-mono text-slate-700 mb-1">
                              {bin.count}
                            </span>
                            <div
                              style={{ height: `${barHeightPercent}%` }}
                              className="w-full bg-blue-500 hover:bg-blue-600 rounded-t-md transition-all relative"
                            >
                              <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] py-1 px-1.5 rounded pointer-events-none whitespace-nowrap z-10 font-mono">
                                {bin.binLabel}: {bin.count}개
                              </div>
                            </div>
                            <span className="text-[9px] font-bold font-mono text-slate-500 mt-2 rotate-0 text-center leading-tight">
                              {bin.binStart.toFixed(1)}~{bin.binEnd.toFixed(1)}
                            </span>
                          </div>
                        );
                      })}

                      {/* Extreme Outlier Separate Column (Issue 11 Fix) */}
                      {rangeHistogramData.extremeOutliers.length > 0 && (
                        <div className="flex-1 flex flex-col items-center justify-end h-full border-l border-rose-200 pl-2">
                          <span className="text-[10px] font-black font-mono text-rose-600 mb-1">
                            {rangeHistogramData.extremeOutliers.length}
                          </span>
                          <div
                            style={{ height: '35%' }}
                            className="w-full bg-rose-500 rounded-t-md relative shadow-xs"
                          >
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-rose-900 text-white text-[9px] py-0.5 px-1.5 rounded font-mono font-bold whitespace-nowrap">
                              범위 밖 {rangeHistogramData.extremeOutliers.join(', ')}cm
                            </div>
                          </div>
                          <span className="text-[9px] font-black font-mono text-rose-600 mt-2 text-center leading-tight">
                            범위 밖
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-950 font-bold leading-relaxed">
                  ❓ <strong>히스토그램 관찰 질문:</strong> {featureGuidance.base.histogramQuestion}
                </div>

                <div className="pt-2 text-right">
                  <PrimaryButton size="sm" onClick={() => setOutlierStep(3)}>
                    다음: 3/5 박스플롯 보기
                  </PrimaryButton>
                </div>
              </div>
            )}

            {/* Step 3: 3/5 박스플롯 (OutlierBoxplotStep) */}
            {outlierStep === 3 && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
                <div className="space-y-1">
                  <span className="font-extrabold text-slate-900 text-sm block">
                    3 / 5 [{featureGuidance.base.label}] 박스플롯 (Box Plot & IQR)
                  </span>
                  <p className="text-slate-600 font-medium leading-relaxed">
                    {featureGuidance.base.boxplotGuide}
                  </p>
                </div>

                {/* Boxplot SVG scaled over normal range with axis break & extreme outlier area (Issues 1~15 Overhaul) */}
                <div className="w-full overflow-x-auto bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-700 font-mono border-b border-slate-100 pb-2">
                    <span>[{featureGuidance.base.label}] 박스플롯 시각화</span>
                    {isolatedBoxPlotData.extremeOutliers.length > 0 ? (
                      <span className="text-rose-600 font-extrabold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        ⚠️ 축 단절 적용 (범위 밖 이상치 {isolatedBoxPlotData.extremeOutliers.join(', ')}cm)
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ 정상 데이터 분포 (전체 축 활용)
                      </span>
                    )}
                  </div>

                  <svg viewBox="0 0 1000 170" className="w-full h-auto min-w-[320px] overflow-visible">
                    {(() => {
                      const stats = isolatedBoxPlotData;
                      const hasExtreme = stats.extremeOutliers.length > 0;

                      // X Coordinates: 70% width for normal plot when extreme exists, 90% when no extreme
                      const normalXStart = 70;
                      const normalXEnd = hasExtreme ? 700 : 930;
                      const breakX = 760;
                      const extremeX = 890;

                      const displayMin = stats.lowerWhisker;
                      const displayMax = stats.upperWhisker;

                      const scaleX = (val: number) => {
                        if (displayMax === displayMin) return normalXStart + (normalXEnd - normalXStart) / 2;
                        const x = normalXStart + ((val - displayMin) / (displayMax - displayMin)) * (normalXEnd - normalXStart);
                        return Number.isFinite(x) ? x : normalXStart;
                      };

                      const xMinWhisker = scaleX(stats.lowerWhisker);
                      const xQ1 = scaleX(stats.q1);
                      const xMedian = scaleX(stats.median);
                      const xQ3 = scaleX(stats.q3);
                      const xMaxWhisker = scaleX(stats.upperWhisker);

                      const boxY = 40;
                      const boxHeight = 50;
                      const midY = boxY + boxHeight / 2;

                      return (
                        <g>
                          {/* Baseline axis for normal plot */}
                          <line x1={normalXStart - 20} y1={125} x2={normalXEnd + 20} y2={125} stroke="#cbd5e1" strokeWidth="2.5" />

                          {/* Whisker line left */}
                          <line x1={xMinWhisker} y1={midY} x2={xQ1} y2={midY} stroke="#475569" strokeWidth="2" />
                          <line x1={xMinWhisker} y1={midY - 14} x2={xMinWhisker} y2={midY + 14} stroke="#475569" strokeWidth="2.5" />

                          {/* Whisker line right */}
                          <line x1={xQ3} y1={midY} x2={xMaxWhisker} y2={midY} stroke="#475569" strokeWidth="2" />
                          <line x1={xMaxWhisker} y1={midY - 14} x2={xMaxWhisker} y2={midY + 14} stroke="#475569" strokeWidth="2.5" />

                          {/* Box (Q1 ~ Q3) */}
                          <rect
                            x={xQ1}
                            y={boxY}
                            width={Math.max(8, xQ3 - xQ1)}
                            height={boxHeight}
                            fill="#3b82f6"
                            fillOpacity="0.2"
                            stroke="#2563eb"
                            strokeWidth="2.5"
                            rx="4"
                          />

                          {/* Median line */}
                          <line x1={xMedian} y1={boxY} x2={xMedian} y2={boxY + boxHeight} stroke="#1d4ed8" strokeWidth="3.5" />

                          {/* General Outliers within normal fence */}
                          {stats.outliers.map((oVal, i) => (
                            <g key={i}>
                              <circle cx={scaleX(oVal)} cy={midY} r="5.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                              <text x={scaleX(oVal)} y={midY - 12} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#d97706">
                                {oVal}cm
                              </text>
                            </g>
                          ))}

                          {/* Axis Numerical Labels */}
                          <text x={xMinWhisker} y={145} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#64748b">최소 ({stats.lowerWhisker})</text>
                          <text x={xQ1} y={boxY + boxHeight + 16} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#3b82f6">Q1 ({stats.q1})</text>
                          <text x={xMedian} y={boxY - 8} textAnchor="middle" fontSize="12" fontWeight="black" fill="#1d4ed8">중앙값 ({stats.median})</text>
                          <text x={xQ3} y={boxY + boxHeight + 16} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#3b82f6">Q3 ({stats.q3})</text>
                          <text x={xMaxWhisker} y={145} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#64748b">최대 ({stats.upperWhisker})</text>

                          {/* Axis Break & Extreme Outliers Area */}
                          {hasExtreme && (
                            <g>
                              {/* Axis break mark // */}
                              <g transform={`translate(${breakX}, ${midY})`}>
                                <line x1="-10" y1="-22" x2="-2" y2="22" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
                                <line x1="4" y1="-22" x2="12" y2="22" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
                                <text x="1" y="44" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b">
                                  축 단절 (범위 밖)
                                </text>
                              </g>

                              {/* Baseline extension in extreme area */}
                              <line x1={extremeX - 45} y1={125} x2={extremeX + 70} y2={125} stroke="#fecdd3" strokeWidth="2" strokeDasharray="3 3" />

                              {/* Extreme Outlier Point & Text */}
                              {stats.extremeOutliers.map((exVal, idx) => {
                                const pY = midY + (idx - (stats.extremeOutliers.length - 1) / 2) * 26;
                                return (
                                  <g key={idx}>
                                    <circle cx={extremeX} cy={pY} r="7.5" fill="#e11d48" stroke="#ffffff" strokeWidth="2" />
                                    <text x={extremeX + 16} y={pY + 5} textAnchor="start" fontSize="14" fontWeight="black" fill="#be123c">
                                      ● {exVal} cm
                                    </text>
                                    <text x={extremeX} y={145} textAnchor="middle" fontSize="11" fontWeight="extrabold" fill="#e11d48">
                                      범위 밖 이상치
                                    </text>
                                  </g>
                                );
                              })}
                            </g>
                          )}
                        </g>
                      );
                    })()}
                  </svg>

                  {/* Extreme Outlier Isolation Badge (Issue 15 & 16 Fix) */}
                  {isolatedBoxPlotData.extremeOutliers.length > 0 ? (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between font-mono text-[11px] shadow-2xs">
                      <span className="font-sans font-bold text-rose-900 text-xs flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                        <span>⚠️ 그래프 범위를 크게 벗어난 극단 이상치 (Extreme Outliers):</span>
                      </span>
                      <span className="font-black text-rose-700 bg-white px-3 py-1 rounded-lg border border-rose-200 text-xs">
                        ● {isolatedBoxPlotData.extremeOutliers.join(', ')} cm
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between font-mono text-[11px]">
                      <span className="font-sans font-bold text-emerald-900 text-xs">
                        ✓ 모든 수치가 정상 그래프 시각화 범위 내에 분포합니다.
                      </span>
                      <span className="font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                        범위 밖 이상치 0개
                      </span>
                    </div>
                  )}
                </div>

                {/* Boxplot Numerical Breakdown Table (Requirement 17) */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2 text-xs">
                  <span className="font-extrabold text-slate-900 block text-xs">
                    [{featureGuidance.base.label}] 박스플롯 상세 통계 수치표:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] text-center">
                    <div className="p-2 bg-slate-50 rounded">
                      <span className="text-[10px] text-slate-500 block font-sans">Q1 (25%)</span>
                      <span className="font-bold">{isolatedBoxPlotData.q1} cm</span>
                    </div>
                    <div className="p-2 bg-blue-50 rounded">
                      <span className="text-[10px] text-blue-700 block font-sans">중앙값 (50%)</span>
                      <span className="font-black text-blue-900">{isolatedBoxPlotData.median} cm</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded">
                      <span className="text-[10px] text-slate-500 block font-sans">Q3 (75%)</span>
                      <span className="font-bold">{isolatedBoxPlotData.q3} cm</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded">
                      <span className="text-[10px] text-slate-500 block font-sans">IQR (Q3-Q1)</span>
                      <span className="font-bold">{isolatedBoxPlotData.iqr} cm</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded">
                      <span className="text-[10px] text-slate-500 block font-sans">하단 수염</span>
                      <span className="font-bold">{isolatedBoxPlotData.lowerWhisker} cm</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded">
                      <span className="text-[10px] text-slate-500 block font-sans">상단 수염</span>
                      <span className="font-bold">{isolatedBoxPlotData.upperWhisker} cm</span>
                    </div>
                    <div className="p-2 bg-amber-50 rounded col-span-2">
                      <span className="text-[10px] text-amber-700 block font-sans">이상치 후보</span>
                      <span className="font-bold text-amber-900">
                        {isolatedBoxPlotData.outliers.length > 0 || isolatedBoxPlotData.extremeOutliers.length > 0
                          ? [...isolatedBoxPlotData.outliers, ...isolatedBoxPlotData.extremeOutliers].join(', ') + ' cm'
                          : '없음'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Feature Specific Boxplot Note */}
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 font-medium space-y-1">
                  <span className="font-bold block text-amber-900">⚠️ [{featureGuidance.base.label}] 박스플롯 해석 주의점:</span>
                  <p className="leading-relaxed">
                    {featureGuidance.base.boxplotNote}
                  </p>
                </div>

                <div className="pt-2 text-right">
                  <PrimaryButton size="sm" onClick={() => setOutlierStep(4)}>
                    다음: 4/5 원본 확인 및 수정
                  </PrimaryButton>
                </div>
              </div>
            )}

            {/* Step 4: 4/5 원본 확인 및 수정 (OutlierEditStep) */}
            {outlierStep === 4 && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
                <span className="font-extrabold text-slate-900 text-sm block">
                  4 / 5 [{featureGuidance.base.label}] 원본 확인 및 이상치 수치 직접 수정하기
                </span>

                {outlierFeature === 'sepalLength' || outlierFeature === 'petalLength' ? (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="font-bold text-slate-800">
                        {outlierFeature === 'sepalLength'
                          ? '데이터 #103의 꽃받침 길이가 50.0cm로 기록되어 있습니다.'
                          : '데이터 #104의 꽃잎 길이가 30.0cm로 기록되어 있습니다.'}
                      </span>
                      <SecondaryButton size="sm" onClick={() => setShowOutlierGroundTruth(prev => ({ ...prev, [outlierFeature === 'sepalLength' ? 103 : 104]: true }))}>
                        원본 데이터 확인
                      </SecondaryButton>
                    </div>

                    {showOutlierGroundTruth[outlierFeature === 'sepalLength' ? 103 : 104] && (
                      <div className="p-3 bg-white rounded-lg border border-slate-200 grid grid-cols-2 gap-2 font-mono text-[11px]">
                        <div className="p-2 bg-rose-50 text-rose-950 rounded">
                          <span className="block font-sans text-[10px] text-rose-700">현재 입력된 수치</span>
                          <span className="font-bold">
                            {outlierFeature === 'sepalLength' ? '50.0 cm (소수점 입력 오타)' : '30.0 cm (극단치 입력 오타)'}
                          </span>
                        </div>
                        <div className="p-2 bg-emerald-50 text-emerald-950 rounded">
                          <span className="block font-sans text-[10px] text-emerald-700">정답 원본 수치</span>
                          <span className="font-bold">
                            {outlierFeature === 'sepalLength' ? '5.0 cm (#5)' : '1.5 cm (#4)'}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                      <label className="font-bold text-slate-800 block">
                        올바른 수치를 직접 입력하여 수정하세요:
                      </label>

                      <div className="flex items-center gap-2 max-w-xs">
                        <input
                          type="number"
                          step="0.1"
                          placeholder={outlierFeature === 'sepalLength' ? '예: 5.0' : '예: 1.5'}
                          value={outlierInputs[outlierFeature === 'sepalLength' ? 103 : 104] || ''}
                          onChange={e => {
                            const targetId = outlierFeature === 'sepalLength' ? 103 : 104;
                            setOutlierInputs(prev => ({ ...prev, [targetId]: e.target.value }));
                          }}
                          className="p-2.5 border border-slate-300 rounded-xl font-mono text-sm w-36 focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="font-bold text-slate-600">cm</span>
                        <PrimaryButton
                          size="sm"
                          onClick={() => {
                            const targetId = outlierFeature === 'sepalLength' ? 103 : 104;
                            const val = parseFloat(outlierInputs[targetId] || '');
                            const expectedVal = outlierFeature === 'sepalLength' ? 5.0 : 1.5;
                            const wrongVal = outlierFeature === 'sepalLength' ? 50.0 : 30.0;

                            if (val === expectedVal) {
                              handleApplyEdit({
                                recordId: targetId,
                                field: outlierFeature,
                                before: wrongVal,
                                after: expectedVal,
                                errorType: 'outlier',
                              });
                              setOutlierFeedbacks(prev => ({ ...prev, [targetId]: { type: 'success', msg: `🎉 ${expectedVal}cm로 올바르게 수정되었습니다!` } }));
                              setOutlierStep(5);
                            } else {
                              setOutlierFeedbacks(prev => ({ ...prev, [targetId]: { type: 'error', msg: `❌ 올바른 수치가 아닙니다. 원본 비교를 확인해보세요. (정답: ${expectedVal})` } }));
                            }
                          }}
                        >
                          수정하기
                        </PrimaryButton>
                      </div>

                      {outlierFeedbacks[outlierFeature === 'sepalLength' ? 103 : 104] && (
                        <div className={`p-3 rounded-lg font-bold text-xs ${outlierFeedbacks[outlierFeature === 'sepalLength' ? 103 : 104].type === 'success' ? 'bg-emerald-100 text-emerald-950' : 'bg-rose-100 text-rose-950'}`}>
                          {outlierFeedbacks[outlierFeature === 'sepalLength' ? 103 : 104].msg}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3 text-slate-700">
                    <span className="font-extrabold text-slate-900 block text-sm">
                      ℹ️ [{featureGuidance.base.label}] 교육용 이상치 오타 없음:
                    </span>
                    <p className="leading-relaxed font-medium">
                      현재 데이터셋에서 <strong>{featureGuidance.base.label}</strong> 속성에는 직접 수정해야 할 교육용 이상치 오타가 들어있지 않습니다. 1~3단계에서 관찰한 수치 분포와 범위를 활용하세요.
                    </p>
                    <div className="pt-2">
                      <PrimaryButton size="sm" onClick={() => setOutlierStep(5)}>
                        다음: 5/5 수정 결과 확인
                      </PrimaryButton>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: 5/5 수정 결과 확인 & 생각하기 (OutlierResultStep) */}
            {outlierStep === 5 && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
                <span className="font-extrabold text-slate-900 text-sm block">
                  5 / 5 [{featureGuidance.base.label}] 탐구 결과 및 생각해보기
                </span>

                <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
                  <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl space-y-1">
                    <span className="font-sans font-bold text-slate-800 block text-xs">정상 원본 기준</span>
                    <div>최댓값: {origStats.minMax.max} cm</div>
                    <div>평균값: {origStats.mean} cm</div>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                    <span className="font-sans font-bold text-emerald-900 block text-xs">현재 데이터 기준 (workingDataset)</span>
                    <div>최댓값: {workingStats.minMax.max} cm</div>
                    <div>평균값: {workingStats.mean} cm</div>
                  </div>
                </div>

                {outlierFeature === 'sepalLength' || outlierFeature === 'petalLength' ? (
                  <div className="p-3.5 bg-emerald-100 text-emerald-950 font-bold rounded-xl border border-emerald-200">
                    👏 잘못 입력된 이상치가 올바른 수치로 정제되어 {featureGuidance.base.label}의 평균과 수치 분포가 정상 복원되었습니다!
                  </div>
                ) : (
                  <div className="p-3.5 bg-blue-50 text-blue-950 font-bold rounded-xl border border-blue-200">
                    ℹ️ 이 속성({featureGuidance.base.label})에서는 정상 수치의 전체적인 분포 형태와 변화 범위를 관찰했습니다.
                  </div>
                )}

                {/* Feature Specific Reflection Question */}
                <div className="p-4 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold space-y-2">
                  <span className="text-sm block text-emerald-900 flex items-center gap-1.5">
                    <span>💡 [속성별 생각하기 질문]</span>
                  </span>
                  <p className="leading-relaxed text-xs font-extrabold">
                    "{featureGuidance.base.reflectionQuestion}"
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ACTIVITY 6: 표현과 데이터형 오류를 수정해보자 (표현 4개 & 자료형 2개 정제) */}
      {currentActivity === 6 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-600" />
                <span>활동 6. [같은 뜻인데 다르게 적혀 있다면?] (표현 4개 & 자료형 2개 정제)</span>
              </h3>
              <span className="text-xs font-mono font-extrabold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                표현: {4 - currentErrorCounts.inconsistent} / 4 | 자료형: {2 - currentErrorCounts.invalidType} / 2
              </span>
            </div>

            {/* Part A: Inconsistent Label Fix (4 items: 105, 106, 109, 114) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="font-extrabold text-slate-900 text-sm">Part A: 표현 불일치 정제 (총 4개)</span>
                <span className="font-mono text-emerald-800 font-bold">완료: {4 - currentErrorCounts.inconsistent} / 4</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {inconsistentItemsConfig.map((item, idx) => {
                  const rec = workingDataset.find(r => r.id === item.id);
                  const isFixed = rec && rec.species === item.target;

                  return (
                    <div key={item.id} className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                      <div className="flex justify-between items-center font-bold">
                        <span>데이터 #{item.id} ({item.desc})</span>
                        {isFixed ? <span className="text-emerald-700 font-black">✓ 완료</span> : <span className="text-rose-600 text-[10px]">오류</span>}
                      </div>

                      {idx === 0 && (
                        <p className="text-slate-500 text-[11px]">
                          품종 표기가 통일되지 않으면 머신러닝이 서로 다른 품종으로 인식합니다. 표준 표기로 지정하세요.
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <select
                          value={speciesChoices[item.id] || '세토사'}
                          onChange={e => setSpeciesChoices(prev => ({ ...prev, [item.id]: e.target.value }))}
                          className="p-2 border rounded-lg font-bold text-xs flex-1"
                        >
                          <option value="세토사">● 세토사 (Iris-setosa)</option>
                          <option value="버시컬러">▲ 버시컬러 (Iris-versicolor)</option>
                          <option value="버지니카">■ 버지니카 (Iris-virginica)</option>
                        </select>
                        <PrimaryButton size="sm" onClick={() => {
                          const val = speciesChoices[item.id];
                          const targetSpecies = val === '세토사' ? 'Iris-setosa' : val === '버시컬러' ? 'Iris-versicolor' : 'Iris-virginica';
                          handleApplyEdit({ recordId: item.id, field: 'species', before: item.current, after: targetSpecies, errorType: 'inconsistent' });
                        }}>통일</PrimaryButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Part B: Invalid String Data Type Fix (2 items: 107, 112) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="font-extrabold text-slate-900 text-sm">Part B: 데이터형 오류 정제 (총 2개)</span>
                <span className="font-mono text-emerald-800 font-bold">완료: {2 - currentErrorCounts.invalidType} / 2</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {invalidTypeItemsConfig.map((item, idx) => {
                  const rec = workingDataset.find(r => r.id === item.id);
                  const isFixed = rec && typeof (rec as any)[item.field] === 'number';

                  return (
                    <div key={item.id} className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                      <div className="flex justify-between items-center font-bold">
                        <span>데이터 #{item.id} ({item.fieldName}: "{item.beforeStr}")</span>
                        {isFixed ? <span className="text-emerald-700 font-black">✓ 완료</span> : <span className="text-rose-600 text-[10px]">오류</span>}
                      </div>

                      {idx === 0 ? (
                        <p className="text-slate-500 text-[11px]">
                          단위 문자열 'cm'이 포함되어 연산 오류가 발생합니다. 수치 데이터형(number)으로 변환하세요.
                        </p>
                      ) : (
                        <p className="text-slate-500 text-[11px]">
                          같은 방법으로 다음 자료형 오류도 숫자 형적으로 변환해보세요.
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => setTypeChoices(prev => ({ ...prev, [item.id]: 'num' }))}
                          className={`p-2 rounded-lg font-bold border text-xs flex-1 ${typeChoices[item.id] === 'num' ? 'bg-emerald-600 text-white' : 'bg-slate-100'}`}
                        >
                          숫자 ({item.expectedNum})
                        </button>
                        <PrimaryButton size="sm" onClick={() => {
                          if (typeChoices[item.id] === 'num') {
                            handleApplyEdit({ recordId: item.id, field: item.field, before: item.beforeStr, after: item.expectedNum, errorType: 'invalidType' });
                          }
                        }}>변환</PrimaryButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVITY 7: 데이터를 학습하기 좋은 형태로 바꿔보자 (Scaling & Encoding) */}
      {currentActivity === 7 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Sliders size={20} className="text-indigo-600" />
                <span>활동 7. [데이터를 학습하기 좋은 형태로 바꿔보자] (스케일링 & 인코딩)</span>
              </h3>
              <span className={`text-xs font-mono font-extrabold px-3 py-1 rounded-full border ${
                isTransformReady
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-indigo-50 text-indigo-800 border-indigo-200'
              }`}>
                체험 진행: {Number(isScalingExecuted) + Number(encodingChoice !== null)} / 2 개 완료
              </span>
            </div>

            {/* Part A: Min-Max Scaling */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <span className="font-extrabold text-slate-900 block text-sm">
                Part A: 수치형 데이터 스케일링 (Min-Max Scaling)
              </span>
              <p className="text-slate-600 leading-relaxed font-medium">
                특성들의 수치 범위(단위)가 크게 다르면 거리 계산 기반 알고리즘(k-NN 등)에서 특정 특성의 영향력이 지나치게 커질 수 있습니다. 스케일링을 통해 수치 범위를 0~1 사이로 균일하게 맞추어 볼 수 있습니다.
              </p>

              <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800">스케일링 대상 수치 속성 선택:</span>
                <div className="flex gap-1">
                  {(['sepalLength', 'sepalWidth', 'petalLength', 'petalWidth'] as FeatureKey[]).map(f => (
                    <button
                      key={f}
                      onClick={() => {
                        setScalingFeature(f);
                        setIsScalingExecuted(false);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
                        scalingFeature === f ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {NUMERIC_FEATURE_LABELS[f].short}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <SecondaryButton size="sm" onClick={() => setShowScalingFormula(!showScalingFormula)}>
                  {showScalingFormula ? '계산 수식 닫기' : '어떻게 계산하나요? (수식 보기)'}
                </SecondaryButton>
                <PrimaryButton size="sm" onClick={() => setIsScalingExecuted(true)}>
                  스케일링 실행 (0~1 변환)
                </PrimaryButton>
              </div>

              {showScalingFormula && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-950 font-mono text-[11px]">
                  변환 수식: (x - 최솟값) / (최댓값 - 최솟값) ➔ 결과: 최소 0.0, 최대 1.0
                </div>
              )}

              {isScalingExecuted && (
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 font-mono text-[11px]">
                  <span className="font-sans font-bold text-emerald-800 block text-xs">
                    [{NUMERIC_FEATURE_LABELS[scalingFeature].full}] 변환 체험 결과 (scaledPreview):
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-slate-50 rounded">원본 수치 범위: {origStats.minMax.min} ~ {origStats.minMax.max} cm</div>
                    <div className="p-2 bg-emerald-50 text-emerald-950 rounded font-bold">스케일링 범위: 0.00 ~ 1.00</div>
                  </div>
                  <p className="font-sans text-[11px] text-slate-600 pt-1">
                    💡 값의 범위는 0~1로 조정되었지만 데이터 간 상대적인 크기 비율과 순서 관계는 그대로 유지됩니다!
                  </p>
                </div>
              )}
            </div>

            {/* Part B: One-Hot Encoding */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <span className="font-extrabold text-slate-900 block text-sm">
                Part B: 범주형 데이터 인코딩 (One-Hot Encoding 원리)
              </span>
              <p className="text-slate-600 leading-relaxed font-medium">
                <SpeciesLabel species="Iris-setosa" size="xs" />, <SpeciesLabel species="Iris-versicolor" size="xs" />, <SpeciesLabel species="Iris-virginica" size="xs" /> 같은 문자로 된 범주를 머신러닝이 처리할 수 있는 숫자 표기([1,0,0], [0,1,0], [0,0,1])로 변환합니다.
              </p>

              <div className="w-full overflow-x-auto bg-white p-3 rounded-xl border border-slate-200">
                <table className="w-full text-center border-collapse font-mono text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-2 text-left font-sans">품종 범주</th>
                      <th className="p-2"><SpeciesLabel species="Iris-setosa" showEnglish size="xs" /></th>
                      <th className="p-2"><SpeciesLabel species="Iris-versicolor" showEnglish size="xs" /></th>
                      <th className="p-2"><SpeciesLabel species="Iris-virginica" showEnglish size="xs" /></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2 text-left font-bold font-sans"><SpeciesLabel species="Iris-setosa" size="xs" /></td>
                      <td className="p-2 font-bold text-emerald-700 bg-emerald-50">1</td>
                      <td className="p-2 text-slate-400">0</td>
                      <td className="p-2 text-slate-400">0</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-left font-bold font-sans"><SpeciesLabel species="Iris-versicolor" size="xs" /></td>
                      <td className="p-2 text-slate-400">0</td>
                      <td className="p-2 font-bold text-emerald-700 bg-emerald-50">1</td>
                      <td className="p-2 text-slate-400">0</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-left font-bold font-sans"><SpeciesLabel species="Iris-virginica" size="xs" /></td>
                      <td className="p-2 text-slate-400">0</td>
                      <td className="p-2 text-slate-400">0</td>
                      <td className="p-2 font-bold text-emerald-700 bg-emerald-50">1</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Student One-Hot Practice */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 flex items-center gap-1 text-xs">
                  <span>연습: 품종 '</span>
                  <SpeciesLabel species="Iris-versicolor" size="xs" />
                  <span>'를 원-핫 인코딩하면 어떻게 표현될까요?</span>
                </span>

                <div className="flex gap-2 font-mono">
                  {['[1, 0, 0]', '[0, 1, 0]', '[0, 0, 1]'].map(ans => (
                    <button
                      key={ans}
                      onClick={() => setEncodingChoice(ans)}
                      className={`p-2.5 rounded-lg border font-bold text-xs cursor-pointer ${
                        encodingChoice === ans
                          ? ans === '[0, 1, 0]'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-rose-600 text-white border-rose-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {ans}
                    </button>
                  ))}
                </div>
              </div>

              {/* y-target explanation note */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-950 font-bold leading-relaxed text-[11px]">
                ⚠️ <strong>중요 학습 포인트:</strong> 붓꽃 분류 문제에서 품종(species)은 예측하려는 정답(y)이므로 모델의 입력값(X)으로 넣지 않습니다. 이번 활동은 인코딩의 원리를 이해하는 인공지능 기초 체험입니다.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVITY 8: [내가 수정한 데이터 확인하기] */}
      {currentActivity === 8 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-600" />
              <span>활동 8. [내가 수정한 데이터 확인하기]</span>
            </h3>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <span className="font-extrabold text-slate-900 text-sm block">
                "전처리 활동에서 수정한 데이터가 실제 작업용 데이터에 어떻게 반영되었는지 확인해봅시다."
              </span>
              <p className="text-slate-600 leading-relaxed font-medium">
                내가 수정한 데이터는 실제 작업용 데이터셋(workingDataset)에 실시간으로 반영되어 다음 기계학습 단계(05~08)에 사용됩니다.
              </p>
            </div>

            {/* Conceptual Data Flow (A-8) */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs space-y-3 shadow-2xs">
              <span className="font-bold text-slate-800 block text-xs">[전처리 데이터 처리 흐름]</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center font-bold">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">1. 원본 데이터</span>
                  <span className="text-slate-800 text-xs">정상 기준 데이터</span>
                </div>
                <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                  <span className="text-[10px] text-rose-700 block">2. 활동 시작 데이터</span>
                  <span className="text-rose-900 text-xs">교육용 12개 오류 포함</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 block">3. 현재 데이터 (내가 수정)</span>
                  <span className="text-emerald-900 text-xs font-black">workingDataset</span>
                </div>
              </div>
            </div>

            {/* Error Counter Dynamic Pre vs Post Comparison Dashboard */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 text-sm">[전처리 전 / 후 데이터 오류 상태 비교]</span>
                <span className="text-xs font-mono font-bold text-slate-600">
                  남은 교육용 오류: <strong className={currentErrorCounts.total === 0 ? 'text-emerald-600 font-black' : 'text-rose-600 font-black'}>{currentErrorCounts.total}개</strong>
                </span>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full text-center border-collapse bg-white rounded-xl overflow-hidden font-mono text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-2.5 text-left font-sans">오류 유형</th>
                      <th className="p-2.5 text-rose-700 font-sans">전처리 전 (시작 데이터)</th>
                      <th className="p-2.5 text-emerald-800 font-sans">전처리 후 (workingDataset)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2.5 text-left font-bold text-slate-700">결측치 (Missing)</td>
                      <td className="p-2.5 text-rose-600 font-bold">4 개</td>
                      <td className={`p-2.5 font-black ${currentErrorCounts.missing === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{currentErrorCounts.missing} 개</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-left font-bold text-slate-700">입력 오류 이상치 (Outlier)</td>
                      <td className="p-2.5 text-rose-600 font-bold">2 개</td>
                      <td className={`p-2.5 font-black ${currentErrorCounts.outlier === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{currentErrorCounts.outlier} 개</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-left font-bold text-slate-700">표현 불일치 (Inconsistent)</td>
                      <td className="p-2.5 text-rose-600 font-bold">4 개</td>
                      <td className={`p-2.5 font-black ${currentErrorCounts.inconsistent === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{currentErrorCounts.inconsistent} 개</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-left font-bold text-slate-700">데이터형 오류 (Invalid Type)</td>
                      <td className="p-2.5 text-rose-600 font-bold">2 개</td>
                      <td className={`p-2.5 font-black ${currentErrorCounts.invalidType === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{currentErrorCounts.invalidType} 개</td>
                    </tr>
                    <tr className="bg-slate-50 font-extrabold text-xs">
                      <td className="p-2.5 text-left font-sans text-slate-900">총 정제 대상 (Total)</td>
                      <td className="p-2.5 text-rose-700 font-black">12 개</td>
                      <td className={`p-2.5 font-black text-sm ${currentErrorCounts.total === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{currentErrorCounts.total} 개</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {currentErrorCounts.total === 0 && (
                <div className="p-3.5 bg-emerald-100 text-emerald-950 rounded-xl font-black text-center text-xs shadow-2xs border border-emerald-300">
                  🎉 축하합니다! 발견된 교육용 데이터 정제 대상 12개를 모두 올바르게 수정했습니다! (남은 오류 = 0개)
                </div>
              )}
            </div>

            {/* Modified Records Cards Section (Collapsible) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                <div>
                  <span className="font-extrabold text-slate-900 text-sm block">
                    [내가 수정한 레코드 카드 (총 12개 정제 대상 전체)]
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-700">
                    수정한 데이터: <strong className="text-emerald-700">{uniqueModifiedRecordCount}개</strong> | 수정한 항목: <strong className="text-emerald-700">{module04Edits.length}개</strong>
                  </span>
                </div>
                <SecondaryButton
                  size="sm"
                  onClick={() => setIsModifiedCardsOpen(!isModifiedCardsOpen)}
                >
                  {isModifiedCardsOpen ? '수정 내역 접기' : '내가 수정한 데이터 자세히 보기 (12개 카드)'}
                </SecondaryButton>
              </div>

              {isModifiedCardsOpen && (
                <>
                  {module04Edits.length === 0 ? (
                    <div className="p-5 bg-white rounded-xl border border-slate-200 text-center space-y-2">
                      <span className="font-extrabold text-slate-800 text-sm block">
                        아직 직접 수정한 데이터가 없습니다.
                      </span>
                      <p className="text-slate-500 text-xs">
                        앞의 전처리 활동(활동 4~6)에서 결측치, 입력 오류 이상치, 표현 불일치, 자료형 오류를 직접 정제해보세요.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fadeIn">
                      {module04Edits.map((edit, idx) => {
                        const actualRecord = workingDataset.find(r => r.id === edit.recordId);
                        const actualVal = actualRecord ? (actualRecord as any)[edit.field] : edit.after;
                        const isValVerified = String(actualVal) === String(edit.after);

                        return (
                          <div key={idx} className="p-4 bg-white rounded-xl border border-slate-200 space-y-3 shadow-2xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="font-extrabold text-slate-900 text-sm">
                                [데이터 #{edit.recordId}]
                              </span>
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                                {getErrorReasonLabel(edit.errorType)}
                              </span>
                            </div>

                            <div className="font-bold text-slate-700 text-xs">
                              대상 속성: <span className="text-slate-900 font-mono">[{NUMERIC_FEATURE_LABELS[edit.field as FeatureKey]?.full || '품종'}]</span>
                            </div>

                            {/* Mobile & PC Before / After Comparison Cards */}
                            <div className="grid grid-cols-2 gap-2 text-center font-mono text-[11px]">
                              <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg space-y-0.5">
                                <span className="font-sans font-bold text-[10px] text-rose-700 block">수정 전</span>
                                <span className="font-bold text-rose-950 text-xs">{formatBeforeDisplay(edit)}</span>
                              </div>
                              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg space-y-0.5">
                                <span className="font-sans font-bold text-[10px] text-emerald-700 block">수정 후 (현재 반영)</span>
                                <span className="font-black text-emerald-950 text-xs">{formatAfterDisplay(edit)}</span>
                              </div>
                            </div>

                            {/* Real workingDataset validation check */}
                            <div className="text-[10px] text-slate-500 font-sans flex items-center justify-between pt-1 border-t border-slate-100">
                              <span>작업 데이터 검증:</span>
                              <span className={isValVerified ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                                {isValVerified ? '✓ workingDataset 일치' : '⚠️ 작업 데이터 검증 필요'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Full Preprocessed Dataset View & Pagination */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-extrabold text-slate-900 text-sm">
                  [전체 전처리 작업 데이터 (workingDataset: 총 {workingDataset.length}개)]
                </span>
                <SecondaryButton
                  size="sm"
                  onClick={() => setIsFullDatasetOpen(!isFullDatasetOpen)}
                  icon={<Table size={16} />}
                >
                  {isFullDatasetOpen ? '전체 20개 데이터 닫기' : '전체 20개 데이터 보기'}
                </SecondaryButton>
              </div>

              {isFullDatasetOpen && (
                <div className="space-y-3 pt-2">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="w-full overflow-x-auto">
                      <table className="w-full text-center border-collapse font-mono text-[11px]">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                            <th className="p-2">ID</th>
                            <th className="p-2">꽃받침 길이</th>
                            <th className="p-2">꽃받침 너비</th>
                            <th className="p-2">꽃잎 길이</th>
                            <th className="p-2">꽃잎 너비</th>
                            <th className="p-2">품종</th>
                            <th className="p-2">상태</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {currentFullDatasetSlice.map((rec: ErrorIrisRecord) => {
                            const isModified = module04Edits.some(e => e.recordId === rec.id);

                            return (
                              <tr key={rec.id} className={isModified ? 'bg-emerald-50/70 font-bold' : 'hover:bg-slate-50'}>
                                <td className="p-2 text-slate-500">#{rec.id}</td>
                                <td className="p-2">{rec.sepalLength !== null ? `${rec.sepalLength} cm` : '값 없음'}</td>
                                <td className="p-2">{rec.sepalWidth !== null ? `${rec.sepalWidth} cm` : '값 없음'}</td>
                                <td className="p-2">{rec.petalLength !== null ? `${rec.petalLength} cm` : '값 없음'}</td>
                                <td className="p-2">{rec.petalWidth !== null ? `${rec.petalWidth} cm` : '값 없음'}</td>
                                <td className="p-2 font-sans font-bold">
                                  {['Iris-setosa', 'Iris-versicolor', 'Iris-virginica'].includes(rec.species || '') ? (
                                    <SpeciesLabel species={rec.species} size="xs" />
                                  ) : (
                                    <span className="text-slate-500 font-normal">{rec.species}</span>
                                  )}
                                </td>
                                <td className="p-2">
                                  {isModified ? (
                                    <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-sans font-extrabold inline-flex items-center gap-0.5">
                                      <Check size={10} /> 수정됨
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 font-sans">일반</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 font-mono text-xs">
                      <SecondaryButton
                        size="sm"
                        disabled={fullDatasetPage === 1}
                        onClick={() => setFullDatasetPage(p => Math.max(1, p - 1))}
                      >
                        이전
                      </SecondaryButton>

                      <span className="font-bold text-slate-700">
                        페이지 {fullDatasetPage} / {totalFullPages}
                      </span>

                      <SecondaryButton
                        size="sm"
                        disabled={fullDatasetPage === totalFullPages}
                        onClick={() => setFullDatasetPage(p => Math.min(totalFullPages, p + 1))}
                      >
                        다음
                      </SecondaryButton>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Scaling / Encoding Preview Distinction Card */}
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2 text-xs text-indigo-950">
              <span className="font-extrabold block text-sm flex items-center gap-1.5">
                <Sliders size={16} className="text-indigo-600" />
                <span>[데이터 변환 체험 구분 안내]</span>
              </span>
              <p className="leading-relaxed">
                위 작업 데이터(workingDataset)에는 결측치·이상치·표현·자료형 정제 결과가 cm 수치로 저장되어 있습니다. Min-Max 스케일링(0~1) 및 원-핫 인코딩([1,0,0])은 AI 탐구를 위한 preview이며 원본 cm 수치를 덮어쓰지 않습니다.
              </p>
            </div>

            {/* Concluding Statement */}
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-1 text-center text-xs shadow-xs">
              <p className="font-bold leading-relaxed text-sm">
                "데이터 전처리는 설명을 읽는 활동이 아니라 실제 데이터를 확인하고 필요한 부분을 수정하는 과정입니다."
              </p>
              <p className="text-slate-300 text-xs">
                내가 수정한 결과가 실제 작업용 데이터에 정상적으로 반영되었습니다.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="text-xs text-slate-600 font-medium">💡 전처리 전/후 데이터 비교를 확인한 뒤 버튼을 눌러주세요.</span>
              <SecondaryButton
                size="sm"
                onClick={() => setAct8Confirmed(true)}
                className={act8Confirmed ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : ''}
              >
                {act8Confirmed ? '✓ 정제 결과 확인 완료' : '정제 결과 확인 완료'}
              </SecondaryButton>
            </div>

            {/* Module 04 Activity Only Reset Button */}
            <div className="pt-2 flex justify-between items-center border-t border-slate-200">
              <SecondaryButton
                size="sm"
                onClick={() => setIsResetConfirmOpen(true)}
                icon={<RotateCcw size={16} />}
              >
                데이터 전처리 활동 다시 시작
              </SecondaryButton>

              <span className="text-xs text-slate-500 font-medium">
                (다른 모듈 학습 기록은 유지됩니다)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVITY 9: 속성 사이의 관계를 알아보자 (산점도, 히트맵, 06 연동) */}
      {currentActivity === 9 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp size={20} className="text-teal-600" />
              <span>활동 9. [속성끼리는 어떤 관계가 있을까?] (산점도 & 상관계수 히트맵)</span>
            </h3>

            {/* 2D Scatter Plot */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-bold text-slate-800">2D 산점도 (Scatter Plot) 속성 조합 선택:</span>
                <div className="flex gap-2">
                  <select
                    value={scatterX}
                    onChange={e => setScatterX(e.target.value as FeatureKey)}
                    className="p-2 bg-white border border-slate-300 rounded-lg font-bold text-xs min-h-[44px] cursor-pointer"
                  >
                    <option value="petalLength">꽃잎 길이 (X축)</option>
                    <option value="sepalLength">꽃받침 길이 (X축)</option>
                    <option value="sepalWidth">꽃받침 너비 (X축)</option>
                    <option value="petalWidth">꽃잎 너비 (X축)</option>
                  </select>
                  <select
                    value={scatterY}
                    onChange={e => setScatterY(e.target.value as FeatureKey)}
                    className="p-2 bg-white border border-slate-300 rounded-lg font-bold text-xs min-h-[44px] cursor-pointer"
                  >
                    <option value="petalWidth">꽃잎 너비 (Y축)</option>
                    <option value="petalLength">꽃잎 길이 (Y축)</option>
                    <option value="sepalLength">꽃받침 길이 (Y축)</option>
                    <option value="sepalWidth">꽃받침 너비 (Y축)</option>
                  </select>
                </div>
              </div>

              <div className="w-full overflow-x-auto bg-white p-3 rounded-lg border border-slate-200">
                <svg viewBox="0 0 460 260" className="w-full h-auto min-w-[300px]">
                  <line x1="45" y1="220" x2="440" y2="220" stroke="#cbd5e1" strokeWidth="2" />
                  <line x1="45" y1="20" x2="45" y2="220" stroke="#cbd5e1" strokeWidth="2" />

                  <text x="240" y="250" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#475569">
                    {NUMERIC_FEATURE_LABELS[scatterX].full}
                  </text>
                  <text x="15" y="120" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#475569" transform="rotate(-90 15 120)">
                    {NUMERIC_FEATURE_LABELS[scatterY].full}
                  </text>

                  {(() => {
                    const origCleanX = extractValidNumericValues(ORIGINAL_IRIS_DATASET, scatterX);
                    const origCleanY = extractValidNumericValues(ORIGINAL_IRIS_DATASET, scatterY);
                    const minX = Math.min(...origCleanX);
                    const maxX = Math.max(...origCleanX);
                    const minY = Math.min(...origCleanY);
                    const maxY = Math.max(...origCleanY);

                    const mapX = (v: number) => 55 + ((v - minX) / (maxX - minX)) * 375;
                    const mapY = (v: number) => 210 - ((v - minY) / (maxY - minY)) * 185;

                    return ORIGINAL_IRIS_DATASET.map(r => {
                      const cx = mapX(r[scatterX]);
                      const cy = mapY(r[scatterY]);

                      if (r.species === 'Iris-setosa') {
                        return <circle key={r.id} cx={cx} cy={cy} r="3.5" fill="#10b981" opacity="0.75" />;
                      } else if (r.species === 'Iris-versicolor') {
                        return <rect key={r.id} x={cx - 3} y={cy - 3} width="6" height="6" fill="#3b82f6" opacity="0.75" rx="1" />;
                      } else {
                        return <polygon key={r.id} points={`${cx},${cy-4} ${cx+4},${cy+3} ${cx-4},${cy+3}`} fill="#8b5cf6" opacity="0.75" />;
                      }
                    });
                  })()}
                </svg>
              </div>
            </div>

            {/* 4x4 Pearson Correlation Heatmap */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <span className="font-bold text-slate-800 block">
                4×4 상관관계 히트맵 (Pearson Correlation Matrix)
              </span>

              <div className="w-full overflow-x-auto bg-white p-2 sm:p-3 rounded-lg border border-slate-200">
                <div className="w-full grid grid-cols-5 gap-1 text-center font-mono text-[10px] sm:text-[11px]">
                  <div className="p-1 sm:p-2 bg-slate-100 font-bold rounded flex items-center justify-center">속성</div>
                  <div className="p-1 sm:p-2 bg-slate-100 font-bold rounded flex items-center justify-center">받침길이</div>
                  <div className="p-1 sm:p-2 bg-slate-100 font-bold rounded flex items-center justify-center">받침너비</div>
                  <div className="p-1 sm:p-2 bg-slate-100 font-bold rounded flex items-center justify-center">꽃잎길이</div>
                  <div className="p-1 sm:p-2 bg-slate-100 font-bold rounded flex items-center justify-center">꽃잎너비</div>

                  {(['sepalLength', 'sepalWidth', 'petalLength', 'petalWidth'] as FeatureKey[]).map(rowFeat => (
                    <React.Fragment key={rowFeat}>
                      <div className="p-1 sm:p-2 bg-slate-100 font-bold rounded text-left flex items-center">
                        {NUMERIC_FEATURE_LABELS[rowFeat].short}
                      </div>
                      {(['sepalLength', 'sepalWidth', 'petalLength', 'petalWidth'] as FeatureKey[]).map(colFeat => {
                        const cell = correlationMatrix.cells.find((c: CorrelationCell) => c.featureX === rowFeat && c.featureY === colFeat);
                        const val = cell ? cell.correlation : 0;
                        const isHigh = val > 0.8 && rowFeat !== colFeat;

                        return (
                          <div
                            key={colFeat}
                            className={`p-1 sm:p-2 rounded font-extrabold flex items-center justify-center ${
                              isHigh
                                ? 'bg-emerald-600 text-white font-black shadow-xs'
                                : val > 0
                                ? 'bg-emerald-100 text-emerald-950'
                                : 'bg-rose-100 text-rose-950'
                            }`}
                          >
                            {val.toFixed(2)}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* Key Features Selection for Module 06 Integration */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <span className="font-bold text-slate-800 block text-sm flex items-center gap-1.5">
                <Target size={16} className="text-emerald-600" />
                <span>[핵심 속성 2개 선택] (06 알고리즘 실험실 시뮬레이터 연동)</span>
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['sepalLength', 'sepalWidth', 'petalLength', 'petalWidth'] as FeatureKey[]).map(feat => {
                  const isSelected = selectedFeatures04.includes(feat);

                  return (
                    <button
                      key={feat}
                      onClick={() => handleToggleFeature04(feat)}
                      className={`p-3 rounded-xl border-2 font-bold cursor-pointer transition-all min-h-[48px] flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-xs font-black">{NUMERIC_FEATURE_LABELS[feat].full}</span>
                      <span className="text-[10px] opacity-80">{isSelected ? '✓ 선택됨' : '선택하기'}</span>
                    </button>
                  );
                })}
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-950 font-bold text-[11px]">
                선택한 속성 2개: [{selectedFeatures04.map(f => NUMERIC_FEATURE_LABELS[f].full).join(', ')}] ➔ 06 알고리즘 실험실 진입 시 추천 속성으로 우선 연동됩니다.
              </div>
            </div>

            {/* Final Summary Card & Transition */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3 max-w-xl mx-auto text-xs">
              <div className="p-4 rounded-2xl bg-emerald-600 text-white font-extrabold text-sm shadow-xs">
                "데이터를 정리하고 시각화하면 이상치와 속성의 특징을 더 쉽게 발견할 수 있습니다."
              </div>

              <div className="pt-2">
                <PrimaryButton
                  size="lg"
                  fullWidth
                  disabled={selectedFeatures04.length !== 2}
                  onClick={onComplete}
                  icon={<ArrowRight size={20} />}
                >
                  {selectedFeatures04.length === 2
                    ? '05 기계학습 유형과 알고리즘 선정으로 이동'
                    : `핵심 속성 2개를 선택해 주세요 (${selectedFeatures04.length}/2)`}
                </PrimaryButton>
              </div>
            </div>

            <PromptCard promptText={promptText} title="생성형 AI 탐구 프롬프트" />
          </div>
        </div>
      )}

      {/* Minimal Activity Checklist */}
      <ActivityChecklist
        items={checklistItems}
        onProceedNext={() => setCurrentActivity(a => Math.min(totalActivities, a + 1))}
        isLastStep={currentActivity === totalActivities}
      />

      {/* Internal Step Control Navigation */}
      <div className="space-y-2 pt-3 border-t border-slate-200">
        {!isActivityCompleted && currentActivity < totalActivities && (
          <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-center font-medium animate-fadeIn">
            {currentActivity === 1 && '💡 수치형/범주형 분류와 입력 특성(X)/예측 목표(y) 역할 확인을 완료하면 다음 활동으로 이동할 수 있습니다.'}
            {currentActivity === 2 && '💡 데이터 정제 필요성 질문에 응답하면 다음 활동으로 이동할 수 있습니다.'}
            {currentActivity === 3 && `💡 20개 데이터 카드를 모두 한 번씩 판별해보세요. (현재 ${attemptedDetectiveCount} / ${workingDataset.length}개 완료)`}
            {currentActivity === 4 && `💡 4개의 결측치를 모두 수정한 뒤 다음 활동으로 이동할 수 있습니다. (남은 결측치: ${currentErrorCounts.missing}개)`}
            {currentActivity === 5 && `💡 2개의 이상치를 모두 수정한 뒤 다음 활동으로 이동할 수 있습니다. (남은 이상치: ${currentErrorCounts.outlier}개)`}
            {currentActivity === 6 && `💡 표현 불일치 4개와 자료형 오류 2개를 모두 수정한 뒤 다음 활동으로 이동할 수 있습니다. (남은 오류: ${currentErrorCounts.inconsistent + currentErrorCounts.invalidType}개)`}
            {currentActivity === 7 && '💡 스케일링을 한 번 실행하고 인코딩 문제에 응답하면 다음 활동으로 이동할 수 있습니다.'}
            {currentActivity === 8 && '💡 전처리 전/후 비교 결과를 확인한 뒤 [정제 결과 확인 완료]를 눌러주세요.'}
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          <SecondaryButton
            size="md"
            disabled={currentActivity === 1}
            onClick={() => setCurrentActivity(a => Math.max(1, a - 1))}
            icon={<ChevronLeft size={16} />}
          >
            이전 활동
          </SecondaryButton>

          {currentActivity < totalActivities ? (
            <PrimaryButton
              size="md"
              disabled={!isActivityCompleted}
              onClick={() => setCurrentActivity(a => Math.min(totalActivities, a + 1))}
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

      {/* Modal for Notebook Guide */}
      <Modal
        isOpen={isNotebookOpen}
        onClose={() => setIsNotebookOpen(false)}
        title="📖 [탐정 수첩] 정상 데이터 수치 기준"
      >
        <div className="space-y-4 text-xs text-slate-800 leading-relaxed">
          <p className="font-medium text-slate-600">
            정상 붓꽃 데이터의 수치 범위를 참조하여 문제 데이터를 찾아보세요!
          </p>

          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5 text-xs text-emerald-950">
            <span className="font-bold text-emerald-900 block">💡 탐정 관찰 요령 (무엇을 비교할까요?)</span>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-700">
              <li>같은 열의 다른 정상 데이터와 비교해보세요.</li>
              <li>값이 비어 있지는 않은지(—), 표현 방식이나 단위(cm)가 다른 값은 없는지 살펴보세요.</li>
              <li>수치 데이터의 단위(cm)와 값의 범위를 비교해보세요.</li>
              <li>다른 데이터와 비교했을 때 형태나 크기가 유난히 다른 값이 있는지 살펴보세요.</li>
            </ul>
          </div>

          <div className="space-y-2 font-mono text-[11px]">
            {[normalSampleSetosa, normalSampleVersicolor, normalSampleVirginica].map(rec => (
              <div key={rec.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between items-center font-bold text-emerald-800 font-sans">
                  <span>ID #{rec.id} (품종: {SPECIES_MAP[rec.species].korean})</span>
                  <span className="text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded">정상 데이터</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
                  <div>꽃받침 길이: {rec.sepalLength} cm</div>
                  <div>꽃받침 너비: {rec.sepalWidth} cm</div>
                  <div>꽃잎 길이: {rec.petalLength} cm</div>
                  <div>꽃잎 너비: {rec.petalWidth} cm</div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-right">
            <PrimaryButton size="sm" onClick={() => setIsNotebookOpen(false)}>
              수첩 닫기
            </PrimaryButton>
          </div>
        </div>
      </Modal>

      {/* Reset Confirmation Modal for Module 04 Only */}
      <Modal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        title="데이터 전처리 활동을 다시 시작할까요?"
      >
        <div className="space-y-4 text-xs text-slate-700">
          <p className="font-medium leading-relaxed">
            데이터 전처리 영역(04)에서 수정한 내역과 진행 상태만 초기화되고 처음 상태로 돌아갑니다.<br />
            <strong className="text-slate-900">(다른 모듈 학습 기록은 그대로 유지됩니다)</strong>
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsResetConfirmOpen(false)}
              className="px-4 py-2.5 font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer min-h-[44px]"
            >
              취소
            </button>
            <button
              onClick={() => {
                clearModule04DataOnly();
                setIsResetConfirmOpen(false);
              }}
              className="px-4 py-2.5 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer min-h-[44px]"
            >
              다시 시작
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
