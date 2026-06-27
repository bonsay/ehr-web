import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EhrModule, ModuleStatus } from '../models/ehr.models';

@Injectable({ providedIn: 'root' })
export class ModuleService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /** Full catalog of available modules. */
  getCatalog(): Observable<EhrModule[]> {
    return this.http.get<EhrModule[]>(`${this.apiUrl}/modules`);
  }

  /** Catalog annotated with the institution's enabled/disabled state. */
  getForInstitution(institutionId: number): Observable<ModuleStatus[]> {
    return this.http.get<ModuleStatus[]>(`${this.apiUrl}/institutions/${institutionId}/modules`);
  }

  /** Enable or disable a module for an institution. */
  setEnabled(institutionId: number, moduleCode: string, enabled: boolean): Observable<ModuleStatus> {
    return this.http.put<ModuleStatus>(
      `${this.apiUrl}/institutions/${institutionId}/modules/${moduleCode}`,
      { enabled }
    );
  }
}
