import React from 'react';
import type { ReportData } from '../types';
import { DocumentIcon } from './icons/DocumentIcon';
import { EmailIcon } from './icons/EmailIcon';
import { PrinterIcon } from './icons/PrinterIcon';
import { PdfIcon } from './icons/PdfIcon';

interface ReportDisplayProps {
  reportData: ReportData;
}

declare const html2pdf: any;

export const ReportDisplay: React.FC<ReportDisplayProps> = ({ reportData }) => {
  const { htmlContent, studentEmail, studentName, examInfo, generationDate } = reportData;

  const createSafeFilename = (extension: 'html' | 'pdf') => {
    const sanitize = (text: string) => 
      text.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣_.-]/g, '');
    
    const safeStudentName = sanitize(studentName);
    const safeExamInfo = sanitize(examInfo);
    
    return `${safeExamInfo}_${safeStudentName}_평가보고서.${extension}`;
  };

  const handleSave = () => {
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>평가 보고서 - ${studentName}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>body { background-color: #1c1917; }</style>
      </head>
      <body class="p-8">
        ${htmlContent}
      </body>
      </html>
    `;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = createSafeFilename('html');
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>평가 보고서 - ${studentName}</title>
          <script src="https://cdn.tailwindcss.com"></script>
           <style>
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body class="bg-white p-8 font-sans">
          ${htmlContent.replace(/bg-stone-\d{2,3}|text-stone-\d{2,3}|border-stone-\d{2,3}/g, '')}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    }
  };
  
  const handleSaveAsPdf = () => {
    const element = document.createElement('div');
    element.innerHTML = `
      <div class="p-8 bg-stone-900">${htmlContent}</div>
    `;
    document.body.appendChild(element);

    if (!element) return;

    const filename = createSafeFilename('pdf');

    const opt = {
      margin:       [0.5, 0.5, 0.5, 0.5], // inches
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#1c1917' },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().from(element).set(opt).save().then(() => {
        document.body.removeChild(element);
    });
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`${studentName}님 수리논술 평가 보고서`);
    const body = encodeURIComponent(
        `안녕하세요, ${studentName}님.\n\n요청하신 ${examInfo} 수리논술 평가 보고서를 전달드립니다.\n\n파일을 다운로드하여 확인해주세요.\n\n감사합니다.`
    );
    window.location.href = `mailto:${studentEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="bg-stone-900/20">
      <div className="p-4 border-b border-stone-700 flex justify-between items-center flex-wrap gap-y-2">
        <div>
           <p className="text-sm text-stone-400">생성일: {generationDate}</p>
        </div>
        <div className="flex items-center space-x-2">
           <button
            onClick={handleSave}
            title="HTML로 저장"
            className="flex items-center px-3 py-2 text-sm font-medium text-stone-300 bg-stone-700/50 rounded-md hover:bg-stone-700 transition"
          >
            <DocumentIcon className="w-4 h-4 mr-2" />
            HTML
          </button>
           <button
            onClick={handleSaveAsPdf}
            title="PDF로 저장"
            className="flex items-center px-3 py-2 text-sm font-medium text-stone-300 bg-stone-700/50 rounded-md hover:bg-stone-700 transition"
          >
            <PdfIcon className="w-4 h-4 mr-2" />
            PDF
          </button>
           <button
            onClick={handlePrint}
            title="인쇄"
            className="flex items-center px-3 py-2 text-sm font-medium text-stone-300 bg-stone-700/50 rounded-md hover:bg-stone-700 transition"
          >
            <PrinterIcon className="w-4 h-4 mr-2" />
            인쇄
          </button>
          <button
            onClick={handleEmail}
            title="이메일 보내기"
            className="flex items-center px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-sky-500 to-fuchsia-600 rounded-md hover:opacity-90 transition"
          >
            <EmailIcon className="w-4 h-4 mr-2" />
            이메일
          </button>
        </div>
      </div>
      <div 
        id="report-content"
        className="p-6"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
};
