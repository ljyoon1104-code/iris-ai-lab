import type { IrisRecord } from '../types/iris';

export type FeatureKey = keyof Omit<IrisRecord, 'id' | 'species'>;

export const NUMERIC_FEATURE_LABELS: Record<FeatureKey, { full: string; short: string; unit: string }> = {
  sepalLength: { full: '꽃받침 길이', short: '받침 길이', unit: 'cm' },
  sepalWidth: { full: '꽃받침 너비', short: '받침 너비', unit: 'cm' },
  petalLength: { full: '꽃잎 길이', short: '꽃잎 길이', unit: 'cm' },
  petalWidth: { full: '꽃잎 너비', short: '꽃잎 너비', unit: 'cm' },
};

/**
 * 1. Mean (평균)
 * Sum of all values divided by count, rounded to 2 decimal places.
 */
export function calculateMean(values: number[]): number {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / values.length) * 100) / 100;
}

/**
 * 2. Median (중앙값)
 * Middle value of sorted numbers (average of two middle numbers if even).
 */
export function calculateMedian(values: number[]): number {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 100) / 100;
  }
  return Math.round(sorted[mid] * 100) / 100;
}

/**
 * 3. Quartiles (Q1, Q3, IQR)
 * Uses standard linear interpolation (Type 7 / Weibull / NumPy default `(N-1)*p` formula):
 * index = (N - 1) * percentile
 * Q1 index = (N - 1) * 0.25
 * Q3 index = (N - 1) * 0.75
 * Interpolated value = arr[i] + f * (arr[i+1] - arr[i])
 */
