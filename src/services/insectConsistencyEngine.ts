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
// 검사 1: 금번조사 '전체 종수' 내부 모순
// ---------------------------------------------------------------------------
// 보고서에는 하위그룹(양서류/파충류)·범주(멸종위기/고유종)·조사지점/격자별 종수가
// 많이 나온다. 이를 전체 종수 모순으로 오인하지 않도록 두 단계로 걸러낸다.
//   1) 하위그룹·범주·지점/격자 수식어가 앞에 붙은 종수는 '전체 종수'가 아니므로 제외
//   2) 남은 값 중 서로 '가까운'(작은쪽/큰쪽 ≥ 0.85) 쌍이 있을 때만 동일 전체 종수의
//      오기로 보고 탐지 (하위그룹은 값 차이가 커서 걸러진다)
const SUBGROUP_WORDS = [
  "양서류", "파충류", "무척추", "멸종위기", "위급", "위기", "취약", "관심", "고유종",
  "특정종", "국외반출", "기후변화", "적색", "외래", "귀화", "교란", "신규", "추가",
  "중복", "지표", "지점", "격자", "정점", "구간", "개체", "아과", "선행", "기존",
  "합계", "소계", "부분합",
];
const NEAR_RATIO = 0.85; // 두 값이 이 비율 이상 가까울 때만 동일 전체 종수의 오기로 본다
const MIN_TOTAL_SPECIES = 20; // 소규모 하위그룹(한 자리·10여 종)을 전체 종수로 오인하지 않도록

function isSubgroupCount(body: string, index: number): boolean {
  const pre = body.slice(Math.max(0, index - 22), index);
  if (SUBGROUP_WORDS.some((w) => pre.includes(w))) return true;
  if (/E\s?[1-9]\b/.test(pre)) return true; // 조사격자 E1~E9
  return false;
}

function checkSpeciesCountConsistency(body: string, baseYear: string): DiscrepancyItem[] {
  const out: DiscrepancyItem[] = [];
  const counts = extractReportCounts(body, baseYear).filter(
    (c) => (c.scope === "금번" || c.scope === "불명") && !isSubgroupCount(body, c.index)
  );
  const vals = [...new Set(counts.map((c) => c.count))]
    .filter((v) => v >= MIN_TOTAL_SPECIES)
    .sort((x, y) => y - x); // 내림차순
  if (vals.length < 2) return out;

  // 서로 가장 가까운(비율 최대) 쌍을 찾는다
  let best: { hi: number; lo: number; r: number } | null = null;
  for (let i = 0; i < vals.length; i++) {
    for (let j = i + 1; j < vals.length; j++) {
      const r = vals[j] / vals[i];
      if (r >= NEAR_RATIO && (!best || r > best.r)) best = { hi: vals[i], lo: vals[j], r };
    }
  }
  if (!best) return out;

  const a = counts.find((c) => c.count === best!.hi)!;
  const b = counts.find((c) => c.count === best!.lo)!;
  out.push({
    id: rid("ins-scnt"),
    category: "INTERNAL_CONSISTENCY",
    severity: "CRITICAL",
    section: "종 다양성 현황 (Results)",
    title: `[불일치 의심] 전체 종수 표현 상호 불일치 (${best.hi}종 ≠ ${best.lo}종)`,
    description:
      `보고서 본문에서 전체(금번) 조사 종수로 보이는 값이 서로 다르게 기재되어 있습니다: ` +
      `${a.matched}(${a.count}종), ${b.matched}(${b.count}종). ` +
      `하위그룹·범주·지점별 종수, 선행조사·종합 수치는 비교에서 제외하였습니다.`,
    isSuspectedInconsistency: true,
    inconsistencyType: "SPECIES_COUNT",
    conflictingPassages: {
      locationA: `본문 (${a.name})`, textA: a.evidence,
      locationB: `본문 (${b.name})`, textB: b.evidence,
    },
    suggestedFix: "본문 요약·결과 표·고찰의 전체 종수를 동일한 수치로 통일하십시오.",
  });
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

  // 본문에 서술된 목 수가 총 목 수와 다르면(= 일부 목이 표에만 있고 프로세스로 서술 안 됨)
  // 합계를 신뢰할 수 없으므로 검증하지 않는다(실제 보고서 오탐 방지).
  if (keys.length !== totalOrders) return out;

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

  // 본문에 서술된 과 수가 총 과 수와 다르면(일부 과가 표에만 있음) 합계 검증 불가.
  if (keys.length !== totalFam) return out;

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
  return out;
}

