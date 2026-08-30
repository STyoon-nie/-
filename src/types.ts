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
  category: "STRUCTURE" | "TAXONOMY" | "PROTECTED_SPECIES" | "METHODOLOGY" | "STATISTICS" | "SECURITY";
  severity: SeverityLevel;
  section: string;
  title: string;
  description: string;
  targetExcerpt?: string;
  suggestedFix?: string;
  fixed?: boolean;
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
  detectedSpecies: SpeciesRecord[];
  protectedSpeciesCount: number;
  invasiveSpeciesCount: number;
  coordinateMaskingChecked: boolean;
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
