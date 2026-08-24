import type { IrisRecord, DatasetMetadata, ErrorIrisRecord, ErrorIrisAnswer, IrisSpecies } from '../types/iris';

export const SPECIES_MAP: Record<IrisSpecies, { korean: string; english: string }> = {
  'Iris-setosa': { korean: '세토사', english: 'Iris-setosa' },
  'Iris-versicolor': { korean: '버시컬러', english: 'Iris-versicolor' },
  'Iris-virginica': { korean: '버지니카', english: 'Iris-virginica' },
};

export const IRIS_METADATA: DatasetMetadata = {
  name: 'Iris Species',
  source: 'UCI Machine Learning Repository / Kaggle mirror',
  description: '붓꽃 3개 품종(세토사, 버시컬러, 버지니카)의 꽃받침과 꽃잎 측정 데이터',
  isSynthetic: false,
  license: 'CC0: Public Domain',
  totalRows: 150,
  speciesList: [
    { key: 'Iris-setosa', korean: '세토사', count: 50 },
    { key: 'Iris-versicolor', korean: '버시컬러', count: 50 },
    { key: 'Iris-virginica', korean: '버지니카', count: 50 },
  ],
};

// 원본 정상 데이터셋 (150개)
export const ORIGINAL_IRIS_DATASET: IrisRecord[] = [
  {
    "id": 1,
    "sepalLength": 5.1,
    "sepalWidth": 3.5,
    "petalLength": 1.4,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 2,
    "sepalLength": 4.9,
    "sepalWidth": 3,
    "petalLength": 1.4,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 3,
    "sepalLength": 4.7,
    "sepalWidth": 3.2,
    "petalLength": 1.3,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 4,
    "sepalLength": 4.6,
    "sepalWidth": 3.1,
    "petalLength": 1.5,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 5,
    "sepalLength": 5,
    "sepalWidth": 3.6,
    "petalLength": 1.4,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 6,
    "sepalLength": 5.4,
    "sepalWidth": 3.9,
    "petalLength": 1.7,
    "petalWidth": 0.4,
    "species": "Iris-setosa"
  },
  {
    "id": 7,
    "sepalLength": 4.6,
    "sepalWidth": 3.4,
    "petalLength": 1.4,
    "petalWidth": 0.3,
    "species": "Iris-setosa"
  },
  {
    "id": 8,
    "sepalLength": 5,
    "sepalWidth": 3.4,
    "petalLength": 1.5,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 9,
    "sepalLength": 4.4,
    "sepalWidth": 2.9,
    "petalLength": 1.4,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 10,
    "sepalLength": 4.9,
    "sepalWidth": 3.1,
    "petalLength": 1.5,
    "petalWidth": 0.1,
    "species": "Iris-setosa"
  },
  {
    "id": 11,
    "sepalLength": 5.4,
    "sepalWidth": 3.7,
    "petalLength": 1.5,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 12,
    "sepalLength": 4.8,
    "sepalWidth": 3.4,
    "petalLength": 1.6,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 13,
    "sepalLength": 4.8,
    "sepalWidth": 3,
    "petalLength": 1.4,
    "petalWidth": 0.1,
    "species": "Iris-setosa"
  },
  {
    "id": 14,
    "sepalLength": 4.3,
    "sepalWidth": 3,
    "petalLength": 1.1,
    "petalWidth": 0.1,
    "species": "Iris-setosa"
  },
  {
    "id": 15,
    "sepalLength": 5.8,
    "sepalWidth": 4,
    "petalLength": 1.2,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 16,
    "sepalLength": 5.7,
    "sepalWidth": 4.4,
    "petalLength": 1.5,
    "petalWidth": 0.4,
    "species": "Iris-setosa"
  },
  {
    "id": 17,
    "sepalLength": 5.4,
    "sepalWidth": 3.9,
    "petalLength": 1.3,
    "petalWidth": 0.4,
    "species": "Iris-setosa"
  },
  {
    "id": 18,
    "sepalLength": 5.1,
    "sepalWidth": 3.5,
    "petalLength": 1.4,
    "petalWidth": 0.3,
    "species": "Iris-setosa"
  },
  {
    "id": 19,
    "sepalLength": 5.7,
    "sepalWidth": 3.8,
    "petalLength": 1.7,
    "petalWidth": 0.3,
    "species": "Iris-setosa"
  },
  {
    "id": 20,
    "sepalLength": 5.1,
    "sepalWidth": 3.8,
    "petalLength": 1.5,
    "petalWidth": 0.3,
    "species": "Iris-setosa"
  },
  {
    "id": 21,
    "sepalLength": 5.4,
    "sepalWidth": 3.4,
    "petalLength": 1.7,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 22,
    "sepalLength": 5.1,
    "sepalWidth": 3.7,
    "petalLength": 1.5,
    "petalWidth": 0.4,
    "species": "Iris-setosa"
  },
  {
    "id": 23,
    "sepalLength": 4.6,
    "sepalWidth": 3.6,
    "petalLength": 1,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 24,
    "sepalLength": 5.1,
    "sepalWidth": 3.3,
    "petalLength": 1.7,
    "petalWidth": 0.5,
    "species": "Iris-setosa"
  },
  {
    "id": 25,
    "sepalLength": 4.8,
    "sepalWidth": 3.4,
    "petalLength": 1.9,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 26,
    "sepalLength": 5,
    "sepalWidth": 3,
    "petalLength": 1.6,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 27,
    "sepalLength": 5,
    "sepalWidth": 3.4,
    "petalLength": 1.6,
    "petalWidth": 0.4,
    "species": "Iris-setosa"
  },
  {
    "id": 28,
    "sepalLength": 5.2,
    "sepalWidth": 3.5,
    "petalLength": 1.5,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 29,
    "sepalLength": 5.2,
    "sepalWidth": 3.4,
    "petalLength": 1.4,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 30,
    "sepalLength": 4.7,
    "sepalWidth": 3.2,
    "petalLength": 1.6,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 31,
    "sepalLength": 4.8,
    "sepalWidth": 3.1,
    "petalLength": 1.6,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 32,
    "sepalLength": 5.4,
    "sepalWidth": 3.4,
    "petalLength": 1.5,
    "petalWidth": 0.4,
    "species": "Iris-setosa"
  },
  {
    "id": 33,
    "sepalLength": 5.2,
    "sepalWidth": 4.1,
    "petalLength": 1.5,
    "petalWidth": 0.1,
    "species": "Iris-setosa"
  },
  {
    "id": 34,
    "sepalLength": 5.5,
    "sepalWidth": 4.2,
    "petalLength": 1.4,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 35,
    "sepalLength": 4.9,
    "sepalWidth": 3.1,
    "petalLength": 1.5,
    "petalWidth": 0.1,
    "species": "Iris-setosa"
  },
  {
    "id": 36,
    "sepalLength": 5,
    "sepalWidth": 3.2,
    "petalLength": 1.2,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 37,
    "sepalLength": 5.5,
    "sepalWidth": 3.5,
    "petalLength": 1.3,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 38,
    "sepalLength": 4.9,
    "sepalWidth": 3.1,
    "petalLength": 1.5,
    "petalWidth": 0.1,
    "species": "Iris-setosa"
  },
  {
    "id": 39,
    "sepalLength": 4.4,
    "sepalWidth": 3,
    "petalLength": 1.3,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 40,
    "sepalLength": 5.1,
    "sepalWidth": 3.4,
    "petalLength": 1.5,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 41,
    "sepalLength": 5,
    "sepalWidth": 3.5,
    "petalLength": 1.3,
    "petalWidth": 0.3,
    "species": "Iris-setosa"
  },
  {
    "id": 42,
    "sepalLength": 4.5,
    "sepalWidth": 2.3,
    "petalLength": 1.3,
    "petalWidth": 0.3,
    "species": "Iris-setosa"
  },
  {
    "id": 43,
    "sepalLength": 4.4,
    "sepalWidth": 3.2,
    "petalLength": 1.3,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 44,
    "sepalLength": 5,
    "sepalWidth": 3.5,
    "petalLength": 1.6,
    "petalWidth": 0.6,
    "species": "Iris-setosa"
  },
  {
    "id": 45,
    "sepalLength": 5.1,
    "sepalWidth": 3.8,
    "petalLength": 1.9,
    "petalWidth": 0.4,
    "species": "Iris-setosa"
  },
  {
    "id": 46,
    "sepalLength": 4.8,
    "sepalWidth": 3,
    "petalLength": 1.4,
    "petalWidth": 0.3,
    "species": "Iris-setosa"
  },
  {
    "id": 47,
    "sepalLength": 5.1,
    "sepalWidth": 3.8,
    "petalLength": 1.6,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 48,
    "sepalLength": 4.6,
    "sepalWidth": 3.2,
    "petalLength": 1.4,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 49,
    "sepalLength": 5.3,
    "sepalWidth": 3.7,
    "petalLength": 1.5,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 50,
    "sepalLength": 5,
    "sepalWidth": 3.3,
    "petalLength": 1.4,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 51,
    "sepalLength": 7,
    "sepalWidth": 3.2,
    "petalLength": 4.7,
    "petalWidth": 1.4,
    "species": "Iris-versicolor"
  },
  {
    "id": 52,
    "sepalLength": 6.4,
    "sepalWidth": 3.2,
    "petalLength": 4.5,
    "petalWidth": 1.5,
    "species": "Iris-versicolor"
  },
  {
    "id": 53,
    "sepalLength": 6.9,
    "sepalWidth": 3.1,
    "petalLength": 4.9,
    "petalWidth": 1.5,
    "species": "Iris-versicolor"
  },
  {
    "id": 54,
    "sepalLength": 5.5,
    "sepalWidth": 2.3,
    "petalLength": 4,
    "petalWidth": 1.3,
    "species": "Iris-versicolor"
  },
  {
    "id": 55,
    "sepalLength": 6.5,
    "sepalWidth": 2.8,
    "petalLength": 4.6,
    "petalWidth": 1.5,
    "species": "Iris-versicolor"
  },
  {
    "id": 56,
    "sepalLength": 5.7,
    "sepalWidth": 2.8,
    "petalLength": 4.5,
    "petalWidth": 1.3,
    "species": "Iris-versicolor"
  },
  {
    "id": 57,
    "sepalLength": 6.3,
    "sepalWidth": 3.3,
    "petalLength": 4.7,
    "petalWidth": 1.6,
    "species": "Iris-versicolor"
  },
  {
    "id": 58,
    "sepalLength": 4.9,
    "sepalWidth": 2.4,
    "petalLength": 3.3,
    "petalWidth": 1,
    "species": "Iris-versicolor"
  },
  {
    "id": 59,
    "sepalLength": 6.6,
    "sepalWidth": 2.9,
    "petalLength": 4.6,
    "petalWidth": 1.3,
    "species": "Iris-versicolor"
  },
  {
    "id": 60,
    "sepalLength": 5.2,
    "sepalWidth": 2.7,
    "petalLength": 3.9,
    "petalWidth": 1.4,
    "species": "Iris-versicolor"
  },
  {
    "id": 61,
    "sepalLength": 5,
    "sepalWidth": 2,
    "petalLength": 3.5,
    "petalWidth": 1,
    "species": "Iris-versicolor"
  },
  {
    "id": 62,
    "sepalLength": 5.9,
    "sepalWidth": 3,
    "petalLength": 4.2,
    "petalWidth": 1.5,
    "species": "Iris-versicolor"
  },
  {
    "id": 63,
    "sepalLength": 6,
    "sepalWidth": 2.2,
    "petalLength": 4,
    "petalWidth": 1,
    "species": "Iris-versicolor"
  },
  {
    "id": 64,
    "sepalLength": 6.1,
    "sepalWidth": 2.9,
    "petalLength": 4.7,
    "petalWidth": 1.4,
    "species": "Iris-versicolor"
  },
  {
    "id": 65,
    "sepalLength": 5.6,
    "sepalWidth": 2.9,
    "petalLength": 3.6,
    "petalWidth": 1.3,
    "species": "Iris-versicolor"
  },
  {
    "id": 66,
    "sepalLength": 6.7,
    "sepalWidth": 3.1,
    "petalLength": 4.4,
    "petalWidth": 1.4,
    "species": "Iris-versicolor"
  },
  {
    "id": 67,
    "sepalLength": 5.6,
    "sepalWidth": 3,
    "petalLength": 4.5,
    "petalWidth": 1.5,
    "species": "Iris-versicolor"
  },
  {
    "id": 68,
    "sepalLength": 5.8,
    "sepalWidth": 2.7,
    "petalLength": 4.1,
    "petalWidth": 1,
    "species": "Iris-versicolor"
  },
  {
    "id": 69,
    "sepalLength": 6.2,
    "sepalWidth": 2.2,
    "petalLength": 4.5,
    "petalWidth": 1.5,
    "species": "Iris-versicolor"
  },
  {
    "id": 70,
    "sepalLength": 5.6,
    "sepalWidth": 2.5,
    "petalLength": 3.9,
    "petalWidth": 1.1,
    "species": "Iris-versicolor"
  },
  {
    "id": 71,
    "sepalLength": 5.9,
    "sepalWidth": 3.2,
    "petalLength": 4.8,
    "petalWidth": 1.8,
    "species": "Iris-versicolor"
  },
  {
    "id": 72,
    "sepalLength": 6.1,
    "sepalWidth": 2.8,
    "petalLength": 4,
    "petalWidth": 1.3,
    "species": "Iris-versicolor"
  },
  {
    "id": 73,
    "sepalLength": 6.3,
    "sepalWidth": 2.5,
    "petalLength": 4.9,
    "petalWidth": 1.5,
    "species": "Iris-versicolor"
  },
  {
    "id": 74,
    "sepalLength": 6.1,
    "sepalWidth": 2.8,
    "petalLength": 4.7,
    "petalWidth": 1.2,
    "species": "Iris-versicolor"
  },
  {
    "id": 75,
    "sepalLength": 6.4,
    "sepalWidth": 2.9,
    "petalLength": 4.3,
    "petalWidth": 1.3,
    "species": "Iris-versicolor"
  },
  {
    "id": 76,
    "sepalLength": 6.6,
    "sepalWidth": 3,
    "petalLength": 4.4,
    "petalWidth": 1.4,
    "species": "Iris-versicolor"
  },
  {
    "id": 77,
    "sepalLength": 6.8,
    "sepalWidth": 2.8,
    "petalLength": 4.8,
    "petalWidth": 1.4,
    "species": "Iris-versicolor"
  },
  {
    "id": 78,
    "sepalLength": 6.7,
    "sepalWidth": 3,
    "petalLength": 5,
    "petalWidth": 1.7,
    "species": "Iris-versicolor"
  },
  {
    "id": 79,
    "sepalLength": 6,
    "sepalWidth": 2.9,
    "petalLength": 4.5,
    "petalWidth": 1.5,
    "species": "Iris-versicolor"
  },
  {
    "id": 80,
    "sepalLength": 5.7,
    "sepalWidth": 2.6,
    "petalLength": 3.5,
    "petalWidth": 1,
    "species": "Iris-versicolor"
  },
  {
    "id": 81,
    "sepalLength": 5.5,
    "sepalWidth": 2.4,
    "petalLength": 3.8,
    "petalWidth": 1.1,
    "species": "Iris-versicolor"
  },
  {
    "id": 82,
    "sepalLength": 5.5,
    "sepalWidth": 2.4,
    "petalLength": 3.7,
    "petalWidth": 1,
    "species": "Iris-versicolor"
  },
  {
    "id": 83,
    "sepalLength": 5.8,
    "sepalWidth": 2.7,
    "petalLength": 3.9,
    "petalWidth": 1.2,
    "species": "Iris-versicolor"
  },
  {
    "id": 84,
    "sepalLength": 6,
    "sepalWidth": 2.7,
    "petalLength": 5.1,
    "petalWidth": 1.6,
    "species": "Iris-versicolor"
  },
  {
    "id": 85,
    "sepalLength": 5.4,
    "sepalWidth": 3,
    "petalLength": 4.5,
    "petalWidth": 1.5,
    "species": "Iris-versicolor"
  },
  {
    "id": 86,
    "sepalLength": 6,
    "sepalWidth": 3.4,
    "petalLength": 4.5,
    "petalWidth": 1.6,
    "species": "Iris-versicolor"
  },
  {
    "id": 87,
    "sepalLength": 6.7,
    "sepalWidth": 3.1,
    "petalLength": 4.7,
    "petalWidth": 1.5,
    "species": "Iris-versicolor"
  },
  {
    "id": 88,
    "sepalLength": 6.3,
    "sepalWidth": 2.3,
    "petalLength": 4.4,
    "petalWidth": 1.3,
    "species": "Iris-versicolor"
  },
  {
    "id": 89,
    "sepalLength": 5.6,
    "sepalWidth": 3,
    "petalLength": 4.1,
    "petalWidth": 1.3,
    "species": "Iris-versicolor"
  },
  {
    "id": 90,
    "sepalLength": 5.5,
    "sepalWidth": 2.5,
    "petalLength": 4,
    "petalWidth": 1.3,
    "species": "Iris-versicolor"
  },
  {
    "id": 91,
    "sepalLength": 5.5,
    "sepalWidth": 2.6,
    "petalLength": 4.4,
    "petalWidth": 1.2,
    "species": "Iris-versicolor"
  },
  {
    "id": 92,
    "sepalLength": 6.1,
    "sepalWidth": 3,
    "petalLength": 4.6,
    "petalWidth": 1.4,
    "species": "Iris-versicolor"
  },
  {
    "id": 93,
    "sepalLength": 5.8,
    "sepalWidth": 2.6,
    "petalLength": 4,
    "petalWidth": 1.2,
    "species": "Iris-versicolor"
  },
  {
    "id": 94,
    "sepalLength": 5,
    "sepalWidth": 2.3,
    "petalLength": 3.3,
    "petalWidth": 1,
    "species": "Iris-versicolor"
  },
  {
    "id": 95,
    "sepalLength": 5.6,
    "sepalWidth": 2.7,
    "petalLength": 4.2,
    "petalWidth": 1.3,
    "species": "Iris-versicolor"
  },
  {
    "id": 96,
    "sepalLength": 5.7,
    "sepalWidth": 3,
    "petalLength": 4.2,
    "petalWidth": 1.2,
    "species": "Iris-versicolor"
  },
  {
    "id": 97,
    "sepalLength": 5.7,
    "sepalWidth": 2.9,
    "petalLength": 4.2,
    "petalWidth": 1.3,
    "species": "Iris-versicolor"
  },
  {
    "id": 98,
    "sepalLength": 6.2,
    "sepalWidth": 2.9,
    "petalLength": 4.3,
    "petalWidth": 1.3,
    "species": "Iris-versicolor"
  },
  {
    "id": 99,
    "sepalLength": 5.1,
    "sepalWidth": 2.5,
    "petalLength": 3,
    "petalWidth": 1.1,
    "species": "Iris-versicolor"
  },
  {
    "id": 100,
    "sepalLength": 5.7,
    "sepalWidth": 2.8,
    "petalLength": 4.1,
    "petalWidth": 1.3,
    "species": "Iris-versicolor"
  },
  {
    "id": 101,
    "sepalLength": 6.3,
    "sepalWidth": 3.3,
    "petalLength": 6,
    "petalWidth": 2.5,
    "species": "Iris-virginica"
  },
  {
    "id": 102,
    "sepalLength": 5.8,
    "sepalWidth": 2.7,
    "petalLength": 5.1,
    "petalWidth": 1.9,
    "species": "Iris-virginica"
  },
  {
    "id": 103,
    "sepalLength": 7.1,
    "sepalWidth": 3,
    "petalLength": 5.9,
    "petalWidth": 2.1,
    "species": "Iris-virginica"
  },
  {
    "id": 104,
    "sepalLength": 6.3,
    "sepalWidth": 2.9,
    "petalLength": 5.6,
    "petalWidth": 1.8,
    "species": "Iris-virginica"
  },
  {
    "id": 105,
    "sepalLength": 6.5,
    "sepalWidth": 3,
    "petalLength": 5.8,
    "petalWidth": 2.2,
    "species": "Iris-virginica"
  },
  {
    "id": 106,
    "sepalLength": 7.6,
    "sepalWidth": 3,
    "petalLength": 6.6,
    "petalWidth": 2.1,
    "species": "Iris-virginica"
  },
  {
    "id": 107,
    "sepalLength": 4.9,
    "sepalWidth": 2.5,
    "petalLength": 4.5,
    "petalWidth": 1.7,
    "species": "Iris-virginica"
  },
  {
    "id": 108,
    "sepalLength": 7.3,
    "sepalWidth": 2.9,
    "petalLength": 6.3,
    "petalWidth": 1.8,
    "species": "Iris-virginica"
  },
  {
    "id": 109,
    "sepalLength": 6.7,
    "sepalWidth": 2.5,
    "petalLength": 5.8,
    "petalWidth": 1.8,
    "species": "Iris-virginica"
  },
  {
    "id": 110,
    "sepalLength": 7.2,
    "sepalWidth": 3.6,
    "petalLength": 6.1,
    "petalWidth": 2.5,
    "species": "Iris-virginica"
  },
  {
    "id": 111,
    "sepalLength": 6.5,
    "sepalWidth": 3.2,
    "petalLength": 5.1,
    "petalWidth": 2,
    "species": "Iris-virginica"
  },
  {
    "id": 112,
    "sepalLength": 6.4,
    "sepalWidth": 2.7,
    "petalLength": 5.3,
    "petalWidth": 1.9,
    "species": "Iris-virginica"
  },
  {
    "id": 113,
    "sepalLength": 6.8,
    "sepalWidth": 3,
    "petalLength": 5.5,
    "petalWidth": 2.1,
    "species": "Iris-virginica"
  },
  {
    "id": 114,
    "sepalLength": 5.7,
    "sepalWidth": 2.5,
    "petalLength": 5,
    "petalWidth": 2,
    "species": "Iris-virginica"
  },
  {
    "id": 115,
    "sepalLength": 5.8,
    "sepalWidth": 2.8,
    "petalLength": 5.1,
    "petalWidth": 2.4,
    "species": "Iris-virginica"
  },
  {
    "id": 116,
    "sepalLength": 6.4,
    "sepalWidth": 3.2,
    "petalLength": 5.3,
    "petalWidth": 2.3,
    "species": "Iris-virginica"
  },
  {
    "id": 117,
    "sepalLength": 6.5,
    "sepalWidth": 3,
    "petalLength": 5.5,
    "petalWidth": 1.8,
    "species": "Iris-virginica"
  },
  {
    "id": 118,
    "sepalLength": 7.7,
    "sepalWidth": 3.8,
    "petalLength": 6.7,
    "petalWidth": 2.2,
    "species": "Iris-virginica"
  },
  {
    "id": 119,
    "sepalLength": 7.7,
    "sepalWidth": 2.6,
    "petalLength": 6.9,
    "petalWidth": 2.3,
    "species": "Iris-virginica"
  },
  {
    "id": 120,
    "sepalLength": 6,
    "sepalWidth": 2.2,
    "petalLength": 5,
    "petalWidth": 1.5,
    "species": "Iris-virginica"
  },
  {
    "id": 121,
    "sepalLength": 6.9,
    "sepalWidth": 3.2,
    "petalLength": 5.7,
    "petalWidth": 2.3,
    "species": "Iris-virginica"
  },
  {
    "id": 122,
    "sepalLength": 5.6,
    "sepalWidth": 2.8,
    "petalLength": 4.9,
    "petalWidth": 2,
    "species": "Iris-virginica"
  },
  {
    "id": 123,
    "sepalLength": 7.7,
    "sepalWidth": 2.8,
    "petalLength": 6.7,
    "petalWidth": 2,
    "species": "Iris-virginica"
  },
  {
    "id": 124,
    "sepalLength": 6.3,
    "sepalWidth": 2.7,
    "petalLength": 4.9,
    "petalWidth": 1.8,
    "species": "Iris-virginica"
  },
  {
    "id": 125,
    "sepalLength": 6.7,
    "sepalWidth": 3.3,
    "petalLength": 5.7,
    "petalWidth": 2.1,
    "species": "Iris-virginica"
  },
  {
    "id": 126,
    "sepalLength": 7.2,
    "sepalWidth": 3.2,
    "petalLength": 6,
    "petalWidth": 1.8,
    "species": "Iris-virginica"
  },
  {
    "id": 127,
    "sepalLength": 6.2,
    "sepalWidth": 2.8,
    "petalLength": 4.8,
    "petalWidth": 1.8,
    "species": "Iris-virginica"
  },
  {
    "id": 128,
    "sepalLength": 6.1,
    "sepalWidth": 3,
    "petalLength": 4.9,
    "petalWidth": 1.8,
    "species": "Iris-virginica"
  },
  {
    "id": 129,
    "sepalLength": 6.4,
    "sepalWidth": 2.8,
    "petalLength": 5.6,
    "petalWidth": 2.1,
    "species": "Iris-virginica"
  },
  {
    "id": 130,
    "sepalLength": 7.2,
    "sepalWidth": 3,
    "petalLength": 5.8,
    "petalWidth": 1.6,
    "species": "Iris-virginica"
  },
  {
    "id": 131,
    "sepalLength": 7.4,
    "sepalWidth": 2.8,
    "petalLength": 6.1,
    "petalWidth": 1.9,
    "species": "Iris-virginica"
  },
  {
    "id": 132,
    "sepalLength": 7.9,
    "sepalWidth": 3.8,
    "petalLength": 6.4,
    "petalWidth": 2,
    "species": "Iris-virginica"
  },
  {
    "id": 133,
    "sepalLength": 6.4,
    "sepalWidth": 2.8,
    "petalLength": 5.6,
    "petalWidth": 2.2,
    "species": "Iris-virginica"
  },
  {
    "id": 134,
    "sepalLength": 6.3,
    "sepalWidth": 2.8,
    "petalLength": 5.1,
    "petalWidth": 1.5,
    "species": "Iris-virginica"
  },
  {
    "id": 135,
    "sepalLength": 6.1,
    "sepalWidth": 2.6,
    "petalLength": 5.6,
    "petalWidth": 1.4,
    "species": "Iris-virginica"
  },
  {
    "id": 136,
    "sepalLength": 7.7,
    "sepalWidth": 3,
    "petalLength": 6.1,
    "petalWidth": 2.3,
    "species": "Iris-virginica"
  },
  {
    "id": 137,
    "sepalLength": 6.3,
    "sepalWidth": 3.4,
    "petalLength": 5.6,
    "petalWidth": 2.4,
    "species": "Iris-virginica"
  },
  {
    "id": 138,
    "sepalLength": 6.4,
    "sepalWidth": 3.1,
    "petalLength": 5.5,
    "petalWidth": 1.8,
    "species": "Iris-virginica"
  },
  {
    "id": 139,
    "sepalLength": 6,
    "sepalWidth": 3,
    "petalLength": 4.8,
    "petalWidth": 1.8,
    "species": "Iris-virginica"
  },
  {
    "id": 140,
    "sepalLength": 6.9,
    "sepalWidth": 3.1,
    "petalLength": 5.4,
    "petalWidth": 2.1,
    "species": "Iris-virginica"
  },
  {
    "id": 141,
    "sepalLength": 6.7,
    "sepalWidth": 3.1,
    "petalLength": 5.6,
    "petalWidth": 2.4,
    "species": "Iris-virginica"
  },
  {
    "id": 142,
    "sepalLength": 6.9,
    "sepalWidth": 3.1,
    "petalLength": 5.1,
    "petalWidth": 2.3,
    "species": "Iris-virginica"
  },
  {
    "id": 143,
    "sepalLength": 5.8,
    "sepalWidth": 2.7,
    "petalLength": 5.1,
    "petalWidth": 1.9,
    "species": "Iris-virginica"
  },
  {
    "id": 144,
    "sepalLength": 6.8,
    "sepalWidth": 3.2,
    "petalLength": 5.9,
    "petalWidth": 2.3,
    "species": "Iris-virginica"
  },
  {
    "id": 145,
    "sepalLength": 6.7,
    "sepalWidth": 3.3,
    "petalLength": 5.7,
    "petalWidth": 2.5,
    "species": "Iris-virginica"
  },
  {
    "id": 146,
    "sepalLength": 6.7,
    "sepalWidth": 3,
    "petalLength": 5.2,
    "petalWidth": 2.3,
    "species": "Iris-virginica"
  },
  {
    "id": 147,
    "sepalLength": 6.3,
    "sepalWidth": 2.5,
    "petalLength": 5,
    "petalWidth": 1.9,
    "species": "Iris-virginica"
  },
  {
    "id": 148,
    "sepalLength": 6.5,
    "sepalWidth": 3,
    "petalLength": 5.2,
    "petalWidth": 2,
    "species": "Iris-virginica"
  },
  {
    "id": 149,
    "sepalLength": 6.2,
    "sepalWidth": 3.4,
    "petalLength": 5.4,
    "petalWidth": 2.3,
    "species": "Iris-virginica"
  },
  {
    "id": 150,
    "sepalLength": 5.9,
    "sepalWidth": 3,
    "petalLength": 5.1,
    "petalWidth": 1.8,
    "species": "Iris-virginica"
  }
];

