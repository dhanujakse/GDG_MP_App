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

export const WARD_GEOMETRIES: Record<string, [[number, number], [number, number]]> = {
  "Ward 8":  [[9.9200, 78.1280], [9.9280, 78.1380]],
  "Ward 9":  [[9.9120, 78.1180], [9.9200, 78.1280]],
  "Ward 10": [[9.9150, 78.0950], [9.9250, 78.1050]],
  "Ward 11": [[9.9150, 78.1050], [9.9220, 78.1150]],
  "Ward 12": [[9.9220, 78.1150], [9.9320, 78.1250]],
  "Ward 13": [[9.9320, 78.1100], [9.9420, 78.1220]],
  "Ward 14": [[9.9280, 78.1250], [9.9380, 78.1350]],
};

export function MapView({ complaints, height = "100%", onComplaintClick, selectedCategory = "all" }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const polygonsRef = useRef<L.Rectangle[]>([]);
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

    // OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    setIsLoaded(true);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update ward rectangles when complaints or category filters change
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;
    const map = mapRef.current;

    // Remove old polygons
    polygonsRef.current.forEach((p) => p.remove());
    polygonsRef.current = [];

    // Filter complaints by category if not 'all'
    const filtered = selectedCategory === "all"
      ? complaints
      : complaints.filter((c) => c.category === selectedCategory);

    // Calculate dynamic ward metrics
    Object.keys(WARD_GEOMETRIES).forEach((wardName) => {
      const wardComplaints = filtered.filter((c) => c.ward === wardName);
      const count = wardComplaints.length;

      // Calculate top category
      const categoriesFreq: Record<string, number> = {};
      let topCategory = "None";
      let maxFreq = 0;
      wardComplaints.forEach((c) => {
        categoriesFreq[c.category] = (categoriesFreq[c.category] || 0) + 1;
        if (categoriesFreq[c.category] > maxFreq) {
          maxFreq = categoriesFreq[c.category];
          topCategory = c.category.charAt(0).toUpperCase() + c.category.slice(1);
        }
      });

      // Dynamic population affected calculation: based on citizen joins & category weights
      const populationAffected = wardComplaints.reduce(
        (acc, c) => acc + (c.citizensJoined + 1) * 20, 
        0
      );

      // Trend label
      const trend = count > 3 ? "Rising" : count > 0 ? "Stable" : "Clear";

      // Most recent AI Insight (or default message)
      const mostRecentInsight = wardComplaints.length > 0
        ? wardComplaints[0].mpSummary || "Active priority reports filed."
        : "No active reports detected.";

      // Color intensity based on density count
      let color = "#22c55e"; // Green (0 reports)
      if (count >= 5) color = "#ef4444"; // Red (5+ reports)
      else if (count >= 3) color = "#f97316"; // Orange (3-4 reports)
      else if (count >= 1) color = "#eab308"; // Yellow (1-2 reports)

      const bounds = WARD_GEOMETRIES[wardName];
      const rect = L.rectangle(bounds, {
        color: color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.35,
      });

      // Dynamic popup structured as GDS style summary
      const popupContent = `
        <div style="min-width: 200px; font-family: system-ui, sans-serif; padding: 4px;">
          <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
            ${wardName} Details
          </h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; color: #334155; margin-bottom: 6px;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 3px 0; font-weight: 500;">Active Reports:</td>
              <td style="padding: 3px 0; text-align: right; font-weight: 700; color: #0f172a;">${count}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 3px 0; font-weight: 500;">Top Category:</td>
              <td style="padding: 3px 0; text-align: right; font-weight: 700; color: #0f172a;">${topCategory}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 3px 0; font-weight: 500;">Est. Impact:</td>
              <td style="padding: 3px 0; text-align: right; font-weight: 700; color: #0f172a;">~${populationAffected} citizens</td>
            </tr>
            <tr>
              <td style="padding: 3px 0; font-weight: 500;">Trend:</td>
              <td style="padding: 3px 0; text-align: right; font-weight: 700; color: ${color};">${trend}</td>
            </tr>
          </table>
          <div style="font-size: 10.5px; color: #475569; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 5px; line-height: 1.3;">
            <strong>AI Insight:</strong> ${mostRecentInsight}
          </div>
        </div>
      `;

      rect.bindPopup(popupContent, { maxWidth: 240 });
      rect.addTo(map);
      polygonsRef.current.push(rect);
    });

  }, [complaints, isLoaded, selectedCategory]);

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
