import React from "react";
import {
  ShieldCheck,
  Globe,
  FileSearch,
  BookOpen,
  Menu,
  Sparkles,
  Activity,
  Layers,
} from "lucide-react";
import { SystemHealthResponse } from "../services/apiClient";

interface HeaderProps {
  activeTab: "inspect" | "public_archive" | "standards";
  setActiveTab: (tab: "inspect" | "public_archive" | "standards") => void;
  systemHealth: SystemHealthResponse | null;
  onOpenStandardsModal: () => void;
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  systemHealth,
  onOpenStandardsModal,
  onToggleMobileSidebar,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile Toggle & Context Title */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-hidden"
              aria-label="메뉴 열기"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs font-bold lg:hidden">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    국립생태원 생태조사 통합검증
                  </span>
                  <span className="hidden sm:inline-flex items-center space-x-1 text-[11px] font-medium text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>실시간 검수엔진 가동 중</span>
                  </span>
                </div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
                  전국 자연환경조사 9대 분야 생태보고서 검수시스템
                </h1>
              </div>
            </div>
          </div>

          {/* Right Navigation & Telemetry Badges */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Tab Switcher */}
            <div className="hidden sm:flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setActiveTab("inspect")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "inspect"
                    ? "bg-white text-emerald-900 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileSearch className="w-3.5 h-3.5 text-emerald-600" />
                <span>보고서 검수</span>
              </button>
              <button
                onClick={() => setActiveTab("public_archive")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "public_archive"
                    ? "bg-white text-emerald-900 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-teal-600" />
                <span>생태정보 열람</span>
              </button>
            </div>

            {/* 9 Fields Standard Guide Button */}
            <button
              onClick={onOpenStandardsModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">9대 분야 표준지침</span>
              <span className="sm:hidden">지침서</span>
            </button>

            {/* SLA Badge */}
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono font-bold text-[11px]">SLA {systemHealth?.sla || "99.99%"}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

