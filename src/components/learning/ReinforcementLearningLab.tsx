import React, { useState, useEffect, useRef } from 'react';
import {
  QLearningAgent,
  DEFAULT_GRID_CONFIG,
  type RLEpisodeResult,
  type PolicyPathResult,
  type GridPosition,
} from '../../algorithms/reinforcementLearning';
import { SecondaryButton } from '../common/SecondaryButton';
import {
  Bot,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Eye,
  Sliders,
  Compass,
} from 'lucide-react';

const TOTAL_EPISODES = 100;

export const ReinforcementLearningLab: React.FC = () => {
  const [agent] = useState(() => new QLearningAgent(DEFAULT_GRID_CONFIG, 42));
  const [traces, setTraces] = useState<RLEpisodeResult[]>([]);

  // Playback states
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentEpIdx, setCurrentEpIdx] = useState<number>(0);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0); // 1.0 = 1x (30~50s total)
  const [isLearningCompleted, setIsLearningCompleted] = useState<boolean>(false);

  // Post-learning inspection states
  const [showLearnedPath, setShowLearnedPath] = useState<boolean>(false);
  const [userObservationChoice, setUserObservationChoice] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  // Initialize traces on load or reset
  const generateTraces = () => {
    agent.initQTable();
    const generated = agent.trainBatchWithTrace(TOTAL_EPISODES, 0.6, 0.05);
    setTraces(generated);
    setCurrentEpIdx(0);
    setCurrentStepIdx(0);
    setIsPlaying(false);
    setIsPaused(false);
    setIsLearningCompleted(false);
    setShowLearnedPath(false);
  };

  useEffect(() => {
    generateTraces();
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Dynamic step delay calculation:
  // Early episodes (exploring): ~34ms, Mid: ~26ms, Late (learned): ~18ms at 1.0x
  // Ensures all 100 episodes with ~1200 total steps play continuously in ~35-40 seconds
  const getStepDelay = (epIdx: number, mult: number) => {
    let base = 26;
    if (epIdx < 30) base = 34;
    else if (epIdx > 70) base = 18;
    return Math.max(4, Math.round(base / mult));
  };

  const getTransitionDelay = (mult: number) => {
    return Math.max(8, Math.round(32 / mult));
  };

  // Main animation timer loop
  useEffect(() => {
    if (!isPlaying || isPaused || traces.length === 0) {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      return;
    }

    const currentEp = traces[currentEpIdx];
    if (!currentEp) return;

    const isLastStepInEpisode = currentStepIdx >= currentEp.steps.length - 1;
    const currentDelay = isLastStepInEpisode
      ? getTransitionDelay(speedMultiplier)
      : getStepDelay(currentEpIdx, speedMultiplier);

    timerRef.current = window.setTimeout(() => {
      if (!isLastStepInEpisode) {
        // Next step in current episode
        setCurrentStepIdx(prev => prev + 1);
      } else {
        // Episode finished
        if (currentEpIdx < traces.length - 1) {
          // Advance to next episode
          setCurrentEpIdx(prev => prev + 1);
          setCurrentStepIdx(0);
        } else {
          // All 100 episodes completed!
          setIsPlaying(false);
          setIsPaused(false);
          setIsLearningCompleted(true);
          setShowLearnedPath(true);
        }
      }
    }, currentDelay);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [isPlaying, isPaused, currentEpIdx, currentStepIdx, speedMultiplier, traces]);

  const handleStartLearning = () => {
    if (isLearningCompleted) {
      generateTraces();
    }
    setIsPlaying(true);
    setIsPaused(false);
    setShowLearnedPath(false);
  };

  const handlePauseResume = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      setIsPaused(false);
    } else {
      setIsPaused(!isPaused);
    }
  };

  const handleFastForwardAll = () => {
    if (traces.length > 0) {
      setCurrentEpIdx(traces.length - 1);
      const lastEp = traces[traces.length - 1];
      setCurrentStepIdx(lastEp.steps.length - 1);
      setIsPlaying(false);
      setIsPaused(false);
      setIsLearningCompleted(true);
      setShowLearnedPath(true);
    }
  };

  const handleReset = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    generateTraces();
  };

  const handleSelectSpecificEpisode = (epNum: number) => {
    const idx = Math.min(traces.length - 1, Math.max(0, epNum - 1));
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentEpIdx(idx);
    setCurrentStepIdx(0);
    setShowLearnedPath(false);
  };

  // Active episode information
  const activeEp = traces[currentEpIdx];
  const activeStep = activeEp && activeEp.steps ? activeEp.steps[currentStepIdx] : null;
  const currentPos: GridPosition = activeStep
    ? activeStep.nextState
    : DEFAULT_GRID_CONFIG.start;

  // Trail of steps taken in the current active episode
  const stepsSoFar = activeEp && activeEp.steps ? activeEp.steps.slice(0, currentStepIdx + 1) : [];
  const cumulativeReward = stepsSoFar.reduce((sum, s) => sum + s.reward, 0);

  // Pure greedy policy path evaluation (Learned path)
  const policyResult: PolicyPathResult = agent.getBestPolicyPath();
  const learnedPathSet = new Set(policyResult.path.map(p => `${p.r},${p.c}`));

  // Progress percentage
  const progressPercent = traces.length > 0 ? Math.round(((currentEpIdx + 1) / traces.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 space-y-1 shadow-xs">
        <span className="font-extrabold text-sm text-amber-900 block flex items-center gap-1.5">
          <Bot size={18} className="text-amber-600" />
          <span>온실 탐사 로봇 강화학습 (Q-Learning) 전체 과정 자동 타임랩스</span>
        </span>
        <p className="leading-relaxed text-amber-900">
          로봇이 100회의 에피소드 동안 직접 부딪히고 길을 헤매며 시행착오를 겪다가, 스스로 장애물을 피해 목적지까지 도달하는 과정을 <strong>영상 배속처럼 연속으로 관찰</strong>할 수 있습니다.
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
            <strong>재생 속도 (0.5×, 1×, 2×, 4×)</strong>를 조절하고, 일시정지/계속 또는 학습 완료 후 특정 에피소드(1회, 25회, 50회, 100회)를 다시 돌려볼 수 있습니다.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="font-extrabold text-slate-900 block flex items-center gap-1.5">
            <Eye size={16} className="text-blue-600" />
            <span>[무엇을 관찰하면 되나요?]</span>
          </span>
          <p className="text-slate-600 leading-relaxed font-medium">
            초반(1회)에는 무작위 탐험으로 빙빙 돌며 헤매던 로봇이, 경험이 쌓일수록 <strong>불필요한 이동을 줄이고 직진하여 성공하는 변화</strong>를 관찰하세요.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-5">
        {/* Header & Speed Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Compass size={20} className="text-amber-600" />
              <span>AI 탐색 타임랩스 플레이어 (총 {TOTAL_EPISODES}회 연속 학습)</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              💡 [학습 시작]을 누르면 1회부터 100회까지의 이동 과정을 자동으로 연속 재생합니다.
            </span>
          </div>

          {/* Speed Selection */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { label: '0.5× 천천히', mult: 0.5 },
              { label: '1× 보통 (추천)', mult: 1.0 },
              { label: '2× 빠르게', mult: 2.0 },
              { label: '4× 초고속', mult: 4.0 },
            ].map(sp => (
              <button
                key={sp.mult}
                onClick={() => setSpeedMultiplier(sp.mult)}
                className={`px-2.5 py-1.5 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                  speedMultiplier === sp.mult ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Playback Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            {!isPlaying ? (
              <button
                onClick={handleStartLearning}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer min-h-[44px]"
              >
                <Play size={16} />
                <span>{isLearningCompleted ? '처음부터 다시 학습 재생' : '학습 시작 (자동 재생)'}</span>
              </button>
            ) : (
              <button
                onClick={handlePauseResume}
                className={`px-4 py-2.5 font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer min-h-[44px] ${
                  isPaused ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-700 hover:bg-slate-800 text-white'
                }`}
              >
                {isPaused ? <Play size={16} /> : <Pause size={16} />}
                <span>{isPaused ? '계속 재생' : '일시정지'}</span>
              </button>
            )}

            <button
              onClick={handleFastForwardAll}
              disabled={isLearningCompleted}
              className="px-3 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl flex items-center gap-1 cursor-pointer disabled:opacity-50 min-h-[44px]"
            >
              <FastForward size={14} />
              <span>즉시 완료 결과 보기</span>
            </button>
          </div>

          <SecondaryButton size="sm" onClick={handleReset} icon={<RotateCcw size={14} />}>
            전체 초기화
          </SecondaryButton>
        </div>

        {/* Progress Bar & Real-time Info Banner */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl text-xs space-y-3 shadow-xs font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-extrabold text-sm">
                {isPlaying ? '⚡ 실시간 학습 진행 중...' : isLearningCompleted ? '🎉 100회 학습 완료!' : '대기 중'}
              </span>
              <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[11px] font-bold">
                Episode {currentEpIdx + 1} / {TOTAL_EPISODES} ({progressPercent}%)
              </span>
            </div>

            {activeStep && (
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  activeStep.mode === 'explore'
                    ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                    : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                }`}>
                  {activeStep.mode === 'explore' ? '🎲 무작위 탐험(Explore)' : '⚡ Q값 활용(Exploit)'}
                </span>

                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  activeStep.isGoal
                    ? 'bg-emerald-500 text-slate-950'
                    : activeStep.isObstacle
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {activeStep.isGoal ? '🏆 목표 도착 (+10점)' : activeStep.isObstacle ? '🚫 장애물 (-5점)' : '이동 (-1점)'}
                </span>
              </div>
            )}
          </div>

          {/* Progress bar visual */}
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
            <div>
              <span>현재 에피소드 이동: </span>
              <strong className="text-white">{currentStepIdx + 1}번째 이동</strong>
              <span className="opacity-75"> (총 {activeEp ? activeEp.steps.length : 0}보)</span>
            </div>

            <div>
              <span>누적 보상: </span>
              <strong className={cumulativeReward >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {cumulativeReward}점
              </strong>
            </div>

            <div>
              <span>에피소드 결과: </span>
              <strong className={activeEp?.reachedGoal ? 'text-emerald-400' : 'text-amber-400'}>
                {activeEp?.reachedGoal ? '✓ 목표 도달 성공' : '충돌 또는 최대 이동 초과'}
              </strong>
            </div>
          </div>
        </div>

        {/* 5x5 Grid Map Visual */}
        <div className="space-y-2 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="font-bold text-slate-800 block">
              5 × 5 온실 격자 지도 (실시간 이동 궤적 및 로봇 위치)
            </span>
            {showLearnedPath && (
              <span className="text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ✓ 초록색 테두리: 현재 배운 경로
              </span>
            )}
          </div>

          <div className="grid grid-cols-5 gap-1.5 sm:gap-2 bg-slate-100 p-3 sm:p-4 rounded-2xl border border-slate-300 max-w-md mx-auto select-none">
            {Array.from({ length: 5 }, (_, r) =>
              Array.from({ length: 5 }, (_, c) => {
                const isStart = r === DEFAULT_GRID_CONFIG.start.r && c === DEFAULT_GRID_CONFIG.start.c;
                const isGoal = r === DEFAULT_GRID_CONFIG.goal.r && c === DEFAULT_GRID_CONFIG.goal.c;
                const isObstacle = DEFAULT_GRID_CONFIG.obstacles.some(o => o.r === r && o.c === c);

                // Is current robot location
                const isRobotHere = currentPos.r === r && currentPos.c === c;

                // Visit count or steps in this active episode
                const visitIndices = stepsSoFar
                  .map((s, idx) => (s.nextState.r === r && s.nextState.c === c ? idx + 1 : null))
                  .filter(Boolean);

                const isVisitedInThisEp = visitIndices.length > 0 || (isStart && currentStepIdx === 0);
                const isLearnedPathTile = showLearnedPath && learnedPathSet.has(`${r},${c}`);

                return (
                  <div
                    key={`${r}-${c}`}
                    className={`aspect-square rounded-xl p-1 flex flex-col items-center justify-center text-center font-bold text-[10px] transition-all relative ${
                      isGoal
                        ? 'bg-emerald-500 text-white border-2 border-emerald-600 shadow-xs'
                        : isObstacle
                        ? 'bg-slate-700 text-slate-300 border border-slate-800'
                        : isLearnedPathTile
                        ? 'bg-emerald-100 text-emerald-950 border-2 border-emerald-500 shadow-2xs font-black'
                        : isVisitedInThisEp
                        ? 'bg-amber-200 text-amber-950 border border-amber-400 font-black'
                        : 'bg-white border border-slate-200 text-slate-500'
                    }`}
                  >
                    {isStart && <span className="text-[9px] text-emerald-800 block font-mono">출발 (S)</span>}
                    {isGoal && <span className="text-xs">🏆 목표</span>}
                    {isObstacle && <span className="text-[10px]">🚫 장애물</span>}
                    {!isGoal && !isObstacle && !isRobotHere && (
                      <span className="font-mono text-[9px] opacity-60">
                        ({r},{c})
                      </span>
                    )}

                    {/* Step order badge or repeat count if visited */}
                    {isVisitedInThisEp && !isGoal && !isObstacle && !isRobotHere && (
                      visitIndices.length > 1 ? (
                        <span className="text-[8px] font-mono bg-amber-300 text-amber-950 px-1 py-0.2 rounded font-black mt-0.5 shadow-2xs">
                          ×{visitIndices.length}회 방문
                        </span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1" />
                      )
                    )}

                    {/* Active Robot position indicator */}
                    {isRobotHere && (
                      <div className="absolute inset-0 bg-rose-500 text-white rounded-xl flex flex-col items-center justify-center text-[10px] font-black shadow-md animate-pulse">
                        <span>🤖</span>
                        <span className="text-[8px] font-mono">로봇</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Student Guidance Notes on Exploration and Revisiting */}
          <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-extrabold text-amber-900">
              <Sparkles size={14} className="text-amber-600" />
              <span>[AI 탐험과 반복 방문 안내]</span>
            </div>
            <p className="text-amber-950 font-medium leading-relaxed">
              • AI는 아직 어떤 행동이 좋은지 확실히 모르기 때문에 이미 지나간 곳을 다시 방문할 수도 있습니다.
            </p>
            <p className="text-amber-950 font-medium leading-relaxed">
              • 여러 번의 경험(시행착오)을 통해 보상이 높은 행동을 점차 더 자주 선택하게 됩니다.
            </p>
          </div>
        </div>

        {/* Post-Learning Inspection & Comparison Section */}
        {isLearningCompleted && traces.length > 0 && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 pb-2">
              <div>
                <span className="font-extrabold text-emerald-950 text-sm flex items-center gap-1.5">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span>[학습 전후 비교 분석] AI의 탐색 경로가 어떻게 진화했나요?</span>
                </span>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  학습이 끝난 현재 상태에서 AI가 배운 값을 따라 이동한 경로를 확인해봅시다.
                </p>
              </div>

              <button
                onClick={() => setShowLearnedPath(!showLearnedPath)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-2xs shrink-0"
              >
                {showLearnedPath ? '학습 경로 숨기기' : '현재 배운 경로 보기'}
              </button>
            </div>

            {/* Comparison Cards (Episode 1 vs Episode 100) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-700 block text-xs">초반 (Episode 1): 무작위 탐험</span>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">이동 횟수:</span>
                    <strong>{traces[0].stepsCount}보</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">총 보상:</span>
                    <strong className={traces[0].totalReward >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                      {traces[0].totalReward}점
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">목표 도달:</span>
                    <strong>{traces[0].reachedGoal ? '성공' : '실패'}</strong>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-emerald-900 block text-xs">후반 (Episode 100): 학습이 진행된 경로</span>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">이동 횟수:</span>
                    <strong className="text-emerald-700">{traces[traces.length - 1].stepsCount}보</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">총 보상:</span>
                    <strong className="text-emerald-700">
                      {traces[traces.length - 1].totalReward}점
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">목표 도달:</span>
                    <strong className="text-emerald-700">✓ 성공</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Specific Episode Replay Selector */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 block text-xs">
                🎞️ 특정 에피소드 다시 보기 (클릭하면 해당 회차의 탐색 과정을 다시 재생합니다):
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[1, 25, 50, 75, 100].map(epNum => (
                  <button
                    key={epNum}
                    onClick={() => handleSelectSpecificEpisode(epNum)}
                    className={`px-3 py-1.5 rounded-xl border font-bold text-xs cursor-pointer transition-all ${
                      currentEpIdx === epNum - 1
                        ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Episode {epNum}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Observation Question Card (Section 5) */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
          <span className="font-extrabold text-slate-900 block text-sm flex items-center gap-1.5">
            <HelpCircle size={16} className="text-amber-600" />
            <span>[핵심 관찰 질문] 강화학습 경험 누적과 경로 학습</span>
          </span>

          <p className="text-slate-700 font-medium leading-relaxed">
            질문: <strong>에이전트(로봇)가 100회의 시행착오 경험을 누적할수록 불필요한 이동 횟수와 행동 선택은 어떻게 변화하나요?</strong>
          </p>

          <div className="space-y-2">
            {[
              {
                key: 'ans1',
                label: '경험이 늘어날수록 장애물을 피하고 보상이 높은 경로 행동(Q값)을 찾아 불필요한 이동이 급격히 줄어듭니다.',
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
                  ✓ <strong>정답입니다!</strong> Q-Learning은 보상이 높았던 행동의 Q-Table 가치를 강화하므로, 충분히 경험하면 스스로 목적지까지 가는 효율적인 이동 경로를 선택하게 됩니다.
                </span>
              ) : (
                <span>
                  X 다시 확인해보세요. 학습 에피소드가 100회로 누적되면 로봇이 보상을 보장하는 경로 행동에 집중하므로 안전하게 목표점에 도달합니다.
                </span>
              )}
            </div>
          )}
        </div>

        {/* Deep Thinking Prompts */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
          <span className="font-extrabold text-slate-900 block text-xs flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" />
            <span>💡 [함께 생각해보기]</span>
          </span>
          <ul className="space-y-1 text-slate-700 list-disc list-inside leading-relaxed">
            <li>처음(1회)과 마지막(100회) Episode의 이동 경로는 어떻게 달라졌나요?</li>
            <li>학습이 진행될수록 불필요한 방황이나 벽 충돌은 얼마나 줄어들었나요?</li>
            <li>목표에 단 한 번 우연히 도달했다고 해서 바로 학습을 끝내지 않고 여러 번 반복하는 이유는 무엇일까요?</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
