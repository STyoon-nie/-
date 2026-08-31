/*
 * 육상곤충 보고서 내부 정합성 검수 (EcoCheck 이식)
 * ------------------------------------------------------------------
 * Python(Streamlit)에서 실측 검증한 곤충 검수 로직을 이 앱의
 * DiscrepancyItem 형식으로 이식한 모듈. 모든 처리는 브라우저 안(클라이언트)에서
 * 수행되며 외부 전송이 없다.
 *
 * 핵심 (기존 엔진이 놓치던 부분):
 *  1) 종수 표현의 조사범위 판정(금번/선행/종합) — 금번+선행 종합수치(예: 683종)를
 *     금번 종목록(예: 349종)과 잘못 비교해 생기는 오탐을 방지하고, 금번조사 종수끼리의
 *     실제 모순만 잡는다.
 *  2) 목(Order)별 과·종수 합계 검증 — 목별 기재 합이 총계(N목 M과 K종)와 맞는지 확인.
 */

import { DiscrepancyItem } from "../types";

// ---------------------------------------------------------------------------
// 조사범위 키워드
// ---------------------------------------------------------------------------
const SCOPE_KEYWORDS: Record<string, string[]> = {
  종합: ["종합", "총괄", "누계", "누적", "합하면", "합치면", "합산", "종합하면",
    "금번+선행", "금번 + 선행", "전체(금번", "전체 (금번", "금번과 선행", "선행조사와 금번", "종합적으로"],
  선행: ["선행", "전번", "기존조사", "기존 조사", "이전 조사", "이전조사", "과거 조사",
    "문헌조사", "문헌 조사", "기존자료", "기존 자료", "전차 조사", "직전 조사", "제5차", "제4차", "제3차"],
  부분: ["신규", "새롭게", "추가된", "추가종", "특정종", "국외반출", "고유종",
    "기후변화", "적색목록", "중복종", "지표종", "우점"],
  금번: ["금번", "본 조사", "본조사", "이번 조사", "금차", "현지조사 결과", "본 연구", "금년", "당해"],
};

const REFERENCE_LABELS = ["참고문헌", "인용문헌", "References", "REFERENCES"];
const APPENDIX_LABELS = ["부록", "부 록", "Appendix", "APPENDIX"];

const COUNT_PATTERNS: { name: string; src: string; s: number }[] = [
  { name: "총 N종", src: "총\\s*([0-9][0-9,]*)\\s*종", s: 1 },
  { name: "총 N분류군", src: "총\\s*([0-9][0-9,]*)\\s*분류군", s: 1 },
  { name: "N목 N과 N종", src: "[0-9]+\\s*목\\s*[0-9]+\\s*과\\s*([0-9][0-9,]*)\\s*종", s: 1 },
  { name: "N종이 확인", src: "([0-9][0-9,]*)\\s*종\\s*이?\\s*(?:이|가)?\\s*확인", s: 1 },
  { name: "N종을 확인", src: "([0-9][0-9,]*)\\s*종\\s*을\\s*확인", s: 1 },
];

const ORDER_SINGLE = "([가-힣]{1,10}목)\\s*([0-9]+)\\s*과\\s*([0-9][0-9,]*)\\s*종";
const ORDER_SHARED = "([가-힣]{1,10}목)\\s*(?:과|와|,|·|、)\\s*([가-힣]{1,10}목)\\s*이?\\s*가?\\s*각각\\s*([0-9]+)\\s*과\\s*([0-9][0-9,]*)\\s*종";
const TOTAL_RE = /([0-9]+)\s*목\s*([0-9]+)\s*과\s*([0-9][0-9,]*)\s*종/;

// ---------------------------------------------------------------------------
// 유틸
// ---------------------------------------------------------------------------
function toInt(s: string | undefined): number | null {
  if (s == null) return null;
  const d = String(s).replace(/[^0-9]/g, "");
  return d ? parseInt(d, 10) : null;
}
function normSpace(s: string): string {
  return String(s || "").replace(/\s+/g, " ").trim();
}
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function snippet(text: string, start: number, end: number, w = 55): string {
  const lo = Math.max(0, start - w), hi = Math.min(text.length, end + w);
  return (lo > 0 ? "..." : "") + normSpace(text.slice(lo, hi)) + (hi < text.length ? "..." : "");
}
function rid(p: string): string {
  return `${p}-${Math.random().toString(36).substring(2, 7)}`;
}

