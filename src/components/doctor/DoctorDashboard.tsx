import React, { useState, useMemo } from 'react';
import {
  Stethoscope,
  UserCheck,
  CheckCircle2,
  Clock,
  Calendar,
  FileText,
  AlertCircle,
  Eye,
  Activity,
  MapPin,
  Pill,
  History,
  Phone,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useClinic } from '../../context/ClinicContext';
import { Appointment, DoctorStatus } from '../../types';
import { DoctorStatusBadge, AppointmentStatusBadge, PriorityBadge, AppointmentTypeBadge } from '../common/StatusBadge';
import { ConsultationNotesModal } from './ConsultationNotesModal';
import { AppointmentDetailsModal } from '../receptionist/AppointmentDetailsModal';
import { formatDate, formatTimeSlot } from '../../utils/dateFormatter';

export const DoctorDashboard: React.FC = () => {
  const { currentDoctor } = useAuth();
  const { appointments, selectedDate, updateDoctorStatus, updateAppointmentStatus } = useClinic();

  const [activeNotesApt, setActiveNotesApt] = useState<Appointment | null>(null);
  const [activeDetailsApt, setActiveDetailsApt] = useState<Appointment | null>(null);
  const [customStatusMessage, setCustomStatusMessage] = useState(currentDoctor?.statusMessage || '');
  const [isEditingStatusMsg, setIsEditingStatusMsg] = useState(false);

  // Sync status message
  React.useEffect(() => {
    if (currentDoctor) {
      setCustomStatusMessage(currentDoctor.statusMessage || '');
    }
  }, [currentDoctor]);

  // Today's appointments for this doctor
  const doctorAppointments = useMemo(() => {
    if (!currentDoctor) return [];
    return appointments.filter(
      (a) => a.doctorId === currentDoctor.id && a.date === selectedDate && a.status !== 'cancelled'
    );
  }, [appointments, currentDoctor, selectedDate]);

  // Chronologically sorted
  const sortedAppointments = useMemo(() => {
    return [...doctorAppointments].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
  }, [doctorAppointments]);

  // Current In-Progress Patient (active consultation)
  const currentConsultation = useMemo(() => {
    return sortedAppointments.find((a) => a.status === 'in_progress');
  }, [sortedAppointments]);

  // Next in queue (scheduled or confirmed)
  const upcomingQueue = useMemo(() => {
    return sortedAppointments.filter(
      (a) => a.status === 'confirmed' || a.status === 'scheduled'
    );
  }, [sortedAppointments]);

  // Completed today
  const completedToday = useMemo(() => {
    return sortedAppointments.filter((a) => a.status === 'completed');
  }, [sortedAppointments]);

  if (!currentDoctor) return null;

  // Handle Availability Change
  const handleStatusChange = (newStatus: DoctorStatus) => {
    updateDoctorStatus(currentDoctor.id, newStatus, customStatusMessage, currentDoctor.name);
  };

  const handleSaveStatusMessage = (e: React.FormEvent) => {
    e.preventDefault();
    updateDoctorStatus(currentDoctor.id, currentDoctor.status, customStatusMessage, currentDoctor.name);
    setIsEditingStatusMsg(false);
  };

  // Start consultation for a patient
  const handleStartConsultation = (appointmentId: string) => {
    updateAppointmentStatus(appointmentId, 'in_progress', currentDoctor.name, 'Doctor');
    updateDoctorStatus(currentDoctor.id, 'in_consultation', 'Consulting with patient', currentDoctor.name);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Doctor Profile & Live Status Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentDoctor.avatar}
                alt={currentDoctor.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-100 shadow-sm"
              />
              <DoctorStatusBadge
                status={currentDoctor.status}
                showDotOnly
                className="absolute -bottom-1 -right-1 w-3.5 h-3.5"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {currentDoctor.name}
                </h1>
                <DoctorStatusBadge status={currentDoctor.status} />
              </div>
              <p className="text-xs font-semibold text-teal-700">{currentDoctor.qualification}</p>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {currentDoctor.roomNumber}
                </span>
                <span>·</span>
                <span className="font-semibold text-slate-700">
                  {formatDate(selectedDate, 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
            </div>
          </div>

          {/* Real-time Status Switcher */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase px-2">Set Status:</span>
            {(['available', 'in_consultation', 'on_break', 'on_leave', 'unavailable'] as DoctorStatus[]).map(
              (st) => {
                const isCurrent = currentDoctor.status === st;
                return (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                      isCurrent
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Doctor Status Message / Notes */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {isEditingStatusMsg ? (
            <form onSubmit={handleSaveStatusMessage} className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={customStatusMessage}
                onChange={(e) => setCustomStatusMessage(e.target.value)}
                placeholder="e.g. In minor procedure until 11:30 AM / Taking OPD walk-ins"
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditingStatusMsg(false)}
                className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2 text-slate-600">
              <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
              <span className="font-medium">Status Note:</span>
              <span className="italic text-slate-700">
                "{currentDoctor.statusMessage || 'Available in consultation suite'}"
              </span>
              <button
                onClick={() => setIsEditingStatusMsg(true)}
                className="text-[11px] text-teal-600 hover:underline font-semibold ml-2"
              >
                Edit Note
              </button>
            </div>
          )}

          <div className="text-slate-400 text-[11px] hidden sm:block">
            {sortedAppointments.length} Total Patients Scheduled Today
          </div>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Today's Total</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
            {sortedAppointments.length}
          </div>
          <span className="text-[11px] text-slate-500">Patients booked</span>
        </div>

        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-amber-800 block">In Waiting Room</span>
          <div className="text-2xl font-extrabold text-amber-900 mt-0.5">
            {upcomingQueue.length}
          </div>
          <span className="text-[11px] text-amber-700">Next in line</span>
        </div>

        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-emerald-800 block">Completed</span>
          <div className="text-2xl font-extrabold text-emerald-900 mt-0.5">
            {completedToday.length}
          </div>
          <span className="text-[11px] text-emerald-700">Consultations finished</span>
        </div>

        <div className="bg-teal-50 p-4 rounded-2xl border border-teal-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-teal-800 block">Current Status</span>
          <div className="text-base font-extrabold text-teal-900 mt-1 capitalize truncate">
            {currentDoctor.status.replace('_', ' ')}
          </div>
          <span className="text-[11px] text-teal-700">Slot duration: {currentDoctor.slotDuration} min</span>
        </div>
      </div>

      {/* ACTIVE CONSULTATION CARD (If any patient is in progress) */}
      {currentConsultation ? (
        <div className="p-6 bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50/20 rounded-3xl border-2 border-amber-400 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Active Consultation in Progress
              </span>
            </div>
            <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
              {currentConsultation.appointmentNumber}
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {currentConsultation.patientName}{' '}
                <span className="text-xs font-normal text-slate-500">
                  ({currentConsultation.patientNumber}) · {currentConsultation.patientAge}y ·{' '}
                  {currentConsultation.patientGender}
                </span>
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                <span className="font-semibold text-slate-800">
                  Scheduled Time: {formatTimeSlot(currentConsultation.timeSlot)}
                </span>
                <span>·</span>
                <span>Type: {currentConsultation.type.replace('_', ' ')}</span>
                <span>·</span>
                <span className="font-mono text-slate-500">{currentConsultation.patientPhone}</span>
              </div>
              <p className="text-xs text-slate-700 mt-2 font-medium bg-white/80 p-2.5 rounded-xl border border-amber-200">
                <strong>Chief Complaint:</strong> {currentConsultation.reason}
                {currentConsultation.symptoms && (
                  <span className="block text-slate-500 mt-0.5">
                    <strong>Symptoms:</strong> {currentConsultation.symptoms}
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-col gap-2 flex-shrink-0">
              <button
                onClick={() => setActiveNotesApt(currentConsultation)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/30 transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>Write Rx & Complete</span>
              </button>
              <button
                onClick={() => setActiveDetailsApt(currentConsultation)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold"
              >
                View Patient History
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3 text-slate-600 text-xs">
            <UserCheck className="w-5 h-5 text-teal-600" />
            <span>No patient currently in consultation room. Select next patient from queue below.</span>
          </div>
          {upcomingQueue.length > 0 && (
            <button
              onClick={() => handleStartConsultation(upcomingQueue[0].id)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              Call Next Patient ({upcomingQueue[0].patientName})
            </button>
          )}
        </div>
      )}

      {/* UP NEXT PATIENT QUEUE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              Today's Patient Queue ({upcomingQueue.length} Pending)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Patients scheduled for today. Click "Start Consultation" when ready to examine.
            </p>
          </div>
        </div>

        {upcomingQueue.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No upcoming patients in queue for today.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {upcomingQueue.map((apt, index) => (
              <div
                key={apt.id}
                className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{apt.patientName}</span>
                      <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {apt.patientNumber}
                      </span>
                      <PriorityBadge priority={apt.priority} />
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 mt-1">
                      <span>{apt.patientAge}y · {apt.patientGender}</span>
                      <span>·</span>
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-teal-600" />
                        {formatTimeSlot(apt.timeSlot)}
                      </span>
                      <span>·</span>
                      <AppointmentTypeBadge type={apt.type} />
                    </div>
                    <p className="text-slate-600 mt-1 italic">"{apt.reason}"</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleStartConsultation(apt.id)}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    Start Consultation
                  </button>
                  <button
                    onClick={() => setActiveDetailsApt(apt)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* COMPLETED CONSULTATIONS TODAY */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Completed Consultations Today ({completedToday.length})
          </h3>
        </div>

        {completedToday.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No consultations completed yet today.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {completedToday.map((apt) => (
              <div key={apt.id} className="p-4 hover:bg-slate-50 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{apt.patientName}</span>
                    <span className="text-[11px] text-slate-500 font-mono">({apt.patientNumber})</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold border border-emerald-200">
                      Completed at {formatTimeSlot(apt.timeSlot)}
                    </span>
                  </div>
                  {apt.clinicalNotes && (
                    <div className="mt-1.5 p-2 bg-emerald-50/60 rounded-lg border border-emerald-100 text-slate-700">
                      <strong>Diagnosis:</strong> {apt.clinicalNotes.diagnosis}
                      {apt.clinicalNotes.prescription && (
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          <strong>Rx:</strong> {apt.clinicalNotes.prescription}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setActiveDetailsApt(apt)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 self-start md:self-auto"
                >
                  View Summary Slip
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Consultation Modal */}
      {activeNotesApt && (
        <ConsultationNotesModal
          isOpen={!!activeNotesApt}
          onClose={() => setActiveNotesApt(null)}
          appointment={activeNotesApt}
          onSuccess={() => {
            updateDoctorStatus(currentDoctor.id, 'available', 'Consultation finished; ready for next', currentDoctor.name);
          }}
        />
      )}

      {/* Appointment Details Slip Modal */}
      {activeDetailsApt && (
        <AppointmentDetailsModal
          isOpen={!!activeDetailsApt}
          onClose={() => setActiveDetailsApt(null)}
          appointment={activeDetailsApt}
        />
      )}
    </div>
  );
};
