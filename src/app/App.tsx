import { useState, useEffect } from "react";
import {
  MapPin, Mic, Home, Plus, ClipboardList, User,
  CheckCircle, ChevronRight, Users, Bell, Phone,
  Droplets, Zap, Trash2, ArrowRight, Flame,
  Filter, Map as MapIcon, Wifi, FileText, Hash,
  Search, Building2, TrendingUp, TrendingDown,
  AlertTriangle, Shield, Banknote, BarChart3,
  Send, ChevronLeft, Camera, MoreVertical,
  RefreshCw, Globe
} from "lucide-react";
import {
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer
} from "recharts";

type Phase = "onboard" | "citizen" | "mp";
type CitizenTab = "home" | "join" | "report" | "complaints" | "profile";
type MPTab = "dashboard" | "priority" | "map" | "profile";
type MPSection = "overview" | "health" | "trends" | "budget" | "routing" | "fake" | "compare" | "alert";

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

const knownComplaints: Record<string, { id: string; title: string; category: string; ward: string; joined: number; date: string; description: string }> = {
  "CHN-2024-0712": { id: "CHN-2024-0712", title: "No Drinking Water", category: "Water Supply", ward: "Ward 12", joined: 23, date: "Jul 1", description: "No water supply for 3 days in the area." },
  "CHN-2024-0645": { id: "CHN-2024-0645", title: "Garbage Not Collected", category: "Sanitation", ward: "Ward 11", joined: 15, date: "Jun 29", description: "Garbage bins overflowing, not collected for 5 days." },
};

const myComplaints = [
  { id: "CHN-2024-0893", title: "Pothole on Main Road", category: "Roads", date: "Jun 28" },
  { id: "CHN-2024-0821", title: "Broken Water Pipe", category: "Water Supply", date: "Jun 15" },
];

const priorityIssues = [
  { id: 1, title: "No Drinking Water — 3 Days", category: "Water Supply", ward: "Ward 12", score: 94, joined: 23, severity: "Critical" },
  { id: 2, title: "Open Sewage on MG Road", category: "Sanitation", ward: "Ward 8", score: 87, joined: 31, severity: "Critical" },
  { id: 3, title: "Garbage Not Collected — 5 Days", category: "Sanitation", ward: "Ward 11", score: 78, joined: 15, severity: "High" },
  { id: 4, title: "Street Lights Dead — Entire Block", category: "Electricity", ward: "Ward 14", score: 71, joined: 8, severity: "High" },
  { id: 5, title: "Road Cave-in Near School", category: "Roads", ward: "Ward 9", score: 65, joined: 19, severity: "High" },
];

const categories = [
  { emoji: "🏥", label: "Hospital", key: "healthcare" },
  { emoji: "💧", label: "Water",    key: "water" },
  { emoji: "🛣️", label: "Roads",    key: "roads" },
  { emoji: "💡", label: "Lights",   key: "electricity" },
  { emoji: "🌊", label: "Drainage", key: "drainage" },
  { emoji: "🏫", label: "School",   key: "education" },
  { emoji: "🚌", label: "Bus",      key: "transport" },
  { emoji: "🗑️", label: "Garbage",  key: "sanitation" },
  { emoji: "📝", label: "Other",    key: "other" },
];

function severityStyle(s: string) {
  if (s === "Critical") return "text-red-600 bg-red-50 border-red-100";
  if (s === "High") return "text-orange-600 bg-orange-50 border-orange-100";
  return "text-amber-600 bg-amber-50 border-amber-100";
}

function catBg(cat: string) {
  if (cat === "water" || cat === "Water Supply") return "bg-blue-50 text-blue-500";
  if (cat === "electricity" || cat === "Electricity") return "bg-yellow-50 text-yellow-500";
  if (cat === "sanitation" || cat === "Sanitation") return "bg-emerald-50 text-emerald-500";
  if (cat === "healthcare") return "bg-red-50 text-red-500";
  return "bg-slate-50 text-slate-500";
}

function CatIcon({ cat, size = 18 }: { cat: string; size?: number }) {
  if (cat === "water" || cat === "Water Supply") return <Droplets size={size} />;
  if (cat === "electricity" || cat === "Electricity") return <Zap size={size} />;
  if (cat === "sanitation" || cat === "Sanitation") return <Trash2 size={size} />;
  if (cat === "healthcare") return <Building2 size={size} />;
  return <MapPin size={size} />;
}

function df(s: string) { return { fontFamily: "var(--font-display)", ...({} as object) } as React.CSSProperties; }
const DF: React.CSSProperties = { fontFamily: "var(--font-display)" };

