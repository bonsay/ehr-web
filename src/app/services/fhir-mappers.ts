// Translation between FHIR R4 resources and this app's domain models.
// Mirrors the server-side com.ehrapi.fhir.FhirMapper so the two ends agree.

import {
  Allergy, Encounter, Institution, Medication, Patient,
  PatientConsent, Problem, SharedPatientRecord, VitalSign
} from '../models/ehr.models';
import { FhirBundle, FhirResource, bundleResources } from '../models/fhir.models';

// ---- helpers ---------------------------------------------------------------

const num = (s: string | undefined): number | undefined =>
  s == null ? undefined : Number(s);

/** Numeric id from a reference like "Patient/1". */
function refId(ref: any): number | undefined {
  const r = ref?.reference as string | undefined;
  if (!r || !r.includes('/')) { return undefined; }
  const n = Number(r.substring(r.lastIndexOf('/') + 1));
  return isNaN(n) ? undefined : n;
}

const ref = (type: string, id?: number) => (id == null ? undefined : { reference: `${type}/${id}` });
const firstCodingCode = (cc: any): string | undefined => cc?.coding?.[0]?.code;
const clinicalStatusCode = (cs: any): string | undefined => cs?.coding?.[0]?.code;
const dateOnly = (s?: string): string | undefined => (s ? s.substring(0, 10) : undefined);

// ---- Patient ---------------------------------------------------------------

export function patientFromFhir(r: FhirResource): Patient {
  const name = r['name']?.[0] ?? {};
  const telecom: any[] = r['telecom'] ?? [];
  return {
    id: num(r.id),
    mrn: r['identifier']?.[0]?.value ?? '',
    firstName: name.given?.[0] ?? '',
    lastName: name.family ?? '',
    dateOfBirth: r['birthDate'],
    gender: domainGender(r['gender']),
    phone: telecom.find(t => t.system === 'phone')?.value,
    email: telecom.find(t => t.system === 'email')?.value,
    address: r['address']?.[0]?.text,
    homeInstitutionId: refId(r['managingOrganization'])
  };
}

export function patientToFhir(p: Patient): FhirResource {
  const telecom: any[] = [];
  if (p.phone) { telecom.push({ system: 'phone', value: p.phone }); }
  if (p.email) { telecom.push({ system: 'email', value: p.email }); }
  return {
    resourceType: 'Patient',
    identifier: [{ system: 'urn:ehr:mrn', value: p.mrn }],
    name: [{ family: p.lastName, given: [p.firstName] }],
    gender: fhirGender(p.gender),
    birthDate: p.dateOfBirth || undefined,
    telecom: telecom.length ? telecom : undefined,
    address: p.address ? [{ text: p.address }] : undefined,
    managingOrganization: ref('Organization', p.homeInstitutionId)
  };
}

// ---- Organization ----------------------------------------------------------

export function organizationFromFhir(r: FhirResource): Institution {
  return {
    id: num(r.id),
    name: r['name'] ?? '',
    code: r['identifier']?.[0]?.value ?? '',
    type: r['type']?.[0]?.text,
    address: r['address']?.[0]?.text,
    phone: (r['telecom'] ?? []).find((t: any) => t.system === 'phone')?.value,
    active: r['active']
  };
}

// ---- Condition (Problem) ---------------------------------------------------

export function conditionFromFhir(r: FhirResource): Problem {
  const status = clinicalStatusCode(r['clinicalStatus']);
  return {
    id: num(r.id),
    patientId: refId(r['subject']),
    institutionId: refId(r['recorder']),
    code: firstCodingCode(r['code']),
    description: r['code']?.text ?? r['code']?.coding?.[0]?.display ?? '',
    status: status ? status.toUpperCase() : undefined,
    onsetDate: dateOnly(r['onsetDateTime']),
    recordedDate: dateOnly(r['recordedDate'])
  };
}

export function conditionToFhir(p: Problem): FhirResource {
  return {
    resourceType: 'Condition',
    clinicalStatus: p.status
      ? { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: p.status.toLowerCase() }] }
      : undefined,
    code: {
      coding: p.code ? [{ system: 'http://hl7.org/fhir/sid/icd-10', code: p.code, display: p.description }] : undefined,
      text: p.description
    },
    subject: ref('Patient', p.patientId),
    recorder: ref('Organization', p.institutionId),
    onsetDateTime: p.onsetDate || undefined
  };
}

// ---- MedicationRequest (Medication) ----------------------------------------

export function medicationFromFhir(r: FhirResource): Medication {
  const dosage = r['dosageInstruction']?.[0];
  return {
    id: num(r.id),
    patientId: refId(r['subject']),
    institutionId: refId(r['recorder']),
    name: r['medicationCodeableConcept']?.text ?? '',
    dosage: dosage?.text,
    frequency: dosage?.timing?.code?.text,
    route: dosage?.route?.text,
    status: (r['status'] ?? 'active').toUpperCase(),
    startDate: dateOnly(r['authoredOn']),
    prescriber: r['requester']?.display
  };
}

