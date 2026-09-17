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
import { XCircle, DollarSign, Percent, UploadCloud } from 'lucide-react';

export default function RejectionPage() {
  const { qualityRecords, activeMonth, hasData, setIsImportModalOpen } = useQualityData();

  const [filters, setFilters] = useState<FilterState>(
    createDefaultFilters({ month: activeMonth, type: 'REJECTION' })
  );

  const effectiveFilters = useMemo(
    () => (filters.month === activeMonth ? filters : { ...filters, month: activeMonth }),
    [filters, activeMonth]
  );

  const {
    filteredQualityRecords: rejectionRecords,
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
    setFilters(createDefaultFilters({ type: 'REJECTION' }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Line Rejection Dashboard"
        subtitle="Dedicated root cause monitoring, scrap cost analytics, and machine non-conformance tracking."
        badgeText={hasData ? 'Excel Data Loaded' : 'No Data Loaded'}
        badgeColor="red"
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
          title="No Rejection Data Available"
          message="Import a Line Rejection Excel workbook containing Part No, Machine, and Non-Conformance columns to populate this dashboard."
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

          {/* KPI Cards for Rejection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <KPICard
              title="Total Rejection Qty"
              categoryBadge="Scrapped Units"
              icon={XCircle}
              accentColor="red"
              primaryLabel="Total Volume"
              primaryValue={`${formatNumber(kpiSummary.totalRejectionQty)} pcs`}
              metrics={[
                {
                  label: 'Scrap Events',
                  value: `${rejectionRecords.length} records`,
                },
                {
                  label: 'Avg per Incident',
                  value: rejectionRecords.length > 0 
                    ? `${(kpiSummary.totalRejectionQty / rejectionRecords.length).toFixed(1)} pcs`
                    : '0 pcs',
                }
              ]}
            />

            <KPICard
              title="Total Rejection Cost"
              categoryBadge="Financial Scrap Impact"
              icon={DollarSign}
              accentColor="red"
              primaryLabel="Scrap Value Loss"
              primaryValue={formatCurrency(kpiSummary.totalRejectionCost)}
              metrics={[
                {
                  label: 'Direct Material Loss',
                  value: formatCurrency(kpiSummary.totalRejectionCost),
                  highlight: true,
                },
                {
                  label: 'Avg Loss / Scrap Unit',
                  value: kpiSummary.totalRejectionQty > 0
                    ? formatCurrency(kpiSummary.totalRejectionCost / kpiSummary.totalRejectionQty)
                    : '₹0',
                }
              ]}
            />

            <KPICard
              title="Average Loss Per Piece"
              categoryBadge="Unit Impact"
              icon={Percent}
              accentColor="red"
              primaryLabel="Avg Cost / Scrapped Pc"
              primaryValue={
                kpiSummary.totalRejectionQty > 0
                  ? formatCurrency(kpiSummary.totalRejectionCost / kpiSummary.totalRejectionQty)
                  : '₹0'
              }
              metrics={[
                {
                  label: 'Total Material Loss',
                  value: formatCurrency(kpiSummary.totalRejectionCost),
                  highlight: true,
                },
                {
                  label: 'Total Scrapped Pcs',
                  value: `${formatNumber(kpiSummary.totalRejectionQty)} pcs`,
                },
              ]}
            />
          </div>

          {/* Visual Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card
              title="Daily Rejection Trend"
              subtitle="Daily volume of scrapped parts across selected timeline"
            >
              <QualityTrendChart data={dailyTrend} showRejection={true} showRework={false} showFqc={false} />
            </Card>

            <Card
              title="Top Non-Conformance in Rejection (Pareto)"
              subtitle="Pareto analysis of defect categories resulting in scrap"
            >
              <ParetoChart data={paretoDefects} />
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card
              title="Machine-Wise Rejection"
              subtitle="Top stations contributing to scrap"
            >
              <ProblematicMachinesList machines={machineRankings} limit={5} />
            </Card>

            <Card
              title="Part-Wise Rejection"
              subtitle="Components with highest scrap"
            >
              <PartQualityList parts={partRankings} limit={5} />
            </Card>

            <Card
              title="Customer-Wise Rejection"
              subtitle="Scrap impact per customer line"
            >
              <CustomerQualityChart data={customerComparison} />
            </Card>
          </div>

          {/* Detailed Rejection Records Table */}
          <QualityTable
            records={rejectionRecords}
            title="Detailed Line Rejection Log"
            subtitle="Individual scrapped records with tooling root cause and action taken"
            onResetFilters={handleResetFilters}
          />
        </>
      )}
    </div>
  );
}
