// Shared domain models for the Modular EHR web client.
// These mirror the JSON returned by ehr-api.

export interface Institution {
  id?: number;
  name: string;
  code: string;
  type?: string;
  address?: string;
  phone?: string;
  active?: boolean;
  dateCreated?: string;
}

export interface EhrModule {
  id?: number;
  code: string;
  name: string;
  description?: string;
  category?: string;
  apiPath?: string;
  active?: boolean;
}

/** A catalog module annotated with whether the current institution enabled it. */
export interface ModuleStatus {
  code: string;
  name: string;
  description?: string;
  category?: string;
  apiPath?: string;
  enabled: boolean;
}

export interface Patient {
  id?: number;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  email?: string;
  phone?: string;
  address?: string;
  homeInstitutionId?: number;
  dateCreated?: string;
}

export interface Encounter {
  id?: number;
  patientId?: number;
  institutionId?: number;
  encounterDate?: string;
  type?: string;
  reason?: string;
  providerName?: string;
  notes?: string;
  status?: string;
}

export interface Problem {
  id?: number;
  patientId?: number;
  institutionId?: number;
  code?: string;
  description: string;
  status?: string;
  onsetDate?: string;
  recordedDate?: string;
}

export interface Medication {
  id?: number;
  patientId?: number;
  institutionId?: number;
  name: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  prescriber?: string;
}

export interface Allergy {
  id?: number;
  patientId?: number;
  institutionId?: number;
  allergen: string;
  reaction?: string;
  severity?: string;
  status?: string;
  recordedDate?: string;
}

export interface VitalSign {
  id?: number;
  patientId?: number;
  institutionId?: number;
  recordedDate?: string;
  bloodPressure?: string;
  heartRate?: number;
  respiratoryRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  height?: number;
  weight?: number;
}

export interface PatientConsent {
  id?: number;
  patientId?: number;
  grantedToInstitutionId: number;
  scope: string;
  status?: string;
  grantedDate?: string;
  expiryDate?: string;
  revokedDate?: string;
}

export interface GrantConsentRequest {
  grantedToInstitutionId: number;
  scope: string;
  expiryDate?: string;
}

export interface SharedPatientRecord {
  patient: Patient;
  requestingInstitutionId: number;
  sharedModules: string[];
  deniedModules: string[];
  encounters: Encounter[];
  problems: Problem[];
  medications: Medication[];
  allergies: Allergy[];
  vitalSigns: VitalSign[];
}

/** The authenticated principal, as returned by /api/auth/me and login. */
export interface CurrentUser {
  username: string;
  fullName?: string;
  institutionId?: number | null;
  role?: string | null;
  /** Flat permission strings, e.g. "VITALS:WRITE", "ADMIN:USERS". */
  permissions: string[];
}

/** Successful local-mode login result. */
export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: CurrentUser;
}

/** A role and the permissions it grants (admin console). */
export interface Role {
  code: string;
  name: string;
  description?: string;
  systemRole: boolean;
  permissions: string[];
}

/** A managed user account (admin console). */
export interface ManagedUser {
  id?: number;
  username: string;
  fullName?: string;
  institutionId?: number | null;
  roleCode: string;
  enabled: boolean;
  dateCreated?: string;
}

/** Canonical permission actions and admin permissions. */
export const Permission = {
  READ: 'READ',
  WRITE: 'WRITE',
  ADMIN_USERS: 'ADMIN:USERS',
  ADMIN_ROLES: 'ADMIN:ROLES',
  ADMIN_MODULES: 'ADMIN:MODULES'
} as const;

/** Builds a MODULE:ACTION permission string (mirrors the API). */
export function perm(module: string, action: string): string {
  return `${module}:${action}`;
}

/** Canonical module codes (must match com.ehrapi.common.ModuleCodes). */
export const ModuleCode = {
  DEMOGRAPHICS: 'DEMOGRAPHICS',
  ENCOUNTERS: 'ENCOUNTERS',
  PROBLEMS: 'PROBLEMS',
  MEDICATIONS: 'MEDICATIONS',
  ALLERGIES: 'ALLERGIES',
  VITALS: 'VITALS'
} as const;
