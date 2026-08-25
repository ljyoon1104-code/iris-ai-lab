import { useState, useEffect } from 'react';
import type { LearningProgress } from '../types';
import {
  loadProgress,
  saveProgress,
  clearAllLearningData,
  DEFAULT_PROGRESS,
} from '../utils/storage';

export function useProgress() {
  const [progress, setProgressState] = useState<LearningProgress>(() => loadProgress());

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    const handleReset = () => {
      setProgressState(DEFAULT_PROGRESS);
    };
    window.addEventListener('learning_data_reset', handleReset);
    return () => window.removeEventListener('learning_data_reset', handleReset);
  }, []);

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
    clearAllLearningData();
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
    resetAllLearningData: resetAllProgress,
    calculatePercentage,
  };
}
