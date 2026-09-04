import { Doctor, Appointment, TimeSlotOption } from '../types';
import { timeStringToMinutes, minutesToTimeString, formatTimeSlot } from './dateFormatter';
import { parseISO, getDay } from 'date-fns';

/**
 * Checks if a time falls within a given interval [start, end)
 */
export function isTimeInInterval(time: string, start: string, end: string): boolean {
  const t = timeStringToMinutes(time);
  const s = timeStringToMinutes(start);
  const e = timeStringToMinutes(end);
  return t >= s && t < e;
}

/**
 * Generates all time slots for a doctor on a specific date,
 * accurately determining whether each slot is available or taken.
 * Strictly prevents double booking!
 */
export function generateDoctorSlots(
  doctor: Doctor,
  dateString: string,
  existingAppointments: Appointment[],
  excludeAppointmentId?: string
): TimeSlotOption[] {
  if (!doctor || !dateString) return [];

  // 1. Check if doctor is on leave on this date
  if (doctor.leaveDates && doctor.leaveDates.includes(dateString)) {
    return [];
  }

  // 2. Get Day of week (0 = Sunday, 1 = Monday, etc.)
  const targetDate = parseISO(dateString);
  const dayOfWeek = getDay(targetDate);
  const schedule = doctor.workingHours[dayOfWeek];

  if (!schedule || !schedule.isWorking) {
    return [];
  }

  const slotDuration = doctor.slotDuration || 30;
  const startMinutes = timeStringToMinutes(schedule.start);
  const endMinutes = timeStringToMinutes(schedule.end);

  // 3. Find active appointments for this doctor on this date
  const doctorAppointments = existingAppointments.filter((apt) => {
    if (excludeAppointmentId && apt.id === excludeAppointmentId) return false;
    return (
      apt.doctorId === doctor.id &&
      apt.date === dateString &&
      apt.status !== 'cancelled' &&
      apt.status !== 'rescheduled'
    );
  });

  const slots: TimeSlotOption[] = [];

  for (let m = startMinutes; m + slotDuration <= endMinutes; m += slotDuration) {
    const slotTime = minutesToTimeString(m);
    const slotEndTime = minutesToTimeString(m + slotDuration);

    let isAvailable = true;
    let unavailableReason: string | undefined = undefined;
    let conflictingAptId: string | undefined = undefined;

    // Check if slot overlaps with doctor's breaks
    if (doctor.breakTimes && doctor.breakTimes.length > 0) {
      for (const b of doctor.breakTimes) {
        const breakStart = timeStringToMinutes(b.start);
        const breakEnd = timeStringToMinutes(b.end);
        // Overlap condition: slot begins before break ends AND slot ends after break starts
        if (m < breakEnd && (m + slotDuration) > breakStart) {
          isAvailable = false;
          unavailableReason = `Break (${b.title})`;
          break;
        }
      }
    }

    // Check if slot overlaps with an existing appointment
    if (isAvailable) {
      const bookedApt = doctorAppointments.find((apt) => {
        const aptStart = timeStringToMinutes(apt.timeSlot);
        const aptEnd = aptStart + (apt.durationMinutes || slotDuration);
        return m < aptEnd && (m + slotDuration) > aptStart;
      });

      if (bookedApt) {
        isAvailable = false;
        unavailableReason = 'Booked';
        conflictingAptId = bookedApt.id;
      }
    }

    slots.push({
      time: slotTime,
      formattedTime: formatTimeSlot(slotTime),
      available: isAvailable,
      reason: unavailableReason,
      appointmentId: conflictingAptId,
    });
  }

  return slots;
}

/**
 * Finds the next available slot for a doctor starting from a given date
 */
export function getNextAvailableSlot(
  doctor: Doctor,
  startDateString: string,
  appointments: Appointment[]
): { date: string; time: string; formattedTime: string } | null {
  let currentDate = parseISO(startDateString);

  // Search up to 14 days ahead
  for (let i = 0; i < 14; i++) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const slots = generateDoctorSlots(doctor, dateStr, appointments);
    const availableSlot = slots.find((s) => s.available);
    if (availableSlot) {
      return {
        date: dateStr,
        time: availableSlot.time,
        formattedTime: availableSlot.formattedTime,
      };
    }
    // Next day
    currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
  }

  return null;
}

/**
 * Helper to check if a specific slot can be safely booked (double-check guard)
 */
export function canBookSlot(
  doctor: Doctor,
  date: string,
  timeSlot: string,
  appointments: Appointment[],
  excludeAppointmentId?: string
): { canBook: boolean; errorReason?: string } {
  const slots = generateDoctorSlots(doctor, date, appointments, excludeAppointmentId);
  const found = slots.find((s) => s.time === timeSlot);

  if (!found) {
    return { canBook: false, errorReason: 'Selected time slot is outside working hours.' };
  }

  if (!found.available) {
    return { canBook: false, errorReason: `Slot is not available: ${found.reason || 'Already booked'}.` };
  }

  return { canBook: true };
}
