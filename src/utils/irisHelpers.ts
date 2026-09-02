import type { IrisRecord, IrisSpecies, DatasetCounts, ErrorIrisRecord } from '../types/iris';
import { SPECIES_MAP, ORIGINAL_IRIS_DATASET, ERROR_IRIS_DATASET } from '../data/irisDataset';

// 1. Get record by ID
export function getIrisById(dataset: IrisRecord[], id: number): IrisRecord | undefined {
  return dataset.find(item => item.id === id);
}

// 2. Filter dataset by species
export function getIrisBySpecies(dataset: IrisRecord[], species: IrisSpecies | string): IrisRecord[] {
  return dataset.filter(item => item.species === species);
}

// 3. Get dataset counts & breakdown
export function getDatasetCounts(dataset: IrisRecord[]): DatasetCounts {
  const bySpecies: Record<string, number> = {};
  const bySpeciesKorean: Record<string, number> = {
    '세토사': 0,
    '버시컬러': 0,
    '버지니카': 0,
  };

  dataset.forEach(item => {
    bySpecies[item.species] = (bySpecies[item.species] || 0) + 1;
    const mapped = SPECIES_MAP[item.species as IrisSpecies];
    if (mapped) {
      bySpeciesKorean[mapped.korean] = (bySpeciesKorean[mapped.korean] || 0) + 1;
    } else {
      bySpeciesKorean[item.species] = (bySpeciesKorean[item.species] || 0) + 1;
    }
  });

  return {
    total: dataset.length,
    bySpecies,
    bySpeciesKorean,
  };
}

// 4. Extract single numeric feature array
export function getFeatureValues(
  dataset: IrisRecord[],
  featureName: keyof Omit<IrisRecord, 'id' | 'species'>
): number[] {
  return dataset.map(item => item[featureName]);
}

// 5. Extract 2D feature pair array (e.g. for k-NN scatter plots)
export function getFeaturePair(
  dataset: IrisRecord[],
  featureX: keyof Omit<IrisRecord, 'id' | 'species'>,
  featureY: keyof Omit<IrisRecord, 'id' | 'species'>
): { x: number; y: number; species: IrisSpecies; id: number }[] {
  return dataset.map(item => ({
    x: item[featureX],
    y: item[featureY],
    species: item.species,
    id: item.id,
  }));
}

// 6. Extract feature matrix without labels (e.g. for k-means)
export function getFeatureMatrix(
  dataset: IrisRecord[],
  featureNames: (keyof Omit<IrisRecord, 'id' | 'species'>)[]
): number[][] {
  return dataset.map(item => featureNames.map(f => item[f]));
}

// 7. Deep clone dataset array
export function cloneDataset<T>(dataset: T[]): T[] {
  return JSON.parse(JSON.stringify(dataset));
}

// 8. Seeded pseudo-random number generator (Mulberry32 PRNG)
function createPRNG(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 9. Seeded shuffle (Fisher-Yates with Mulberry32 PRNG)
export function shuffleWithSeed<T>(dataset: T[], seed: number = 42): T[] {
  const cloned = cloneDataset(dataset);
  const prng = createPRNG(seed);
  for (let i = cloned.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
}

// 10. Split dataset into train and test splits (e.g., 0.8 for 80:20)
export function splitDataset<T>(
  dataset: T[],
  trainRatio: number = 0.8,
  seed: number = 42
): { train: T[]; test: T[] } {
  const shuffled = shuffleWithSeed(dataset, seed);
  const trainSize = Math.round(shuffled.length * trainRatio);
  return {
    train: shuffled.slice(0, trainSize),
    test: shuffled.slice(trainSize),
  };
}

// 11. Stratified Split maintaining equal class distribution in train & test
export function stratifiedSplitDataset(
  dataset: IrisRecord[],
  trainRatio: number = 0.8,
  seed: number = 42
): { train: IrisRecord[]; test: IrisRecord[] } {
  const speciesList: IrisSpecies[] = ['Iris-setosa', 'Iris-versicolor', 'Iris-virginica'];
  const train: IrisRecord[] = [];
  const test: IrisRecord[] = [];

  speciesList.forEach(sp => {
    const subSet = dataset.filter(item => item.species === sp);
    const split = splitDataset(subSet, trainRatio, seed);
    train.push(...split.train);
    test.push(...split.test);
  });

  return {
    train: shuffleWithSeed(train, seed),
    test: shuffleWithSeed(test, seed),
  };
}

// 12. Statistical helpers: Mean
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / values.length) * 100) / 100;
}

// 13. Statistical helpers: Median
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 100) / 100;
  }
  return Math.round(sorted[mid] * 100) / 100;
}

