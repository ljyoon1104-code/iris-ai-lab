import React, { useState, useMemo } from 'react';
import { useActivityScrollTop } from '../../hooks/useActivityScrollTop';
import { ORIGINAL_IRIS_DATASET } from '../../data/irisDataset';
import type { IrisRecord, IrisSpecies } from '../../types/iris';
import { stratifiedSplitDataset } from '../../algorithms/evaluation';
import { predictKNN, type KNNPredictionResult } from '../../algorithms/knn';
import {
  traceDecisionPath,
  buildDecisionTreeTrainingTrace,
  pruneTreeToConfirmed,
  type DecisionTreeNode,
  type TreeTrainingTrace,
} from '../../algorithms/decisionTree';
import { saveActiveModelConfig, clearActiveModelConfig } from '../../utils/storage';
import { ActivityProgress } from './ActivityProgress';
import { SpeciesBadge, SpeciesLabel } from '../common/SpeciesBadge';
import { PrimaryButton } from '../common/PrimaryButton';
import { SecondaryButton } from '../common/SecondaryButton';
import { DecisionTreeGrowthDiagram } from './DecisionTreeGrowthDiagram';
import { KNNPredictionVisualizer } from './KNNPredictionVisualizer';
import {
  Layers,
  Cpu,
  Play,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Target,
  GitBranch,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Eye,
  RotateCcw,
  Check,
  Split,
  FastForward,
  Lock,
  Unlock,
} from 'lucide-react';
import { ActivityChecklist } from './ActivityChecklist';

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

