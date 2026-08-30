import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { SystemHealthBanner } from "./components/SystemHealthBanner";
import { FieldSelector } from "./components/FieldSelector";
import { ReportUploader } from "./components/ReportUploader";
import { InspectionDashboard } from "./components/InspectionDashboard";
import { AIReviewSection } from "./components/AIReviewSection";
import { InspectionCertificateModal } from "./components/InspectionCertificateModal";
import { PublicArchiveView } from "./components/PublicArchiveView";
import { StandardsModal } from "./components/StandardsModal";
import { TelemetryPanel } from "./components/TelemetryPanel";
import { ECOLOGICAL_FIELDS } from "./data/fieldsData";
import { FieldCategory, InspectionReportResult } from "./types";
import { analyzeEcologicalReport } from "./services/localInspectionEngine";
import { fetchSystemHealth, requestDeepGeminiReview, SystemHealthResponse } from "./services/apiClient";

export default function App() {
  const [activeTab, setActiveTab] = useState<"inspect" | "public_archive" | "standards">("inspect");
  const [selectedField, setSelectedField] = useState<FieldCategory>("flora");
  const [inspectionResult, setInspectionResult] = useState<InspectionReportResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [systemHealth, setSystemHealth] = useState<SystemHealthResponse | null>(null);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [isStandardsOpen, setIsStandardsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // 1. Initial Health Check & Initial Sample Loading
  useEffect(() => {
    fetchSystemHealth().then((h) => setSystemHealth(h));

    // Periodically poll health every 30s to demonstrate live heartbeat
    const interval = setInterval(() => {
      fetchSystemHealth().then((h) => setSystemHealth(h));
    }, 30000);

    // Auto-load first sample for immediate feedback
    const defaultField = ECOLOGICAL_FIELDS[0];
    const defaultSample = defaultField.sampleReports[0];
    if (defaultSample) {
      handleAnalyze(defaultSample.title, defaultSample.content, "태백산_식물상_정밀조사_2024.hwp", "flora");
    }

    return () => clearInterval(interval);
  }, []);

  const handleFieldChange = (fieldId: FieldCategory) => {
    setSelectedField(fieldId);
    const field = ECOLOGICAL_FIELDS.find((f) => f.id === fieldId) || ECOLOGICAL_FIELDS[0];
    const sample = field.sampleReports[0];
    if (sample) {
      handleAnalyze(sample.title, sample.content, `${field.name}_표준점검용_샘플.hwp`, fieldId);
    }
  };

  const handleAnalyze = async (
    title: string,
    rawText: string,
    fileName: string,
    overrideFieldId?: FieldCategory
  ) => {
    const targetField = overrideFieldId || selectedField;
    setIsAnalyzing(true);

    // 1. Instant deterministic rule analysis
    const localResult = analyzeEcologicalReport(targetField, title, rawText, fileName);
    setInspectionResult(localResult);
    setIsAnalyzing(false);

    // 2. Deep AI analysis via Gemini Express endpoint
    setIsAiLoading(true);
    try {
      const aiReview = await requestDeepGeminiReview({
        fieldName: localResult.fieldName,
        reportTitle: localResult.reportTitle,
        reportContent: rawText,
        detectedIssues: localResult.discrepancies,
        speciesList: localResult.detectedSpecies,
      });

      if (aiReview) {
        setInspectionResult((prev) => (prev ? { ...prev, aiReview } : prev));
      }
    } catch (err) {
      console.warn("AI review completed with fallback", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleUpdateResultText = (newText: string) => {
    if (!inspectionResult) return;
    const reAnalyzed = analyzeEcologicalReport(
      inspectionResult.fieldId,
      inspectionResult.reportTitle,
      newText,
      inspectionResult.fileInfo.fileName
    );
    // Keep existing AI review if present
    reAnalyzed.aiReview = inspectionResult.aiReview;
    setInspectionResult(reAnalyzed);
  };

  return (
    <div className="min-h-screen flex bg-[#f0f2f5] text-slate-900 selection:bg-emerald-200">
      {/* 1. Sleek Deep-Navy Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedField={selectedField}
        onSelectField={handleFieldChange}
        systemHealth={systemHealth}
        onOpenStandardsModal={() => setIsStandardsOpen(true)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          systemHealth={systemHealth}
          onOpenStandardsModal={() => setIsStandardsOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* System HA Status Banner */}
        <SystemHealthBanner health={systemHealth} />

        {/* Dynamic Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7">
          {activeTab === "inspect" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* Left & Center Main Inspection Column (8 cols on XL) */}
              <div className="xl:col-span-8 space-y-6">
                {/* Step 1: 9 Fields Selector */}
                <FieldSelector
                  selectedField={selectedField}
                  onSelectField={handleFieldChange}
                />

                {/* Step 2: Report Uploader & 1-Click Presets */}
                <ReportUploader
                  selectedField={selectedField}
                  onAnalyze={(title, text, file) => handleAnalyze(title, text, file, selectedField)}
                  isAnalyzing={isAnalyzing}
                />

                {/* Step 3: Diagnostic Results Dashboard */}
                {inspectionResult && (
                  <>
                    <InspectionDashboard
                      result={inspectionResult}
                      onOpenCertificate={() => setIsCertificateOpen(true)}
                      onUpdateResultText={handleUpdateResultText}
                    />

                    {/* Step 4: AI Deep Qualitative Review */}
                    <AIReviewSection
                      aiReview={inspectionResult.aiReview || null}
                      isLoading={isAiLoading}
                      fieldName={inspectionResult.fieldName}
                    />
                  </>
                )}
              </div>

              {/* Right Telemetry Column (4 cols on XL) */}
              <div className="xl:col-span-4 space-y-6">
                <TelemetryPanel
                  systemHealth={systemHealth}
                  selectedField={selectedField}
                  onSelectField={handleFieldChange}
                />
              </div>
            </div>
          )}

          {activeTab === "public_archive" && (
            <div className="max-w-7xl mx-auto">
              <PublicArchiveView
                onSelectFieldFromPublic={(fieldId) => {
                  setSelectedField(fieldId);
                  setActiveTab("inspect");
                  const field = ECOLOGICAL_FIELDS.find((f) => f.id === fieldId);
                  if (field && field.sampleReports[0]) {
                    handleAnalyze(
                      field.sampleReports[0].title,
                      field.sampleReports[0].content,
                      `${field.name}_샘플.hwp`,
                      fieldId
                    );
                  }
                }}
              />
            </div>
          )}
        </main>

        {/* Official Footer */}
        <footer className="bg-white border-t border-slate-200 mt-auto py-5 px-6 text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto">
            <div className="flex items-center space-x-2.5">
              <span className="font-bold text-slate-800">환경부 산하 국립생태원 NIE</span>
              <span>•</span>
              <span>전국 자연환경조사 생태보고서 검수시스템</span>
            </div>
            <div className="flex items-center space-x-4 text-[11px] text-slate-500 font-mono">
              <span>SLA: 99.99% (24/7 HA)</span>
              <span>보안: K-BML v2.4 표준 준수</span>
            </div>
          </div>
        </footer>
      </div>

      {/* 3. Modals */}
      {isCertificateOpen && inspectionResult && (
        <InspectionCertificateModal
          result={inspectionResult}
          onClose={() => setIsCertificateOpen(false)}
        />
      )}

      {isStandardsOpen && (
        <StandardsModal
          onClose={() => setIsStandardsOpen(false)}
          onSelectField={(fId) => {
            setSelectedField(fId);
            const field = ECOLOGICAL_FIELDS.find((f) => f.id === fId);
            if (field && field.sampleReports[0]) {
              handleAnalyze(
                field.sampleReports[0].title,
                field.sampleReports[0].content,
                `${field.name}_샘플.hwp`,
                fId
              );
            }
          }}
        />
      )}
    </div>
  );
}
