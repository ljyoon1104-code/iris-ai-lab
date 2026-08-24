import React, { useState } from 'react';
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
import type { ErrorIrisRecord, ErrorIssueType, IrisRecord } from '../../types/iris';
import {
  cloneDataset,
  calculateMean,
  calculateMedian,
} from '../../utils/irisHelpers';
import {
  Search,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  Layers,
  BookOpen,
} from 'lucide-react';

interface Module04ActivityProps {
  isCompleted: boolean;
  onComplete: () => void;
}

export const Module04Activity: React.FC<Module04ActivityProps> = ({ isCompleted, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 8; // 7 activities + summary
  const topRef = useActivityScrollTop<HTMLDivElement>(currentStep);

  // Activity 1 State (Data Types)
  const [act1Answers, setAct1Answers] = useState<Record<string, 'numeric' | 'categorical' | null>>({
    sepalLength: null,
    sepalWidth: null,
    petalLength: null,
    petalWidth: null,
    species: null,
  });

  // Activity 2 State (X vs y)
  const [act2Answers, setAct2Answers] = useState<Record<string, 'X' | 'y' | null>>({
    sepalLength: null,
    sepalWidth: null,
    petalLength: null,
    petalWidth: null,
    species: null,
  });

  // Data Detective Working Dataset & Notebook States
  const [workingDataset] = useState<ErrorIrisRecord[]>(() =>
    cloneDataset(ERROR_IRIS_DATASET)
  );
  const [detectiveSetIndex, setDetectiveSetIndex] = useState(0); // 0 to 3 (4 sets of 5)
  const [userFlagged, setUserFlagged] = useState<Record<number, boolean>>({}); // recordId -> isError
  const [userIssueTypes, setUserIssueTypes] = useState<Record<number, ErrorIssueType>>({}); // recordId -> issueType
  const [checkedSets, setCheckedSets] = useState<Record<number, boolean>>({}); // setIndex -> checked
  const [hintLevel, setHintLevel] = useState<number>(0); // 0 to 3
  const [isNotebookOpen, setIsNotebookOpen] = useState<boolean>(false);
  const [showStatsFeature, setShowStatsFeature] = useState<keyof Omit<IrisRecord, 'id' | 'species'> | null>(null);

  // Treatment choices for Step 5
  const [missingTreatment, setMissingTreatment] = useState<'delete' | 'mean' | 'median' | null>(null);
  const [outlierTreatment, setOutlierTreatment] = useState<'delete_immediate' | 'verify_first' | null>(null);
  const [inconsistentTreated, setInconsistentTreated] = useState(false);
  const [invalidTypeTreated, setInvalidTypeTreated] = useState(false);

  // Feature Importance choice for Step 7
  const [act7Choice, setAct7Choice] = useState<'petalLength' | 'sepalWidth' | null>(null);

  // Real 3 Normal Iris Records from ORIGINAL_IRIS_DATASET (Setosa, Versicolor, Virginica)
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

  const getFeatureDistributionStats = (feat: keyof Omit<IrisRecord, 'id' | 'species'>) => {
    const vals = ORIGINAL_IRIS_DATASET.map(r => r[feat]).sort((a, b) => a - b);
    const min = vals[0];
    const max = vals[vals.length - 1];
    const mean = calculateMean(vals);
    const median = calculateMedian(vals);
    return { min, max, mean, median };
  };

  const promptText =
    "다음 Iris 붓꽃 데이터 레코드에서 결측치(missing), 이상치(outlier), 표현 불일치(inconsistent)가 발생하는 이유와 이를 발견하는 방법을 고등학생 수준으로 쉽게 설명해줘.";

  return (
    <div className="space-y-6 scroll-mt-24" ref={topRef}>
      {/* Activity Progress */}
      <ActivityProgress
        currentStep={currentStep}
        totalSteps={totalSteps}
        title={
          currentStep === 1
            ? '1. 수치형 vs 범주형'
            : currentStep === 2
            ? '2. X와 y 구분'
            : currentStep === 3
            ? '3. 데이터 탐정 (정상 관찰 & 오류 찾기)'
            : currentStep === 4
            ? '4. 오류 종류 판별'
            : currentStep === 5
            ? '5. 결측치/이상치 정제'
            : currentStep === 6
            ? '6. 전처리 전후 비교'
            : currentStep === 7
            ? '7. 핵심 속성 관찰'
            : '전체 정리 및 완료'
        }
      />

      {/* STEP 1: 수치형 vs 범주형 */}
      {currentStep === 1 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Layers size={20} className="text-emerald-600" />
              <span>활동 1: 이 데이터는 어떤 종류일까? (수치형 vs 범주형)</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Iris 데이터의 각 필드가 크기나 양을 나타내는 <strong>수치형</strong>인지, 종류나 그룹을 나타내는 <strong>범주형</strong>인지 구분해보세요.
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
        </div>
      )}

      {/* STEP 2: X와 y 다시 확인하기 */}
      {currentStep === 2 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">
              활동 2: 모델이 보고 판단하는 값(X)과 맞혀야 하는 값(y)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              붓꽃 품종 분류 문제에서 각 속성이 <strong>입력 데이터 X</strong>인지 <strong>목표 데이터 y</strong>인지 지정하세요.
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

      {/* STEP 3: 데이터 탐정 시작 - 정상 관찰 & 오류 찾기 */}
      {currentStep === 3 && (
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
                탐정 수첩 다시 보기 📖
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

            {/* 5 Checkpoints Card */}
            <div className="p-3.5 bg-white rounded-xl border border-emerald-200 space-y-1 text-slate-800 font-medium">
              <span className="font-bold text-emerald-900 block text-xs mb-1">✓ 정상 데이터에서 확인할 5가지 관찰 포인트:</span>
              <ul className="space-y-1 text-[11px] list-disc list-inside text-slate-700">
                <li>필요한 측정 수치 및 품종 값이 비어 있지 않습니다 (null 없음).</li>
                <li>길이와 너비 값은 순수 숫자로 기록되어 있습니다 (문자 단위 포함 안 됨).</li>
                <li>값 자체에 'cm' 같은 단어가 붙어 있지 않으며, 단위는 항목 이름에서 확인합니다.</li>
                <li>같은 품종의 이름은 100% 동일한 대소문자 방식으로 표현되어 있습니다.</li>
                <li>다른 데이터들과 비교했을 때 유난히 크거나 작게 튀는 값(이상치)이 없습니다.</li>
              </ul>
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
                        onClick={() => setShowStatsFeature('sepalLength')}
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
            {showStatsFeature && (
              <div className="p-3 bg-slate-900 text-white rounded-xl text-xs space-y-1 font-mono animate-fadeIn">
                <div className="flex justify-between items-center font-bold text-amber-300">
                  <span>ORIGINAL_IRIS_DATASET 꽃받침 길이(sepalLength) 정상 통계 분포</span>
                  <button onClick={() => setShowStatsFeature(null)} className="text-slate-400 hover:text-white">닫기 ✕</button>
                </div>
                {(() => {
                  const s = getFeatureDistributionStats('sepalLength');
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

      {/* STEP 4: 오류 종류 판별 (Issue Type Classification) */}
      {currentStep === 4 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">
                활동 4: 오류 종류 판별하기 (오류 정답 판정)
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
        </div>
      )}

      {/* STEP 5: 결측치/이상치 정제 */}
      {currentStep === 5 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900">
              활동 5: 오류 데이터 어떻게 정제할까? (전처리 전략)
            </h3>

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

            {/* Outlier Treatment */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <span className="font-extrabold text-slate-900 block text-sm">
                2. 이상치(45 cm 같이 극단적인 값) 처리 방법 선택
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <ChoiceCard
                  optionKey="1"
                  label="즉시 삭제하기"
                  isSelected={outlierTreatment === 'delete_immediate'}
                  status="default"
                  onClick={() => setOutlierTreatment('delete_immediate')}
                />
                <ChoiceCard
                  optionKey="2"
                  label="오류 원인 확인 후 정상 범위 변환/삭제 (추천)"
                  isSelected={outlierTreatment === 'verify_first'}
                  status="correct"
                  onClick={() => setOutlierTreatment('verify_first')}
                />
              </div>

              {outlierTreatment === 'verify_first' && (
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-950 animate-fadeIn">
                  ✓ <strong>원인 확인 후 전처리:</strong> 입력 오타(4.5cm ➔ 45cm 입력 오타)인지 확인하고 정상 범위로 수정하거나 삭제 조치합니다.
                </div>
              )}
            </div>

            {/* Inconsistent & InvalidType Auto-clean Actions */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <span className="font-extrabold text-slate-900 block text-sm">
                3. 표현 불일치 & 데이터형 오류 자동 정제 실행
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

      {/* STEP 6: 전처리 전후 비교 */}
      {currentStep === 6 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">
              활동 6: 전처리 전과 후 데이터 상태 비교하기
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
                  <li>이상치 (45 cm 등): 2개 레코드</li>
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
                  <li>결측치: 대표 평균값으로 정제 완료</li>
                  <li>이상치: 정상 측정 범위로 수정 완료</li>
                  <li>표현 불일치: 'Iris-' 표준 클래스 통일 완료</li>
                  <li>데이터형 오류: 순수 수치(float) 파싱 완료</li>
                  <li className="pt-1 text-emerald-800 font-bold">👉 기계학습 모델 훈련에 최적화된 상태</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 7: 핵심 속성 관찰 */}
      {currentStep === 7 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">
              활동 7: 붓꽃 품종을 분류할 때 가장 중요한 핵심 속성은?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              3개 품종별 평균 측정치를 비교하고, 품종을 구별하기에 가장 차이가 뚜렷한 속성을 찾아보세요.
            </p>

            {/* Species Averages Table */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-900 block">품종별 평균값 비교:</span>
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                {speciesAverages.map(item => (
                  <div key={item.speciesKey} className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-900 block">{item.korean}</span>
                    <span className="text-[11px] text-slate-600 block">꽃잎길이 평균: {item.petalLengthMean} cm</span>
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
                  isSelected={act7Choice === 'petalLength'}
                  status={act7Choice === 'petalLength' ? 'correct' : 'default'}
                  onClick={() => setAct7Choice('petalLength')}
                />
                <ChoiceCard
                  optionKey="2"
                  label="꽃받침 너비 (Sepal Width) - 겹치는 범위"
                  isSelected={act7Choice === 'sepalWidth'}
                  status={act7Choice === 'sepalWidth' ? 'incorrect' : 'default'}
                  onClick={() => setAct7Choice('sepalWidth')}
                />
              </div>

              {act7Choice === 'petalLength' && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 leading-relaxed animate-fadeIn">
                  ✓ <strong>정답입니다!</strong> 세토사의 꽃잎 길이 평균은 1.46cm, 버시컬러는 4.26cm, 버지니카는 5.55cm로 3개 품종 간 차이가 매우 뚜렷하여 머신러닝 분류의 핵심 피처(Feature)로 사용됩니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 8: 전체 정리 및 완료 */}
      {currentStep === 8 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">04 데이터 전처리 탐정 활동 완료!</h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                정상 데이터 관찰부터 결측치·이상치 정제 및 전처리 전후 비교까지 탐정 미션을 완수하셨습니다.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-600 text-white text-xs font-bold space-y-1 shadow-xs">
              <span className="font-extrabold text-sm block">"Garbage In, Garbage Out!"</span>
              <p className="text-emerald-100 font-medium text-[11px]">
                깨끗하고 신뢰할 수 있는 데이터가 준비되어야 정확한 기계학습 모델을 학습시킬 수 있습니다.
              </p>
            </div>

            {/* AI Prompt Section */}
            <div className="pt-2 text-left">
              <PromptCard promptText={promptText} title="생성형 AI 탐구 프롬프트" />
            </div>

            <div className="pt-2">
              {isCompleted && (
                <div className="text-xs font-bold text-emerald-700 bg-emerald-100 p-2.5 rounded-xl block mb-2">
                  ✓ 이미 완료 처리된 영역입니다. 자유롭게 복습할 수 있습니다.
                </div>
              )}
              <PrimaryButton size="lg" fullWidth onClick={onComplete} icon={<CheckCircle2 size={22} />}>
                04 데이터 전처리 완료 처리하기
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
    </div>
  );
};
