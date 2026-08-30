import React, { useState } from "react";
import {
  Search,
  Filter,
  CheckCircle2,
  ShieldCheck,
  Download,
  BookOpen,
  MapPin,
  Calendar,
  Sparkles,
  Layers,
  ArrowUpRight,
  ExternalLink,
  Building2,
  Globe,
  FileText,
  Compass,
  FileDown,
  Info,
  Library,
} from "lucide-react";
import { PUBLIC_ARCHIVED_REPORTS } from "../data/mockPublicReports";
import { ECOLOGICAL_FIELDS } from "../data/fieldsData";
import { FieldCategory, PublicArchivedReport } from "../types";

interface PublicArchiveViewProps {
  onSelectFieldFromPublic: (fieldId: FieldCategory) => void;
}

export const PublicArchiveView: React.FC<PublicArchiveViewProps> = ({
  onSelectFieldFromPublic,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFieldFilter, setSelectedFieldFilter] = useState<string>("ALL");
  const [selectedReport, setSelectedReport] = useState<PublicArchivedReport | null>(null);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  const filteredReports = PUBLIC_ARCHIVED_REPORTS.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.surveyCode && item.surveyCode.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesField =
      selectedFieldFilter === "ALL" || item.fieldId === selectedFieldFilter;
    return matchesSearch && matchesField;
  });

  const handleDownloadReport = (report: PublicArchivedReport) => {
    const isGeomorphology = report.fieldId === "plankton_landscape";
    const content = `===============================================================
[기후에너지환경부 / 국립생태원 전국자연환경조사 보고서 성과물]
===============================================================
■ 조사분야: ${report.fieldName} (${report.fieldId})
■ 보고서명: ${report.title}
■ 조사코드: ${report.surveyCode || "NIE-SURVEY-2024-STD"}
■ 조사지역: ${report.region}
■ 조사연도: ${report.year}
■ 검수확정일: ${report.verifiedAt} (검수등급: ${report.verificationBadge})
■ 주관기관: ${report.supervisingAgency || "기후에너지환경부 자연보전국 / 국립생태원"}
■ 공간해상도: ${report.gridResolution}
■ 파일포맷: ${report.fileFormat || "HWPX / PDF / CSV"} (${report.fileSize || "15.0 MB"})

---------------------------------------------------------------
[대국민 생태정보 요약]
---------------------------------------------------------------
${report.summary}

${
  isGeomorphology
    ? `- 확인 지형경관 요소: 총 ${report.speciesCount}개소 (하천·산지지형 등)
- 지형보전등급: Ⅱ등급 2개소, Ⅲ등급 6개소 (지형평가표 10대 항목 판정)`
    : `- 확인 출현 생물종: 총 ${report.speciesCount}종
- 멸종위기 야생생물 및 법정보호종: ${report.endangeredCount}종 (국민안전 10km 격자 마스킹 적용)`
}

---------------------------------------------------------------
[공식 정보 연계 포털 링크]
---------------------------------------------------------------
1. 기후에너지환경부 디지털 도서관:
   ${report.officialMinistryUrl}

2. 국립생태원 에코뱅크(EcoBank 2.0) 데이터셋 포털:
   ${report.ecoBankUrl}

3. 환경공간정보서비스(EGIS) 지리정보:
   ${report.egisUrl || "https://egis.me.go.kr"}

4. 국립생태원 자동 검수 시스템(AIESIS):
   공식 검수 표준 규격 및 마스킹 보안 지침 준수 완료
===============================================================`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `[기후에너지환경부_국립생태원]_${report.fieldName}_${report.year}_${report.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccessToast(`[${report.fieldName}] 성과물 및 연계 링크 파일 다운로드가 완료되었습니다.`);
    setTimeout(() => setDownloadSuccessToast(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {downloadSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-xs border border-emerald-500/40 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{downloadSuccessToast}</span>
        </div>
      )}

      {/* Hero for Public Citizens */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-emerald-500/30 shadow-xs relative overflow-hidden">
        <div className="max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              대국민 생태정보 공개 포털
            </span>
            <span className="text-xs text-slate-300 font-mono">
              기후에너지환경부 · 국립생태원 전국자연환경조사 연계 아카이브
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            전국자연환경조사 관련 자료를 투명하게 열람하세요
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 mt-2 leading-relaxed">
            국립생태원 자동 검수 시스템을 통해 엄격한 표준 서식, K-BML 학명 체계 및 멸종위기종 서식지 안전
            마스킹 검증을 마친 공공 생태조사 보고서와 기후에너지환경부 디지털 도서관 및 에코뱅크(EcoBank) 원본 데이터 링크를 대국민에게 직접 연결하여 제공합니다.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-emerald-200">
            <div className="flex items-center space-x-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
              <Library className="w-4 h-4 text-emerald-300" />
              <span>기후에너지환경부 디지털 도서관 공식 연동</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
              <Globe className="w-4 h-4 text-cyan-300" />
              <span>국립생태원 에코뱅크(EcoBank 2.0) 원문 연계</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>멸종위기종 서식지 10km 정방격자 안전보호</span>
            </div>
          </div>
        </div>
      </div>

      {/* Official Portals Direct Access Strip */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-700 animate-pulse"></span>
            <h3 className="text-xs font-bold text-slate-800">
              기후에너지환경부 및 유관기관 자연환경조사 공식 연계 포털
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            정부·공공기관 공식 플랫폼
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          <a
            href="https://library.mcee.go.kr/#/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-white hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 rounded-xl transition flex items-center justify-between group shadow-2xs"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                <Library className="w-4 h-4" />
              </div>
              <div>
                <strong className="block text-slate-900 font-bold text-xs group-hover:text-emerald-800">
                  기후에너지환경부 디지털 도서관
                </strong>
                <span className="text-[10px] text-slate-500 block">전국자연환경조사 보고서 열람</span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 transition shrink-0" />
          </a>

          <a
            href="https://nie-ecobank.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-white hover:bg-cyan-50/60 border border-slate-200 hover:border-cyan-300 rounded-xl transition flex items-center justify-between group shadow-2xs"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-800 shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <strong className="block text-slate-900 font-bold text-xs group-hover:text-cyan-800">
                  국립생태원 EcoBank 2.0
                </strong>
                <span className="text-[10px] text-slate-500 block">자연환경조사 원자료·보고서</span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-700 transition shrink-0" />
          </a>

          <a
            href="https://egis.me.go.kr/map/map.do"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-white hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 rounded-xl transition flex items-center justify-between group shadow-2xs"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-800 shrink-0">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <strong className="block text-slate-900 font-bold text-xs group-hover:text-indigo-800">
                  환경공간정보서비스 (EGIS)
                </strong>
                <span className="text-[10px] text-slate-500 block">생태자연도 1:25,000 격자 지도</span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-700 transition shrink-0" />
          </a>

          <a
            href="https://www.kbr.go.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-white hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 rounded-xl transition flex items-center justify-between group shadow-2xs"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <strong className="block text-slate-900 font-bold text-xs group-hover:text-amber-800">
                  국가생물다양성기관연합
                </strong>
                <span className="text-[10px] text-slate-500 block">K-BML 국가생물종목록·분포</span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-700 transition shrink-0" />
          </a>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="지역(함양, 산청), 생물종/지형요소, 조사코드 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* 9 Field Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedFieldFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
              selectedFieldFilter === "ALL"
                ? "bg-emerald-800 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            전체 분야 ({PUBLIC_ARCHIVED_REPORTS.length})
          </button>
          {ECOLOGICAL_FIELDS.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFieldFilter(f.id)}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
                selectedFieldFilter === f.id
                  ? "bg-emerald-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Verified Public Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReports.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                  {report.fieldName}
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{report.verificationBadge}</span>
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 leading-snug hover:text-emerald-700 transition">
                {report.title}
              </h3>

              {report.surveyCode && (
                <div className="text-[10px] font-mono text-slate-400 mt-1">
                  코드: {report.surveyCode}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-2">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{report.region}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{report.year}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 mt-3 line-clamp-3 leading-relaxed">
                {report.summary}
              </p>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="text-slate-600">
                  {report.fieldId === "plankton_landscape" ? (
                    <>
                      지형요소 유형: <strong className="text-slate-900">{report.speciesCount}개소</strong>
                    </>
                  ) : report.fieldId === "vegetation" ? (
                    <>
                      식생군락 유형: <strong className="text-slate-900">{report.speciesCount}개</strong>
                    </>
                  ) : (
                    <>
                      출현종: <strong className="text-slate-900">{report.speciesCount}종</strong>
                    </>
                  )}
                </div>
                <div className="text-amber-700 font-bold">
                  {report.fieldId === "plankton_landscape" ? (
                    "보전등급: Ⅱ·Ⅲ등급"
                  ) : report.fieldId === "vegetation" ? (
                    "보전등급: Ⅱ등급"
                  ) : (
                    `보호종: ${report.endangeredCount}종`
                  )}
                </div>
              </div>
            </div>

            {/* Links and Actions */}
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-mono text-[10px]">
                  {report.fileFormat} ({report.fileSize})
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                  보안격자 적용
                </span>
              </div>

              {/* Direct Ministry & EcoBank Link Buttons */}
              <div className="grid grid-cols-2 gap-1.5">
                <a
                  href={report.officialMinistryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1.5 text-[11px] font-semibold text-slate-700 hover:text-emerald-800 bg-slate-100 hover:bg-emerald-50 rounded-lg transition flex items-center justify-center space-x-1 border border-slate-200"
                  title="기후에너지환경부 디지털 도서관 바로가기"
                >
                  <Library className="w-3 h-3 text-emerald-700" />
                  <span>디지털 도서관</span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                </a>

                <a
                  href={report.ecoBankUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1.5 text-[11px] font-semibold text-cyan-800 hover:text-cyan-900 bg-cyan-50 hover:bg-cyan-100 rounded-lg transition flex items-center justify-center space-x-1 border border-cyan-200"
                  title="에코뱅크 자연환경조사 데이터셋 바로가기"
                >
                  <Globe className="w-3 h-3 text-cyan-700" />
                  <span>EcoBank 파일</span>
                  <ExternalLink className="w-2.5 h-2.5 text-cyan-500" />
                </a>
              </div>

              <div className="flex items-center space-x-1.5 pt-1">
                <button
                  onClick={() => handleDownloadReport(report)}
                  className="flex-1 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center justify-center space-x-1"
                  title="성과물 요약 및 공식 링크 다운로드"
                >
                  <FileDown className="w-3.5 h-3.5 text-slate-600" />
                  <span>다운로드</span>
                </button>
                <button
                  onClick={() => setSelectedReport(report)}
                  className="flex-1 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition flex items-center justify-center space-x-1"
                >
                  <span>상세 열람</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Report Modal for Citizens */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  국립생태원 검수완료 공공 보고서
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {selectedReport.surveyCode}
                </span>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-xs text-slate-400 hover:text-slate-700 font-bold"
              >
                닫기 ✕
              </button>
            </div>

            <div>
              <span className="text-xs text-slate-500 font-bold">[{selectedReport.fieldName}]</span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5 leading-snug">
                {selectedReport.title}
              </h3>
            </div>

            {/* Official Links Banner inside Modal */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 p-4 rounded-xl border border-emerald-200 space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-950">
                <Globe className="w-4 h-4 text-emerald-700" />
                <span>기후에너지환경부 및 국립생태원 공식 원문 데이터 링크</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                <a
                  href={selectedReport.officialMinistryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-white hover:bg-emerald-100/50 border border-emerald-200 rounded-lg font-semibold text-emerald-950 flex items-center justify-between group transition"
                >
                  <div className="flex items-center space-x-2">
                    <Library className="w-4 h-4 text-emerald-700" />
                    <span>기후에너지환경부 디지털 도서관</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700" />
                </a>

                <a
                  href={selectedReport.ecoBankUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-white hover:bg-cyan-100/50 border border-cyan-200 rounded-lg font-semibold text-cyan-950 flex items-center justify-between group transition"
                >
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-cyan-700" />
                    <span>EcoBank 2.0 데이터셋</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-700" />
                </a>

                <a
                  href={selectedReport.egisUrl || "https://egis.me.go.kr"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-white hover:bg-indigo-100/50 border border-indigo-200 rounded-lg font-semibold text-indigo-950 flex items-center justify-between group transition sm:col-span-2"
                >
                  <div className="flex items-center space-x-2">
                    <Compass className="w-4 h-4 text-indigo-700" />
                    <span>환경공간정보서비스(EGIS) 1:25,000 도엽 지리정보 조회</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-700" />
                </a>
              </div>
            </div>

            {/* Key Metadata Table */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <strong className="text-slate-900">주관 부처:</strong> {selectedReport.supervisingAgency}
                </div>
                <div>
                  <strong className="text-slate-900">조사 권역:</strong> {selectedReport.region}
                </div>
                <div>
                  <strong className="text-slate-900">조사 연도:</strong> {selectedReport.year} (확정: {selectedReport.verifiedAt})
                </div>
                <div>
                  <strong className="text-slate-900">제공 파일 포맷:</strong> {selectedReport.fileFormat} ({selectedReport.fileSize})
                </div>
              </div>
              <div className="pt-1 border-t border-slate-200">
                {selectedReport.fieldId === "plankton_landscape" ? (
                  <>
                    <strong className="text-slate-900">지형경관 현황:</strong> 확인 지형요소 유형 {selectedReport.speciesCount}개소 (지형보전 Ⅱ등급 2개소, Ⅲ등급 6개소 정밀평가 완료)
                  </>
                ) : selectedReport.fieldId === "vegetation" ? (
                  <>
                    <strong className="text-slate-900">식생 현황:</strong> 확인 식생형(군락유형) {selectedReport.speciesCount}개 (방형구 37개소, 군락구조표 내 구성식물 147종, 식생보전 Ⅱ등급 신갈나무-졸참나무군락·소나무군락 등 포함)
                  </>
                ) : (
                  <>
                    <strong className="text-slate-900">생물다양성 현황:</strong> 확인 생물종 {selectedReport.speciesCount}종 (멸종위기종 및 법정보호종 {selectedReport.endangeredCount}종 포함)
                  </>
                )}
              </div>
              <div>
                <strong className="text-slate-900">위치정보 보안:</strong>{" "}
                {selectedReport.fieldId === "plankton_landscape"
                  ? "지형보전 및 학술가치 보호를 위해 지형속성 정밀좌표는 국가공간정보 보안지침에 따라 안전하게 보호 관리됩니다."
                  : "멸종위기 야생생물 서식처는 자연환경보전법 및 국립생태원 보안지침에 따라 10km x 10km 정방격자로 안전하게 비공개 처리되었습니다."}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-1">대국민 생태정보 요약</h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                {selectedReport.summary}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100">
              <button
                onClick={() => {
                  onSelectFieldFromPublic(selectedReport.fieldId);
                  setSelectedReport(null);
                }}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                → {selectedReport.fieldName} 분야 검수 시스템 바로가기
              </button>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleDownloadReport(selectedReport)}
                  className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>보고서 파일 다운로드</span>
                </button>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

