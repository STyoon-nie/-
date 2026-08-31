import React from "react";
import { Activity, Server, Cpu, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { SystemHealthResponse } from "../services/apiClient";

interface SystemHealthBannerProps {
  health: SystemHealthResponse | null;
}

export const SystemHealthBanner: React.FC<SystemHealthBannerProps> = ({ health }) => {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white border-b border-emerald-800/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold">국립생태원 표준 규칙 기반 보고서 검수</span>
            </div>
            <span className="text-slate-400 hidden sm:inline">|</span>
            <span className="text-slate-300 hidden sm:inline">
              국립생태원 검수 지침 및 국가생물종목록(K-BML) 기준 적용 · 브라우저 내 처리
            </span>
          </div>

          <div className="flex items-center space-x-4 text-slate-300 font-mono text-[11px]">
            <div className="flex items-center space-x-1">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>검수엔진: <strong className="text-white">Active</strong></span>
            </div>
            <div className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>좌표보안: <strong className="text-white">10km 마스킹 On</strong></span>
            </div>
            <div className="flex items-center space-x-1">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>검수방식: <strong className="text-emerald-300">규칙 기반 엔진</strong></span>
            </div>
            <div className="hidden md:flex items-center space-x-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>처리 방식: 로컬(브라우저 내)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
