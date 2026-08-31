import React, { useState } from 'react';
import { ML_STEPS } from '../../data/modules';
import { shuffleWithSeed } from '../../utils/irisHelpers';
import { ChevronUp, ChevronDown, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';
import { PrimaryButton } from '../common/PrimaryButton';
import { SecondaryButton } from '../common/SecondaryButton';

interface StepOrderActivityProps {
  onComplete: () => void;
}

const IRIS_STEP_EXAMPLES: Record<number, string> = {
  1: '붓꽃의 꽃받침·꽃잎 측정값으로 품종(● 세토사 · ▲ 버시컬러 · ■ 버지니카)을 예측한다.',
  2: 'Kaggle Iris Species 데이터셋의 150개 레코드 및 속성 4개를 수집한다.',
  3: '데이터에서 결측치, 이상치, 표현 불일치를 찾아서 정상 형태로 정제한다.',
  4: '품종 분류 문제에 가장 적합한 지도학습 알고리즘(k-NN, 의사결정트리 등)을 선정한다.',
  5: '훈련 데이터를 모델에 입력하여 붓꽃 측정값과 품종 간의 패턴을 학습시킨다.',
  6: '테스트 데이터로 3x3 혼동행렬과 정확도를 평가하고 속성/파라미터를 바꿔 개선한다.',
};

export const StepOrderActivity: React.FC<StepOrderActivityProps> = ({ onComplete }) => {
  // Initially shuffle the 6 steps using a fixed seed (e.g. 77)
  const [userOrder, setUserOrder] = useState(() => shuffleWithSeed(ML_STEPS, 77));
  const [resultStatus, setResultStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newOrder = [...userOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setUserOrder(newOrder);
    setResultStatus('idle');
  };

  const handleMoveDown = (index: number) => {
    if (index >= userOrder.length - 1) return;
    const newOrder = [...userOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setUserOrder(newOrder);
    setResultStatus('idle');
  };

  const handleCheckOrder = () => {
    const isCorrect = userOrder.every((step, idx) => step.stepNumber === idx + 1);
    if (isCorrect) {
      setResultStatus('correct');
      onComplete();
    } else {
      setResultStatus('incorrect');
    }
  };

  const handleReset = () => {
    setUserOrder(shuffleWithSeed(ML_STEPS, 99));
    setResultStatus('idle');
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
        <p className="font-bold text-slate-800 mb-1">순서 맞추기 미션:</p>
        아래 6개의 기계학습 문제 해결 단계를 올바른 순서(1단계 ~ 6단계)로 배치하세요.
        스마트폰이나 태블릿에서는 카드의 <strong>[▲ 위로] [▼ 아래로]</strong> 버튼을 사용하여 손쉽게 위치를 이동할 수 있습니다.
      </div>

      {/* Step Cards Stack */}
      <div className="space-y-3">
        {userOrder.map((step, index) => (
          <div
            key={step.stepNumber}
            className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${
              resultStatus === 'correct'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                : 'bg-white border-slate-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                {index + 1}
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{step.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
                {resultStatus === 'correct' && (
                  <div className="mt-2 text-xs font-semibold text-emerald-800 bg-emerald-100/80 p-2 rounded-lg border border-emerald-200">
                    💡 Iris 예시: {IRIS_STEP_EXAMPLES[step.stepNumber]}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Touch Reorder Buttons */}
            {resultStatus !== 'correct' && (
              <div className="flex flex-col sm:flex-row gap-1 shrink-0">
                <button
                  disabled={index === 0}
                  onClick={() => handleMoveUp(index)}
                  className="p-2 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-slate-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                  aria-label={`${step.title} 위로 이동`}
                >
                  <ChevronUp size={18} />
                </button>
                <button
                  disabled={index === userOrder.length - 1}
                  onClick={() => handleMoveDown(index)}
                  className="p-2 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-slate-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                  aria-label={`${step.title} 아래로 이동`}
                >
                  <ChevronDown size={18} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Result Status Feedback */}
      {resultStatus === 'incorrect' && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-3 text-xs font-bold animate-fadeIn">
          <AlertTriangle size={20} className="text-rose-600 shrink-0" />
          <span>X 아직 순서가 맞지 않는 단계가 있습니다. 위치를 조정하고 다시 [순서 확인]을 눌러보세요.</span>
        </div>
      )}

      {resultStatus === 'correct' && (
        <div className="p-4 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-950 flex items-center gap-3 text-xs font-bold animate-fadeIn">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <span>✓ 축하합니다! 기계학습 문제 해결 6단계 순서를 정확하게 맞추셨습니다!</span>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <SecondaryButton size="md" onClick={handleReset} icon={<RotateCcw size={16} />}>
          다시 섞기
        </SecondaryButton>

        <PrimaryButton
          size="md"
          onClick={handleCheckOrder}
          disabled={resultStatus === 'correct'}
          icon={<CheckCircle2 size={18} />}
        >
          순서 확인하기
        </PrimaryButton>
      </div>
    </div>
  );
};
