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
  ShiftType,
} from '@/types/quality';
import { isExcludedQualityRecord, isExcludedFqcRecord } from '@/lib/utils/qualityFilters';

/**
 * Pure calculation functions for manufacturing quality metrics.
 * Separates all mathematical, Pareto, and aggregation logic from UI components.
 */

// --- KPI CALCULATIONS ---

export function calculateKPISummary(
  records: QualityRecord[],
  fqcRecords: FQCRecord[],
  totalProducedQty?: number
): KPISummary {
  // Single pass over the rejection / rework records.
  let totalRejectionQty = 0;
  let totalRejectionCost = 0;
  let totalReworkQty = 0;
  let totalReworkCost = 0;

  for (const r of records) {
    if (r.type === 'REJECTION') {
      totalRejectionQty += r.quantity;
      totalRejectionCost += r.totalCost;
    } else if (r.type === 'REWORK') {
      totalReworkQty += r.quantity;
      totalReworkCost += r.totalCost;
    }
  }

  // FQC fallout is carried exclusively by the dedicated FQC dataset. The parser
  // never emits FQC_FALLOUT entries as quality records, so counting it here
  // cannot double up with the pass above.
  let totalFqcQty = 0;
  let totalInspected = 0;
  for (const r of fqcRecords) {
    totalFqcQty += r.quantity;
    totalInspected += r.lotSizeInspected ?? 0;
  }

  const fqcDefectCount = fqcRecords.length;

  // Rate calculations: If baseline production is provided, calculate rate; otherwise return 'N/A'
  // to avoid inventing business logic
  const rejectionRate = totalProducedQty && totalProducedQty > 0
    ? (totalRejectionQty / totalProducedQty) * 100
    : 'N/A';

  const reworkRate = totalProducedQty && totalProducedQty > 0
    ? (totalReworkQty / totalProducedQty) * 100
    : 'N/A';

  // The source workbooks do not record a lot size, so the fallout rate is only
  // reported when an inspected quantity is actually available.
  const fqcRate: number | 'N/A' =
    totalInspected > 0 ? (totalFqcQty / totalInspected) * 100 : 'N/A';

  return {
    totalRejectionQty,
    totalRejectionCost,
    rejectionRate,
    totalReworkQty,
    totalReworkCost,
    reworkRate,
    totalFqcQty,
    fqcRate,
    fqcDefectCount,
    totalProducedQty,
  };
}

// --- DAILY QUALITY TREND ---

export function calculateDailyTrend(
  records: QualityRecord[],
  fqcRecords: FQCRecord[] = []
): DailyTrendItem[] {
  const dateMap: { [date: string]: DailyTrendItem } = {};

  // Process General Quality Records (Rejection & Rework)
  records.forEach(r => {
    if (!dateMap[r.date]) {
      const parts = r.date.split('-');
      const displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : r.date;
      dateMap[r.date] = {
        date: r.date,
        displayDate,
        rejectionQty: 0,
        reworkQty: 0,
        fqcQty: 0,
        rejectionCost: 0,
        reworkCost: 0,
        totalIssues: 0,
      };
    }

    if (r.type === 'REJECTION') {
      dateMap[r.date].rejectionQty += r.quantity;
      dateMap[r.date].rejectionCost += r.totalCost;
    } else if (r.type === 'REWORK') {
      dateMap[r.date].reworkQty += r.quantity;
      dateMap[r.date].reworkCost += r.totalCost;
    } else if (r.type === 'FQC_FALLOUT') {
      dateMap[r.date].fqcQty += r.quantity;
    }

    dateMap[r.date].totalIssues += r.quantity;
  });

  // Process FQC records
  fqcRecords.forEach(r => {
    if (!dateMap[r.date]) {
      const parts = r.date.split('-');
      const displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : r.date;
      dateMap[r.date] = {
        date: r.date,
        displayDate,
        rejectionQty: 0,
        reworkQty: 0,
        fqcQty: 0,
        rejectionCost: 0,
        reworkCost: 0,
        totalIssues: 0,
      };
    }

    dateMap[r.date].fqcQty += r.quantity;
    dateMap[r.date].totalIssues += r.quantity;
  });

  // Return sorted chronologically
  return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
}

// --- GROUPED BAR: CELL / LINE COMPARISON ---

