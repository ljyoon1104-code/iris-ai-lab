import type { IrisSpecies } from '../types/iris';

export type SpeciesShape = 'circle' | 'triangle' | 'square';

export interface SpeciesConfig {
  rawName: IrisSpecies;
  koreanName: string;
  englishName: string;
  symbol: '●' | '▲' | '■';
  shape: SpeciesShape;
  hexColor: string;
  lightBgColor: string;
  borderColor: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  badgeClass: string;
}

export const SPECIES_CONFIG: Record<IrisSpecies, SpeciesConfig> = {
  'Iris-setosa': {
    rawName: 'Iris-setosa',
    koreanName: '세토사',
    englishName: 'Setosa',
    symbol: '●',
    shape: 'circle',
    hexColor: '#10b981', // emerald-500
    lightBgColor: '#ecfdf5', // emerald-50
    borderColor: '#10b981',
    textClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-300',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  },
  'Iris-versicolor': {
    rawName: 'Iris-versicolor',
    koreanName: '버시컬러',
    englishName: 'Versicolor',
    symbol: '▲',
    shape: 'triangle',
    hexColor: '#f97316', // orange-500
    lightBgColor: '#fff7ed', // orange-50
    borderColor: '#f97316',
    textClass: 'text-orange-700',
    bgClass: 'bg-orange-50',
    borderClass: 'border-orange-300',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-300',
  },
  'Iris-virginica': {
    rawName: 'Iris-virginica',
    koreanName: '버지니카',
    englishName: 'Virginica',
    symbol: '■',
    shape: 'square',
    hexColor: '#8b5cf6', // purple-500
    lightBgColor: '#faf5ff', // purple-50
    borderColor: '#8b5cf6',
    textClass: 'text-purple-700',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-300',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-300',
  },
};

export const ALL_SPECIES_LIST: IrisSpecies[] = [
  'Iris-setosa',
  'Iris-versicolor',
  'Iris-virginica',
];

/**
 * Robustly resolve species config by rawName, koreanName, or partial string.
 */
export function getSpeciesConfig(species?: string | null): SpeciesConfig {
  if (!species) {
    return SPECIES_CONFIG['Iris-setosa'];
  }

  // Exact match
  if (species in SPECIES_CONFIG) {
    return SPECIES_CONFIG[species as IrisSpecies];
  }

  // Korean match or substring match
  const lower = species.toLowerCase();
  if (species.includes('세토사') || lower.includes('setosa')) {
    return SPECIES_CONFIG['Iris-setosa'];
  }
  if (species.includes('버시컬러') || lower.includes('versicolor')) {
    return SPECIES_CONFIG['Iris-versicolor'];
  }
  if (species.includes('버지니카') || lower.includes('virginica')) {
    return SPECIES_CONFIG['Iris-virginica'];
  }

  // Default fallback
  return SPECIES_CONFIG['Iris-setosa'];
}

/**
 * Returns formatted label like "● 세토사" or "● 세토사 (Setosa)"
 */
export function getSpeciesLabel(species?: string | null, includeEnglish: boolean = false): string {
  const conf = getSpeciesConfig(species);
  if (includeEnglish) {
    return `${conf.symbol} ${conf.koreanName} (${conf.englishName})`;
  }
  return `${conf.symbol} ${conf.koreanName}`;
}

export function getSpeciesSymbol(species?: string | null): string {
  return getSpeciesConfig(species).symbol;
}

export function getSpeciesColor(species?: string | null): string {
  return getSpeciesConfig(species).hexColor;
}

export function getSpeciesShape(species?: string | null): SpeciesShape {
  return getSpeciesConfig(species).shape;
}

