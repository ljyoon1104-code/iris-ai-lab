import React, { useState, useMemo } from 'react';
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
import { cloneDataset } from '../../utils/irisHelpers';
import {
  type FeatureKey,
  NUMERIC_FEATURE_LABELS,
  calculateMean,
  calculateMedian,
  calculateQuartiles,
  calculateBoxPlotStats,
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
  Info,
  ArrowRight,
  Target,
} from 'lucide-react';
import { ActivityChecklist } from './ActivityChecklist';
import { SELECTED_FEATURES_KEY } from '../../utils/storage';

interface Module04ActivityProps {
  isCompleted: boolean;
  onComplete: () => void;
}

export const Module04Activity: React.FC<Module04ActivityProps> = ({ isCompleted: _isCompleted, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 9; // 9 structured learning steps
  const topRef = useActivityScrollTop<HTMLDivElement>(currentStep);

  // Completion criteria trackers
  const [visitedStats, setVisitedStats] = useState(false);
  const [visitedHistogram, setVisitedHistogram] = useState(false);
  const [visitedBoxplot, setVisitedBoxplot] = useState(false);
  const [changedScatterPair, setChangedScatterPair] = useState(false);
  const [visitedHeatmap, setVisitedHeatmap] = useState(false);

  // Data Detective Working Dataset & Notebook States
  const [workingDataset] = useState<ErrorIrisRecord[]>(() => cloneDataset(ERROR_IRIS_DATASET));
  const [detectiveSetIndex] = useState(0); // 0 to 3 (4 sets of 5)
  const [isNotebookOpen, setIsNotebookOpen] = useState<boolean>(false);

  // STEP 5: [이상치를 데이터로 확인해볼까?] State
  const [selectedFeature, setSelectedFeature] = useState<FeatureKey>('sepalLength'); // Initial feature with clear outlier

  // STEP 7: [속성끼리는 어떤 관계가 있을까?] State
  const [scatterX, setScatterX] = useState<FeatureKey>('petalLength');
  const [scatterY, setScatterY] = useState<FeatureKey>('petalWidth');

  // STEP 8: [핵심 속성 2개 선택] State (Section 3)
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
  const [featureSelectionReason, setFeatureSelectionReason] = useState<string | null>(null);

  // Real 3 Normal Iris Records from ORIGINAL_IRIS_DATASET
  const normalSampleSetosa = ORIGINAL_IRIS_DATASET[0]; // ID 1
  const normalSampleVersicolor = ORIGINAL_IRIS_DATASET[50]; // ID 51
  const normalSampleVirginica = ORIGINAL_IRIS_DATASET[100]; // ID 101

  // Calculate statistics dynamically
  const origCleanValues = useMemo(() => {
    return extractValidNumericValues(ORIGINAL_IRIS_DATASET, selectedFeature);
  }, [selectedFeature]);

  const errorAllValues = useMemo(() => {
    return extractValidNumericValues(ERROR_IRIS_DATASET, selectedFeature);
  }, [selectedFeature]);

  const origStats = useMemo(() => {
    return {
      mean: calculateMean(origCleanValues),
      median: calculateMedian(origCleanValues),
      quartiles: calculateQuartiles(origCleanValues),
    };
  }, [origCleanValues]);

  const errorStats = useMemo(() => {
    return {
      mean: calculateMean(errorAllValues),
      median: calculateMedian(errorAllValues),
      quartiles: calculateQuartiles(errorAllValues),
    };
  }, [errorAllValues]);

  const boxPlotData = useMemo(() => {
    return calculateBoxPlotStats(errorAllValues);
  }, [errorAllValues]);

  const correlationMatrix = useMemo(() => {
    return calculateCorrelationMatrix(ORIGINAL_IRIS_DATASET);
  }, []);

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

  // Detective current subset (5 records)
  const currentDetectiveRecords = workingDataset.slice(detectiveSetIndex * 5, (detectiveSetIndex + 1) * 5);

  const promptText = `오류 데이터(결측치, 이상치, 표현 불일치, 데이터형 오류)가 포함된 붓꽃 데이터셋을 [기초 통계량 → 히스토그램 → 박스플롯 → 산점도 → 히트맵] 순으로 탐구할 때, 각 시각화 도구가 이상치와 속성 간 관계를 발견하는 데 가지는 고유한 역할 3가지를 정리해줘.`;

  // Checklist items
  const checklistItems = [
    { id: 'stats', label: '기초 통계량 비교 확인', isCompleted: visitedStats || currentStep >= 5 },
    { id: 'hist', label: '히스토그램 관찰', isCompleted: visitedHistogram || currentStep >= 5 },
    { id: 'box', label: '박스플롯 이상치 확인', isCompleted: visitedBoxplot || currentStep >= 5 },
    { id: 'scatter', label: '산점도 속성 조합 변경', isCompleted: changedScatterPair || currentStep >= 7 },
    { id: 'heatmap', label: '상관계수 히트맵 확인', isCompleted: visitedHeatmap || currentStep >= 7 },
    { id: 'features', label: '핵심 속성 2개 선택 (06 실험 연동)', isCompleted: selectedFeatures04.length === 2 },
  ];

  return (
    <div className="space-y-6 scroll-mt-24" ref={topRef}>
      {/* Activity Progress */}
      <ActivityProgress
        currentStep={currentStep}
        totalSteps={totalSteps}
        title={
          currentStep === 1
            ? '[확인 단계] 1. 데이터 유형과 역할 확인 (수치형/범주형, X/y)'
            : currentStep === 2
            ? '[관찰 단계] 2. 정상 데이터 관찰 (탐정 수첩)'
            : currentStep === 3
            ? '[찾기 단계] 3. 오류 데이터 찾기 (탐정 활동)'
            : currentStep === 4
            ? '[판별 단계] 4. 오류 종류 판별하기'
            : currentStep === 5
            ? '[확인 단계] 5. 이상치를 통계와 시각화로 확인'
            : currentStep === 6
            ? '[처리 단계] 6. 적절한 전처리 방법 판단'
            : currentStep === 7
            ? '[관찰 단계] 7. 속성 간 관계 확인 (산점도 & 히트맵)'
            : currentStep === 8
            ? '[선택 단계] 8. 핵심 속성 2개 선택 (06 실험 연동)'
            : '[비교/완료 단계] 9. 전처리 전/후 비교 및 마무리'
        }
      />

      {/* Intro Question & Stage Badge Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
            [공식 6단계 과정] ③ 데이터 전처리
          </span>
          <span className="text-xs text-slate-500 font-medium">04 데이터 전처리</span>
        </div>

        <h2 className="text-xl font-black text-slate-900">
          [데이터 전처리: 오류를 찾고 관찰하여 정제하기]
        </h2>

        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          데이터를 무작정 수정하거나 삭제하지 않고, <strong>"확인 ➔ 관찰 ➔ 찾기 ➔ 판별 ➔ 처리 ➔ 속성선택"</strong>의 정밀한 흐름을 거칩니다.
        </p>
      </div>

      {/* STEP 1: 데이터 유형과 역할 확인 */}
      {currentStep === 1 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Layers size={20} className="text-emerald-600" />
              <span>[확인 단계] 활동 1: 수치형/범주형 데이터 및 X(특성) / y(라벨) 구분</span>
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              붓꽃 데이터의 각 속성이 수치(cm)를 나타내는지, 명칭(범주)을 나타내는지 확인하고 머신러닝에서의 역할을 구분합니다.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                <span className="font-extrabold text-emerald-900 block text-xs">📏 수치형 데이터 (Continuous Numeric)</span>
                <p className="text-emerald-800 font-medium leading-relaxed">
                  꽃받침과 꽃잎의 길이나 너비처럼 연속된 숫자 수치(cm)를 가진 데이터입니다.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-1">
                <span className="font-extrabold text-blue-900 block text-xs">🏷️ 범주형 데이터 (Categorical)</span>
                <p className="text-blue-800 font-medium leading-relaxed">
                  세토사, 버시컬러, 버지니카처럼 몇 개의 종류나 범주(품종)로 분류되는 데이터입니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: 정상 데이터 관찰 (탐정 수첩) */}
      {currentStep === 2 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen size={20} className="text-emerald-600" />
              <span>[관찰 단계] 활동 2: 정상 붓꽃 데이터 관찰하기 (탐정 수첩)</span>
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              오류를 찾기 전에 먼저 문제없는 정상 데이터의 수치 범위와 특징 형태를 눈여겨봅니다.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {[normalSampleSetosa, normalSampleVersicolor, normalSampleVirginica].map(rec => (
                <div key={rec.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center font-bold text-emerald-800">
                    <span>ID #{rec.id} ({SPECIES_MAP[rec.species].korean})</span>
                    <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded font-mono">정상</span>
                  </div>
                  <div className="space-y-1 font-mono text-[11px] text-slate-700">
                    <div>꽃받침 길이: {rec.sepalLength} cm</div>
                    <div>꽃받침 너비: {rec.sepalWidth} cm</div>
                    <div>꽃잎 길이: {rec.petalLength} cm</div>
                    <div>꽃잎 너비: {rec.petalWidth} cm</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-center">
              <SecondaryButton size="sm" onClick={() => setIsNotebookOpen(true)} icon={<Search size={16} />}>
                탐정 수첩 가이드 전체 열기
              </SecondaryButton>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: 오류 데이터 찾기 */}
      {currentStep === 3 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Search size={20} className="text-rose-600" />
              <span>[찾기 단계] 활동 3: 오류 데이터 찾아내기 (데이터 탐정)</span>
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              제시된 레코드 5개 중 이상치, 결측치, 표현 불일치, 데이터형 오류가 포함된 데이터점을 탐색하세요.
            </p>

            <div className="space-y-3">
              {currentDetectiveRecords.map(rec => (
                <StudentDataCard
                  key={rec.id}
                  record={rec}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: 오류 종류 판별하기 */}
      {currentStep === 4 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <HelpCircle size={20} className="text-amber-600" />
              <span>[판별 단계] 활동 4: 오류 종류 판별하기 (사람이 읽기 쉬운 카드)</span>
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              발견한 문제 데이터의 오류 유형(결측치, 이상치, 표현 불일치, 데이터형 오류)을 세부적으로 판별합니다.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { type: 'missing', label: '결측치', desc: '필요한 수치 값이 비어 있음 (null, 빈칸)' },
                { type: 'outlier', label: '이상치', desc: '수치가 보통 범위와 다르게 극단적으로 큼/작음 (50.0cm 등)' },
                { type: 'inconsistent', label: '표현 불일치', desc: '같은 품종인데 영문/한글/오타 혼용 (Setosa vs 세토사)' },
                { type: 'type_error', label: '데이터형 오류', desc: '숫자 자리에 문자(5.1cm)가 적혀 있음' },
              ].map(item => (
                <div key={item.type} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-extrabold text-slate-900 block text-sm">● {item.label}</span>
                  <p className="text-slate-600 font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: 이상치를 통계와 시각화로 확인 */}
      {currentStep === 5 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <BarChart2 size={20} className="text-emerald-600" />
              <span>[확인 단계] 활동 5: 이상치를 통계와 시각화로 확인 (통계량 ➔ 히스토그램 ➔ 박스플롯)</span>
            </h3>

            {/* Feature Selector Tabs */}
            <div className="flex flex-wrap gap-2 text-xs">
              {(['sepalLength', 'sepalWidth', 'petalLength', 'petalWidth'] as FeatureKey[]).map(feat => (
                <button
                  key={feat}
                  onClick={() => {
                    setSelectedFeature(feat);
                    setVisitedStats(true);
                    setVisitedHistogram(true);
                    setVisitedBoxplot(true);
                  }}
                  className={`px-3 py-2 rounded-xl font-bold cursor-pointer transition-all min-h-[44px] ${
                    selectedFeature === feat
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {NUMERIC_FEATURE_LABELS[feat].full}
                </button>
              ))}
            </div>

            {/* Basic Statistics Comparison Table */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-800 block">
                [{NUMERIC_FEATURE_LABELS[selectedFeature].full}] 기초 통계량 비교 (정상 데이터 vs 오류 포함 데이터)
              </span>

              <div className="grid grid-cols-2 gap-3 text-center font-mono">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-sans">정상 데이터 평균 / 중앙값</span>
                  <span className="font-bold text-emerald-800 text-sm">{origStats.mean} cm / {origStats.median} cm</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-sans">오류 포함 평균 / 중앙값</span>
                  <span className="font-bold text-rose-700 text-sm">{errorStats.mean} cm / {errorStats.median} cm</span>
                </div>
              </div>
            </div>

            {/* Histogram & Boxplot Visualization */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <span className="font-bold text-slate-800 block">
                [{NUMERIC_FEATURE_LABELS[selectedFeature].full}] 히스토그램 및 가로형 박스플롯
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
            </div>

            {/* Crucial Outlier Educational Guidance (Section 2) */}
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-2">
              <span className="font-extrabold text-rose-900 block text-sm flex items-center gap-1.5">
                <Info size={16} />
                <span>⚠️ 이상치 개념 및 처리 판단 원칙 (박스플롯 밖 ≠ 무조건 삭제/오류)</span>
              </span>
              <p className="leading-relaxed">
                "이상치는 다른 데이터와 크게 다른 값입니다. 하지만 이상치가 항상 잘못된 값이라는 뜻은 아닙니다."
              </p>
              <p className="leading-relaxed font-bold bg-white p-2.5 rounded-lg border border-rose-200">
                "이상치를 발견하면 먼저 실제 존재하는 자연적 값인지, 입력 오타(입력 오류)인지, 측정기 오류인지 확인해야 합니다. 명백한 입력 오타(예: 50.0cm, 30.0cm)는 원본 데이터(ORIGINAL_IRIS_DATASET)와 비교하여 올바른 수치(5.0cm, 3.0cm)로 수정할 수 있습니다."
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 6: 적절한 전처리 방법 판단 */}
      {currentStep === 6 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-600" />
              <span>[처리 단계] 활동 6: 적절한 전처리 방법 판단하기</span>
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              이상치와 결측치 등을 만났을 때 선택할 수 있는 4가지 적절한 전처리 전략을 판단합니다.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                { title: '1. 그대로 사용한다 (유지)', desc: '자연계에 실제 존재하는 희귀하지만 정상적인 실제 수치인 경우' },
                { title: '2. 실제 값을 확인한다', desc: '측정 기록지나 원본 데이터를 재확인하여 사실 여부 점검' },
                { title: '3. 입력 오류를 수정한다', desc: '소수점 위치 오타(50.0cm ➔ 5.0cm) 등 명백한 입력 오류인 경우' },
                { title: '4. 필요하면 제외한다 (삭제)', desc: '데이터 수집에 심각한 오류가 포함되어 보정이 불가능한 경우' },
              ].map((opt, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-extrabold text-slate-900 block text-xs">{opt.title}</span>
                  <p className="text-slate-600 font-medium">{opt.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 7: 속성 간 관계 확인 (산점도 & 히트맵) */}
      {currentStep === 7 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp size={20} className="text-teal-600" />
              <span>[관찰 단계] 활동 7: 속성 간 관계 확인 (산점도 & 상관관계 히트맵)</span>
            </h3>

            {/* Scatter Plot */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-bold text-slate-800">2D 산점도 (Scatter Plot) 속성 조합 선택:</span>
                <div className="flex gap-2">
                  <select
                    value={scatterX}
                    onChange={e => {
                      setScatterX(e.target.value as FeatureKey);
                      setChangedScatterPair(true);
                    }}
                    className="p-2 bg-white border border-slate-300 rounded-lg font-bold text-xs min-h-[44px] cursor-pointer"
                  >
                    <option value="petalLength">꽃잎 길이 (X축)</option>
                    <option value="sepalLength">꽃받침 길이 (X축)</option>
                    <option value="sepalWidth">꽃받침 너비 (X축)</option>
                    <option value="petalWidth">꽃잎 너비 (X축)</option>
                  </select>
                  <select
                    value={scatterY}
                    onChange={e => {
                      setScatterY(e.target.value as FeatureKey);
                      setChangedScatterPair(true);
                    }}
                    className="p-2 bg-white border border-slate-300 rounded-lg font-bold text-xs min-h-[44px] cursor-pointer"
                  >
                    <option value="petalWidth">꽃잎 너비 (Y축)</option>
                    <option value="petalLength">꽃잎 길이 (Y축)</option>
                    <option value="sepalLength">꽃받침 길이 (Y축)</option>
                    <option value="sepalWidth">꽃받침 너비 (Y축)</option>
                  </select>
                </div>
              </div>

              {/* Scatter Plot Visual SVG */}
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

            {/* Heatmap */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <span className="font-bold text-slate-800 block">
                4×4 상관관계 히트맵 (Pearson Correlation Matrix)
              </span>

              <div className="w-full overflow-x-auto bg-white p-3 rounded-lg border border-slate-200">
                <div className="min-w-[300px] grid grid-cols-5 gap-1.5 text-center font-mono text-[11px]">
                  <div className="p-2 bg-slate-100 font-bold rounded">속성</div>
                  <div className="p-2 bg-slate-100 font-bold rounded">꽃받침길이</div>
                  <div className="p-2 bg-slate-100 font-bold rounded">꽃받침너비</div>
                  <div className="p-2 bg-slate-100 font-bold rounded">꽃잎길이</div>
                  <div className="p-2 bg-slate-100 font-bold rounded">꽃잎너비</div>

                  {(['sepalLength', 'sepalWidth', 'petalLength', 'petalWidth'] as FeatureKey[]).map(rowFeat => (
                    <React.Fragment key={rowFeat}>
                      <div className="p-2 bg-slate-100 font-bold rounded text-left">
                        {NUMERIC_FEATURE_LABELS[rowFeat].short}
                      </div>
                      {(['sepalLength', 'sepalWidth', 'petalLength', 'petalWidth'] as FeatureKey[]).map(colFeat => {
                        const cell = correlationMatrix.cells.find(c => c.featureX === rowFeat && c.featureY === colFeat);
                        const val = cell ? cell.correlation : 0;
                        const isHigh = val > 0.8 && rowFeat !== colFeat;

                        return (
                          <div
                            key={colFeat}
                            onMouseEnter={() => setVisitedHeatmap(true)}
                            className={`p-2 rounded font-extrabold flex items-center justify-center ${
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

              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-950 font-bold leading-relaxed text-[11px]">
                💡 <strong>관찰 결과:</strong> 꽃잎 길이와 꽃잎 너비의 상관계수는 <strong>0.96</strong>으로 극도로 높은 양의 상관관계를 보여줍니다!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 8: [어떤 속성이 품종을 구분하는 데 도움이 될까?] 핵심 속성 2개 선택 (Section 3 & 4) */}
      {currentStep === 8 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Target size={20} className="text-emerald-600" />
              <span>[선택 단계] 활동 8: [어떤 속성이 품종을 구분하는 데 도움이 될까?]</span>
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              산점도와 히트맵에서 관찰한 내용을 바탕으로 품종을 구분하는 데 도움이 될 것 같은 속성 2개를 직접 선택해보세요. (06 알고리즘 실험실과 연결됩니다)
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {(['sepalLength', 'sepalWidth', 'petalLength', 'petalWidth'] as FeatureKey[]).map(feat => {
                const isSelected = selectedFeatures04.includes(feat);

                return (
                  <button
                    key={feat}
                    onClick={() => handleToggleFeature04(feat)}
                    className={`p-4 rounded-xl border-2 font-bold cursor-pointer transition-all min-h-[50px] flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xs font-black">{NUMERIC_FEATURE_LABELS[feat].full}</span>
                    <span className="text-[10px] opacity-80">{isSelected ? '✓ 선택됨' : '선택하기'}</span>
                  </button>
                );
              })}
            </div>

            {/* Selection Summary */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 font-bold space-y-1">
              <span className="text-sm block text-emerald-900">
                선택한 핵심 속성 2개: [{selectedFeatures04.map(f => NUMERIC_FEATURE_LABELS[f].full).join(', ')}]
              </span>
              <p className="text-[11px] font-medium text-emerald-800">
                이 2가지 선택 속성은 저장되어 <strong>06 알고리즘 실험실(k-NN 실험)</strong> 진입 시 우선 실험 추천용으로 바로 연결됩니다!
              </p>
            </div>

            {/* Reflection Question Section 3 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <span className="font-extrabold text-slate-900 block text-sm">
                질문: 왜 이 두 속성을 선택했나요?
              </span>

              <div className="space-y-2">
                {[
                  { key: 'r1', label: '산점도 및 히트맵에서 세 품종의 수치 분포 범위가 명확히 분리되고 강한 상관관계를 보였기 때문입니다.' },
                  { key: 'r2', label: '다른 속성에 비해 품종 간 수치 겹침이 적어서 머신러닝 모델이 구분하기 쉽기 때문입니다.' },
                  { key: 'r3', label: '직관적인 관찰 결과 품종별 특징 차이가 가장 컸기 때문입니다.' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setFeatureSelectionReason(opt.key)}
                    className={`w-full text-left p-3 rounded-xl border font-bold transition-all min-h-[44px] cursor-pointer ${
                      featureSelectionReason === opt.key
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ✓ {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 9: [비교/완료 단계] 전처리 전/후 비교 및 마무리 (Section 24 & 25) */}
      {currentStep === 9 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-600" />
              <span>[비교/완료 단계] 활동 9: 전처리 전/후 데이터셋 상태 비교 및 마무리</span>
            </h3>

            {/* Section 24 Summary Sentence */}
            <div className="p-4 rounded-2xl bg-emerald-600 text-white text-center font-extrabold text-sm shadow-sm">
              "데이터를 정리하고 시각화하면 이상치와 속성의 특징을 더 쉽게 발견할 수 있습니다."
            </div>

            {/* Section 25 Ending Transition Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3 max-w-xl mx-auto text-xs">
              <span className="font-extrabold text-slate-900 block text-sm">
                💡 다음 학습 영역 연결 안내:
              </span>
              <p className="text-slate-700 font-bold text-sm leading-relaxed">
                "이제 정제하고 이해한 데이터로 머신러닝 학습 방법을 알아봅니다."
              </p>
              <div className="pt-2">
                <PrimaryButton size="lg" fullWidth onClick={onComplete} icon={<ArrowRight size={20} />}>
                  05 기계학습 유형과 알고리즘 선정으로 이동
                </PrimaryButton>
              </div>
            </div>

            {/* AI Prompt Card */}
            <PromptCard promptText={promptText} title="생성형 AI 탐구 프롬프트" />
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

          <div className="space-y-2">
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

          <div className="pt-2 text-right">
            <PrimaryButton size="sm" onClick={() => setIsNotebookOpen(false)}>
              탐정 수첩 닫고 활동 계속하기
            </PrimaryButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};
