import React from "react";
import {
  Flower2,
  Trees,
  Footprints,
  Feather,
  ShieldAlert,
  Fish,
  Bug,
  Boxes,
  Layers,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { ECOLOGICAL_FIELDS } from "../data/fieldsData";
import { FieldCategory } from "../types";

interface FieldSelectorProps {
  selectedField: FieldCategory;
  onSelectField: (fieldId: FieldCategory) => void;
}

const ICONS: Record<string, React.ElementType> = {
  Flower2,
  Trees,
  Footprints,
  Feather,
  ShieldAlert,
  Fish,
  Bug,
  Boxes,
  Layers,
};

export const FieldSelector: React.FC<FieldSelectorProps> = ({
  selectedField,
  onSelectField,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold">
              전국자연환경조사 9대 전문분야
            </span>
            <span className="text-xs text-slate-500 font-medium">
              국립생태원 표준 서식 검수 규격
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            검수 대상 생태 조사분야를 선택하십시오
          </h2>
        </div>
        <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          분야별 전용 알고리즘 & 지침 100% 자동 매핑
        </div>
      </div>

      {/* 9 Grid Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
        {ECOLOGICAL_FIELDS.map((f, index) => {
          const IconComp = ICONS[f.iconName] || Flower2;
          const isSelected = selectedField === f.id;

          return (
            <button
              key={f.id}
              onClick={() => onSelectField(f.id)}
              className={`text-left p-3.5 rounded-xl border transition-all relative group flex flex-col justify-between ${
                isSelected
                  ? "bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                  : "bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 font-mono">
                        0{index + 1}
                      </span>
                      <h3
                        className={`text-sm font-bold leading-tight ${
                          isSelected ? "text-emerald-950" : "text-slate-900"
                        }`}
                      >
                        {f.name}
                      </h3>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>선택됨</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                  {f.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate max-w-[170px]">
                  주요 보호종: {f.protectedSpeciesExamples[0]}
                </span>
                <span className="text-emerald-700 font-medium">
                  {f.surveySeasons.length}개 조사시기
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
