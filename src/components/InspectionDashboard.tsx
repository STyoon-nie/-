import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Award,
  Sparkles,
  Download,
  Copy,
  ExternalLink,
  Wand2,
  FileCheck,
  RotateCcw,
  Check,
  Eye,
  FileText,
  AlertOctagon,
} from "lucide-react";
import confetti from "canvas-confetti";
import { DiscrepancyItem, InspectionReportResult, SpeciesRecord } from "../types";
import { requestQuickAutoFix } from "../services/apiClient";

interface InspectionDashboardProps {
  result: InspectionReportResult;
  onOpenCertificate: () => void;
  onUpdateResultText: (newText: string) => void;
}

export const InspectionDashboard: React.FC<InspectionDashboardProps> = ({
  result,
  onOpenCertificate,
  onUpdateResultText,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | "CRITICAL" | "WARNING" | "RECOMMENDATION">("ALL");
  const [activeTab, setActiveTab] = useState<"issues" | "species" | "preview">("issues");
  const [fixingId, setFixingId] = useState<string | null>(null);
  const [fixedIssueIds, setFixedIssueIds] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const { score, discrepancies, detectedSpecies } = result;

  const filteredDiscrepancies = discrepancies.filter((d) => {
    if (selectedFilter === "ALL") return true;
    return d.severity === selectedFilter;
  });

  const handleTriggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleAutoFix = async (item: DiscrepancyItem) => {
    if (!item.targetExcerpt && !item.suggestedFix) return;
    setFixingId(item.id);

    try {
      let replacement = item.suggestedFix || "";
      if (item.targetExcerpt) {
        const corrected = await requestQuickAutoFix({
          originalText: item.targetExcerpt,
          issueDescription: item.description,
          fieldName: result.fieldName,
        });
        replacement = corrected;
      }

      // Apply fix to raw text
      if (item.targetExcerpt && result.rawText.includes(item.targetExcerpt)) {
        const newText = result.rawText.replace(item.targetExcerpt, replacement);
        onUpdateResultText(newText);
      }

      setFixedIssueIds((prev) => new Set(prev).add(item.id));
    } catch (err) {
      console.error("Auto fix failed", err);
    } finally {
      setFixingId(null);
    }
  };

  const handleExportFixedReport = () => {
    const blob = new Blob([result.rawText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `[국립생태원_검수완료]_${result.reportTitle}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyErrata = () => {
    const errata = discrepancies
      .map(
        (d, idx) =>
          `[지적사항 ${idx + 1}] (${d.severity}) ${d.section} - ${d.title}\n내용: ${d.description}\n수정권고: ${
            d.suggestedFix || "표준지침 참조"
          }\n`
      )
      .join("\n----------------------------------------\n\n");

    navigator.clipboard.writeText(
      `[국립생태원 생태조사 보고서 검수 정오표 및 조치요구서]\n보고서명: ${result.reportTitle}\n검수일시: ${result.analyzedAt}\n종합판정: ${score.verdict} (${score.totalScore}점)\n\n${errata}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP RESULT & VERDICT HERO */}
      <div
        className={`rounded-2xl p-6 border shadow-xs transition-all relative overflow-hidden ${
          score.verdict === "PASS"
            ? "bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white border-emerald-500/50"
            : score.verdict === "CONDITIONAL_PASS"
            ? "bg-gradient-to-br from-amber-950 via-slate-900 to-slate-900 text-white border-amber-500/50"
            : "bg-gradient-to-br from-rose-950 via-slate-900 to-slate-900 text-white border-rose-500/50"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-emerald-300 border border-white/15">
                국립생태원 표준 검수 결과
              </span>
              <span className="text-xs text-slate-300 font-mono">
                {result.fieldName} 전문분야 | {result.fileInfo.fileName}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
              {result.reportTitle}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              {score.verdictReason}
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-300">
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400">조사지역:</span>
                <strong className="text-white">{result.surveyRegion}</strong>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400">확인 생물종:</span>
                <strong className="text-emerald-300">{detectedSpecies.length}종</strong>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400">법정보호종:</span>
                <strong className="text-amber-300">{result.protectedSpeciesCount}종</strong>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400">좌표 비공개 보안:</span>
                <strong className={result.coordinateMaskingChecked ? "text-emerald-400" : "text-rose-400"}>
                  {result.coordinateMaskingChecked ? "적합 (안전 격자)" : "위반 (초정밀 노출)"}
                </strong>
              </div>
            </div>
          </div>

          {/* Right Verdict Badge & Score Stamp */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/5 backdrop-blur p-4 rounded-2xl border border-white/10 shrink-0">
            <div className="text-center sm:text-right">
              <div className="text-xs font-semibold text-slate-300">종합 검수 점수</div>
              <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white mt-0.5">
                {score.totalScore}
                <span className="text-lg text-slate-400 font-normal">/100</span>
              </div>
            </div>

            <div className="flex flex-col items-center sm:items-end space-y-2">
              <div
                className={`px-4 py-2 rounded-xl text-sm font-black flex items-center space-x-1.5 shadow-md ${
                  score.verdict === "PASS"
                    ? "bg-emerald-500 text-slate-950 ring-2 ring-emerald-300"
                    : score.verdict === "CONDITIONAL_PASS"
                    ? "bg-amber-400 text-slate-950 ring-2 ring-amber-300"
                    : "bg-rose-500 text-white ring-2 ring-rose-300"
                }`}
              >
                {score.verdict === "PASS" && <CheckCircle2 className="w-5 h-5" />}
                {score.verdict === "CONDITIONAL_PASS" && <AlertTriangle className="w-5 h-5" />}
                {score.verdict === "REJECTED" && <XCircle className="w-5 h-5" />}
                <span>
                  {score.verdict === "PASS"
                    ? "표준 적합 (PASS)"
                    : score.verdict === "CONDITIONAL_PASS"
                    ? "조건부 적합"
                    : "검수 반려 (REJECT)"}
                </span>
              </div>

              {/* Certificate Button */}
              <button
                onClick={() => {
                  handleTriggerConfetti();
                  onOpenCertificate();
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 flex items-center space-x-1.5 shadow-sm transition"
              >
                <Award className="w-4 h-4 text-emerald-700" />
                <span>공식 검수 확인서 발급</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 5 CORE CRITERIA BREAKDOWN BARS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {(score?.breakdown ? (Object.values(score.breakdown) as { label: string; score: number; max: number }[]) : []).map((item, index) => {
          const ratio = (item.score / item.max) * 100;
          const isHigh = ratio >= 80;
          const isMid = ratio >= 60;

          return (
            <div key={index} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                <span className="font-semibold">{item.label}</span>
                <span className="font-bold text-slate-900 font-mono">
                  {item.score}/{item.max}점
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isHigh ? "bg-emerald-500" : isMid ? "bg-amber-500" : "bg-rose-500"
                  }`}
                  style={{ width: `${ratio}%` }}
                />
              </div>
              <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                <span>{ratio === 100 ? "만점 완벽" : isHigh ? "양호" : isMid ? "보완필요" : "심각 결함"}</span>
                <span className="font-mono">{Math.round(ratio)}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. MAIN INSPECTION TABS & ACTION BUTTONS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Navigation Toolbar */}
        <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab("issues")}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                activeTab === "issues"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>지적사항 및 조치과제 ({discrepancies.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("species")}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                activeTab === "species"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>생물종 및 보안 감사 ({detectedSpecies.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                activeTab === "preview"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-4 h-4 text-teal-600" />
              <span>전문 텍스트 뷰어</span>
            </button>
          </div>

          {/* Quick Export Tools */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyErrata}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs flex items-center space-x-1.5 transition"
              title="검수 지적사항 전체를 클립보드에 복사"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "정오표 복사완료" : "정오표 텍스트 복사"}</span>
            </button>

            <button
              onClick={handleExportFixedReport}
              className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs flex items-center space-x-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>검수본 다운로드</span>
            </button>
          </div>
        </div>

        {/* TAB 1: ISSUES LIST */}
        {activeTab === "issues" && (
          <div className="p-5">
            {/* Filter Pills */}
            <div className="flex items-center space-x-2 mb-4 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 font-semibold mr-1">필터:</span>
              <button
                onClick={() => setSelectedFilter("ALL")}
                className={`px-3 py-1 rounded-full font-bold transition ${
                  selectedFilter === "ALL"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                전체 항목 ({discrepancies.length})
              </button>
              <button
                onClick={() => setSelectedFilter("CRITICAL")}
                className={`px-3 py-1 rounded-full font-bold transition flex items-center space-x-1 ${
                  selectedFilter === "CRITICAL"
                    ? "bg-rose-600 text-white"
                    : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>중대 결함/반려사유 ({discrepancies.filter((d) => d.severity === "CRITICAL").length})</span>
              </button>
              <button
                onClick={() => setSelectedFilter("WARNING")}
                className={`px-3 py-1 rounded-full font-bold transition flex items-center space-x-1 ${
                  selectedFilter === "WARNING"
                    ? "bg-amber-500 text-slate-950"
                    : "bg-amber-100 text-amber-900 hover:bg-amber-200"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>경미한 오류/경고 ({discrepancies.filter((d) => d.severity === "WARNING").length})</span>
              </button>
              <button
                onClick={() => setSelectedFilter("RECOMMENDATION")}
                className={`px-3 py-1 rounded-full font-bold transition ${
                  selectedFilter === "RECOMMENDATION"
                    ? "bg-sky-600 text-white"
                    : "bg-sky-100 text-sky-800 hover:bg-sky-200"
                }`}
              >
                권고사항 ({discrepancies.filter((d) => d.severity === "RECOMMENDATION").length})
              </button>
            </div>

            {/* List */}
            {filteredDiscrepancies.length === 0 ? (
              <div className="text-center py-12 bg-emerald-50/40 rounded-xl border border-emerald-200/70">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-base font-bold text-emerald-950">지적사항 없음</h4>
                <p className="text-xs text-emerald-800 mt-1">
                  선택한 필터 조건에 해당하는 결함이 없거나 모든 지적사항이 충족되었습니다.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDiscrepancies.map((item, index) => {
                  const isFixed = fixedIssueIds.has(item.id);

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isFixed
                          ? "bg-emerald-50/50 border-emerald-300 opacity-80"
                          : item.severity === "CRITICAL"
                          ? "bg-rose-50/30 border-rose-200 hover:border-rose-300"
                          : item.severity === "WARNING"
                          ? "bg-amber-50/30 border-amber-200 hover:border-amber-300"
                          : "bg-sky-50/30 border-sky-200 hover:border-sky-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                item.severity === "CRITICAL"
                                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                                  : item.severity === "WARNING"
                                  ? "bg-amber-100 text-amber-900 border border-amber-200"
                                  : "bg-sky-100 text-sky-800 border border-sky-200"
                              }`}
                            >
                              {item.severity === "CRITICAL"
                                ? "중대 결함"
                                : item.severity === "WARNING"
                                ? "주의 요망"
                                : "권고 사항"}
                            </span>
                            <span className="text-xs text-slate-500 font-semibold">
                              [{item.section}]
                            </span>
                            {isFixed && (
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center space-x-1">
                                <Check className="w-3 h-3" />
                                <span>교정 반영됨</span>
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 mt-1">
                            {item.title}
                          </h4>

                          <p className="text-xs text-slate-600 leading-relaxed">
                            {item.description}
                          </p>

                          {item.targetExcerpt && (
                            <div className="mt-2 bg-slate-100 p-2 rounded-lg text-xs font-mono text-rose-800 border border-slate-200">
                              <span className="text-[11px] text-slate-500 block mb-0.5">
                                본문 검출 텍스트:
                              </span>
                              "{item.targetExcerpt}"
                            </div>
                          )}

                          {item.suggestedFix && (
                            <div className="mt-2 bg-emerald-50/80 p-2.5 rounded-lg text-xs text-emerald-950 border border-emerald-200/80">
                              <strong className="text-emerald-800 block mb-0.5">
                                국립생태원 표준 수정 가이드:
                              </strong>
                              {item.suggestedFix}
                            </div>
                          )}
                        </div>

                        {/* AI Auto Fix Action */}
                        <div className="shrink-0">
                          <button
                            onClick={() => handleAutoFix(item)}
                            disabled={isFixed || fixingId === item.id}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition shadow-2xs ${
                              isFixed
                                ? "bg-emerald-100 text-emerald-800 cursor-default"
                                : "bg-emerald-700 hover:bg-emerald-800 text-white"
                            } disabled:opacity-50`}
                          >
                            {fixingId === item.id ? (
                              <>
                                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                                <span>교정 중...</span>
                              </>
                            ) : isFixed ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>교정 완료</span>
                              </>
                            ) : (
                              <>
                                <Wand2 className="w-3.5 h-3.5 text-emerald-300" />
                                <span>AI 즉시 교정</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SPECIES & COORDINATE SECURITY AUDIT */}
        {activeTab === "species" && (
          <div className="p-5">
            <div className="mb-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-start space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong>대국민 서비스 생물다양성 & 위치정보 보안 규정:</strong> 멸종위기
                야생생물(I·II급) 및 천연기념물 서식지는 밀렵 및 남획 방지를 위해 일반 대국민 공개 시
                위도/경도 초정밀 좌표를 10km 정방격자 또는 비공개로 처리해야 합니다.
              </div>
            </div>

            {detectedSpecies.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                본 보고서에서 식별된 국가생물종이 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-bold">
                      <th className="p-2.5">국명 (표준국명)</th>
                      <th className="p-2.5">학명 (국가생물종목록)</th>
                      <th className="p-2.5">과명 (Family)</th>
                      <th className="p-2.5">법정보호 등급</th>
                      <th className="p-2.5">표기 및 보안 상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70">
                    {detectedSpecies.map((sp, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="p-2.5 font-bold text-slate-900">{sp.koreanName}</td>
                        <td className="p-2.5 font-mono italic text-slate-800">{sp.scientificName}</td>
                        <td className="p-2.5 text-slate-600">{sp.family || "-"}</td>
                        <td className="p-2.5">
                          {sp.protectionClass ? (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                sp.protectionClass.includes("I급")
                                  ? "bg-rose-100 text-rose-900 border border-rose-200"
                                  : sp.protectionClass.includes("II급")
                                  ? "bg-amber-100 text-amber-900 border border-amber-200"
                                  : sp.protectionClass.includes("교란")
                                  ? "bg-purple-100 text-purple-900 border border-purple-200"
                                  : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                              }`}
                            >
                              {sp.protectionClass}
                            </span>
                          ) : (
                            <span className="text-slate-400">일반종</span>
                          )}
                        </td>
                        <td className="p-2.5">
                          {sp.status === "VALID" ? (
                            <span className="text-emerald-700 font-bold flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>표준 적합</span>
                            </span>
                          ) : sp.status === "SYNONYM_DETECTED" ? (
                            <span className="text-rose-700 font-bold flex items-center space-x-1">
                              <AlertOctagon className="w-3.5 h-3.5" />
                              <span>이명/구학명 교정요망</span>
                            </span>
                          ) : (
                            <span className="text-amber-700 font-bold flex items-center space-x-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>이탤릭체 표기 필요</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RAW PREVIEW */}
        {activeTab === "preview" && (
          <div className="p-5">
            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs max-h-[500px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {result.rawText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
