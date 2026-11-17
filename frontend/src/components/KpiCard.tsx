import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  highlight?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  highlight = false,
}) => {
  return (
    <div
      className={`bg-surface-container border ${
        highlight ? 'border-primary/40 shadow-[0_4px_24px_-4px_rgba(77,142,255,0.2)]' : 'border-white/5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]'
      } rounded-xl p-5 relative overflow-hidden group transition-all hover:border-white/15`}
    >
      {icon && (
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
          <span className="material-symbols-outlined text-5xl">{icon}</span>
        </div>
      )}
      <p className="font-body-md text-sm text-on-surface-variant mb-1">{title}</p>
      <div className="flex items-baseline gap-2">
        <p className="font-headline-lg text-2xl lg:text-3xl text-on-surface font-semibold tracking-tight">
          {value}
        </p>
        {trend && (
          <span
            className={`text-xs font-medium flex items-center gap-0.5 ${
              trend.isNeutral
                ? 'text-tertiary'
                : trend.isPositive
                ? 'text-secondary'
                : 'text-error'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="font-body-md text-xs text-on-surface-variant/80 mt-1">{subtitle}</p>
      )}
    </div>
  );
};
