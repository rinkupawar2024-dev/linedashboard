'use client';

import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { FilterState } from '@/types/quality';

interface FilterOptions {
  months: string[];
  cellsAndLines: string[];
  shifts: string[];
  customers: string[];
  parts: string[];
  machines: string[];
}

interface DashboardFiltersProps {
  filters: FilterState;
  options: FilterOptions;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onReset: () => void;
  showMachineFilter?: boolean;
}

export function DashboardFilters({
  filters,
  options,
  onFilterChange,
  onReset,
  showMachineFilter = true,
}: DashboardFiltersProps) {
  const hasActiveFilters =
    (filters.month && filters.month !== 'ALL') ||
    filters.startDate !== '' ||
    filters.endDate !== '' ||
    (filters.cellOrLine && filters.cellOrLine !== 'ALL') ||
    (filters.shift && filters.shift !== 'ALL') ||
    (filters.customer && filters.customer !== 'ALL') ||
    (filters.partNumber && filters.partNumber !== 'ALL') ||
    (filters.machine && filters.machine !== 'ALL') ||
    filters.searchQuery !== '';

  return (
    <div className="bg-[#141414] rounded-xl border border-[#242424] shadow-md shadow-black/40 p-4 mb-6 transition-all">
      {/* Filters Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-[#242424]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-[#FF7900]/15 text-[#FF7900] border border-[#FF7900]/30">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#FFFFFF]">
            Operational Filters & Search
          </span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF7900]/15 text-[#FF8C1A] border border-[#FF7900]/30">
              Active Filters Applied
            </span>
          )}
        </div>

        {/* Search input + Reset Button */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#707070]" />
            <input
              type="text"
              placeholder="Search part, defect, machine..."
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              className="pl-8 pr-3 py-1.5 text-xs bg-[#0C0C0C] border border-[#242424] rounded-lg focus:outline-none focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] w-52 text-[#FFFFFF] placeholder:text-[#707070] font-medium"
            />
          </div>

          <button
            onClick={onReset}
            disabled={!hasActiveFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#242424] bg-[#0C0C0C] hover:bg-[#1A1A1A] hover:border-[#FF7900]/40 text-[#A6A6A6] hover:text-[#FFFFFF] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Clear all filters"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#A6A6A6]" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Grid of Dynamic Dropdowns */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {/* Month Dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#A6A6A6]">
            Month
          </label>
          <select
            value={filters.month || 'ALL'}
            onChange={(e) => onFilterChange({ month: e.target.value })}
            className="w-full bg-[#0C0C0C] border border-[#242424] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#FFFFFF] focus:outline-none focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] cursor-pointer"
          >
            <option value="ALL">All Months</option>
            {options.months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#A6A6A6]">
            Start Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFilterChange({ startDate: e.target.value })}
              className="w-full bg-[#0C0C0C] border border-[#242424] rounded-lg px-2 py-1.5 text-xs font-medium text-[#FFFFFF] focus:outline-none focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900]"
            />
          </div>
        </div>

        {/* End Date */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#A6A6A6]">
            End Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => onFilterChange({ endDate: e.target.value })}
              className="w-full bg-[#0C0C0C] border border-[#242424] rounded-lg px-2 py-1.5 text-xs font-medium text-[#FFFFFF] focus:outline-none focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900]"
            />
          </div>
        </div>

        {/* Cell / Line */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#A6A6A6]">
            Cell / Line
          </label>
          <select
            value={filters.cellOrLine || 'ALL'}
            onChange={(e) => onFilterChange({ cellOrLine: e.target.value })}
            className="w-full bg-[#0C0C0C] border border-[#242424] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#FFFFFF] focus:outline-none focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] truncate cursor-pointer"
          >
            <option value="ALL">All Cells & Lines</option>
            {options.cellsAndLines.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Shift */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#A6A6A6]">
            Shift
          </label>
          <select
            value={filters.shift || 'ALL'}
            onChange={(e) => onFilterChange({ shift: e.target.value })}
            className="w-full bg-[#0C0C0C] border border-[#242424] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#FFFFFF] focus:outline-none focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] cursor-pointer"
          >
            <option value="ALL">All Shifts</option>
            {options.shifts.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Customer */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#A6A6A6]">
            Customer
          </label>
          <select
            value={filters.customer || 'ALL'}
            onChange={(e) => onFilterChange({ customer: e.target.value })}
            className="w-full bg-[#0C0C0C] border border-[#242424] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#FFFFFF] focus:outline-none focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] truncate cursor-pointer"
          >
            <option value="ALL">All Customers</option>
            {options.customers.map((cust) => (
              <option key={cust} value={cust}>
                {cust}
              </option>
            ))}
          </select>
        </div>

        {/* Part Number */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#A6A6A6]">
            Part Number
          </label>
          <select
            value={filters.partNumber || 'ALL'}
            onChange={(e) => onFilterChange({ partNumber: e.target.value })}
            className="w-full bg-[#0C0C0C] border border-[#242424] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#FFFFFF] focus:outline-none focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] truncate cursor-pointer"
          >
            <option value="ALL">All Parts</option>
            {options.parts.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Machine (optional for general or Rejection/Rework) */}
        {showMachineFilter && (
          <div className="flex flex-col gap-1 col-span-2 md:col-span-4 lg:col-span-7 pt-2 border-t border-[#242424] sm:flex-row sm:items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A6A6A6] shrink-0">
              Filter By Machine:
            </span>
            <select
              value={filters.machine || 'ALL'}
              onChange={(e) => onFilterChange({ machine: e.target.value })}
              className="max-w-xs bg-[#0C0C0C] border border-[#242424] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#FFFFFF] focus:outline-none focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] cursor-pointer"
            >
              <option value="ALL">All Machines</option>
              {options.machines.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
