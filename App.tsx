
import React, { useState, useCallback } from 'react';
import { InputForm } from './components/InputForm';
import { ReportDisplay } from './components/ReportDisplay';
import { ReportPlaceholder } from './components/ReportPlaceholder';
import { gradeSolutionAndGenerateFeedback, formatReportToHtml, searchScoringCriteria } from './services/geminiService';
import type { FormData, ReportData, StudentData } from './types';
import { initialFormData } from './constants';
import { CheckCircleIcon } from './components/icons/CheckCircleIcon';
import { ExclamationCircleIcon } from './components/icons/ExclamationCircleIcon';
import { LoadingSpinnerIcon } from './components/icons/LoadingSpinnerIcon';


interface ReportResult {
  status: 'loading' | 'done' | 'error';
  data?: ReportData;
  error?: string;
  studentName: string;
  studentId: string;
  progressMessage?: string;
}

const App: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [results, setResults] = useState<ReportResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const studentsToProcess = formData.students;
    setProgress({ current: 0, total: studentsToProcess.length });
    setResults(studentsToProcess.map(s => ({ studentId: s.id, studentName: s.name, status: 'loading', progressMessage: '대기 중...' })));

    const commonData = {
      examInfo: formData.examInfo,
      scoringCriteria: formData.scoringCriteria,
      model: formData.model,
      examMaterials: formData.examMaterials,
    };

    for (let i = 0; i < studentsToProcess.length; i++) {
      const student = studentsToProcess[i];
      setProgress(prev => ({ ...prev, current: i + 1 }));

      try {
        const generationDate = new Date().toLocaleString('ko-KR');

        setResults(prev => prev.map(r => r.studentId === student.id ? { ...r, progressMessage: 'AI가 답안 분석 중...' } : r));

        const rawReport = await gradeSolutionAndGenerateFeedback(commonData, {
          name: student.name,
          solutionFiles: student.solutionFiles,
          reportTemplate: student.reportTemplate,
        });

        setResults(prev => prev.map(r => r.studentId === student.id ? { ...r, progressMessage: '보고서 생성 중...' } : r));

        // FIX: Added `rawReport` as the first argument to `formatReportToHtml` to match the function signature.
        const htmlReport = await formatReportToHtml(
          rawReport,
          {
            examInfo: commonData.examInfo,
            model: commonData.model,
          },
          student.name,
          generationDate
        );

        const reportData: ReportData = {
          htmlContent: htmlReport,
          studentEmail: student.email,
          studentName: student.name,
  
          examInfo: commonData.examInfo,
          generationDate: generationDate,
        };

        setResults(prev => prev.map(r => r.studentId === student.id ? { ...r, status: 'done', data: reportData, progressMessage: undefined } : r));

      } catch (e) {
        console.error(`Error processing report for ${student.name}:`, e);
        const message = e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.';
        setResults(prev => prev.map(r => r.studentId === student.id ? { ...r, status: 'error', error: message, progressMessage: undefined } : r));
      }
    }

    setIsLoading(false);
  }, [formData]);
  
  const handleSearchCriteria = useCallback(async () => {
    if (!formData.examInfo) return;
    const searchButton = document.querySelector('button[title="입력된 정보로 채점 기준 자동 검색"]') as HTMLButtonElement | null;
    if (searchButton) {
        searchButton.disabled = true;
    }
    setError(null);
    try {
      const criteria = await searchScoringCriteria(formData.examInfo, formData.model);
      setFormData(prev => ({ ...prev, scoringCriteria: criteria }));
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : '채점 기준을 검색하는 중 오류가 발생했습니다.';
      alert(`검색 오류: ${errorMessage}`);
    } finally {
        if (searchButton) {
            searchButton.disabled = false;
        }
    }
  }, [formData.examInfo, formData.model]);

  const handleFormChange = useCallback((newFormData: Partial<FormData>) => {
    if (newFormData.model) {
      try {
        localStorage.setItem('preferredAiModel', newFormData.model);
      } catch (error)
        {
        console.error("Failed to save preferred model to localStorage:", error);
      }
    }
    setFormData(prev => ({ ...prev, ...newFormData }));
  }, []);

  const currentProcessingStudentName = formData.students[progress.current -1]?.name || '';

  return (
    <div className="min-h-screen w-full font-sans flex flex-col">
      <header className="sticky top-0 z-10 bg-stone-900/50 backdrop-blur-md border-b border-stone-800">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-fuchsia-500">
            수리논술 AI 채점 센터
          </h1>
        </div>
      </header>

      <main className="container mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow items-start">
        <div className="lg:sticky top-24">
          <InputForm
            formData={formData}
            onFormChange={handleFormChange}
            onGenerate={handleGenerateReport}
            onSearchCriteria={handleSearchCriteria}
            isLoading={isLoading}
            isSearching={false}
          />
        </div>
        <div className="min-h-[calc(100vh-10rem)]">
          {error ? (
            <div className="bg-red-900/20 border border-red-700 p-8 rounded-xl shadow-lg h-full flex items-center justify-center text-red-300">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">오류 발생</h3>
                <p>{error}</p>
              </div>
            </div>
          ) : results.length === 0 ? (
            <ReportPlaceholder />
          ) : (
            <div className="bg-stone-900/50 border border-stone-800 rounded-xl shadow-2xl h-full flex flex-col backdrop-blur-lg">
              <div className="p-4 border-b border-stone-800">
                <h2 className="text-xl font-bold text-stone-100">
                  {isLoading ? '일괄 처리 중...' : '일괄 처리 결과'}
                </h2>
                {isLoading ? (
                   <>
                    <p className="text-sm text-stone-400 mt-1">
                      ({progress.current}/{progress.total}) '{currentProcessingStudentName}' 학생의 보고서를 생성하고 있습니다.
                    </p>
                    <div className="w-full bg-stone-700 rounded-full h-1.5 mt-2.5">
                       <div className="bg-gradient-to-r from-sky-500 to-fuchsia-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
                    </div>
                   </>
                ) : (
                  <p className="text-sm text-stone-400 mt-1">총 {results.length}명의 학생에 대한 보고서 생성이 완료되었습니다.</p>
                )}
              </div>
              <div className="p-4 overflow-y-auto flex-grow space-y-2">
                {results.map(result => (
                  <details key={result.studentId} className="bg-stone-800/50 rounded-lg group" open={result.status !== 'loading'}>
                    <summary className="p-4 flex justify-between items-center cursor-pointer list-none">
                      <span className="font-medium text-stone-200">{result.studentName}</span>
                      {result.status === 'loading' && (
                        <span className="flex items-center text-sm text-sky-400">
                          <LoadingSpinnerIcon className="w-5 h-5 mr-2 animate-spin" />
                          {result.progressMessage || '생성 중...'}
                        </span>
                      )}
                      {result.status === 'done' && <span className="flex items-center text-sm text-green-400"><CheckCircleIcon className="w-5 h-5 mr-1" />완료</span>}
                      {result.status === 'error' && <span className="flex items-center text-sm text-red-400"><ExclamationCircleIcon className="w-5 h-5 mr-1" />오류</span>}
                    </summary>
                    <div className="border-t border-stone-700">
                       {result.status === 'loading' && (
                        <div className="p-6 text-center text-stone-400">
                          AI가 학생의 답안지를 분석하고 있습니다. 잠시만 기다려주세요.
                        </div>
                      )}
                      {result.status === 'done' && result.data && <ReportDisplay reportData={result.data} />}
                      {result.status === 'error' && (
                        <div className="p-6 text-red-300 bg-red-900/20">
                          <h4 className="font-semibold mb-2">오류 상세 정보</h4>
                          <p>{result.error}</p>
                        </div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      
      <footer className="text-center py-6 text-stone-500 text-sm">
        <p>Woner샘 제공</p>
      </footer>
    </div>
  );
};

export default App;
