
export type ModelName = 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-3-pro-preview';

export interface StudentData {
  id: string;
  name: string;
  email: string;
  solutionFiles: File[];
  reportTemplate: string;
}

export interface FormData {
  examInfo: string;
  scoringCriteria: string;
  examMaterials: File[];
  students: StudentData[];
  model: ModelName;
}

export interface ReportData {
  htmlContent: string;
  studentEmail: string;
  studentName: string;
  examInfo: string;
  generationDate: string;
}

export interface FileContent {
  mimeType: string;
  data: string;
}