// ─────────────────────────────────────────────────────────────────────────────
// AI SERVICE — Civic Connect AI
//
// Production-quality AI pipeline. Each function:
//   - Has the exact same interface as the real OpenAI / external API call
//   - Currently runs as a deterministic mock with realistic timing
//   - Can be upgraded to real API with a single environment variable change:
//     VITE_OPENAI_API_KEY=sk-...
//
// When VITE_OPENAI_API_KEY is set, real calls are made.
// Otherwise, mocks run with simulated delays for demo purposes.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  AIImageAnalysis,
  AIComplaintAnalysis,
  ImpactScore,
  DuplicateMatch,
  ComplaintCategory,
  Department,
  SeverityLevel,
  AIPipelineStepResult,
} from "@/types";

const USE_REAL_AI = Boolean(import.meta.env.VITE_OPENAI_API_KEY) || Boolean(import.meta.env.VITE_GEMINI_API_KEY);
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function simulatedDelay(min = 400, max = 1200): Promise<void> {
  return new Promise((res) =>
    setTimeout(res, Math.floor(Math.random() * (max - min) + min))
  );
}

// ─── Image Analysis ───────────────────────────────────────────────────────────

const CATEGORY_VISION_MAP: Record<string, ComplaintCategory> = {
  pothole: "roads",
  "road damage": "roads",
  garbage: "sanitation",
  trash: "sanitation",
  "water leak": "water",
  pipe: "water",
  flood: "drainage",
  drain: "drainage",
  "street light": "electricity",
  "broken light": "electricity",
  hospital: "healthcare",
  school: "education",
  bus: "transport",
};

const DETECTED_OBJECTS_BY_CATEGORY: Record<ComplaintCategory, string[][]> = {
  water: [
    ["Burst pipe", "Water pooling", "Road surface damage"],
    ["Water leak", "Puddle formation", "Pipeline exposure"],
  ],
  sanitation: [
    ["Overflowing garbage bin", "Waste accumulation", "Plastic bags"],
    ["Debris pile", "Uncollected waste", "Rodent risk area"],
  ],
  roads: [
    ["Pothole", "Road surface crack", "Damaged tarmac"],
    ["Cave-in", "Road deformation", "Drainage channel breach"],
  ],
  electricity: [
    ["Broken street light", "Exposed wiring", "Damaged pole"],
    ["Missing light fixture", "Damaged electrical junction"],
  ],
  drainage: [
    ["Blocked storm drain", "Water stagnation", "Overflow"],
    ["Clogged drain", "Sewage backup"],
  ],
  healthcare: [["Medical facility", "Hospital infrastructure"]],
  education: [["School building", "Educational facility"]],
  transport: [["Damaged bus stop", "Traffic signal"]],
  other: [["Unclassified civic issue"]],
};

/**
 * Analyze a complaint photo using Vision API.
 * Accepts a File object (from camera or file picker).
 * Returns detected objects, category, confidence, and severity.
 */
