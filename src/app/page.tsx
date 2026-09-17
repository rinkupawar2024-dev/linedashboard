'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DashboardFilters } from '@/components/filters/DashboardFilters';
import { QualitySummarySection } from '@/components/dashboard/QualitySummarySection';
import { Card } from '@/components/ui/Card';
import {
  GroupedBarChart,
  QualityTrendChart,
  ParetoChart,
  CustomerQualityChart,
  ShiftQualityChart,
  ProblematicMachinesList,
  PartQualityList,
} from '@/components/charts';
import { QualityTable } from '@/components/tables/QualityTable';
import { NoDataState } from '@/components/ui/NoDataState';
import { useQualityData } from '@/context/QualityDataContext';
import { useQualityDerivations, createDefaultFilters } from '@/lib/hooks/useQualityDerivations';

import { FilterState } from '@/types/quality';
import { UploadCloud } from 'lucide-react';

export default function DashboardPage() {
  const { qualityRecords, fqcRecords, activeMonth, hasData, setIsImportModalOpen } = useQualityData();

  const [filters, setFilters] = useState<FilterState>(createDefaultFilters({ month: activeMonth }));

  const effectiveFilters = useMemo(
    () => (filters.month === activeMonth ? filters : { ...filters, month: activeMonth }),
    [filters, activeMonth]
  );

  const {
    filteredQualityRecords,
    filteredFqcRecords,
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
      {/* Page Title & Status */}
      <PageHeader
        title="Manufacturing Line Quality Overview"
        subtitle="Real-time multi-dimensional tracking of rejection, rework, and FQC fallout metrics."
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
          title="No Quality Data Available"
          message="Import a Line Rejection / Rework / FQC Excel workbook to populate this dashboard. Nothing is displayed until data is loaded."
          onImport={() => setIsImportModalOpen(true)}
        />
      ) : (
        <>
          {/* Dynamic Multi-Filter Bar */}
          <DashboardFilters
            filters={filters}
            options={filterOptions}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
          />

          {/* KPI Section (4 High-Density Cards) */}
          <QualitySummarySection summary={kpiSummary} />

          {/* Analysis Grid: Row 1 - Line Comparison & Daily Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. REJECTION vs REWORK vs FQC FALLOUT */}
            <Card
              title="1. Rejection vs Rework vs FQC Fallout"
              subtitle="Grouped volume breakdown by manufacturing cell and line"
            >
              <GroupedBarChart data={lineComparison} />
            </Card>

            {/* 2. DAILY QUALITY TREND */}
            <Card
              title="2. Daily Quality Trend"
              subtitle="Chronological defect trajectory across Rejection, Rework, and FQC"
            >
              <QualityTrendChart data={dailyTrend} />
            </Card>
          </div>

          {/* Analysis Grid: Row 2 - Pareto Non-Conformance & Customer-Wise Quality */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 3. TOP NON-CONFORMANCE */}
            <Card
              title="3. Top Non-Conformance (Pareto 80/20 Analysis)"
              subtitle="Root defect frequencies sorted descending with cumulative distribution"
            >
              <ParetoChart data={paretoDefects} />
            </Card>

            {/* 4. CUSTOMER-WISE QUALITY */}
            <Card
              title="4. Customer-Wise Quality Distribution"
              subtitle="Impact distribution categorized by recipient OEM / division"
            >
              <CustomerQualityChart data={customerComparison} />
            </Card>
          </div>

          {/* Analysis Grid: Row 3 - Problematic Machines, Part Issues & Shift Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 5. TOP PROBLEMATIC MACHINES */}
            <Card
              title="5. Top Problematic Machines"
              subtitle="Ranked machine stations by issue quantity & contribution %"
            >
              <ProblematicMachinesList machines={machineRankings} limit={5} />
            </Card>

            {/* 6. PART-WISE QUALITY ISSUES */}
            <Card
              title="6. Part-Wise Quality Issues"
              subtitle="Component breakdown across Rejection, Rework, and Cost"
            >
              <PartQualityList parts={partRankings} limit={5} />
            </Card>

            {/* 7. SHIFT-WISE QUALITY */}
            <Card
              title="7. Shift-Wise Quality Comparison"
              subtitle="Operational variance comparison between Shift A, B, and C"
            >
              <ShiftQualityChart data={shiftComparison} />
            </Card>
          </div>

          {/* 8. RECENT QUALITY RECORDS TABLE */}
          <QualityTable
            records={filteredQualityRecords}
            fqcRecords={filteredFqcRecords}
            title="8. Recent Quality Records"
            subtitle="Individual line rejection, rework, and FQC non-conformance logs"
            onResetFilters={handleResetFilters}
          />
        </>
      )}
    </div>
  );
}