// 데이터 전처리 교육용 오류 데이터셋 (20개)
export const ERROR_IRIS_DATASET: ErrorIrisRecord[] = [
  {
    "id": 101,
    "sepalLength": null,
    "sepalWidth": 3.5,
    "petalLength": 1.4,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 102,
    "sepalLength": 4.9,
    "sepalWidth": 3,
    "petalLength": 1.4,
    "petalWidth": null,
    "species": "Iris-setosa"
  },
  {
    "id": 103,
    "sepalLength": 50,
    "sepalWidth": 3.2,
    "petalLength": 1.3,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 104,
    "sepalLength": 4.6,
    "sepalWidth": 3.1,
    "petalLength": 30,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 105,
    "sepalLength": 5,
    "sepalWidth": 3.6,
    "petalLength": 1.4,
    "petalWidth": 0.2,
    "species": "setosa"
  },
  {
    "id": 106,
    "sepalLength": 5.4,
    "sepalWidth": 3.9,
    "petalLength": 1.7,
    "petalWidth": 0.4,
    "species": "Setosa"
  },
  {
    "id": 107,
    "sepalLength": "5.1cm",
    "sepalWidth": 3.5,
    "petalLength": 1.4,
    "petalWidth": 0.3,
    "species": "Iris-setosa"
  },
  {
    "id": 108,
    "sepalLength": 7,
    "sepalWidth": null,
    "petalLength": 4.7,
    "petalWidth": 1.4,
    "species": "Iris-versicolor"
  },
  {
    "id": 109,
    "sepalLength": 6.4,
    "sepalWidth": 3.2,
    "petalLength": 4.5,
    "petalWidth": 1.5,
    "species": "versicolor"
  },
  {
    "id": 110,
    "sepalLength": 6.9,
    "sepalWidth": 3.1,
    "petalLength": 4.9,
    "petalWidth": 1.5,
    "species": "Iris-versicolor"
  },
  {
    "id": 111,
    "sepalLength": 5.5,
    "sepalWidth": 2.3,
    "petalLength": 4,
    "petalWidth": 1.3,
    "species": "Iris-versicolor"
  },
  {
    "id": 112,
    "sepalLength": 6.5,
    "sepalWidth": 2.8,
    "petalLength": 4.6,
    "petalWidth": "1.5cm",
    "species": "Iris-versicolor"
  },
  {
    "id": 113,
    "sepalLength": 6.3,
    "sepalWidth": 3.3,
    "petalLength": 6,
    "petalWidth": 2.5,
    "species": "Iris-virginica"
  },
  {
    "id": 114,
    "sepalLength": 5.8,
    "sepalWidth": 2.7,
    "petalLength": 5.1,
    "petalWidth": 1.9,
    "species": "virginica"
  },
  {
    "id": 115,
    "sepalLength": 7.1,
    "sepalWidth": 3,
    "petalLength": null,
    "petalWidth": 2.1,
    "species": "Iris-virginica"
  },
  {
    "id": 116,
    "sepalLength": 6.3,
    "sepalWidth": 2.9,
    "petalLength": 5.6,
    "petalWidth": 1.8,
    "species": "Iris-virginica"
  },
  {
    "id": 117,
    "sepalLength": 6.5,
    "sepalWidth": 3,
    "petalLength": 5.8,
    "petalWidth": 2.2,
    "species": "Iris-virginica"
  },
  {
    "id": 118,
    "sepalLength": 7.6,
    "sepalWidth": 3,
    "petalLength": 6.6,
    "petalWidth": 2.1,
    "species": "Iris-virginica"
  },
  {
    "id": 119,
    "sepalLength": 4.9,
    "sepalWidth": 2.5,
    "petalLength": 4.5,
    "petalWidth": 1.7,
    "species": "Iris-virginica"
  },
  {
    "id": 120,
    "sepalLength": 7.3,
    "sepalWidth": 2.9,
    "petalLength": 6.3,
    "petalWidth": 1.8,
    "species": "Iris-virginica"
  }
];

