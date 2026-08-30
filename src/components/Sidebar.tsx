import React from "react";
import {
  ShieldCheck,
  FileSearch,
  Globe,
  BookOpen,
  Flower2,
  Trees,
  Footprints,
  Feather,
  ShieldAlert,
  Fish,
  Bug,
  Boxes,
  Layers,
  Activity,
  Server,
  ChevronRight,
  X,
} from "lucide-react";
import { ECOLOGICAL_FIELDS } from "../data/fieldsData";
import { FieldCategory } from "../types";
import { SystemHealthResponse } from "../services/apiClient";

interface SidebarProps {
  activeTab: "inspect" | "public_archive" | "standards";
  setActiveTab: (tab: "inspect" | "public_archive" | "standards") => void;
  selectedField: FieldCategory;
  onSelectField: (fieldId: FieldCategory) => void;
  systemHealth: SystemHealthResponse | null;
  onOpenStandardsModal: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

const FIELD_ICONS: Record<string, React.ElementType> = {
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

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  selectedField,
  onSelectField,
  systemHealth,
  onOpenStandardsModal,
  isOpenMobile,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#1a2b3c] text-white flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Branding Section */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center text-[#1a2b3c] font-black shadow-md">
                <ShieldCheck className="w-5 h-5 text-[#1a2b3c]" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
                  국립생태원 NIE
                </div>
                <div className="text-sm font-bold tracking-tight text-white leading-tight">
                  보고서 검수 시스템
                </div>
              </div>
            </div>
            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Navigation Links */}
          <div className="px-3 py-4 space-y-1">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
              서비스 모드
            </div>
            <button
              onClick={() => {
                setActiveTab("inspect");
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "inspect"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-xs"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <FileSearch className="w-4 h-4 text-emerald-400" />
                <span>실시간 보고서 검수</span>
              </div>
              {activeTab === "inspect" && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("public_archive");
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "public_archive"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-xs"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Globe className="w-4 h-4 text-teal-400" />
                <span>대국민 생태정보 열람</span>
              </div>
              {activeTab === "public_archive" && (
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => {
                onOpenStandardsModal();
                onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
            >
              <div className="flex items-center space-x-2.5">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>9대 분야 표준지침</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>

          {/* 9 Ecological Fields Fast Switcher */}
          <div className="px-3 py-2 border-t border-slate-700/60 flex-1">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                9대 전문분야
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-1.5 py-0.5 rounded">
                9 Fields
              </span>
            </div>

            <div className="space-y-1">
              {ECOLOGICAL_FIELDS.map((f, idx) => {
                const IconComp = FIELD_ICONS[f.iconName] || Flower2;
                const isSelected = selectedField === f.id;

                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      onSelectField(f.id);
                      setActiveTab("inspect");
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all text-left group ${
                      isSelected
                        ? "bg-slate-800/90 text-white font-bold border-l-3 border-emerald-400 shadow-xs"
                        : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <div
                        className={`w-2 h-2 rounded-full transition-all ${
                          isSelected
                            ? "bg-emerald-400 shadow-sm animate-pulse ring-2 ring-emerald-400/30"
                            : "bg-slate-600 group-hover:bg-slate-500"
                        }`}
                      />
                      <IconComp
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isSelected ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-300"
                        }`}
                      />
                      <span className="truncate">{f.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400">
                      0{idx + 1}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom System Availability SLA Card */}
        <div className="p-3 border-t border-slate-700/60 bg-[#142230]">
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span className="font-semibold text-white">시스템 가동상태</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/50">
                정상
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between mt-2 pt-2 border-t border-slate-700/70">
              <span>대국민 SLA</span>
              <span className="font-mono text-white font-bold">{systemHealth?.sla || "99.99%"}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center space-x-1">
              <Server className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">24/7/365 High Availability</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
