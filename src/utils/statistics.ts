import type { IrisRecord } from '../types/iris';

export type FeatureKey = keyof Omit<IrisRecord, 'id' | 'species'>;

export const NUMERIC_FEATURE_LABELS: Record<FeatureKey, { full: string; short: string; unit: string }> = {
  sepalLength: { full: '꽃받침 길이', short: '받침 길이', unit: 'cm' },
  sepalWidth: { full: '꽃받침 너비', short: '받침 너비', unit: 'cm' },
  petalLength: { full: '꽃잎 길이', short: '꽃잎 길이', unit: 'cm' },
  petalWidth: { full: '꽃잎 너비', short: '꽃잎 너비', unit: 'cm' },
};

export interface NumericFeatureGuide {
  label: string;
  shortLabel: string;
  description: string;
  observationPoint: string;
  statsGuide: string;
  histogramGuide: string;
  histogramQuestion: string;
  boxplotGuide: string;
  boxplotNote: string;
  reflectionQuestion: string;
}

export const NUMERIC_FEATURE_GUIDES: Record<FeatureKey, NumericFeatureGuide> = {
  sepalLength: {
    label: '꽃받침 길이',
    shortLabel: '받침 길이',
    description: '꽃받침 길이는 붓꽃 꽃의 바깥쪽에 위치한 꽃받침의 길이를 나타내며, 붓꽃 전체의 크기와 밀접한 수치입니다.',
    observationPoint: '대부분의 수치가 어느 범위에 모여 있는지, 매우 크거나 작은 예외 값이 따로 존재하는지 관찰해보세요.',
    statsGuide: '최솟값과 최댓값의 차이 범위를 살펴보고, 평균과 중앙값이 서로 비슷한지 확인해보세요.',
    histogramGuide: '꽃받침 길이가 어느 수치 구간(cm)에 가장 높게 모여 있는지 분포 형태를 확인해보세요.',
    histogramQuestion: '꽃받침 길이가 가장 많이 모여 있는 중심 구간은 어디인가요?',
    boxplotGuide: '상자에서 멀리 떨어진 50.0cm 같은 극단적인 수치가 수염(fence) 밖에 위치하는지 살펴보세요.',
    boxplotNote: '현재 데이터에 포함된 50.0cm 수치는 소수점 오타로 발생한 명백한 입력 오류 이상치입니다.',
    reflectionQuestion: '꽃받침 길이에 50.0cm 같은 이상치가 포함되면 평균 수치에 어떤 영향을 주게 될까요?',
  },
  sepalWidth: {
    label: '꽃받침 너비',
    shortLabel: '받침 너비',
    description: '꽃받침 너비는 꽃받침의 폭(가로 크기)을 나타내며, 꽃받침 길이와 비교했을 때 상대적으로 수치 범위가 좁게 나타납니다.',
    observationPoint: '다른 속성에 비해 전체 값의 변화 폭이 좁은 편이므로 중앙값을 중심으로 어떻게 분포하는지 관찰해보세요.',
    statsGuide: '평균과 중앙값을 비교하고, 최솟값과 최댓값이 전체 범위에서 얼마나 떨어져 있는지 확인해보세요.',
    histogramGuide: '꽃받침 너비 값이 어느 수치 구간에 대칭적으로 모여 있는지 살펴보세요.',
    histogramQuestion: '꽃받침 너비의 분포가 가운데를 중심으로 종 모양처럼 모여 있나요?',
    boxplotGuide: '상자의 범위(IQR)와 수염 밖으로 떨어진 값이 실제 존재하는 관측치인지 구별해보세요.',
    boxplotNote: '박스플롯에서 수염 밖에 점이 보여도 희귀한 자연 관측값일 수 있으므로 함부로 삭제하면 안 됩니다.',
    reflectionQuestion: '꽃받침 너비처럼 범위가 좁은 속성을 볼 때 이상치를 판단하는 주의점은 무엇일까요?',
  },
  petalLength: {
    label: '꽃잎 길이',
    shortLabel: '꽃잎 길이',
    description: '꽃잎 길이는 붓꽃 꽃잎의 세로 길이를 나타내며, 세가지 품종(세토사, 버시컬러, 버지니카)의 특성을 구분하는 데 매우 뚜렷한 차이를 보이는 속성입니다.',
    observationPoint: '수치들이 하나의 범위에만 모이는지, 아니면 서로 다른 여러 무리(그룹)처럼 떨어져 보이는지 관찰해보세요.',
    statsGuide: '최솟값과 최댓값의 범위가 다른 속성보다 넓게 퍼져 있는지 확인해보세요.',
    histogramGuide: '꽃잎 길이의 분포가 하나의 큰 덩어리인지, 여러 구간으로 나누어진 여러 무리로 보이는지 관찰해보세요.',
    histogramQuestion: '꽃잎 길이의 히스토그램 봉우리가 2개 이상으로 나뉘어 보이는 이유는 무엇일까요?',
    boxplotGuide: '값의 넓은 범위 자체가 무조건 이상치라는 뜻은 아님에 주의하세요.',
    boxplotNote: '현재 데이터 #104에 30.0cm 이상치가 섞여 있으나, 원래 붓꽃의 꽃잎 길이는 품종별로 그룹화되어 넓은 범위를 가집니다.',
    reflectionQuestion: '꽃잎 길이 수치가 몇 개의 무리로 나누어져 분포한다면, 이것은 어떤 의미일까요?',
  },
  petalWidth: {
    label: '꽃잎 너비',
    shortLabel: '꽃잎 너비',
    description: '꽃잎 너비는 붓꽃 꽃잎의 가로 폭을 나타내며, 꽃잎 길이와 함께 붓꽃 품종을 분류하는 데 강한 상관관계를 가지는 주요 속성입니다.',
    observationPoint: '작은 수치 구간과 큰 수치 구간에 각각 데이터가 어떻게 나뉘어 분포하는지 살펴보세요.',
    statsGuide: '최솟값과 최댓값의 차이가 어느 정도인지 확인하고 평균과 중앙값의 위치를 파악해보세요.',
    histogramGuide: '꽃잎 너비 수치들이 한곳에 모이는지, 몇 개의 구간으로 나뉘어 분포하는지 관찰해보세요.',
    histogramQuestion: '작은 꽃잎 너비를 가진 그룹과 큰 너비를 가진 그룹이 명확히 구별되나요?',
    boxplotGuide: '상자의 위치(IQR)와 전체 범위를 살펴보고 극단적으로 떨어진 예외 수치가 있는지 확인해보세요.',
    boxplotNote: '꽃잎 너비는 0.1cm~2.5cm 사이에 분포하며, 극단적으로 떨어진 수치는 정밀하게 검증해야 합니다.',
    reflectionQuestion: '꽃잎 너비 수치 하나만으로도 서로 다른 붓꽃 품종의 특징을 어느 정도 구분할 수 있을까요?',
  },
};

