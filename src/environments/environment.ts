export const environment = {
  production: false,
  // During `ng serve`, /api and /fhir are proxied to the EHR API
  // (see proxy.conf.json). Relative bases keep the app origin-agnostic.
  apiUrl: '/api',
  // The web client talks to the backend over the FHIR R4 API for all clinical
  // and patient data; /api is used only for platform config (module catalog).
  fhirUrl: '/fhir',
  // OAuth2/OIDC. Disabled for local dev against an open backend (h2 profile).
  // Enable and point at your IdP for higher environments.
  auth: {
    enabled: false,
    issuer: 'http://localhost:8080/realms/ehr',
    clientId: 'ehr-web',
    scope: 'openid profile email',
    // JWT/ID-token claim carrying the user's institution id (match the API's
    // ehr.auth.institution-claim and your IdP mapper).
    institutionClaim: 'institution_id'
  }
};
