'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { QualityTable } from '@/components/tables/QualityTable';
import { NoDataState } from '@/components/ui/NoDataState';
import { useQualityData } from '@/context/QualityDataContext';
import {
  calculateKPISummary,
  filterQualityRecords,
  filterFQCRecords,
  extractFilterOptions,
} from '@/lib/calculations/qualityCalculations';
import { FilterState, QualityType } from '@/types/quality';
import { formatCurrency, formatNumber } from '@/lib/utils/formatters';
import { Download, Printer, Filter, UploadCloud, Loader2 } from 'lucide-react';

/**
 * Neutralize spreadsheet formula injection: a cell whose value begins with
 * =, +, -, or @ is interpreted as a formula by Excel/Sheets on open.
 * Prefixing with a single quote forces it to be treated as literal text.
 */
function sanitizeSpreadsheetCell(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function sanitizeExportRow<T extends Record<string, unknown>>(row: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] = sanitizeSpreadsheetCell(value);
  }
  return out as T;
}

export default function ReportsPage() {
  const { qualityRecords, fqcRecords, activeMonth, hasData, importedFileName, setIsImportModalOpen } = useQualityData();

  const [selectedMonthOverride, setSelectedMonthOverride] = useState<string | null>(null);
  const selectedMonth = selectedMonthOverride ?? activeMonth;
  const setSelectedMonth = setSelectedMonthOverride;
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dataType, setDataType] = useState<'ALL' | QualityType>('ALL');
  const [selectedLine, setSelectedLine] = useState('ALL');
  const [isExporting, setIsExporting] = useState(false);

  const filterOptions = useMemo(() => {
    return extractFilterOptions(qualityRecords, fqcRecords);
  }, [qualityRecords, fqcRecords]);

  const filters: FilterState = useMemo(() => {
    return {
      month: selectedMonth,
      startDate,
      endDate,
      cellOrLine: selectedLine,
      shift: 'ALL',
      customer: 'ALL',
      partNumber: 'ALL',
      machine: 'ALL',
      searchQuery: '',
      type: dataType,
    };
  }, [selectedMonth, startDate, endDate, selectedLine, dataType]);

  const filteredQualityRecords = useMemo(() => {
    if (dataType === 'FQC_FALLOUT') return [];
    return filterQualityRecords(qualityRecords, filters);
  }, [qualityRecords, filters, dataType]);

  const filteredFqcRecords = useMemo(() => {
    if (dataType === 'REJECTION' || dataType === 'REWORK') return [];
    return filterFQCRecords(fqcRecords, filters);
  }, [fqcRecords, filters, dataType]);

  const summary = useMemo(() => {
    return calculateKPISummary(filteredQualityRecords, filteredFqcRecords);
  }, [filteredQualityRecords, filteredFqcRecords]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = async () => {
    if (!hasData) return;

    const exportData = [
      ...filteredQualityRecords.map(r => ({
        'Date': r.date,
        'Type': r.type,
        'Cell / Line': r.line || r.cell,
        'Machine': r.machineNumber ? `${r.machineNumber} (${r.machine})` : r.machine,
        'Part Number': r.partNumber,
        'Part Name': r.partName,
        'Customer': r.customer,
        'Non Conformance': r.nonConformance,
        'Shift': r.shift,
        'Quantity': r.quantity,
        'Cost Per Piece': r.costPerPiece,
        'Total Cost': r.totalCost,
        'Reason': r.reason || '',
        'Action': r.correctiveAction || '',
      })),
      ...filteredFqcRecords.map(f => ({
        'Date': f.date,
        'Type': 'FQC_FALLOUT',
        'Cell / Line': f.line || f.cell,
        'Machine': f.stage,
        'Part Number': f.partNumber,
        'Part Name': f.partName,
        'Customer': f.customer,
        'Non Conformance': f.nonConformance,
        'Shift': f.shift,
        'Quantity': f.quantity,
        'Cost Per Piece': 0,
        'Total Cost': 0,
        'Reason': f.containmentAction,
        'Action': 'FQC Containment',
      }))
    ];

    setIsExporting(true);
    try {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(exportData.map(sanitizeExportRow));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Quality_Report');
      XLSX.writeFile(wb, `Quality_Report_${selectedMonth}_${Date.now()}.csv`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quality Reports & Executive Summary"
        subtitle="Generate, preview, and audit customizable quality reports for plant operations."
        badgeText={hasData ? `Excel: ${importedFileName}` : 'No Data Loaded'}
        badgeColor={hasData ? 'emerald' : 'orange'}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#FF7900] hover:bg-[#FF8C1A] text-white shadow-md shadow-[#FF7900]/25 transition-colors cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Import Excel</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={!hasData}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#141414] border border-[#242424] text-[#A6A6A6] hover:bg-[#1A1A1A] hover:text-[#FFFFFF] transition-colors shadow-xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleExportCSV}
              disabled={!hasData || isExporting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#32C759] hover:bg-[#32C759]/90 text-white transition-colors shadow-md shadow-[#32C759]/25 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
            </button>
          </div>
        }
      />

      {!hasData ? (
        <NoDataState
          title="No Report Data Available"
          message="Import a Line Rejection / Rework / FQC Excel workbook to configure, preview, and export quality audit reports."
          onImport={() => setIsImportModalOpen(true)}
        />
      ) : (
        <>
          {/* Report Parameter Controls */}
          <div className="bg-[#141414] rounded-xl border border-[#242424] shadow-md shadow-black/40 p-4">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[#242424] text-xs font-bold uppercase tracking-wider text-[#FFFFFF]">
              <Filter className="w-4 h-4 text-[#FF7900]" />
              <span>Report Configuration Parameters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Month */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#A6A6A6] block mb-1">
                  Select Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full bg-[#0C0C0C] border border-[#242424] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#FFFFFF] focus:outline-none focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] cursor-pointer"
                >
                  <option value="ALL">All Available Months</option>
                  {filterOptions.months.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Data Type */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#A6A6A6] block mb-1">
                  Data Category
                </label>
                <select
                  value={dataType}
                  onChange={(e) => setDataType(e.target.value as 'ALL' | QualityType)}
                  className="w-full bg-[#0C0C0C] border border-[#242424] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#FFFFFF] focus:outline-none focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] cursor-pointer"
                >
                  <option value="ALL">All Categories (Rej + Rew + FQC)</option>
                  <option value="REJECTION">Line Rejection Only</option>
                  <option value="REWORK">Line Rework Only</option>
                  <option value="FQC_FALLOUT">FQC Fallout Only</option>
                </select>
              </div>

              {/* Line Filter */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#A6A6A6] block mb-1">
                  Cell / Line
                </label>
                <select
                  value={selectedLine}
                  onChange={(e) => setSelectedLine(e.target.value)}
                  className="w-full bg-[#0C0C0C] border border-[#242424] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#FFFFFF] focus:outline-none focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] cursor-pointer"
                >
                  <option value="ALL">All Cells & Lines</option>
                  {filterOptions.cellsAndLines.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#A6A6A6] block mb-1">
                  Date Filter (Optional)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-1/2 bg-[#0C0C0C] border border-[#242424] rounded-lg px-2 py-1 text-xs text-[#FFFFFF] focus:outline-none focus:border-[#FF7900]"
                  />
                  <span className="text-[#707070] text-xs">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-1/2 bg-[#0C0C0C] border border-[#242424] rounded-lg px-2 py-1 text-xs text-[#FFFFFF] focus:outline-none focus:border-[#FF7900]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Report Summary Card */}
          <div className="bg-[#141414] rounded-xl border border-[#242424] shadow-md shadow-black/40 p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#242424]">
              <div>
                <h3 className="font-extrabold text-sm text-[#FFFFFF] uppercase">
                  Executive Report Summary: {selectedMonth}
                </h3>
                <p className="text-xs text-[#A6A6A6] mt-0.5">
                  VE COMMERCIAL VEHICLE LIMITED | Internal Manufacturing Quality Audit
                </p>
              </div>
              <span className="px-2.5 py-1 rounded text-xs font-bold bg-[#FF7900]/15 text-[#FF8C1A] border border-[#FF7900]/30">
                {filteredQualityRecords.length + filteredFqcRecords.length} Filtered Entries
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-[#0C0C0C] rounded-lg border border-[#FF453A]/30">
                <span className="text-[#FF453A] font-bold block">Rejection Qty</span>
                <span className="text-xl font-black text-[#FF453A]">
                  {formatNumber(summary.totalRejectionQty)} pcs
                </span>
                <span className="text-[11px] text-[#A6A6A6] block mt-0.5">
                  Scrap Cost: {formatCurrency(summary.totalRejectionCost)}
                </span>
              </div>

              <div className="p-3 bg-[#0C0C0C] rounded-lg border border-[#FF7900]/30">
                <span className="text-[#FF8C1A] font-bold block">Rework Qty</span>
                <span className="text-xl font-black text-[#FF8C1A]">
                  {formatNumber(summary.totalReworkQty)} pcs
                </span>
                <span className="text-[11px] text-[#A6A6A6] block mt-0.5">
                  Rework Cost: {formatCurrency(summary.totalReworkCost)}
                </span>
              </div>

              <div className="p-3 bg-[#0C0C0C] rounded-lg border border-[#A78BFA]/30">
                <span className="text-[#C4B5FD] font-bold block">FQC Fallout Qty</span>
                <span className="text-xl font-black text-[#C4B5FD]">
                  {formatNumber(summary.totalFqcQty)} pcs
                </span>
                <span className="text-[11px] text-[#A6A6A6] block mt-0.5">
                  {summary.fqcDefectCount} audit defects
                </span>
              </div>

              <div className="p-3 bg-[#0C0C0C] rounded-lg border border-[#242424]">
                <span className="text-[#A6A6A6] font-bold block">Financial Total</span>
                <span className="text-xl font-black text-[#FFFFFF]">
                  {formatCurrency(summary.totalRejectionCost + summary.totalReworkCost)}
                </span>
                <span className="text-[11px] text-[#707070] block mt-0.5">
                  Direct Loss Impact
                </span>
              </div>
            </div>
          </div>

          {/* Report Records Table Preview */}
          <QualityTable
            records={filteredQualityRecords}
            fqcRecords={filteredFqcRecords}
            title="Report Records Preview"
            subtitle="Complete records included in the generated quality audit report"
          />
        </>
      )}
    </div>
  );
}
