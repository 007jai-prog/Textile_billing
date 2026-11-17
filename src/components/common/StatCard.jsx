import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'indigo', badge }) => {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
    },
    sky: {
      bg: 'bg-sky-50',
      text: 'text-sky-600',
      border: 'border-sky-100',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100',
    },
    slate: {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-200',
    }
  };

  const isPrimary = color === 'indigo' || color === 'primary';
  const theme = colorMap[color] || colorMap.indigo;

  return (
    <div
      className="bg-theme-card rounded-xl border p-5 shadow-xs hover:shadow-md transition-shadow"
      style={{
        backgroundColor: 'var(--theme-bg-card)',
        borderColor: 'var(--theme-border)',
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${!isPrimary ? `${theme.bg} ${theme.text}` : ''}`}
            style={isPrimary ? {
              backgroundColor: 'var(--theme-primary-light)',
              color: 'var(--theme-primary)'
            } : {}}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--theme-text-main)' }}>{value}</h3>
        {badge && <span>{badge}</span>}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
          {subtitle}
        </p>
      )}
    </div>
  );
};
