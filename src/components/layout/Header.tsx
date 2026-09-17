'use client';

import { useState } from 'react';
import { RefreshCw, User, Calendar, ShieldCheck, UploadCloud, FileSpreadsheet } from 'lucide-react';
import { COMPANY_NAME, PORTAL_NAME } from '@/lib/constants/qualityConstants';
import { useQualityData } from '@/context/QualityDataContext';

export function Header() {
  const {
    activeMonth,
    hasData,
    importedFileName,
    setIsImportModalOpen,
  } = useQualityData();

  const [isSpinning, setIsSpinning] = useState(false);

  const handleRefreshClick = () => {
    setIsSpinning(true);
    setTimeout(() => {
      setIsSpinning(false);
    }, 600);
  };

  return (
    <header className="bg-[#111111] border-b border-[#242424] shadow-md px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Company & Portal Title */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-extrabold tracking-tight text-[#FFFFFF] uppercase">
            {COMPANY_NAME}
          </h1>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FF7900]/15 text-[#FF8C1A] border border-[#FF7900]/30">
            <ShieldCheck className="w-3 h-3 text-[#FF7900]" />
            Internal Portal
          </span>
        </div>
        <p className="text-xs font-semibold text-[#A6A6A6]">
          {PORTAL_NAME}
        </p>
      </div>

      {/* Header Controls & Status */}
      <div className="flex items-center gap-3.5">
        {/* IMPORT EXCEL BUTTON */}
        <button
          onClick={() => setIsImportModalOpen(true)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
            hasData
              ? 'bg-[#32C759] hover:bg-[#32C759]/90 text-white shadow-[#32C759]/25'
              : 'bg-[#FF7900] hover:bg-[#FF8C1A] text-white shadow-[#FF7900]/25'
          }`}
          title="Import Local Excel Quality File (.xlsx)"
        >
          <UploadCloud className="w-4 h-4" />
          <span>{hasData ? 'Excel Loaded' : 'Import Excel'}</span>
        </button>

        {/* Data Source Indicator Pill */}
        <div
          onClick={() => setIsImportModalOpen(true)}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border border-[#242424] bg-[#141414] hover:border-[#FF7900]/40 transition-colors"
        >
          <FileSpreadsheet className={`w-3.5 h-3.5 ${hasData ? 'text-[#32C759]' : 'text-[#707070]'}`} />
          <span className="truncate max-w-[160px] text-[#A6A6A6]">
            {hasData ? importedFileName : 'No Data Loaded'}
          </span>
        </div>

        {/* Active Month Indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141414] text-[#A6A6A6] text-xs font-semibold border border-[#242424]">
          <Calendar className="w-3.5 h-3.5 text-[#FF7900]" />
          <span>Period:</span>
          <span className="text-[#FF7900] font-bold">{activeMonth}</span>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefreshClick}
          title="Refresh Quality Data"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#141414] text-[#A6A6A6] border border-[#242424] hover:bg-[#1A1A1A] hover:text-[#FF7900] hover:border-[#FF7900]/40 transition-colors shadow-xs active:scale-95 cursor-pointer"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin text-[#FF7900]' : 'text-[#A6A6A6]'}`}
          />
          <span className="hidden lg:inline">Refresh</span>
        </button>

        {/* Quality User Profile */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-[#242424]">
          <div className="w-8 h-8 rounded-full bg-[#141414] border border-[#242424] flex items-center justify-center text-[#FF7900] shadow-xs">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-[#FFFFFF] leading-tight">
              Quality User
            </span>
            <span className="text-[10px] font-medium text-[#707070] leading-none">
              Manufacturing QA
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