// ════════════════════════════════════════════════════════
// ONBOARDING
// ════════════════════════════════════════════════════════
// Translations dictionary for dynamic language changes during onboarding
const translations: Record<string, Record<string, string>> = {
  chooseLang: {
    hi: "भाषा चुनें",
    en: "Choose Language",
    bn: "ভাষা নির্বাচন করুন",
    mr: "भाषा निवडा",
    te: "భాషను ఎంచుకోండి",
    ta: "மொழியைத் தேர்ந்தெடுக்கவும்",
    gu: "ભાષા પસંદ કરો",
    ur: "زبان منتخب کریں",
    kn: "ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    or: "ଭାଷା ବାଛନ୍ତು",
    ml: "ഭാഷ തിരഞ്ഞെടുക്കുക",
    pa: "ਭਾਸ਼ਾ ਚੁਣੋ"
  },
  chooseLangSub: {
    hi: "अपनी पसंदीदा भाषा चुनें · Select preferred language",
    en: "Select your preferred language · अपनी भाषा चुनें",
    bn: "আপনার পছন্দের ভাষা নির্বাচন করুন · Select preferred language",
    mr: "तुमची पसंतीची भाषा निवडा · Select preferred language",
    te: "మీకు నచ్చిన భాషను ఎంచుకోండి · Select preferred language",
    ta: "ஒரு மொழியை தேர்ந்தெடுக்கவும் · Select preferred language",
    gu: "તમારી પસંદગીની ભાષા પસંદ કરો · Select preferred language",
    ur: "اپنی پسندیدہ زبان منتخب کریں · Select preferred language",
    kn: "ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ · Select preferred language",
    or: "ଆପଣଙ୍କ ପସନ୍ଦର ଭାଷା ବାଛନ୍ତୁ · Select preferred language",
    ml: "നിങ്ങൾക്കിഷ്ടമുള്ള ഭാഷ തിരഞ്ഞെടുക്കുക · Select preferred language",
    pa: "ਆਪਣੀ ਪਸੰਦੀਦਾ ਭਾਸ਼ਾ ਚੁਣੋ · Select preferred language"
  },
  whoAreYou: {
    hi: "आप कौन हैं?",
    en: "Who are you?",
    ta: "நீங்கள் யார்?",
    bn: "আপনি কে?",
    mr: "तुम्ही कोण आहात?",
    te: "మీరు ఎవరు?",
    gu: "તમે કોણ છો?",
    ur: "آپ کون ہیں؟",
    kn: "ನೀವು ಯಾರು?",
    or: "ଆପଣ କିଏ?",
    ml: "നിങ്ങൾ ആരാണ്?",
    pa: "ਤੁਸੀਂ ਕੌਣ ਹੋ?"
  },
  whoAreYouSub: {
    hi: "जारी रखने के लिए अपनी भूमिका चुनें",
    en: "Select your role to continue",
    ta: "தொடர உங்கள் பாத்திரத்தைத் தேர்ந்தெடுக்கவும்",
    bn: "চালিয়ে যেতে আপনার ভূমিকা নির্বাচন করুন",
    mr: "सुरू ठेवण्यासाठी तुमची भूमिका निवडा",
    te: "కొనసాగించడానికి మీ పాత్రను ఎంచుకోండి",
    gu: "ચાલુ રાખવા માટે તમારી ભૂમિકા પસંદ કરો",
    ur: "جاری رکھنے کے لیے اپنا کردار منتخب کریں",
    kn: "ಮುಂದುವರಿಯಲು ನಿಮ್ಮ ಪಾತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    or: "ଆଗକୁ ବଢିବା ପାଇଁ ଆପଣଙ୍କ ଭୂମಿಕା ବାଛନ୍ତು",
    ml: "തുടരുന്നതിന് നിങ്ങളുടെ റോൾ തിരഞ്ഞെടുക്കുക",
    pa: "ਜਾਰੀ ਰੱਖਣ ਲਈ ਆਪਣੀ ਭੂਮিকা ਚੁਣੋ"
  },
  citizen: {
    hi: "मैं एक नागरिक हूँ",
    en: "I am a Citizen",
    ta: "நான் ஒரு குடிமகன்",
    bn: "আমি একজন নাগরিক",
    mr: "मी एक नागरिक आहे",
    te: "నేను ఒక పౌరుడిని",
    gu: "હું એક નાગરિક છું",
    ur: "میں एक शहरी हूँ",
    kn: "ನಾನು ಒಬ್ಬ ನಾಗರಿಕ",
    or: "ମୁଁ ଜଣେ ନାଗରିକ",
    ml: "ഞാൻ ഒരു പൗരനാണ്",
    pa: "ਮੈਂ ਇੱਕ ਨਾਗਰਿਕ ਹਾਂ"
  },
  citizenSub: {
    hi: "मेरे क्षेत्र की समस्याओं की रिपोर्ट करें",
    en: "Report problems in my area",
    ta: "என் பகுதியில் உள்ள பிரச்சினைகளைப் புகாரளிக்கவும்",
    bn: "আমার এলাকার সমস্যাগুলি রিপোর্ট করুন",
    mr: "माझ्या भागातील समस्यांची तक्रार करा",
    te: "నా ప్రాంతంలోని समस्याలను నివేదించండి",
    gu: "મારા વિસ્તારની સમસ્યાઓની જાણ કરો",
    ur: "میرے علاقے کے مسائل کی اطلاع دیں",
    kn: "ನನ್ನ ಪ್ರದೇಶದ समस्याಗಳನ್ನು ವರದಿ ಮಾಡಿ",
    or: "ମୋ ଅଞ୍ଚଳର ସମସ୍ୟା ଗୁଡିକୁ ରିପୋର୍ଟ କରନ୍ତୁ",
    ml: "എന്റെ പ്രദേശത്തെ പ്രശ്നങ്ങൾ റിപ്പോർട്ട് ചെയ്യുക",
    pa: "ਮੇਰੇ ਖੇਤਰ ਦੀਆਂ ਸਮੱਸਿਆਵਾਂ ਦੀ ਰਿਪੋਰਟ ਕਰੋ"
  },
  mp: {
    hi: "मैं एक सांसद / अधिकारी हूँ",
    en: "I am an MP / Official",
    ta: "நான் ஒரு எம்.பி / அதிகாரி",
    bn: "আমি একজন এমপি / কর্মকর্তা",
    mr: "मी एक खासदार / अधिकारी आहे",
    te: "నేను ఒక ఎంపి / అధికారి",
    gu: "હું एक सांसद / अधिकारी हूँ",
    ur: "میں ایک ایم پی / عہدیدار ہوں",
    kn: "ನಾನು ಸಂಸದ / ಅಧಿಕಾರಿ",
    or: "ମୁଁ ଜଣେ ସାଂସଦ / ଅଧିକାରୀ",
    ml: "ഞാൻ ഒരു എം.പി / ഉദ്യോഗസ്ഥനാണ്",
    pa: "ਮੈਂ ਇੱਕ ਐਮਪੀ / ਅਧਿਕਾਰੀ ਹਾਂ"
  },
  mpSub: {
    hi: "निर्वाचन क्षेत्र के मुद्दों का प्रबंधन करें",
    en: "Manage constituency issues",
    ta: "தொகுதி பிரச்சினைகளை நிர்வகிக்கவும்",
    bn: "নির্বাচনী এলাকার সমস্যাগুলি পরিচালনা করুন",
    mr: "मतदारसंघातील प्रश्नांचे व्यवस्थापन करा",
    te: "నియోజకవర్గ సమస్యలను నిర్వహించండి",
    gu: "મતવિસ્તારની સમસ્યાઓનું સંચાલन કરો",
    ur: "حلقے کے مسائل کا انتظام کریں",
    kn: "ಕ್ಷೇತ್ರದ ಸಮಸ್ಯೆಗಳನ್ನು ನಿರ್ವಹಿಸಿ",
    or: "ନିର୍ବାଚନ ମଣ୍ଡଳୀ ସମସ୍ୟାର ପରିଚାଳନା କରନ୍ତୁ",
    ml: "മണ്ഡലത്തിലെ പ്രശ്നങ്ങൾ കൈകാര്യം ചെയ്യുക",
    pa: "ਹਲਕੇ ਦੇ ਮਸਲਿਆਂ ਦਾ ਪ੍ਰਬੰਧਨ ਕਰੋ"
  },
  welcome: {
    hi: "जन वाणी में आपका स्वागत है",
    en: "Welcome to Jan Vani",
    ta: "ஜன வாணிக்கு வரவேற்கிறோம்",
    bn: "জন বাণীতে আপনাকে স্বাগত",
    mr: "जन वाणी मध्ये आपले स्वागत आहे",
    te: "జన వాణికి స్వాగతం",
    gu: "જન વાણીમાં આપનું સ્વાગત છે",
    ur: "جن وانی میں خوش آمدید",
    kn: "ಜನ ವಾಣಿಗೆ ಸುಸ್ವಾಗತ",
    or: "ଜନ ବାଣୀକୁ ସ୍ୱାଗତ",
    ml: "ജന വാണിയിലേക്ക് സ്വാഗതം",
    pa: "ਜਨ ਵਾਣੀ ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ"
  },
  voiceMatters: {
    hi: "आपकी आवाज़ मायने रखती है",
    en: "Your voice matters",
    ta: "உங்கள் குரல் முக்கியமானது",
    bn: "আপনার কণ্ঠস্বর গুরুত্বপূর্ণ",
    mr: "तुमचा आवाज महत्त्वाचा आहे",
    te: "మీ గొంతు ముఖ్యం",
    gu: "તમારો અવાજ મહત્વનો છે",
    ur: "آپ کی آواز اہم ہے",
    kn: "ನಿಮ್ಮ ಧ್ವನಿ ಮುಖ್ಯವಾಗಿದೆ",
    or: "ଆପଣଙ୍କ ସ୍ୱର ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ",
    ml: "നിങ്ങളുടെ ശബ്ദം പ്രധാനമാണ്",
    pa: "ਤੁਹਾਡੀ ਆਵਾਜ਼ ਮਾਇਨੇ ਰੱਖਦੀ ਹੈ"
  },
  enterMobile: {
    hi: "मोबाइल नंबर दर्ज करें",
    en: "Enter Mobile Number",
    ta: "கைபேசி எண்ணை உள்ளிடவும்",
    bn: "মোবাইল নম্বর লিখুন",
    mr: "मोबाईल नंबर प्रविष्ट करा",
    te: "మొబైల్ సంఖ్యను నమోదు చేయండి",
    gu: "મોબાઇલ નંબર દાખલ કરો",
    ur: "موبائل نمبر درج کریں",
    kn: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ",
    or: "ମୋବାଇଲ୍ ନମ୍ବର ଦିଅନ୍ତୁ",
    ml: "مൊബൈൽ നമ്പർ നൽകുക",
    pa: "مੋਬਾਈਲ ਨੰਬਰ ਦਰਜ ਕਰੋ"
  },
  enterMobileSub: {
    hi: "इस नंबर पर एक ओटीपी भेजा जाएगा",
    en: "An OTP will be sent to this number",
    ta: "இந்த எண்ணுக்கு ஒரு OTP அனுப்பப்படும்",
    bn: "এই নম্বরে একটি ওটিপি পাঠানো হবে",
    mr: "या क्रमांकावर एक ओटीपी पाठवला जाईल",
    te: "ఈ సంఖ్యకు OTP పంపబడుతుంది",
    gu: "આ નંબર પર એક OTP મોકલવામાં આવશે",
    ur: "اس نمبر پر ایک او ٹی پی بھیجا جائے گا",
    kn: "ಈ ಸಂಖ್ಯೆಗೆ ಒಟಿಪಿ ಕಳುಹಿಸಲಾಗುವುದು",
    or: "ଏହି ନମ୍ବରକୁ ଏକ OTP ପଠାଯିବ",
    ml: "ഈ നമ്പറിലേക്ക് ഒരു OTP അയയ്ക്കും",
    pa: "ਇਸ ਨੰਬਰ 'ਤੇ ਇੱਕ OTP ਭੇਜਿਆ ਜਾਵੇਗਾ"
  },
  enterEmail: {
    hi: "आधिकारिक ईमेल दर्ज करें",
    en: "Enter Official Email",
    ta: "அதிகாரப்பூர்வ மின்னஞ்சலை உள்ளிடவும்",
    bn: "অফিসিয়াল ইমেল লিখুন",
    mr: "अधिकृत ईमेल प्रविष्ट करा",
    te: "అధికారిక ఇమెయిల్ నమోదు చేయండి",
    gu: "સત્તાવાર ઇમેઇલ દાખલ કરો",
    ur: "سرکاری ای میل درج کریں",
    kn: "ಅಧಿಕೃತ ಇಮೇಲ್ ನಮೂದಿಸಿ",
    or: "ଆଧିକାରିକ ଇମେଲ୍ ଦିଅନ୍ତୁ",
    ml: "ഔദ്യോഗിക ഇമെയിൽ നൽകുക",
    pa: "ਅਧਿਕਾਰਤ ਈਮੇਲ ਦਰਜ ਕਰੋ"
  },
  enterEmailSub: {
    hi: "अपने आधिकारिक सरकारी ईमेल पते का उपयोग करें",
    en: "Use your official government email address",
    ta: "உங்கள் அதிகாரப்பூர்வ அரசு மின்னஞ்சல் முகவரியைப் பயன்படுத்தவும்",
    bn: "আপনার অফিসিয়াল সরকারী ইমেল ঠিকানা ব্যবহার করুন",
    mr: "तुमचा अधिकृत सरकारी ईमेल पत्ता वापरा",
    te: "మీ అధికారిక ప్రభుత్వ ఇమెయిల్ చిరునామాను ఉపయోగించండి",
    gu: "તમારા સત્તાવાર સરકારી ઇમેઇલ સરનામાંનો ઉપયોગ કરો",
    ur: "اپنا سرکاری ای میل ایڈریس استعمال کریں",
    kn: "ನಿಮ್ಮ ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ಬಳಸಿ",
    or: "ଆପଣଙ୍କ ଆଧିକାରିକ ସରକାରୀ ଇମେଲ୍ ଠିକଣା ବ୍ୟବహାର କରନ୍ତୁ",
    ml: "നിങ്ങളുടെ ഔദ്യോഗിക സർക്കാർ ഇമെയിൽ വിലാസം ഉപയോഗിക്കുക",
    pa: "ਆਪਣੇ ਅਧਿਕਾਰਤ ਸਰਕਾਰੀ ਈਮੇਲ ਪਤੇ ਦੀ ਵਰਤੋਂ ਕਰੋ"
  },
  sendOtp: {
    hi: "ओटीपी भेजें",
    en: "Send OTP",
    ta: "OTP அனுப்பவும்",
    bn: "ওটিপি পাঠান",
    mr: "ओटीपी पाठवा",
    te: "OTP పంపండి",
    gu: "OTP મોકલો",
    ur: "او ٹی پی بھیجیں",
    kn: "ಒಟಿಪಿ ಕಳುಹಿಸಿ",
    or: "OTP ପଠାନ୍ତୁ",
    ml: "OTP അയയ്ക്കുക",
    pa: "ਓਟੀਪੀ ਭੇਜੋ"
  },
  verifyOtp: {
    hi: "ओटीपी सत्यापित करें",
    en: "Verify OTP",
    ta: "OTP ஐ சரிபார்க்கவும்",
    bn: "ওটিপি যাচাই করুন",
    mr: "ओटीपी सत्यापित करा",
    te: "OTP ని ధృవీకరించండి",
    gu: "OTP ચકાસો",
    ur: "او ٹی پی کی تصدیق کریں",
    kn: "ಒಟಿಪಿ ಪರಿಶೀಲಿಸಿ",
    or: "OTP ଯାଞ୍ଚ କରନ୍ତୁ",
    ml: "OTP പരിശോധിക്കുക",
    pa: "ਓਟੀਪੀ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ"
  },
  enterOtpTitle: {
    hi: "ओटीपी दर्ज करें",
    en: "Enter OTP",
    ta: "OTP ஐ உள்ளிடவும்",
    bn: "ওটিপি লিখুন",
    mr: "ओटीपी प्रविष्ट करा",
    te: "OTP ని నమోదు చేయండి",
    gu: "OTP દાખલ કરો",
    ur: "او ٹی پی درج کریں",
    kn: "ಒಟಿಪಿ ನಮೂದಿಸಿ",
    or: "OTP ଦିଅନ୍ତୁ",
    ml: "OTP നൽകുക",
    pa: "ਓਟੀਪੀ ਦਰਜ ਕਰੋ"
  },
  yourArea: {
    hi: "आपका क्षेत्र",
    en: "Your Area",
    ta: "உங்கள் பகுதி",
    bn: "আপনার এলাকা",
    mr: "तुमचा परिसर",
    te: "మీ ప్రాంతం",
    gu: "તમારો વિસ્તાર",
    ur: "آپ کا علاقہ",
    kn: "ನಿಮ್ಮ ಪ್ರದೇಶ",
    or: "ଆପଣଙ୍କ ଅଞ୍ଚଳ",
    ml: "നിങ്ങളുടെ പ്രദേശം",
    pa: "ਤੁਹਾਡਾ ਖੇਤਰ"
  },
  setOnce: {
    hi: "एक बार सेट करें — फिर कभी नहीं पूछा जाएगा",
    en: "Set once — never asked again",
    ta: "ஒரு முறை அமைக்கவும் — மீண்டும் கேட்கப்படாது",
    bn: "একবার সেট করুন — আর কখনও জিজ্ঞাসা করা হবে না",
    mr: "एकदा सेट करा — पुन्हा कधीही विचारले जाणार नाही",
    te: "ఒకసారి సెట్ చేయండి — మళ్లీ అడగబడదు",
    gu: "એકવાર સેટ કરો — ફરી ક્યારેય પૂછવામાં આવશે નહીં",
    ur: "ایک بار سیٹ کریں — दोबारा کبھی نہیں پوچھا جائے گا",
    kn: "ಒಮ್ಮೆ ಹೊಂದಿಸಿ — ಮತ್ತೆ ಕೇಳಲಾಗುವುದಿಲ್ಲ",
    or: "ଥରେ ସେଟ୍ କରନ୍ତୁ — ଆଉ କେବେ ପଚାରାଯିବ ନାହିଁ",
    ml: "ഒരു തവണ സജ്ജമാക്കുക — പിന്നീട് ഒരിക്കലും ചോദിക്കില്ല",
    pa: "ਇੱਕ ਵਾਰ ਸੈੱਟ ਕਰੋ — ਦੁਬਾਰਾ ਕਦੇ ਨਹੀਂ ਪੁੱਛਿਆ ਜਾਵੇਗਾ"
  },
  allSet: {
    hi: "आप पूरी तरह तैयार हैं!",
    en: "You're all set!",
    ta: "அனைத்தும் தயாராக உள்ளது!",
    bn: "সব প্রস্তুত!",
    mr: "सर्व सज्ज आहे!",
    te: "అంతా సిద్ధమైంది!",
    gu: "બધું તૈયાર છે!",
    ur: "سب ٹھیک ہے!",
    kn: "ಎಲ್ಲವೂ ಸಿದ್ಧವಾಗಿದೆ!",
    or: "ସବୁ ପ୍ରସ୍ତುତ!",
    ml: "എല്ലാം സജ്ജമായി!",
    pa: "ਸਭ ਤਿਆਰ ਹੈ!"
  },
  getStarted: {
    hi: "शुरू करें",
    en: "Get Started",
    ta: "தொடங்குங்கள்",
    bn: "শুরু করুন",
    mr: "सुरू करा",
    te: "ప్రారంభించండి",
    gu: "શરૂ કરો",
    ur: "شروع کریں",
    kn: "ಪ್ರಾರಂಭಿಸಿ",
    or: "ଆରମ୍ଭ କରନ୍ତୁ",
    ml: "ആരംഭിക്കുക",
    pa: "ਸ਼ੁਰੂ ਕਰੋ"
  }
};

