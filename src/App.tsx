import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { SystemHealthBanner } from "./components/SystemHealthBanner";
import { FieldSelector } from "./components/FieldSelector";
import { ReportUploader } from "./components/ReportUploader";
import { InspectionDashboard } from "./components/InspectionDashboard";
import { InspectionCertificateModal } from "./components/InspectionCertificateModal";
import { PublicArchiveView } from "./components/PublicArchiveView";
import { UserGuideView } from "./components/UserGuideView";
import { StandardsModal } from "./components/StandardsModal";
import { TelemetryPanel } from "./components/TelemetryPanel";
import { ECOLOGICAL_FIELDS } from "./data/fieldsData";
import { FieldCategory, InspectionReportResult } from "./types";
import { analyzeEcologicalReport } from "./services/localInspectionEngine";
import { fetchSystemHealth, SystemHealthResponse } from "./services/apiClient";
import { AuditHistoryRecord, INITIAL_AUDIT_HISTORY } from "./data/auditHistory";

export default function App() {
  const [activeTab, setActiveTab] = useState<"inspect" | "public_archive" | "user_guide" | "standards">("inspect");
  const [selectedField, setSelectedField] = useState<FieldCategory>("flora");
  const [inspectionResult, setInspectionResult] = useState<InspectionReportResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [systemHealth, setSystemHealth] = useState<SystemHealthResponse | null>(null);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [isStandardsOpen, setIsStandardsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [auditHistory, setAuditHistory] = useState<AuditHistoryRecord[]>(() => {
    try {
      // 이전 버전에 심어졌던 예시(가짜) 감사 이력을 제거하기 위해 저장 키를 v2로 올린다.
      localStorage.removeItem("nie_eco_audit_history");
      const saved = localStorage.getItem("nie_eco_audit_history_v2");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return INITIAL_AUDIT_HISTORY;
  });

  // Save audit history to local persistence (이 브라우저 세션 검수 결과만 저장)
  useEffect(() => {
    try {
      localStorage.setItem("nie_eco_audit_history_v2", JSON.stringify(auditHistory));
    } catch {
      // ignore
    }
  }, [auditHistory]);

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

    // 2. Real-time audit history logging
    const isMismatch = localResult.fieldCompatibility && !localResult.fieldCompatibility.isMatch;
    let auditStatus: AuditHistoryRecord["status"] = "검수적합";
    if (isMismatch) {
      auditStatus = "분야불일치";
    } else if (localResult.score.verdict === "PASS") {
      auditStatus = localResult.coordinateMaskingChecked ? "검수적합" : "좌표마스킹완료";
    } else if (localResult.score.verdict === "CONDITIONAL_PASS") {
      auditStatus = "수정권고";
    } else {
      auditStatus = "검수반려";
    }

    const newRecord: AuditHistoryRecord = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.replace(/\[.*?\]/g, "").trim() || title,
      field: localResult.fieldName,
      fieldId: targetField,
      fileName,
      status: auditStatus,
      score: localResult.score.totalScore,
      time: "방금 전",
      timestamp: Date.now(),
      speciesCount: localResult.totalSpeciesCount || localResult.detectedSpecies.length,
      issueCount: localResult.discrepancies.length,
      isCustomUploaded: !fileName.includes("샘플"),
    };

    setAuditHistory((prev) => [newRecord, ...prev.filter((r) => r.title !== newRecord.title).slice(0, 15)]);
  };

  const handleSelectAuditItem = (item: AuditHistoryRecord) => {
    setSelectedField(item.fieldId);
    setActiveTab("inspect");

    const field = ECOLOGICAL_FIELDS.find((f) => f.id === item.fieldId);
    if (field) {
      // Find matching preset or default
      const matchingSample =
        field.sampleReports.find((s) => s.title.includes(item.title) || item.title.includes(s.title)) ||
        field.sampleReports[0];

      if (matchingSample) {
        handleAnalyze(matchingSample.title, matchingSample.content, item.fileName, item.fieldId);
      }
    }
  };

  const handleGoHome = () => {
    setActiveTab("inspect");
    setSelectedField("flora");
    const defaultField = ECOLOGICAL_FIELDS[0];
    if (defaultField && defaultField.sampleReports[0]) {
      handleAnalyze(
        defaultField.sampleReports[0].title,
        defaultField.sampleReports[0].content,
        "식물상_표준검수_샘플보고서.hwp",
        "flora"
      );
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        onGoHome={handleGoHome}
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
          onGoHome={handleGoHome}
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
                      onSwitchField={(newFieldId: FieldCategory) => {
                        setSelectedField(newFieldId);
                        handleAnalyze(
                          inspectionResult.reportTitle,
                          inspectionResult.rawText,
                          inspectionResult.fileInfo.fileName,
                          newFieldId
                        );
                      }}
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
                  auditHistory={auditHistory}
                  onSelectAuditItem={handleSelectAuditItem}
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

          {activeTab === "user_guide" && (
            <div className="max-w-7xl mx-auto">
              <UserGuideView
                onStartInspection={(fieldId) => {
                  if (fieldId) setSelectedField(fieldId);
                  setActiveTab("inspect");
                }}
                onOpenStandardsModal={() => setIsStandardsOpen(true)}
                onOpenPublicArchive={() => setActiveTab("public_archive")}
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
              <span>처리: 브라우저 내 로컬 (설치·서버 불필요)</span>
              <span>기준: 국가생물종목록(K-BML) 표준 준수</span>
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
