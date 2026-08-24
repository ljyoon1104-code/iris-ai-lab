import type { LearningProgress } from '../types';

const STORAGE_KEY = 'iris_ai_lab_progress_v1';
const OLD_STORAGE_KEY = 'fruit_ai_lab_progress_v1';

export const DEFAULT_PROGRESS: LearningProgress = {
  currentModuleId: 1,
  completedModuleIds: [],
  lastUpdated: new Date().toISOString(),
};

export const loadProgress = (): LearningProgress => {
  try {
    let saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      saved = localStorage.getItem(OLD_STORAGE_KEY);
    }
    if (!saved) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(saved);
    return {
      currentModuleId: typeof parsed.currentModuleId === 'number' ? parsed.currentModuleId : 1,
      completedModuleIds: Array.isArray(parsed.completedModuleIds) ? parsed.completedModuleIds : [],
      lastUpdated: parsed.lastUpdated || new Date().toISOString(),
    };
  } catch (e) {
    console.error('Failed to load progress from localStorage:', e);
    return DEFAULT_PROGRESS;
  }
};

export const saveProgress = (progress: LearningProgress): void => {
  try {
    const updated = {
      ...progress,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save progress to localStorage:', e);
  }
};

export const clearProgress = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(OLD_STORAGE_KEY);
    localStorage.removeItem('iris_ai_lab_experiments');
  } catch (e) {
    console.error('Failed to clear progress:', e);
  }
};
