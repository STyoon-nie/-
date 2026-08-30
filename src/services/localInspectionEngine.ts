import { ECOLOGICAL_FIELDS } from "../data/fieldsData";
import { KOREAN_SPECIES_DATABASE, KnownSpecies } from "../data/speciesDatabase";
import {
  DiscrepancyItem,
  FieldCategory,
  InspectionReportResult,
  InspectionScore,
  SpeciesRecord,
} from "../types";

export function analyzeEcologicalReport(
  fieldId: FieldCategory,
  reportTitle: string,
  rawText: string,
  fileName: string = "보고서_파일.hwp"
): InspectionReportResult {
  const field = ECOLOGICAL_FIELDS.find((f) => f.id === fieldId) || ECOLOGICAL_FIELDS[0];
  const discrepancies: DiscrepancyItem[] = [];
  const detectedSpecies: SpeciesRecord[] = [];

  const lines = rawText.split("\n");
  const normalizedText = rawText.replace(/\r/g, "");

  // 1. Structure & Mandatory Chapters Check (Strict National Institute of Ecology Standards)
  let missingSections = 0;

  const isSectionPresentInText = (sectionTitle: string, normText: string, textLines: string[]): boolean => {
    const spacelessText = normText.replace(/\s+/g, "");

    // Clean section key without numbers, dots, and parenthesized explanation
    const cleanKeyword = sectionTitle.replace(/^[0-9가-힣.·\s]+/, "").split("(")[0].trim();
    if (cleanKeyword && (normText.includes(cleanKeyword) || spacelessText.includes(cleanKeyword.replace(/\s+/g, "")))) {
      return true;
    }

    // Numbered chapter pattern e.g. "1. 서론" or "1. 서 론"
    const chapterMatch = sectionTitle.match(/^(\d+)\.\s*([가-힣\s]+)/);
    if (chapterMatch) {
      const chNum = chapterMatch[1];
      const chTitle = chapterMatch[2].replace(/\s+/g, "");
      if (spacelessText.includes(`${chNum}.${chTitle}`) || spacelessText.includes(`${chNum}장${chTitle}`) || spacelessText.includes(chTitle)) {
        return true;
      }
    }

    // Domain specific fallback matchers
    if (sectionTitle.includes("요약")) {
      return spacelessText.includes("요약") || spacelessText.includes("요약문") || spacelessText.includes("summary");
    }
    if (sectionTitle.includes("서론")) {
      return spacelessText.includes("서론") || spacelessText.includes("조사지개황") || spacelessText.includes("개황");
    }
    if (sectionTitle.includes("조사일정") || sectionTitle.includes("조사방법") || sectionTitle.includes("조사지역") || sectionTitle.includes("조사 일반 현황")) {
      return (
        spacelessText.includes("조사일정") ||
        spacelessText.includes("조사방법") ||
        spacelessText.includes("조사지역") ||
        spacelessText.includes("조사지점") ||
        spacelessText.includes("조사일반현황") ||
        spacelessText.includes("조사개요")
      );
    }
    if (sectionTitle.includes("군집분석")) {
      return spacelessText.includes("군집분석") || spacelessText.includes("군집지수") || spacelessText.includes("다양도지수");
    }
    if (sectionTitle.includes("물환경 평가")) {
      return spacelessText.includes("물환경평가") || spacelessText.includes("물환경") || spacelessText.includes("esb");
    }
    if (sectionTitle.includes("지형총괄표")) {
      return spacelessText.includes("지형총괄표") || spacelessText.includes("지형총괄");
    }
    if (sectionTitle.includes("지형 면 속성") || sectionTitle.includes("지형조사평가표") || sectionTitle.includes("속성조사표")) {
      return spacelessText.includes("지형조사평가표") || spacelessText.includes("속성조사표") || spacelessText.includes("평가표") || spacelessText.includes("속성조사");
    }
    if (sectionTitle.includes("군락구조표")) {
      return spacelessText.includes("군락구조표") || spacelessText.includes("군락구조");
    }
    if (sectionTitle.includes("선행연구") || sectionTitle.includes("선행조사") || sectionTitle.includes("선행")) {
      return spacelessText.includes("선행연구") || spacelessText.includes("선행조사") || spacelessText.includes("선행") || spacelessText.includes("기존조사");
    }
    if (sectionTitle.includes("결과") || sectionTitle.includes("결과 및 고찰")) {
      return spacelessText.includes("결과") || spacelessText.includes("조사결과");
    }
    if (sectionTitle.includes("특이사항") || sectionTitle.includes("고찰") || sectionTitle.includes("제언") || sectionTitle.includes("결론") || sectionTitle.includes("보전관리")) {
      return (
        spacelessText.includes("특이사항") ||
        spacelessText.includes("고찰") ||
        spacelessText.includes("제언") ||
        spacelessText.includes("결론") ||
        spacelessText.includes("종합고찰") ||
        spacelessText.includes("보전관리") ||
        spacelessText.includes("보전대책")
      );
    }
    if (sectionTitle.includes("참고문헌")) {
      return spacelessText.includes("참고문헌") || spacelessText.includes("문헌") || spacelessText.includes("인용문헌") || spacelessText.includes("references");
    }

    return textLines.some((l) => l.includes(cleanKeyword) || l.includes(cleanKeyword.replace(/\s+/g, "")));
  };

  field.mandatorySections.forEach((sectionTitle) => {
    const isPresent = isSectionPresentInText(sectionTitle, normalizedText, lines);

    if (!isPresent) {
      missingSections++;
      discrepancies.push({
        id: `struct-${Math.random().toString(36).substring(2, 7)}`,
        category: "STRUCTURE",
        severity: "CRITICAL",
        section: "보고서 체제 및 법정 서식",
        title: `필수 서식/목차 누락: [${sectionTitle}]`,
        description: `국립생태원 ${field.name} 표준 지침에 명시된 필수 서식 항목인 '${sectionTitle}'이(가) 본문에서 확인되지 않았습니다.`,
        suggestedFix: `보고서 목차에 '${sectionTitle}' 장을 신설하고 관련 표준 양식 데이터를 기재하십시오.`,
      });
    }
  });

  // 2. Taxonomy & Species Analysis with Taxa Scoping & Strict Word Boundary Matching
  let taxonomyErrors = 0;
  let protectedSpeciesCount = 0;
  let invasiveSpeciesCount = 0;

  // Taxa category scoping for each of the 9 survey fields
  const FIELD_TAXA_CATEGORIES: Record<FieldCategory, string[]> = {
    flora: ["flora"],
    vegetation: ["vegetation", "flora"],
    birds: ["birds"],
    mammals: ["mammals"],
    herpetofauna: ["herpetofauna"],
    fish: ["fish"],
    insects: ["insects"],
    benthos: ["benthos"],
    plankton_landscape: ["plankton_landscape", "flora", "benthos"],
  };

  const allowedCategories = FIELD_TAXA_CATEGORIES[fieldId] || [fieldId];
  const candidateSpecies = KOREAN_SPECIES_DATABASE.filter((s) => allowedCategories.includes(s.category));

  // Strict Korean word boundary matcher: ensures the species name is NOT part of another compound word or another species name
  // e.g. "우리남생이잎벌레" should NOT match "남생이"
  // e.g. "참쉬리" should NOT match "쉬리"
  // e.g. "애기뿔소똥구리" should NOT match "소똥구리"
  // e.g. "이끼도롱뇽" should NOT match "도롱뇽"
  // e.g. "노루귀" should NOT match "노루"
  // e.g. "흰줄표범나비" should NOT match "표범"
  const isKoreanSpeciesExactMatch = (text: string, speciesName: string): boolean => {
    if (!text || !speciesName) return false;
    const escaped = speciesName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?<![가-힣])${escaped}(?![가-힣])`, "g");
    return regex.test(text);
  };

  candidateSpecies.forEach((known: KnownSpecies) => {
    if (isKoreanSpeciesExactMatch(normalizedText, known.koreanName)) {
      if (known.isEndangered) protectedSpeciesCount++;
      if (known.isInvasive) invasiveSpeciesCount++;

      const sciBase = known.scientificName.split(" ")[0] + " " + (known.scientificName.split(" ")[1] || "");
      const hasItalicMarkdown =
        normalizedText.includes(`*${sciBase}`) ||
        normalizedText.includes(`_${sciBase}`) ||
        normalizedText.includes(`<i>${sciBase}`);

      let typoFound = false;
      let matchedTypo = "";
      if (known.scientificTypos) {
        for (const typo of known.scientificTypos) {
          if (normalizedText.includes(typo)) {
            typoFound = true;
            matchedTypo = typo;
            break;
          }
        }
      }

      const isMarkdownFormatted =
        normalizedText.includes("# ") ||
        normalizedText.includes("## ") ||
        normalizedText.includes("**") ||
        normalizedText.includes("<i>");

      if (typoFound) {
        taxonomyErrors++;
        discrepancies.push({
          id: `taxo-${Math.random().toString(36).substring(2, 7)}`,
          category: "TAXONOMY",
          severity: "CRITICAL",
          section: "출현 생물종 목록 및 학명",
          title: `이명/구학명 사용 감지: ${known.koreanName}`,
          description: `국가생물종목록(K-BML) 최신 표준 학명인 '${known.scientificName}' 대신 구학명/이명인 '${matchedTypo}'이(가) 사용되었습니다.`,
          targetExcerpt: matchedTypo,
          suggestedFix: `최신 국가표준 학명인 '*${known.scientificName}*'으로 수정하십시오.`,
        });
      } else if (isMarkdownFormatted && !hasItalicMarkdown && normalizedText.includes(sciBase) && sciBase.length > 3) {
        taxonomyErrors++;
        discrepancies.push({
          id: `taxo-${Math.random().toString(36).substring(2, 7)}`,
          category: "TAXONOMY",
          severity: "WARNING",
          section: "학명 표기법 (ICZN/ICN)",
          title: `학명 이탤릭체(기울임꼴) 미적용: ${sciBase}`,
          description: `국제명명규약 및 국립생태원 표준에 따라 속명과 종소명은 반드시 이탤릭체(*${sciBase}*)로 표기해야 합니다.`,
          targetExcerpt: sciBase,
          suggestedFix: `*${known.scientificName}* 와 같이 기울임꼴을 적용하십시오.`,
        });
      }

      detectedSpecies.push({
        koreanName: known.koreanName,
        scientificName: known.scientificName,
        family: known.family,
        protectionClass: known.protectionClass,
        status: typoFound
          ? "SYNONYM_DETECTED"
          : !hasItalicMarkdown && normalizedText.includes(sciBase)
          ? "SCIENTIFIC_NAME_ERROR"
          : "VALID",
        note: known.protectionClass ? `[${known.protectionClass}]` : undefined,
      });
    }
  });

  // 3. Security: Endangered Species Coordinate Exposure Check
  let securityBreaches = 0;
  const highPrecisionCoordinateRegex = /(?:[N|S]\s*\d+°\d+'[\d.]+"|[E|W]\s*\d+°\d+'[\d.]+"|위도\s*3\d\.\d{4,}|경도\s*12\d\.\d{4,}|좌표\s*:\s*3\d\.\d{4,})/i;

  const hasHighPrecisionGPS = highPrecisionCoordinateRegex.test(normalizedText);

  // Exclude geomorphology from endangered coordinate masking because geomorphological landforms require precise survey coordinates
  if (hasHighPrecisionGPS && protectedSpeciesCount > 0 && fieldId !== "plankton_landscape") {
    securityBreaches++;
    discrepancies.push({
      id: `sec-${Math.random().toString(36).substring(2, 7)}`,
      category: "SECURITY",
      severity: "CRITICAL",
      section: "위치정보 및 대국민 보안 관리",
      title: "멸종위기 야생생물 초정밀 위치좌표 대국민 노출 위험",
      description:
        "본 보고서에는 멸종위기 야생생물이 기록되어 있으나, 초정밀 GPS 좌표(초 단위 또는 소수점 4자리 이상)가 직접 기재되어 있습니다. 밀렵 및 서식처 훼손 방지를 위해 대국민 서비스 공개 전 10km x 10km 격자 단위 마스킹이 필수입니다.",
      suggestedFix:
        "고유 정밀좌표를 '도엽명(1:25,000) 및 10km 표준 정방격자' 또는 '(비공개 보안)'으로 변환 처리하십시오.",
    });
  }

  // 4. Authentic 9 Fields Specific Diagnostic Rules (Multi-pattern Normalized Matching)
  const spaceless = normalizedText.replace(/\s+/g, "").toLowerCase();

  // (1) Benthos (저서성대형무척추동물)
  if (fieldId === "benthos") {
    const hasEsb =
      spaceless.includes("esb") ||
      spaceless.includes("생태점수") ||
      spaceless.includes("물환경평가") ||
      spaceless.includes("오수생물") ||
      spaceless.includes("환경질");

    if (!hasEsb) {
      discrepancies.push({
        id: `benthos-esb-${Math.random().toString(36).substring(2, 7)}`,
        category: "METHODOLOGY",
        severity: "CRITICAL",
        section: "물환경 평가 (ESB 지수)",
        title: "저서동물 생태점수(ESB 지수) 산출 결과 누락",
        description: "국립생태원 제5차 자연환경조사 저서성대형무척추동물 지침에 따른 ESB 지수(= ∑(Si × Qi)) 및 물환경 등급(A~F, 최우선보호~최우선개선수역) 산출표가 누락되었습니다.",
        suggestedFix: "조사지점별 ESB 지수 및 오수생물계열 평가표(<표 3>)를 작성하십시오.",
      });
    }

    const hasEpt =
      spaceless.includes("ept") ||
      spaceless.includes("하루살이") ||
      spaceless.includes("강도래") ||
      spaceless.includes("날도래") ||
      spaceless.includes("생물지표") ||
      spaceless.includes("수서곤충");

    if (!hasEpt) {
      discrepancies.push({
        id: `benthos-ept-${Math.random().toString(36).substring(2, 7)}`,
        category: "METHODOLOGY",
        severity: "WARNING",
        section: "군집 특성 분석",
        title: "유수역 EPT(하루살이·강도래·날도래) 생물지표 분석 누락",
        description: "수생태계 환경질 민감지표인 EPT 출현 비율(%) 분석을 기술해야 합니다.",
        suggestedFix: "유수역 지점별 EPT 종수 및 구성비(%)를 고찰에 추가하십시오.",
      });
    }
  }

  // (2) Fish (담수어류)
  if (fieldId === "fish") {
    const hasGear =
      spaceless.includes("5×5") ||
      spaceless.includes("5x5") ||
      spaceless.includes("5*5") ||
      spaceless.includes("족대") ||
      spaceless.includes("투망") ||
      spaceless.includes("채집장비") ||
      spaceless.includes("어구");

    if (!hasGear) {
      discrepancies.push({
        id: `fish-gear-${Math.random().toString(36).substring(2, 7)}`,
        category: "METHODOLOGY",
        severity: "WARNING",
        section: "조사방법 및 채집장비",
        title: "표준 채집장비(족대 5×5mm, 투망 6×6mm) 규격 미기재",
        description: "전국자연환경조사 담수어류 지침에 따라 족대(5×5 ㎜) 및 투망(6×6 ㎜) 규격을 명시해야 합니다.",
        suggestedFix: "조사방법에 '어류 채집은 족대(5×5 ㎜)와 투망(6×6 ㎜)을 사용하였다'를 명시하십시오.",
      });
    }

    const hasIndices =
      spaceless.includes("mcnaughton") ||
      spaceless.includes("shannon") ||
      spaceless.includes("우점도") ||
      spaceless.includes("다양도") ||
      spaceless.includes("균등도") ||
      spaceless.includes("풍부도") ||
      spaceless.includes("군집분석") ||
      spaceless.includes("군집지수");

    if (!hasIndices) {
      discrepancies.push({
        id: `fish-indices-${Math.random().toString(36).substring(2, 7)}`,
        category: "STATISTICS",
        severity: "CRITICAL",
        section: "군집분석 (Community Analysis)",
        title: "어류 4대 군집분석 지수(우점도, 종다양도, 균등도, 풍부도) 수식 누락",
        description: "McNaughton(1967) 우점도, Shannon and Weaver(1963) 종다양도, Pielou(1975) 종균등도, Margalef(1958) 종풍부도 지수 산출표가 누락되었습니다.",
        suggestedFix: "각 지점별 및 전체 군집분석 지수표(<표 5>)를 수록하십시오.",
      });
    }
  }

  // (3) Mammals (포유류)
  if (fieldId === "mammals") {
    const hasGrid =
      /E[1-9]/i.test(normalizedText) ||
      spaceless.includes("격자") ||
      spaceless.includes("도엽") ||
      spaceless.includes("조사구간") ||
      spaceless.includes("조사지점") ||
      spaceless.includes("조사지역");

    if (!hasGrid) {
      discrepancies.push({
        id: `mam-grid-${Math.random().toString(36).substring(2, 7)}`,
        category: "METHODOLOGY",
        severity: "CRITICAL",
        section: "조사구역 격자망",
        title: "1:25,000 지형도 9분할 격자 코드(E1~E9) 미적용",
        description: "제6차 전국자연환경조사 포유류 지침에 따라 도엽을 9개 격자(E1~E9)로 분할하여 조사일정 및 출현현황을 기록해야 합니다.",
        suggestedFix: "도엽 내 격자번호(E1~E9)를 기준으로 조사결과 총괄표(<표 2>)를 재작성하십시오.",
      });
    }

    const hasCriteria =
      spaceless.includes("기호") ||
      spaceless.includes("판단기준") ||
      spaceless.includes("서식지판단") ||
      spaceless.includes("생태·자연도") ||
      spaceless.includes("생태자연도") ||
      spaceless.includes("기준표") ||
      spaceless.includes("무인카메라") ||
      spaceless.includes("센서카메라") ||
      spaceless.includes("서식흔적");

    if (protectedSpeciesCount > 0 && !hasCriteria) {
      discrepancies.push({
        id: `mam-crit-${Math.random().toString(36).substring(2, 7)}`,
        category: "STRUCTURE",
        severity: "WARNING",
        section: "생태·자연도 1등급 반영 주요종",
        title: "생태·자연도 주요종 서식지 판단 기준표(A~H) 누락",
        description: "멸종위기 포유류(수달, 삵, 담비 등) 출현 시 생태·자연도 1등급 반영을 위한 서식지 판단 기준 기호(A~H)를 표기해야 합니다.",
        suggestedFix: "멸종위기 야생생물 현황표(<표 5>)에 기호(A, B, C, F 등)를 병기하고 기준표(<표 6>)를 첨부하십시오.",
      });
    }
  }

  // (4) Geomorphology (지형)
  if (fieldId === "plankton_landscape") {
    const hasGeomorphCodes =
      /(?:FG|MG|CG|SG|VG|KG)\d{1,2}/i.test(normalizedText) ||
      spaceless.includes("지형총괄") ||
      spaceless.includes("표준기호") ||
      spaceless.includes("분류기호") ||
      spaceless.includes("폭포") ||
      spaceless.includes("기반암") ||
      spaceless.includes("고립구릉") ||
      spaceless.includes("토르") ||
      spaceless.includes("하도습지") ||
      spaceless.includes("자연제방");

    if (!hasGeomorphCodes && !spaceless.includes("기호")) {
      discrepancies.push({
        id: `geo-codes-${Math.random().toString(36).substring(2, 7)}`,
        category: "STRUCTURE",
        severity: "CRITICAL",
        section: "지형총괄표 및 표준 기호",
        title: "전국자연환경조사 지형 표준 분류기호(FG/MG/CG 등) 미적용",
        description: "제6차 전국자연환경조사 지형 지침에 따라 지형 유형별 표준 기호(폭포 FG01, 폭포/폭호 FG02, 기반암하상 FG11, 고립구릉 MG05, 토르군 MG15 등)를 필히 부여해야 합니다.",
        suggestedFix: "지형총괄표에 표준 분류기호 및 규모(가로×세로×높이 m), 경위도 좌표를 기재하십시오.",
      });
    }

    const hasEvalTable =
      spaceless.includes("지형조사평가표") ||
      spaceless.includes("속성조사표") ||
      spaceless.includes("평가점수") ||
      spaceless.includes("항목점수") ||
      spaceless.includes("지형평가") ||
      spaceless.includes("평가표") ||
      spaceless.includes("평가항목");

    if (!hasEvalTable) {
      discrepancies.push({
        id: `geo-eval-${Math.random().toString(36).substring(2, 7)}`,
        category: "METHODOLOGY",
        severity: "CRITICAL",
        section: "지형조사평가표",
        title: "지형 10개 평가항목 점수 및 평가등급(Ⅰ~Ⅲ) 산정표 누락",
        description: "대표성, 전형성, 희소성, 특이성, 민감성, 자연사적 가치, 학술성, 교육적 활용, 보존성, 다양성, 규모 등 10개 항목에 대한 정량 평가표가 누락되었습니다.",
        suggestedFix: "각 지형지점별 '지형조사평가표'를 작성하고 항목점수 합계 및 환산 평가점수를 명시하십시오.",
      });
    }
  }

  // (5) Herpetofauna (양서·파충류)
  if (fieldId === "herpetofauna") {
    const hasNightSurvey =
      spaceless.includes("야간조사") ||
      spaceless.includes("야간") ||
      spaceless.includes("청음") ||
      spaceless.includes("산란기") ||
      spaceless.includes("주·야간") ||
      spaceless.includes("주야간") ||
      spaceless.includes("야간채집");

    if (!hasNightSurvey) {
      discrepancies.push({
        id: `herp-night-${Math.random().toString(36).substring(2, 7)}`,
        category: "METHODOLOGY",
        severity: "WARNING",
        section: "조사방법 및 일정",
        title: "양서류 산란기 야간 청음조사 기록 누락",
        description: "양서류 조사는 야간 산란 활동 특성을 반영하여 야간조사(일정 및 웅덩이/습지 조사결과)를 필수적으로 수록해야 합니다.",
        suggestedFix: "야간조사 일정표(<표 1>) 및 야간 출현종 표(<표 4>)를 보완하십시오.",
      });
    }

    const hasRoadkill =
      spaceless.includes("로드킬") ||
      spaceless.includes("roadkill") ||
      spaceless.includes("폐사") ||
      spaceless.includes("차량") ||
      spaceless.includes("위협요인") ||
      spaceless.includes("서식지위협");

    if (!hasRoadkill) {
      discrepancies.push({
        id: `herp-rk-${Math.random().toString(36).substring(2, 7)}`,
        category: "METHODOLOGY",
        severity: "WARNING",
        section: "서식지 위협요인 분석",
        title: "양서·파충류 로드킬(Roadkill) 결과 분석표 누락",
        description: "도로 횡단에 취약한 양서·파충류의 로드킬 발생 현황(구분/종류/종명/건수)을 조사표로 작성해야 합니다.",
        suggestedFix: "로드킬 현황표(<표 5>)를 수록하십시오.",
      });
    }
  }

  // (6) Insects (육상곤충)
  if (fieldId === "insects") {
    const hasTrapOrMethods =
      spaceless.includes("트랩") ||
      spaceless.includes("버킷라이트") ||
      spaceless.includes("복합트랩") ||
      spaceless.includes("말레이즈") ||
      spaceless.includes("비행간섭") ||
      spaceless.includes("핏폴") ||
      spaceless.includes("함정덫") ||
      spaceless.includes("선조사") ||
      spaceless.includes("포충망") ||
      spaceless.includes("채어잡기") ||
      spaceless.includes("쓸어잡기") ||
      spaceless.includes("야외조사");

    if (!hasTrapOrMethods) {
      discrepancies.push({
        id: `ins-trap-${Math.random().toString(36).substring(2, 7)}`,
        category: "METHODOLOGY",
        severity: "WARNING",
        section: "조사방법",
        title: "표준 트랩(버킷라이트, 복합트랩, 핏폴트랩) 운용 기록 누락",
        description: "제6차 자연환경조사 육상곤충 지침에 따라 주간 선조사 외에 버킷라이트트랩, 복합(말레이즈+비행간섭)트랩, 핏폴트랩 운용 내용이 기술되어야 합니다.",
        suggestedFix: "트랩 유형별 설치 위치 및 조사일정(<표 1>)을 명시하십시오.",
      });
    }

    const hasSpecificSpeciesCategories =
      spaceless.includes("특정종") ||
      spaceless.includes("분포특이") ||
      spaceless.includes("유용곤충") ||
      spaceless.includes("위해우려") ||
      spaceless.includes("위해우려가능종") ||
      spaceless.includes("해충") ||
      spaceless.includes("화분매개") ||
      spaceless.includes("환경정화") ||
      spaceless.includes("천적") ||
      spaceless.includes("주요종");

    if (!hasSpecificSpeciesCategories) {
      discrepancies.push({
        id: `ins-spec-${Math.random().toString(36).substring(2, 7)}`,
        category: "TAXONOMY",
        severity: "WARNING",
        section: "법정보호종 및 주요종",
        title: "곤충 특정종 4대 세부분류(분포특이종, 유용곤충, 위해우려, 해충) 누락",
        description: "곤충상 주요종은 분포특이종, 유용곤충(천적/환경정화/화분매개), 위해우려가능종, 해충으로 세분하여 분석해야 합니다.",
        suggestedFix: "특정종 출현현황표(<표 3>)를 세부 카테고리별로 작성하십시오.",
      });
    }
  }

  // (7) Birds (조류)
  if (fieldId === "birds") {
    const hasActivityCodes =
      /\([a-w]\)/i.test(normalizedText) ||
      /[a-w]:/i.test(normalizedText) ||
      spaceless.includes("서식유형기호") ||
      spaceless.includes("행동유형") ||
      spaceless.includes("행동기호") ||
      spaceless.includes("행동특성") ||
      spaceless.includes("행동");

    if (protectedSpeciesCount > 0 && !hasActivityCodes) {
      discrepancies.push({
        id: `birds-act-${Math.random().toString(36).substring(2, 7)}`,
        category: "METHODOLOGY",
        severity: "CRITICAL",
        section: "멸종위기 야생생물 출현현황",
        title: "멸종위기 조류 23개 표준 행동유형기호(a~w) 누락",
        description: "멸종위기 조류 출현 기록 시 '새호리기(t)', '붉은배새매(t)'와 같이 국립생태원 표준 23개 행동유형기호(a:둥지출입, b:포란, t:먹이비행, u:선회, w:단순통과 등)를 병기해야 합니다.",
        suggestedFix: "멸종위기 야생생물 표(<표 5>)에 행동유형기호를 기재하고 하단에 정의를 명시하십시오.",
      });
    }

    const hasHabitats =
      spaceless.includes("서식지유형") ||
      spaceless.includes("서식지") ||
      spaceless.includes("서식처") ||
      spaceless.includes("인공") ||
      spaceless.includes("하천") ||
      spaceless.includes("호소") ||
      spaceless.includes("산림") ||
      spaceless.includes("농경지") ||
      spaceless.includes("초지");

    if (!hasHabitats) {
      discrepancies.push({
        id: `birds-hab-${Math.random().toString(36).substring(2, 7)}`,
        category: "STRUCTURE",
        severity: "WARNING",
        section: "서식지유형별 출현 현황",
        title: "조류 8대 서식지유형(인공, 하천, 호소, 논, 밭, 과수원, 초지, 산림) 분류 미준수",
        description: "환경부 표준 8대 조류 서식지 유형별 출현 종수 및 개체수 분석표가 누락되었습니다.",
        suggestedFix: "서식지유형별 조류 출현 현황표(<표 3>)를 작성하십시오.",
      });
    }
  }

  // (8) Vegetation (식생)
  if (fieldId === "vegetation") {
    if (normalizedText.includes("피도 75%") || normalizedText.includes("임의의 퍼센트")) {
      discrepancies.push({
        id: `veg-scale-${Math.random().toString(36).substring(2, 7)}`,
        category: "METHODOLOGY",
        severity: "CRITICAL",
        section: "식생조사 척도",
        title: "Braun-Blanquet(Z-M) 표준 7단계 우점도/군도 척도 미적용",
        description: "식생조사표 작성 시 임의 백분율 대신 표준 7단계 척도(+, 1, 2, 3, 4, 5)를 적용해야 합니다.",
        suggestedFix: "7단계 표준 척도로 환산하여 군락구조표에 기록하십시오.",
      });
    }

    const hasQuadrat =
      spaceless.includes("군락구조표") ||
      spaceless.includes("식생조사표") ||
      spaceless.includes("식생변경표") ||
      spaceless.includes("t1") ||
      spaceless.includes("t2") ||
      spaceless.includes("교목층") ||
      spaceless.includes("초본층") ||
      spaceless.includes("방형구");

    if (!hasQuadrat) {
      discrepancies.push({
        id: `veg-quad-${Math.random().toString(36).substring(2, 7)}`,
        category: "STRUCTURE",
        severity: "CRITICAL",
        section: "군락구조표 (Quadrat Data)",
        title: "식생조사 군락구조표(T1/T2/S/H 4층 구조) 누락",
        description: "방형구별 해발고도, 면적, 경사도, 방위 및 교목층(T1), 아교목층(T2), 관목층(S), 초본층(H) 높이와 피도, 식생보전등급(Class)이 포함된 표준 군락구조표가 누락되었습니다.",
        suggestedFix: "표준 양식에 따른 <군락구조표>를 첨부하십시오.",
      });
    }
  }

  // (9) Flora (식물상)
  if (fieldId === "flora") {
    const hasSpecificFlora =
      spaceless.includes("특정식물") ||
      spaceless.includes("식물구계") ||
      spaceless.includes("구계학적") ||
      spaceless.includes("특정종") ||
      spaceless.includes("등급") ||
      spaceless.includes("멸종위기");

    if (!hasSpecificFlora) {
      discrepancies.push({
        id: `flora-spec-${Math.random().toString(36).substring(2, 7)}`,
        category: "STRUCTURE",
        severity: "CRITICAL",
        section: "식물구계학적 특정식물",
        title: "식물구계학적 특정식물종(Ⅰ~Ⅴ등급) 분포현황 누락",
        description: "환경부 지정 식물구계학적 특정식물종 등급(Ⅴ, Ⅳ, Ⅲ, Ⅱ, Ⅰ등급)별 출현 분류군 수 및 목록표(<표 2>)가 누락되었습니다.",
        suggestedFix: "식물구계학적 특정식물종 분포현황표(<표 2>)를 수록하십시오.",
      });
    }

    const hasInvasiveFlora =
      spaceless.includes("외래") ||
      spaceless.includes("생태계교란") ||
      spaceless.includes("귀화") ||
      spaceless.includes("침입") ||
      spaceless.includes("잠재침입") ||
      spaceless.includes("사전귀화");

    if (!hasInvasiveFlora) {
      discrepancies.push({
        id: `flora-inv-${Math.random().toString(36).substring(2, 7)}`,
        category: "STRUCTURE",
        severity: "WARNING",
        section: "외래종 및 생태계교란식물",
        title: "외래식물 4대 범주(사전귀화, 잠재침입, 침입외래, 교란식물) 분류 누락",
        description: "외래식물은 사전귀화식물, 잠재침입식물, 침입외래식물, 생태계교란식물로 세분하여 분석해야 합니다.",
        suggestedFix: "외래종 및 생태계교란야생식물 분포현황표(<표 5>)를 수록하십시오.",
      });
    }
  }

  // 5. Calculate Standard 100-Point Quality Score & Breakdown
  const structureScore = Math.max(0, 20 - missingSections * 5);
  const taxonomyScore = Math.max(0, 20 - taxonomyErrors * 4);
  const methodologyScore = Math.max(
    0,
    20 - discrepancies.filter((d) => d.category === "METHODOLOGY").length * 5
  );
  const statisticsScore = Math.max(
    0,
    20 - discrepancies.filter((d) => d.category === "STATISTICS").length * 6
  );
  const securityScore = Math.max(0, 20 - securityBreaches * 10);

  const totalScore = structureScore + taxonomyScore + methodologyScore + statisticsScore + securityScore;

  let verdict: "PASS" | "CONDITIONAL_PASS" | "REJECTED" = "REJECTED";
  let verdictReason = "";

  if (totalScore >= 90 && securityBreaches === 0) {
    verdict = "PASS";
    verdictReason = `국립생태원 ${field.name} 제6차 전국자연환경조사 표준 지침에 완벽히 부합하며, 총점 ${totalScore}점으로 대국민 생태정보 공개 및 아카이빙 승인 기준을 통과하였습니다.`;
  } else if (totalScore >= 75 && securityBreaches === 0) {
    verdict = "CONDITIONAL_PASS";
    verdictReason = `총점 ${totalScore}점으로 기본 요건은 충족하나, 지적된 ${discrepancies.length}건의 경미한 오류 및 학명 표기/서식 보완 후 최종 승인이 가능합니다.`;
  } else {
    verdict = "REJECTED";
    verdictReason = securityBreaches > 0
      ? `멸종위기 야생생물 초정밀 좌표 노출(${securityBreaches}건) 등 중대 보안 위반 및 필수 항목 미비로 인해 검수가 반려되었습니다.`
      : `총점 ${totalScore}점으로 표준 합격선(75점 이상)에 미달하여 보완 조치가 필요합니다. 지적사항 ${discrepancies.length}건을 확인하십시오.`;
  }

  const scoreObj: InspectionScore = {
    totalScore,
    verdict,
    verdictReason,
    breakdown: {
      structure: { score: structureScore, max: 20, label: "보고서 체제 및 필수서식" },
      taxonomy: { score: taxonomyScore, max: 20, label: "학명 및 분류체계" },
      protectionAndSecurity: { score: securityScore, max: 20, label: "법정보호종 및 보안" },
      methodology: { score: methodologyScore, max: 20, label: "조사방법론 및 노력량" },
      statistics: { score: statisticsScore, max: 20, label: "군집분석 및 통계수식" },
    },
  };

  // Region and Year extraction heuristics from title/content
  let surveyRegion = "전국 자연환경조사 권역 (함양/지리산/태백산)";
  if (normalizedText.includes("함양") || reportTitle.includes("함양")) surveyRegion = "경남 함양군 위천 유역";
  else if (normalizedText.includes("태백") || reportTitle.includes("태백")) surveyRegion = "강원 태백산 국립공원 권역";
  else if (normalizedText.includes("지리산") || reportTitle.includes("지리산")) surveyRegion = "경남 산청/하동 지리산 권역";
  else if (normalizedText.includes("낙동강") || reportTitle.includes("낙동강")) surveyRegion = "부산/경남 낙동강 하구 권역";
  else if (normalizedText.includes("충남") || reportTitle.includes("가야산")) surveyRegion = "충남 예산/서산 가야산 일대";

  let surveyYear = "2024년";
  const yearMatch = normalizedText.match(/202[0-9]년?/);
  if (yearMatch) surveyYear = yearMatch[0].includes("년") ? yearMatch[0] : `${yearMatch[0]}년`;

  return {
    id: Math.random().toString(36).substring(2, 9).toUpperCase(),
    fieldId,
    fieldName: field.name,
    reportTitle,
    authorOrOrg: "국립생태원 자연환경조사팀 / 전문조사원",
    surveyYear,
    surveyRegion,
    analyzedAt: new Date().toISOString(),
    fileInfo: {
      fileName,
      fileSize: `${Math.max(1, Math.round(rawText.length * 1.5 / 1024))} KB`,
      fileType: fileName.endsWith(".hwp") ? "한글(HWP)" : fileName.endsWith(".docx") ? "Word(DOCX)" : "텍스트(TXT)",
      wordCount: rawText.split(/\s+/).filter(Boolean).length,
      charCount: rawText.length,
    },
    score: scoreObj,
    discrepancies,
    detectedSpecies,
    protectedSpeciesCount,
    invasiveSpeciesCount,
    coordinateMaskingChecked: securityBreaches === 0,
    rawText,
  };
}
