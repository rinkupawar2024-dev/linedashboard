'use client';

import { KPISummary } from '@/types/quality';
import { KPICard } from '@/components/ui/KPICard';
import { formatCurrency, formatNumber } from '@/lib/utils/formatters';
import { XCircle, RotateCcw, ShieldAlert, Layers } from 'lucide-react';

interface QualitySummarySectionProps {
  summary: KPISummary;
}

export function QualitySummarySection({ summary }: QualitySummarySectionProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* CARD 1: LINE REJECTION */}
      <KPICard
        title="Line Rejection"
        categoryBadge="Rejection"
        icon={XCircle}
        accentColor="red"
        primaryLabel="Total Rejection Qty"
        primaryValue={`${formatNumber(summary.totalRejectionQty)} pcs`}
        metrics={[
          {
            label: 'Scrap Cost Impact',
            value: formatCurrency(summary.totalRejectionCost),
            highlight: true,
          },
        ]}
        footerNote="Critical scrapped production units"
      />

      {/* CARD 2: LINE REWORK */}
      <KPICard
        title="Line Rework"
        categoryBadge="Rework"
        icon={RotateCcw}
        accentColor="orange"
        primaryLabel="Total Rework Qty"
        primaryValue={`${formatNumber(summary.totalReworkQty)} pcs`}
        metrics={[
          {
            label: 'Rework Labor/Tool Cost',
            value: formatCurrency(summary.totalReworkCost),
            highlight: true,
          },
        ]}
        footerNote="Recoverable non-conforming units"
      />

      {/* CARD 3: FQC FALLOUT */}
      <KPICard
        title="FQC Fallout"
        categoryBadge="Final QC"
        icon={ShieldAlert}
        accentColor="purple"
        primaryLabel="Total Fallout Qty"
        primaryValue={`${formatNumber(summary.totalFqcQty)} pcs`}
        metrics={[
          {
            label: 'Identified Audit Defects',
            value: `${summary.fqcDefectCount} incidents`,
            highlight: true,
          },
        ]}
        footerNote="End-of-line and pre-dispatch audits"
      />

      {/* CARD 4: QUALITY SUMMARY */}
      <KPICard
        title="Quality Summary"
        categoryBadge="Financial Impact"
        icon={Layers}
        accentColor="blue"
        primaryLabel="Rejection + Rework Cost"
        primaryValue={formatCurrency(summary.totalRejectionCost + summary.totalReworkCost)}
        metrics={[
          {
            label: 'Line Rejection',
            value: `${formatNumber(summary.totalRejectionQty)} pcs`,
            highlight: true,
          },
          {
            label: 'Line Rework',
            value: `${formatNumber(summary.totalReworkQty)} pcs`,
            highlight: true,
          },
        ]}
        footerNote="*Total financial loss across line operations"
      />
    </div>
  );
}
