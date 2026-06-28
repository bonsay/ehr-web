import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Attaches the OIDC access token as a Bearer header to API/FHIR requests.
 * No-op when auth is disabled (local dev) or no token is available.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const isBackendCall = req.url.startsWith('/api') || req.url.startsWith('/fhir');
  if (auth.enabled && isBackendCall && auth.accessToken) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${auth.accessToken}` } });
  }
  return next(req);
};