export function calculateLineComparison(
  records: QualityRecord[],
  fqcRecords: FQCRecord[] = []
): GroupedBarItem[] {
  const lineMap: { [line: string]: GroupedBarItem } = {};

  records.forEach(r => {
    const key = r.line || r.cell || 'Unassigned Line';
    if (!lineMap[key]) {
      lineMap[key] = { name: key, rejection: 0, rework: 0, fqc: 0, total: 0 };
    }

    if (r.type === 'REJECTION') lineMap[key].rejection += r.quantity;
    else if (r.type === 'REWORK') lineMap[key].rework += r.quantity;
    else if (r.type === 'FQC_FALLOUT') lineMap[key].fqc += r.quantity;

    lineMap[key].total += r.quantity;
  });

  fqcRecords.forEach(r => {
    const key = r.line || r.cell || 'Unassigned Line';
    if (!lineMap[key]) {
      lineMap[key] = { name: key, rejection: 0, rework: 0, fqc: 0, total: 0 };
    }
    lineMap[key].fqc += r.quantity;
    lineMap[key].total += r.quantity;
  });

  return Object.values(lineMap).sort((a, b) => b.total - a.total);
}

// --- PARETO CHART: TOP NON-CONFORMANCE ---

export function calculateParetoDefects(
  records: QualityRecord[],
  fqcRecords: FQCRecord[] = []
): ParetoItem[] {
  const defectMap: { [defect: string]: { quantity: number; cost: number } } = {};

  records.forEach(r => {
    const defect = r.nonConformance || 'Unspecified';
    if (!defectMap[defect]) {
      defectMap[defect] = { quantity: 0, cost: 0 };
    }
    defectMap[defect].quantity += r.quantity;
    defectMap[defect].cost += r.totalCost;
  });

  fqcRecords.forEach(r => {
    const defect = r.nonConformance || 'Unspecified';
    if (!defectMap[defect]) {
      defectMap[defect] = { quantity: 0, cost: 0 };
    }
    defectMap[defect].quantity += r.quantity;
  });

  const totalQuantity = Object.values(defectMap).reduce((sum, d) => sum + d.quantity, 0);

  if (totalQuantity === 0) return [];

  // Sort descending by quantity
  const sorted = Object.entries(defectMap)
    .map(([defect, data]) => ({
      defect,
      quantity: data.quantity,
      cost: data.cost,
      percentage: Number(((data.quantity / totalQuantity) * 100).toFixed(1)),
      cumulativePercentage: 0,
    }))
    .sort((a, b) => b.quantity - a.quantity);

  // Calculate cumulative percentage
  let runningSum = 0;
  return sorted.map(item => {
    runningSum += item.quantity;
    return {
      ...item,
      cumulativePercentage: Number(((runningSum / totalQuantity) * 100).toFixed(1)),
    };
  });
}

// --- CUSTOMER-WISE QUALITY ---

export function calculateCustomerComparison(
  records: QualityRecord[],
  fqcRecords: FQCRecord[] = []
): CustomerComparisonItem[] {
  const customerMap: { [cust: string]: CustomerComparisonItem } = {};

  records.forEach(r => {
    const cust = r.customer || 'Unspecified';
    if (!customerMap[cust]) {
      customerMap[cust] = {
        customer: cust,
        rejection: 0,
        rework: 0,
        fqc: 0,
        rejectionCost: 0,
        reworkCost: 0,
        totalIssues: 0,
      };
    }

    if (r.type === 'REJECTION') {
      customerMap[cust].rejection += r.quantity;
      customerMap[cust].rejectionCost += r.totalCost;
    } else if (r.type === 'REWORK') {
      customerMap[cust].rework += r.quantity;
      customerMap[cust].reworkCost += r.totalCost;
    } else if (r.type === 'FQC_FALLOUT') {
      customerMap[cust].fqc += r.quantity;
    }

    customerMap[cust].totalIssues += r.quantity;
  });

  fqcRecords.forEach(r => {
    const cust = r.customer || 'Unspecified';
    if (!customerMap[cust]) {
      customerMap[cust] = {
        customer: cust,
        rejection: 0,
        rework: 0,
        fqc: 0,
        rejectionCost: 0,
        reworkCost: 0,
        totalIssues: 0,
      };
    }
    customerMap[cust].fqc += r.quantity;
    customerMap[cust].totalIssues += r.quantity;
  });

  return Object.values(customerMap).sort((a, b) => b.totalIssues - a.totalIssues);
}

// --- TOP PROBLEMATIC MACHINES ---

