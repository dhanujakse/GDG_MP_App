// ─────────────────────────────────────────────────────────────────────────────
// CategoryIcon — Civic Connect AI
// Maps complaint categories to icons + colors
// ─────────────────────────────────────────────────────────────────────────────

import { Droplets, Trash2, MapPin, Zap, Building2, BookOpen, Bus, Waves } from "lucide-react";
import type { ComplaintCategory } from "@/types";

const CONFIG: Record<ComplaintCategory, {
  icon: React.ElementType;
  bg: string;
  text: string;
  label: string;
  emoji: string;
}> = {
  water:       { icon: Droplets, bg: "bg-blue-50",    text: "text-blue-500",   label: "Water",       emoji: "💧" },
  sanitation:  { icon: Trash2,   bg: "bg-green-50",   text: "text-green-500",  label: "Sanitation",  emoji: "🗑️" },
  roads:       { icon: MapPin,   bg: "bg-slate-50",   text: "text-slate-500",  label: "Roads",       emoji: "🛣️" },
  electricity: { icon: Zap,      bg: "bg-yellow-50",  text: "text-yellow-500", label: "Electricity", emoji: "💡" },
  drainage:    { icon: Waves,    bg: "bg-blue-50",    text: "text-blue-600",   label: "Drainage",    emoji: "🌊" },
  healthcare:  { icon: Building2,bg: "bg-red-50",     text: "text-red-500",    label: "Healthcare",  emoji: "🏥" },
  education:   { icon: BookOpen, bg: "bg-purple-50",  text: "text-purple-500", label: "Education",   emoji: "🏫" },
  transport:   { icon: Bus,      bg: "bg-orange-50",  text: "text-orange-500", label: "Transport",   emoji: "🚌" },
  other:       { icon: MapPin,   bg: "bg-slate-50",   text: "text-slate-400",  label: "Other",       emoji: "📝" },
};

interface IconProps {
  category: ComplaintCategory | string;
  size?: number;
  showBg?: boolean;
  bgSize?: string;
}

export function CategoryIcon({ category, size = 18, showBg = false, bgSize = "w-10 h-10" }: IconProps) {
  const cat = category as ComplaintCategory;
  const cfg = CONFIG[cat] ?? CONFIG.other;
  const Icon = cfg.icon;

  if (showBg) {
    return (
      <div className={`${bgSize} rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
        <Icon size={size} className={cfg.text} />
      </div>
    );
  }

  return <Icon size={size} className={cfg.text} />;
}

export function getCategoryConfig(category: ComplaintCategory | string) {
  return CONFIG[category as ComplaintCategory] ?? CONFIG.other;
}

export function getCategoryLabel(category: ComplaintCategory | string): string {
  return (CONFIG[category as ComplaintCategory] ?? CONFIG.other).label;
}

export function getCategoryEmoji(category: ComplaintCategory | string): string {
  return (CONFIG[category as ComplaintCategory] ?? CONFIG.other).emoji;
}
