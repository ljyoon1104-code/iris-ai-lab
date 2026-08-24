import React, { useState } from 'react';
import {
  QLearningAgent,
  DEFAULT_GRID_CONFIG,
  type RLEpisodeResult,
  type PolicyPathResult,
} from '../../algorithms/reinforcementLearning';
import { PrimaryButton } from '../common/PrimaryButton';
import { SecondaryButton } from '../common/SecondaryButton';
import { Bot, Play, RotateCcw, Compass } from 'lucide-react';

export const ReinforcementLearningLab: React.FC = () => {
  const [agent] = useState(() => new QLearningAgent(DEFAULT_GRID_CONFIG, 42));
  const [lastBatchResult, setLastBatchResult] = useState<RLEpisodeResult | null>(null);
  const [explorationLevel, setExplorationLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [showPathOnMap, setShowPathOnMap] = useState<boolean>(false);

  const handleTrainEpisodes = (numEpisodes: number) => {
    // Set epsilon according to exploration level
    agent.epsilon = explorationLevel === 'low' ? 0.1 : explorationLevel === 'medium' ? 0.3 : 0.6;
    const res = agent.trainBatch(numEpisodes);
    setLastBatchResult(res);
    // Show path evaluation automatically after training
    setShowPathOnMap(true);
  };

  const handleReset = () => {
    agent.initQTable();
    setLastBatchResult(null);
    setShowPathOnMap(false);
  };

  // Evaluate pure greedy policy path
  const policyResult: PolicyPathResult = agent.getBestPolicyPath();
  const visiblePath = showPathOnMap ? policyResult.path : [];
  const visiblePathSet = new Set(visiblePath.map(p => `${p.r},${p.c}`));
  const lastPathPos = visiblePath.length > 0 ? visiblePath[visiblePath.length - 1] : null;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 space-y-1">
        <span className="font-extrabold text-sm text-amber-900 block flex items-center gap-1.5">
          <Bot size={18} className="text-amber-600" />
          <span>온실 탐사 로봇 강화학습 (Reinforcement Learning) 시뮬레이터</span>
        </span>
        <p className="leading-relaxed">
          로봇이 5×5 온실 격자판에서 보상(+10점)과 벌점(-5점/-1점)을 직접 겪으며 스스로 최적의 이동 경로를 학습합니다.
        </p>
      </div>

      {/* Grid Visualizer & Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* 5x5 Grid Visualization */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-slate-900">5 × 5 온실 격자 지도</span>
            <span className="font-mono text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded">
              누적 에피소드 학습: {agent.episodesTrained}회
            </span>
          </div>

          {/* 5x5 Grid Cells */}
          <div className="grid grid-cols-5 gap-1.5 p-2 bg-slate-900 rounded-xl aspect-square">
            {Array.from({ length: 5 }).map((_, r) =>
              Array.from({ length: 5 }).map((_, c) => {
                const isStart = r === 0 && c === 0;
                const isGoal = r === 4 && c === 4;
                const isObstacle = DEFAULT_GRID_CONFIG.obstacles.some(o => o.r === r && o.c === c);
                const isInVisiblePath = visiblePathSet.has(`${r},${c}`);
                const isLastPos = lastPathPos && lastPathPos.r === r && lastPathPos.c === c;

                let bgClass = 'bg-slate-800 text-slate-400';
                let content = '';

                if (isStart) {
                  bgClass = 'bg-blue-600 text-white font-bold';
                  content = 'S (시작)';
                } else if (isGoal) {
                  if (isInVisiblePath && policyResult.reachedGoal) {
                    bgClass = 'bg-emerald-500 text-white font-black ring-2 ring-emerald-300 animate-pulse';
                    content = '★ G (+10)';
                  } else {
                    bgClass = 'bg-emerald-600 text-white font-bold animate-pulse';
                    content = 'G (+10)';
                  }
                } else if (isObstacle) {
                  if (isInVisiblePath) {
                    bgClass = 'bg-rose-600 text-white font-black ring-2 ring-rose-300';
                    content = '★ X (-5)';
                  } else {
                    bgClass = 'bg-rose-600 text-white font-bold';
                    content = 'X (-5)';
                  }
                } else if (isInVisiblePath) {
                  if (isLastPos && !policyResult.reachedGoal) {
                    bgClass = 'bg-amber-600 text-white font-extrabold ring-2 ring-amber-300';
                    content = '★ 중단';
                  } else {
                    bgClass = 'bg-amber-500 text-slate-950 font-extrabold ring-2 ring-amber-300';
                    content = '★';
                  }
                }

                return (
                  <div
                    key={`${r}_${c}`}
                    className={`rounded-lg flex flex-col items-center justify-center text-[10px] sm:text-xs text-center p-1 font-mono transition-all ${bgClass}`}
                  >
                    <span>{content}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Grid Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-bold pt-1 text-slate-700">
            <span className="flex items-center gap-1 text-blue-700">● S: 로봇 시작 (0,0)</span>
            <span className="flex items-center gap-1 text-emerald-700">● G: 목표 (+10점)</span>
            <span className="flex items-center gap-1 text-rose-700">● X: 장애물 (-5점)</span>
            <span className="flex items-center gap-1 text-amber-700">★: 현재 배운 경로</span>
          </div>

          {/* Strict Policy Evaluation Result Card */}
          {showPathOnMap && (
            <div className={`p-4 rounded-xl border text-xs space-y-1.5 animate-fadeIn shadow-xs ${
              policyResult.reachedGoal
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}>
              <div className="flex items-center justify-between font-extrabold text-sm">
                <span>
                  {policyResult.reachedGoal ? '✓ 목표 지점 도달 성공' : '△ 아직 목표 지점에 도달하지 못함'}
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded font-mono font-bold ${
                  policyResult.reachedGoal ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                }`}>
                  {policyResult.reachedGoal ? '정책 탐색 성공' : '추가 학습 필요'}
                </span>
              </div>

              <p className="leading-relaxed font-medium">
                {policyResult.reachedGoal ? (
                  <>
                    현재 학습된 정책으로 시작점 S(0,0)에서 목표 지점 G(4,4)까지 <strong>성공적으로 도달</strong>했습니다.
                    <br />
                    <span className="font-mono text-[11px]">이동 횟수: {policyResult.totalSteps}회 | 누적 보상: {policyResult.totalReward}점</span>
                  </>
                ) : (
                  <>
                    {policyResult.terminatedReason === 'loop' && '현재 배운 경로가 동일한 위치를 반복 순환하고 있습니다.'}
                    {policyResult.terminatedReason === 'obstacle' && '현재 배운 경로가 이동 중 장애물(X)에 충돌했습니다.'}
                    {policyResult.terminatedReason === 'maxSteps' && '최대 이동 횟수 내에 목표 지점까지 이어지는 경로를 찾지 못했습니다.'}
                    {policyResult.terminatedReason === 'invalidPolicy' && '아직 충분히 학습되지 않아 유효한 이동 경로를 결정하지 못했습니다.'}
                    <br />
                    <span className="font-mono text-[11px]">현재 이동 횟수: {policyResult.totalSteps}회 | 상태: 추가 학습 필요</span>
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Training Controls & Policy Path Button */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <span className="text-xs font-extrabold text-slate-900 block">로봇 학습 제어 패널</span>

          {/* Exploration Level Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-800 block">탐험 비율 (Exploration ε) 설정:</span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'low', label: '낮음 (10%)' },
                { key: 'medium', label: '보통 (30%)' },
                { key: 'high', label: '높음 (60%)' },
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => setExplorationLevel(item.key as any)}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all min-h-[44px] cursor-pointer ${
                    explorationLevel === item.key
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-slate-800 block">학습 수행 실행:</span>
            <div className="grid grid-cols-3 gap-2">
              <PrimaryButton size="sm" onClick={() => handleTrainEpisodes(1)} icon={<Play size={14} />}>
                1회 학습
              </PrimaryButton>
              <PrimaryButton size="sm" onClick={() => handleTrainEpisodes(10)} icon={<Play size={14} />}>
                10회 학습
              </PrimaryButton>
              <PrimaryButton size="sm" onClick={() => handleTrainEpisodes(100)} icon={<Play size={14} />}>
                100회 학습
              </PrimaryButton>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <SecondaryButton size="sm" onClick={handleReset} icon={<RotateCcw size={16} />}>
              처음부터 (초기화)
            </SecondaryButton>
            <SecondaryButton
              size="sm"
              onClick={() => setShowPathOnMap(!showPathOnMap)}
              icon={<Compass size={16} />}
            >
              {showPathOnMap ? '현재 배운 경로 숨기기' : '현재 배운 경로 지도에 보기'}
            </SecondaryButton>
          </div>

          {/* Last Batch Training Stats (Distinct from Policy Path Result) */}
          {lastBatchResult && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span>학습 수행 완료: 누적 {agent.episodesTrained}회 에피소드</span>
                <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-mono font-bold">
                  Q-Table 갱신 완료
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                에피소드 시뮬레이션을 완료하고 보상 경험을 Q-Table에 기록했습니다. 지도에서 [현재 배운 경로 보기]를 통해 목표 도달 여부를 평가하세요.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* RL Key Concept Summary */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <span className="text-xs font-extrabold text-slate-900 block">
          강화학습 3대 구성 요소 요약
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-extrabold text-blue-900 block text-sm">상태 (State)</span>
            <p className="text-slate-600">로봇이 위치해 있는 현재 온실 격자 칸 위치 (행, 열)</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-extrabold text-amber-900 block text-sm">행동 (Action)</span>
            <p className="text-slate-600">로봇이 선택할 수 있는 4가지 방향 (위/아래/왼쪽/오른쪽)</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-extrabold text-emerald-900 block text-sm">보상 (Reward)</span>
            <p className="text-slate-600">목표 도착(+10점), 장애물 충돌(-5점), 일반 이동 손실(-1점: 불필요한 이동을 줄이고 효율적 경로를 찾도록 부여)</p>
          </div>
        </div>
      </div>

      {/* Observation Reflection Question Card */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs space-y-2 shadow-xs">
        <span className="font-extrabold text-amber-300 block text-sm flex items-center gap-1.5">
          🧐 생각하기 (관찰 질문)
        </span>
        <p className="font-bold text-slate-100">
          "학습 횟수(1회, 10회, 100회)를 반복하면서 로봇의 행동 패턴과 목표 도달 성공 여부는 어떻게 달라졌나요?"
        </p>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          💡 처음에는 여러 방향을 자유롭게 시도해보고(탐험), 경험이 쌓이면 더 높은 보상을 받은 행동을 점차 자주 선택하면서 경로 정책을 스스로 다듬어갑니다.
        </p>
      </div>
    </div>
  );
};
