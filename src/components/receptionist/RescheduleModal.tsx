import React, { useState, useMemo, useEffect } from 'react';
import {
  Clock,
  Calendar as CalendarIcon,
  AlertCircle,
  ArrowRight,
  User,
  Stethoscope,
  CheckCircle2,
  FileEdit,
  Search
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useClinic } from '../../context/ClinicContext';
import { useAuth } from '../../context/AuthContext';
import { Appointment } from '../../types';
import { generateDoctorSlots } from '../../utils/availability';
import { formatDate, formatTimeSlot, getTimePeriod } from '../../utils/dateFormatter';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess?: () => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onSuccess,
}) => {
  const { doctors, appointments, rescheduleAppointment, selectedDate } = useClinic();
  const { role, receptionistName, currentDoctor } = useAuth();

  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(appointment);
  const [searchQuery, setSearchQuery] = useState('');
  const [newDate, setNewDate] = useState<string>(selectedDate || '2026-09-07');
  const [newSlot, setNewSlot] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setActiveAppointment(appointment);
    if (appointment) {
      setNewDate(appointment.date);
    }
    setNewSlot('');
    setReason('');
    setErrorMessage(null);
  }, [appointment, isOpen]);

  // If no appointment was pre-passed, allow search among active appointments
  const filteredAppointments = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return appointments.filter(
      (a) =>
        a.status !== 'cancelled' &&
        (a.appointmentNumber.toLowerCase().includes(q) ||
          a.patientName.toLowerCase().includes(q) ||
          a.patientNumber.toLowerCase().includes(q))
    );
  }, [appointments, searchQuery]);

  const doctor = useMemo(() => {
    if (!activeAppointment) return null;
    return doctors.find((d) => d.id === activeAppointment.doctorId) || null;
  }, [doctors, activeAppointment]);

  // Calculate available slots for the selected new date (excluding the active appointment)
  const availableSlots = useMemo(() => {
    if (!doctor || !newDate) return [];
    return generateDoctorSlots(doctor, newDate, appointments, activeAppointment?.id);
  }, [doctor, newDate, appointments, activeAppointment]);

  const groupedSlots = useMemo(() => {
    const morning = availableSlots.filter((s) => getTimePeriod(s.time) === 'Morning');
    const afternoon = availableSlots.filter((s) => getTimePeriod(s.time) === 'Afternoon');
    const evening = availableSlots.filter((s) => getTimePeriod(s.time) === 'Evening');
    return { morning, afternoon, evening };
  }, [availableSlots]);

  const handleReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!activeAppointment) {
      setErrorMessage('Please select an appointment to reschedule.');
      return;
    }
    if (!newDate) {
      setErrorMessage('Please select a new date.');
      return;
    }
    if (!newSlot) {
      setErrorMessage('Please choose an available time slot.');
      return;
    }
    if (newDate === activeAppointment.date && newSlot === activeAppointment.timeSlot) {
      setErrorMessage('The new appointment date and time must be different from current slot.');
      return;
    }
    if (!reason.trim()) {
      setErrorMessage('Please enter a reason for rescheduling.');
      return;
    }

    setIsSubmitting(true);
    const actorName = role === 'receptionist' ? receptionistName : currentDoctor?.name || 'Doctor';
    const actorRole = role === 'receptionist' ? 'Receptionist' : 'Doctor';

    const res = rescheduleAppointment({
      appointmentId: activeAppointment.id,
      newDate,
      newTimeSlot: newSlot,
      reason: reason.trim(),
      actorName,
      actorRole,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to reschedule appointment.');
      return;
    }

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-slate-900">
          <Clock className="w-5 h-5 text-purple-600" />
          <span>Reschedule Appointment</span>
        </div>
      }
      subtitle="Safely move appointment to a conflict-free time slot"
      maxWidth="2xl"
    >
      <form onSubmit={handleReschedule} className="space-y-5">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* If no appointment selected yet, allow search */}
        {!activeAppointment && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <label className="text-xs font-bold text-slate-700">Find Appointment to Reschedule</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Patient Name, ID, or Appointment #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>
            {filteredAppointments.length > 0 && (
              <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 max-h-48 overflow-y-auto">
                {filteredAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    onClick={() => setActiveAppointment(apt)}
                    className="p-3 hover:bg-purple-50 cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{apt.patientName}</span>{' '}
                      <span className="text-slate-400">({apt.appointmentNumber})</span>
                      <p className="text-[11px] text-slate-500">
                        {apt.doctorName} · {formatDate(apt.date)} at {formatTimeSlot(apt.timeSlot)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-lg bg-purple-600 text-white font-semibold text-[11px]"
                    >
                      Select
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Active Appointment Summary Banner */}
        {activeAppointment && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50/50 border border-purple-200/80">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                  Current Scheduled Slot
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                  {activeAppointment.patientName}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    ({activeAppointment.patientNumber})
                  </span>
                </h4>
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-600">
                  <span className="flex items-center gap-1 font-medium">
                    <Stethoscope className="w-3.5 h-3.5 text-purple-600" />
                    {activeAppointment.doctorName} ({activeAppointment.doctorSpecialty})
                  </span>
                  <span>·</span>
                  <span className="font-bold text-purple-800 bg-purple-100/80 px-2 py-0.5 rounded">
                    {formatDate(activeAppointment.date, 'EEE, MMM d, yyyy')} @{' '}
                    {formatTimeSlot(activeAppointment.timeSlot)}
                  </span>
                </div>
              </div>
              {!appointment && (
                <button
                  type="button"
                  onClick={() => setActiveAppointment(null)}
                  className="text-xs text-purple-700 hover:underline font-semibold"
                >
                  Change
                </button>
              )}
            </div>
          </div>
        )}

        {/* New Date & Slot Section */}
        {activeAppointment && doctor && (
          <>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-purple-600" />
                Select New Date <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => {
                    setNewDate(e.target.value);
                    setNewSlot('');
                  }}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer"
                />
                <span className="text-xs text-slate-500 font-medium">
                  {formatDate(newDate, 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
            </div>

            {/* Available Slots Grid */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-purple-600" />
                Select New Time Slot <span className="text-rose-500">*</span>
              </label>

              {availableSlots.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                  No working hours or doctor is on leave on this date.
                </div>
              ) : (
                <div className="space-y-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200 max-h-48 overflow-y-auto">
                  {groupedSlots.morning.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Morning</div>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {groupedSlots.morning.map((slot) => {
                          const isSelected = newSlot === slot.time;
                          return (
                            <button
                              type="button"
                              key={slot.time}
                              disabled={!slot.available}
                              onClick={() => setNewSlot(slot.time)}
                              className={`p-2 rounded-xl text-xs font-semibold transition-all ${
                                isSelected
                                  ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-600'
                                  : slot.available
                                  ? 'bg-white text-purple-900 border border-purple-200 hover:bg-purple-50'
                                  : 'bg-slate-100 text-slate-400 line-through cursor-not-allowed opacity-60'
                              }`}
                            >
                              {slot.formattedTime}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {groupedSlots.afternoon.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Afternoon</div>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {groupedSlots.afternoon.map((slot) => {
                          const isSelected = newSlot === slot.time;
                          return (
                            <button
                              type="button"
                              key={slot.time}
                              disabled={!slot.available}
                              onClick={() => setNewSlot(slot.time)}
                              className={`p-2 rounded-xl text-xs font-semibold transition-all ${
                                isSelected
                                  ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-600'
                                  : slot.available
                                  ? 'bg-white text-purple-900 border border-purple-200 hover:bg-purple-50'
                                  : 'bg-slate-100 text-slate-400 line-through cursor-not-allowed opacity-60'
                              }`}
                            >
                              {slot.formattedTime}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {groupedSlots.evening.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Evening</div>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {groupedSlots.evening.map((slot) => {
                          const isSelected = newSlot === slot.time;
                          return (
                            <button
                              type="button"
                              key={slot.time}
                              disabled={!slot.available}
                              onClick={() => setNewSlot(slot.time)}
                              className={`p-2 rounded-xl text-xs font-semibold transition-all ${
                                isSelected
                                  ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-600'
                                  : slot.available
                                  ? 'bg-white text-purple-900 border border-purple-200 hover:bg-purple-50'
                                  : 'bg-slate-100 text-slate-400 line-through cursor-not-allowed opacity-60'
                              }`}
                            >
                              {slot.formattedTime}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {newSlot && (
                <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-xs font-semibold text-purple-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  <span>
                    New Slot Selected: {formatDate(newDate, 'MMM d, yyyy')} @ {formatTimeSlot(newSlot)}
                  </span>
                </div>
              )}
            </div>

            {/* Reason for Reschedule */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileEdit className="w-4 h-4 text-purple-600" />
                Reason for Rescheduling <span className="text-rose-500">*</span>
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value !== 'Other') {
                    setReason(e.target.value);
                  } else {
                    setReason('');
                  }
                }}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs mb-2"
              >
                <option value="">-- Choose common reason or type below --</option>
                <option value="Patient requested alternative date/time">
                  Patient requested alternative date/time
                </option>
                <option value="Doctor schedule emergency / surgery conflict">
                  Doctor schedule emergency / surgery conflict
                </option>
                <option value="Transportation / traffic delay reported by patient">
                  Transportation / traffic delay reported by patient
                </option>
                <option value="Medical report pending before consultation">
                  Medical report pending before consultation
                </option>
                <option value="Other">Other reason...</option>
              </select>
              <textarea
                required
                rows={2}
                placeholder="Specify reason for audit trail..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !activeAppointment || !newSlot || !reason.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all"
          >
            <span>Confirm Reschedule</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </Modal>
  );
};
