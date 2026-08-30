import React, { useRef } from "react";
import { X, Printer, Download, ShieldCheck, Award, QrCode } from "lucide-react";
import { InspectionReportResult } from "../types";

interface InspectionCertificateModalProps {
  result: InspectionReportResult;
  onClose: () => void;
}

export const InspectionCertificateModal: React.FC<InspectionCertificateModalProps> = ({
  result,
  onClose,
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const isPassed = result.score.verdict === "PASS" || result.score.verdict === "CONDITIONAL_PASS";

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-300 shadow-2xl overflow-hidden my-8">
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold">국립생태원 생태보고서 검수 성적서 및 확인서</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>출력 및 PDF 저장</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Body (Printable Area) */}
        <div ref={certificateRef} className="p-8 sm:p-12 bg-white text-slate-900 font-sans print:p-0">
          {/* Certificate Border Design */}
          <div className="border-4 border-double border-emerald-900/30 p-6 sm:p-8 rounded-xl relative bg-emerald-50/10">
            {/* Watermark Logo */}
            <div className="absolute inset-0 flex items-center justify-center opacity-4 pointer-events-none">
              <ShieldCheck className="w-80 h-80 text-emerald-950" />
            </div>

            {/* Top Seal Header */}
            <div className="text-center pb-6 border-b border-emerald-900/20">
              <div className="text-xs font-bold text-emerald-800 tracking-widest uppercase">
                National Institute of Ecology · Quality Assurance Certificate
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
                생태조사 보고서 표준 검수 확인서
              </h2>
              <div className="mt-2 text-xs font-mono text-slate-500">
                발급번호: NIE-QC-{result.id} | 발급일시: {new Date(result.analyzedAt).toLocaleDateString("ko-KR")}
              </div>
            </div>

            {/* Main Details Grid */}
            <div className="my-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block">보고서 명칭:</span>
                  <strong className="text-sm text-slate-900 font-bold block">{result.reportTitle}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">검수 전문분야:</span>
                  <strong className="text-slate-800 font-semibold">{result.fieldName} (전국자연환경조사 9대 분야)</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">작성기관 / 책임자:</span>
                  <strong className="text-slate-800 font-semibold">{result.authorOrOrg}</strong>
                </div>
              </div>

              <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block">종합 판정:</span>
                  <strong
                    className={`text-sm font-black px-2 py-0.5 rounded-md inline-block ${
                      result.score.verdict === "PASS"
                        ? "bg-emerald-100 text-emerald-900"
                        : result.score.verdict === "CONDITIONAL_PASS"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-rose-100 text-rose-900"
                    }`}
                  >
                    {result.score.verdict === "PASS"
                      ? "최종 적합 (PASS)"
                      : result.score.verdict === "CONDITIONAL_PASS"
                      ? "조건부 적합 (CONDITIONAL)"
                      : "검수 반려 (REJECTED)"}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">검수 종합 득점:</span>
                  <strong className="text-slate-900 font-mono text-base font-bold">
                    {result.score.totalScore} / 100점
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">대국민 좌표 보안 마스킹:</span>
                  <strong className={result.coordinateMaskingChecked ? "text-emerald-700 font-bold" : "text-rose-700 font-bold"}>
                    {result.coordinateMaskingChecked ? "10km 안전보호격자 준수" : "초정밀좌표 노출 (비공개필요)"}
                  </strong>
                </div>
              </div>
            </div>

            {/* Criteria Breakdown Table */}
            <div className="my-6">
              <h4 className="text-xs font-bold text-slate-800 mb-2">항목별 평가 세부내역</h4>
              <table className="w-full text-xs text-left border border-slate-200">
                <thead className="bg-slate-100 font-bold text-slate-700">
                  <tr>
                    <th className="p-2 border-b border-slate-200">검수 영역</th>
                    <th className="p-2 border-b border-slate-200 text-right">배점</th>
                    <th className="p-2 border-b border-slate-200 text-right">취득점수</th>
                    <th className="p-2 border-b border-slate-200">판정</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(result.score?.breakdown ? (Object.values(result.score.breakdown) as { label: string; score: number; max: number }[]) : []).map((v, idx) => (
                    <tr key={idx}>
                      <td className="p-2 text-slate-800">{v.label}</td>
                      <td className="p-2 text-right font-mono text-slate-500">{v.max}점</td>
                      <td className="p-2 text-right font-mono font-bold text-slate-900">{v.score}점</td>
                      <td className="p-2">
                        <span
                          className={`font-bold ${
                            v.score === v.max ? "text-emerald-700" : v.score >= v.max * 0.7 ? "text-slate-700" : "text-rose-600"
                          }`}
                        >
                          {v.score === v.max ? "만점" : v.score >= v.max * 0.7 ? "양호" : "보완요망"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Statement and Seal Stamp */}
            <div className="pt-6 border-t border-emerald-900/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left text-xs text-slate-600 max-w-md">
                <p className="font-semibold text-slate-800">
                  위 보고서는 국립생태원 전국자연환경조사 9대 전문분야 표준 검수 규격에 의거하여 검수되었음을 증명합니다.
                </p>
                <p className="text-[11px] text-slate-400">
                  본 확인서는 환경부 국가생물다양성 통합관리시스템(KBR) 및 공공데이터 개방 가이드라인을 준수합니다.
                </p>
              </div>

              {/* Official Seal Graphic */}
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 rounded-full border-2 border-rose-700 text-rose-700 flex items-center justify-center p-1 text-center rotate-[-8deg] shadow-xs">
                  <div className="border border-rose-600 rounded-full w-full h-full flex flex-col items-center justify-center text-[9px] font-black leading-tight">
                    <span>국립</span>
                    <span>생태원장</span>
                    <span>직인</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition"
          >
            확인 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