export function calculateQuartiles(values: number[]): { q1: number; q3: number; iqr: number } {
  if (!values || values.length === 0) {
    return { q1: 0, q3: 0, iqr: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  if (n === 1) {
    return { q1: sorted[0], q3: sorted[0], iqr: 0 };
  }

  const getPercentile = (p: number): number => {
    const idx = (n - 1) * p;
    const lowerIdx = Math.floor(idx);
    const upperIdx = Math.ceil(idx);
    const weight = idx - lowerIdx;

    if (lowerIdx === upperIdx) {
      return sorted[lowerIdx];
    }
    return sorted[lowerIdx] + weight * (sorted[upperIdx] - sorted[lowerIdx]);
  };

  const q1 = Math.round(getPercentile(0.25) * 100) / 100;
  const q3 = Math.round(getPercentile(0.75) * 100) / 100;
  const iqr = Math.round((q3 - q1) * 100) / 100;

  return { q1, q3, iqr };
}

/**
 * 4. Min / Max (최솟값, 최댓값)
 */
export function calculateMinMax(values: number[]): { min: number; max: number } {
  if (!values || values.length === 0) return { min: 0, max: 0 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  return {
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
  };
}

/**
 * 5. Box Plot Statistics & Outlier Fences
 * Calculates Q1, Q3, IQR, lower fence (Q1 - 1.5*IQR), upper fence (Q3 + 1.5*IQR),
 * whiskers (actual min/max within fences), and outlier candidates (< lower or > upper fence).
 */
export interface BoxPlotStats {
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  q1: number;
  q3: number;
  iqr: number;
  lowerFence: number;
  upperFence: number;
  lowerWhisker: number;
  upperWhisker: number;
  outliers: number[];
}

export function calculateBoxPlotStats(values: number[]): BoxPlotStats {
  if (!values || values.length === 0) {
    return {
      count: 0,
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      q1: 0,
      q3: 0,
      iqr: 0,
      lowerFence: 0,
      upperFence: 0,
      lowerWhisker: 0,
      upperWhisker: 0,
      outliers: [],
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const { min, max } = calculateMinMax(sorted);
  const mean = calculateMean(sorted);
  const median = calculateMedian(sorted);
  const { q1, q3, iqr } = calculateQuartiles(sorted);

  const lowerFence = Math.round((q1 - 1.5 * iqr) * 100) / 100;
  const upperFence = Math.round((q3 + 1.5 * iqr) * 100) / 100;

  const outliers = sorted.filter(v => v < lowerFence || v > upperFence);
  const nonOutliers = sorted.filter(v => v >= lowerFence && v <= upperFence);

  const lowerWhisker = nonOutliers.length > 0 ? Math.min(...nonOutliers) : min;
  const upperWhisker = nonOutliers.length > 0 ? Math.max(...nonOutliers) : max;

  return {
    count: sorted.length,
    min,
    max,
    mean,
    median,
    q1,
    q3,
    iqr,
    lowerFence,
    upperFence,
    lowerWhisker: Math.round(lowerWhisker * 100) / 100,
    upperWhisker: Math.round(upperWhisker * 100) / 100,
    outliers,
  };
}

/**
 * 6. Histogram Bins
 * Divides numeric values into educational bins.
 * Returns array of bin objects with binStart, binEnd, binLabel, and count.
 */
export interface HistogramBin {
  binStart: number;
  binEnd: number;
  binLabel: string;
  count: number;
}

export function calculateHistogramBins(values: number[], targetBins: number = 8): HistogramBin[] {
  if (!values || values.length === 0) return [];

  const { min, max } = calculateMinMax(values);
  if (min === max) {
    return [
      {
        binStart: min,
        binEnd: max,
        binLabel: `${min}`,
        count: values.length,
      },
    ];
  }

  const step = (max - min) / targetBins;
  const bins: HistogramBin[] = [];

  for (let i = 0; i < targetBins; i++) {
    const binStart = Math.round((min + i * step) * 100) / 100;
    const binEnd = i === targetBins - 1 ? max : Math.round((min + (i + 1) * step) * 100) / 100;
    const count = values.filter(v => (i === targetBins - 1 ? v >= binStart && v <= binEnd : v >= binStart && v < binEnd)).length;

    bins.push({
      binStart,
      binEnd,
      binLabel: `${binStart.toFixed(1)}~${binEnd.toFixed(1)}`,
      count,
    });
  }

  return bins;
}

/**
 * 7. Pearson Correlation Coefficient
 * r = sum((x_i - mean_x) * (y_i - mean_y)) / sqrt(sum((x_i - mean_x)^2) * sum((y_i - mean_y)^2))
 */
export function calculatePearsonCorrelation(x: number[], y: number[]): number {
  if (!x || !y || x.length !== y.length || x.length === 0) return 0;

  const meanX = calculateMean(x);
  const meanY = calculateMean(y);

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < x.length; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  if (denX === 0 || denY === 0) return 0;
  const r = num / Math.sqrt(denX * denY);
  const clamped = Math.max(-1, Math.min(1, r));
  return Math.round(clamped * 100) / 100;
}

/**
 * 8. 4x4 Correlation Matrix for Numeric Features
 */
export interface CorrelationCell {
  featureX: FeatureKey;
  featureY: FeatureKey;
  labelX: string;
  labelY: string;
  correlation: number;
}

export function calculateCorrelationMatrix(
  dataset: IrisRecord[],
  features: FeatureKey[] = ['sepalLength', 'sepalWidth', 'petalLength', 'petalWidth']
): { features: FeatureKey[]; matrix: number[][]; cells: CorrelationCell[] } {
  const matrix: number[][] = [];
  const cells: CorrelationCell[] = [];

  const featureVectors: Record<FeatureKey, number[]> = {
    sepalLength: dataset.map(r => r.sepalLength),
    sepalWidth: dataset.map(r => r.sepalWidth),
    petalLength: dataset.map(r => r.petalLength),
    petalWidth: dataset.map(r => r.petalWidth),
  };

  for (let i = 0; i < features.length; i++) {
    const row: number[] = [];
    const fX = features[i];

    for (let j = 0; j < features.length; j++) {
      const fY = features[j];
      const r = i === j ? 1.0 : calculatePearsonCorrelation(featureVectors[fX], featureVectors[fY]);
      row.push(r);

      cells.push({
        featureX: fX,
        featureY: fY,
        labelX: NUMERIC_FEATURE_LABELS[fX].short,
        labelY: NUMERIC_FEATURE_LABELS[fY].short,
        correlation: r,
      });
    }

    matrix.push(row);
  }

  return { features, matrix, cells };
}

/**
 * Helper to safely extract valid numeric values from dataset for a selected feature.
 * Filters out nulls, undefined, NaNs, and parses string numbers if present.
 */
export function extractValidNumericValues(
  dataset: Array<Record<string, any>>,
  feature: FeatureKey
): number[] {
  const result: number[] = [];
  dataset.forEach(item => {
    const val = item[feature];
    if (typeof val === 'number' && !isNaN(val)) {
      result.push(val);
    } else if (typeof val === 'string') {
      const parsed = parseFloat(val);
      if (!isNaN(parsed)) {
        result.push(parsed);
      }
    }
  });
  return result;
}