/** 참고문헌·부록 이후(후미)를 잘라 본문만 반환. */
function bodyText(text: string): string {
  if (!text) return "";
  const floor = Math.floor(text.length * 0.05);
  let best = text.length;
  for (const label of REFERENCE_LABELS) {
    const re = new RegExp("(^|\\n)[ \\t]*" + escapeRe(label) + "[ \\t]*(?=\\n|$)", "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) { const p = m.index + (m[1] ? 1 : 0); if (p >= floor) { best = Math.min(best, p); break; } }
  }
  for (const label of APPENDIX_LABELS) {
    const re = new RegExp("(^|\\n)[ \\t]*" + escapeRe(label) + "[ \\t]*[0-9]", "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) { const p = m.index + (m[1] ? 1 : 0); if (p >= floor) { best = Math.min(best, p); break; } }
  }
  return text.slice(0, best);
}

// ---------------------------------------------------------------------------
// 조사범위 판정
// ---------------------------------------------------------------------------
function extractSentence(text: string, start: number, end: number, maxChars = 400) {
  const lo = Math.max(0, start - maxChars);
  const head = text.slice(lo, start);
  const bs = [...head.matchAll(/\.\s/g)];
  const sentStart = lo + (bs.length ? bs[bs.length - 1].index! + bs[bs.length - 1][0].length : 0);
  const hi = Math.min(text.length, end + maxChars);
  const tail = text.slice(end, hi);
  const tm = tail.match(/\.\s/);
  const sentEnd = end + (tm ? tm.index! : tail.length);
  return { sentence: text.slice(sentStart, sentEnd), offset: sentStart };
}

function classifyScope(text: string, start: number, end: number, baseYear: string): string {
  const { sentence, offset } = extractSentence(text, start, end);
  const relStart = start - offset;
  let bestScope: string | null = null, bestPos = -1;
  for (const scope of Object.keys(SCOPE_KEYWORDS)) {
    for (const word of SCOPE_KEYWORDS[scope]) {
      const pos = sentence.lastIndexOf(word, relStart - 1);
      if (pos < 0) continue;
      if (scope === "부분" && relStart - (pos + word.length) > 25) continue;
      if (pos > bestPos) { bestScope = scope; bestPos = pos; }
    }
  }
  if (bestScope) return bestScope;
  const base = String(baseYear || "").replace(/[^0-9]/g, "");
  if (base) {
    const years = [...sentence.matchAll(/(?:19|20)[0-9]{2}/g)].map((m) => m[0]);
    if (years.length && !years.includes(base)) return "선행";
    if (years.includes(base)) return "금번";
  }
  return "불명";
}

interface CountItem { name: string; count: number; matched: string; scope: string; evidence: string; index: number; }

function extractReportCounts(body: string, baseYear: string): CountItem[] {
  const found: CountItem[] = [];
  const seen = new Set<string>();
  for (const spec of COUNT_PATTERNS) {
    const re = new RegExp(spec.src, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(body))) {
      const count = toInt(m[spec.s]);
      if (count == null || count <= 0 || count > 100000) continue;
      const key = spec.name + "|" + count;
      if (seen.has(key)) continue;
      seen.add(key);
      found.push({
        name: spec.name, count, matched: m[0].trim(),
        scope: classifyScope(body, m.index, m.index + m[0].length, baseYear),
        evidence: snippet(body, m.index, m.index + m[0].length), index: m.index,
      });
    }
  }
  return found;
}

// ---------------------------------------------------------------------------
// 검사 1: 금번조사 종수 내부 모순
// ---------------------------------------------------------------------------
function checkSpeciesCountConsistency(body: string, baseYear: string): DiscrepancyItem[] {
  const out: DiscrepancyItem[] = [];
  const counts = extractReportCounts(body, baseYear);
  const comparable = counts.filter((c) => c.scope === "금번" || c.scope === "불명");
  const distinct = [...new Set(comparable.map((c) => c.count))];
  if (distinct.length > 1) {
    const a = comparable.find((c) => c.count === distinct[0])!;
    const b = comparable.find((c) => c.count === distinct[distinct.length - 1])!;
    out.push({
      id: rid("ins-scnt"),
      category: "INTERNAL_CONSISTENCY",
      severity: "CRITICAL",
      section: "종 다양성 현황 (Results)",
      title: `[불일치 의심] 금번조사 종수 표현 상호 불일치 (${distinct.join("종 ≠ ")}종)`,
      description:
        `보고서 본문에서 금번(당해) 조사 종수가 서로 다르게 기재되어 있습니다: ` +
        `${comparable.map((c) => `${c.matched}(${c.count}종)`).join(", ")}. ` +
        `선행조사·종합(금번+선행) 수치는 비교에서 제외하고 금번조사 수치만 대조하였습니다.`,
      isSuspectedInconsistency: true,
      inconsistencyType: "SPECIES_COUNT",
      conflictingPassages: {
        locationA: `본문 (${a.name})`, textA: a.evidence,
        locationB: `본문 (${b.name})`, textB: b.evidence,
      },
      suggestedFix: "본문 요약·결과 표·고찰의 '금번조사' 종수를 동일한 수치로 통일하십시오.",
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// 검사 2: 목(Order)별 과·종수 합계 검증
// ---------------------------------------------------------------------------
function parseOrders(body: string): Record<string, { family: number; species: number; evidence: string }> {
  const found: Record<string, { family: number; species: number; evidence: string }> = {};
  const add = (disp: string, f: string, s: string, i: number, len: number) => {
    const k = normSpace(disp);
    if (!k || found[k]) return;
    const F = toInt(f), S = toInt(s);
    if (F == null || S == null) return;
    found[k] = { family: F, species: S, evidence: snippet(body, i, i + len) };
  };
  let m: RegExpExecArray | null;
  const sh = new RegExp(ORDER_SHARED, "g");
  while ((m = sh.exec(body))) { add(m[1], m[3], m[4], m.index, m[0].length); add(m[2], m[3], m[4], m.index, m[0].length); }
  const si = new RegExp(ORDER_SINGLE, "g");
  while ((m = si.exec(body))) { add(m[1], m[2], m[3], m.index, m[0].length); }
  return found;
}

function checkOrderArithmetic(body: string): DiscrepancyItem[] {
  const out: DiscrepancyItem[] = [];
  const orders = parseOrders(body);
  const keys = Object.keys(orders);
  const t = body.match(TOTAL_RE);
  if (!t || keys.length < 2) return out;

  const totalOrders = toInt(t[1])!, totalFamily = toInt(t[2])!, totalSpecies = toInt(t[3])!;
  const sumFamily = keys.reduce((a, k) => a + orders[k].family, 0);
  const sumSpecies = keys.reduce((a, k) => a + orders[k].species, 0);
  const totalEvidence = snippet(body, body.indexOf(t[0]), body.indexOf(t[0]) + t[0].length);

  if (sumSpecies !== totalSpecies) {
    out.push({
      id: rid("ins-osum"),
      category: "STATISTICS",
      severity: "CRITICAL",
      section: "목별 다양성 구성",
      title: `[불일치 의심] 목별 종수 합계(${sumSpecies}종)와 총계(${totalSpecies}종) 불일치`,
      description:
        `목(Order)별로 기재된 종수의 합(${sumSpecies}종)이 보고서 총계(${totalSpecies}종)와 일치하지 않습니다. ` +
        `목별 수치(${keys.map((k) => `${k} ${orders[k].species}종`).join(", ")}) 또는 총계에 오기가 있는지 확인이 필요합니다.`,
      isSuspectedInconsistency: true,
      inconsistencyType: "DOMAIN_METRICS",
      conflictingPassages: {
        locationA: "목별 다양성 서술/표", textA: `목별 종수 합 = ${sumSpecies}종`,
        locationB: "총 종수(총괄)", textB: totalEvidence,
      },
      suggestedFix: "목별 구성비표의 종수와 총 종수(총괄표)를 재확인하여 합계를 일치시키십시오.",
    });
  }
  if (sumFamily !== totalFamily) {
    out.push({
      id: rid("ins-ofam"),
      category: "STATISTICS",
      severity: "WARNING",
      section: "목별 다양성 구성",
      title: `[불일치 의심] 목별 과수 합계(${sumFamily}과)와 총계(${totalFamily}과) 불일치`,
      description:
        `목별로 기재된 과수의 합(${sumFamily}과)이 보고서 총계(${totalFamily}과)와 다릅니다. ` +
        `목별 과수 또는 총 과수 표기를 확인하십시오.`,
      isSuspectedInconsistency: true,
      inconsistencyType: "DOMAIN_METRICS",
      suggestedFix: "목별 과수와 총 과수(총괄표)를 재확인하여 일치시키십시오.",
    });
  }
  if (keys.length !== totalOrders) {
    out.push({
      id: rid("ins-onum"),
      category: "STATISTICS",
      severity: "WARNING",
      section: "목별 다양성 구성",
      title: `[검토] 서술된 목 수(${keys.length}개)와 총 목 수(${totalOrders}목) 불일치`,
      description:
        `본문에 과·종수가 기재된 목은 ${keys.length}개(${keys.join(", ")})인데 총계는 ${totalOrders}목입니다. ` +
        `목록 표에는 있으나 본문 서술에서 누락된 목이 있는지 확인하십시오.`,
      isSuspectedInconsistency: true,
      inconsistencyType: "DOMAIN_METRICS",
      suggestedFix: "목별 구성비 서술에 누락된 목이 없는지 확인하십시오.",
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// 검사 3: 편집 잔존 문구 (미완성 보고서 표시)
// ---------------------------------------------------------------------------
const RESIDUAL_KEYWORDS = [
  "작성 중", "작성중", "추후 입력", "추후입력", "수정 필요", "수정필요",
  "확인 필요", "확인필요", "삭제 예정", "삭제예정", "그림 삽입", "그림삽입",
  "표 삽입", "표삽입", "TBD", "미기재",
];

function checkResidualKeywords(body: string): DiscrepancyItem[] {
  const found: string[] = [];
  let firstIdx = -1;
  for (const kw of RESIDUAL_KEYWORDS) {
    const i = body.indexOf(kw);
    if (i >= 0) { found.push(kw); if (firstIdx < 0 || i < firstIdx) firstIdx = i; }
  }
  if (!found.length) return [];
  return [{
    id: rid("ins-resid"),
    category: "STRUCTURE",
    severity: "WARNING",
    section: "보고서 완성도",
    title: `[편집 잔존] 미완성·편집 표시 문구 발견 (${found.slice(0, 5).join(", ")}${found.length > 5 ? " 등" : ""})`,
    description: `최종 보고서에 편집 중 표시로 보이는 문구가 남아 있습니다: ${found.join(", ")}. 실제 조사 내용으로 교체하거나 삭제해야 합니다.`,
    targetExcerpt: firstIdx >= 0 ? snippet(body, firstIdx, firstIdx + 2) : undefined,
    suggestedFix: "해당 문구를 실제 내용으로 교체하거나 제거하십시오.",
  }];
}

// ---------------------------------------------------------------------------
// 검사 4: 표·그림 번호 (중복·결번) — PDF 추출 한계로 검토 권고 수준
// ---------------------------------------------------------------------------
function checkFigureTableNumbers(body: string): DiscrepancyItem[] {
  const caps: Record<string, string[]> = {};
  const re = /(?:^|\n)\s*(표|그림|Table|Fig\.?|Figure)\s*([0-9]+)(?:\s*[-–.]\s*([0-9]+))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    const pre = /표/.test(m[1]) ? "표" : /그림/.test(m[1]) ? "그림" : /Tab/i.test(m[1]) ? "표(Table)" : "그림(Fig)";
    const num = m[3] ? `${m[2]}-${m[3]}` : m[2];
    (caps[pre] = caps[pre] || []).push(num);
  }
  const out: DiscrepancyItem[] = [];
  for (const pre of Object.keys(caps)) {
    const list = caps[pre];
    const seen: Record<string, number> = {};
    list.forEach((n) => (seen[n] = (seen[n] || 0) + 1));
    const dups = Object.keys(seen).filter((n) => seen[n] > 1);
    if (dups.length) {
      out.push({
        id: rid("ins-figdup"),
        category: "STRUCTURE",
        severity: "RECOMMENDATION",
        section: "표·그림 번호",
        title: `[검토] ${pre} 번호 중복 (${dups.join(", ")})`,
        description: `동일한 ${pre} 번호가 여러 번 사용되었습니다: ${dups.join(", ")}. 캡션 번호 체계를 확인하십시오. (PDF 추출 특성상 오탐일 수 있어 검토 권고 수준입니다.)`,
        suggestedFix: `${pre} 캡션 번호를 순서대로 재부여하십시오.`,
      });
    }
    const ints = [...new Set(list.filter((n) => /^[0-9]+$/.test(n)).map(Number))];
    if (ints.length >= 3) {
      const max = Math.max(...ints);
      const miss: number[] = [];
      for (let i = 1; i <= max; i++) if (!ints.includes(i)) miss.push(i);
      if (miss.length) {
        out.push({
          id: rid("ins-figgap"),
          category: "STRUCTURE",
          severity: "RECOMMENDATION",
          section: "표·그림 번호",
          title: `[검토] ${pre} 번호 결번 (${miss.join(", ")})`,
          description: `${pre} 번호가 중간에 비어 있습니다(누락: ${miss.join(", ")}). 실제 누락인지 확인하십시오. (PDF 추출 한계로 오탐일 수 있습니다.)`,
          suggestedFix: `${pre} 번호 체계를 확인하십시오.`,
        });
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// 검사 5: 학명 종소명 대문자 표기 의심 (보수적 — 국명 뒤 이명binomial만)
// ---------------------------------------------------------------------------
function checkScientificNameFormat(body: string): DiscrepancyItem[] {
  const re = /[가-힣]{2,}\s+([A-Z][a-z]{2,})\s+([A-Za-z][A-Za-z-]+)/g;
  const open = new Set(["sp", "spp", "cf", "aff", "var", "subsp", "ssp"]);
  const bad = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    const genus = m[1], ep = m[2];
    if (open.has(ep.replace(/\.$/, "").toLowerCase())) continue;
    if (/^[A-Z]/.test(ep)) bad.add(`${genus} ${ep}`);
  }
  if (!bad.size) return [];
  const examples = [...bad].slice(0, 6);
  return [{
    id: rid("ins-sciname"),
    category: "TAXONOMY",
    severity: "RECOMMENDATION",
    section: "학명 표기",
    title: `[검토] 학명 종소명 대문자 표기 의심 (${bad.size}건)`,
    description: `종소명(species epithet)은 소문자로 표기해야 합니다. 대문자로 시작하는 것으로 보이는 학명: ${examples.join(", ")}${bad.size > 6 ? " 등" : ""}. 명명자명(Author)과 혼동되지 않았는지 확인하십시오.`,
    suggestedFix: "종소명을 소문자로 표기하십시오 (예: Pieris rapae).",
  }];
}

// ---------------------------------------------------------------------------
// 검사 6: 과(Family)별 종수 합계 검증 — 담수어류 등 (과별 종수 + 총계 구조)
// ---------------------------------------------------------------------------
// '결과·학과·조사과' 등 과로 끝나지만 분류군이 아닌 단어 제외.
// (2음절 단어 '결과·성과·통과' 등은 정규식 {2,10}으로 이미 제외됨)
const FAMILY_BLOCKLIST = new Set([
  "생물자원과", "야생동물과", "자연환경과", "환경정책과", "조사과", "연구과",
  "기획과", "총무과", "관리과", "보전과", "분류과", "행정과",
]);

function parseFamilies(body: string): Record<string, { species: number; evidence: string }> {
  const re = /([가-힣]{2,10}과)\s*([0-9][0-9,]*)\s*종/g;
  const found: Record<string, { species: number; evidence: string }> = {};
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    const fam = m[1];
    if (FAMILY_BLOCKLIST.has(fam)) continue;
    const sp = toInt(m[2]);
    if (sp == null) continue;
    if (!(fam in found)) found[fam] = { species: sp, evidence: snippet(body, m.index, m.index + m[0].length) };
  }
  return found;
}

function checkFamilyArithmetic(body: string): DiscrepancyItem[] {
  const out: DiscrepancyItem[] = [];
  const fams = parseFamilies(body);
  const keys = Object.keys(fams);
  const t = body.match(/([0-9]+)\s*과\s*([0-9][0-9,]*)\s*종/);
  if (!t || keys.length < 2) return out;

  const totalFam = toInt(t[1])!, totalSp = toInt(t[2])!;
  const sumSp = keys.reduce((a, k) => a + fams[k].species, 0);
  const totalEvidence = snippet(body, body.indexOf(t[0]), body.indexOf(t[0]) + t[0].length);

  if (sumSp !== totalSp) {
    out.push({
      id: rid("fish-fsum"),
      category: "STATISTICS",
      severity: "CRITICAL",
      section: "과별 종 구성",
      title: `[불일치 의심] 과별 종수 합계(${sumSp}종)와 총계(${totalSp}종) 불일치`,
      description:
        `과(Family)별로 기재된 종수의 합(${sumSp}종)이 보고서 총계(${totalSp}종)와 일치하지 않습니다. ` +
        `과별 수치(${keys.map((k) => `${k} ${fams[k].species}종`).join(", ")}) 또는 총계에 오기가 있는지 확인이 필요합니다.`,
      isSuspectedInconsistency: true,
      inconsistencyType: "DOMAIN_METRICS",
      conflictingPassages: {
        locationA: "과별 종 구성 서술/표", textA: `과별 종수 합 = ${sumSp}종`,
        locationB: "총 종수(총괄)", textB: totalEvidence,
      },
      suggestedFix: "과별 종 구성표의 종수와 총 종수(총괄표)를 재확인하여 합계를 일치시키십시오.",
    });
  }
  if (keys.length !== totalFam) {
    out.push({
      id: rid("fish-fnum"),
      category: "STATISTICS",
      severity: "WARNING",
      section: "과별 종 구성",
      title: `[검토] 서술된 과 수(${keys.length}개)와 총 과 수(${totalFam}과) 불일치`,
      description:
        `본문에 종수가 기재된 과는 ${keys.length}개(${keys.join(", ")})인데 총계는 ${totalFam}과입니다. ` +
        `목록 표에는 있으나 본문 서술에서 누락된 과가 있는지 확인하십시오.`,
      isSuspectedInconsistency: true,
      inconsistencyType: "DOMAIN_METRICS",
      suggestedFix: "과별 구성 서술에 누락된 과가 없는지 확인하십시오.",
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// 공개: 분야별 내부 정합성·품질 통합 검사 (분야에 따라 적용 규칙 분기)
// ---------------------------------------------------------------------------
export function runFieldConsistencyChecks(
  rawText: string,
  fieldId: string,
  surveyYear?: string
): DiscrepancyItem[] {
  try {
    const body = bodyText(rawText.replace(/\r/g, ""));
    if (!body || body.length < 20) return [];
    const baseYear = surveyYear || "";

    // 모든 분야 공통: 종수 조사범위(금번/선행/종합) 판정 + 완성도/표기 품질
    const common: DiscrepancyItem[] = [
      ...checkSpeciesCountConsistency(body, baseYear),
      ...checkResidualKeywords(body),
      ...checkFigureTableNumbers(body),
      ...checkScientificNameFormat(body),
    ];

    if (fieldId === "insects") {
      return [...checkOrderArithmetic(body), ...common];
    }
    if (fieldId === "fish") {
      return [...checkFamilyArithmetic(body), ...common];
    }
    return [];
  } catch (e) {
    // 검수 도구 자체 오류가 전체 분석을 막지 않도록 방어
    return [];
  }
}

// 하위 호환: 기존 곤충 전용 진입점 유지
export function runInsectConsistencyChecks(rawText: string, surveyYear?: string): DiscrepancyItem[] {
  return runFieldConsistencyChecks(rawText, "insects", surveyYear);
}
