import { useState, useEffect } from 'react';
import type { LearningProgress } from '../types';
import { loadProgress, saveProgress, clearProgress, DEFAULT_PROGRESS } from '../utils/storage';

export function useProgress() {
  const [progress, setProgressState] = useState<LearningProgress>(() => loadProgress());

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const setModuleCompleted = (moduleId: number) => {
    setProgressState(prev => {
      if (prev.completedModuleIds.includes(moduleId)) return prev;
      return {
        ...prev,
        completedModuleIds: [...prev.completedModuleIds, moduleId],
      };
    });
  };

  const setCurrentModule = (moduleId: number) => {
    setProgressState(prev => ({
      ...prev,
      currentModuleId: moduleId,
    }));
  };

  const resetAllProgress = () => {
    clearProgress();
    setProgressState(DEFAULT_PROGRESS);
  };

  const calculatePercentage = (totalModules: number = 8): number => {
    if (totalModules === 0) return 0;
    return Math.round((progress.completedModuleIds.length / totalModules) * 100);
  };

  return {
    progress,
    setModuleCompleted,
    setCurrentModule,
    resetAllProgress,
    calculatePercentage,
  };
}
