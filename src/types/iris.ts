export type IrisSpecies = 'Iris-setosa' | 'Iris-versicolor' | 'Iris-virginica';

export interface IrisRecord {
  id: number;
  sepalLength: number; // 꽃받침 길이(cm)
  sepalWidth: number;  // 꽃받침 너비(cm)
  petalLength: number; // 꽃잎 길이(cm)
  petalWidth: number;  // 꽃잎 너비(cm)
  species: IrisSpecies;
}

export interface IrisDisplayRecord {
  id: number;
  sepalLength: string;
  sepalWidth: string;
  petalLength: string;
  petalWidth: string;
  speciesKorean: string;
  speciesOriginal: IrisSpecies;
}

export interface DatasetMetadata {
  name: string;
  source: string;
  description: string;
  isSynthetic: boolean;
  license: string;
  totalRows: number;
  speciesList: { key: IrisSpecies; korean: string; count: number }[];
}

export interface ErrorIrisRecord {
  id: number;
  sepalLength: number | string | null;
  sepalWidth: number | string | null;
  petalLength: number | string | null;
  petalWidth: number | string | null;
  species: string;
}

export type ErrorIssueType = 'missing' | 'outlier' | 'inconsistent' | 'invalidType';

export interface ErrorIrisAnswer {
  recordId: number;
  field: 'sepalLength' | 'sepalWidth' | 'petalLength' | 'petalWidth' | 'species';
  issueType: ErrorIssueType;
  description: string;
  recommendedActions: string[];
}

export interface DatasetCounts {
  total: number;
  bySpecies: Record<IrisSpecies | string, number>;
  bySpeciesKorean: Record<string, number>;
}
