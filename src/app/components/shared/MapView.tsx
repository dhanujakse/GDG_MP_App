// ─────────────────────────────────────────────────────────────────────────────
// MapView — Civic Connect AI
// Real Leaflet map with complaint pins, heatmap, and filters.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import type { ComplaintSummary, SeverityLevel, ComplaintCategory } from "@/types";
import { getCategoryEmoji } from "@/app/components/shared/CategoryIcon";

// Fix Leaflet default icon paths (broken in Vite builds)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  critical: "#dc2626",
  high:     "#ea580c",
  medium:   "#ca8a04",
  low:      "#16a34a",
};

function createComplaintIcon(complaint: ComplaintSummary): L.DivIcon {
  const color = SEVERITY_COLORS[complaint.severity] ?? "#64748b";
  const emoji = getCategoryEmoji(complaint.category);
  return L.divIcon({
    className: "",
    html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
      ">
        <div style="
          width: 36px;
          height: 36px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          background: ${color};
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="
            transform: rotate(45deg);
            font-size: 15px;
            line-height: 1;
          ">${emoji}</span>
        </div>
        <div style="
          background: white;
          border: 1px solid ${color};
          border-radius: 4px;
          padding: 1px 4px;
          font-size: 9px;
          font-weight: 700;
          color: ${color};
          margin-top: 2px;
          white-space: nowrap;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        ">${complaint.citizensJoined + 1} citizens</div>
      </div>
    `,
    iconSize: [36, 52],
    iconAnchor: [18, 52],
    popupAnchor: [0, -54],
  });
}

interface Props {
  complaints: ComplaintSummary[];
  height?: string;
  onComplaintClick?: (complaint: ComplaintSummary) => void;
  selectedCategory?: ComplaintCategory | "all";
}

export function MapView({ complaints, height = "100%", onComplaintClick, selectedCategory = "all" }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [9.9252, 78.1198], // Madurai
      zoom: 14,
      zoomControl: true,
      attributionControl: true,
    });

    // OpenStreetMap tiles — free, no API key
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Ward boundary mock — a rough rectangle around Madurai center
    L.rectangle(
      [[9.9100, 78.0950], [9.9450, 78.1500]],
      { color: "#166534", weight: 2, fillOpacity: 0.04, dashArray: "6, 4" }
    ).addTo(map);

    mapRef.current = map;
    setIsLoaded(true);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when complaints or filter changes
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;
    const map = mapRef.current;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const filtered = selectedCategory === "all"
      ? complaints
      : complaints.filter((c) => c.category === selectedCategory);

    filtered.forEach((complaint) => {
      const icon = createComplaintIcon(complaint);
      const marker = L.marker([complaint.location.lat, complaint.location.lng], { icon });

      const severityColor = SEVERITY_COLORS[complaint.severity];
      marker.bindPopup(`
        <div style="min-width:180px; font-family: system-ui, sans-serif;">
          <div style="font-weight:700; font-size:13px; color:#0f172a; margin-bottom:4px;">
            ${complaint.title}
          </div>
          <div style="
            display:inline-block;
            padding: 2px 8px;
            border-radius: 9999px;
            background: ${severityColor}22;
            color: ${severityColor};
            font-size: 10px;
            font-weight: 700;
            margin-bottom: 6px;
          ">${complaint.severity.toUpperCase()}</div>
          <div style="font-size:11px; color:#64748b; margin-bottom:4px;">
            📍 ${complaint.ward} · ${complaint.citizensJoined + 1} citizens
          </div>
          <div style="font-size:11px; color:#64748b;">
            Impact Score: <strong style="color:${severityColor}">${complaint.impactScore}/100</strong>
          </div>
        </div>
      `, { maxWidth: 220 });

      marker.on("click", () => {
        onComplaintClick?.(complaint);
      });

      marker.addTo(map);
      markersRef.current.push(marker);
    });

    // Fit bounds to markers if any exist
    if (markersRef.current.length > 0 && filtered.length > 1) {
      const group = L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.2));
    }
  }, [complaints, isLoaded, selectedCategory, onComplaintClick]);

  return (
    <div style={{ height, width: "100%", position: "relative" }}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10 rounded-xl">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-muted-foreground font-medium">Loading map…</p>
          </div>
        </div>
      )}
      <div ref={containerRef} style={{ height: "100%", width: "100%", borderRadius: "inherit" }} />
    </div>
  );
}
