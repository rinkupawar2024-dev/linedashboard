import type * as XLSXType from 'xlsx';
import { QualityRecord, FQCRecord, QualityType } from '@/types/quality';
import { containsExcludedTerm, isExcludedLabel } from '@/lib/utils/qualityFilters';

export type XLSXModule = typeof XLSXType;

/** A raw cell value as read from a worksheet. */
export type ExcelCell = string | number | boolean | Date | null | undefined;

export interface ExcelImportResult {
  fileName: string;
  qualityRecords: QualityRecord[];
  fqcRecords: FQCRecord[];
  summary: {
    totalRecords: number;
    rejectionCount: number;
    rejectionQty: number;
    rejectionCost: number;
    reworkCount: number;
    reworkQty: number;
    reworkCost: number;
    fqcCount: number;
    fqcQty: number;
    /** Data rows dropped because they carried no usable date or quantity. */
    skippedRows: number;
    months: string[];
    sheetsParsed: string[];
  };
}

/** Maximum accepted upload size (10 MB). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Maximum worksheet rows processed per sheet, to bound parse time and memory. */
export const MAX_ROWS_PER_SHEET = 20000;

/** Maximum worksheets processed per workbook. */
export const MAX_SHEETS_PER_WORKBOOK = 50;

export class ExcelImportError extends Error {}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Day-first numeric parts ("01", "09", "26") to YYYY-MM-DD, or null if invalid. */
function buildIsoDate(parts: string[]): string | null {
  const day = Number(parts[0]);
  const month = Number(parts[1]);
  const rawYear = parts[2].trim();
  const year = Number(rawYear);
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return null;
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  const fullYear = rawYear.length === 2 ? 2000 + year : year;
  return `${fullYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Normalizes the date formats found in the plant workbooks — "01.09.26",
 * "01/09/2026", ISO, and Excel serial numbers — to YYYY-MM-DD.
 *
 * Returns null when the value is not a recognisable date so the caller can
 * report the row, rather than silently stamping it with today's date.
 */
export function parseExcelDate(val: ExcelCell, XLSX: XLSXModule): string | null {
  if (val === null || val === undefined) return null;

  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '') return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const dotParts = trimmed.split('.');
    if (dotParts.length === 3) return buildIsoDate(dotParts);
    const slashParts = trimmed.split('/');
    if (slashParts.length === 3) return buildIsoDate(slashParts);
    return null;
  }

  if (typeof val === 'number') {
    try {
      const date = XLSX.SSF.parse_date_code(val);
      if (date) {
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
      }
    } catch {
      // Not a valid serial date.
    }
    return null;
  }

  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split('T')[0];
  }

  return null;
}

/** "2026-09-01" to "Sep-2026"; empty string when the date is not ISO. */
export function deriveMonthString(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '';
  const monthName = MONTH_NAMES[Number(parts[1]) - 1];
  return monthName ? `${monthName}-${parts[0]}` : '';
}

/**
 * Resolves a column index for the first header matching one of `aliases`.
 *
 * Matching is tiered — exact, then prefix, then substring — so a specific field
 * always beats a looser one. Notably, "total cost" must not be claimed by the
 * "cost per piece" column merely because both contain "cost". `used` stops two
 * fields from resolving to the same column.
 */
function matchColumn(headers: string[], aliases: string[], used: Set<number>): number {
  const free = (i: number) => headers[i] !== '' && !used.has(i);
  for (const alias of aliases) {
    const i = headers.findIndex((h, idx) => free(idx) && h === alias);
    if (i !== -1) return i;
  }
  for (const alias of aliases) {
    const i = headers.findIndex((h, idx) => free(idx) && h.startsWith(alias));
    if (i !== -1) return i;
  }
  for (const alias of aliases) {
    const i = headers.findIndex((h, idx) => free(idx) && h.includes(alias));
    if (i !== -1) return i;
  }
  return -1;
}

/**
 * Sheet names carry the line identity ("Truning Daily Rej-Sep-26"), so strip
 * the month suffix and the daily/rejection/rework noise to get a stable label
 * shared by the rejection and rework sheets of the same line.
 */
function deriveLineFromSheetName(sheetName: string): string {
  const cleaned = sheetName
    .replace(/[-_\s]*[A-Za-z]{3,9}[-_\s]*\d{2,4}\s*$/, '')
    .replace(/\b(daily|rej|rejection|rew|rework|sheet\s*\d*)\b/gi, ' ')
    .replace(/[._]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || 'Unassigned Line';
}

/** Operation codes that carry no process meaning and must not become labels. */
const OPERATION_PLACEHOLDER = /^(0|n\/?a|nil|-+)$/i;

/**
 * The "Oprn." column is free text: it mixes case variants ("turning" and
 * "Turning") and placeholder codes ("0"). Normalise the label so the same
 * operation is not split across several filter values, and return '' for codes
 * that should fall back to the line label.
 */
function normalizeOperation(value: string): string {
  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (trimmed === '' || OPERATION_PLACEHOLDER.test(trimmed)) return '';
  if (containsExcludedTerm([trimmed])) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/** Cell label derived from the operation column, e.g. "VMC" to "VMC Cell". */
function deriveCell(operation: string, line: string): string {
  return operation ? `${operation} Cell` : line;
}

/** Reads a trimmed string cell, or '' when the column is absent or empty. */
function readText(row: ExcelCell[], idx: number): string {
  return idx >= 0 && row[idx] != null ? String(row[idx]).trim() : '';
}

/** Reads a positive numeric cell, or 0 when absent, empty, or invalid. */
function readQty(row: ExcelCell[], idx: number): number {
  const value = idx >= 0 ? Number(row[idx]) : 0;
  return Number.isFinite(value) && value > 0 ? value : 0;
}

interface SheetParseResult {
  records: QualityRecord[];
  fqcRecords: FQCRecord[];
  skippedRows: number;
}

function parseSingleSheet(
  sheet: XLSXType.WorkSheet,
  sheetName: string,
  defaultType: QualityType,
  XLSX: XLSXModule
): SheetParseResult {
  const rows = XLSX.utils.sheet_to_json<ExcelCell[]>(sheet, { header: 1 });
  if (!rows || rows.length < 4) return { records: [], fqcRecords: [], skippedRows: 0 };

  // Bound the work done per sheet so a crafted workbook cannot exhaust the tab.
  if (rows.length > MAX_ROWS_PER_SHEET) {
    throw new ExcelImportError(
      `Sheet "${sheetName}" has ${rows.length} rows, which exceeds the ${MAX_ROWS_PER_SHEET}-row limit.`
    );
  }

  // Find the header row within the first 12 rows.
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(12, rows.length); i++) {
    const row = rows[i] || [];
    const str = row.filter(Boolean).map(x => String(x).toLowerCase()).join(' ');
    if (
      (str.includes('part no') || str.includes('part') || str.includes('sap code')) &&
      (str.includes('m/c') || str.includes('machine') || str.includes('non conformance') || str.includes('sr no') || str.includes('cost'))
    ) {
      headerRowIdx = i;
      break;
    }
  }

  if (headerRowIdx === -1) return { records: [], fqcRecords: [], skippedRows: 0 };

  const rawHeaderRow = rows[headerRowIdx] || [];
  const headers = rawHeaderRow.map(h => (h != null ? String(h).trim().toLowerCase() : ''));

  const used = new Set<number>();
  const col = (aliases: string[]) => {
    const idx = matchColumn(headers, aliases, used);
    if (idx !== -1) used.add(idx);
    return idx;
  };

  const idxMcNo = col(['m/c no', 'machine no', 'mc no', 'machine number']);
  const idxMcName = col(['m/c name', 'machine name', 'machine']);
  const idxOprn = col(['oprn', 'operation', 'opn']);
  const idxPartNo = col(['part no.', 'part no', 'part number', 'part']);
  const idxCustomer = col(['customer', 'cust']);
  const idxOperator = col(['operator', 'optr']);
  const idxDefect = col(['non conformance', 'defect', 'problem', 'nature of problem', 'rejection reason']);
  const idxDate = col(['date']);
  const idx1st = col(['1st', 'shift a']);
  const idx2nd = col(['2nd', 'shift b']);
  const idx3rd = col(['3rd', 'shift c']);
  const idxFqc = col(['fqc']);
  const idxTotalQty = col(['total rej. qty', 'total qty', 'total rej', 'rejection qty', 'rework qty']);
  const idxCostPiece = col(['cost per piece', 'cost/pc', 'rate', 'piece cost']);
  const idxTotalCost = col(['total cost', 'cost of poor quality', 'cost']);
  const idxReason = col(['reason', 'root cause', 'cause']);
  const idxAction = col(['rejection identified at', 'action', 'corrective action']);

  const line = deriveLineFromSheetName(sheetName);
  const sheetKey = sheetName.replace(/\s+/g, '_');
  const isFqcSheet = defaultType === 'FQC_FALLOUT';

  const records: QualityRecord[] = [];
  const fqcRecords: FQCRecord[] = [];
  let skippedRows = 0;

  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    // Drop blank spacer rows and the workbook's own total / summary lines.
    const firstCell = String(row[0] ?? '').toLowerCase();
    const secondCell = String(row[1] ?? '').toLowerCase();
    if (firstCell.includes('total') || secondCell.includes('total') || firstCell.includes('grand')) continue;

    const mcNo = readText(row, idxMcNo);
    const partNo = readText(row, idxPartNo);
    const defect = readText(row, idxDefect);
    if (!partNo && !defect && !mcNo) continue;

    const customer = readText(row, idxCustomer);
    const reason = readText(row, idxReason);
    if (containsExcludedTerm([partNo, customer, defect, reason])) continue;

    const dateStr = parseExcelDate(idxDate >= 0 ? row[idxDate] : null, XLSX);
    if (dateStr === null) {
      skippedRows++;
      continue;
    }

    const qty1st = readQty(row, idx1st);
    const qty2nd = readQty(row, idx2nd);
    const qty3rd = readQty(row, idx3rd);
    const qtyFqc = readQty(row, idxFqc);
    const shiftSum = qty1st + qty2nd + qty3rd;

    // The sheet's own "Total Rej. qty" column is authoritative when present.
    // Falling back to the shift columns must not fold FQC volume into the
    // rejection/rework quantity, or the same pieces get counted twice.
    const reportedTotal = idxTotalQty >= 0 ? Number(row[idxTotalQty]) : 0;
    const totalQty = reportedTotal > 0 ? reportedTotal : isFqcSheet ? shiftSum + qtyFqc : shiftSum;

    const recordQty = isFqcSheet ? 0 : totalQty;
    const fqcQtyForRow = isFqcSheet ? totalQty : qtyFqc;
    if (recordQty <= 0 && fqcQtyForRow <= 0) {
      skippedRows++;
      continue;
    }

    const operation = normalizeOperation(readText(row, idxOprn));
    const cell = deriveCell(operation, line);
    const monthStr = deriveMonthString(dateStr);
    const partName = partNo ? `Part #${partNo}` : '';

    // The workbook records volume per shift rather than a shift label, so the
    // shift is taken to be the one carrying the most defects.
    let shift: 'Shift A' | 'Shift B' | 'Shift C' = 'Shift A';
    if (qty2nd > 0 && qty2nd >= qty1st && qty2nd >= qty3rd) shift = 'Shift B';
    else if (qty3rd > 0 && qty3rd >= qty1st && qty3rd >= qty2nd) shift = 'Shift C';

    if (recordQty > 0) {
      const costPerPiece = readQty(row, idxCostPiece);
      const reportedCost = idxTotalCost >= 0 ? Number(row[idxTotalCost]) : 0;
      const totalCost = reportedCost > 0 ? reportedCost : costPerPiece * recordQty;

      records.push({
        id: `EXCEL-${defaultType}-${sheetKey}-${r}`,
        date: dateStr,
        month: monthStr,
        type: defaultType,
        cell,
        line,
        machine: readText(row, idxMcName) || mcNo || 'Unassigned',
        machineNumber: mcNo,
        operation,
        partNumber: partNo,
        partName,
        customer,
        operator: readText(row, idxOperator),
        nonConformance: defect,
        shift,
        quantity: recordQty,
        costPerPiece,
        totalCost,
        reason,
        correctiveAction: readText(row, idxAction),
      });
    }

    if (fqcQtyForRow > 0) {
      // The workbooks record no lot size, so the fallout rate is left undefined
      // rather than derived from an invented sample size.
      fqcRecords.push({
        id: `EXCEL-FQC-${sheetKey}-${r}`,
        date: dateStr,
        month: monthStr,
        cell,
        line,
        partNumber: partNo,
        partName,
        customer,
        stage: 'FQC Audit',
        defectCategory: '',
        nonConformance: defect,
        inspectorId: '',
        shift,
        quantity: fqcQtyForRow,
        containmentAction: '',
      });
    }
  }

  return { records, fqcRecords, skippedRows };
}