export function medicationToFhir(m: Medication): FhirResource {
  const dosageText = [m.dosage, m.frequency].filter(Boolean).join(' ') || undefined;
  return {
    resourceType: 'MedicationRequest',
    status: (m.status ?? 'ACTIVE').toLowerCase(),
    intent: 'order',
    medicationCodeableConcept: { text: m.name },
    subject: ref('Patient', m.patientId),
    requester: m.prescriber ? { display: m.prescriber } : undefined,
    authoredOn: m.startDate || undefined,
    dosageInstruction: (dosageText || m.route || m.frequency) ? [{
      text: dosageText,
      timing: m.frequency ? { code: { text: m.frequency } } : undefined,
      route: m.route ? { text: m.route } : undefined
    }] : undefined,
    recorder: ref('Organization', m.institutionId)
  };
}

// ---- AllergyIntolerance (Allergy) ------------------------------------------

export function allergyFromFhir(r: FhirResource): Allergy {
  const reaction = r['reaction']?.[0];
  const status = clinicalStatusCode(r['clinicalStatus']);
  return {
    id: num(r.id),
    patientId: refId(r['patient']),
    institutionId: refId(r['recorder']),
    allergen: r['code']?.text ?? '',
    reaction: reaction?.manifestation?.[0]?.text,
    severity: reaction?.severity ? reaction.severity.toUpperCase() : undefined,
    status: status ? status.toUpperCase() : undefined,
    recordedDate: dateOnly(r['recordedDate'])
  };
}

export function allergyToFhir(a: Allergy): FhirResource {
  return {
    resourceType: 'AllergyIntolerance',
    clinicalStatus: a.status
      ? { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical', code: a.status.toLowerCase() }] }
      : undefined,
    code: { text: a.allergen },
    patient: ref('Patient', a.patientId),
    recorder: ref('Organization', a.institutionId),
    reaction: (a.reaction || a.severity) ? [{
      manifestation: a.reaction ? [{ text: a.reaction }] : undefined,
      severity: a.severity ? a.severity.toLowerCase() : undefined
    }] : undefined
  };
}

// ---- Observation (VitalSign) -----------------------------------------------

const VITAL_LABELS = {
  bp: 'Blood pressure',
  hr: 'Heart rate',
  rr: 'Respiratory rate',
  temp: 'Body temperature',
  spo2: 'Oxygen saturation',
  height: 'Body height',
  weight: 'Body weight'
};

function componentLabel(c: any): string | undefined {
  return c?.code?.text ?? c?.code?.coding?.[0]?.display;
}

export function observationFromFhir(r: FhirResource): VitalSign {
  const v: VitalSign = {
    id: num(r.id),
    patientId: refId(r['subject']),
    institutionId: refId(r['performer']?.[0]),
    recordedDate: r['effectiveDateTime']
  };
  for (const c of r['component'] ?? []) {
    const label = componentLabel(c);
    const value = c.valueQuantity?.value;
    switch (label) {
      case VITAL_LABELS.bp: v.bloodPressure = c.valueString; break;
      case VITAL_LABELS.hr: v.heartRate = value; break;
      case VITAL_LABELS.rr: v.respiratoryRate = value; break;
      case VITAL_LABELS.temp: v.temperature = value; break;
      case VITAL_LABELS.spo2: v.oxygenSaturation = value; break;
      case VITAL_LABELS.height: v.height = value; break;
      case VITAL_LABELS.weight: v.weight = value; break;
    }
  }
  return v;
}

export function observationToFhir(v: VitalSign): FhirResource {
  const component: any[] = [];
  const str = (label: string, value?: string) => {
    if (value != null && value !== '') { component.push({ code: { text: label }, valueString: value }); }
  };
  const qty = (label: string, code: string, value?: number, unit?: string, ucum?: string) => {
    if (value != null) {
      component.push({
        code: { coding: [{ system: 'http://loinc.org', code, display: label }], text: label },
        valueQuantity: { value, unit, system: 'http://unitsofmeasure.org', code: ucum }
      });
    }
  };
  str(VITAL_LABELS.bp, v.bloodPressure);
  qty(VITAL_LABELS.hr, '8867-4', v.heartRate, 'beats/minute', '/min');
  qty(VITAL_LABELS.rr, '9279-1', v.respiratoryRate, 'breaths/minute', '/min');
  qty(VITAL_LABELS.temp, '8310-5', v.temperature, 'C', 'Cel');
  qty(VITAL_LABELS.spo2, '2708-6', v.oxygenSaturation, '%', '%');
  qty(VITAL_LABELS.height, '8302-2', v.height, 'cm', 'cm');
  qty(VITAL_LABELS.weight, '29463-7', v.weight, 'kg', 'kg');
  return {
    resourceType: 'Observation',
    status: 'final',
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }] }],
    code: { coding: [{ system: 'http://loinc.org', code: '85353-1' }], text: 'Vital signs panel' },
    subject: ref('Patient', v.patientId),
    performer: v.institutionId != null ? [ref('Organization', v.institutionId)] : undefined,
    effectiveDateTime: v.recordedDate || undefined,
    component: component.length ? component : undefined
  };
}

