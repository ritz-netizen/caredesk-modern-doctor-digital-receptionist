import React from 'react';
import { AppointmentStatus, DoctorStatus, PriorityLevel, AppointmentType } from '../../types';

export const AppointmentStatusBadge: React.FC<{ status: AppointmentStatus; className?: string }> = ({
  status,
  className = ''
}) => {
  const configs: Record<AppointmentStatus, { label: string; bg: string; text: string; dot: string }> = {
    scheduled: {
      label: 'Scheduled',
      bg: 'bg-sky-50 border-sky-200',
      text: 'text-sky-700',
      dot: 'bg-sky-500'
    },
    confirmed: {
      label: 'Confirmed',
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-700',
      dot: 'bg-blue-600'
    },
    in_progress: {
      label: 'In Progress / Checked In',
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-amber-800',
      dot: 'bg-amber-500 animate-pulse'
    },
    completed: {
      label: 'Completed',
      bg: 'bg-emerald-50 border-emerald-200',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500'
    },
    rescheduled: {
      label: 'Rescheduled',
      bg: 'bg-purple-50 border-purple-200',
      text: 'text-purple-700',
      dot: 'bg-purple-500'
    },
    cancelled: {
      label: 'Cancelled',
      bg: 'bg-rose-50 border-rose-200',
      text: 'text-rose-700',
      dot: 'bg-rose-500'
    },
    no_show: {
      label: 'No Show',
      bg: 'bg-slate-100 border-slate-300',
      text: 'text-slate-600',
      dot: 'bg-slate-400'
    }
  };

  const config = configs[status] || configs.scheduled;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

export const DoctorStatusBadge: React.FC<{
  status: DoctorStatus;
  showDotOnly?: boolean;
  className?: string;
}> = ({ status, showDotOnly = false, className = '' }) => {
  const configs: Record<DoctorStatus, { label: string; bg: string; text: string; dot: string }> = {
    available: {
      label: 'Available',
      bg: 'bg-emerald-50 border-emerald-200',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500'
    },
    in_consultation: {
      label: 'In Consultation',
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-amber-800',
      dot: 'bg-amber-500 animate-ping-slow'
    },
    on_break: {
      label: 'On Break',
      bg: 'bg-indigo-50 border-indigo-200',
      text: 'text-indigo-700',
      dot: 'bg-indigo-500'
    },
    on_leave: {
      label: 'On Leave',
      bg: 'bg-purple-50 border-purple-200',
      text: 'text-purple-700',
      dot: 'bg-purple-500'
    },
    unavailable: {
      label: 'Unavailable',
      bg: 'bg-slate-100 border-slate-300',
      text: 'text-slate-600',
      dot: 'bg-slate-400'
    }
  };

  const config = configs[status] || configs.unavailable;

  if (showDotOnly) {
    return (
      <span
        title={config.label}
        className={`inline-block w-2.5 h-2.5 rounded-full ring-2 ring-white ${config.dot} ${className}`}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: PriorityLevel }> = ({ priority }) => {
  if (priority === 'urgent') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-700 border border-red-200 animate-pulse-subtle">
        URGENT
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
      Normal
    </span>
  );
};

export const AppointmentTypeBadge: React.FC<{ type: AppointmentType }> = ({ type }) => {
  const map: Record<AppointmentType, { label: string; style: string }> = {
    new_consultation: { label: 'New Consultation', style: 'text-teal-700 bg-teal-50 border-teal-200' },
    follow_up: { label: 'Follow Up', style: 'text-blue-700 bg-blue-50 border-blue-200' },
    routine_checkup: { label: 'Routine Checkup', style: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
    emergency: { label: 'Emergency', style: 'text-rose-700 bg-rose-50 border-rose-200' },
    teleconsultation: { label: 'Teleconsultation', style: 'text-violet-700 bg-violet-50 border-violet-200' },
  };

  const item = map[type] || { label: type, style: 'text-slate-700 bg-slate-50 border-slate-200' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${item.style}`}>
      {item.label}
    </span>
  );
};