export const Module07Activity: React.FC<Module07ActivityProps> = ({ isCompleted: _isCompleted, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const topRef = useActivityScrollTop<HTMLDivElement>(currentStep);

  // Step 1: Split ratio
  const [splitRatio, setSplitRatio] = useState<number>(0.8); // 80:20
  const [act1Confirmed, setAct1Confirmed] = useState(false);

  // Step 2: Algorithm
  const [algorithm, setAlgorithm] = useState<'knn' | 'decisionTree'>('knn');
  const [act2Confirmed, setAct2Confirmed] = useState(false);

  // Step 3: Hyperparameters & Training state
  const [kParam, setKParam] = useState<number>(5);
  const [depthParam, setDepthParam] = useState<number>(3);
  const [isTrained, setIsTrained] = useState<boolean>(false);
  const [trainedTree, setTrainedTree] = useState<DecisionTreeNode | null>(null);

  // k-NN Interactive Step 3 Sub-states
  const [knnDataChoice, setKnnDataChoice] = useState<'train' | 'test' | null>(null);
  const [knnIsPreparing, setKnnIsPreparing] = useState<boolean>(false);
  const [knnIsPrepared, setKnnIsPrepared] = useState<boolean>(false);
  const [knnQuizAnswer, setKnnQuizAnswer] = useState<number | null>(null);

  // Decision Tree Interactive Step 3 Sub-states
  const [dtStarted, setDtStarted] = useState<boolean>(false);
  const [dtTrace, setDtTrace] = useState<TreeTrainingTrace | null>(null);
  const [dtStepIndex, setDtStepIndex] = useState<number>(0);
  const [dtConfirmedNodeIds, setDtConfirmedNodeIds] = useState<string[]>([]);
  const [dtSelectedCandId, setDtSelectedCandId] = useState<string | null>(null);
  const [dtExpandedCandIds, setDtExpandedCandIds] = useState<string[]>([]);
  const [dtIsPredicted, setDtIsPredicted] = useState<boolean>(false);
  const [dtShowNumericGini, setDtShowNumericGini] = useState<boolean>(false);
  const [dtIsAutoBuilding, setDtIsAutoBuilding] = useState<boolean>(false);
  const [dtCompleted, setDtCompleted] = useState<boolean>(false);

  // Step 4: New Data Prediction
  const [newPoint, setNewPoint] = useState<Record<FeatureKey, number>>({
    sepalLength: 6.0,
    sepalWidth: 3.0,
    petalLength: 4.8,
    petalWidth: 1.6,
  });
  const [rawInputPoint, setRawInputPoint] = useState<Record<FeatureKey, string>>({
    sepalLength: '6.0',
    sepalWidth: '3.0',
    petalLength: '4.8',
    petalWidth: '1.6',
  });
  const [predictedSpecies, setPredictedSpecies] = useState<IrisSpecies | null>(null);
  const [knnResult, setKnnResult] = useState<KNNPredictionResult | null>(null);
  const [dtTracePath, setDtTracePath] = useState<ReturnType<typeof traceDecisionPath> | null>(null);

  // Step 5: Summary
  const [act5Confirmed, setAct5Confirmed] = useState(false);

  const isStepCompleted = useMemo(() => {
    switch (currentStep) {
      case 1:
        return act1Confirmed;
      case 2:
        return act2Confirmed;
      case 3:
        return isTrained;
      case 4:
        return predictedSpecies !== null;
      case 5:
        return act5Confirmed;
      default:
        return true;
    }
  }, [currentStep, act1Confirmed, act2Confirmed, isTrained, predictedSpecies, act5Confirmed]);

  // Compute stratified split
  const splitResult = stratifiedSplitDataset(ORIGINAL_IRIS_DATASET, splitRatio, 42);

  const invalidateTraining = () => {
    setIsTrained(false);
    setTrainedTree(null);
    setPredictedSpecies(null);
    setKnnResult(null);
    setDtTracePath(null);
    clearActiveModelConfig();

    // Reset k-NN sub-states
    setKnnDataChoice(null);
    setKnnIsPreparing(false);
    setKnnIsPrepared(false);
    setKnnQuizAnswer(null);

    // Reset Decision Tree sub-states
    setDtStarted(false);
    setDtTrace(null);
    setDtStepIndex(0);
    setDtConfirmedNodeIds([]);
    setDtSelectedCandId(null);
    setDtExpandedCandIds([]);
    setDtIsPredicted(false);
    setDtShowNumericGini(false);
    setDtIsAutoBuilding(false);
    setDtCompleted(false);
  };

  // Point change handlers (Support empty string, typing '4.', and prevent '05' leading zero)
  const handlePointStringChange = (feat: FeatureKey, rawVal: string) => {
    let cleaned = rawVal;
    if (/^0[0-9]/.test(cleaned)) {
      cleaned = cleaned.replace(/^0+(?=[1-9])/, '');
    }

    setRawInputPoint(prev => ({ ...prev, [feat]: cleaned }));
    setPredictedSpecies(null);
    setKnnResult(null);
    setDtTracePath(null);

    const trimmed = cleaned.trim();
    if (trimmed !== '' && !isNaN(Number(trimmed))) {
      const parsed = parseFloat(trimmed);
      setNewPoint(prev => ({ ...prev, [feat]: Math.round(parsed * 10) / 10 }));
    }
  };

  const handleBlurPointInput = (feat: FeatureKey) => {
    const trimmed = (rawInputPoint[feat] || '').trim();
    if (trimmed === '' || isNaN(Number(trimmed))) {
      // If empty or invalid on blur, restore to last valid numeric value
      setRawInputPoint(prev => ({ ...prev, [feat]: String(newPoint[feat]) }));
    } else {
      const parsed = parseFloat(trimmed);
      const rounded = Math.round(parsed * 10) / 10;
      setNewPoint(prev => ({ ...prev, [feat]: rounded }));
      setRawInputPoint(prev => ({ ...prev, [feat]: String(rounded) }));
    }
  };

  const handlePresetChange = (preset: Record<FeatureKey, number>) => {
    setNewPoint(preset);
    setRawInputPoint({
      sepalLength: String(preset.sepalLength),
      sepalWidth: String(preset.sepalWidth),
      petalLength: String(preset.petalLength),
      petalWidth: String(preset.petalWidth),
    });
    setPredictedSpecies(null);
    setKnnResult(null);
    setDtTracePath(null);
  };

  const isAnyInputInvalid = (['sepalLength', 'sepalWidth', 'petalLength', 'petalWidth'] as FeatureKey[]).some(
    feat => {
      const val = (rawInputPoint[feat] || '').trim();
      return val === '' || isNaN(Number(val));
    }
  );

  const handleKnnChooseData = (choice: 'train' | 'test') => {
    setKnnDataChoice(choice);
  };

  const handleKnnPrepare = () => {
    setKnnIsPreparing(true);
    setTimeout(() => {
      setKnnIsPreparing(false);
      setKnnIsPrepared(true);
    }, 1000);
  };

  const handleKnnAnswerQuiz = (ans: number) => {
    setKnnQuizAnswer(ans);
    if (ans === 1) {
      setIsTrained(true);
      setTrainedTree(null);
      saveActiveModelConfig({
        algorithm: 'knn',
        splitRatio,
        kParam,
        depthParam,
        trainedAt: Date.now(),
      });
    }
  };

  const handleDtStartTraining = () => {
    const trace = buildDecisionTreeTrainingTrace(
      splitResult.trainData,
      ['sepalLength', 'sepalWidth', 'petalLength', 'petalWidth'],
      depthParam
    );
    setDtTrace(trace);
    setDtStarted(true);
    setDtStepIndex(0);
    setDtConfirmedNodeIds([]);
    setDtSelectedCandId(null);
    setDtExpandedCandIds([]);
    setDtIsPredicted(false);
    setDtCompleted(false);
  };

  const handleDtPredictCandidate = (candId: string) => {
    setDtSelectedCandId(candId);
  };

  const handleDtToggleExpandCandidate = (candId: string) => {
    setDtExpandedCandIds(prev =>
      prev.includes(candId) ? prev.filter(id => id !== candId) : [...prev, candId]
    );
  };

  const handleDtConfirmPrediction = () => {
    if (!dtTrace || !dtSelectedCandId) return;
    const currentStepData = dtTrace.steps[dtStepIndex];
    setDtIsPredicted(true);
    setDtConfirmedNodeIds(prev => Array.from(new Set([...prev, currentStepData.nodeId])));
  };

  const handleDtNextStep = () => {
    if (!dtTrace) return;
    if (dtStepIndex < dtTrace.steps.length - 1) {
      setDtStepIndex(prev => prev + 1);
      setDtSelectedCandId(null);
      setDtExpandedCandIds([]);
      setDtIsPredicted(false);
    } else {
      handleDtFinishAll();
    }
  };

  const handleDtAutoBuildRest = () => {
    if (!dtTrace) return;
    setDtIsAutoBuilding(true);
    const allNodeIds = dtTrace.steps.map(s => s.nodeId);
    setDtConfirmedNodeIds(allNodeIds);
    setTimeout(() => {
      setDtIsAutoBuilding(false);
      handleDtFinishAll();
    }, 1000);
  };

  const handleDtFinishAll = () => {
    if (!dtTrace) return;
    const allNodeIds = dtTrace.steps.map(s => s.nodeId);
    setDtConfirmedNodeIds(allNodeIds);
    setDtCompleted(true);
    setIsTrained(true);
    setTrainedTree(dtTrace.fullTree);
    saveActiveModelConfig({
      algorithm: 'decisionTree',
      splitRatio,
      kParam,
      depthParam,
      trainedAt: Date.now(),
    });
  };

  const handlePredictNewSample = () => {
    if (algorithm === 'knn') {
      if (!isTrained) return;
      const res = predictKNN(splitResult.trainData, newPoint, ['petalLength', 'petalWidth'], kParam);
      setKnnResult(res);
      setPredictedSpecies(res.predictedSpecies);
    } else {
      if (!trainedTree) return;
      const trace = traceDecisionPath(trainedTree, newPoint);
      setDtTracePath(trace);
      setPredictedSpecies(trace.predictedSpecies);
    }
  };

  const checklistItems = [
    { id: 'split', label: '학습용/테스트용 데이터 분할 비율 선택', isCompleted: currentStep >= 1 },
    { id: 'algorithm', label: '기계학습 알고리즘 선택 (k-NN 또는 의사결정트리)', isCompleted: currentStep >= 2 },
    { id: 'train', label: '하이퍼파라미터 설정 및 모델 구축/훈련 실행', isCompleted: isTrained },
    { id: 'predict', label: '새로운 붓꽃 수치 데이터 예측 실행', isCompleted: predictedSpecies !== null },
  ];

  const trainSpeciesCounts = {
    'Iris-setosa': splitResult.trainData.filter(r => r.species === 'Iris-setosa').length,
    'Iris-versicolor': splitResult.trainData.filter(r => r.species === 'Iris-versicolor').length,
    'Iris-virginica': splitResult.trainData.filter(r => r.species === 'Iris-virginica').length,
  };
  const testSpeciesCounts = {
    'Iris-setosa': splitResult.testData.filter(r => r.species === 'Iris-setosa').length,
    'Iris-versicolor': splitResult.testData.filter(r => r.species === 'Iris-versicolor').length,
    'Iris-virginica': splitResult.testData.filter(r => r.species === 'Iris-virginica').length,
  };

  let dtInternalCount = 0;
  let dtLeafCount = 0;
  if (dtTrace?.fullTree) {
    const countNodes = (n: DecisionTreeNode) => {
      if (n.isLeaf) dtLeafCount++;
      else {
        dtInternalCount++;
        if (n.left) countNodes(n.left);
        if (n.right) countNodes(n.right);
      }
    };
    countNodes(dtTrace.fullTree);
  }

  return (
    <div className="space-y-6 scroll-mt-24" ref={topRef}>
      <ActivityProgress
        currentStep={currentStep}
        totalSteps={totalSteps}
        title={
          currentStep === 1
            ? '1. 데이터 분할 (Train / Test)'
            : currentStep === 2
            ? '2. 알고리즘 선택'
            : currentStep === 3
            ? '3. 모델 학습'
            : currentStep === 4
            ? '4. 새 데이터 품종 예측'
            : '5. 모델 만들기 완료'
        }
      />

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
            [공식 6단계 과정] ⑤ 모델 학습
          </span>
          <span className="text-xs text-slate-500 font-medium">07 모델 만들기</span>
        </div>

        <h2 className="text-xl font-black text-slate-900">
          [모델은 어떻게 만들어질까?]
        </h2>

        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          데이터를 나누고 알고리즘을 선택한 뒤, 훈련 데이터(Train)로부터 새로운 붓꽃의 품종을 판정하는 AI 모델을 구축합니다.
        </p>

        <div className="flex items-center gap-1 sm:gap-2 pt-2 border-t border-slate-100 flex-wrap text-[11px] font-bold text-slate-500">
          <span className="text-emerald-700">1. 데이터 준비</span>
          <span>→</span>
          <span className="text-emerald-700">2. 데이터 분리</span>
          <span>→</span>
          <span className="text-emerald-700">3. 알고리즘 선택</span>
          <span>→</span>
          <span className="text-emerald-700 font-black">4. 모델 학습</span>
          <span>→</span>
          <span className="text-slate-400">5. 새 데이터 예측</span>
        </div>
      </div>

      {currentStep === 1 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Layers size={20} className="text-emerald-600" />
              <span>활동 1: 학습용 / 테스트용 데이터 분할 비율 선택하기</span>
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              3개 품종의 비율(1:1:1)을 공정하게 유지하면서 150개의 데이터를 학습용(Train)과 테스트용(Test)으로 분리합니다.
            </p>

            <div className="grid grid-cols-3 gap-2.5 text-xs">
              {[0.8, 0.7, 0.6].map(ratio => {
                const trainPct = Math.round(ratio * 100);
                const testPct = Math.round((1 - ratio) * 100);
                const isSelected = splitRatio === ratio;
                return (
                  <button
                    key={ratio}
                    onClick={() => {
                      setSplitRatio(ratio);
                      invalidateTraining();
                    }}
                    className={`p-3.5 rounded-xl border-2 font-extrabold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs ring-2 ring-emerald-300'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="block text-sm font-black">{trainPct} : {testPct}</span>
                    <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                      {ratio === 0.8 ? '(표준 분할)' : ratio === 0.7 ? '(중간 검증)' : '(많은 테스트)'}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-emerald-950 text-sm flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                    학습용 데이터 (Train)
                  </span>
                  <span className="font-mono font-black text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-300">
                    {splitResult.trainData.length}개 ({Math.round(splitRatio * 100)}%)
                  </span>
                </div>
                <div className="flex items-center justify-around py-1 bg-white/80 rounded-lg border border-emerald-100 text-[11px] font-bold text-slate-700">
                  <span className="flex items-center gap-1"><SpeciesLabel species="Iris-setosa" /> {trainSpeciesCounts['Iris-setosa']}개</span>
                  <span className="flex items-center gap-1"><SpeciesLabel species="Iris-versicolor" /> {trainSpeciesCounts['Iris-versicolor']}개</span>
                  <span className="flex items-center gap-1"><SpeciesLabel species="Iris-virginica" /> {trainSpeciesCounts['Iris-virginica']}개</span>
                </div>
                <p className="text-[11px] text-emerald-900 leading-relaxed font-medium">
                  💡 모델이 품종별 특징과 수치 패턴을 학습하는 데 사용하는 데이터입니다.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
                    테스트용 데이터 (Test)
                  </span>
                  <span className="font-mono font-black text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-300">
                    {splitResult.testData.length}개 ({Math.round((1 - splitRatio) * 100)}%)
                  </span>
                </div>
                <div className="flex items-center justify-around py-1 bg-white/80 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700">
                  <span className="flex items-center gap-1"><SpeciesLabel species="Iris-setosa" /> {testSpeciesCounts['Iris-setosa']}개</span>
                  <span className="flex items-center gap-1"><SpeciesLabel species="Iris-versicolor" /> {testSpeciesCounts['Iris-versicolor']}개</span>
                  <span className="flex items-center gap-1"><SpeciesLabel species="Iris-virginica" /> {testSpeciesCounts['Iris-virginica']}개</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  🔒 학습에 사용하지 않은 독립된 데이터로 모델의 일반화 성능을 확인하고 과대적합 여부를 공정하게 평가하기 위한 검증용 데이터입니다.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-600 font-medium">💡 학습/테스트 데이터 분할 비율을 확인한 뒤 버튼을 눌러주세요.</span>
              <SecondaryButton
                size="sm"
                onClick={() => setAct1Confirmed(true)}
                className={act1Confirmed ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : ''}
              >
                {act1Confirmed ? '✓ 데이터 분할 확인 완료' : '데이터 분할 확인 완료'}
              </SecondaryButton>
            </div>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Cpu size={20} className="text-teal-600" />
              <span>활동 2: 모델 구축에 사용할 알고리즘 선택하기</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <button
                onClick={() => {
                  setAlgorithm('knn');
                  invalidateTraining();
                }}
                className={`p-5 rounded-2xl border-2 text-left space-y-2 transition-all cursor-pointer ${
                  algorithm === 'knn'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-md ring-2 ring-emerald-300'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center gap-2 font-black text-sm text-emerald-900">
                  <Target size={18} className="text-emerald-600" />
                  <span>k-NN (최근접 이웃)</span>
                </div>
                <p className="text-slate-600 leading-relaxed font-medium text-[11px]">
                  새로운 붓꽃이 들어왔을 때, 훈련 데이터 중 가장 가까운 k개 이웃의 다수결 득표로 품종을 판정합니다.
                </p>
                <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  학습 방식: 훈련 데이터를 기준 데이터로 등록
                </span>
              </button>

              <button
                onClick={() => {
                  setAlgorithm('decisionTree');
                  invalidateTraining();
                }}
                className={`p-5 rounded-2xl border-2 text-left space-y-2 transition-all cursor-pointer ${
                  algorithm === 'decisionTree'
                    ? 'border-teal-600 bg-teal-50 text-teal-950 shadow-md ring-2 ring-teal-300'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300'
                }`}
              >
                <div className="flex items-center gap-2 font-black text-sm text-teal-900">
                  <GitBranch size={18} className="text-teal-600" />
                  <span>의사결정트리 (Decision Tree)</span>
                </div>
                <p className="text-slate-600 leading-relaxed font-medium text-[11px]">
                  학습용 데이터(Train)에서 품종의 섞임(불순도)을 가장 많이 줄여주는 질문을 찾아 단계별 질문 나무(Tree)를 생성합니다.
                </p>
                <span className="inline-block text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full">
                  학습 방식: 불순도를 줄이는 질문을 찾아 Tree 생성
                </span>
              </button>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-600 font-medium">💡 사용할 알고리즘을 선택한 뒤 버튼을 눌러주세요.</span>
              <SecondaryButton
                size="sm"
                onClick={() => setAct2Confirmed(true)}
                className={act2Confirmed ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : ''}
              >
                {act2Confirmed ? '✓ 알고리즘 선택 완료' : '알고리즘 선택 완료'}
              </SecondaryButton>
            </div>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-6 animate-fadeIn">
          {algorithm === 'knn' ? (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200 inline-block">
                    k-NN 학습 원리 체험
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <Target size={20} className="text-emerald-600" />
                    <span>k-NN은 데이터를 어떻게 학습(준비)할까?</span>
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-bold">학습용 데이터 직접 활용(k-NN 준비) 체험</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                "k-NN은 미리 수식이나 규칙 나무를 학습하지 않습니다. 대신 <strong>학습용 데이터(Train)</strong>를 메모리에 예측 기준으로 준비해 두고, 나중에 새로운 데이터가 들어왔을 때 가장 가까운 이웃을 찾습니다."
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <span className="text-xs font-black text-slate-900 block flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px]">1</span>
                  <span>어떤 데이터를 준비해야 할까?</span>
                </span>
                <p className="text-xs text-slate-600 font-medium">
                  "k-NN이 새로운 붓꽃을 판단할 때 기준으로 삼아야 하는 데이터는 무엇일까요?"
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleKnnChooseData('train')}
                    className={`p-4 rounded-xl border-2 text-left space-y-1.5 cursor-pointer transition-all ${
                      knnDataChoice === 'train'
                        ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-300'
                        : 'border-slate-200 bg-slate-50/50 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-emerald-950">학습용 데이터 (Train)</span>
                      <span className="text-[11px] font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-300">
                        {splitResult.trainData.length}개
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-600 font-medium flex gap-1">
                      <span>● {trainSpeciesCounts['Iris-setosa']}</span>
                      <span>▲ {trainSpeciesCounts['Iris-versicolor']}</span>
                      <span>■ {trainSpeciesCounts['Iris-virginica']}</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-800 block">
                      [학습용 데이터 선택]
                    </span>
                  </button>

                  <button
                    onClick={() => handleKnnChooseData('test')}
                    className={`p-4 rounded-xl border-2 text-left space-y-1.5 cursor-pointer transition-all ${
                      knnDataChoice === 'test'
                        ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-300'
                        : 'border-slate-200 bg-slate-50/50 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-800">테스트용 데이터 (Test)</span>
                      <span className="text-[11px] font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-300">
                        {splitResult.testData.length}개
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-600 font-medium flex gap-1">
                      <span>● {testSpeciesCounts['Iris-setosa']}</span>
                      <span>▲ {testSpeciesCounts['Iris-versicolor']}</span>
                      <span>■ {testSpeciesCounts['Iris-virginica']}</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 block">
                      [테스트용 데이터 선택]
                    </span>
                  </button>
                </div>

                {knnDataChoice === 'train' && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 font-bold animate-fadeIn">
                    ✓ 맞습니다! k-NN은 학습용 데이터(Train {splitResult.trainData.length}개)를 예측의 기준으로 사용합니다.
                  </div>
                )}
                {knnDataChoice === 'test' && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 font-bold animate-fadeIn">
                    ⚠️ 테스트 데이터(Test)는 모델의 성능을 공정하게 평가하기 위한 검증용이므로, 학습 및 기준 데이터로는 절대 사용하지 않습니다.
                  </div>
                )}
              </div>

              {knnDataChoice === 'train' && (
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 animate-fadeIn">
                  <span className="text-xs font-black text-slate-900 block flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px]">2</span>
                    <span>k는 몇 개의 이웃을 볼까?</span>
                  </span>
                  <p className="text-xs text-slate-600 font-medium">
                    새 붓꽃이 들어왔을 때 거리가 가장 가까운 이웃을 몇 개까지 비교하여 다수결 투표할지 결정합니다.
                  </p>

                  <div className="grid grid-cols-4 gap-2">
                    {[1, 3, 5, 7].map(kVal => (
                      <button
                        key={kVal}
                        onClick={() => {
                          setKParam(kVal);
                          invalidateTraining();
                          setKnnDataChoice('train');
                        }}
                        className={`p-3 rounded-xl font-bold font-mono text-sm cursor-pointer transition-all ${
                          kParam === kVal
                            ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        k = {kVal}
                      </button>
                    ))}
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-bold">
                    {kParam === 1 && 'k = 1 → 가장 가까운 1개 이웃의 품종으로 바로 결정합니다.'}
                    {kParam === 3 && 'k = 3 → 가장 가까운 3개 이웃의 다수결(과반수)로 품종을 결정합니다.'}
                    {kParam === 5 && 'k = 5 → 가장 가까운 5개 이웃의 다수결로 결정합니다. (가장 널리 쓰이는 표준값)'}
                    {kParam === 7 && 'k = 7 → 가장 가까운 7개 이웃의 다수결로 결정합니다. (더 넓은 범위 고려)'}
                  </div>
                </div>
              )}

              {knnDataChoice === 'train' && (
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4 animate-fadeIn">
                  <span className="text-xs font-black text-slate-900 block flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px]">3</span>
                    <span>예측 기준 데이터 준비</span>
                  </span>

                  {!knnIsPrepared ? (
                    <PrimaryButton
                      size="md"
                      fullWidth
                      disabled={knnIsPreparing}
                      onClick={handleKnnPrepare}
                      icon={<Play size={16} />}
                    >
                      {knnIsPreparing
                        ? `학습용 데이터 ${splitResult.trainData.length}개 연결 중...`
                        : `학습용 데이터 ${splitResult.trainData.length}개 예측 기준으로 준비하기`}
                    </PrimaryButton>
                  ) : (
                    <div className="space-y-3 animate-fadeIn">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3.5 bg-emerald-50 border-2 border-emerald-400 rounded-xl space-y-1.5 text-xs text-emerald-950">
                          <div className="flex items-center justify-between font-black">
                            <span className="flex items-center gap-1.5">
                              <Unlock size={15} className="text-emerald-700" />
                              예측 기준 데이터 영역 (Train)
                            </span>
                            <span className="font-mono">{splitResult.trainData.length}개</span>
                          </div>
                          <p className="text-[11px] text-emerald-800 font-medium">
                            ✓ {splitResult.trainData.length}개의 꽃잎 좌표가 메모리에 등록되어 새로운 데이터와 거리 비교할 준비가 되었습니다.
                          </p>
                        </div>

                        <div className="p-3.5 bg-slate-50 border border-slate-300 rounded-xl space-y-1.5 text-xs text-slate-700">
                          <div className="flex items-center justify-between font-black">
                            <span className="flex items-center gap-1.5">
                              <Lock size={15} className="text-slate-500" />
                              평가용 데이터 영역 (Test - 미사용)
                            </span>
                            <span className="font-mono">{splitResult.testData.length}개</span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium">
                            🔒 모델 평가(08단계) 전까지 격리 보관되며 학습에는 일절 참여하지 않습니다.
                          </p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold space-y-1">
                        <span className="block text-sm font-black">✓ 훈련 데이터 준비 완료</span>
                        <p className="text-emerald-100 font-medium text-[11px]">
                          새로운 데이터가 들어오면 이 {splitResult.trainData.length}개 데이터와 거리를 비교할 준비가 되었습니다. (k={kParam})
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {knnIsPrepared && (
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3 animate-fadeIn">
                  <span className="text-xs font-black text-emerald-900 block flex items-center gap-1.5">
                    <HelpCircle size={16} className="text-emerald-600" />
                    <span>k-NN 학습 확인 문제</span>
                  </span>
                  <p className="text-xs text-slate-700 font-extrabold">
                    "k-NN은 학습 단계에서 판단 규칙 Tree를 미리 만들까요?"
                  </p>

                  <div className="space-y-2 text-xs">
                    <button
                      onClick={() => handleKnnAnswerQuiz(0)}
                      className={`w-full p-3 rounded-xl border text-left font-bold cursor-pointer transition-all ${
                        knnQuizAnswer === 0
                          ? 'border-amber-400 bg-amber-50 text-amber-950'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      A. 네, 미리 판단 규칙이나 수식을 만들어 둡니다.
                    </button>

                    <button
                      onClick={() => handleKnnAnswerQuiz(1)}
                      className={`w-full p-3 rounded-xl border text-left font-bold cursor-pointer transition-all ${
                        knnQuizAnswer === 1
                          ? 'border-emerald-600 bg-emerald-500 text-white ring-2 ring-emerald-300'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      B. 아니요, Train 데이터를 준비해 두고 예측할 때 가까운 이웃을 찾습니다. (정답)
                    </button>
                  </div>

                  {knnQuizAnswer === 1 && (
                    <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold text-xs animate-fadeIn space-y-1">
                      <span className="block font-black">🎉 정답입니다! k-NN 준비 완료</span>
                      <p className="text-[11px] text-emerald-800 font-medium">
                        k-NN은 미리 수식이나 복잡한 규칙 트리를 만들지 않고, <strong>학습용 데이터(Train)를 그대로 기억해 두었다가 새 데이터가 들어왔을 때 가장 가까운 이웃을 찾는 방식</strong>입니다. 이제 4단계에서 새로운 붓꽃의 최근접 이웃을 찾아볼 수 있습니다.
                      </p>
                    </div>
                  )}
                  {knnQuizAnswer === 0 && (
                    <div className="p-3 rounded-xl bg-amber-100 border border-amber-300 text-amber-950 font-bold text-xs animate-fadeIn">
                      다시 생각해 보세요! k-NN은 규칙을 미리 만들지 않고, 훈련 데이터를 메모리에 보관해 두었다가 예측 시점에 이웃 거리를 계산합니다.
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <span className="text-xs font-black text-teal-800 bg-teal-100 px-2.5 py-1 rounded-full border border-teal-200 inline-block">
                    의사결정트리 학습 과정 체험
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <GitBranch size={20} className="text-teal-600" />
                    <span>AI는 훈련 데이터에서 어떻게 질문을 찾을까?</span>
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-bold">지니 불순도 최소화 분기 탐구</span>
              </div>

              {!dtStarted ? (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-teal-50/60 border border-teal-200 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-teal-950">
                        현재 학습용 데이터 구성 ({splitResult.trainData.length}개)
                      </span>
                      <span className="text-[11px] font-bold text-teal-700 bg-white px-2 py-0.5 rounded border border-teal-300">
                        초기 섞임 정도: 불순도 높음 (0.667)
                      </span>
                    </div>

                    <div className="flex items-center justify-around py-2 bg-white rounded-xl border border-teal-100 text-xs font-bold">
                      <span className="flex items-center gap-1"><SpeciesLabel species="Iris-setosa" /> {trainSpeciesCounts['Iris-setosa']}개</span>
                      <span className="flex items-center gap-1"><SpeciesLabel species="Iris-versicolor" /> {trainSpeciesCounts['Iris-versicolor']}개</span>
                      <span className="flex items-center gap-1"><SpeciesLabel species="Iris-virginica" /> {trainSpeciesCounts['Iris-virginica']}개</span>
                    </div>

                    <p className="text-slate-600 leading-relaxed font-medium text-[11px]">
                      의사결정트리는 이 훈련 데이터를 가장 깔끔하게 나눌 수 있는 <strong>'좋은 질문'</strong>을 하나씩 찾아 판단 규칙 Tree를 만듭니다.
                    </p>
                  </div>

                  <div className="space-y-2 text-xs">
                    <span className="font-extrabold text-slate-900 block">트리 최대 깊이 (maxDepth) 설정:</span>
                    <div className="grid grid-cols-3 gap-2">
                      {[2, 3, 4].map(d => (
                        <button
                          key={d}
                          onClick={() => {
                            setDepthParam(d);
                            invalidateTraining();
                          }}
                          className={`p-3 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                            depthParam === d
                              ? 'bg-teal-600 text-white ring-2 ring-teal-300 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          깊이 {d} ({d === 2 ? '단순 2회 분기' : d === 3 ? '표준 3회 분기' : '정밀 4회 분기'})
                        </button>
                      ))}
                    </div>
                  </div>

                  <PrimaryButton size="lg" fullWidth onClick={handleDtStartTraining} icon={<Play size={18} />}>
                    의사결정트리 학습 시작하기 (질문 탐구)
                  </PrimaryButton>
                </div>
              ) : !dtCompleted && dtTrace ? (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                        <Split size={16} className="text-teal-600" />
                        분기 탐구 {dtStepIndex + 1} / {dtTrace.steps.length}단계 (깊이 {dtTrace.steps[dtStepIndex].depth})
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-300">
                        노드 데이터: {dtTrace.steps[dtStepIndex].samples}개
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-bold text-slate-600">
                      <span>대상: {dtTrace.steps[dtStepIndex].nodeId === 'root' ? '루트 (전체 훈련 데이터)' : `노드 [${dtTrace.steps[dtStepIndex].nodeId}]`}</span>
                      <span>·</span>
                      <span className="text-emerald-700">● {dtTrace.steps[dtStepIndex].speciesDistribution['Iris-setosa']}</span>
                      <span className="text-orange-700">▲ {dtTrace.steps[dtStepIndex].speciesDistribution['Iris-versicolor']}</span>
                      <span className="text-purple-700">■ {dtTrace.steps[dtStepIndex].speciesDistribution['Iris-virginica']}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">
                        이 데이터를 나눌 질문 후보 3개 중, 어떤 질문이 가장 효과적일까요?
                      </span>
                      <button
                        onClick={() => setDtShowNumericGini(!dtShowNumericGini)}
                        className="text-[11px] text-teal-700 hover:text-teal-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>{dtShowNumericGini ? '기본 설명으로 보기' : '수치(지니 불순도)로 보기'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      {dtTrace.steps[dtStepIndex].candidates.map((cand, idx) => {
                        const isSelected = dtSelectedCandId === cand.id;
                        const isExpanded = dtExpandedCandIds.includes(cand.id);
                        const isBestRevealed = dtIsPredicted && cand.isBest;

                        return (
                          <div
                            key={cand.id}
                            className={`p-3.5 rounded-xl border-2 text-left space-y-2 transition-all ${
                              isBestRevealed
                                ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-300'
                                : isSelected
                                ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-200'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-slate-900">
                                [후보 {String.fromCharCode(65 + idx)}]
                              </span>
                              {isBestRevealed && (
                                <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-md border border-emerald-300">
                                  ✓ 불순도를 가장 낮추는 질문 (AI 선택)
                                </span>
                              )}
                            </div>

                            <div className="font-black text-sm text-slate-900 bg-white/90 p-2 rounded-lg border border-slate-200 text-center">
                              {cand.featureLabel} ≤ {cand.threshold} cm
                            </div>

                            <button
                              onClick={() => handleDtToggleExpandCandidate(cand.id)}
                              className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] cursor-pointer text-center"
                            >
                              {isExpanded ? '▲ 분할 결과 접기' : '▼ [나눠보기] 결과 확인'}
                            </button>

                            {isExpanded && (
                              <div className="p-2 bg-white rounded-lg border border-slate-200 space-y-2 text-[10px] animate-fadeIn">
                                <div className="space-y-0.5">
                                  <span className="font-bold text-emerald-700 block">예 (≤ {cand.threshold}cm): {cand.leftCount}개</span>
                                  <div className="flex gap-1.5 font-medium text-slate-600">
                                    <span>●{cand.leftDistribution['Iris-setosa']}</span>
                                    <span>▲{cand.leftDistribution['Iris-versicolor']}</span>
                                    <span>■{cand.leftDistribution['Iris-virginica']}</span>
                                  </div>
                                </div>

                                <div className="space-y-0.5 pt-1 border-t border-slate-100">
                                  <span className="font-bold text-orange-700 block">아니오 (&gt; {cand.threshold}cm): {cand.rightCount}개</span>
                                  <div className="flex gap-1.5 font-medium text-slate-600">
                                    <span>●{cand.rightDistribution['Iris-setosa']}</span>
                                    <span>▲{cand.rightDistribution['Iris-versicolor']}</span>
                                    <span>■{cand.rightDistribution['Iris-virginica']}</span>
                                  </div>
                                </div>

                                <div className="pt-1 border-t border-slate-100 flex items-center justify-between font-bold">
                                  <span className="text-slate-500">섞임 정도:</span>
                                  <span className={cand.impurityLevel === 'very_low' ? 'text-emerald-700' : cand.impurityLevel === 'low' ? 'text-blue-700' : 'text-amber-700'}>
                                    {cand.impurityLabel}
                                  </span>
                                </div>

                                {dtShowNumericGini && (
                                  <div className="pt-1 border-t border-slate-100 text-[10px] text-slate-500 font-mono">
                                    가중 Gini = {cand.weightedGini}
                                  </div>
                                )}
                              </div>
                            )}

                            {!dtIsPredicted && (
                              <button
                                onClick={() => handleDtPredictCandidate(cand.id)}
                                className={`w-full py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-teal-600 text-white shadow-xs'
                                    : 'bg-slate-50 text-slate-700 border border-slate-300 hover:bg-slate-100'
                                }`}
                              >
                                {isSelected ? '✓ 나의 예상 선택됨' : '이 질문으로 예상하기'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {!dtIsPredicted ? (
                    <PrimaryButton
                      size="md"
                      fullWidth
                      disabled={!dtSelectedCandId}
                      onClick={handleDtConfirmPrediction}
                      icon={<Check size={18} />}
                    >
                      {dtSelectedCandId ? '내 예상 확인하기 (AI 선택 질문 공개)' : '후보 질문 중 하나를 예상으로 선택해 주세요'}
                    </PrimaryButton>
                  ) : (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3 text-xs animate-fadeIn">
                      {dtTrace.steps[dtStepIndex].candidates.find(c => c.id === dtSelectedCandId)?.isBest ? (
                        <div className="text-emerald-950 font-bold space-y-1">
                          <span className="block text-sm font-black text-emerald-900">✓ 좋은 예상입니다!</span>
                          <p className="text-[11px] font-medium text-emerald-800">
                            이 질문이 현재 데이터를 가장 깔끔하게 나누며, 품종의 섞임(불순도)을 가장 많이 줄여줍니다.
                          </p>
                        </div>
                      ) : (
                        <div className="text-slate-800 font-medium space-y-1">
                          <span className="block text-sm font-black text-teal-900">💡 AI의 선택과 비교해 봅시다</span>
                          <p className="text-[11px] leading-relaxed">
                            선택하신 질문도 데이터를 나눌 수 있지만, AI가 지니 불순도를 계산한 결과에서는 <strong>[{dtTrace.steps[dtStepIndex].bestFeature} ≤ {dtTrace.steps[dtStepIndex].bestThreshold} cm]</strong> 질문이 품종의 섞임을 더 많이 줄였습니다.
                          </p>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                        <PrimaryButton
                          size="md"
                          onClick={handleDtNextStep}
                          icon={<ArrowRight size={16} />}
                          className="w-full sm:w-auto"
                        >
                          {dtStepIndex < dtTrace.steps.length - 1
                            ? '다음 핵심 분기 탐구하기'
                            : '의사결정트리 학습 완료하기'}
                        </PrimaryButton>

                        {dtStepIndex < dtTrace.steps.length - 1 && (
                          <SecondaryButton
                            size="md"
                            disabled={dtIsAutoBuilding}
                            onClick={handleDtAutoBuildRest}
                            icon={<FastForward size={16} />}
                            className="w-full sm:w-auto"
                          >
                            {dtIsAutoBuilding ? '남은 규칙 학습 중...' : '남은 규칙 자동 학습하기'}
                          </SecondaryButton>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <span className="text-xs font-black text-slate-800 block flex items-center gap-1.5">
                      <GitBranch size={16} className="text-teal-600" />
                      <span>현재까지 구축된 판단 규칙 Tree</span>
                    </span>
                    <div className="overflow-x-auto touch-pan-x py-3 w-full flex justify-center">
                      <DecisionTreeGrowthDiagram
                        tree={pruneTreeToConfirmed(dtTrace.fullTree, new Set(dtConfirmedNodeIds))}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Completed State Screen for Decision Tree */
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 size={18} className="text-emerald-600" />
                        의사결정트리 모델 학습 완료!
                      </span>
                      <span className="font-mono text-[11px] font-bold bg-white text-emerald-800 px-2.5 py-0.5 rounded border border-emerald-300">
                        깊이 {depthParam} 트리 완성
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px] font-bold">
                      <div className="p-2 bg-white rounded-lg border border-emerald-200">
                        <span className="text-slate-500 block text-[10px]">학습 데이터</span>
                        <span className="text-emerald-900">{splitResult.trainData.length}개</span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-emerald-200">
                        <span className="text-slate-500 block text-[10px]">사용 속성</span>
                        <span className="text-emerald-900">4개 속성 전체</span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-emerald-200">
                        <span className="text-slate-500 block text-[10px]">판단 질문 수</span>
                        <span className="text-emerald-900">{dtInternalCount}개</span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-emerald-200">
                        <span className="text-slate-500 block text-[10px]">최종 분류 리프</span>
                        <span className="text-emerald-900">{dtLeafCount}개</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                      ✓ 이제 방금 구축한 판단 규칙 나무를 이용해 새로운 붓꽃 수치 데이터를 스무고개처럼 판정할 수 있습니다.
                    </p>
                  </div>

                  {/* Final Full Tree Diagram */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                    <span className="text-xs font-black text-slate-900 block flex items-center gap-1.5">
                      <GitBranch size={16} className="text-teal-600" />
                      <span>완성된 의사결정트리 전체 구조 (maxDepth = {depthParam})</span>
                    </span>
                    <div className="overflow-x-auto touch-pan-x py-3 w-full flex justify-center">
                      <DecisionTreeGrowthDiagram tree={dtTrace!.fullTree} />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={invalidateTraining}
                      className="text-xs text-slate-500 hover:text-slate-700 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw size={13} />
                      <span>설정 변경 및 다시 학습하기</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* STEP 4: 새 데이터 품종 예측 */}
      {currentStep === 4 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Play size={20} className="text-purple-600" />
              <span>활동 4: 구축된 모델로 새로운 붓꽃 수치 데이터 예측하기</span>
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {algorithm === 'knn'
                ? '방금 준비한 Train 데이터에서 새로운 붓꽃과 가까운 이웃을 찾아봅시다.'
                : '방금 학습한 판단 규칙이 새로운 붓꽃을 어떻게 분류하는지 확인해 봅시다.'}
            </p>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <span className="font-bold text-slate-900 block">새로 수집된 붓꽃 측정치 조정:</span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                {(['sepalLength', 'sepalWidth', 'petalLength', 'petalWidth'] as FeatureKey[]).map(feat => (
                  <div key={feat} className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-500 block font-sans">{FEATURE_NAMES[feat]}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={rawInputPoint[feat]}
                      onChange={e => handlePointStringChange(feat, e.target.value)}
                      onBlur={() => handleBlurPointInput(feat)}
                      placeholder="0.0"
                      className="w-full font-bold text-slate-900 border-b border-slate-300 font-mono text-xs focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              {/* Quick Sample Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                  <Sparkles size={13} className="text-amber-500" /> 테스트 예시:
                </span>
                <button
                  onClick={() => handlePresetChange({ sepalLength: 5.1, sepalWidth: 3.5, petalLength: 1.4, petalWidth: 0.2 })}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold rounded-lg text-[11px] cursor-pointer inline-flex items-center gap-1"
                >
                  <span className="text-emerald-600 font-black">●</span>
                  <span>세토사 샘플</span>
                </button>
                <button
                  onClick={() => handlePresetChange({ sepalLength: 5.7, sepalWidth: 2.8, petalLength: 4.1, petalWidth: 1.3 })}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-orange-800 font-bold rounded-lg text-[11px] cursor-pointer inline-flex items-center gap-1"
                >
                  <span className="text-orange-600 font-black">▲</span>
                  <span>버시컬러 샘플</span>
                </button>
                <button
                  onClick={() => handlePresetChange({ sepalLength: 6.3, sepalWidth: 3.3, petalLength: 6.0, petalWidth: 2.5 })}
                  className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-800 font-bold rounded-lg text-[11px] cursor-pointer inline-flex items-center gap-1"
                >
                  <span className="text-purple-600 font-black">■</span>
                  <span>버지니카 샘플</span>
                </button>
              </div>

              <div className="pt-2 space-y-1.5">
                <PrimaryButton
                  size="md"
                  fullWidth
                  disabled={!isTrained || isAnyInputInvalid}
                  onClick={handlePredictNewSample}
                  icon={<Sparkles size={18} />}
                >
                  {!isTrained
                    ? '3단계에서 모델을 먼저 학습/준비해 주세요'
                    : isAnyInputInvalid
                    ? '4가지 측정값을 모두 입력해 주세요'
                    : '구축된 모델로 품종 예측하기'}
                </PrimaryButton>
                {isTrained && isAnyInputInvalid && (
                  <p className="text-amber-800 font-bold text-center text-[11px] bg-amber-50 p-2 rounded-lg border border-amber-200">
                    ⚠️ 비어 있거나 유효하지 않은 측정값이 있습니다. 4가지 측정값을 모두 입력해 주세요.
                  </p>
                )}
                {!isTrained && (
                  <p className="text-amber-800 font-bold text-center text-[11px] bg-amber-50 p-2 rounded-lg border border-amber-200">
                    ⚠️ 모델 설정이 변경되었거나 아직 학습되지 않았습니다. 3단계에서 [모델 학습/준비]를 먼저 실행해 주세요.
                  </p>
                )}
              </div>

              {/* Algorithm-differentiated Step 4 Result View */}
              {algorithm === 'knn' ? (
                <div className="pt-2">
                  <KNNPredictionVisualizer
                    trainData={splitResult.trainData}
                    newPoint={newPoint}
                    kParam={kParam}
                    knnResult={knnResult}
                  />
                </div>
              ) : (
                predictedSpecies && (
                  <div className="p-4 rounded-xl bg-purple-700 text-white text-xs font-bold space-y-3 animate-fadeIn shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-600 pb-2">
                      <span className="text-purple-200 text-xs font-bold">의사결정트리 예측 판정 결과:</span>
                      <SpeciesBadge species={predictedSpecies} showEnglish size="lg" variant="solid" />
                    </div>
                    <p className="text-purple-100 text-[11px] font-medium leading-relaxed">
                      입력된 4가지 속성을 바탕으로 의사결정트리(깊이 {depthParam}) 모델이 아래 판단 질문 경로를 거쳐 최종 판정하였습니다.
                    </p>
                    {dtTracePath && dtTracePath.steps.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-purple-200 text-[10px] uppercase font-bold block">트리 탐색 경로:</span>
                        {dtTracePath.steps.map((s, idx) => (
                          <div key={idx} className="p-2 bg-purple-800/80 rounded-lg text-[11px] font-mono border border-purple-600 flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-purple-500 text-white text-[10px] flex items-center justify-center font-bold shrink-0">{idx + 1}</span>
                            <span>{s.nextDescription}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: 모델 만들기 완료 (Section 10 transition) */}
      {currentStep === 5 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900">07 모델 만들기 학습 완료</h3>
              <p className="text-xs text-slate-500">ML 5단계: 모델 학습 완료</p>
            </div>

            {/* Section 24 Summary Sentence */}
            <div className="p-4 rounded-2xl bg-emerald-600 text-white text-center font-extrabold text-sm shadow-sm max-w-xl mx-auto">
              "머신러닝 모델은 학습용 데이터(Train)의 패턴과 기준을 바탕으로 새로운 데이터를 예측합니다."
            </div>

            {/* Section 10 Transition Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3 max-w-xl mx-auto text-xs">
              <span className="font-extrabold text-slate-900 block text-sm">
                🤔 다음 학습 연결:
              </span>
              <p className="text-slate-700 font-bold text-sm leading-relaxed">
                "방금 만든 모델의 설정(알고리즘, 파라미터, 데이터 분할)을 그대로 이어받아, 독립된 테스트 데이터에서 종합 성능(정확도 및 3×3 혼동행렬)을 확인해 봅시다."
              </p>

              {!act5Confirmed && (
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-center space-y-2">
                  <p className="text-xs text-slate-600 font-medium">모델 학습 결과를 확인한 뒤 아래 완료 버튼을 눌러주세요.</p>
                  <SecondaryButton size="sm" onClick={() => setAct5Confirmed(true)}>
                    내용 확인 완료
                  </SecondaryButton>
                </div>
              )}

              <div className="pt-2">
                <PrimaryButton
                  size="lg"
                  fullWidth
                  disabled={!act5Confirmed}
                  onClick={onComplete}
                  icon={<ArrowRight size={20} />}
                >
                  08 모델 평가하러 가기 (성능 평가)
                </PrimaryButton>
              </div>
            </div>
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
            {currentStep === 1 && '💡 학습/테스트 데이터 분할 비율을 확인하고 [데이터 분할 확인 완료]를 눌러주세요.'}
            {currentStep === 2 && '💡 사용할 알고리즘을 선택하고 [알고리즘 선택 완료]를 눌러주세요.'}
            {currentStep === 3 && '💡 모델 학습(또는 k-NN 준비)을 완료하면 다음 활동으로 이동할 수 있습니다.'}
            {currentStep === 4 && '💡 새로운 붓꽃 데이터의 품종을 1회 이상 예측하면 다음 활동으로 이동할 수 있습니다.'}
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
