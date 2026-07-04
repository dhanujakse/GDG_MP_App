// ─────────────────────────────────────────────────────────────────────────────
// COMPLAINT TYPES — Civic Connect AI
// ─────────────────────────────────────────────────────────────────────────────

export type ComplaintStatus =
  | "submitted"
  | "ai_processing"
  | "in_progress"
  | "resolved"
  | "rejected"
  | "duplicate";

export type SeverityLevel = "critical" | "high" | "medium" | "low";

export type ComplaintCategory =
  | "water"
  | "sanitation"
  | "roads"
  | "electricity"
  | "drainage"
  | "healthcare"
  | "education"
  | "transport"
  | "other";

export type Department =
  | "water_board"
  | "sanitation"
  | "public_works"
  | "electricity_board"
  | "storm_water"
  | "health"
  | "education"
  | "transport"
  | "general";

export interface GeoLocation {
  lat: number;
  lng: number;
  address: string;
  ward: string;
  district: string;
  pincode?: string;
}

export interface ComplaintPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  uploadedAt: string;
  uploadedBy: string; // citizen ID
  aiDetectedObjects?: string[];
}

export interface AIImageAnalysis {
  detectedCategory: ComplaintCategory;
  detectedObjects: string[];
  confidence: number; // 0–1
  severity: SeverityLevel;
  rawLabels: string[];
  processingTimeMs: number;
  isValid?: boolean;
  validationMessage?: string;
}

export interface AIComplaintAnalysis {
  imageAnalysis?: AIImageAnalysis;
  detectedCategory: ComplaintCategory;
  suggestedDepartment: Department;
  severity: SeverityLevel;
  confidenceScore: number; // 0–1
  citizenSummary: string; // Simple, short (for citizen)
  mpSummary: string;      // Decision-ready (for MP/official), max 50 words
  governmentNote: string; // Internal note for officials
  suggestedAction: string;
  keyFacts: string[];
  aiReasoning: string;
  processingTimeMs: number;
}

export interface ImpactScore {
  total: number; // 0–100
  breakdown: {
    severity: number;
    citizensAffected: number;
    populationDensity: number;
    timeOpen: number;
    emergencyLevel: number;
    infrastructureImportance: number;
  };
  explanation: string;
}

export interface DuplicateMatch {
  complaintId: string;
  title: string;
  similarity: number; // 0–1
  distance: number; // metres
  citizensJoined: number;
}

export interface StatusUpdate {
  id: string;
  status: ComplaintStatus;
  message: string;
  updatedBy: string; // user ID or "system" | "ai"
  updatedAt: string;
  isPublic: boolean; // visible to citizen?
}

export interface WorkOrder {
  id: string;
  assignedDepartment: Department;
  assignedOfficerId?: string;
  estimatedCompletion?: string;
  requiredResources: string[];
  workDescription: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  shortId: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  severity: SeverityLevel;
  location: GeoLocation;
  photos: ComplaintPhoto[];
  citizensJoined: number;
  joinedCitizenIds: string[];
  reportedBy: string;
  reportedAt: string;
  updatedAt: string;
  closedAt?: string;
  aiAnalysis?: AIComplaintAnalysis;
  impactScore?: ImpactScore;
  duplicateMatches?: DuplicateMatch[];
  statusHistory: StatusUpdate[];
  workOrder?: WorkOrder;
  assignedDepartment?: Department;
  ward: string;
  district: string;
  isAnonymous: boolean;
}

// ─── Lightweight card variant for list views ────────────────────────────────
export interface ComplaintSummary {
  id: string;
  shortId: string;
  title: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  severity: SeverityLevel;
  ward: string;
  citizensJoined: number;
  impactScore: number;
  reportedAt: string;
  location: GeoLocation;
  mpSummary?: string;
  assignedDepartment?: Department;
}

// ─── For new complaint submission ────────────────────────────────────────────
export interface NewComplaintPayload {
  description: string;
  category?: ComplaintCategory; // optional — AI will detect if not set
  location: GeoLocation;
  photoFile?: File;
  audioBlob?: Blob;
  isAnonymous: boolean;
}
