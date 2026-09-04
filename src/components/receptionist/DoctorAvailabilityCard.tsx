import React from 'react';
import { Clock, MapPin, Calendar, PlusCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { Doctor } from '../../types';
import { DoctorStatusBadge } from '../common/StatusBadge';
import { useClinic } from '../../context/ClinicContext';
import { getNextAvailableSlot, generateDoctorSlots } from '../../utils/availability';
import { formatTimeSlot, formatDate } from '../../utils/dateFormatter';
import { getDay, parseISO } from 'date-fns';

interface DoctorAvailabilityCardProps {
  doctor: Doctor;
  onBookWithDoctor: (doctorId: string) => void;
}

export const DoctorAvailabilityCard: React.FC<DoctorAvailabilityCardProps> = ({
  doctor,
  onBookWithDoctor,
}) => {
  const { appointments, selectedDate } = useClinic();

  // Next available slot calculation
  const nextSlot = React.useMemo(() => {
    return getNextAvailableSlot(doctor, selectedDate, appointments);
  }, [doctor, selectedDate, appointments]);

  // Today's appointments count for this doctor
  const todayAppointments = React.useMemo(() => {
    return appointments.filter(
      (a) => a.doctorId === doctor.id && a.date === selectedDate && a.status !== 'cancelled'
    );
  }, [appointments, doctor.id, selectedDate]);

  // Today's working hours
  const targetDay = getDay(parseISO(selectedDate));
  const schedule = doctor.workingHours[targetDay];
  const isWorkingToday = schedule && schedule.isWorking && !doctor.leaveDates?.includes(selectedDate);

  // Available slots count today
  const availableSlotsToday = React.useMemo(() => {
    if (!isWorkingToday) return 0;
    const slots = generateDoctorSlots(doctor, selectedDate, appointments);
    return slots.filter((s) => s.available).length;
  }, [doctor, selectedDate, appointments, isWorkingToday]);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={doctor.avatar}
                alt={doctor.name}
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-100"
              />
              <DoctorStatusBadge
                status={doctor.status}
                showDotOnly
                className="absolute -bottom-1 -right-1"
              />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-snug">{doctor.name}</h3>
              <p className="text-xs font-semibold text-teal-700">{doctor.specialty}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{doctor.roomNumber}</span>
              </div>
            </div>
          </div>

          <DoctorStatusBadge status={doctor.status} />
        </div>

        {/* Doctor Status Message / Notes */}
        {doctor.statusMessage && (
          <div className="mt-3 p-2 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 italic">
            "{doctor.statusMessage}"
          </div>
        )}

        {/* Quick Operational Metrics */}
        <div className="mt-4 grid grid-cols-2 gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
          <div>
            <span className="text-[10px] text-slate-400 font-medium block">Working Hours</span>
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 text-slate-400" />
              {isWorkingToday ? `${formatTimeSlot(schedule.start)} - ${formatTimeSlot(schedule.end)}` : 'Off Duty'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-medium block">Booked Today</span>
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3 text-teal-600" />
              {todayAppointments.length} Patients ({availableSlotsToday} slots open)
            </span>
          </div>
        </div>

        {/* Next Available Slot */}
        <div className="mt-3.5 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">Earliest Availability:</span>
          {nextSlot ? (
            <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-teal-600" />
              {nextSlot.date === selectedDate ? 'Today' : formatDate(nextSlot.date, 'MMM d')} @ {nextSlot.formattedTime}
            </span>
          ) : (
            <span className="text-slate-400 font-medium flex items-center gap-1 text-[11px]">
              <AlertCircle className="w-3 h-3 text-amber-500" /> No upcoming slots
            </span>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-800">
          ${doctor.consultationFee} <span className="text-[10px] font-normal text-slate-400">/ consult</span>
        </span>
        <button
          onClick={() => onBookWithDoctor(doctor.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-600 hover:text-white text-teal-700 text-xs font-semibold transition-all duration-150 border border-teal-200/80 hover:border-teal-600"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Book Appointment</span>
        </button>
      </div>
    </div>
  );
};
