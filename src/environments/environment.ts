export const environment = {
  production: false,
  // During `ng serve`, /api and /fhir are proxied to the EHR API
  // (see proxy.conf.json). Relative bases keep the app origin-agnostic.
  apiUrl: '/api',
  // The web client talks to the backend over the FHIR R4 API for all clinical
  // and patient data; /api is used only for platform config (module catalog).
  fhirUrl: '/fhir'
};
