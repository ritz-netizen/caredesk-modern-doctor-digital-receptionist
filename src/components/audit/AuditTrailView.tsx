import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Stethoscope,
  Activity,
  FileText
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { AuditLog, AuditAction } from '../../types';
import { formatDateTime } from '../../utils/dateFormatter';

export const AuditTrailView: React.FC = () => {
  const { auditLogs } = useClinic();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          log.description.toLowerCase().includes(q) ||
          log.actorName.toLowerCase().includes(q) ||
          (log.appointmentNumber && log.appointmentNumber.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Action Filter
      if (selectedActionFilter !== 'all' && log.action !== selectedActionFilter) {
        return false;
      }

      // Role Filter
      if (selectedRoleFilter !== 'all' && log.actorRole !== selectedRoleFilter) {
        return false;
      }

      return true;
    });
  }, [auditLogs, searchQuery, selectedActionFilter, selectedRoleFilter]);

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case 'BOOKED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">BOOKED</span>;
      case 'RESCHEDULED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">RESCHEDULED</span>;
      case 'CANCELLED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">CANCELLED</span>;
      case 'CHECKED_IN':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">CHECKED IN</span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">COMPLETED</span>;
      case 'NOTE_ADDED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">NOTE ADDED</span>;
      case 'DOCTOR_AVAILABILITY_CHANGED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">AVAILABILITY</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{action}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-teal-600" />
          Clinic Operations Audit Trail & Activity Log
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable chronological ledger tracking all appointments, reschedulings, cancellations, and doctor status updates.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit trail by description, actor, or token..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedActionFilter}
            onChange={(e) => setSelectedActionFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
          >
            <option value="all">All Actions</option>
            <option value="BOOKED">Booked</option>
            <option value="RESCHEDULED">Rescheduled</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="COMPLETED">Completed</option>
            <option value="NOTE_ADDED">Notes Added</option>
            <option value="DOCTOR_AVAILABILITY_CHANGED">Doctor Availability</option>
          </select>

          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
          >
            <option value="all">All Roles</option>
            <option value="Receptionist">Receptionist</option>
            <option value="Doctor">Doctor</option>
            <option value="System">System</option>
          </select>
        </div>
      </div>

      {/* Audit Log Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No audit records match your filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 rounded-xl bg-slate-100 text-slate-600 flex-shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getActionBadge(log.action)}
                      {log.appointmentNumber && (
                        <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {log.appointmentNumber}
                        </span>
                      )}
                      <span className="text-slate-400 text-[11px]">by</span>
                      <span className="font-bold text-slate-900">
                        {log.actorName} ({log.actorRole})
                      </span>
                    </div>

                    <p className="text-slate-700 font-medium leading-relaxed">
                      {log.description}
                    </p>

                    {log.details && (
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/80 text-[11px] text-slate-600 font-mono">
                        {Object.entries(log.details).map(([k, v]) => (
                          <div key={k}>
                            <span className="font-semibold text-slate-800">{k}:</span>{' '}
                            <span>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <span className="text-[11px] font-mono text-slate-400 flex-shrink-0 sm:text-right">
                  {formatDateTime(log.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
