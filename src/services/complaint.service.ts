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
    title: "No Drinking Water for 3 Days",
    description: "There has been no water supply in our area for the past 3 days. The main pipe on MG Road appears to have burst and nobody has come to repair it. Over 200 families are affected.",
    category: "water",
    status: "in_progress",
    severity: "critical",
    location: { lat: 9.9252, lng: 78.1198, address: "MG Road, KK Nagar", ward: "Ward 12", district: "Madurai", pincode: "625020" },
    photos: [],
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
    title: "Garbage Not Collected for 5 Days",
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
      mpSummary: "Critical sewage overflow on MG Road, Ward 8. 32 citizens affected. Health emergency risk: Storm Water Dept. immediate intervention required.",
      governmentNote: "Open sewage exposure. Waterborne disease risk. Field officer must visit same day.",
      suggestedAction: "Immediately assign Storm Water Department for emergency drain repair.",
      keyFacts: ["32 citizens joined this report", "Location: Ward 8", "Blocked storm drain", "Sewage backup health emergency"],
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
    title: "Street Lights Dead across Entire Block",
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
    
    // Seed rich data if current local storage only has basic seed data
    if (complaints.length < 20) {
      return initSeedDataLocal();
    }

    // Migrate legacy status values from localStorage
    let migrated = false;
    complaints.forEach((c) => {
      // Migrate legacy hyphenated titles to clean phrasing
      if (c.title.includes(" — ")) {
        c.title = c.title.replace("No Drinking Water — 3 Days", "No Drinking Water for 3 Days")
                         .replace("Garbage Not Collected — 5 Days", "Garbage Not Collected for 5 Days")
                         .replace("Street Lights Dead — Entire Block", "Street Lights Dead across Entire Block")
                         .replace(" — ", " ");
        migrated = true;
      }
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
  const seedList: Complaint[] = [ ...SEED_COMPLAINTS ];
  
  const targetCounts: Record<ComplaintCategory, number> = {
    water: 136,
    roads: 213,
    sanitation: 111,
    drainage: 85,
    electricity: 48,
    healthcare: 32,
    education: 18,
    transport: 22,
    other: 15
  };
  
  const categoryWards: Record<ComplaintCategory, { primary: string; primaryCount: number; secondary: string[] }> = {
    water: { primary: "Ward 12", primaryCount: 90, secondary: ["Ward 11", "Ward 14", "Ward 8", "Ward 3", "Ward 5"] },
    roads: { primary: "Ward 14", primaryCount: 120, secondary: ["Ward 12", "Ward 11", "Ward 8", "Ward 3", "Ward 5"] },
    drainage: { primary: "Ward 8", primaryCount: 55, secondary: ["Ward 12", "Ward 11", "Ward 14", "Ward 3", "Ward 5"] },
    sanitation: { primary: "Ward 11", primaryCount: 70, secondary: ["Ward 12", "Ward 14", "Ward 8", "Ward 3", "Ward 5"] },
    electricity: { primary: "Ward 14", primaryCount: 25, secondary: ["Ward 12", "Ward 11", "Ward 8", "Ward 3", "Ward 5"] },
    healthcare: { primary: "Ward 14", primaryCount: 20, secondary: ["Ward 12", "Ward 11", "Ward 8", "Ward 3", "Ward 5"] },
    education: { primary: "Ward 12", primaryCount: 8, secondary: ["Ward 11", "Ward 14", "Ward 8", "Ward 3", "Ward 5"] },
    transport: { primary: "Ward 11", primaryCount: 10, secondary: ["Ward 12", "Ward 14", "Ward 8", "Ward 3", "Ward 5"] },
    other: { primary: "Ward 3", primaryCount: 6, secondary: ["Ward 12", "Ward 11", "Ward 14", "Ward 8", "Ward 5"] }
  };
  
  const titlesAndDescs: Record<ComplaintCategory, { title: string; desc: string }[]> = {
    water: [
      { title: "No Drinking Water Supply", desc: "We have not received drinking water for the last 3 days. The municipal supply is completely dry." },
      { title: "Water Pipeline Leakage", desc: "Water is leaking from the main pipeline near the corner shop, wasting thousands of litres." },
      { title: "Low Water Pressure in Lines", desc: "The water pressure is so low that it doesn't reach the first floor." },
      { title: "Contaminated Drinking Water", desc: "The water coming out of the taps is yellow and smells bad." },
      { title: "Water Tanker Delay", desc: "The scheduled water tanker has not arrived today, causing high distress." }
    ],
    roads: [
      { title: "Dangerous Potholes on Main Road", desc: "There are large, deep potholes on the main road that are causing accidents daily." },
      { title: "Street Not Paved", desc: "The inner streets of our block have not been paved for years. It's a mud track during rains." },
      { title: "Speed Breaker Missing near School", desc: "Vehicles speed past the school gate. We need a speed breaker and signage immediately." },
      { title: "Water Logging on Road Corner", desc: "Heavy water accumulation on the main junction makes it impassable for pedestrians." },
      { title: "Road Construction Left Incomplete", desc: "Contractor dug up the road for laying cables and left it open for three weeks." }
    ],
    drainage: [
      { title: "Sewage Overflowing from Manhole", desc: "Sewer water is bubbling out of the manhole and flooding the entire street corner." },
      { title: "Blocked Storm Water Drain", desc: "The storm water drain is choked with plastic and garbage, causing water backup." },
      { title: "Stagnant Drain Water in Street", desc: "Open drain is clogged and stagnant water is breeding mosquitoes." },
      { title: "Broken Sewage Pipe Leakage", desc: "A domestic sewer pipe is broken and leaking waste into the open ground." },
      { title: "Bad Odour from Open Sewer", desc: "The stench from the uncleaned open drain is making it difficult to breathe." }
    ],
    electricity: [
      { title: "Street Lights Not Working", desc: "The entire block is in darkness because none of the street lights work." },
      { title: "Hanging Electrical Cables", desc: "Loose electrical wires are hanging low from the pole, risking lives of passersby." },
      { title: "Flickering Street Lamp", desc: "The street light keeps blinking and making buzzing noises." },
      { title: "Transformer Sparking Frequently", desc: "The local distribution transformer is overloading and sparking during peak hours." },
      { title: "Frequent Power Fluctuations", desc: "Constant voltage drops are damaging domestic electronic appliances." }
    ],
    sanitation: [
      { title: "Garbage Overflowing from Bins", desc: "Municipal trash bins are full and garbage is spilling onto the street." },
      { title: "No Waste Collection for 4 Days", desc: "The garbage collection vehicle has not visited our street for 4 days." },
      { title: "Illegal Garbage Dumping", desc: "People are dumping construction debris and commercial waste in the empty plot." },
      { title: "Dead Animal on Roadside", desc: "A stray animal has died and the body is rotting, creating a massive sanitation issue." },
      { title: "Public Toilet Unclean", desc: "The public toilet facility is extremely dirty and has no water running." }
    ],
    healthcare: [
      { title: "Staff Shortage at Health Center", desc: "No doctors are available at the primary health center during official hours." },
      { title: "Medicine Stock Exhausted at PHC", desc: "Basic medicines like paracetamol are out of stock at the municipal pharmacy." },
      { title: "Long Waiting Times at Clinic", desc: "Patients have to wait for over 3 hours just for a routine checkup." },
      { title: "Cleanliness Issues in Ward", desc: "The floors of the clinic are not swept and bio-waste bins are open." }
    ],
    education: [
      { title: "Broken Benches in Classroom", desc: "Benches and desks in the local school classroom are broken and unusable." },
      { title: "Drinking Water Facility Broken", desc: "The water cooler in the government school is broken and students have no drinking water." },
      { title: "Leaking Roof in School Building", desc: "During rains, the roof of the classroom leaks water, disrupting classes." },
      { title: "No Play Area Equipment", desc: "The children's play area has broken swings and is full of weeds." }
    ],
    transport: [
      { title: "No Bus Shelter at Bus Stop", desc: "There is no shelter or seating at the bus stop, forcing commuters to stand in the sun/rain." },
      { title: "Bus Route Frequency Reduced", desc: "The frequency of local buses connecting to the center has been reduced." },
      { title: "Encroached Footpath at Transit", desc: "Footpaths near the transit hub are heavily encroached by illegal vendors." },
      { title: "Street Signs Missing at Junction", desc: "Important street name and direction signs are missing at the main transit junction." }
    ],
    other: [
      { title: "Park Benches Broken", desc: "The benches in the local public park are broken and need replacement." },
      { title: "Stray Dog Menace", desc: "Stray dogs are attacking children and pedestrians in the evening." },
      { title: "Noise Pollution from Commercial Zone", desc: "Commercial shops are running loud machinery late at night in residential areas." }
    ]
  };

  const categories = Object.keys(targetCounts) as ComplaintCategory[];
  let countCreated = 0;
  
  categories.forEach((cat) => {
    const totalToGen = targetCounts[cat];
    const distribution = categoryWards[cat];
    const templates = titlesAndDescs[cat];
    
    for (let i = 0; i < totalToGen; i++) {
      countCreated++;
      let ward = "";
      if (i < distribution.primaryCount) {
        ward = distribution.primary;
      } else {
        const secIndex = (i - distribution.primaryCount) % distribution.secondary.length;
        ward = distribution.secondary[secIndex];
      }
      
      const templateIndex = (i + countCreated) % templates.length;
      const template = templates[templateIndex];
      const id = `cmp_gen_${cat}_${i}_${Math.random().toString(36).slice(2, 6)}`;
      const shortId = `JV-${1000 + countCreated}`;
      
      let joinedCount = (countCreated * 31 + i * 17) % 35;
      if (cat === "roads") joinedCount = 45 + (i % 25);
      else if (cat === "water") joinedCount = 30 + (i % 20);
      
      const minutesAgo = countCreated * 45;
      const reportedDate = new Date(Date.now() - minutesAgo * 60 * 1000);
      const reportedAt = reportedDate.toISOString();
      const updatedAt = new Date(reportedDate.getTime() + 60 * 60 * 1000).toISOString();
      
      let severity: SeverityLevel = "medium";
      if (i % 8 === 0) severity = "critical";
      else if (i % 4 === 0) severity = "high";
      else if (i % 3 === 0) severity = "low";
      
      const hasPhoto = i % 10 === 0; 
      const photos = hasPhoto ? [{
        id: `ph_${id}`,
        url: `https://images.unsplash.com/photo-${1500000000000 + i}?auto=format&fit=crop&w=400&h=300&q=80`,
        thumbnailUrl: `https://images.unsplash.com/photo-${1500000000000 + i}?auto=format&fit=crop&w=100&h=100&q=80`,
        uploadedAt: reportedAt,
        uploadedBy: `ctz_gen_${i}`
      }] : [];

      const tempComplaint: Complaint = {
        id,
        shortId,
        title: `${template.title} in ${ward}`,
        description: template.desc,
        category: cat,
        status: i % 5 === 0 ? "in_progress" : "submitted",
        severity,
        location: {
          lat: 9.9252 + (countCreated % 50) * 0.0005 * (countCreated % 2 === 0 ? 1 : -1),
          lng: 78.1198 + (countCreated % 50) * 0.0005 * (countCreated % 2 === 0 ? -1 : 1),
          ward,
          address: `${ward} Residential Colony`,
          district: "Madurai"
        },
        photos,
        citizensJoined: joinedCount,
        joinedCitizenIds: [],
        reportedBy: `ctz_gen_${i}`,
        reportedAt,
        updatedAt,
        statusHistory: [
          { id: `su_gen_${id}_1`, status: "submitted", message: "Complaint logged via mobile app.", updatedBy: "system", updatedAt: reportedAt, isPublic: true },
        ],
        ward,
        district: "Madurai",
        isAnonymous: i % 6 === 0,
      };

      const suggestedDeptMap: Record<ComplaintCategory, Department> = {
        water: "water_board",
        sanitation: "sanitation",
        roads: "public_works",
        electricity: "electricity_board",
        drainage: "storm_water",
        healthcare: "health",
        education: "education",
        transport: "transport",
        other: "general"
      };

      tempComplaint.aiAnalysis = {
        detectedCategory: cat,
        suggestedDepartment: suggestedDeptMap[cat] ?? "general",
        severity,
        confidenceScore: hasPhoto ? 0.92 : 0.65,
        citizenSummary: `AI generated ticket summary for ${template.title} in ${ward}.`,
        mpSummary: `AI Summary: ${template.title} reported in ${ward}. ${joinedCount + 1} citizens affected. Service disruption verified.`,
        governmentNote: "Field inspection suggested.",
        suggestedAction: "Forward to department.",
        keyFacts: [`${joinedCount + 1} citizens joined`, `Location: ${ward}`, `Category: ${cat}`],
        aiReasoning: hasPhoto ? "Image analysis and keywords confirmed the grievance." : "Keyword match only. No visual evidence.",
        processingTimeMs: 800
      };

      seedList.push(tempComplaint);
    }
  });

  saveComplaintsLocal(seedList);
  return seedList;
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
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("complaints_updated"));
  }
}

