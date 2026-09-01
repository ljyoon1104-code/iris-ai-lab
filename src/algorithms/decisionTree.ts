import type { IrisRecord, IrisSpecies } from '../types/iris';

export type FeatureKey = keyof Omit<IrisRecord, 'id' | 'species'>;

export interface DecisionTreeNode {
  id: string;
  isLeaf: boolean;
  feature?: FeatureKey;
  threshold?: number;
  left?: DecisionTreeNode; // <= threshold
  right?: DecisionTreeNode; // > threshold
  predictedSpecies?: IrisSpecies;
  samples: number;
  speciesDistribution: Record<IrisSpecies, number>;
  gini: number;
  depth: number;
}

export interface DecisionTraceStep {
  stepNumber: number;
  feature: FeatureKey;
  featureLabel: string;
  value: number;
  threshold: number;
  conditionMet: boolean; // true if <= threshold, false if >
  nextDescription: string;
}

export interface DecisionTraceResult {
  predictedSpecies: IrisSpecies;
  steps: DecisionTraceStep[];
  leafNode: DecisionTreeNode;
}

const FEATURE_LABELS: Record<FeatureKey, string> = {
  sepalLength: '꽃받침 길이',
  sepalWidth: '꽃받침 너비',
  petalLength: '꽃잎 길이',
  petalWidth: '꽃잎 너비',
};

// 1. Calculate Gini impurity for a set of records
export function calculateGini(dataset: IrisRecord[]): number {
  if (dataset.length === 0) return 0;
  const counts: Record<string, number> = {};
  dataset.forEach(r => {
    counts[r.species] = (counts[r.species] || 0) + 1;
  });

  let sumSq = 0;
  Object.values(counts).forEach(c => {
    const p = c / dataset.length;
    sumSq += p * p;
  });

  return Math.round((1 - sumSq) * 1000) / 1000;
}

// 2. Get species distribution counts
function getDistribution(dataset: IrisRecord[]): Record<IrisSpecies, number> {
  const dist: Record<IrisSpecies, number> = {
    'Iris-setosa': 0,
    'Iris-versicolor': 0,
    'Iris-virginica': 0,
  };
  dataset.forEach(r => {
    dist[r.species] = (dist[r.species] || 0) + 1;
  });
  return dist;
}

// 3. Find majority species in dataset
function getMajoritySpecies(dataset: IrisRecord[]): IrisSpecies {
  const dist = getDistribution(dataset);
  const keys: IrisSpecies[] = ['Iris-setosa', 'Iris-versicolor', 'Iris-virginica'];
  keys.sort((a, b) => dist[b] - dist[a]);
  return keys[0];
}

// 4. Find best feature and threshold split using Gini impurity
export function findBestSplit(
  dataset: IrisRecord[],
  features: FeatureKey[]
): { feature: FeatureKey; threshold: number; giniImpurity: number } | null {
  if (dataset.length <= 1) return null;

  const currentGini = calculateGini(dataset);
  if (currentGini === 0) return null; // Pure node

  let bestGain = -1;
  let bestFeature: FeatureKey | null = null;
  let bestThreshold: number | null = null;

  features.forEach(feat => {
    // Sort records by feature value
    const sortedValues = Array.from(new Set(dataset.map(r => r[feat]))).sort((a, b) => a - b);

    for (let i = 0; i < sortedValues.length - 1; i++) {
      const threshold = Math.round(((sortedValues[i] + sortedValues[i + 1]) / 2) * 100) / 100;

      const leftGroup = dataset.filter(r => r[feat] <= threshold);
      const rightGroup = dataset.filter(r => r[feat] > threshold);

      if (leftGroup.length === 0 || rightGroup.length === 0) continue;

      const leftGini = calculateGini(leftGroup);
      const rightGini = calculateGini(rightGroup);

      const weightedGini =
        (leftGroup.length / dataset.length) * leftGini +
        (rightGroup.length / dataset.length) * rightGini;

      const infoGain = currentGini - weightedGini;

      if (infoGain > bestGain + 1e-5) {
        bestGain = infoGain;
        bestFeature = feat;
        bestThreshold = threshold;
      }
    }
  });

  if (!bestFeature || bestThreshold === null || bestGain <= 0) return null;

  return {
    feature: bestFeature,
    threshold: bestThreshold,
    giniImpurity: currentGini - bestGain,
  };
}

