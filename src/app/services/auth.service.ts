import { Injectable } from '@angular/core';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';
import { environment } from '../../environments/environment';

/**
 * OIDC authentication using the Authorization Code flow with PKCE.
 *
 * When {@code environment.auth.enabled} is false (local dev against an open
 * backend) every method is a no-op / permissive, so the app runs without an
 * identity provider.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private oauth: OAuthService) {}

  get enabled(): boolean {
    return environment.auth.enabled;
  }

  /** Configure the OIDC client and complete any redirect login. */
  async init(): Promise<void> {
    if (!this.enabled) {
      return;
    }
    const config: AuthConfig = {
      issuer: environment.auth.issuer,
      clientId: environment.auth.clientId,
      redirectUri: window.location.origin,
      responseType: 'code',          // Authorization Code + PKCE
      scope: environment.auth.scope,
      requireHttps: environment.production,
      showDebugInformation: !environment.production,
      useSilentRefresh: false
    };
    this.oauth.configure(config);
    this.oauth.setupAutomaticSilentRefresh();
    await this.oauth.loadDiscoveryDocumentAndTryLogin();
  }

  hasValidToken(): boolean {
    return !this.enabled || this.oauth.hasValidAccessToken();
  }

  login(): void {
    if (this.enabled) {
      this.oauth.initCodeFlow();
    }
  }

  logout(): void {
    if (this.enabled) {
      this.oauth.logOut();
    }
  }

  get accessToken(): string {
    return this.enabled ? this.oauth.getAccessToken() : '';
  }

  private get claims(): Record<string, any> {
    return (this.oauth.getIdentityClaims() as Record<string, any>) || {};
  }

  get username(): string | null {
    const c = this.claims;
    return c['preferred_username'] || c['name'] || c['email'] || null;
  }

  /** Institution id carried by the token's configured claim, if present. */
  get institutionId(): number | null {
    const raw = this.claims[environment.auth.institutionClaim];
    if (raw == null) {
      return null;
    }
    const n = Number(raw);
    return isNaN(n) ? null : n;
  }
}