export function getFeatureDynamicGuidance(
  feature: FeatureKey,
  workingDataset: any[]
): {
  base: NumericFeatureGuide;
  hasIntentionalError: boolean;
  errorGuide: string;
  statsDiffNote: string;
} {
  const base = NUMERIC_FEATURE_GUIDES[feature];

  let hasIntentionalError = false;
  let errorGuide = '이 속성에서는 값의 전체적인 분포와 범위를 중심으로 살펴보세요.';

  if (feature === 'sepalLength') {
    const has50 = workingDataset.some(r => typeof r.sepalLength === 'number' && r.sepalLength > 20);
    if (has50) {
      hasIntentionalError = true;
      errorGuide = '💡 매우 큰 값 하나 때문에 평균이 영향을 받았는지 살펴보세요. (이상치는 평균과 같은 통계량에도 영향을 줄 수 있습니다)';
    }
  } else if (feature === 'petalLength') {
    const has30 = workingDataset.some(r => typeof r.petalLength === 'number' && r.petalLength > 20);
    if (has30) {
      hasIntentionalError = true;
      errorGuide = '💡 매우 큰 값 하나 때문에 평균이 영향을 받았는지 살펴보세요. (이상치는 평균과 같은 통계량에도 영향을 줄 수 있습니다)';
    }
  }

  const validVals = extractValidNumericValues(workingDataset, feature);
  const mean = calculateMean(validVals);
  const median = calculateMedian(validVals);
  const diff = Math.abs(mean - median);

  let statsDiffNote = `평균(${mean}cm)과 중앙값(${median}cm)이 서로 비슷하여 데이터의 중심을 고르게 나타내고 있습니다.`;
  if (hasIntentionalError || diff >= 0.2) {
    statsDiffNote = `극단적으로 큰 값은 평균에 영향을 줄 수 있습니다. 중앙값과 비교해보면 그 영향을 확인하는 데 도움이 됩니다. (현재 평균: ${mean}cm, 중앙값: ${median}cm)`;
  }

  return {
    base,
    hasIntentionalError,
    errorGuide,
    statsDiffNote,
  };
}

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