// 5. Train Decision Tree recursively with depth limit maxDepth
export function trainDecisionTree(
  dataset: IrisRecord[],
  features: FeatureKey[],
  maxDepth: number = 3,
  currentDepth: number = 0,
  nodeId: string = 'root'
): DecisionTreeNode {
  const gini = calculateGini(dataset);
  const distribution = getDistribution(dataset);
  const majority = getMajoritySpecies(dataset);

  // Base cases for leaf creation: max depth reached, dataset pure (gini == 0), or no data
  if (currentDepth >= maxDepth || gini === 0 || dataset.length <= 1) {
    return {
      id: nodeId,
      isLeaf: true,
      predictedSpecies: majority,
      samples: dataset.length,
      speciesDistribution: distribution,
      gini,
      depth: currentDepth,
    };
  }

  const bestSplit = findBestSplit(dataset, features);
  if (!bestSplit) {
    return {
      id: nodeId,
      isLeaf: true,
      predictedSpecies: majority,
      samples: dataset.length,
      speciesDistribution: distribution,
      gini,
      depth: currentDepth,
    };
  }

  const leftRecords = dataset.filter(r => r[bestSplit.feature] <= bestSplit.threshold);
  const rightRecords = dataset.filter(r => r[bestSplit.feature] > bestSplit.threshold);

  const leftChild = trainDecisionTree(leftRecords, features, maxDepth, currentDepth + 1, `${nodeId}_L`);
  const rightChild = trainDecisionTree(rightRecords, features, maxDepth, currentDepth + 1, `${nodeId}_R`);

  return {
    id: nodeId,
    isLeaf: false,
    feature: bestSplit.feature,
    threshold: bestSplit.threshold,
    left: leftChild,
    right: rightChild,
    predictedSpecies: majority,
    samples: dataset.length,
    speciesDistribution: distribution,
    gini,
    depth: currentDepth,
  };
}

// 6. Predict species and trace step-by-step decision path
export function traceDecisionPath(
  tree: DecisionTreeNode,
  newPoint: Record<string, number>
): DecisionTraceResult {
  const steps: DecisionTraceStep[] = [];
  let currNode = tree;

  while (!currNode.isLeaf && currNode.feature && currNode.threshold !== undefined) {
    const feat = currNode.feature;
    const val = Number(newPoint[feat] ?? 0);
    const thresh = currNode.threshold;
    const isMet = val <= thresh;

    steps.push({
      stepNumber: steps.length + 1,
      feature: feat,
      featureLabel: FEATURE_LABELS[feat] || feat,
      value: val,
      threshold: thresh,
      conditionMet: isMet,
      nextDescription: isMet
        ? `${FEATURE_LABELS[feat]} (${val}cm) ≤ ${thresh}cm 조건 충족 → 왼쪽 가지로 이동`
        : `${FEATURE_LABELS[feat]} (${val}cm) > ${thresh}cm 조건 미충족 → 오른쪽 가지로 이동`,
    });

    if (isMet && currNode.left) {
      currNode = currNode.left;
    } else if (!isMet && currNode.right) {
      currNode = currNode.right;
    } else {
      break;
    }
  }

  return {
    predictedSpecies: currNode.predictedSpecies || 'Iris-setosa',
    steps,
    leafNode: currNode,
  };
}

// 7. Interactive Decision Tree Educational Trace Generation
export interface CandidateSplit {
  id: string;
  feature: FeatureKey;
  featureLabel: string;
  threshold: number;
  isBest: boolean;
  leftCount: number;
  rightCount: number;
  leftDistribution: Record<IrisSpecies, number>;
  rightDistribution: Record<IrisSpecies, number>;
  weightedGini: number;
  impurityLevel: 'very_low' | 'low' | 'high';
  impurityLabel: string;
}

export interface TreeTrainingStep {
  stepIndex: number;
  nodeId: string;
  depth: number;
  samples: number;
  speciesDistribution: Record<IrisSpecies, number>;
  gini: number;
  candidates: CandidateSplit[];
  bestFeature: FeatureKey;
  bestThreshold: number;
}

export interface TreeTrainingTrace {
  fullTree: DecisionTreeNode;
  steps: TreeTrainingStep[];
}

