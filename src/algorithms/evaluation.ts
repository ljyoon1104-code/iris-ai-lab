import type { IrisRecord, IrisSpecies } from '../types/iris';
import { predictKNN } from './knn';
import { trainDecisionTree, traceDecisionPath } from './decisionTree';

export interface SplitResult {
  trainData: IrisRecord[];
  testData: IrisRecord[];
  trainCounts: Record<IrisSpecies, number>;
  testCounts: Record<IrisSpecies, number>;
}

export interface ConfusionMatrixCell {
  actual: IrisSpecies;
  predicted: IrisSpecies;
  count: number;
}

export interface ConfusionMatrixResult {
  matrix: Record<IrisSpecies, Record<IrisSpecies, number>>;
  rows: IrisSpecies[];
  cols: IrisSpecies[];
  totalCount: number;
  correctCount: number;
  accuracyPercent: number;
}

export interface MisclassifiedSample {
  record: IrisRecord;
  actualSpecies: IrisSpecies;
  predictedSpecies: IrisSpecies;
}

export interface ExperimentResult {
  id: string;
  algorithm: 'knn' | 'decisionTree';
  algorithmLabel: string;
  splitRatioLabel: string;
  parametersLabel: string;
  trainCount: number;
  testCount: number;
  accuracyPercent: number;
  correctCount: number;
  confusionMatrix: ConfusionMatrixResult;
  misclassifiedSamples: MisclassifiedSample[];
  featureKeys?: (keyof Omit<IrisRecord, 'id' | 'species'>)[];
}

// Seeded PRNG Mulberry32 for reproducible stratified splitting
function createPRNG(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 1. Stratified Split Dataset into Train / Test sets by ratio (e.g. 0.8 => 80:20)
export function stratifiedSplitDataset(
  dataset: IrisRecord[],
  trainRatio: number = 0.8,
  seed: number = 42
): SplitResult {
  const prng = createPRNG(seed);
  const speciesList: IrisSpecies[] = ['Iris-setosa', 'Iris-versicolor', 'Iris-virginica'];

  const trainData: IrisRecord[] = [];
  const testData: IrisRecord[] = [];

  const trainCounts: Record<IrisSpecies, number> = {
    'Iris-setosa': 0,
    'Iris-versicolor': 0,
    'Iris-virginica': 0,
  };

  const testCounts: Record<IrisSpecies, number> = {
    'Iris-setosa': 0,
    'Iris-versicolor': 0,
    'Iris-virginica': 0,
  };

  speciesList.forEach(sp => {
    // Clone & shuffle species records
    const spRecords = dataset.filter(r => r.species === sp);
    const shuffled = [...spRecords].sort(() => prng() - 0.5);

    const targetTrainCount = Math.round(shuffled.length * trainRatio);

    const trainGroup = shuffled.slice(0, targetTrainCount);
    const testGroup = shuffled.slice(targetTrainCount);

    trainData.push(...trainGroup);
    testData.push(...testGroup);

    trainCounts[sp] = trainGroup.length;
    testCounts[sp] = testGroup.length;
  });

  return {
    trainData,
    testData,
    trainCounts,
    testCounts,
  };
}

// 2. Build 3x3 Confusion Matrix
export function buildConfusionMatrix(
  actuals: IrisSpecies[],
  predictions: IrisSpecies[]
): ConfusionMatrixResult {
  const speciesList: IrisSpecies[] = ['Iris-setosa', 'Iris-versicolor', 'Iris-virginica'];

  const matrix: Record<IrisSpecies, Record<IrisSpecies, number>> = {
    'Iris-setosa': { 'Iris-setosa': 0, 'Iris-versicolor': 0, 'Iris-virginica': 0 },
    'Iris-versicolor': { 'Iris-setosa': 0, 'Iris-versicolor': 0, 'Iris-virginica': 0 },
    'Iris-virginica': { 'Iris-setosa': 0, 'Iris-versicolor': 0, 'Iris-virginica': 0 },
  };

  let correctCount = 0;
  const totalCount = actuals.length;

  for (let i = 0; i < totalCount; i++) {
    const act = actuals[i];
    const pred = predictions[i];
    matrix[act][pred] = (matrix[act][pred] || 0) + 1;
    if (act === pred) correctCount++;
  }

  const accuracyPercent = totalCount > 0 ? Math.round((correctCount / totalCount) * 1000) / 10 : 0;

  return {
    matrix,
    rows: speciesList,
    cols: speciesList,
    totalCount,
    correctCount,
    accuracyPercent,
  };
}

// 3. Evaluate Classifier on Test Set (Strict Data Leakage Prevention)
export function evaluateClassifier(
  algorithm: 'knn' | 'decisionTree',
  trainData: IrisRecord[],
  testData: IrisRecord[],
  params: {
    k?: number;
    maxDepth?: number;
    featureKeys?: (keyof Omit<IrisRecord, 'id' | 'species'>)[];
  }
): { predictions: IrisSpecies[]; confusionMatrix: ConfusionMatrixResult; misclassified: MisclassifiedSample[] } {
  const predictions: IrisSpecies[] = [];
  const actuals: IrisSpecies[] = testData.map(r => r.species);
  const misclassified: MisclassifiedSample[] = [];

  const defaultKnnFeatures: (keyof Omit<IrisRecord, 'id' | 'species'>)[] = ['petalLength', 'petalWidth'];
  const features4D = ['sepalLength', 'sepalWidth', 'petalLength', 'petalWidth'] as const;

  if (algorithm === 'knn') {
    const k = params.k || 5;
    const knnFeatures =
      params.featureKeys && params.featureKeys.length === 2
        ? params.featureKeys
        : defaultKnnFeatures;

    testData.forEach(testRec => {
      // Predict ONLY using trainData (NO test leakage!)
      const res = predictKNN(trainData, testRec, knnFeatures, k);
      predictions.push(res.predictedSpecies);
      if (res.predictedSpecies !== testRec.species) {
        misclassified.push({
          record: testRec,
          actualSpecies: testRec.species,
          predictedSpecies: res.predictedSpecies,
        });
      }
    });
  } else {
    const depth = params.maxDepth || 3;
    // Train tree ONLY using trainData
    const tree = trainDecisionTree(trainData, [...features4D], depth);
    testData.forEach(testRec => {
      const trace = traceDecisionPath(tree, testRec as any);
      predictions.push(trace.predictedSpecies);
      if (trace.predictedSpecies !== testRec.species) {
        misclassified.push({
          record: testRec,
          actualSpecies: testRec.species,
          predictedSpecies: trace.predictedSpecies,
        });
      }
    });
  }

  const confusionMatrix = buildConfusionMatrix(actuals, predictions);

  return {
    predictions,
    confusionMatrix,
    misclassified,
  };
}
