import type { IrisRecord } from '../types/iris';

export type FeatureKey = keyof Omit<IrisRecord, 'id' | 'species'>;

export interface LinearRegressionResult {
  slope: number; // 기울기 a
  intercept: number; // 절편 b
  rSquared: number;
  equationString: string;
  xFeature: FeatureKey;
  yFeature: FeatureKey;
}

export interface LinearResidualSample {
  recordId: number;
  xValue: number;
  actualY: number;
  predictedY: number;
  residual: number; // |actual - predicted|
}

// 1. Train Ordinary Least Squares (OLS) Linear Regression: y = a*x + b
export function trainLinearRegression(
  dataset: IrisRecord[],
  xFeature: FeatureKey = 'petalLength',
  yFeature: FeatureKey = 'petalWidth'
): LinearRegressionResult {
  const n = dataset.length;
  if (n === 0) {
    return {
      slope: 0,
      intercept: 0,
      rSquared: 0,
      equationString: 'y = 0x + 0',
      xFeature,
      yFeature,
    };
  }

  let sumX = 0;
  let sumY = 0;
  dataset.forEach(r => {
    sumX += r[xFeature];
    sumY += r[yFeature];
  });

  const meanX = sumX / n;
  const meanY = sumY / n;

  let num = 0;
  let den = 0;
  let ssTot = 0;

  dataset.forEach(r => {
    const xDiff = r[xFeature] - meanX;
    const yDiff = r[yFeature] - meanY;
    num += xDiff * yDiff;
    den += xDiff * xDiff;
    ssTot += yDiff * yDiff;
  });

  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;

  // Calculate R-squared
  let ssRes = 0;
  dataset.forEach(r => {
    const predY = slope * r[xFeature] + intercept;
    const res = r[yFeature] - predY;
    ssRes += res * res;
  });

  const rSquared = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);

  const roundedSlope = Math.round(slope * 100) / 100;
  const roundedIntercept = Math.round(intercept * 100) / 100;
  const sign = roundedIntercept >= 0 ? '+' : '-';

  const equationString = `y = ${roundedSlope} × x ${sign} ${Math.abs(roundedIntercept)}`;

  return {
    slope: roundedSlope,
    intercept: roundedIntercept,
    rSquared: Math.round(rSquared * 100) / 100,
    equationString,
    xFeature,
    yFeature,
  };
}

// 2. Predict y for a given x value
export function predictLinearRegression(slope: number, intercept: number, xVal: number): number {
  const pred = slope * xVal + intercept;
  return Math.round(pred * 100) / 100;
}

// 3. Get residual samples comparing actual vs predicted
export function getResidualSamples(
  dataset: IrisRecord[],
  slope: number,
  intercept: number,
  xFeature: FeatureKey,
  yFeature: FeatureKey,
  limit: number = 5
): LinearResidualSample[] {
  return dataset.slice(0, limit).map(r => {
    const xVal = r[xFeature];
    const actualY = r[yFeature];
    const predictedY = predictLinearRegression(slope, intercept, xVal);
    const residual = Math.round(Math.abs(actualY - predictedY) * 100) / 100;

    return {
      recordId: r.id,
      xValue: xVal,
      actualY,
      predictedY,
      residual,
    };
  });
}
