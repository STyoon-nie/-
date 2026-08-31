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

// 감사 이력은 이 브라우저 세션에서 실제로 검수한 보고서로 채워집니다.
// (미리 심어둔 예시 데이터를 제거 — 실제 검수 결과만 표시)
export const INITIAL_AUDIT_HISTORY: AuditHistoryRecord[] = [];