export interface RangeHistogramBin {
  binStart: number;
  binEnd: number;
  binLabel: string;
  count: number;
}

export interface RangeHistogramData {
  normalBins: RangeHistogramBin[];
  extremeOutliers: number[];
  totalCount: number;
}

export function calculateRangeHistogramBins(
  values: number[],
  maxNormalThreshold: number = 20.0,
  targetBins: number = 7
): RangeHistogramData {
  if (!values || values.length === 0) {
    return { normalBins: [], extremeOutliers: [], totalCount: 0 };
  }

  const normalValues = values.filter(v => typeof v === 'number' && !isNaN(v) && v <= maxNormalThreshold);
  const extremeOutliers = values.filter(v => typeof v === 'number' && !isNaN(v) && v > maxNormalThreshold);

  if (normalValues.length === 0) {
    return { normalBins: [], extremeOutliers, totalCount: values.length };
  }

  const minVal = Math.min(...normalValues);
  const maxVal = Math.max(...normalValues);

  if (minVal === maxVal) {
    return {
      normalBins: [{
        binStart: minVal,
        binEnd: maxVal,
        binLabel: `${minVal.toFixed(1)}cm`,
        count: normalValues.length,
      }],
      extremeOutliers,
      totalCount: values.length,
    };
  }

  const step = (maxVal - minVal) / targetBins;
  const normalBins: RangeHistogramBin[] = [];

  for (let i = 0; i < targetBins; i++) {
    const binStart = Math.round((minVal + i * step) * 10) / 10;
    const binEnd = i === targetBins - 1 ? maxVal : Math.round((minVal + (i + 1) * step) * 10) / 10;
    const count = normalValues.filter(v => (
      i === targetBins - 1 ? v >= binStart && v <= binEnd : v >= binStart && v < binEnd
    )).length;

    normalBins.push({
      binStart,
      binEnd,
      binLabel: `${binStart.toFixed(1)}~${binEnd.toFixed(1)}cm`,
      count,
    });
  }

  return {
    normalBins,
    extremeOutliers,
    totalCount: values.length,
  };
}

export interface IsolatedBoxPlotStats extends BoxPlotStats {
  normalValues: number[];
  extremeOutliers: number[];
}

export function calculateIsolatedBoxPlotStats(
  values: number[],
  maxNormalThreshold: number = 20.0
): IsolatedBoxPlotStats {
  const extremeOutliers = values.filter(v => typeof v === 'number' && !isNaN(v) && v > maxNormalThreshold);
  const normalValues = values.filter(v => typeof v === 'number' && !isNaN(v) && v <= maxNormalThreshold);

  const statsTarget = normalValues.length > 0 ? normalValues : values;
  const baseStats = calculateBoxPlotStats(statsTarget);

  return {
    ...baseStats,
    normalValues,
    extremeOutliers,
  };
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
