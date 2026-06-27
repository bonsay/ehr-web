import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Allergy, Encounter, Medication, Problem, VitalSign } from '../models/ehr.models';
import { bundleResources } from '../models/fhir.models';
import { FhirService } from './fhir.service';
import {
  allergyFromFhir, allergyToFhir, conditionFromFhir, conditionToFhir,
  encounterFromFhir, encounterToFhir, medicationFromFhir, medicationToFhir,
  observationFromFhir, observationToFhir
} from './fhir-mappers';

/**
 * Per-patient clinical modules, exchanged as FHIR R4 resources:
 *   Encounter, Condition (problems), MedicationRequest, AllergyIntolerance,
 *   Observation (vitals). Reads use FHIR search-type; creates use FHIR create;
 *   deletes use FHIR delete.
 */
@Injectable({ providedIn: 'root' })
export class ClinicalService {
  constructor(private fhir: FhirService) {}

  // Encounters ---------------------------------------------------------------
  getEncounters(patientId: number): Observable<Encounter[]> {
    return this.fhir.search('Encounter', { patient: patientId }).pipe(
      map(b => bundleResources(b, 'Encounter').map(encounterFromFhir)));
  }
  addEncounter(patientId: number, e: Encounter): Observable<Encounter> {
    return this.fhir.create('Encounter', encounterToFhir({ ...e, patientId })).pipe(map(encounterFromFhir));
  }
  deleteEncounter(id: number): Observable<void> {
    return this.fhir.delete('Encounter', id);
  }

  // Problems -> Condition ----------------------------------------------------
  getProblems(patientId: number): Observable<Problem[]> {
    return this.fhir.search('Condition', { patient: patientId }).pipe(
      map(b => bundleResources(b, 'Condition').map(conditionFromFhir)));
  }
  addProblem(patientId: number, p: Problem): Observable<Problem> {
    return this.fhir.create('Condition', conditionToFhir({ ...p, patientId })).pipe(map(conditionFromFhir));
  }
  deleteProblem(id: number): Observable<void> {
    return this.fhir.delete('Condition', id);
  }

  // Medications -> MedicationRequest -----------------------------------------
  getMedications(patientId: number): Observable<Medication[]> {
    return this.fhir.search('MedicationRequest', { patient: patientId }).pipe(
      map(b => bundleResources(b, 'MedicationRequest').map(medicationFromFhir)));
  }
  addMedication(patientId: number, m: Medication): Observable<Medication> {
    return this.fhir.create('MedicationRequest', medicationToFhir({ ...m, patientId })).pipe(map(medicationFromFhir));
  }
  deleteMedication(id: number): Observable<void> {
    return this.fhir.delete('MedicationRequest', id);
  }

  // Allergies -> AllergyIntolerance ------------------------------------------
  getAllergies(patientId: number): Observable<Allergy[]> {
    return this.fhir.search('AllergyIntolerance', { patient: patientId }).pipe(
      map(b => bundleResources(b, 'AllergyIntolerance').map(allergyFromFhir)));
  }
  addAllergy(patientId: number, a: Allergy): Observable<Allergy> {
    return this.fhir.create('AllergyIntolerance', allergyToFhir({ ...a, patientId })).pipe(map(allergyFromFhir));
  }
  deleteAllergy(id: number): Observable<void> {
    return this.fhir.delete('AllergyIntolerance', id);
  }

  // Vitals -> Observation ----------------------------------------------------
  getVitals(patientId: number): Observable<VitalSign[]> {
    return this.fhir.search('Observation', { patient: patientId }).pipe(
      map(b => bundleResources(b, 'Observation').map(observationFromFhir)));
  }
  addVital(patientId: number, v: VitalSign): Observable<VitalSign> {
    return this.fhir.create('Observation', observationToFhir({ ...v, patientId })).pipe(map(observationFromFhir));
  }
  deleteVital(id: number): Observable<void> {
    return this.fhir.delete('Observation', id);
  }
}
