export * from './iris';

export interface ModuleInfo {
  id: number;
  code: string;
  title: string;
  shortDesc: string;
  fullDesc: string;
  mlStepRelated?: number; // 1 to 6
  iconName: string;
  estimatedMinutes: number;
}

export interface LearningProgress {
  currentModuleId: number;
  completedModuleIds: number[];
  lastUpdated: string;
}

export interface MLStepInfo {
  stepNumber: number;
  title: string;
  description: string;
}