// ---- Encounter -------------------------------------------------------------

const EXT_NOTES = 'urn:ehr:encounter-notes';

export function encounterFromFhir(r: FhirResource): Encounter {
  const notesExt = (r['extension'] ?? []).find((e: any) => e.url === EXT_NOTES);
  return {
    id: num(r.id),
    patientId: refId(r['subject']),
    institutionId: refId(r['serviceProvider']),
    status: domainEncounterStatus(r['status']),
    type: r['type']?.[0]?.text,
    encounterDate: r['period']?.start,
    reason: r['reasonCode']?.[0]?.text,
    providerName: r['participant']?.[0]?.individual?.display,
    notes: notesExt?.valueString
  };
}

export function encounterToFhir(e: Encounter): FhirResource {
  const resource: FhirResource = {
    resourceType: 'Encounter',
    status: fhirEncounterStatus(e.status),
    class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'ambulatory' },
    type: e.type ? [{ text: e.type }] : undefined,
    subject: ref('Patient', e.patientId),
    period: e.encounterDate ? { start: e.encounterDate } : undefined,
    reasonCode: e.reason ? [{ text: e.reason }] : undefined,
    participant: e.providerName ? [{ individual: { display: e.providerName } }] : undefined,
    serviceProvider: ref('Organization', e.institutionId)
  };
  if (e.notes) {
    resource['extension'] = [{ url: EXT_NOTES, valueString: e.notes }];
  }
  return resource;
}

// ---- Consent ---------------------------------------------------------------

export function consentFromFhir(r: FhirResource): PatientConsent {
  const data: any[] = r['provision']?.data ?? [];
  const scope = data.length
    ? data.map(d => d.reference?.display).filter(Boolean).join(',')
    : 'ALL';
  return {
    id: num(r.id),
    patientId: refId(r['patient']),
    grantedToInstitutionId: refId(r['organization']?.[0]) ?? 0,
    scope,
    status: r['status'] === 'active' ? 'ACTIVE' : 'REVOKED',
    grantedDate: r['dateTime'],
    expiryDate: r['provision']?.period?.end
  };
}

// ---- $everything Bundle ----------------------------------------------------

export function bundleToSharedRecord(bundle: FhirBundle, requestingInstitutionId: number): SharedPatientRecord {
  const patientRes = bundleResources(bundle, 'Patient')[0];
  const problems = bundleResources(bundle, 'Condition').map(conditionFromFhir);
  const medications = bundleResources(bundle, 'MedicationRequest').map(medicationFromFhir);
  const allergies = bundleResources(bundle, 'AllergyIntolerance').map(allergyFromFhir);
  const vitalSigns = bundleResources(bundle, 'Observation').map(observationFromFhir);
  const encounters = bundleResources(bundle, 'Encounter').map(encounterFromFhir);

  const sharedModules: string[] = [];
  if (encounters.length) { sharedModules.push('ENCOUNTERS'); }
  if (problems.length) { sharedModules.push('PROBLEMS'); }
  if (medications.length) { sharedModules.push('MEDICATIONS'); }
  if (allergies.length) { sharedModules.push('ALLERGIES'); }
  if (vitalSigns.length) { sharedModules.push('VITALS'); }

  // Withheld modules are reported via an informational OperationOutcome.
  const outcome = bundleResources(bundle, 'OperationOutcome')[0];
  const deniedModules: string[] = [];
  for (const issue of outcome?.['issue'] ?? []) {
    const match = /Module (\w+) withheld/.exec(issue.diagnostics ?? '');
    if (match) { deniedModules.push(match[1]); }
  }

  return {
    patient: patientRes ? patientFromFhir(patientRes) : ({} as Patient),
    requestingInstitutionId,
    sharedModules,
    deniedModules,
    encounters,
    problems,
    medications,
    allergies,
    vitalSigns
  };
}

// ---- value-set translations ------------------------------------------------

function fhirGender(g?: string): string {
  switch ((g ?? '').toUpperCase()) {
    case 'MALE': return 'male';
    case 'FEMALE': return 'female';
    case 'OTHER': return 'other';
    default: return 'unknown';
  }
}

function domainGender(g?: string): string | undefined {
  switch ((g ?? '').toLowerCase()) {
    case 'male': return 'MALE';
    case 'female': return 'FEMALE';
    case 'other': return 'OTHER';
    case '': return undefined;
    default: return 'UNKNOWN';
  }
}

function fhirEncounterStatus(s?: string): string {
  switch ((s ?? '').toUpperCase()) {
    case 'COMPLETED': case 'FINISHED': return 'finished';
    case 'IN_PROGRESS': return 'in-progress';
    case 'CANCELLED': return 'cancelled';
    case 'PLANNED': return 'planned';
    default: return 'finished';
  }
}

function domainEncounterStatus(s?: string): string {
  switch ((s ?? '').toLowerCase()) {
    case 'finished': return 'COMPLETED';
    case 'in-progress': return 'IN_PROGRESS';
    case 'cancelled': return 'CANCELLED';
    case 'planned': return 'PLANNED';
    default: return 'COMPLETED';
  }
}
