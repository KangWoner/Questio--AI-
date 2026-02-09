import type { FormData, ModelName } from './types';

export const AVAILABLE_MODELS: readonly ModelName[] = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3-pro-preview'];

const getInitialModel = (): ModelName => {
  try {
    const savedModel = localStorage.getItem('preferredAiModel');
    // Check if savedModel is one of the available models
    if (savedModel && (AVAILABLE_MODELS as readonly string[]).includes(savedModel)) {
      return savedModel as ModelName;
    }
  } catch (error) {
    console.error("Failed to read preferred model from localStorage:", error);
  }
  // Return the default model if nothing is saved or if the saved value is invalid
  return 'gemini-2.5-flash';
};

export const initialFormData: FormData = {
  examInfo: '',
  scoringCriteria: '',
  examMaterials: [],
  students: [],
  model: getInitialModel(),
};