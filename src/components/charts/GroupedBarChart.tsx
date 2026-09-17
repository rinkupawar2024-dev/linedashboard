'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { GroupedBarItem } from '@/types/quality';
import { QUALITY_COLORS } from '@/lib/constants/qualityConstants';
import {
  CHART_TOOLTIP_STYLE,
  CHART_TOOLTIP_ITEM_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
  CHART_LEGEND_WRAPPER_STYLE,
  CHART_GRID_STROKE,
  CHART_AXIS_STROKE,
  CHART_AXIS_LINE,
  CHART_EMPTY_CLASS,
  CHART_ANIMATION_ACTIVE,
} from './chartStyles';

interface GroupedBarChartProps {
  data: GroupedBarItem[];
  height?: number;
}

const MARGIN = { top: 10, right: 15, left: -15, bottom: 25 };

function GroupedBarChartImpl({ data, height = 280 }: GroupedBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={CHART_EMPTY_CLASS}>
        No cell/line comparison data available.
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={MARGIN}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
          <XAxis
            dataKey="name"
            stroke={CHART_AXIS_STROKE}
            fontSize={11}
            tickLine={false}
            axisLine={CHART_AXIS_LINE}
            interval={0}
            angle={-15}
            textAnchor="end"
          />
          <YAxis
            stroke={CHART_AXIS_STROKE}
            fontSize={11}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            itemStyle={CHART_TOOLTIP_ITEM_STYLE}
            labelStyle={CHART_TOOLTIP_LABEL_STYLE}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            iconSize={8}
            wrapperStyle={CHART_LEGEND_WRAPPER_STYLE}
          />
          <Bar
            isAnimationActive={CHART_ANIMATION_ACTIVE}
            dataKey="rejection"
            name="Rejection"
            fill={QUALITY_COLORS.rejection.primary}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            isAnimationActive={CHART_ANIMATION_ACTIVE}
            dataKey="rework"
            name="Rework"
            fill={QUALITY_COLORS.rework.primary}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            isAnimationActive={CHART_ANIMATION_ACTIVE}
            dataKey="fqc"
            name="FQC Fallout"
            fill={QUALITY_COLORS.fqc.primary}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export const GroupedBarChart = React.memo(GroupedBarChartImpl);
