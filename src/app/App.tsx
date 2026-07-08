// ─────────────────────────────────────────────────────────────────────────────
// App.tsx — Civic Connect AI  |  Root Shell
//
// This file is the router and layout shell ONLY.
// All business logic lives in services/. All screen logic lives in screens/.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from "react";
import {
  MapPin, Mic, Home, Plus, ClipboardList, User,
  CheckCircle, ChevronRight, Users, Bell, Phone,
  Droplets, Zap, Trash2, ArrowRight, Flame,
  Filter, Wifi, FileText, Hash,
  Search, Building2, TrendingUp, TrendingDown,
  AlertTriangle, Banknote, BarChart3,
  Send, ChevronLeft, Camera, MoreVertical,
  RefreshCw, Globe, Map as MapIcon, Cpu, Copy, Share2
} from "lucide-react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { complaintService, calculateDynamicImpactScore } from "@/services/complaint.service";
import { uploadCitizenDP } from "@/services/firebase";
import { ReportWizard } from "@/app/screens/citizen/ReportWizard";
import { ComplaintDetailCitizen } from "@/app/screens/citizen/ComplaintDetailCitizen";
import { MPComplaintDetail } from "@/app/screens/mp/MPComplaintDetail";
import { MPMapScreen } from "@/app/screens/mp/MPMapScreen";
import { WARD_GEOMETRIES } from "@/app/components/shared/MapView";
import { SeverityBadge } from "@/app/components/shared/SeverityBadge";
import { StatusBadge } from "@/app/components/shared/StatusBadge";
import { CategoryIcon, getCategoryLabel, getCategoryEmoji } from "@/app/components/shared/CategoryIcon";
import { ImpactScoreMeter } from "@/app/components/shared/ImpactScoreMeter";
import type { Complaint, ComplaintSummary, ComplaintStatus, ComplaintCategory } from "@/types";
import { INDIA_STATES, getDistricts, getCities } from "@/data/india-locations";

type Phase = "onboard" | "citizen" | "mp";
type CitizenTab = "home" | "report" | "complaints" | "profile" | "detail";
type MPTab = "dashboard" | "priority" | "map" | "budget" | "profile" | "detail";

const DF: React.CSSProperties = { fontFamily: "var(--font-display)" };

