import type { IrisRecord, IrisSpecies } from '../types/iris';

export interface Point2D {
  x: number;
  y: number;
}

export interface NeighborResult {
  record: IrisRecord;
  distance: number;
}

export interface KNNPredictionResult {
  predictedSpecies: IrisSpecies;
  neighbors: NeighborResult[];
  votes: Record<IrisSpecies, number>;
  voteDetails: { species: IrisSpecies; count: number; avgDistance: number }[];
  reason: string;
}

// 1. Calculate Euclidean distance between two points for specified numeric features
export function calculateDistance(
  r1: Record<string, any>,
  r2: Record<string, any>,
  features: (keyof Omit<IrisRecord, 'id' | 'species'>)[]
): number {
  let sumSq = 0;
  for (const f of features) {
    const v1 = Number(r1[f] ?? 0);
    const v2 = Number(r2[f] ?? 0);
    const diff = v1 - v2;
    sumSq += diff * diff;
  }
  return Math.round(Math.sqrt(sumSq) * 100) / 100;
}

// 2. Get nearest k neighbors
export function getNearestNeighbors(
  dataset: IrisRecord[],
  newPoint: Record<string, any>,
  features: (keyof Omit<IrisRecord, 'id' | 'species'>)[],
  k: number
): NeighborResult[] {
  const distances: NeighborResult[] = dataset.map(record => ({
    record,
    distance: calculateDistance(record, newPoint, features),
  }));

  // Sort by distance ascending
  distances.sort((a, b) => a.distance - b.distance);

  return distances.slice(0, k);
}

// 3. Predict species with k-NN and tie-breaking logic
export function predictKNN(
  dataset: IrisRecord[],
  newPoint: Record<string, any>,
  features: (keyof Omit<IrisRecord, 'id' | 'species'>)[],
  k: number
): KNNPredictionResult {
  const neighbors = getNearestNeighbors(dataset, newPoint, features, k);

  const votes: Record<IrisSpecies, number> = {
    'Iris-setosa': 0,
    'Iris-versicolor': 0,
    'Iris-virginica': 0,
  };

  const distanceSums: Record<IrisSpecies, number> = {
    'Iris-setosa': 0,
    'Iris-versicolor': 0,
    'Iris-virginica': 0,
  };

  neighbors.forEach(n => {
    const sp = n.record.species;
    votes[sp] = (votes[sp] || 0) + 1;
    distanceSums[sp] = (distanceSums[sp] || 0) + n.distance;
  });

  const speciesKeys: IrisSpecies[] = ['Iris-setosa', 'Iris-versicolor', 'Iris-virginica'];

  const voteDetails = speciesKeys.map(sp => ({
    species: sp,
    count: votes[sp],
    avgDistance: votes[sp] > 0 ? Math.round((distanceSums[sp] / votes[sp]) * 100) / 100 : Infinity,
  }));

  // Sort by vote count descending; if tie, by smallest avgDistance
  voteDetails.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.avgDistance - b.avgDistance; // tie-break: smaller average distance wins!
  });

  const winning = voteDetails[0];

  const isTieBroken =
    voteDetails[1] && voteDetails[1].count === winning.count && winning.count > 0;

  const reason = isTieBroken
    ? `가까운 ${k}개 이웃 중 ${winning.species}와 ${voteDetails[1].species}가 동점(${winning.count}표)이었으나, 이웃들과의 평균 거리(${winning.avgDistance}cm)가 더 가까운 ${winning.species}로 판정되었습니다.`
    : `가까운 ${k}개 이웃 중 ${winning.species}가 ${winning.count}표로 가장 많은 투표를 받아 최종 예측 결과로 선택되었습니다.`;

  return {
    predictedSpecies: winning.species,
    neighbors,
    votes,
    voteDetails,
    reason,
  };
}

// 4. Find boundary case in dataset where k=1 and k=5 yield different predictions
export function findBoundaryCase(
  dataset: IrisRecord[],
  features: (keyof Omit<IrisRecord, 'id' | 'species'>)[]
): { point: Record<string, number>; k1Result: IrisSpecies; k5Result: IrisSpecies } | null {
  const axes = [...new Set(features)];
  if (dataset.length < 5 || axes.length === 0 || axes.length > 2) return null;
  const ranges = axes.map(feature => {
    const values = dataset.map(row => row[feature]);
    return { min: Math.min(...values), max: Math.max(...values) };
  });
  // Search the selected feature space, using the same precision as the inputs.
  for (let x = 0; x <= 40; x++) {
    for (let y = 0; y <= (axes.length === 2 ? 40 : 0); y++) {
      const p = Object.fromEntries(axes.map((feature, index) => {
        const fraction = (index === 0 ? x : y) / 40;
        const { min, max } = ranges[index];
        return [feature, Math.round((min + (max - min) * fraction) * 10) / 10];
      }));
      const res1 = predictKNN(dataset, p, features, 1);
      const res5 = predictKNN(dataset, p, features, 5);
      if (res1.predictedSpecies !== res5.predictedSpecies) {
        return {
          point: p,
          k1Result: res1.predictedSpecies,
          k5Result: res5.predictedSpecies,
        };
      }
    }
  }
  return null;
}
