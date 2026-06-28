import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Route guard: requires a valid session. In local mode an unauthenticated user
 * is sent to the login page; in OIDC mode the login redirect is kicked off.
 * Always allows navigation when auth is disabled (open backend).
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.hasValidToken()) {
    return true;
  }
  if (auth.isLocal) {
    return router.parseUrl('/login');
  }
  auth.login();
  return false;
};

/**
 * Route guard for the administration console — requires any admin permission.
 * Authenticated non-admins are redirected to the dashboard.
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.hasValidToken()) {
    return auth.isLocal ? router.parseUrl('/login') : (auth.login(), false);
  }
  return auth.isAdmin ? true : router.parseUrl('/dashboard');
};