export function calculateMachineRankings(records: QualityRecord[]): MachineRankingItem[] {
  const machineMap: {
    [num: string]: {
      name: string;
      rejectionQty: number;
      reworkQty: number;
      totalCost: number;
      issueQuantity: number;
    };
  } = {};

  records.forEach(r => {
    const num = r.machineNumber || 'N/A';
    const name = r.machine || 'Unassigned Machine';
    if (!machineMap[num]) {
      machineMap[num] = {
        name,
        rejectionQty: 0,
        reworkQty: 0,
        totalCost: 0,
        issueQuantity: 0,
      };
    }

    if (r.type === 'REJECTION') {
      machineMap[num].rejectionQty += r.quantity;
    } else if (r.type === 'REWORK') {
      machineMap[num].reworkQty += r.quantity;
    }

    machineMap[num].issueQuantity += r.quantity;
    machineMap[num].totalCost += r.totalCost;
  });

  const totalIssuesAll = Object.values(machineMap).reduce((sum, m) => sum + m.issueQuantity, 0);

  return Object.entries(machineMap)
    .map(([machineNumber, data]) => ({
      machineNumber,
      machineName: data.name,
      issueQuantity: data.issueQuantity,
      rejectionQty: data.rejectionQty,
      reworkQty: data.reworkQty,
      totalCost: data.totalCost,
      contributionPercent: totalIssuesAll > 0
        ? Number(((data.issueQuantity / totalIssuesAll) * 100).toFixed(1))
        : 0,
    }))
    .sort((a, b) => b.issueQuantity - a.issueQuantity);
}

// --- PART-WISE QUALITY ISSUES ---

export function calculatePartRankings(
  records: QualityRecord[],
  fqcRecords: FQCRecord[] = []
): PartRankingItem[] {
  const partMap: {
    [partNo: string]: {
      name: string;
      rejectionQty: number;
      reworkQty: number;
      fqcQty: number;
      totalCost: number;
    };
  } = {};

  records.forEach(r => {
    const partNo = r.partNumber || 'Unknown Part';
    if (!partMap[partNo]) {
      partMap[partNo] = {
        name: r.partName || partNo,
        rejectionQty: 0,
        reworkQty: 0,
        fqcQty: 0,
        totalCost: 0,
      };
    }

    if (r.type === 'REJECTION') partMap[partNo].rejectionQty += r.quantity;
    else if (r.type === 'REWORK') partMap[partNo].reworkQty += r.quantity;
    else if (r.type === 'FQC_FALLOUT') partMap[partNo].fqcQty += r.quantity;

    partMap[partNo].totalCost += r.totalCost;
  });

  fqcRecords.forEach(r => {
    const partNo = r.partNumber || 'Unknown Part';
    if (!partMap[partNo]) {
      partMap[partNo] = {
        name: r.partName || partNo,
        rejectionQty: 0,
        reworkQty: 0,
        fqcQty: 0,
        totalCost: 0,
      };
    }
    partMap[partNo].fqcQty += r.quantity;
  });

  return Object.entries(partMap)
    .map(([partNumber, data]) => ({
      partNumber,
      partName: data.name,
      rejectionQty: data.rejectionQty,
      reworkQty: data.reworkQty,
      fqcQty: data.fqcQty,
      totalCost: data.totalCost,
    }))
    .sort((a, b) => (b.rejectionQty + b.reworkQty + b.fqcQty) - (a.rejectionQty + a.reworkQty + a.fqcQty));
}

// --- SHIFT-WISE QUALITY ---

export function calculateShiftComparison(
  records: QualityRecord[],
  fqcRecords: FQCRecord[] = []
): ShiftComparisonItem[] {
  const shifts: ShiftType[] = ['Shift A', 'Shift B', 'Shift C'];
  const shiftMap: { [s in ShiftType]: ShiftComparisonItem } = {
    'Shift A': { shift: 'Shift A', rejection: 0, rework: 0, fqc: 0, total: 0, cost: 0 },
    'Shift B': { shift: 'Shift B', rejection: 0, rework: 0, fqc: 0, total: 0, cost: 0 },
    'Shift C': { shift: 'Shift C', rejection: 0, rework: 0, fqc: 0, total: 0, cost: 0 },
  };

  records.forEach(r => {
    if (shiftMap[r.shift]) {
      if (r.type === 'REJECTION') shiftMap[r.shift].rejection += r.quantity;
      else if (r.type === 'REWORK') shiftMap[r.shift].rework += r.quantity;
      else if (r.type === 'FQC_FALLOUT') shiftMap[r.shift].fqc += r.quantity;

      shiftMap[r.shift].total += r.quantity;
      shiftMap[r.shift].cost += r.totalCost;
    }
  });

  fqcRecords.forEach(r => {
    if (shiftMap[r.shift]) {
      shiftMap[r.shift].fqc += r.quantity;
      shiftMap[r.shift].total += r.quantity;
    }
  });

  return shifts.map(s => shiftMap[s]);
}

// --- DYNAMIC FILTER EXTRACTION ---

