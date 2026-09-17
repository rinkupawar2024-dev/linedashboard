/**
 * Shared presentation constants for the recharts-based charts styled for the theme.
 */

export const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#141414',
  border: '1px solid #242424',
  borderRadius: '8px',
  color: '#FFFFFF',
  fontSize: '12px',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
} as const;

export const CHART_TOOLTIP_ITEM_STYLE = {
  color: '#FFFFFF',
  padding: '2px 0',
} as const;

export const CHART_TOOLTIP_LABEL_STYLE = {
  fontWeight: 'bold',
  color: '#A6A6A6',
  marginBottom: '4px',
} as const;

export const CHART_LEGEND_WRAPPER_STYLE = {
  fontSize: '11px',
  color: '#A6A6A6',
  paddingBottom: '10px',
} as const;

export const CHART_GRID_STROKE = '#242424';
export const CHART_AXIS_STROKE = '#707070';
export const CHART_AXIS_LINE = { stroke: '#242424' } as const;

/** Shown when a chart has no rows to render. */
export const CHART_EMPTY_CLASS =
  'flex items-center justify-center h-64 text-xs text-[#707070] font-medium';

/**
 * Recharts replays a 400ms animation every time a series' `data` changes.
 * These dashboards re-filter on every control change, so that animation is the
 * dominant perceived latency — roughly 460x the cost of the aggregation that
 * produced the data. Disabling it makes filter changes render immediately.
 * Flip back to `true` if the transition is wanted more than the responsiveness.
 */
export const CHART_ANIMATION_ACTIVE = false;
