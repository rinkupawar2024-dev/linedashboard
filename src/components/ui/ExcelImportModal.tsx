'use client';

import React, { useState, useRef } from 'react';
import { useQualityData } from '@/context/QualityDataContext';
import type { ExcelImportResult } from '@/lib/services/excelParser';
import { formatCurrency, formatNumber } from '@/lib/utils/formatters';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  RotateCcw,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export function ExcelImportModal() {
  const {
    isImportModalOpen,
    setIsImportModalOpen,
    importExcelFile,
    hasData,
    importedFileName,
    importSummary,
    clearData,
  } = useQualityData();

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<ExcelImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isImportModalOpen) return null;

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
      setErrorMessage('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const result = await importExcelFile(file);
      setPreviewResult(result);
    } catch (err) {
      setPreviewResult(null);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Error parsing Excel file. Please ensure it is a valid workbook.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleClose = () => {
    setIsImportModalOpen(false);
    setPreviewResult(null);
    setErrorMessage(null);
  };

  const handleApply = () => {
    handleClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div
        className="bg-[#141414] rounded-2xl shadow-2xl border border-[#242424] max-w-2xl w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#080808] border-b border-[#242424] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#FF7900] text-white shadow-md shadow-[#FF7900]/25">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-wide text-[#FFFFFF]">
                Import Manufacturing Excel File
              </h3>
              <p className="text-[11px] text-[#A6A6A6]">
                Upload company Line Rejection / Rework Excel workbook to update live dashboard
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-[#A6A6A6] hover:text-[#FFFFFF] hover:bg-[#1F1F1F] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {/* Active Data Mode Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#111111] border border-[#242424] text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#A6A6A6] font-medium">Active Data Source:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
                  hasData
                    ? 'bg-[#32C759]/15 text-[#32C759] border-[#32C759]/30'
                    : 'bg-[#FF9F0A]/15 text-[#FF9F0A] border-[#FF9F0A]/30'
                }`}
              >
                {hasData ? `Excel: ${importedFileName}` : 'No Data Loaded'}
              </span>
            </div>

            {hasData && (
              <button
                onClick={() => {
                  clearData();
                  setPreviewResult(null);
                }}
                className="flex items-center gap-1 text-[#A6A6A6] hover:text-[#FF453A] font-semibold text-[11px] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear Imported Data</span>
              </button>
            )}
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
              isDragging
                ? 'border-[#FF7900] bg-[#FF7900]/10 scale-[1.01]'
                : 'border-[#242424] bg-[#0C0C0C] hover:border-[#FF7900]/60 hover:bg-[#111111]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div className="w-12 h-12 rounded-full bg-[#FF7900]/15 text-[#FF7900] border border-[#FF7900]/30 flex items-center justify-center mb-3 shadow-md shadow-[#FF7900]/15">
              <Upload className="w-6 h-6" />
            </div>

            <h4 className="text-sm font-bold text-[#FFFFFF]">
              {isProcessing ? 'Processing Excel File...' : 'Click to Upload or Drag & Drop Excel File'}
            </h4>
            <p className="text-xs text-[#A6A6A6] mt-1 max-w-sm">
              Supports <strong className="text-[#FFFFFF]">.xlsx</strong> and{' '}
              <strong className="text-[#FFFFFF]">.xls</strong> workbooks containing Rejection, Rework, or FQC sheets (e.g. <span className="font-mono text-[#FF8C1A] text-[11px]">RE Hard Rejection Sept-2026.xlsx</span>). Maximum file size 10 MB.
            </p>

            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold bg-[#141414] text-[#A6A6A6] border border-[#242424]">
              <Sparkles className="w-3.5 h-3.5 text-[#FF7900]" />
              <span>Auto-detects Shifts, Defects, Machines, Rates & Costs</span>
            </div>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-[#FF453A]/15 border border-[#FF453A]/30 text-xs text-[#FF453A] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#FF453A] mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success / Parsed Summary Preview */}
          {(previewResult || importSummary) && (
            <div className="p-4 rounded-xl bg-[#111111] border border-[#242424] text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#32C759]" />
                  <span className="font-bold text-[#FFFFFF]">
                    Workbook Successfully Parsed: {previewResult?.fileName || importedFileName}
                  </span>
                </div>
                <span className="font-extrabold text-[#32C759] px-2.5 py-0.5 bg-[#32C759]/15 border border-[#32C759]/30 rounded text-[11px]">
                  {(previewResult?.summary.totalRecords || importSummary?.totalRecords)} Total Records
                </span>
              </div>

              {/* Stat breakdown pills */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div className="p-2.5 bg-[#141414] rounded-lg border border-[#FF453A]/30">
                  <span className="text-[10px] font-bold text-[#FF453A] uppercase block">Rejection</span>
                  <span className="text-base font-black text-[#FF453A] block">
                    {formatNumber(previewResult?.summary.rejectionQty || importSummary?.rejectionQty || 0)} pcs
                  </span>
                  <span className="text-[10px] text-[#A6A6A6]">
                    Cost: {formatCurrency(previewResult?.summary.rejectionCost || importSummary?.rejectionCost || 0)}
                  </span>
                </div>

                <div className="p-2.5 bg-[#141414] rounded-lg border border-[#FF7900]/30">
                  <span className="text-[10px] font-bold text-[#FF8C1A] uppercase block">Rework</span>
                  <span className="text-base font-black text-[#FF8C1A] block">
                    {formatNumber(previewResult?.summary.reworkQty || importSummary?.reworkQty || 0)} pcs
                  </span>
                  <span className="text-[10px] text-[#A6A6A6]">
                    Cost: {formatCurrency(previewResult?.summary.reworkCost || importSummary?.reworkCost || 0)}
                  </span>
                </div>

                <div className="p-2.5 bg-[#141414] rounded-lg border border-[#A78BFA]/30">
                  <span className="text-[10px] font-bold text-[#C4B5FD] uppercase block">FQC Fallout</span>
                  <span className="text-base font-black text-[#C4B5FD] block">
                    {formatNumber(previewResult?.summary.fqcQty || importSummary?.fqcQty || 0)} pcs
                  </span>
                  <span className="text-[10px] text-[#A6A6A6]">
                    {(previewResult?.summary.fqcCount || importSummary?.fqcCount || 0)} logged audits
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-[#A6A6A6] pt-1">
                <strong className="text-[#FFFFFF]">Sheets Parsed:</strong>{' '}
                {(previewResult?.summary.sheetsParsed || importSummary?.sheetsParsed || []).join(', ')}
              </div>

              {(() => {
                const skipped = previewResult?.summary.skippedRows ?? importSummary?.skippedRows ?? 0;
                if (skipped === 0) return null;
                return (
                  <div className="text-[11px] text-[#FF9F0A] pt-1 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-[#FFFFFF]">{skipped}</strong> row
                      {skipped === 1 ? '' : 's'} skipped — no readable date or quantity.
                    </span>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#080808] border-t border-[#242424] flex items-center justify-between">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-[#A6A6A6] bg-[#141414] border border-[#242424] hover:bg-[#1F1F1F] hover:text-[#FFFFFF] transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleApply}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#FF7900] hover:bg-[#FF8C1A] text-white font-bold text-xs shadow-md shadow-[#FF7900]/25 transition-colors cursor-pointer"
          >
            <span>Apply to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
