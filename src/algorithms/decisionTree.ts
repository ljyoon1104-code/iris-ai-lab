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
