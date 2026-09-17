import { UploadCloud, FileSpreadsheet } from 'lucide-react';

interface NoDataStateProps {
  title?: string;
  message?: string;
  onImport?: () => void;
}

/**
 * Shown on any dashboard surface that has no records because no workbook
 * has been imported yet. Distinct from EmptyState, which reports that
 * filters matched nothing within an already-loaded dataset.
 */
export function NoDataState({
  title = 'No Data Available',
  message = 'Import a Line Rejection / Rework / FQC Excel workbook to populate this view.',
  onImport,
}: NoDataStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-14 text-center bg-[#141414] rounded-xl border border-dashed border-[#242424] shadow-md shadow-black/40">
      <div className="w-14 h-14 rounded-full bg-[#FF7900]/15 border border-[#FF7900]/30 flex items-center justify-center text-[#FF7900] mb-4 shadow-lg shadow-[#FF7900]/15">
        <FileSpreadsheet className="w-7 h-7" />
      </div>
      <h3 className="text-base font-extrabold text-[#FFFFFF]">{title}</h3>
      <p className="text-xs text-[#A6A6A6] max-w-md mt-1.5">{message}</p>
      {onImport && (
        <button
          onClick={onImport}
          className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[#FF7900] hover:bg-[#FF8C1A] text-white shadow-md shadow-[#FF7900]/25 transition-colors cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Import Excel File</span>
        </button>
      )}
    </div>
  );
}
