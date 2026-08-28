import React, { useState, useMemo, useEffect } from 'react';
import { useActivityScrollTop } from '../../hooks/useActivityScrollTop';
import { ActivityProgress } from './ActivityProgress';
import { PromptCard } from './PromptCard';
import { StudentDataCard } from './StudentDataCard';
import { PrimaryButton } from '../common/PrimaryButton';
import { SecondaryButton } from '../common/SecondaryButton';
import { Modal } from '../common/Modal';
import {
  ORIGINAL_IRIS_DATASET,
  ERROR_IRIS_DATASET,
  SPECIES_MAP,
} from '../../data/irisDataset';
import type { ErrorIrisRecord } from '../../types/iris';
import { applyEditsToDataset } from '../../utils/irisHelpers';
import {
  type FeatureKey,
  NUMERIC_FEATURE_LABELS,
  calculateMean,
  calculateMedian,
  calculateBoxPlotStats,
  calculateHistogramBins,
  calculateCorrelationMatrix,
  calculateMinMax,
  extractValidNumericValues,
  getFeatureDynamicGuidance,
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
  Sparkles,
  Table,
  Check,
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

export const Module04Activity: React.FC<Module04ActivityProps> = ({ isCompleted: _isCompleted, onComplete }) => {
  const [currentActivity, setCurrentActivity] = useState(1);
  const totalActivities = 8;
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

  // Listen to resets (both Module 04 only reset and global reset)
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

  // ACTIVITY 1: Intro Q State
  const [act1Answer, setAct1Answer] = useState<string | null>(null);

  // ACTIVITY 2: Data Detective Choices
  const [detectiveAnswers, setDetectiveAnswers] = useState<Record<number, string>>({});

  // ACTIVITY 3: Missing Value State
  const [missingChoice, setMissingChoice] = useState<string | null>(null);
  const [showMissingGroundTruth, setShowMissingGroundTruth] = useState<boolean>(false);
  const [missingInputValue, setMissingInputValue] = useState<string>('');
  const [missingFeedback, setMissingFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // ACTIVITY 4: Outliers 5-Step Sub-Sequence (1/5 to 5/5)
  const [outlierStep, setOutlierStep] = useState<number>(1);
  const [outlierFeature, setOutlierFeature] = useState<FeatureKey>('sepalLength');
  const [showOutlierGroundTruth, setShowOutlierGroundTruth] = useState<boolean>(false);
  const [outlierInputValue, setOutlierInputValue] = useState<string>('');
  const [outlierFeedback, setOutlierFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // ACTIVITY 5: Inconsistent Labels & Invalid Types State
  const [speciesStandardChoice, setSpeciesStandardChoice] = useState<string>('세토사');
  const [typeChoice, setTypeChoice] = useState<string | null>(null);

  // ACTIVITY 6: Scaling & Encoding State
  const [scalingFeature, setScalingFeature] = useState<FeatureKey>('sepalLength');
  const [showScalingFormula, setShowScalingFormula] = useState<boolean>(false);
  const [isScalingExecuted, setIsScalingExecuted] = useState<boolean>(false);
  const [encodingChoice, setEncodingChoice] = useState<string | null>(null);

  // ACTIVITY 7: Full Dataset Review & Pagination State
  const [isFullDatasetOpen, setIsFullDatasetOpen] = useState<boolean>(false);
  const [fullDatasetPage, setFullDatasetPage] = useState<number>(1);
  const pageSize = 15;

  // ACTIVITY 8: Scatter, Heatmap, Key Features State
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

  // Track completion per activity entry
  useEffect(() => {
    if (currentActivity === 2) {
      setActivityCompletion(prev => ({ ...prev, detectiveComplete: true }));
    } else if (currentActivity === 6) {
      setActivityCompletion(prev => ({ ...prev, transformComplete: true }));
    } else if (currentActivity === 7) {
      setActivityCompletion(prev => ({ ...prev, reviewComplete: true }));
    } else if (currentActivity === 8) {
      setActivityCompletion(prev => ({ ...prev, relationComplete: true }));
    }
  }, [currentActivity]);

  // Automatically update keyFeaturesSelected completion status
  const isKeyFeaturesSelected = selectedFeatures04.length === 2;
  useEffect(() => {
    if (isKeyFeaturesSelected && currentActivity >= 7) {
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

  const boxPlotData = useMemo(() => calculateBoxPlotStats(workingValues), [workingValues]);
  const histogramBins = useMemo(() => calculateHistogramBins(workingValues, 7), [workingValues]);

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

  const promptText = `오류 데이터(결측치, 이상치, 표현 불일치, 데이터형 오류)가 포함된 붓꽃 데이터셋을 정제하고 Min-Max 스케일링 및 원-핫 인코딩으로 변환하는 전처리 과정이 기계학습 모델의 정확도에 미치는 영향을 설명해줘.`;

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

  return (
    <div className="space-y-6 scroll-mt-24" ref={topRef}>
      {/* Activity Progress */}
      <ActivityProgress
        currentStep={currentActivity}
        totalSteps={totalActivities}
        title={
          currentActivity === 1
            ? '활동 1. [개념] 왜 데이터를 정리해야 할까?'
            : currentActivity === 2
            ? '활동 2. [탐정] 데이터에서 문제를 찾아보자'
            : currentActivity === 3
            ? '활동 3. [결측치] 빠진 값을 어떻게 처리할까?'
            : currentActivity === 4
            ? `활동 4. [이상치] 이 값은 정말 이상한 값일까? (${outlierStep}/5 단계)`
            : currentActivity === 5
            ? '활동 5. [표현/자료형] 같은 뜻인데 다르게 적혀 있다면?'
            : currentActivity === 6
            ? '활동 6. [변환] 데이터를 학습하기 좋은 형태로 바꿔보자'
            : currentActivity === 7
            ? '활동 7. [확인] 내가 수정한 데이터 확인하기'
            : '활동 8. [관계] 속성끼리는 어떤 관계가 있을까?'
        }
      />

      {/* Main Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
            [공식 6단계 과정] ③ 데이터 전처리
          </span>
          <span className="text-xs text-slate-500 font-medium">04 데이터 전처리</span>
        </div>

        <h2 className="text-xl font-black text-slate-900">
          [데이터 전처리 실습: 오류 수정과 데이터 변환 체험]
        </h2>

        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          학생이 직접 <strong>결측치·이상치·표현불일치·자료형 오류</strong>를 찾아 수정하고, <strong>스케일링과 인코딩</strong>으로 변환해봅니다.
        </p>
      </div>

      {/* ACTIVITY 1: 왜 데이터를 정리해야 할까? */}
      {currentActivity === 1 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Layers size={20} className="text-emerald-600" />
              <span>활동 1. [왜 데이터를 정리해야 할까?]</span>
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

      {/* ACTIVITY 2: 데이터에서 문제를 찾아보자 */}
      {currentActivity === 2 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Search size={20} className="text-rose-600" />
              <span>활동 2. [데이터에서 문제를 찾아보자] (데이터 탐정)</span>
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              아래 데이터 카드들은 실제 붓꽃 데이터에 포함된 다양한 문제를 보여줍니다. 각 카드의 오류 종류를 직접 판별해보세요. (JSON 문자열 노출 없음)
            </p>

            {/* Detective Reference Notebook Sample */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
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
            </div>

            {/* Representative Error Cards */}
            <div className="space-y-4 pt-2">
              <span className="font-extrabold text-slate-900 text-xs block">
                🕵️ 탐색 대상 데이터 카드 4건:
              </span>

              {[
                { id: 101, rec: workingDataset.find(r => r.id === 101) || ERROR_IRIS_DATASET[0], expected: 'missing', title: '데이터 #101' },
                { id: 103, rec: workingDataset.find(r => r.id === 103) || ERROR_IRIS_DATASET[2], expected: 'outlier', title: '데이터 #103' },
                { id: 105, rec: workingDataset.find(r => r.id === 105) || ERROR_IRIS_DATASET[4], expected: 'inconsistent', title: '데이터 #105' },
                { id: 107, rec: workingDataset.find(r => r.id === 107) || ERROR_IRIS_DATASET[6], expected: 'invalidType', title: '데이터 #107' },
              ].map(card => (
                <div key={card.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 text-xs">
                  <StudentDataCard record={card.rec} title={card.title} />

                  <div className="space-y-1.5 pt-1">
                    <span className="font-bold text-slate-800 block text-[11px]">이 데이터의 문제는 무엇인가요?</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { type: 'missing', label: '결측치' },
                        { type: 'outlier', label: '이상치' },
                        { type: 'inconsistent', label: '표현 불일치' },
                        { type: 'invalidType', label: '데이터형 오류' },
                      ].map(opt => (
                        <button
                          key={opt.type}
                          onClick={() => setDetectiveAnswers(prev => ({ ...prev, [card.id]: opt.type }))}
                          className={`p-2 rounded-lg border font-bold text-center cursor-pointer transition-all min-h-[44px] ${
                            detectiveAnswers[card.id] === opt.type
                              ? opt.type === card.expected
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-rose-600 text-white border-rose-600'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {detectiveAnswers[card.id] && (
                      <div className={`p-2 rounded font-bold text-[11px] ${detectiveAnswers[card.id] === card.expected ? 'bg-emerald-100 text-emerald-950' : 'bg-rose-100 text-rose-950'}`}>
                        {detectiveAnswers[card.id] === card.expected
                          ? '✅ 정확하게 판별했습니다!'
                          : '💡 탐정 수첩 기준값과 비교해보세요.'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ACTIVITY 3: 결측치를 수정해보자 */}
      {currentActivity === 3 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <HelpCircle size={20} className="text-amber-600" />
              <span>활동 3. [빠진 값을 어떻게 처리할까?] (결측치 직접 수정)</span>
            </h3>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2">
              <span className="font-extrabold text-amber-900 block text-sm">
                📌 실제 결측치 사례: 데이터 #101 (세토사)
              </span>
              <p>
                데이터 #101의 <strong>꽃받침 길이(sepalLength)</strong> 값이 비어있어(null) 계산이 불가능한 상태입니다.
              </p>
            </div>

            {/* Strategy Selection */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <span className="font-extrabold text-slate-900 block text-sm">
                질문: 이 결측치를 어떻게 처리하면 좋을까요?
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
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ○ {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Compare with Original & Direct Fix */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-extrabold text-slate-900 text-sm">
                  [원본 데이터 비교 및 직접 수정]
                </span>
                <SecondaryButton size="sm" onClick={() => setShowMissingGroundTruth(true)}>
                  원본 데이터와 비교하기
                </SecondaryButton>
              </div>

              {showMissingGroundTruth && (
                <div className="p-3 bg-white rounded-lg border border-slate-200 grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="p-2 bg-rose-50 text-rose-950 rounded">
                    <span className="block font-sans text-[10px] text-rose-700">현재 오류 데이터 (#101)</span>
                    <span className="font-bold">꽃받침 길이: [값 없음]</span>
                  </div>
                  <div className="p-2 bg-emerald-50 text-emerald-950 rounded">
                    <span className="block font-sans text-[10px] text-emerald-700">정답 원본 데이터 (#1)</span>
                    <span className="font-bold">꽃받침 길이: 5.1 cm</span>
                  </div>
                </div>
              )}

              {/* Direct Entry Input */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                <label className="font-bold text-slate-800 block">
                  데이터 #101의 꽃받침 길이를 직접 입력하여 수정하세요:
                </label>

                <div className="flex items-center gap-2 max-w-xs">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="예: 5.1"
                    value={missingInputValue}
                    onChange={e => setMissingInputValue(e.target.value)}
                    className="p-2.5 border border-slate-300 rounded-xl font-mono text-sm w-36 focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-600">cm</span>
                  <PrimaryButton
                    size="sm"
                    onClick={() => {
                      const val = parseFloat(missingInputValue);
                      if (val === 5.1) {
                        handleApplyEdit({
                          recordId: 101,
                          field: 'sepalLength',
                          before: null,
                          after: 5.1,
                          errorType: 'missing',
                        });
                        setActivityCompletion(prev => ({ ...prev, missingComplete: true }));
                        setMissingFeedback({ type: 'success', msg: '🎉 빠진 값이 5.1cm로 채워져 이 속성을 정상 계산할 수 있게 되었습니다!' });
                      } else {
                        setMissingFeedback({ type: 'error', msg: '❌ 올바른 수치가 아닙니다. 원본 비교를 확인해보세요. (정답: 5.1)' });
                      }
                    }}
                  >
                    수정하기
                  </PrimaryButton>
                </div>

                {missingFeedback && (
                  <div className={`p-3 rounded-lg font-bold text-xs ${missingFeedback.type === 'success' ? 'bg-emerald-100 text-emerald-950' : 'bg-rose-100 text-rose-950'}`}>
                    {missingFeedback.msg}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVITY 4: 이상치를 찾아 수정해보자 (5단계 고정 순서 + 수치형 속성별 전용 안내) */}
      {currentActivity === 4 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <BarChart2 size={20} className="text-emerald-600" />
                <span>활동 4. [이 값은 정말 이상한 값일까?] (이상치 탐구 5단계 순서)</span>
              </h3>
              <span className="text-xs font-mono font-extrabold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                단계 {outlierStep} / 5
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
                        setOutlierInputValue('');
                        setOutlierFeedback(null);
                        setShowOutlierGroundTruth(false);
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

            {/* Outlier Sub-sequence Navigation Tabs */}
            <div className="flex flex-wrap gap-1.5 text-xs font-bold">
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

            {/* 1 / 5: 기초 통계량 (OutlierStatisticsStep) */}
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
                        <th className="p-2.5 text-emerald-800 font-sans">정상 원본 데이터</th>
                        <th className="p-2.5 text-rose-700 font-sans">현재 작업 데이터 (workingDataset)</th>
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
                        <td className="p-2.5 font-bold text-emerald-800">{origStats.minMax.max} cm</td>
                        <td className={`p-2.5 font-black ${workingStats.minMax.max > 20 ? 'text-rose-600 bg-rose-50' : 'text-slate-800'}`}>
                          {workingStats.minMax.max} cm {workingStats.minMax.max > 20 ? '⚠️' : ''}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-left font-bold text-slate-700">평균 (Mean)</td>
                        <td className="p-2.5 font-bold text-emerald-800">{origStats.mean} cm</td>
                        <td className="p-2.5 font-bold text-rose-700">{workingStats.mean} cm</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-left font-bold text-slate-700">중앙값 (Median)</td>
                        <td className="p-2.5 font-bold text-slate-800">{origStats.median} cm</td>
                        <td className="p-2.5 font-bold text-slate-800">{workingStats.median} cm</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Feature Specific Dynamic Guidance Box */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2 text-slate-800">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                    <Sparkles size={16} className="text-emerald-600" />
                    <span>[{featureGuidance.base.label}] 기초 통계 해석 & 데이터 관찰:</span>
                  </div>
                  <p className="font-medium leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px]">
                    📊 {featureGuidance.statsDiffNote}
                  </p>
                  <p className="font-bold text-rose-900 bg-rose-50 p-2.5 rounded-lg border border-rose-200 text-[11px]">
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

            {/* 2 / 5: 히스토그램 (OutlierHistogramStep) */}
            {outlierStep === 2 && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
                <div className="space-y-1">
                  <span className="font-extrabold text-slate-900 text-sm block">
                    2 / 5 [{featureGuidance.base.label}] 히스토그램 수치 구간별 분포 관찰
                  </span>
                  <p className="text-slate-600 font-medium leading-relaxed">
                    {featureGuidance.base.histogramGuide}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-700 text-[11px]">
                    [{featureGuidance.base.label}] 수치 구간별 데이터 개수 분포 (총 {workingStats.count}개):
                  </span>
                  <div className="w-full overflow-x-auto">
                    <svg viewBox="0 0 460 160" className="w-full h-auto min-w-[300px]">
                      <line x1="40" y1="130" x2="440" y2="130" stroke="#cbd5e1" strokeWidth="2" />
                      {histogramBins.map((bin, i) => {
                        const maxCount = Math.max(...histogramBins.map(b => b.count), 1);
                        const barHeight = (bin.count / maxCount) * 90;
                        const x = 50 + i * 55;
                        const y = 130 - barHeight;

                        return (
                          <g key={i}>
                            <rect
                              x={x}
                              y={y}
                              width="42"
                              height={Math.max(2, barHeight)}
                              fill={bin.binEnd > 20 ? '#e11d48' : '#3b82f6'}
                              fillOpacity="0.8"
                              rx="3"
                            />
                            <text x={x + 21} y={y - 5} textAnchor="middle" fontSize="10" fontWeight="bold" fill={bin.binEnd > 20 ? '#e11d48' : '#1e293b'}>
                              {bin.count}
                            </text>
                            <text x={x + 21} y="145" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#64748b">
                              {bin.binStart}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>

                {/* Feature Specific Histogram Question */}
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

            {/* 3 / 5: 박스플롯 (OutlierBoxplotStep) */}
            {outlierStep === 3 && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
                <div className="space-y-1">
                  <span className="font-extrabold text-slate-900 text-sm block">
                    3 / 5 [{featureGuidance.base.label}] 박스플롯 IQR 범위 및 이상치 후보 시각화
                  </span>
                  <p className="text-slate-600 font-medium leading-relaxed">
                    {featureGuidance.base.boxplotGuide}
                  </p>
                </div>

                <div className="w-full overflow-x-auto bg-white p-3 rounded-xl border border-slate-200">
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
                          <line x1={paddingX} y1={130} x2={paddingX + plotWidth} y2={130} stroke="#cbd5e1" strokeWidth="2" />
                          <line x1={getX(stats.lowerFence)} y1={20} x2={getX(stats.lowerFence)} y2={120} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 4" />
                          <line x1={getX(stats.upperFence)} y1={20} x2={getX(stats.upperFence)} y2={120} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 4" />

                          <line x1={xMinWhisker} y1={midY} x2={xQ1} y2={midY} stroke="#475569" strokeWidth="2" />
                          <line x1={xMinWhisker} y1={midY - 15} x2={xMinWhisker} y2={midY + 15} stroke="#475569" strokeWidth="2" />

                          <line x1={xQ3} y1={midY} x2={xMaxWhisker} y2={midY} stroke="#475569" strokeWidth="2" />
                          <line x1={xMaxWhisker} y1={midY - 15} x2={xMaxWhisker} y2={midY + 15} stroke="#475569" strokeWidth="2" />

                          <rect x={xQ1} y={boxY} width={Math.max(4, xQ3 - xQ1)} height={boxHeight} fill="#3b82f6" fillOpacity="0.25" stroke="#2563eb" strokeWidth="2.5" rx="4" />
                          <line x1={xMedian} y1={boxY} x2={xMedian} y2={boxY + boxHeight} stroke="#1d4ed8" strokeWidth="3" />

                          {stats.outliers.map((outlierVal, i) => (
                            <g key={i}>
                              <circle cx={getX(outlierVal)} cy={midY} r="6" fill="#e11d48" stroke="#ffffff" strokeWidth="2" />
                              <text x={getX(outlierVal)} y={midY - 12} textAnchor="middle" fontSize="10" fontWeight="black" fill="#e11d48">
                                {outlierVal}cm
                              </text>
                            </g>
                          ))}

                          <text x={xQ1} y={boxY + boxHeight + 15} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#3b82f6">Q1 ({stats.q1})</text>
                          <text x={xMedian} y={boxY - 8} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1d4ed8">중앙값 ({stats.median})</text>
                          <text x={xQ3} y={boxY + boxHeight + 15} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#3b82f6">Q3 ({stats.q3})</text>
                        </g>
                      );
                    })()}
                  </svg>
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

            {/* 4 / 5: 원본 확인 및 수정 (OutlierEditStep) */}
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
                      <SecondaryButton size="sm" onClick={() => setShowOutlierGroundTruth(true)}>
                        원본 데이터 확인
                      </SecondaryButton>
                    </div>

                    {showOutlierGroundTruth && (
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
                          value={outlierInputValue}
                          onChange={e => setOutlierInputValue(e.target.value)}
                          className="p-2.5 border border-slate-300 rounded-xl font-mono text-sm w-36 focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="font-bold text-slate-600">cm</span>
                        <PrimaryButton
                          size="sm"
                          onClick={() => {
                            const val = parseFloat(outlierInputValue);
                            const expectedVal = outlierFeature === 'sepalLength' ? 5.0 : 1.5;
                            const targetId = outlierFeature === 'sepalLength' ? 103 : 104;
                            const wrongVal = outlierFeature === 'sepalLength' ? 50.0 : 30.0;

                            if (val === expectedVal) {
                              handleApplyEdit({
                                recordId: targetId,
                                field: outlierFeature,
                                before: wrongVal,
                                after: expectedVal,
                                errorType: 'outlier',
                              });
                              setActivityCompletion(prev => ({ ...prev, outlierComplete: true }));
                              setOutlierFeedback({ type: 'success', msg: `🎉 ${expectedVal}cm로 올바르게 수정되었습니다!` });
                              setOutlierStep(5);
                            } else {
                              setOutlierFeedback({ type: 'error', msg: `❌ 올바른 수치가 아닙니다. 원본 비교를 확인해보세요. (정답: ${expectedVal})` });
                            }
                          }}
                        >
                          수정하기
                        </PrimaryButton>
                      </div>

                      {outlierFeedback && (
                        <div className={`p-3 rounded-lg font-bold text-xs ${outlierFeedback.type === 'success' ? 'bg-emerald-100 text-emerald-950' : 'bg-rose-100 text-rose-950'}`}>
                          {outlierFeedback.msg}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 text-slate-700">
                    <span className="font-extrabold text-slate-900 block text-sm">
                      ℹ️ [{featureGuidance.base.label}] 관찰 안내:
                    </span>
                    <p className="leading-relaxed">
                      현재 데이터셋에서 <strong>{featureGuidance.base.label}</strong> 속성에는 의도적인 이상치 오타가 들어있지 않습니다. 박스플롯과 히스토그램에서 이 속성의 전체적인 수치 분포 범위를 관찰하는 용도로 활용하세요.
                    </p>
                    <div className="pt-2">
                      <PrimaryButton size="sm" onClick={() => setOutlierStep(5)}>
                        다음: 5/5 결과 확인 및 생각하기
                      </PrimaryButton>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5 / 5: 수정 결과 확인 & 생각하기 (OutlierResultStep) */}
            {outlierStep === 5 && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
                <span className="font-extrabold text-slate-900 text-sm block">
                  5 / 5 [{featureGuidance.base.label}] 수정 결과 및 생각해보기
                </span>

                <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
                  <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl space-y-1">
                    <span className="font-sans font-bold text-slate-800 block text-xs">원본 데이터 기준</span>
                    <div>최댓값: {origStats.minMax.max} cm</div>
                    <div>평균값: {origStats.mean} cm</div>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                    <span className="font-sans font-bold text-emerald-900 block text-xs">현재 데이터 기준 (workingDataset)</span>
                    <div>최댓값: {workingStats.minMax.max} cm</div>
                    <div>평균값: {workingStats.mean} cm</div>
                  </div>
                </div>

                {/* Feature Specific Reflection Question */}
                <div className="p-4 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold space-y-2">
                  <span className="text-sm block text-emerald-900 flex items-center gap-1.5">
                    <Sparkles size={16} />
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

      {/* ACTIVITY 5: 표현과 데이터형 오류를 수정해보자 */}
      {currentActivity === 5 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-600" />
              <span>활동 5. [같은 뜻인데 다르게 적혀 있다면?] (표현 & 데이터형 정제)</span>
            </h3>

            {/* Current Data Error Status Counter Dashboard */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-800 block text-sm">[현재 데이터 상태 요약]</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-sans">결측치</span>
                  <span className="font-bold text-slate-800 text-sm">{currentErrorCounts.missing} 개</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-sans">이상치</span>
                  <span className="font-bold text-slate-800 text-sm">{currentErrorCounts.outlier} 개</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-sans">표현 불일치</span>
                  <span className="font-bold text-slate-800 text-sm">{currentErrorCounts.inconsistent} 개</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-sans">데이터형 오류</span>
                  <span className="font-bold text-slate-800 text-sm">{currentErrorCounts.invalidType} 개</span>
                </div>
              </div>
            </div>

            {/* Part A: Inconsistent Label Fix */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <span className="font-extrabold text-slate-900 block text-sm">
                Part A: 표현 불일치 정제 (데이터 #105 "setosa" ➔ "Iris-setosa")
              </span>
              <p className="text-slate-600 leading-relaxed">
                데이터 #105의 품종명이 'setosa'로 소문자로 표기되어 표기가 통일되지 않았습니다. 표준 품종 표현으로 통일하세요.
              </p>

              <div className="flex items-center gap-3">
                <select
                  value={speciesStandardChoice}
                  onChange={e => setSpeciesStandardChoice(e.target.value)}
                  className="p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs cursor-pointer min-h-[44px]"
                >
                  <option value="세토사">세토사 (Iris-setosa)</option>
                  <option value="버시컬러">버시컬러 (Iris-versicolor)</option>
                  <option value="버지니카">버지니카 (Iris-virginica)</option>
                </select>

                <PrimaryButton
                  size="sm"
                  onClick={() => {
                    handleApplyEdit({
                      recordId: 105,
                      field: 'species',
                      before: 'setosa',
                      after: 'Iris-setosa',
                      errorType: 'inconsistent',
                    });
                    setActivityCompletion(prev => ({ ...prev, formatTypeComplete: true }));
                  }}
                >
                  표현 통일하기
                </PrimaryButton>
              </div>
            </div>

            {/* Part B: Invalid String Data Type Fix */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <span className="font-extrabold text-slate-900 block text-sm">
                Part B: 데이터형 오류 정제 (데이터 #107 꽃받침 길이 "5.1cm" ➔ 숫자 5.1)
              </span>
              <p className="text-slate-600 leading-relaxed">
                데이터 #107의 꽃받침 길이에 '5.1cm' 단위 문자열이 섞여있어 수학 연산 시 오류를 발생시킵니다.
              </p>

              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setTypeChoice('num')}
                    className={`px-3 py-2 rounded-xl font-bold border min-h-[44px] cursor-pointer ${typeChoice === 'num' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'}`}
                  >
                    숫자 (number)
                  </button>
                  <button
                    onClick={() => setTypeChoice('str')}
                    className={`px-3 py-2 rounded-xl font-bold border min-h-[44px] cursor-pointer ${typeChoice === 'str' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-700 border-slate-200'}`}
                  >
                    문자 (string)
                  </button>
                </div>

                <PrimaryButton
                  size="sm"
                  onClick={() => {
                    if (typeChoice === 'num') {
                      handleApplyEdit({
                        recordId: 107,
                        field: 'sepalLength',
                        before: '5.1cm',
                        after: 5.1,
                        errorType: 'invalidType',
                      });
                      setActivityCompletion(prev => ({ ...prev, formatTypeComplete: true }));
                    }
                  }}
                >
                  숫자로 변환하기
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVITY 6: 데이터를 학습하기 좋은 형태로 바꿔보자 (Scaling & Encoding) */}
      {currentActivity === 6 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Sliders size={20} className="text-indigo-600" />
              <span>활동 6. [데이터를 학습하기 좋은 형태로 바꿔보자] (스케일링 & 인코딩)</span>
            </h3>

            {/* Part A: Min-Max Scaling */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <span className="font-extrabold text-slate-900 block text-sm">
                Part A: 수치형 데이터 스케일링 (Min-Max Scaling)
              </span>
              <p className="text-slate-600 leading-relaxed font-medium">
                속성들의 수치 범위가 다르면 거리 계산 기반 알고리즘(k-NN 등)이 특정 속성에 편향될 수 있습니다. 모든 수치를 0~1 범위로 맞춥니다.
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
                    💡 값의 범위는 0~1로 조정되었지만 데이터 간 상대적인 크기 및 순서 관계는 완벽히 유지됩니다!
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
                세토사, 버시컬러, 버지니카 같은 문자로 된 범주를 머신러닝이 처리할 수 있는 숫자 표기([1,0,0], [0,1,0], [0,0,1])로 변환합니다.
              </p>

              <div className="w-full overflow-x-auto bg-white p-3 rounded-xl border border-slate-200">
                <table className="w-full text-center border-collapse font-mono text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-2 text-left font-sans">품종 범주</th>
                      <th className="p-2">세토사 (Setosa)</th>
                      <th className="p-2">버시컬러 (Versicolor)</th>
                      <th className="p-2">버지니카 (Virginica)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2 text-left font-bold font-sans">세토사</td>
                      <td className="p-2 font-bold text-emerald-700 bg-emerald-50">1</td>
                      <td className="p-2 text-slate-400">0</td>
                      <td className="p-2 text-slate-400">0</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-left font-bold font-sans">버시컬러</td>
                      <td className="p-2 text-slate-400">0</td>
                      <td className="p-2 font-bold text-emerald-700 bg-emerald-50">1</td>
                      <td className="p-2 text-slate-400">0</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-left font-bold font-sans">버지니카</td>
                      <td className="p-2 text-slate-400">0</td>
                      <td className="p-2 text-slate-400">0</td>
                      <td className="p-2 font-bold text-emerald-700 bg-emerald-50">1</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Student One-Hot Practice */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-xs">
                  연습: 품종 '버시컬러'를 원-핫 인코딩하면 어떻게 표현될까요?
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

      {/* ACTIVITY 7: [내가 수정한 데이터 확인하기] */}
      {currentActivity === 7 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-600" />
              <span>활동 7. [내가 수정한 데이터 확인하기]</span>
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

            {/* Error Counter Dashboard & Status Note (A-7) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 text-sm">[전처리 후 현재 데이터 오류 상태]</span>
                <span className="text-xs font-mono font-bold text-slate-600">
                  남은 오류: {currentErrorCounts.total}개
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono text-[11px]">
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-sans">결측치</span>
                  <span className={`font-black text-sm ${currentErrorCounts.missing === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {currentErrorCounts.missing} 개
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-sans">이상치</span>
                  <span className={`font-black text-sm ${currentErrorCounts.outlier === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {currentErrorCounts.outlier} 개
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-sans">표현 불일치</span>
                  <span className={`font-black text-sm ${currentErrorCounts.inconsistent === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {currentErrorCounts.inconsistent} 개
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-sans">데이터형 오류</span>
                  <span className={`font-black text-sm ${currentErrorCounts.invalidType === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {currentErrorCounts.invalidType} 개
                  </span>
                </div>
              </div>

              {currentErrorCounts.total === 0 && (
                <div className="p-3 bg-emerald-100 text-emerald-950 rounded-lg font-black text-center text-xs shadow-2xs">
                  🎉 현재 발견된 교육용 데이터 오류를 모두 올바르게 수정했습니다!
                </div>
              )}
            </div>

            {/* A-1, A-2, A-3, A-10, A-11: Modified Records Cards Section */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                <span className="font-extrabold text-slate-900 text-sm">
                  [내가 수정한 레코드 카드]
                </span>
                <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                  수정한 데이터: <strong className="text-emerald-700">{uniqueModifiedRecordCount}개</strong> | 수정한 항목: <strong className="text-emerald-700">{module04Edits.length}개</strong>
                </span>
              </div>

              {module04Edits.length === 0 ? (
                <div className="p-5 bg-white rounded-xl border border-slate-200 text-center space-y-2">
                  <span className="font-extrabold text-slate-800 text-sm block">
                    아직 직접 수정한 데이터가 없습니다.
                  </span>
                  <p className="text-slate-500 text-xs">
                    앞의 전처리 활동(활동 3~5)에서 결측치, 이상치, 표현 불일치, 데이터형 오류를 직접 수정해보세요.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                        {/* Mobile & PC Before / After Comparison Cards (A-2) */}
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

                        {/* Real workingDataset validation check (A-3) */}
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
            </div>

            {/* A-4, A-5, A-6: Full Preprocessed Dataset View & Pagination */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 text-sm">
                  [전체 전처리 작업 데이터 (workingDataset: 총 {workingDataset.length}개)]
                </span>
                <PrimaryButton
                  size="sm"
                  onClick={() => setIsFullDatasetOpen(!isFullDatasetOpen)}
                  icon={<Table size={16} />}
                >
                  {isFullDatasetOpen ? '전체 데이터 닫기' : '전체 전처리 데이터 보기'}
                </PrimaryButton>
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
                                  {rec.species === 'Iris-setosa' ? '세토사' : rec.species === 'Iris-versicolor' ? '버시컬러' : rec.species === 'Iris-virginica' ? '버지니카' : rec.species}
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

                    {/* Pagination Controls (A-5) */}
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

            {/* A-9: Scaling / Encoding Preview Distinction Card */}
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2 text-xs text-indigo-950">
              <span className="font-extrabold block text-sm flex items-center gap-1.5">
                <Sliders size={16} className="text-indigo-600" />
                <span>[데이터 변환 체험 구분 안내]</span>
              </span>
              <p className="leading-relaxed">
                위 작업 데이터(workingDataset)에는 결측치·이상치·표현·자료형 정제 결과가 cm 수치로 저장되어 있습니다. Min-Max 스케일링(0~1) 및 원-핫 인코딩([1,0,0])은 AI 탐구를 위한preview이며 원본 cm 수치를 덮어쓰지 않습니다.
              </p>
            </div>

            {/* A-14: Concluding Statement */}
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-1 text-center text-xs shadow-xs">
              <p className="font-bold leading-relaxed text-sm">
                "데이터 전처리는 설명을 읽는 활동이 아니라 실제 데이터를 확인하고 필요한 부분을 수정하는 과정입니다."
              </p>
              <p className="text-slate-300 text-xs">
                내가 수정한 결과가 실제 작업용 데이터에 완벽하게 반영되었습니다.
              </p>
            </div>

            {/* Module 04 Activity Only Reset Button (A-12) */}
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

      {/* ACTIVITY 8: 속성 사이의 관계를 알아보자 (산점도, 히트맵, 06 연동) */}
      {currentActivity === 8 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp size={20} className="text-teal-600" />
              <span>활동 8. [속성끼리는 어떤 관계가 있을까?] (산점도 & 상관계수 히트맵)</span>
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
                        const cell = correlationMatrix.cells.find(c => c.featureX === rowFeat && c.featureY === colFeat);
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
                <PrimaryButton size="lg" fullWidth onClick={onComplete} icon={<ArrowRight size={20} />}>
                  05 기계학습 유형과 알고리즘 선정으로 이동
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
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
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
            <strong className="text-slate-900">(다른 모듈의 학습 기록은 그대로 유지됩니다)</strong>
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
