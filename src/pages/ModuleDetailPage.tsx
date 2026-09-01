import React from 'react';
import { useActivityScrollTop } from '../hooks/useActivityScrollTop';
import { MODULES } from '../data/modules';
import { MLProcessBar } from '../components/learning/MLProcessBar';
import { LearningCard } from '../components/learning/LearningCard';
import { Module01Activity } from '../components/learning/Module01Activity';
import { Module02Activity } from '../components/learning/Module02Activity';
import { Module03Activity } from '../components/learning/Module03Activity';
import { Module04Activity } from '../components/learning/Module04Activity';
import { Module05Activity } from '../components/learning/Module05Activity';
import { Module06Activity } from '../components/learning/Module06Activity';
import { Module07Activity } from '../components/learning/Module07Activity';
import { Module08Activity } from '../components/learning/Module08Activity';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { SecondaryButton } from '../components/common/SecondaryButton';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

interface ModuleDetailPageProps {
  moduleId: number;
  completedModuleIds: number[];
  onSelectModule: (id: number) => void;
  onGoHome: () => void;
  onBack?: () => void;
  previousModuleId?: number | null;
  onToggleComplete: (id: number) => void;
}

export const ModuleDetailPage: React.FC<ModuleDetailPageProps> = ({
  moduleId,
  completedModuleIds,
  onSelectModule,
  onGoHome,
  onBack,
  previousModuleId,
  onToggleComplete,
}) => {
  const moduleIndex = MODULES.findIndex(m => m.id === moduleId);
  const currentModule = MODULES[moduleIndex] || MODULES[0];
  const totalModules = MODULES.length;
  const isCompleted = completedModuleIds.includes(currentModule.id);
  const pageTopRef = useActivityScrollTop<HTMLDivElement>(moduleId);

  const prevModule = moduleIndex > 0 ? MODULES[moduleIndex - 1] : null;
  const nextModule = moduleIndex < totalModules - 1 ? MODULES[moduleIndex + 1] : null;

  return (
    <div ref={pageTopRef} className="space-y-6 animate-fadeIn">
      {/* Top Header Navigation */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack || onGoHome}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-emerald-700 transition-colors p-2 rounded-xl hover:bg-slate-100 min-h-[44px] cursor-pointer"
          aria-label={previousModuleId ? `0${previousModuleId} 영역으로 뒤로가기` : '학습 목록 홈으로 이동'}
        >
          <ArrowLeft size={18} />
          <span>{previousModuleId ? `0${previousModuleId} 영역으로` : '학습 목록으로'}</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
            영역 {currentModule.code}
          </span>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            {moduleIndex + 1} / {totalModules}
          </span>
        </div>
      </div>

      {/* Module Title Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-700 tracking-wider uppercase mb-1 block">
              LEARNING MODULE {currentModule.code}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
              {currentModule.title}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
              {currentModule.fullDesc}
            </p>
          </div>

          <button
            onClick={() => onToggleComplete(currentModule.id)}
            className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer min-h-[44px] ${
              isCompleted
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 size={16} className={isCompleted ? 'text-emerald-600' : 'text-slate-400'} />
            <span>{isCompleted ? '완료 처리됨' : '완료로 표시'}</span>
          </button>
        </div>
      </div>

      {/* ML 6 Steps Workflow Highlight Bar */}
      <MLProcessBar currentStepNumber={currentModule.mlStepRelated} />

      {/* Main Content Area */}
      {currentModule.id === 1 ? (
        <LearningCard title="01 AI 활용법 — 생성형 AI 탐구 활동" subtitle="생성형 AI 올바른 질문법, 답변 검증 및 윤리 수칙">
          <Module01Activity
            isCompleted={isCompleted}
            onComplete={() => onToggleComplete(currentModule.id)}
          />
        </LearningCard>
      ) : currentModule.id === 2 ? (
        <LearningCard title="02 기계학습 시작 — 머신러닝 기초 및 6단계 미션" subtitle="기계학습 개념, 전통적 프로그래밍 비교 및 문제 해결 6단계 과정">
          <Module02Activity
            isCompleted={isCompleted}
            onComplete={() => onToggleComplete(currentModule.id)}
          />
        </LearningCard>
      ) : currentModule.id === 3 ? (
        <LearningCard title="03 데이터 준비 — 문제 정의, 속성(X, y), 수집 및 데이터 편향" subtitle="Iris 데이터 기반 문제 정의, 분류/회귀/군집 구별, 데이터 편향 분석">
          <Module03Activity
            isCompleted={isCompleted}
            onComplete={() => onToggleComplete(currentModule.id)}
          />
        </LearningCard>
      ) : currentModule.id === 4 ? (
        <LearningCard title="04 데이터 전처리 — 데이터 탐정 활동" subtitle="Iris 데이터 결측치·이상치·표현불일치 발견, 정제 및 전처리 전후 비교">
          <Module04Activity
            isCompleted={isCompleted}
            onComplete={() => onToggleComplete(currentModule.id)}
          />
        </LearningCard>
      ) : currentModule.id === 5 ? (
        <LearningCard title="05 학습 방법 알아보기 — 지도/비지도/강화학습 및 알고리즘 지도" subtitle="지도·비지도·강화학습 탐구, 분류·회귀·군집 연결 및 알고리즘 지도 구축">
          <Module05Activity
            isCompleted={isCompleted}
            onComplete={() => onToggleComplete(currentModule.id)}
          />
        </LearningCard>
      ) : currentModule.id === 6 ? (
        <LearningCard title="06 알고리즘 실험실 — 5대 머신러닝 알고리즘 시뮬레이터" subtitle="k-NN, 의사결정트리, 선형회귀, k-means 및 강화학습 터치 시뮬레이션">
          <Module06Activity
            isCompleted={isCompleted}
            onComplete={() => onToggleComplete(currentModule.id)}
          />
        </LearningCard>
      ) : currentModule.id === 7 ? (
        <LearningCard title="07 모델 만들기 — Train/Test 데이터 분할 및 학습" subtitle="층화 데이터 분할(Train/Test), 알고리즘 및 하이퍼파라미터 설정과 모델 학습">
          <Module07Activity
            isCompleted={isCompleted}
            onComplete={() => {
              if (!isCompleted) onToggleComplete(currentModule.id);
              onSelectModule(8);
            }}
          />
        </LearningCard>
      ) : (
        <LearningCard title="08 모델 평가·개선 — 정확도, 3x3 혼동행렬 및 실험 비교" subtitle="독립된 테스트 데이터 평가, 3x3 혼동행렬 시각화 및 최대 3회 실험 비교">
          <Module08Activity
            isCompleted={isCompleted}
            onComplete={() => onToggleComplete(currentModule.id)}
          />
        </LearningCard>
      )}

      {/* Bottom Navigation Controls: Previous / Next */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200">
        {prevModule ? (
          <SecondaryButton
            size="md"
            onClick={() => onSelectModule(prevModule.id)}
            icon={<ChevronLeft size={18} />}
          >
            이전 영역
          </SecondaryButton>
        ) : (
          <SecondaryButton size="md" disabled icon={<ChevronLeft size={18} />}>
            이전 영역
          </SecondaryButton>
        )}

        {nextModule ? (
          <PrimaryButton
            size="md"
            onClick={() => onSelectModule(nextModule.id)}
            icon={<ChevronRight size={18} />}
            className="flex-row-reverse"
          >
            다음 영역
          </PrimaryButton>
        ) : (
          <PrimaryButton
            size="md"
            onClick={onGoHome}
            icon={<CheckCircle2 size={18} />}
          >
            학습 완료 (홈으로)
          </PrimaryButton>
        )}
      </div>
    </div>
  );
};
