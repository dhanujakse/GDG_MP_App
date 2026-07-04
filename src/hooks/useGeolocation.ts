// ─────────────────────────────────────────────────────────────────────────────
// useGeolocation — Civic Connect AI
// GPS location with manual fallback. Permission-aware.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from "react";
import type { GeoLocation } from "@/types";

type LocationState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "granted"; location: GeoLocation }
  | { status: "denied"; message: string }
  | { status: "unavailable" };

// Mock location for Madurai (used when GPS unavailable or in demo mode)
const MOCK_LOCATION: GeoLocation = {
  lat: 9.9252,
  lng: 78.1198,
  address: "KK Nagar, Madurai",
  ward: "Ward 14",
  district: "Madurai",
  pincode: "625020",
};

export function useGeolocation() {
  const [state, setState] = useState<LocationState>({ status: "idle" });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ status: "unavailable" });
      return;
    }

    setState({ status: "requesting" });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // In production: reverse geocode lat/lng to get address/ward
        // For now: use mock address with real GPS coordinates
        setState({
          status: "granted",
          location: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            address: MOCK_LOCATION.address,
            ward: MOCK_LOCATION.ward,
            district: MOCK_LOCATION.district,
            pincode: MOCK_LOCATION.pincode,
          },
        });
      },
      (error) => {
        if (error.code === 1) {
          // Permission denied — use mock location for demo
          setState({
            status: "granted",
            location: MOCK_LOCATION,
          });
        } else {
          setState({ status: "denied", message: "Could not get your location. Using default area." });
        }
      },
      { timeout: 8000, maximumAge: 60000, enableHighAccuracy: true }
    );
  }, []);

  const useManualLocation = useCallback((address: string, ward: string) => {
    setState({
      status: "granted",
      location: { ...MOCK_LOCATION, address, ward },
    });
  }, []);

  const location: GeoLocation =
    state.status === "granted" ? state.location : MOCK_LOCATION;

  return {
    state,
    location,
    requestLocation,
    useManualLocation,
    isGranted: state.status === "granted",
    isRequesting: state.status === "requesting",
  };
}
