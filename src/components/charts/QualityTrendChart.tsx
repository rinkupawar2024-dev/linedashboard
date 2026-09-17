'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { DailyTrendItem } from '@/types/quality';
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

interface QualityTrendChartProps {
  data: DailyTrendItem[];
  showRejection?: boolean;
  showRework?: boolean;
  showFqc?: boolean;
  height?: number;
}

const MARGIN = { top: 10, right: 15, left: -15, bottom: 0 };

function QualityTrendChartImpl({
  data,
  showRejection = true,
  showRework = true,
  showFqc = true,
  height = 280,
}: QualityTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={CHART_EMPTY_CLASS}>
        No daily trend data available for current selection.
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={MARGIN}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
          <XAxis
            dataKey="displayDate"
            stroke={CHART_AXIS_STROKE}
            fontSize={11}
            tickLine={false}
            axisLine={CHART_AXIS_LINE}
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
          {showRejection && (
            <Line
              type="monotone"
              isAnimationActive={CHART_ANIMATION_ACTIVE}
              dataKey="rejectionQty"
              name="Rejection"
              stroke={QUALITY_COLORS.rejection.primary}
              strokeWidth={2.5}
              dot={{ r: 3, fill: QUALITY_COLORS.rejection.primary }}
              activeDot={{ r: 5 }}
            />
          )}
          {showRework && (
            <Line
              type="monotone"
              isAnimationActive={CHART_ANIMATION_ACTIVE}
              dataKey="reworkQty"
              name="Rework"
              stroke={QUALITY_COLORS.rework.primary}
              strokeWidth={2.5}
              dot={{ r: 3, fill: QUALITY_COLORS.rework.primary }}
              activeDot={{ r: 5 }}
            />
          )}
          {showFqc && (
            <Line
              type="monotone"
              isAnimationActive={CHART_ANIMATION_ACTIVE}
              dataKey="fqcQty"
              name="FQC Fallout"
              stroke={QUALITY_COLORS.fqc.primary}
              strokeWidth={2.5}
              dot={{ r: 3, fill: QUALITY_COLORS.fqc.primary }}
              activeDot={{ r: 5 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export const QualityTrendChart = React.memo(QualityTrendChartImpl);
