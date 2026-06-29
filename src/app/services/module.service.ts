import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CheckoutResult, EhrModule, Entitlement, ModuleStatus } from '../models/ehr.models';

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

  /** The institution's module entitlements (subscriptions / purchases). */
  getEntitlements(institutionId: number): Observable<Entitlement[]> {
    return this.http.get<Entitlement[]>(`${this.apiUrl}/institutions/${institutionId}/entitlements`);
  }

  /** Start a free trial of a paid module; returns the module's updated state. */
  startTrial(institutionId: number, moduleCode: string): Observable<ModuleStatus> {
    return this.http.post<ModuleStatus>(
      `${this.apiUrl}/institutions/${institutionId}/modules/${moduleCode}/trial`, {}
    );
  }

  /**
   * Start a purchase via the active billing provider. Returns either a completed
   * grant (local) or a hosted-checkout URL to redirect to (Stripe).
   */
  purchase(institutionId: number, moduleCode: string): Observable<CheckoutResult> {
    return this.http.post<CheckoutResult>(
      `${this.apiUrl}/institutions/${institutionId}/modules/${moduleCode}/purchase`, {}
    );
  }
}
