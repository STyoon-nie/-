import React, { useState, useEffect } from "react";
import {
  Server,
  Cpu,
  ShieldCheck,
  Zap,
  Activity,
  HardDrive,
  CheckCircle2,
  FileCheck2,
  AlertTriangle,
  Clock,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { SystemHealthResponse } from "../services/apiClient";
import { FieldCategory } from "../types";

interface TelemetryPanelProps {
  systemHealth: SystemHealthResponse | null;
  selectedField: FieldCategory;
  onSelectField?: (fieldId: FieldCategory) => void;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({
  systemHealth,
  selectedField,
  onSelectField,
}) => {
  // Live simulated traffic bar heights for smooth telemetry visual
  const [trafficBars, setTrafficBars] = useState([35, 50, 42, 68, 85, 70, 55, 90, 65, 78, 88, 72]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTrafficBars((prev) =>
        prev.map((val) => {
          const delta = Math.floor(Math.random() * 15) - 7;
          return Math.min(98, Math.max(25, val + delta));
        })
      );
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const RECENT_AUDITS = [
    {
      id: "aud-01",
      title: "충남_가야산_식물상_조사보고서",
      field: "식물상",
      fieldId: "flora" as FieldCategory,
      status: "검수적합",
      score: 96,
      time: "방금 전",
      color: "emerald",
    },
    {
      id: "aud-02",
      title: "지리산_국립공원_조류_동태모니터링",
      field: "조류",
      fieldId: "birds" as FieldCategory,
      status: "수정권고",
      score: 84,
      time: "12분 전",
      color: "amber",
    },
    {
      id: "aud-03",
      title: "낙동강_하구_담수어류_분포현황",
      field: "담수어류",
      fieldId: "freshwater_fish" as FieldCategory,
      status: "검수적합",
      score: 98,
      time: "28분 전",
      color: "emerald",
    },
    {
      id: "aud-04",
      title: "강원_DMZ접경지_포유류_흔적조사",
      field: "포유류",
      fieldId: "mammals" as FieldCategory,
      status: "좌표마스킹완료",
      score: 92,
      time: "45분 전",
      color: "cyan",
    },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Server Health Nodes (Sleek Dark Card) */}
      <div className="bg-[#1a2b3c] text-white rounded-2xl p-4.5 border border-slate-700/80 shadow-md">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              서버 가동 노드 현황 (Server Nodes)
            </h3>
          </div>
          <span className="flex items-center space-x-1.5 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>ALL ONLINE</span>
          </span>
        </div>

        {/* Node Items */}
        <div className="mt-3 space-y-2.5 text-xs">
          {/* Node 1 */}
          <div className="flex items-center justify-between bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700/60">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-300 font-medium">Main API Core Node</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 font-semibold">STABLE 0.4ms</span>
          </div>

          {/* Node 2 */}
          <div className="flex items-center justify-between bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700/60">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-300 font-medium">9대분야 서식 분석엔진</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 font-semibold">ACTIVE</span>
          </div>

          {/* Node 3 */}
          <div className="flex items-center justify-between bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700/60">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-slate-300 font-medium">좌표 보안 및 마스킹 필터</span>
            </div>
            <span className="text-[11px] font-mono text-cyan-300 font-semibold">10km Grid</span>
          </div>

          {/* Node 4 */}
          <div className="flex items-center justify-between bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700/60">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-slate-300 font-medium">AI 정밀 질적심사</span>
            </div>
            <span className="text-[11px] font-mono text-amber-300 font-semibold">Gemini 3.7 Core</span>
          </div>
        </div>

        {/* Real-time Traffic Bar Graph */}
        <div className="mt-4 pt-3 border-t border-slate-700">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
            <span className="flex items-center space-x-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>실시간 검수 트래픽 추이</span>
            </span>
            <span className="font-mono text-emerald-400">99.99% SLA</span>
          </div>

          <div className="flex items-end space-x-1.5 h-12 pt-1">
            {trafficBars.map((height, i) => (
              <div
                key={i}
                className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/50 rounded-t transition-all duration-500 relative group"
                style={{ height: `${height}%` }}
              >
                <div
                  className="w-full bg-emerald-400 rounded-t transition-all duration-500"
                  style={{ height: `${Math.min(100, height * 0.9)}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Recent Audit History Card */}
      <div className="bg-white rounded-2xl p-4.5 border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              최근 실시간 검수 감사 이력
            </h3>
          </div>
          <span className="text-[11px] font-medium text-slate-400">Real-time Stream</span>
        </div>

        <div className="mt-3 space-y-2.5">
          {RECENT_AUDITS.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectField && onSelectField(item.fieldId)}
              className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-emerald-50/50 hover:border-emerald-200 transition cursor-pointer flex items-center justify-between group"
            >
              <div className="min-w-0 flex-1 pr-2">
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className="text-[10px] font-bold text-slate-700 bg-white border border-slate-200 px-1.5 py-0.2 rounded">
                    {item.field}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{item.time}</span>
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-800 truncate group-hover:text-emerald-900">
                  {item.title}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-md ${
                    item.score >= 90
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {item.score}점
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
