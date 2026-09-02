import React, { useState, useEffect, useRef } from 'react';
import {
  QLearningAgent,
  DEFAULT_GRID_CONFIG,
  type RLEpisodeResult,
  type PolicyPathResult,
  type GridPosition,
  type ActionType,
} from '../../algorithms/reinforcementLearning';
import { SecondaryButton } from '../common/SecondaryButton';
import {
  Bot,
  Play,
  Pause,
  Square,
  RotateCcw,
  FastForward,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Eye,
  Sliders,
  Compass,
  Layers,
  Info,
} from 'lucide-react';

export type RLLearningStatus = 'idle' | 'playing' | 'paused' | 'stopped' | 'completed';

export const EPISODE_OPTIONS: number[] = [10, 50, 100, 500, 1000];

export interface ReinforcementLearningLabProps {
  onInteract?: () => void;
}

export const ReinforcementLearningLab: React.FC<ReinforcementLearningLabProps> = ({ onInteract }) => {
  const [selectedEpisodes, setSelectedEpisodes] = useState<number>(100);
  const [agent] = useState(() => new QLearningAgent(DEFAULT_GRID_CONFIG, 42));
  const [traces, setTraces] = useState<RLEpisodeResult[]>([]);
  const [qSnapshots, setQSnapshots] = useState<Record<string, Record<ActionType, number>>[]>([]);

  // Playback & Status states
  const [learningStatus, setLearningStatus] = useState<RLLearningStatus>('idle');
  const [currentEpIdx, setCurrentEpIdx] = useState<number>(0);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0); // 0.5x, 1x, 2x, 4x

  // Post-learning inspection states
  const [showLearnedPath, setShowLearnedPath] = useState<boolean>(false);
  const [userObservationChoice, setUserObservationChoice] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  // Initialize traces & Q-table snapshots on load or episode count change
  const generateTraces = (numEpisodes: number) => {
    agent.initQTable();
    const { traces: generatedTraces, qSnapshots: snapshots } =
      agent.trainBatchWithTraceAndSnapshots(numEpisodes, 0.6, 0.05);
    setTraces(generatedTraces);
    setQSnapshots(snapshots);
    setCurrentEpIdx(0);
    setCurrentStepIdx(0);
    setLearningStatus('idle');
    setShowLearnedPath(false);
  };

  useEffect(() => {
    generateTraces(selectedEpisodes);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Episode options handler (only enabled in 'idle' state)
  const handleSelectEpisodes = (count: number) => {
    if (learningStatus !== 'idle') return;
    setSelectedEpisodes(count);
    generateTraces(count);
  };

  // Adaptive delay by episode total and speed multiplier
  const getStepDelay = (totalEps: number, epIdx: number, mult: number) => {
    let base = 26;
    if (totalEps === 10) {
      base = 65; // ~6.5s total
    } else if (totalEps === 50) {
      base = 35; // ~17.5s total
    } else if (totalEps === 100) {
      base = epIdx < 30 ? 32 : epIdx > 70 ? 18 : 25; // ~30-35s total
    } else if (totalEps === 500) {
      base = epIdx < 100 ? 12 : epIdx > 350 ? 5 : 8; // ~40-50s total
    } else if (totalEps === 1000) {
      base = epIdx < 200 ? 8 : epIdx > 700 ? 3 : 5; // ~45-60s total
    }
    return Math.max(2, Math.round(base / mult));
  };

  const getTransitionDelay = (totalEps: number, mult: number) => {
    let base = 30;
    if (totalEps === 10) base = 80;
    else if (totalEps === 50) base = 40;
    else if (totalEps === 100) base = 25;
    else if (totalEps === 500) base = 6;
    else if (totalEps === 1000) base = 4;
    return Math.max(2, Math.round(base / mult));
  };

  // Main animation timer loop
  useEffect(() => {
    if (learningStatus !== 'playing' || traces.length === 0) {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      return;
    }

    const currentEp = traces[currentEpIdx];
    if (!currentEp) return;

    const isLastStepInEpisode = currentStepIdx >= currentEp.steps.length - 1;
    const currentDelay = isLastStepInEpisode
      ? getTransitionDelay(selectedEpisodes, speedMultiplier)
      : getStepDelay(selectedEpisodes, currentEpIdx, speedMultiplier);

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
          // All selected episodes completed!
          setLearningStatus('completed');
          setShowLearnedPath(true);
        }
      }
    }, currentDelay);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [learningStatus, currentEpIdx, currentStepIdx, speedMultiplier, traces, selectedEpisodes]);

  // Play / Start handler
  const handleStartLearning = () => {
    if (learningStatus === 'completed' || learningStatus === 'stopped') {
      generateTraces(selectedEpisodes);
    }
    setLearningStatus('playing');
    setShowLearnedPath(false);
    onInteract?.();
  };

  // Pause / Resume handler
  const handlePauseResume = () => {
    if (learningStatus === 'playing') {
      setLearningStatus('paused');
    } else if (learningStatus === 'paused') {
      setLearningStatus('playing');
    }
  };

  // Stop Learning handler (commits learning up to current episode/step)
  const handleStopLearning = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setLearningStatus('stopped');
    setShowLearnedPath(false);
  };

  // Fast forward to completed
  const handleFastForwardAll = () => {
    if (traces.length > 0) {
      setCurrentEpIdx(traces.length - 1);
      const lastEp = traces[traces.length - 1];
      setCurrentStepIdx(lastEp.steps.length - 1);
      setLearningStatus('completed');
      setShowLearnedPath(true);
      onInteract?.();
    }
  };

  // Full reset handler
  const handleReset = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    generateTraces(selectedEpisodes);
  };

  // Maximum episode number accessible for replay based on learning status
  const maxAccessibleEp =
    learningStatus === 'completed'
      ? selectedEpisodes
      : learningStatus === 'stopped' || learningStatus === 'paused' || learningStatus === 'playing'
      ? currentEpIdx + 1
      : 1;

  // Select a specific episode to inspect
  const handleSelectSpecificEpisode = (epNum: number) => {
    const targetIdx = Math.min(maxAccessibleEp - 1, Math.max(0, epNum - 1));
    if (learningStatus === 'playing') {
      setLearningStatus('paused');
    }
    setCurrentEpIdx(targetIdx);
    setCurrentStepIdx(0);
    setShowLearnedPath(false);
  };

  // Active episode & step info
  const activeEp = traces[currentEpIdx];
  const activeStep = activeEp && activeEp.steps ? activeEp.steps[currentStepIdx] : null;
  const currentPos: GridPosition = activeStep
    ? activeStep.nextState
    : DEFAULT_GRID_CONFIG.start;

  // Trail of steps in the active episode
  const stepsSoFar = activeEp && activeEp.steps ? activeEp.steps.slice(0, currentStepIdx + 1) : [];
  const cumulativeReward = stepsSoFar.reduce((sum, s) => sum + s.reward, 0);

  // Determine exact active Q-Table for policy path evaluation
  const activeQTable =
    learningStatus === 'completed' && qSnapshots.length >= selectedEpisodes
      ? qSnapshots[selectedEpisodes - 1]
      : agent.getQTableAtStep(traces, qSnapshots, currentEpIdx, currentStepIdx);

  // Pure greedy policy path evaluation using the active Q-Table snapshot
  const policyResult: PolicyPathResult = agent.getBestPolicyPath(25, activeQTable);
  const learnedPathSet = new Set(policyResult.path.map(p => `${p.r},${p.c}`));

  // Progress percentage (frozen at current episode when stopped)
  const progressPercent =
    selectedEpisodes > 0
      ? Math.min(100, Math.round(((currentEpIdx + (learningStatus === 'completed' ? 1 : 0)) / selectedEpisodes) * 100))
      : 0;

  // Whether the active step is the terminal/final step of the active episode
  const isCurrentEpTerminal = Boolean(
    activeEp &&
    activeEp.steps &&
    currentStepIdx >= activeEp.steps.length - 1
  );

  // Number of fully completed episodes
  const fullyCompletedEpisodesCount =
    learningStatus === 'completed'
      ? selectedEpisodes
      : isCurrentEpTerminal
      ? currentEpIdx + 1
      : currentEpIdx;

  // Key checkpoint episodes available for replay up to maxAccessibleEp
  const availableCheckpoints = [
    1,
    Math.max(1, Math.round(selectedEpisodes * 0.25)),
    Math.max(1, Math.round(selectedEpisodes * 0.5)),
    Math.max(1, Math.round(selectedEpisodes * 0.75)),
    selectedEpisodes,
  ].filter((v, idx, arr) => arr.indexOf(v) === idx && v <= maxAccessibleEp);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 space-y-1 shadow-xs">
        <span className="font-extrabold text-sm text-amber-900 block flex items-center gap-1.5">
          <Bot size={18} className="text-amber-600" />
          <span>온실 탐사 로봇 강화학습 (Q-Learning) 전체 과정 자동 타임랩스</span>
        </span>
        <p className="leading-relaxed text-amber-900">
          로봇이 선택한 에피소드 횟수 동안 직접 부딪히고 길을 헤매며 시행착오를 겪다가, 스스로 장애물을 피해 목적지까지 도달하는 과정을 <strong>영상 배속처럼 연속으로 관찰</strong>할 수 있습니다.
        </p>
      </div>

      {/* 1. Episode Count Selection Section */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
            <Layers size={16} className="text-amber-600" />
            <span>학습 횟수 선택 (에피소드 총 반복 수):</span>
          </span>
          <span className="text-[11px] font-bold text-slate-500">
            현재 선택: <strong className="text-amber-700 font-mono text-xs">{selectedEpisodes}회 학습</strong>
            {learningStatus !== 'idle' && (
              <span className="text-slate-400 font-normal ml-1.5">(학습 진행 중에는 변경 불가)</span>
            )}
          </span>
        </div>

        {/* Option Buttons: 10, 50, 100, 500, 1000 */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {EPISODE_OPTIONS.map(count => {
            const isSelected = selectedEpisodes === count;
            const isDisabled = learningStatus !== 'idle';
            return (
              <button
                key={count}
                onClick={() => handleSelectEpisodes(count)}
                disabled={isDisabled}
                className={`p-2.5 rounded-xl border-2 text-center transition-all cursor-pointer min-h-[44px] flex flex-col items-center justify-center ${
                  isSelected
                    ? 'border-amber-600 bg-amber-50 text-amber-950 font-black shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-amber-300 font-bold'
                } ${isDisabled && !isSelected ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <span className="text-xs font-mono">{count}회</span>
                <span className="text-[9px] font-normal text-slate-500">
                  {count === 10 ? '초단기 탐색' : count === 100 ? '기본 (추천)' : count === 1000 ? '정밀 수렴' : '학습 진행'}
                </span>
              </button>
            );
          })}
        </div>

        {/* 10 Episodes Educational Notice */}
        {selectedEpisodes === 10 && (
          <div className="p-3 bg-amber-50/90 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
            <span className="font-bold block flex items-center gap-1">
              <Info size={14} className="text-amber-600" />
              <span>[10회 학습 안내]</span>
            </span>
            <p className="leading-relaxed font-medium">
              10회는 학습 횟수가 적어 AI가 아직 온실 지도를 충분히 경험하지 못했을 수 있습니다. 학습 횟수가 적을 때와 많을 때 결과가 어떻게 달라지는지 비교해 보세요.
            </p>
          </div>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="font-extrabold text-slate-900 block flex items-center gap-1.5">
            <Sliders size={16} className="text-amber-600" />
            <span>[무엇을 바꿀 수 있나요?]</span>
          </span>
          <p className="text-slate-600 leading-relaxed font-medium">
            <strong>학습 횟수(10~1000회)</strong>와 <strong>재생 속도(0.5×~4×)</strong>를 조절하고, [일시정지], [학습 멈추기]로 원하는 시점에 학습 결과를 확정할 수 있습니다.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="font-extrabold text-slate-900 block flex items-center gap-1.5">
            <Eye size={16} className="text-blue-600" />
            <span>[무엇을 관찰하면 되나요?]</span>
          </span>
          <p className="text-slate-600 leading-relaxed font-medium">
            초반에는 무작위 탐험으로 빙빙 돌며 헤매던 로봇이, 경험이 쌓일수록 <strong>불필요한 이동을 줄이고 직진하여 성공하는 변화</strong>를 관찰하세요.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-5">
        {/* Header & Speed Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Compass size={20} className="text-amber-600" />
              <span>AI 탐색 타임랩스 플레이어 (총 {selectedEpisodes}회 연속 학습)</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              💡 [학습 시작]을 누르면 1회부터 {selectedEpisodes}회까지의 이동 과정을 자동으로 연속 재생합니다.
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
          <div className="flex items-center gap-2 flex-wrap">
            {learningStatus === 'idle' ? (
              <button
                onClick={handleStartLearning}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer min-h-[44px]"
              >
                <Play size={16} />
                <span>학습 시작 (자동 재생)</span>
              </button>
            ) : learningStatus === 'playing' ? (
              <>
                <button
                  onClick={handlePauseResume}
                  className="px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer min-h-[44px]"
                >
                  <Pause size={16} />
                  <span>일시정지</span>
                </button>

                {/* [학습 멈추기] Button */}
                <button
                  onClick={handleStopLearning}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer min-h-[44px]"
                >
                  <Square size={14} className="fill-white" />
                  <span>학습 멈추기</span>
                </button>
              </>
            ) : learningStatus === 'paused' ? (
              <>
                <button
                  onClick={handlePauseResume}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer min-h-[44px]"
                >
                  <Play size={16} />
                  <span>계속 재생</span>
                </button>

                {/* [학습 멈추기] Button */}
                <button
                  onClick={handleStopLearning}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer min-h-[44px]"
                >
                  <Square size={14} className="fill-white" />
                  <span>학습 멈추기</span>
                </button>
              </>
            ) : (
              // Stopped or Completed
              <button
                onClick={handleStartLearning}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer min-h-[44px]"
              >
                <Play size={16} />
                <span>처음부터 다시 학습 재생</span>
              </button>
            )}

            <button
              onClick={handleFastForwardAll}
              disabled={learningStatus === 'completed'}
              className="px-3 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl flex items-center gap-1 cursor-pointer disabled:opacity-50 min-h-[44px]"
            >
              <FastForward size={14} />
              <span>즉시 완료 결과 보기</span>
            </button>
          </div>

          <SecondaryButton size="sm" onClick={handleReset} icon={<RotateCcw size={14} />}>
            처음부터 초기화
          </SecondaryButton>
        </div>

        {/* Progress Bar & Real-time Info Banner */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl text-xs space-y-3 shadow-xs font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-extrabold text-sm ${
                learningStatus === 'playing'
                  ? 'text-amber-400 animate-pulse'
                  : learningStatus === 'stopped'
                  ? 'text-rose-400'
                  : learningStatus === 'completed'
                  ? 'text-emerald-400'
                  : learningStatus === 'paused'
                  ? 'text-yellow-300'
                  : 'text-slate-400'
              }`}>
                {learningStatus === 'playing'
                  ? '⚡ 실시간 학습 진행 중...'
                  : learningStatus === 'paused'
                  ? '⏸️ 일시정지 중'
                  : learningStatus === 'stopped'
                  ? '🛑 학습 중단됨'
                  : learningStatus === 'completed'
                  ? `🎉 ${selectedEpisodes}회 학습 완료!`
                  : '학습 대기 중'}
              </span>
              <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[11px] font-bold">
                Episode {currentEpIdx + 1} / {selectedEpisodes} ({progressPercent}%)
              </span>
            </div>

            {activeStep && (
              <div className="flex items-center gap-2 flex-wrap">
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
              className={`h-full transition-all duration-150 ${
                learningStatus === 'stopped'
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-r from-amber-500 to-emerald-500'
              }`}
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

        {/* 2. Stopped Learning Result Card */}
        {learningStatus === 'stopped' && (
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-3 text-xs text-amber-950 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-2">
              <span className="font-extrabold text-sm text-amber-950 flex items-center gap-1.5">
                <Square size={16} className="text-rose-600 fill-rose-600" />
                <span>
                  {isCurrentEpTerminal
                    ? `[학습을 멈췄습니다] Episode ${currentEpIdx + 1}까지 완료 후 학습을 확정하였습니다`
                    : `[학습을 멈췄습니다] Episode ${currentEpIdx + 1} 진행 중 학습을 확정하였습니다`}
                </span>
              </span>
              <span className="bg-amber-200 text-amber-900 font-bold px-2.5 py-0.5 rounded text-[11px] shrink-0">
                학습 중단 상태
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px] bg-white p-3 rounded-xl border border-amber-200">
              <div>
                <span className="text-slate-500 block">선택한 학습 횟수:</span>
                <strong className="text-slate-800 text-xs">{selectedEpisodes}회</strong>
              </div>
              <div>
                <span className="text-slate-500 block">완료된 Episode:</span>
                <strong className="text-emerald-700 text-xs">{fullyCompletedEpisodesCount}회</strong>
              </div>
              <div>
                <span className="text-slate-500 block">중단 위치:</span>
                <strong className="text-rose-700 text-xs">
                  {isCurrentEpTerminal
                    ? `Episode ${currentEpIdx + 1} 완료 (Step ${currentStepIdx + 1})`
                    : `Episode ${currentEpIdx + 1} 진행 중 (Step ${currentStepIdx + 1})`}
                </strong>
              </div>
            </div>

            <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
              💡 현재까지({currentEpIdx + 1}회차 시점) 학습된 Q-Table을 기준으로 로봇이 배운 경로를 확인해 볼 수 있습니다.
            </p>

            <div className="flex items-center gap-2 flex-wrap pt-1">
              <button
                onClick={() => setShowLearnedPath(!showLearnedPath)}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
              >
                {showLearnedPath ? '학습 경로 숨기기' : '현재 배운 경로 보기'}
              </button>
              <button
                onClick={handleReset}
                className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1"
              >
                <RotateCcw size={14} />
                <span>처음부터 다시 시작</span>
              </button>
            </div>
          </div>
        )}

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

        {/* 3. Post-Learning Inspection & Comparison Section (Shown when Completed) */}
        {learningStatus === 'completed' && traces.length > 0 && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4 text-xs animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 pb-2">
              <div>
                <span className="font-extrabold text-emerald-950 text-sm flex items-center gap-1.5">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span>[학습 완료] {selectedEpisodes}회 에피소드 학습 성공</span>
                </span>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  선택한 {selectedEpisodes}회의 전체 에피소드 학습을 마쳤습니다. AI가 학습한 결과를 확인해 봅시다.
                </p>
              </div>

              <button
                onClick={() => setShowLearnedPath(!showLearnedPath)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-2xs shrink-0"
              >
                {showLearnedPath ? '학습 경로 숨기기' : '현재 배운 경로 보기'}
              </button>
            </div>

            {/* Comparison Cards (Episode 1 vs Last Episode) */}
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
                <span className="font-bold text-emerald-900 block text-xs">
                  후반 (Episode {selectedEpisodes}): 학습이 진행된 경로
                </span>
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
                    <strong className="text-emerald-700">
                      {traces[traces.length - 1].reachedGoal ? '✓ 성공' : '실패'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Specific Episode Replay Selector (Restricted to accessible episodes) */}
        {(learningStatus === 'completed' || learningStatus === 'stopped') && availableCheckpoints.length > 0 && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <span className="font-bold text-slate-800 block text-xs">
              🎞️ 특정 에피소드 다시 보기 (실제로 학습한 회차 내에서 탐색 과정을 확인합니다):
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {availableCheckpoints.map(epNum => (
                <button
                  key={epNum}
                  onClick={() => handleSelectSpecificEpisode(epNum)}
                  className={`px-3 py-1.5 rounded-xl border font-bold text-xs cursor-pointer transition-all min-h-[38px] ${
                    currentEpIdx === epNum - 1
                      ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Episode {epNum}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Observation Question Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
          <span className="font-extrabold text-slate-900 block text-sm flex items-center gap-1.5">
            <HelpCircle size={16} className="text-amber-600" />
            <span>[핵심 관찰 질문] 강화학습 경험 누적과 경로 학습</span>
          </span>

          <p className="text-slate-700 font-medium leading-relaxed">
            질문: <strong>에이전트(로봇)가 시행착오 경험을 누적할수록 불필요한 이동 횟수와 행동 선택은 어떻게 변화하나요?</strong>
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
                onClick={() => {
                  setUserObservationChoice(opt.key);
                  onInteract?.();
                }}
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
                  X 다시 확인해보세요. 학습 에피소드가 누적되면 로봇이 보상을 보장하는 경로 행동에 집중하므로 안전하게 목표점에 도달합니다.
                </span>
              )}
            </div>
          )}
        </div>

        {/* Deep Thinking Prompts with Episode Count Comparison (Section 20) */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
          <span className="font-extrabold text-slate-900 block text-xs flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" />
            <span>💡 [함께 생각해보기 - 학습 횟수 비교 관찰]</span>
          </span>
          <ul className="space-y-1.5 text-slate-700 list-disc list-inside leading-relaxed">
            <li><strong>학습 횟수가 늘어나면</strong> 로봇의 이동 과정과 반복 방문 횟수는 어떻게 달라졌나요?</li>
            <li>학습 횟수가 많다고 해서 특정 시점 이후에도 결과가 무한히 크게 달라질까요?</li>
            <li>어느 정도 경험을 충분히 쌓은 뒤(수렴 후)에는 배운 경로의 변화가 작아지는 이유는 무엇일까요?</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

