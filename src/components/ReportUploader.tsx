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
  CheckCircle2,
  Trash2,
  FileCheck,
  Search,
  Loader2,
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

interface StagedFile {
  name: string;
  sizeFormatted: string;
  text: string;
  title: string;
  charCount: number;
  lineCount: number;
  extension: string;
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
  const [stagedFile, setStagedFile] = useState<StagedFile | null>(null);
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentField =
    ECOLOGICAL_FIELDS.find((f) => f.id === selectedField) || ECOLOGICAL_FIELDS[0];

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Handle preset selection
  const handleLoadSample = (sample: { title: string; content: string }) => {
    setPastedTitle(sample.title);
    setPastedText(sample.content);
    onAnalyze(sample.title, sample.content, `${currentField.name}_샘플보고서.hwp`);
  };

  // Handle real file upload (prepares the file without auto-submitting)
  const handleFileUpload = async (file: File) => {
    const fileName = file.name;
    const extension = fileName.split(".").pop()?.toLowerCase() || "";
    const titleFromName = fileName.replace(/\.[^/.]+$/, "");
    setIsExtractingFile(true);

    try {
      let extractedText = "";

      if (extension === "pdf") {
        extractedText = await extractTextFromPDF(file);
      } else if (["xlsx", "xls", "csv"].includes(extension)) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        extractedText = `[엑셀 시트 데이터 추출: ${fileName}]\n\n`;
        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          extractedText += `=== 시트명: ${sheetName} ===\n`;
          extractedText += XLSX.utils.sheet_to_csv(sheet) + "\n\n";
        });
      } else {
        // Text / Markdown / HWP text extraction
        extractedText = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve((e.target?.result as string) || "");
          reader.onerror = (e) => reject(e);
          reader.readAsText(file, "UTF-8");
        });
      }

      const lines = extractedText.split("\n").filter((l) => l.trim().length > 0);

      setStagedFile({
        name: fileName,
        sizeFormatted: formatFileSize(file.size),
        text: extractedText,
        title: titleFromName,
        charCount: extractedText.length,
        lineCount: lines.length,
        extension,
      });
    } catch (e) {
      console.error("File parse error:", e);
    } finally {
      setIsExtractingFile(false);
    }
  };

  const handleStartInspection = () => {
    if (!stagedFile) return;
    onAnalyze(stagedFile.title || stagedFile.name, stagedFile.text, stagedFile.name);
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
            className={`px-3 py-1.5 rounded-lg transition relative ${
              activeMode === "file"
                ? "bg-white text-emerald-800 shadow-xs font-bold"
                : "hover:text-slate-900"
            }`}
          >
            <span>파일 업로드 (HWP/PDF/XLSX)</span>
            {stagedFile && (
              <span className="ml-1.5 w-2 h-2 rounded-full bg-emerald-500 inline-block align-middle" />
            )}
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
          <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex items-start space-x-2.5 shadow-xs">
            <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-emerald-900">{currentField.name} 분야 전용 검수 프리셋:</strong> 아래 준비된 실제
              오류 사례 보고서 또는 표준 적합 보고서를 선택하면, 즉시 <strong>분야 적합성 교차검증</strong>, 결함 분석 및 표준 규칙 정밀 검수가
              시작됩니다. (타 분야 문서가 첨부될 경우 시스템이 자동 감지하여 전환을 안내합니다.)
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
                  className={`mt-4 w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer ${
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
        <div className="mt-4 space-y-4">
          {/* File Staging / Ready Preview Card */}
          {stagedFile ? (
            <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50/80 to-slate-50 p-5 space-y-4 shadow-sm animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    {["xlsx", "xls", "csv"].includes(stagedFile.extension) ? (
                      <FileSpreadsheet className="w-6 h-6" />
                    ) : stagedFile.extension === "pdf" ? (
                      <FileText className="w-6 h-6" />
                    ) : (
                      <FileCode className="w-6 h-6" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-200/80 text-emerald-900 uppercase font-mono">
                        {stagedFile.extension || "FILE"}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {stagedFile.sizeFormatted}
                      </span>
                      <span className="text-xs text-emerald-700 font-medium flex items-center space-x-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>파일 텍스트 추출 완료 ({stagedFile.charCount.toLocaleString()}자 / {stagedFile.lineCount.toLocaleString()}행)</span>
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900 truncate mt-1">
                      {stagedFile.name}
                    </h4>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setStagedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  title="파일 취소 및 다른 파일 선택"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Title input customization */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>검수 보고서 제목 (필요 시 수정 가능)</span>
                  <span className="text-[11px] font-normal text-slate-500">현재 분야: [{currentField.name}]</span>
                </label>
                <input
                  type="text"
                  value={stagedFile.title}
                  onChange={(e) => setStagedFile({ ...stagedFile, title: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  placeholder="보고서 제목을 입력하세요"
                />
              </div>

              {/* Extracted snippet preview */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] font-mono text-slate-600 max-h-24 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                {stagedFile.text.slice(0, 300)}...
              </div>

              {/* Explicit Start Inspection Button */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                <button
                  onClick={handleStartInspection}
                  disabled={isAnalyzing}
                  className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-black text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                      <span>국립생태원 표준 검수 실행 중...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 text-emerald-200" />
                      <span>[{currentField.name}] 표준 검수 시작하기</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAnalyzing}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>다른 파일 선택</span>
                </button>
              </div>
            </div>
          ) : (
            /* Upload drop zone when no file is staged */
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
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                {isExtractingFile ? (
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                ) : (
                  <UploadCloud className="w-6 h-6" />
                )}
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                {isExtractingFile
                  ? "파일 내용을 파싱 및 추출하는 중입니다..."
                  : "보고서 파일을 드래그하여 올리거나 클릭하여 선택하세요"}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                지원 형식: HWP, HWPX, PDF, DOCX, XLSX(생물종/야장 데이터), TXT, Markdown (최대 50MB)
              </p>
              <div className="mt-3 inline-flex items-center space-x-1 text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                <Info className="w-3.5 h-3.5 text-emerald-600" />
                <span>파일 업로드 후 [검수 시작하기] 버튼을 눌러 검수를 진행합니다.</span>
              </div>
            </div>
          )}

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
            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>{isAnalyzing ? "지능형 검수 진행 중..." : "입력 내용 실시간 검수 실행"}</span>
          </button>
        </div>
      )}
    </div>
  );
};
