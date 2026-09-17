import { LucideIcon } from 'lucide-react';

interface MetricItem {
  label: string;
  value: string;
  highlight?: boolean;
}

interface KPICardProps {
  title: string;
  categoryBadge?: string;
  icon: LucideIcon;
  accentColor: 'red' | 'orange' | 'purple' | 'blue' | 'slate';
  primaryValue: string;
  primaryLabel: string;
  metrics: MetricItem[];
  footerNote?: string;
}

export function KPICard({
  title,
  categoryBadge,
  icon: Icon,
  accentColor,
  primaryValue,
  primaryLabel,
  metrics,
  footerNote,
}: KPICardProps) {
  const accentStyles = {
    red: {
      borderTop: 'border-t-4 border-t-[#FF453A]',
      iconBg: 'bg-[#FF453A]/15 text-[#FF453A] border-[#FF453A]/30',
      badge: 'bg-[#FF453A]/15 text-[#FF453A] border-[#FF453A]/30',
      primaryText: 'text-[#FF453A]',
      subMetricHighlight: 'text-[#FF453A]',
    },
    orange: {
      borderTop: 'border-t-4 border-t-[#FF7900]',
      iconBg: 'bg-[#FF7900]/15 text-[#FF8C1A] border-[#FF7900]/30',
      badge: 'bg-[#FF7900]/15 text-[#FF8C1A] border-[#FF7900]/30',
      primaryText: 'text-[#FF8C1A]',
      subMetricHighlight: 'text-[#FF8C1A]',
    },
    purple: {
      borderTop: 'border-t-4 border-t-[#A78BFA]',
      iconBg: 'bg-[#A78BFA]/15 text-[#C4B5FD] border-[#A78BFA]/30',
      badge: 'bg-[#A78BFA]/15 text-[#C4B5FD] border-[#A78BFA]/30',
      primaryText: 'text-[#C4B5FD]',
      subMetricHighlight: 'text-[#C4B5FD]',
    },
    blue: {
      borderTop: 'border-t-4 border-t-[#FF7900]',
      iconBg: 'bg-[#FF7900]/15 text-[#FF8C1A] border-[#FF7900]/30',
      badge: 'bg-[#FF7900]/15 text-[#FF8C1A] border-[#FF7900]/30',
      primaryText: 'text-[#FFFFFF]',
      subMetricHighlight: 'text-[#FF7900]',
    },
    slate: {
      borderTop: 'border-t-4 border-t-[#707070]',
      iconBg: 'bg-[#1F1F1F] text-[#A6A6A6] border-[#242424]',
      badge: 'bg-[#1F1F1F] text-[#A6A6A6] border-[#242424]',
      primaryText: 'text-[#FFFFFF]',
      subMetricHighlight: 'text-[#FFFFFF]',
    },
  };

  const style = accentStyles[accentColor];

  return (
    <div
      className={`bg-[#141414] rounded-xl border border-[#242424] shadow-md shadow-black/40 p-5 flex flex-col justify-between transition-all hover:border-[#FF7900]/40 ${style.borderTop}`}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#A6A6A6]">
              {title}
            </h3>
            {categoryBadge && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${style.badge}`}
              >
                {categoryBadge}
              </span>
            )}
          </div>
          <div className="mt-2">
            <span className="text-xs text-[#707070] font-medium block">
              {primaryLabel}
            </span>
            <div className={`text-2xl font-black tracking-tight ${style.primaryText}`}>
              {primaryValue}
            </div>
          </div>
        </div>

        <div className={`p-2.5 rounded-lg border shadow-xs ${style.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {/* Secondary Metrics Section */}
      {metrics.length === 1 ? (
        <div className="pt-3 border-t border-[#242424] flex items-center justify-between">
          <span className="text-xs font-semibold text-[#A6A6A6]">
            {metrics[0].label}
          </span>
          <span className={`text-base font-extrabold ${style.subMetricHighlight}`}>
            {metrics[0].value}
          </span>
        </div>
      ) : (
        <div className="pt-3 border-t border-[#242424] grid grid-cols-2 gap-3">
          {metrics.map((m, idx) => (
            <div key={idx} className="flex flex-col">
              <span className="text-[11px] font-medium text-[#707070]">
                {m.label}
              </span>
              <span
                className={`text-sm font-bold ${
                  m.highlight ? 'text-[#FFFFFF]' : 'text-[#A6A6A6]'
                }`}
              >
                {m.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {footerNote && (
        <div className="mt-3 pt-2 text-[10px] text-[#707070] border-t border-dashed border-[#242424] flex items-center justify-between">
          <span>{footerNote}</span>
        </div>
      )}
    </div>
  );
}
