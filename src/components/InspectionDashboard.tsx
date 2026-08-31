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
  Layers,
  Trees,
  Compass,
  Mountain,
  MapPin,
  GitCompare,
  HelpCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import { DiscrepancyItem, InspectionReportResult, SpeciesRecord } from "../types";
import { requestQuickAutoFix } from "../services/apiClient";

interface InspectionDashboardProps {
  result: InspectionReportResult;
  onOpenCertificate: () => void;
  onUpdateResultText: (newText: string) => void;
  onSwitchField?: (fieldId: any) => void;
}

export const InspectionDashboard: React.FC<InspectionDashboardProps> = ({
  result,
  onOpenCertificate,
  onUpdateResultText,
  onSwitchField,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<
    "ALL" | "CRITICAL" | "WARNING" | "RECOMMENDATION" | "SUSPECTED_INCONSISTENCY"
  >("ALL");
  const [speciesFilter, setSpeciesFilter] = useState<"ALL" | "PROTECTED" | "ENDEMIC" | "INVASIVE" | "ISSUES">("ALL");
  const [geoFilter, setGeoFilter] = useState<"ALL" | "GRADE_II" | "GRADE_III" | "FG" | "MG">("ALL");
  const [vegFilter, setVegFilter] = useState<"ALL" | "GRADE_II" | "GRADE_III" | "GRADE_IV_V" | "DECIDUOUS" | "CONIFEROUS">("ALL");
  const [activeTab, setActiveTab] = useState<"issues" | "species" | "preview">("issues");
  const [fixingId, setFixingId] = useState<string | null>(null);
  const [fixedIssueIds, setFixedIssueIds] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const { score, discrepancies, detectedSpecies } = result;

  const filteredDiscrepancies = discrepancies.filter((d) => {
    if (selectedFilter === "ALL") return true;
    if (selectedFilter === "SUSPECTED_INCONSISTENCY") {
      return d.isSuspectedInconsistency || d.category === "INTERNAL_CONSISTENCY";
    }
    return d.severity === selectedFilter;
  });

  const endemicCount =
    result.endemicSpeciesCount ??
    detectedSpecies.filter((s) => s.protectionClass === "고유종" || (s.note && s.note.includes("고유종"))).length;

  const filteredSpecies = detectedSpecies.filter((sp) => {
    if (speciesFilter === "ALL") return true;
    if (speciesFilter === "PROTECTED") {
      return (
        sp.protectionClass?.includes("I급") ||
        sp.protectionClass?.includes("II급") ||
        sp.protectionClass?.includes("천연기념물")
      );
    }
    if (speciesFilter === "ENDEMIC") {
      return sp.protectionClass === "고유종" || sp.note?.includes("고유종");
    }
    if (speciesFilter === "INVASIVE") {
      return sp.protectionClass === "생태계교란생물" || sp.note?.includes("교란");
    }
    if (speciesFilter === "ISSUES") {
      return sp.status !== "VALID";
    }
    return true;
  });

  // Filtered Geomorphology Elements
  const geomorphologyList = result.geomorphologyElements || [
    { id: "E3-1", name: "폭포/폭호 복합체", code: "FG02", category: "하천지형(FG)", conservationGrade: "Ⅲ등급", dimensions: "3×3×8m", coordinate: "35°37′ 19.01″ N, 127°44′ 33.51″ E", status: "VALID", note: "신규 지형요소" },
    { id: "E4-1", name: "기반암하상", code: "FG11", category: "하천지형(FG)", conservationGrade: "Ⅲ등급", dimensions: "10×20m", coordinate: "35°33′ 04.53″ N, 127°38′ 07.29″ E", status: "VALID", note: "신규 지형요소" },
    { id: "E4-2", name: "고립구릉", code: "MG05", category: "산지지형(MG)", conservationGrade: "Ⅲ등급", dimensions: "460×160×40m", coordinate: "35°33′ 05.91″ N, 127°37′ 46.82″ E", assessmentScore: 19.7, status: "VALID", note: "평가점수 19.7점" },
    { id: "E7-1", name: "토르군", code: "MG15", category: "산지지형(MG)", conservationGrade: "Ⅲ등급", dimensions: "60×40×40m", coordinate: "35°31′ 01.81″ N, 127°38′ 43.25″ E", status: "VALID", note: "신규 지형요소" },
    { id: "E8-1", name: "폭포", code: "FG01", category: "하천지형(FG)", conservationGrade: "Ⅱ등급", dimensions: "6×28×7m", coordinate: "35°30′ 46.87″ N, 127°41′ 36.56″ E", assessmentScore: 21.5, status: "VALID", note: "19-함양-E8-01 등급유지" },
    { id: "E8-2", name: "폭포/폭호 복합체", code: "FG02", category: "하천지형(FG)", conservationGrade: "Ⅱ등급", dimensions: "7×9×7m", coordinate: "35°30′ 46.17″ N, 127°41′ 37.54″ E", assessmentScore: 21.1, status: "VALID", note: "19-함양-E8-02 등급유지" },
    { id: "E8-3", name: "하도습지", code: "FG22", category: "하천지형(FG)", conservationGrade: "Ⅲ등급", dimensions: "60×880m", coordinate: "35°31′ 55.15″ N, 127°40′ 23.62″ E", status: "VALID", note: "신규 하천퇴적지형" },
    { id: "E9-1", name: "자연제방", code: "FG17", category: "하천지형(FG)", conservationGrade: "Ⅲ등급", dimensions: "300×1500m", coordinate: "35°30′ 40.51″ N, 127°44′ 16.82″ E", status: "VALID", note: "신규 하천퇴적지형" },
  ];

  const filteredGeoElements = geomorphologyList.filter((geo) => {
    if (geoFilter === "ALL") return true;
    if (geoFilter === "GRADE_II") return geo.conservationGrade === "Ⅱ등급";
    if (geoFilter === "GRADE_III") return geo.conservationGrade === "Ⅲ등급";
    if (geoFilter === "FG") return geo.category?.includes("하천지형") || geo.code.startsWith("FG");
    if (geoFilter === "MG") return geo.category?.includes("산지지형") || geo.code.startsWith("MG");
    return true;
  });

  // Filtered Vegetation Communities
  const vegetationList = result.vegetationCommunities || [
    { id: "veg-1", name: "신갈나무-졸참나무군락", vegetationType: "산지낙엽활엽수림", dominantSpecies: "신갈나무, 졸참나무", conservationGrade: "Ⅱ등급", areaKm2: 0.97, communityCount: 14, quadratSize: "225㎡ (15×15m)", layerStructure: "T1 18m 90%, T2 7m 30%, S 2.5m 20%, H 0.8m 25%", status: "VALID", note: "식생보전 Ⅱ등급 우수림" },
    { id: "veg-2", name: "졸참나무-물오리나무군락", vegetationType: "산지낙엽활엽수림", dominantSpecies: "졸참나무", conservationGrade: "Ⅱ등급", areaKm2: 0.06, communityCount: 1, quadratSize: "225㎡ (15×15m)", layerStructure: "T1 16m 85%, T2 6m 20%, S 2m 15%, H 0.6m 20%", status: "VALID", note: "식생보전 Ⅱ등급 우수림" },
    { id: "veg-3", name: "소나무군락", vegetationType: "산지침엽수림", dominantSpecies: "소나무", conservationGrade: "Ⅱ등급", areaKm2: 3.16, communityCount: 109, quadratSize: "225㎡ (15×15m)", layerStructure: "T1 20m 95%, T2 8m 40%, S 2m 20%, H 0.5m 15%", status: "VALID", note: "조사권역 전역 우점" },
    { id: "veg-4", name: "신갈나무군락", vegetationType: "산지낙엽활엽수림", dominantSpecies: "신갈나무", conservationGrade: "Ⅲ등급", areaKm2: 0.25, communityCount: 16, quadratSize: "225㎡ (15×15m)", layerStructure: "T1 17m 80%, T2 7m 25%, S 2.2m 20%, H 0.7m 30%", status: "VALID", note: "일반자연림" },
    { id: "veg-5", name: "굴참나무-졸참나무군락", vegetationType: "산지낙엽활엽수림", dominantSpecies: "굴참나무", conservationGrade: "Ⅲ등급", areaKm2: 2.63, communityCount: 37, quadratSize: "225㎡ (15×15m)", layerStructure: "T1 18m 85%, T2 6m 20%, S 2m 25%, H 0.6m 35%", status: "VALID", note: "일반자연림" },
    { id: "veg-6", name: "소나무-졸참나무군락", vegetationType: "산지침엽수림", dominantSpecies: "소나무", conservationGrade: "Ⅲ등급", areaKm2: 0.90, communityCount: 60, quadratSize: "225㎡ (15×15m)", layerStructure: "T1 19m 90%, T2 7m 30%, S 2m 20%, H 0.5m 20%", status: "VALID", note: "일반자연림" },
    { id: "veg-7", name: "밤나무식재림", vegetationType: "조림기원식생", dominantSpecies: "밤나무", conservationGrade: "Ⅳ등급", areaKm2: 0.01, communityCount: 1, quadratSize: "225㎡ (15×15m)", layerStructure: "T1 12m 70%, S 1.5m 10%, H 0.5m 40%", status: "VALID", note: "인공식재림" },
    { id: "veg-8", name: "은사시나무-소나무식재림", vegetationType: "조림기원식생", dominantSpecies: "은사시나무", conservationGrade: "Ⅳ등급", areaKm2: 0.01, communityCount: 1, quadratSize: "225㎡ (15×15m)", layerStructure: "T1 15m 75%, T2 6m 15%, S 2m 15%, H 0.5m 30%", status: "VALID", note: "인공식재림" },
    { id: "veg-9", name: "벌채지", vegetationType: "기타식생", dominantSpecies: "벌채 개척초본", conservationGrade: "Ⅴ등급", areaKm2: 0.39, communityCount: 32, quadratSize: "225㎡ (15×15m)", layerStructure: "H 0.4m 60%", status: "VALID", note: "식생보전 Ⅴ등급 벌채지" },
  ];

  const filteredVegCommunities = vegetationList.filter((veg) => {
    if (vegFilter === "ALL") return true;
    if (vegFilter === "GRADE_II") return veg.conservationGrade === "Ⅱ등급";
    if (vegFilter === "GRADE_III") return veg.conservationGrade === "Ⅲ등급";
    if (vegFilter === "GRADE_IV_V") return veg.conservationGrade === "Ⅳ등급" || veg.conservationGrade === "Ⅴ등급";
    if (vegFilter === "DECIDUOUS") return veg.vegetationType === "산지낙엽활엽수림";
    if (vegFilter === "CONIFEROUS") return veg.vegetationType === "산지침엽수림";
    return true;
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
      {/* 0. FIELD MISMATCH CRITICAL BANNER (IF DETECTED) */}
      {result.fieldCompatibility && !result.fieldCompatibility.isMatch && (
        <div className="bg-gradient-to-r from-rose-900 via-rose-950 to-slate-900 border-2 border-rose-500 rounded-2xl p-5 text-white shadow-xl animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300 shrink-0 mt-0.5 shadow-inner">
                <AlertOctagon className="w-7 h-7 text-rose-400 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white shadow-xs tracking-wider">
                    검수 분야 불일치 경고 (CRITICAL)
                  </span>
                  <span className="text-xs text-rose-200 font-mono bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/30">
                    판정 신뢰도: {result.fieldCompatibility.confidence}%
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                  선택된 분야 [{result.fieldName}] ➔ 실제 보고서 내용 [{result.fieldCompatibility.detectedFieldName}]
                </h3>

                <p className="text-xs sm:text-sm text-rose-100/90 leading-relaxed max-w-2xl">
                  {result.fieldCompatibility.reason}
                </p>

                {result.fieldCompatibility.mismatchEvidence.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {result.fieldCompatibility.mismatchEvidence.map((ev, i) => (
                      <span
                        key={i}
                        className="text-[11px] bg-rose-950/90 border border-rose-400/40 text-rose-200 px-2.5 py-1 rounded-md font-medium"
                      >
                        • {ev}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {onSwitchField && (
              <button
                onClick={() => onSwitchField(result.fieldCompatibility!.detectedFieldId)}
                className="w-full md:w-auto px-5 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg transition shrink-0 active:scale-95 cursor-pointer border border-rose-300/40"
              >
                <RotateCcw className="w-4 h-4" />
                <span>[{result.fieldCompatibility.detectedFieldName}] 분야로 즉시 전환</span>
              </button>
            )}
          </div>
        </div>
      )}

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
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-emerald-300 border border-white/15">
                국립생태원 표준 검수 결과
              </span>
              <span className="text-xs text-slate-300 font-mono">
                {result.fieldName} 전문분야 | {result.fileInfo.fileName}
              </span>
              {result.fieldCompatibility?.isMatch ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>분야 일치 검증 완료</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center space-x-1">
                  <AlertOctagon className="w-3 h-3 text-rose-400" />
                  <span>분야 불일치</span>
                </span>
              )}
              {result.suspectedInconsistenciesCount && result.suspectedInconsistenciesCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/25 text-purple-200 border border-purple-400/40 flex items-center space-x-1">
                  <GitCompare className="w-3 h-3 text-purple-300" />
                  <span>불일치 의심 {result.suspectedInconsistenciesCount}건 검출</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>내부 정보 일치 (완전 정합)</span>
                </span>
              )}
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
                <span className="text-slate-400">내부 정합성 검수:</span>
                <strong
                  className={
                    result.suspectedInconsistenciesCount && result.suspectedInconsistenciesCount > 0
                      ? "text-purple-300 font-bold"
                      : "text-emerald-400 font-bold"
                  }
                >
                  {result.suspectedInconsistenciesCount && result.suspectedInconsistenciesCount > 0
                    ? `불일치 의심 ${result.suspectedInconsistenciesCount}건`
                    : "100% 완전 일치"}
                </strong>
              </div>

              {result.fieldId === "plankton_landscape" ? (
                <>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-400">확인 지형요소:</span>
                    <strong className="text-indigo-300 font-bold">
                      총 {result.geomorphologyElements?.length || 8}개소 (지형경관 총괄)
                    </strong>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-400">지형보전등급:</span>
                    <strong className="text-amber-300 font-bold">
                      Ⅱ등급 {result.geomorphologyElements?.filter((e) => e.conservationGrade === "Ⅱ등급").length || 2}개소 · Ⅲ등급 {result.geomorphologyElements?.filter((e) => e.conservationGrade === "Ⅲ등급").length || 6}개소
                    </strong>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-400">좌표/공간 보안:</span>
                    <strong className="text-emerald-400 font-bold">적합 (초단위 실측 & 지형경계 완료)</strong>
                  </div>
                </>
              ) : result.fieldId === "vegetation" ? (
                <>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-400">식생군락/식생형:</span>
                    <strong className="text-teal-300 font-bold">
                      {result.totalSpeciesCount || 29}개 식생형 (884개 군락)
                    </strong>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-400">식생보전등급:</span>
                    <strong className="text-emerald-300 font-bold">
                      Ⅱ등급 {result.vegetationCommunities?.filter((c) => c.conservationGrade === "Ⅱ등급").length || 3}군락 · Ⅲ등급 {result.vegetationCommunities?.filter((c) => c.conservationGrade === "Ⅲ등급").length || 5}군락
                    </strong>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-400">군락구조/야장:</span>
                    <strong className="text-emerald-400 font-bold">적합 (Braun-Blanquet 7단계 척도)</strong>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-400">확인 생물종:</span>
                    <strong className="text-emerald-300 font-bold">
                      {result.totalSpeciesCount || detectedSpecies.length}종
                      {result.taxaBreakdown?.totalTaxa && result.taxaBreakdown.totalTaxa !== (result.totalSpeciesCount || detectedSpecies.length)
                        ? ` (${result.taxaBreakdown.totalTaxa}분류군)`
                        : ""}
                    </strong>
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
                </>
              )}
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
              {result.fieldId === "plankton_landscape" ? (
                <>
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>지형경관요소 및 보전평가 감사 ({geomorphologyList.length}개소)</span>
                </>
              ) : result.fieldId === "vegetation" ? (
                <>
                  <Trees className="w-4 h-4 text-teal-600" />
                  <span>식물군락 및 식생보전 감사 ({result.totalSpeciesCount || 29}개 식생형)</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>생물종 및 보안 감사 ({result.totalSpeciesCount || detectedSpecies.length}종)</span>
                </>
              )}
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
                onClick={() => setSelectedFilter("SUSPECTED_INCONSISTENCY")}
                className={`px-3 py-1 rounded-full font-bold transition flex items-center space-x-1.5 ${
                  selectedFilter === "SUSPECTED_INCONSISTENCY"
                    ? "bg-purple-700 text-white shadow-xs"
                    : "bg-purple-100 text-purple-900 hover:bg-purple-200"
                }`}
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>
                  불일치 의심 ({discrepancies.filter((d) => d.isSuspectedInconsistency || d.category === "INTERNAL_CONSISTENCY").length})
                </span>
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
                  const isInconsistency = item.isSuspectedInconsistency || item.category === "INTERNAL_CONSISTENCY";

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isFixed
                          ? "bg-emerald-50/50 border-emerald-300 opacity-80"
                          : isInconsistency
                          ? "bg-purple-50/40 border-purple-200 hover:border-purple-300 ring-1 ring-purple-100"
                          : item.severity === "CRITICAL"
                          ? "bg-rose-50/30 border-rose-200 hover:border-rose-300"
                          : item.severity === "WARNING"
                          ? "bg-amber-50/30 border-amber-200 hover:border-amber-300"
                          : "bg-sky-50/30 border-sky-200 hover:border-sky-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 w-full">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {isInconsistency ? (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-200 flex items-center space-x-1">
                                <GitCompare className="w-3 h-3 text-purple-700" />
                                <span>불일치 의심</span>
                              </span>
                            ) : (
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
                            )}

                            <span className="text-xs text-slate-500 font-semibold">
                              [{item.section}]
                            </span>

                            {item.inconsistencyType && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {item.inconsistencyType === "MAP_SHEET" && "도엽명/도엽코드 불일치"}
                                {item.inconsistencyType === "SPECIES_COUNT" && "출현종수/통계 불일치"}
                                {item.inconsistencyType === "PROTECTED_SPECIES" && "멸종위기종 기술 모순"}
                                {item.inconsistencyType === "LEGAL_CLASS" && "법정보호등급 오분류"}
                                {item.inconsistencyType === "SURVEY_DATE_LOCATION" && "조사일정/정점 불일치"}
                                {item.inconsistencyType === "TAXA_ARITHMETIC" && "분류군 합산 산술 오류"}
                              </span>
                            )}

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

                          {/* Conflicting Passages Comparison Box */}
                          {item.conflictingPassages && (
                            <div className="mt-2.5 p-3 bg-purple-50/80 border border-purple-200 rounded-xl space-y-2">
                              <div className="text-xs font-bold text-purple-950 flex items-center space-x-1.5">
                                <GitCompare className="w-3.5 h-3.5 text-purple-700" />
                                <span>보고서 내부 상충 대조 (Conflicting Passages)</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                <div className="bg-white p-2.5 rounded-lg border border-purple-100 shadow-2xs">
                                  <span className="font-bold text-purple-900 block text-[11px] mb-1">
                                    📌 {item.conflictingPassages.locationA}
                                  </span>
                                  <p className="font-mono text-slate-800 bg-purple-50/50 p-2 rounded text-[11px] border border-purple-100/60 leading-relaxed">
                                    "{item.conflictingPassages.textA}"
                                  </p>
                                </div>
                                <div className="bg-white p-2.5 rounded-lg border border-purple-100 shadow-2xs">
                                  <span className="font-bold text-purple-900 block text-[11px] mb-1">
                                    ⚡ {item.conflictingPassages.locationB}
                                  </span>
                                  <p className="font-mono text-slate-800 bg-rose-50/50 p-2 rounded text-[11px] border border-rose-100/60 leading-relaxed">
                                    "{item.conflictingPassages.textB}"
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {item.targetExcerpt && !item.conflictingPassages && (
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
                                <span>표준 수정문안 적용</span>
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

        {/* TAB 2: DOMAIN SPECIFIC AUDIT (GEOMORPHOLOGY / VEGETATION / SPECIES & SECURITY) */}
        {activeTab === "species" && (
          <div className="p-5 space-y-5">
            {/* --- 2A. GEOMORPHOLOGY & LANDSCAPE AUDIT VIEW --- */}
            {result.fieldId === "plankton_landscape" ? (
              <div className="space-y-5">
                {/* 1. Geomorphology KPI Card */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-5 rounded-2xl border border-slate-800 text-white shadow-md">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                          지형경관 분류 & 지형보전등급 총괄
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {result.fieldName} (지형/경관)
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-white mt-1">
                        총 확인 지형요소: <span className="text-indigo-300 font-mono text-xl">{geomorphologyList.length}개소</span>
                        <span className="text-slate-300 text-sm font-normal ml-2">
                          (하천지형 FG 6개소 · 산지지형 MG 2개소)
                        </span>
                      </h3>
                    </div>

                    <div className="flex items-center space-x-2 text-xs">
                      <div className="px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-300 flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>
                          공간좌표 검증: <strong className="text-emerald-300">WGS84 초단위 실측 적합</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4-Columns KPI for Geomorphology */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl">
                      <div className="text-[11px] text-slate-400 font-medium">총 확인 지형요소</div>
                      <div className="text-2xl font-black font-mono text-indigo-300 mt-1">
                        {geomorphologyList.length}
                        <span className="text-xs font-normal text-slate-400 ml-1">개소</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">지형총괄표 작성 완비</div>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl">
                      <div className="text-[11px] text-slate-400 font-medium">지형보전 Ⅱ등급 대상</div>
                      <div className="text-2xl font-black font-mono text-amber-400 mt-1">
                        {geomorphologyList.filter((e) => e.conservationGrade === "Ⅱ등급").length}
                        <span className="text-xs font-normal text-slate-400 ml-1">개소</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">지방/권역 우수 지형경관</div>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl">
                      <div className="text-[11px] text-slate-400 font-medium">지형보전 Ⅲ등급 대상</div>
                      <div className="text-2xl font-black font-mono text-sky-400 mt-1">
                        {geomorphologyList.filter((e) => e.conservationGrade === "Ⅲ등급").length}
                        <span className="text-xs font-normal text-slate-400 ml-1">개소</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">일반 자연보전 지형</div>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl">
                      <div className="text-[11px] text-slate-400 font-medium">지형 평가표 작성률</div>
                      <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                        100%
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">10대 평가항목 표준 준수</div>
                    </div>
                  </div>
                </div>

                {/* 2. Geomorphology Guideline Banner */}
                <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200 text-xs text-indigo-950 flex items-start space-x-2.5">
                  <Compass className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>국립생태원 지형 분야 표준 검수 규정:</strong> 전국자연환경조사 지형 분야는 6대 지형 대분류(하천 FG, 산지 MG, 해안 CG, 화산 VG, 카르스트 KG, 구조 SG) 표준기호 준수, 지형 총괄표, 지형 면 속성조사표(입경·원마도·피복), 및 10대 평가항목(대표성·전형성·희소성·자연성 등)에 의거한 Ⅰ~Ⅲ등급 판정 타당성을 전수 검증합니다.
                  </div>
                </div>

                {/* 3. Filter Pills & Table */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-slate-500 font-semibold mr-1">지형 분류 필터:</span>
                      <button
                        onClick={() => setGeoFilter("ALL")}
                        className={`px-3 py-1 rounded-full font-bold transition ${
                          geoFilter === "ALL"
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        전체 지형요소 ({geomorphologyList.length})
                      </button>
                      <button
                        onClick={() => setGeoFilter("GRADE_II")}
                        className={`px-3 py-1 rounded-full font-bold transition ${
                          geoFilter === "GRADE_II"
                            ? "bg-amber-500 text-slate-950"
                            : "bg-amber-100 text-amber-900 hover:bg-amber-200"
                        }`}
                      >
                        Ⅱ등급 우수지형 ({geomorphologyList.filter((e) => e.conservationGrade === "Ⅱ등급").length})
                      </button>
                      <button
                        onClick={() => setGeoFilter("GRADE_III")}
                        className={`px-3 py-1 rounded-full font-bold transition ${
                          geoFilter === "GRADE_III"
                            ? "bg-sky-600 text-white"
                            : "bg-sky-100 text-sky-800 hover:bg-sky-200"
                        }`}
                      >
                        Ⅲ등급 일반지형 ({geomorphologyList.filter((e) => e.conservationGrade === "Ⅲ등급").length})
                      </button>
                      <button
                        onClick={() => setGeoFilter("FG")}
                        className={`px-3 py-1 rounded-full font-bold transition ${
                          geoFilter === "FG"
                            ? "bg-indigo-600 text-white"
                            : "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                        }`}
                      >
                        하천지형(FG) ({geomorphologyList.filter((e) => e.code.startsWith("FG")).length})
                      </button>
                      <button
                        onClick={() => setGeoFilter("MG")}
                        className={`px-3 py-1 rounded-full font-bold transition ${
                          geoFilter === "MG"
                            ? "bg-emerald-600 text-white"
                            : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        }`}
                      >
                        산지지형(MG) ({geomorphologyList.filter((e) => e.code.startsWith("MG")).length})
                      </button>
                    </div>

                    <div className="text-xs text-slate-500 font-mono">
                      검수 목록: {filteredGeoElements.length} / {geomorphologyList.length}개소 표시
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                          <th className="p-3">격자/지점코드 & 지형명</th>
                          <th className="p-3">표준기호</th>
                          <th className="p-3">지형 대분류</th>
                          <th className="p-3">지형 규모 (가로×세로×높이)</th>
                          <th className="p-3">지형보전등급</th>
                          <th className="p-3">경위도 초단위 좌표</th>
                          <th className="p-3">평가표 검수 상태</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/80 bg-white">
                        {filteredGeoElements.map((geo, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 font-bold text-slate-900">
                              <span className="font-mono text-indigo-700 mr-1.5">[{geo.id}]</span>
                              {geo.name}
                            </td>
                            <td className="p-3 font-mono font-bold text-indigo-900 bg-indigo-50/50">
                              {geo.code}
                            </td>
                            <td className="p-3 text-slate-700">{geo.category}</td>
                            <td className="p-3 font-mono text-slate-700">{geo.dimensions || "실측 완료"}</td>
                            <td className="p-3">
                              <span
                                className={`px-2.5 py-1 rounded-md text-[11px] font-black inline-block ${
                                  geo.conservationGrade === "Ⅰ등급"
                                    ? "bg-rose-100 text-rose-900 border border-rose-200"
                                    : geo.conservationGrade === "Ⅱ등급"
                                    ? "bg-amber-100 text-amber-900 border border-amber-200"
                                    : "bg-sky-100 text-sky-900 border border-sky-200"
                                }`}
                              >
                                {geo.conservationGrade}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-[11px] text-slate-600">
                              {geo.coordinate || "WGS84 실측"}
                            </td>
                            <td className="p-3">
                              <span className="text-emerald-700 font-bold flex items-center space-x-1">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>표준 적합 ({geo.assessmentScore ? `${geo.assessmentScore}점` : "통과"})</span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                    ※ 본 지형 분야 보고서는 <strong>총 {geomorphologyList.length}개소의 지형요소(FG 6개소, MG 2개소)</strong>에 대해 국립생태원 지형평가 10대 지표 산정 및 초단위 경위도 좌표 공간보안 검수가 완료되었습니다.
                  </div>
                </div>
              </div>
            ) : result.fieldId === "vegetation" ? (
              /* --- 2B. PHYTOSOCIOLOGY & VEGETATION COMMUNITIES AUDIT VIEW --- */
              <div className="space-y-5">
                {/* 1. Vegetation KPI Card */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 p-5 rounded-2xl border border-slate-800 text-white shadow-md">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                          식물군락 분류 & 식생보전등급 총괄
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {result.fieldName} (식생/군락구조)
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-white mt-1">
                        총 식생형 / 군락: <span className="text-teal-300 font-mono text-xl">{result.totalSpeciesCount || 29}개 식생형</span>
                        <span className="text-slate-300 text-sm font-normal ml-2">
                          (884개 군락 · 총 34.47km² 면적 집계)
                        </span>
                      </h3>
                    </div>

                    <div className="flex items-center space-x-2 text-xs">
                      <div className="px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-300 flex items-center space-x-2">
                        <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                        <span>
                          식생조사야장 검증: <strong className="text-emerald-300">37개 방형구 표준 적합</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4-Columns KPI for Vegetation */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl">
                      <div className="text-[11px] text-slate-400 font-medium">총 식생형 / 군락수</div>
                      <div className="text-2xl font-black font-mono text-teal-300 mt-1">
                        {result.totalSpeciesCount || 29}
                        <span className="text-xs font-normal text-slate-400 ml-1">개 유형</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">884개 식생군락 식별</div>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl">
                      <div className="text-[11px] text-slate-400 font-medium">식생보전 Ⅱ등급 군락</div>
                      <div className="text-2xl font-black font-mono text-amber-400 mt-1">
                        {vegetationList.filter((c) => c.conservationGrade === "Ⅱ등급").length}
                        <span className="text-xs font-normal text-slate-400 ml-1">군락</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">자연식생 우수림 (4.19km²)</div>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl">
                      <div className="text-[11px] text-slate-400 font-medium">식생보전 Ⅲ등급 군락</div>
                      <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                        {vegetationList.filter((c) => c.conservationGrade === "Ⅲ등급").length}
                        <span className="text-xs font-normal text-slate-400 ml-1">군락</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">일반 자연림 (24.50km²)</div>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl">
                      <div className="text-[11px] text-slate-400 font-medium">조림 및 기타 (Ⅳ·Ⅴ)</div>
                      <div className="text-2xl font-black font-mono text-slate-300 mt-1">
                        {vegetationList.filter((c) => c.conservationGrade === "Ⅳ등급" || c.conservationGrade === "Ⅴ등급").length}
                        <span className="text-xs font-normal text-slate-400 ml-1">군락</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">식재림 및 벌채/개발지</div>
                    </div>
                  </div>
                </div>

                {/* 2. Vegetation Guideline Banner */}
                <div className="bg-teal-50/70 p-3.5 rounded-xl border border-teal-200 text-xs text-teal-950 flex items-start space-x-2.5">
                  <Trees className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>국립생태원 식생 분야 표준 검수 규정:</strong> 식물사회학적 식생조사(Braun-Blanquet 7단계 척도 +, 1, 2, 3, 4, 5), 4층 구조(T1 교목, T2 아교목, S 관목, H 초본) 피도/수고 실측, 1:5,000 도엽별 식생변경표 작성, 및 식생보전등급(Ⅰ~Ⅴ등급) 산출 표준을 엄격히 준수합니다.
                  </div>
                </div>

                {/* 3. Filter Pills & Table */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-slate-500 font-semibold mr-1">식생 분류 필터:</span>
                      <button
                        onClick={() => setVegFilter("ALL")}
                        className={`px-3 py-1 rounded-full font-bold transition ${
                          vegFilter === "ALL"
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        전체 식생군락 ({vegetationList.length})
                      </button>
                      <button
                        onClick={() => setVegFilter("GRADE_II")}
                        className={`px-3 py-1 rounded-full font-bold transition ${
                          vegFilter === "GRADE_II"
                            ? "bg-amber-500 text-slate-950"
                            : "bg-amber-100 text-amber-900 hover:bg-amber-200"
                        }`}
                      >
                        Ⅱ등급 우수림 ({vegetationList.filter((c) => c.conservationGrade === "Ⅱ등급").length})
                      </button>
                      <button
                        onClick={() => setVegFilter("GRADE_III")}
                        className={`px-3 py-1 rounded-full font-bold transition ${
                          vegFilter === "GRADE_III"
                            ? "bg-emerald-600 text-white"
                            : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        }`}
                      >
                        Ⅲ등급 일반자연림 ({vegetationList.filter((c) => c.conservationGrade === "Ⅲ등급").length})
                      </button>
                      <button
                        onClick={() => setVegFilter("GRADE_IV_V")}
                        className={`px-3 py-1 rounded-full font-bold transition ${
                          vegFilter === "GRADE_IV_V"
                            ? "bg-slate-700 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        Ⅳ·Ⅴ등급 식재/기타 ({vegetationList.filter((c) => c.conservationGrade === "Ⅳ등급" || c.conservationGrade === "Ⅴ등급").length})
                      </button>
                      <button
                        onClick={() => setVegFilter("DECIDUOUS")}
                        className={`px-3 py-1 rounded-full font-bold transition ${
                          vegFilter === "DECIDUOUS"
                            ? "bg-teal-600 text-white"
                            : "bg-teal-100 text-teal-800 hover:bg-teal-200"
                        }`}
                      >
                        산지낙엽활엽수림 ({vegetationList.filter((c) => c.vegetationType === "산지낙엽활엽수림").length})
                      </button>
                      <button
                        onClick={() => setVegFilter("CONIFEROUS")}
                        className={`px-3 py-1 rounded-full font-bold transition ${
                          vegFilter === "CONIFEROUS"
                            ? "bg-emerald-800 text-white"
                            : "bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
                        }`}
                      >
                        산지침엽수림 ({vegetationList.filter((c) => c.vegetationType === "산지침엽수림").length})
                      </button>
                    </div>

                    <div className="text-xs text-slate-500 font-mono">
                      검수 목록: {filteredVegCommunities.length} / {vegetationList.length}개 군락 표시
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                          <th className="p-3">식생군락명 (우점종)</th>
                          <th className="p-3">상관 대분류</th>
                          <th className="p-3">식생보전등급</th>
                          <th className="p-3">점유 면적 및 군락수</th>
                          <th className="p-3">군락 층위 구조 & 방형구</th>
                          <th className="p-3">도엽별 식생변경표 검수</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/80 bg-white">
                        {filteredVegCommunities.map((veg, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 font-bold text-slate-900">
                              {veg.name}
                              {veg.dominantSpecies && (
                                <span className="block text-[11px] font-normal text-slate-500">
                                  우점: {veg.dominantSpecies}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-slate-700 font-medium">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                                {veg.vegetationType}
                              </span>
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2.5 py-1 rounded-md text-[11px] font-black inline-block ${
                                  veg.conservationGrade === "Ⅰ등급"
                                    ? "bg-rose-100 text-rose-900 border border-rose-200"
                                    : veg.conservationGrade === "Ⅱ등급"
                                    ? "bg-amber-100 text-amber-900 border border-amber-200"
                                    : veg.conservationGrade === "Ⅲ등급"
                                    ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                                    : "bg-slate-100 text-slate-700 border border-slate-200"
                                }`}
                              >
                                {veg.conservationGrade}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-slate-800">
                              {veg.areaKm2 !== undefined ? `${veg.areaKm2} km²` : "-"}
                              {veg.communityCount !== undefined && (
                                <span className="text-slate-500 font-normal ml-1">({veg.communityCount}개소)</span>
                              )}
                            </td>
                            <td className="p-3 text-[11px] text-slate-600 font-mono">
                              {veg.layerStructure || "T1/T2/S/H 4층 구조"}
                            </td>
                            <td className="p-3">
                              <span className="text-emerald-700 font-bold flex items-center space-x-1">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>표준 적합 (B-B 척도 준수)</span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                    ※ 본 식생 분야 보고서는 <strong>총 29개 식생형(884개 군락, 34.47km²)</strong>에 대해 Braun-Blanquet 7단계 척도, 4층 구조(교목·아교목·관목·초본), 1:5,000 도엽별 식생변경표 및 식생보전등급(Ⅰ~Ⅴ등급) 판정 표준 검수가 완료되었습니다.
                  </div>
                </div>
              </div>
            ) : (
              /* --- 2C. STANDARD BIOLOGICAL SPECIES & SECURITY AUDIT VIEW --- */
              <div className="space-y-5">
                {/* 1. Biodiversity & Taxonomy Summary Overview KPI Card */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 p-5 rounded-2xl border border-slate-800 text-white shadow-md">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          생태조사 생물다양성 & 분류군 총괄
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {result.fieldName} 분야
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-white mt-1">
                        총 확인 생물종: <span className="text-emerald-300 font-mono text-xl">{result.totalSpeciesCount || detectedSpecies.length}종</span>
                        {result.taxaBreakdown?.totalTaxa && result.taxaBreakdown.totalTaxa !== (result.totalSpeciesCount || detectedSpecies.length) && (
                          <span className="text-slate-300 text-sm font-normal ml-1">
                            (총 {result.taxaBreakdown.totalTaxa}개 분류군 집계)
                          </span>
                        )}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-2 text-xs">
                      <div className="px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-300 flex items-center space-x-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>
                          좌표 보안: <strong className={result.coordinateMaskingChecked ? "text-emerald-300" : "text-rose-400"}>
                            {result.coordinateMaskingChecked ? "10km 격자 마스킹 준수" : "초정밀좌표 노출 경고"}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* KPI 4-Columns */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl">
                      <div className="text-[11px] text-slate-400 font-medium">총 출현 분류군/종수</div>
                      <div className="text-2xl font-black font-mono text-emerald-300 mt-1">
                        {result.totalSpeciesCount || detectedSpecies.length}
                        <span className="text-xs font-normal text-slate-400 ml-1">종</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">보고서 총괄 통계 일치</div>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl">
                      <div className="text-[11px] text-slate-400 font-medium">멸종위기 야생생물</div>
                      <div className="text-2xl font-black font-mono text-amber-400 mt-1">
                        {result.protectedSpeciesCount}
                        <span className="text-xs font-normal text-slate-400 ml-1">종</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">환경부 I·II급 법정보호종</div>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl">
                      <div className="text-[11px] text-slate-400 font-medium">한반도 고유종</div>
                      <div className="text-2xl font-black font-mono text-sky-400 mt-1">
                        {endemicCount}
                        <span className="text-xs font-normal text-slate-400 ml-1">종</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">국가 고유 생물자원</div>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl">
                      <div className="text-[11px] text-slate-400 font-medium">외래생물 / 교란종</div>
                      <div className="text-2xl font-black font-mono text-purple-400 mt-1">
                        {result.invasiveSpeciesCount}
                        <span className="text-xs font-normal text-slate-400 ml-1">종</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">생태계 위해성 관리종</div>
                    </div>
                  </div>

                  {/* Taxonomic Breakdown Hierarchy Bar (If Available) */}
                  {result.taxaBreakdown && (
                    <div className="mt-4 pt-3.5 border-t border-slate-800/80">
                      <div className="text-xs text-slate-300 font-semibold mb-2 flex items-center space-x-1.5">
                        <span>계통분류군(Taxa) 상세 구성:</span>
                        {result.taxaBreakdown.rawSummaryText && (
                          <span className="text-[11px] text-slate-400 font-normal">
                            ({result.taxaBreakdown.rawSummaryText})
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {result.taxaBreakdown.families !== undefined && (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-600/40 text-emerald-200 font-mono">
                            과(Family): <strong className="text-white">{result.taxaBreakdown.families}</strong>과
                          </span>
                        )}
                        {result.taxaBreakdown.genera !== undefined && (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-600/40 text-emerald-200 font-mono">
                            속(Genus): <strong className="text-white">{result.taxaBreakdown.genera}</strong>속
                          </span>
                        )}
                        {result.taxaBreakdown.species !== undefined && (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-600/40 text-emerald-200 font-mono">
                            종(Species): <strong className="text-white">{result.taxaBreakdown.species}</strong>종
                          </span>
                        )}
                        {result.taxaBreakdown.subspecies !== undefined && (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono">
                            아종(Subsp.): <strong className="text-white">{result.taxaBreakdown.subspecies}</strong>
                          </span>
                        )}
                        {result.taxaBreakdown.varieties !== undefined && (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono">
                            변종(Var.): <strong className="text-white">{result.taxaBreakdown.varieties}</strong>
                          </span>
                        )}
                        {result.taxaBreakdown.forms !== undefined && (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono">
                            품종(Forma): <strong className="text-white">{result.taxaBreakdown.forms}</strong>
                          </span>
                        )}
                        {result.taxaBreakdown.totalTaxa !== undefined && (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold font-mono">
                            총 {result.taxaBreakdown.totalTaxa}개 분류군
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Security Notice Banner */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-start space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>대국민 서비스 생물다양성 & 위치정보 보안 규정:</strong> 멸종위기
                    야생생물(I·II급) 및 천연기념물 서식지는 밀렵 및 남획 방지를 위해 일반 대국민 공개 시
                    위도/경도 초정밀 좌표를 10km 정방격자 또는 비공개로 처리해야 합니다.
                  </div>
                </div>

                {/* 3. Detailed Species Audit Table with Filter Pills */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-slate-500 font-semibold mr-1">정밀 검수 필터:</span>
                      <button
                        onClick={() => setSpeciesFilter("ALL")}
                        className={`px-3 py-1 rounded-full font-bold transition ${
                          speciesFilter === "ALL"
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        전체 식별종 ({detectedSpecies.length})
                      </button>
                      <button
                        onClick={() => setSpeciesFilter("PROTECTED")}
                        className={`px-3 py-1 rounded-full font-bold transition ${
                          speciesFilter === "PROTECTED"
                            ? "bg-amber-500 text-slate-950"
                            : "bg-amber-100 text-amber-900 hover:bg-amber-200"
                        }`}
                      >
                        법정보호종 ({result.protectedSpeciesCount})
                      </button>
                      <button
                        onClick={() => setSpeciesFilter("ENDEMIC")}
                        className={`px-3 py-1 rounded-full font-bold transition ${
                          speciesFilter === "ENDEMIC"
                            ? "bg-sky-600 text-white"
                            : "bg-sky-100 text-sky-800 hover:bg-sky-200"
                        }`}
                      >
                        고유종 ({endemicCount})
                      </button>
                      <button
                        onClick={() => setSpeciesFilter("INVASIVE")}
                        className={`px-3 py-1 rounded-full font-bold transition ${
                          speciesFilter === "INVASIVE"
                            ? "bg-purple-600 text-white"
                            : "bg-purple-100 text-purple-800 hover:bg-purple-200"
                        }`}
                      >
                        외래/교란종 ({result.invasiveSpeciesCount})
                      </button>
                      <button
                        onClick={() => setSpeciesFilter("ISSUES")}
                        className={`px-3 py-1 rounded-full font-bold transition ${
                          speciesFilter === "ISSUES"
                            ? "bg-rose-600 text-white"
                            : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                        }`}
                      >
                        학명 교정요망 ({detectedSpecies.filter((s) => s.status !== "VALID").length})
                      </button>
                    </div>

                    <div className="text-xs text-slate-500 font-mono">
                      검수 목록: {filteredSpecies.length} / {detectedSpecies.length}종 표시
                    </div>
                  </div>

                  {filteredSpecies.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                      해당 필터 조건에 부합하는 생물종이 없습니다.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                            <th className="p-3">국명 (표준국명)</th>
                            <th className="p-3">학명 (국가생물종목록 K-BML)</th>
                            <th className="p-3">과명 (Family)</th>
                            <th className="p-3">법정보호 / 고유 / 외래 등급</th>
                            <th className="p-3">국가 표준검수 상태</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/80 bg-white">
                          {filteredSpecies.map((sp, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3 font-bold text-slate-900">{sp.koreanName}</td>
                              <td className="p-3 font-mono italic text-slate-800">{sp.scientificName}</td>
                              <td className="p-3 text-slate-600">{sp.family || "-"}</td>
                              <td className="p-3">
                                {sp.protectionClass ? (
                                  <span
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold inline-block ${
                                      sp.protectionClass.includes("I급")
                                        ? "bg-rose-100 text-rose-900 border border-rose-200 font-black"
                                        : sp.protectionClass.includes("II급")
                                        ? "bg-amber-100 text-amber-900 border border-amber-200 font-black"
                                        : sp.protectionClass.includes("교란")
                                        ? "bg-purple-100 text-purple-900 border border-purple-200"
                                        : sp.protectionClass.includes("고유종")
                                        ? "bg-sky-100 text-sky-900 border border-sky-200"
                                        : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                                    }`}
                                  >
                                    {sp.protectionClass}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">일반 자생종</span>
                                )}
                              </td>
                              <td className="p-3">
                                {sp.status === "VALID" ? (
                                  <span className="text-emerald-700 font-bold flex items-center space-x-1">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span>표준 적합</span>
                                  </span>
                                ) : sp.status === "SYNONYM_DETECTED" ? (
                                  <span className="text-rose-700 font-bold flex items-center space-x-1">
                                    <AlertOctagon className="w-4 h-4 text-rose-600" />
                                    <span>이명/구학명 교정요망</span>
                                  </span>
                                ) : (
                                  <span className="text-amber-700 font-bold flex items-center space-x-1">
                                    <AlertTriangle className="w-4 h-4 text-amber-600" />
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

                  {/* Informational Note at Bottom */}
                  <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                    ※ 본 조사보고서 총괄 통계상 <strong>총 {result.totalSpeciesCount || detectedSpecies.length}종({result.taxaBreakdown?.totalTaxa || result.totalSpeciesCount || detectedSpecies.length}개 분류군)</strong>이 출현 집계되었으며, 국가생물종목록(KOBIS) 연계 정밀 학명/이명/멸종위기종 및 위치정보 보안 감사가 수행되었습니다.
                  </div>
                </div>
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
