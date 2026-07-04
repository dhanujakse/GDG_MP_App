// ─────────────────────────────────────────────────────────────────────────────
// USER TYPES — Civic Connect AI
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole = "citizen" | "mp" | "mla" | "municipal_officer" | "department_officer" | "admin";

export type AuthStatus = "unauthenticated" | "otp_sent" | "authenticated";

export interface BaseUser {
  id: string;
  name: string;
  role: UserRole;
  language: string; // ISO 639-1 language code, e.g. "hi", "en", "ta"
  createdAt: string;
  lastLoginAt: string;
  isVerified: boolean;
}

export interface CitizenUser extends BaseUser {
  role: "citizen";
  phone: string; // masked: "+91 98765 ****"
  ward: string;
  district: string;
  totalComplaints: number;
  resolvedComplaints: number;
}

export interface MPUser extends BaseUser {
  role: "mp";
  email: string; // official .nic.in or .gov.in
  constituency: string;
  state: string;
  party?: string; // optional — shown without political branding
  assignedWards: string[];
}

export interface MunicipalOfficerUser extends BaseUser {
  role: "municipal_officer";
  email: string;
  municipality: string;
  designation: string;
  assignedWards: string[];
}

export interface DepartmentOfficerUser extends BaseUser {
  role: "department_officer";
  email: string;
  department: string;
  designation: string;
  jurisdiction: string;
}

export interface AdminUser extends BaseUser {
  role: "admin";
  email: string;
}

export type AppUser = CitizenUser | MPUser | MunicipalOfficerUser | DepartmentOfficerUser | AdminUser;

// ─── Auth State ──────────────────────────────────────────────────────────────
export interface AuthState {
  user: AppUser | null;
  status: AuthStatus;
  token: string | null;
  expiresAt: string | null;
}

// ─── Onboarding Form State ────────────────────────────────────────────────────
export interface OnboardingState {
  step: number;
  language: string;
  role: UserRole | "";
  phoneOrEmail: string;
  otp: string;
  ward: string;
  constituency: string;
}
