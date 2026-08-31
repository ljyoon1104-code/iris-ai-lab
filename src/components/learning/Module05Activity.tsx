import React, { useState } from 'react';
import { useActivityScrollTop } from '../../hooks/useActivityScrollTop';
import { ActivityProgress } from './ActivityProgress';
import { ChoiceCard } from './ChoiceCard';
import { PrimaryButton } from '../common/PrimaryButton';
import { SecondaryButton } from '../common/SecondaryButton';
import { SpeciesLabel } from '../common/SpeciesBadge';
import { ORIGINAL_IRIS_DATASET } from '../../data/irisDataset';
import {
  Layers,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Bot,
  GitBranch,
  Network,
} from 'lucide-react';

interface Module05ActivityProps {
  isCompleted: boolean;
  onComplete: () => void;
}

export const Module05Activity: React.FC<Module05ActivityProps> = ({ isCompleted, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7; // 6 activities + summary
  const topRef = useActivityScrollTop<HTMLDivElement>(currentStep);

  // Activity 1 State
  const [act1Q1, setAct1Q1] = useState<boolean | null>(null);
  const [act1Q2, setAct1Q2] = useState<boolean | null>(null);

  // Activity 2 State (Supervised)
  const [act2Choice, setAct2Choice] = useState<'A' | 'B' | 'C' | null>(null);

  // Activity 3 State (Unsupervised)
  const [act3Choice, setAct3Choice] = useState<'sup' | 'unsup' | 'rl' | null>(null);

  // Activity 4 State (Reinforcement)
  const [act4Choice, setAct4Choice] = useState<'sup' | 'unsup' | 'rl' | null>(null);

  // Activity 5 State (Mapping)
  const [act5Answers, setAct5Answers] = useState<Record<number, string>>({});

  // Activity 6 State (Algorithm Map & Quiz)
  const [act6Quiz, setAct6Quiz] = useState<Record<string, string>>({});

  const sampleIris = ORIGINAL_IRIS_DATASET[0]; // Id #1 (5.1, 3.5, 1.4, 0.2, Iris-setosa)

  return (
    <div className="space-y-6 scroll-mt-24" ref={topRef}>
      {/* Internal Activity Progress */}
      <ActivityProgress
        currentStep={currentStep}
        totalSteps={totalSteps}
        title={
          currentStep === 1
            ? '1. 정답의 유무'
            : currentStep === 2
            ? '2. 지도학습'
            : currentStep === 3
            ? '3. 비지도학습'
            : currentStep === 4
            ? '4. 강화학습'
            : currentStep === 5
            ? '5. 학습 방법 선택'
            : currentStep === 6
            ? '6. 알고리즘 지도'
            : '전체 정리 및 완료'
        }
      />

      {/* STEP 1: 정답이 있는 데이터와 없는 데이터 */}
      {currentStep === 1 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Layers size={20} className="text-emerald-600" />
              <span>활동 1: 정답을 알고 있는 데이터일까?</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Iris 데이터에 정답 정보가 포함되어 있는지 파악하고 레이블(Label)의 개념을 이해합니다.
            </p>

            {/* Example 1: With Label */}
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3">
              <span className="text-xs font-bold text-emerald-950 block">
                [데이터 예시 1] 측정값과 함께 정답 품종이 포함된 레코드
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">꽃받침 길이</span>
                  <span className="font-bold">{sampleIris.sepalLength} cm</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">꽃받침 너비</span>
                  <span className="font-bold">{sampleIris.sepalWidth} cm</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">꽃잎 길이</span>
                  <span className="font-bold">{sampleIris.petalLength} cm</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">꽃잎 너비</span>
                  <span className="font-bold">{sampleIris.petalWidth} cm</span>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-300 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-emerald-800 block font-bold">정답 품종 (Label)</span>
                  <SpeciesLabel species={sampleIris.species} size="sm" />
                </div>
              </div>

              <span className="text-xs font-bold text-slate-900 block pt-1">
                질문 1: 이 데이터에는 우리가 맞혀야 하는 정답 정보가 포함되어 있을까?
              </span>
              <div className="grid grid-cols-2 gap-2">
                <ChoiceCard
                  optionKey="1"
                  label="있다 (품종 정보 포함)"
                  isSelected={act1Q1 === true}
                  status={act1Q1 === true ? 'correct' : 'default'}
                  onClick={() => setAct1Q1(true)}
                />
                <ChoiceCard
                  optionKey="2"
                  label="없다"
                  isSelected={act1Q1 === false}
                  status={act1Q1 === false ? 'incorrect' : 'default'}
                  onClick={() => setAct1Q1(false)}
                />
              </div>

              {act1Q1 === true && (
                <div className="p-3.5 rounded-lg bg-emerald-100 text-xs text-emerald-950 animate-fadeIn">
                  ✓ 품종처럼 미리 제시된 정답을 기계학습에서는 <strong>레이블(Label)</strong> 또는 <strong>종속변수 y</strong>라고 부릅니다.
                </div>
              )}
            </div>

            {/* Example 2: Hidden Label */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-900 block">
                [데이터 예시 2] 품종 정보를 숨긴 레코드
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">꽃받침 길이</span>
                  <span className="font-bold">{sampleIris.sepalLength} cm</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">꽃받침 너비</span>
                  <span className="font-bold">{sampleIris.sepalWidth} cm</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">꽃잎 길이</span>
                  <span className="font-bold">{sampleIris.petalLength} cm</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">꽃잎 너비</span>
                  <span className="font-bold">{sampleIris.petalWidth} cm</span>
                </div>
                <div className="p-2 bg-slate-200 rounded-lg border border-slate-300 col-span-2 sm:col-span-1 text-slate-500 font-bold">
                  <span className="text-[10px] block">정답 품종</span>
                  <span>? (미제시)</span>
                </div>
              </div>

              <span className="text-xs font-bold text-slate-900 block pt-1">
                질문 2: 정답 품종 정보 없이도 데이터의 측정값끼리 비슷한 특징 패턴을 찾을 수 있을까?
              </span>
              <div className="grid grid-cols-2 gap-2">
                <ChoiceCard
                  optionKey="1"
                  label="가능하다 (특징이 유사한 그룹 발견)"
                  isSelected={act1Q2 === true}
                  status={act1Q2 === true ? 'correct' : 'default'}
                  onClick={() => setAct1Q2(true)}
                />
                <ChoiceCard
                  optionKey="2"
                  label="불가능하다"
                  isSelected={act1Q2 === false}
                  status={act1Q2 === false ? 'incorrect' : 'default'}
                  onClick={() => setAct1Q2(false)}
                />
              </div>

              {act1Q2 === true && (
                <div className="p-3.5 rounded-lg bg-blue-100 text-xs text-blue-950 animate-fadeIn">
                  ✓ 그렇습니다! 정답이 없어도 측정값의 유사성을 비교하여 데이터를 그룹으로 묶는 것이 가능합니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: 지도학습 */}
      {currentStep === 2 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-600" />
              <span>활동 2: 지도학습 (Supervised Learning)</span>
            </h3>

            <div className="p-4 rounded-2xl bg-emerald-600 text-white text-xs leading-relaxed space-y-1 shadow-sm">
              <span className="font-bold text-emerald-200 uppercase tracking-wider text-[11px] block">핵심 정의</span>
              <p className="font-extrabold text-base leading-snug">
                "지도학습은 정답(label)이 포함된 데이터를 이용해 입력과 정답 사이의 관계를 학습하는 방법입니다."
              </p>
            </div>

            {/* Visual Process Flow */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <span className="font-bold text-slate-900 block">지도학습 흐름:</span>
              <div className="flex flex-wrap items-center justify-between gap-2 text-center font-bold">
                <span className="p-2 rounded bg-white border border-slate-300">입력 X + 정답 y</span>
                <ChevronRight size={16} className="text-slate-400" />
                <span className="p-2 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">학습 (Training)</span>
                <ChevronRight size={16} className="text-slate-400" />
                <span className="p-2 rounded bg-white border border-slate-300">새로운 입력 X</span>
                <ChevronRight size={16} className="text-slate-400" />
                <span className="p-2 rounded bg-emerald-600 text-white">예측 (Prediction y)</span>
              </div>
            </div>

            {/* Classification & Regression Connection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                <span className="font-extrabold text-emerald-900 block text-sm">1. 분류 (Classification)</span>
                <p className="text-slate-700">정해진 범주 중 하나를 예측</p>
                <p className="text-slate-800 font-bold flex items-center gap-1 flex-wrap pt-0.5">
                  <span>예: 붓꽃 측정값으로</span>
                  <SpeciesLabel species="Iris-setosa" size="xs" />
                  <span>/</span>
                  <SpeciesLabel species="Iris-versicolor" size="xs" />
                  <span>/</span>
                  <SpeciesLabel species="Iris-virginica" size="xs" />
                  <span>중 하나로 분류</span>
                </p>
              </div>
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 space-y-1">
                <span className="font-extrabold text-teal-950 block text-sm">2. 회귀 (Regression)</span>
                <p className="text-slate-700">연속적인 숫자 값을 예측</p>
                <p className="text-teal-900 font-bold">예: 꽃잎 길이로 꽃잎 너비 수치(cm)를 예측</p>
              </div>
            </div>

            {/* Quiz */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-slate-900 block">
                질문: 다음 상황 중 지도학습에 해당하는 것은?
              </span>
              <div className="space-y-2">
                <ChoiceCard
                  optionKey="A"
                  label="붓꽃 측정값과 정답 품종 데이터를 학습시켜 새 붓꽃의 품종을 예측한다."
                  isSelected={act2Choice === 'A'}
                  status={act2Choice === 'A' ? 'correct' : 'default'}
                  onClick={() => setAct2Choice('A')}
                />
                <ChoiceCard
                  optionKey="B"
                  label="품종 정보를 숨기고 측정값이 비슷한 붓꽃끼리 3개 그룹으로 묶는다."
                  isSelected={act2Choice === 'B'}
                  status={act2Choice === 'B' ? 'incorrect' : 'default'}
                  onClick={() => setAct2Choice('B')}
                />
                <ChoiceCard
                  optionKey="C"
                  label="로봇이 이동할 때 보상 점수를 받으며 스스로 경로를 익힌다."
                  isSelected={act2Choice === 'C'}
                  status={act2Choice === 'C' ? 'incorrect' : 'default'}
                  onClick={() => setAct2Choice('C')}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: 비지도학습 */}
      {currentStep === 3 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <GitBranch size={20} className="text-blue-600" />
              <span>활동 3: 비지도학습 (Unsupervised Learning)</span>
            </h3>

            <div className="p-4 rounded-2xl bg-blue-600 text-white text-xs leading-relaxed space-y-1 shadow-sm">
              <span className="font-bold text-blue-200 uppercase tracking-wider text-[11px] block">핵심 정의</span>
              <p className="font-extrabold text-base leading-snug">
                "비지도학습은 정답(label)을 알려주지 않고 데이터 안의 구조나 패턴을 찾는 방법입니다."
              </p>
            </div>

            {/* Clustering Explanation */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <span className="font-bold text-slate-900 block text-sm">대표 문제 — 군집 (Clustering)</span>
              <p className="text-slate-700 leading-relaxed">
                정답 품종 이름을 전부 숨긴 상태에서 붓꽃 150개의 측정값만을 비교하여 유사한 수치 특성을 가진 데이터끼리 그룹(Cluster)으로 묶는 방식입니다.
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 font-bold">
                ⚠️ 주의: 군집은 정답을 보고 나누는 것이 아니라 데이터의 유사성을 이용해 인위적 그룹을 만드는 것입니다.
              </div>
            </div>

            {/* Quiz */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-slate-900 block">
                질문: 측정값이 비슷한 붓꽃끼리 정답 없이 그룹으로 묶으려면 어떤 학습 방법이 적절할까?
              </span>
              <div className="grid grid-cols-3 gap-2">
                <ChoiceCard
                  optionKey="1"
                  label="지도학습"
                  isSelected={act3Choice === 'sup'}
                  status={act3Choice === 'sup' ? 'incorrect' : 'default'}
                  onClick={() => setAct3Choice('sup')}
                />
                <ChoiceCard
                  optionKey="2"
                  label="비지도학습 (군집)"
                  isSelected={act3Choice === 'unsup'}
                  status={act3Choice === 'unsup' ? 'correct' : 'default'}
                  onClick={() => setAct3Choice('unsup')}
                />
                <ChoiceCard
                  optionKey="3"
                  label="강화학습"
                  isSelected={act3Choice === 'rl'}
                  status={act3Choice === 'rl' ? 'incorrect' : 'default'}
                  onClick={() => setAct3Choice('rl')}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: 강화학습 */}
      {currentStep === 4 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Bot size={20} className="text-amber-600" />
              <span>활동 4: 강화학습 (Reinforcement Learning)</span>
            </h3>

            <div className="p-4 rounded-2xl bg-amber-600 text-white text-xs leading-relaxed space-y-1 shadow-sm">
              <span className="font-bold text-amber-200 uppercase tracking-wider text-[11px] block">핵심 정의</span>
              <p className="font-extrabold text-base leading-snug">
                "강화학습은 행동의 결과로 받은 보상이나 벌을 이용해 더 좋은 행동을 학습하는 방법입니다."
              </p>
            </div>

            {/* Grid Robot Scenario Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <span className="font-bold text-slate-900 block text-sm">온실 탐사 로봇 이동 시뮬레이션 예시</span>
              <div className="grid grid-cols-3 gap-2 text-center font-bold font-mono">
                <div className="p-2.5 bg-emerald-100 text-emerald-900 rounded-lg border border-emerald-300">
                  목표 지점 도착<br /><span className="text-emerald-700 font-extrabold">보상 +10점</span>
                </div>
                <div className="p-2.5 bg-rose-100 text-rose-900 rounded-lg border border-rose-300">
                  장애물 충돌<br /><span className="text-rose-700 font-extrabold">벌점 -5점</span>
                </div>
                <div className="p-2.5 bg-slate-200 text-slate-800 rounded-lg border border-slate-300">
                  불필요한 이동<br /><span className="text-slate-600 font-extrabold">벌점 -1점</span>
                </div>
              </div>
            </div>

            {/* 3-Way Summary Comparison Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                <span className="font-extrabold text-emerald-900 block text-sm">지도학습</span>
                <p>정답: <strong>있음 (Label y)</strong></p>
                <p>목적: <strong>정답 예측</strong></p>
                <p>대표 문제: <strong>분류 / 회귀</strong></p>
              </div>
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 space-y-1">
                <span className="font-extrabold text-blue-950 block text-sm">비지도학습</span>
                <p>정답: <strong>없음</strong></p>
                <p>목적: <strong>패턴/구조 발견</strong></p>
                <p>대표 문제: <strong>군집 (Clustering)</strong></p>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                <span className="font-extrabold text-amber-950 block text-sm">강화학습</span>
                <p>정답: <strong>보상 / 벌점</strong></p>
                <p>목적: <strong>최적 행동 학습</strong></p>
                <p>대표 문제: <strong>행동 시뮬레이션</strong></p>
              </div>
            </div>

            {/* Quiz */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-slate-900 block">
                질문: 로봇이 여러 번 시도하면서 높을 보상을 받는 최선의 이동 방법을 학습하는 유형은?
              </span>
              <div className="grid grid-cols-3 gap-2">
                <ChoiceCard
                  optionKey="1"
                  label="지도학습"
                  isSelected={act4Choice === 'sup'}
                  status={act4Choice === 'sup' ? 'incorrect' : 'default'}
                  onClick={() => setAct4Choice('sup')}
                />
                <ChoiceCard
                  optionKey="2"
                  label="비지도학습"
                  isSelected={act4Choice === 'unsup'}
                  status={act4Choice === 'unsup' ? 'incorrect' : 'default'}
                  onClick={() => setAct4Choice('unsup')}
                />
                <ChoiceCard
                  optionKey="3"
                  label="강화학습"
                  isSelected={act4Choice === 'rl'}
                  status={act4Choice === 'rl' ? 'correct' : 'default'}
                  onClick={() => setAct4Choice('rl')}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: 문제 유형과 학습 방법 연결 */}
      {currentStep === 5 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900">
              활동 5: 어떤 학습 방법을 선택해야 할까? (매핑 선택)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              4가지 문제 상황에 가장 적절한 [학습 유형 $\rightarrow$ 문제 종류]를 연결하세요.
            </p>

            <div className="space-y-3">
              {[
                { id: 1, title: '문제 1: 붓꽃 측정값으로 정답 품종을 맞힌다.', correct: 'sup_class', label: '지도학습 → 분류' },
                { id: 2, title: '문제 2: 꽃잎 길이로 꽃잎 너비를 숫자로 예상한다.', correct: 'sup_reg', label: '지도학습 → 회귀' },
                { id: 3, title: '문제 3: 품종을 숨기고 비슷한 붓꽃끼리 3개 그룹으로 묶는다.', correct: 'unsup_clust', label: '비지도학습 → 군집' },
                { id: 4, title: '문제 4: 탐사 로봇이 보상을 이용해 최적 이동 경로를 찾는다.', correct: 'rl', label: '강화학습' },
              ].map(q => (
                <div key={q.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                  <span className="font-bold text-slate-900 block">{q.title}</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => setAct5Answers(prev => ({ ...prev, [q.id]: 'sup_class' }))}
                      className={`p-2 rounded-lg border font-bold transition-all min-h-[44px] cursor-pointer ${
                        act5Answers[q.id] === 'sup_class'
                          ? q.correct === 'sup_class'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      지도학습 → 분류
                    </button>
                    <button
                      onClick={() => setAct5Answers(prev => ({ ...prev, [q.id]: 'sup_reg' }))}
                      className={`p-2 rounded-lg border font-bold transition-all min-h-[44px] cursor-pointer ${
                        act5Answers[q.id] === 'sup_reg'
                          ? q.correct === 'sup_reg'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      지도학습 → 회귀
                    </button>
                    <button
                      onClick={() => setAct5Answers(prev => ({ ...prev, [q.id]: 'unsup_clust' }))}
                      className={`p-2 rounded-lg border font-bold transition-all min-h-[44px] cursor-pointer ${
                        act5Answers[q.id] === 'unsup_clust'
                          ? q.correct === 'unsup_clust'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      비지도학습 → 군집
                    </button>
                    <button
                      onClick={() => setAct5Answers(prev => ({ ...prev, [q.id]: 'rl' }))}
                      className={`p-2 rounded-lg border font-bold transition-all min-h-[44px] cursor-pointer ${
                        act5Answers[q.id] === 'rl'
                          ? q.correct === 'rl'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      강화학습
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 6: 알고리즘 지도 만들기 (Algorithm Map) */}
      {currentStep === 6 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Network size={20} className="text-emerald-600" />
              <span>활동 6: Iris AI Lab 알고리즘 지도 (Algorithm Map)</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Iris AI Lab에서 앞으로 다룰 5가지 알고리즘의 위치와 역할을 파악하세요.
            </p>

            {/* Map Hierarchy Display */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-4 text-xs font-mono">
              <span className="font-extrabold text-emerald-400 tracking-wider text-sm block">
                [Iris AI Lab 알고리즘 로드맵 구조]
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-800 rounded-xl border border-emerald-500/40 space-y-2">
                  <span className="font-bold text-emerald-300 block text-xs">지도학습 (Supervised)</span>
                  <div className="pl-2 space-y-1 text-[11px] text-slate-300">
                    <p className="text-emerald-400 font-bold">├ 분류 (Classification)</p>
                    <p className="pl-3">• k-NN (k-최근접 이웃)</p>
                    <p className="pl-3">• 의사결정트리 (Decision Tree)</p>
                    <p className="text-teal-300 font-bold mt-1">└ 회귀 (Regression)</p>
                    <p className="pl-3">• 선형 회귀 (Linear Regression)</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-800 rounded-xl border border-blue-500/40 space-y-2">
                  <span className="font-bold text-blue-300 block text-xs">비지도학습 (Unsupervised)</span>
                  <div className="pl-2 space-y-1 text-[11px] text-slate-300">
                    <p className="text-blue-400 font-bold">└ 군집 (Clustering)</p>
                    <p className="pl-3">• k-means (k-평균 군집화)</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-800 rounded-xl border border-amber-500/40 space-y-2">
                  <span className="font-bold text-amber-300 block text-xs">강화학습 (Reinforcement)</span>
                  <div className="pl-2 space-y-1 text-[11px] text-slate-300">
                    <p className="text-amber-400 font-bold">└ 행동 학습</p>
                    <p className="pl-3">• 온실 탐사 로봇 시뮬레이션</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Distinction for 'k' */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-1">
              <span className="font-extrabold text-amber-900 block text-sm">💡 알파벳 'k'의 의미 비교 주의사항!</span>
              <p className="leading-relaxed">
                - <strong>k-NN에서의 k</strong>: 분류 판정에 참고할 <strong>가장 가까운 이웃 데이터의 수</strong><br />
                - <strong>k-means에서의 k</strong>: 데이터를 묶고자 하는 <strong>만들고 싶은 군집(그룹)의 수</strong><br />
                (두 알고리즘 모두 'k' 문자를 사용하지만 의미는 완전히 다릅니다.)
              </p>
            </div>

            {/* Algorithm Matching Quiz */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-slate-900 block">
                알고리즘 매핑 퀴즈: 설명에 해당하는 알맞은 알고리즘을 고르세요.
              </span>

              {[
                { key: 'q1', text: '새 붓꽃 주변의 가장 가까운 데이터 k개를 관찰해 품종을 정한다.', correct: 'knn', label: 'k-NN' },
                { key: 'q2', text: '조건 질문을 스무고개처럼 따라가며 가지(Branch)별로 품종을 결정한다.', correct: 'dt', label: '의사결정트리' },
                { key: 'q3', text: '데이터의 수치 관계를 최적 직선으로 나타내어 이웃 수치를 예측한다.', correct: 'lr', label: '선형 회귀' },
                { key: 'q4', text: '레이블 없이 데이터 특성이 비슷한 붓꽃끼리 k개 그룹으로 묶는다.', correct: 'kmeans', label: 'k-means' },
              ].map(item => (
                <div key={item.key} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <span className="font-bold text-slate-900 block">{item.text}</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['knn', 'dt', 'lr', 'kmeans'].map(alg => (
                      <button
                        key={alg}
                        onClick={() => setAct6Quiz(prev => ({ ...prev, [item.key]: alg }))}
                        className={`p-2 rounded-lg border font-bold transition-all min-h-[44px] cursor-pointer ${
                          act6Quiz[item.key] === alg
                            ? item.correct === alg
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-rose-600 text-white border-rose-600'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        {alg === 'knn' ? 'k-NN' : alg === 'dt' ? '의사결정트리' : alg === 'lr' ? '선형 회귀' : 'k-means'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
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
              <h3 className="text-xl font-black text-slate-900">05 학습 방법 알아보기 요약</h3>
              <p className="text-xs text-slate-500">기계학습 유형 및 알고리즘 마스터</p>
            </div>

            <div className="space-y-3 text-xs font-bold">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                ✓ "정답이 있는 데이터로 예측하면 지도학습 (분류: k-NN/의사결정트리, 회귀: 선형회귀)"
              </div>
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-950">
                ✓ "정답 없이 데이터의 패턴을 찾으면 비지도학습 (군집: k-means)"
              </div>
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
                ✓ "행동의 결과인 보상을 이용하면 강화학습 (로봇 행동 시뮬레이션)"
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-600 text-white text-center font-extrabold text-sm shadow-sm">
              "문제와 데이터의 형태에 따라 적절한 학습 방법이 달라집니다."
            </div>

            {/* Section 25 Ending Page Connection */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2 text-xs">
              <span className="font-bold text-slate-900 block text-sm">💡 다음 학습 영역 연결 안내:</span>
              <p className="text-slate-700 font-bold leading-relaxed">
                "문제에 맞는 학습 방법을 선택했다면 알고리즘이 어떻게 작동하는지 실험해봅니다."
              </p>
            </div>

            <div className="pt-2 text-center space-y-2">
              {isCompleted && (
                <div className="text-xs font-bold text-emerald-700 bg-emerald-100 p-2 rounded-xl inline-block">
                  ✓ 이미 완료된 영역입니다. 언제든 자유롭게 복습 및 다시 학습이 가능합니다.
                </div>
              )}
              <PrimaryButton size="lg" fullWidth onClick={onComplete} icon={<CheckCircle2 size={20} />}>
                05 학습 방법 완료 & 06 알고리즘 실험실로 이동
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
          <span className="text-xs text-emerald-700 font-bold">마지막 단계</span>
        )}
      </div>
    </div>
  );
};
