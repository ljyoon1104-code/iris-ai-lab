import React from 'react';
import { Target, GitBranch, LineChart, PieChart, Bot, CheckCircle2 } from 'lucide-react';

export const MasterAlgorithmComparison: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <CheckCircle2 size={20} className="text-emerald-600" />
          <span>Iris AI Lab 5대 머신러닝 알고리즘 총정리 비교</span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          문제의 형태, 입력 데이터 및 학습 목표에 따른 5개 알고리즘의 동작 특성을 비교하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
        {/* 1. k-NN */}
        <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-2">
          <div className="flex items-center justify-between font-bold text-emerald-950">
            <span className="flex items-center gap-1.5 text-sm">
              <Target size={16} className="text-emerald-600" />
              1. k-NN
            </span>
            <span className="text-[11px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-extrabold">
              지도학습 → 분류
            </span>
          </div>
          <p className="text-slate-700 leading-relaxed">
            <strong>핵심 원리:</strong> 새로운 데이터 좌표에서 가장 가까운 k개 이웃 데이터의 품종을 확인하고 다수결 투표로 판정합니다.
          </p>
        </div>

        {/* 2. Decision Tree */}
        <div className="p-4 rounded-xl bg-teal-50/80 border border-teal-200 space-y-2">
          <div className="flex items-center justify-between font-bold text-teal-950">
            <span className="flex items-center gap-1.5 text-sm">
              <GitBranch size={16} className="text-teal-600" />
              2. 의사결정트리
            </span>
            <span className="text-[11px] bg-teal-200 text-teal-900 px-2 py-0.5 rounded font-extrabold">
              지도학습 → 분류
            </span>
          </div>
          <p className="text-slate-700 leading-relaxed">
            <strong>핵심 원리:</strong> 데이터 속성값을 스무고개처럼 조건문(≤ / &gt;)과 비교하며 가지를 따라 최종 리프 노드로 판정합니다.
          </p>
        </div>

        {/* 3. Linear Regression */}
        <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-2">
          <div className="flex items-center justify-between font-bold text-emerald-950">
            <span className="flex items-center gap-1.5 text-sm">
              <LineChart size={16} className="text-emerald-600" />
              3. 선형 회귀
            </span>
            <span className="text-[11px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-extrabold">
              지도학습 → 회귀
            </span>
          </div>
          <p className="text-slate-700 leading-relaxed">
            <strong>핵심 원리:</strong> 두 수치형 속성 간의 최적 직선($y = ax + b$)을 찾아 미래 연속적 숫자 형태의 값을 예측합니다.
          </p>
        </div>

        {/* 4. k-means */}
        <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 space-y-2">
          <div className="flex items-center justify-between font-bold text-blue-950">
            <span className="flex items-center gap-1.5 text-sm">
              <PieChart size={16} className="text-blue-600" />
              4. k-means
            </span>
            <span className="text-[11px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded font-extrabold">
              비지도학습 → 군집
            </span>
          </div>
          <p className="text-slate-700 leading-relaxed">
            <strong>핵심 원리:</strong> 정답 품종을 숨기고 측정값의 유사성만으로 k개 군집 중심점을 계산하여 데이터를 그룹화합니다.
          </p>
        </div>

        {/* 5. Reinforcement Learning */}
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2 col-span-1 sm:col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between font-bold text-amber-950">
            <span className="flex items-center gap-1.5 text-sm">
              <Bot size={16} className="text-amber-600" />
              5. 강화학습 (Q-Learning)
            </span>
            <span className="text-[11px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-extrabold">
              보상 기반 행동 학습
            </span>
          </div>
          <p className="text-slate-700 leading-relaxed">
            <strong>핵심 원리:</strong> 정답 데이터 없이 격자판 환경에서 이동 행동을 수행하고 보상(+10점)과 벌점(-5점) 경험을 쌓아 최적 경로 정책을 스스로 학습합니다.
          </p>
        </div>
      </div>
    </div>
  );
};
