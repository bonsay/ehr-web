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

/** Canonical module codes (must match com.ehrapi.common.ModuleCodes). */
export const ModuleCode = {
  DEMOGRAPHICS: 'DEMOGRAPHICS',
  ENCOUNTERS: 'ENCOUNTERS',
  PROBLEMS: 'PROBLEMS',
  MEDICATIONS: 'MEDICATIONS',
  ALLERGIES: 'ALLERGIES',
  VITALS: 'VITALS'
} as const;
