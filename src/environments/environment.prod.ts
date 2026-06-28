export const environment = {
  production: true,
  apiUrl: '/api',
  fhirUrl: '/fhir',
  // Higher environments authenticate via OIDC. Replace issuer/clientId with the
  // values for your identity provider (Keycloak, Entra ID, Auth0, Cognito, ...).
  auth: {
    enabled: true,
    issuer: 'https://idp.example.com/realms/ehr',
    clientId: 'ehr-web',
    scope: 'openid profile email',
    institutionClaim: 'institution_id'
  }
};
