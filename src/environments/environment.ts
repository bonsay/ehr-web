export const environment = {
  production: false,
  // During `ng serve`, /api and /fhir are proxied to the EHR API
  // (see proxy.conf.json). Relative bases keep the app origin-agnostic.
  apiUrl: '/api',
  // The web client talks to the backend over the FHIR R4 API for all clinical
  // and patient data; /api is used only for platform config and administration.
  fhirUrl: '/fhir',
  // Authentication mode — must align with the API's ehr.security.mode:
  //   'local'    - username/password login against the API (default for dev /
  //                the h2 profile). Fully self-contained; no external IdP.
  //   'oidc'     - OIDC Authorization Code + PKCE against an external IdP.
  //   'disabled' - no authentication (API ehr.security.mode=open).
  auth: {
    mode: 'local' as 'local' | 'oidc' | 'disabled',
    // JWT/ID-token claim carrying the user's institution id (oidc mode).
    institutionClaim: 'institution_id',
    // OIDC settings (used only when mode === 'oidc').
    oidc: {
      issuer: 'http://localhost:8080/realms/ehr',
      clientId: 'ehr-web',
      scope: 'openid profile email'
    }
  }
};
