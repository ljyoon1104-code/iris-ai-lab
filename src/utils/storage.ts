import type { LearningProgress } from '../types';

export const STORAGE_KEY = 'iris_ai_lab_progress_v1';
export const OLD_STORAGE_KEY = 'fruit_ai_lab_progress_v1';
export const EXPERIMENTS_STORAGE_KEY = 'iris_ai_lab_experiments';
export const SELECTED_FEATURES_KEY = 'iris_ai_lab_selected_features';
export const MODULE04_COMPLETION_KEY = 'iris_ai_lab_module04_completion';
export const MODULE04_EDITS_KEY = 'iris_ai_lab_module04_edits';

export interface Module04Edit {
  recordId: number;
  field: string;
  before: any;
  after: any;
  errorType: 'missing' | 'outlier' | 'inconsistent' | 'invalidType';
}

export interface Module04CompletionState {
  detectiveComplete: boolean;
  missingComplete: boolean;
  outlierComplete: boolean;
  formatTypeComplete: boolean;
  transformComplete: boolean;
  reviewComplete: boolean;
  relationComplete: boolean;
}

export const DEFAULT_MODULE04_COMPLETION: Module04CompletionState = {
  detectiveComplete: false,
  missingComplete: false,
  outlierComplete: false,
  formatTypeComplete: false,
  transformComplete: false,
  reviewComplete: false,
  relationComplete: false,
};

export const loadModule04Edits = (): Module04Edit[] => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const saved = localStorage.getItem(MODULE04_EDITS_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load module 04 edits from localStorage:', e);
    return [];
  }
};

export const saveModule04Edits = (edits: Module04Edit[]): void => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(MODULE04_EDITS_KEY, JSON.stringify(edits));
  } catch (e) {
    console.error('Failed to save module 04 edits to localStorage:', e);
  }
};

export const loadModule04Completion = (): Module04CompletionState => {
  if (typeof localStorage === 'undefined') return DEFAULT_MODULE04_COMPLETION;
  try {
    const saved = localStorage.getItem(MODULE04_COMPLETION_KEY);
    if (!saved) return DEFAULT_MODULE04_COMPLETION;
    const parsed = JSON.parse(saved);
    return {
      detectiveComplete: Boolean(parsed.detectiveComplete || parsed.detectiveViewed),
      missingComplete: Boolean(parsed.missingComplete),
      outlierComplete: Boolean(parsed.outlierComplete || parsed.outlierViewed),
      formatTypeComplete: Boolean(parsed.formatTypeComplete),
      transformComplete: Boolean(parsed.transformComplete),
      reviewComplete: Boolean(parsed.reviewComplete),
      relationComplete: Boolean(parsed.relationComplete || parsed.scatterViewed || parsed.heatmapViewed || parsed.keyFeaturesSelected),
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

export const clearModule04DataOnly = (): void => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(MODULE04_EDITS_KEY);
    localStorage.removeItem(MODULE04_COMPLETION_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('module04_reset'));
    }
  } catch (e) {
    console.error('Failed to clear Module 04 data:', e);
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
    localStorage.removeItem(MODULE04_EDITS_KEY);

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
      window.dispatchEvent(new Event('module04_reset'));
    }
  } catch (e) {
    console.error('Failed to clear all learning data:', e);
  }
};

export const clearProgress = clearAllLearningData;
