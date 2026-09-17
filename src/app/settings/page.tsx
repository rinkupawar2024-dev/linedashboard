'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { useQualityData } from '@/context/QualityDataContext';
import {
  Database,
  FileSpreadsheet,
  ShieldCheck,
  FolderTree,
  Lock,
  CheckCircle2,
  HardDrive,
  UploadCloud,
  RotateCcw,
} from 'lucide-react';

export default function SettingsPage() {
  const {
    hasData,
    importedFileName,
    importSummary,
    qualityRecords,
    fqcRecords,
    clearData,
    setIsImportModalOpen,
  } = useQualityData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Internal Portal Configuration & Data Settings"
        subtitle="System status, details of the imported workbook, and how quality data is handled."
        badgeText={hasData ? 'Excel Integrated' : 'No Data Loaded'}
        badgeColor={hasData ? 'emerald' : 'orange'}
        actions={
          <div className="flex items-center gap-2">
            {hasData && (
              <button
                onClick={clearData}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#141414] border border-[#242424] text-[#A6A6A6] hover:bg-[#1A1A1A] hover:text-[#FF453A] transition-colors shadow-xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Imported Data</span>
              </button>
            )}
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#FF7900] hover:bg-[#FF8C1A] text-white shadow-md shadow-[#FF7900]/25 transition-colors cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Import Excel File</span>
            </button>
          </div>
        }
      />

      {/* Integration Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Data Source */}
        <div className="bg-[#141414] p-5 rounded-xl border border-[#242424] shadow-md shadow-black/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#A6A6A6] uppercase">Data Source</span>
            <Database className="w-4 h-4 text-[#FF7900]" />
          </div>
          <div className="text-lg font-extrabold text-[#FFFFFF] mt-2 flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                hasData ? 'bg-[#32C759]' : 'bg-[#FF9F0A]'
              }`}
            ></span>
            {hasData ? 'Excel Import Active' : 'Awaiting Excel Upload'}
          </div>
          <p className="text-[11px] text-[#707070] mt-1 truncate">
            {hasData ? importedFileName : 'No dataset loaded'}
          </p>
        </div>

        {/* Excel Integration */}
        <div className="bg-[#141414] p-5 rounded-xl border border-[#242424] shadow-md shadow-black/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#A6A6A6] uppercase">Active Records</span>
            <FileSpreadsheet className="w-4 h-4 text-[#32C759]" />
          </div>
          <div className="text-lg font-extrabold text-[#FFFFFF] mt-2 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#32C759]"></span>
            {qualityRecords.length + fqcRecords.length} Records
          </div>
          <p className="text-[11px] text-[#707070] mt-1">
            {qualityRecords.filter(r => r.type === 'REJECTION').length} Rej / {qualityRecords.filter(r => r.type === 'REWORK').length} Rew / {fqcRecords.length} FQC
          </p>
        </div>

        {/* FQC Excel */}
        <div className="bg-[#141414] p-5 rounded-xl border border-[#242424] shadow-md shadow-black/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#A6A6A6] uppercase">FQC Format</span>
            <FileSpreadsheet className="w-4 h-4 text-[#A78BFA]" />
          </div>
          <div className="text-lg font-extrabold text-[#FFFFFF] mt-2 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A78BFA]"></span>
            {fqcRecords.length > 0 ? 'Integrated' : 'Awaiting Upload'}
          </div>
          <p className="text-[11px] text-[#707070] mt-1">
            Separate FQC format parser enabled
          </p>
        </div>

        {/* Application Mode */}
        <div className="bg-[#141414] p-5 rounded-xl border border-[#242424] shadow-md shadow-black/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#A6A6A6] uppercase">Application Mode</span>
            <ShieldCheck className="w-4 h-4 text-[#32C759]" />
          </div>
          <div className="text-lg font-extrabold text-[#32C759] mt-2 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#32C759]"></span>
            Internal Desktop
          </div>
          <p className="text-[11px] text-[#707070] mt-1">
            Local browser execution mode active
          </p>
        </div>
      </div>

      {/* Uploaded File Details (if active) */}
      {hasData && importSummary && (
        <Card
          title="Active Excel Workbook Details"
          subtitle={`Imported from local file: ${importedFileName}`}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-[#0C0C0C] rounded-lg border border-[#242424]">
              <span className="text-[#A6A6A6] block font-semibold">Total Rows Parsed</span>
              <span className="text-lg font-black text-[#FFFFFF]">{importSummary.totalRecords}</span>
            </div>
            <div className="p-3 bg-[#0C0C0C] rounded-lg border border-[#FF453A]/30">
              <span className="text-[#FF453A] block font-semibold">Rejection Qty</span>
              <span className="text-lg font-black text-[#FF453A]">{importSummary.rejectionQty} pcs</span>
            </div>
            <div className="p-3 bg-[#0C0C0C] rounded-lg border border-[#FF7900]/30">
              <span className="text-[#FF8C1A] block font-semibold">Rework Qty</span>
              <span className="text-lg font-black text-[#FF8C1A]">{importSummary.reworkQty} pcs</span>
            </div>
            <div className="p-3 bg-[#0C0C0C] rounded-lg border border-[#A78BFA]/30">
              <span className="text-[#C4B5FD] block font-semibold">FQC Fallout Qty</span>
              <span className="text-lg font-black text-[#C4B5FD]">{importSummary.fqcQty} pcs</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-[#A6A6A6]">
            <strong className="text-[#FFFFFF]">Parsed Sheets:</strong> {importSummary.sheetsParsed.join(', ')}
          </div>
        </Card>
      )}

      {/* Target Directory Structure */}
      <Card
        title="Data Handling"
        subtitle="How workbooks reach the portal, and the folder convention the plant uses to archive them"
      >
        <div className="space-y-4 text-xs text-[#A6A6A6]">
          <div className="p-4 bg-[#0C0C0C] rounded-lg border border-[#242424]">
            <div className="flex items-center gap-2 text-[#FFFFFF] font-bold mb-2">
              <FolderTree className="w-4 h-4 text-[#FF7900]" />
              <span>Suggested Archive Layout</span>
            </div>
            <pre className="p-3 bg-[#080808] text-[#FFFFFF] rounded font-mono text-[11px] overflow-x-auto leading-relaxed border border-[#242424]">
{`LINE QUALITY DATA/
    Jul-2026/
        Rejection.xlsx
        Rework.xlsx
        FQC Fallout.xlsx

    Aug-2026/
        Rejection.xlsx
        Rework.xlsx
        FQC Fallout.xlsx

    Sep-2026/
        Rejection.xlsx
        Rework.xlsx
        FQC Fallout.xlsx`}
            </pre>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 bg-[#0C0C0C] rounded-lg border border-[#242424]">
              <h4 className="font-bold text-[#FFFFFF] flex items-center gap-1.5 mb-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#32C759]" />
                <span>Live Excel Import Parser</span>
              </h4>
              <p className="text-[#A6A6A6] leading-relaxed text-[11px]">
                The Excel parser extracts Rejection, Rework, shifts (1st, 2nd, 3rd), defect Pareto, machine breakdowns, and costs directly from workbooks like <code className="font-bold text-[#FF8C1A]">RE Hard Rejection Sept-2026.xlsx</code>.
              </p>
            </div>

            <div className="p-3.5 bg-[#0C0C0C] rounded-lg border border-[#242424]">
              <h4 className="font-bold text-[#FFFFFF] flex items-center gap-1.5 mb-1.5">
                <ShieldCheck className="w-4 h-4 text-[#FF7900]" />
                <span>Browser-Only Processing</span>
              </h4>
              <p className="text-[#A6A6A6] leading-relaxed text-[11px]">
                There is no server-side data store or API. Workbooks are parsed and analysed entirely in the
                browser, and the imported dataset is discarded when the page is reloaded — re-import the
                workbook to continue.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Internal Security & Privacy Policy Card */}
      <Card
        title="Privacy & Security Assurance"
        subtitle="Guaranteed on-premise containment for VE Commercial Vehicle Limited"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-[#0C0C0C] rounded-lg border border-[#242424] flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-[#FF7900] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#FFFFFF] block">No Cloud Transmissions</strong>
              <span className="text-[#707070] text-[11px]">
                All Excel parsing occurs locally inside your browser / local server session. Zero cloud data transmission.
              </span>
            </div>
          </div>

          <div className="p-3 bg-[#0C0C0C] rounded-lg border border-[#242424] flex items-start gap-2.5">
            <HardDrive className="w-4 h-4 text-[#32C759] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#FFFFFF] block">Read-Only Operation</strong>
              <span className="text-[#707070] text-[11px]">
                Excel files are parsed in memory in read-only mode without modifying the original spreadsheet.
              </span>
            </div>
          </div>

          <div className="p-3 bg-[#0C0C0C] rounded-lg border border-[#242424] flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#A78BFA] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#FFFFFF] block">Desktop Optimized</strong>
              <span className="text-[#707070] text-[11px]">
                High-density layout tailored for 1920x1080 PC and laptop workstations across plant floors.
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
