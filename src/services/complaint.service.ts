// ─────────────────────────────────────────────────────────────────────────────
// COMPLAINT SERVICE — Civic Connect AI
//
// In-memory + localStorage persistence layer.
// Interface matches what a real REST backend would expose.
// Swap `storage.*` calls for `fetch("/api/complaints/...")` to go live.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Complaint,
  ComplaintSummary,
  NewComplaintPayload,
  ComplaintStatus,
  ComplaintCategory,
  SeverityLevel,
  Department,
  GeoLocation,
  AIComplaintAnalysis,
  ImpactScore,
} from "@/types";
import { db, isFirebaseConfigured } from "./firebase";
import { collection, onSnapshot, doc, setDoc, updateDoc } from "firebase/firestore";

const STORAGE_KEY = "civic_connect_complaints";

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_COMPLAINTS: Complaint[] = [
  {
    id: "cmp_001",
    shortId: "CHN-2024-0712",
    title: "No Drinking Water — 3 Days",
    description: "There has been no water supply in our area for the past 3 days. The main pipe on MG Road appears to have burst and nobody has come to repair it. Over 200 families are affected.",
    category: "water",
    status: "in_progress",
    severity: "critical",
    location: { lat: 9.9252, lng: 78.1198, address: "MG Road, KK Nagar", ward: "Ward 12", district: "Madurai", pincode: "625020" },
    photos: [{ id: "ph_001", url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", thumbnailUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200", uploadedAt: "2024-07-01T08:00:00Z", uploadedBy: "ctz_seed_001" }],
    citizensJoined: 23,
    joinedCitizenIds: [],
    reportedBy: "ctz_seed_001",
    reportedAt: "2024-07-01T08:00:00Z",
    updatedAt: "2024-07-02T10:30:00Z",
    aiAnalysis: {
      detectedCategory: "water",
      suggestedDepartment: "water_board",
      severity: "critical",
      confidenceScore: 0.94,
      citizenSummary: "Your water supply complaint has been registered. The Water Board has been notified and will respond within 24 hours.",
      mpSummary: "Critical water supply failure. 24 citizens affected in Ward 12. Burst pipeline likely — Water Board emergency crew needed within 24h.",
      governmentNote: "AI classified as critical infrastructure failure. Field verification recommended before issuing work order.",
      suggestedAction: "Immediately assign Water Board emergency crew for on-site inspection and resolution.",
      keyFacts: ["24 citizens have joined this report", "Location: Ward 12", "No water supply for 3+ days", "Essential service disruption", "Health risk increasing"],
      aiReasoning: "Category inferred from visual analysis. Severity set to critical based on essential service disruption.",
      processingTimeMs: 1234,
    },
    impactScore: { total: 94, breakdown: { severity: 40, citizensAffected: 20, timeOpen: 15, emergencyLevel: 15, infrastructureImportance: 10, populationDensity: 5 }, explanation: "Score 94/100. Critical severity (+40), 24 citizens joined (+20), open 72h (+15). Immediate action required." },
    statusHistory: [
      { id: "su_001", status: "submitted", message: "Complaint received and logged.", updatedBy: "system", updatedAt: "2024-07-01T08:00:00Z", isPublic: true },
      { id: "su_002", status: "ai_processing", message: "AI is analysing your complaint.", updatedBy: "ai", updatedAt: "2024-07-01T08:00:10Z", isPublic: true },
      { id: "su_003", status: "in_progress", message: "Forwarded to Water Board.", updatedBy: "mp_001", updatedAt: "2024-07-01T09:30:00Z", isPublic: true },
      { id: "su_004", status: "in_progress", message: "Water Board team dispatched.", updatedBy: "dept_001", updatedAt: "2024-07-02T10:30:00Z", isPublic: true },
    ],
    assignedDepartment: "water_board",
    ward: "Ward 12",
    district: "Madurai",
    isAnonymous: false,
  },
  {
    id: "cmp_002",
    shortId: "CHN-2024-0645",
    title: "Garbage Not Collected — 5 Days",
    description: "Garbage bins are overflowing and have not been collected for 5 days. The smell is unbearable and is a health hazard for the residents.",
    category: "sanitation",
    status: "in_progress",
    severity: "high",
    location: { lat: 9.9185, lng: 78.1120, address: "Gandhi Nagar, Ward 11", ward: "Ward 11", district: "Madurai" },
    photos: [],
    citizensJoined: 15,
    joinedCitizenIds: [],
    reportedBy: "ctz_002",
    reportedAt: "2024-06-29T07:00:00Z",
    updatedAt: "2024-06-30T11:00:00Z",
    aiAnalysis: {
      detectedCategory: "sanitation",
      suggestedDepartment: "sanitation",
      severity: "high",
      confidenceScore: 0.88,
      citizenSummary: "Garbage collection complaint filed. Sanitation team will clear the area within 48 hours.",
      mpSummary: "Sanitation breakdown in Ward 11. 16 households affected. Garbage uncollected for 5+ days. Health risk escalating — assign dedicated truck.",
      governmentNote: "Recurring sanitation failure. Check if route schedule was disrupted.",
      suggestedAction: "Assign Sanitation team for clearance within 24h.",
      keyFacts: ["16 citizens joined this report", "Location: Ward 11", "Garbage uncollected for 5+ days", "Public health hazard"],
      aiReasoning: "Text analysis identified sanitation keywords. High severity due to health risk.",
      processingTimeMs: 980,
    },
    impactScore: { total: 78, breakdown: { severity: 28, citizensAffected: 16, timeOpen: 12, emergencyLevel: 10, infrastructureImportance: 5, populationDensity: 5 }, explanation: "Score 78/100. High severity (+28), 16 citizens joined (+16). High priority." },
    statusHistory: [
      { id: "su_005", status: "submitted", message: "Complaint received.", updatedBy: "system", updatedAt: "2024-06-29T07:00:00Z", isPublic: true },
      { id: "su_006", status: "in_progress", message: "Forwarded to Sanitation Dept.", updatedBy: "mp_001", updatedAt: "2024-06-30T11:00:00Z", isPublic: true },
    ],
    assignedDepartment: "sanitation",
    ward: "Ward 11",
    district: "Madurai",
    isAnonymous: false,
  },
  {
    id: "cmp_003",
    shortId: "JV-0001",
    title: "Pothole on Main Road",
    description: "Large pothole on the main road near the school. Two accidents have already happened.",
    category: "roads",
    status: "submitted",
    severity: "high",
    location: { lat: 9.9300, lng: 78.1250, address: "School Road, Ward 14", ward: "Ward 14", district: "Madurai" },
    photos: [],
    citizensJoined: 8,
    joinedCitizenIds: [],
    reportedBy: "ctz_seed_001",
    reportedAt: "2024-06-28T15:00:00Z",
    updatedAt: "2024-06-28T15:00:00Z",
    statusHistory: [
      { id: "su_007", status: "submitted", message: "Complaint received.", updatedBy: "system", updatedAt: "2024-06-28T15:00:00Z", isPublic: true },
    ],
    ward: "Ward 14",
    district: "Madurai",
    isAnonymous: false,
  },
  {
    id: "cmp_004",
    shortId: "CHN-2024-0893",
    title: "Open Sewage on MG Road",
    description: "Open sewage is flowing on MG Road near the bus stop. It is a serious health hazard.",
    category: "drainage",
    status: "submitted",
    severity: "critical",
    location: { lat: 9.9260, lng: 78.1300, address: "MG Road, Ward 8", ward: "Ward 8", district: "Madurai" },
    photos: [],
    citizensJoined: 31,
    joinedCitizenIds: [],
    reportedBy: "ctz_003",
    reportedAt: "2024-07-03T09:00:00Z",
    updatedAt: "2024-07-03T09:30:00Z",
    aiAnalysis: {
      detectedCategory: "drainage",
      suggestedDepartment: "storm_water",
      severity: "critical",
      confidenceScore: 0.91,
      citizenSummary: "Drainage blockage complaint has been registered. Storm Water Department will inspect within 48 hours.",
      mpSummary: "Critical sewage overflow on MG Road, Ward 8. 32 citizens affected. Health emergency risk — Storm Water Dept. immediate intervention required.",
      governmentNote: "Open sewage exposure. Waterborne disease risk. Field officer must visit same day.",
      suggestedAction: "Immediately assign Storm Water Department for emergency drain repair.",
      keyFacts: ["32 citizens joined this report", "Location: Ward 8", "Blocked storm drain", "Sewage backup — health emergency"],
      aiReasoning: "Critical severity due to public health emergency risk from open sewage exposure.",
      processingTimeMs: 1100,
    },
    impactScore: { total: 87, breakdown: { severity: 40, citizensAffected: 20, timeOpen: 8, emergencyLevel: 15, infrastructureImportance: 10, populationDensity: 5 }, explanation: "Score 87/100. Critical severity, 32 citizens affected. Immediate action required." },
    statusHistory: [
      { id: "su_008", status: "submitted", message: "Complaint received.", updatedBy: "system", updatedAt: "2024-07-03T09:00:00Z", isPublic: true },
      { id: "su_009", status: "submitted", message: "Under review.", updatedBy: "ai", updatedAt: "2024-07-03T09:30:00Z", isPublic: false },
    ],
    ward: "Ward 8",
    district: "Madurai",
    isAnonymous: false,
  },
  {
    id: "cmp_005",
    shortId: "JV-0002",
    title: "Street Lights Dead — Entire Block",
    description: "All street lights on Anna Nagar Main Street have been non-functional for a week.",
    category: "electricity",
    status: "in_progress",
    severity: "high",
    location: { lat: 9.9150, lng: 78.1080, address: "Anna Nagar, Ward 14", ward: "Ward 14", district: "Madurai" },
    photos: [],
    citizensJoined: 8,
    joinedCitizenIds: [],
    reportedBy: "ctz_seed_001",
    reportedAt: "2024-07-02T20:00:00Z",
    updatedAt: "2024-07-03T08:00:00Z",
    impactScore: { total: 71, breakdown: { severity: 28, citizensAffected: 8, timeOpen: 10, emergencyLevel: 10, infrastructureImportance: 10, populationDensity: 5 }, explanation: "Score 71/100. High severity, 9 citizens affected. High priority." },
    statusHistory: [
      { id: "su_010", status: "submitted", message: "Complaint received.", updatedBy: "system", updatedAt: "2024-07-02T20:00:00Z", isPublic: true },
      { id: "su_011", status: "in_progress", message: "Forwarded to Electricity Board.", updatedBy: "mp_001", updatedAt: "2024-07-03T08:00:00Z", isPublic: true },
    ],
    assignedDepartment: "electricity_board",
    ward: "Ward 14",
    district: "Madurai",
    isAnonymous: false,
  },
];

