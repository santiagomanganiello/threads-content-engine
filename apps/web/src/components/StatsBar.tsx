import React from 'react';
import { Clock, CheckCircle2, Calendar, Send, XCircle, AlertTriangle } from 'lucide-react';

interface StatsBarProps {
  stats: {
    total: number;
    pendingReview: number;
    approved: number;
    scheduled: number;
    published: number;
    rejected: number;
    failed: number;
  };
  activeFilter: string | undefined;
  onFilterChange: (status: any) => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats, activeFilter, onFilterChange }) => {
  const cards = [
    {
      id: undefined,
      label: 'Todos',
      count: stats.total,
      icon: Clock,
      color: 'text-neutral-300',
      activeBorder: 'border-neutral-400',
    },
    {
      id: 'PENDING_REVIEW',
      label: 'Para revisión',
      count: stats.pendingReview,
      icon: AlertTriangle,
      color: 'text-amber-400',
      activeBorder: 'border-amber-500 bg-amber-500/10',
    },
    {
      id: 'APPROVED',
      label: 'Aprobados',
      count: stats.approved,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      activeBorder: 'border-emerald-500 bg-emerald-500/10',
    },
    {
      id: 'SCHEDULED',
      label: 'Programados',
      count: stats.scheduled,
      icon: Calendar,
      color: 'text-sky-400',
      activeBorder: 'border-sky-500 bg-sky-500/10',
    },
    {
      id: 'PUBLISHED',
      label: 'Publicados',
      count: stats.published,
      icon: Send,
      color: 'text-blue-400',
      activeBorder: 'border-blue-500 bg-blue-500/10',
    },
    {
      id: 'REJECTED',
      label: 'Rechazados',
      count: stats.rejected,
      icon: XCircle,
      color: 'text-rose-400',
      activeBorder: 'border-rose-500 bg-rose-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {cards.map((c) => {
        const Icon = c.icon;
        const isActive = activeFilter === c.id;

        return (
          <button
            key={c.label}
            onClick={() => onFilterChange(c.id)}
            className={`p-3.5 rounded-xl border text-left transition ${
              isActive
                ? c.activeBorder
                : 'border-[#262626] bg-[#161616] hover:bg-[#1f1f1f] hover:border-[#333333]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-neutral-400 font-medium">{c.label}</span>
              <Icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{c.count}</div>
          </button>
        );
      })}
    </div>
  );
};
