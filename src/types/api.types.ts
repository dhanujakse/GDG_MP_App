// ─────────────────────────────────────────────────────────────────────────────
// API TYPES — Civic Connect AI
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
}

export interface ResponseMeta {
  requestId: string;
  timestamp: string;
  processingTimeMs: number;
}

// ─── AI Pipeline Step ─────────────────────────────────────────────────────────
export type AIPipelineStep =
  | "image_received"
  | "ocr_scan"
  | "vision_analysis"
  | "speech_transcription"
  | "text_cleaning"
  | "translation"
  | "category_detection"
  | "duplicate_detection"
  | "geo_clustering"
  | "severity_detection"
  | "department_prediction"
  | "impact_score"
  | "citizen_summary"
  | "mp_summary"
  | "suggested_resolution"
  | "complete";

export type AIPipelineStepStatus = "pending" | "processing" | "done" | "error";

export interface AIPipelineStepResult {
  step: AIPipelineStep;
  label: string;
  status: AIPipelineStepStatus;
  result?: string;
  icon: string;
  durationMs?: number;
}

// ─── Filter & Sort options for complaint lists ─────────────────────────────────
export interface ComplaintFilters {
  category?: string;
  status?: string;
  severity?: string;
  ward?: string;
  department?: string;
  dateRange?: { from: string; to: string };
  search?: string;
}

export type ComplaintSortField = "impactScore" | "citizensJoined" | "reportedAt" | "severity";
export type SortOrder = "asc" | "desc";

export interface ComplaintSort {
  field: ComplaintSortField;
  order: SortOrder;
}
