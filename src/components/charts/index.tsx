'use client';

import dynamic from 'next/dynamic';
/**
 * Chart components are loaded on demand because recharts is a large
 * dependency only needed once data has been imported. Each is exported
 * under the same name as the underlying component so call sites are
 * unchanged apart from the import path.
 */

function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div
      className="w-full flex items-center justify-center"
      style={{ height }}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-[11px] font-medium text-slate-400">Loading chart...</span>
      </div>
    </div>
  );
}

const loading = () => <ChartSkeleton />;

export const QualityTrendChart = dynamic(
  () => import('./QualityTrendChart').then((m) => ({ default: m.QualityTrendChart })),
  { ssr: false, loading }
);

export const ParetoChart = dynamic(
  () => import('./ParetoChart').then((m) => ({ default: m.ParetoChart })),
  { ssr: false, loading }
);

export const GroupedBarChart = dynamic(
  () => import('./GroupedBarChart').then((m) => ({ default: m.GroupedBarChart })),
  { ssr: false, loading }
);

export const ProblematicMachinesList = dynamic(
  () => import('./HorizontalRankedChart').then((m) => ({ default: m.ProblematicMachinesList })),
  { ssr: false, loading }
);

export const PartQualityList = dynamic(
  () => import('./HorizontalRankedChart').then((m) => ({ default: m.PartQualityList })),
  { ssr: false, loading }
);

export const CustomerQualityChart = dynamic(
  () => import('./ComparisonChart').then((m) => ({ default: m.CustomerQualityChart })),
  { ssr: false, loading }
);

export const ShiftQualityChart = dynamic(
  () => import('./ComparisonChart').then((m) => ({ default: m.ShiftQualityChart })),
  { ssr: false, loading }
);
