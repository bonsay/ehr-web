# ehr-web

Angular 17 (standalone components) web client for the **Modular EHR** platform.
Tech stack mirrors `content-retrieval-web`.

## Highlights

- **Acting-as institution selector** (top bar). The chosen institution's enabled
  modules drive the whole UI.
- **Module Marketplace** (`/modules`) — enable/disable EHR functions per
  institution. Pick and choose what suits your clinical needs.
- **Patient chart** (`/patients/:id`) — demographics header plus one tab per
  *enabled* clinical module (Encounters, Problems, Medications, Allergies,
  Vitals). Disable a module and its tab disappears.
- **Sharing & Consent** tab — grant/revoke a patient's consent for other
  institutions, and **preview the exact record another institution would
  receive** (consent enforced server-side).
- **Role-based access** — the signed-in user's role decides what they can do.
  Clinical action buttons (e.g. *prescribe medication*, *record vitals*) appear
  only when the user holds the matching permission; the rest render read-only.
- **Admin console** (`/admin`, administrators only) — manage the role→permission
  matrix and provision users / assign roles.

## Running

```bash
npm install
npm start
```

Serves on <http://localhost:4200> and proxies `/api` and `/fhir` to the backend
at `http://localhost:8081` (see `proxy.conf.json`). Start `ehr-api` first
(preferably with the `h2` profile so the seed data is present).

By default `environment.ts` has `auth.mode = 'local'`, matching the API's `h2`
profile: you sign in at `/login` with a seeded username/password and the app
enforces role-based access — no identity provider required.

## Authentication & authorization

The client supports three auth modes, selected by `environment.auth.mode` (keep
it aligned with the API's `ehr.security.mode`):

| Mode | Sign-in | Use |
|------|---------|-----|
| `local` | username/password at `/login` (API issues the JWT) | dev / demo |
| `oidc` | OIDC Authorization Code + PKCE redirect (`angular-oauth2-oidc`) | higher environments |
| `disabled` | none (open backend) | quick local poking |

Common plumbing:

- `AuthService` signs in (local or OIDC), then loads the user's identity and
  **permissions** from `GET /api/auth/me`.
- `authInterceptor` attaches the access token as `Authorization: Bearer …` to
  `/api` and `/fhir` calls.
- `authGuard` protects routes (redirects to `/login` in local mode); `adminGuard`
  restricts `/admin` to users with an admin permission.
- `auth.can('MODULE:ACTION')` drives UI gating — e.g. the Medications *Add*
  button renders only when the user has `MEDICATIONS:WRITE` (physician, not
  nurse).
- The acting institution is taken from the signed-in user, and the top-bar
  selector is locked (no spoofing).

**Demo accounts** (local mode, password `<username>123`): `admin`, `physician`,
`nurse`, `reception` — also listed on the login screen for one-click fill.

Configure modes in `src/environments/environment*.ts`:

```ts
auth: {
  mode: 'local',                       // 'local' | 'oidc' | 'disabled'
  institutionClaim: 'institution_id',  // must match the API's claim (oidc)
  oidc: { issuer: 'https://<your-idp>/realms/ehr', clientId: 'ehr-web', scope: 'openid profile email' }
}
```

`environment.prod.ts` ships with `mode: 'oidc'`. Register `ehr-web` in your IdP
as a public SPA client with redirect URI = the app origin and Auth Code + PKCE
enabled (works with Keycloak, Entra ID, Auth0, Cognito).

## FHIR communication

The client talks to the backend over the **FHIR R4 API** for all patient and
clinical data — `Patient`, `Organization`, `Condition`, `MedicationRequest`,
`AllergyIntolerance`, `Observation`, `Encounter`, `Consent`, and the
`Patient/$everything` operation for consent-gated record sharing. The platform
`/api` is used only for non-clinical config (module catalog, consent admin).

`FhirService` is the low-level REST client; `fhir-mappers.ts` translates FHIR
resources to/from the app's domain models, so the page components stay unchanged
and work in plain domain objects. FHIR is an implementation detail of the
service layer.

## Project structure

```
src/app
├── models/
│   ├── ehr.models.ts             domain interfaces used by components
│   └── fhir.models.ts            FHIR Bundle/resource envelope types
├── guards/auth.guard.ts          authGuard + adminGuard (local / oidc aware)
├── services/                     HTTP + state services
│   ├── auth.service.ts           multi-mode login, token, current user + permissions, can()
│   ├── auth.interceptor.ts       attaches Bearer token to /api and /fhir
│   ├── admin.service.ts          /api/admin roles & users client
│   ├── fhir.service.ts           low-level FHIR R4 REST client
│   ├── fhir-mappers.ts           FHIR <-> domain model translation
│   ├── institution.service.ts    FHIR Organization (+ admin via /api)
│   ├── institution-context.service.ts   "acting as" institution (locked to the signed-in user)
│   ├── module.service.ts         module catalog/enablement (/api)
│   ├── patient.service.ts        FHIR Patient
│   ├── clinical.service.ts       FHIR Condition/MedicationRequest/AllergyIntolerance/Observation/Encounter
│   └── consent.service.ts        FHIR Consent + Patient/$everything
├── pages/
│   ├── login/                    username/password sign-in (local mode)
│   ├── dashboard/
│   ├── module-marketplace/       the pick-and-choose surface (toggle gated by ADMIN:MODULES)
│   ├── patient-list/
│   ├── patient-detail/           modular tabs + sharing/consent (actions gated by permission)
│   └── admin/                    role permission matrix + user management
├── app.component.*               shell: top bar + institution picker + role badge + sign in/out
├── app.routes.ts                 routes guarded by authGuard / adminGuard
└── app.config.ts                 provideRouter + provideHttpClient + provideOAuthClient
```

## Try the modular + sharing flow

1. Top bar → switch **Acting as** between *General Hospital* and *Downtown
   Clinic*. Notice the patient chart tabs change (Downtown Clinic has fewer
   modules enabled).
2. Open patient **Carter, John** → **Sharing & Consent** tab.
3. Under *Preview shared record*, pick *Downtown Clinic* → you'll see only
   `PROBLEMS` and `MEDICATIONS` (the consented scope); the rest are withheld.
4. Pick an institution with no consent → the API responds 403 and the UI shows
   the access-denied message.

## Try role-based access

1. Sign in as **nurse** (`nurse` / `nurse123`). Open a patient → **Vitals**: you
   can record vitals. Open **Medications**: the *Add* form is replaced by
   "🔒 Your role cannot prescribe medications." There is no **Admin** link.
2. Sign out, sign in as **physician** (`physician` / `physician123`). Now the
   **Medications** *Add* form is available — physicians can prescribe.
3. Sign out, sign in as **admin** (`admin` / `admin123`). The **Admin** link
   appears → manage the role permission matrix (e.g. grant `NURSE` the
   `MEDICATIONS:WRITE` permission and watch nurses gain prescribing on next
   sign-in) and create/assign users.
