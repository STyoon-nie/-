import React from "react";
import { Sparkles, Brain, CheckSquare, ShieldAlert, FileText, ArrowRight } from "lucide-react";
import { AIReviewResult } from "../types";

interface AIReviewSectionProps {
  aiReview: AIReviewResult | null;
  isLoading: boolean;
  fieldName: string;
}

export const AIReviewSection: React.FC<AIReviewSectionProps> = ({
  aiReview,
  isLoading,
  fieldName,
}) => {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-emerald-950 rounded-2xl p-6 text-white border border-emerald-500/30 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-spin">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              표준 규칙 기반 종합 검토 진행 중...
            </h3>
            <p className="text-xs text-emerald-300/80">
              {fieldName} 분야의 학술적 방법론 타당성 및 서식지 보전 논리 일관성을 정밀 검증하고 있습니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!aiReview) return null;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 rounded-2xl p-6 text-white border border-emerald-500/30 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-xs">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                표준 규칙 기반 종합 검토
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Rule Engine</span>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">
              국립생태원 표준 규칙 기반 검토 의견
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
          <span className="text-xs text-slate-300">생태 논리 완성도</span>
          <span className="text-sm font-black text-emerald-300 font-mono">
            {aiReview.logicScore || 90}점
          </span>
        </div>
      </div>

      {/* Grid: Summary, Methodology, Ecological Risk */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Card 1: 종합 총평 */}
        <div className="bg-white/5 backdrop-blur p-4 rounded-xl border border-white/10 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-300 font-bold">
            <FileText className="w-4 h-4" />
            <span>보고서 종합 총평</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {aiReview.summary}
          </p>
        </div>

        {/* Card 2: 조사방법론 평가 */}
        <div className="bg-white/5 backdrop-blur p-4 rounded-xl border border-white/10 space-y-2">
          <div className="flex items-center space-x-2 text-cyan-300 font-bold">
            <CheckSquare className="w-4 h-4" />
            <span>조사방법론 및 노력량 평가</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {aiReview.methodologyEvaluation}
          </p>
        </div>

        {/* Card 3: 생태적 리스크 및 보호종 진단 */}
        <div className="bg-white/5 backdrop-blur p-4 rounded-xl border border-white/10 space-y-2">
          <div className="flex items-center space-x-2 text-amber-300 font-bold">
            <ShieldAlert className="w-4 h-4" />
            <span>생태적 리스크 & 보전대책</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {aiReview.ecologicalRiskAssessment}
          </p>
        </div>
      </div>

      {/* Recommended Actions */}
      {aiReview.recommendedActions && aiReview.recommendedActions.length > 0 && (
        <div className="bg-emerald-950/60 p-4 rounded-xl border border-emerald-500/20 text-xs">
          <h4 className="text-emerald-300 font-bold mb-2 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>최종 승인을 위한 핵심 보완 권고사항:</span>
          </h4>
          <ul className="space-y-1.5 text-slate-200">
            {aiReview.recommendedActions.map((act, i) => (
              <li key={i} className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold font-mono">0{i + 1}.</span>
                <span>{act}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
