import React, { useState } from 'react';
import { useActivityScrollTop } from '../../hooks/useActivityScrollTop';
import { ActivityProgress } from './ActivityProgress';
import { ChoiceCard } from './ChoiceCard';
import { PromptCard } from './PromptCard';
import { PrimaryButton } from '../common/PrimaryButton';
import { SecondaryButton } from '../common/SecondaryButton';
import { CheckCircle2, ShieldCheck, ChevronRight, ChevronLeft, Lightbulb, AlertCircle } from 'lucide-react';

interface Module01ActivityProps {
  isCompleted: boolean;
  onComplete: () => void;
}

export const Module01Activity: React.FC<Module01ActivityProps> = ({ isCompleted, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6; // 5 activities + summary
  const topRef = useActivityScrollTop<HTMLDivElement>(currentStep);

  // Activity 1 State
  const [act1Selected, setAct1Selected] = useState<'A' | 'B' | null>(null);

  // Activity 2 State (Selected elements)
  const [act2ActiveTab, setAct2ActiveTab] = useState<'purpose' | 'condition' | 'format'>('purpose');

  // Activity 3 State
  const [act3Selected, setAct3Selected] = useState<number | null>(null);

  // Activity 4 State
  const [act4Selected, setAct4Selected] = useState<'A' | 'B' | null>(null);

  const samplePrompt =
    "붓꽃 품종을 분류하는 기계학습 모델을 만들려고 한다. 꽃받침 길이, 꽃받침 너비, 꽃잎 길이, 꽃잎 너비 4개 수치형 속성이 품종 분류에 어떤 도움을 줄 수 있는지 고등학생이 이해하기 쉽게 '속성명 / 특성 / 분류에 쓰는 이유' 표로 설명해줘.";

  return (
    <div className="space-y-6 scroll-mt-24" ref={topRef}>
      {/* Official 6-stage badge banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
          [공식 6단계 과정] ① 문제 정의
        </span>
        <span className="text-xs text-slate-500 font-medium">01 AI 조수와의 만남</span>
      </div>

      {/* Activity Progress Header */}
      <ActivityProgress
        currentStep={currentStep}
        totalSteps={totalSteps}
        title={
          currentStep === 1
            ? '좋은 프롬프트 비교'
            : currentStep === 2
            ? '프롬프트 3대 요소'
            : currentStep === 3
            ? 'AI 답변 검증'
            : currentStep === 4
            ? '개인정보 보호'
            : currentStep === 5
            ? '프롬프트 복사 실습'
            : 'AI 활용 원칙 요약'
        }
      />

      {/* STEP 1: 좋은 프롬프트 비교 */}
      {currentStep === 1 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Lightbulb className="text-amber-500 shrink-0" size={20} />
              <span>활동 1: 어떤 질문이 더 좋은 질문일까?</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              기계학습 프로젝트를 수행할 때 생성형 AI(ChatGPT 등)에 보낼 두 질문 A와 B를 비교하고, 더 적절한 질문을 선택해 보세요.
            </p>

            <div className="space-y-3 pt-2">
              <ChoiceCard
                optionKey="A"
                label="붓꽃 데이터 알려줘."
                subText="단순하고 추상적인 1줄 문장"
                isSelected={act1Selected === 'A'}
                status={act1Selected === 'A' ? 'incorrect' : 'default'}
                onClick={() => setAct1Selected('A')}
              />

              <ChoiceCard
                optionKey="B"
                label="붓꽃 품종을 분류하는 기계학습 모델을 만들려고 한다. Iris 데이터의 주요 속성 4개를 '속성명 / 데이터 유형 / 분류에 사용하는 이유' 형식의 표로 설명해줘."
                subText="목적, 조건, 원하는 출력 형식을 명확하게 지정한 질문"
                isSelected={act1Selected === 'B'}
                status={act1Selected === 'B' ? 'correct' : 'default'}
                onClick={() => setAct1Selected('B')}
              />
            </div>

            {act1Selected === 'B' && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1 animate-fadeIn">
                <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>훌륭합니다! 정답은 B입니다.</span>
                </p>
                <p className="leading-relaxed">
                  좋은 프롬프트는 <strong>목적, 조건, 원하는 결과 형식</strong>을 구체적으로 제시할수록 훨씬 정확하고 유용한 답을 얻을 수 있습니다.
                </p>
              </div>
            )}

            {act1Selected === 'A' && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1 animate-fadeIn">
                <p className="font-bold flex items-center gap-1.5 text-amber-900">
                  <AlertCircle size={16} className="text-amber-600" />
                  <span>질문 A는 다소 부족합니다.</span>
                </p>
                <p className="leading-relaxed">
                  "붓꽃 데이터 알려줘"처럼 너무 막연한 질문은 AI가 사용자가 무엇을 원하는지 파악하기 어려워 원하지 않는 일반 상식 답변만 받게 됩니다.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: 프롬프트 3대 요소 */}
      {currentStep === 2 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">
              활동 2: 좋은 프롬프트의 세 가지 요소
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              아래 버튼을 눌러 좋은 프롬프트의 3대 핵심 요소를 확인하세요.
            </p>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setAct2ActiveTab('purpose')}
                className={`p-3 rounded-xl text-xs font-bold transition-all min-h-[48px] cursor-pointer ${
                  act2ActiveTab === 'purpose'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                1. 목적 (Goal)
              </button>
              <button
                onClick={() => setAct2ActiveTab('condition')}
                className={`p-3 rounded-xl text-xs font-bold transition-all min-h-[48px] cursor-pointer ${
                  act2ActiveTab === 'condition'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                2. 조건 (Condition)
              </button>
              <button
                onClick={() => setAct2ActiveTab('format')}
                className={`p-3 rounded-xl text-xs font-bold transition-all min-h-[48px] cursor-pointer ${
                  act2ActiveTab === 'format'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                3. 결과 형식 (Format)
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              {act2ActiveTab === 'purpose' && (
                <div>
                  <span className="font-extrabold text-emerald-800 block text-sm">1. 목적 (What to do)</span>
                  <p className="text-slate-700 mt-1">예시 문장: "붓꽃 품종을 분류하는 기계학습 모델을 만들려고 한다."</p>
                  <p className="text-slate-500 mt-1">AI가 수행해야 할 과제의 배경과 최종 목표를 명확히 제시합니다.</p>
                </div>
              )}
              {act2ActiveTab === 'condition' && (
                <div>
                  <span className="font-extrabold text-emerald-800 block text-sm">2. 조건 (Constraints)</span>
                  <p className="text-slate-700 mt-1">예시 문장: "Iris 데이터의 꽃받침·꽃잎 4가지 수치형 속성을 기준으로 설명해줘."</p>
                  <p className="text-slate-500 mt-1">분석 대상 범위, 규칙, 고려해야 할 데이터를 제한합니다.</p>
                </div>
              )}
              {act2ActiveTab === 'format' && (
                <div>
                  <span className="font-extrabold text-emerald-800 block text-sm">3. 결과 형식 (Output Format)</span>
                  <p className="text-slate-700 mt-1">예시 문장: "'속성명 / 데이터 유형 / 분류에 사용하는 이유' 형식의 표로 정리해줘."</p>
                  <p className="text-slate-500 mt-1">표, Bullet point, 마크다운 등 받고 싶은 답변의 양식을 지정합니다.</p>
                </div>
              )}
            </div>

            {/* Assembled Combined Prompt Display */}
            <div className="mt-4">
              <span className="text-xs font-bold text-slate-700 block mb-2">세 요소가 결합된 완성형 프롬프트:</span>
              <div className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono leading-relaxed">
                <span className={act2ActiveTab === 'purpose' ? 'text-emerald-400 font-bold bg-emerald-950 px-1 py-0.5 rounded' : ''}>
                  "붓꽃 품종을 분류하는 기계학습 모델을 만들려고 한다.{" "}
                </span>
                <span className={act2ActiveTab === 'condition' ? 'text-emerald-400 font-bold bg-emerald-950 px-1 py-0.5 rounded' : ''}>
                  Iris 데이터의 4가지 수치형 속성이 품종 분류에 주는 영향을{" "}
                </span>
                <span className={act2ActiveTab === 'format' ? 'text-emerald-400 font-bold bg-emerald-950 px-1 py-0.5 rounded' : ''}>
                  '속성명 / 데이터 유형 / 이유' 표 형식으로 정리해줘."
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: AI 답변 검증 (Hallucination) */}
      {currentStep === 3 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">
              활동 3: AI의 답은 항상 맞을까? (답변 검증)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              AI가 작성한 다음 답변을 읽고 어떻게 행동해야 할지 판단해 보세요.
            </p>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1 font-mono">
              <span className="font-bold text-amber-900 block">[가상의 AI 답변 예시]</span>
              "버지니카 품종의 꽃잎 길이는 항상 6.2cm입니다."
            </div>

            <div className="space-y-2.5 pt-2">
              <ChoiceCard
                optionKey="1"
                label="AI가 말했으므로 그대로 정답으로 사용한다."
                isSelected={act3Selected === 1}
                status={act3Selected === 1 ? 'incorrect' : 'default'}
                onClick={() => setAct3Selected(1)}
              />
              <ChoiceCard
                optionKey="2"
                label="실제 Iris 데이터와 비교하여 사실 여부를 직접 확인한다."
                isSelected={act3Selected === 2}
                status={act3Selected === 2 ? 'correct' : 'default'}
                onClick={() => setAct3Selected(2)}
              />
              <ChoiceCard
                optionKey="3"
                label="검증 없이 보고서나 친구에게 그대로 전달한다."
                isSelected={act3Selected === 3}
                status={act3Selected === 3 ? 'incorrect' : 'default'}
                onClick={() => setAct3Selected(3)}
              />
            </div>

            {/* Core Message Highlight */}
            <div className="p-4 rounded-2xl bg-emerald-600 text-white text-xs leading-relaxed space-y-1 shadow-xs">
              <span className="font-extrabold text-sm block">💡 핵심 가이드:</span>
              <p className="font-bold text-emerald-100 text-sm">
                "AI의 답변은 결과이지 정답이 아닙니다. 중요한 정보는 실제 데이터나 신뢰할 수 있는 자료로 확인해야 합니다."
              </p>
            </div>

            {/* Hallucination Definition Box */}
            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-900 block">용어 가이드 — 환각(Hallucination):</span>
              <p className="text-slate-600 leading-relaxed">
                생성형 AI가 사실이 아니거나 실제로 확인되지 않은 내용을 자신감 있게 그럴듯한 거짓말로 만들어 내는 현상입니다. 따라서 중요한 수치나 정보는 반드시 원본 붓꽃 데이터로 재검증해야 합니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: 개인정보 보호 */}
      {currentStep === 4 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldCheck size={20} className="text-emerald-600" />
              <span>활동 4: AI에게 입력해도 될까? (개인정보 보호)</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              두 질문 입력 예시 중 생성형 AI에 입력하기에 더 적절한 문장을 고르세요.
            </p>

            <div className="space-y-3">
              <ChoiceCard
                optionKey="A"
                label="우리 반 2학년 3반 홍길동의 성적은 국어 72점, 수학 65점인데 분석해줘."
                subText="실제 학생의 실명, 학년, 반 등 식별 가능한 개인정보가 입력됨"
                isSelected={act4Selected === 'A'}
                status={act4Selected === 'A' ? 'incorrect' : 'default'}
                onClick={() => setAct4Selected('A')}
              />
              <ChoiceCard
                optionKey="B"
                label="가상의 학생 A의 국어 72점, 수학 65점 데이터를 예시로 분석해줘."
                subText="개인 식별 정보를 익명화(가명 처리)하여 입력함"
                isSelected={act4Selected === 'B'}
                status={act4Selected === 'B' ? 'correct' : 'default'}
                onClick={() => setAct4Selected('B')}
              />
            </div>

            {act4Selected === 'B' && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 leading-relaxed animate-fadeIn">
                <span className="font-bold text-emerald-900 block mb-0.5">✓ 정답입니다!</span>
                실제 사람을 식별할 수 있는 이름, 학번, 개인 데이터는 생성형 AI 외부 서버로 유출될 우려가 있으므로 절대 입력하지 않는 것이 대원칙입니다. (본 Iris AI Lab 웹앱 내부에서도 개인정보를 요구하거나 저장하지 않습니다.)
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 5: 프롬프트 복사 실습 */}
      {currentStep === 5 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">
              활동 5: AI에게 직접 질문해보기 (실전 프롬프트)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              붓꽃 데이터 기계학습 학습 시 사용할 수 있는 모범 프롬프트입니다. 버튼을 눌러 복사하여 사용하세요.
            </p>

            <PromptCard promptText={samplePrompt} title="Iris 실습 추천 프롬프트" />
          </div>
        </div>
      )}

      {/* STEP 6: 요약 정리 & 완성 */}
      {currentStep === 6 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900">AI 활용 6대 수칙 요약</h3>
              <p className="text-xs text-slate-500">생성형 AI와 함께하는 바람직한 학습 태도</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium">
                <span className="font-bold text-emerald-700 mr-1.5">1.</span> 목적을 분명하게 작성한다.
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium">
                <span className="font-bold text-emerald-700 mr-1.5">2.</span> 필요한 구체적 조건을 제시한다.
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium">
                <span className="font-bold text-emerald-700 mr-1.5">3.</span> 원하는 결과 형식을 지정한다.
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium">
                <span className="font-bold text-emerald-700 mr-1.5">4.</span> 결과가 부족하면 추가 질문한다.
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium">
                <span className="font-bold text-emerald-700 mr-1.5">5.</span> AI 답변은 원본 데이터로 검증한다.
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium">
                <span className="font-bold text-emerald-700 mr-1.5">6.</span> 개인 식별 정보를 입력하지 않는다.
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-600 text-white text-center font-extrabold text-sm shadow-sm">
              "AI의 답변은 확인하고 사람이 최종 판단합니다."
            </div>

            <div className="pt-2 text-center space-y-2">
              {isCompleted && (
                <div className="text-xs font-bold text-emerald-700 bg-emerald-100 p-2 rounded-xl inline-block">
                  ✓ 이미 완료된 영역입니다. 언제든 자유롭게 복습 및 다시 학습이 가능합니다.
                </div>
              )}
              <PrimaryButton size="lg" fullWidth onClick={onComplete} icon={<CheckCircle2 size={20} />}>
                01 AI 활용법 학습 완료하기
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