// ─── Storage helpers ──────────────────────────────────────────────────────────

let cacheInitialized = false;
let complaintsCache: Complaint[] = [];

function loadComplaintsLocal(): Complaint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initSeedDataLocal();
    const complaints = JSON.parse(raw) as Complaint[];
    
    // Migrate legacy status values from localStorage
    let migrated = false;
    complaints.forEach((c) => {
      if ((c.status as string) === "pending_review") {
        c.status = "submitted";
        migrated = true;
      } else if ((c.status as string) === "assigned") {
        c.status = "in_progress";
        migrated = true;
      }
      if (c.statusHistory) {
        c.statusHistory.forEach((sh) => {
          if ((sh.status as string) === "pending_review") {
            sh.status = "submitted";
            migrated = true;
          } else if ((sh.status as string) === "assigned") {
            sh.status = "in_progress";
            migrated = true;
          }
        });
      }
    });
    
    if (migrated) {
      saveComplaintsLocal(complaints);
    }
    
    return complaints;
  } catch {
    return initSeedDataLocal();
  }
}

function saveComplaintsLocal(complaints: Complaint[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
}

function initSeedDataLocal(): Complaint[] {
  saveComplaintsLocal(SEED_COMPLAINTS);
  return SEED_COMPLAINTS;
}

function setupFirestoreListener() {
  if (isFirebaseConfigured && db) {
    try {
      const complaintsCol = collection(db, "complaints");
      onSnapshot(complaintsCol, (snapshot) => {
        const remoteComplaints: Complaint[] = [];
        snapshot.forEach((docSnapshot) => {
          remoteComplaints.push(docSnapshot.data() as Complaint);
        });

        if (remoteComplaints.length === 0) {
          console.log("Firestore complaints empty, seeding from local data...");
          const currentLocal = loadComplaintsLocal();
          currentLocal.forEach((c) => {
            setDoc(doc(db!, "complaints", c.id), c)
              .catch((err) => console.error("Error seeding Firestore doc:", err));
          });
        } else {
          // Sort remote complaints by reportedAt descending
          remoteComplaints.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
          complaintsCache = remoteComplaints;
          saveComplaintsLocal(remoteComplaints);
          window.dispatchEvent(new Event("complaints_updated"));
        }
      });
    } catch (err) {
      console.error("Failed to setup Firestore listener:", err);
    }
  }
}

function loadComplaints(): Complaint[] {
  if (!cacheInitialized) {
    complaintsCache = loadComplaintsLocal();
    cacheInitialized = true;
    setupFirestoreListener();
  }
  return complaintsCache;
}

function saveComplaints(complaints: Complaint[]): void {
  complaintsCache = complaints;
  saveComplaintsLocal(complaints);
}

function initSeedData(): Complaint[] {
  saveComplaints(SEED_COMPLAINTS);
  return SEED_COMPLAINTS;
}

function generateId(): string {
  return `cmp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function generateShortId(): string {
  return `JV-${Math.floor(Math.random() * 9000 + 1000)}`;
}

function toSummary(c: Complaint): ComplaintSummary {
  return {
    id: c.id,
    shortId: c.shortId,
    title: c.title,
    category: c.category,
    status: c.status,
    severity: c.severity,
    ward: c.ward,
    citizensJoined: c.citizensJoined,
    impactScore: c.impactScore?.total ?? 0,
    reportedAt: c.reportedAt,
    location: c.location,
    mpSummary: c.aiAnalysis?.mpSummary,
    assignedDepartment: c.assignedDepartment,
  };
}

// ─── Public API ────────────────────────────────────────────────────────────────

export const complaintService = {
  /** Get all complaints (returns lightweight summaries for list views) */
  getAll(): ComplaintSummary[] {
    return loadComplaints().map(toSummary);
  },

  /** Get full complaint detail by ID or shortId */
  getById(id: string): Complaint | null {
    const complaints = loadComplaints();
    return complaints.find((c) => c.id === id || c.shortId === id) ?? null;
  },

  /** Get complaints for the current citizen */
  getMyCitizenComplaints(citizenId: string): ComplaintSummary[] {
    return loadComplaints()
      .filter((c) => c.reportedBy === citizenId || c.joinedCitizenIds.includes(citizenId))
      .map(toSummary)
      .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
  },

  /** Get priority-sorted list for MP dashboard */
  getPriorityList(): ComplaintSummary[] {
    return loadComplaints()
      .map(toSummary)
      .filter((c) => c.status !== "resolved" && c.status !== "rejected")
      .sort((a, b) => b.impactScore - a.impactScore);
  },

  /** Create a new complaint (before AI analysis) */
  create(payload: {
    description: string;
    category?: ComplaintCategory;
    location: GeoLocation;
    citizenId: string;
    isAnonymous?: boolean;
    photoUrl?: string;
  }): Complaint {
    const complaints = loadComplaints();
    const now = new Date().toISOString();
    const complaint: Complaint = {
      id: generateId(),
      shortId: generateShortId(),
      title: payload.category
        ? `${payload.category.charAt(0).toUpperCase() + payload.category.slice(1)} Issue — ${payload.location.ward}`
        : `Complaint — ${payload.location.ward}`,
      description: payload.description,
      category: payload.category ?? "other",
      status: "ai_processing",
      severity: "medium",
      location: payload.location,
      photos: payload.photoUrl ? [{
        id: `ph_${Date.now()}`,
        url: payload.photoUrl,
        thumbnailUrl: payload.photoUrl,
        uploadedAt: now,
        uploadedBy: payload.citizenId
      }] : [],
      citizensJoined: 0,
      joinedCitizenIds: [],
      reportedBy: payload.citizenId,
      reportedAt: now,
      updatedAt: now,
      statusHistory: [
        { id: `su_${Date.now()}`, status: "submitted", message: "Complaint received and logged.", updatedBy: "system", updatedAt: now, isPublic: true },
      ],
      ward: payload.location.ward,
      district: payload.location.district,
      isAnonymous: payload.isAnonymous ?? false,
    };
    complaints.unshift(complaint);
    saveComplaints(complaints);
    if (isFirebaseConfigured && db) {
      setDoc(doc(db, "complaints", complaint.id), complaint)
        .catch(err => console.error("Error saving new complaint to Firestore:", err));
    }
    return complaint;
  },

  /** Apply AI analysis results to a complaint */
  applyAIAnalysis(id: string, analysis: AIComplaintAnalysis, impactScore: ImpactScore): Complaint | null {
    const complaints = loadComplaints();
    const idx = complaints.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    complaints[idx] = {
      ...complaints[idx],
      aiAnalysis: analysis,
      impactScore,
      category: analysis.detectedCategory,
      severity: analysis.severity,
      assignedDepartment: analysis.suggestedDepartment,
      status: "submitted",
      title: `${analysis.detectedCategory.charAt(0).toUpperCase() + analysis.detectedCategory.slice(1)} Issue — ${complaints[idx].ward}`,
      updatedAt: now,
      statusHistory: [
        ...complaints[idx].statusHistory,
        { id: `su_${Date.now()}`, status: "submitted", message: "AI analysis complete. Under review.", updatedBy: "ai", updatedAt: now, isPublic: true },
      ],
    };
    saveComplaints(complaints);
    if (isFirebaseConfigured && db) {
      setDoc(doc(db, "complaints", id), complaints[idx])
        .catch(err => console.error("Error saving AI analysis to Firestore:", err));
    }
    return complaints[idx];
  },

  /** Join an existing complaint */
  joinComplaint(complaintId: string, citizenId: string): Complaint | null {
    const complaints = loadComplaints();
    const idx = complaints.findIndex((c) => c.id === complaintId || c.shortId === complaintId);
    if (idx === -1) return null;
    if (complaints[idx].joinedCitizenIds.includes(citizenId)) return complaints[idx];
    complaints[idx].joinedCitizenIds.push(citizenId);
    complaints[idx].citizensJoined += 1;
    complaints[idx].updatedAt = new Date().toISOString();
    saveComplaints(complaints);
    if (isFirebaseConfigured && db) {
      updateDoc(doc(db, "complaints", complaints[idx].id), {
        joinedCitizenIds: complaints[idx].joinedCitizenIds,
        citizensJoined: complaints[idx].citizensJoined,
        updatedAt: complaints[idx].updatedAt
      }).catch(err => console.error("Error joining complaint in Firestore:", err));
    }
    return complaints[idx];
  },

  /** Update complaint status (by MP or department) */
  updateStatus(id: string, status: ComplaintStatus, message: string, updatedBy: string): Complaint | null {
    const complaints = loadComplaints();
    const idx = complaints.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    complaints[idx].status = status;
    complaints[idx].updatedAt = now;
    if (status === "resolved") complaints[idx].closedAt = now;
    complaints[idx].statusHistory.push({
      id: `su_${Date.now()}`,
      status,
      message,
      updatedBy,
      updatedAt: now,
      isPublic: true,
    });
    saveComplaints(complaints);
    if (isFirebaseConfigured && db) {
      updateDoc(doc(db, "complaints", id), {
        status: complaints[idx].status,
        updatedAt: complaints[idx].updatedAt,
        closedAt: complaints[idx].closedAt || null,
        statusHistory: complaints[idx].statusHistory
      }).catch(err => console.error("Error updating status in Firestore:", err));
    }
    return complaints[idx];
  },

  /** Assign a department to a complaint */
  assignDepartment(id: string, department: Department, mpId: string): Complaint | null {
    const complaints = loadComplaints();
    const idx = complaints.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    complaints[idx].assignedDepartment = department;
    complaints[idx].status = "in_progress";
    complaints[idx].updatedAt = now;
    complaints[idx].statusHistory.push({
      id: `su_${Date.now()}`,
      status: "in_progress",
      message: `Forwarded to ${department.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}.`,
      updatedBy: mpId,
      updatedAt: now,
      isPublic: true,
    });
    saveComplaints(complaints);
    if (isFirebaseConfigured && db) {
      updateDoc(doc(db, "complaints", id), {
        assignedDepartment: complaints[idx].assignedDepartment,
        status: complaints[idx].status,
        updatedAt: complaints[idx].updatedAt,
        statusHistory: complaints[idx].statusHistory
      }).catch(err => console.error("Error assigning department in Firestore:", err));
    }
    return complaints[idx];
  },

  /** Get dashboard statistics for MP */
  getDashboardStats(): {
    total: number;
    critical: number;
    resolved: number;
    pending: number;
    inProgress: number;
    byCategory: Record<string, number>;
    avgResolutionHours: number;
  } {
    const all = loadComplaints();
    const byCategory: Record<string, number> = {};
    all.forEach((c) => {
      byCategory[c.category] = (byCategory[c.category] ?? 0) + 1;
    });
    return {
      total: all.length,
      critical: all.filter((c) => c.severity === "critical" && c.status !== "resolved").length,
      resolved: all.filter((c) => c.status === "resolved").length,
      pending: all.filter((c) => c.status === "submitted").length,
      inProgress: all.filter((c) => c.status === "in_progress").length,
      byCategory,
      avgResolutionHours: 36,
    };
  },

  /** Reset to seed data (dev utility) */
  reset(): void {
    initSeedData();
    if (isFirebaseConfigured && db) {
      SEED_COMPLAINTS.forEach(c => {
        setDoc(doc(db!, "complaints", c.id), c)
          .catch(err => console.error("Error seeding Firestore on reset:", err));
      });
    }
  },
};
