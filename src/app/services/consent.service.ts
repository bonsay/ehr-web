import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { GrantConsentRequest, PatientConsent, SharedPatientRecord } from '../models/ehr.models';

@Injectable({ providedIn: 'root' })
export class ConsentService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  list(patientId: number): Observable<PatientConsent[]> {
    return this.http.get<PatientConsent[]>(`${this.apiUrl}/patients/${patientId}/consents`);
  }

  grant(patientId: number, request: GrantConsentRequest): Observable<PatientConsent> {
    return this.http.post<PatientConsent>(`${this.apiUrl}/patients/${patientId}/consents`, request);
  }

  revoke(patientId: number, consentId: number): Observable<PatientConsent> {
    return this.http.post<PatientConsent>(
      `${this.apiUrl}/patients/${patientId}/consents/${consentId}/revoke`, {});
  }

  /** Cross-institution shared record (consent-gated; 403 if not permitted). */
  getSharedRecord(patientId: number, requestingInstitutionId: number): Observable<SharedPatientRecord> {
    return this.http.get<SharedPatientRecord>(
      `${this.apiUrl}/sharing/patients/${patientId}/record`,
      { params: { requestingInstitutionId: String(requestingInstitutionId) } }
    );
  }
}