// ---------------------------------------------------------------------------
// 검사 7: 그룹(목/과)별 종수 → 총 종수 합계 검증 — 조류 등
//   (예: "참새목 45종, 도요목 12종 … 총 85종")
// ---------------------------------------------------------------------------
// '목/과'로 끝나지만 분류군이 아닌 단어 제외(항목·결과·수목·학과 등).
const GROUP_BLOCKLIST = new Set([
  "항목", "종목", "과목", "제목", "품목", "조목", "명목", "세목", "두목", "안목", "면목",
  "주목", "이목", "반목", "지목", "각목", "골목", "초목", "수목", "재목", "괄목", "맹목",
  "강목", "절목", "비목",
  "결과", "성과", "경과", "통과", "효과", "학과", "전과", "내과", "외과", "치과", "안과",
  "예과", "본과", "분과", "교과", "대과", "소과", "조사과", "연구과", "기획과", "총무과",
  "관리과", "보전과", "분류과",
]);

function parseGroups(body: string): Record<string, { species: number; evidence: string }> {
  const re = /([가-힣]{1,10}(?:목|과))\s*([0-9][0-9,]*)\s*종/g;
  const found: Record<string, { species: number; evidence: string }> = {};
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    const g = m[1];
    if (GROUP_BLOCKLIST.has(g)) continue;
    const sp = toInt(m[2]);
    if (sp == null) continue;
    if (!(g in found)) found[g] = { species: sp, evidence: snippet(body, m.index, m.index + m[0].length) };
  }
  return found;
}

function checkGroupSpeciesArithmetic(body: string): DiscrepancyItem[] {
  const out: DiscrepancyItem[] = [];
  const groups = parseGroups(body);
  const keys = Object.keys(groups);
  const t = body.match(/총\s*([0-9][0-9,]*)\s*종/);
  if (!t || keys.length < 2) return out;

  const total = toInt(t[1])!;
  const sum = keys.reduce((a, k) => a + groups[k].species, 0);
  // '총 N종'에는 목/과 개수가 없어 서술 누락을 감지할 수 없다.
  // 합이 총계보다 '작으면' 표에만 있는 그룹이 있을 수 있어(정상) 판정하지 않고,
  // 합이 총계를 '초과'할 때만 실제 오류(중복·오기)로 본다.
  if (sum <= total) return out;

  const totalEvidence = snippet(body, body.indexOf(t[0]), body.indexOf(t[0]) + t[0].length);
  out.push({
    id: rid("bird-gsum"),
    category: "STATISTICS",
    severity: "CRITICAL",
    section: "분류군별 종 구성",
    title: `[불일치 의심] 목·과별 종수 합계(${sum}종)가 총 종수(${total}종)를 초과`,
    description:
      `분류군(목/과)별로 기재된 종수의 합(${sum}종)이 보고서 총 종수(${total}종)보다 많습니다. ` +
      `분류군별 수치(${keys.map((k) => `${k} ${groups[k].species}종`).join(", ")}) 또는 총계에 오기·중복이 있는지 확인이 필요합니다.`,
    isSuspectedInconsistency: true,
    inconsistencyType: "DOMAIN_METRICS",
    conflictingPassages: {
      locationA: "분류군별 종 구성 서술/표", textA: `분류군별 종수 합 = ${sum}종`,
      locationB: "총 종수(총괄)", textB: totalEvidence,
    },
    suggestedFix: "분류군별 종수와 총 종수(총괄표)를 재확인하여 합계를 일치시키십시오.",
  });
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

    // 완성도·표기 품질 검사(편집 잔존 문구 / 표·그림 번호 / 학명 표기)
    const quality: DiscrepancyItem[] = [
      ...checkResidualKeywords(body),
      ...checkFigureTableNumbers(body),
      ...checkScientificNameFormat(body),
    ];
    // 종수 조사범위(금번/선행/종합) 정합성 + 품질
    const speciesAndQuality: DiscrepancyItem[] = [
      ...checkSpeciesCountConsistency(body, baseYear),
      ...quality,
    ];

    // 목→과→종 (곤충)
    if (fieldId === "insects") {
      return [...checkOrderArithmetic(body), ...speciesAndQuality];
    }
    // 과→종 (담수어류)
    if (fieldId === "fish") {
      return [...checkFamilyArithmetic(body), ...speciesAndQuality];
    }
    // 목/과→종 (조류·포유류·양서파충류·저서성대형무척추동물)
    if (
      fieldId === "birds" ||
      fieldId === "mammals" ||
      fieldId === "herpetofauna" ||
      fieldId === "benthos"
    ) {
      return [...checkGroupSpeciesArithmetic(body), ...speciesAndQuality];
    }
    // 식물상: 과-속-종 및 종수 정합성은 앱의 기존 엔진(detectInternalInconsistencies)이
    // 이미 담당하므로 중복을 피하고, 완성도·표기 품질만 보강한다.
    if (fieldId === "flora" || fieldId === "vegetation") {
      return quality;
    }
    // 지형: 종/학명 단위가 아니므로 잔존 문구·표·그림 번호만 점검
    if (fieldId === "plankton_landscape") {
      return [...checkResidualKeywords(body), ...checkFigureTableNumbers(body)];
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
