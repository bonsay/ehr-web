import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ManagedUser, Role } from '../models/ehr.models';
import { environment } from '../../environments/environment';

/**
 * Administration API client: manage roles (and the permissions they grant) and
 * users (and the role assigned to each). Backed by /api/admin/* endpoints, which
 * are themselves gated by the ADMIN:ROLES / ADMIN:USERS permissions.
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly base = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  // ---- Roles ----------------------------------------------------------------
  listRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.base}/roles`);
  }

  /** Catalog of assignable permissions, grouped (group label -> permissions). */
  permissionCatalog(): Observable<Record<string, string[]>> {
    return this.http.get<Record<string, string[]>>(`${this.base}/roles/permission-catalog`);
  }

  updateRolePermissions(code: string, permissions: string[]): Observable<Role> {
    return this.http.put<Role>(`${this.base}/roles/${code}/permissions`, { permissions });
  }

  // ---- Users ----------------------------------------------------------------
  listUsers(): Observable<ManagedUser[]> {
    return this.http.get<ManagedUser[]>(`${this.base}/users`);
  }

  createUser(req: {
    username: string; password: string; fullName?: string;
    institutionId?: number | null; roleCode: string;
  }): Observable<ManagedUser> {
    return this.http.post<ManagedUser>(`${this.base}/users`, req);
  }

  updateUser(id: number, req: {
    fullName?: string; institutionId?: number | null; roleCode?: string;
    enabled?: boolean; password?: string;
  }): Observable<ManagedUser> {
    return this.http.put<ManagedUser>(`${this.base}/users/${id}`, req);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/${id}`);
  }
}
