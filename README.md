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

## Project structure

```
src/app
├── models/ehr.models.ts          shared TypeScript interfaces
├── services/                     HTTP + state services
│   ├── institution.service.ts
│   ├── institution-context.service.ts   "acting as" institution + enabled modules
│   ├── module.service.ts
│   ├── patient.service.ts
│   ├── clinical.service.ts       encounters/problems/medications/allergies/vitals
│   └── consent.service.ts        consents + cross-institution shared record
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
