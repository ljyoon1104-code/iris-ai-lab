import React, { useState } from 'react';
import { useActivityScrollTop } from '../../hooks/useActivityScrollTop';
import { ActivityProgress } from './ActivityProgress';
import { ChoiceCard } from './ChoiceCard';
import { PromptCard } from './PromptCard';
import { IrisDatasetPreview } from './IrisDatasetPreview';
import { PrimaryButton } from '../common/PrimaryButton';
import { SecondaryButton } from '../common/SecondaryButton';
import {
  ORIGINAL_IRIS_DATASET,
  BIASED_IRIS_DATASET,
  IRIS_METADATA,
  SPECIES_MAP,
} from '../../data/irisDataset';
import { getDatasetCounts } from '../../utils/irisHelpers';
import { SpeciesLabel } from '../common/SpeciesBadge';
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Database,
  Layers,
  Sparkles,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Module03ActivityProps {
  isCompleted: boolean;
  onComplete: () => void;
}

export const Module03Activity: React.FC<Module03ActivityProps> = ({ isCompleted, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7; // 6 activities + summary
  const topRef = useActivityScrollTop<HTMLDivElement>(currentStep);

  // Activity 2 State (Problem Type)
  const [act2A, setAct2A] = useState<'class' | 'reg' | 'clust' | null>(null);
  const [act2B, setAct2B] = useState<'class' | 'reg' | 'clust' | null>(null);
  const [act2C, setAct2C] = useState<'class' | 'reg' | 'clust' | null>(null);

  // Activity 3 State (Feature Selection)
  const [selectedFeatures, setSelectedFeatures] = useState<Record<string, boolean>>({
    sepalLength: true,
    sepalWidth: true,
    petalLength: true,
    petalWidth: true,
  });
  const [selectedTarget, setSelectedTarget] = useState<boolean>(true);

  // Activity 4 State (Data Collection)
  const [act4A, setAct4A] = useState<number | null>(null);
  const [act4B, setAct4B] = useState<number | null>(null);

  // Activity 5 State (Real vs Synthetic)
  const [act5Choice, setAct5Choice] = useState<'A' | 'B' | null>(null);

  // Activity 6 State (Biased Data)
  const [act6Q1, setAct6Q1] = useState<boolean | null>(null);
  const [act6Q2, setAct6Q2] = useState<'A' | 'B' | 'C' | null>(null);
  const [act6Choice, setAct6Choice] = useState<'balanced' | 'biased' | null>(null);

  // Collapsible Iris Full Dataset Preview State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Dynamic Dataset Counts
  const normalCounts = getDatasetCounts(ORIGINAL_IRIS_DATASET);
  const biasedCounts = getDatasetCounts(BIASED_IRIS_DATASET);

  const sampleIris = ORIGINAL_IRIS_DATASET[0];

  const syntheticPrompt =
    "붓꽃 데이터와 비슷한 형식의 가상 데이터 5개를 만들어줘. 실제 측정 데이터가 아니라 합성 데이터임을 표시해줘.";

  return (
    <div className="space-y-6 scroll-mt-24" ref={topRef}>
      {/* Official 6-stage badge banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
          [공식 6단계 과정] ② 데이터 수집
        </span>
        <span className="text-xs text-slate-500 font-medium">03 데이터 수집 및 구성</span>
      </div>

      {/* Activity Progress */}
      <ActivityProgress
        currentStep={currentStep}
        totalSteps={totalSteps}
        title={
          currentStep === 1
            ? '1. 문제 정의'
            : currentStep === 2
            ? '2. 분류/회귀/군집'
            : currentStep === 3
            ? '3. 속성 선택(X, y)'
            : currentStep === 4
            ? '4. 데이터 수집 방법'
            : currentStep === 5
            ? '5. 실제 vs 합성 데이터'
            : currentStep === 6
            ? '6. 데이터 편향 발견'
            : '전체 정리 및 완료'
        }
      />

      {/* STEP 1: 무엇을 알아내고 싶은가? (문제 정의) */}
      {currentStep === 1 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Database size={20} className="text-emerald-600" />
              <span>활동 1: 무엇을 알아내고 싶은가? (문제 정의)</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Iris 데이터로 달성할 수 있는 세 가지 학습 목표 카드를 읽어보세요. 각 목표에서 최종적으로 발견하고자 하는 결과를 확인합니다.
            </p>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block">
                  목표 A (품종 분류)
                </span>
                <p className="text-sm font-bold text-slate-900">
                  "꽃받침과 꽃잎의 길이·너비를 이용해 붓꽃의 품종을 알아내고 싶다."
                </p>
                <div className="text-xs text-slate-600 pt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-emerald-700">🎯 최종 얻고 싶은 결과:</span>
                  <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1">
                    <span>붓꽃 품종 (</span>
                    <SpeciesLabel species="Iris-setosa" size="xs" />
                    <span>/</span>
                    <SpeciesLabel species="Iris-versicolor" size="xs" />
                    <span>/</span>
                    <SpeciesLabel species="Iris-virginica" size="xs" />
                    <span>)</span>
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full inline-block">
                  목표 B (수치 회귀)
                </span>
                <p className="text-sm font-bold text-slate-900">
                  "꽃잎 길이를 이용해 꽃잎 너비를 숫자로 예상하고 싶다."
                </p>
                <div className="text-xs text-slate-600 pt-1 flex items-center gap-1.5">
                  <span className="font-bold text-teal-800">🎯 최종 얻고 싶은 결과:</span>
                  <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    꽃잎 너비의 수치 (예: 1.4 cm)
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-cyan-900 bg-cyan-100 px-2.5 py-0.5 rounded-full inline-block">
                  목표 C (비지도 군집)
                </span>
                <p className="text-sm font-bold text-slate-900">
                  "품종 이름을 보지 않고 비슷한 붓꽃끼리 묶고 싶다."
                </p>
                <div className="text-xs text-slate-600 pt-1 flex items-center gap-1.5">
                  <span className="font-bold text-cyan-900">🎯 최종 얻고 싶은 결과:</span>
                  <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    비슷한 데이터끼리의 그룹 (Cluster)
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-600 text-white text-xs leading-relaxed space-y-1 shadow-xs">
              <span className="font-bold text-emerald-200 uppercase tracking-wide block">💡 정리 가이드</span>
              <p className="font-extrabold text-sm">
                "기계학습을 시작하기 전에 무엇을 예측하거나 발견하려는지 먼저 문제를 명확히 정의해야 합니다."
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: 이 문제는 어떤 종류일까? (분류 / 회귀 / 군집) */}
      {currentStep === 2 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Layers size={20} className="text-emerald-600" />
              <span>활동 2: 이 문제는 어떤 종류일까? (분류 / 회귀 / 군집)</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              세 문제 상황이 각각 분류, 회귀, 군집 중 어떤 기계학습 문제 유형에 해당하는지 고르세요.
            </p>

            {/* Problem A */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1 flex-wrap">
                <span>문제 A: "새로운 붓꽃의 측정값을 보고</span>
                <SpeciesLabel species="Iris-setosa" size="xs" />
                <span>,</span>
                <SpeciesLabel species="Iris-versicolor" size="xs" />
                <span>,</span>
                <SpeciesLabel species="Iris-virginica" size="xs" />
                <span>중 하나를 맞힌다."</span>
              </span>
              <div className="grid grid-cols-3 gap-2">
                <ChoiceCard
                  optionKey="1"
                  label="분류"
                  subText="범주 중 선택"
                  isSelected={act2A === 'class'}
                  status={act2A === 'class' ? 'correct' : 'default'}
                  onClick={() => setAct2A('class')}
                />
                <ChoiceCard
                  optionKey="2"
                  label="회귀"
                  isSelected={act2A === 'reg'}
                  status={act2A === 'reg' ? 'incorrect' : 'default'}
                  onClick={() => setAct2A('reg')}
                />
                <ChoiceCard
                  optionKey="3"
                  label="군집"
                  isSelected={act2A === 'clust'}
                  status={act2A === 'clust' ? 'incorrect' : 'default'}
                  onClick={() => setAct2A('clust')}
                />
              </div>
            </div>

            {/* Problem B */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-900 block">
                문제 B: "꽃잎 길이를 이용해 꽃잎 너비를 숫자로 예측한다."
              </span>
              <div className="grid grid-cols-3 gap-2">
                <ChoiceCard
                  optionKey="1"
                  label="분류"
                  isSelected={act2B === 'class'}
                  status={act2B === 'class' ? 'incorrect' : 'default'}
                  onClick={() => setAct2B('class')}
                />
                <ChoiceCard
                  optionKey="2"
                  label="회귀"
                  subText="연속적인 숫자 예측"
                  isSelected={act2B === 'reg'}
                  status={act2B === 'reg' ? 'correct' : 'default'}
                  onClick={() => setAct2B('reg')}
                />
                <ChoiceCard
                  optionKey="3"
                  label="군집"
                  isSelected={act2B === 'clust'}
                  status={act2B === 'clust' ? 'incorrect' : 'default'}
                  onClick={() => setAct2B('clust')}
                />
              </div>
            </div>

            {/* Problem C */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-900 block">
                문제 C: "품종 레이블 없이 비슷한 붓꽃끼리 그룹(클러스터)을 만든다."
              </span>
              <div className="grid grid-cols-3 gap-2">
                <ChoiceCard
                  optionKey="1"
                  label="분류"
                  isSelected={act2C === 'class'}
                  status={act2C === 'class' ? 'incorrect' : 'default'}
                  onClick={() => setAct2C('class')}
                />
                <ChoiceCard
                  optionKey="2"
                  label="회귀"
                  isSelected={act2C === 'reg'}
                  status={act2C === 'reg' ? 'incorrect' : 'default'}
                  onClick={() => setAct2C('reg')}
                />
                <ChoiceCard
                  optionKey="3"
                  label="군집 (클러스터링)"
                  subText="정답 없이 그룹화"
                  isSelected={act2C === 'clust'}
                  status={act2C === 'clust' ? 'correct' : 'default'}
                  onClick={() => setAct2C('clust')}
                />
              </div>
            </div>

            {/* Summary Box */}
            {act2A === 'class' && act2B === 'reg' && act2C === 'clust' && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2 animate-fadeIn">
                <span className="font-bold text-emerald-900 text-sm block">✓ 모두 정확하게 분류하셨습니다!</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
                    <span className="font-bold text-emerald-900 block">분류 (Classification)</span>
                    정해진 몇 개의 범주(Class) 중 하나를 예측하는 문제.
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
                    <span className="font-bold text-teal-900 block">회귀 (Regression)</span>
                    연속적인 숫자 형태의 값(Numeric Value)을 예측하는 문제.
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
                    <span className="font-bold text-cyan-900 block">군집 (Clustering)</span>
                    정답(Label) 없이 유사한 특징을 가진 데이터끼리 묶는 문제.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: 어떤 데이터가 필요한가? (속성 선택 X, y) */}
      {currentStep === 3 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900">
              활동 3: 어떤 데이터가 필요한가? (입력 X vs 목표 y)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              붓꽃 품종을 분류하는 모델을 만들고자 할 때, 입력 데이터(Feature X)와 예측 목표(Label y)를 선택해 보세요.
            </p>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <span className="font-extrabold text-slate-900 block">실제 Iris 샘플 데이터 (ID #{sampleIris.id}):</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">꽃받침 길이</span>
                  <span className="font-bold">{sampleIris.sepalLength} cm</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">꽃받침 너비</span>
                  <span className="font-bold">{sampleIris.sepalWidth} cm</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">꽃잎 길이</span>
                  <span className="font-bold">{sampleIris.petalLength} cm</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">꽃잎 너비</span>
                  <span className="font-bold">{sampleIris.petalWidth} cm</span>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-emerald-700 block">품종</span>
                  <span className="font-bold text-emerald-900">{SPECIES_MAP[sampleIris.species].korean}</span>
                </div>
              </div>
            </div>

            {/* Attribute Selector Checkboxes */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-800 block">1. 모델의 판단 재료가 되는 입력 데이터 (X) 선택:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'sepalLength', label: '꽃받침 길이' },
                  { key: 'sepalWidth', label: '꽃받침 너비' },
                  { key: 'petalLength', label: '꽃잎 길이' },
                  { key: 'petalWidth', label: '꽃잎 너비' },
                ].map(attr => (
                  <button
                    key={attr.key}
                    onClick={() =>
                      setSelectedFeatures(prev => ({ ...prev, [attr.key]: !prev[attr.key] }))
                    }
                    className={`p-3 rounded-xl border-2 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer min-h-[44px] ${
                      selectedFeatures[attr.key]
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-slate-200 bg-white text-slate-500'
                    }`}
                  >
                    {selectedFeatures[attr.key] ? (
                      <CheckSquare size={16} className="text-blue-600" />
                    ) : (
                      <Square size={16} className="text-slate-300" />
                    )}
                    <span>{attr.label} (X)</span>
                  </button>
                ))}
              </div>

              <span className="text-xs font-bold text-slate-800 block pt-2">2. 모델이 맞히려고 하는 예측 목표 (y) 선택:</span>
              <button
                onClick={() => setSelectedTarget(!selectedTarget)}
                className={`w-full p-3.5 rounded-xl border-2 text-xs font-bold transition-all flex items-center justify-between cursor-pointer min-h-[48px] ${
                  selectedTarget
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
                    : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                <div className="flex items-center gap-2">
                  {selectedTarget ? (
                    <CheckSquare size={18} className="text-emerald-600" />
                  ) : (
                    <Square size={18} className="text-slate-300" />
                  )}
                  <span>붓꽃 품종 (Species)</span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  종속변수 (y)
                </span>
              </button>
            </div>

            {/* X and y Explanation */}
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-950 space-y-1">
              <span className="font-extrabold text-blue-900 block text-sm">💡 입력 데이터 X 와 예측 목표 y</span>
              <p className="leading-relaxed">
                기계학습 분류 문제에서 <strong>입력 데이터 X</strong>는 모델이 패턴을 관찰할 4가지 측정 속성(꽃받침/꽃잎 길이·너비)이며, <strong>예측 목표 y</strong>는 최종 판정할 정답인 붓꽃 품종입니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: 데이터 수집 방법 */}
      {currentStep === 4 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900">
              활동 4: 데이터는 어떻게 수집할까?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              각 속성과 상황에 가장 적절한 데이터 수집 방식을 선택해 보세요.
            </p>

            {/* Question 1 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-900 block">
                1. 붓꽃의 꽃받침 길이나 꽃잎 너비 같은 수치 데이터를 새로 측정하려면?
              </span>
              <div className="space-y-2">
                <ChoiceCard
                  optionKey="A"
                  label="자 또는 버니어 캘리퍼스 같은 측정 도구로 직접 측정"
                  isSelected={act4A === 1}
                  status={act4A === 1 ? 'correct' : 'default'}
                  onClick={() => setAct4A(1)}
                />
                <ChoiceCard
                  optionKey="B"
                  label="학생들의 선호도 설문조사 진행"
                  isSelected={act4A === 2}
                  status={act4A === 2 ? 'incorrect' : 'default'}
                  onClick={() => setAct4A(2)}
                />
                <ChoiceCard
                  optionKey="C"
                  label="임의의 숫자를 무작위 추측하여 작성"
                  isSelected={act4A === 3}
                  status={act4A === 3 ? 'incorrect' : 'default'}
                  onClick={() => setAct4A(3)}
                />
              </div>
            </div>

            {/* Question 2 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-900 block">
                2. 이미 검증된 많은 수의 Iris 데이터(150개 이상)가 즉시 필요하다면?
              </span>
              <div className="space-y-2">
                <ChoiceCard
                  optionKey="A"
                  label="Kaggle, UCI 데이터 저장소 등 이미 수집되어 공개된 데이터셋 활용"
                  isSelected={act4B === 1}
                  status={act4B === 1 ? 'correct' : 'default'}
                  onClick={() => setAct4B(1)}
                />
                <ChoiceCard
                  optionKey="B"
                  label="같은 데이터 한 개를 150번 계속 복사해서 늘리기"
                  isSelected={act4B === 2}
                  status={act4B === 2 ? 'incorrect' : 'default'}
                  onClick={() => setAct4B(2)}
                />
              </div>
            </div>

            {/* Summary Box */}
            {act4A === 1 && act4B === 1 && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2 animate-fadeIn">
                <span className="font-bold text-emerald-900 block text-sm">✓ 올바른 데이터 수집 방법을 알고 계시네요!</span>
                <p className="leading-relaxed">
                  데이터는 1) 직접 관찰·측정, 2) 센서/프로그램을 통한 자동 수집, 3) <strong>공개 데이터셋(Kaggle 등) 활용</strong> 방식을 통해 얻을 수 있습니다. 본 Iris AI Lab에서는 이미 검증되어 널리 쓰이는 Kaggle의 공개 Iris 데이터셋을 사용합니다.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 5: 실제 데이터와 합성 데이터 */}
      {currentStep === 5 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles size={20} className="text-amber-500" />
              <span>활동 5: 실제 데이터와 합성 데이터 (Synthetic Data)</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              두 데이터 카드 중 실제 현장에서 관찰/측정된 원본 데이터는 어느 쪽인지 선택하세요.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ChoiceCard
                optionKey="A"
                label="실제 Iris 데이터셋 레코드"
                subText="실제 붓꽃을 관찰하고 측정하여 저장한 150개 원본 데이터"
                isSelected={act5Choice === 'A'}
                status={act5Choice === 'A' ? 'correct' : 'default'}
                onClick={() => setAct5Choice('A')}
              />
              <ChoiceCard
                optionKey="B"
                label="생성형 AI가 만들어낸 가상 데이터"
                subText="AI 프로그램이 인위적으로 생성해낸 합성 데이터(Synthetic Data)"
                isSelected={act5Choice === 'B'}
                status={act5Choice === 'B' ? 'incorrect' : 'default'}
                onClick={() => setAct5Choice('B')}
              />
            </div>

            {act5Choice === 'A' && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 leading-relaxed space-y-1 animate-fadeIn">
                <span className="font-bold text-emerald-900 block">✓ 정답입니다!</span>
                <p>
                  실제로 관찰하거나 측정한 것이 아니라 사람이나 프로그램, 생성형 AI가 인위적으로 만든 데이터를 <strong>합성 데이터(Synthetic Data)</strong>라고 합니다. 생성형 AI가 만든 데이터는 그럴듯해 보여도 실제 측정 데이터와 완벽하게 같다고 볼 수 없습니다.
                </p>
              </div>
            )}

            {/* Prompt Copy Card for Synthetic Data */}
            <div className="pt-2">
              <PromptCard promptText={syntheticPrompt} title="합성 데이터 생성 프롬프트 예시" />
            </div>
          </div>
        </div>
      )}

      {/* STEP 6: 데이터 편향 (Biased Dataset) */}
      {currentStep === 6 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900">
              활동 6: 데이터 편향 (Data Bias) 발견하기
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              원본 균형 데이터셋과 인위적으로 특정 품종을 과대표집한 편향 데이터셋(`BIASED_IRIS_DATASET`)의 품종별 분포를 비교해보세요.
            </p>

            {/* Side by side comparison bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Normal Balanced Dataset */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                  <span>1. 원본 균형 데이터셋</span>
                  <span className="text-emerald-700">총 {normalCounts.total}개</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-0.5">
                      <SpeciesLabel species="Iris-setosa" showEnglish size="xs" />
                      <span>50개 (33.3%)</span>
                    </div>
                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-1/3" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-0.5">
                      <SpeciesLabel species="Iris-versicolor" showEnglish size="xs" />
                      <span>50개 (33.3%)</span>
                    </div>
                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full w-1/3" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-0.5">
                      <SpeciesLabel species="Iris-virginica" showEnglish size="xs" />
                      <span>50개 (33.3%)</span>
                    </div>
                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full w-1/3" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Biased Dataset */}
              <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-rose-950">
                  <span>2. 편향 데이터셋 (`BIASED`)</span>
                  <span className="text-rose-700">총 {biasedCounts.total}개</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-0.5">
                      <SpeciesLabel species="Iris-setosa" showEnglish size="xs" />
                      <span className="font-bold text-rose-700">
                        {biasedCounts.bySpecies['Iris-setosa']}개 (80%)
                      </span>
                    </div>
                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-[80%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-0.5">
                      <SpeciesLabel species="Iris-versicolor" showEnglish size="xs" />
                      <span>{biasedCounts.bySpecies['Iris-versicolor']}개 (16%)</span>
                    </div>
                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full w-[16%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-0.5">
                      <SpeciesLabel species="Iris-virginica" showEnglish size="xs" />
                      <span>{biasedCounts.bySpecies['Iris-virginica']}개 (4%)</span>
                    </div>
                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full w-[4%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-slate-900 block">
                질문 1: 두 번째 편향 데이터셋은 세 품종이 균등한 수로 포함되어 있을까?
              </span>
              <div className="grid grid-cols-2 gap-2">
                <ChoiceCard
                  optionKey="1"
                  label="그렇다"
                  isSelected={act6Q1 === true}
                  status={act6Q1 === true ? 'incorrect' : 'default'}
                  onClick={() => setAct6Q1(true)}
                />
                <ChoiceCard
                  optionKey="2"
                  label="아니다 (세토사가 80%로 치우침)"
                  isSelected={act6Q1 === false}
                  status={act6Q1 === false ? 'correct' : 'default'}
                  onClick={() => setAct6Q1(false)}
                />
              </div>

              <span className="text-xs font-bold text-slate-900 block pt-2">
                질문 2: 편향 데이터셋으로 기계학습 모델을 학습시키면 어떤 문제가 발생할까?
              </span>
              <div className="space-y-2">
                <ChoiceCard
                  optionKey="A"
                  label="데이터가 많은 세토사 품종으로만 치우쳐 학습될 위험이 높다."
                  isSelected={act6Q2 === 'A'}
                  status={act6Q2 === 'A' ? 'correct' : 'default'}
                  onClick={() => setAct6Q2('A')}
                />
                <ChoiceCard
                  optionKey="B"
                  label="모든 품종의 예측 정확도가 자동으로 100%가 된다."
                  isSelected={act6Q2 === 'B'}
                  status={act6Q2 === 'B' ? 'incorrect' : 'default'}
                  onClick={() => setAct6Q2('B')}
                />
              </div>

              <span className="text-xs font-bold text-slate-900 block pt-2">
                질문 3: 일반적인 분류 기계학습 실험에 더 적절한 데이터는?
              </span>
              <div className="grid grid-cols-2 gap-2">
                <ChoiceCard
                  optionKey="1"
                  label="균형 데이터셋 (각 50개)"
                  isSelected={act6Choice === 'balanced'}
                  status={act6Choice === 'balanced' ? 'correct' : 'default'}
                  onClick={() => setAct6Choice('balanced')}
                />
                <ChoiceCard
                  optionKey="2"
                  label="편향 데이터셋 (40 / 8 / 2)"
                  isSelected={act6Choice === 'biased'}
                  status={act6Choice === 'biased' ? 'incorrect' : 'default'}
                  onClick={() => setAct6Choice('biased')}
                />
              </div>

              {act6Choice === 'balanced' && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 leading-relaxed animate-fadeIn">
                  <span className="font-bold text-emerald-900 block mb-0.5">✓ 정답입니다!</span>
                  데이터가 특정 클래스로 지나치게 치우치면 모델이 데이터가 적은 <SpeciesLabel species="Iris-versicolor" size="xs" />나 <SpeciesLabel species="Iris-virginica" size="xs" />를 잘 구분하지 못하게 됩니다. 좋은 기계학습을 위해서는 대표성과 균형을 갖춘 데이터를 준비하는 것이 매우 중요합니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 7: 전체 정리 및 학습 완료 */}
      {currentStep === 7 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900">03 데이터 준비 점검 체크리스트</h3>
              <p className="text-xs text-slate-500">기계학습 데이터 준비 6대 수칙</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>해결하려는 문제를 명확히 정의했는가?</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>문제 유형(분류 / 회귀 / 군집)을 확인했는가?</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>입력 데이터 X와 예측 목표 y를 설정했는가?</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>올바른 데이터 수집 방식을 선택했는가?</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>실제 측정 데이터와 합성 데이터를 구별했는가?</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>데이터 편향(불균형) 가능성을 점검했는가?</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-600 text-white text-center font-extrabold text-sm shadow-sm">
              "좋은 기계학습은 좋은 데이터 준비에서 시작합니다."
            </div>

            <div className="pt-2 text-center space-y-2">
              {isCompleted && (
                <div className="text-xs font-bold text-emerald-700 bg-emerald-100 p-2 rounded-xl inline-block">
                  ✓ 이미 완료된 영역입니다. 언제든 자유롭게 복습 및 다시 학습이 가능합니다.
                </div>
              )}
              <PrimaryButton size="lg" fullWidth onClick={onComplete} icon={<CheckCircle2 size={20} />}>
                03 데이터 준비 학습 완료하기
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Collapsible Section: Full Iris Dataset Explorer */}
      <div className="pt-4 border-t border-slate-200">
        <button
          onClick={() => setIsPreviewOpen(!isPreviewOpen)}
          className="w-full p-4 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-sm flex items-center justify-between transition-colors cursor-pointer min-h-[48px]"
        >
          <div className="flex items-center gap-2">
            <Database size={18} className="text-emerald-600" />
            <span>Iris 원본 데이터 150개 레코드 미리보기 ({IRIS_METADATA.name})</span>
          </div>
          {isPreviewOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {isPreviewOpen && (
          <div className="mt-4 animate-fadeIn">
            <IrisDatasetPreview />
          </div>
        )}
      </div>

      {/* Internal Step Control Navigation */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
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
  );
};
