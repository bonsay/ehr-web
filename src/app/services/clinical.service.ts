import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Allergy, Encounter, Medication, Problem, VitalSign } from '../models/ehr.models';

/**
 * CRUD access to the per-patient clinical modules. Each module is a nested
 * resource under /patients/{id} for reads/creates and a flat resource for
 * updates/deletes, matching ehr-api's controllers.
 */
@Injectable({ providedIn: 'root' })
export class ClinicalService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Encounters ---------------------------------------------------------------
  getEncounters(patientId: number): Observable<Encounter[]> {
    return this.http.get<Encounter[]>(`${this.apiUrl}/patients/${patientId}/encounters`);
  }
  addEncounter(patientId: number, e: Encounter): Observable<Encounter> {
    return this.http.post<Encounter>(`${this.apiUrl}/patients/${patientId}/encounters`, e);
  }
  deleteEncounter(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/encounters/${id}`);
  }

  // Problems -----------------------------------------------------------------
  getProblems(patientId: number): Observable<Problem[]> {
    return this.http.get<Problem[]>(`${this.apiUrl}/patients/${patientId}/problems`);
  }
  addProblem(patientId: number, p: Problem): Observable<Problem> {
    return this.http.post<Problem>(`${this.apiUrl}/patients/${patientId}/problems`, p);
  }
  deleteProblem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/problems/${id}`);
  }

  // Medications --------------------------------------------------------------
  getMedications(patientId: number): Observable<Medication[]> {
    return this.http.get<Medication[]>(`${this.apiUrl}/patients/${patientId}/medications`);
  }
  addMedication(patientId: number, m: Medication): Observable<Medication> {
    return this.http.post<Medication>(`${this.apiUrl}/patients/${patientId}/medications`, m);
  }
  deleteMedication(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/medications/${id}`);
  }

  // Allergies ----------------------------------------------------------------
  getAllergies(patientId: number): Observable<Allergy[]> {
    return this.http.get<Allergy[]>(`${this.apiUrl}/patients/${patientId}/allergies`);
  }
  addAllergy(patientId: number, a: Allergy): Observable<Allergy> {
    return this.http.post<Allergy>(`${this.apiUrl}/patients/${patientId}/allergies`, a);
  }
  deleteAllergy(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/allergies/${id}`);
  }

  // Vitals -------------------------------------------------------------------
  getVitals(patientId: number): Observable<VitalSign[]> {
    return this.http.get<VitalSign[]>(`${this.apiUrl}/patients/${patientId}/vitals`);
  }
  addVital(patientId: number, v: VitalSign): Observable<VitalSign> {
    return this.http.post<VitalSign>(`${this.apiUrl}/patients/${patientId}/vitals`, v);
  }
  deleteVital(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/vitals/${id}`);
  }
}