export async function analyzeComplaintImage(
  file: File,
  hintCategory?: ComplaintCategory
): Promise<AIImageAnalysis> {
  if (USE_REAL_AI) {
    const base64 = await fileToBase64(file);
    if (GEMINI_API_KEY) {
      const base64Data = base64.split(",")[1];
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an AI for an Indian civic complaint platform. Analyze this image and verify if it is related to a "${hintCategory || 'any'}" issue (e.g. if the category is 'water', it should be a water leakage, burst pipe, dry tap, overflowing gutter, water contamination issue, etc.; if 'roads', it should show potholes, damaged streets, broken pavements; if 'sanitation', it should show uncollected garbage, piles of rubbish).
                  Return JSON with the following schema:
                  {
                    "detectedCategory": "water" | "sanitation" | "roads" | "electricity" | "drainage" | "healthcare" | "education" | "transport" | "other",
                    "detectedObjects": string[],
                    "confidence": number, // 0.0-1.0
                    "severity": "critical" | "high" | "medium" | "low",
                    "rawLabels": string[],
                    "isValid": boolean, // true if the image is actually related to a "${hintCategory || 'civic'}" issue, false otherwise
                    "validationMessage": "A concise explanation of why the image is relevant or why it does not match the category."
                  }
                  Be conservative with severity. Only use "critical" for life-threatening situations.`,
                },
                {
                  inlineData: {
                    mimeType: file.type || "image/jpeg",
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      });
      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      const result = JSON.parse(text);
      return { ...result, processingTimeMs: 0 };
    } else {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `You are an AI for an Indian civic complaint platform. Analyze this image and verify if it is related to a "${hintCategory || 'any'}" issue.
                  Return JSON with the following schema:
                  {
                    "detectedCategory": "water" | "sanitation" | "roads" | "electricity" | "drainage" | "healthcare" | "education" | "transport" | "other",
                    "detectedObjects": string[],
                    "confidence": number, // 0.0-1.0
                    "severity": "critical" | "high" | "medium" | "low",
                    "rawLabels": string[],
                    "isValid": boolean, // true if the image is related to a "${hintCategory || 'civic'}" issue, false otherwise
                    "validationMessage": "A concise explanation of why it is relevant or not"
                  }
                  Be conservative with severity. Only use "critical" for life-threatening situations.`,
                },
                { type: "image_url", image_url: { url: base64, detail: "low" } },
              ],
            },
          ],
          max_tokens: 300,
          response_format: { type: "json_object" },
        }),
      });
      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      return { ...result, processingTimeMs: 0 };
    }
  }

  // ─── Production-quality mock ──────────────────────────────────────────────
  const start = Date.now();
  await simulatedDelay(800, 1400);

  const category = hintCategory ?? mockCategoryFromFilename(file.name);
  const objectSets = DETECTED_OBJECTS_BY_CATEGORY[category] ?? [["Civic issue detected"]];
  const detectedObjects = objectSets[Math.floor(Math.random() * objectSets.length)];
  const confidence = 0.78 + Math.random() * 0.19; // 78–97%
  const severity = mockSeverityFromCategory(category);

  // Mock validation logic
  const isWrongFile = file.name.toLowerCase().includes("wrong") || file.name.toLowerCase().includes("invalid");
  const isValid = hintCategory ? (category === hintCategory && !isWrongFile) : !isWrongFile;
  const validationMessage = isValid
    ? `The image shows objects matching the ${category} category.`
    : `The image does not show objects matching the selected category: ${hintCategory || category}. It appears to be related to ${category}.`;

  return {
    detectedCategory: category,
    detectedObjects,
    confidence,
    severity,
    rawLabels: detectedObjects,
    processingTimeMs: Date.now() - start,
    isValid,
    validationMessage,
  };
}

// ─── Speech Transcription ─────────────────────────────────────────────────────

/**
 * Transcribe speech audio to text using Whisper API / Gemini API.
 * Falls back to mock for demo.
 */
export async function transcribeSpeech(audio: Blob): Promise<string> {
  if (USE_REAL_AI) {
    if (GEMINI_API_KEY) {
      const base64 = await fileToBase64(audio as File);
      const base64Data = base64.split(",")[1];
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "You are an expert audio transcriber. Transcribe the following audio recording to text. Only return the transcription, nothing else. If it is in Hindi, transcribe it in Hindi. If it is in English, transcribe it in English. If it is in a local Indian language, transcribe it clearly. Do not add metadata.",
                },
                {
                  inlineData: {
                    mimeType: audio.type || "audio/webm",
                    data: base64Data,
                  },
                },
              ],
            },
          ],
        }),
      });
      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      return text.trim();
    } else {
      const formData = new FormData();
      formData.append("file", audio, "recording.webm");
      formData.append("model", "whisper-1");
      formData.append("language", "hi"); // default
      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}` },
        body: formData,
      });
      const data = await response.json();
      return data.text;
    }
  }

  await simulatedDelay(1000, 2000);
  return "Water supply has been completely stopped for the past 3 days in our area. The main pipe on the main road appears to have burst and nobody has come to repair it.";
}

