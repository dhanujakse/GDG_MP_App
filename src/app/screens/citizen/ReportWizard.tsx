// ─────────────────────────────────────────────────────────────────────────────
// ReportWizard — Civic Connect AI
// 5-step complaint submission with full AI pipeline integration
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback, useEffect } from "react";
import {
  ChevronLeft, Plus, Camera, Mic, Type, MapPin, CheckCircle,
  Share2, Copy, StopCircle, RotateCcw, AlertTriangle, Users
} from "lucide-react";
import {
  analyzeComplaintImage,
  analyzeComplaint,
  calculateImpactScore,
  detectDuplicates,
  transcribeSpeech,
  runAIPipeline,
} from "@/services/ai.service";
import { complaintService } from "@/services/complaint.service";
import { useGeolocation } from "@/hooks/useGeolocation";
import { AIProcessingPanel } from "@/app/components/shared/AIProcessingPanel";
import { SeverityBadge } from "@/app/components/shared/SeverityBadge";
import { CategoryIcon, getCategoryLabel } from "@/app/components/shared/CategoryIcon";
import type {
  ComplaintCategory, AIImageAnalysis, AIComplaintAnalysis,
  ImpactScore, DuplicateMatch, AIPipelineStepResult
} from "@/types";

const DF: React.CSSProperties = { fontFamily: "var(--font-display)" };

const CATEGORIES: { key: ComplaintCategory; emoji: string; label: string }[] = [
  { key: "water",       emoji: "💧", label: "Water"       },
  { key: "sanitation",  emoji: "🗑️", label: "Garbage"     },
  { key: "roads",       emoji: "🛣️", label: "Roads"       },
  { key: "electricity", emoji: "💡", label: "Electricity" },
  { key: "drainage",    emoji: "🌊", label: "Drainage"    },
  { key: "healthcare",  emoji: "🏥", label: "Hospital"    },
  { key: "education",   emoji: "🏫", label: "School"      },
  { key: "transport",   emoji: "🚌", label: "Bus / Road"  },
  { key: "other",       emoji: "📝", label: "Other"       },
];

type Step = 0 | 1 | 2 | 3 | 4 | 5;
type DescMode = "type" | "speak" | "photo";

interface Props {
  onBack: () => void;
}

