export type QualityType = 'REJECTION' | 'REWORK' | 'FQC_FALLOUT';

export type ShiftType = 'Shift A' | 'Shift B' | 'Shift C';

export interface QualityRecord {
  id: string;
  date: string; // YYYY-MM-DD
  month: string; // e.g. "Sep-2026", "Aug-2026", "Jul-2026"
  type: QualityType;
  cell: string; // e.g. "Machining Cell 1", "Engine Assembly Line", "Transmission Line"
  line: string; // e.g. "Line 1", "Line 2", "Line 3"
  machine: string; // e.g. "CNC Lathe - 01", "HMC Milling - 02", "Grinding M/C - 03"
  machineNumber: string; // e.g. "M-101", "M-102", "M-201"
  operation: string; // e.g. "OP-10 Turning", "OP-20 Milling", "OP-30 Boring"
  partNumber: string; // e.g. "VEC-ENG-8841", "VEC-TRN-9022", "VEC-AXL-1104"
  partName: string; // e.g. "Crankshaft 6-Cyl", "Transmission Housing", "Axle Shaft Rear"
  customer: string; // e.g. "Eicher Heavy Duty", "Volvo Group Truck", "Aftermarket Spares", "Export Division"
  operator: string; // e.g. "OP-4821", "OP-3912", "OP-7714"
  nonConformance: string; // e.g. "Porosity in Bore", "Dimension Out of Spec", "Dent on Face", "Tool Chatter Mark"
  shift: ShiftType;
  quantity: number;
  costPerPiece: number;
  totalCost: number;
  reason?: string;
  correctiveAction?: string;
}

export interface FQCRecord {
  id: string;
  date: string;
  month: string;
  cell: string;
  line: string;
  partNumber: string;
  partName: string;
  customer: string;
  stage: string;
  defectCategory: string;
  nonConformance: string;
  inspectorId: string;
  shift: ShiftType;
  quantity: number;
  /** Absent when the source workbook does not record an inspected lot size. */
  lotSizeInspected?: number;
  /** Absent when the inspected lot size is unknown. */
  falloutRatePercent?: number;
  containmentAction: string;
}

export interface FilterState {
  month: string;
  startDate: string;
  endDate: string;
  cellOrLine: string;
  shift: string;
  customer: string;
  partNumber: string;
  machine: string;
  searchQuery: string;
  type?: QualityType | 'ALL';
}

export interface KPISummary {
  totalRejectionQty: number;
  totalRejectionCost: number;
  rejectionRate: number | 'N/A';
  
  totalReworkQty: number;
  totalReworkCost: number;
  reworkRate: number | 'N/A';
  
  totalFqcQty: number;
  fqcRate: number | 'N/A';
  fqcDefectCount: number;
  
  totalProducedQty?: number;
}

export interface DailyTrendItem {
  date: string;
  displayDate: string;
  rejectionQty: number;
  reworkQty: number;
  fqcQty: number;
  rejectionCost: number;
  reworkCost: number;
  totalIssues: number;
}

export interface GroupedBarItem {
  name: string; // Cell or Line name
  rejection: number;
  rework: number;
  fqc: number;
  total: number;
}

export interface ParetoItem {
  defect: string;
  quantity: number;
  cost: number;
  percentage: number;
  cumulativePercentage: number;
}

export interface CustomerComparisonItem {
  customer: string;
  rejection: number;
  rework: number;
  fqc: number;
  rejectionCost: number;
  reworkCost: number;
  totalIssues: number;
}

export interface MachineRankingItem {
  machineNumber: string;
  machineName: string;
  issueQuantity: number;
  rejectionQty: number;
  reworkQty: number;
  totalCost: number;
  contributionPercent: number;
}

export interface PartRankingItem {
  partNumber: string;
  partName: string;
  rejectionQty: number;
  reworkQty: number;
  fqcQty: number;
  totalCost: number;
}

export interface ShiftComparisonItem {
  shift: ShiftType;
  rejection: number;
  rework: number;
  fqc: number;
  total: number;
  cost: number;
}
