import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Patient } from '../models/ehr.models';
import { bundleResources } from '../models/fhir.models';
import { FhirService } from './fhir.service';
import { patientFromFhir, patientToFhir } from './fhir-mappers';

/**
 * Patient access over FHIR (Patient resource). A couple of administrative
 * operations not exposed via FHIR fall back to the platform /api.
 */
@Injectable({ providedIn: 'root' })
export class PatientService {
  constructor(private fhir: FhirService, private http: HttpClient) {}

  list(search?: string, institutionId?: number): Observable<Patient[]> {
    const params: Record<string, string | number> = {};
    if (search) { params['name'] = search; }
    if (institutionId != null) { params['institution'] = institutionId; }
    return this.fhir.search('Patient', params).pipe(
      map(bundle => bundleResources(bundle, 'Patient').map(patientFromFhir))
    );
  }

  getById(id: number): Observable<Patient> {
    return this.fhir.read('Patient', id).pipe(map(patientFromFhir));
  }

  create(patient: Patient): Observable<Patient> {
    return this.fhir.create('Patient', patientToFhir(patient)).pipe(map(patientFromFhir));
  }

  // Administrative (non-FHIR) operations.
  update(id: number, patient: Patient): Observable<Patient> {
    return this.http.put<Patient>(`${environment.apiUrl}/patients/${id}`, patient);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/patients/${id}`);
  }
}