function initSeedData(): Complaint[] {
  saveComplaints(SEED_COMPLAINTS);
  return SEED_COMPLAINTS;
}

function generateId(): string {
  return `cmp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function calculateDynamicImpactScore(c: Complaint): {
  total: number;
  breakdown: {
    severityScore: number;
    supportScore: number;
    duplicateScore: number;
    trendScore: number;
    ageScore: number;
    details: string[];
  };
} {
  let severityScore = 20;
  if (c.severity === "critical") severityScore = 100;
  else if (c.severity === "high") severityScore = 75;
  else if (c.severity === "medium") severityScore = 45;
  else if (c.severity === "low") severityScore = 20;

  const supportScore = Math.min((c.citizensJoined + 1) * 4, 100);

  const complaints = complaintsCache && complaintsCache.length > 0 ? complaintsCache : SEED_COMPLAINTS;
  const duplicateCount = complaints.filter(
    (x) => x.category === c.category && x.ward === c.ward && x.id !== c.id
  ).length;
  const duplicateScore = Math.min(duplicateCount * 25, 100);

  const trendScore = c.citizensJoined > 12 ? 100 : c.citizensJoined > 6 ? 60 : 30;

  const ageMs = Date.now() - new Date(c.reportedAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  let ageScore = 10;
  if (ageHours < 6) ageScore = 100;
  else if (ageHours < 24) ageScore = 80;
  else if (ageHours < 72) ageScore = 50;
  else if (ageHours < 168) ageScore = 30;

  let total = Math.round(
    severityScore * 0.3 +
    supportScore * 0.25 +
    duplicateScore * 0.2 +
    trendScore * 0.15 +
    ageScore * 0.1
  );

  const hasImage = c.photos && c.photos.length > 0;
  if (!hasImage) {
    const justified = c.citizensJoined >= 15 || duplicateCount >= 2;
    if (!justified) {
      total = Math.min(total, 55);
    }
  }

  return {
    total,
    breakdown: {
      severityScore,
      supportScore,
      duplicateScore,
      trendScore,
      ageScore,
      details: [
        `${c.severity.toUpperCase()} Severity (${severityScore}/100)`,
        `${c.citizensJoined + 1} Supporting Citizens (${supportScore}/100)`,
        `${duplicateCount} Similar Reports (${duplicateScore}/100)`,
        c.citizensJoined > 12 ? `Rapidly Increasing Trend (${trendScore}/100)` : `Stable Trend (${trendScore}/100)`,
        ageHours < 24 ? `Submitted within 24h (${ageScore}/100)` : `Submitted ${Math.round(ageHours / 24)}d ago (${ageScore}/100)`
      ]
    }
  };
}

function generateShortId(): string {
  return `JV-${Math.floor(Math.random() * 9000 + 1000)}`;
}

function toSummary(c: Complaint): ComplaintSummary {
  const dynamicScore = calculateDynamicImpactScore(c).total;
  return {
    id: c.id,
    shortId: c.shortId,
    title: c.title,
    category: c.category,
    status: c.status,
    severity: c.severity,
    ward: c.ward,
    citizensJoined: c.citizensJoined,
    impactScore: dynamicScore,
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
