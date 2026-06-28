import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Route guard: requires a valid token in secured mode, otherwise kicks off the
 * OIDC login redirect. Always allows navigation when auth is disabled (dev).
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.hasValidToken()) {
    return true;
  }
  auth.login();
  return false;
};
