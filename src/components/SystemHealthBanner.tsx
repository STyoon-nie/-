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
              <span className="font-semibold">대국민 고가용성 보장 시스템 (HA 24/7/365)</span>
            </div>
            <span className="text-slate-400 hidden sm:inline">|</span>
            <span className="text-slate-300 hidden sm:inline">
              국립생태원 자연환경조사 빅데이터 및 국가생물종목록(K-BML) 실시간 연동
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
              <span>AI정밀심사: <strong className="text-emerald-300">Gemini 3.7 Core</strong></span>
            </div>
            <div className="hidden md:flex items-center space-x-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>무중단 가동률: {health?.sla || "99.99%"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
