import React, { useState, useMemo } from 'react';
import { useActivityScrollTop } from '../../hooks/useActivityScrollTop';
import { ActivityProgress } from './ActivityProgress';
import { ChoiceCard } from './ChoiceCard';
import { StepOrderActivity } from './StepOrderActivity';
import { PrimaryButton } from '../common/PrimaryButton';
import { SecondaryButton } from '../common/SecondaryButton';
import { ORIGINAL_IRIS_DATASET, SPECIES_MAP } from '../../data/irisDataset';
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Cpu,
  Workflow,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface Module02ActivityProps {
  isCompleted: boolean;
  onComplete: () => void;
}

export const Module02Activity: React.FC<Module02ActivityProps> = ({ isCompleted, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const topRef = useActivityScrollTop<HTMLDivElement>(currentStep);

  // Activity 1 State
  const [act1A, setAct1A] = useState<'trad' | 'ml' | null>(null);
  const [act1B, setAct1B] = useState<'trad' | 'ml' | null>(null);

  // Activity 2 State
  const [act2Confirmed, setAct2Confirmed] = useState(false);

  // Activity 3 State
  const [act3Choice, setAct3Choice] = useState<string | null>(null);

  // Activity 4 State (Step order completed status)
  const [isOrderFinished, setIsOrderFinished] = useState(false);
  const [act4Attempted, setAct4Attempted] = useState(false);

  // Activity 5 State
  const [act5Confirmed, setAct5Confirmed] = useState(false);

  const isStepCompleted = useMemo(() => {
    switch (currentStep) {
      case 1:
        return act1A !== null && act1B !== null;
      case 2:
        return act2Confirmed;
      case 3:
        return act3Choice !== null;
      case 4:
        return isOrderFinished || act4Attempted;
      case 5:
        return act5Confirmed;
      default:
        return true;
    }
  }, [currentStep, act1A, act1B, act2Confirmed, act3Choice, isOrderFinished, act4Attempted, act5Confirmed]);

  const sampleIris = ORIGINAL_IRIS_DATASET[0]; // ID #1 (5.1, 3.5, 1.4, 0.2, Iris-setosa)

  return (
    <div className="space-y-6 scroll-mt-24" ref={topRef}>
      {/* Official 6-stage badge banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
          [공식 6단계 과정] ① 문제 정의
        </span>
        <span className="text-xs text-slate-500 font-medium">02 문제 정의</span>
      </div>

      {/* Internal Activity Progress */}
      <ActivityProgress
        currentStep={currentStep}
        totalSteps={totalSteps}
        title={
          currentStep === 1
            ? '전통적 프로그래밍 vs 기계학습'
            : currentStep === 2
            ? '기계학습 개념 & 흐름'
            : currentStep === 3
            ? 'Iris 분류 문제 이해'
            : currentStep === 4
            ? 'ML 6단계 순서 맞추기'
            : '전체 흐름 정리 및 완료'
        }
      />

      {/* STEP 1: 전통적 프로그래밍 vs 기계학습 */}
      {currentStep === 1 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Cpu size={20} className="text-emerald-600" />
              <span>활동 1: 규칙을 사람이 만들까, 데이터에서 찾을까?</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              두 문제 상황을 읽고 어떤 해결 방식에 해당하는지 골라보세요.
            </p>

            {/* Situation A */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-xs font-extrabold text-slate-800 block">
                상황 A: "입력된 네 숫자의 값 중에서 가장 큰 값을 찾는다."
              </span>
              <div className="grid grid-cols-2 gap-2">
                <ChoiceCard
                  optionKey="1"
                  label="전통적 프로그래밍"
                  subText="사람이 명시적 조건문(if/else)을 작성"
                  isSelected={act1A === 'trad'}
                  status={act1A === 'trad' ? 'correct' : 'default'}
                  onClick={() => setAct1A('trad')}
                />
                <ChoiceCard
                  optionKey="2"
                  label="기계학습 (ML)"
                  subText="데이터 패턴 학습"
                  isSelected={act1A === 'ml'}
                  status={act1A === 'ml' ? 'incorrect' : 'default'}
                  onClick={() => setAct1A('ml')}
                />
              </div>
            </div>

            {/* Situation B */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-xs font-extrabold text-slate-800 block">
                상황 B: "꽃받침과 꽃잎의 길이·너비 데이터를 보고 새로운 붓꽃의 품종을 예측한다."
              </span>
              <div className="grid grid-cols-2 gap-2">
                <ChoiceCard
                  optionKey="1"
                  label="전통적 프로그래밍"
                  isSelected={act1B === 'trad'}
                  status={act1B === 'trad' ? 'incorrect' : 'default'}
                  onClick={() => setAct1B('trad')}
                />
                <ChoiceCard
                  optionKey="2"
                  label="기계학습 (ML)"
                  subText="데이터 특성에서 패턴을 기계가 스스로 학습"
                  isSelected={act1B === 'ml'}
                  status={act1B === 'ml' ? 'correct' : 'default'}
                  onClick={() => setAct1B('ml')}
                />
              </div>
            </div>

            {/* Summary Comparison */}
            {act1A === 'trad' && act1B === 'ml' && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2 animate-fadeIn">
                <span className="font-bold text-emerald-900 block text-sm">✓ 정확하게 파악하셨습니다!</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="p-3 bg-white rounded-xl border border-emerald-200">
                    <span className="font-bold text-slate-900 block mb-1">전통적 프로그래밍</span>
                    사람이 정해진 공식이나 규칙(Algorithm)을 만들어 컴퓨터에 입력.
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-emerald-200">
                    <span className="font-bold text-emerald-900 block mb-1">기계학습 (Machine Learning)</span>
                    컴퓨터가 많은 데이터를 분석하여 스스로 규칙과 패턴을 탐색 및 학습.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: 기계학습 개념 & 시각적 흐름 */}
      {currentStep === 2 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles size={20} className="text-amber-500" />
              <span>활동 2: 기계학습의 개념과 동작 흐름</span>
            </h3>

            <div className="p-4 rounded-2xl bg-emerald-600 text-white text-xs leading-relaxed space-y-1 shadow-sm">
              <span className="font-bold text-emerald-200 uppercase tracking-wider text-[11px] block">핵심 정의</span>
              <p className="font-extrabold text-base leading-snug">
                "기계학습은 데이터를 이용해 규칙이나 패턴을 학습하고, 새로운 데이터에 그 학습 결과를 적용하는 방법입니다."
              </p>
            </div>

            {/* Visual Process Flow Diagram */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-700 block">기계학습의 5단계 시각적 동작 구조:</span>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-xs">
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex flex-col justify-center items-center">
                  <span className="font-extrabold text-slate-900">1. 기존 데이터</span>
                  <span className="text-[11px] text-slate-500 mt-1">붓꽃 150개 레코드</span>
                </div>
                <div className="hidden sm:flex items-center justify-center text-slate-400">
                  <ArrowRight size={18} />
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 flex flex-col justify-center items-center">
                  <span className="font-extrabold text-emerald-900">2. 학습 (Training)</span>
                  <span className="text-[11px] text-emerald-700 mt-1">패턴 및 규칙 발견</span>
                </div>
                <div className="hidden sm:flex items-center justify-center text-slate-400">
                  <ArrowRight size={18} />
                </div>
                <div className="p-3 rounded-xl bg-teal-50 border border-teal-300 flex flex-col justify-center items-center">
                  <span className="font-extrabold text-teal-950">3. 학습된 모델</span>
                  <span className="text-[11px] text-teal-800 mt-1">분류기 생성</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs pt-2">
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200">
                  <span className="font-bold text-slate-800">4. 새로운 데이터</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">미지의 새로운 붓꽃 측정값</p>
                </div>
                <div className="flex items-center justify-center text-slate-400">
                  <ArrowRight size={18} />
                </div>
                <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-300">
                  <span className="font-bold text-cyan-950">5. 최종 예측 (Prediction)</span>
                  <p className="text-[11px] text-cyan-800 mt-0.5">세토사 / 버시컬러 / 버지니카 판정</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-600 font-medium">💡 기계학습의 개념과 흐름을 확인한 뒤 버튼을 눌러주세요.</span>
              <SecondaryButton
                size="sm"
                onClick={() => setAct2Confirmed(true)}
                className={act2Confirmed ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : ''}
              >
                {act2Confirmed ? '✓ 내용 확인 완료' : '내용 확인 완료'}
              </SecondaryButton>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Iris 분류 문제 이해 */}
      {currentStep === 3 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">
              활동 3: Iris 분류 문제 상황 이해
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              프로젝트 내부 데이터셋의 실제 첫 번째 붓꽃 레코드 샘플입니다.
            </p>

            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-2 text-xs">
              <span className="font-bold text-emerald-900 block">실제 Iris 레코드 예시 (ID #{sampleIris.id}):</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-slate-800">
                <div className="p-2 bg-white rounded-lg border border-emerald-200">
                  꽃받침 길이: <strong>{sampleIris.sepalLength} cm</strong>
                </div>
                <div className="p-2 bg-white rounded-lg border border-emerald-200">
                  꽃받침 너비: <strong>{sampleIris.sepalWidth} cm</strong>
                </div>
                <div className="p-2 bg-white rounded-lg border border-emerald-200">
                  꽃잎 길이: <strong>{sampleIris.petalLength} cm</strong>
                </div>
                <div className="p-2 bg-white rounded-lg border border-emerald-200">
                  꽃잎 너비: <strong>{sampleIris.petalWidth} cm</strong>
                </div>
              </div>
              <div className="pt-1">
                정답 품종: <strong className="text-emerald-800">{SPECIES_MAP[sampleIris.species].korean} ({sampleIris.species})</strong>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-slate-800 block">
                질문: 여러 붓꽃의 측정값과 품종을 학습한다면, 새로운 붓꽃의 무엇을 예측할 수 있을까?
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <ChoiceCard
                  optionKey="1"
                  label="품종 (세토사 / 버시컬러 / 버지니카)"
                  isSelected={act3Choice === 'species'}
                  status={act3Choice === 'species' ? 'correct' : 'default'}
                  onClick={() => setAct3Choice('species')}
                />
                <ChoiceCard
                  optionKey="2"
                  label="학생 이름"
                  isSelected={act3Choice === 'name'}
                  status={act3Choice === 'name' ? 'incorrect' : 'default'}
                  onClick={() => setAct3Choice('name')}
                />
                <ChoiceCard
                  optionKey="3"
                  label="오늘의 날씨"
                  isSelected={act3Choice === 'weather'}
                  status={act3Choice === 'weather' ? 'incorrect' : 'default'}
                  onClick={() => setAct3Choice('weather')}
                />
                <ChoiceCard
                  optionKey="4"
                  label="사진 해상도"
                  isSelected={act3Choice === 'resolution'}
                  status={act3Choice === 'resolution' ? 'incorrect' : 'default'}
                  onClick={() => setAct3Choice('resolution')}
                />
              </div>

              {act3Choice === 'species' && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 animate-fadeIn">
                  <span className="font-bold text-emerald-900 block mb-0.5">✓ 정답입니다!</span>
                  꽃받침과 꽃잎 측정값 패턴을 이용해 새로운 붓꽃이 어떤 <strong>품종</strong>에 속하는지 분류 및 예측할 수 있습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: 기계학습 문제 해결 6단계 순서 맞추기 */}
      {currentStep === 4 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Workflow size={20} className="text-emerald-600" />
              <span>활동 4: 기계학습 문제 해결 6단계 순서 맞추기</span>
            </h3>

            <StepOrderActivity onComplete={() => setIsOrderFinished(true)} onAttempt={() => setAct4Attempted(true)} />
          </div>
        </div>
      )}

      {/* STEP 5: 전체 흐름 정리 및 학습 완료 */}
      {currentStep === 5 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900">기계학습 문제 해결 6단계 완성</h3>
              <p className="text-xs text-slate-500">Iris AI Lab 전체 학습 과정 로드맵</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <span className="font-extrabold px-2 py-1 rounded bg-slate-900 text-white">1단계</span>
                <div>
                  <span className="font-bold text-slate-900 block">문제 정의</span>
                  <span className="text-slate-500">붓꽃의 측정값으로 품종을 예측한다.</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <span className="font-extrabold px-2 py-1 rounded bg-slate-900 text-white">2단계</span>
                <div>
                  <span className="font-bold text-slate-900 block">데이터 수집</span>
                  <span className="text-slate-500">꽃받침과 꽃잎의 길이·너비 데이터를 준비한다.</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <span className="font-extrabold px-2 py-1 rounded bg-slate-900 text-white">3단계</span>
                <div>
                  <span className="font-bold text-slate-900 block">데이터 전처리</span>
                  <span className="text-slate-500">결측치와 이상치를 확인하고 데이터를 정리한다.</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <span className="font-extrabold px-2 py-1 rounded bg-slate-900 text-white">4단계</span>
                <div>
                  <span className="font-bold text-slate-900 block">기계학습 유형/알고리즘 선정</span>
                  <span className="text-slate-500">분류 문제에 적합한 학습 방법과 알고리즘을 선택한다.</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <span className="font-extrabold px-2 py-1 rounded bg-slate-900 text-white">5단계</span>
                <div>
                  <span className="font-bold text-slate-900 block">모델 학습</span>
                  <span className="text-slate-500">훈련 데이터를 이용해 모델이 패턴을 학습한다.</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <span className="font-extrabold px-2 py-1 rounded bg-slate-900 text-white">6단계</span>
                <div>
                  <span className="font-bold text-slate-900 block">성능 평가 및 수정</span>
                  <span className="text-slate-500">테스트 데이터로 성능을 확인하고 조건을 바꾸어 개선한다.</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-600 text-white text-center font-extrabold text-sm shadow-sm">
              "기계학습은 데이터에서 규칙이나 패턴을 학습해 새로운 데이터에 적용합니다."
            </div>

            <div className="pt-2 text-center space-y-2">
              {isCompleted && (
                <div className="text-xs font-bold text-emerald-700 bg-emerald-100 p-2 rounded-xl inline-block">
                  ✓ 이미 완료된 영역입니다. 언제든 자유롭게 복습 및 다시 학습이 가능합니다.
                </div>
              )}
              {isOrderFinished && (
                <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                  ✓ 4단계 ML 6단계 순서 맞추기 미션을 완수하셨습니다.
                </div>
              )}
              {!act5Confirmed && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                  <p className="text-xs text-slate-600 font-medium">6단계 전체 흐름을 확인한 뒤 아래 완료 버튼을 눌러주세요.</p>
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
                icon={<CheckCircle2 size={20} />}
              >
                02 기계학습 시작 학습 완료하기
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* Internal Step Control Navigation */}
      <div className="space-y-2 pt-3 border-t border-slate-200">
        {!isStepCompleted && currentStep < totalSteps && (
          <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-center font-medium animate-fadeIn">
            {currentStep === 1 && '💡 두 상황의 프로그래밍 방식을 모두 선택하면 다음 활동으로 이동할 수 있습니다.'}
            {currentStep === 2 && '💡 핵심 동작 흐름을 확인한 뒤 [내용 확인 완료]를 눌러주세요.'}
            {currentStep === 3 && '💡 질문에 응답하면 다음 활동으로 이동할 수 있습니다.'}
            {currentStep === 4 && '💡 6단계 순서 맞추기를 시도하면 다음 활동으로 이동할 수 있습니다.'}
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
