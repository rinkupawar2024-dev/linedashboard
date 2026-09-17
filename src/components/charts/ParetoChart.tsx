'use client';

import React, { useMemo, useCallback } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ParetoItem } from '@/types/quality';
import {
  CHART_TOOLTIP_STYLE,
  CHART_LEGEND_WRAPPER_STYLE,
  CHART_GRID_STROKE,
  CHART_AXIS_STROKE,
  CHART_AXIS_LINE,
  CHART_EMPTY_CLASS,
  CHART_ANIMATION_ACTIVE,
} from './chartStyles';

interface ParetoChartProps {
  data: ParetoItem[];
  height?: number;
}

const MARGIN = { top: 10, right: 20, left: -15, bottom: 35 };

function ParetoChartImpl({ data, height = 280 }: ParetoChartProps) {
  // Display top 8 defects for maximum clarity
  const displayData = useMemo(() => data.slice(0, 8), [data]);

  const formatTooltip = useCallback(
    (value: unknown, name: unknown): [string | number, string] => {
      const label = String(name);
      if (label === 'Cumulative %') return [`${value}%`, label];
      return [value as string | number, label];
    },
    []
  );

  if (!data || data.length === 0) {
    return (
      <div className={CHART_EMPTY_CLASS}>
        No defect Pareto data available.
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={displayData} margin={MARGIN}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
          <XAxis
            dataKey="defect"
            stroke={CHART_AXIS_STROKE}
            fontSize={11}
            tickLine={false}
            axisLine={CHART_AXIS_LINE}
            interval={0}
            angle={-20}
            textAnchor="end"
          />
          {/* Left Axis: Defect Quantity */}
          <YAxis
            yAxisId="left"
            stroke={CHART_AXIS_STROKE}
            fontSize={11}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            name="Quantity"
          />
          {/* Right Axis: Cumulative % */}
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke={CHART_AXIS_STROKE}
            fontSize={11}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            unit="%"
          />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={formatTooltip} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            iconSize={8}
            wrapperStyle={CHART_LEGEND_WRAPPER_STYLE}
          />
          <Bar
            isAnimationActive={CHART_ANIMATION_ACTIVE}
            yAxisId="left"
            dataKey="quantity"
            name="Defect Qty"
            fill="#FF7900"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
          <Line
            isAnimationActive={CHART_ANIMATION_ACTIVE}
            yAxisId="right"
            type="monotone"
            dataKey="cumulativePercentage"
            name="Cumulative %"
            stroke="#32C759"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#32C759' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export const ParetoChart = React.memo(ParetoChartImpl);