// 14. Automated dataset validation report
export function validateIrisDataset(dataset: IrisRecord[]): {
  isValid: boolean;
  totalRows: number;
  duplicateIds: number[];
  missingValuesCount: number;
  nonNumericCount: number;
  speciesCounts: Record<string, number>;
  unexpectedSpecies: string[];
  errors: string[];
} {
  const errors: string[] = [];
  const idMap = new Set<number>();
  const duplicateIds: number[] = [];
  let missingValuesCount = 0;
  let nonNumericCount = 0;
  const speciesCounts: Record<string, number> = {};
  const validSpecies = new Set(['Iris-setosa', 'Iris-versicolor', 'Iris-virginica']);
  const unexpectedSpecies: string[] = [];

  dataset.forEach(item => {
    // Check ID uniqueness
    if (idMap.has(item.id)) {
      duplicateIds.push(item.id);
    } else {
      idMap.add(item.id);
    }

    // Check numeric fields
    const numericFields: (keyof Omit<IrisRecord, 'id' | 'species'>)[] = [
      'sepalLength',
      'sepalWidth',
      'petalLength',
      'petalWidth',
    ];

    numericFields.forEach(field => {
      const val = item[field];
      if (val === null || val === undefined) {
        missingValuesCount++;
      } else if (typeof val !== 'number' || isNaN(val)) {
        nonNumericCount++;
      }
    });

    // Check species
    if (!item.species) {
      missingValuesCount++;
    } else {
      speciesCounts[item.species] = (speciesCounts[item.species] || 0) + 1;
      if (!validSpecies.has(item.species as IrisSpecies)) {
        unexpectedSpecies.push(item.species);
      }
    }
  });

  if (duplicateIds.length > 0) errors.push(`중복된 ID 존재: ${duplicateIds.join(', ')}`);
  if (missingValuesCount > 0) errors.push(`결측치 ${missingValuesCount}개 발견`);
  if (nonNumericCount > 0) errors.push(`숫자가 아닌 수치형 필드 ${nonNumericCount}개 발견`);
  if (unexpectedSpecies.length > 0) errors.push(`예상치 못한 품종명 발견: ${unexpectedSpecies.join(', ')}`);

  return {
    isValid: errors.length === 0,
    totalRows: dataset.length,
    duplicateIds,
    missingValuesCount,
    nonNumericCount,
    speciesCounts,
    unexpectedSpecies,
    errors,
  };
}

export const ERROR_GROUND_TRUTH_MAP: Record<number, Record<string, any>> = {
  101: { sepalLength: 5.1 },
  102: { petalWidth: 0.2 },
  103: { sepalLength: 4.7 },
  104: { petalLength: 1.5 },
  105: { species: 'Iris-setosa' },
  106: { species: 'Iris-setosa' },
  107: { sepalLength: 5.1 },
  108: { sepalWidth: 3.2 },
  109: { species: 'Iris-versicolor' },
  112: { petalWidth: 1.5 },
  114: { species: 'Iris-virginica' },
  115: { petalLength: 5.9 },
};

export function getOriginalGroundTruth(recordId: number, field: string): any {
  if (ERROR_GROUND_TRUTH_MAP[recordId] && ERROR_GROUND_TRUTH_MAP[recordId][field] !== undefined) {
    return ERROR_GROUND_TRUTH_MAP[recordId][field];
  }
  return undefined;
}

export function applyEditsToDataset<T extends { id: number }>(dataset: T[], edits: Array<{ recordId: number; field: string; after: any }>): T[] {
  const cloned = cloneDataset(dataset);
  edits.forEach(edit => {
    const target = cloned.find(r => r.id === edit.recordId);
    if (target) {
      (target as any)[edit.field] = edit.after;
    }
  });
  return cloned;
}

/**
 * Explicit 1-to-1 Provenance Mapping from ERROR_IRIS_DATASET (101~120) to ORIGINAL_IRIS_DATASET (1~150).
 */
export const ERROR_TO_ORIGINAL_ID_MAP: Record<number, number> = {
  101: 1,
  102: 2,
  103: 3,
  104: 4,
  105: 5,
  106: 6,
  107: 18,
  108: 51,
  109: 52,
  110: 53,
  111: 54,
  112: 55,
  113: 101,
  114: 102,
  115: 103,
  116: 104,
  117: 105,
  118: 106,
  119: 107,
  120: 108,
};

/**
 * 12 educational error records in ERROR_IRIS_DATASET and the specific field containing the error.
 * Normal records (110, 111, 113, 116, 117, 118, 119, 120) are excluded since they are identical to originals.
 */