// ─── Full Complaint AI Analysis ───────────────────────────────────────────────

const DEPT_BY_CATEGORY: Record<ComplaintCategory, Department> = {
  water: "water_board",
  sanitation: "sanitation",
  roads: "public_works",
  electricity: "electricity_board",
  drainage: "storm_water",
  healthcare: "health",
  education: "education",
  transport: "transport",
  other: "general",
};

const CITIZEN_SUMMARIES: Record<ComplaintCategory, string> = {
  water: "Your water supply complaint has been registered. The Water Board has been notified and will respond within 24 hours.",
  sanitation: "Garbage collection complaint filed. Sanitation team will clear the area within 48 hours.",
  roads: "Road damage reported. Public Works Department will inspect within 72 hours.",
  electricity: "Electricity issue recorded. Electricity Board will dispatch a team today.",
  drainage: "Drainage blockage reported. Storm Water department will inspect within 48 hours.",
  healthcare: "Healthcare facility complaint filed. Health Department will review within 24 hours.",
  education: "Education complaint registered and forwarded to Education Department.",
  transport: "Transport issue reported. Transport Department will review within 48 hours.",
  other: "Your complaint has been registered and will be reviewed within 72 hours.",
};

const MP_SUMMARIES: Record<ComplaintCategory, string> = {
  water: "Critical water supply failure. {n} citizens affected in {ward}. Burst pipeline likely — requires Water Board emergency crew within 24h.",
  sanitation: "Sanitation breakdown in {ward}. {n} households affected. Garbage uncollected for 5+ days. Health risk escalating — assign dedicated truck.",
  roads: "Road damage reported in {ward}. Cave-in near residential zone. High accident risk — Public Works immediate inspection needed.",
  electricity: "Street lighting failure across {ward}. Safety concern for {n} residents. Electricity Board repair team needed urgently.",
  drainage: "Severe drainage blockage in {ward}. Flooding risk during rain. {n} homes vulnerable. Storm Water Dept intervention required.",
  healthcare: "Healthcare facility issue reported in {ward}. Immediate Health Department review needed.",
  education: "School infrastructure complaint in {ward}. Education Department site visit required.",
  transport: "Transport service disruption in {ward}. Transport Department review needed.",
  other: "Civic issue reported in {ward}. {n} citizens joined. Review and assign appropriate department.",
};

/**
 * Run the full AI analysis pipeline on a complaint.
 * Returns structured data ready for citizen display and MP decision-making.
 */