export function ReportWizard({ onBack }: Props) {
  const [step, setStep] = useState<Step>(0);
  const [category, setCategory] = useState<ComplaintCategory | "">("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [descMode, setDescMode] = useState<DescMode>("type");
  const [description, setDescription] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [aiSteps, setAiSteps] = useState<AIPipelineStepResult[]>([]);
  const [imageAnalysis, setImageAnalysis] = useState<AIImageAnalysis | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIComplaintAnalysis | null>(null);
  const [impactScore, setImpactScore] = useState<ImpactScore | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [complaintId, setComplaintId] = useState<string>("");
  const [shortId, setShortId] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { location, requestLocation, isGranted } = useGeolocation();

  useEffect(() => {
    if (step === 0) requestLocation();
  }, [step, requestLocation]);

  const handlePhotoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setStep(2);
  }, []);

  const handleStartRecording = useCallback(async () => {
    setIsRecording(true);
    // Simulate recording + transcription for demo
    await new Promise((r) => setTimeout(r, 2500));
    const transcript = await transcribeSpeech(new Blob());
    setDescription(transcript);
    setIsRecording(false);
    setDescMode("type"); // show result in textarea
  }, []);

  const runFullAIPipeline = useCallback(async () => {
    if (!category) return;
    setStep(3);
    setAiSteps([]);

    // Run image analysis first (if photo exists)
    let imgAnalysis: AIImageAnalysis | null = null;
    if (photoFile) {
      imgAnalysis = await analyzeComplaintImage(photoFile, category as ComplaintCategory);
      setImageAnalysis(imgAnalysis);
    }

    // Run animated step pipeline
    await runAIPipeline(
      { hasPhoto: !!photoFile, hasAudio: false, description, imageAnalysis: imgAnalysis ?? undefined },
      (steps) => setAiSteps(steps)
    );

    // Run AI analysis and impact score in parallel
    const [analysis, dupes] = await Promise.all([
      analyzeComplaint({
        description,
        imageAnalysis: imgAnalysis ?? undefined,
        location: { ward: location.ward, district: location.district },
        citizensJoined: 0,
      }),
      detectDuplicates({
        description,
        category: category as ComplaintCategory,
        location: { lat: location.lat, lng: location.lng },
      }),
    ]);

    const score = await calculateImpactScore({
      severity: analysis.severity,
      citizensJoined: 0,
      hoursOpen: 0,
      category: analysis.detectedCategory,
      ward: location.ward,
    });

    setAiAnalysis(analysis);
    setImpactScore(score);
    setDuplicates(dupes);

    // If strong duplicate detected, show join prompt instead
    if (dupes.length > 0 && dupes[0].similarity > 0.8) {
      setStep(4); // show duplicate warning first
      return;
    }

    // Create complaint in local store
    const complaint = complaintService.create({
      description,
      category: analysis.detectedCategory,
      location,
      citizenId: "ctz_001",
    });
    complaintService.applyAIAnalysis(complaint.id, analysis, score);
    setComplaintId(complaint.id);
    setShortId(complaint.shortId);
    setStep(5);
  }, [category, photoFile, description, location]);

  const handleSubmitAnyway = useCallback(() => {
    if (!aiAnalysis || !impactScore) return;
    const complaint = complaintService.create({
      description,
      category: aiAnalysis.detectedCategory,
      location,
      citizenId: "ctz_001",
    });
    complaintService.applyAIAnalysis(complaint.id, aiAnalysis, impactScore);
    setComplaintId(complaint.id);
    setShortId(complaint.shortId);
    setStep(5);
  }, [aiAnalysis, impactScore, description, location]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(shortId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shortId]);

  const STEPS = ["Category", "Photo", "Describe", "AI Analysis", "Review", "Done"];

  // ── Step 5: Success ────────────────────────────────────────────────────────
  if (step === 5) return (
    <div className="flex flex-col items-center justify-center h-full gap-5 px-6 text-center animate-fadeIn">
      <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center animate-pulse-ring">
        <CheckCircle size={48} className="text-green-500" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2" style={DF}>Complaint Registered</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your complaint has been logged and forwarded to the{" "}
          <span className="font-semibold text-foreground">{aiAnalysis?.suggestedDepartment?.replace(/_/g, " ") ?? "relevant department"}</span>.
        </p>
      </div>

      {/* AI Summary */}
      {aiAnalysis && (
        <div className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl text-left">
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mb-1.5">AI Summary</p>
          <p className="text-sm text-blue-900 leading-relaxed">{aiAnalysis.citizenSummary}</p>
        </div>
      )}

      {/* Complaint ID */}
      <div className="w-full p-4 bg-secondary rounded-2xl text-left">
        <p className="text-[10px] text-muted-foreground font-medium mb-1.5 uppercase tracking-wide">
          Complaint ID — share so others can join
        </p>
        <div className="flex items-center gap-3">
          <p className="text-xl font-black text-foreground font-mono flex-1" style={DF}>{shortId}</p>
          <button onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              copied ? "bg-green-100 text-green-700" : "bg-card border border-border text-muted-foreground"
            }`}>
            {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        {aiAnalysis && (
          <p className="text-[11px] text-muted-foreground mt-2">
            {getCategoryLabel(aiAnalysis.detectedCategory)} · {location.ward} · Impact Score: {impactScore?.total ?? 0}/100
          </p>
        )}
      </div>

      <div className="flex gap-3 w-full">
        <button className="flex-1 py-3.5 bg-secondary border border-border rounded-2xl text-sm font-bold text-foreground flex items-center justify-center gap-2" style={DF}>
          <Share2 size={15} /> Share
        </button>
        <button onClick={onBack}
          className="flex-1 py-3.5 bg-primary text-white rounded-2xl text-sm font-bold" style={DF}>
          Back to Home
        </button>
      </div>
    </div>
  );

  // ── Step 4: Duplicate Warning ──────────────────────────────────────────────
  if (step === 4 && duplicates.length > 0) {
    const dup = duplicates[0];
    return (
      <div className="flex flex-col h-full px-5 pt-6 pb-5 animate-fadeIn">
        <h1 className="text-xl font-bold text-foreground mb-1" style={DF}>Similar Report Found</h1>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          The AI detected a very similar complaint nearby. You can join it to strengthen the case.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={15} className="text-amber-600" />
            <span className="text-xs font-bold text-amber-700">
              {Math.round(dup.similarity * 100)}% match · {dup.distance}m away
            </span>
          </div>
          <p className="text-sm font-bold text-foreground mb-1">{dup.title}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Users size={11} /> {dup.citizensJoined} citizens already joined
          </p>
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          Joining strengthens the existing complaint's impact score. Your location and support are added.
        </p>

        <div className="mt-auto space-y-2.5">
          <button
            onClick={() => {
              complaintService.joinComplaint(dup.complaintId, "ctz_001");
              setShortId(dup.complaintId);
              setStep(5);
            }}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-sm" style={DF}>
            <Users size={16} className="inline mr-2" />
            Join Existing Complaint
          </button>
          <button onClick={handleSubmitAnyway}
            className="w-full py-3.5 bg-secondary border border-border rounded-2xl text-sm font-semibold text-foreground" style={DF}>
            Create New Anyway
          </button>
        </div>
      </div>
    );
  }

  // ── Step 3: AI Processing ──────────────────────────────────────────────────
  if (step === 3) return (
    <div className="flex flex-col h-full px-5 pt-6 pb-5 animate-fadeIn">
      <h1 className="text-xl font-bold text-foreground mb-1" style={DF}>AI is Working…</h1>
      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
        Your complaint is being automatically classified, checked for duplicates, and prioritised.
      </p>
      <AIProcessingPanel steps={aiSteps} />
      {aiSteps.every((s) => s.status === "done") && (
        <div className="mt-4 animate-fadeIn">
          <button onClick={() => duplicates.length > 0 && duplicates[0].similarity > 0.8 ? setStep(4) : setStep(5)}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold" style={DF}>
            Continue →
          </button>
        </div>
      )}
    </div>
  );

  // ── Main wizard shell ──────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="pt-5 px-5 pb-3 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={step === 0 ? onBack : () => setStep((s) => (s - 1) as Step)}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <ChevronLeft size={18} className="text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground" style={DF}>Report Problem</h1>
            <p className="text-[10px] text-muted-foreground font-medium">
              Step {step + 1} of 3 — {STEPS[step]}
            </p>
          </div>
        </div>
        {/* Progress */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i <= step ? "bg-primary" : "bg-secondary"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-5 scrollbar-none">

        {/* Step 0 — Category */}
        {step === 0 && (
          <div className="animate-fadeIn">
            <p className="text-sm text-muted-foreground mb-4 mt-2">What type of problem is this?</p>
            <div className="grid grid-cols-3 gap-2.5 mb-4">
              {CATEGORIES.map((c) => (
                <button key={c.key} onClick={() => setCategory(c.key)}
                  className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border-2 transition-all active-press ${
                    category === c.key
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card"
                  }`}>
                  <span className="text-3xl leading-none">{c.emoji}</span>
                  <span className="text-[11px] font-bold text-foreground leading-tight text-center">{c.label}</span>
                </button>
              ))}
            </div>

            {/* Location pill */}
            {isGranted && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-100 rounded-xl mb-4">
                <MapPin size={13} className="text-green-600 shrink-0" />
                <span className="text-xs font-semibold text-green-800 flex-1 truncate">
                  {location.address}, {location.ward}
                </span>
                <CheckCircle size={12} className="text-green-500" />
              </div>
            )}

            <button onClick={() => setStep(1)} disabled={!category}
              className={`w-full py-4 rounded-2xl font-bold transition-all ${
                category ? "bg-primary text-white active-press" : "bg-secondary text-muted-foreground cursor-not-allowed"
              }`} style={DF}>
              Continue
            </button>
          </div>
        )}

        {/* Step 1 — Photo */}
        {step === 1 && (
          <div className="animate-fadeIn mt-2">
            <p className="text-sm text-muted-foreground mb-4">
              Take a clear photo of the problem. This helps the AI analyse and verify the issue.
            </p>

            <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
              className="hidden" onChange={handlePhotoSelect} />

            {photoPreview ? (
              <div className="relative mb-4">
                <img src={photoPreview} alt="Complaint" className="w-full h-48 object-cover rounded-2xl" />
                <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center">
                  <RotateCcw size={12} className="text-white" />
                </button>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()}
                className="w-full h-44 border-2 border-dashed border-primary/30 rounded-2xl flex flex-col items-center justify-center gap-3 bg-primary/3 mb-4 active-press">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera size={24} className="text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground">Take a Photo</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Or tap to choose from gallery</p>
                </div>
              </button>
            )}

            <p className="text-[11px] text-muted-foreground text-center mb-4">
              Photo helps AI detect the issue automatically and improves priority score
            </p>

            <div className="space-y-2">
              {photoPreview && (
                <button onClick={() => setStep(2)}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold" style={DF}>
                  Continue with this Photo
                </button>
              )}
              <button onClick={() => setStep(2)}
                className="w-full py-3 bg-secondary border border-border rounded-2xl text-sm font-semibold text-muted-foreground" style={DF}>
                Skip — Add Description Instead
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Description */}
        {step === 2 && (
          <div className="animate-fadeIn mt-2">
            <p className="text-sm text-muted-foreground mb-4">
              Describe the problem in your own words, or use voice.
            </p>

            {/* Mode tabs */}
            <div className="flex gap-2 mb-4 p-1 bg-secondary rounded-xl">
              {(["type", "speak"] as DescMode[]).map((m) => (
                <button key={m} onClick={() => setDescMode(m)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    descMode === m ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                  }`}>
                  {m === "type" ? <Type size={13} /> : <Mic size={13} />}
                  {m === "type" ? "Type" : "Voice"}
                </button>
              ))}
            </div>

            {descMode === "type" && (
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue clearly. e.g. 'Water pipe burst on main road, no supply for 3 days in our area.'"
                rows={5}
                className="w-full p-4 bg-secondary rounded-2xl text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none border border-border focus:border-primary/40 transition-colors"
              />
            )}

            {descMode === "speak" && (
              <div className="flex flex-col items-center gap-4 py-8 bg-secondary rounded-2xl border border-border">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isRecording ? "bg-red-100 animate-pulse-ring" : "bg-primary/10"
                }`}>
                  {isRecording ? <StopCircle size={28} className="text-red-500" /> : <Mic size={28} className="text-primary" />}
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground">
                    {isRecording ? "Recording… speak clearly" : "Speak in your language"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isRecording ? "AI will transcribe your voice" : "Hindi, Tamil, Telugu, and more"}
                  </p>
                </div>
                <button onClick={handleStartRecording} disabled={isRecording}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold ${
                    isRecording ? "bg-red-500 text-white" : "bg-primary text-white"
                  }`} style={DF}>
                  {isRecording ? "Recording…" : "Start Speaking"}
                </button>
                {description && descMode === "type" && (
                  <div className="w-full px-4">
                    <p className="text-xs text-muted-foreground mb-1 font-medium">Transcribed:</p>
                    <p className="text-sm text-foreground leading-relaxed bg-card p-3 rounded-xl border border-border">{description}</p>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={runFullAIPipeline}
              disabled={!description && !photoFile}
              className={`w-full py-4 rounded-2xl font-bold mt-4 transition-all flex items-center justify-center gap-2 ${
                description || photoFile
                  ? "bg-primary text-white active-press"
                  : "bg-secondary text-muted-foreground cursor-not-allowed"
              }`} style={DF}>
              <span>🤖</span>
              Submit & Analyse with AI
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
