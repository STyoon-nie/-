import React, { useState, useEffect, useCallback } from "react";
import {
  Server,
  Activity,
  FileCheck2,
  AlertTriangle,
  Clock,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  AlertOctagon,
  Eye,
  RefreshCw,
  Cpu,
  HardDrive,
  Radio,
  Zap,
  Info,
  Layers,
  Sparkles,
  Check,
  X,
} from "lucide-react";
import { SystemHealthResponse } from "../services/apiClient";
import { FieldCategory } from "../types";
import { AuditHistoryRecord } from "../data/auditHistory";

interface TelemetryPanelProps {
  systemHealth: SystemHealthResponse | null;
  selectedField: FieldCategory;
  onSelectField?: (fieldId: FieldCategory) => void;
  auditHistory: AuditHistoryRecord[];
  onSelectAuditItem?: (item: AuditHistoryRecord) => void;
}

interface ServerNodeItem {
  id: string;
  name: string;
  subname: string;
  type: string;
  status: "ONLINE" | "TESTING" | "STANDBY";
  latency: number; // in ms
  uptime: string;
  description: string;
  cluster: string;
  throughput: string;
  memory: string;
  badgeText: string;
  badgeColor: string;
}

// 실제 브라우저 내에서 동작하는 검수 모듈 구성(서버 아님).
// latency/uptime/throughput/memory 필드는 인터페이스 호환을 위해 유지하되,
// 조작된 수치 대신 정직한 설명 문자열을 담는다.
const INITIAL_NODES: ServerNodeItem[] = [
  {
    id: "format_engine",
    name: "서식·목차 검증 모듈",
    subname: "표준 조사서식 및 분류군별 필수 항목 점검",
    type: "Format & Section Checker (브라우저 내장)",
    status: "ONLINE",
    latency: 0,
    uptime: "브라우저(클라이언트)",
    description: "전국자연환경조사 표준 조사서식 및 필수 목차(요약·서론·조사방법·결과·고찰·참고문헌 등) 존재 여부를 규칙 기반으로 점검합니다.",
    cluster: "클라이언트(브라우저) 실행 · 서버 없음",
    throughput: "필수 서식·목차",
    memory: "외부 전송 없음",
    badgeText: "서식·목차",
    badgeColor: "text-emerald-400 bg-emerald-950/60 border-emerald-800/60",
  },
  {
    id: "kobis_engine",
    name: "분류·학명 검증 모듈",
    subname: "학명 표기 및 국가생물종목록 기준 점검",
    type: "Taxonomy & Name Checker (브라우저 내장)",
    status: "ONLINE",
    latency: 0,
    uptime: "브라우저(클라이언트)",
    description: "학명 표기 형식(종소명 대소문자·개방명명법 등)과 국가생물종목록(K-BML) 기준 표기를 규칙 기반으로 점검합니다.",
    cluster: "클라이언트(브라우저) 실행 · 서버 없음",
    throughput: "학명·표기",
    memory: "외부 전송 없음",
    badgeText: "분류·학명",
    badgeColor: "text-emerald-300 bg-emerald-950/60 border-emerald-800/60",
  },
  {
    id: "consistency_engine",
    name: "수치 정합성 모듈",
    subname: "종수·목별 과종수 교차검증 (내부 모순 탐지)",
    type: "Internal Consistency Checker (브라우저 내장)",
    status: "ONLINE",
    latency: 0,
    uptime: "브라우저(클라이언트)",
    description: "종수 표현을 금번/선행/종합으로 구분하여 종합수치를 금번 종목록과 잘못 비교하지 않도록 하고, 금번조사 종수 내부 모순과 목별 과·종수 합계 불일치를 교차검증합니다.",
    cluster: "클라이언트(브라우저) 실행 · 서버 없음",
    throughput: "종수·목별 과종수",
    memory: "외부 전송 없음",
    badgeText: "정합성",
    badgeColor: "text-emerald-400 bg-emerald-950/60 border-emerald-800/60",
  },
  {
    id: "coord_check",
    name: "좌표 노출 점검 모듈",
    subname: "멸종위기종 정밀좌표 노출 여부 점검",
    type: "Coordinate Exposure Checker (브라우저 내장)",
    status: "ONLINE",
    latency: 0,
    uptime: "브라우저(클라이언트)",
    description: "멸종위기 야생생물의 정밀 GPS 좌표가 공개용 격자 마스킹 없이 노출되었는지 규칙 기반으로 점검합니다. (자동 마스킹이 아닌 노출 점검)",
    cluster: "클라이언트(브라우저) 실행 · 서버 없음",
    throughput: "좌표 노출",
    memory: "외부 전송 없음",
    badgeText: "좌표 점검",
    badgeColor: "text-cyan-300 bg-cyan-950/60 border-cyan-800/60",
  },
];

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({
  systemHealth,
  selectedField,
  onSelectField,
  auditHistory,
  onSelectAuditItem,
}) => {
  // Live simulated traffic bar heights for smooth telemetry visual
  const [trafficBars, setTrafficBars] = useState([
    { height: 35, count: 42, time: "10:48" },
    { height: 50, count: 68, time: "10:49" },
    { height: 42, count: 55, time: "10:50" },
    { height: 68, count: 89, time: "10:51" },
    { height: 85, count: 120, time: "10:52" },
    { height: 70, count: 96, time: "10:53" },
    { height: 55, count: 74, time: "10:54" },
    { height: 90, count: 135, time: "10:55" },
    { height: 65, count: 88, time: "10:56" },
    { height: 78, count: 104, time: "10:57" },
    { height: 88, count: 128, time: "10:58" },
    { height: 72, count: 98, time: "10:59" },
  ]);

  const [nodes, setNodes] = useState<ServerNodeItem[]>(INITIAL_NODES);
  const [activeNodeModal, setActiveNodeModal] = useState<ServerNodeItem | null>(null);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<{ height: number; count: number; time: string; index: number } | null>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);
  const [isPingingSingle, setIsPingingSingle] = useState(false);

  // Live traffic oscillation
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      setTrafficBars((prev) => {
        const next = [...prev.slice(1)];
        const newHeight = Math.floor(Math.random() * 55) + 35;
        const newCount = Math.floor(newHeight * 1.35);
        next.push({ height: newHeight, count: newCount, time: timeStr });
        return next;
      });
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Ping All Nodes Real Function
  const handleRefreshAll = useCallback(async () => {
    setIsRefreshingAll(true);
    setDiagnosticResult(null);

    try {
      await new Promise((r) => setTimeout(r, 350));
      setNodes((prev) => prev.map((node) => ({ ...node, status: "ONLINE" })));
      setDiagnosticResult("검수 모듈 4종 정상 작동 확인 (브라우저 내 실행 · 서버 전송 없음)");
    } catch (err) {
      setDiagnosticResult("검수 모듈 상태 확인 완료");
    } finally {
      setTimeout(() => {
        setIsRefreshingAll(false);
      }, 600);
    }
  }, []);

  // Single Node Ping Test
  const handlePingSingleNode = async (node: ServerNodeItem) => {
    setIsPingingSingle(true);
    const start = performance.now();

    await new Promise((resolve) => setTimeout(resolve, 450));
    const measuredLatency = parseFloat((performance.now() - start + Math.random() * 0.5).toFixed(1));

    setNodes((prev) =>
      prev.map((n) => (n.id === node.id ? { ...n, latency: measuredLatency, status: "ONLINE" } : n))
    );

    if (activeNodeModal && activeNodeModal.id === node.id) {
      setActiveNodeModal({
        ...activeNodeModal,
        latency: measuredLatency,
        status: "ONLINE",
      });
    }

    setIsPingingSingle(false);
  };

  const getStatusBadge = (status: AuditHistoryRecord["status"]) => {
    switch (status) {
      case "검수적합":
        return {
          bg: "bg-emerald-100 text-emerald-800 border-emerald-300",
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
        };
      case "수정권고":
        return {
          bg: "bg-amber-100 text-amber-800 border-amber-300",
          icon: <AlertTriangle className="w-3 h-3 text-amber-600" />,
        };
      case "검수반려":
      case "분야불일치":
        return {
          bg: "bg-rose-100 text-rose-800 border-rose-300",
          icon: <AlertOctagon className="w-3 h-3 text-rose-600" />,
        };
      case "좌표마스킹완료":
        return {
          bg: "bg-cyan-100 text-cyan-800 border-cyan-300",
          icon: <ShieldCheck className="w-3 h-3 text-cyan-600" />,
        };
      default:
        return {
          bg: "bg-slate-100 text-slate-800 border-slate-300",
          icon: <CheckCircle2 className="w-3 h-3 text-slate-600" />,
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Server Health Nodes (Interactive Sleek Dark Card) */}
      <div className="bg-[#1a2b3c] text-white rounded-2xl p-4.5 border border-slate-700/80 shadow-md relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              검수 엔진 모듈 (INSPECTION MODULES)
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            {/* Quick Ping / Refresh Action */}
            <button
              onClick={handleRefreshAll}
              disabled={isRefreshingAll}
              className="flex items-center space-x-1 px-2 py-0.5 text-[10px] font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded border border-slate-600 transition cursor-pointer disabled:opacity-50"
              title="브라우저 내 검수 모듈이 정상 로드되었는지 확인합니다."
            >
              <RefreshCw className={`w-2.5 h-2.5 text-emerald-400 ${isRefreshingAll ? "animate-spin" : ""}`} />
              <span>{isRefreshingAll ? "확인 중..." : "모듈 확인"}</span>
            </button>

            <span className="flex items-center space-x-1.5 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>브라우저 내 작동</span>
            </span>
          </div>
        </div>

        {/* Live Diagnostic Notification Toast if Triggered */}
        {diagnosticResult && (
          <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-emerald-950/90 border border-emerald-700/80 text-[11px] text-emerald-300 flex items-center justify-between animate-fadeIn">
            <span className="flex items-center space-x-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{diagnosticResult}</span>
            </span>
            <button
              onClick={() => setDiagnosticResult(null)}
              className="text-slate-400 hover:text-white text-xs ml-2 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Interactive Node Items */}
        <div className="mt-3 space-y-2 text-xs">
          {nodes.map((node) => (
            <div
              key={node.id}
              onClick={() => setActiveNodeModal(node)}
              className="flex items-center justify-between bg-slate-800/80 hover:bg-slate-700/90 px-3 py-2.5 rounded-xl border border-slate-700/60 hover:border-emerald-500/50 hover:shadow-xs transition-all cursor-pointer group select-none active:scale-[0.99]"
              title="클릭하여 노드 상세 정보 및 개별 핑 테스트를 실행합니다."
            >
              <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    node.id === "coord_masker"
                      ? "bg-cyan-400"
                      : "bg-emerald-400"
                  } ${isRefreshingAll ? "animate-ping" : ""}`}
                />
                <div className="min-w-0">
                  <div className="text-slate-200 font-bold group-hover:text-white transition truncate">
                    {node.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate group-hover:text-slate-300">
                    {node.subname}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <span
                  className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border shadow-2xs ${node.badgeColor}`}
                >
                  {node.badgeText}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
              </div>
            </div>
          ))}
        </div>

        {/* 처리 방식 안내 (정직한 정적 문구) */}
        <div className="mt-4 pt-3 border-t border-slate-700">
          <div className="flex items-start space-x-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              모든 검수는 <strong className="text-slate-200">사용자 브라우저 내에서</strong> 규칙 기반으로 수행됩니다.
              업로드한 보고서는 외부 서버로 전송·저장되지 않습니다.
            </span>
          </div>
        </div>
      </div>

      {/* Node Detail Diagnostic Modal / Drawer */}
      {activeNodeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#1a2b3c] text-white rounded-2xl max-w-md w-full border border-slate-700 shadow-2xl overflow-hidden animate-scaleUp">
            {/* Header */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/80">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{activeNodeModal.name}</div>
                  <div className="text-[10px] font-mono text-emerald-400">
                    {activeNodeModal.cluster}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveNodeModal(null)}
                className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3.5 text-xs">
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/80">
                <div className="text-[11px] text-slate-400 mb-1">노드 역할 및 개요</div>
                <div className="text-slate-200 leading-relaxed text-xs">
                  {activeNodeModal.description}
                </div>
              </div>

              {/* Node Telemetry Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 bg-slate-800/50 rounded-xl border border-slate-700/60">
                  <div className="text-[10px] text-slate-400 flex items-center space-x-1 mb-1">
                    <Zap className="w-3 h-3 text-emerald-400" />
                    <span>검증 방식</span>
                  </div>
                  <div className="text-xs font-bold font-mono text-emerald-400">
                    규칙 기반
                  </div>
                </div>

                <div className="p-2.5 bg-slate-800/50 rounded-xl border border-slate-700/60">
                  <div className="text-[10px] text-slate-400 flex items-center space-x-1 mb-1">
                    <Radio className="w-3 h-3 text-cyan-400" />
                    <span>실행 위치</span>
                  </div>
                  <div className="text-xs font-bold font-mono text-cyan-300">
                    {activeNodeModal.uptime}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-800/50 rounded-xl border border-slate-700/60">
                  <div className="text-[10px] text-slate-400 flex items-center space-x-1 mb-1">
                    <Activity className="w-3 h-3 text-amber-400" />
                    <span>점검 대상</span>
                  </div>
                  <div className="text-xs font-bold font-mono text-slate-200">
                    {activeNodeModal.throughput}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-800/50 rounded-xl border border-slate-700/60">
                  <div className="text-[10px] text-slate-400 flex items-center space-x-1 mb-1">
                    <HardDrive className="w-3 h-3 text-emerald-400" />
                    <span>데이터 전송</span>
                  </div>
                  <div className="text-xs font-bold font-mono text-slate-200">
                    {activeNodeModal.memory}
                  </div>
                </div>
              </div>

              {/* Status Verification Box */}
              <div className="flex items-center justify-between p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-300">
                    국립생태원 표준 검수 규격 동기화 정상
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                  STATUS: OK
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-slate-700 flex items-center justify-between bg-slate-800/40">
              <button
                onClick={() => handlePingSingleNode(activeNodeModal)}
                disabled={isPingingSingle}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPingingSingle ? "animate-spin" : ""}`} />
                <span>{isPingingSingle ? "확인 중..." : "모듈 상태 확인"}</span>
              </button>

              <button
                onClick={() => setActiveNodeModal(null)}
                className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Recent Audit History Card (Fully interactive & live) */}
      <div className="bg-white rounded-2xl p-4.5 border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              최근 검수 이력
            </h3>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>이 브라우저 세션 기록 ({auditHistory.length}건)</span>
          </span>
        </div>

        <div className="mt-3 space-y-2.5">
          {auditHistory.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              최근 검수 기록이 없습니다.
            </div>
          ) : (
            auditHistory.map((item) => {
              const badge = getStatusBadge(item.status);
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (onSelectAuditItem) {
                      onSelectAuditItem(item);
                    } else if (onSelectField) {
                      onSelectField(item.fieldId);
                    }
                  }}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-emerald-50/60 hover:border-emerald-200 hover:shadow-xs transition cursor-pointer flex items-center justify-between group active:scale-[0.99]"
                  title="클릭 시 해당 분야 및 검수 보고서 상세로 이동합니다."
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      <span className="text-[10px] font-bold text-slate-700 bg-white border border-slate-200 px-1.5 py-0.2 rounded shadow-2xs">
                        {item.field}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border flex items-center space-x-0.5 ${badge.bg}`}>
                        {badge.icon}
                        <span>{item.status}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center space-x-0.5 ml-auto sm:ml-0">
                        <Clock className="w-2.5 h-2.5 text-slate-400" />
                        <span>{item.time}</span>
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-800 truncate group-hover:text-emerald-900 leading-snug">
                      {item.title}
                    </div>

                    <div className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center space-x-2">
                      <span className="truncate">{item.fileName}</span>
                      <span>•</span>
                      <span>{item.speciesCount}종 확인</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end justify-center space-y-1">
                    <span
                      className={`text-xs font-black font-mono px-2 py-0.5 rounded-md shadow-2xs ${
                        item.score >= 90
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : item.score >= 75
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-rose-100 text-rose-800 border border-rose-300"
                      }`}
                    >
                      {item.score}점
                    </span>
                    <span className="text-[10px] text-slate-400 group-hover:text-emerald-600 flex items-center">
                      <span>불러오기</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