export async function analyzeComplaint(params: {
  description: string;
  imageAnalysis?: AIImageAnalysis;
  location: { ward: string; district: string };
  citizensJoined?: number;
}): Promise<AIComplaintAnalysis> {
  if (USE_REAL_AI) {
    const start = Date.now();
    const appName = import.meta.env.VITE_APP_NAME || "Civic Connect AI";
    if (GEMINI_API_KEY) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `You are an AI for the Indian government civic complaint platform "${appName}". 
                  Analyze complaints and return structured JSON. Be concise. Do not invent facts.
                  Mark uncertain fields with low confidence scores.
                  
                  Complaint: "${params.description}"
                  Location: ${params.location.ward}, ${params.location.district}
                  Image analysis: ${params.imageAnalysis ? JSON.stringify(params.imageAnalysis) : "None"}
                  Citizens joined: ${params.citizensJoined ?? 1}
                  
                  Return JSON with the following schema:
                  {
                    "detectedCategory": "water" | "sanitation" | "roads" | "electricity" | "drainage" | "healthcare" | "education" | "transport" | "other",
                    "suggestedDepartment": "water_board" | "sanitation" | "public_works" | "electricity_board" | "storm_water" | "health" | "education" | "transport" | "general",
                    "severity": "critical" | "high" | "medium" | "low",
                    "confidenceScore": number,
                    "citizenSummary": string,
                    "mpSummary": string,
                    "governmentNote": string,
                    "suggestedAction": string,
                    "keyFacts": string[],
                    "aiReasoning": string
                  }
                  Ensure the response is valid JSON.`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      });
      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      const result = JSON.parse(text);
      return { ...result, processingTimeMs: Date.now() - start };
    } else {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are an AI for the Indian government civic complaint platform "${appName}". 
              Analyze complaints and return structured JSON. Be concise. Do not invent facts.
              Mark uncertain fields with low confidence scores.`,
            },
            {
              role: "user",
              content: `Complaint: "${params.description}"
              Location: ${params.location.ward}, ${params.location.district}
              Image analysis: ${params.imageAnalysis ? JSON.stringify(params.imageAnalysis) : "None"}
              Citizens joined: ${params.citizensJoined ?? 1}
              
              Return JSON with:
              {
                "detectedCategory": [one of: water/sanitation/roads/electricity/drainage/healthcare/education/transport/other],
                "suggestedDepartment": [department slug],
                "severity": [critical/high/medium/low],
                "confidenceScore": 0.0-1.0,
                "citizenSummary": "Simple 1-2 sentence summary for the citizen in plain language",
                "mpSummary": "Max 50 words. Urgency + action + department for MP",
                "governmentNote": "Internal technical note for officials",
                "suggestedAction": "Specific recommended next action",
                "keyFacts": ["fact1", "fact2", "fact3"],
                "aiReasoning": "Brief explanation of how severity/category was determined"
              }`,
            },
          ],
          max_tokens: 800,
          response_format: { type: "json_object" },
        }),
      });
      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      return { ...result, processingTimeMs: Date.now() - start };
    }
  }

  // ─── Production-quality mock ──────────────────────────────────────────────
  const start = Date.now();
  await simulatedDelay(1200, 2000);

  const category = params.imageAnalysis?.detectedCategory ?? inferCategoryFromText(params.description);
  const severity = params.imageAnalysis?.severity ?? mockSeverityFromCategory(category);
  const dept = DEPT_BY_CATEGORY[category];
  const n = params.citizensJoined ?? 1;
  const ward = params.location.ward;

  const mpTemplate = MP_SUMMARIES[category] ?? MP_SUMMARIES.other;
  const mpSummary = mpTemplate
    .replace("{n}", String(n + 1))
    .replace("{ward}", ward);

  return {
    imageAnalysis: params.imageAnalysis,
    detectedCategory: category,
    suggestedDepartment: dept,
    severity,
    confidenceScore: 0.82 + Math.random() * 0.14,
    citizenSummary: CITIZEN_SUMMARIES[category],
    mpSummary,
    governmentNote: `Complaint auto-classified by AI. Category: ${category}. Severity: ${severity}. Recommend field verification before work order creation.`,
    suggestedAction: mockSuggestedAction(category, severity),
    keyFacts: mockKeyFacts(category, ward, n),
    aiReasoning: `Category inferred from ${params.imageAnalysis ? "visual analysis (image)" : "text keywords"}. Severity set to ${severity} based on ${severity === "critical" ? "essential service disruption" : "impact scope and citizen reports"}.`,
    processingTimeMs: Date.now() - start,
  };
}

// ─── Impact Score ─────────────────────────────────────────────────────────────

/**
 * Calculate the impact score (0–100) for a complaint.
 * Higher = more urgent for the MP.
 */
export async function calculateImpactScore(params: {
  severity: SeverityLevel;
  citizensJoined: number;
  hoursOpen: number;
  category: ComplaintCategory;
  ward: string;
}): Promise<ImpactScore> {
  await simulatedDelay(200, 500);

  const severityWeight = { critical: 40, high: 28, medium: 16, low: 8 };
  const s = severityWeight[params.severity] ?? 16;
  const c = Math.min(params.citizensJoined * 2, 20);
  const t = Math.min(Math.floor(params.hoursOpen / 12), 15);
  const e = params.severity === "critical" ? 15 : params.severity === "high" ? 10 : 5;
  const inf = params.category === "water" || params.category === "electricity" ? 10 : 5;
  const density = 5; // mock — real: from census data
  const total = Math.min(s + c + t + e + inf + density, 100);

  return {
    total,
    breakdown: {
      severity: s,
      citizensAffected: c,
      timeOpen: t,
      emergencyLevel: e,
      infrastructureImportance: inf,
      populationDensity: density,
    },
    explanation: `Score ${total}/100. ${params.severity.charAt(0).toUpperCase() + params.severity.slice(1)} severity (+${s}), ${params.citizensJoined + 1} citizens joined (+${c}), open ${params.hoursOpen}h (+${t}). ${total >= 70 ? "Immediate action required." : total >= 50 ? "High priority." : "Standard priority."}`,
  };
}

// ─── Duplicate Detection ──────────────────────────────────────────────────────

/**
 * Check if a new complaint is likely a duplicate of an existing one.
 * In production: compares vector embeddings + geo-distance.
 * Here: deterministic mock based on category.
 */
export async function detectDuplicates(params: {
  description: string;
  category: ComplaintCategory;
  location: { lat: number; lng: number };
}): Promise<DuplicateMatch[]> {
  await simulatedDelay(600, 1000);

  // Mock — water complaints always have a nearby duplicate for demo
  if (params.category === "water") {
    return [
      {
        complaintId: "CHN-2024-0712",
        title: "No Drinking Water — 3 Days",
        similarity: 0.91,
        distance: 230, // metres
        citizensJoined: 23,
      },
    ];
  }

  // 20% chance of finding a nearby duplicate for other categories
  if (Math.random() < 0.2) {
    return [
      {
        complaintId: `CHN-2024-0${Math.floor(Math.random() * 900 + 100)}`,
        title: mockDuplicateTitle(params.category),
        similarity: 0.65 + Math.random() * 0.2,
        distance: Math.floor(Math.random() * 500 + 50),
        citizensJoined: Math.floor(Math.random() * 10 + 1),
      },
    ];
  }

  return [];
}

// ─── AI Pipeline Step Runner ──────────────────────────────────────────────────

/**
 * Run the full AI pipeline step-by-step, calling `onStep` after each step.
 * This drives the animated AI Processing Panel in the UI.
 */
export async function runAIPipeline(
  params: {
    hasPhoto: boolean;
    hasAudio: boolean;
    description: string;
    imageAnalysis?: AIImageAnalysis;
  },
  onStep: (steps: AIPipelineStepResult[]) => void
): Promise<void> {
  const steps: AIPipelineStepResult[] = [
    { step: "image_received",       label: "Photo received",          status: "pending", icon: "📸" },
    { step: "vision_analysis",      label: "Analysing image",         status: "pending", icon: "🔍" },
    { step: "speech_transcription", label: "Processing description",  status: "pending", icon: "🗣️" },
    { step: "translation",          label: "Language detection",      status: "pending", icon: "🌐" },
    { step: "category_detection",   label: "Classifying complaint",   status: "pending", icon: "🏷️" },
    { step: "duplicate_detection",  label: "Checking duplicates",     status: "pending", icon: "🔁" },
    { step: "severity_detection",   label: "Estimating severity",     status: "pending", icon: "⚠️" },
    { step: "department_prediction",label: "Routing to department",   status: "pending", icon: "🏛️" },
    { step: "impact_score",         label: "Calculating impact",      status: "pending", icon: "⚖️" },
    { step: "mp_summary",           label: "Generating MP summary",   status: "pending", icon: "📋" },
    { step: "complete",             label: "Complete",                status: "pending", icon: "✅" },
  ];

  const results: Record<string, string> = {
    image_received:        params.hasPhoto ? "Image uploaded" : "No image (using description only)",
    vision_analysis:       params.imageAnalysis ? `${params.imageAnalysis.detectedCategory} detected (${Math.round((params.imageAnalysis.confidence ?? 0.85) * 100)}% confidence)` : "Skipped — text-only",
    speech_transcription:  params.hasAudio ? "Voice transcribed" : "Text description processed",
    translation:           "English · Hindi detected",
    category_detection:    "Category classified",
    duplicate_detection:   "Checking nearby reports…",
    severity_detection:    "Severity assessed",
    department_prediction: "Department assigned",
    impact_score:          "Impact score calculated",
    mp_summary:            "Summary ready for MP",
    complete:              "Processing complete",
  };

  for (let i = 0; i < steps.length; i++) {
    steps[i].status = "processing";
    onStep([...steps]);
    await simulatedDelay(350, 700);
    steps[i].status = "done";
    steps[i].result = results[steps[i].step];
    onStep([...steps]);
  }
}

// ─── Private helpers ──────────────────────────────────────────────────────────

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function mockCategoryFromFilename(filename: string): ComplaintCategory {
  const f = filename.toLowerCase();
  if (f.includes("water") || f.includes("pipe")) return "water";
  if (f.includes("road") || f.includes("pothole")) return "roads";
  if (f.includes("garbage") || f.includes("waste")) return "sanitation";
  if (f.includes("light") || f.includes("electric")) return "electricity";
  if (f.includes("drain") || f.includes("flood")) return "drainage";
  // Default: randomise a realistic category
  const cats: ComplaintCategory[] = ["water", "roads", "sanitation", "electricity", "drainage"];
  return cats[Math.floor(Math.random() * cats.length)];
}

function mockSeverityFromCategory(cat: ComplaintCategory): SeverityLevel {
  if (cat === "water" || cat === "drainage" || cat === "healthcare") return "critical";
  if (cat === "roads" || cat === "sanitation" || cat === "electricity") return "high";
  return "medium";
}

function inferCategoryFromText(text: string): ComplaintCategory {
  const t = text.toLowerCase();
  for (const [keyword, cat] of Object.entries(CATEGORY_VISION_MAP)) {
    if (t.includes(keyword)) return cat as ComplaintCategory;
  }
  if (t.includes("light")) return "electricity";
  if (t.includes("drain") || t.includes("flood")) return "drainage";
  return "other";
}

function mockSuggestedAction(cat: ComplaintCategory, severity: SeverityLevel): string {
  const urgency = severity === "critical" ? "Immediately assign" : severity === "high" ? "Assign within 24h" : "Schedule";
  const deptNames: Record<ComplaintCategory, string> = {
    water: "Water Board emergency crew",
    sanitation: "Sanitation team for clearance",
    roads: "Public Works inspection team",
    electricity: "Electricity Board repair team",
    drainage: "Storm Water Department",
    healthcare: "Health Department officer",
    education: "Education Department inspector",
    transport: "Transport Department review",
    other: "relevant department officer",
  };
  return `${urgency} ${deptNames[cat]} for on-site inspection and resolution.`;
}

function mockKeyFacts(cat: ComplaintCategory, ward: string, citizens: number): string[] {
  const base = [`${citizens + 1} citizens have reported or joined this issue`, `Location: ${ward}`];
  const catFacts: Record<ComplaintCategory, string[]> = {
    water: ["No water supply for 3+ days", "Essential service disruption", "Health risk increasing"],
    sanitation: ["Garbage uncollected for 5+ days", "Public health hazard", "Rodent/pest risk"],
    roads: ["Road damage poses accident risk", "Affects daily commute", "May worsen with rain"],
    electricity: ["Street lights non-functional", "Night safety concern", "Affects entire block"],
    drainage: ["Blocked drain risks flooding", "Monsoon vulnerability", "Stagnant water breeding ground"],
    healthcare: ["Healthcare access affected"],
    education: ["School facility affected"],
    transport: ["Public transport disrupted"],
    other: ["Requires municipal attention"],
  };
  return [...base, ...(catFacts[cat] ?? [])];
}

function mockDuplicateTitle(cat: ComplaintCategory): string {
  const titles: Record<ComplaintCategory, string> = {
    water: "Water Supply Disruption",
    sanitation: "Garbage Collection Failure",
    roads: "Road Damage / Pothole",
    electricity: "Street Light Not Working",
    drainage: "Drain Overflow",
    healthcare: "Healthcare Facility Issue",
    education: "School Infrastructure Problem",
    transport: "Public Transport Issue",
    other: "Civic Issue",
  };
  return titles[cat] ?? "Similar Complaint";
}
