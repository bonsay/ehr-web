import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Institution } from '../models/ehr.models';
import { bundleResources } from '../models/fhir.models';
import { FhirService } from './fhir.service';
import { organizationFromFhir } from './fhir-mappers';

/**
 * Institutions over FHIR (Organization resource) for reads; administrative
 * create/update/delete use the platform /api.
 */
@Injectable({ providedIn: 'root' })
export class InstitutionService {
  constructor(private fhir: FhirService, private http: HttpClient) {}

  getAll(): Observable<Institution[]> {
    return this.fhir.search('Organization').pipe(
      map(b => bundleResources(b, 'Organization').map(organizationFromFhir)));
  }

  getById(id: number): Observable<Institution> {
    return this.fhir.read('Organization', id).pipe(map(organizationFromFhir));
  }

  // Administrative (non-FHIR) operations.
  create(institution: Institution): Observable<Institution> {
    return this.http.post<Institution>(`${environment.apiUrl}/institutions`, institution);
  }

  update(id: number, institution: Institution): Observable<Institution> {
    return this.http.put<Institution>(`${environment.apiUrl}/institutions/${id}`, institution);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/institutions/${id}`);
  }
}
