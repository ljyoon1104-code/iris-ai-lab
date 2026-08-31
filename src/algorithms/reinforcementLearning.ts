export interface GridPosition {
  r: number;
  c: number;
}

export type ActionType = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface RLEpisodeStep {
  stepNumber: number;
  state: GridPosition;
  action: ActionType;
  nextState: GridPosition;
  reward: number;
  isGoal: boolean;
  isObstacle: boolean;
  mode?: 'explore' | 'exploit';
  oldQ?: number;
  newQ?: number;
}

export interface RLEpisodeResult {
  episodeNumber: number;
  totalReward: number;
  stepsCount: number;
  reachedGoal: boolean;
  steps: RLEpisodeStep[];
}

export interface PolicyPathResult {
  path: GridPosition[];
  reachedGoal: boolean;
  terminatedReason: 'goal' | 'maxSteps' | 'loop' | 'obstacle' | 'invalidPolicy';
  totalSteps: number;
  totalReward: number;
}

export interface RLGridConfig {
  rows: number;
  cols: number;
  start: GridPosition;
  goal: GridPosition;
  obstacles: GridPosition[];
}

export const DEFAULT_GRID_CONFIG: RLGridConfig = {
  rows: 5,
  cols: 5,
  start: { r: 0, c: 0 },
  goal: { r: 4, c: 4 },
  obstacles: [
    { r: 1, c: 2 },
    { r: 2, c: 3 },
    { r: 3, c: 1 },
  ],
};

const ACTIONS: ActionType[] = ['RIGHT', 'DOWN', 'UP', 'LEFT'];