export function buildDecisionTreeTrainingTrace(
  trainData: IrisRecord[],
  features: FeatureKey[],
  maxDepth: number
): TreeTrainingTrace {
  const fullTree = trainDecisionTree(trainData, features, maxDepth);

  interface QueueItem {
    dataset: IrisRecord[];
    nodeId: string;
    depth: number;
  }

  const queue: QueueItem[] = [{ dataset: trainData, nodeId: 'root', depth: 0 }];
  const steps: TreeTrainingStep[] = [];

  while (queue.length > 0) {
    const { dataset, nodeId, depth } = queue.shift()!;
    if (depth >= maxDepth || dataset.length <= 1) continue;

    const gini = calculateGini(dataset);
    if (gini === 0) continue;

    const bestSplit = findBestSplit(dataset, features);
    if (!bestSplit) continue;

    const allSplitsByFeature: Record<FeatureKey, any[]> = {
      sepalLength: [],
      sepalWidth: [],
      petalLength: [],
      petalWidth: [],
    };

    features.forEach(feat => {
      const vals = Array.from(new Set(dataset.map(r => r[feat]))).sort((a, b) => a - b);
      for (let i = 0; i < vals.length - 1; i++) {
        const threshold = Math.round(((vals[i] + vals[i + 1]) / 2) * 100) / 100;
        const left = dataset.filter(r => r[feat] <= threshold);
        const right = dataset.filter(r => r[feat] > threshold);
        if (left.length === 0 || right.length === 0) continue;

        const leftGini = calculateGini(left);
        const rightGini = calculateGini(right);
        const weightedGini = Math.round(((left.length / dataset.length) * leftGini + (right.length / dataset.length) * rightGini) * 1000) / 1000;
        const isBest = feat === bestSplit.feature && threshold === bestSplit.threshold;

        allSplitsByFeature[feat].push({
          feature: feat,
          featureLabel: FEATURE_LABELS[feat] || feat,
          threshold,
          isBest,
          leftCount: left.length,
          rightCount: right.length,
          leftDistribution: getDistribution(left),
          rightDistribution: getDistribution(right),
          weightedGini,
        });
      }
    });

    const bestCandidate = allSplitsByFeature[bestSplit.feature].find(s => s.isBest);
    if (!bestCandidate) continue;

    const otherFeatures = features.filter(f => f !== bestSplit.feature && allSplitsByFeature[f].length > 0);
    const altCandidates: any[] = [];

    otherFeatures.forEach(feat => {
      const list = allSplitsByFeature[feat];
      const balanced = list.filter(s => s.leftCount >= Math.min(4, Math.floor(dataset.length * 0.15)) && s.rightCount >= Math.min(4, Math.floor(dataset.length * 0.15)));
      const targetPool = balanced.length > 0 ? balanced : list;
      targetPool.sort((a, b) => a.weightedGini - b.weightedGini);
      if (targetPool.length > 0) {
        altCandidates.push(targetPool[0]);
      }
    });

    if (altCandidates.length < 2) {
      const sameFeatAlts = allSplitsByFeature[bestSplit.feature].filter(s => !s.isBest && Math.abs(s.threshold - bestSplit.threshold) > 0.5);
      if (sameFeatAlts.length > 0) {
        altCandidates.push(sameFeatAlts[Math.floor(sameFeatAlts.length / 2)]);
      }
    }

    const finalAlt1 = altCandidates[0];
    const finalAlt2 = altCandidates[1] || allSplitsByFeature[features.find(f => f !== bestSplit.feature)!]?.[0];

    const rawCandidates = [bestCandidate, finalAlt1, finalAlt2].filter(Boolean);
    const shift = (nodeId.length * 7 + depth * 3) % rawCandidates.length;
    const candidates: CandidateSplit[] = rawCandidates.map((_, i) => {
      const c = rawCandidates[(i + shift) % rawCandidates.length];
      let impurityLevel: 'very_low' | 'low' | 'high' = 'high';
      let impurityLabel = '섞임이 많음';
      if (c.weightedGini <= 0.15) {
        impurityLevel = 'very_low';
        impurityLabel = '섞임이 매우 적음';
      } else if (c.weightedGini <= 0.38) {
        impurityLevel = 'low';
        impurityLabel = '섞임이 적음';
      }
      return {
        ...c,
        id: `cand_${nodeId}_${i}`,
        impurityLevel,
        impurityLabel,
      };
    });

    steps.push({
      stepIndex: steps.length,
      nodeId,
      depth,
      samples: dataset.length,
      speciesDistribution: getDistribution(dataset),
      gini,
      candidates,
      bestFeature: bestSplit.feature,
      bestThreshold: bestSplit.threshold,
    });

    const leftRecords = dataset.filter(r => r[bestSplit.feature] <= bestSplit.threshold);
    const rightRecords = dataset.filter(r => r[bestSplit.feature] > bestSplit.threshold);
    queue.push({ dataset: leftRecords, nodeId: `${nodeId}_L`, depth: depth + 1 });
    queue.push({ dataset: rightRecords, nodeId: `${nodeId}_R`, depth: depth + 1 });
  }

  return { fullTree, steps };
}

export function pruneTreeToConfirmed(node: DecisionTreeNode, confirmedNodeIds: Set<string>): DecisionTreeNode {
  if (node.isLeaf || !confirmedNodeIds.has(node.id)) {
    return {
      ...node,
      isLeaf: true,
      left: undefined,
      right: undefined,
    };
  }
  return {
    ...node,
    left: node.left ? pruneTreeToConfirmed(node.left, confirmedNodeIds) : undefined,
    right: node.right ? pruneTreeToConfirmed(node.right, confirmedNodeIds) : undefined,
  };
}

