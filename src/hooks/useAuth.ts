// ─────────────────────────────────────────────────────────────────────────────
// useAuth — Civic Connect AI
// Manages authentication state across roles with localStorage persistence.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import type { AppUser, CitizenUser, MPUser, UserRole, AuthState } from "@/types";

const AUTH_KEY = "civic_connect_auth";

const MOCK_CITIZEN: CitizenUser = {
  id: "ctz_001",
  name: "Priya Sharma",
  role: "citizen",
  language: "en",
  phone: "+91 98765 ****",
  ward: "Ward 14",
  district: "Madurai",
  createdAt: "2024-01-15T00:00:00Z",
  lastLoginAt: new Date().toISOString(),
  isVerified: true,
  totalComplaints: 2,
  resolvedComplaints: 0,
};

const MOCK_MP: MPUser = {
  id: "mp_001",
  name: "Dr. Rajesh Kumar",
  role: "mp",
  language: "en",
  email: "rajesh.kumar@sansad.nic.in",
  constituency: "Madurai Central",
  state: "Tamil Nadu",
  assignedWards: ["Ward 8", "Ward 9", "Ward 10", "Ward 11", "Ward 12", "Ward 13", "Ward 14"],
  createdAt: "2023-06-01T00:00:00Z",
  lastLoginAt: new Date().toISOString(),
  isVerified: true,
};

function loadAuthState(): AuthState {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) return JSON.parse(raw) as AuthState;
  } catch {}
  return { user: null, status: "unauthenticated", token: null, expiresAt: null };
}

function saveAuthState(state: AuthState): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(state));
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(loadAuthState);

  useEffect(() => {
    saveAuthState(authState);
  }, [authState]);

  const loginAsCitizen = useCallback(() => {
    const newState: AuthState = {
      user: MOCK_CITIZEN,
      status: "authenticated",
      token: "mock_jwt_citizen_token",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    setAuthState(newState);
  }, []);

  const loginAsMP = useCallback(() => {
    const newState: AuthState = {
      user: MOCK_MP,
      status: "authenticated",
      token: "mock_jwt_mp_token",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    setAuthState(newState);
  }, []);

  const logout = useCallback(() => {
    setAuthState({ user: null, status: "unauthenticated", token: null, expiresAt: null });
  }, []);

  const isAuthenticated = authState.status === "authenticated" && authState.user !== null;
  const role: UserRole | null = authState.user?.role ?? null;

  return {
    user: authState.user,
    role,
    isAuthenticated,
    loginAsCitizen,
    loginAsMP,
    logout,
  };
}