export const ERROR_RECORD_FIELD_MAP: Record<number, keyof Omit<ErrorIrisRecord, 'id'>> = {
  101: 'sepalLength',
  102: 'petalWidth',
  103: 'sepalLength',
  104: 'petalLength',
  105: 'species',
  106: 'species',
  107: 'sepalLength',
  108: 'sepalWidth',
  109: 'species',
  112: 'petalWidth',
  114: 'species',
  115: 'petalLength',
};

/**
 * Creates a 150-record dataset based on ORIGINAL_IRIS_DATASET with the 12 educational errors injected
 * into their corresponding original rows. The 8 normal records in ERROR_IRIS_DATASET are not injected
 * as they are already identical to their original counterparts.
 * Maintains original row IDs (1~150) and always returns exactly 150 items.
 */
export function createCorruptedIrisDataset(): ErrorIrisRecord[] {
  const corrupted: ErrorIrisRecord[] = cloneDataset(ORIGINAL_IRIS_DATASET) as any[];

  Object.entries(ERROR_RECORD_FIELD_MAP).forEach(([errIdStr, field]) => {
    const errorId = Number(errIdStr);
    const originalId = ERROR_TO_ORIGINAL_ID_MAP[errorId];
    if (!originalId) return;

    const errorSource = ERROR_IRIS_DATASET.find(r => r.id === errorId);
    const targetRow = corrupted.find(r => r.id === originalId);

    if (errorSource && targetRow) {
      (targetRow as any)[field] = (errorSource as any)[field];
    }
  });

  return corrupted;
}

/**
 * Creates the student's 150-record Prepared Dataset by starting with the 150 Corrupted Dataset
 * and applying the student's edits (module04Edits).
 * - Maps edit.recordId (101~120) to the corresponding original ID (1~150).
 * - Unedited errors remain corrupted as in the corrupted dataset.
 * - Edited errors reflect the student's actual values (whether correct or flawed).
 * - Always returns exactly 150 items.
 */
export function createPreparedIrisDataset(
  module04Edits: Array<{ recordId: number; field: string; after: any }> = []
): ErrorIrisRecord[] {
  const dataset = createCorruptedIrisDataset();
  if (!module04Edits || module04Edits.length === 0) {
    return dataset;
  }

  module04Edits.forEach(edit => {
    const targetOriginalId = ERROR_TO_ORIGINAL_ID_MAP[edit.recordId] ?? edit.recordId;
    const targetRow = dataset.find(r => r.id === targetOriginalId);
    if (targetRow) {
      (targetRow as any)[edit.field] = edit.after;
    }
  });

  return dataset;
}

export const CANONICAL_SPECIES_SET = new Set<string>(['Iris-setosa', 'Iris-versicolor', 'Iris-virginica']);

export interface UsableIrisRecordsResult<T = ErrorIrisRecord> {
  usableData: T[];
  excludedData: {
    record: ErrorIrisRecord;
    reasons: string[];
  }[];
  totalCount: number;
  usableCount: number;
  excludedCount: number;
}

/**
 * Filters a dataset for records that can be safely computed in an algorithm.
 * Strictly excludes unusable records without modifying/auto-correcting any values.
 * - For numeric features: requires typeof === 'number' && Number.isFinite(value)
 * - For species (if requireCanonicalSpecies === true): requires species to be in ['Iris-setosa', 'Iris-versicolor', 'Iris-virginica']
 */
export function getUsableIrisRecords(
  dataset: ErrorIrisRecord[],
  requiredFeatures: Array<'sepalLength' | 'sepalWidth' | 'petalLength' | 'petalWidth'> = [],
  requireCanonicalSpecies: boolean = false
): UsableIrisRecordsResult {
  const usableData: ErrorIrisRecord[] = [];
  const excludedData: { record: ErrorIrisRecord; reasons: string[] }[] = [];

  for (const record of dataset) {
    const reasons: string[] = [];

    // Check required numeric features
    for (const feat of requiredFeatures) {
      const val = record[feat];
      if (typeof val !== 'number' || !Number.isFinite(val)) {
        reasons.push(`${feat}: 유효한 수치 아님(${val})`);
      }
    }

    // Check canonical species if required
    if (requireCanonicalSpecies) {
      if (!CANONICAL_SPECIES_SET.has(record.species)) {
        reasons.push(`비표준 품종 라벨(${record.species})`);
      }
    }

    if (reasons.length === 0) {
      usableData.push(record);
    } else {
      excludedData.push({ record, reasons });
    }
  }

  return {
    usableData,
    excludedData,
    totalCount: dataset.length,
    usableCount: usableData.length,
    excludedCount: excludedData.length,
  };
}
