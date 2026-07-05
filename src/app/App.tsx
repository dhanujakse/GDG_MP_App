// ─────────────────────────────────────────────────────────────────────────────
// App.tsx — Civic Connect AI  |  Root Shell
//
// This file is the router and layout shell ONLY.
// All business logic lives in services/. All screen logic lives in screens/.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
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
import { complaintService } from "@/services/complaint.service";
import { uploadCitizenDP } from "@/services/firebase";
import { ReportWizard } from "@/app/screens/citizen/ReportWizard";
import { ComplaintDetailCitizen } from "@/app/screens/citizen/ComplaintDetailCitizen";
import { MPComplaintDetail } from "@/app/screens/mp/MPComplaintDetail";
import { MPMapScreen } from "@/app/screens/mp/MPMapScreen";
import { SeverityBadge } from "@/app/components/shared/SeverityBadge";
import { StatusBadge } from "@/app/components/shared/StatusBadge";
import { CategoryIcon, getCategoryLabel, getCategoryEmoji } from "@/app/components/shared/CategoryIcon";
import { ImpactScoreMeter } from "@/app/components/shared/ImpactScoreMeter";
import type { Complaint, ComplaintSummary, ComplaintStatus, ComplaintCategory } from "@/types";

type Phase = "onboard" | "citizen" | "mp";
type CitizenTab = "home" | "report" | "complaints" | "profile" | "detail";
type MPTab = "dashboard" | "priority" | "map" | "profile" | "detail";

