import React, { useState } from 'react';
import { AlertTriangle, XCircle, Clock, Calendar, Stethoscope, User } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useClinic } from '../../context/ClinicContext';
import { useAuth } from '../../context/AuthContext';
import { Appointment } from '../../types';
import { formatDate, formatTimeSlot } from '../../utils/dateFormatter';

interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess?: () => void;
}

export const CancelModal: React.FC<CancelModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onSuccess,
}) => {
  const { cancelAppointment } = useClinic();
  const { role, receptionistName, currentDoctor } = useAuth();

  const [selectedPresetReason, setSelectedPresetReason] = useState<string>('Patient Requested');
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!appointment) return null;

  const handleCancel = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const fullReason =
      selectedPresetReason === 'Other'
        ? customReason.trim() || 'No specific reason provided'
        : customReason.trim()
        ? `${selectedPresetReason}: ${customReason.trim()}`
        : selectedPresetReason;

    const actorName = role === 'receptionist' ? receptionistName : currentDoctor?.name || 'Doctor';
    const actorRole = role === 'receptionist' ? 'Receptionist' : 'Doctor';

    cancelAppointment({
      appointmentId: appointment.id,
      reason: fullReason,
      actorName,
      actorRole,
    });

    setIsSubmitting(false);
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-rose-700">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <span>Cancel Appointment</span>
        </div>
      }
      subtitle={`Appointment #${appointment.appointmentNumber}`}
      maxWidth="md"
    >
      <form onSubmit={handleCancel} className="space-y-4">
        {/* Appointment details banner */}
        <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900">{appointment.patientName}</span>
            <span className="text-[11px] text-slate-500 font-mono">{appointment.patientNumber}</span>
          </div>
          <div className="text-slate-600 flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-rose-600" />
            <span>{appointment.doctorName} ({appointment.doctorSpecialty})</span>
          </div>
          <div className="text-rose-800 font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatDate(appointment.date)} · {formatTimeSlot(appointment.timeSlot)}</span>
          </div>
        </div>

        {/* Warning notification about automatic slot freeing */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Automatic Schedule Update:</strong>
            Cancelling will immediately release this time slot so it becomes instantly available for other patients.
          </div>
        </div>

        {/* Cancellation Reason Dropdown */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Reason for Cancellation <span className="text-rose-500">*</span>
          </label>
          <select
            value={selectedPresetReason}
            onChange={(e) => setSelectedPresetReason(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          >
            <option value="Patient Requested">Patient Requested / Cannot attend</option>
            <option value="Doctor Unavailable / Emergency Leave">Doctor Unavailable / Emergency Leave</option>
            <option value="Transferred to Emergency Care Ward">Transferred to Emergency Care Ward</option>
            <option value="Duplicate Booking">Duplicate Booking</option>
            <option value="Insurance / Pre-auth Issue">Insurance / Pre-auth Issue</option>
            <option value="Other">Other / Specific Reason</option>
          </select>
        </div>

        {/* Custom Notes */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Additional Details / Notes
          </label>
          <textarea
            rows={2}
            placeholder="Add relevant context for clinic audit log..."
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Keep Appointment
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition-all"
          >
            <XCircle className="w-4 h-4" />
            <span>Confirm Cancellation</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
