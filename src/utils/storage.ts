import type { LearningProgress } from '../types';

export const STORAGE_KEY = 'iris_ai_lab_progress_v1';
export const OLD_STORAGE_KEY = 'fruit_ai_lab_progress_v1';
export const EXPERIMENTS_STORAGE_KEY = 'iris_ai_lab_experiments';
export const SELECTED_FEATURES_KEY = 'iris_ai_lab_selected_features';
export const MODULE04_COMPLETION_KEY = 'iris_ai_lab_module04_completion';

export interface Module04CompletionState {
  detectiveViewed: boolean;
  outlierViewed: boolean;
  scatterViewed: boolean;
  heatmapViewed: boolean;
  keyFeaturesSelected: boolean;
}

export const DEFAULT_MODULE04_COMPLETION: Module04CompletionState = {
  detectiveViewed: false,
  outlierViewed: false,
  scatterViewed: false,
  heatmapViewed: false,
  keyFeaturesSelected: false,
};

export const loadModule04Completion = (): Module04CompletionState => {
  if (typeof localStorage === 'undefined') return DEFAULT_MODULE04_COMPLETION;
  try {
    const saved = localStorage.getItem(MODULE04_COMPLETION_KEY);
    if (!saved) return DEFAULT_MODULE04_COMPLETION;
    const parsed = JSON.parse(saved);
    return {
      detectiveViewed: Boolean(parsed.detectiveViewed || parsed.statisticsViewed),
      outlierViewed: Boolean(parsed.outlierViewed || parsed.histogramViewed || parsed.boxplotViewed),
      scatterViewed: Boolean(parsed.scatterViewed || parsed.scatterChanged),
      heatmapViewed: Boolean(parsed.heatmapViewed),
      keyFeaturesSelected: Boolean(parsed.keyFeaturesSelected),
    };
  } catch (e) {
    console.error('Failed to load module 04 completion from localStorage:', e);
    return DEFAULT_MODULE04_COMPLETION;
  }
};

export const saveModule04Completion = (state: Module04CompletionState): void => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(MODULE04_COMPLETION_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save module 04 completion to localStorage:', e);
  }
};

export const DEFAULT_PROGRESS: LearningProgress = {
  currentModuleId: 1,
  completedModuleIds: [],
  lastUpdated: new Date().toISOString(),
};

export const loadProgress = (): LearningProgress => {
  if (typeof localStorage === 'undefined') return DEFAULT_PROGRESS;
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
  if (typeof localStorage === 'undefined') return;
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

/**
 * Reset all learning progress, saved experiments, and legacy migration keys in localStorage,
 * and dispatch custom event to notify memory states in active React components.
 */
export const clearAllLearningData = (): void => {
  if (typeof localStorage === 'undefined') return;
  try {
    // 1. Explicitly remove known learning and legacy keys
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(OLD_STORAGE_KEY);
    localStorage.removeItem(EXPERIMENTS_STORAGE_KEY);
    localStorage.removeItem(SELECTED_FEATURES_KEY);
    localStorage.removeItem(MODULE04_COMPLETION_KEY);

    // 2. Dynamically scan and remove any remaining learning/experiment/model keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.includes('iris_ai_lab') ||
          key.includes('fruit_ai_lab') ||
          key.includes('progress') ||
          key.includes('experiment') ||
          key.includes('model') ||
          key.includes('evaluation'))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    // 3. Dispatch custom event for active React component memory reset
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('learning_data_reset'));
    }
  } catch (e) {
    console.error('Failed to clear all learning data:', e);
  }
};

export const clearProgress = clearAllLearningData;
