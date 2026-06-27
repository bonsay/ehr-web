import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FhirBundle, FhirResource } from '../models/fhir.models';

/**
 * Low-level FHIR R4 REST client. All clinical/patient communication with the
 * backend goes through these standards-based interactions
 * (read / search-type / create / delete / $everything).
 */
@Injectable({ providedIn: 'root' })
export class FhirService {
  private readonly baseUrl = environment.fhirUrl;

  constructor(private http: HttpClient) {}

  read(resourceType: string, id: number | string): Observable<FhirResource> {
    return this.http.get<FhirResource>(`${this.baseUrl}/${resourceType}/${id}`);
  }

  search(resourceType: string, params: Record<string, string | number> = {}): Observable<FhirBundle> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        httpParams = httpParams.set(k, String(v));
      }
    });
    return this.http.get<FhirBundle>(`${this.baseUrl}/${resourceType}`, { params: httpParams });
  }

  create(resourceType: string, resource: FhirResource): Observable<FhirResource> {
    return this.http.post<FhirResource>(`${this.baseUrl}/${resourceType}`, resource);
  }

  delete(resourceType: string, id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${resourceType}/${id}`);
  }

  /** Patient/$everything — consent-gated record Bundle. */
  everything(patientId: number, requestingInstitutionId: number): Observable<FhirBundle> {
    const params = new HttpParams().set('requestingInstitution', String(requestingInstitutionId));
    return this.http.get<FhirBundle>(`${this.baseUrl}/Patient/${patientId}/$everything`, { params });
  }
}