export function extractFilterOptions(
  records: QualityRecord[],
  fqcRecords: FQCRecord[] = []
) {
  const months = new Set<string>();
  const cellsAndLines = new Set<string>();
  const shifts = new Set<string>();
  const customers = new Set<string>();
  const parts = new Set<string>();
  const machines = new Set<string>();

  records.forEach(r => {
    if (isExcludedQualityRecord(r)) return;

    if (r.month) months.add(r.month);
    if (r.line) cellsAndLines.add(r.line);
    if (r.cell) cellsAndLines.add(r.cell);
    if (r.shift) shifts.add(r.shift);
    if (r.customer) customers.add(r.customer);
    if (r.partNumber) parts.add(r.partNumber);
    if (r.machine) machines.add(r.machine);
  });

  fqcRecords.forEach(r => {
    if (isExcludedFqcRecord(r)) return;

    if (r.month) months.add(r.month);
    if (r.line) cellsAndLines.add(r.line);
    if (r.cell) cellsAndLines.add(r.cell);
    if (r.shift) shifts.add(r.shift);
    if (r.customer) customers.add(r.customer);
    if (r.partNumber) parts.add(r.partNumber);
  });

  return {
    months: Array.from(months),
    cellsAndLines: Array.from(cellsAndLines).sort(),
    shifts: Array.from(shifts).sort(),
    customers: Array.from(customers).sort(),
    parts: Array.from(parts).sort(),
    machines: Array.from(machines).sort(),
  };
}

// --- FILTERING LOGIC ---

export function filterQualityRecords(
  records: QualityRecord[],
  filter: FilterState
): QualityRecord[] {
  // Normalised once rather than per record.
  const q = filter.searchQuery ? filter.searchQuery.trim().toLowerCase() : '';

  return records.filter(r => {
    if (isExcludedQualityRecord(r)) return false;

    // Month filter
    if (filter.month && filter.month !== 'ALL' && r.month !== filter.month) return false;

    // Date range filter
    if (filter.startDate && r.date < filter.startDate) return false;
    if (filter.endDate && r.date > filter.endDate) return false;

    // Cell / Line filter
    if (filter.cellOrLine && filter.cellOrLine !== 'ALL') {
      if (r.line !== filter.cellOrLine && r.cell !== filter.cellOrLine) return false;
    }

    // Shift filter
    if (filter.shift && filter.shift !== 'ALL' && r.shift !== filter.shift) return false;

    // Customer filter
    if (filter.customer && filter.customer !== 'ALL' && r.customer !== filter.customer) return false;

    // Part number filter
    if (filter.partNumber && filter.partNumber !== 'ALL' && r.partNumber !== filter.partNumber) return false;

    // Machine filter
    if (filter.machine && filter.machine !== 'ALL' && r.machine !== filter.machine && r.machineNumber !== filter.machine) return false;

    // Type filter
    if (filter.type && filter.type !== 'ALL' && r.type !== filter.type) return false;

    // Search query filter
    if (q !== '') {
      const match =
        r.partNumber.toLowerCase().includes(q) ||
        r.partName.toLowerCase().includes(q) ||
        r.machine.toLowerCase().includes(q) ||
        r.machineNumber.toLowerCase().includes(q) ||
        r.nonConformance.toLowerCase().includes(q) ||
        r.customer.toLowerCase().includes(q) ||
        r.operator.toLowerCase().includes(q) ||
        r.operation.toLowerCase().includes(q) ||
        (r.reason && r.reason.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });
}

export function filterFQCRecords(
  records: FQCRecord[],
  filter: FilterState
): FQCRecord[] {
  // Normalised once rather than per record.
  const q = filter.searchQuery ? filter.searchQuery.trim().toLowerCase() : '';

  return records.filter(r => {
    if (isExcludedFqcRecord(r)) return false;

    if (filter.month && filter.month !== 'ALL' && r.month !== filter.month) return false;
    if (filter.startDate && r.date < filter.startDate) return false;
    if (filter.endDate && r.date > filter.endDate) return false;

    if (filter.cellOrLine && filter.cellOrLine !== 'ALL') {
      if (r.line !== filter.cellOrLine && r.cell !== filter.cellOrLine) return false;
    }

    if (filter.shift && filter.shift !== 'ALL' && r.shift !== filter.shift) return false;
    if (filter.customer && filter.customer !== 'ALL' && r.customer !== filter.customer) return false;
    if (filter.partNumber && filter.partNumber !== 'ALL' && r.partNumber !== filter.partNumber) return false;

    if (q !== '') {
      const match =
        r.partNumber.toLowerCase().includes(q) ||
        r.partName.toLowerCase().includes(q) ||
        r.nonConformance.toLowerCase().includes(q) ||
        r.customer.toLowerCase().includes(q) ||
        r.defectCategory.toLowerCase().includes(q) ||
        r.stage.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });
}
