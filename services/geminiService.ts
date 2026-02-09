
import { GoogleGenAI } from "@google/genai";
import type { FormData, FileContent, ModelName, StudentData } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function fileToGenerativePart(file: File): Promise<FileContent> {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        resolve(''); // Should not happen with readAsDataURL
      }
    };
    reader.readAsDataURL(file);
  });
  const data = await base64EncodedDataPromise;
  return {
    mimeType: file.type,
    data,
  };
}

export async function searchScoringCriteria(examInfo: string, model: ModelName): Promise<string> {
  const prompt = `
    You are an expert AI assistant specializing in university entrance exams in South Korea.
    Your task is to find the official scoring criteria for the following math essay exam: "${examInfo}".

    Instructions:
    1.  Use your knowledge and search capabilities to find the most accurate and detailed scoring criteria for this specific exam.
    2.  If the official criteria are available, present them clearly.
    3.  If official criteria are not publicly available, synthesize a likely set of criteria based on the university's past exams, typical evaluation standards for math essays (e.g., logical rigor, problem comprehension, accuracy of calculations, clarity of explanation), and the specific topics likely covered in that year's exam.
    4.  Format the output as a clear, structured list that can be directly used as a scoring guide. Use markdown for headings and bullet points.
    5.  The response must be in Korean.
    6.  The response should contain ONLY the scoring criteria text, without any conversational preamble or sign-off.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      tools: [{googleSearch: {}}],
    },
  });

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  let references = '';
  if (groundingChunks && groundingChunks.length > 0) {
      const urls = groundingChunks
          .map((chunk: any) => chunk.web?.uri)
          .filter((uri: string | undefined) => uri);
      
      const uniqueUrls = [...new Set(urls)];

      if (uniqueUrls.length > 0) {
        references = '\n\n---\n**참고 자료:**\n';
        uniqueUrls.forEach(url => {
          references += `- ${url}\n`;
        });
      }
  }

  return response.text.trim() + references;
}

export async function gradeSolutionAndGenerateFeedback(
  commonData: { examInfo: string; scoringCriteria: string; model: ModelName; examMaterials: File[] },
  studentData: { name: string; solutionFiles: File[]; reportTemplate: string }
): Promise<string> {
  if (commonData.examMaterials.length === 0 || studentData.solutionFiles.length === 0) {
    throw new Error("시험 자료와 학생 풀이 파일은 필수입니다.");
  }

  const examMaterialsParts = await Promise.all(
    commonData.examMaterials.map(file => fileToGenerativePart(file))
  );
  const studentSolutionParts = await Promise.all(
    studentData.solutionFiles.map(file => fileToGenerativePart(file))
  );
  
  const studentSpecificInstructions = studentData.reportTemplate 
    ? `
    - Student-Specific Instructions:
    ${studentData.reportTemplate}
    ` 
    : '';

  const prompt = `
    You are '수리논술 도우미' (Math Essay Helper), an AI expert in evaluating student math solutions based on university-specific criteria. Your task is to meticulously analyze the provided information and generate a detailed report in Korean.

    # Provided Information:
    - Student Name: ${studentData.name}
    - Exam Information: ${commonData.examInfo}
    - Scoring Criteria:
    ${commonData.scoringCriteria}
    ${studentSpecificInstructions}
    - Exam Materials (questions, etc.)
    - Student's Solution images

    # Required Output Structure (in Korean Markdown):

    ## 총점
    - Provide the final total score as a number (e.g., 85/100점).

    ## 채점 기준별 상세 점수
    - Create a markdown table or a clear list that breaks down the score for EACH item in the provided **Scoring Criteria**.
    - For each criterion, list the points awarded out of the possible points.
    - Calculate and display the sum of these points, which should match the total score.
    - Example:
      - 논리적 전개: 5/10점
      - 계산 정확성: 8/10점
      - 문제 이해도: 10/10점
      - **합계:** 23/30점

    ## 문제별 상세 평가
    - For each problem in the exam:
      - Create a new section (e.g., "### 1번 문제 평가").
      - **강점 (Strengths):** List the strong points of the student's solution for this problem.
      - **약점 (Weaknesses):** List the weak points and errors in the student's solution for this problem.
      - **모범 답안 (Model Answer):** **If the student's solution for this problem has significant errors or is largely incorrect, provide a clear, step-by-step model answer.** If the student's answer is correct, you can state that and omit this part.

    ## 총평 (Overall Evaluation)
    - Write a detailed overall evaluation of the student's entire solution, comparing it against the scoring criteria and general university expectations.

    ## 개선을 위한 피드백 (Feedback for Improvement)
    - Provide specific, actionable feedback for the student to help them improve.

    ---
    Here are the exam materials and the student's solution. Use the Scoring Criteria text above as your primary guide for evaluation. Begin the analysis now, following the required output structure precisely. The entire report must be in Korean.
  `;
  
  const response = await ai.models.generateContent({
      model: commonData.model,
      contents: {
          parts: [
              { text: prompt },
              ...examMaterialsParts.map(part => ({ inlineData: part })),
              ...studentSolutionParts.map(part => ({ inlineData: part })),
          ],
      },
  });
  
  return response.text;
}

export async function formatReportToHtml(
  rawReport: string,
  commonData: { examInfo: string; model: ModelName },
  studentName: string,
  generationDate: string
): Promise<string> {
    const prompt = `
    You are an expert web designer specializing in creating beautiful, modern, dark-themed reports with Tailwind CSS. Your task is to convert the following raw text math evaluation report (in Korean Markdown) into a visually stunning and well-structured HTML document.

    **Instructions:**
    1.  Use Tailwind CSS classes exclusively. No inline styles or <style> tags.
    2.  Output ONLY the HTML code for the report content itself. No \`<html>\`, \`<head>\`, or \`<body>\` tags. The report will be embedded in a container with a dark background (\`bg-stone-900\`).
    3.  Structure the report with clear headings, sections, and cards. Each major section should be a card: \`bg-stone-800/50 border border-stone-700 rounded-lg p-6 mb-6\`.
    4.  Use a professional and readable dark-mode color palette:
        - Main text: \`text-stone-300\`
        - Headings: \`text-sky-400\` or \`text-fuchsia-500\` for main titles. **Do NOT use text-transparent gradients or bg-clip-text, as these cause visibility issues when printing.** Use solid colors. \`text-stone-100\` for subtitles.
        - Strengths/Positive feedback: Use a container like \`bg-green-500/10 border border-green-700 rounded-md p-4\` with text \`text-green-400\`.
        - Weaknesses/Improvement areas: Use a container like \`bg-red-500/10 border border-red-700 rounded-md p-4\` with text \`text-red-400\`.
    5.  **Header Section:** Create a header card that includes the Student Name, Exam Info, and Generation Date in a clean, organized manner.
    6.  **Total Score Section ("총점"):** Make this stand out. Display the total score in a large, bold font with a solid color, e.g., \`text-5xl font-bold text-fuchsia-500\`. **Do NOT use gradients or text-transparent.**
    7.  **Scoring Breakdown Section ("채점 기준별 상세 점수"):**
        - Format this as a clean table (\`<table>\`). Use \`w-full\`, \`text-left\`.
        - Table header (\`<thead>\`) should be \`border-b border-stone-600\`.
        - Table rows (\`<tr>\`) should have a bottom border \`border-b border-stone-700\`. The last row should not have a border.
        - The final "합계" (Total) row should be bold \`font-bold\`.
    8.  **Per-Problem Evaluation Section ("문제별 상세 평가"):**
        - Each problem's evaluation should be in its own card.
        - Use styled lists (\`<ul>\`, \`<li>\`) for Strengths and Weaknesses, perhaps with custom icons or colors.
    9.  **Model Answer Section ("모범 답안"):**
        - If present, display it in a distinct container designed for code or math, like \`bg-stone-900 border border-stone-700 rounded-lg p-4 mt-4\`. Ensure mathematical notation is clean and readable.
    10. Use elegant typography. Main headings: \`text-2xl font-bold mb-4 text-stone-100\`. Subheadings: \`text-lg font-semibold mb-3 text-stone-200\`.

    **Report Generation Date:** ${generationDate}
    **Student Name:** ${studentName}
    **Exam Info:** ${commonData.examInfo}

    **Raw Text Report to Convert:**
    \`\`\`
    ${rawReport}
    \`\`\`

    Now, generate the complete HTML code for the report body. Start with the header section containing student info.
    `;

    const response = await ai.models.generateContent({
        model: commonData.model,
        contents: prompt,
    });
    
    let html = response.text;
    if (html.startsWith('```html')) {
        html = html.substring(7);
    }
    if (html.endsWith('```')) {
        html = html.substring(0, html.length - 3);
    }

    return html.trim();
}
