import React, { useRef } from 'react';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Printer,
  MapPin,
  Phone,
  AlertTriangle,
  History,
  FileCheck,
  CheckCircle2,
  Building2,
  X
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Appointment } from '../../types';
import { AppointmentStatusBadge, PriorityBadge, AppointmentTypeBadge } from '../common/StatusBadge';
import { formatDate, formatTimeSlot, formatDateTime } from '../../utils/dateFormatter';

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onCheckIn?: (appointmentId: string) => void;
  onOpenReschedule?: (appointment: Appointment) => void;
  onOpenCancel?: (appointment: Appointment) => void;
}

export const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onCheckIn,
  onOpenReschedule,
  onOpenCancel,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!appointment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
            {appointment.appointmentNumber}
          </span>
          <span>Appointment Details & Token Slip</span>
        </div>
      }
      subtitle={`Created on ${formatDateTime(appointment.createdAt)}`}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Printable Slip Container */}
        <div
          ref={printRef}
          className="printable-slip bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-5"
        >
          {/* Clinic Brand Slip Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  CareDesk Medical Clinic
                </h2>
                <p className="text-xs text-slate-500">
                  St. Jude Healthcare Complex · Phone: (555) 019-2831
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-bold text-slate-900 uppercase">Token / Slip</div>
              <div className="text-lg font-black text-teal-700 font-mono tracking-wider">
                {appointment.appointmentNumber}
              </div>
            </div>
          </div>

          {/* Status & Timing Highlight */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Scheduled Slot
              </span>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>{formatDate(appointment.date, 'EEEE, MMMM d, yyyy')}</span>
                <span>·</span>
                <Clock className="w-4 h-4 text-teal-600" />
                <span>{formatTimeSlot(appointment.timeSlot)} ({appointment.durationMinutes} min)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <AppointmentTypeBadge type={appointment.type} />
              <PriorityBadge priority={appointment.priority} />
              <AppointmentStatusBadge status={appointment.status} />
            </div>
          </div>

          {/* Patient & Doctor Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Patient Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-teal-600" /> Patient Information
                </span>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                  {appointment.patientNumber}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">{appointment.patientName}</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {appointment.patientAge} Years · {appointment.patientGender}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-2 font-mono">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{appointment.patientPhone}</span>
              </div>
            </div>

            {/* Doctor Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5 text-teal-600" /> Attending Physician
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">{appointment.doctorName}</h4>
              <p className="text-xs text-teal-700 font-semibold mt-0.5">
                {appointment.doctorSpecialty}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Consultation Room / OPD Suite</span>
              </div>
            </div>
          </div>

          {/* Visit Reason & Symptoms */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Primary Reason for Visit
              </span>
              <p className="text-xs font-semibold text-slate-800 mt-0.5">{appointment.reason}</p>
            </div>
            {appointment.symptoms && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Reported Symptoms / Notes
                </span>
                <p className="text-xs text-slate-600 mt-0.5">{appointment.symptoms}</p>
              </div>
            )}
          </div>

          {/* Clinical Notes (If Completed) */}
          {appointment.clinicalNotes && (
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" /> Clinical Notes & Diagnosis
                </span>
                <span className="text-[10px] text-emerald-600">
                  Recorded by {appointment.clinicalNotes.doctorName}
                </span>
              </div>

              {appointment.clinicalNotes.diagnosis && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700">Diagnosis</span>
                  <p className="text-xs font-medium text-slate-800 mt-0.5">
                    {appointment.clinicalNotes.diagnosis}
                  </p>
                </div>
              )}

              {appointment.clinicalNotes.prescription && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700">Prescription</span>
                  <p className="text-xs font-medium text-slate-800 mt-0.5 whitespace-pre-line">
                    {appointment.clinicalNotes.prescription}
                  </p>
                </div>
              )}

              {appointment.clinicalNotes.advice && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700">Advice</span>
                  <p className="text-xs font-medium text-slate-800 mt-0.5">
                    {appointment.clinicalNotes.advice}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Reschedule History (If Any) */}
          {appointment.rescheduleHistory && appointment.rescheduleHistory.length > 0 && (
            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
              <span className="text-xs font-bold text-purple-800 flex items-center gap-1.5">
                <History className="w-4 h-4 text-purple-600" /> Rescheduling History
              </span>
              <div className="space-y-1.5">
                {appointment.rescheduleHistory.map((hist, i) => (
                  <div key={i} className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-purple-100">
                    <div className="font-semibold text-purple-900">
                      Moved from {formatDate(hist.fromDate)} {formatTimeSlot(hist.fromSlot)} →{' '}
                      {formatDate(hist.toDate)} {formatTimeSlot(hist.toSlot)}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">Reason: {hist.reason}</p>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      By {hist.rescheduledBy} on {formatDateTime(hist.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cancellation Info (If Cancelled) */}
          {appointment.status === 'cancelled' && (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 text-xs">
              <span className="font-bold text-rose-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" /> Cancellation Details
              </span>
              <p className="text-rose-700 font-medium mt-1">
                Reason: {appointment.cancellationReason || 'Cancelled by staff'}
              </p>
              {appointment.cancelledBy && (
                <span className="text-[10px] text-rose-500 mt-0.5 block">
                  Cancelled by {appointment.cancelledBy} on{' '}
                  {appointment.cancelledAt ? formatDateTime(appointment.cancelledAt) : ''}
                </span>
              )}
            </div>
          )}

          {/* Patient Instructions Footer on Slip */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
            <span>Please arrive 10 minutes prior to consultation time.</span>
            <span>Valid for OPD Entry</span>
          </div>
        </div>

        {/* Modal Bottom Action Bar (Screen Only) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Print Slip Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Appointment Slip</span>
          </button>

          {/* State Actions */}
          <div className="flex items-center gap-2">
            {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
              <>
                {appointment.status !== 'in_progress' && onCheckIn && (
                  <button
                    onClick={() => {
                      onCheckIn(appointment.id);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Check-In Patient</span>
                  </button>
                )}

                {onOpenReschedule && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenReschedule(appointment);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-colors"
                  >
                    Reschedule
                  </button>
                )}

                {onOpenCancel && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCancel(appointment);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
