/**
 * Records whose fields mention any of these terms are excluded from the portal
 * entirely — they must never be imported, aggregated, filtered, or exported.
 *
 * The rule lives here rather than being repeated at each call site so the
 * parser and the aggregation layer cannot drift apart.
 */
const EXCLUDED_TERMS = ['bush'] as const;

/** True when any supplied field contains an excluded term (case-insensitive). */
export function containsExcludedTerm(
  values: Array<string | null | undefined>
): boolean {
  return values.some(
    (value) =>
      typeof value === 'string' &&
      value !== '' &&
      EXCLUDED_TERMS.some((term) => value.toLowerCase().includes(term))
  );
}

/** True when a sheet name matches the exclusion rule, e.g. "Bush Rejection". */
export function isExcludedLabel(label: string): boolean {
  return containsExcludedTerm([label]);
}

/** Exclusion check for a parsed rejection / rework record. */
export function isExcludedQualityRecord(record: {
  partNumber?: string;
  partName?: string;
  customer?: string;
  nonConformance?: string;
  reason?: string;
}): boolean {
  return containsExcludedTerm([
    record.partNumber,
    record.partName,
    record.customer,
    record.nonConformance,
    record.reason,
  ]);
}

/** Exclusion check for a parsed FQC record. */
export function isExcludedFqcRecord(record: {
  partNumber?: string;
  partName?: string;
  customer?: string;
  nonConformance?: string;
  containmentAction?: string;
}): boolean {
  return containsExcludedTerm([
    record.partNumber,
    record.partName,
    record.customer,
    record.nonConformance,
    record.containmentAction,
  ]);
}
