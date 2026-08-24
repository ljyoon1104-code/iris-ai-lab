import type { IrisRecord, IrisSpecies } from '../types/iris';

export type FeatureKey = keyof Omit<IrisRecord, 'id' | 'species'>;

export interface Point2D {
  x: number;
  y: number;
}

export interface KMeansCluster {
  clusterIndex: number;
  centroid: Point2D;
  recordIds: number[];
  records: IrisRecord[];
  speciesCounts: Record<IrisSpecies, number>;
}

export interface KMeansStepState {
  stepNumber: number;
  centroids: Point2D[];
  previousCentroids?: Point2D[];
  clusters: KMeansCluster[];
  isConverged: boolean;
  actionDescription: string;
}

// Seeded PRNG Mulberry32 for reproducible initialization
function createPRNG(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 1. Calculate 2D distance between point and centroid
export function calculatePointDistance(p1: Point2D, p2: Point2D): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// 2. Initialize k centroids deterministically using seed
export function initializeCentroids(
  dataset: IrisRecord[],
  xFeature: FeatureKey,
  yFeature: FeatureKey,
  k: number,
  seed: number = 42
): Point2D[] {
  const prng = createPRNG(seed);
  const centroids: Point2D[] = [];
  const indices = new Set<number>();

  while (centroids.length < k && indices.size < dataset.length) {
    const idx = Math.floor(prng() * dataset.length);
    if (!indices.has(idx)) {
      indices.add(idx);
      const rec = dataset[idx];
      centroids.push({
        x: rec[xFeature],
        y: rec[yFeature],
      });
    }
  }

  return centroids;
}

// 3. Assign each record to closest centroid
export function assignPointsToCentroids(
  dataset: IrisRecord[],
  centroids: Point2D[],
  xFeature: FeatureKey,
  yFeature: FeatureKey
): number[] {
  return dataset.map(rec => {
    const pt: Point2D = { x: rec[xFeature], y: rec[yFeature] };
    let minDist = Infinity;
    let closestIndex = 0;

    centroids.forEach((c, idx) => {
      const dist = calculatePointDistance(pt, c);
      if (dist < minDist) {
        minDist = dist;
        closestIndex = idx;
      }
    });

    return closestIndex;
  });
}

// 4. Recalculate centroid coordinates from assigned points
export function updateCentroids(
  dataset: IrisRecord[],
  assignments: number[],
  centroids: Point2D[],
  xFeature: FeatureKey,
  yFeature: FeatureKey
): Point2D[] {
  const k = centroids.length;
  const sums: Point2D[] = Array.from({ length: k }, () => ({ x: 0, y: 0 }));
  const counts: number[] = Array.from({ length: k }, () => 0);

  dataset.forEach((rec, idx) => {
    const clusterIdx = assignments[idx];
    sums[clusterIdx].x += rec[xFeature];
    sums[clusterIdx].y += rec[yFeature];
    counts[clusterIdx] += 1;
  });

  return centroids.map((oldC, idx) => {
    if (counts[idx] === 0) return oldC; // Empty cluster safety fallback
    return {
      x: Math.round((sums[idx].x / counts[idx]) * 100) / 100,
      y: Math.round((sums[idx].y / counts[idx]) * 100) / 100,
    };
  });
}

// 5. Generate full step-by-step history for k-means execution
export function runKMeansWithHistory(
  dataset: IrisRecord[],
  xFeature: FeatureKey,
  yFeature: FeatureKey,
  k: number,
  seed: number = 42,
  maxIterations: number = 20
): KMeansStepState[] {
  const history: KMeansStepState[] = [];

  // Step 0: Initial Centroids
  let centroids = initializeCentroids(dataset, xFeature, yFeature, k, seed);
  let assignments = assignPointsToCentroids(dataset, centroids, xFeature, yFeature);

  let currentStep = 0;
  let isConverged = false;

  const buildClusters = (currCentroids: Point2D[], currAssign: number[]): KMeansCluster[] => {
    return currCentroids.map((c, cIdx) => {
      const recs = dataset.filter((_, idx) => currAssign[idx] === cIdx);
      const speciesCounts: Record<IrisSpecies, number> = {
        'Iris-setosa': 0,
        'Iris-versicolor': 0,
        'Iris-virginica': 0,
      };
      recs.forEach(r => {
        speciesCounts[r.species] = (speciesCounts[r.species] || 0) + 1;
      });

      return {
        clusterIndex: cIdx,
        centroid: c,
        recordIds: recs.map(r => r.id),
        records: recs,
        speciesCounts,
      };
    });
  };

  history.push({
    stepNumber: 0,
    centroids,
    clusters: buildClusters(centroids, assignments),
    isConverged: false,
    actionDescription: `초기 중심점 ${k}개 무작위(seed 42) 설정 완료`,
  });

  while (currentStep < maxIterations && !isConverged) {
    currentStep++;
    const prevCentroids = centroids;
    const prevAssignments = assignments;

    // Move centroids
    centroids = updateCentroids(dataset, prevAssignments, prevCentroids, xFeature, yFeature);

    // Re-assign points
    assignments = assignPointsToCentroids(dataset, centroids, xFeature, yFeature);

    // Check convergence: centroids did not move
    isConverged = prevCentroids.every((oldC, idx) => {
      const newC = centroids[idx];
      return oldC.x === newC.x && oldC.y === newC.y;
    });

    history.push({
      stepNumber: currentStep,
      centroids,
      previousCentroids: prevCentroids,
      clusters: buildClusters(centroids, assignments),
      isConverged,
      actionDescription: isConverged
        ? `단계 ${currentStep}: 중심점이 더 이상 이동하지 않아 군집 수렴(완료) 되었습니다.`
        : `단계 ${currentStep}: 군집 평균 위치로 중심점 이동 및 이웃 데이터 재배정`,
    });
  }

  return history;
}