const getT = (lang: string, key: string): string => {
  const l = lang || "en";
  if (translations[key] && translations[key][l]) {
    return translations[key][l];
  }
  if (translations[key] && translations[key]["en"]) {
    return translations[key]["en"];
  }
  return key;
};

function Onboard({ onDone }: { onDone: (role: "citizen" | "mp") => void }) {
  const [step, setStep] = useState(() => parseInt(localStorage.getItem("onboard_step") || "0"));
  const [lang, setLang] = useState(() => localStorage.getItem("onboard_lang") || "");
  const [role, setRole] = useState<"citizen" | "mp" | "">(() => (localStorage.getItem("onboard_role") as any) || "");
  const [phone, setPhone] = useState(() => localStorage.getItem("onboard_phone") || "");
  const [otp, setOtp] = useState(() => localStorage.getItem("onboard_otp") || "");
  const [ward, setWard] = useState(() => localStorage.getItem("onboard_ward") || "");

  useEffect(() => {
    localStorage.setItem("onboard_step", step.toString());
  }, [step]);

  useEffect(() => {
    localStorage.setItem("onboard_lang", lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("onboard_role", role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem("onboard_phone", phone);
  }, [phone]);

  useEffect(() => {
    localStorage.setItem("onboard_otp", otp);
  }, [otp]);

  useEffect(() => {
    localStorage.setItem("onboard_ward", ward);
  }, [ward]);

  const langs = [
    { code: "hi", native: "हिंदी",      en: "Hindi",     bg: "bg-orange-50 border-orange-200" },
    { code: "en", native: "English",   en: "English",   bg: "bg-blue-50 border-blue-200" },
    { code: "bn", native: "বাংলা",     en: "Bengali",   bg: "bg-green-50 border-green-200" },
    { code: "mr", native: "मराठी",     en: "Marathi",   bg: "bg-purple-50 border-purple-200" },
    { code: "te", native: "తెలుగు",    en: "Telugu",    bg: "bg-red-50 border-red-200" },
    { code: "ta", native: "தமிழ்",    en: "Tamil",     bg: "bg-teal-50 border-teal-200" },
    { code: "gu", native: "ગુજરાતી",   en: "Gujarati",  bg: "bg-yellow-50 border-yellow-200" },
    { code: "ur", native: "اردو",      en: "Urdu",      bg: "bg-pink-50 border-pink-200" },
    { code: "kn", native: "ಕನ್ನಡ",     en: "Kannada",   bg: "bg-indigo-50 border-indigo-200" },
    { code: "or", native: "ଓଡ଼ିଆ",     en: "Odia",      bg: "bg-emerald-50 border-emerald-200" },
    { code: "ml", native: "മലയാളം",   en: "Malayalam", bg: "bg-cyan-50 border-cyan-200" },
    { code: "pa", native: "ਪੰਜਾਬੀ",    en: "Punjabi",   bg: "bg-amber-50 border-amber-200" },
  ];

  const back = (to: number) => () => setStep(to);

  const changeLanguage = (langCode: string) => {
    setLang(langCode);
    setStep(1);
    localStorage.setItem("onboard_lang", langCode);
    localStorage.setItem("onboard_step", "1");
    
    // Set Google Translate cookie
    const cookieVal = `/en/${langCode}`;
    document.cookie = `googtrans=${cookieVal}; path=/;`;
    document.cookie = `googtrans=${cookieVal}; path=/; domain=${window.location.hostname}`;
    
    // Force reload to apply Google Translate translation
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // Validate phone or email based on role
  const isPhoneValid = role === "citizen" 
    ? phone.replace(/\D/g, "").length === 10 
    : (phone.includes("@") && phone.length > 3);

  if (step === 0) return (
    <div className="flex flex-col h-full overflow-y-auto px-5 pt-8 pb-6 animate-fadeIn" style={{ scrollbarWidth: "none" }}>
      <h1 className="text-2xl font-bold text-foreground mb-1" style={DF}>Choose Language</h1>
      <p className="text-sm text-muted-foreground mb-6">Select your preferred language · अपनी भाषा चुनें</p>
      <div className="grid grid-cols-2 gap-3 pb-4">
        {langs.map(l => (
          <button key={l.code} onClick={() => changeLanguage(l.code)}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${lang === l.code ? "border-primary bg-primary/5" : `border-border ${l.bg}`}`}>
            <p className="text-xl font-bold text-foreground">{l.native}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{l.en}</p>
          </button>
        ))}
      </div>
    </div>
  );

  if (step === 1) return (
    <div className="flex flex-col h-full px-5 pt-8 pb-6 animate-fadeIn">
      <button onClick={back(0)} className="flex items-center gap-1 text-xs text-muted-foreground mb-6"><ChevronLeft size={14} /> Back</button>
      <h1 className="text-2xl font-bold text-foreground mb-1" style={DF}>{getT(lang, 'whoAreYou')}</h1>
      <p className="text-sm text-muted-foreground mb-6">{getT(lang, 'whoAreYouSub')}</p>
      <div className="space-y-3">
        {[
          { r: "citizen" as const, icon: <User size={24} className="text-primary" />, title: getT(lang, 'citizen'), sub: getT(lang, 'citizenSub') },
          { r: "mp" as const, icon: <Building2 size={24} className="text-primary" />, title: getT(lang, 'mp'), sub: getT(lang, 'mpSub') },
        ].map(({ r, icon, title, sub }) => (
          <button key={r} onClick={() => { setRole(r); setStep(2); }}
            className="w-full p-5 bg-card rounded-2xl border-2 border-border text-left flex items-center gap-4 active:scale-[0.98] transition-transform">
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

  if (step === 2) return (
    <div className="flex flex-col h-full px-5 pt-8 pb-6 animate-fadeIn">
      <button onClick={back(1)} className="flex items-center gap-1 text-xs text-muted-foreground mb-6"><ChevronLeft size={14} /> Back</button>
      <h1 className="text-2xl font-bold text-foreground mb-1" style={DF}>
        {role === "citizen" ? getT(lang, 'enterMobile') : getT(lang, 'enterEmail')}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        {role === "citizen" ? getT(lang, 'enterMobileSub') : getT(lang, 'enterEmailSub')}
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
      <button 
        disabled={!isPhoneValid}
        onClick={() => setStep(3)} 
        className={`w-full py-4 rounded-2xl font-bold mt-auto transition-all ${isPhoneValid ? "bg-primary text-white" : "bg-secondary text-muted-foreground cursor-not-allowed"}`} 
        style={DF}
      >
        {getT(lang, 'sendOtp')}
      </button>
    </div>
  );

  if (step === 3) return (
    <div className="flex flex-col h-full px-5 pt-8 pb-6 animate-fadeIn">
      <button onClick={back(2)} className="flex items-center gap-1 text-xs text-muted-foreground mb-6"><ChevronLeft size={14} /> Back</button>
      <h1 className="text-2xl font-bold text-foreground mb-1" style={DF}>{getT(lang, 'enterOtpTitle')}</h1>
      <p className="text-sm text-muted-foreground mb-1">Sent to {role === "citizen" ? `+91 ${phone || "98765 43210"}` : (phone || "your email")}</p>
      <p className="text-xs text-muted-foreground mb-6">Expires in 5 minutes · <span className="text-primary font-semibold">Resend in 45s</span></p>
      <div className="relative mb-2">
        <div className="flex gap-2">
          {[0,1,2,3,4,5].map(i => (
            <div key={i} className={`flex-1 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-colors
              ${otp.length === i ? "border-primary" : otp.length > i ? "border-primary/40 bg-secondary" : "border-border bg-secondary"}`}>
              {otp[i] || ""}
            </div>
          ))}
        </div>
        <input type="tel" maxLength={6} value={otp} autoFocus
          onChange={e => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
      </div>
      <button onClick={() => setOtp("847291")} className="text-xs text-primary font-semibold text-left mb-6">
        Demo: Auto-fill OTP →
      </button>
      <button onClick={() => setStep(4)} disabled={otp.length < 6}
        className={`w-full py-4 rounded-2xl font-bold mt-auto ${otp.length >= 6 ? "bg-primary text-white" : "bg-secondary text-muted-foreground"}`}
        style={DF}>
        {getT(lang, 'verifyOtp')}
      </button>
    </div>
  );

  if (step === 4) return (
    <div className="flex flex-col h-full overflow-y-auto px-5 pt-8 pb-6 animate-fadeIn" style={{ scrollbarWidth: "none" }}>
      <h1 className="text-2xl font-bold text-foreground mb-1" style={DF}>
        {role === "citizen" ? getT(lang, 'yourArea') : "Select Constituency"}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">{getT(lang, 'setOnce')}</p>
      {role === "citizen" ? (
        <div className="space-y-3">
          <div className="p-4 bg-secondary rounded-2xl border border-border">
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Ward / Village / Area</p>
            <input value={ward} onChange={e => setWard(e.target.value)} placeholder="e.g. KK Nagar, Ward 14"
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
          </div>
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-2xl">
            <MapPin size={16} className="text-green-600 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">District (auto-detected)</p>
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
            <p className="text-xs text-blue-700 font-medium flex items-center gap-1.5"><CheckCircle size={12} /> Cross-verified with Lok Sabha public records</p>
          </div>
        </div>
      )}
      <button onClick={() => setStep(5)} className="w-full py-4 bg-primary text-white rounded-2xl font-bold mt-auto" style={DF}>Continue</button>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-5 animate-fadeIn">
      <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center">
        <CheckCircle size={48} className="text-green-500" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2" style={DF}>
          {role === "citizen" ? getT(lang, 'allSet') : "Dashboard access granted"}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {role === "citizen" 
            ? `${getT(lang, 'welcome')}. ${getT(lang, 'voiceMatters')}.` 
            : `Welcome, ${ward || "Official"}. Your constituency dashboard is ready.`}
        </p>
      </div>
      <button onClick={() => onDone(role as "citizen" | "mp")} className="w-full py-4 bg-primary text-white rounded-2xl font-bold mt-6" style={DF}>
        {getT(lang, 'getStarted')}
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// CITIZEN
// ════════════════════════════════════════════════════════
function CitizenHome({ setTab }: { setTab: (t: CitizenTab) => void }) {
  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      <div className="pt-6 pb-4 px-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">Good morning</p>
            <h1 className="text-[22px] font-bold text-foreground leading-tight" style={DF}>Priya Sharma</h1>
          </div>
          <button className="relative w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <Bell size={19} className="text-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-card" />
          </button>
        </div>
        <div className="flex items-center gap-1.5 mt-3 px-3 py-2 bg-secondary rounded-xl">
          <MapPin size={13} className="text-primary shrink-0" />
          <span className="text-xs font-semibold text-foreground">KK Nagar, Ward 14, Madurai</span>
        </div>
      </div>

      <div className="px-5 mb-3">
        <button onClick={() => setTab("report")}
          className="w-full py-[18px] bg-primary text-white rounded-[18px] text-base font-bold flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
          style={{ ...DF, boxShadow: "0 8px 24px rgba(22,101,52,0.28)" }}>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><Plus size={18} className="text-white" /></div>
          Report a Problem
        </button>
      </div>

      <div className="px-5 mb-5">
        <button onClick={() => setTab("join")}
          className="w-full py-4 bg-card border border-border rounded-[18px] text-sm font-bold text-foreground flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform"
          style={DF}>
          <Hash size={16} className="text-primary" />
          Join a Complaint by ID
        </button>
      </div>

      <div className="px-5 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-foreground" style={DF}>My Complaints</h2>
          <button onClick={() => setTab("complaints")} className="text-xs font-semibold text-primary">See all</button>
        </div>
        <div className="space-y-2.5">
          {myComplaints.map(c => (
            <div key={c.id} className="flex items-center gap-3 p-3.5 bg-card rounded-2xl border border-border">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${catBg(c.category)}`}>
                <CatIcon cat={c.category} size={17} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{c.title}</p>
                <p className="text-[11px] text-muted-foreground font-mono">{c.id}</p>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-secondary text-primary border border-primary/20">Submitted</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CitizenJoin({ setTab }: { setTab: (t: CitizenTab) => void }) {
  const [inputId, setInputId] = useState("");
  const [searched, setSearched] = useState(false);
  const [joinedIds, setJoinedIds] = useState<string[]>([]);
  const found = knownComplaints[inputId.toUpperCase().trim()];
  const isJoined = joinedIds.includes(inputId.toUpperCase().trim());

  return (
    <div className="flex flex-col h-full overflow-y-auto px-5 pt-6 pb-6" style={{ scrollbarWidth: "none" }}>
      <button onClick={() => setTab("home")} className="flex items-center gap-1 text-xs text-muted-foreground mb-5"><ChevronLeft size={14} /> Back</button>
      <h1 className="text-[22px] font-bold text-foreground mb-1" style={DF}>Join a Complaint</h1>
      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">Enter the complaint ID shared by someone to add your support.</p>
      <div className="flex gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 px-4 py-3.5 bg-secondary rounded-2xl border border-border focus-within:border-primary/40 transition-colors">
          <Hash size={14} className="text-muted-foreground shrink-0" />
          <input value={inputId} onChange={e => { setInputId(e.target.value); setSearched(false); }}
            placeholder="e.g. CHN-2024-0712"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-mono" />
        </div>
        <button onClick={() => setSearched(true)}
          className="px-4 py-3.5 bg-primary text-white rounded-2xl font-bold text-sm">
          <Search size={16} />
        </button>
      </div>
      {!searched && (
        <div className="p-4 bg-secondary rounded-2xl mb-3">
          <p className="text-xs text-muted-foreground font-medium mb-2">Sample IDs to try:</p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(knownComplaints).map(k => (
              <button key={k} onClick={() => { setInputId(k); setSearched(false); }}
                className="text-xs font-mono font-semibold text-primary bg-card border border-border px-2.5 py-1 rounded-lg">{k}</button>
            ))}
          </div>
        </div>
      )}
      {searched && !found && (
        <div className="p-5 bg-card rounded-2xl border border-border text-center">
          <p className="text-sm font-bold text-foreground">No complaint found</p>
          <p className="text-xs text-muted-foreground mt-1">Check the ID and try again.</p>
        </div>
      )}
      {searched && found && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className={`h-14 flex items-center px-4 gap-3 ${catBg(found.category)}`}>
            <CatIcon cat={found.category} size={18} />
            <span className="text-xs font-bold flex-1" style={DF}>{found.category}</span>
            <span className="text-xs font-mono text-muted-foreground">{found.id}</span>
          </div>
          <div className="p-4 space-y-3">
            <h3 className="text-base font-bold text-foreground" style={DF}>{found.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{found.description}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin size={10} /> {found.ward}</span>
              <span className="flex items-center gap-1"><Users size={10} /> {found.joined + (isJoined ? 1 : 0)} joined</span>
              <span>{found.date}</span>
            </div>
            {isJoined ? (
              <div className="flex items-center justify-center gap-2 py-3 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm font-bold">
                <CheckCircle size={15} /> You joined this complaint
              </div>
            ) : (
              <button onClick={() => setJoinedIds(j => [...j, inputId.toUpperCase().trim()])}
                className="w-full py-3.5 bg-primary text-white rounded-xl text-sm font-bold" style={DF}>
                Join this Complaint
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CitizenReport({ setTab }: { setTab: (t: CitizenTab) => void }) {
  const [step, setStep] = useState<0|1|2|3|4>(0);
  const [category, setCategory] = useState("");
  const [descMode, setDescMode] = useState<"type"|"speak"|"photo">("type");
  const [description, setDescription] = useState("");
  const [checkDone, setCheckDone] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [liveLocation, setLiveLocation] = useState(true);
  const [manualArea, setManualArea] = useState("KK Nagar");
  const [manualWard, setManualWard] = useState("Ward 14");

  useEffect(() => {
    if (step === 3) {
      setCheckDone(false);
      const t = setTimeout(() => {
        setIsDuplicate(category === "water");
        setCheckDone(true);
      }, 1800);
      return () => clearTimeout(t);
    }
  }, [step, category]);

  const getAISeverity = (cat: string) => {
    if (cat === "water" || cat === "drainage" || cat === "healthcare") return "Critical";
    if (cat === "roads" || cat === "sanitation" || cat === "electricity") return "High";
    return "Medium";
  };

  const getReportLocation = () => {
    return liveLocation ? "KK Nagar, Ward 14" : `${manualArea || "KK Nagar"}, ${manualWard || "Ward 14"}`;
  };

  if (step === 4) return (
    <div className="flex flex-col items-center justify-center h-full gap-5 px-8 text-center animate-fadeIn">
      <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center">
        <CheckCircle size={48} className="text-green-500" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2" style={DF}>Complaint Received</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">Your report has been registered with the authorities.</p>
      </div>
      <div className="w-full p-4 bg-secondary rounded-2xl text-left space-y-1">
        <p className="text-xs text-muted-foreground">Complaint ID — share so others can join</p>
        <p className="text-lg font-bold text-foreground font-mono" style={DF}>JV-2847</p>
        <p className="text-xs text-muted-foreground">Category: {categories.find(c=>c.key===category)?.label || "Other"} · {getReportLocation()}</p>
      </div>
      <div className="flex gap-3 w-full">
        <button className="flex-1 py-3.5 bg-secondary border border-border rounded-2xl text-sm font-bold text-foreground" style={DF}>Share Issue</button>
        <button onClick={() => { setTab("home"); setStep(0); setCategory(""); setDescription(""); }} className="flex-1 py-3.5 bg-primary text-white rounded-2xl text-sm font-bold" style={DF}>Back to Home</button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="pt-6 px-5 pb-3 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          {step > 0 && <button onClick={() => setStep(s => (s - 1) as any)}><ChevronLeft size={20} className="text-foreground" /></button>}
          <h1 className="text-[22px] font-bold text-foreground" style={DF}>Report Problem</h1>
        </div>
        <div className="flex gap-2">
          {[0,1,2,3].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < step ? "bg-primary" : i === step ? "bg-primary" : "bg-secondary"}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4" style={{ scrollbarWidth: "none" }}>

        {/* Step 0 — Category */}
        {step === 0 && (
          <div className="flex flex-col h-full justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-4">What is the problem?</p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {categories.map(c => (
                  <button key={c.key} onClick={() => setCategory(c.key)}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all active:scale-95 ${category === c.key ? "border-primary bg-secondary/50" : "border-border bg-card"}`}>
                    <span className="text-3xl leading-none">{c.emoji}</span>
                    <span className="text-xs font-bold text-foreground">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setStep(1)} disabled={!category}
              className={`w-full py-4 rounded-2xl font-bold mt-auto transition-all ${category ? "bg-primary text-white" : "bg-secondary text-muted-foreground cursor-not-allowed"}`}
              style={DF}>
              Continue
            </button>
          </div>
        )}

        {/* Step 1 — Describe */}
        {step === 1 && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex gap-2 mb-1">
              {(["type","speak","photo"] as const).map(m => (
                <button key={m} onClick={() => setDescMode(m)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${descMode === m ? "bg-primary text-white" : "bg-secondary text-muted-foreground"}`}>
                  {m === "type" ? "Type" : m === "speak" ? "Speak" : "Photo"}
                </button>
              ))}
            </div>
            {descMode === "type" && (
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Please describe the issue or ask a general query in detail..."
                className="w-full h-32 p-4 bg-secondary rounded-2xl text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none border border-border focus:border-primary/40 transition-colors" />
            )}
            {descMode === "speak" && (
              <div className="flex flex-col items-center gap-3 py-8 bg-secondary rounded-2xl border border-border">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mic size={28} className="text-primary" />
                </div>
                <p className="text-sm font-bold text-foreground">Press and speak in your language</p>
                <p className="text-xs text-muted-foreground">AI will transcribe your voice</p>
                <button className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold" style={DF}>Start Speaking</button>
              </div>
            )}
            {descMode === "photo" && (
              <button className="w-full aspect-[4/3] bg-secondary rounded-2xl flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center"><Camera size={28} className="text-primary" /></div>
                <p className="text-sm font-bold text-foreground">Take photo of the problem</p>
                <p className="text-xs text-muted-foreground">AI reads and describes it for you</p>
              </button>
            )}
            
            {/* Live Location Switch and Manual Input Panel */}
            <div className="space-y-3 p-4 bg-secondary rounded-2xl border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className={liveLocation ? "text-green-600 animate-pulse" : "text-muted-foreground"} />
                  <span className="text-xs font-bold text-foreground">Live GPS Location</span>
                </div>
                <button 
                  onClick={() => {
                    setLiveLocation(!liveLocation);
                    if (!liveLocation) {
                      setManualArea("KK Nagar");
                      setManualWard("Ward 14");
                    }
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${liveLocation ? "bg-green-600 text-white" : "bg-card text-foreground border border-border"}`}
                >
                  {liveLocation ? "ON" : "OFF"}
                </button>
              </div>
              
              {liveLocation ? (
                <div className="p-2.5 bg-green-50/60 border border-green-100 rounded-xl">
                  <p className="text-xs text-green-700 font-medium">Location Detected: KK Nagar, Ward 14 (Live GPS)</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] text-muted-foreground">Enter location details manually:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      value={manualArea} 
                      onChange={e => setManualArea(e.target.value)} 
                      placeholder="Area / Street Name" 
                      className="p-2.5 bg-card border border-border rounded-xl text-xs text-foreground outline-none"
                    />
                    <input 
                      value={manualWard} 
                      onChange={e => setManualWard(e.target.value)} 
                      placeholder="Ward (e.g. Ward 14)" 
                      className="p-2.5 bg-card border border-border rounded-xl text-xs text-foreground outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2 — Review Screen */}
        {step === 2 && (
          <div className="space-y-3 animate-fadeIn">
            <p className="text-sm font-bold text-foreground">Review Your Complaint</p>
            <div className="bg-card border border-border rounded-2xl p-4 space-y-4 shadow-sm">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide block">Category</span>
                <span className="text-sm font-semibold text-foreground">{categories.find(c=>c.key===category)?.label || "Other"}</span>
              </div>
              
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide block">Description</span>
                <p className="text-sm text-foreground bg-secondary p-3 rounded-xl min-h-[60px] mt-1 whitespace-pre-wrap leading-relaxed">{description || "No description provided."}</p>
              </div>
              
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide block">Location</span>
                <span className="text-sm font-medium text-foreground block mt-0.5">
                  {liveLocation ? "📍 KK Nagar, Ward 14 (Live GPS)" : `${manualArea || "Not specified"}, ${manualWard || "Not specified"}`}
                </span>
              </div>

              {descMode === "photo" && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide block">Attached Photo</span>
                  <div className="mt-1.5 aspect-[4/3] w-full max-w-[160px] bg-secondary rounded-xl flex items-center justify-center border border-border text-xs text-muted-foreground font-medium overflow-hidden">
                    📸 Problem Screenshot
                  </div>
                </div>
              )}

              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide block">AI Classified Severity</span>
                <div className="mt-1">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${severityStyle(getAISeverity(category))}`}>
                    {getAISeverity(category)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — AI Verification */}
        {step === 3 && !checkDone && (
          <div className="flex flex-col items-center justify-center h-64 gap-4 animate-fadeIn">
            <RefreshCw size={32} className="text-primary animate-spin" />
            <h3 className="text-base font-bold text-foreground" style={DF}>Verifying your complaint...</h3>
            <div className="space-y-1.5 w-full">
              {["Verifying location data","Checking duplicate databases","Assessing complaint severity","Validating report content"].map((t, i) => (
                <div key={t} className="flex items-center gap-2 text-xs text-muted-foreground px-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: `${i*200}ms` }} />
                  {t}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && checkDone && !isDuplicate && (
          <div className="flex flex-col items-center justify-center gap-4 py-8 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center"><CheckCircle size={32} className="text-green-500" /></div>
            <h3 className="text-base font-bold text-foreground" style={DF}>Verification Successful</h3>
            <p className="text-sm text-muted-foreground text-center">No duplicates found. Your complaint is unique and ready for official processing.</p>
          </div>
        )}

        {step === 3 && checkDone && isDuplicate && (
          <div className="flex flex-col gap-4 py-4 animate-fadeIn">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-amber-600" />
                <p className="text-sm font-bold text-amber-800" style={DF}>Similar complaint exists</p>
              </div>
              <p className="text-sm text-amber-700">847 people in your area already reported this same issue. Add your voice instead of creating a new one?</p>
            </div>
            <button onClick={() => setStep(4)} className="w-full py-3.5 bg-primary text-white rounded-2xl text-sm font-bold" style={DF}>Add My Voice</button>
            <button onClick={() => setStep(4)} className="w-full py-3.5 bg-secondary border border-border rounded-2xl text-sm font-bold text-foreground" style={DF}>Still Submit New</button>
          </div>
        )}
      </div>

      <div className="px-5 pb-6 pt-2 shrink-0">
        {step === 1 && (
          <button onClick={() => setStep(2)} className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2" style={DF}>
            Continue <ArrowRight size={17} />
          </button>
        )}
        {step === 2 && (
          <button onClick={() => setStep(3)} className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2" style={DF}>
            Verify & Check Duplicates <ArrowRight size={17} />
          </button>
        )}
        {step === 3 && checkDone && !isDuplicate && (
          <button onClick={() => setStep(4)} className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2" style={DF}>
            <Send size={17} /> Submit Report
          </button>
        )}
      </div>
    </div>
  );
}

function CitizenComplaints() {
  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      <div className="pt-6 px-5 pb-4">
        <h1 className="text-[22px] font-bold text-foreground" style={DF}>My Complaints</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{myComplaints.length} complaints submitted</p>
      </div>
      <div className="px-5 space-y-3 pb-6">
        {myComplaints.map(c => (
          <div key={c.id} className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${catBg(c.category)}`}>
                <CatIcon cat={c.category} size={19} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate" style={DF}>{c.title}</p>
                <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{c.id}</p>
                <p className="text-xs text-muted-foreground">Submitted {c.date}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-secondary text-primary border border-primary/20">Submitted</span>
              <p className="text-xs text-muted-foreground">Share ID so others can join</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CitizenProfile() {
  return (
    <div className="flex flex-col h-full overflow-y-auto px-5 pt-6 pb-6" style={{ scrollbarWidth: "none" }}>
      <h1 className="text-[22px] font-bold text-foreground mb-5" style={DF}>Profile</h1>
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-5 bg-card rounded-2xl border border-border">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold" style={DF}>P</div>
          <div>
            <p className="text-base font-bold text-foreground" style={DF}>Priya Sharma</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5"><Phone size={12} /> +91 98765 43210</p>
            <p className="text-xs text-muted-foreground">KK Nagar, Ward 14, Madurai</p>
          </div>
        </div>
        <div className="p-4 bg-card rounded-2xl border border-border">
          {[["Complaints Filed","2"],["Complaints Joined","3"]].map(([k,v],i) => (
            <div key={k} className={`flex items-center justify-between py-3 ${i>0?"border-t border-border":""}`}>
              <span className="text-sm text-foreground">{k}</span>
              <span className="text-sm font-bold text-foreground">{v}</span>
            </div>
          ))}
        </div>
        <button className="w-full py-3.5 bg-red-50 text-red-600 rounded-2xl font-semibold text-sm border border-red-100">Logout</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// MP DASHBOARD SECTIONS
// ════════════════════════════════════════════════════════
function OverviewSection() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { label:"Total", value:248, color:"text-foreground", bg:"bg-card border-border" },
          { label:"Critical", value:12, color:"text-red-600", bg:"bg-red-50 border-red-100" },
          { label:"Resolved", value:189, color:"text-green-600", bg:"bg-green-50 border-green-100" },
          { label:"Pending", value:47, color:"text-amber-600", bg:"bg-amber-50 border-amber-100" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border rounded-2xl p-4`}>
            <p className={`text-2xl font-bold ${s.color}`} style={DF}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
        <div className="flex items-center gap-2 mb-1">
          <Flame size={15} className="text-red-500" />
          <span className="text-xs font-bold text-red-700 uppercase tracking-wide">Rising Fast</span>
        </div>
        <p className="text-sm font-bold text-red-800" style={DF}>Water complaints ↑ 340% in 48 hours</p>
        <p className="text-xs text-red-600 mt-0.5">KK Nagar, Ward 12–14 · Likely contamination event</p>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <Flame size={14} className="text-red-500" />
          <p className="text-sm font-bold text-foreground" style={DF}>Top Issues</p>
        </div>
        {priorityIssues.slice(0,3).map((issue,i) => (
          <div key={issue.id} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border mb-2">
            <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">#{i+1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{issue.title}</p>
              <p className="text-[11px] text-muted-foreground">{issue.ward} · {issue.joined} joined</p>
            </div>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${severityStyle(issue.severity)}`}>{issue.severity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HealthSection() {
  const statusColor = (s: string) => s==="critical"?"text-red-600 bg-red-50":s==="moderate"?"text-amber-600 bg-amber-50":"text-green-600 bg-green-50";
  const barColor = (s: string) => s==="critical"?"bg-red-400":s==="moderate"?"bg-amber-400":"bg-green-400";
  const dotColor = (s: string) => s==="critical"?"bg-red-500":s==="moderate"?"bg-amber-500":"bg-green-500";
  return (
    <div className="space-y-3 animate-fadeIn">
      <div className="p-4 bg-card border border-border rounded-2xl text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Constituency Health Score</p>
        <p className="text-4xl font-bold text-foreground" style={DF}>67<span className="text-xl text-muted-foreground">/100</span></p>
        <p className="text-xs text-red-500 font-semibold flex items-center justify-center gap-1 mt-1"><TrendingDown size={12} /> Down from 71 last month</p>
      </div>
      <div className="space-y-2.5">
        {healthScores.map(h => (
          <div key={h.name} className="bg-card border border-border rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground">{h.name}</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${statusColor(h.status)}`}>{h.score}/100</span>
                <span className={`w-2.5 h-2.5 rounded-full ${dotColor(h.status)}`} />
              </div>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${barColor(h.status)}`} style={{width:`${h.score}%`}} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{h.prev > h.score ? `↓ from ${h.prev} last month` : `↑ from ${h.prev} last month`}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendsSection() {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-3" style={DF}>Complaint Trends — Last 30 Days</p>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{top:4,right:4,left:-20,bottom:0}}>
              <defs>
                <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="roadsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{fontSize:9, fill:"#64748B"}} />
              <Tooltip contentStyle={{fontSize:11,borderRadius:8,border:"1px solid var(--border)",background:"white"}} />
              <Area type="monotone" dataKey="water" stroke="#2563EB" fill="url(#waterGrad)" strokeWidth={2} name="Water" />
              <Area type="monotone" dataKey="roads" stroke="#16A34A" fill="url(#roadsGrad)" strokeWidth={2} name="Roads" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 mt-2">
          {[["#2563EB","Water"],["#16A34A","Roads"]].map(([c,l]) => (
            <div key={l} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{background:c}} />
              <span className="text-[11px] text-muted-foreground">{l}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
        <p className="text-xs font-bold text-blue-700 mb-1 uppercase tracking-wide">Constituency Insight</p>
        <p className="text-sm text-blue-800 font-semibold" style={DF}>Spike on Jan 15 linked to rainfall</p>
        <p className="text-xs text-blue-600 mt-1">Rainfall was 2.3cm on Jan 14 — likely caused water contamination spike. Predictive alert: Heavy rain forecast for Feb 3.</p>
      </div>
      <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
        <p className="text-xs font-bold text-amber-700 mb-1 uppercase tracking-wide">Trending Alerts</p>
        <p className="text-sm text-amber-800">Water: <span className="font-bold">+340%</span> in 48 hrs · Roads: <span className="font-bold">+32%</span> in 7 days</p>
      </div>
    </div>
  );
}

function BudgetSection() {
  return (
    <div className="space-y-3 animate-fadeIn">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Budget Allocation Support</p>
      {[
        { title:"Hospital — Palanganatham", cost:"₹8 lakh", scheme:"NHM (National Health Mission)", mplad:"₹12L remaining", action:"Raise with District Collector. NHM scheme invokable in 7 days.", tag:"eligible" },
        { title:"Water Infra — KK Nagar", cost:"₹2.3 crore", scheme:"Jal Jeevan Mission", mplad:"Pending Q2 allocation", action:"File for JJM scheme before Feb 28 deadline.", tag:"urgent" },
        { title:"Roads — Anna Nagar", cost:"₹48 lakh", scheme:"PMGSY", mplad:"₹12L remaining", action:"MPLAD fund sufficient. Issue work order directly.", tag:"ready" },
      ].map(b => (
        <div key={b.title} className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-secondary border-b border-border">
            <p className="text-xs font-bold text-foreground" style={DF}>{b.title}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${b.tag==="eligible"?"text-green-700 bg-green-50 border-green-200":b.tag==="urgent"?"text-red-600 bg-red-50 border-red-100":"text-blue-700 bg-blue-50 border-blue-100"}`}>
              {b.tag==="eligible"?"Eligible":b.tag==="urgent"?"Urgent":"Ready"}
            </span>
          </div>
          <div className="p-4 space-y-2">
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Estimated cost</span><span className="font-bold text-foreground">{b.cost}</span></div>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Scheme</span><span className="font-bold text-foreground">{b.scheme}</span></div>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">MPLAD</span><span className="font-bold text-foreground">{b.mplad}</span></div>
            <div className="mt-2 p-2.5 bg-secondary rounded-xl">
              <p className="text-xs text-muted-foreground font-medium">Recommended:</p>
              <p className="text-xs text-foreground mt-0.5">{b.action}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RoutingSection() {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Department Routing</p>
      {[
        { issue:"Water Supply", dept:"TN Water Supply Board", count:634 },
        { issue:"Roads", dept:"PWD / Madurai Corp", count:287 },
        { issue:"Street Lights", dept:"TANGEDCO", count:91 },
        { issue:"Drainage", dept:"Madurai Corporation", count:156 },
        { issue:"Hospital", dept:"State Health Dept / NHM", count:43 },
      ].map(r => (
        <div key={r.issue} className="flex items-center gap-3 p-3.5 bg-card border border-border rounded-2xl">
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground" style={DF}>{r.issue}</p>
            <p className="text-xs text-muted-foreground">{r.dept}</p>
          </div>
          <span className="text-xs text-muted-foreground">{r.count}</span>
          <button className="px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold" style={DF}>Assign →</button>
        </div>
      ))}
      <button className="w-full py-3.5 bg-secondary border border-border rounded-2xl text-sm font-bold text-foreground flex items-center justify-center gap-2" style={DF}>
        <FileText size={15} className="text-primary" /> Auto-generate Official Letter
      </button>
    </div>
  );
}

function FakeSection() {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Suspicious Activity</p>
      <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={16} className="text-red-600" />
          <p className="text-sm font-bold text-red-800" style={DF}>Coordinated Submission Detected</p>
        </div>
        <div className="space-y-1 text-xs text-red-700">
          <p>• 47 complaints from same IP address</p>
          <p>• Submitted between 2am – 3am</p>
          <p>• All targeting Ward 8, Roads category</p>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs font-bold px-2.5 py-1 bg-red-100 text-red-700 border border-red-200 rounded-full">Removed from ranking</span>
          <span className="text-xs text-red-600 font-semibold">Flagged for review</span>
        </div>
      </div>
      <div className="p-4 bg-card border border-border rounded-2xl">
        <p className="text-xs font-bold text-foreground mb-3" style={DF}>This week's flag summary</p>
        {[["Suspected fake", "12"],["Duplicate submissions","34"],["Invalid location","7"],["Cleared / genuine","8"]].map(([k,v])=>(
          <div key={k} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <span className="text-xs text-foreground">{k}</span>
            <span className="text-xs font-bold text-foreground">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompareSection() {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Anonymous Comparison</p>
      <div className="p-4 bg-card border border-border rounded-2xl">
        <p className="text-xs text-muted-foreground mb-3">Your constituency vs district average (names hidden)</p>
        {[
          { metric:"Resolved in 30 days", you:"34%", avg:"41%", good:false },
          { metric:"Avg response time", you:"2.4d", avg:"1.8d", good:false },
          { metric:"Water issues / month", you:"634", avg:"289", good:false },
          { metric:"Citizen satisfaction", you:"71%", avg:"68%", good:true },
        ].map(c => (
          <div key={c.metric} className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <span className="text-xs text-foreground flex-1">{c.metric}</span>
            <div className="flex items-center gap-2 text-right">
              <div>
                <p className={`text-xs font-bold ${c.good?"text-green-600":"text-red-600"}`}>{c.you}</p>
                <p className="text-[10px] text-muted-foreground">you</p>
              </div>
              <div className="w-px h-6 bg-border" />
              <div>
                <p className="text-xs font-bold text-muted-foreground">{c.avg}</p>
                <p className="text-[10px] text-muted-foreground">avg</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
        <p className="text-xs font-bold text-amber-700 mb-1">Key gap to close:</p>
        <p className="text-sm text-amber-800">Resolution rate is 7% below district average. Focus on Water Supply — it's dragging the score.</p>
      </div>
    </div>
  );
}

function AlertSection() {
  return (
    <div className="space-y-3">
      <div className="p-4 bg-primary text-white rounded-2xl">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 size={16} />
          <p className="text-xs font-bold uppercase tracking-wide">Budget Deadline Alert</p>
        </div>
        <p className="text-base font-bold mt-1" style={DF}>Tamil Nadu State Budget</p>
        <p className="text-sm opacity-80">Submission deadline: <span className="font-bold">March 15</span></p>
      </div>
      <p className="text-xs text-muted-foreground font-medium px-1">AI recommends including in budget request:</p>
      {[
        { title:"Water Infrastructure — KK Nagar", evidence:"634 complaints · 32,000 affected", ask:"₹2.3 crore" },
        { title:"Road Resurfacing — Anna Nagar", evidence:"521 complaints · 25,000 affected", ask:"₹48 lakh" },
        { title:"Primary Health Centre — Palanganatham", evidence:"43 complaints · 8,000 affected", ask:"₹8 lakh" },
      ].map(a => (
        <div key={a.title} className="p-4 bg-card border border-border rounded-2xl">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-sm font-bold text-foreground" style={DF}>{a.title}</p>
            <span className="text-xs font-bold text-primary shrink-0">{a.ask}</span>
          </div>
          <p className="text-xs text-muted-foreground">{a.evidence}</p>
        </div>
      ))}
      <button className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2" style={DF}>
        <FileText size={17} /> Generate Budget Request Document
      </button>
    </div>
  );
}

function MPDashboard() {
  const [section, setSection] = useState<MPSection>("overview");
  const [filter, setFilter] = useState("week");
  const sections: { id: MPSection; label: string }[] = [
    { id:"overview", label:"Overview" }, { id:"health", label:"Health" },
    { id:"trends", label:"Trends" },    { id:"budget", label:"Budget" },
    { id:"routing", label:"Routing" },  { id:"fake", label:"Fake" },
    { id:"compare", label:"Compare" },  { id:"alert", label:"Alert" },
  ];
  return (
    <div className="flex flex-col h-full">
      <div className="pt-6 px-5 pb-3 shrink-0">
        <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">Welcome back</p>
        <h1 className="text-[22px] font-bold text-foreground" style={DF}>Rajesh Kumar, MP</h1>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><MapPin size={11} /> Madurai North Constituency</p>
        <div className="flex gap-1.5 p-1 bg-secondary rounded-xl mt-3">
          {[["today","Today"],["week","This Week"],["month","This Month"]].map(([id,label])=>(
            <button key={id} onClick={()=>setFilter(id)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${filter===id?"bg-card text-foreground shadow-sm":"text-muted-foreground"}`}>{label}</button>
          ))}
        </div>
      </div>
      <div className="shrink-0 px-3 pb-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth:"none" }}>
          {sections.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${section===s.id?"bg-primary text-white":"bg-secondary text-muted-foreground"}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-5" style={{ scrollbarWidth:"none" }}>
        {section === "overview" && <OverviewSection />}
        {section === "health" && <HealthSection />}
        {section === "trends" && <TrendsSection />}
        {section === "budget" && <BudgetSection />}
        {section === "routing" && <RoutingSection />}
        {section === "fake" && <FakeSection />}
        {section === "compare" && <CompareSection />}
        {section === "alert" && <AlertSection />}
      </div>
    </div>
  );
}

function MPPriority() {
  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth:"none" }}>
      <div className="pt-6 px-5 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-[22px] font-bold text-foreground" style={DF}>Priority Issues</h1>
          <button className="w-9 h-9 bg-secondary rounded-xl flex items-center justify-center"><Filter size={15} className="text-foreground" /></button>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{priorityIssues.length} issues ranked by impact score</p>
      </div>
      <div className="px-5 space-y-4 pb-6">
        {priorityIssues.map((issue,i) => (
          <div key={issue.id} className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className={`h-12 flex items-center px-4 gap-3 ${catBg(issue.category)}`}>
              <CatIcon cat={issue.category} size={18} />
              <span className="text-xs font-bold flex-1" style={DF}>{issue.category}</span>
              <span className="text-sm font-bold text-foreground/40">#{i+1}</span>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-bold text-foreground leading-snug flex-1" style={DF}>{issue.title}</h3>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${severityStyle(issue.severity)}`}>{issue.severity}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                <span>{issue.ward}</span>
                <span className="flex items-center gap-1"><Users size={10}/> {issue.joined} joined</span>
                <span className="ml-auto font-bold text-foreground">Score {issue.score}</span>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-2.5 text-xs font-bold bg-primary text-white rounded-xl" style={DF}>Assign Dept.</button>
                <button className="flex-1 py-2.5 text-xs font-bold bg-secondary text-foreground rounded-xl border border-border" style={DF}>In Progress</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MPMap() {
  const [selected, setSelected] = useState<number|null>(null);
  const pins = [
    { x:95, y:75, severity:"Critical", title:"No Drinking Water", ward:"Ward 12" },
    { x:195, y:130, severity:"High", title:"Garbage Overflowing", ward:"Ward 11" },
    { x:75, y:170, severity:"Critical", title:"Open Sewage", ward:"Ward 8" },
    { x:255, y:60, severity:"Medium", title:"Street Lights Dead", ward:"Ward 14" },
    { x:155, y:205, severity:"High", title:"Road Cave-in", ward:"Ward 9" },
    { x:295, y:185, severity:"Medium", title:"Park Issue", ward:"Ward 6" },
  ];
  const pinFill = (s:string) => s==="Critical"?"#DC2626":s==="High"?"#EA580C":"#D97706";
  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth:"none" }}>
      <div className="pt-6 px-5 pb-4">
        <h1 className="text-[22px] font-bold text-foreground" style={DF}>Complaint Map</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Madurai North Constituency</p>
      </div>
      <div className="mx-5 rounded-2xl border border-border overflow-hidden">
        <svg width="100%" viewBox="0 0 380 280" className="block" style={{ background:"#E4EDE0" }}>
          <path d="M30,30 L190,18 L340,35 L355,160 L290,258 L130,265 L30,195 Z" fill="#D0E2C8" stroke="#A8C89A" strokeWidth="1.5"/>
          <path d="M190,18 L340,35 L320,165 L190,158 Z" fill="#C5DAC0" stroke="#A8C89A" strokeWidth="1.5"/>
          <line x1="0" y1="148" x2="380" y2="148" stroke="#B0C8A8" strokeWidth="2"/>
          <line x1="188" y1="0" x2="188" y2="280" stroke="#B0C8A8" strokeWidth="2"/>
          <circle cx="95" cy="100" r="55" fill="rgba(220,38,38,0.10)"/>
          <circle cx="80" cy="175" r="45" fill="rgba(220,38,38,0.10)"/>
          <circle cx="195" cy="140" r="40" fill="rgba(234,88,12,0.08)"/>
          {pins.map((pin,i) => (
            <g key={i} style={{cursor:"pointer"}} onClick={()=>setSelected(selected===i?null:i)}>
              <circle cx={pin.x} cy={pin.y} r={selected===i?20:14} fill={pinFill(pin.severity)} opacity="0.15"/>
              <circle cx={pin.x} cy={pin.y} r={selected===i?9:7} fill={pinFill(pin.severity)}/>
              <circle cx={pin.x} cy={pin.y} r="3" fill="white"/>
            </g>
          ))}
        </svg>
      </div>
      {selected !== null && (
        <div className="mx-5 mt-3 p-4 bg-card rounded-2xl border border-border">
          <div className="flex items-start justify-between">
            <div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${severityStyle(pins[selected].severity)}`}>{pins[selected].severity}</span>
              <p className="text-sm font-bold text-foreground mt-2" style={DF}>{pins[selected].title}</p>
              <p className="text-xs text-muted-foreground">{pins[selected].ward}</p>
            </div>
            <button className="w-8 h-8 bg-secondary rounded-xl flex items-center justify-center" onClick={()=>setSelected(null)}>
              <MoreVertical size={14} className="text-foreground"/>
            </button>
          </div>
        </div>
      )}
      <div className="mx-5 mt-3 flex gap-5 justify-center">
        {[["Critical","#DC2626"],["High","#EA580C"],["Medium","#D97706"]].map(([l,c])=>(
          <div key={l} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{background:c}}/>
            <span className="text-xs text-muted-foreground font-medium">{l}</span>
          </div>
        ))}
      </div>
      <div className="px-5 mt-4 pb-6 space-y-2">
        {pins.map((pin,i)=>(
          <button key={i} onClick={()=>setSelected(i===selected?null:i)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left ${selected===i?"bg-secondary border-primary/20":"bg-card border-border"}`}>
            <div className="w-2 h-2 rounded-full shrink-0" style={{background:pinFill(pin.severity)}}/>
            <span className="text-sm text-foreground font-medium flex-1 truncate">{pin.title}</span>
            <span className="text-xs text-muted-foreground">{pin.ward}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MPProfile() {
  return (
    <div className="flex flex-col h-full overflow-y-auto px-5 pt-6 pb-6" style={{ scrollbarWidth:"none" }}>
      <h1 className="text-[22px] font-bold text-foreground mb-5" style={DF}>Profile</h1>
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-5 bg-card rounded-2xl border border-border">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold" style={DF}>R</div>
          <div>
            <p className="text-base font-bold text-foreground" style={DF}>Rajesh Kumar</p>
            <p className="text-sm text-muted-foreground">Member of Parliament</p>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><MapPin size={11}/> Madurai North</p>
          </div>
        </div>
        <div className="p-4 bg-card rounded-2xl border border-border">
          {[["Assigned Area","Madurai North","text-foreground"],["Total Wards","18","text-foreground"],["Resolution Rate","34%","text-amber-600"],["Constituency Score","67/100","text-amber-600"]].map(([k,v,c],i)=>(
            <div key={k} className={`flex items-center justify-between py-3 ${i>0?"border-t border-border":""}`}>
              <span className="text-sm text-foreground">{k}</span>
              <span className={`text-sm font-bold ${c}`}>{v}</span>
            </div>
          ))}
        </div>
        <div className="p-4 bg-card rounded-2xl border border-border">
          {[[<FileText size={15}/>, "Settings"],[<Globe size={15}/>, "Public Dashboard"]].map(([icon,label])=>(
            <button key={String(label)} className="w-full flex items-center gap-3 py-3 border-b border-border last:border-0">
              <span className="text-muted-foreground">{icon}</span>
              <span className="text-sm text-foreground">{label}</span>
              <ChevronRight size={14} className="ml-auto text-muted-foreground"/>
            </button>
          ))}
        </div>
        <button className="w-full py-3.5 bg-red-50 text-red-600 rounded-2xl font-semibold text-sm border border-red-100">Logout</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// ROOT
// ════════════════════════════════════════════════════════
export default function App() {
  const [phase, setPhase] = useState<Phase>("onboard");
  const [citizenTab, setCitizenTab] = useState<CitizenTab>("home");
  const [mpTab, setMpTab] = useState<MPTab>("dashboard");

  const citizenNav: { id: CitizenTab; icon: React.ReactNode; label: string }[] = [
    { id:"home",       icon:<Home size={21}/>,        label:"Home" },
    { id:"report",     icon:<Plus size={22}/>,        label:"Report" },
    { id:"complaints", icon:<ClipboardList size={21}/>, label:"My Reports" },
    { id:"profile",    icon:<User size={21}/>,        label:"Profile" },
  ];
  const mpNav: { id: MPTab; icon: React.ReactNode; label: string }[] = [
    { id:"dashboard", icon:<Home size={21}/>,    label:"Dashboard" },
    { id:"priority",  icon:<Flame size={21}/>,   label:"Priority" },
    { id:"map",       icon:<MapIcon size={21}/>, label:"Map" },
    { id:"profile",   icon:<User size={21}/>,    label:"Profile" },
  ];

  const showNav = phase !== "onboard" && citizenTab !== "join";

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-20 pb-10 px-4"
      style={{ background:"linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 50%, #D1FAE5 100%)" }}>

      {/* Demo switcher — only after onboarding */}
      {phase !== "onboard" && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex gap-1.5 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-white/60">
          <button onClick={()=>{ setPhase("citizen"); setCitizenTab("home"); }}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${phase==="citizen"?"bg-primary text-white shadow-sm":"text-muted-foreground hover:text-foreground"}`}
            style={DF}>Citizen</button>
          <button onClick={()=>{ setPhase("mp"); setMpTab("dashboard"); }}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${phase==="mp"?"bg-primary text-white shadow-sm":"text-muted-foreground hover:text-foreground"}`}
            style={DF}>MP Dashboard</button>
          <button onClick={()=>{ setPhase("onboard"); setCitizenTab("home"); setMpTab("dashboard"); }}
            className="px-4 py-2 rounded-full text-xs font-bold text-muted-foreground hover:text-foreground"
            style={DF}>↩ Onboarding</button>
        </div>
      )}

      {/* Phone frame */}
      <div className="relative rounded-[3.5rem] border-[5px] border-slate-800 overflow-hidden bg-background"
        style={{ width:375, height:780, boxShadow:"0 40px 80px rgba(15,23,42,0.25), 0 0 0 1px rgba(15,23,42,0.05)" }}>
        {/* Dynamic island */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[110px] h-7 bg-slate-900 rounded-b-3xl z-10 flex items-center justify-center gap-3">
          <div className="w-2 h-2 rounded-full bg-slate-700"/>
          <div className="w-9 h-2 rounded-full bg-slate-700"/>
        </div>

        <div className="absolute inset-0 flex flex-col">
          {/* Status bar */}
          <div className="h-10 shrink-0 flex items-end justify-between px-7 pb-1">
            <span className="text-[11px] font-bold text-foreground">9:41</span>
            <div className="flex gap-1.5 items-center">
              <Wifi size={12} className="text-foreground"/>
              <div className="flex gap-0.5 items-end">
                {[1,2,3,4].map(i=>(<div key={i} className="w-[3px] bg-foreground rounded-sm" style={{height:i*3+1}}/>))}
              </div>
            </div>
          </div>

          {/* Screen content */}
          <div className="flex-1 overflow-hidden bg-background">
            {phase === "onboard" && <Onboard onDone={(role) => setPhase(role)} />}
            {phase === "citizen" && (
              <>
                {citizenTab === "home" && <CitizenHome setTab={setCitizenTab} />}
                {citizenTab === "join" && <CitizenJoin setTab={setCitizenTab} />}
                {citizenTab === "report" && <CitizenReport setTab={setCitizenTab} />}
                {citizenTab === "complaints" && <CitizenComplaints />}
                {citizenTab === "profile" && <CitizenProfile />}
              </>
            )}
            {phase === "mp" && (
              <>
                {mpTab === "dashboard" && <MPDashboard />}
                {mpTab === "priority" && <MPPriority />}
                {mpTab === "map" && <MPMap />}
                {mpTab === "profile" && <MPProfile />}
              </>
            )}
          </div>

          {/* Bottom nav */}
          {showNav && (
            <div className="shrink-0 border-t border-border bg-card/95 backdrop-blur-sm pb-6 pt-1 px-1">
              {phase === "citizen" ? (
                <div className="flex items-end">
                  {citizenNav.map(item => (
                    <button key={item.id} onClick={()=>setCitizenTab(item.id)}
                      className={`flex-1 flex flex-col items-center py-1.5 transition-colors ${item.id==="report"?"relative":citizenTab===item.id?"text-primary":"text-muted-foreground"}`}>
                      {item.id === "report" ? (
                        <>
                          <div className="w-12 h-12 -mt-5 rounded-full flex items-center justify-center bg-primary"
                            style={{boxShadow:"0 4px 16px rgba(22,101,52,0.35)"}}>
                            <span className="text-white">{item.icon}</span>
                          </div>
                          <span className="text-[10px] font-bold mt-0.5 text-primary">{item.label}</span>
                        </>
                      ) : (
                        <>
                          {item.icon}
                          <span className={`text-[10px] font-semibold mt-0.5 ${citizenTab===item.id?"text-primary":"text-muted-foreground"}`}>{item.label}</span>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex">
                  {mpNav.map(item => (
                    <button key={item.id} onClick={()=>setMpTab(item.id)}
                      className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors ${mpTab===item.id?"text-primary":"text-muted-foreground"}`}>
                      {item.icon}
                      <span className={`text-[10px] font-semibold ${mpTab===item.id?"text-primary":"text-muted-foreground"}`}>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-400 font-medium text-center">
        Civic Connect PWA · Citizens & MPs · No app store needed
      </p>
    </div>
  );
}
