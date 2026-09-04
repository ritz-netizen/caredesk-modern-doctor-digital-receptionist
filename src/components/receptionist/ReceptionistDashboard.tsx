import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  PlusCircle,
  Stethoscope,
  Eye,
  FileText,
  Building,
  UserX,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { useAuth } from '../../context/AuthContext';
import { Appointment, AppointmentStatus } from '../../types';
import { AppointmentStatusBadge, PriorityBadge, AppointmentTypeBadge } from '../common/StatusBadge';
import { DoctorAvailabilityCard } from './DoctorAvailabilityCard';
import { formatDate, formatTimeSlot, getTimePeriod } from '../../utils/dateFormatter';

interface ReceptionistDashboardProps {
  onOpenBooking: (doctorId?: string) => void;
  onOpenReschedule: (appointment: Appointment) => void;
  onOpenCancel: (appointment: Appointment) => void;
  onOpenDetails: (appointment: Appointment) => void;
}

export const ReceptionistDashboard: React.FC<ReceptionistDashboardProps> = ({
  onOpenBooking,
  onOpenReschedule,
  onOpenCancel,
  onOpenDetails,
}) => {
  const { appointments, doctors, selectedDate, updateAppointmentStatus } = useClinic();
  const { receptionistName } = useAuth();

  // Filters State
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'cancelled_rescheduled'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState<string>('all');

  // Today's appointments
  const todayAppointments = useMemo(() => {
    return appointments.filter((a) => a.date === selectedDate);
  }, [appointments, selectedDate]);

  // Upcoming appointments (dates after selectedDate)
  const upcomingAppointments = useMemo(() => {
    return appointments.filter((a) => a.date > selectedDate && a.status !== 'cancelled');
  }, [appointments, selectedDate]);

  // Cancelled or rescheduled
  const cancelledOrRescheduled = useMemo(() => {
    return appointments.filter(
      (a) => a.status === 'cancelled' || a.status === 'rescheduled'
    );
  }, [appointments]);

  // Metric counters for selected date
  const metrics = useMemo(() => {
    const total = todayAppointments.length;
    const checkedIn = todayAppointments.filter((a) => a.status === 'in_progress').length;
    const confirmed = todayAppointments.filter((a) => a.status === 'confirmed' || a.status === 'scheduled').length;
    const completed = todayAppointments.filter((a) => a.status === 'completed').length;
    const cancelled = todayAppointments.filter((a) => a.status === 'cancelled').length;
    const rescheduled = todayAppointments.filter((a) => a.status === 'rescheduled').length;
    const noShow = todayAppointments.filter((a) => a.status === 'no_show').length;
    return { total, checkedIn, confirmed, completed, cancelled, rescheduled, noShow };
  }, [todayAppointments]);

  // Active list based on tab
  const rawList = useMemo(() => {
    if (activeTab === 'today') return todayAppointments;
    if (activeTab === 'upcoming') return upcomingAppointments;
    return cancelledOrRescheduled;
  }, [activeTab, todayAppointments, upcomingAppointments, cancelledOrRescheduled]);

  // Apply search & filters
  const filteredList = useMemo(() => {
    return rawList.filter((a) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          a.patientName.toLowerCase().includes(q) ||
          a.patientNumber.toLowerCase().includes(q) ||
          a.patientPhone.includes(q) ||
          a.appointmentNumber.toLowerCase().includes(q) ||
          a.doctorName.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Doctor Filter
      if (selectedDoctorFilter !== 'all' && a.doctorId !== selectedDoctorFilter) {
        return false;
      }

      // Status Filter
      if (selectedStatusFilter !== 'all' && a.status !== selectedStatusFilter) {
        return false;
      }

      // Time Period Filter
      if (selectedPeriodFilter !== 'all') {
        const period = getTimePeriod(a.timeSlot);
        if (period !== selectedPeriodFilter) return false;
      }

      return true;
    });
  }, [rawList, searchQuery, selectedDoctorFilter, selectedStatusFilter, selectedPeriodFilter]);

  // Sort: chronological by date and timeSlot
  const sortedList = useMemo(() => {
    return [...filteredList].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.timeSlot.localeCompare(b.timeSlot);
    });
  }, [filteredList]);

  // Quick Check-in action
  const handleCheckIn = (appointmentId: string) => {
    updateAppointmentStatus(appointmentId, 'in_progress', receptionistName, 'Receptionist');
  };

  // Quick No-show action
  const handleNoShow = (appointmentId: string) => {
    if (window.confirm('Mark this patient as No-Show?')) {
      updateAppointmentStatus(appointmentId, 'no_show', receptionistName, 'Receptionist');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner with Receptionist Greeting & Quick CTA */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-teal-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-400/20 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-200 text-xs font-semibold uppercase tracking-wider">
              <span>Receptionist Control Station</span>
              <span>·</span>
              <span>{formatDate(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1 tracking-tight">
              Hospital Appointment Management Hub
            </h1>
            <p className="text-teal-100/80 text-xs mt-1 max-w-xl">
              Real-time patient check-ins, queue management, doctor availability monitoring, and instant conflict-free scheduling.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenBooking()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-teal-800 hover:bg-teal-50 font-bold text-xs shadow-md transition-all duration-150 transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-4 h-4 text-teal-600" />
              <span>Book Appointment</span>
            </button>
          </div>
        </div>

        {/* Real-time KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-teal-600/60">
          {/* Total Today */}
          <div className="bg-teal-900/40 backdrop-blur-xs p-3 rounded-2xl border border-teal-600/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-200">
              Total Today
            </span>
            <div className="text-xl font-extrabold text-white mt-0.5">{metrics.total}</div>
            <span className="text-[10px] text-teal-300">All appointments</span>
          </div>

          {/* Checked In / Waiting */}
          <div className="bg-amber-500/20 backdrop-blur-xs p-3 rounded-2xl border border-amber-400/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              Checked In
            </span>
            <div className="text-xl font-extrabold text-amber-300 mt-0.5">{metrics.checkedIn}</div>
            <span className="text-[10px] text-amber-200/80">In waiting room</span>
          </div>

          {/* Confirmed / Upcoming */}
          <div className="bg-teal-900/40 backdrop-blur-xs p-3 rounded-2xl border border-teal-600/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-200">
              Scheduled
            </span>
            <div className="text-xl font-extrabold text-white mt-0.5">{metrics.confirmed}</div>
            <span className="text-[10px] text-teal-300">Yet to arrive</span>
          </div>

          {/* Completed */}
          <div className="bg-emerald-500/20 backdrop-blur-xs p-3 rounded-2xl border border-emerald-400/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
              Completed
            </span>
            <div className="text-xl font-extrabold text-emerald-300 mt-0.5">{metrics.completed}</div>
            <span className="text-[10px] text-emerald-200/80">Consulted</span>
          </div>

          {/* Rescheduled */}
          <div className="bg-purple-500/20 backdrop-blur-xs p-3 rounded-2xl border border-purple-400/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200">
              Rescheduled
            </span>
            <div className="text-xl font-extrabold text-purple-300 mt-0.5">{metrics.rescheduled}</div>
            <span className="text-[10px] text-purple-200/80">Moved slots</span>
          </div>

          {/* Cancelled / No-show */}
          <div className="bg-rose-500/20 backdrop-blur-xs p-3 rounded-2xl border border-rose-400/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-200">
              Cancelled / No-Show
            </span>
            <div className="text-xl font-extrabold text-rose-300 mt-0.5">
              {metrics.cancelled + metrics.noShow}
            </div>
            <span className="text-[10px] text-rose-200/80">
              {metrics.cancelled} can · {metrics.noShow} no-show
            </span>
          </div>
        </div>
      </div>

      {/* SECTION: Doctor Live Availability Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-teal-600" />
              Doctor Real-Time Availability & Schedule
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status, consultation rooms, working hours, and next open appointment slots.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            {doctors.filter((d) => d.status === 'available').length} of {doctors.length} Doctors Available Now
          </span>
        </div>

        {/* Doctor Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {doctors.map((doctor) => (
            <DoctorAvailabilityCard
              key={doctor.id}
              doctor={doctor}
              onBookWithDoctor={(docId) => onOpenBooking(docId)}
            />
          ))}
        </div>
      </div>

      {/* SECTION: Main Appointments Workspace */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Workspace Navigation Tabs */}
        <div className="px-6 pt-5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('today')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'today'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Today's Live Queue</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-teal-100 text-teal-800 font-extrabold">
                {todayAppointments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('upcoming')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'upcoming'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Upcoming Appointments</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-extrabold">
                {upcomingAppointments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('cancelled_rescheduled')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'cancelled_rescheduled'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Cancelled & Rescheduled</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-800 font-extrabold">
                {cancelledOrRescheduled.length}
              </span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by patient name, ID, phone, or token #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Doctor */}
            <select
              value={selectedDoctorFilter}
              onChange={(e) => setSelectedDoctorFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="all">All Doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.specialty})
                </option>
              ))}
            </select>

            {/* Filter by Status */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">Checked In / In Progress</option>
              <option value="completed">Completed</option>
              <option value="rescheduled">Rescheduled</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No-Show</option>
            </select>

            {/* Filter by Time Period */}
            <select
              value={selectedPeriodFilter}
              onChange={(e) => setSelectedPeriodFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="all">All Times</option>
              <option value="Morning">Morning (Before 12 PM)</option>
              <option value="Afternoon">Afternoon (12-5 PM)</option>
              <option value="Evening">Evening (After 5 PM)</option>
            </select>

            {(searchQuery || selectedDoctorFilter !== 'all' || selectedStatusFilter !== 'all' || selectedPeriodFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDoctorFilter('all');
                  setSelectedStatusFilter('all');
                  setSelectedPeriodFilter('all');
                }}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Appointments Table */}
        {sortedList.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">No appointments found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No appointments match your active filter criteria. Try clearing filters or book a new appointment.
            </p>
            <button
              onClick={() => onOpenBooking()}
              className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              + Book New Appointment
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/50 text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  <th className="py-3 px-4">Token / Apt #</th>
                  <th className="py-3 px-4">Patient Information</th>
                  <th className="py-3 px-4">Attending Doctor</th>
                  <th className="py-3 px-4">Date & Time Slot</th>
                  <th className="py-3 px-4">Type & Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {sortedList.map((apt) => {
                  const isTodayApt = apt.date === selectedDate;
                  return (
                    <tr
                      key={apt.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Appointment Token */}
                      <td className="py-3.5 px-4 align-middle">
                        <button
                          onClick={() => onOpenDetails(apt)}
                          className="font-mono text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50/70 hover:bg-teal-100 px-2 py-1 rounded-lg border border-teal-200/60 transition-colors block text-left"
                        >
                          {apt.appointmentNumber}
                        </button>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {apt.durationMinutes} min
                        </span>
                      </td>

                      {/* Patient Information */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{apt.patientName}</span>
                          <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">
                            {apt.patientNumber}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {apt.patientAge} yrs · {apt.patientGender} · {apt.patientPhone}
                        </div>
                        <div className="text-[11px] text-slate-600 truncate max-w-xs mt-0.5 italic">
                          "{apt.reason}"
                        </div>
                      </td>

                      {/* Attending Doctor */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="font-semibold text-slate-900">{apt.doctorName}</div>
                        <div className="text-[11px] text-teal-700 font-medium">
                          {apt.doctorSpecialty}
                        </div>
                      </td>

                      {/* Date & Time Slot */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-teal-600" />
                          <span>{formatTimeSlot(apt.timeSlot)}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {formatDate(apt.date, 'EEE, MMM d, yyyy')}
                        </div>
                      </td>

                      {/* Type & Priority */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex flex-col gap-1 items-start">
                          <AppointmentTypeBadge type={apt.type} />
                          {apt.priority === 'urgent' && (
                            <PriorityBadge priority={apt.priority} />
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 align-middle">
                        <AppointmentStatusBadge status={apt.status} />
                        {apt.status === 'in_progress' && apt.checkedInAt && (
                          <span className="text-[10px] text-amber-700 block mt-0.5">
                            Checked in
                          </span>
                        )}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3.5 px-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Check-In Button (If today and scheduled/confirmed) */}
                          {isTodayApt && (apt.status === 'scheduled' || apt.status === 'confirmed') && (
                            <button
                              onClick={() => handleCheckIn(apt.id)}
                              className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-xs transition-colors"
                              title="Check-In Patient at Front Desk"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* No-Show Button (If today and scheduled/confirmed/in_progress) */}
                          {isTodayApt && (apt.status === 'scheduled' || apt.status === 'confirmed') && (
                            <button
                              onClick={() => handleNoShow(apt.id)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition-colors"
                              title="Mark Patient as No-Show"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Reschedule Button (if active) */}
                          {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                            <button
                              onClick={() => onOpenReschedule(apt)}
                              className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs transition-colors"
                              title="Reschedule Appointment"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Cancel Button (if active) */}
                          {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                            <button
                              onClick={() => onOpenCancel(apt)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs transition-colors"
                              title="Cancel Appointment"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* View Details / Slip */}
                          <button
                            onClick={() => onOpenDetails(apt)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition-colors"
                            title="View Details & Print Token Slip"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
