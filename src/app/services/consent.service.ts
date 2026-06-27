import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { GrantConsentRequest, PatientConsent, SharedPatientRecord } from '../models/ehr.models';
import { bundleResources } from '../models/fhir.models';
import { FhirService } from './fhir.service';
import { bundleToSharedRecord, consentFromFhir } from './fhir-mappers';

/**
 * Consent + cross-institution sharing.
 *  - list / shared record use FHIR (Consent resource, Patient/$everything)
 *  - grant / revoke are administrative consent operations on the platform /api
 */
@Injectable({ providedIn: 'root' })
export class ConsentService {
  constructor(private fhir: FhirService, private http: HttpClient) {}

  list(patientId: number): Observable<PatientConsent[]> {
    return this.fhir.search('Consent', { patient: patientId }).pipe(
      map(b => bundleResources(b, 'Consent').map(consentFromFhir)));
  }

  grant(patientId: number, request: GrantConsentRequest): Observable<PatientConsent> {
    return this.http.post<PatientConsent>(`${environment.apiUrl}/patients/${patientId}/consents`, request);
  }

  revoke(patientId: number, consentId: number): Observable<PatientConsent> {
    return this.http.post<PatientConsent>(
      `${environment.apiUrl}/patients/${patientId}/consents/${consentId}/revoke`, {});
  }

  /** Cross-institution shared record via FHIR Patient/$everything (consent-gated). */
  getSharedRecord(patientId: number, requestingInstitutionId: number): Observable<SharedPatientRecord> {
    return this.fhir.everything(patientId, requestingInstitutionId).pipe(
      map(bundle => bundleToSharedRecord(bundle, requestingInstitutionId)));
  }
}