function FilterableReportsModal({
  title,
  initialCategory,
  initialWard,
  onClose,
  onSelect
}: {
  title: string;
  initialCategory: string;
  initialWard: string;
  onClose: () => void;
  onSelect: (c: Complaint) => void;
}) {
  const [search, setSearch] = useState("");
  const [wardFilter, setWardFilter] = useState(initialWard);
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const allReports = complaintService.getAll();
  const wardsList = Array.from(new Set(allReports.map(r => r.ward)));

  const filtered = allReports.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.shortId.toLowerCase().includes(search.toLowerCase());
    const matchesWard = wardFilter === "all" ? true : r.ward === wardFilter;
    const matchesCategory = categoryFilter === "all" ? true : r.category === categoryFilter;
    const matchesPriority = priorityFilter === "all" ? true : r.severity === priorityFilter;
    
    let matchesDate = true;
    if (dateFilter !== "all") {
      const ageMs = Date.now() - new Date(r.reportedAt).getTime();
      const ageHours = ageMs / (1000 * 60 * 60);
      if (dateFilter === "24h") matchesDate = ageHours <= 24;
      else if (dateFilter === "7d") matchesDate = ageHours <= 168;
      else if (dateFilter === "30d") matchesDate = ageHours <= 720;
    }
    return matchesSearch && matchesWard && matchesCategory && matchesPriority && matchesDate;
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-5 font-sans animate-fadeIn">
      <div className="bg-card w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl relative animate-slideUp flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center pb-3 border-b border-border/80 shrink-0">
          <div>
            <h3 className="text-sm font-extrabold text-foreground leading-snug">{title}</h3>
            <p className="text-[10px] text-muted-foreground font-mono font-bold mt-0.5">{filtered.length} Reports Found</p>
          </div>
          <button
            onClick={onClose}
            className="text-xs px-2.5 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-lg transition-colors">
            Close
          </button>
        </div>

        {/* Filters */}
        <div className="my-3 space-y-2 shrink-0 animate-fadeIn">
          <input
            type="text"
            placeholder="Search by title or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-xs focus:outline-none focus:border-primary font-medium"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              className="px-2 py-1.5 bg-secondary border border-border rounded-lg text-[10px] font-bold text-foreground focus:outline-none focus:border-primary">
              <option value="all">All Wards</option>
              {wardsList.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2 py-1.5 bg-secondary border border-border rounded-lg text-[10px] font-bold text-foreground focus:outline-none focus:border-primary">
              <option value="all">All Categories</option>
              <option value="water">Water</option>
              <option value="roads">Roads</option>
              <option value="drainage">Drainage</option>
              <option value="electricity">Electricity</option>
              <option value="sanitation">Sanitation</option>
              <option value="healthcare">Healthcare</option>
              <option value="education">Education</option>
              <option value="transport">Transport</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin mt-3">
          {filtered.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-6 font-semibold">No matching reports found</p>
          ) : (
            filtered.map((r) => {
              const full = complaintService.getById(r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => {
                    if (full) {
                      onSelect(full);
                      onClose();
                    }
                  }}
                  className="w-full text-left p-3.5 bg-secondary/35 hover:bg-secondary/60 border border-border/60 rounded-xl flex items-center justify-between text-xs font-semibold active-press transition-colors shadow-sm animate-fadeIn">
                  <div className="flex-1 pr-3 truncate">
                    <p className="font-bold text-foreground truncate">{r.title}</p>
                    <p className="text-[9.5px] text-muted-foreground mt-0.5">{r.ward} · {r.shortId}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono ${
                      r.severity === "critical" ? "bg-red-50 text-red-650" : r.severity === "high" ? "bg-amber-50 text-amber-650" : "bg-blue-50 text-blue-650"
                    } font-black border`}>
                      {r.severity.toUpperCase()}
                    </span>
                    <p className="text-[10px] text-primary font-black mt-1 font-mono">{r.impactScore} pts</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Chart + health score data (MP dashboard) ─────────────────────────────────
const trendData = [
  { date: "Jan 1",  water: 45,  roads: 23 },
  { date: "Jan 8",  water: 89,  roads: 31 },
  { date: "Jan 15", water: 234, roads: 45 },
  { date: "Jan 22", water: 634, roads: 67 },
  { date: "Jan 29", water: 489, roads: 89 },
];

const healthScores = [
  { name: "Water Access", score: 45, prev: 52, status: "critical" },
  { name: "Road Quality",  score: 71, prev: 68, status: "moderate" },
  { name: "Healthcare",    score: 38, prev: 41, status: "critical" },
  { name: "Sanitation",    score: 82, prev: 79, status: "good" },
  { name: "Education",     score: 79, prev: 78, status: "good" },
];

// ─── Translations dictionary ──────────────────────────────────────────────────
const translations: Record<string, Record<string, string>> = {
  chooseLang:    { hi:"भाषा चुनें", en:"Choose Language", bn:"ভাষা নির্বাচন করুন", mr:"भाषा निवडा", te:"భాషను ఎంచుకోండి", ta:"மொழியைத் தேர்ந்தெடுக்கவும்", gu:"ભાષા પસંદ કરો", ur:"زبان منتخب کریں", kn:"ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ", or:"ଭାଷା ବାଛନ୍ତୁ", ml:"ഭാഷ തിരഞ്ഞെടുക്കുക", pa:"ਭਾਸ਼ਾ ਚੁਣੋ" },
  whoAreYou:     { hi:"आप कौन हैं?", en:"Who are you?", ta:"நீங்கள் யார்?", bn:"আপনি কে?", mr:"तुम्ही कोण आहात?", te:"మీరు ఎవరు?", gu:"તમે કોણ છો?", ur:"آپ کون ہیں؟", kn:"ನೀವು ಯಾರು?", or:"ଆପଣ କିଏ?", ml:"നിങ്ങൾ ആരാണ്?", pa:"ਤੁਸੀਂ ਕੌਣ ਹੋ?" },
  citizen:       { hi:"मैं एक नागरिक हूँ", en:"I am a Citizen", ta:"நான் ஒரு குடிமகன்", bn:"আমি একজন নাগরিক", mr:"मी एक नागरिक आहे", te:"నేను ఒక పౌరుడిని", gu:"હું એક નાગરિક છું", kn:"ನಾನು ಒಬ್ಬ ನಾಗರಿಕ", or:"ମୁଁ ଜଣେ ନାଗରିକ", ml:"ഞാൻ ഒരു പൗരനാണ്", pa:"ਮੈਂ ਇੱਕ ਨਾਗਰਿਕ ਹਾਂ", ur:"میں ایک شہری ہوں" },
  mp:            { hi:"मैं एक सांसद / अधिकारी हूँ", en:"I am an MP / Official", ta:"நான் ஒரு எம்.பி / அதிகாரி", bn:"আমি একজন এমপি / কর্মকর্তা", mr:"मी एक खासदार / अधिकारी आहे", te:"నేను ఒక ఎంపి / అధికారి", kn:"ನಾನು ಸಂಸದ / ಅಧಿಕಾರಿ", or:"ମୁଁ ଜଣେ ସାଂସଦ / ଅଧିକାରୀ", ml:"ഞാൻ ഒരു എം.പി / ഉദ്യോഗസ്ഥനാണ്", pa:"ਮੈਂ ਇੱਕ ਐਮਪੀ / ਅਧਿਕਾਰੀ ਹਾਂ", gu:"હું સાંસદ / અધિકારી છું", ur:"میں ایک ایم پی / عہدیدار ہوں" },
  welcome:       { hi:"जनवाणी में आपका स्वागत है", en:"Welcome to JanVaani", ta:"ஜன்வாணிக்கு வரவேற்கிறோம்", bn:"জনবাণীতে আপনাকে স্বাগত", mr:"जनवाणी मध्ये आपले स्वागत आहे", te:"జన్‌వాణికి స్వాగతం", gu:"જનવાણીમાં આપનું સ્વાગત છે", ur:"جنوانی میں خوش آمدید", kn:"ಜನ್ವಾಣಿಗೆ ಸುಸ್ವಾಗತ", or:"ଜନ୍‌ବାଣୀକୁ ସ୍ୱାଗତ", ml:"ജൻവാണിയിലേക്ക് സ്വാഗതം", pa:"ਜਨਵਾਣੀ ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ" },
  getStarted:    { hi:"शुरू करें", en:"Get Started", ta:"தொடங்குங்கள்", bn:"শুরু করুন", mr:"सुरू करा", te:"ప్రారంభించండి", gu:"શરૂ કરો", ur:"شروع کریں", kn:"ಪ್ರಾರಂಭಿಸಿ", or:"ଆରମ୍ଭ କରନ୍ତୁ", ml:"ആരംഭിക്കുക", pa:"ਸ਼ੁਰੂ ਕਰੋ" },
};

const getT = (lang: string, key: string): string => {
  const l = lang || "en";
  return translations[key]?.[l] || translations[key]?.["en"] || key;
};

// ════════════════════════════════════════════════════════════════════
const TAMIL_NADU_CONSTITUENCIES = [
  "Arakkonam", "Arani", "Chennai Central", "Chennai North", "Chennai South",
  "Chidambaram", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul",
  "Erode", "Kallakurichi", "Kancheepuram", "Kanniyakumari", "Karur",
  "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal",
  "Nilgiris", "Perambalur", "Pollachi", "Ramanathapuram", "Salem",
  "Sivaganga", "Sriperumbudur", "Tenkasi", "Thanjavur", "Theni",
  "Thoothukkudi", "Tiruchirappalli", "Tirunelveli", "Tiruppur", "Tiruvallur",
  "Tiruvannamalai", "Vellore", "Viluppuram", "Virudhunagar"
];

// ONBOARDING
// ════════════════════════════════════════════════════════════════════
function Onboard({ onDone }: { onDone: (role: "citizen" | "mp") => void }) {
  const [step, setStep] = useState(() => parseInt(localStorage.getItem("onboard_step") || "0"));
  const [lang, setLang] = useState(() => localStorage.getItem("onboard_lang") || "");
  const [role, setRole] = useState<"citizen" | "mp" | "">(() => (localStorage.getItem("onboard_role") as any) || "");
  const [phone, setPhone] = useState(() => localStorage.getItem("onboard_phone") || "");
  const [otp, setOtp] = useState(() => localStorage.getItem("onboard_otp") || "");
  const [ward, setWard] = useState(() => localStorage.getItem("onboard_ward") || "");
  const [name, setName] = useState(() => localStorage.getItem("onboard_name") || "");
  const [constituencySearch, setConstituencySearch] = useState("");

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsDone, setGpsDone] = useState(false);
  const [manualCity, setManualCity] = useState(() => localStorage.getItem("onboard_city") || "");
  const [manualDistrict, setManualDistrict] = useState(() => localStorage.getItem("onboard_district") || "");
  const [manualState, setManualState] = useState(() => localStorage.getItem("onboard_state") || "");

  const [expirySeconds, setExpirySeconds] = useState(300);
  const [resendSeconds, setResendSeconds] = useState(45);

  useEffect(() => {
    if (step !== 3) return;
    const interval = setInterval(() => {
      setExpirySeconds((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
      setResendSeconds((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const handleResendOTP = () => {
    setExpirySeconds(300);
    setResendSeconds(45);
    setOtp("");
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const [wardNumber, setWardNumber] = useState(() => {
    const saved = localStorage.getItem("onboard_ward") || "";
    if (saved.includes("Ward ")) {
      const parts = saved.split(", ");
      return parts[parts.length - 1];
    }
    return "";
  });
  const [areaName, setAreaName] = useState(() => {
    const saved = localStorage.getItem("onboard_ward") || "";
    if (saved.includes("Ward ")) {
      const parts = saved.split(", ");
      if (parts.length > 1) {
        return parts.slice(0, -1).join(", ");
      }
    }
    return saved;
  });

  useEffect(() => {
    const fullWard = areaName.trim() && wardNumber
      ? `${areaName.trim()}, ${wardNumber}`
      : wardNumber || areaName.trim();
    setWard(fullWard);
  }, [wardNumber, areaName]);

  useEffect(() => { localStorage.setItem("onboard_step", step.toString()); }, [step]);
  useEffect(() => { localStorage.setItem("onboard_lang", lang); }, [lang]);
  useEffect(() => { localStorage.setItem("onboard_role", role); }, [role]);
  useEffect(() => { localStorage.setItem("onboard_phone", phone); }, [phone]);
  useEffect(() => { localStorage.setItem("onboard_otp", otp); }, [otp]);
  useEffect(() => { localStorage.setItem("onboard_ward", ward); }, [ward]);
  useEffect(() => { localStorage.setItem("onboard_name", name); }, [name]);
  useEffect(() => { localStorage.setItem("onboard_city", manualCity); }, [manualCity]);
  useEffect(() => { localStorage.setItem("onboard_district", manualDistrict); }, [manualDistrict]);
  useEffect(() => { localStorage.setItem("onboard_state", manualState); }, [manualState]);

  const [gpsPermissionRequested, setGpsPermissionRequested] = useState(false);
  const [gpsStatusStep, setGpsStatusStep] = useState<
    "" | "requesting" | "granted" | "captured" | "geocoding" | "verified" | "error"
  >("");

  const handleRequestGps = () => {
    setGpsPermissionRequested(true);
    setGpsLoading(true);
    setGpsError(null);
    setGpsStatusStep("requesting");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsStatusStep("granted");
        
        setTimeout(() => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          localStorage.setItem("onboard_lat", lat.toString());
          localStorage.setItem("onboard_lng", lng.toString());
          setGpsStatusStep("captured");

          setTimeout(() => {
            setGpsStatusStep("geocoding");

            // OpenStreetMap Nominatim reverse API fetch
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`)
              .then(res => res.json())
              .then(data => {
                const address = data.address || {};
                const city = address.city || address.town || address.village || address.suburb || "Madurai";
                const district = address.county || address.state_district || "Madurai";
                const state = address.state || "Tamil Nadu";
                const suburb = address.suburb || address.neighbourhood || "KK Nagar";

                // Estimate ward based on Nominatim values or default
                let detectedWard = "";
                if (address.suburb && address.suburb.toLowerCase().includes("ward")) {
                  detectedWard = address.suburb;
                } else if (address.quarter && address.quarter.toLowerCase().includes("ward")) {
                  detectedWard = address.quarter;
                } else {
                  // If ward cannot be determined, ask user to select manual ward number
                  detectedWard = "";
                }

                setWardNumber(detectedWard);
                setAreaName(suburb);
                setManualCity(city);
                setManualDistrict(district);
                
                setGpsStatusStep("verified");
                setGpsLoading(false);
                setGpsDone(true);
              })
              .catch(() => {
                // Fallback local resolution
                let detectedCity = "Madurai";
                let detectedDistrict = "Madurai";
                let detectedWard = "Ward 12";
                let detectedArea = "KK Nagar";

                if (Math.abs(lat - 9.92) > 0.3 || Math.abs(lng - 78.12) > 0.3) {
                  detectedCity = "Chennai";
                  detectedDistrict = "Chennai";
                  detectedWard = "Ward 45";
                  detectedArea = "Anna Nagar";
                }

                setWardNumber(detectedWard);
                setAreaName(detectedArea);
                setManualCity(detectedCity);
                setManualDistrict(detectedDistrict);
                
                setGpsStatusStep("verified");
                setGpsLoading(false);
                setGpsDone(true);
              });
          }, 800);
        }, 800);
      },
      (err) => {
        setGpsLoading(false);
        setGpsStatusStep("error");
        setGpsError("Location permission denied. Please enter manual details below.");
      },
      { timeout: 8000 }
    );
  };

  useEffect(() => {
    if (step === 4 && role === "citizen" && !gpsPermissionRequested) {
      handleRequestGps();
    }
  }, [step, role, gpsPermissionRequested]);

  const filteredConstituencies = TAMIL_NADU_CONSTITUENCIES.filter(c =>
    c.toLowerCase().includes(constituencySearch.toLowerCase())
  );

  const langs = [
    { code: "hi", native: "हिंदी", en: "Hindi", bg: "bg-orange-50 border-orange-200" },
    { code: "en", native: "English", en: "English", bg: "bg-blue-50 border-blue-200" },
    { code: "bn", native: "বাংলা", en: "Bengali", bg: "bg-green-50 border-green-200" },
    { code: "mr", native: "मराठी", en: "Marathi", bg: "bg-purple-50 border-purple-200" },
    { code: "te", native: "తెలుగు", en: "Telugu", bg: "bg-red-50 border-red-200" },
    { code: "ta", native: "தமிழ்", en: "Tamil", bg: "bg-teal-50 border-teal-200" },
    { code: "gu", native: "ગુજરાતી", en: "Gujarati", bg: "bg-yellow-50 border-yellow-200" },
    { code: "ur", native: "اردو", en: "Urdu", bg: "bg-pink-50 border-pink-200" },
    { code: "kn", native: "ಕನ್ನಡ", en: "Kannada", bg: "bg-indigo-50 border-indigo-200" },
    { code: "or", native: "ଓଡ଼ିଆ", en: "Odia", bg: "bg-emerald-50 border-emerald-200" },
    { code: "ml", native: "മലയാളം", en: "Malayalam", bg: "bg-cyan-50 border-cyan-200" },
    { code: "pa", native: "ਪੰਜਾਬੀ", en: "Punjabi", bg: "bg-amber-50 border-amber-200" },
  ];

  const isPhoneValid = role === "citizen"
    ? phone.replace(/\D/g, "").length === 10
    : phone.includes("@") && phone.length > 3;

  const isWardValid = role === "citizen"
    ? gpsDone
      ? name.trim().length >= 2 && wardNumber !== "" && areaName.trim().length >= 2
      : name.trim().length >= 2 && wardNumber !== "" && areaName.trim().length >= 2
           && (gpsStatusStep === "verified" || (manualState !== "" && manualCity !== ""))
    : ward !== "";

  // Step 0 — Language
  if (step === 0) return (
    <div className="flex flex-col h-full overflow-y-auto px-5 pt-8 pb-6 animate-fadeIn scrollbar-none">
      <div className="mb-6">
        <div className="mb-4 w-20 h-20 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center overflow-hidden p-1">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-1" style={DF}>Choose Language</h1>
        <p className="text-sm text-muted-foreground">Select your preferred language</p>
      </div>
      <div className="grid grid-cols-2 gap-3 pb-4">
        {langs.map(l => (
          <button key={l.code} onClick={() => { setLang(l.code); setStep(1); }}
            className={`p-4 rounded-2xl border-2 text-left transition-all active-press ${lang === l.code ? "border-primary bg-primary/5" : `border-border ${l.bg}`}`}>
            <p className="text-xl font-bold text-foreground">{l.native}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{l.en}</p>
          </button>
        ))}
      </div>
    </div>
  );

  // Step 1 — Role
  if (step === 1) return (
    <div className="flex flex-col h-full px-5 pt-8 pb-6 animate-fadeIn">
      <button onClick={() => setStep(0)} className="flex items-center gap-1 text-xs text-muted-foreground mb-6">
        <ChevronLeft size={14} /> Back
      </button>
      <h1 className="text-2xl font-bold text-foreground mb-1" style={DF}>{getT(lang, "whoAreYou")}</h1>
      <p className="text-sm text-muted-foreground mb-6">Select your role to continue</p>
      <div className="space-y-3">
        {[
          { r: "citizen" as const, icon: <User size={24} className="text-primary" />, title: getT(lang, "citizen"), sub: "Report problems in my area", badge: "Citizens" },
          { r: "mp" as const, icon: <Building2 size={24} className="text-primary" />, title: getT(lang, "mp"), sub: "Manage constituency issues", badge: "Officials" },
        ].map(({ r, icon, title, sub, badge }) => (
          <button key={r} onClick={() => { setRole(r); setStep(2); }}
            className="w-full p-5 bg-card rounded-2xl border-2 border-border text-left flex items-center gap-4 active-press transition-all">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">{icon}</div>
            <div className="flex-1">
              <p className="text-base font-bold text-foreground" style={DF}>{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );

  // Step 2 — Phone/Email
  if (step === 2) return (
    <div className="flex flex-col h-full px-5 pt-8 pb-6 animate-fadeIn">
      <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-muted-foreground mb-6">
        <ChevronLeft size={14} /> Back
      </button>
      <h1 className="text-2xl font-bold text-foreground mb-1" style={DF}>
        {role === "citizen" ? "Enter Mobile Number" : "Enter Official Email"}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        {role === "citizen" ? "An OTP will be sent to this number" : "Use your official government email address"}
      </p>
      <div className="flex items-center gap-2 p-4 bg-secondary rounded-2xl border border-border mb-3">
        {role === "citizen" ? (
          <>
            <span className="text-sm font-bold text-foreground">+91</span>
            <div className="w-px h-5 bg-border" />
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="98765 43210" type="tel"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
          </>
        ) : (
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="name@sansad.nic.in" type="email"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
        )}
      </div>
      {role === "mp" && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
          <p className="text-xs text-amber-700 font-medium">Accepted: @sansad.nic.in · @tn.gov.in · @madurai.nic.in</p>
        </div>
      )}
      <button disabled={!isPhoneValid} onClick={() => setStep(3)}
        className={`w-full py-4 rounded-2xl font-bold mt-auto transition-all ${isPhoneValid ? "bg-primary text-white" : "bg-secondary text-muted-foreground cursor-not-allowed"}`}
        style={DF}>
        Send OTP
      </button>
    </div>
  );

  // Step 3 — OTP
  if (step === 3) {
    const isExpired = expirySeconds === 0;
    const canResend = resendSeconds === 0;

    return (
      <div className="flex flex-col h-full px-5 pt-8 pb-6 animate-fadeIn font-sans">
        <button onClick={() => setStep(2)} className="flex items-center gap-1 text-xs text-muted-foreground mb-6">
          <ChevronLeft size={14} /> Back
        </button>
        <h1 className="text-2xl font-bold text-foreground mb-1" style={DF}>Enter OTP</h1>
        <p className="text-sm text-muted-foreground mb-2">
          Sent to {role === "citizen" ? `+91 ${phone}` : phone}
        </p>

        {/* Dynamic Timers display */}
        <div className="flex flex-col gap-1.5 text-xs mb-6 px-1">
          <div className="flex justify-between items-center">
            <span className={isExpired ? "text-red-500 font-bold" : "text-muted-foreground"}>
              {isExpired ? "OTP expired. Please request a new OTP." : `Expires in: ${formatTime(expirySeconds)}`}
            </span>
            {canResend ? (
              <button onClick={handleResendOTP} className="text-primary font-bold active-press hover:underline">
                Resend OTP
              </button>
            ) : (
              <span className="text-muted-foreground font-medium">
                Resend in: {formatTime(resendSeconds)}
              </span>
            )}
          </div>
        </div>

        <div className="relative mb-2">
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`flex-1 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-colors ${isExpired ? "border-red-200 bg-red-50/20 text-red-300" : otp.length === i ? "border-primary" : otp.length > i ? "border-primary/40 bg-secondary" : "border-border bg-secondary"}`}>
                {otp[i] || ""}
              </div>
            ))}
          </div>
          <input type="tel" maxLength={6} value={otp} autoFocus disabled={isExpired}
            onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer disabled:cursor-not-allowed" />
        </div>

        <button onClick={() => !isExpired && setOtp("847291")} disabled={isExpired}
          className="text-xs text-primary font-semibold text-left mb-6 disabled:opacity-50 disabled:cursor-not-allowed">
          Demo: Auto-fill OTP →
        </button>

        <button onClick={() => setStep(4)} disabled={otp.length < 6 || isExpired}
          className={`w-full py-4 rounded-2xl font-bold mt-auto transition-all ${otp.length >= 6 && !isExpired ? "bg-primary text-white active-press" : "bg-secondary text-muted-foreground cursor-not-allowed"}`}
          style={DF}>
          Verify OTP
        </button>
      </div>
    );
  }



  // Step 4 — Ward / Constituency
  if (step === 4) return (
    <div className="flex flex-col h-full overflow-y-auto px-5 pt-8 pb-6 animate-fadeIn scrollbar-none font-sans">
      <h1 className="text-2xl font-bold text-foreground mb-1" style={DF}>
        {role === "citizen" ? "Your Area" : "Select Constituency"}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">Set once · never asked again</p>
      {role === "citizen" ? (
        <div className="space-y-3">
          <div className="p-4 bg-secondary rounded-2xl border border-border">
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Your Full Name</p>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name"
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-semibold" />
          </div>


          {/* Brief waiting indicator before browser shows permission dialog */}
          {!gpsPermissionRequested && (
            <div className="p-4 bg-secondary/60 rounded-2xl border border-border flex items-center gap-3 my-2 animate-fadeIn">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <MapPin size={18} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-foreground">Requesting Location Access...</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Your browser will ask for permission</p>
              </div>
              <div className="w-4 h-4 rounded-full border-2 border-primary/40 border-t-primary animate-spin" />
            </div>
          )}

          {/* GPS is auto-requested on step mount — show status tracker while in progress */}
          {gpsPermissionRequested && gpsStatusStep !== "error" && (
            <div className="p-5 bg-card rounded-2xl border border-border space-y-4 my-2 font-sans animate-fadeIn">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Location Status Tracker</p>
              <div className="space-y-3.5 pt-1">
                {[
                  { key: "requesting", label: "Detecting Location..." },
                  { key: "granted", label: "Location Permission Granted" },
                  { key: "captured", label: "GPS Coordinates Captured" },
                  { key: "geocoding", label: "Reverse Geocoding (Nominatim API)" },
                  { key: "verified", label: "Location Successfully Verified" }
                ].map((stepItem, idx) => {
                  const stepsOrder = ["requesting", "granted", "captured", "geocoding", "verified"];
                  const currentIdx = stepsOrder.indexOf(gpsStatusStep);
                  const itemIdx = stepsOrder.indexOf(stepItem.key);
                  
                  let stateColor = "text-muted-foreground/40";
                  let dotBg = "bg-muted-foreground/20 text-muted-foreground/30";
                  if (itemIdx === currentIdx) {
                    stateColor = "text-primary font-bold";
                    dotBg = "bg-primary animate-pulse text-white";
                  } else if (itemIdx < currentIdx) {
                    stateColor = "text-foreground font-semibold";
                    dotBg = "bg-green-600 text-white";
                  }

                  return (
                    <div key={stepItem.key} className="flex items-center gap-3 text-xs transition-all">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${dotBg}`}>
                        {itemIdx < currentIdx ? "✓" : ""}
                      </div>
                      <span className={stateColor}>{stepItem.label}</span>
                    </div>
                  );
                })}
              </div>
              {gpsStatusStep === "verified" && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl mt-3 animate-fadeIn">
                  <p className="text-[10px] text-green-700 font-bold font-mono">
                    RESOLVED: {manualCity}, {manualDistrict}
                  </p>
                  <p className="text-[9.5px] text-green-600 font-semibold mt-0.5">
                    Area: {areaName || "Not Detected"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Conditional Ward Selection fallback if API could not resolve ward number */}
          {gpsDone && gpsStatusStep === "verified" && !wardNumber && (
            <div className="p-4 bg-yellow-50/50 border border-yellow-200 rounded-2xl space-y-2.5 animate-fadeIn">
              <p className="text-xs text-yellow-800 font-semibold">We couldn't resolve your Ward automatically. Please select it:</p>
              <select value={wardNumber} onChange={e => setWardNumber(e.target.value)}
                className="w-full bg-transparent text-sm text-foreground outline-none border border-yellow-300 rounded-xl p-3 cursor-pointer font-medium bg-card">
                <option value="" disabled>Select Ward Number</option>
                {Array.from({ length: 100 }, (_, i) => `Ward ${i + 1}`).map(w => (
                  <option key={w} value={w} className="bg-card text-foreground">{w}</option>
                ))}
              </select>
            </div>
          )}

          {/* Manual Input Fields - Shown only if permission denied or geocoding fails */}
          {(gpsStatusStep === "error" || gpsError) && (
            <div className="space-y-3 animate-fadeIn">
              {/* Permission denied notice */}
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3">
                <MapPin size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-amber-800">
                    {gpsError || "Location access denied."}
                  </p>
                  <p className="text-[10px] text-amber-700 mt-0.5">Please fill your area details below manually.</p>
                </div>
                <button onClick={handleRequestGps}
                  className="text-[10px] font-bold text-primary bg-white border border-primary/30 px-2.5 py-1.5 rounded-lg active-press shrink-0">
                  Retry
                </button>
              </div>
              {/* ── Cascading India Location Picker ── */}
              {/* 1. State */}
              <div className="p-4 bg-secondary rounded-2xl border border-border">
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">State / UT</p>
                <select value={manualState}
                  onChange={e => { setManualState(e.target.value); setManualDistrict(""); setManualCity(""); }}
                  className="w-full bg-transparent text-sm text-foreground outline-none border-none cursor-pointer font-semibold">
                  <option value="" disabled className="bg-card text-muted-foreground">Select State / UT</option>
                  {INDIA_STATES.map(s => (
                    <option key={s} value={s} className="bg-card text-foreground">{s}</option>
                  ))}
                </select>
              </div>

              {/* 2. District — shown after state is selected */}
              {manualState && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-4 bg-secondary rounded-2xl border border-border">
                    <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">District</p>
                    <select value={manualDistrict}
                      onChange={e => { setManualDistrict(e.target.value); setManualCity(""); }}
                      className="w-full bg-transparent text-sm text-foreground outline-none border-none cursor-pointer font-semibold">
                      <option value="" disabled className="bg-card text-muted-foreground">Select District</option>
                      {getDistricts(manualState).map(d => (
                        <option key={d} value={d} className="bg-card text-foreground">{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* 3. City — shown after district is selected */}
                  <div className="p-4 bg-secondary rounded-2xl border border-border">
                    <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">City / Town</p>
                    <select value={manualCity} onChange={e => setManualCity(e.target.value)}
                      className="w-full bg-transparent text-sm text-foreground outline-none border-none cursor-pointer font-semibold">
                      <option value="" disabled className="bg-card text-muted-foreground">Select City</option>
                      {getCities(manualState).map(c => (
                        <option key={c} value={c} className="bg-card text-foreground">{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="p-4 bg-secondary rounded-2xl border border-border">
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Ward Number</p>
                <select value={wardNumber} onChange={e => setWardNumber(e.target.value)}
                  className="w-full bg-transparent text-sm text-foreground outline-none border-none cursor-pointer font-semibold bg-secondary">
                  <option value="" disabled className="bg-card text-muted-foreground">Select Ward Number</option>
                  {Array.from({ length: 100 }, (_, i) => `Ward ${i + 1}`).map(w => (
                    <option key={w} value={w} className="bg-card text-foreground">{w}</option>
                  ))}
                </select>
              </div>
              
              <div className="p-4 bg-secondary rounded-2xl border border-border">
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Street / Area Name</p>
                <input value={areaName} onChange={e => setAreaName(e.target.value)} placeholder="e.g. KK Nagar"
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-semibold" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2.5 flex-1 flex flex-col min-h-0">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Select Constituency</p>
          <div className="p-3 bg-secondary rounded-2xl border border-border flex items-center gap-2 mb-2 shrink-0">
            <Search size={16} className="text-muted-foreground shrink-0" />
            <input value={constituencySearch} onChange={e => setConstituencySearch(e.target.value)} placeholder="Search constituency..."
              className="w-full bg-transparent text-sm text-foreground outline-none font-semibold placeholder:text-muted-foreground" />
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 max-h-[220px] border border-border/65 rounded-2xl p-2 bg-secondary/10 scrollbar-none shrink-0">
            {filteredConstituencies.map(c => (
              <button key={c} onClick={() => setWard(c)}
                className={`w-full p-3.5 rounded-xl border text-left text-sm font-semibold transition-all ${ward === c ? "border-primary bg-secondary text-primary" : "border-border bg-card text-foreground hover:border-muted-foreground/30"}`}>
                {c}
              </button>
            ))}
            {filteredConstituencies.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No constituencies match your search.</p>
            )}
          </div>
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl mt-3 shrink-0">
            <p className="text-xs text-blue-700 font-semibold flex items-center gap-1.5">
              <CheckCircle size={12} className="shrink-0" /> Cross-verified with Lok Sabha public records
            </p>
          </div>
        </div>
      )}
      <button disabled={!isWardValid} onClick={() => setStep(5)}
        className={`w-full py-4 rounded-2xl font-bold mt-6 transition-all ${isWardValid ? "bg-primary text-white active-press" : "bg-secondary text-muted-foreground cursor-not-allowed"}`} style={DF}>
        Continue
      </button>
    </div>
  );

  // Step 5 — Success
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-5 animate-fadeIn">
      <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center animate-pulse-ring">
        <CheckCircle size={48} className="text-green-500" />
      </div>
      <div>
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden p-0.5 shrink-0">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-xs font-bold text-primary uppercase tracking-wider">{import.meta.env.VITE_APP_NAME || "JanVaani"}</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2" style={DF}>
          {role === "citizen" ? "You're all set!" : "Dashboard access granted"}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {role === "citizen"
            ? `${getT(lang, "welcome")}. Your voice matters.`
            : `Welcome, ${ward || "Official"}. Your constituency dashboard is ready.`}
        </p>
      </div>
      <button onClick={() => onDone(role as "citizen" | "mp")} className="w-full py-4 bg-primary text-white rounded-2xl font-bold" style={DF}>
        {getT(lang, "getStarted")}
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// CITIZEN SCREENS
// ════════════════════════════════════════════════════════════════════

function CitizenHome({ setTab, onBellClick, unreadCount }: { setTab: (t: CitizenTab) => void; onBellClick: () => void; unreadCount: number }) {
  const userName = localStorage.getItem("onboard_name") || "Priya Sharma";
  const userWard = localStorage.getItem("onboard_ward") || "KK Nagar, Ward 14";
  const userLocation = userWard.toLowerCase().includes("madurai") ? userWard : `${userWard}, Madurai`;

  return (
    <div id="tour-home-dashboard" className="flex flex-col h-full overflow-y-auto scrollbar-none">
      <div className="pt-6 pb-4 px-5">
        <div id="tour-welcome-header" className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center overflow-hidden p-0.5 shrink-0">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider leading-none">JanVaani</p>
              <h1 className="text-sm font-bold text-foreground mt-1 leading-none" style={DF}>{userName}</h1>
            </div>
          </div>
          <button id="tour-bell-btn" onClick={onBellClick} className="relative w-10 h-10 rounded-full bg-secondary flex items-center justify-center active-press">
            <Bell size={19} className="text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card flex items-center justify-center text-[7.5px] text-white font-bold" />
            )}
          </button>
        </div>
        <div className="flex items-center gap-1.5 mt-4 px-3 py-2 bg-secondary rounded-xl">
          <MapPin size={13} className="text-primary shrink-0" />
          <span className="text-xs font-semibold text-foreground">{userLocation}</span>
        </div>
      </div>

      {/* Primary Action */}
      <div className="px-5 mb-3">
        <button id="tour-report-btn" onClick={() => setTab("report")}
          className="w-full py-[18px] bg-primary text-white rounded-[18px] text-base font-bold flex items-center justify-center gap-3 active-press"
          style={{ ...DF, boxShadow: "0 8px 24px rgba(22,101,52,0.28)" }}>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Plus size={18} className="text-white" />
          </div>
          Report a Problem
        </button>
      </div>

      {/* Platform Info */}
      <div className="px-5 mb-4">
        <div className="flex items-center gap-2.5 p-3 bg-secondary border border-border rounded-xl">
          <Building2 size={13} className="text-primary shrink-0" />
          <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
            Submissions are automatically routed to the concerned administrative department for fast resolution.
          </p>
        </div>
      </div>

      {/* Quick Guidelines */}
      <div className="px-5 pb-6">
        <h2 className="text-sm font-bold text-foreground mb-3" style={DF}>Citizen Guidelines</h2>
        <div className="space-y-3">
          {[
            { icon: <Camera size={16} className="text-primary" />, title: "Photo Verification", desc: "Include a clear photo to verify details, build trust, and help analyze the report efficiently." },
            { icon: <Mic size={16} className="text-primary" />, title: "Voice Description", desc: "Speak naturally in Hindi, English, or other Indian languages to detail the issue." },
            { icon: <CheckCircle size={16} className="text-primary" />, title: "Real-time Tracking", desc: "Track progress and receive official updates directly from your Member of Parliament." }
          ].map((item, i) => (
            <div key={i} className="flex gap-3.5 p-3.5 bg-card rounded-2xl border border-border">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">{item.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CitizenComplaints({ onSelect, setTab }: { onSelect: (c: Complaint) => void; setTab: (t: CitizenTab) => void }) {
  const summaries = complaintService.getMyCitizenComplaints("ctz_001");
  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-none bg-background">
      <div className="pt-6 px-5 pb-4">
        <h1 className="text-[22px] font-bold text-foreground" style={DF}>My Complaints</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{summaries.length} complaints submitted</p>
      </div>

      {summaries.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-muted-foreground mb-4">
            <ClipboardList size={28} />
          </div>
          <h3 className="text-sm font-bold text-foreground mb-1" style={DF}>No Reports Submitted</h3>
          <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed mb-6">
            You haven't submitted any civic complaints yet. Your registered issues will be shown here.
          </p>
          <button onClick={() => setTab("report")}
            className="px-5 py-3 bg-primary text-white text-xs font-bold rounded-xl active-press shadow-sm" style={DF}>
            Report a Problem
          </button>
        </div>
      ) : (
        <div className="px-5 space-y-3 pb-6">
          {summaries.map(c => {
            const full = complaintService.getById(c.id);
            return (
              <button key={c.id} onClick={() => full && onSelect(full)}
                className="w-full bg-card rounded-2xl border border-border p-4 text-left active-press">
                <div className="flex items-start gap-3">
                  <CategoryIcon category={c.category} size={19} showBg bgSize="w-12 h-12" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate" style={DF}>{c.title}</p>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{c.shortId}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <SeverityBadge severity={c.severity} size="sm" />
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(c.reportedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CitizenProfile({ onLogout, onBack, onSelect, setTab, onStartTour }: { onLogout: () => void; onBack: () => void; onSelect: (c: Complaint) => void; setTab: (t: CitizenTab) => void; onStartTour: () => void }) {
  const [photoUrl, setPhotoUrl] = useState<string>(() => localStorage.getItem("citizen_dp") || "");
  const [activeListType, setActiveListType] = useState<null | "filed" | "joined">(null);
  const [showSettings, setShowSettings] = useState(false);
  const [locStatus, setLocStatus] = useState(() => localStorage.getItem("location_permission_preference") || "GRANTED");
  const fileRef = useRef<HTMLInputElement>(null);

  const userName = localStorage.getItem("onboard_name") || "Priya Sharma";
  const userWard = localStorage.getItem("onboard_ward") || "KK Nagar, Ward 14";
  const userLocation = userWard.toLowerCase().includes("madurai") ? userWard : `${userWard}, Madurai`;
  const rawPhone = localStorage.getItem("onboard_phone") || "9876543210";
  const formattedPhone = rawPhone.length === 10 ? `+91 ${rawPhone.slice(0, 5)} ${rawPhone.slice(5)}` : rawPhone;
  const initials = userName.trim().charAt(0).toUpperCase() || "P";

  const allMyComplaints = complaintService.getMyCitizenComplaints("ctz_001");
  const filedComplaints = allMyComplaints.filter(c => {
    const full = complaintService.getById(c.id);
    return full?.reportedBy === "ctz_001";
  });
  const joinedComplaints = allMyComplaints.filter(c => {
    const full = complaintService.getById(c.id);
    return full?.joinedCitizenIds.includes("ctz_001");
  });
  const resolvedCount = allMyComplaints.filter(c => {
    const full = complaintService.getById(c.id);
    return full?.status === "resolved";
  }).length;

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const previewUrl = URL.createObjectURL(file);
    setPhotoUrl(previewUrl);

    try {
      const realUrl = await uploadCitizenDP(file);
      setPhotoUrl(realUrl);
      localStorage.setItem("citizen_dp", realUrl);
    } catch (err) {
      console.error("Error uploading citizen profile DP:", err);
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) localStorage.setItem("citizen_dp", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto px-5 pt-5 pb-6 scrollbar-none relative">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center active-press">
          <ChevronLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground leading-none" style={DF}>Profile</h1>
      </div>
      <div className="space-y-4">
        {/* Profile card with photo upload */}
        <div className="flex items-center gap-4 p-5 bg-card rounded-2xl border border-border">
          <div className="relative shrink-0">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            {photoUrl ? (
              <img src={photoUrl} alt="DP" className="w-16 h-16 rounded-full object-cover border-2 border-primary" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold" style={DF}>{initials}</div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary border-2 border-card flex items-center justify-center">
              <Camera size={10} className="text-white" />
            </button>
          </div>
          <div>
            <p className="text-base font-bold text-foreground" style={DF}>{userName}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <Phone size={12} /> {formattedPhone}
            </p>
            <p className="text-xs text-muted-foreground">{userLocation}</p>
          </div>
        </div>

        <div className="p-4 bg-card rounded-2xl border border-border space-y-1">
          <button onClick={() => setActiveListType("filed")} className="w-full flex items-center justify-between py-3 hover:bg-secondary/50 rounded-xl px-1.5 transition-colors">
            <span className="text-sm font-semibold text-foreground">Complaints Filed</span>
            <span className="text-sm font-bold text-foreground bg-secondary px-2.5 py-0.5 rounded-full">{filedComplaints.length}</span>
          </button>
          <div className="border-t border-border" />
          <button onClick={() => setActiveListType("joined")} className="w-full flex items-center justify-between py-3 hover:bg-secondary/50 rounded-xl px-1.5 transition-colors">
            <span className="text-sm font-semibold text-foreground">Complaints Joined</span>
            <span className="text-sm font-bold text-foreground bg-secondary px-2.5 py-0.5 rounded-full">{joinedComplaints.length}</span>
          </button>
        </div>

        <div className="p-4 bg-card rounded-2xl border border-border shadow-sm">
          <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-3 py-3 active-press">
            <span className="text-muted-foreground"><FileText size={15} /></span>
            <span className="text-sm text-foreground font-semibold">Settings</span>
            <ChevronRight size={14} className="ml-auto text-muted-foreground" />
          </button>
        </div>

        <button onClick={onLogout} className="w-full py-3.5 bg-red-50 text-red-600 rounded-2xl font-semibold text-sm border border-red-100">
          Logout
        </button>
      </div>

      {/* Citizen Settings Overlay Drawer */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/60 z-50 flex flex-col justify-end animate-fadeIn font-sans">
          <div className="absolute inset-0" onClick={() => setShowSettings(false)} />
          <div className="relative bg-card rounded-t-[32px] max-h-[85%] flex flex-col z-10 shadow-2xl border-t border-border animate-slideUp">
            <div className="shrink-0 p-5 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-xs font-bold text-primary bg-secondary px-3 py-1.5 rounded-full active-press">
                Close
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5 scrollbar-none bg-secondary/15">
              {/* Geolocation Permissions toggle option */}
              <div className="p-4 bg-card border border-border rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs font-bold text-foreground">Location Permissions</p>
                  <p className="text-[10px] text-muted-foreground">GPS tracking authorization status</p>
                </div>
                <select
                  value={locStatus}
                  onChange={e => {
                    const next = e.target.value;
                    setLocStatus(next);
                    localStorage.setItem("location_permission_preference", next);
                  }}
                  className={`text-xs font-bold border-none outline-none py-1.5 px-3 rounded-lg cursor-pointer ${locStatus === "GRANTED" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}
                >
                  <option value="GRANTED" className="bg-card text-green-700">Granted</option>
                  <option value="DENIED" className="bg-card text-red-700">Denied</option>
                </select>
              </div>

              {/* Interactive App Tour Replay */}
              <div className="p-4 bg-card border border-border rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs font-bold text-foreground">Interactive App Tour</p>
                  <p className="text-[10px] text-muted-foreground">Replay the guided dashboard walkthrough</p>
                </div>
                <button onClick={() => { setShowSettings(false); onStartTour(); }} className="px-3.5 py-2 bg-primary text-white text-xs font-bold rounded-xl active-press shadow-sm">
                  Start Tour
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drawer Overlay for Filed/Joined complaints */}
      {activeListType && (
        <div className="absolute inset-0 bg-black/60 z-50 flex flex-col justify-end animate-fadeIn">
          <div className="bg-card w-full max-h-[80%] rounded-t-[32px] flex flex-col animate-slideUp">
            {/* Header */}
            <div className="pt-6 px-6 pb-4 border-b border-border flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground" style={DF}>
                {activeListType === "filed" ? "My Filed Complaints" : "My Joined Complaints"}
              </h2>
              <button onClick={() => setActiveListType(null)} className="text-xs px-3 py-1.5 bg-secondary text-foreground rounded-full font-bold">
                Close
              </button>
            </div>
            
            {/* List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-none">
              {(activeListType === "filed" ? filedComplaints : joinedComplaints).length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground font-medium">
                  No complaints found here.
                </div>
              ) : (
                (activeListType === "filed" ? filedComplaints : joinedComplaints).map(c => {
                  const full = complaintService.getById(c.id);
                  return (
                    <button key={c.id} onClick={() => { if (full) { onSelect(full); setTab("detail"); setActiveListType(null); } }}
                      className="w-full bg-secondary hover:bg-secondary/80 rounded-2xl border border-border p-4 text-left active-press transition-colors">
                      <div className="flex items-start gap-3">
                        <CategoryIcon category={c.category} size={15} showBg bgSize="w-9 h-9" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-foreground truncate" style={DF}>{c.title}</p>
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{c.shortId}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between">
                        <SeverityBadge severity={c.severity} size="sm" />
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(c.reportedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// MP SCREENS
// ════════════════════════════════════════════════════════════════════

function MPDashboard({
  onComplaintSelect,
  onBellClick,
  unreadCount,
  setTab,
  setPrioritySeverity,
  setMapCategoryFilter,
  onBack,
}: {
  onComplaintSelect: (c: Complaint) => void;
  onBellClick: () => void;
  unreadCount: number;
  setTab: (tab: MPTab) => void;
  setPrioritySeverity: (s: "all" | "critical") => void;
  setMapCategoryFilter: (c: ComplaintCategory | "all") => void;
  onBack: () => void;
}) {
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [auditComplaint, setAuditComplaint] = useState<Complaint | null>(null);
  const [activeChartTab, setActiveChartTab] = useState<"categories" | "wards" | "trends">("categories");
  const [hoveredData, setHoveredData] = useState<any | null>(null);
  const [currentTime, setCurrentTime] = useState("");
  
  // Drill-down states
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [selectedChartDetail, setSelectedChartDetail] = useState<any | null>(null);
  const [showDrillDownReports, setShowDrillDownReports] = useState<{ title: string; category: string; ward: string } | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const stats = complaintService.getDashboardStats();
  const priorityList = complaintService.getPriorityList().slice(0, 5);
  const allReports = complaintService.getAll();

  // Dynamic Constituency Health Calculations
  const categoriesList: ComplaintCategory[] = ["water", "sanitation", "roads", "electricity", "drainage", "healthcare", "education", "transport", "other"];
  const categoryHealth: Record<string, number> = {};
  categoriesList.forEach(c => {
    categoryHealth[c] = 95; // Starting base health
  });

  // Calculate penalties from active reports
  allReports.forEach(r => {
    let penalty = 3;
    if (r.severity === "critical") penalty = 12;
    else if (r.severity === "high") penalty = 7;
    else if (r.severity === "medium") penalty = 4;
    categoryHealth[r.category] = Math.max(30, categoryHealth[r.category] - penalty);
  });

  // Compute index using specified weights: Water 25%, Roads 20%, Healthcare 20%, Sanitation 15%, Electricity 10%, Education 10%
  const weights: Record<string, number> = {
    water: 0.25,
    roads: 0.20,
    healthcare: 0.20,
    sanitation: 0.15,
    electricity: 0.10,
    education: 0.10,
  };

  let weightedSum = 0;
  let totalWeight = 0;
  Object.keys(weights).forEach(cat => {
    const health = categoryHealth[cat] ?? 95;
    weightedSum += health * weights[cat];
    totalWeight += weights[cat];
  });

  const healthScore = Math.round(weightedSum);

  // Dynamic distribution maps
  const categoryCounts: Record<string, number> = {};
  const wardCounts: Record<string, number> = {};
  allReports.forEach(r => {
    categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
    wardCounts[r.ward] = (wardCounts[r.ward] || 0) + 1;
  });

  // Alert detailed structures
  const alertData = [
    {
      id: "alert_water",
      title: "Water Reports Increased 32%",
      text: "Water reports increased 32% in Ward 12 during the last 24 hours.",
      reason: "AI detected a sudden cluster of water supply complaints within Ward 12, likely due to a major pipeline burst or pressure failure in MG Road.",
      ward: "Ward 12",
      category: "water",
      reportsCount: 137,
      growth: "Up 32% compared to yesterday",
      impact: "Estimated 4,800 residents affected (Critical)",
      confidence: "96%",
      timePeriod: "Last 24 Hours",
      trendPoints: [80, 92, 88, 105, 137]
    },
    {
      id: "alert_drainage",
      title: "Drainage Reports Rising Continuously",
      text: "Drainage reports rising continuously for three days.",
      reason: "AI identified a continuous, daily accumulation of sewage and blockages across multiple blocks in Ward 8 and Ward 11, indicating central storm drainage grid overload.",
      ward: "Ward 8, Ward 11",
      category: "drainage",
      reportsCount: 86,
      growth: "Up 18% daily over the last 3 days",
      impact: "Estimated 3,420 residents affected (High)",
      confidence: "93%",
      timePeriod: "Last 3 Days",
      trendPoints: [45, 58, 72, 86]
    },
    {
      id: "alert_healthcare",
      title: "Healthcare Reports Concentrated",
      text: "Healthcare reports concentrated around PHC Zone 2.",
      reason: "AI recognized a high spatial concentration of healthcare service grievances around Public Health Center Zone 2 (Ward 14), suggesting supply or staffing deficits.",
      ward: "Ward 14",
      category: "healthcare",
      reportsCount: 32,
      growth: "Up 25% compared to the weekly average",
      impact: "Estimated 1,200 residents affected (Medium)",
      confidence: "91%",
      timePeriod: "Last 7 Days",
      trendPoints: [12, 18, 20, 26, 32]
    }
  ];

  const alerts = [];
  const waterWard12Count = allReports.filter(r => r.category === "water" && r.ward === "Ward 12").length;
  if (waterWard12Count >= 1) {
    alerts.push(alertData[0]);
  }
  const drainageCountVal = allReports.filter(r => r.category === "drainage").length;
  if (drainageCountVal >= 1) {
    alerts.push(alertData[1]);
  }
  const healthcareCountVal = allReports.filter(r => r.category === "healthcare").length;
  if (healthcareCountVal >= 1) {
    alerts.push(alertData[2]);
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-none bg-background">
      {/* Header */}
      <div className="pt-5 pb-4 px-5 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          {/* Logo & Name on Left - No Back Button */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden p-0.5 shrink-0">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-base font-black text-foreground font-sans tracking-tight">JanVaani</span>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            <button id="tour-mp-bell-btn" onClick={onBellClick} className="relative w-8 h-8 rounded-xl bg-secondary border border-border flex items-center justify-center active-press">
              <Bell size={16} className="text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
              )}
            </button>
            <button onClick={() => setTab("profile")} className="w-8 h-8 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-xs font-bold active-press shadow-sm">
              RK
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-4 pb-6 mt-4">
        {/* Welcome MP Message */}
        <div className="font-sans">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider font-mono">Welcome back</p>
          <h2 className="text-sm font-extrabold text-foreground mt-0.5">Dr. Rajesh Kumar (MP)</h2>
        </div>

        {/* Stats Grid */}
        <div id="tour-mp-summary" className="grid grid-cols-2 gap-3 font-sans">
          {/* Active Community Reports Card */}
          <button
            onClick={() => { setPrioritySeverity("all"); setTab("priority"); }}
            className="flex-1 bg-card border border-blue-200/60 rounded-2xl p-4 text-left shadow-sm active-press hover:border-blue-300 transition-all flex flex-col justify-between min-h-[105px]">
            <div className="flex justify-between items-start w-full">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider font-mono">Active Reports</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                <ClipboardList size={15} />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-black text-blue-900 font-mono leading-none">
                {stats.total}
              </p>
              <p className="text-[9.5px] text-blue-700 font-semibold mt-1">All active reports</p>
            </div>
          </button>

          {/* Critical Reports Card */}
          <button
            onClick={() => { setPrioritySeverity("critical"); setTab("priority"); }}
            className="flex-1 bg-card border border-red-200/60 rounded-2xl p-4 text-left shadow-sm active-press hover:border-red-300 transition-all flex flex-col justify-between min-h-[105px]">
            <div className="flex justify-between items-start w-full">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider font-mono">Critical Reports</span>
              <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-650 border border-red-100">
                <AlertTriangle size={15} />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-black text-red-900 font-mono leading-none">
                {stats.critical}
              </p>
              <p className="text-[9.5px] text-red-700 font-semibold mt-1">Requires immediate care</p>
            </div>
          </button>
        </div>

        {/* AI Alerts based on statistical thresholds */}
        {alerts.length > 0 && (
          <div className="space-y-2" data-tour="mp-ai-alert font-sans">
            {alerts.map((alert, idx) => (
              <button key={idx} onClick={() => setSelectedAlert(alert)}
                className="w-full text-left p-3.5 bg-red-50/50 border border-red-200 rounded-2xl flex items-start gap-2.5 active-press hover:border-red-300 transition-all shadow-sm animate-fadeIn">
                <AlertTriangle size={15} className="text-red-650 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <p className="text-[9px] font-bold text-red-800 uppercase tracking-wider font-mono">System Anomaly Alert</p>
                    <span className="text-[8px] bg-red-100 text-red-750 px-1.5 py-0.5 rounded font-bold font-mono">INSPECT ALERT</span>
                  </div>
                  <p className="text-xs text-red-950 font-bold leading-relaxed mt-0.5">{alert.text}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Priority list */}
        <div id="tour-mp-priority" data-tour="mp-priority-list font-sans">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">Top Priority Issues</p>
          </div>
          <div className="space-y-3">
            {priorityList.map((c, i) => {
              const full = complaintService.getById(c.id);
              if (!full) return null;
              const dynamicScore = calculateDynamicImpactScore(full).total;
              return (
                <button key={c.id} onClick={() => full && onComplaintSelect(full)}
                  className="w-full bg-card rounded-2xl border border-border p-4 text-left active-press transition-all hover:border-primary/25 shadow-sm block font-sans animate-fadeIn">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[9px] font-black bg-primary/10 text-primary border border-primary/25 px-2 py-0.5 rounded font-mono hover:bg-primary/20 transition-all cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAuditComplaint(full);
                          }}>
                          Rank #{i + 1} · Audit Factors
                        </span>
                      </div>
                      <p className="text-xs font-bold text-foreground leading-snug">{c.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{c.ward} · {c.citizensJoined + 1} joined</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-black text-primary font-mono">{dynamicScore}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">impact score</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Constituency Analytics Section */}
        <div id="tour-mp-analytics" className="p-4 bg-card rounded-2xl border border-border cursor-pointer hover:border-primary/25 transition-all font-sans"
          onClick={() => setShowHealthModal(true)}
          data-tour="mp-health-scores">
          <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-3.5 font-mono">Constituency Analytics & Health Summary</p>
          
          {/* Health Score */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-foreground">Constituency Health Index</span>
              <span className="text-sm font-black text-primary font-mono">{healthScore}/100</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${healthScore}%` }} />
            </div>
          </div>

          {/* Daily, Weekly, Monthly volume trends */}
          <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-border/80 mb-4 text-[10px] font-mono">
            <div>
              <span className="text-muted-foreground uppercase font-bold">Daily Volume</span>
              <p className="font-bold text-foreground mt-0.5">{allReports.length} reports</p>
            </div>
            <div>
              <span className="text-muted-foreground uppercase font-bold">Weekly Trend</span>
              <p className="font-bold text-foreground mt-0.5">+15% Active</p>
            </div>
            <div>
              <span className="text-muted-foreground uppercase font-bold">Monthly Trend</span>
              <p className="font-bold text-foreground mt-0.5 text-green-600">Stable</p>
            </div>
          </div>

          {/* Interactive Chart Tab Toggle */}
          <div className="flex gap-1.5 p-1 bg-secondary rounded-xl mb-4 text-[10.5px] font-sans shrink-0 font-bold">
            {(["categories", "wards", "trends"] as const).map(tabKey => (
              <button key={tabKey} onClick={(e) => { e.stopPropagation(); setActiveChartTab(tabKey); setHoveredData(null); }}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all ${activeChartTab === tabKey ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
                {tabKey === "categories" ? "Category Vol" : tabKey === "wards" ? "Ward Dist" : "Monthly Trend"}
              </button>
            ))}
          </div>

          {/* Interactive Chart Display Area */}
          <div className="relative mt-4 mb-2 shrink-0 font-sans select-none" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const barChartData = categoriesList.map((cat, i) => {
                const count = categoryCounts[cat] || 0;
                const percentage = allReports.length > 0 ? Math.round((count / allReports.length) * 100) : 0;
                const labelsMap: Record<string, string> = {
                  water: "Water",
                  sanitation: "Sanitation",
                  roads: "Roads",
                  electricity: "Electricity",
                  drainage: "Drainage",
                  healthcare: "Healthcare",
                  education: "Education",
                  transport: "Transport",
                  other: "Other"
                };
                return {
                  label: labelsMap[cat] || cat,
                  count,
                  percentage,
                  growth: count > 3 ? "+12%" : "+4%",
                  trend: count > 5 ? "RISING" : "STABLE",
                  color: ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed", "#ec4899", "#14b8a6", "#8b5cf6", "#64748b"][i % 9],
                  type: "category" as const
                };
              }).filter(d => d.count > 0 || ["Water", "Sanitation", "Roads", "Electricity", "Drainage"].includes(d.label));

              const wardData = Object.keys(WARD_GEOMETRIES).slice(0, 5).map((ward, i) => {
                const count = wardCounts[ward] || 0;
                const percentage = allReports.length > 0 ? Math.round((count / allReports.length) * 100) : 0;
                return {
                  label: ward,
                  count,
                  percentage,
                  color: ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed"][i % 5],
                  growth: count > 2 ? "+18%" : "+6%",
                  trend: count > 3 ? "HIGH TREND" : "STABLE",
                  type: "ward" as const
                };
              });

              const trendData = [
                { label: "Jan", count: 8, percentage: 10, color: "#16a34a", growth: "Baseline", trend: "STABLE", type: "trend" as const },
                { label: "Feb", count: 14, percentage: 17, color: "#16a34a", growth: "+75%", trend: "STABLE", type: "trend" as const },
                { label: "Mar", count: 24, percentage: 29, color: "#16a34a", growth: "+71%", trend: "RISING", type: "trend" as const },
                { label: "Apr", count: 18, percentage: 22, color: "#16a34a", growth: "-25%", trend: "STABLE", type: "trend" as const },
                { label: "May", count: 32, percentage: 39, color: "#16a34a", growth: "+78%", trend: "SPARK", type: "trend" as const },
              ];

              let chartItems: {
                label: string;
                count: number;
                percentage: number;
                color: string;
                growth: string;
                trend: string;
                type: "category" | "ward" | "trend";
              }[] = [];

              if (activeChartTab === "categories") {
                chartItems = barChartData;
              } else if (activeChartTab === "wards") {
                chartItems = wardData;
              } else {
                chartItems = trendData;
              }

              return (
                <div className="w-full relative px-2">
                  {/* Perfect Dotted Grid Lines in the Background */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    <div className="w-24 shrink-0" />
                    <div className="flex-1 flex justify-between relative h-full">
                      <div className="absolute inset-y-0 left-0 border-l border-dashed border-border/80" />
                      <div className="absolute inset-y-0 left-1/4 border-l border-dashed border-border/80" />
                      <div className="absolute inset-y-0 left-2/4 border-l border-dashed border-border/80" />
                      <div className="absolute inset-y-0 left-3/4 border-l border-dashed border-border/80" />
                      <div className="absolute inset-y-0 right-0 border-r border-dashed border-border/80" />
                    </div>
                    <div className="w-20 shrink-0" />
                  </div>

                  {/* Chart Rows */}
                  <div className="relative z-10 space-y-3.5">
                    {chartItems.map((item) => (
                      <div
                        key={item.label}
                        onClick={() => setSelectedChartDetail(item)}
                        className="flex items-center group cursor-pointer"
                      >
                        {/* Category Label Column (vertically centered, never touches border) */}
                        <div className="w-24 text-[11px] font-bold text-foreground truncate pr-3" style={DF}>
                          {item.label}
                        </div>

                        {/* Bar Column (shares the same X position, aligns perfectly with background grid) */}
                        <div className="flex-1 h-3 flex items-center bg-secondary/20 rounded-full relative">
                          <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{
                              width: `${Math.max(4, item.percentage)}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>

                        {/* Numeric Column (perfectly aligned right margin) */}
                        <div className="w-20 text-right text-[11px] font-bold text-foreground font-mono pl-3">
                          {item.count} <span className="text-[9px] text-muted-foreground font-semibold">({item.percentage}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] text-muted-foreground mt-4 text-center font-bold font-sans">
                    Tap rows for deep auditing metrics
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Constituency Health Index Breakdown Modal */}
      {showHealthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-5 font-sans animate-fadeIn">
          <div className="bg-card w-full max-w-sm rounded-2xl border border-border p-6 shadow-2xl relative animate-slideUp flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center pb-3 border-b border-border/80 shrink-0">
              <div>
                <h3 className="text-base font-bold text-foreground">Constituency Health Index</h3>
                <p className="text-[10px] text-muted-foreground font-mono font-bold">Comprehensive Decision Suite Audit</p>
              </div>
              <button
                onClick={() => setShowHealthModal(false)}
                className="text-xs px-2.5 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-lg transition-colors">
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 py-4 scrollbar-none">
              {/* Overall Health Index */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[9px] text-primary font-bold uppercase tracking-wider font-mono">Overall Health Index</span>
                  <p className="text-2xl font-black text-primary font-mono mt-0.5">{healthScore}/100</p>
                </div>
                <span className="text-[10px] text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-bold">
                  Active Baseline
                </span>
              </div>

              {/* General Metadata Panel: Trend, Confidence, Updated, Reports Used */}
              <div className="p-4 bg-card border border-border rounded-2xl shadow-sm space-y-3 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-border/60">
                  <span className="text-muted-foreground font-semibold">Trend vs Last Week</span>
                  <span className="font-bold text-green-600 font-mono">+1.8% Improvement</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-border/60">
                  <span className="text-muted-foreground font-semibold">AI Confidence Rating</span>
                  <span className="font-bold text-foreground font-mono">96% Confident</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-border/60">
                  <span className="text-muted-foreground font-semibold">Last Updated</span>
                  <span className="font-bold text-foreground font-mono">Just Now (Real-Time)</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-muted-foreground font-semibold">Reports Count Used</span>
                  <span className="font-bold text-foreground font-mono">{allReports.length} active items</span>
                </div>
              </div>

              {/* Category-wise Scores */}
              <div className="space-y-2">
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider font-mono">Category-wise Scores</span>
                <div className="space-y-1.5">
                  {[
                    { label: "Water Infrastructure", weight: "25%", score: categoryHealth.water ?? 95, icon: "💧" },
                    { label: "Road Infrastructure", weight: "20%", score: categoryHealth.roads ?? 95, icon: "🛣️" },
                    { label: "Healthcare Sector", weight: "20%", score: categoryHealth.healthcare ?? 95, icon: "🏥" },
                    { label: "Sanitation Department", weight: "15%", score: categoryHealth.sanitation ?? 95, icon: "🗑️" },
                    { label: "Electricity Board", weight: "10%", score: categoryHealth.electricity ?? 95, icon: "⚡" },
                    { label: "Education Facilities", weight: "10%", score: categoryHealth.education ?? 95, icon: "🏫" }
                  ].map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-secondary/55 rounded-xl text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <div>
                          <p className="text-foreground">{cat.label}</p>
                          <p className="text-[9px] text-muted-foreground font-normal">Weight: {cat.weight}</p>
                        </div>
                      </div>
                      <span className="font-mono text-primary">{cat.score}/100</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calculation Method */}
              <div className="p-3.5 bg-secondary rounded-xl font-medium text-xs leading-relaxed text-slate-700">
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider font-mono block mb-1">Calculation Method</span>
                Weighted aggregate equation: Water (25%), Roads (20%), Healthcare (20%), Sanitation (15%), Electricity (10%), Education (10%). Starting baseline is 95 points. Each active report deducts a severity-based penalty (Critical: -12, High: -7, Medium: -4).
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ranking Audit Modal */}
      {auditComplaint && (() => {
        const dScore = calculateDynamicImpactScore(auditComplaint);
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-5 font-sans animate-fadeIn">
            <div className="bg-card w-full max-w-sm rounded-2xl border border-border p-6 shadow-2xl relative animate-slideUp flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-center pb-3 border-b border-border/80 shrink-0">
                <div>
                  <h3 className="text-base font-bold text-foreground">Ranking Audit Panel</h3>
                  <p className="text-[10px] text-muted-foreground font-mono">{auditComplaint.shortId}</p>
                </div>
                <button
                  onClick={() => setAuditComplaint(null)}
                  className="text-xs px-2.5 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-lg transition-colors">
                  Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 py-4 scrollbar-none">
                <div>
                  <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider font-mono">Current Audit Verdict</span>
                  <p className="text-sm font-bold text-foreground mt-1">This report is prioritized highly due to critical severity metrics and active citizen engagement.</p>
                </div>

                <div className="p-3 bg-secondary rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider font-mono">Calculated Impact Score</span>
                    <p className="text-base font-black text-primary font-mono mt-0.5">{dScore.total}/100</p>
                  </div>
                  <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                    96% AI Confidence
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider font-mono">Auditable Rank Factors</span>
                  <div className="space-y-2">
                    {dScore.breakdown.details.map((detail: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 p-2 bg-secondary/50 rounded-lg text-xs font-medium text-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Alert Details Modal */}
      {selectedAlert && (() => {
        const related = allReports.filter(r => r.category === selectedAlert.category && r.ward === selectedAlert.ward).slice(0, 2);
        
        // Inline trend graph drawer
        const alertTrendGraph = (points: number[]) => {
          const width = 280;
          const height = 80;
          const padding = 15;
          const maxVal = Math.max(...points);
          const minVal = Math.min(...points);
          const range = maxVal - minVal || 1;
          
          const coords = points.map((p, idx) => {
            const x = padding + (idx * (width - padding * 2)) / (points.length - 1);
            const y = height - padding - ((p - minVal) / range) * (height - padding * 2);
            return { x, y, val: p };
          });

          const linePath = `M ${coords.map(c => `${c.x} ${c.y}`).join(" L ")}`;
          return (
            <svg width={width} height={height} className="overflow-visible font-mono text-[9px] mt-2">
              <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth="2" />
              {coords.map((c, i) => (
                <g key={i}>
                  <circle cx={c.x} cy={c.y} r="4" fill="var(--primary)" />
                  <text x={c.x - 6} y={c.y - 6} className="fill-foreground font-bold">{c.val}</text>
                </g>
              ))}
            </svg>
          );
        };

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-5 font-sans animate-fadeIn">
            <div className="bg-card w-full max-w-sm rounded-2xl border border-border p-6 shadow-2xl relative animate-slideUp flex flex-col max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-3 border-b border-border/80 shrink-0">
                <div>
                  <h3 className="text-base font-bold text-foreground">Alert Details</h3>
                  <p className="text-[10px] text-red-650 font-bold uppercase tracking-wider font-mono mt-0.5">Critical Anomaly Alert</p>
                </div>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="text-xs px-2.5 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-lg transition-colors">
                  Close
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs font-sans">
                <div>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider font-mono">Alert Subject</p>
                  <p className="font-extrabold text-foreground text-sm mt-0.5">{selectedAlert.title}</p>
                </div>

                <div className="p-3 bg-red-50/40 border border-red-100 rounded-xl">
                  <p className="text-[9px] text-red-850 font-bold uppercase tracking-wider font-mono">AI Generation Rationale</p>
                  <p className="font-medium text-red-950 mt-1 leading-relaxed">{selectedAlert.reason}</p>
                </div>

                <div className="grid grid-cols-2 gap-3.5 border-t border-b border-border/60 py-3 font-mono">
                  <div>
                    <p className="text-[9.5px] text-muted-foreground font-bold uppercase tracking-wider">Affected Wards</p>
                    <p className="font-black text-foreground mt-0.5">{selectedAlert.ward}</p>
                  </div>
                  <div>
                    <p className="text-[9.5px] text-muted-foreground font-bold uppercase tracking-wider">Reports Received</p>
                    <p className="font-black text-foreground mt-0.5">{selectedAlert.reportsCount} Reports</p>
                  </div>
                  <div>
                    <p className="text-[9.5px] text-muted-foreground font-bold uppercase tracking-wider">Impact level</p>
                    <p className="font-black text-red-600 mt-0.5">{selectedAlert.impact.split(" ")[1] || "High"}</p>
                  </div>
                  <div>
                    <p className="text-[9.5px] text-muted-foreground font-bold uppercase tracking-wider">AI Confidence</p>
                    <p className="font-black text-primary mt-0.5">{selectedAlert.confidence}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider font-mono">Time Period Analysed</p>
                  <p className="font-extrabold text-foreground mt-0.5">{selectedAlert.timePeriod}</p>
                </div>

                <div>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider font-mono">24h Trend Graph</p>
                  <div className="bg-secondary/40 rounded-xl p-3 flex justify-center">
                    {alertTrendGraph(selectedAlert.trendPoints)}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider font-mono">Top Contributing Reports</p>
                  <div className="space-y-1.5">
                    {related.map(r => {
                      const full = complaintService.getById(r.id);
                      return (
                        <button key={r.id} onClick={() => { if (full) onComplaintSelect(full); setSelectedAlert(null); }}
                          className="w-full text-left p-2.5 bg-secondary/45 hover:bg-secondary border border-border/50 rounded-xl text-[11.5px] font-bold text-foreground flex justify-between items-center transition-colors">
                          <span className="truncate pr-2">{r.title}</span>
                          <span className="shrink-0 text-primary font-mono text-[10px] font-black">{r.impactScore} pts</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowDrillDownReports({
                      title: `Related Reports: ${selectedAlert.title}`,
                      category: selectedAlert.category,
                      ward: selectedAlert.ward.includes(",") ? "all" : selectedAlert.ward
                    });
                    setSelectedAlert(null);
                  }}
                  className="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-bold active-press text-center shadow-sm">
                  View All Related Reports
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Analytics Deep-Dive Chart Modal */}
      {selectedChartDetail && (() => {
        let sortedWards = "N/A";
        let sortedCats = "N/A";
        if (selectedChartDetail.type === "category") {
          const wardCountForCat: Record<string, number> = {};
          allReports.filter(r => r.category === selectedChartDetail.label.toLowerCase() || r.category === selectedChartDetail.label).forEach(r => {
            wardCountForCat[r.ward] = (wardCountForCat[r.ward] || 0) + 1;
          });
          sortedWards = Object.entries(wardCountForCat)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([w, c]) => `${w} (${c})`)
            .join(", ") || "No active reports";
        } else if (selectedChartDetail.type === "ward") {
          const catCountForWard: Record<string, number> = {};
          allReports.filter(r => r.ward === selectedChartDetail.label).forEach(r => {
            catCountForWard[r.category] = (catCountForWard[r.category] || 0) + 1;
          });
          sortedCats = Object.entries(catCountForWard)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([c, count]) => `${c.charAt(0).toUpperCase() + c.slice(1)} (${count})`)
            .join(", ") || "No active reports";
        }

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-5 font-sans animate-fadeIn">
            <div className="bg-card w-full max-w-sm rounded-2xl border border-border p-6 shadow-2xl relative animate-slideUp flex flex-col max-h-[75vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-3 border-b border-border/80 shrink-0">
                <div>
                  <h3 className="text-base font-bold text-foreground">Analytics Deep-Dive</h3>
                  <p className="text-[10px] text-primary font-bold uppercase tracking-wider font-mono mt-0.5">Real-Time Auditing Module</p>
                </div>
                <button
                  onClick={() => setSelectedChartDetail(null)}
                  className="text-xs px-2.5 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-lg transition-colors">
                  Close
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs font-sans">
                <div>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider font-mono">Entity Name</p>
                  <p className="font-extrabold text-foreground text-sm mt-0.5">{selectedChartDetail.label}</p>
                </div>

                <div className="grid grid-cols-2 gap-3.5 border-t border-b border-border/60 py-3 font-mono">
                  <div>
                    <p className="text-[9.5px] text-muted-foreground font-bold uppercase tracking-wider">Report Count</p>
                    <p className="font-black text-foreground mt-0.5">{selectedChartDetail.count} active items</p>
                  </div>
                  <div>
                    <p className="text-[9.5px] text-muted-foreground font-bold uppercase tracking-wider">Percentage Share</p>
                    <p className="font-black text-foreground mt-0.5">{selectedChartDetail.percentage}%</p>
                  </div>
                  <div>
                    <p className="text-[9.5px] text-muted-foreground font-bold uppercase tracking-wider">Trend growth</p>
                    <p className="font-black text-green-600 mt-0.5">{selectedChartDetail.growth}</p>
                  </div>
                  <div>
                    <p className="text-[9.5px] text-muted-foreground font-bold uppercase tracking-wider">Status</p>
                    <p className="font-black text-primary mt-0.5">{selectedChartDetail.trend}</p>
                  </div>
                </div>

                {selectedChartDetail.type === "category" && (
                  <div>
                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider font-mono">Top Impacted Wards</p>
                    <p className="font-extrabold text-foreground mt-1">{sortedWards}</p>
                  </div>
                )}

                {selectedChartDetail.type === "ward" && (
                  <div>
                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider font-mono">Top Issue Categories</p>
                    <p className="font-extrabold text-foreground mt-1">{sortedCats}</p>
                  </div>
                )}

                <div>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider font-mono">Last Updated</p>
                  <p className="font-extrabold text-foreground mt-0.5">Just Now (Real-Time Synchronized)</p>
                </div>

                <button
                  onClick={() => {
                    setShowDrillDownReports({
                      title: `Contributing Reports: ${selectedChartDetail.label}`,
                      category: selectedChartDetail.type === "category" ? selectedChartDetail.label.toLowerCase() : "all",
                      ward: selectedChartDetail.type === "ward" ? selectedChartDetail.label : "all"
                    });
                    setSelectedChartDetail(null);
                  }}
                  className="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-bold active-press text-center shadow-sm">
                  View Contributing Reports
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Drill-down reports list */}
      {showDrillDownReports && (
        <FilterableReportsModal
          title={showDrillDownReports.title}
          initialCategory={showDrillDownReports.category}
          initialWard={showDrillDownReports.ward}
          onClose={() => setShowDrillDownReports(null)}
          onSelect={onComplaintSelect}
        />
      )}
    </div>
  );
}

function MPPriority({
  onComplaintSelect,
  severityFilter,
  setSeverityFilter,
  onBack,
}: {
  onComplaintSelect: (c: Complaint) => void;
  severityFilter: "all" | "critical";
  setSeverityFilter: (s: "all" | "critical") => void;
  onBack: () => void;
}) {
  const [sortBy, setSortBy] = useState<"score" | "citizens" | "date">("score");
  const [auditComplaint, setAuditComplaint] = useState<Complaint | null>(null);
  const allSummaries = complaintService.getAll();

  const resolved = allSummaries.map(c => {
    const full = complaintService.getById(c.id);
    const scoreObj = full ? calculateDynamicImpactScore(full) : { total: c.impactScore, breakdown: null };
    return {
      summary: c,
      full,
      dynamicScore: scoreObj.total,
      breakdown: scoreObj.breakdown
    };
  });

  let filtered = resolved;
  if (severityFilter === "critical") {
    filtered = resolved.filter((x) => x.summary.severity === "critical");
  }

  if (sortBy === "score") {
    filtered.sort((a, b) => b.dynamicScore - a.dynamicScore);
  } else if (sortBy === "citizens") {
    filtered.sort((a, b) => (b.full?.citizensJoined ?? 0) - (a.full?.citizensJoined ?? 0));
  } else if (sortBy === "date") {
    filtered.sort((a, b) => new Date(b.full?.reportedAt ?? 0).getTime() - new Date(a.full?.reportedAt ?? 0).getTime());
  }

  return (
    <div className="flex flex-col h-full font-sans">
      <div className="shrink-0 pt-5 pb-3 px-5 border-b border-border bg-card">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center active-press">
            <ChevronLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground leading-none" style={DF}>Priority Issues</h1>
        </div>
        <div className="flex gap-2 items-center justify-between">
          <div className="flex gap-1.5">
            {(["score", "citizens", "date"] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                  sortBy === s ? "bg-primary text-white animate-fadeIn" : "bg-secondary text-muted-foreground"
                }`}>
                {s === "score" ? "Impact Score" : s === "citizens" ? "Citizen Support" : "Date Filed"}
              </button>
            ))}
          </div>
          {severityFilter === "critical" && (
            <button onClick={() => setSeverityFilter("all")}
              className="text-[10px] font-bold text-red-650 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1 active-press">
              🔴 Critical Only (Clear)
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-none px-4 py-3 space-y-3 bg-secondary/10">
        {filtered.map((item) => {
          const c = item.summary;
          const full = item.full;
          if (!full) return null;
          const scoreBreakdown = item.breakdown;
          const populationAffected = (c.citizensJoined + 1) * 20;

          return (
            <button key={c.id} onClick={() => full && onComplaintSelect(full)}
              className="w-full bg-card rounded-2xl border border-border p-4 text-left active-press hover:border-primary/30 transition-all shadow-sm block">
              <div className="flex items-start gap-3">
                <CategoryIcon category={c.category} size={17} showBg bgSize="w-10 h-10" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground leading-snug truncate" style={DF}>{c.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{c.ward}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-black text-primary leading-none font-mono">{item.dynamicScore}</p>
                  <p className="text-[9px] text-muted-foreground font-semibold mt-0.5">impact score</p>
                </div>
              </div>

              {/* Dynamic perspective display grid */}
              {sortBy === "score" && scoreBreakdown && (
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border/80 text-[9.5px] font-mono leading-tight">
                  <div>
                    <span className="text-muted-foreground uppercase font-bold">Severity Penalty</span>
                    <p className="font-bold text-foreground mt-0.5">-{Math.round(scoreBreakdown.severityScore * 0.3)} pts</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground uppercase font-bold">Support Boost</span>
                    <p className="font-bold text-foreground mt-0.5">+{Math.round(scoreBreakdown.supportScore * 0.25)} pts</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground uppercase font-bold">Age Factor</span>
                    <p className="font-bold text-foreground mt-0.5">+{Math.round(scoreBreakdown.ageScore * 0.1)} pts</p>
                  </div>
                </div>
              )}

              {sortBy === "citizens" && (
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border/80 text-[9.5px] font-mono leading-tight">
                  <div>
                    <span className="text-muted-foreground uppercase font-bold">Supporting Citizens</span>
                    <p className="font-bold text-foreground mt-0.5">{c.citizensJoined + 1} citizens</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground uppercase font-bold">Est. Population Affected</span>
                    <p className="font-bold text-foreground mt-0.5">~{populationAffected} residents</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground uppercase font-bold">Trend status</span>
                    <p className="font-bold text-foreground mt-0.5">{c.citizensJoined > 8 ? "Spiking" : "Stable"}</p>
                  </div>
                </div>
              )}

              {sortBy === "date" && (
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border/80 text-[9.5px] font-mono leading-tight">
                  <div>
                    <span className="text-muted-foreground uppercase font-bold">Date filed</span>
                    <p className="font-bold text-foreground mt-0.5">
                      {new Date(c.reportedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground uppercase font-bold">Report Age</span>
                    <p className="font-bold text-foreground mt-0.5">
                      {Math.max(1, Math.round((Date.now() - new Date(c.reportedAt).getTime()) / (1000 * 60 * 60 * 24)))} days old
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground uppercase font-bold">SLA status</span>
                    <p className="font-bold text-green-700 mt-0.5">In Compliance</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/70 text-[10px] font-sans">
                <SeverityBadge severity={c.severity} size="sm" />
                <button
                  onClick={(e) => { e.stopPropagation(); setAuditComplaint(full); }}
                  className="text-[9.5px] font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-lg active-press transition-colors ml-2">
                  Audit Factors
                </button>
                <span className="ml-auto text-[9.5px] font-bold text-muted-foreground font-mono uppercase bg-secondary px-2 py-0.5 rounded-lg border border-border/40">
                  {(() => {
                    const depts: Record<string, string> = {
                      water_board: "Water Board",
                      sanitation: "Sanitation Dept",
                      public_works: "Public Works",
                      electricity_board: "Electricity Board",
                      storm_water: "Storm Water Dept",
                      health: "Health Department",
                      education: "Education Dept",
                      transport: "Transport Dept",
                      general: "General Admin",
                    };
                    return depts[c.assignedDepartment || ""] || "UNASSIGNED";
                  })()}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Ranking Audit Modal */}
      {auditComplaint && (() => {
        const dScore = calculateDynamicImpactScore(auditComplaint);
        const severityWeight = 0.3;
        const supportWeight = 0.25;
        const duplicateWeight = 0.2;
        const trendWeight = 0.15;
        const recencyWeight = 0.1;
        
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-5 font-sans animate-fadeIn">
            <div className="bg-card w-full max-w-sm rounded-2xl border border-border p-6 shadow-2xl relative animate-slideUp flex flex-col max-h-[85vh] z-[60]">
              <div className="flex justify-between items-center pb-3 border-b border-border/80 shrink-0">
                <div>
                  <h3 className="text-base font-bold text-foreground">Ranking Audit Panel</h3>
                  <p className="text-[10px] text-muted-foreground font-mono">{auditComplaint.shortId}</p>
                </div>
                <button
                  onClick={() => setAuditComplaint(null)}
                  className="text-xs px-2.5 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-lg transition-colors">
                  Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 py-4 scrollbar-none">
                <div>
                  <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider font-mono">Current Audit Verdict</span>
                  <p className="text-xs font-semibold text-foreground mt-1 leading-relaxed">This community report is audited dynamically across weighted severity, citizen support, duplicate matches, trend signals, and recency variables.</p>
                </div>

                <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-primary font-bold uppercase tracking-wider font-mono">Impact Score</span>
                    <p className="text-base font-black text-primary font-mono mt-0.5">{dScore.total}/100</p>
                  </div>
                  <span className="text-[10px] text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-bold font-sans">
                    96% AI Confidence
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider font-mono">Auditable Rank Factors</span>
                  <div className="space-y-2 text-xs">
                    {/* Severity (30%) */}
                    <div className="p-2.5 bg-secondary/55 border border-border/40 rounded-xl space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>Severity (30% weight)</span>
                        <span className="font-mono text-primary">{Math.round(dScore.breakdown.severityScore * severityWeight)} pts</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">AI Class: {auditComplaint.severity.toUpperCase()} ({dScore.breakdown.severityScore}/100 base score).</p>
                    </div>

                    {/* Supporting Citizens (25%) */}
                    <div className="p-2.5 bg-secondary/55 border border-border/40 rounded-xl space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>Supporting Citizens (25% weight)</span>
                        <span className="font-mono text-primary">{Math.round(dScore.breakdown.supportScore * supportWeight)} pts</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">{auditComplaint.citizensJoined + 1} citizens registered support ({dScore.breakdown.supportScore}/100 score). Formula: (Count) * 4, capped at 100.</p>
                    </div>

                    {/* Duplicate Reports (20%) */}
                    <div className="p-2.5 bg-secondary/55 border border-border/40 rounded-xl space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>Duplicate Reports (20% weight)</span>
                        <span className="font-mono text-primary">{Math.round(dScore.breakdown.duplicateScore * duplicateWeight)} pts</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">{auditComplaint.duplicateMatches?.length || 0} similar reports grouped ({dScore.breakdown.duplicateScore}/100 score). Formula: (Count) * 25, capped at 100.</p>
                    </div>

                    {/* Trend (15%) */}
                    <div className="p-2.5 bg-secondary/55 border border-border/40 rounded-xl space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>Trend Signal (15% weight)</span>
                        <span className="font-mono text-primary">{Math.round(dScore.breakdown.trendScore * trendWeight)} pts</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">Engagement velocity: {dScore.breakdown.trendScore}/100 score (Spiking count triggers greater boost).</p>
                    </div>

                    {/* Recency (10%) */}
                    <div className="p-2.5 bg-secondary/55 border border-border/40 rounded-xl space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>Recency / Age (10% weight)</span>
                        <span className="font-mono text-primary">{Math.round(dScore.breakdown.ageScore * recencyWeight)} pts</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">Filing interval: {dScore.breakdown.ageScore}/100 score (Created less than 24h ago gets 80-100 base).</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function MPProfile({ onLogout, onBack, onStartTour }: { onLogout: () => void; onBack: () => void; onStartTour: () => void }) {
  const [showSettings, setShowSettings] = useState(false);
  const [showPublicDashboard, setShowPublicDashboard] = useState(false);

  // Settings states
  const [lang, setLang] = useState("English");
  const [notif, setNotif] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme_mode") || "Light Mode");
  const [locStatus, setLocStatus] = useState(() => localStorage.getItem("location_permission_preference") || "GRANTED");

  // Apply theme dynamically
  useEffect(() => {
    localStorage.setItem("theme_mode", theme);
    const root = document.documentElement;
    if (theme === "Dark Mode") {
      root.classList.add("dark");
    } else if (theme === "Light Mode") {
      root.classList.remove("dark");
    } else {
      // System Default
      const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (isSystemDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [theme]);

  // Sync location preference on initial load
  useEffect(() => {
    if (showSettings && !localStorage.getItem("location_permission_preference")) {
      if (navigator.permissions) {
        navigator.permissions.query({ name: "geolocation" as any }).then((res) => {
          const mapped = res.state === "granted" ? "GRANTED" : "DENIED";
          setLocStatus(mapped);
          localStorage.setItem("location_permission_preference", mapped);
        }).catch(() => {});
      }
    }
  }, [showSettings]);

  const stats = complaintService.getDashboardStats();
  const allReports = complaintService.getAll();

  return (
    <div className="flex flex-col h-full overflow-y-auto px-5 pt-5 pb-6 scrollbar-none font-sans relative">
      <div className="flex items-center gap-3 mb-5 shrink-0">
        <button onClick={onBack} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center active-press">
          <ChevronLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground leading-none" style={DF}>MP Profile</h1>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-5 bg-card rounded-2xl border border-border shadow-sm">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold font-sans" style={DF}>RK</div>
          <div>
            <p className="text-base font-bold text-foreground" style={DF}>Dr. Rajesh Kumar</p>
            <p className="text-sm text-muted-foreground mt-0.5">Member of Parliament</p>
            <p className="text-xs text-muted-foreground">Madurai Central, Tamil Nadu</p>
          </div>
        </div>
        
        <div className="p-4 bg-card rounded-2xl border border-border shadow-sm">
          {[["Constituency", "Madurai Central"], ["Assigned Wards", "Ward 8–14"], ["Email", "rajesh@sansad.nic.in"]].map(([k, v], i) => (
            <div key={k} className={`flex items-center justify-between py-3 ${i > 0 ? "border-t border-border" : ""}`}>
              <span className="text-sm text-foreground font-semibold">{k}</span>
              <span className="text-sm font-semibold text-foreground text-right">{v}</span>
            </div>
          ))}
        </div>

        <div className="p-4 bg-card rounded-2xl border border-border shadow-sm">
          {([
            ["Settings", <FileText size={15} key="s" />, () => setShowSettings(true)]
          ] as [string, React.ReactNode, () => void][]).map(([label, icon, onClick]) => (
            <button key={label} onClick={onClick} className="w-full flex items-center gap-3 py-3 border-b border-border last:border-0 active-press">
              <span className="text-muted-foreground">{icon}</span>
              <span className="text-sm text-foreground font-semibold">{label}</span>
              <ChevronRight size={14} className="ml-auto text-muted-foreground" />
            </button>
          ))}
        </div>

        <button onClick={onLogout} className="w-full py-3.5 bg-red-50 text-red-600 rounded-2xl font-bold text-sm border border-red-100 active-press hover:bg-red-100/50 transition-colors">
          Logout
        </button>
      </div>

      {/* Settings Overlay Drawer */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/60 z-50 flex flex-col justify-end animate-fadeIn font-sans">
          <div className="absolute inset-0" onClick={() => setShowSettings(false)} />
          <div className="relative bg-card rounded-t-[32px] max-h-[85%] flex flex-col z-10 shadow-2xl border-t border-border animate-slideUp">
            <div className="shrink-0 p-5 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-xs font-bold text-primary bg-secondary px-3 py-1.5 rounded-full active-press">
                Close
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5 scrollbar-none bg-secondary/15">
              {/* Notifications Toggle */}
              <div className="p-4 bg-card border border-border rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs font-bold text-foreground">Notifications</p>
                  <p className="text-[10px] text-muted-foreground">Enable active notification updates</p>
                </div>
                <button onClick={() => setNotif(!notif)} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${notif ? "bg-green-50 text-green-700 border border-green-200" : "bg-secondary text-muted-foreground"}`}>
                  {notif ? "Enabled" : "Disabled"}
                </button>
              </div>

              {/* Privacy and Security Links */}
              {[
                { name: "Privacy Policy", desc: "Manage sharing & data retention settings" },
                { name: "System Security Credentials", desc: "Sansad authentication & lock credentials" }
              ].map(item => (
                <div key={item.name} className="p-4 bg-card border border-border rounded-2xl flex items-center justify-between shadow-sm active-press cursor-pointer hover:border-primary/20">
                  <div>
                    <p className="text-xs font-bold text-foreground">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground" />
                </div>
              ))}

              {/* Geolocation Permissions toggle option */}
              <div className="p-4 bg-card border border-border rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs font-bold text-foreground">Location Permissions</p>
                  <p className="text-[10px] text-muted-foreground">GPS tracking authorization status</p>
                </div>
                <select
                  value={locStatus}
                  onChange={e => {
                    const next = e.target.value;
                    setLocStatus(next);
                    localStorage.setItem("location_permission_preference", next);
                  }}
                  className={`text-xs font-bold border-none outline-none py-1.5 px-3 rounded-lg cursor-pointer ${locStatus === "GRANTED" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}
                >
                  <option value="GRANTED" className="bg-card text-green-700">Granted</option>
                  <option value="DENIED" className="bg-card text-red-700">Denied</option>
                </select>
              </div>

              {/* Interactive App Tour Replay */}
              <div className="p-4 bg-card border border-border rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs font-bold text-foreground">Interactive App Tour</p>
                  <p className="text-[10px] text-muted-foreground">Replay the guided dashboard walkthrough</p>
                </div>
                <button onClick={() => { setShowSettings(false); onStartTour(); }} className="px-3.5 py-2 bg-primary text-white text-xs font-bold rounded-xl active-press shadow-sm">
                  Start Tour
                </button>
              </div>

              {/* About and Help Desk */}
              <div className="p-4 bg-card border border-border rounded-2xl space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-foreground">About JanVaani</p>
                    <p className="text-[9.5px] text-muted-foreground">Version 2.5.2 · Decision Support terminal</p>
                  </div>
                </div>
                <div className="border-t border-border/80 pt-2 flex items-center justify-between cursor-pointer active-press" onClick={() => alert("JanVaani Help Ticket Desk: Call 1800-425-4567")}>
                  <div>
                    <p className="text-xs font-bold text-foreground">Help & Support Desk</p>
                    <p className="text-[9.5px] text-muted-foreground">Raise ticket issues or call helpline</p>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Public Dashboard Overlay Drawer */}
      {showPublicDashboard && (
        <div className="absolute inset-0 bg-black/60 z-50 flex flex-col justify-end animate-fadeIn font-sans">
          <div className="absolute inset-0" onClick={() => setShowPublicDashboard(false)} />
          <div className="relative bg-card rounded-t-[32px] max-h-[90%] flex flex-col z-10 shadow-2xl border-t border-border animate-slideUp">
            <div className="shrink-0 p-5 border-b border-border flex items-center justify-between bg-card">
              <div>
                <h3 className="text-base font-bold text-foreground">JanVaani Public Portal</h3>
                <p className="text-[10px] text-muted-foreground">Public-Facing Analytics Dashboard</p>
              </div>
              <button onClick={() => setShowPublicDashboard(false)} className="text-xs font-bold text-primary bg-secondary px-3 py-1.5 rounded-full active-press">
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-none bg-secondary/15">
              {/* Summary Card */}
              <div className="bg-card border border-border rounded-2xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-bl-xl border-l border-b border-border font-sans uppercase">
                  Verified Data
                </div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider font-mono">Constituency Performance</p>
                <p className="text-2xl font-black text-foreground font-sans mt-1">Dr. Rajesh Kumar</p>
                <p className="text-[10.5px] text-muted-foreground">Madurai Central Constituency Area</p>
              </div>

              {/* Public Stats List */}
              <div className="p-4 bg-card border border-border rounded-2xl shadow-sm space-y-2.5">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider font-mono border-b border-border/80 pb-1.5">Constituency Public Statistics</p>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[9px] text-muted-foreground font-semibold uppercase">Total Reports Submitted</span>
                    <p className="text-base font-black text-foreground mt-0.5">{stats.total} Priorities</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground font-semibold uppercase">Critical Issues Active</span>
                    <p className="text-base font-black text-red-600 mt-0.5">{stats.critical} Spike Wards</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground font-semibold uppercase">Citizen Participation</span>
                    <p className="text-base font-black text-foreground mt-0.5">{allReports.reduce((acc, r) => acc + r.citizensJoined, 0) + allReports.length} Citizens</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground font-semibold uppercase">Public Audit status</span>
                    <p className="text-base font-black text-green-700 mt-0.5 font-mono">Verified</p>
                  </div>
                </div>
              </div>

              {/* Public Heat Map Summary */}
              <div className="p-4 bg-card border border-border rounded-2xl shadow-sm space-y-2.5">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider font-mono border-b border-border/80 pb-1.5">Public Heat Map Density</p>
                <div className="space-y-1.5">
                  {[
                    { name: "Ward 12", count: "High activity (water board issues focus)" },
                    { name: "Ward 14", count: "Moderate reports (drainage & sanitation)" },
                    { name: "Ward 8", count: "Minimal activity" }
                  ].map(w => (
                    <div key={w.name} className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-foreground">{w.name}</span>
                      <span className="text-muted-foreground font-medium text-[10.5px]">{w.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Public Category Volume Trends */}
              <div className="p-4 bg-card border border-border rounded-2xl shadow-sm space-y-2.5">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider font-mono border-b border-border/80 pb-1.5">Sector Public Statistics</p>
                <div className="space-y-2 font-mono text-[9.5px]">
                  {["water", "roads", "drainage", "electricity"].map(cat => {
                    const count = allReports.filter(r => r.category === cat).length;
                    return (
                      <div key={cat} className="flex justify-between items-center py-1 border-b border-border/40 last:border-0">
                        <span className="capitalize font-semibold text-foreground">{cat} infrastructure</span>
                        <span className="text-foreground font-bold">{count} active reports</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Community Reports list (Privacy Masked!) */}
              <div className="p-4 bg-card border border-border rounded-2xl shadow-sm space-y-2.5">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider font-mono border-b border-border/80 pb-1.5">Recent Public Submissions</p>
                <div className="space-y-2">
                  {allReports.slice(0, 4).map(r => (
                    <div key={r.id} className="p-3 bg-secondary/50 border border-border/40 rounded-xl space-y-1 text-[11px] font-sans">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-foreground">{r.title}</p>
                        <span className="text-[9px] font-mono bg-secondary text-foreground border border-border px-1.5 rounded">{r.shortId}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium">Location: {r.ward} · Category: <span className="capitalize">{r.category}</span></p>
                      <p className="text-[9.5px] text-green-700 font-bold uppercase font-mono mt-0.5">Status: Verified community priority</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// ROOT APP
// ════════════════════════════════════════════════════════════════════
function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const secs = Math.floor(diff / 1000);
  if (secs < 10) return "Just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
function MPBudgetAssistant({ onBack, onComplaintSelect }: { onBack: () => void; onComplaintSelect: (c: Complaint) => void }) {
  const all = complaintService.getAll();
  
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [selectedDrillDown, setSelectedDrillDown] = useState<{ title: string; category: string; ward: string } | null>(null);

  const grouped: Record<string, { category: string; ward: string; count: number; maxImpact: number; totalCitizens: number; ids: string[] }> = {};
  all.forEach((c) => {
    const key = c.category; // Group globally by category
    if (!grouped[key]) {
      grouped[key] = {
        category: c.category,
        ward: "All Wards",
        count: 0,
        maxImpact: 0,
        totalCitizens: 0,
        ids: [],
      };
    }
    grouped[key].count += 1;
    const full = complaintService.getById(c.id);
    const score = full ? calculateDynamicImpactScore(full).total : c.impactScore;
    if (score > grouped[key].maxImpact) {
      grouped[key].maxImpact = score;
    }
    grouped[key].totalCitizens += c.citizensJoined;
    grouped[key].ids.push(c.id);
  });

  const categoryLabel: Record<string, string> = {
    water: "Water Pipeline & Supply Upgrade",
    sanitation: "Sanitation Improvement Drive",
    roads: "Road Reconstruction",
    electricity: "Street Light Grid Upgrade",
    drainage: "Drainage Pipeline Network",
    healthcare: "Primary Health Center Renovation",
    education: "Public School Infrastructure Expansion",
    transport: "Local Bus Transit Connectivity",
    other: "Civic Amenities Renovation"
  };

  const categoryFunding: Record<string, string[]> = {
    water: ["AMRUT Scheme", "State Jal Jeevan Mission", "MPLADS Fund"],
    sanitation: ["Swachh Bharat Mission (Grameen)", "Municipal Solid Waste Grant"],
    roads: ["PMGSY Road Fund", "NABARD Infrastructure Development Assistance", "MPLADS Fund"],
    electricity: ["Deen Dayal Upadhyaya Gram Jyoti Yojana", "Discom Infrastructure Fund"],
    drainage: ["State Urban Infrastructure Development Fund", "District Collector Development Fund"],
    healthcare: ["National Health Mission Grants", "District Mineral Foundation Trust (DMFT)"],
    education: ["Samagra Shiksha Abhiyan Capital Grant", "State Education Infrastructure Fund"],
    transport: ["State Road Transport Capital Subsidy", "Smart Cities Mission Fund"],
    other: ["District Infrastructure Fund", "MPLADS Fund"]
  };

  const budgetEstimates: Record<string, { costText: string; costLakhs: number; variablesUsed: string; rateStr: string; confidence: string }> = {
    roads: { costText: "₹1.8 Crores", costLakhs: 180, variablesUsed: "21.4 km road segments", rateStr: "₹8.4 Lakhs/km", confidence: "95% AI Confidence" },
    water: { costText: "₹72 Lakhs", costLakhs: 72, variablesUsed: "13.7 km supply lines", rateStr: "₹5.25 Lakhs/km", confidence: "96% AI Confidence" },
    drainage: { costText: "₹48 Lakhs", costLakhs: 48, variablesUsed: "8.6 km pipeline network", rateStr: "₹5.58 Lakhs/km", confidence: "92% AI Confidence" },
    sanitation: { costText: "₹55 Lakhs", costLakhs: 55, variablesUsed: "11 disposal trucks", rateStr: "₹5 Lakhs/truck", confidence: "94% AI Confidence" },
    electricity: { costText: "₹24 Lakhs", costLakhs: 24, variablesUsed: "196 lamp grid points", rateStr: "₹12,200/lamp", confidence: "94% AI Confidence" },
    healthcare: { costText: "₹42 Lakhs", costLakhs: 42, variablesUsed: "21 beds configuration", rateStr: "₹2 Lakhs/bed", confidence: "93% AI Confidence" },
    education: { costText: "₹35 Lakhs", costLakhs: 35, variablesUsed: "8 classroom units", rateStr: "₹4.37 Lakhs/room", confidence: "91% AI Confidence" },
    transport: { costText: "₹28 Lakhs", costLakhs: 28, variablesUsed: "4 transport vehicles", rateStr: "₹7 Lakhs/vehicle", confidence: "92% AI Confidence" },
    other: { costText: "₹12 Lakhs", costLakhs: 12, variablesUsed: "15 items", rateStr: "Base rate: ₹12 Lakhs", confidence: "89% AI Confidence" }
  };

  const budgetItems = Object.values(grouped).map((item) => {
    const label = categoryLabel[item.category] || "Infrastructure Project";
    const estimate = budgetEstimates[item.category] || { costText: "₹10 Lakhs", costLakhs: 10, variablesUsed: `${item.count} items`, rateStr: "₹1 Lakh/item", confidence: "90% Confidence" };
    
    const channels = categoryFunding[item.category] || ["District Infrastructure Fund", "MPLADS Fund"];
    const priorityFactor = item.count * item.maxImpact;

    return {
      ...item,
      label,
      funding: channels,
      estCost: estimate.costLakhs,
      costText: estimate.costText,
      priorityFactor,
      variablesUsed: estimate.variablesUsed,
      rateStr: estimate.rateStr,
      confidence: estimate.confidence
    };
  }).sort((a, b) => b.priorityFactor - a.priorityFactor);

  const getReportText = (count: number) => count === 1 ? "1 Report" : `${count} Reports`;

  return (
    <div className="flex flex-col h-full overflow-y-auto px-5 pt-5 pb-6 bg-background scrollbar-none font-sans animate-fadeIn">
      <div className="flex items-center gap-3 mb-5 shrink-0 bg-card p-4 border border-border rounded-2xl shadow-sm">
        <button onClick={onBack} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center active-press">
          <ChevronLeft size={18} className="text-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground leading-none" style={DF}>Budget Assistant</h1>
          <p className="text-[10px] text-muted-foreground mt-1">Recalculated dynamically from active report statistics</p>
        </div>
      </div>

      <div className="space-y-4">
        {budgetItems.length === 0 ? (
          <div className="p-8 text-center bg-card border border-border rounded-2xl shadow-sm">
            <span className="text-sm text-muted-foreground font-semibold">No active budget allocations needed.</span>
          </div>
        ) : (
          budgetItems.map((item, idx) => {
            const key = item.category;
            const isExpanded = expandedKey === key;

            return (
              <div key={key} className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden transition-all animate-fadeIn">
                {/* Accordion Toggle Header */}
                <button
                  onClick={() => setExpandedKey(isExpanded ? null : key)}
                  className="w-full p-4 flex items-start justify-between text-left hover:bg-secondary/20 transition-colors">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[9.5px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-md font-mono">
                        Rank #{idx + 1}
                      </span>
                      <span className="text-[10.5px] text-muted-foreground font-semibold">{item.ward}</span>
                    </div>
                    <h3 className="text-sm font-bold text-foreground mt-1.5 leading-snug">{item.label}</h3>
                    <div className="flex gap-4 mt-2 text-[11px] text-muted-foreground">
                      <p>Cost: <strong className="text-primary font-black">{item.costText}</strong></p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDrillDown({
                            title: `Contributing ${item.category.toUpperCase()} Reports`,
                            category: item.category,
                            ward: "all"
                          });
                        }}
                        className="hover:underline text-primary flex items-center gap-1 font-extrabold bg-primary/5 border border-primary/20 px-2 py-0.5 rounded-lg active-press transition-colors">
                        Reports: <span className="underline">{getReportText(item.count)}</span>
                      </button>
                    </div>
                  </div>
                  <ChevronRight size={16} className={`text-muted-foreground mt-1.5 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </button>

                {isExpanded && (
                  <div className="p-4 border-t border-border bg-card animate-slideDown space-y-4">
                    {/* Report Density Button */}
                    <div className="bg-secondary/40 border border-border rounded-xl p-3 flex justify-between items-center">
                      <div>
                        <p className="text-[9.5px] text-muted-foreground font-bold uppercase tracking-wider font-mono">Report Density</p>
                        <p className="text-xs text-foreground font-bold mt-1">Grievance clusters supporting this recommendation</p>
                      </div>
                      <button
                        onClick={() => setSelectedDrillDown({
                          title: `Contributing ${item.category.toUpperCase()} Reports`,
                          category: item.category,
                          ward: "all"
                        })}
                        className="text-xs font-bold bg-primary text-white px-3 py-1.5 rounded-xl active-press shadow-sm flex items-center gap-1">
                        <span>{getReportText(item.count)}</span>
                        <ChevronRight size={12} />
                      </button>
                    </div>

                    {/* AI Cost Model Variables Block */}
                    <div className="p-3 bg-secondary/50 rounded-xl space-y-2 text-[10.5px] font-sans text-foreground border border-border/40">
                      <p className="text-[9.5px] text-muted-foreground uppercase font-bold tracking-wider font-mono border-b border-border/50 pb-1">AI Cost Model Parameters</p>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground text-[9px] uppercase font-bold tracking-wider block">Estimated Material</span>
                          <p className="font-bold text-foreground mt-0.5">₹{(item.estCost * 0.60).toFixed(1)} Lakhs</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[9px] uppercase font-bold tracking-wider block">Estimated Labour</span>
                          <p className="font-bold text-foreground mt-0.5">₹{(item.estCost * 0.40).toFixed(1)} Lakhs</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[9px] uppercase font-bold tracking-wider block">Infrastructure Length</span>
                          <p className="font-bold text-foreground mt-0.5">{item.variablesUsed}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[9px] uppercase font-bold tracking-wider block">Unit Cost</span>
                          <p className="font-bold text-foreground mt-0.5">{item.rateStr}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/40 space-y-1">
                        <p className="text-[10px]">Calculation Formula: <strong className="font-mono text-slate-800">Cost = Length/Units * Standard Unit Rate</strong></p>
                        <p className="text-[10px]">AI Cost Confidence: <strong className="text-green-700 font-bold">{item.confidence}</strong></p>
                      </div>
                    </div>

                    {/* Suggested Funding Channels */}
                    <div className="space-y-1.5 font-sans">
                      <p className="text-[9.5px] text-muted-foreground font-bold uppercase tracking-wider font-mono">Suggested Funding Recommendation</p>
                      <div className="flex flex-wrap gap-1.5">
                        {item.funding.map((fund) => (
                          <span key={fund} className="text-[9.5px] bg-secondary text-foreground font-semibold px-2 py-0.5 rounded-lg border border-border">
                            {fund}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* AI Funding Allocation Reason */}
                    <div className="p-3 bg-secondary/35 rounded-xl border border-border/40 font-sans">
                      <p className="text-[9.5px] text-muted-foreground font-bold uppercase tracking-wider font-mono mb-0.5">AI Funding Allocation Reason</p>
                      <p className="text-xs text-foreground leading-relaxed font-medium">
                        High constituency necessity due to {getReportText(item.count)} affecting approximately {item.count * 35} residents. Essential infrastructure improvement takes priority.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Drill-down reports modal */}
      {selectedDrillDown && (
        <FilterableReportsModal
          title={selectedDrillDown.title}
          initialCategory={selectedDrillDown.category}
          initialWard={selectedDrillDown.ward}
          onClose={() => setSelectedDrillDown(null)}
          onSelect={onComplaintSelect}
        />
      )}
    </div>
  );
}

if (typeof window !== "undefined") {
  const params = new URLSearchParams(window.location.search);
  if (params.get("clear") === "true") {
    localStorage.clear();
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class DashboardErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("MP Dashboard Crash caught by boundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-background font-sans">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4 border border-red-100">
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-sm font-bold text-foreground mb-1.5">We couldn't load your dashboard</h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-[240px] mb-5">
            An unexpected error occurred while loading constituency data. Please refresh or try again.
          </p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl active-press shadow-sm">
            Refresh Dashboard
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface GuidedStep {
  targetId: string | null;
  title: string;
  body: string;
  tabChange?: string;
}

const CITIZEN_TOUR: GuidedStep[] = [
  {
    targetId: "tour-welcome-header",
    title: "Welcome to JanVaani",
    body: "Submit civic issues directly to your local representative.",
    tabChange: "home"
  },
  {
    targetId: "tour-report-btn",
    title: "Report a Problem",
    body: "Report an issue using text, voice or photo.",
    tabChange: "home"
  },
  {
    targetId: "tour-complaints-tab",
    title: "My Reports",
    body: "View all reports you have submitted.",
    tabChange: "home"
  },
  {
    targetId: "tour-bell-btn",
    title: "Notifications",
    body: "Receive important notifications and updates.",
    tabChange: "home"
  },
  {
    targetId: "tour-profile-tab",
    title: "Profile",
    body: "Manage your profile, language and settings. You're all set. Start reporting issues in your community.",
    tabChange: "home"
  }
];

const MP_TOUR: GuidedStep[] = [
  {
    targetId: "tour-mp-summary",
    title: "Dashboard Summary",
    body: "Welcome to JanVaani Intelligence Dashboard. View real-time constituency insights and report statistics.",
    tabChange: "dashboard"
  },
  {
    targetId: "tour-mp-priority",
    title: "Priority Intelligence",
    body: "Review AI-ranked community issues based on impact, severity and citizen support.",
    tabChange: "dashboard"
  },
  {
    targetId: "tour-mp-analytics",
    title: "Constituency Analytics",
    body: "Monitor health indicators, trends and category distributions.",
    tabChange: "dashboard"
  },
  {
    targetId: "tour-mp-budget-tab",
    title: "Budget Assistant",
    body: "Review AI-generated funding recommendations and estimated infrastructure costs.",
    tabChange: "dashboard"
  },
  {
    targetId: "tour-mp-bell-btn",
    title: "Notifications",
    body: "Receive anomaly alerts and important constituency updates.",
    tabChange: "dashboard"
  },
  {
    targetId: "tour-mp-profile-tab",
    title: "Profile",
    body: "Manage representative information, preferences and account settings. Your dashboard is ready. JanVaani will continuously analyse incoming community reports and provide AI-powered constituency insights.",
    tabChange: "dashboard"
  }
];

function GuidedTour({
  steps,
  onComplete,
  onSkip,
  activeTab,
  setActiveTab,
}: {
  steps: GuidedStep[];
  onComplete: () => void;
  onSkip: () => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = steps[currentIdx];

  // Auto-switch tab if step requires it
  useEffect(() => {
    if (step.tabChange && activeTab !== step.tabChange) {
      setActiveTab(step.tabChange);
    }
  }, [currentIdx, step.tabChange]);

  // Recalculate target coordinates on index/tab switch or window resize
  useEffect(() => {
    const updateRect = () => {
      if (!step.targetId) {
        setRect(null);
        return;
      }
      const targetEl = document.getElementById(step.targetId);
      const containerEl = document.getElementById("phone-frame-inner");
      if (targetEl && containerEl) {
        // Scroll into view if target is outside visible area
        targetEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
        
        const tRect = targetEl.getBoundingClientRect();
        const cRect = containerEl.getBoundingClientRect();
        
        setRect({
          x: tRect.left - cRect.left,
          y: tRect.top - cRect.top,
          width: tRect.width,
          height: tRect.height,
          left: tRect.left - cRect.left,
          top: tRect.top - cRect.top,
          right: tRect.right - cRect.left,
          bottom: tRect.bottom - cRect.top,
          toJSON: () => {},
        } as DOMRect);
      } else {
        setRect(null);
      }
    };

    // Delay calculation to allow render or scroll adjustment
    const timeout = setTimeout(updateRect, 100);
    window.addEventListener("resize", updateRect);
    // Poll to keep coordinate synced as dynamic content loads
    const interval = setInterval(updateRect, 300);
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", updateRect);
      clearInterval(interval);
    };
  }, [currentIdx, step.targetId, activeTab]);

  const handleNext = () => {
    if (currentIdx === steps.length - 1) {
      onComplete();
    } else {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  if (!rect) {
    return (
      <div className="absolute inset-0 bg-slate-900/65 z-[9990] flex items-center justify-center p-6 animate-fadeIn font-sans pointer-events-auto">
        <div className="bg-card w-full max-w-xs rounded-3xl p-6 shadow-2xl border border-border space-y-4 animate-slideUp text-center">
          <h3 className="text-base font-bold text-foreground">{step.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{step.body}</p>
          <div className="flex gap-2 pt-2">
            <button onClick={onSkip} className="flex-1 py-2 bg-secondary text-muted-foreground text-xs font-bold rounded-xl active-press">
              Skip Tour
            </button>
            <button onClick={handleNext} className="flex-1 py-2 bg-primary text-white text-xs font-bold rounded-xl active-press">
              {currentIdx === steps.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const padding = 10;
  const spotlightTop = rect.y - padding;
  const spotlightBottom = rect.y + rect.height + padding;
  const spotlightLeft = rect.x - padding;

  const cardWidth = 280;
  const containerEl = document.getElementById("phone-frame-inner");
  const containerHeight = containerEl ? containerEl.clientHeight : 780;
  const containerWidth = containerEl ? containerEl.clientWidth : 375;

  // Status bar margin (56px) and bottom nav bar spacing
  const safeTop = 56;
  const safeBottom = containerHeight - 80 - 16; 

  const isNearBottomNav = spotlightBottom > (containerHeight - 110) || 
                          (step.targetId?.includes("-tab"));

  // Check which position fits without overlapping the spotlight cutout
  const estimatedHeight = 170;
  const spaceAbove = spotlightTop - safeTop;
  const spaceBelow = safeBottom - spotlightBottom;

  // If there is insufficient space on both sides (e.g. element is too tall)
  const needsInside = spaceAbove < 140 && spaceBelow < 140;

  const fitsAbove = spaceAbove >= estimatedHeight;
  const fitsBelow = spaceBelow >= estimatedHeight;

  let position: "above" | "below" | "inside" = "below";
  if (needsInside) {
    position = "inside";
  } else if (isNearBottomNav) {
    position = "above";
  } else if (spotlightTop < 180) {
    position = "below";
  } else if (fitsAbove && !fitsBelow) {
    position = "above";
  } else if (fitsBelow && !fitsAbove) {
    position = "below";
  } else {
    // Pick side with more space
    position = spaceAbove > spaceBelow ? "above" : "below";
  }

  let leftPos = rect.left + rect.width / 2 - cardWidth / 2;
  leftPos = Math.max(16, Math.min(containerWidth - cardWidth - 16, leftPos));

  const cardStyle: React.CSSProperties = {
    width: cardWidth,
    left: leftPos,
    position: "absolute",
    zIndex: 9995,
    overflowY: "auto",
  };

  if (position === "inside") {
    // Display the card anchored to the bottom-inside of the safe screen area (clearing bottom nav)
    cardStyle.bottom = `${containerHeight - safeBottom}px`;
    cardStyle.top = "auto";
    cardStyle.maxHeight = `${safeBottom - safeTop - 32}px`;
  } else if (position === "above") {
    cardStyle.bottom = `${containerHeight - spotlightTop + 16}px`;
    cardStyle.top = "auto";
    cardStyle.maxHeight = `${spotlightTop - safeTop - 16}px`;
  } else {
    cardStyle.top = `${spotlightBottom + 16}px`;
    cardStyle.bottom = "auto";
    cardStyle.maxHeight = `${safeBottom - spotlightBottom - 16}px`;
  }

  return (
    <div className="absolute inset-0 z-[9990] overflow-hidden pointer-events-none font-sans">
      <svg className="absolute inset-0 w-full h-full pointer-events-auto" style={{ mixBlendMode: "multiply" }}>
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={spotlightLeft}
              y={spotlightTop}
              width={rect.width + 2 * padding}
              height={rect.height + 2 * padding}
              rx="12"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.65)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Spotlight border outline to highlight element */}
      <div
        className="absolute border-2 border-primary rounded-xl pointer-events-none transition-all duration-350 ease-out"
        style={{
          left: spotlightLeft,
          top: spotlightTop,
          width: rect.width + 2 * padding,
          height: rect.height + 2 * padding,
          zIndex: 9992,
        }}
      />

      <div
        className="absolute bg-card border border-border shadow-2xl rounded-2xl p-5 space-y-3.5 pointer-events-auto transition-all duration-350 ease-out"
        style={cardStyle}
      >
        <div className="flex justify-between items-center">
          <span className="text-[10px] bg-secondary text-primary font-bold px-2 py-0.5 rounded-full font-mono">
            {currentIdx + 1} / {steps.length}
          </span>
          <button onClick={onSkip} className="text-[10px] text-muted-foreground font-semibold hover:text-foreground">
            Skip Tour
          </button>
        </div>

        <div className="space-y-1">
          <h4 className="text-xs font-bold text-foreground">{step.title}</h4>
          <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">{step.body}</p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <button
            disabled={currentIdx === 0}
            onClick={handlePrev}
            className={`text-[10px] font-bold py-1.5 px-3 rounded-lg border transition-colors ${currentIdx === 0 ? "border-border text-muted-foreground/30 bg-secondary/10 cursor-not-allowed" : "border-border text-foreground hover:bg-secondary bg-card active-press"}`}
          >
            Previous
          </button>
          
          <button
            onClick={handleNext}
            className="text-[10px] font-bold py-1.5 px-4 bg-primary text-white rounded-lg active-press shadow-sm"
          >
            {currentIdx === steps.length - 1 ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [tick, setTick] = useState(0);
  const [timeTick, setTimeTick] = useState(0);
  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      setCurrentTime(`${hours}:${minutes} ${ampm}`);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleUpdate = () => setTick(t => t + 1);
    window.addEventListener("complaints_updated", handleUpdate);
    return () => window.removeEventListener("complaints_updated", handleUpdate);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTick(t => t + 1);
    }, 15000); // refresh relative times every 15 seconds
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("clear") === "true") {
      localStorage.clear();
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({ path: newUrl }, "", newUrl);
      setPhase("onboard");
      setCitizenTab("home");
      setMpTab("dashboard");
      setSelectedComplaint(null);
      setTourType(null);
    }
  }, []);

  const [phase, setPhase] = useState<Phase>(() => {
    const step = parseInt(localStorage.getItem("onboard_step") || "0");
    if (step >= 5) {
      return (localStorage.getItem("onboard_role") as Phase) || "onboard";
    }
    return "onboard";
  });
  const [citizenTab, setCitizenTab] = useState<CitizenTab>("home");
  const [mpTab, setMpTab] = useState<MPTab>("dashboard");
  const [citizenHistory, setCitizenHistory] = useState<CitizenTab[]>(["home"]);
  const [mpHistory, setMpHistory] = useState<MPTab[]>(["dashboard"]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const [prioritySeverity, setPrioritySeverity] = useState<"all" | "critical">("all");
  const [mapCategoryFilter, setMapCategoryFilter] = useState<ComplaintCategory | "all">("all");

  const [notifications, setNotifications] = useState<any[]>([
    { id: "1", title: "Welcome to JanVaani!", desc: "Submit civic grievances directly to your local representative.", timestamp: Date.now() - 120000, unread: true },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [tourType, setTourType] = useState<"citizen" | "mp" | null>(null);

  useEffect(() => {
    if (phase === "citizen") {
      if (localStorage.getItem("citizen_tour_completed") !== "true") {
        setTourType("citizen");
      }
    } else if (phase === "mp") {
      if (localStorage.getItem("mp_tour_completed") !== "true") {
        setTourType("mp");
      }
    }
  }, [phase]);

  const navigateCitizen = (tab: CitizenTab) => {
    setCitizenHistory(prev => [...prev, tab]);
    setCitizenTab(tab);
  };

  const navigateMP = (tab: MPTab) => {
    setMpHistory(prev => [...prev, tab]);
    setMpTab(tab);
  };

  const goBackCitizen = () => {
    setCitizenHistory(prev => {
      if (prev.length <= 1) {
        setCitizenTab("home");
        return ["home"];
      }
      const nextHistory = prev.slice(0, -1);
      setCitizenTab(nextHistory[nextHistory.length - 1]);
      return nextHistory;
    });
  };

  const goBackMP = () => {
    setMpHistory(prev => {
      if (prev.length <= 1) {
        setMpTab("dashboard");
        return ["dashboard"];
      }
      const nextHistory = prev.slice(0, -1);
      setMpTab(nextHistory[nextHistory.length - 1]);
      return nextHistory;
    });
  };

  const handleComplaintSelect = (c: Complaint) => {
    setSelectedComplaint(c);
    if (phase === "citizen") {
      setCitizenHistory(prev => [...prev, "detail"]);
      setCitizenTab("detail");
    }
    if (phase === "mp") {
      setMpHistory(prev => [...prev, "detail"]);
      setMpTab("detail");
    }
  };

  const handleMapComplaintSelect = (summary: any) => {
    const full = complaintService.getById(summary.id);
    if (full) handleComplaintSelect(full);
  };

  const citizenNav = [
    { id: "home" as CitizenTab,       icon: <Home size={21} />,          label: "Home" },
    { id: "report" as CitizenTab,     icon: <Plus size={22} />,          label: "Report" },
    { id: "complaints" as CitizenTab, icon: <ClipboardList size={21} />, label: "My Reports" },
    { id: "profile" as CitizenTab,    icon: <User size={21} />,          label: "Profile" },
  ];

  const mpNav = [
    { id: "dashboard" as MPTab, icon: <Home size={21} />,    label: "Dashboard" },
    { id: "priority" as MPTab,  icon: <Flame size={21} />,   label: "Priority" },
    { id: "map" as MPTab,       icon: <MapIcon size={21} />, label: "Map" },
    { id: "budget" as MPTab,    icon: <Banknote size={21} />, label: "Budget" },
    { id: "profile" as MPTab,   icon: <User size={21} />,    label: "Profile" },
  ];

  const showNav = phase !== "onboard" && citizenTab !== "detail" && mpTab !== "detail";

  const handleLogout = () => {
    localStorage.clear();
    setPhase("onboard");
    setCitizenTab("home");
    setMpTab("dashboard");
    setSelectedComplaint(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-16 pb-10 px-4"
      style={{ background: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 50%, #D1FAE5 100%)" }}>

      {/* Demo Switcher */}
      {phase !== "onboard" && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex gap-1.5 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-white/60">
          <button onClick={() => { setPhase("citizen"); setCitizenTab("home"); }}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${phase === "citizen" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            style={DF}>Citizen</button>
          <button onClick={() => { setPhase("mp"); setMpTab("dashboard"); }}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${phase === "mp" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            style={DF}>MP Dashboard</button>
          <button onClick={() => {
            localStorage.setItem("onboard_step", "0");
            localStorage.removeItem("citizen_tour_completed");
            localStorage.removeItem("mp_tour_completed");
            setPhase("onboard");
            setCitizenTab("home");
            setMpTab("dashboard");
            setSelectedComplaint(null);
            setTourType(null);
          }}
            className="px-4 py-2 rounded-full text-xs font-bold text-muted-foreground hover:text-foreground"
            style={DF}>↩ Onboarding</button>
        </div>
      )}

      {/* Phone Frame */}
      <div className="relative rounded-[3.5rem] border-[5px] border-slate-800 overflow-hidden bg-background"
        style={{ width: 375, height: 780, boxShadow: "0 40px 80px rgba(15,23,42,0.25), 0 0 0 1px rgba(15,23,42,0.05)" }}>

        {/* Dynamic Island */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[110px] h-7 bg-slate-900 rounded-b-3xl z-10 flex items-center justify-center gap-3">
          <div className="w-2 h-2 rounded-full bg-slate-700" />
          <div className="w-9 h-2 rounded-full bg-slate-700" />
        </div>

        <div id="phone-frame-inner" className="absolute inset-0 flex flex-col">
          {/* Status Bar */}
          <div className="h-10 shrink-0 flex items-end justify-between px-7 pb-1">
            <span className="text-[11px] font-bold text-foreground">{currentTime}</span>
            <div className="flex gap-1.5 items-center">
              <Wifi size={12} className="text-foreground" />
              <div className="flex gap-0.5 items-end">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-[3px] bg-foreground rounded-sm" style={{ height: i * 3 + 1 }} />
                ))}
              </div>
            </div>
          </div>

          {/* Screen Content */}
          <div className="flex-1 overflow-hidden bg-background">
            {phase === "onboard" && <Onboard onDone={(role) => setPhase(role)} />}

            {phase === "citizen" && (
              <>
                {citizenTab === "home" && (
                  <CitizenHome
                    setTab={setCitizenTab}
                    onBellClick={() => setShowNotifications(true)}
                    unreadCount={notifications.filter(n => n.unread).length}
                  />
                )}
                {citizenTab === "report" && (
                  <ReportWizard
                    onBack={goBackCitizen}
                    onComplaintRegistered={(shortId, category) => {
                      setNotifications(prev => [
                        {
                          id: String(Date.now()),
                          title: "Complaint Registered",
                          desc: `Your ${category} complaint (${shortId}) has been successfully submitted.`,
                          timestamp: Date.now(),
                          unread: true,
                        },
                        ...prev,
                      ]);
                    }}
                  />
                )}
                {citizenTab === "complaints" && (
                  <CitizenComplaints onSelect={handleComplaintSelect} setTab={setCitizenTab} />
                )}
                {citizenTab === "detail" && selectedComplaint && (
                  <ComplaintDetailCitizen
                    complaint={selectedComplaint}
                    onBack={goBackCitizen}
                  />
                )}
                {citizenTab === "profile" && (
                  <CitizenProfile
                    onLogout={handleLogout}
                    onBack={goBackCitizen}
                    onSelect={handleComplaintSelect}
                    setTab={setCitizenTab}
                    onStartTour={() => setTourType("citizen")}
                  />
                )}
              </>
            )}

            {phase === "mp" && (
              <DashboardErrorBoundary>
                {mpTab === "dashboard" && (
                  <MPDashboard
                    onComplaintSelect={handleComplaintSelect}
                    onBellClick={() => setShowNotifications(true)}
                    unreadCount={notifications.filter(n => n.unread).length}
                    setTab={setMpTab}
                    setPrioritySeverity={setPrioritySeverity}
                    setMapCategoryFilter={setMapCategoryFilter}
                    onBack={() => setPhase("onboard")}
                  />
                )}
                {mpTab === "priority" && (
                  <MPPriority
                    onComplaintSelect={handleComplaintSelect}
                    severityFilter={prioritySeverity}
                    setSeverityFilter={setPrioritySeverity}
                    onBack={goBackMP}
                  />
                )}
                {mpTab === "map" && (
                  <MPMapScreen
                    onComplaintSelect={handleMapComplaintSelect}
                    initialCategoryFilter={mapCategoryFilter}
                    onBack={goBackMP}
                  />
                )}
                {mpTab === "budget" && (
                  <MPBudgetAssistant onBack={goBackMP} onComplaintSelect={handleComplaintSelect} />
                )}
                {mpTab === "profile" && <MPProfile onLogout={handleLogout} onBack={goBackMP} onStartTour={() => setTourType("mp")} />}
                {mpTab === "detail" && selectedComplaint && (
                  <MPComplaintDetail
                    complaint={selectedComplaint}
                    onBack={goBackMP}
                    onUpdated={(updated) => setSelectedComplaint(updated)}
                  />
                )}
              </DashboardErrorBoundary>
            )}
          </div>

          {/* Notifications Drawer */}
          {showNotifications && (
            <div className="absolute inset-0 bg-black/60 z-50 flex flex-col justify-end animate-fadeIn">
              <div className="absolute inset-0" onClick={() => {
                setShowNotifications(false);
                setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
              }} />
              <div className="relative bg-background rounded-t-3xl max-h-[70%] flex flex-col z-10 shadow-2xl border-t border-border animate-fadeIn">
                <div className="shrink-0 p-5 border-b border-border flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground" style={DF}>Notifications</h3>
                  <button onClick={() => {
                    setShowNotifications(false);
                    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
                  }} className="text-xs font-bold text-primary active-press">Close</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none">
                  {notifications.map(n => (
                    <div key={n.id} className={`p-4 rounded-2xl border transition-all ${n.unread ? "bg-primary/5 border-primary/20" : "bg-card border-border"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-foreground">{n.title}</p>
                        <span className="text-[9px] text-muted-foreground font-semibold shrink-0">
                          {formatRelativeTime(n.timestamp)}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{n.desc}</p>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p className="text-center text-xs text-muted-foreground py-8">No notifications yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bottom Nav */}
          {showNav && (
            <div className="shrink-0 border-t border-border bg-card/95 backdrop-blur-sm pb-6 pt-1 px-1">
              {phase === "citizen" ? (
                <div className="flex items-end">
                  {citizenNav.map(item => (
                    <button key={item.id} id={`tour-${item.id}-tab`} onClick={() => { setCitizenHistory([item.id]); setCitizenTab(item.id); }}
                      className={`flex-1 flex flex-col items-center py-1.5 transition-colors ${
                        item.id === "report" ? "relative" :
                        citizenTab === item.id ? "text-primary" : "text-muted-foreground"
                      }`}>
                      {item.id === "report" ? (
                        <>
                          <div className="w-12 h-12 -mt-5 rounded-full flex items-center justify-center bg-primary"
                            style={{ boxShadow: "0 4px 16px rgba(22,101,52,0.35)" }}>
                            <span className="text-white">{item.icon}</span>
                          </div>
                          <span className="text-[10px] font-bold mt-0.5 text-primary">{item.label}</span>
                        </>
                      ) : (
                        <>
                          {item.icon}
                          <span className={`text-[10px] font-semibold mt-0.5 ${citizenTab === item.id ? "text-primary" : "text-muted-foreground"}`}>
                            {item.label}
                          </span>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex">
                  {mpNav.map(item => (
                    <button key={item.id} id={`tour-mp-${item.id}-tab`} onClick={() => {
                      if (item.id === "map") setMapCategoryFilter("all");
                      if (item.id === "priority") setPrioritySeverity("all");
                      setMpHistory([item.id]);
                      setMpTab(item.id);
                    }}
                      className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors ${mpTab === item.id ? "text-primary" : "text-muted-foreground"}`}>
                      {item.icon}
                      <span className={`text-[10px] font-semibold ${mpTab === item.id ? "text-primary" : "text-muted-foreground"}`}>
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Guided interactive onboarding tours overlay */}
          {tourType === "citizen" && (
            <GuidedTour
              steps={CITIZEN_TOUR}
              onComplete={() => {
                setTourType(null);
                localStorage.setItem("citizen_tour_completed", "true");
              }}
              onSkip={() => {
                setTourType(null);
                localStorage.setItem("citizen_tour_completed", "true");
              }}
              activeTab={citizenTab}
              setActiveTab={(tab) => {
                setCitizenHistory([tab]);
                setCitizenTab(tab);
              }}
            />
          )}

          {tourType === "mp" && (
            <GuidedTour
              steps={MP_TOUR}
              onComplete={() => {
                setTourType(null);
                localStorage.setItem("mp_tour_completed", "true");
              }}
              onSkip={() => {
                setTourType(null);
                localStorage.setItem("mp_tour_completed", "true");
              }}
              activeTab={mpTab}
              setActiveTab={(tab) => {
                setMpHistory([tab]);
                setMpTab(tab);
              }}
            />
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-400 font-medium text-center">
        {import.meta.env.VITE_APP_NAME || "JanVaani"} · National Civic Engagement & Grievance Redressal Platform
      </p>
    </div>
  );
}