// 전처리 오류 정답 및 추천 조치
export const ERROR_IRIS_ANSWERS: ErrorIrisAnswer[] = [
  {
    "recordId": 101,
    "field": "sepalLength",
    "issueType": "missing",
    "description": "꽃받침 길이(sepalLength) 값이 null(결측치)로 누락되어 있습니다.",
    "recommendedActions": [
      "해당 행 삭제",
      "전체 평균값(5.84cm)으로 대체",
      "전체 중앙값(5.80cm)으로 대체"
    ]
  },
  {
    "recordId": 102,
    "field": "petalWidth",
    "issueType": "missing",
    "description": "꽃잎 너비(petalWidth) 값이 null(결측치)로 누락되어 있습니다.",
    "recommendedActions": [
      "해당 행 삭제",
      "전체 평균값(1.20cm)으로 대체",
      "전체 중앙값(1.30cm)으로 대체"
    ]
  },
  {
    "recordId": 103,
    "field": "sepalLength",
    "issueType": "outlier",
    "description": "꽃받침 길이가 50.0cm로 일반적인 붓꽃 범위(4~8cm)를 크게 벗어난 이상치입니다.",
    "recommendedActions": [
      "측정 오류 데이터 제거",
      "정상 범위 내 표준값으로 수정"
    ]
  },
  {
    "recordId": 104,
    "field": "petalLength",
    "issueType": "outlier",
    "description": "꽃잎 길이가 30.0cm로 극단적인 이상치(Outlier)입니다.",
    "recommendedActions": [
      "이상치 데이터 삭제",
      "해당 변수 정밀 재측정 또는 대체"
    ]
  },
  {
    "recordId": 105,
    "field": "species",
    "issueType": "inconsistent",
    "description": "품종명이 'setosa'로 표기되어 정규 표준 표기('Iris-setosa')와 일치하지 않습니다.",
    "recommendedActions": [
      "'Iris-setosa'로 표기 통일"
    ]
  },
  {
    "recordId": 106,
    "field": "species",
    "issueType": "inconsistent",
    "description": "품종명이 'Setosa' 대소문자 표기 불일치 상태입니다.",
    "recommendedActions": [
      "'Iris-setosa'로 표준화"
    ]
  },
  {
    "recordId": 107,
    "field": "sepalLength",
    "issueType": "invalidType",
    "description": "수치형 변수이어야 할 꽃받침 길이에 '5.1cm' 단위 문자열이 포함되어 정수/실수 변환 오류를 유발합니다.",
    "recommendedActions": [
      "단위 'cm' 제거 후 숫자 5.1로 변환"
    ]
  },
  {
    "recordId": 108,
    "field": "sepalWidth",
    "issueType": "missing",
    "description": "꽃받침 너비(sepalWidth) 값이 비어 있습니다.",
    "recommendedActions": [
      "행 삭제 또는 평균값 대체"
    ]
  },
  {
    "recordId": 109,
    "field": "species",
    "issueType": "inconsistent",
    "description": "품종명이 'versicolor'로 표기 불일치가 존재합니다.",
    "recommendedActions": [
      "'Iris-versicolor'로 통일"
    ]
  },
  {
    "recordId": 112,
    "field": "petalWidth",
    "issueType": "invalidType",
    "description": "꽃잎 너비 필드에 '1.5cm' 문자열 타입이 포함되어 있습니다.",
    "recommendedActions": [
      "문자열 단위 제거 후 숫자 1.5로 파싱"
    ]
  },
  {
    "recordId": 114,
    "field": "species",
    "issueType": "inconsistent",
    "description": "품종명이 'virginica'로 표기되어 있습니다.",
    "recommendedActions": [
      "'Iris-virginica'로 통일"
    ]
  },
  {
    "recordId": 115,
    "field": "petalLength",
    "issueType": "missing",
    "description": "꽃잎 길이가 결측 상태입니다.",
    "recommendedActions": [
      "결측치 대체 또는 행 삭제"
    ]
  }
];

