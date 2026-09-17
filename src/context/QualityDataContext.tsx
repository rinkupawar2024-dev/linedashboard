'use client';

import React, { createContext, useContext, useState } from 'react';
import { QualityRecord, FQCRecord } from '@/types/quality';
import type { ExcelImportResult } from '@/lib/services/excelParser';

interface QualityDataContextType {
  qualityRecords: QualityRecord[];
  fqcRecords: FQCRecord[];
  /** False until a workbook has been imported in this session. */
  hasData: boolean;
  importedFileName: string | null;
  importSummary: ExcelImportResult['summary'] | null;
  activeMonth: string;
  setActiveMonth: (month: string) => void;
  importExcelFile: (file: File) => Promise<ExcelImportResult>;
  clearData: () => void;
  isImportModalOpen: boolean;
  setIsImportModalOpen: (open: boolean) => void;
}

const QualityDataContext = createContext<QualityDataContextType | undefined>(undefined);

export function QualityDataProvider({ children }: { children: React.ReactNode }) {
  const [qualityRecords, setQualityRecords] = useState<QualityRecord[]>([]);
  const [fqcRecords, setFqcRecords] = useState<FQCRecord[]>([]);
  const [importedFileName, setImportedFileName] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<ExcelImportResult['summary'] | null>(null);
  const [activeMonth, setActiveMonth] = useState<string>('ALL');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const importExcelFile = async (file: File): Promise<ExcelImportResult> => {
    // Loaded on demand so the parser (and xlsx) stay out of the initial bundle.
    const { parseUploadedExcelFile } = await import('@/lib/services/excelImport');
    const result = await parseUploadedExcelFile(file);

    if (result.qualityRecords.length === 0 && result.fqcRecords.length === 0) {
      throw new Error(
        'No valid rejection, rework, or FQC records were found in this workbook. ' +
          'Check that your sheets contain the expected Part No / Machine / Non-Conformance columns.'
      );
    }

    setQualityRecords(result.qualityRecords);
    setFqcRecords(result.fqcRecords);
    setImportedFileName(result.fileName);
    setImportSummary(result.summary);
    setActiveMonth(result.summary.months.length > 0 ? result.summary.months[0] : 'ALL');

    return result;
  };

  const clearData = () => {
    setQualityRecords([]);
    setFqcRecords([]);
    setImportedFileName(null);
    setImportSummary(null);
    setActiveMonth('ALL');
  };

  return (
    <QualityDataContext.Provider
      value={{
        qualityRecords,
        fqcRecords,
        hasData: qualityRecords.length > 0 || fqcRecords.length > 0,
        importedFileName,
        importSummary,
        activeMonth,
        setActiveMonth,
        importExcelFile,
        clearData,
        isImportModalOpen,
        setIsImportModalOpen,
      }}
    >
      {children}
    </QualityDataContext.Provider>
  );
}

export function useQualityData() {
  const context = useContext(QualityDataContext);
  if (!context) {
    throw new Error('useQualityData must be used within a QualityDataProvider');
  }
  return context;
}
