import { FieldCategory } from "../types";

export interface AuditHistoryRecord {
  id: string;
  title: string;
  field: string;
  fieldId: FieldCategory;
  fileName: string;
  status: "검수적합" | "수정권고" | "검수반려" | "좌표마스킹완료" | "분야불일치";
  score: number;
  time: string;
  timestamp: number;
  speciesCount: number;
  issueCount: number;
  isCustomUploaded?: boolean;
}

export const INITIAL_AUDIT_HISTORY: AuditHistoryRecord[] = [
  {
    id: "aud-init-01",
    title: "2024년 제6차 전국자연환경조사 함양(357074)의 식물상",
    field: "식물상",
    fieldId: "flora",
    fileName: "함양_357074_2024_식물.hwp",
    status: "검수적합",
    score: 96,
    time: "2분 전",
    timestamp: Date.now() - 1000 * 60 * 2,
    speciesCount: 304,
    issueCount: 1,
  },
  {
    id: "aud-init-02",
    title: "함양(357074) 조류 조사 보고서 - 백운산 일대 -",
    field: "조류",
    fieldId: "birds",
    fileName: "함양_조류_2024_보고서.hwp",
    status: "검수적합",
    score: 94,
    time: "15분 전",
    timestamp: Date.now() - 1000 * 60 * 15,
    speciesCount: 38,
    issueCount: 1,
  },
  {
    id: "aud-init-03",
    title: "2024년 함양(357074) 포유류 흔적 및 무인센서카메라 조사",
    field: "포유류",
    fieldId: "mammals",
    fileName: "함양_포유류_흔적기록부.hwp",
    status: "좌표마스킹완료",
    score: 95,
    time: "32분 전",
    timestamp: Date.now() - 1000 * 60 * 32,
    speciesCount: 16,
    issueCount: 2,
  },
  {
    id: "aud-init-04",
    title: "2024년 함양·산청 3 소권역 삼봉산조비산 일대의 식생",
    field: "식생",
    fieldId: "vegetation",
    fileName: "함양산청_식생군락구조표.hwp",
    status: "검수적합",
    score: 98,
    time: "48분 전",
    timestamp: Date.now() - 1000 * 60 * 48,
    speciesCount: 29,
    issueCount: 0,
  },
  {
    id: "aud-init-05",
    title: "낙동강 수계 및 남강 상류 담수어류 군집 조사",
    field: "담수어류",
    fieldId: "fish",
    fileName: "남강상류_어류모니터링.hwp",
    status: "수정권고",
    score: 82,
    time: "1시간 전",
    timestamp: Date.now() - 1000 * 60 * 68,
    speciesCount: 22,
    issueCount: 4,
  },
];
