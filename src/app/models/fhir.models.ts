// Minimal FHIR R4 typings for the web client. FHIR resources are deeply nested
// and largely open, so we type the envelope precisely and treat resource bodies
// as open records that the mappers translate to/from our domain models.

export interface FhirResource {
  resourceType: string;
  id?: string;
  [key: string]: any;
}

export interface FhirBundleEntry {
  fullUrl?: string;
  resource: FhirResource;
}

export interface FhirBundle {
  resourceType: 'Bundle';
  type: string;
  total?: number;
  entry?: FhirBundleEntry[];
}

/** Extract resources (optionally of a given type) from a FHIR Bundle. */
export function bundleResources(bundle: FhirBundle, type?: string): FhirResource[] {
  const entries = bundle?.entry ?? [];
  return entries
    .map(e => e.resource)
    .filter(r => !!r && (!type || r.resourceType === type));
}
