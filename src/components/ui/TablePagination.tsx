import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DEFAULT_PAGINATION_SIZES } from '@/lib/constants/qualityConstants';

interface TablePaginationProps {
  currentPage: number;
  totalRecords: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function TablePagination({
  currentPage,
  totalRecords,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startIndex = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(totalRecords, currentPage * pageSize);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-[#111111] border-t border-[#242424] text-xs text-[#A6A6A6] rounded-b-xl">
      {/* Records count & page size selector */}
      <div className="flex items-center gap-3">
        <span>
          Showing <strong className="text-[#FFFFFF]">{startIndex}</strong> to{' '}
          <strong className="text-[#FFFFFF]">{endIndex}</strong> of{' '}
          <strong className="text-[#FFFFFF]">{totalRecords}</strong> records
        </span>

        <div className="flex items-center gap-1.5 ml-2 border-l border-[#242424] pl-3">
          <span className="text-[#707070] font-medium">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="bg-[#141414] border border-[#242424] rounded px-2 py-1 text-xs font-semibold text-[#FFFFFF] focus:outline-none focus:ring-1 focus:ring-[#FF7900] cursor-pointer"
          >
            {DEFAULT_PAGINATION_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pagination Nav Buttons */}
      <div className="flex items-center gap-2">
        <span className="text-[#707070] mr-2">
          Page <strong className="text-[#FFFFFF]">{currentPage}</strong> of <strong className="text-[#FFFFFF]">{totalPages}</strong>
        </span>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded border border-[#242424] bg-[#141414] text-[#FFFFFF] hover:bg-[#1A1A1A] hover:border-[#FF7900]/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded border border-[#242424] bg-[#141414] text-[#FFFFFF] hover:bg-[#1A1A1A] hover:border-[#FF7900]/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