export function parseExcelWorkbook(
  workbook: XLSXType.WorkBook,
  fileName: string,
  XLSX: XLSXModule
): ExcelImportResult {
  const allQualityRecords: QualityRecord[] = [];
  const allFqcRecords: FQCRecord[] = [];
  const parsedSheetNames: string[] = [];
  let skippedRows = 0;

  if (workbook.SheetNames.length > MAX_SHEETS_PER_WORKBOOK) {
    throw new ExcelImportError(
      `Workbook has ${workbook.SheetNames.length} sheets, which exceeds the ${MAX_SHEETS_PER_WORKBOOK}-sheet limit.`
    );
  }

  workbook.SheetNames.forEach(sheetName => {
    // Sheets that are entirely out of scope are skipped wholesale.
    if (isExcludedLabel(sheetName)) return;

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return;

    // Detect sheet type
    const lowerName = sheetName.toLowerCase();
    let sheetType: QualityType = 'REJECTION';
    if (lowerName.includes('rew') || lowerName.includes('rework')) {
      sheetType = 'REWORK';
    } else if (lowerName.includes('fqc')) {
      sheetType = 'FQC_FALLOUT';
    } else if (lowerName.includes('rej') || lowerName.includes('rejection')) {
      sheetType = 'REJECTION';
    }

    const parsed = parseSingleSheet(sheet, sheetName, sheetType, XLSX);
    skippedRows += parsed.skippedRows;

    if (parsed.records.length > 0 || parsed.fqcRecords.length > 0) {
      allQualityRecords.push(...parsed.records);
      allFqcRecords.push(...parsed.fqcRecords);
      parsedSheetNames.push(`${sheetName} (${parsed.records.length + parsed.fqcRecords.length} records)`);
    }
  });

  const rejectionRecords = allQualityRecords.filter(r => r.type === 'REJECTION');
  const reworkRecords = allQualityRecords.filter(r => r.type === 'REWORK');

  const rejectionQty = rejectionRecords.reduce((s, r) => s + r.quantity, 0);
  const rejectionCost = rejectionRecords.reduce((s, r) => s + r.totalCost, 0);

  const reworkQty = reworkRecords.reduce((s, r) => s + r.quantity, 0);
  const reworkCost = reworkRecords.reduce((s, r) => s + r.totalCost, 0);

  const fqcQty = allFqcRecords.reduce((s, r) => s + r.quantity, 0);

  const monthsSet = new Set<string>();
  allQualityRecords.forEach(r => {
    if (r.month) monthsSet.add(r.month);
  });
  allFqcRecords.forEach(r => {
    if (r.month) monthsSet.add(r.month);
  });

  return {
    fileName,
    qualityRecords: allQualityRecords,
    fqcRecords: allFqcRecords,
    summary: {
      totalRecords: allQualityRecords.length + allFqcRecords.length,
      rejectionCount: rejectionRecords.length,
      rejectionQty,
      rejectionCost,
      reworkCount: reworkRecords.length,
      reworkQty,
      reworkCost,
      fqcCount: allFqcRecords.length,
      fqcQty,
      skippedRows,
      months: Array.from(monthsSet),
      sheetsParsed: parsedSheetNames,
    },
  };
}

