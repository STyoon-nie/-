import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  FileCode,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Play,
  RotateCcw,
  Info,
} from "lucide-react";
import * as XLSX from "xlsx";
import { ECOLOGICAL_FIELDS } from "../data/fieldsData";
import { FieldCategory } from "../types";
import { extractTextFromPDF } from "../utils/pdfExtractor";

interface ReportUploaderProps {
  selectedField: FieldCategory;
  onAnalyze: (reportTitle: string, rawText: string, fileName: string) => void;
  isAnalyzing: boolean;
}

export const ReportUploader: React.FC<ReportUploaderProps> = ({
  selectedField,
  onAnalyze,
  isAnalyzing,
}) => {
  const [activeMode, setActiveMode] = useState<"file" | "text" | "preset">("preset");
  const [pastedTitle, setPastedTitle] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentField =
    ECOLOGICAL_FIELDS.find((f) => f.id === selectedField) || ECOLOGICAL_FIELDS[0];

  // Handle preset selection
  const handleLoadSample = (sample: { title: string; content: string }) => {
    setPastedTitle(sample.title);
    setPastedText(sample.content);
    setUploadedFileName(`${currentField.name}_표준점검용_샘플.hwp`);
    onAnalyze(sample.title, sample.content, `${currentField.name}_샘플보고서.hwp`);
  };

  // Handle real file upload
  const handleFileUpload = async (file: File) => {
    setUploadedFileName(file.name);
    const fileName = file.name;
    const titleFromName = file.name.replace(/\.[^/.]+$/, "");
    setPastedTitle(titleFromName);
    setIsExtractingFile(true);

    try {
      if (fileName.toLowerCase().endsWith(".pdf")) {
        const text = await extractTextFromPDF(file);
        setPastedText(text);
        onAnalyze(titleFromName, text, fileName);
      } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || fileName.endsWith(".csv")) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        let extractedText = `[엑셀 시트 데이터 추출: ${fileName}]\n\n`;
        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          extractedText += `=== 시트명: ${sheetName} ===\n`;
          extractedText += XLSX.utils.sheet_to_csv(sheet) + "\n\n";
        });
        setPastedText(extractedText);
        onAnalyze(titleFromName, extractedText, fileName);
      } else {
        // Text / Markdown / HWP text extraction
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = (e.target?.result as string) || "";
          setPastedText(text);
          onAnalyze(titleFromName, text, fileName);
        };
        reader.readAsText(file, "UTF-8");
      }
    } catch (e) {
      console.error("File parse error:", e);
    } finally {
      setIsExtractingFile(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold text-slate-900">
            [{currentField.name}] 보고서 파일 검수 입력
          </span>
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
            ({currentField.standardGuidelineVersion})
          </span>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveMode("preset")}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeMode === "preset"
                ? "bg-white text-emerald-800 shadow-xs font-bold"
                : "hover:text-slate-900"
            }`}
          >
            1-클릭 검수 샘플
          </button>
          <button
            onClick={() => setActiveMode("file")}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeMode === "file"
                ? "bg-white text-emerald-800 shadow-xs font-bold"
                : "hover:text-slate-900"
            }`}
          >
            파일 업로드 (HWP/PDF/XLSX)
          </button>
          <button
            onClick={() => setActiveMode("text")}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeMode === "text"
                ? "bg-white text-emerald-800 shadow-xs font-bold"
                : "hover:text-slate-900"
            }`}
          >
            본문 직접 입력
          </button>
        </div>
      </div>

      {/* 1. PRESET MODE (Recommended for quick testing of 9 fields) */}
      {activeMode === "preset" && (
        <div className="mt-4 space-y-3">
          <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 text-xs text-emerald-900 flex items-start space-x-2">
            <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>{currentField.name} 분야 전용 검수 프리셋:</strong> 아래 준비된 실제
              오류 사례 보고서 또는 표준 적합 보고서를 선택하면, 즉시 결함 분석 및 AI 정밀 검수가
              시작됩니다.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentField.sampleReports.map((sample) => (
              <div
                key={sample.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  sample.hasErrors
                    ? "bg-amber-50/40 border-amber-200 hover:border-amber-400"
                    : "bg-emerald-50/40 border-emerald-200 hover:border-emerald-400"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                        sample.hasErrors
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                      }`}
                    >
                      {sample.hasErrors ? (
                        <>
                          <AlertTriangle className="w-3 h-3 text-amber-700" />
                          <span>결함 검출 테스트용</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3 text-emerald-700" />
                          <span>표준 적합 모범 사례</span>
                        </>
                      )}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">HWP/PDF 규격</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {sample.title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {sample.description}
                  </p>
                </div>

                <button
                  onClick={() => handleLoadSample(sample)}
                  disabled={isAnalyzing}
                  className={`mt-4 w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                    sample.hasErrors
                      ? "bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                      : "bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
                  } disabled:opacity-50`}
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{isAnalyzing ? "검수 실행 중..." : "이 보고서로 즉시 자동검수 시작"}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. FILE UPLOAD MODE */}
      {activeMode === "file" && (
        <div className="mt-4">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? "border-emerald-500 bg-emerald-50/50"
                : "border-slate-300 hover:border-emerald-400 bg-slate-50/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".hwp,.hwpx,.pdf,.doc,.docx,.xlsx,.xls,.csv,.txt,.md"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              보고서 파일을 드래그하여 올리거나 클릭하여 선택하세요
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              지원 형식: HWP, HWPX, PDF, DOCX, XLSX(생물종/야장 데이터), TXT, Markdown (최대 50MB)
            </p>

            {uploadedFileName && (
              <div className="mt-4 inline-flex items-center space-x-2 px-3 py-1.5 bg-emerald-100/80 text-emerald-900 rounded-lg text-xs font-semibold">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>업로드 완료: {uploadedFileName}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. DIRECT TEXT ENTRY MODE */}
      {activeMode === "text" && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              보고서 제목
            </label>
            <input
              type="text"
              placeholder="예: 2024년 전국 자연환경조사 [식물상] 조사 보고서"
              value={pastedTitle}
              onChange={(e) => setPastedTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              보고서 본문 내용 (목차, 조사결과, 출현종 표, 좌표 등)
            </label>
            <textarea
              rows={8}
              placeholder="보고서 전문 또는 검수하고자 하는 섹션 텍스트를 붙여넣으십시오..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={() => {
              if (pastedText.trim()) {
                onAnalyze(
                  pastedTitle || `${currentField.name} 검수 보고서`,
                  pastedText,
                  "직접입력_보고서.txt"
                );
              }
            }}
            disabled={!pastedText.trim() || isAnalyzing}
            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-xs disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>{isAnalyzing ? "지능형 검수 진행 중..." : "입력 내용 실시간 검수 실행"}</span>
          </button>
        </div>
      )}
    </div>
  );
};
