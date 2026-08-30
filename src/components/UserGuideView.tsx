import React, { useState } from "react";
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  Layers,
  Sparkles,
  ArrowRight,
  Eye,
  Lock,
  Compass,
  BookOpen,
  FileCheck2,
  Calendar,
  Search,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Clock,
  Printer,
  ExternalLink,
  Trees,
  Flower2,
  Feather,
} from "lucide-react";
import { ECOLOGICAL_FIELDS } from "../data/fieldsData";
import { FieldCategory } from "../types";

interface UserGuideViewProps {
  onStartInspection: (fieldId?: FieldCategory) => void;
  onOpenStandardsModal: () => void;
  onOpenPublicArchive: () => void;
}

export const UserGuideView: React.FC<UserGuideViewProps> = ({
  onStartInspection,
  onOpenStandardsModal,
  onOpenPublicArchive,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const STEPS = [
    {
      step: 1,
      title: "조사 분야 선택",
      subtitle: "전국자연환경조사 9개 법정 분야 중 대상 분야 지정",
      icon: Layers,
      color: "emerald",
      badge: "Step 01",
      description:
        "검수할 보고서의 생태 조사 분야를 선택합니다. 시스템은 선택된 분야에 따라 고유의 표준 서식, 필수 항목, K-BML 생물분류군 데이터베이스, 지형 10대 지표 및 식생 884개 군락 기준을 동적으로 적용합니다.",
      details: [
        "9개 법정 분야: 식물상, 식생, 포유류, 조류, 양서·파충류, 담수어류, 곤충, 저서동물, 지형",
        "샘플 보고서 원클릭 테스트: 분야별 '표준 준수' 및 '오류 포함' 검증용 예제 즉시 로드 가능",
        "분야 불일치 자동 감지: 잘못된 분야를 선택하더라도 내용 분석을 통해 올바른 분야 자동 추천",
      ],
    },
    {
      step: 2,
      title: "보고서 업로드 및 입력",
      subtitle: "파일 업로드 또는 보고서 본문 직접 붙여넣기",
      icon: UploadCloud,
      color: "teal",
      badge: "Step 02",
      description:
        "작성된 자연환경조사 최종보고서를 업로드하거나 텍스트를 붙여넣습니다. 드래그앤드롭 및 다양한 확장자를 지원합니다.",
      details: [
        "지원 파일 형식: .hwp, .hwpx, .pdf, .docx, .txt (드래그 & 드롭 지원)",
        "실시간 텍스트 붙여넣기: 조사 보고서의 본문이나 통계표를 직접 입력창에 붙여넣어 즉시 검증 가능",
        "자동 파일명 및 도엽 분석: 파일명에서 조사 지역(도엽명) 및 연도 메타데이터 자동 추출",
      ],
    },
    {
      step: 3,
      title: "실시간 6대 자동 검수 엔진 가동",
      subtitle: "국립생태원 NIE 표준 지침에 따른 100점 만점 정밀 감사",
      icon: ShieldCheck,
      color: "cyan",
      badge: "Step 03",
      description:
        "업로드 즉시 6대 핵심 영역에 대한 규격 적합성 감사를 수행하고 종합 점수(100점 만점)와 판정(적합/조건부적합/반려)을 산출합니다.",
      details: [
        "① 조사 시기 적합성: 환경부 고시 조사 시기 및 필수 차수 준수 여부",
        "② 표준 서식 및 필수 장절: 조사 개요, 조사구 설정, 결과 분석 등 필수 목차 누락 검사",
        "③ K-BML 국가생물종 표준명: 국명·학명 오타, 미등재 이명, 분류학적 유효성 검증",
        "④ 보고서 내부 정합성 교차검증: 도엽명/코드 일치, 총괄표-목록 간 출현종수/분류군 일치, 멸종위기종 기술 모순 자동 검출 (불일치 의심 표시)",
        "⑤ 비공개 위치보안 규정: 멸종위기 야생생물 I/II급의 초단위 정밀좌표 노출 자동 차단",
        "⑥ 분야별 특화 검증: 지형 10대 평가지표 적합성, 식생 4층 구조 피도 및 Braun-Blanquet 척도",
      ],
    },
    {
      step: 4,
      title: "불일치 의심 항목 교정 & 원클릭 보안 마스킹",
      subtitle: "지침 위반 사항 및 내부 불일치 실시간 하이라이트·대조",
      icon: CheckCircle2,
      color: "blue",
      badge: "Step 04",
      description:
        "발견된 지침 위반 사항(Critical, Warning, Recommendation) 및 '불일치 의심(도엽명/종수/등급 모순)' 항목을 상세하게 확인하고, 제안된 표준 수정안을 바탕으로 원문을 즉시 교정할 수 있습니다.",
      details: [
        "오류 심각도 및 불일치 분류: 중대 결함(Critical), 경고(Warning), 권고(Recommendation), [불일치 의심] 전용 필터",
        "상충 대조 뷰(Conflicting Passages): 도엽명이나 종수가 서로 다르게 기재된 보고서 내 두 위치를 좌우로 직접 비교 대조",
        "원클릭 멸종위기종 좌표 마스킹: 법정보호종의 초단위 좌표를 읍·면·동 단위 안전 비공개 포맷으로 즉각 변환",
        "실시간 원문 편집기: 수정 사항을 화면에서 바로 반영하고 즉시 재검수 점수 확인",
      ],
    },
    {
      step: 5,
      title: "공인 검수 인증서 발급 & 보고서 다운로드",
      subtitle: "국립생태원 공인 검수 고유번호 부여 및 정밀 성적서 출력",
      icon: FileCheck2,
      color: "emerald",
      badge: "Step 05",
      description:
        "검수가 완료되면 국립생태원 표준 규격의 공인 검수 증명서(Certificate)를 발급받을 수 있으며, 교정된 최종 보고서를 인쇄하거나 다운로드할 수 있습니다.",
      details: [
        "고유 검수 인증번호 자동 부여 (예: NIE-ECO-2026-XXXX)",
        "검수 성적서 및 점수 상세 명세서 (도엽명, 출현종 통계, 내부 정합성 검증 확인, 식생/지형 분석표 포함)",
        "PDF 저장 및 A4 인쇄 친화적 레이아웃 지원",
      ],
    },
  ];

  const FAQS = [
    {
      q: "검수시스템의 판정 기준(PASS, CONDITIONAL_PASS, FAIL)은 어떻게 되나요?",
      a: "종합 검수 점수 100점 만점 중 90점 이상이며 치명적 오류(Critical) 및 중대 불일치 모순이 없을 시 '검수 적합(PASS)'으로 판정됩니다. 75점 이상 89점 이하는 '조건부 적합(수정 권고)', 74점 이하 또는 치명적 보안 위반(멸종위기종 좌표 미비공개 등)이 잔존할 경우 '검수 반려(FAIL)'로 분류됩니다.",
    },
    {
      q: "보고서 내부에서 도엽명이나 출현종수가 맞지 않을 때 '불일치 의심'은 어떻게 감지되나요?",
      a: "본 시스템은 보고서 제목·개요의 도엽명/도엽코드(예: 함양 357092 vs 357091), 요약문과 본문 총괄표 간의 출현종수 통계치(예: 요약문 45종 vs 본문 목록 48종), 멸종위기종 유무 기술 모순(요약문에는 '미확인'으로 썼으나 본문에 '수달' 수록) 등을 문맥 단위로 정밀 교차 대조하여 [불일치 의심] 항목으로 자동 분류하고 상충 구간을 대조해 드립니다.",
    },
    {
      q: "멸종위기 야생생물의 정밀 좌표가 노출되었을 때 어떻게 조치해야 하나요?",
      a: "국립생태원 생태정보 보안관리 규정에 따라 멸종위기 야생생물 I·II급 출현 위치의 초(Second, \") 단위 좌표는 대외 비공개 대상입니다. 시스템 내 '보안 위험 자동 마스킹' 버튼을 클릭하면 도엽명 또는 시·군·구·읍·면 단위의 안전한 표기로 1초 만에 자동 변환됩니다.",
    },
    {
      q: "식생(식물군락) 및 지형(경관) 분야는 일반 생물종 검수와 무엇이 다른가요?",
      a: "식생 분야는 개별 식물종이 아닌 29개 식생형 및 884개 식물군락, 4층 구조(교목·아교목·관목·초본) 피도 데이터, 방형구(225㎡) 및 Braun-Blanquet 7단계 척도를 정밀 검증합니다. 지형 분야는 하천지형(FG), 산지지형(MG) 분류기호, 10대 지형평가지표(전형성, 특이성, 규모 등) 및 Ⅰ~Ⅲ등급 보전등급을 감사합니다.",
    },
    {
      q: "업로드한 조사 보고서 파일이 외부로 유출되거나 서버에 저장되나요?",
      a: "아닙니다. 본 검수시스템의 핵심 규칙 검증 엔진은 브라우저 내에서 안전하게 작동하며, 국립생태원 보안 표준에 따라 업로드된 보고서 원문은 검수 세션 종료 시 안전하게 폐기됩니다.",
    },
    {
      q: "보고서 검수 인증서는 공식 제출 시 사용할 수 있나요?",
      a: "네, 검수 완료 후 발급되는 '전국자연환경조사 최종보고서 검수 성적서'에는 검수 일시, 담당자 서명란, 고유 검수 관리번호(NIE-ECO-XXXX), 6대 지표 채점 결과가 포함되어 최종 조사 결과 납품 시 첨부 증빙자료로 활용할 수 있습니다.",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* 1. Hero Header Banner */}
      <div className="bg-gradient-to-r from-[#1a2b3c] via-[#1e3a4b] to-[#152e3c] rounded-2xl p-6 sm:p-8 text-white shadow-md border border-slate-700/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Compass className="w-4 h-4" />
            <span>User Manual & Guide</span>
            <span className="text-slate-400">•</span>
            <span>국립생태원 표준 검수 매뉴얼</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-3">
            전국자연환경조사 최종보고서 검수시스템 사용 설명서
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed mb-6">
            환경부 및 국립생태원(NIE) 지침에 따라 9개 생태조사 분야 최종보고서의 법정 표준 서식,
            K-BML 국가생물종목록 정합성, 비공개 위치보안, 식생군락 및 지형요소 적합성을
            원클릭으로 신속·정확하게 검증하는 방법을 안내합니다.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onStartInspection("flora")}
              className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md cursor-pointer hover:shadow-emerald-500/20"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>실시간 보고서 검수 시작</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenStandardsModal}
              className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm border border-slate-600 transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>9개 분야 표준지침 보기</span>
            </button>

            <button
              onClick={onOpenPublicArchive}
              className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800/60 hover:bg-slate-700/80 text-teal-300 font-semibold rounded-xl text-sm border border-teal-500/30 transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>대국민 생태정보 열람 이동</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key System Capabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm mb-1">법정 지침 100% 자동 검증</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            자연환경보전법 제30조 및 국립생태원 제5차 표준 지침에 따른 필수 장절, 조사 시기, 도엽
            서식을 실시간 채점합니다.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm mb-1">멸종위기종 위치보안 마스킹</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            멸종위기 야생생물 I·II급의 초단위 정밀 좌표 노출을 탐지하여 밀렵 방지용 비공개 포맷으로
            즉각 변환합니다.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-3">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm mb-1">공인 검수 성적서 즉시 발급</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            100점 만점 채점표, 분류군별 출현 통계, 지형 및 식생 분석표가 포함된 공식 검수 인증서를
            원클릭으로 출력합니다.
          </p>
        </div>
      </div>

      {/* 3. 5-Step Interactive Workflow */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-200">
          <div>
            <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Standard Workflow
            </div>
            <h2 className="text-xl font-bold text-slate-900">5단계 표준 검수 워크플로우</h2>
          </div>
          <span className="text-xs font-medium text-slate-500">
            각 단계를 클릭하여 세부 가이드를 확인하세요
          </span>
        </div>

        {/* Step Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isSelected = activeStep === s.step;
            return (
              <button
                key={s.step}
                onClick={() => setActiveStep(s.step)}
                className={`p-3 rounded-xl text-left transition-all border cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isSelected
                        ? "bg-emerald-500 text-slate-950"
                        : "bg-slate-200 text-slate-700 font-mono"
                    }`}
                  >
                    {s.badge}
                  </span>
                  <Icon
                    className={`w-4 h-4 ${isSelected ? "text-emerald-400" : "text-slate-400"}`}
                  />
                </div>
                <div className="text-xs font-bold truncate">{s.title}</div>
              </button>
            );
          })}
        </div>

        {/* Active Step Detail Card */}
        {(() => {
          const cur = STEPS.find((s) => s.step === activeStep) || STEPS[0];
          const Icon = cur.icon;
          return (
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 animate-fadeIn">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-800">{cur.badge} 상세 가이드</div>
                    <h3 className="text-lg font-bold text-slate-900">{cur.title}</h3>
                    <p className="text-xs text-slate-600">{cur.subtitle}</p>
                  </div>
                </div>

                <button
                  onClick={() => onStartInspection("flora")}
                  className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs cursor-pointer transition"
                >
                  <span>이 단계 실행하기</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4">
                {cur.description}
              </p>

              <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-900 mb-1 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>주요 검수 항목 및 권장 작업 사항</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600 pl-5 list-disc">
                  {cur.details.map((d, i) => (
                    <li key={i} className="leading-normal">
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 4. Field-Specific Criteria Overview */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
          <div>
            <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Field Matrix
            </div>
            <h2 className="text-xl font-bold text-slate-900">9개 생태 분야별 특화 검수 지침</h2>
          </div>
          <button
            onClick={onOpenStandardsModal}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 cursor-pointer"
          >
            <span>전체 표준규격서 열기</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Flora & Fauna */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center space-x-2 mb-2 text-emerald-800 font-bold text-sm">
              <Flower2 className="w-4 h-4" />
              <span>식물상 및 6대 동물상 분야</span>
            </div>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              포유류, 조류, 양서·파충류, 담수어류, 곤충, 저서동물, 식물상
            </p>
            <div className="space-y-1.5 text-[11px] text-slate-700 bg-white p-3 rounded-lg border border-slate-200/80">
              <div>• <strong>K-BML 국가생물종목록:</strong> 표준 국명 및 이명 정합성 검증</div>
              <div>• <strong>멸종위기종 I/II급:</strong> 초단위 위치좌표 보안 마스킹 필수</div>
              <div>• <strong>외래/교란종:</strong> 생태계교란생물 서식 현황 및 관리방안 점검</div>
            </div>
          </div>

          {/* Vegetation */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center space-x-2 mb-2 text-emerald-800 font-bold text-sm">
              <Trees className="w-4 h-4" />
              <span>식생 (식물군락) 분야</span>
            </div>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              식생형, 식물군락, 식생보전등급, 방형구 조사
            </p>
            <div className="space-y-1.5 text-[11px] text-slate-700 bg-white p-3 rounded-lg border border-slate-200/80">
              <div>• <strong>군락 체계:</strong> 29개 식생형 및 884개 군락 단위 검수</div>
              <div>• <strong>층위 구조:</strong> 교목·아교목·관목·초본 4층 피도 정합성</div>
              <div>• <strong>조사 규격:</strong> 방형구(225㎡) 및 Braun-Blanquet 7단계 척도</div>
            </div>
          </div>

          {/* Landscape / Topography */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center space-x-2 mb-2 text-emerald-800 font-bold text-sm">
              <Layers className="w-4 h-4" />
              <span>지형 (경관) 분야</span>
            </div>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              하천·산지·해안·카르스트 지형, 보전등급 평가
            </p>
            <div className="space-y-1.5 text-[11px] text-slate-700 bg-white p-3 rounded-lg border border-slate-200/80">
              <div>• <strong>분류 기호:</strong> 하천(FG), 산지(MG) 등 표준 코드 준수</div>
              <div>• <strong>10대 평가지표:</strong> 전형성, 특이성, 규모 등 지형 가치 채점</div>
              <div>• <strong>보전등급:</strong> Ⅰ~Ⅲ등급 지형요소 실측 규격 및 위치 확인</div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Inspection Scoring Rubric */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-2xs">
        <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
          Scoring Matrix
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">6대 핵심 검수 영역 및 배점 기준</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-800 border-b border-slate-200 font-bold">
                <th className="py-2.5 px-3">검수 영역</th>
                <th className="py-2.5 px-3">배점</th>
                <th className="py-2.5 px-3">세부 검증 내용</th>
                <th className="py-2.5 px-3">부적합 시 조치</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr className="hover:bg-slate-50/80">
                <td className="py-3 px-3 font-semibold text-slate-900">1. 조사 시기 및 차수</td>
                <td className="py-3 px-3 font-mono font-bold text-emerald-700">20점</td>
                <td className="py-3 px-3">환경부 고시 필수 조사 시기(봄/여름/가을/겨울) 및 최소 2~4회 조사 차수 충족 여부</td>
                <td className="py-3 px-3 text-amber-700 font-medium">보완 조사 계획서 제출 권고</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-3 px-3 font-semibold text-slate-900">2. 표준 서식 및 필수 장절</td>
                <td className="py-3 px-3 font-mono font-bold text-emerald-700">20점</td>
                <td className="py-3 px-3">조사 개요, 방법, 결과, 보전 방안 등 국립생태원 표준 서식 목차 누락 여부</td>
                <td className="py-3 px-3 text-rose-700 font-medium">필수 장절 누락 시 반려 (Fail)</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-3 px-3 font-semibold text-slate-900">3. K-BML 생물분류군 정합성</td>
                <td className="py-3 px-3 font-mono font-bold text-emerald-700">20점</td>
                <td className="py-3 px-3">국가생물종목록 기준 국명·학명 오타, 미등재 이명, 명명자 표기 오류 감사</td>
                <td className="py-3 px-3 text-blue-700 font-medium">표준 정명 자동 교정 제안</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-3 px-3 font-semibold text-slate-900">4. 비공개 위치보안 규정</td>
                <td className="py-3 px-3 font-mono font-bold text-emerald-700">15점</td>
                <td className="py-3 px-3">멸종위기 야생생물 I·II급 초단위 좌표 노출 여부 차단 검증</td>
                <td className="py-3 px-3 text-rose-700 font-bold">1-클릭 보안 마스킹 필수 적용</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-3 px-3 font-semibold text-slate-900">5. 지형/식생 전문 지표</td>
                <td className="py-3 px-3 font-mono font-bold text-emerald-700">15점</td>
                <td className="py-3 px-3">지형 10대 평가지표, 식생 4층 피도 척도 및 방형구 규격 정합성</td>
                <td className="py-3 px-3 text-amber-700 font-medium">도엽별 식생변경표 재검증</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-3 px-3 font-semibold text-slate-900">6. AI 심층 논리 검토</td>
                <td className="py-3 px-3 font-mono font-bold text-emerald-700">10점</td>
                <td className="py-3 px-3">생태학적 서식환경 모순 및 본문-부록 간 통계 불일치 정밀 분석</td>
                <td className="py-3 px-3 text-slate-700 font-medium">전문가 종합 검토 의견 제공</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. FAQ Section */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-2 mb-1 text-emerald-700 text-xs font-bold uppercase tracking-wider">
          <HelpCircle className="w-4 h-4" />
          <span>Frequently Asked Questions</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-6">자주 묻는 질문 (FAQ)</h2>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200 rounded-xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between bg-slate-50/60 hover:bg-slate-50 font-bold text-xs sm:text-sm text-slate-900 cursor-pointer"
                >
                  <span className="flex items-center space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">
                      Q
                    </span>
                    <span>{faq.q}</span>
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="p-4 bg-white border-t border-slate-100 text-xs text-slate-700 leading-relaxed pl-11">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. Bottom CTA */}
      <div className="bg-emerald-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="text-lg font-bold mb-1">지금 바로 보고서 검수를 시작하세요</h3>
          <p className="text-xs text-emerald-200">
            샘플 보고서를 이용해 1초 만에 6대 표준 검수 프로세스를 체험할 수 있습니다.
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => onStartInspection("flora")}
            className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            실시간 보고서 검수하기
          </button>
        </div>
      </div>
    </div>
  );
};
