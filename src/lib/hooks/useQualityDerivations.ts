'use client';

import { useDeferredValue, useMemo } from 'react';
import {
  QualityRecord,
  FQCRecord,
  FilterState,
  KPISummary,
  DailyTrendItem,
  GroupedBarItem,
  ParetoItem,
  CustomerComparisonItem,
  MachineRankingItem,
  PartRankingItem,
  ShiftComparisonItem,
} from '@/types/quality';
import {
  calculateKPISummary,
  calculateDailyTrend,
  calculateLineComparison,
  calculateParetoDefects,
  calculateCustomerComparison,
  calculateMachineRankings,
  calculatePartRankings,
  calculateShiftComparison,
  extractFilterOptions,
  filterQualityRecords,
  filterFQCRecords,
} from '@/lib/calculations/qualityCalculations';
import { useDebouncedValue } from './useDebouncedValue';

export interface FilterOptions {
  months: string[];
  cellsAndLines: string[];
  shifts: string[];
  customers: string[];
  parts: string[];
  machines: string[];
}

export interface QualityDerivations {
  filteredQualityRecords: QualityRecord[];
  filteredFqcRecords: FQCRecord[];
  filterOptions: FilterOptions;
  kpiSummary: KPISummary;
  dailyTrend: DailyTrendItem[];
  lineComparison: GroupedBarItem[];
  paretoDefects: ParetoItem[];
  customerComparison: CustomerComparisonItem[];
  machineRankings: MachineRankingItem[];
  partRankings: PartRankingItem[];
  shiftComparison: ShiftComparisonItem[];
}

interface DerivationOptions {
  /** Skip quality-record derivation entirely (e.g. rejection page ignores FQC). */
  includeQuality?: boolean;
  /** Skip FQC-record derivation entirely. */
  includeFqc?: boolean;
}

/**
 * Computes every derived dataset a dashboard page needs from the raw records
 * and the active filter state. Previously each page repeated ~12 useMemo
 * blocks doing the same work; centralising it keeps pages consistent and
 * avoids redundant passes over the record arrays.
 */
export function useQualityDerivations(
  qualityRecords: QualityRecord[],
  fqcRecords: FQCRecord[],
  filters: FilterState,
  options: DerivationOptions = {}
): QualityDerivations {
  const { includeQuality = true, includeFqc = true } = options;

  // The search box is the only filter that changes on every keystroke, so its
  // value is debounced before it reaches the (relatively expensive) filtering
  // and aggregation work below. All other filters apply immediately.
  const debouncedSearch = useDebouncedValue(filters.searchQuery, 250);

  const effectiveFilters = useMemo(
    () =>
      debouncedSearch === filters.searchQuery
        ? filters
        : { ...filters, searchQuery: debouncedSearch },
    [filters, debouncedSearch]
  );

  // The charts are far and away the most expensive thing on these pages, and a
  // filter change would otherwise rebuild all of their SVG before the browser
  // can paint the new control state — that is what drives INP.
  //
  // Deferring the filter object splits the update in two. On the first pass
  // every memo below sees its previous inputs, so `filteredQualityRecords` and
  // friends keep their identity and the memoised charts bail out of rendering
  // entirely; only the filter bar repaints. The heavy subtree then catches up
  // at transition priority, which is interruptible and not counted in INP.
  const deferredFilters = useDeferredValue(effectiveFilters);

  // Filter options are derived from the unfiltered dataset so the dropdowns
  // never collapse to a single value as filters narrow the visible rows.
  const filterOptions = useMemo(
    () => extractFilterOptions(qualityRecords, fqcRecords),
    [qualityRecords, fqcRecords]
  );

  const filteredQualityRecords = useMemo(
    () => (includeQuality ? filterQualityRecords(qualityRecords, deferredFilters) : []),
    [qualityRecords, deferredFilters, includeQuality]
  );

  const filteredFqcRecords = useMemo(
    () => (includeFqc ? filterFQCRecords(fqcRecords, deferredFilters) : []),
    [fqcRecords, deferredFilters, includeFqc]
  );

  const kpiSummary = useMemo(
    () => calculateKPISummary(filteredQualityRecords, filteredFqcRecords),
    [filteredQualityRecords, filteredFqcRecords]
  );

  const dailyTrend = useMemo(
    () => calculateDailyTrend(filteredQualityRecords, filteredFqcRecords),
    [filteredQualityRecords, filteredFqcRecords]
  );

  const lineComparison = useMemo(
    () => calculateLineComparison(filteredQualityRecords, filteredFqcRecords),
    [filteredQualityRecords, filteredFqcRecords]
  );

  const paretoDefects = useMemo(
    () => calculateParetoDefects(filteredQualityRecords, filteredFqcRecords),
    [filteredQualityRecords, filteredFqcRecords]
  );

  const customerComparison = useMemo(
    () => calculateCustomerComparison(filteredQualityRecords, filteredFqcRecords),
    [filteredQualityRecords, filteredFqcRecords]
  );

  const machineRankings = useMemo(
    () => calculateMachineRankings(filteredQualityRecords),
    [filteredQualityRecords]
  );

  const partRankings = useMemo(
    () => calculatePartRankings(filteredQualityRecords, filteredFqcRecords),
    [filteredQualityRecords, filteredFqcRecords]
  );

  const shiftComparison = useMemo(
    () => calculateShiftComparison(filteredQualityRecords, filteredFqcRecords),
    [filteredQualityRecords, filteredFqcRecords]
  );

  return {
    filteredQualityRecords,
    filteredFqcRecords,
    filterOptions,
    kpiSummary,
    dailyTrend,
    lineComparison,
    paretoDefects,
    customerComparison,
    machineRankings,
    partRankings,
    shiftComparison,
  };
}

/**
 * Default filter state shared by every dashboard page.
 */
export function createDefaultFilters(overrides: Partial<FilterState> = {}): FilterState {
  return {
    month: 'ALL',
    startDate: '',
    endDate: '',
    cellOrLine: 'ALL',
    shift: 'ALL',
    customer: 'ALL',
    partNumber: 'ALL',
    machine: 'ALL',
    searchQuery: '',
    type: 'ALL',
    ...overrides,
  };
}
