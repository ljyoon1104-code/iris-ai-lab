import React from 'react';
import { MODULES } from '../data/modules';
import { ModuleCard } from '../components/learning/ModuleCard';
import { ProgressBar } from '../components/common/ProgressBar';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { SecondaryButton } from '../components/common/SecondaryButton';
import { MLProcessBar } from '../components/learning/MLProcessBar';
import { Play, RotateCcw, Sparkles } from 'lucide-react';

interface HomePageProps {
  progressPercent: number;
  completedModuleIds: number[];
  onSelectModule: (id: number) => void;
  onStartOrContinue: () => void;
  onResetProgress: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  progressPercent,
  completedModuleIds,
  onSelectModule,
  onStartOrContinue,
  onResetProgress,
}) => {
  const hasProgress = completedModuleIds.length > 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero / Start Section */}
      <section className="bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 text-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-lg relative overflow-hidden">
        {/* Background accent shapes */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-1/3 -top-12 w-48 h-48 rounded-full bg-teal-400/20 blur-xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-100 text-xs font-bold mb-4 border border-white/20">
            <Sparkles size={14} className="text-amber-300" />
            <span>고등학교 「인공지능 기초」 Iris 데이터셋 실습</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-2">
            Iris AI Lab
          </h1>

          {/* Subtitle */}
          <h2 className="text-lg sm:text-xl font-semibold text-emerald-100 mb-3">
            붓꽃 데이터로 배우는 기계학습
          </h2>

          {/* Description */}
          <p className="text-sm sm:text-base text-emerald-50/90 leading-relaxed mb-6 max-w-2xl font-normal">
            데이터를 살펴보고, 기계학습 모델을 만들고, 새로운 붓꽃 품종(세토사·버시컬러·버지니카)을 예측해 보세요.
          </p>

          {/* Main Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <PrimaryButton
              variant="white"
              size="lg"
              onClick={onStartOrContinue}
              icon={<Play size={20} className="fill-current text-emerald-950" />}
              className="shadow-md font-black"
            >
              {hasProgress ? '이어하기' : '학습 시작하기'}
            </PrimaryButton>

            {hasProgress && (
              <SecondaryButton
                variant="white-outline"
                size="lg"
                onClick={onResetProgress}
                icon={<RotateCcw size={18} />}
              >
                처음부터
              </SecondaryButton>
            )}
          </div>

          {/* Progress Bar inside Hero */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <ProgressBar
              progress={progressPercent}
              label="전체 학습 진행률"
              className="[&_span]:text-white [&_div]:bg-white/20 [&_div>div]:bg-emerald-300"
            />
          </div>
        </div>
      </section>

      {/* 6 ML Steps Process Bar */}
      <section aria-labelledby="ml-workflow-heading">
        <h2 id="ml-workflow-heading" className="sr-only">기계학습 문제 해결 6단계 과정</h2>
        <MLProcessBar />
      </section>

      {/* 8 Learning Modules Grid */}
      <section aria-labelledby="learning-modules-heading">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 id="learning-modules-heading" className="text-xl font-bold text-slate-900">
              8개 주요 학습 영역
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              원하는 영역을 선택하여 탐색하고 실습을 진행하세요.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-200/60 px-2.5 py-1 rounded-lg">
            총 8개 모듈
          </span>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          {MODULES.map(module => (
            <ModuleCard
              key={module.id}
              module={module}
              isCompleted={completedModuleIds.includes(module.id)}
              onSelect={onSelectModule}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