function createPRNG(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class QLearningAgent {
  public config: RLGridConfig;
  public qTable: Record<string, Record<ActionType, number>>;
  public alpha: number = 0.2; // Learning rate
  public gamma: number = 0.9; // Discount factor
  public epsilon: number = 0.3; // Exploration rate
  public episodesTrained: number = 0;
  private prng: () => number;

  constructor(config: RLGridConfig = DEFAULT_GRID_CONFIG, seed: number = 42) {
    this.config = config;
    this.qTable = {};
    this.prng = createPRNG(seed);
    this.initQTable();
  }

  public getStateKey(r: number, c: number): string {
    return `${r},${c}`;
  }

  public initBlankQTable(): Record<string, Record<ActionType, number>> {
    const blank: Record<string, Record<ActionType, number>> = {};
    for (let r = 0; r < this.config.rows; r++) {
      for (let c = 0; c < this.config.cols; c++) {
        const key = this.getStateKey(r, c);
        blank[key] = {
          UP: 0,
          DOWN: 0,
          LEFT: 0,
          RIGHT: 0,
        };
      }
    }
    return blank;
  }

  public initQTable() {
    this.qTable = this.initBlankQTable();
    this.episodesTrained = 0;
  }

  public isObstacle(r: number, c: number): boolean {
    return this.config.obstacles.some(o => o.r === r && o.c === c);
  }

  public isGoal(r: number, c: number): boolean {
    return this.config.goal.r === r && this.config.goal.c === c;
  }

  // Choose action and return whether it was exploration or exploitation
  public chooseActionWithMode(state: GridPosition): { action: ActionType; mode: 'explore' | 'exploit' } {
    if (this.prng() < this.epsilon) {
      const idx = Math.floor(this.prng() * ACTIONS.length);
      return { action: ACTIONS[idx], mode: 'explore' };
    }
    return { action: this.getGreedyAction(state), mode: 'exploit' };
  }

  // Choose action using epsilon-greedy strategy during training episodes
  public chooseAction(state: GridPosition): ActionType {
    return this.chooseActionWithMode(state).action;
  }

  // Choose action strictly using pure greedy policy with deterministic tie-breaking (RIGHT, DOWN, UP, LEFT)
  public getGreedyAction(
    state: GridPosition,
    customQTable?: Record<string, Record<ActionType, number>>
  ): ActionType {
    const key = this.getStateKey(state.r, state.c);
    const table = customQTable || this.qTable;
    const qValues = table[key] || { UP: 0, DOWN: 0, LEFT: 0, RIGHT: 0 };

    let maxQ = -Infinity;
    let bestAction: ActionType = 'RIGHT';

    ACTIONS.forEach(a => {
      if (qValues[a] > maxQ) {
        maxQ = qValues[a];
        bestAction = a;
      }
    });

    return bestAction;
  }

  // Clone a Q-table
  public cloneQTable(
    table: Record<string, Record<ActionType, number>> = this.qTable
  ): Record<string, Record<ActionType, number>> {
    const copy: Record<string, Record<ActionType, number>> = {};
    for (const [key, actions] of Object.entries(table)) {
      copy[key] = { ...actions };
    }
    return copy;
  }

  // Reconstruct exact Q-table at any given (episodeIndex, stepIndex)
  public getQTableAtStep(
    traces: RLEpisodeResult[],
    qSnapshots: Record<string, Record<ActionType, number>>[],
    targetEpIdx: number,
    targetStepIdx: number
  ): Record<string, Record<ActionType, number>> {
    if (targetEpIdx < 0 || traces.length === 0) {
      return this.initBlankQTable();
    }

    const baseEpIdx = targetEpIdx - 1;
    const table =
      baseEpIdx >= 0 && qSnapshots[baseEpIdx]
        ? this.cloneQTable(qSnapshots[baseEpIdx])
        : this.initBlankQTable();

    const currentEp = traces[targetEpIdx];
    if (currentEp && currentEp.steps) {
      const maxStep = Math.min(targetStepIdx, currentEp.steps.length - 1);
      for (let s = 0; s <= maxStep; s++) {
        const step = currentEp.steps[s];
        if (step && step.newQ !== undefined) {
          const key = this.getStateKey(step.state.r, step.state.c);
          table[key][step.action] = step.newQ;
        }
      }
    }

    return table;
  }

  // Environment transition step
  public stepEnvironment(state: GridPosition, action: ActionType): { nextState: GridPosition; reward: number; done: boolean; isObstacle: boolean; isGoal: boolean } {
    let nr = state.r;
    let nc = state.c;

    if (action === 'UP') nr--;
    if (action === 'DOWN') nr++;
    if (action === 'LEFT') nc--;
    if (action === 'RIGHT') nc++;

    // Check bounds
    if (nr < 0 || nr >= this.config.rows || nc < 0 || nc >= this.config.cols) {
      return {
        nextState: state, // Stay in place
        reward: -2, // Out of bounds penalty
        done: false,
        isObstacle: false,
        isGoal: false,
      };
    }

    // Check obstacle
    if (this.isObstacle(nr, nc)) {
      return {
        nextState: { r: nr, c: nc },
        reward: -5, // Obstacle collision penalty
        done: true, // Episode ends on collision
        isObstacle: true,
        isGoal: false,
      };
    }

    // Check goal
    if (this.isGoal(nr, nc)) {
      return {
        nextState: { r: nr, c: nc },
        reward: 10, // Goal reward
        done: true,
        isObstacle: false,
        isGoal: true,
      };
    }

    // Normal step
    return {
      nextState: { r: nr, c: nc },
      reward: -1, // Step penalty
      done: false,
      isObstacle: false,
      isGoal: false,
    };
  }

  // Run 1 Episode and update Q-table
  public runEpisode(maxSteps: number = 50): RLEpisodeResult {
    let currState = { ...this.config.start };
    const steps: RLEpisodeStep[] = [];
    let totalReward = 0;
    let reachedGoal = false;

    for (let s = 1; s <= maxSteps; s++) {
      const { action, mode } = this.chooseActionWithMode(currState);
      const { nextState, reward, done, isObstacle, isGoal } = this.stepEnvironment(currState, action);

      // Q-Learning update: Q(s,a) += alpha * [r + gamma * max_a' Q(s',a') - Q(s,a)]
      const currKey = this.getStateKey(currState.r, currState.c);
      const nextKey = this.getStateKey(nextState.r, nextState.c);

      const oldQ = this.qTable[currKey][action];
      const maxNextQ = Math.max(...Object.values(this.qTable[nextKey]));
      const newQ = oldQ + this.alpha * (reward + this.gamma * (done ? 0 : maxNextQ) - oldQ);
      const roundedNewQ = Math.round(newQ * 100) / 100;

      this.qTable[currKey][action] = roundedNewQ;

      totalReward += reward;
      steps.push({
        stepNumber: s,
        state: currState,
        action,
        nextState,
        reward,
        isGoal,
        isObstacle,
        mode,
        oldQ,
        newQ: roundedNewQ,
      });

      currState = nextState;

      if (done) {
        if (isGoal) reachedGoal = true;
        break;
      }
    }

    this.episodesTrained++;

    return {
      episodeNumber: this.episodesTrained,
      totalReward,
      stepsCount: steps.length,
      reachedGoal,
      steps,
    };
  }

  // Run multiple episodes
  public trainBatch(
    numEpisodes: number,
    epsilonStart: number = 0.6,
    epsilonMin: number = 0.05
  ): RLEpisodeResult {
    let lastResult!: RLEpisodeResult;
    for (let i = 0; i < numEpisodes; i++) {
      this.epsilon = Math.max(
        epsilonMin,
        epsilonStart - (i / Math.max(1, numEpisodes - 1)) * (epsilonStart - epsilonMin)
      );
      lastResult = this.runEpisode();
    }
    return lastResult;
  }

  // Run multiple episodes and preserve all episode traces with linear epsilon decay
  public trainBatchWithTrace(
    numEpisodes: number,
    epsilonStart: number = 0.6,
    epsilonMin: number = 0.05
  ): RLEpisodeResult[] {
    const traces: RLEpisodeResult[] = [];
    for (let i = 0; i < numEpisodes; i++) {
      this.epsilon = Math.max(
        epsilonMin,
        epsilonStart - (i / Math.max(1, numEpisodes - 1)) * (epsilonStart - epsilonMin)
      );
      traces.push(this.runEpisode());
    }
    return traces;
  }

  // Run multiple episodes and preserve traces and per-episode Q-table snapshots
  public trainBatchWithTraceAndSnapshots(
    numEpisodes: number,
    epsilonStart: number = 0.6,
    epsilonMin: number = 0.05
  ): {
    traces: RLEpisodeResult[];
    qSnapshots: Record<string, Record<ActionType, number>>[];
  } {
    const traces: RLEpisodeResult[] = [];
    const qSnapshots: Record<string, Record<ActionType, number>>[] = [];
    for (let i = 0; i < numEpisodes; i++) {
      this.epsilon = Math.max(
        epsilonMin,
        epsilonStart - (i / Math.max(1, numEpisodes - 1)) * (epsilonStart - epsilonMin)
      );
      const epResult = this.runEpisode();
      traces.push(epResult);
      qSnapshots.push(this.cloneQTable());
    }
    return { traces, qSnapshots };
  }

  // Evaluate current greedy policy path without exploration (Pure Greedy)
  public getBestPolicyPath(
    maxSteps: number = 25,
    customQTable?: Record<string, Record<ActionType, number>>
  ): PolicyPathResult {
    const path: GridPosition[] = [{ ...this.config.start }];
    let curr = { ...this.config.start };
    const visitedStates = new Set<string>();
    let totalReward = 0;

    // Immediate check if start position is goal
    if (this.isGoal(curr.r, curr.c)) {
      return {
        path,
        reachedGoal: true,
        terminatedReason: 'goal',
        totalSteps: 0,
        totalReward: 0,
      };
    }

    for (let s = 1; s <= maxSteps; s++) {
      const currKey = this.getStateKey(curr.r, curr.c);

      // Loop detection: if state has already been visited in this greedy policy evaluation
      if (visitedStates.has(currKey)) {
        return {
          path,
          reachedGoal: false,
          terminatedReason: 'loop',
          totalSteps: path.length - 1,
          totalReward,
        };
      }
      visitedStates.add(currKey);

      const greedyAction = this.getGreedyAction(curr, customQTable);
      const { nextState, reward, isObstacle, isGoal } = this.stepEnvironment(curr, greedyAction);

      totalReward += reward;

      // Obstacle collision
      if (isObstacle) {
        path.push(nextState);
        return {
          path,
          reachedGoal: false,
          terminatedReason: 'obstacle',
          totalSteps: path.length - 1,
          totalReward,
        };
      }

      path.push(nextState);
      curr = nextState;

      // Check Goal Arrival (Strict Success condition: last position is Goal 4,4)
      if (isGoal || (curr.r === this.config.goal.r && curr.c === this.config.goal.c)) {
        return {
          path,
          reachedGoal: true,
          terminatedReason: 'goal',
          totalSteps: path.length - 1,
          totalReward,
        };
      }
    }

    // Hit maxSteps without reaching Goal
    const lastPos = path[path.length - 1];
    const reachedGoal = this.isGoal(lastPos.r, lastPos.c);

    return {
      path,
      reachedGoal,
      terminatedReason: reachedGoal ? 'goal' : 'maxSteps',
      totalSteps: path.length - 1,
      totalReward,
    };
  }
}
