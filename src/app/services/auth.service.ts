import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';
import { environment } from '../../environments/environment';
import { CurrentUser, LoginResponse } from '../models/ehr.models';

const TOKEN_KEY = 'ehr.accessToken';

/**
 * Authentication and authorization for the web client. Supports three modes,
 * selected by {@code environment.auth.mode}:
 *
 *  - local    — username/password login against the API, which issues a JWT.
 *  - oidc      — OIDC Authorization Code + PKCE against an external IdP.
 *  - disabled  — no authentication (open backend); everything is permitted.
 *
 * In every authenticated mode the user's effective permissions are loaded from
 * {@code GET /api/auth/me} and drive role-based UI gating via {@link can}.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {

  private userSubject = new BehaviorSubject<CurrentUser | null>(null);
  /** The authenticated user (null when signed out). */
  readonly user$: Observable<CurrentUser | null> = this.userSubject.asObservable();

  private localToken: string | null = null;

  constructor(private oauth: OAuthService, private http: HttpClient) {}

  get mode(): 'local' | 'oidc' | 'disabled' {
    return environment.auth.mode;
  }

  /** True when authentication is in effect (i.e. not the open backend). */
  get enabled(): boolean {
    return this.mode !== 'disabled';
  }

  get isLocal(): boolean { return this.mode === 'local'; }

  // ---- Lifecycle ------------------------------------------------------------

  /** Configure the active mode and restore/complete any existing session. */
  async init(): Promise<void> {
    if (this.mode === 'disabled') {
      return;
    }
    if (this.mode === 'oidc') {
      const config: AuthConfig = {
        issuer: environment.auth.oidc.issuer,
        clientId: environment.auth.oidc.clientId,
        redirectUri: window.location.origin,
        responseType: 'code',
        scope: environment.auth.oidc.scope,
        requireHttps: environment.production,
        showDebugInformation: !environment.production,
        useSilentRefresh: false
      };
      this.oauth.configure(config);
      this.oauth.setupAutomaticSilentRefresh();
      await this.oauth.loadDiscoveryDocumentAndTryLogin();
      if (this.oauth.hasValidAccessToken()) {
        await this.loadCurrentUser();
      }
      return;
    }
    // local mode: restore a stored token and validate it.
    this.localToken = localStorage.getItem(TOKEN_KEY);
    if (this.localToken) {
      try {
        await this.loadCurrentUser();
      } catch {
        this.clearLocalSession();
      }
    }
  }

  /** Fetch the current user's identity and permissions from the API. */
  private async loadCurrentUser(): Promise<void> {
    const user = await firstValueFrom(
      this.http.get<CurrentUser>(`${environment.apiUrl}/auth/me`));
    this.userSubject.next(user);
  }

  // ---- Local-mode login -----------------------------------------------------

  /** Username/password login (local mode). Resolves on success. */
  async loginLocal(username: string, password: string): Promise<CurrentUser> {
    const res = await firstValueFrom(this.http.post<LoginResponse>(
      `${environment.apiUrl}/auth/login`, { username, password }));
    this.localToken = res.accessToken;
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    this.userSubject.next(res.user);
    return res.user;
  }

  // ---- OIDC redirect login --------------------------------------------------

  /** Begin the OIDC redirect login (oidc mode only). */
  login(): void {
    if (this.mode === 'oidc') {
      this.oauth.initCodeFlow();
    }
  }

  logout(): void {
    if (this.mode === 'oidc') {
      this.oauth.logOut();
      this.userSubject.next(null);
    } else {
      this.clearLocalSession();
    }
  }

  private clearLocalSession(): void {
    this.localToken = null;
    localStorage.removeItem(TOKEN_KEY);
    this.userSubject.next(null);
  }

  // ---- Token / session state ------------------------------------------------

  hasValidToken(): boolean {
    if (this.mode === 'disabled') {
      return true;
    }
    if (this.mode === 'oidc') {
      return this.oauth.hasValidAccessToken();
    }
    return !!this.localToken;
  }

  get accessToken(): string {
    if (this.mode === 'oidc') {
      return this.oauth.getAccessToken() || '';
    }
    return this.localToken || '';
  }

  // ---- Principal accessors --------------------------------------------------

  get currentUser(): CurrentUser | null {
    return this.userSubject.value;
  }

  get username(): string | null {
    const u = this.currentUser;
    if (u) {
      return u.fullName || u.username;
    }
    // OIDC fallback before /me resolves.
    const claims = (this.oauth.getIdentityClaims() as Record<string, any>) || {};
    return claims['preferred_username'] || claims['name'] || claims['email'] || null;
  }

  get role(): string | null {
    return this.currentUser?.role ?? null;
  }

  get permissions(): string[] {
    return this.currentUser?.permissions ?? [];
  }

  /** Institution id for the signed-in user (drives the locked "acting as"). */
  get institutionId(): number | null {
    return this.currentUser?.institutionId ?? null;
  }

  // ---- Authorization checks -------------------------------------------------

  /** True if the user holds the given permission (always true when disabled). */
  can(permission: string): boolean {
    if (this.mode === 'disabled') {
      return true;
    }
    return this.permissions.includes(permission);
  }

  canAny(...permissions: string[]): boolean {
    return permissions.some(p => this.can(p));
  }

  /** Whether the user can reach any part of the administration console. */
  get isAdmin(): boolean {
    return this.canAny('ADMIN:USERS', 'ADMIN:ROLES', 'ADMIN:MODULES');
  }
}
