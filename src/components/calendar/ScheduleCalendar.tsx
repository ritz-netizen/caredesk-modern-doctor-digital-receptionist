import React, { useState, useMemo } from 'react';
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  isSameDay,
  parseISO,
  getDay
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Coffee,
  CalendarOff,
  Stethoscope,
  Filter
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { Appointment, Doctor } from '../../types';
import { AppointmentStatusBadge, PriorityBadge } from '../common/StatusBadge';
import { AppointmentDetailsModal } from '../receptionist/AppointmentDetailsModal';
import { formatTimeSlot, formatDate } from '../../utils/dateFormatter';

type CalendarViewMode = 'day' | 'week' | 'month';

export const ScheduleCalendar: React.FC = () => {
  const { appointments, doctors, selectedDate, setSelectedDate } = useClinic();

  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const [currentDate, setCurrentDate] = useState<Date>(() => parseISO(selectedDate || '2026-09-05'));
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);

  // Sync when selectedDate changes externally
  React.useEffect(() => {
    if (selectedDate) {
      setCurrentDate(parseISO(selectedDate));
    }
  }, [selectedDate]);

  // Navigate dates
  const handlePrev = () => {
    if (viewMode === 'day') setCurrentDate((d) => subDays(d, 1));
    else if (viewMode === 'week') setCurrentDate((d) => subDays(d, 7));
    else if (viewMode === 'month') setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const handleNext = () => {
    if (viewMode === 'day') setCurrentDate((d) => addDays(d, 1));
    else if (viewMode === 'week') setCurrentDate((d) => addDays(d, 7));
    else if (viewMode === 'month') setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = parseISO('2026-09-05');
    setCurrentDate(today);
    setSelectedDate('2026-09-05');
  };

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (selectedDoctorId !== 'all' && a.doctorId !== selectedDoctorId) return false;
      return true;
    });
  }, [appointments, selectedDoctorId]);

  // Selected doctor object if single doctor selected
  const activeDoctor = useMemo(() => {
    if (selectedDoctorId === 'all') return null;
    return doctors.find((d) => d.id === selectedDoctorId) || null;
  }, [doctors, selectedDoctorId]);

  // Week days interval
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Month days interval
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  // Day Hours: 08:00 to 18:00
  const dayHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

  return (
    <div className="space-y-5 pb-12">
      {/* Top Controls Header */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Navigation & Date Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 text-xs font-bold text-slate-700 hover:text-teal-700 hover:bg-white rounded-xl transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
            {viewMode === 'day' && format(currentDate, 'EEEE, MMMM d, yyyy')}
            {viewMode === 'week' &&
              `Week of ${format(weekDays[0], 'MMM d')} – ${format(weekDays[6], 'MMM d, yyyy')}`}
            {viewMode === 'month' && format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>

        {/* Right: Doctor Filter & View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Doctor Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Doctors Schedule</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.specialty})
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl">
            {(['day', 'week', 'month'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                  viewMode === mode
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode} View
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* VIEW 1: DAY VIEW (Hourly Timeline) */}
      {viewMode === 'day' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Hourly Schedule for {format(currentDate, 'EEEE, MMMM d, yyyy')}
            </span>
            {activeDoctor && (
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                {activeDoctor.name} · {activeDoctor.specialty} · {activeDoctor.roomNumber}
              </span>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {dayHours.map((hour) => {
              const hourStr = String(hour).padStart(2, '0');
              const dateStr = format(currentDate, 'yyyy-MM-dd');

              // Appointments in this hour
              const slotAppointments = filteredAppointments.filter((a) => {
                if (a.date !== dateStr) return false;
                const aptHour = parseInt(a.timeSlot.split(':')[0], 10);
                return aptHour === hour;
              });

              // Check if doctor has break in this hour
              const isBreakHour =
                activeDoctor?.breakTimes?.some((b) => {
                  const bHour = parseInt(b.start.split(':')[0], 10);
                  return bHour === hour;
                }) || false;

              return (
                <div key={hour} className="flex min-h-[80px] group hover:bg-slate-50/50">
                  {/* Time label */}
                  <div className="w-20 sm:w-24 p-3 border-r border-slate-100 flex-shrink-0 text-right">
                    <span className="text-xs font-bold text-slate-500">
                      {formatTimeSlot(`${hourStr}:00`)}
                    </span>
                  </div>

                  {/* Slot content */}
                  <div className="flex-1 p-2 space-y-2">
                    {isBreakHour && (
                      <div className="p-2 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-700 flex items-center gap-2">
                        <Coffee className="w-3.5 h-3.5" />
                        <span className="font-semibold">Doctor Break / Lunch Hour</span>
                      </div>
                    )}

                    {slotAppointments.length === 0 && !isBreakHour ? (
                      <div className="h-full flex items-center text-slate-300 text-xs pl-2 italic">
                        Available Slot
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {slotAppointments.map((apt) => (
                          <div
                            key={apt.id}
                            onClick={() => setActiveAppointment(apt)}
                            className="p-2.5 rounded-xl border bg-white shadow-2xs hover:shadow-md cursor-pointer transition-all border-slate-200 hover:border-teal-400 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-2">
                                <span>{apt.patientName}</span>
                                <span className="text-[10px] text-teal-700 font-mono font-normal">
                                  {apt.appointmentNumber}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                                <span className="font-semibold text-slate-700">
                                  {formatTimeSlot(apt.timeSlot)}
                                </span>
                                <span>·</span>
                                <span>{apt.doctorName}</span>
                              </div>
                            </div>
                            <AppointmentStatusBadge status={apt.status} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: WEEK VIEW (7-Day Matrix) */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-200 divide-x divide-slate-200 bg-slate-50">
            {weekDays.map((day) => {
              const isToday = isSameDay(day, parseISO('2026-09-05'));
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayAppointments = filteredAppointments.filter(
                (a) => a.date === dateStr && a.status !== 'cancelled'
              );

              return (
                <div
                  key={dateStr}
                  onClick={() => {
                    setSelectedDate(dateStr);
                    setCurrentDate(day);
                  }}
                  className={`p-3 text-center cursor-pointer transition-colors ${
                    isToday ? 'bg-teal-50/80' : 'hover:bg-slate-100'
                  }`}
                >
                  <span className="text-[11px] font-bold uppercase text-slate-400 block">
                    {format(day, 'EEE')}
                  </span>
                  <div
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold mt-0.5 ${
                      isToday ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-800'
                    }`}
                  >
                    {format(day, 'd')}
                  </div>
                  <div className="mt-1 text-[10px] font-semibold text-teal-700">
                    {dayAppointments.length} Booked
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-7 divide-x divide-slate-100 min-h-[450px]">
            {weekDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayAppointments = filteredAppointments.filter((a) => a.date === dateStr);
              const dayOfWeek = getDay(day);

              // Check if doctor is on leave
              const isDoctorOnLeave = activeDoctor?.leaveDates?.includes(dateStr);
              const isWorkingDay = activeDoctor ? activeDoctor.workingHours[dayOfWeek]?.isWorking : true;

              return (
                <div key={dateStr} className="p-2 space-y-2 bg-slate-50/20">
                  {isDoctorOnLeave && (
                    <div className="p-2 bg-purple-50 border border-purple-200 rounded-xl text-[10px] font-bold text-purple-700 text-center">
                      <CalendarOff className="w-3.5 h-3.5 mx-auto mb-0.5" />
                      Doctor on Leave
                    </div>
                  )}

                  {!isWorkingDay && (
                    <div className="p-2 bg-slate-100 rounded-xl text-[10px] font-medium text-slate-400 text-center">
                      Day Off
                    </div>
                  )}

                  {dayAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => setActiveAppointment(apt)}
                      className="p-2 bg-white rounded-xl border border-slate-200 hover:border-teal-400 shadow-2xs hover:shadow-xs cursor-pointer transition-all text-xs"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-slate-800 truncate">{apt.patientName}</span>
                        <span className="text-[10px] font-bold text-teal-700 flex-shrink-0">
                          {formatTimeSlot(apt.timeSlot)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {apt.doctorName.replace('Dr. ', '')}
                      </div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <AppointmentStatusBadge status={apt.status} className="text-[9px] px-1.5 py-0" />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 text-center bg-slate-50 py-2.5 text-xs font-bold text-slate-500">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
            {monthDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, parseISO('2026-09-05'));
              const dayAppointments = filteredAppointments.filter(
                (a) => a.date === dateStr && a.status !== 'cancelled'
              );

              return (
                <div
                  key={dateStr}
                  onClick={() => {
                    setSelectedDate(dateStr);
                    setCurrentDate(day);
                    setViewMode('day'); // Click day jumps to day timeline!
                  }}
                  className={`min-h-[110px] p-2 cursor-pointer transition-colors ${
                    !isCurrentMonth ? 'bg-slate-50/50 text-slate-300' : 'bg-white hover:bg-teal-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isToday
                          ? 'bg-teal-600 text-white'
                          : isCurrentMonth
                          ? 'text-slate-700'
                          : 'text-slate-300'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    {dayAppointments.length > 0 && (
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-full">
                        {dayAppointments.length} apt
                      </span>
                    )}
                  </div>

                  <div className="mt-1 space-y-1">
                    {dayAppointments.slice(0, 2).map((apt) => (
                      <div
                        key={apt.id}
                        className="truncate text-[10px] font-medium text-slate-700 bg-slate-100/80 px-1.5 py-0.5 rounded"
                      >
                        {formatTimeSlot(apt.timeSlot)} · {apt.patientName}
                      </div>
                    ))}
                    {dayAppointments.length > 2 && (
                      <span className="text-[9px] text-teal-600 font-semibold block">
                        +{dayAppointments.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Appointment Details Modal */}
      {activeAppointment && (
        <AppointmentDetailsModal
          isOpen={!!activeAppointment}
          onClose={() => setActiveAppointment(null)}
          appointment={activeAppointment}
        />
      )}
    </div>
  );
};
