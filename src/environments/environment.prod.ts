export const environment = {
  production: true,
  apiUrl: '/api',
  fhirUrl: '/fhir',
  // Higher environments authenticate via OIDC by default. Replace issuer/clientId
  // with the values for your identity provider (Keycloak, Entra ID, Auth0, ...).
  // Switch mode to 'local' to use the API's built-in username/password auth.
  auth: {
    mode: 'oidc' as 'local' | 'oidc' | 'disabled',
    institutionClaim: 'institution_id',
    oidc: {
      issuer: 'https://idp.example.com/realms/ehr',
      clientId: 'ehr-web',
      scope: 'openid profile email'
    }
  }
};
