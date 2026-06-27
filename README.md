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

## Running

```bash
npm install
npm start
```

Serves on <http://localhost:4200> and proxies `/api` to the backend at
`http://localhost:8081` (see `proxy.conf.json`). Start `ehr-api` first
(preferably with the `h2` profile so the seed data is present).

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
├── services/                     HTTP + state services
│   ├── fhir.service.ts           low-level FHIR R4 REST client
│   ├── fhir-mappers.ts           FHIR <-> domain model translation
│   ├── institution.service.ts    FHIR Organization (+ admin via /api)
│   ├── institution-context.service.ts   "acting as" institution + enabled modules
│   ├── module.service.ts         module catalog/enablement (/api)
│   ├── patient.service.ts        FHIR Patient
│   ├── clinical.service.ts       FHIR Condition/MedicationRequest/AllergyIntolerance/Observation/Encounter
│   └── consent.service.ts        FHIR Consent + Patient/$everything
├── pages/
│   ├── dashboard/
│   ├── module-marketplace/       the pick-and-choose surface
│   ├── patient-list/
│   └── patient-detail/           modular tabs + sharing/consent
├── app.component.*               shell: top bar + institution picker
├── app.routes.ts
└── app.config.ts                 provideRouter + provideHttpClient
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
