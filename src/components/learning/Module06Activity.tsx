import React, { useState } from 'react';
import { useActivityScrollTop } from '../../hooks/useActivityScrollTop';
import { KNNLab } from './KNNLab';
import { DecisionTreeLab } from './DecisionTreeLab';
import { LinearRegressionLab } from './LinearRegressionLab';
import { KMeansLab } from './KMeansLab';
import { ReinforcementLearningLab } from './ReinforcementLearningLab';
import { MasterAlgorithmComparison } from './MasterAlgorithmComparison';
import { PrimaryButton } from '../common/PrimaryButton';
import { SecondaryButton } from '../common/SecondaryButton';
import { Target, GitBranch, Scale, LineChart, PieChart, Bot, CheckCircle2, ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';

interface Module06ActivityProps {
  isCompleted: boolean;
  onComplete: () => void;
}

export const Module06Activity: React.FC<Module06ActivityProps> = ({ isCompleted, onComplete }) => {
  const [activeTab, setActiveTab] = useState<'knn' | 'dt' | 'lr' | 'kmeans' | 'rl' | 'compare'>('knn');
  const topRef = useActivityScrollTop<HTMLDivElement>(activeTab);

  const tabs: ('knn' | 'dt' | 'lr' | 'kmeans' | 'rl' | 'compare')[] = [
    'knn',
    'dt',
    'lr',
    'kmeans',
    'rl',
    'compare',
  ];

  const [completedLabs, setCompletedLabs] = useState<Record<string, boolean>>({});

  const isTabUnlocked = (tabKey: string) => {
    if (isCompleted) return true;
    const tabIdx = tabs.indexOf(tabKey as any);
    if (tabIdx === 0) return true;
    const prevTabKey = tabs[tabIdx - 1];
    return !!completedLabs[prevTabKey];
  };

  return (
    <div className="space-y-6 scroll-mt-24" ref={topRef}>
      {/* 5 Algorithm Selection Navigation Cards */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-slate-800 block">5대 알고리즘 실험실 선택:</span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* 1. k-NN */}
          <button
            onClick={() => setActiveTab('knn')}
            className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer min-h-[52px] ${
              activeTab === 'knn'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs'
                : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center gap-1.5 font-extrabold text-xs mb-0.5">
              <Target size={16} className="text-emerald-600 shrink-0" />
              <span>k-NN</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
              분류 (지도)
            </span>
          </button>

          {/* 2. Decision Tree */}
          <button
            disabled={!isTabUnlocked('dt')}
            onClick={() => setActiveTab('dt')}
            className={`p-3 rounded-2xl border-2 text-left transition-all min-h-[52px] ${
              !isTabUnlocked('dt')
                ? 'opacity-40 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                : activeTab === 'dt'
                ? 'border-teal-600 bg-teal-50 text-teal-950 shadow-xs cursor-pointer'
                : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300 cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-1.5 font-extrabold text-xs mb-0.5">
              <GitBranch size={16} className="text-teal-600 shrink-0" />
              <span>의사결정트리</span>
            </div>
            <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-1.5 py-0.5 rounded">
              분류 (지도)
            </span>
          </button>

          {/* 3. Linear Regression */}
          <button
            disabled={!isTabUnlocked('lr')}
            onClick={() => setActiveTab('lr')}
            className={`p-3 rounded-2xl border-2 text-left transition-all min-h-[52px] ${
              !isTabUnlocked('lr')
                ? 'opacity-40 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                : activeTab === 'lr'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs cursor-pointer'
                : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-1.5 font-extrabold text-xs mb-0.5">
              <LineChart size={16} className="text-emerald-600 shrink-0" />
              <span>선형 회귀</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
              회귀 (지도)
            </span>
          </button>

          {/* 4. k-means */}
          <button
            disabled={!isTabUnlocked('kmeans')}
            onClick={() => setActiveTab('kmeans')}
            className={`p-3 rounded-2xl border-2 text-left transition-all min-h-[52px] ${
              !isTabUnlocked('kmeans')
                ? 'opacity-40 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                : activeTab === 'kmeans'
                ? 'border-blue-600 bg-blue-50 text-blue-950 shadow-xs cursor-pointer'
                : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-1.5 font-extrabold text-xs mb-0.5">
              <PieChart size={16} className="text-blue-600 shrink-0" />
              <span>k-means</span>
            </div>
            <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded">
              군집 (비지도)
            </span>
          </button>

          {/* 5. Reinforcement Learning */}
          <button
            disabled={!isTabUnlocked('rl')}
            onClick={() => setActiveTab('rl')}
            className={`p-3 rounded-2xl border-2 text-left transition-all min-h-[52px] ${
              !isTabUnlocked('rl')
                ? 'opacity-40 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                : activeTab === 'rl'
                ? 'border-amber-600 bg-amber-50 text-amber-950 shadow-xs cursor-pointer'
                : 'border-slate-200 bg-white text-slate-700 hover:border-amber-300 cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-1.5 font-extrabold text-xs mb-0.5">
              <Bot size={16} className="text-amber-600 shrink-0" />
              <span>강화학습</span>
            </div>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
              보상 학습
            </span>
          </button>

          {/* 6. Master Comparison */}
          <button
            disabled={!isTabUnlocked('compare')}
            onClick={() => setActiveTab('compare')}
            className={`p-3 rounded-2xl border-2 text-left transition-all min-h-[52px] ${
              !isTabUnlocked('compare')
                ? 'opacity-40 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                : activeTab === 'compare'
                ? 'border-purple-600 bg-purple-50 text-purple-950 shadow-xs cursor-pointer'
                : 'border-slate-200 bg-white text-slate-700 hover:border-purple-300 cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-1.5 font-extrabold text-xs mb-0.5">
              <Scale size={16} className="text-purple-600 shrink-0" />
              <span>5대 비교</span>
            </div>
            <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-1.5 py-0.5 rounded">
              전체 요약
            </span>
          </button>
        </div>
      </div>

      {/* Tab Active Lab View */}
      {activeTab === 'knn' && <KNNLab onInteract={() => setCompletedLabs(prev => ({ ...prev, knn: true }))} />}
      {activeTab === 'dt' && <DecisionTreeLab onInteract={() => setCompletedLabs(prev => ({ ...prev, dt: true }))} />}
      {activeTab === 'lr' && <LinearRegressionLab onInteract={() => setCompletedLabs(prev => ({ ...prev, lr: true }))} />}
      {activeTab === 'kmeans' && <KMeansLab onInteract={() => setCompletedLabs(prev => ({ ...prev, kmeans: true }))} />}
      {activeTab === 'rl' && <ReinforcementLearningLab onInteract={() => setCompletedLabs(prev => ({ ...prev, rl: true }))} />}
      {activeTab === 'compare' && <MasterAlgorithmComparison />}

      {/* Interactive Lab Participation Status / Confirmation */}
      {activeTab !== 'compare' ? (
        <div className="rounded-2xl transition-all">
          {!completedLabs[activeTab] ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-amber-950 font-medium animate-fadeIn">
              <Sparkles size={18} className="text-amber-600 shrink-0" />
              <span>
                {activeTab === 'knn' && '💡 k값 변경, 경계선 사례 불러오기, 또는 산점도를 클릭해 최근접 이웃과 예측 결과를 최소 1회 확인해 보세요.'}
                {activeTab === 'dt' && '💡 최대 깊이 변경, 샘플 적용, 또는 수치를 조작해 질문 트리의 분기 과정을 최소 1회 탐구해 보세요.'}
                {activeTab === 'lr' && '💡 입력 X값 조작, 수동 직선 모드 전환, 또는 산점도를 클릭해 회귀 예측 결과를 최소 1회 확인해 보세요.'}
                {activeTab === 'kmeans' && '💡 시작 중심점을 설정(또는 자동 선택)한 뒤 [k-means 알고리즘 실행] 버튼을 눌러 최소 1회 군집화를 실행해 보세요.'}
                {activeTab === 'rl' && '💡 [학습 시작] 또는 [전체 에피소드 즉시 완료]를 눌러 강화학습 에피소드를 최소 1회 실행해 보세요.'}
              </span>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-emerald-950 font-bold animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <span>
                  {activeTab === 'knn' && '✓ k-NN 이웃 탐색 및 예측 결과 확인 완료!'}
                  {activeTab === 'dt' && '✓ 의사결정트리 분기 및 예측 탐구 완료!'}
                  {activeTab === 'lr' && '✓ 선형 회귀 직선 및 수치 예측 확인 완료!'}
                  {activeTab === 'kmeans' && '✓ k-means 군집화 알고리즘 실행 완료!'}
                  {activeTab === 'rl' && '✓ 온실 로봇 강화학습 에피소드 실행 완료!'}
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-300 font-medium">
                다음 알고리즘 해금됨
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
          <div className="text-xs text-slate-700">
            <span className="font-bold text-slate-900 block mb-0.5">5대 알고리즘 비교 정리 확인</span>
            <p className="text-slate-500">5대 알고리즘의 문제 유형, 핵심 아이디어, 차이점을 비교해보고 확인 버튼을 눌러주세요.</p>
          </div>
          <SecondaryButton
            size="sm"
            onClick={() => setCompletedLabs(prev => ({ ...prev, compare: true }))}
            className={completedLabs['compare'] ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : ''}
          >
            {completedLabs['compare'] ? '✓ 비교 내용 확인 완료' : '비교 내용 확인 완료'}
          </SecondaryButton>
        </div>
      )}

      {/* Module Completion Button (displayed only when on compare tab) */}
      {activeTab === 'compare' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs text-center space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 pb-1">
            <span className="text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
              [공식 6단계 과정] ④ 기계학습 알고리즘 선정
            </span>
            <span>06 알고리즘 실험실</span>
          </div>

          {/* Section 24 Key Summary Sentence Banner */}
          <div className="p-4 rounded-2xl bg-emerald-600 text-white text-center font-extrabold text-sm shadow-sm max-w-xl mx-auto">
            "알고리즘의 설정에 따라 결과가 달라질 수 있습니다."
          </div>

          {/* Section 25 Next Module Connection */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2 max-w-xl mx-auto text-xs">
            <span className="font-bold text-slate-900 block text-sm">💡 다음 단계 안내:</span>
            <p className="text-slate-600 font-medium leading-relaxed">
              "실험실에서 살펴본 분류 알고리즘 중 하나를 선택하여 직접 Iris 데이터를 훈련하고 새로운 붓꽃의 품종을 예측해 봅시다."
            </p>
          </div>

          <PrimaryButton
            size="lg"
            fullWidth
            disabled={!completedLabs['compare']}
            onClick={onComplete}
            icon={<ArrowRight size={20} />}
          >
            06 알고리즘 실험실 완료 & 07 모델 만들기로 이동
          </PrimaryButton>
        </div>
      )}

      {/* Internal Step Control Navigation */}
      <div className="space-y-2 pt-3 border-t border-slate-200">
        {!completedLabs[activeTab] && (
          <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-center font-medium animate-fadeIn">
            {activeTab === 'knn' && '💡 k값 변경이나 예측을 최소 1회 실행하면 다음 알고리즘으로 이동할 수 있습니다.'}
            {activeTab === 'dt' && '💡 트리 깊이 조절이나 샘플 분기 탐구를 최소 1회 실행하면 다음 알고리즘으로 이동할 수 있습니다.'}
            {activeTab === 'lr' && '💡 입력값 조작이나 회귀선 분석을 최소 1회 실행하면 다음 알고리즘으로 이동할 수 있습니다.'}
            {activeTab === 'kmeans' && '💡 k-means 군집화 알고리즘을 최소 1회 실행하면 다음 알고리즘으로 이동할 수 있습니다.'}
            {activeTab === 'rl' && '💡 강화학습 에피소드를 최소 1회 실행하면 다음 알고리즘으로 이동할 수 있습니다.'}
            {activeTab === 'compare' && '💡 5대 알고리즘 비교 내용을 확인한 뒤 [비교 내용 확인 완료]를 눌러주세요.'}
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          <SecondaryButton
            size="md"
            disabled={activeTab === 'knn'}
            onClick={() => {
              const idx = tabs.indexOf(activeTab);
              if (idx > 0) setActiveTab(tabs[idx - 1]);
            }}
            icon={<ChevronLeft size={16} />}
          >
            이전 활동
          </SecondaryButton>

          {activeTab !== 'compare' ? (
            <PrimaryButton
              size="md"
              disabled={!completedLabs[activeTab]}
              onClick={() => {
                const idx = tabs.indexOf(activeTab);
                if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1]);
              }}
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
