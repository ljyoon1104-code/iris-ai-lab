import React, { useState } from 'react';
import { useActivityScrollTop } from '../../hooks/useActivityScrollTop';
import { KNNLab } from './KNNLab';
import { DecisionTreeLab } from './DecisionTreeLab';
import { LinearRegressionLab } from './LinearRegressionLab';
import { KMeansLab } from './KMeansLab';
import { ReinforcementLearningLab } from './ReinforcementLearningLab';
import { MasterAlgorithmComparison } from './MasterAlgorithmComparison';
import { PrimaryButton } from '../common/PrimaryButton';
import { Target, GitBranch, Scale, LineChart, PieChart, Bot, CheckCircle2 } from 'lucide-react';

interface Module06ActivityProps {
  isCompleted: boolean;
  onComplete: () => void;
}

export const Module06Activity: React.FC<Module06ActivityProps> = ({ isCompleted, onComplete }) => {
  const [activeTab, setActiveTab] = useState<'knn' | 'dt' | 'lr' | 'kmeans' | 'rl' | 'compare'>('knn');
  const topRef = useActivityScrollTop<HTMLDivElement>(activeTab);

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
            onClick={() => setActiveTab('dt')}
            className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer min-h-[52px] ${
              activeTab === 'dt'
                ? 'border-teal-600 bg-teal-50 text-teal-950 shadow-xs'
                : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300'
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
            onClick={() => setActiveTab('lr')}
            className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer min-h-[52px] ${
              activeTab === 'lr'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs'
                : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
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
            onClick={() => setActiveTab('kmeans')}
            className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer min-h-[52px] ${
              activeTab === 'kmeans'
                ? 'border-blue-600 bg-blue-50 text-blue-950 shadow-xs'
                : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
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
            onClick={() => setActiveTab('rl')}
            className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer min-h-[52px] ${
              activeTab === 'rl'
                ? 'border-amber-600 bg-amber-50 text-amber-950 shadow-xs'
                : 'border-slate-200 bg-white text-slate-700 hover:border-amber-300'
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
            onClick={() => setActiveTab('compare')}
            className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer min-h-[52px] ${
              activeTab === 'compare'
                ? 'border-purple-600 bg-purple-50 text-purple-950 shadow-xs'
                : 'border-slate-200 bg-white text-slate-700 hover:border-purple-300'
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
      {activeTab === 'knn' && <KNNLab />}
      {activeTab === 'dt' && <DecisionTreeLab />}
      {activeTab === 'lr' && <LinearRegressionLab />}
      {activeTab === 'kmeans' && <KMeansLab />}
      {activeTab === 'rl' && <ReinforcementLearningLab />}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          <MasterAlgorithmComparison />
          <KNNLab />
          <DecisionTreeLab />
          <LinearRegressionLab />
          <KMeansLab />
          <ReinforcementLearningLab />
        </div>
      )}

      {/* Module Completion Button */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs text-center space-y-3">
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

        {/* Section 25 Ending Page Connection */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2 text-xs max-w-xl mx-auto">
          <span className="font-bold text-slate-900 block text-sm">💡 다음 학습 영역 연결 안내:</span>
          <p className="text-slate-700 font-bold leading-relaxed">
            "알고리즘을 이해했다면 이제 실제 데이터를 이용해 모델을 만들어봅니다."
          </p>
        </div>

        {isCompleted && (
          <div className="text-xs font-bold text-emerald-700 bg-emerald-100 p-2 rounded-xl inline-block">
            ✓ 이미 완료된 영역입니다. 언제든 자유롭게 5대 알고리즘 실험을 복습할 수 있습니다.
          </div>
        )}
        <PrimaryButton size="lg" fullWidth onClick={onComplete} icon={<CheckCircle2 size={20} />}>
          06 알고리즘 실험실 완료 & 07 모델 만들기로 이동
        </PrimaryButton>
      </div>
    </div>
  );
};
