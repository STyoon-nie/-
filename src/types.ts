export type FieldCategory =
  | "flora"
  | "vegetation"
  | "mammals"
  | "birds"
  | "herpetofauna"
  | "fish"
  | "insects"
  | "benthos"
  | "plankton_landscape";

export interface FieldDefinition {
  id: FieldCategory;
  name: string;
  englishName: string;
  iconName: string;
  badgeColor: string;
  description: string;
  standardGuidelineVersion: string;
  guidelineChapter?: string;
  legalBasis?: string;
  surveyScaleAndUnit?: string;
  officialDeliverables?: string[];
  methodologyHighlights?: {
    title: string;
    desc: string;
  }[];
  surveySeasons: string[];
  mandatorySections: string[];
  keyInspectionRules: string[];
  protectedSpeciesExamples: string[];
  sampleReports: {
    id: string;
    title: string;
    description: string;
    hasErrors: boolean;
    content: string;
  }[];
}

export type SeverityLevel = "CRITICAL" | "WARNING" | "RECOMMENDATION" | "PASS";

export interface DiscrepancyItem {
  id: string;
  category: "STRUCTURE" | "TAXONOMY" | "PROTECTED_SPECIES" | "METHODOLOGY" | "STATISTICS" | "SECURITY" | "INTERNAL_CONSISTENCY";
  severity: SeverityLevel;
  section: string;
  title: string;
  description: string;
  targetExcerpt?: string;
  suggestedFix?: string;
  fixed?: boolean;
  isSuspectedInconsistency?: boolean;
  inconsistencyType?: "MAP_SHEET" | "SPECIES_COUNT" | "PROTECTION_TIER" | "SURVEY_SCHEDULE" | "SURVEY_POINTS" | "DOMAIN_METRICS" | "GENERAL";
  conflictingPassages?: {
    locationA: string;
    textA: string;
    locationB: string;
    textB: string;
  };
}

export interface SpeciesRecord {
  koreanName: string;
  scientificName: string;
  family?: string;
  protectionClass?: "멸종위기 야생생물 I급" | "멸종위기 야생생물 II급" | "천연기념물" | "생태계교란생물" | "고유종" | "일반종";
  count?: number;
  location?: string;
  rawLine?: string;
  status: "VALID" | "SCIENTIFIC_NAME_ERROR" | "SYNONYM_DETECTED" | "PROTECTED_UNMASKED";
  note?: string;
}

export interface CriteriaBreakdownItem {
  score: number;
  max: number;
  label: string;
}

export interface TaxaBreakdown {
  families?: number;
  genera?: number;
  species?: number;
  subspecies?: number;
  varieties?: number;
  forms?: number;
  totalTaxa?: number;
  rawSummaryText?: string;
}

export interface InspectionScore {
  totalScore: number; // 0-100
  verdict: "PASS" | "CONDITIONAL_PASS" | "REJECTED";
  verdictReason: string;
  breakdown: {
    structure: CriteriaBreakdownItem;
    taxonomy: CriteriaBreakdownItem;
    protectionAndSecurity: CriteriaBreakdownItem;
    methodology: CriteriaBreakdownItem;
    statistics: CriteriaBreakdownItem;
  };
}

export interface AIReviewResult {
  summary: string;
  methodologyEvaluation: string;
  ecologicalRiskAssessment: string;
  discrepancies?: {
    type: "CRITICAL" | "WARNING" | "RECOMMENDATION";
    section: string;
    issue: string;
    solution: string;
  }[];
  recommendedActions: string[];
  logicScore: number;
}

export interface FieldCompatibility {
  isMatch: boolean;
  detectedFieldId: FieldCategory;
  detectedFieldName: string;
  selectedFieldId: FieldCategory;
  selectedFieldName: string;
  confidence: number; // 0 - 100
  reason: string;
  mismatchEvidence: string[];
}

export interface GeomorphologyElementRecord {
  id?: string;
  name: string; // e.g. "폭포/폭호 복합체", "기반암하상", "고립구릉", "토르군", "하도습지", "자연제방"
  code: string; // e.g. "FG02", "FG11", "MG05", "MG15", "FG01", "FG22", "FG17"
  category: "하천지형(FG)" | "산지지형(MG)" | "해안지형(CG)" | "화산지형(VG)" | "카르스트(KG)" | "구조지형(SG)" | "기타지형";
  conservationGrade: "Ⅰ등급" | "Ⅱ등급" | "Ⅲ등급" | "등급외";
  dimensions?: string; // e.g. "7×9×7m", "460×160×40m"
  coordinate?: string; // e.g. "35°30′ 46.17″ N, 127°41′ 37.54″ E"
  assessmentScore?: number; // 21.1점
  status: "VALID" | "WARNING";
  note?: string;
}

export interface VegetationCommunityRecord {
  id?: string;
  name: string; // e.g. "신갈나무-졸참나무군락", "소나무군락", "졸참나무-물오리나무군락", "굴참나무-졸참나무군락", "밤나무식재림"
  vegetationType: "산지낙엽활엽수림" | "산지침엽수림" | "조림기원식생" | "기타식생" | "아고산식생" | "수변/습지식생";
  dominantSpecies?: string;
  conservationGrade: "Ⅰ등급" | "Ⅱ등급" | "Ⅲ등급" | "Ⅳ등급" | "Ⅴ등급";
  areaKm2?: number; // e.g. 0.97
  communityCount?: number; // e.g. 14
  quadratSize?: string; // e.g. "225㎡(15×15m)"
  layerStructure?: string; // e.g. "T1 16~20m 90%, T2 6~8m 30%, S 2~2.5m 20%, H 0.5m 20%"
  status: "VALID" | "WARNING";
  note?: string;
}

export interface InspectionReportResult {
  id: string;
  fieldId: FieldCategory;
  fieldName: string;
  reportTitle: string;
  authorOrOrg: string;
  surveyYear: string;
  surveyRegion: string;
  analyzedAt: string;
  fileInfo: {
    fileName: string;
    fileSize: string;
    fileType: string;
    wordCount: number;
    charCount: number;
  };
  score: InspectionScore;
  discrepancies: DiscrepancyItem[];
  totalSpeciesCount: number;
  taxaBreakdown?: TaxaBreakdown;
  detectedSpecies: SpeciesRecord[];
  geomorphologyElements?: GeomorphologyElementRecord[];
  vegetationCommunities?: VegetationCommunityRecord[];
  protectedSpeciesCount: number;
  invasiveSpeciesCount: number;
  endemicSpeciesCount?: number;
  coordinateMaskingChecked: boolean;
  fieldCompatibility?: FieldCompatibility;
  suspectedInconsistenciesCount?: number;
  internalConsistencyStatus?: "VERIFIED" | "INCONSISTENCY_SUSPECTED" | "CRITICAL_CONTRADICTION";
  aiReview?: AIReviewResult;
  rawText: string;
}

export interface PublicArchivedReport {
  id: string;
  fieldId: FieldCategory;
  fieldName: string;
  title: string;
  region: string;
  year: string;
  verifiedAt: string;
  verificationBadge: "최우수 적합" | "표준 적합" | "보완 완료";
  speciesCount: number;
  endangeredCount: number;
  summary: string;
  gridResolution: string;
  downloadUrl?: string;
  officialMinistryUrl: string;
  ecoBankUrl: string;
  egisUrl?: string;
  surveyCode?: string;
  supervisingAgency?: string;
  fileFormat?: string;
  fileSize?: string;
}
