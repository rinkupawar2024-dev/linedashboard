import { FilterX, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  onReset?: () => void;
}

export function EmptyState({
  title = 'No Quality Records Found',
  message = 'No data matches the selected filters or date range. Try clearing or adjusting your filter criteria.',
  onReset,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-[#141414] rounded-xl border border-dashed border-[#242424]">
      <div className="w-12 h-12 rounded-full bg-[#1F1F1F] flex items-center justify-center text-[#FF7900] mb-3">
        <FilterX className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-bold text-[#FFFFFF]">{title}</h4>
      <p className="text-xs text-[#A6A6A6] max-w-sm mt-1 mb-4">{message}</p>
      {onReset && (
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#FF7900] text-white hover:bg-[#FF8C1A] transition-colors shadow-md shadow-[#FF7900]/25 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset All Filters
        </button>
      )}
    </div>
  );
}
