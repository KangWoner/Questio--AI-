
import React, { useState, useEffect } from 'react';
import type { FormData, ModelName, StudentData } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { TrashIcon } from './icons/TrashIcon';
import { AVAILABLE_MODELS } from '../constants';
import { SearchIcon } from './icons/SearchIcon';
import { LoadingSpinnerIcon } from './icons/LoadingSpinnerIcon';
import { PdfIcon } from './icons/PdfIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';

interface InputFormProps {
  formData: FormData;
  onFormChange: (newFormData: Partial<FormData>) => void;
  onGenerate: () => void;
  onSearchCriteria: () => void;
  isLoading: boolean;
  isSearching: boolean;
}

const modelLabels: Record<ModelName, string> = {
  'gemini-2.5-flash': 'Gemini 2.5 Flash (속도 우선)',
  'gemini-2.5-pro': 'Gemini 2.5 Pro (품질 우선)',
  'gemini-3-pro-preview': 'Gemini 3.0 Pro (최신/고성능)',
};

const InputField: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string; name: string, id?: string }> = ({ label, value, onChange, placeholder, name, id }) => (
  <div>
    <label htmlFor={id || name} className="block text-sm font-medium text-stone-400 mb-2">{label}</label>
    <input
      type="text"
      id={id || name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-2 bg-stone-900/50 border border-stone-700 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
    />
  </div>
);

interface FileInputFieldProps {
  label: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
  name: string;
  description: string;
  multiple?: boolean;
}

const FileInputField: React.FC<FileInputFieldProps> = ({ label, files, onFilesChange, name, description, multiple = false }) => {
  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (multiple) {
        onFilesChange([...files, ...newFiles]);
      } else {
        onFilesChange(newFiles.length > 0 ? [newFiles[0]] : []);
      }
    }
    e.target.value = ''; // Allow re-uploading the same file
  };

  const handleFileRemove = (indexToRemove: number) => {
    onFilesChange(files.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-stone-400 mb-2">{label}</label>
      <p className="text-xs text-stone-500 mb-2">{description}</p>
      <div className="mt-1 flex justify-center p-6 border-2 border-stone-700 border-dashed rounded-lg bg-stone-900/50 hover:border-sky-500 transition-colors">
        <div className="space-y-1 text-center">
          <UploadIcon className="mx-auto h-12 w-12 text-stone-500" />
          <div className="flex text-sm text-stone-400">
            <label htmlFor={name} className="relative cursor-pointer rounded-md font-medium text-sky-400 hover:text-sky-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-stone-900 focus-within:ring-sky-500">
              <span>파일 업로드</span>
              <input id={name} name={name} type="file" className="sr-only" onChange={handleFileAdd} multiple={multiple} accept="image/*,application/pdf" />
            </label>
            <p className="pl-1">또는 드래그 앤 드롭</p>
          </div>
          <p className="text-xs text-stone-500">PNG, JPG, PDF 등</p>
        </div>
      </div>
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}-${file.lastModified}`} className="flex items-center justify-between bg-stone-800/60 p-2 pl-3 rounded-md text-sm group">
              <div className="flex items-center min-w-0">
                <PdfIcon className="w-4 h-4 mr-2 text-stone-500 flex-shrink-0" />
                <span className="text-stone-300 truncate" title={file.name}>{file.name}</span>
              </div>
              <button
                onClick={() => handleFileRemove(index)}
                className="ml-2 p-1 rounded-full text-stone-500 hover:bg-red-900/50 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label={`Remove ${file.name}`}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


export const InputForm: React.FC<InputFormProps> = ({ formData, onFormChange, onGenerate, onSearchCriteria, isLoading }) => {
  const [templates, setTemplates] = useState<Record<string, string>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [studentReportTemplates, setStudentReportTemplates] = useState<Record<string, string>>({});
  const [selectedStudentTemplate, setSelectedStudentTemplate] = useState<string>('');


  useEffect(() => {
    try {
      const savedTemplates = localStorage.getItem('scoringCriteriaTemplates');
      if (savedTemplates) {
        setTemplates(JSON.parse(savedTemplates));
      }
      const savedStudentTemplates = localStorage.getItem('studentReportTemplates');
      if (savedStudentTemplates) {
        setStudentReportTemplates(JSON.parse(savedStudentTemplates));
      }
    } catch (error) {
      console.error("Failed to load or parse templates from localStorage", error);
    }
  }, []);

  const saveTemplatesToLocalStorage = (updatedTemplates: Record<string, string>) => {
    try {
      localStorage.setItem('scoringCriteriaTemplates', JSON.stringify(updatedTemplates));
    } catch (error) {
      console.error("Failed to save templates to localStorage", error);
    }
  };

  const saveStudentReportTemplatesToLocalStorage = (updatedTemplates: Record<string, string>) => {
    try {
      localStorage.setItem('studentReportTemplates', JSON.stringify(updatedTemplates));
    } catch (error) {
      console.error("Failed to save student report templates to localStorage", error);
    }
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    onFormChange({ [e.target.name]: e.target.value });
  };
  
  const handleFilesChange = (fieldName: 'examMaterials', newFiles: File[]) => {
      onFormChange({ [fieldName]: newFiles });
  };
  
  const handleSaveTemplate = () => {
    const name = prompt("템플릿 이름을 입력하세요:", selectedTemplate || "");
    if (name && name.trim() && formData.scoringCriteria.trim()) {
      const trimmedName = name.trim();
      const newTemplates = { ...templates, [trimmedName]: formData.scoringCriteria };
      setTemplates(newTemplates);
      saveTemplatesToLocalStorage(newTemplates);
      setSelectedTemplate(trimmedName);
      alert(`'${trimmedName}' 템플릿이 저장되었습니다.`);
    } else if (name) {
      alert("템플릿 이름과 채점 기준 내용을 모두 입력해야 합니다.");
    }
  };

  const handleLoadTemplate = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setSelectedTemplate(name);
    if (name && templates[name]) {
      onFormChange({ scoringCriteria: templates[name] });
    } else {
      onFormChange({ scoringCriteria: '' });
    }
  };

  const handleDeleteTemplate = () => {
    if (selectedTemplate && confirm(`'${selectedTemplate}' 템플릿을 정말 삭제하시겠습니까?`)) {
      const { [selectedTemplate]: _, ...remainingTemplates } = templates;
      setTemplates(remainingTemplates);
      saveTemplatesToLocalStorage(remainingTemplates);
      
      if(formData.scoringCriteria === templates[selectedTemplate]) {
        onFormChange({ scoringCriteria: '' });
      }
      
      setSelectedTemplate('');
      alert(`'${selectedTemplate}' 템플릿이 삭제되었습니다.`);
    }
  };

  const handleAddStudent = () => {
    onFormChange({
      students: [...formData.students, { id: crypto.randomUUID(), name: '', email: '', solutionFiles: [], reportTemplate: '' }]
    });
  };

  const handleRemoveStudent = (id: string) => {
    onFormChange({
      students: formData.students.filter(s => s.id !== id)
    });
  };

  const handleStudentChange = (id: string, field: 'name' | 'email' | 'reportTemplate', value: string) => {
    onFormChange({
      students: formData.students.map(s => s.id === id ? { ...s, [field]: value } : s)
    });
  };

  const handleStudentFilesChange = (id: string, files: File[]) => {
    onFormChange({
      students: formData.students.map(s => s.id === id ? { ...s, solutionFiles: files } : s)
    });
  };

  const handleLoadStudentTemplate = (studentId: string, templateName: string, e: React.ChangeEvent<HTMLSelectElement>) => {
    if (templateName && studentReportTemplates[templateName]) {
        handleStudentChange(studentId, 'reportTemplate', studentReportTemplates[templateName]);
    }
    e.target.value = ''; // Reset dropdown
  };

  const handleSaveStudentTemplate = (studentId: string) => {
    const student = formData.students.find(s => s.id === studentId);
    if (!student || !student.reportTemplate.trim()) {
        alert("저장할 지시사항 내용이 없습니다.");
        return;
    }
    const name = prompt("템플릿 이름을 입력하세요:");
    if (name && name.trim()) {
        const trimmedName = name.trim();
        const newTemplates = { ...studentReportTemplates, [trimmedName]: student.reportTemplate };
        setStudentReportTemplates(newTemplates);
        saveStudentReportTemplatesToLocalStorage(newTemplates);
        alert(`'${trimmedName}' 템플릿이 저장되었습니다.`);
    }
  };

  const handleDeleteStudentTemplate = () => {
    if (selectedStudentTemplate && confirm(`'${selectedStudentTemplate}' 학생 지시사항 템플릿을 정말 삭제하시겠습니까?`)) {
        const { [selectedStudentTemplate]: _, ...remainingTemplates } = studentReportTemplates;
        setStudentReportTemplates(remainingTemplates);
        saveStudentReportTemplatesToLocalStorage(remainingTemplates);
        setSelectedStudentTemplate('');
        alert(`'${selectedStudentTemplate}' 템플릿이 삭제되었습니다.`);
    }
  };


  const validation = {
    isExamInfoValid: formData.examInfo.trim() !== '',
    isScoringCriteriaValid: formData.scoringCriteria.trim() !== '',
    areExamMaterialsValid: formData.examMaterials.length > 0,
    areStudentsEntered: formData.students.length > 0,
    areAllStudentsValid: formData.students.every(s => s.name.trim() !== '' && s.email.trim() !== '' && s.solutionFiles.length > 0),
  };
  
  const isFormValid = Object.values(validation).every(Boolean);

  const handleSearch = async () => {
    setIsSearching(true);
    await onSearchCriteria();
    setIsSearching(false);
  }

  return (
    <div className="bg-stone-900/50 border border-stone-800 p-8 rounded-xl shadow-2xl backdrop-blur-lg">
      <h2 className="text-xl font-bold text-stone-100 mb-6">공통 정보</h2>
      <div className="space-y-6">
        <div>
          <label htmlFor="examInfo" className="block text-sm font-medium text-stone-400 mb-2">시험 정보 (대학교/년도)</label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              id="examInfo"
              name="examInfo"
              value={formData.examInfo}
              onChange={handleChange}
              placeholder="예: OO대학교 2024학년도 모의"
              className="flex-grow w-full px-4 py-2 bg-stone-900/50 border border-stone-700 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={!formData.examInfo || isSearching || isLoading}
              className="flex-shrink-0 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900 focus:ring-sky-500 transition-colors disabled:bg-stone-600 disabled:cursor-not-allowed flex items-center justify-center min-w-[110px]"
              title="입력된 정보로 채점 기준 자동 검색"
            >
              {isSearching ? (
                <>
                  <LoadingSpinnerIcon className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                  <span>검색 중...</span>
                </>
              ) : (
                <>
                  <SearchIcon className="-ml-1 mr-2 h-5 w-5" />
                  <span>기준 검색</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        <div>
          <label htmlFor="model" className="block text-sm font-medium text-stone-400 mb-2">AI 모델</label>
          <select
            id="model"
            name="model"
            value={formData.model}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-stone-900/50 border border-stone-700 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
          >
            {AVAILABLE_MODELS.map((modelName) => (
              <option key={modelName} value={modelName} className="bg-stone-900">
                {modelLabels[modelName] || modelName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="scoringCriteria" className="block text-sm font-medium text-stone-400 mb-2">채점 기준</label>
          <textarea
            id="scoringCriteria"
            name="scoringCriteria"
            value={formData.scoringCriteria}
            onChange={handleChange}
            placeholder="상세한 채점 기준을 입력하거나, 템플릿을 불러오세요."
            className="w-full h-32 px-4 py-2 bg-stone-900/50 border border-stone-700 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
            rows={5}
          />
        </div>

        <div>
            <label htmlFor="template-select" className="block text-sm font-medium text-stone-400 mb-2">채점 기준 템플릿</label>
            <div className="flex items-center space-x-2">
                <select
                    id="template-select"
                    value={selectedTemplate}
                    onChange={handleLoadTemplate}
                    className="flex-grow w-full px-3 py-2 bg-stone-900/50 border border-stone-700 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                    aria-label="채점 기준 템플릿 불러오기"
                >
                    <option value="" className="bg-stone-900">템플릿 선택...</option>
                    {Object.keys(templates).sort().map(name => (
                        <option key={name} value={name} className="bg-stone-900">{name}</option>
                    ))}
                </select>
                <button
                    type="button"
                    onClick={handleSaveTemplate}
                    disabled={!formData.scoringCriteria.trim()}
                    className="flex-shrink-0 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900 focus:ring-sky-500 transition-colors disabled:bg-stone-600 disabled:cursor-not-allowed"
                >
                    저장
                </button>
                <button
                    type="button"
                    onClick={handleDeleteTemplate}
                    disabled={!selectedTemplate}
                    className="flex-shrink-0 p-2 text-stone-400 bg-stone-700 rounded-lg hover:bg-red-800/50 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900 focus:ring-red-500 transition-colors disabled:bg-stone-800 disabled:text-stone-600 disabled:cursor-not-allowed"
                    aria-label="선택된 템플릿 삭제"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
        
        <FileInputField 
          label="시험 자료" 
          name="examMaterials" 
          files={formData.examMaterials} 
          onFilesChange={(newFiles) => handleFilesChange('examMaterials', newFiles)} 
          description="문제지, 제시문 등 (모든 학생에게 공통 적용)" 
          multiple
        />
      </div>

      <div className="border-t border-stone-700 pt-6 mt-6">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-stone-200">학생 목록 ({formData.students.length}명)</h3>
        </div>
        
         {Object.keys(studentReportTemplates).length > 0 && (
            <div className="mb-4 p-3 bg-stone-800/40 border border-stone-700/80 rounded-lg">
                <label htmlFor="student-template-delete-select" className="block text-sm font-medium text-stone-400 mb-2">지시사항 템플릿 관리</label>
                <div className="flex items-center space-x-2">
                    <select
                        id="student-template-delete-select"
                        value={selectedStudentTemplate}
                        onChange={(e) => setSelectedStudentTemplate(e.target.value)}
                        className="flex-grow w-full px-3 py-2 text-sm bg-stone-900/50 border border-stone-700 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                        aria-label="삭제할 학생 지시사항 템플릿 선택"
                    >
                        <option value="">삭제할 템플릿 선택...</option>
                        {Object.keys(studentReportTemplates).sort().map(name => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={handleDeleteStudentTemplate}
                        disabled={!selectedStudentTemplate}
                        className="flex-shrink-0 p-2 text-stone-400 bg-stone-700 rounded-lg hover:bg-red-800/50 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900 focus:ring-red-500 transition-colors disabled:bg-stone-800 disabled:text-stone-600 disabled:cursor-not-allowed"
                        aria-label="선택된 학생 지시사항 템플릿 삭제"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        )}

        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {formData.students.map((student, index) => (
            <div key={student.id} className="bg-stone-800/50 p-4 rounded-lg border border-stone-700 relative animate-fade-in">
              <button
                onClick={() => handleRemoveStudent(student.id)}
                className="absolute top-2 right-2 p-1.5 rounded-full text-stone-500 hover:bg-red-900/50 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label={`Remove ${student.name}`}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
              <div className="space-y-4">
                <InputField
                  id={`studentName-${student.id}`}
                  label={`학생 ${index + 1} 이름`}
                  name="studentName"
                  value={student.name}
                  onChange={(e) => handleStudentChange(student.id, 'name', e.target.value)}
                  placeholder="홍길동"
                />
                <InputField
                  id={`studentEmail-${student.id}`}
                  label={`학생 ${index + 1} 이메일`}
                  name="studentEmail"
                  value={student.email}
                  onChange={(e) => handleStudentChange(student.id, 'email', e.target.value)}
                  placeholder="gildong@example.com"
                />
                <FileInputField 
                  label="학생 풀이" 
                  name={`studentSolution-${student.id}`}
                  files={student.solutionFiles} 
                  onFilesChange={(files) => handleStudentFilesChange(student.id, files)}
                  description="학생 답안지 (여러 파일 업로드 가능)" 
                  multiple
                />
                 <div>
                    <label htmlFor={`reportTemplate-${student.id}`} className="block text-sm font-medium text-stone-400 mb-2">학생별 지시사항 (선택)</label>
                    <textarea
                        id={`reportTemplate-${student.id}`}
                        name="reportTemplate"
                        value={student.reportTemplate}
                        onChange={(e) => handleStudentChange(student.id, 'reportTemplate', e.target.value)}
                        placeholder="예: 이 학생은 증명 문제에 약하므로 해당 부분을 집중적으로 첨삭해주세요."
                        className="w-full h-24 px-4 py-2 bg-stone-900/50 border border-stone-700 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                        rows={3}
                    />
                    <div className="mt-2 flex items-center space-x-2">
                        <select
                            onChange={(e) => handleLoadStudentTemplate(student.id, e.target.value, e)}
                            className="flex-grow w-full px-3 py-2 text-sm bg-stone-900/50 border border-stone-700 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                            aria-label="학생별 지시사항 템플릿 불러오기"
                        >
                            <option value="">템플릿 불러오기...</option>
                            {Object.keys(studentReportTemplates).sort().map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={() => handleSaveStudentTemplate(student.id)}
                            disabled={!student.reportTemplate?.trim()}
                            className="flex-shrink-0 px-3 py-2 text-xs font-medium text-white bg-sky-700/80 rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900 focus:ring-sky-500 transition-colors disabled:bg-stone-600 disabled:cursor-not-allowed"
                        >
                            템플릿으로 저장
                        </button>
                    </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={handleAddStudent}
          className="w-full mt-4 flex items-center justify-center py-2 px-4 border border-dashed border-stone-600 rounded-lg text-sm font-semibold text-stone-400 hover:bg-stone-800 hover:text-sky-400 hover:border-sky-600 transition-all"
        >
          <PlusCircleIcon className="w-5 h-5 mr-2" />
          학생 추가
        </button>
      </div>

      <button
        onClick={onGenerate}
        disabled={!isFormValid || isLoading}
        className="w-full mt-8 flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-md font-bold text-white bg-gradient-to-r from-sky-500 to-fuchsia-600 hover:from-sky-600 hover:to-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900 focus:ring-fuchsia-500 disabled:bg-stone-600 disabled:from-stone-600 disabled:to-stone-700 disabled:bg-none disabled:shadow-none disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
      >
        {isLoading ? (
          <>
            <LoadingSpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
            <span>AI 분석 중...</span>
          </>
        ) : `보고서 일괄 생성 시작 (${formData.students.length}명)`}
      </button>

      {(!isFormValid && !isLoading) && (
        <div className="mt-4 text-sm text-yellow-400/90 bg-yellow-900/30 border border-yellow-400/40 p-4 rounded-lg space-y-2">
          <p className="font-semibold text-yellow-300">보고서를 생성하려면 다음 항목을 모두 입력해야 합니다:</p>
          <ul className="list-disc list-inside space-y-1">
            {!validation.isExamInfoValid && <li>시험 정보</li>}
            {!validation.isScoringCriteriaValid && <li>채점 기준</li>}
            {!validation.areExamMaterialsValid && <li>시험 자료</li>}
            {!validation.areStudentsEntered && <li>최소 한 명 이상의 학생 정보</li>}
            {validation.areStudentsEntered && !validation.areAllStudentsValid && <li>모든 학생의 이름, 이메일, 그리고 하나 이상의 풀이 파일</li>}
          </ul>
        </div>
      )}
    </div>
  );
};
