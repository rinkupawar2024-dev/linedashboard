'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DashboardFilters } from '@/components/filters/DashboardFilters';
import { Card } from '@/components/ui/Card';
import {
  QualityTrendChart,
  ParetoChart,
  GroupedBarChart,
  CustomerQualityChart,
  ShiftQualityChart,
  ProblematicMachinesList,
  PartQualityList,
} from '@/components/charts';
import { useQualityData } from '@/context/QualityDataContext';
import { useQualityDerivations, createDefaultFilters } from '@/lib/hooks/useQualityDerivations';

import { FilterState } from '@/types/quality';
import { formatCurrency, formatNumber } from '@/lib/utils/formatters';
import { NoDataState } from '@/components/ui/NoDataState';
import { DollarSign, UploadCloud } from 'lucide-react';

export default function AnalyticsPage() {
  const { qualityRecords, fqcRecords, activeMonth, hasData, setIsImportModalOpen } = useQualityData();

  const [filters, setFilters] = useState<FilterState>(createDefaultFilters({ month: activeMonth }));

  const effectiveFilters = useMemo(
    () => (filters.month === activeMonth ? filters : { ...filters, month: activeMonth }),
    [filters, activeMonth]
  );

  const {
    filterOptions,
    kpiSummary,
    dailyTrend,
    lineComparison,
    paretoDefects,
    customerComparison,
    machineRankings,
    partRankings,
    shiftComparison,
  } = useQualityDerivations(qualityRecords, fqcRecords, effectiveFilters);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters(createDefaultFilters());
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manufacturing Quality Analytics"
        subtitle="Deep comparative analytics, financial loss breakdowns, and cross-operational metrics."
        badgeText={hasData ? 'Excel Data Loaded' : 'No Data Loaded'}
        badgeColor={hasData ? 'emerald' : 'orange'}
        actions={
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#FF7900] hover:bg-[#FF8C1A] text-white shadow-md shadow-[#FF7900]/25 transition-colors cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Import Excel</span>
          </button>
        }
      />

      {!hasData ? (
        <NoDataState
          title="No Analytics Data Available"
          message="Import a Line Rejection / Rework / FQC Excel workbook to generate comparative analytics and financial breakdowns."
          onImport={() => setIsImportModalOpen(true)}
        />
      ) : (
        <>
          <DashboardFilters
            filters={filters}
            options={filterOptions}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
          />

          {/* Cost & Volume Metric Callouts */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#141414] p-4 rounded-xl border border-[#242424] shadow-md shadow-black/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#A6A6A6] uppercase">
                  Total Quality Impact
                </span>
                <DollarSign className="w-4 h-4 text-[#FF7900]" />
              </div>
              <div className="text-xl font-extrabold text-[#FFFFFF] mt-2">
                {formatCurrency(kpiSummary.totalRejectionCost + kpiSummary.totalReworkCost)}
              </div>
              <span className="text-[11px] text-[#707070] mt-1 block">
                Rejection + Rework financial expense
              </span>
            </div>

            <div className="bg-[#141414] p-4 rounded-xl border border-[#242424] shadow-md shadow-black/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#A6A6A6] uppercase">
                  Rejection Scrap Value
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF453A]"></span>
              </div>
              <div className="text-xl font-extrabold text-[#FF453A] mt-2">
                {formatCurrency(kpiSummary.totalRejectionCost)}
              </div>
              <span className="text-[11px] text-[#707070] mt-1 block">
                {formatNumber(kpiSummary.totalRejectionQty)} scrapped units
              </span>
            </div>

            <div className="bg-[#141414] p-4 rounded-xl border border-[#242424] shadow-md shadow-black/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#A6A6A6] uppercase">
                  Rework Expense
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF7900]"></span>
              </div>
              <div className="text-xl font-extrabold text-[#FF8C1A] mt-2">
                {formatCurrency(kpiSummary.totalReworkCost)}
              </div>
              <span className="text-[11px] text-[#707070] mt-1 block">
                {formatNumber(kpiSummary.totalReworkQty)} reworked units
              </span>
            </div>

            <div className="bg-[#141414] p-4 rounded-xl border border-[#242424] shadow-md shadow-black/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#A6A6A6] uppercase">
                  FQC Fallout Total
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#A78BFA]"></span>
              </div>
              <div className="text-xl font-extrabold text-[#C4B5FD] mt-2">
                {formatNumber(kpiSummary.totalFqcQty)} pcs
              </div>
              <span className="text-[11px] text-[#707070] mt-1 block">
                {kpiSummary.fqcDefectCount} audit non-conformances
              </span>
            </div>
          </div>

          {/* 4 Trends Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card
              title="Overall Quality Trajectory (Combined)"
              subtitle="Integrated daily movement across all manufacturing operations"
            >
              <QualityTrendChart data={dailyTrend} />
            </Card>

            <Card
              title="Rejection vs Rework Daily Cost Analysis"
              subtitle="Scrap cost vs rework labor expenditure over time"
            >
              <QualityTrendChart data={dailyTrend} showFqc={false} />
            </Card>

            <Card
              title="Line & Cell Distribution Comparison"
              subtitle="Comparative volume across cells for all quality categories"
            >
              <GroupedBarChart data={lineComparison} />
            </Card>

            <Card
              title="Pareto 80/20 Non-Conformance Analysis"
              subtitle="Cumulative defect curve prioritizing root causes"
            >
              <ParetoChart data={paretoDefects} />
            </Card>
          </div>

          {/* Deep Cross Section Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card
              title="Top Problematic Machines"
              subtitle="Critical machine stations requiring PM & calibration"
            >
              <ProblematicMachinesList machines={machineRankings} limit={6} />
            </Card>

            <Card
              title="Top Non-Conforming Parts"
              subtitle="Components with maximum financial loss"
            >
              <PartQualityList parts={partRankings} limit={6} />
            </Card>

            <Card
              title="Customer Quality Matrix"
              subtitle="Impact classified by recipient division"
            >
              <CustomerQualityChart data={customerComparison} />
            </Card>
          </div>

          {/* Shift Comparison */}
          <Card
            title="Shift Variance Comparison (Shift A vs Shift B vs Shift C)"
            subtitle="Operational and quality variance by shift crew"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ShiftQualityChart data={shiftComparison} />
              
              {/* Shift Details Breakdown */}
              <div className="flex flex-col justify-center gap-3">
                {shiftComparison.map((s) => (
                  <div
                    key={s.shift}
                    className="p-3.5 rounded-lg bg-[#0C0C0C] border border-[#242424] flex items-center justify-between"
                  >
                    <div>
                      <span className="font-extrabold text-sm text-[#FFFFFF]">{s.shift}</span>
                      <div className="text-xs text-[#A6A6A6] mt-0.5">
                        Rej: <strong className="text-[#FF453A] font-bold">{s.rejection}</strong> | Rew: <strong className="text-[#FF7900] font-bold">{s.rework}</strong> | FQC: <strong className="text-[#A78BFA] font-bold">{s.fqc}</strong>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-[#FFFFFF] block">
                        {formatNumber(s.total)} pcs
                      </span>
                      <span className="text-xs font-semibold text-[#FF8C1A]">
                        {formatCurrency(s.cost)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
