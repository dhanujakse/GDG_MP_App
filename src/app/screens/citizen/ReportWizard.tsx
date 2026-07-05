// ─────────────────────────────────────────────────────────────────────────────
// ReportWizard — Civic Connect AI
// 5-step complaint submission with full AI pipeline integration
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback, useEffect } from "react";
import {
  ChevronLeft, Plus, Camera, Mic, Type, MapPin, CheckCircle,
  Share2, Copy, StopCircle, RotateCcw, AlertTriangle, Users,
  Loader2, Sparkles, Upload
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
import { uploadComplaintPhoto } from "@/services/firebase";
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
type DescMode = "type" | "speak";

interface Props {
  onBack: () => void;
  onComplaintRegistered?: (shortId: string, category: string) => void;
}

// ─── OpenCV Helpers ──────────────────────────────────────────────────────────
function runOpenCVAnalysis(canvasEl: HTMLCanvasElement): { edgePreview: string; edgesCount: number } | null {
  try {
    const cv = (window as any).cv;
    if (!cv || !cv.Mat) return null;

    let src = cv.imread(canvasEl);
    let dst = new cv.Mat();
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    cv.Canny(src, dst, 50, 120, 3, false);

    let edgesCount = cv.countNonZero(dst);

    let tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvasEl.width;
    tempCanvas.height = canvasEl.height;
    cv.imshow(tempCanvas, dst);

    const edgePreview = tempCanvas.toDataURL("image/jpeg");
    src.delete();
    dst.delete();

    return { edgePreview, edgesCount };
  } catch (err) {
    console.error("OpenCV Canny error", err);
    return null;
  }
}

function runCanvasFallbackAnalysis(canvasEl: HTMLCanvasElement): { edgePreview: string; edgesCount: number } {
  const ctx = canvasEl.getContext("2d");
  if (!ctx) return { edgePreview: "", edgesCount: 0 };
  const imgData = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
  const data = imgData.data;

  let edgesCount = 0;
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    let gray = 0.299 * r + 0.587 * g + 0.114 * b;
    let rightGray = i + 4 < data.length ? 0.299 * data[i+4] + 0.587 * data[i+5] + 0.114 * data[i+6] : gray;
    let diff = Math.abs(gray - rightGray);
    let val = diff > 20 ? 255 : 0;
    if (val > 0) edgesCount++;
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = canvasEl.width;
  tempCanvas.height = canvasEl.height;
  const tempCtx = tempCanvas.getContext("2d");
  if (tempCtx) tempCtx.putImageData(imgData, 0, 0);

  return {
    edgePreview: tempCanvas.toDataURL("image/jpeg"),
    edgesCount
  };
}

export function ReportWizard({ onBack, onComplaintRegistered }: Props) {
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

  // Live Camera states
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCamLoading, setIsCamLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Validation states
  const [isValidatingImage, setIsValidatingImage] = useState(false);
  const [imageValidationError, setImageValidationError] = useState<string | null>(null);
  const [opencvEdgePreview, setOpencvEdgePreview] = useState<string | null>(null);
  const [opencvStats, setOpencvStats] = useState<string | null>(null);
  const [imageIsValidated, setImageIsValidated] = useState(false);

  // Voice recording states
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { location, requestLocation, isGranted } = useGeolocation();

  useEffect(() => {
    if (step === 0) requestLocation();
  }, [step, requestLocation]);

  // Image validation trigger
  const processAndValidateImage = async (file: File, previewUrl: string) => {
    setPhotoFile(file);
    setPhotoPreview(previewUrl);
    setIsValidatingImage(true);
    setImageValidationError(null);
    setImageIsValidated(false);
    setOpencvEdgePreview(null);
    setOpencvStats(null);

    // 1. Run OpenCV/Canvas Edge Detection
    const img = new Image();
    img.src = previewUrl;
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.width > 600 ? 600 : img.width;
    canvas.height = (img.height / img.width) * canvas.width;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const cvResult = runOpenCVAnalysis(canvas) || runCanvasFallbackAnalysis(canvas);
      setOpencvEdgePreview(cvResult.edgePreview);
      setOpencvStats(`Feature edges detected: ${cvResult.edgesCount}`);

      if (cvResult.edgesCount < 50) {
        setIsValidatingImage(false);
        setImageValidationError("Edge verification failed: Image appears blank or extremely blurry. Please capture a clear photo.");
        return;
      }
    }

    // 2. Call Gemini relevance check
    try {
      const analysis = await analyzeComplaintImage(file, category as ComplaintCategory);
      setImageAnalysis(analysis);

      if (analysis.isValid === false) {
        setImageValidationError(analysis.validationMessage || `Image is not related to a ${category} issue.`);
      } else {
        setImageIsValidated(true);
        setTimeout(() => {
          setStep(2);
          setIsValidatingImage(false);
        }, 1500);
        return;
      }
    } catch (err) {
      console.error(err);
      setImageValidationError("Relevance check failed due to API error. Please try uploading again.");
    }
    setIsValidatingImage(false);
  };

  const handlePhotoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    processAndValidateImage(file, url);
  }, [category]);

  // Live Camera handlers
  const startLiveCamera = async () => {
    setShowCamera(true);
    setIsCamLoading(true);
    setImageValidationError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraStream(stream);
    } catch (err) {
      console.error(err);
      alert("Failed to start camera. Please upload a file from your folder instead.");
      setShowCamera(false);
    }
    setIsCamLoading(false);
  };

  const stopLiveCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const captureFrame = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "captured_frame.jpg", { type: "image/jpeg" });
            const previewUrl = URL.createObjectURL(blob);
            stopLiveCamera();
            processAndValidateImage(file, previewUrl);
          }
        }, "image/jpeg");
      }
    }
  };

  // Real voice input
  const handleStartRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunks.push(e.data);
      };

      rec.onstop = async () => {
        setIsRecording(false);
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        setIsValidatingImage(true); // transcribe loader
        try {
          const text = await transcribeSpeech(audioBlob);
          setDescription(text);
        } catch (err) {
          console.error(err);
        }
        setIsValidatingImage(false);
      };

      rec.start();
      setMediaRecorder(rec);
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      alert("Could not access microphone. Please check browser permissions.");
    }
  }, []);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(t => t.stop());
    }
  }, [mediaRecorder]);

  const runFullAIPipeline = useCallback(async () => {
    if (!category) return;
    setStep(3);
    setAiSteps([]);

    // Run animated step pipeline
    await runAIPipeline(
      { hasPhoto: !!photoFile, hasAudio: false, description, imageAnalysis: imageAnalysis ?? undefined },
      (steps) => setAiSteps(steps)
    );

    // Run AI analysis and impact score in parallel
    const [analysis, dupes] = await Promise.all([
      analyzeComplaint({
        description,
        imageAnalysis: imageAnalysis ?? undefined,
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
      setStep(4);
      return;
    }

    // Create complaint in local store
    let uploadedPhotoUrl = photoPreview || undefined;
    if (photoFile) {
      try {
        uploadedPhotoUrl = await uploadComplaintPhoto(photoFile);
      } catch (err) {
        console.error("Error uploading photo to Firebase Storage, falling back to preview URL:", err);
      }
    }

    const complaint = complaintService.create({
      description,
      category: analysis.detectedCategory,
      location,
      citizenId: "ctz_001",
      photoUrl: uploadedPhotoUrl
    });
    complaintService.applyAIAnalysis(complaint.id, analysis, score);
    setComplaintId(complaint.id);
    setShortId(complaint.shortId);
    if (onComplaintRegistered) {
      onComplaintRegistered(complaint.shortId, analysis.detectedCategory);
    }
    setStep(5);
  }, [category, photoFile, description, location, imageAnalysis, photoPreview, onComplaintRegistered]);

  const handleSubmitAnyway = useCallback(async () => {
    if (!aiAnalysis || !impactScore) return;

    let uploadedPhotoUrl = photoPreview || undefined;
    if (photoFile) {
      try {
        uploadedPhotoUrl = await uploadComplaintPhoto(photoFile);
      } catch (err) {
        console.error("Error uploading photo to Firebase Storage, falling back to preview URL:", err);
      }
    }

    const complaint = complaintService.create({
      description,
      category: aiAnalysis.detectedCategory,
      location,
      citizenId: "ctz_001",
      photoUrl: uploadedPhotoUrl
    });
    complaintService.applyAIAnalysis(complaint.id, aiAnalysis, impactScore);
    setComplaintId(complaint.id);
    setShortId(complaint.shortId);
    if (onComplaintRegistered) {
      onComplaintRegistered(complaint.shortId, aiAnalysis.detectedCategory);
    }
    setStep(5);
  }, [aiAnalysis, impactScore, description, location, photoFile, photoPreview, onComplaintRegistered]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(shortId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shortId]);

  const STEPS = ["Category", "Photo", "Describe", "AI Analysis", "Review", "Done"];

  // ── Step 5: Success ────────────────────────────────────────────────────────
  if (step === 5) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center animate-fadeIn overflow-y-auto scrollbar-none py-4">
      <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center animate-pulse-ring shrink-0">
        <CheckCircle size={36} className="text-green-500" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1" style={DF}>Complaint Registered</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your complaint has been logged and forwarded to the{" "}
          <span className="font-semibold text-foreground">{aiAnalysis?.suggestedDepartment?.replace(/_/g, " ") ?? "relevant department"}</span>.
        </p>
      </div>

      {/* Submitted image */}
      {photoPreview && (
        <div className="w-full max-h-36 overflow-hidden rounded-2xl border border-border shrink-0">
          <img src={photoPreview} alt="Submitted issue" className="w-full h-full object-cover" />
        </div>
      )}

      {/* AI Summary */}
      {aiAnalysis && (
        <div className="w-full p-3.5 bg-blue-50 border border-blue-100 rounded-2xl text-left shrink-0">
          <p className="text-[9px] font-bold text-blue-600 uppercase tracking-wide mb-1 flex items-center gap-1">
            <Sparkles size={10} /> AI Summary
          </p>
          <p className="text-xs text-blue-900 leading-relaxed">{aiAnalysis.citizenSummary}</p>
        </div>
      )}

      {/* Complaint ID */}
      <div className="w-full p-3.5 bg-secondary rounded-2xl text-left shrink-0">
        <p className="text-[9px] text-muted-foreground font-semibold mb-1 uppercase tracking-wide">
          Complaint ID
        </p>
        <div className="flex items-center gap-3">
          <p className="text-lg font-black text-foreground font-mono flex-1" style={DF}>{shortId}</p>
          <button onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
              copied ? "bg-green-100 text-green-700" : "bg-card border border-border text-muted-foreground"
            }`}>
            {copied ? <CheckCircle size={10} /> : <Copy size={10} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        {aiAnalysis && (
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {getCategoryLabel(aiAnalysis.detectedCategory)} · {location.ward} · Impact Score: {impactScore?.total ?? 0}/100
          </p>
        )}
      </div>

      <div className="flex gap-2 w-full mt-2 shrink-0">
        <button className="flex-1 py-3 bg-secondary border border-border rounded-xl text-xs font-bold text-foreground flex items-center justify-center gap-2" style={DF}>
          <Share2 size={13} /> Share
        </button>
        <button onClick={onBack}
          className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-bold" style={DF}>
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
    <div className="flex flex-col h-full relative">
      {/* Live Camera View Overlay */}
      {showCamera && (
        <div className="absolute inset-0 bg-black z-50 flex flex-col justify-between pt-12 pb-8 px-5">
          <div className="flex items-center justify-between text-white shrink-0">
            <h3 className="text-sm font-bold">Live Camera Feed</h3>
            <button onClick={stopLiveCamera} className="text-xs px-3 py-1 bg-white/10 rounded-full">Cancel</button>
          </div>
          
          <div className="flex-1 my-4 bg-slate-900 rounded-2xl overflow-hidden relative flex items-center justify-center">
            {isCamLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="text-primary animate-spin" size={32} />
              </div>
            )}
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          </div>

          <div className="flex items-center justify-center shrink-0">
            <button onClick={captureFrame} className="w-16 h-16 rounded-full border-4 border-white bg-red-600 flex items-center justify-center active-press shadow-lg">
              <div className="w-10 h-10 rounded-full bg-white/20" />
            </button>
          </div>
        </div>
      )}

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

        {/* Step 1 — Photo capturing & validation */}
        {step === 1 && (
          <div className="animate-fadeIn mt-2 flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Provide a photo of the {category} issue. Images are strictly validated before submission.
            </p>

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />

            {/* Preview & OpenCV overlay block */}
            {photoPreview ? (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden border border-border bg-slate-100">
                  <img src={photoPreview} alt="Original complaint" className="w-full h-44 object-cover" />
                  
                  {/* OpenCV Edge map preview thumbnail if validating/validated */}
                  {opencvEdgePreview && (
                    <div className="absolute bottom-2 right-2 w-24 h-18 border border-white/40 rounded-lg overflow-hidden bg-black shadow-lg">
                      <img src={opencvEdgePreview} alt="OpenCV edge map" className="w-full h-full object-cover grayscale brightness-125" />
                      <div className="absolute top-0 inset-x-0 bg-black/60 text-[7px] text-white text-center py-0.5 font-bold uppercase tracking-wider">OpenCV Edges</div>
                    </div>
                  )}
                </div>

                {opencvStats && (
                  <p className="text-[10px] text-primary/80 font-mono font-bold text-center bg-primary/5 py-1 rounded-lg">
                    ⚙️ OpenCV Check: {opencvStats}
                  </p>
                )}

                {/* Validation Results overlay */}
                {isValidatingImage && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col items-center justify-center gap-2">
                    <Loader2 size={20} className="text-primary animate-spin" />
                    <p className="text-xs font-bold text-blue-700">Validating image with Gemini AI...</p>
                    <p className="text-[9px] text-blue-500">Checking category relevance to: {category}</p>
                  </div>
                )}

                {imageValidationError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-left flex gap-2">
                    <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-red-800">Image Validation Failed</p>
                      <p className="text-[10px] text-red-600 mt-0.5 leading-relaxed">{imageValidationError}</p>
                    </div>
                  </div>
                )}

                {imageIsValidated && (
                  <div className="p-3.5 bg-green-50 border border-green-200 rounded-2xl text-left flex gap-2 items-center">
                    <CheckCircle size={16} className="text-green-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-green-800">Validation Passed</p>
                      <p className="text-[10px] text-green-600 mt-0.5">Category matches! Advancing to description...</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); setOpencvEdgePreview(null); setOpencvStats(null); setImageValidationError(null); setImageIsValidated(false); }}
                    className="flex-1 py-3 bg-secondary text-foreground text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 font-semibold">
                    <RotateCcw size={13} /> Retake
                  </button>
                  {imageIsValidated && (
                    <button onClick={() => setStep(2)}
                      className="flex-1 py-3 bg-primary text-white text-xs font-bold rounded-xl">
                      Continue
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 mb-2 mt-1">
                <button onClick={startLiveCamera}
                  className="py-8 bg-card border-2 border-dashed border-primary/20 rounded-2xl flex flex-col items-center justify-center gap-2 active-press transition-all hover:bg-primary/5">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Camera size={20} className="text-primary" />
                  </div>
                  <p className="text-xs font-bold text-foreground">Live Camera</p>
                  <p className="text-[9px] text-muted-foreground">Capture matching photo</p>
                </button>

                <button onClick={() => fileInputRef.current?.click()}
                  className="py-8 bg-card border-2 border-dashed border-primary/20 rounded-2xl flex flex-col items-center justify-center gap-2 active-press transition-all hover:bg-primary/5">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload size={20} className="text-primary" />
                  </div>
                  <p className="text-xs font-bold text-foreground">Local Folder</p>
                  <p className="text-[9px] text-muted-foreground">Upload from storage</p>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2 — Description (Voice Enabled) */}
        {step === 2 && (
          <div className="animate-fadeIn mt-2">
            <p className="text-sm text-muted-foreground mb-4">
              Describe the problem in your own words, or use voice.
            </p>

            {/* Mode tabs */}
            <div className="flex gap-2 mb-4 p-1 bg-secondary rounded-xl">
              {(["type", "speak"] as const).map((m) => (
                <button key={m} onClick={() => setDescMode(m)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    descMode === m ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                  }`}>
                  {m === "type" ? <Type size={13} /> : <Mic size={13} />}
                  {m === "type" ? "Type Description" : "Speak Voice"}
                </button>
              ))}
            </div>

            {/* Validate/transcribe loader */}
            {isValidatingImage && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col items-center justify-center gap-2 mb-4">
                <Loader2 size={18} className="text-primary animate-spin" />
                <p className="text-xs font-bold text-blue-700">Gemini transcribing voice recording...</p>
              </div>
            )}

            {descMode === "type" && (
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue clearly. e.g. 'Water pipe burst on main road, no supply for 3 days in our area.'"
                rows={5}
                className="w-full p-4 bg-secondary rounded-2xl text-xs text-foreground placeholder:text-muted-foreground resize-none outline-none border border-border focus:border-primary/40 transition-colors"
              />
            )}

            {descMode === "speak" && (
              <div className="flex flex-col items-center gap-4 py-6 bg-secondary rounded-2xl border border-border">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isRecording ? "bg-red-100 animate-pulse" : "bg-primary/10"
                }`}>
                  {isRecording ? <StopCircle size={22} className="text-red-500" /> : <Mic size={22} className="text-primary" />}
                </div>
                <div className="text-center px-4">
                  <p className="text-xs font-bold text-foreground">
                    {isRecording ? "Recording… speak clearly" : "Speak in your preferred language"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {isRecording ? "AI will transcribe details" : "Transcribes English, Hindi, Tamil, Telugu, etc."}
                  </p>
                </div>
                
                <button onClick={isRecording ? handleStopRecording : handleStartRecording}
                  className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                    isRecording ? "bg-red-500 text-white animate-pulse" : "bg-primary text-white"
                  }`} style={DF}>
                  {isRecording ? <StopCircle size={12} /> : <Mic size={12} />}
                  {isRecording ? "Stop Recording" : "Start Speaking"}
                </button>

                {description && (
                  <div className="w-full px-4 mt-2">
                    <p className="text-[10px] text-muted-foreground mb-1 font-semibold">Transcribed Text:</p>
                    <p className="text-xs text-foreground leading-relaxed bg-card p-3 rounded-xl border border-border max-h-24 overflow-y-auto">{description}</p>
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
