'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DashboardFilters } from '@/components/filters/DashboardFilters';
import { KPICard } from '@/components/ui/KPICard';
import { Card } from '@/components/ui/Card';
import {
  QualityTrendChart,
  ParetoChart,
  CustomerQualityChart,
  ProblematicMachinesList,
  PartQualityList,
} from '@/components/charts';
import { QualityTable } from '@/components/tables/QualityTable';
import { useQualityData } from '@/context/QualityDataContext';
import { useQualityDerivations, createDefaultFilters } from '@/lib/hooks/useQualityDerivations';

import { FilterState } from '@/types/quality';
import { formatCurrency, formatNumber } from '@/lib/utils/formatters';
import { NoDataState } from '@/components/ui/NoDataState';
import { RotateCcw, Wrench, Percent, UploadCloud } from 'lucide-react';

export default function ReworkPage() {
  const { qualityRecords, activeMonth, hasData, setIsImportModalOpen } = useQualityData();

  const [filters, setFilters] = useState<FilterState>(
    createDefaultFilters({ month: activeMonth, type: 'REWORK' })
  );

  const effectiveFilters = useMemo(
    () => (filters.month === activeMonth ? filters : { ...filters, month: activeMonth }),
    [filters, activeMonth]
  );

  const {
    filteredQualityRecords: reworkRecords,
    filterOptions,
    kpiSummary,
    dailyTrend,
    paretoDefects,
    customerComparison,
    machineRankings,
    partRankings,
  } = useQualityDerivations(qualityRecords, [], effectiveFilters, { includeFqc: false });

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters(createDefaultFilters({ type: 'REWORK' }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Line Rework Dashboard"
        subtitle="Tracking reworkable non-conformances, recovery labor costs, and tooling adjustments."
        badgeText={hasData ? 'Excel Data Loaded' : 'No Data Loaded'}
        badgeColor="orange"
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
          title="No Rework Data Available"
          message="Import a Line Rework Excel workbook to populate rework volume, recovery cost, and tooling adjustment analytics."
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

          {/* KPI Cards for Rework */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <KPICard
              title="Total Rework Qty"
              categoryBadge="Recovered Units"
              icon={RotateCcw}
              accentColor="orange"
              primaryLabel="Total Volume"
              primaryValue={`${formatNumber(kpiSummary.totalReworkQty)} pcs`}
              metrics={[
                {
                  label: 'Rework Events',
                  value: `${reworkRecords.length} incidents`,
                },
                {
                  label: 'Avg Batch Size',
                  value: reworkRecords.length > 0
                    ? `${(kpiSummary.totalReworkQty / reworkRecords.length).toFixed(1)} pcs`
                    : '0 pcs',
                }
              ]}
            />

            <KPICard
              title="Total Rework Cost"
              categoryBadge="Labor & Tool Cost"
              icon={Wrench}
              accentColor="orange"
              primaryLabel="Rework Expense"
              primaryValue={formatCurrency(kpiSummary.totalReworkCost)}
              metrics={[
                {
                  label: 'Total Rework Cost',
                  value: formatCurrency(kpiSummary.totalReworkCost),
                  highlight: true,
                },
                {
                  label: 'Avg Cost / Unit',
                  value: kpiSummary.totalReworkQty > 0
                    ? formatCurrency(kpiSummary.totalReworkCost / kpiSummary.totalReworkQty)
                    : '₹0',
                }
              ]}
            />

            <KPICard
              title="Average Cost Per Unit"
              categoryBadge="Unit Labor"
              icon={Percent}
              accentColor="orange"
              primaryLabel="Avg Rework Cost / Pc"
              primaryValue={
                kpiSummary.totalReworkQty > 0
                  ? formatCurrency(kpiSummary.totalReworkCost / kpiSummary.totalReworkQty)
                  : '₹0'
              }
              metrics={[
                {
                  label: 'Total Rework Expense',
                  value: formatCurrency(kpiSummary.totalReworkCost),
                  highlight: true,
                },
                {
                  label: 'Total Reworked Units',
                  value: `${formatNumber(kpiSummary.totalReworkQty)} pcs`,
                },
              ]}
            />
          </div>

          {/* Visual Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card
              title="Daily Rework Trend"
              subtitle="Daily trend of parts sent for manual/station rework"
            >
              <QualityTrendChart data={dailyTrend} showRejection={false} showRework={true} showFqc={false} />
            </Card>

            <Card
              title="Top Non-Conformance in Rework (Pareto)"
              subtitle="Pareto analysis of recurring defects requiring rework"
            >
              <ParetoChart data={paretoDefects} />
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card
              title="Machine-Wise Rework"
              subtitle="Stations requiring most rework intervention"
            >
              <ProblematicMachinesList machines={machineRankings} limit={5} />
            </Card>

            <Card
              title="Part-Wise Rework"
              subtitle="Components with highest rework incidents"
            >
              <PartQualityList parts={partRankings} limit={5} />
            </Card>

            <Card
              title="Customer-Wise Rework"
              subtitle="Rework volume classified by customer order"
            >
              <CustomerQualityChart data={customerComparison} />
            </Card>
          </div>

          {/* Detailed Rework Records Table */}
          <QualityTable
            records={reworkRecords}
            title="Detailed Line Rework Log"
            subtitle="Individual rework operations with root causes and corrective actions"
            onResetFilters={handleResetFilters}
          />
        </>
      )}
    </div>
  );
}
