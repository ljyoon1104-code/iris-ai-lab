import React, { useState } from 'react';
import {
  QLearningAgent,
  DEFAULT_GRID_CONFIG,
  type PolicyPathResult,
} from '../../algorithms/reinforcementLearning';
import { SecondaryButton } from '../common/SecondaryButton';
import { Bot, Play, RotateCcw, Compass, Sliders, Eye, HelpCircle } from 'lucide-react';

export const ReinforcementLearningLab: React.FC = () => {
  const [agent] = useState(() => new QLearningAgent(DEFAULT_GRID_CONFIG, 42));
  const [explorationLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [showPathOnMap, setShowPathOnMap] = useState<boolean>(false);
  const [userObservationChoice, setUserObservationChoice] = useState<string | null>(null);

  const handleTrainEpisodes = (numEpisodes: number) => {
    // Set epsilon according to exploration level
    agent.epsilon = explorationLevel === 'low' ? 0.1 : explorationLevel === 'medium' ? 0.3 : 0.6;
    agent.trainBatch(numEpisodes);
    // Show path evaluation automatically after training
    setShowPathOnMap(true);
  };

  const handleReset = () => {
    agent.initQTable();
    setShowPathOnMap(false);
  };

  // Evaluate pure greedy policy path
  const policyResult: PolicyPathResult = agent.getBestPolicyPath();
  const visiblePath = showPathOnMap ? policyResult.path : [];
  const visiblePathSet = new Set(visiblePath.map(p => `${p.r},${p.c}`));
  const lastPathPos = visiblePath.length > 0 ? visiblePath[visiblePath.length - 1] : null;

  return (
    <div className="space-y-6 animate-fadeIn">
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

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="font-extrabold text-slate-900 block flex items-center gap-1.5">
            <Sliders size={16} className="text-amber-600" />
            <span>[무엇을 바꿀 수 있나요?]</span>
          </span>
          <p className="text-slate-600 leading-relaxed font-medium">
            시뮬레이션 반복 횟수(10회, 50회, 100회)와 탐험율(Exploration)을 조절할 수 있습니다.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="font-extrabold text-slate-900 block flex items-center gap-1.5">
            <Eye size={16} className="text-blue-600" />
            <span>[무엇을 관찰하면 되나요?]</span>
          </span>
          <p className="text-slate-600 leading-relaxed font-medium">
            경험 횟수가 누적될수록 장애물을 피하고 목표 도착 지점까지의 최적 이동 경로가 완성되는지 관찰하세요.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Compass size={20} className="text-amber-600" />
            <span>Q-Learning 학습 실행 조종간</span>
          </h3>

          <SecondaryButton size="sm" onClick={handleReset} icon={<RotateCcw size={14} />}>
            Q-Table 학습 초기화
          </SecondaryButton>
        </div>

        {/* Action Controls */}
        <div className="space-y-3 text-xs">
          <span className="font-bold text-slate-700 block">학습 에피소드 반복 횟수 선택 실행:</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => handleTrainEpisodes(10)}
              className="p-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-xs cursor-pointer min-h-[44px] flex items-center justify-center gap-2"
            >
              <Play size={16} /> 10회 에피소드 학습
            </button>
            <button
              onClick={() => handleTrainEpisodes(50)}
              className="p-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all shadow-xs cursor-pointer min-h-[44px] flex items-center justify-center gap-2"
            >
              <Play size={16} /> 50회 에피소드 누적 학습
            </button>
            <button
              onClick={() => handleTrainEpisodes(100)}
              className="p-3 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl transition-all shadow-xs cursor-pointer min-h-[44px] flex items-center justify-center gap-2"
            >
              <Play size={16} /> 100회 에피소드 집중 학습
            </button>
          </div>
        </div>

        {/* Status metric banner */}
        <div className="p-4 bg-slate-900 text-white rounded-xl text-xs space-y-2 font-mono">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <span className="text-amber-400 font-bold">누적 에피소드: {agent.episodesTrained}회</span>
            <span>최종 평가: {policyResult.reachedGoal ? '✓ 목표 도착 성공' : 'X 실패/미완료'}</span>
          </div>

          <div className="flex justify-between text-[11px] text-slate-300">
            <span>도착 사유: {policyResult.terminatedReason}</span>
            <span>이동 경로 길이: {visiblePath.length} steps</span>
          </div>
        </div>

        {/* 5x5 Grid Map Visual */}
        <div className="space-y-2 text-xs">
          <span className="font-bold text-slate-800 block">5 × 5 온실 격자 지도 (실시간 최적 정책 경로)</span>

          <div className="grid grid-cols-5 gap-1.5 bg-slate-100 p-3 rounded-2xl border border-slate-300 max-w-sm mx-auto">
            {Array.from({ length: 5 }, (_, r) =>
              Array.from({ length: 5 }, (_, c) => {
                const isStart = r === DEFAULT_GRID_CONFIG.start.r && c === DEFAULT_GRID_CONFIG.start.c;
                const isGoal = r === DEFAULT_GRID_CONFIG.goal.r && c === DEFAULT_GRID_CONFIG.goal.c;
                const isObstacle = DEFAULT_GRID_CONFIG.obstacles.some(o => o.r === r && o.c === c);
                const isPath = visiblePathSet.has(`${r},${c}`);
                const isEndPos = lastPathPos && lastPathPos.r === r && lastPathPos.c === c;

                return (
                  <div
                    key={`${r}-${c}`}
                    className={`aspect-square rounded-xl p-1 flex flex-col items-center justify-center text-center font-bold text-[10px] transition-all relative ${
                      isGoal
                        ? 'bg-emerald-500 text-white border-2 border-emerald-600 shadow-xs'
                        : isObstacle
                        ? 'bg-slate-700 text-slate-300 border border-slate-800'
                        : isPath
                        ? 'bg-amber-300 text-amber-950 border-2 border-amber-500 font-black'
                        : 'bg-white border border-slate-200 text-slate-600'
                    }`}
                  >
                    {isStart && <span className="text-[9px] text-emerald-800 block font-mono">출발</span>}
                    {isGoal && <span className="text-xs">🏆 목표</span>}
                    {isObstacle && <span className="text-[10px]">🚫 장애물</span>}
                    {!isGoal && !isObstacle && (
                      <span className="font-mono text-[9px] opacity-75">
                        ({r},{c})
                      </span>
                    )}

                    {isEndPos && (
                      <div className="absolute inset-0 bg-rose-500/80 rounded-xl flex items-center justify-center text-white text-[10px] font-extrabold animate-pulse">
                        🤖 로봇
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Observation Question Card (Section 5) */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
        <span className="font-extrabold text-slate-900 block text-sm flex items-center gap-1.5">
          <HelpCircle size={16} className="text-amber-600" />
          <span>[핵심 관찰 질문] 강화학습 경험 누적과 행동 선택</span>
        </span>

        <p className="text-slate-700 font-medium leading-relaxed">
          질문: <strong>에이전트(로봇)가 여러 번 시행착오 경험을 누적할수록 어떤 행동을 선택하는 경향이 생기나요?</strong>
        </p>

        <div className="space-y-2">
          {[
            {
              key: 'ans1',
              label: '경험이 늘어날수록 장애물을 피하고 보상이 가장 높은 최적의 경로 행동(Q값 선택)을 찾아 집중하게 됩니다.',
            },
            {
              key: 'ans2',
              label: '경험이 늘어날수록 로봇이 보상을 무시하고 임의로 방황하며 실패율이 더 높아집니다.',
            },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => setUserObservationChoice(opt.key)}
              className={`w-full text-left p-3 rounded-xl border font-bold transition-all min-h-[44px] cursor-pointer ${
                userObservationChoice === opt.key
                  ? opt.key === 'ans1'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {userObservationChoice && (
          <div
            className={`p-3 rounded-lg text-xs leading-relaxed animate-fadeIn ${
              userObservationChoice === 'ans1'
                ? 'bg-amber-50 text-amber-950 border border-amber-200'
                : 'bg-rose-50 text-rose-950 border border-rose-200'
            }`}
          >
            {userObservationChoice === 'ans1' ? (
              <span>
                ✓ <strong>정답입니다!</strong> Q-Learning은 보상이 높았던 행동의 Q-Table 가치를 강화하므로, 충분히 경험하면 스스로 최적의 최단 목적지 이동 경로를 선택하게 됩니다.
              </span>
            ) : (
              <span>
                X 다시 확인해보세요. 학습 에피소드가 100회로 누적되면 로봇이 보상을 보장하는 경로 행동에 집중하므로 안전하게 목표점에 도달합니다.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