// 편향 데이터셋 (세토사 40, 버시컬러 8, 버지니카 2 = 총 50개)
export const BIASED_IRIS_DATASET: IrisRecord[] = [
  {
    "id": 1,
    "sepalLength": 5.1,
    "sepalWidth": 3.5,
    "petalLength": 1.4,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 2,
    "sepalLength": 4.9,
    "sepalWidth": 3,
    "petalLength": 1.4,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 3,
    "sepalLength": 4.7,
    "sepalWidth": 3.2,
    "petalLength": 1.3,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 4,
    "sepalLength": 4.6,
    "sepalWidth": 3.1,
    "petalLength": 1.5,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 5,
    "sepalLength": 5,
    "sepalWidth": 3.6,
    "petalLength": 1.4,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 6,
    "sepalLength": 5.4,
    "sepalWidth": 3.9,
    "petalLength": 1.7,
    "petalWidth": 0.4,
    "species": "Iris-setosa"
  },
  {
    "id": 7,
    "sepalLength": 4.6,
    "sepalWidth": 3.4,
    "petalLength": 1.4,
    "petalWidth": 0.3,
    "species": "Iris-setosa"
  },
  {
    "id": 8,
    "sepalLength": 5,
    "sepalWidth": 3.4,
    "petalLength": 1.5,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 9,
    "sepalLength": 4.4,
    "sepalWidth": 2.9,
    "petalLength": 1.4,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 10,
    "sepalLength": 4.9,
    "sepalWidth": 3.1,
    "petalLength": 1.5,
    "petalWidth": 0.1,
    "species": "Iris-setosa"
  },
  {
    "id": 11,
    "sepalLength": 5.4,
    "sepalWidth": 3.7,
    "petalLength": 1.5,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 12,
    "sepalLength": 4.8,
    "sepalWidth": 3.4,
    "petalLength": 1.6,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 13,
    "sepalLength": 4.8,
    "sepalWidth": 3,
    "petalLength": 1.4,
    "petalWidth": 0.1,
    "species": "Iris-setosa"
  },
  {
    "id": 14,
    "sepalLength": 4.3,
    "sepalWidth": 3,
    "petalLength": 1.1,
    "petalWidth": 0.1,
    "species": "Iris-setosa"
  },
  {
    "id": 15,
    "sepalLength": 5.8,
    "sepalWidth": 4,
    "petalLength": 1.2,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 16,
    "sepalLength": 5.7,
    "sepalWidth": 4.4,
    "petalLength": 1.5,
    "petalWidth": 0.4,
    "species": "Iris-setosa"
  },
  {
    "id": 17,
    "sepalLength": 5.4,
    "sepalWidth": 3.9,
    "petalLength": 1.3,
    "petalWidth": 0.4,
    "species": "Iris-setosa"
  },
  {
    "id": 18,
    "sepalLength": 5.1,
    "sepalWidth": 3.5,
    "petalLength": 1.4,
    "petalWidth": 0.3,
    "species": "Iris-setosa"
  },
  {
    "id": 19,
    "sepalLength": 5.7,
    "sepalWidth": 3.8,
    "petalLength": 1.7,
    "petalWidth": 0.3,
    "species": "Iris-setosa"
  },
  {
    "id": 20,
    "sepalLength": 5.1,
    "sepalWidth": 3.8,
    "petalLength": 1.5,
    "petalWidth": 0.3,
    "species": "Iris-setosa"
  },
  {
    "id": 21,
    "sepalLength": 5.4,
    "sepalWidth": 3.4,
    "petalLength": 1.7,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 22,
    "sepalLength": 5.1,
    "sepalWidth": 3.7,
    "petalLength": 1.5,
    "petalWidth": 0.4,
    "species": "Iris-setosa"
  },
  {
    "id": 23,
    "sepalLength": 4.6,
    "sepalWidth": 3.6,
    "petalLength": 1,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 24,
    "sepalLength": 5.1,
    "sepalWidth": 3.3,
    "petalLength": 1.7,
    "petalWidth": 0.5,
    "species": "Iris-setosa"
  },
  {
    "id": 25,
    "sepalLength": 4.8,
    "sepalWidth": 3.4,
    "petalLength": 1.9,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 26,
    "sepalLength": 5,
    "sepalWidth": 3,
    "petalLength": 1.6,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 27,
    "sepalLength": 5,
    "sepalWidth": 3.4,
    "petalLength": 1.6,
    "petalWidth": 0.4,
    "species": "Iris-setosa"
  },
  {
    "id": 28,
    "sepalLength": 5.2,
    "sepalWidth": 3.5,
    "petalLength": 1.5,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 29,
    "sepalLength": 5.2,
    "sepalWidth": 3.4,
    "petalLength": 1.4,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 30,
    "sepalLength": 4.7,
    "sepalWidth": 3.2,
    "petalLength": 1.6,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 31,
    "sepalLength": 4.8,
    "sepalWidth": 3.1,
    "petalLength": 1.6,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 32,
    "sepalLength": 5.4,
    "sepalWidth": 3.4,
    "petalLength": 1.5,
    "petalWidth": 0.4,
    "species": "Iris-setosa"
  },
  {
    "id": 33,
    "sepalLength": 5.2,
    "sepalWidth": 4.1,
    "petalLength": 1.5,
    "petalWidth": 0.1,
    "species": "Iris-setosa"
  },
  {
    "id": 34,
    "sepalLength": 5.5,
    "sepalWidth": 4.2,
    "petalLength": 1.4,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 35,
    "sepalLength": 4.9,
    "sepalWidth": 3.1,
    "petalLength": 1.5,
    "petalWidth": 0.1,
    "species": "Iris-setosa"
  },
  {
    "id": 36,
    "sepalLength": 5,
    "sepalWidth": 3.2,
    "petalLength": 1.2,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 37,
    "sepalLength": 5.5,
    "sepalWidth": 3.5,
    "petalLength": 1.3,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 38,
    "sepalLength": 4.9,
    "sepalWidth": 3.1,
    "petalLength": 1.5,
    "petalWidth": 0.1,
    "species": "Iris-setosa"
  },
  {
    "id": 39,
    "sepalLength": 4.4,
    "sepalWidth": 3,
    "petalLength": 1.3,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 40,
    "sepalLength": 5.1,
    "sepalWidth": 3.4,
    "petalLength": 1.5,
    "petalWidth": 0.2,
    "species": "Iris-setosa"
  },
  {
    "id": 51,
    "sepalLength": 7,
    "sepalWidth": 3.2,
    "petalLength": 4.7,
    "petalWidth": 1.4,
    "species": "Iris-versicolor"
  },
  {
    "id": 52,
    "sepalLength": 6.4,
    "sepalWidth": 3.2,
    "petalLength": 4.5,
    "petalWidth": 1.5,
    "species": "Iris-versicolor"
  },
  {
    "id": 53,
    "sepalLength": 6.9,
    "sepalWidth": 3.1,
    "petalLength": 4.9,
    "petalWidth": 1.5,
    "species": "Iris-versicolor"
  },
  {
    "id": 54,
    "sepalLength": 5.5,
    "sepalWidth": 2.3,
    "petalLength": 4,
    "petalWidth": 1.3,
    "species": "Iris-versicolor"
  },
  {
    "id": 55,
    "sepalLength": 6.5,
    "sepalWidth": 2.8,
    "petalLength": 4.6,
    "petalWidth": 1.5,
    "species": "Iris-versicolor"
  },
  {
    "id": 56,
    "sepalLength": 5.7,
    "sepalWidth": 2.8,
    "petalLength": 4.5,
    "petalWidth": 1.3,
    "species": "Iris-versicolor"
  },
  {
    "id": 57,
    "sepalLength": 6.3,
    "sepalWidth": 3.3,
    "petalLength": 4.7,
    "petalWidth": 1.6,
    "species": "Iris-versicolor"
  },
  {
    "id": 58,
    "sepalLength": 4.9,
    "sepalWidth": 2.4,
    "petalLength": 3.3,
    "petalWidth": 1,
    "species": "Iris-versicolor"
  },
  {
    "id": 101,
    "sepalLength": 6.3,
    "sepalWidth": 3.3,
    "petalLength": 6,
    "petalWidth": 2.5,
    "species": "Iris-virginica"
  },
  {
    "id": 102,
    "sepalLength": 5.8,
    "sepalWidth": 2.7,
    "petalLength": 5.1,
    "petalWidth": 1.9,
    "species": "Iris-virginica"
  }
];
