import React, { useState } from "react";
import { X, BookOpen, CheckCircle2, ShieldCheck, Download, ExternalLink } from "lucide-react";
import { ECOLOGICAL_FIELDS } from "../data/fieldsData";
import { FieldCategory } from "../types";

interface StandardsModalProps {
  onClose: () => void;
  onSelectField: (fieldId: FieldCategory) => void;
}

export const StandardsModal: React.FC<StandardsModalProps> = ({
  onClose,
  onSelectField,
}) => {
  const [activeFieldId, setActiveFieldId] = useState<FieldCategory>("flora");

  const current =
    ECOLOGICAL_FIELDS.find((f) => f.id === activeFieldId) || ECOLOGICAL_FIELDS[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-300 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold">
              국립생태원 전국자연환경조사 9대 전문분야 표준 검수 규격서
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (Split View) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left 9-Field Navigation */}
          <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-3 overflow-y-auto shrink-0 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 px-3 uppercase tracking-wider block mb-2">
              9대 전문 조사분야
            </span>
            {ECOLOGICAL_FIELDS.map((f, i) => (
              <button
                key={f.id}
                onClick={() => setActiveFieldId(f.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                  activeFieldId === f.id
                    ? "bg-emerald-800 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-200/70"
                }`}
              >
                <span>
                  0{i + 1}. {f.name}
                </span>
                {activeFieldId === f.id && <CheckCircle2 className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>

          {/* Right Field Standards Detail */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  {current.englishName}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {current.standardGuidelineVersion}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-2">
                {current.name} 분야 표준 검수 규격 및 지침
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {current.description}
              </p>
            </div>

            {/* Legal & Chapter Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {current.guidelineChapter && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">
                    지침서 수록 장 및 부록
                  </span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {current.guidelineChapter}
                  </span>
                </div>
              )}
              {current.legalBasis && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">
                    법적 근거 및 훈령
                  </span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {current.legalBasis}
                  </span>
                </div>
              )}
              {current.surveyScaleAndUnit && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl sm:col-span-2">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">
                    조사 축척 및 공간 단위 (방형구·격자·구간)
                  </span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {current.surveyScaleAndUnit}
                  </span>
                </div>
              )}
            </div>

            {/* Official Deliverables */}
            {current.officialDeliverables && current.officialDeliverables.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>국립생태원 표준 제출 성과물 (Deliverables)</span>
                </h4>
                <div className="space-y-1.5 text-xs">
                  {current.officialDeliverables.map((del, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-emerald-950 flex items-center space-x-2 font-medium"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 shrink-0"></span>
                      <span>{del}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Methodology Highlights */}
            {current.methodologyHighlights && current.methodologyHighlights.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-2">
                  핵심 표준 조사방법론 (지침 매뉴얼)
                </h4>
                <div className="grid grid-cols-1 gap-2.5 text-xs">
                  {current.methodologyHighlights.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl"
                    >
                      <h5 className="font-bold text-indigo-950 mb-1">{m.title}</h5>
                      <p className="text-slate-700 leading-relaxed">{m.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Survey Seasons */}
            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 text-xs">
              <h4 className="font-bold text-emerald-950 mb-2">권장 표준 조사시기 (계절성)</h4>
              <div className="flex flex-wrap gap-2">
                {current.surveySeasons.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-white border border-emerald-200 text-emerald-900 rounded-lg font-semibold"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Mandatory Chapters */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-2">
                국립생태원 필수 서식 목차 (누락 시 감점 및 반려)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {current.mandatorySections.map((sec, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium flex items-center space-x-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>
                    <span>{sec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Inspection Rules */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-2">
                핵심 검수 기준 및 수칙
              </h4>
              <ul className="space-y-2 text-xs text-slate-700">
                {current.keyInspectionRules.map((rule, idx) => (
                  <li
                    key={idx}
                    className="p-3 bg-amber-50/40 border border-amber-200/80 rounded-xl flex items-start space-x-2"
                  >
                    <span className="text-amber-700 font-bold font-mono">0{idx + 1}.</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Protected Species / Landscapes / Plant Communities */}
            <div className="bg-slate-100 p-4 rounded-xl text-xs">
              <span className="font-bold text-slate-800 block mb-1">
                {current.id === "plankton_landscape"
                  ? "우수 지형요소 및 보전평가 대상 지형경관 예시:"
                  : current.id === "vegetation"
                  ? "우수 식생군락 및 식생보전등급 대상 군락 예시:"
                  : "주요 법정보호종 및 집중 모니터링 대상종 예시:"}
              </span>
              <div className="text-slate-600">
                {current.protectedSpeciesExamples.join(" · ")}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-mono">
            환경부 고시 자연환경보전법 제30조 준수
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onSelectField(activeFieldId);
                onClose();
              }}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              이 분야 검수 시작하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