const DF: React.CSSProperties = { fontFamily: "var(--font-display)" };

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
    ? name.trim().length >= 2 && wardNumber !== "" && areaName.trim().length >= 2
    : ward !== "";

  // Step 0 — Language
  if (step === 0) return (
    <div className="flex flex-col h-full overflow-y-auto px-5 pt-8 pb-6 animate-fadeIn scrollbar-none">
      <div className="mb-6">
        <div className="mb-4 w-16 h-16 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center overflow-hidden p-2.5">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-1" style={DF}>Choose Language</h1>
        <p className="text-sm text-muted-foreground">Select your preferred language · अपनी भाषा चुनें</p>
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
  if (step === 3) return (
    <div className="flex flex-col h-full px-5 pt-8 pb-6 animate-fadeIn">
      <button onClick={() => setStep(2)} className="flex items-center gap-1 text-xs text-muted-foreground mb-6">
        <ChevronLeft size={14} /> Back
      </button>
      <h1 className="text-2xl font-bold text-foreground mb-1" style={DF}>Enter OTP</h1>
      <p className="text-sm text-muted-foreground mb-1">
        Sent to {role === "citizen" ? `+91 ${phone}` : phone}
      </p>
      <p className="text-xs text-muted-foreground mb-6">
        Expires in 5 minutes · <span className="text-primary font-semibold">Resend in 45s</span>
      </p>
      <div className="relative mb-2">
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`flex-1 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-colors ${otp.length === i ? "border-primary" : otp.length > i ? "border-primary/40 bg-secondary" : "border-border bg-secondary"}`}>
              {otp[i] || ""}
            </div>
          ))}
        </div>
        <input type="tel" maxLength={6} value={otp} autoFocus
          onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
      </div>
      <button onClick={() => setOtp("847291")} className="text-xs text-primary font-semibold text-left mb-6">
        Demo: Auto-fill OTP →
      </button>
      <button onClick={() => setStep(4)} disabled={otp.length < 6}
        className={`w-full py-4 rounded-2xl font-bold mt-auto ${otp.length >= 6 ? "bg-primary text-white" : "bg-secondary text-muted-foreground"}`}
        style={DF}>
        Verify OTP
      </button>
    </div>
  );

  // Step 4 — Ward / Constituency
  if (step === 4) return (
    <div className="flex flex-col h-full overflow-y-auto px-5 pt-8 pb-6 animate-fadeIn scrollbar-none">
      <h1 className="text-2xl font-bold text-foreground mb-1" style={DF}>
        {role === "citizen" ? "Your Area" : "Select Constituency"}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">Set once — never asked again</p>
      {role === "citizen" ? (
        <div className="space-y-3">
          <div className="p-4 bg-secondary rounded-2xl border border-border">
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Your Full Name</p>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name"
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-medium" />
          </div>
          <div className="p-4 bg-secondary rounded-2xl border border-border">
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Ward Number</p>
            <select value={wardNumber} onChange={e => setWardNumber(e.target.value)}
              className="w-full bg-transparent text-sm text-foreground outline-none border-none cursor-pointer font-medium">
              <option value="" disabled className="bg-card text-muted-foreground">Select Ward Number</option>
              {Array.from({ length: 100 }, (_, i) => `Ward ${i + 1}`).map(w => (
                <option key={w} value={w} className="bg-card text-foreground">{w}</option>
              ))}
            </select>
          </div>
          <div className="p-4 bg-secondary rounded-2xl border border-border">
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Street / Area Name</p>
            <input value={areaName} onChange={e => setAreaName(e.target.value)} placeholder="e.g. KK Nagar"
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-medium" />
          </div>
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-2xl">
            <MapPin size={16} className="text-green-600 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">District (auto-detected when location is enabled)</p>
              <p className="text-sm font-bold text-foreground">Madurai</p>
            </div>
            <CheckCircle size={15} className="text-green-500" />
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Select Constituency</p>
          {["Madurai Central", "Madurai North", "Theni", "Virudhunagar", "Dindigul"].map(c => (
            <button key={c} onClick={() => setWard(c)}
              className={`w-full p-4 rounded-2xl border-2 text-left text-sm font-semibold transition-all ${ward === c ? "border-primary bg-secondary text-primary" : "border-border bg-card text-foreground"}`}>
              {c}
            </button>
          ))}
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-xs text-blue-700 font-medium flex items-center gap-1.5">
              <CheckCircle size={12} /> Cross-verified with Lok Sabha public records
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
          <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden p-1 shrink-0">
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
    <div className="flex flex-col h-full overflow-y-auto scrollbar-none">
      <div className="pt-6 pb-4 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center overflow-hidden p-1.5 shrink-0">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider leading-none">JanVaani</p>
              <h1 className="text-sm font-bold text-foreground mt-1 leading-none" style={DF}>{userName}</h1>
            </div>
          </div>
          <button onClick={onBellClick} className="relative w-10 h-10 rounded-full bg-secondary flex items-center justify-center active-press">
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
        <button onClick={() => setTab("report")}
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

function CitizenProfile({ onLogout, onBack, onSelect, setTab }: { onLogout: () => void; onBack: () => void; onSelect: (c: Complaint) => void; setTab: (t: CitizenTab) => void }) {
  const [photoUrl, setPhotoUrl] = useState<string>(() => localStorage.getItem("citizen_dp") || "");
  const [activeListType, setActiveListType] = useState<null | "filed" | "joined">(null);
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

        <button onClick={onLogout} className="w-full py-3.5 bg-red-50 text-red-600 rounded-2xl font-semibold text-sm border border-red-100">
          Logout
        </button>
      </div>

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
  const stats = complaintService.getDashboardStats();
  const priorityList = complaintService.getPriorityList().slice(0, 5);
  const [filter, setFilter] = useState<"today" | "week" | "month">("week");

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-none">
      <div className="pt-6 pb-4 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center active-press">
              <ChevronLeft size={18} className="text-foreground" />
            </button>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-5 h-5 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden p-0.5 shrink-0">
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="text-[9px] font-bold text-primary uppercase tracking-wider">{import.meta.env.VITE_APP_NAME || "JanVaani"}</span>
              </div>
              <h1 className="text-lg font-bold text-foreground leading-none mt-0.5" style={DF}>Dr. Rajesh Kumar</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">MP · Madurai Central</p>
            </div>
          </div>
          <button onClick={onBellClick} className="relative w-10 h-10 rounded-full bg-secondary flex items-center justify-center active-press">
            <Bell size={19} className="text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card flex items-center justify-center text-[7.5px] text-white font-bold" />
            )}
          </button>
        </div>
      </div>

      <div className="px-5 space-y-4 pb-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: "Total", value: stats.total, color: "text-foreground", bg: "bg-card border-border hover:bg-secondary/40", onClick: () => { setPrioritySeverity("all"); setTab("priority"); } },
            { label: "Critical", value: stats.critical, color: "text-red-600", bg: "bg-red-50 border-red-100 hover:bg-red-100/30", onClick: () => { setPrioritySeverity("critical"); setTab("priority"); } },
          ].map(s => (
            <button key={s.label} onClick={s.onClick} className={`${s.bg} border rounded-2xl p-4 text-left transition-all active-press`}>
              <p className={`text-2xl font-bold ${s.color}`} style={DF}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">{s.label}</p>
            </button>
          ))}
        </div>

        {/* Alert spike */}
        <button
          onClick={() => {
            setMapCategoryFilter("water");
            setTab("map");
          }}
          className="w-full text-left p-3.5 bg-red-50 border border-red-200 rounded-2xl hover:bg-red-100/50 transition-all active-press">
          <div className="flex items-center gap-2 mb-1">
            <Flame size={15} className="text-red-500 animate-pulse" />
            <span className="text-xs font-bold text-red-700 uppercase tracking-wide">AI Alert — Rising Fast</span>
          </div>
          <p className="text-sm font-bold text-red-800" style={DF}>Water complaints ↑ 340% in 48 hours</p>
          <p className="text-xs text-red-600 mt-0.5">KK Nagar, Ward 12–14 · Click to view on map</p>
        </button>

        {/* Priority list */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Flame size={14} className="text-red-500" />
            <p className="text-sm font-bold text-foreground" style={DF}>Top Priority Issues</p>
          </div>
          <div className="space-y-2">
            {priorityList.map((c, i) => {
              const full = complaintService.getById(c.id);
              return (
                <button key={c.id} onClick={() => full && onComplaintSelect(full)}
                  className="w-full flex items-center gap-3 p-3.5 bg-card rounded-2xl border border-border text-left active-press">
                  <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">#{i + 1}</span>
                  <CategoryIcon category={c.category} size={15} showBg bgSize="w-8 h-8" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate" style={DF}>{c.title}</p>
                    <p className="text-[10px] text-muted-foreground">{c.ward} · {c.citizensJoined + 1} joined</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-foreground">{c.impactScore}</p>
                    <p className="text-[9px] text-muted-foreground">score</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Health scores */}
        <div>
          <p className="text-sm font-bold text-foreground mb-3" style={DF}>Constituency Health</p>
          <div className="space-y-2.5">
            {healthScores.map(h => {
              const color = h.status === "critical" ? "bg-red-400" : h.status === "moderate" ? "bg-amber-400" : "bg-green-400";
              const text = h.status === "critical" ? "text-red-600" : h.status === "moderate" ? "text-amber-600" : "text-green-600";
              return (
                <div key={h.name} className="bg-card border border-border rounded-2xl p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-foreground">{h.name}</span>
                    <span className={`text-xs font-bold ${text}`}>{h.score}/100</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${h.score}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {h.prev > h.score ? `↓ from ${h.prev} last month` : `↑ from ${h.prev} last month`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
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
  let allComplaints = complaintService.getPriorityList();

  if (severityFilter === "critical") {
    allComplaints = allComplaints.filter((c) => c.severity === "critical");
  }

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 pt-5 pb-3 px-5 border-b border-border">
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
                  sortBy === s ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
                }`}>
                {s === "score" ? "Impact" : s === "citizens" ? "Citizens" : "Recent"}
              </button>
            ))}
          </div>
          {severityFilter === "critical" && (
            <button onClick={() => setSeverityFilter("all")}
              className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1 active-press">
              🔴 Critical Only (Clear)
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-none px-4 py-3 space-y-3">
        {allComplaints.map((c) => {
          const full = complaintService.getById(c.id);
          return (
            <button key={c.id} onClick={() => full && onComplaintSelect(full)}
              className="w-full bg-card rounded-2xl border border-border p-4 text-left active-press">
              <div className="flex items-start gap-3">
                <CategoryIcon category={c.category} size={17} showBg bgSize="w-10 h-10" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground leading-snug truncate" style={DF}>{c.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{c.ward} · {c.citizensJoined + 1} joined</p>
                  {c.mpSummary && (
                    <p className="text-[11px] text-blue-700 mt-1 leading-snug line-clamp-2">{c.mpSummary}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xl font-black text-foreground leading-none">{c.impactScore}</p>
                  <p className="text-[9px] text-muted-foreground">/ 100</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                <SeverityBadge severity={c.severity} size="sm" />
                <span className="ml-auto text-[10px] text-muted-foreground">{c.assignedDepartment?.replace(/_/g, " ") ?? "Unassigned"}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MPProfile({ onLogout, onBack }: { onLogout: () => void; onBack: () => void }) {
  return (
    <div className="flex flex-col h-full overflow-y-auto px-5 pt-5 pb-6 scrollbar-none">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center active-press">
          <ChevronLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground leading-none" style={DF}>MP Profile</h1>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-5 bg-card rounded-2xl border border-border">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold" style={DF}>R</div>
          <div>
            <p className="text-base font-bold text-foreground" style={DF}>Dr. Rajesh Kumar</p>
            <p className="text-sm text-muted-foreground mt-0.5">Member of Parliament</p>
            <p className="text-xs text-muted-foreground">Madurai Central, Tamil Nadu</p>
          </div>
        </div>
        <div className="p-4 bg-card rounded-2xl border border-border">
          {[["Constituency", "Madurai Central"], ["Assigned Wards", "Ward 8–14"], ["Email", "rajesh@sansad.nic.in"]].map(([k, v], i) => (
            <div key={k} className={`flex items-center justify-between py-3 ${i > 0 ? "border-t border-border" : ""}`}>
              <span className="text-sm text-foreground">{k}</span>
              <span className="text-sm font-semibold text-foreground text-right">{v}</span>
            </div>
          ))}
        </div>
        <div className="p-4 bg-card rounded-2xl border border-border">
          {[["Settings", <FileText size={15} key="s" />], ["Public Dashboard", <Globe size={15} key="p" />]].map(([label, icon]) => (
            <button key={String(label)} className="w-full flex items-center gap-3 py-3 border-b border-border last:border-0">
              <span className="text-muted-foreground">{icon}</span>
              <span className="text-sm text-foreground">{label}</span>
              <ChevronRight size={14} className="ml-auto text-muted-foreground" />
            </button>
          ))}
        </div>
        <button onClick={onLogout} className="w-full py-3.5 bg-red-50 text-red-600 rounded-2xl font-semibold text-sm border border-red-100">
          Logout
        </button>
      </div>
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

export default function App() {
  const [tick, setTick] = useState(0);
  const [timeTick, setTimeTick] = useState(0);

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

  const [phase, setPhase] = useState<Phase>("onboard");
  const [citizenTab, setCitizenTab] = useState<CitizenTab>("home");
  const [mpTab, setMpTab] = useState<MPTab>("dashboard");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const [prioritySeverity, setPrioritySeverity] = useState<"all" | "critical">("all");
  const [mapCategoryFilter, setMapCategoryFilter] = useState<ComplaintCategory | "all">("all");

  const [notifications, setNotifications] = useState<any[]>([
    { id: "1", title: "Welcome to JanVaani!", desc: "Submit civic grievances directly to your local representative.", timestamp: Date.now() - 120000, unread: true },
    { id: "2", title: "Constituency Notice", desc: "Drainage cleaning scheduled for Ward 14 this Friday.", timestamp: Date.now() - 7200000, unread: true },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleComplaintSelect = (c: Complaint) => {
    setSelectedComplaint(c);
    if (phase === "citizen") setCitizenTab("detail");
    if (phase === "mp") setMpTab("detail");
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
          <button onClick={() => { setPhase("onboard"); setCitizenTab("home"); setMpTab("dashboard"); }}
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

        <div className="absolute inset-0 flex flex-col">
          {/* Status Bar */}
          <div className="h-10 shrink-0 flex items-end justify-between px-7 pb-1">
            <span className="text-[11px] font-bold text-foreground">9:41</span>
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
                    onBack={() => setCitizenTab("home")}
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
                    onBack={() => setCitizenTab("complaints")}
                  />
                )}
                {citizenTab === "profile" && (
                  <CitizenProfile
                    onLogout={handleLogout}
                    onBack={() => setCitizenTab("home")}
                    onSelect={handleComplaintSelect}
                    setTab={setCitizenTab}
                  />
                )}
              </>
            )}

            {phase === "mp" && (
              <>
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
                    onBack={() => setMpTab("dashboard")}
                  />
                )}
                {mpTab === "map" && (
                  <MPMapScreen
                    onComplaintSelect={handleMapComplaintSelect}
                    initialCategoryFilter={mapCategoryFilter}
                    onBack={() => setMpTab("dashboard")}
                  />
                )}
                {mpTab === "profile" && <MPProfile onLogout={handleLogout} onBack={() => setMpTab("dashboard")} />}
                {mpTab === "detail" && selectedComplaint && (
                  <MPComplaintDetail
                    complaint={selectedComplaint}
                    onBack={() => setMpTab("priority")}
                    onUpdated={(updated) => setSelectedComplaint(updated)}
                  />
                )}
              </>
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
                    <button key={item.id} onClick={() => setCitizenTab(item.id)}
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
                    <button key={item.id} onClick={() => {
                      if (item.id === "map") setMapCategoryFilter("all");
                      if (item.id === "priority") setPrioritySeverity("all");
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
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-400 font-medium text-center">
        {import.meta.env.VITE_APP_NAME || "JanVaani"} · National Civic Engagement & Grievance Redressal Platform
      </p>
    </div>
  );
}
