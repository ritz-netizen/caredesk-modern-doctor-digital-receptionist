import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Doctor,
  Patient,
  Appointment,
  AuditLog,
  AppNotification,
  DoctorStatus,
  WorkingHours,
  BreakTime,
  ClinicalNotes,
  AppointmentStatus,
  AppointmentType,
  PriorityLevel
} from '../types';
import {
  INITIAL_DOCTORS,
  INITIAL_PATIENTS,
  INITIAL_APPOINTMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS
} from '../data/mockData';
import { canBookSlot } from '../utils/availability';
import { getTodayString } from '../utils/dateFormatter';

interface BookAppointmentInput {
  patientId: string;
  doctorId: string;
  date: string;
  timeSlot: string;
  type: AppointmentType;
  priority: PriorityLevel;
  reason: string;
  symptoms?: string;
  actorName: string;
  actorRole: 'Receptionist' | 'Doctor';
}

interface RescheduleInput {
  appointmentId: string;
  newDate: string;
  newTimeSlot: string;
  reason: string;
  actorName: string;
  actorRole: 'Receptionist' | 'Doctor';
}

interface CancelInput {
  appointmentId: string;
  reason: string;
  actorName: string;
  actorRole: 'Receptionist' | 'Doctor';
}

interface ClinicContextType {
  doctors: Doctor[];
  patients: Patient[];
  appointments: Appointment[];
  auditLogs: AuditLog[];
  notifications: AppNotification[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  // Actions
  bookAppointment: (input: BookAppointmentInput) => { success: boolean; appointment?: Appointment; error?: string };
  rescheduleAppointment: (input: RescheduleInput) => { success: boolean; error?: string };
  cancelAppointment: (input: CancelInput) => { success: boolean; error?: string };
  updateAppointmentStatus: (
    appointmentId: string,
    status: AppointmentStatus,
    actorName: string,
    actorRole: 'Receptionist' | 'Doctor'
  ) => void;
  addClinicalNotes: (
    appointmentId: string,
    notes: ClinicalNotes,
    doctorName: string,
    autoComplete?: boolean
  ) => void;
  updateDoctorStatus: (
    doctorId: string,
    status: DoctorStatus,
    statusMessage?: string,
    actorName?: string
  ) => void;
  updateDoctorWorkingHours: (doctorId: string, workingHours: { [day: number]: WorkingHours }) => void;
  updateDoctorBreaks: (doctorId: string, breaks: BreakTime[]) => void;
  toggleDoctorLeaveDate: (doctorId: string, date: string) => void;
  addPatient: (patientData: Omit<Patient, 'id' | 'patientNumber' | 'createdAt'>) => Patient;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  resetToDemoData: () => void;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

const STORAGE_KEYS = {
  DOCTORS: 'curaflow_doctors_v1',
  PATIENTS: 'curaflow_patients_v1',
  APPOINTMENTS: 'curaflow_appointments_v1',
  AUDIT: 'curaflow_audit_logs_v1',
  NOTIFICATIONS: 'curaflow_notifications_v1',
};

export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or use initial mock data
  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DOCTORS);
    return saved ? JSON.parse(saved) : INITIAL_DOCTORS;
  });

  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PATIENTS);
    return saved ? JSON.parse(saved) : INITIAL_PATIENTS;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Default active operational date (defaults to clinic date '2026-09-05' or today)
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-05');

  // Persistence effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(doctors));
  }, [doctors]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  // Helper to add audit entry
  const addAuditEntry = useCallback(
    (
      actorName: string,
      actorRole: 'Receptionist' | 'Doctor' | 'System',
      action: AuditLog['action'],
      description: string,
      appointmentId?: string,
      appointmentNumber?: string,
      details?: Record<string, any>
    ) => {
      const newEntry: AuditLog = {
        id: 'aud-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        appointmentId,
        appointmentNumber,
        timestamp: new Date().toISOString(),
        actorName,
        actorRole,
        action,
        description,
        details,
      };
      setAuditLogs((prev) => [newEntry, ...prev]);
    },
    []
  );

  // Helper to add notification
  const addNotification = useCallback(
    (
      title: string,
      message: string,
      type: AppNotification['type'],
      priority: AppNotification['priority'] = 'info',
      appointmentId?: string,
      appointmentNumber?: string
    ) => {
      const newNotif: AppNotification = {
        id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        title,
        message,
        type,
        timestamp: new Date().toISOString(),
        read: false,
        priority,
        appointmentId,
        appointmentNumber,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    },
    []
  );

  // 1. BOOK APPOINTMENT (Zero double booking enforcement)
  const bookAppointment = useCallback(
    (input: BookAppointmentInput) => {
      const doctor = doctors.find((d) => d.id === input.doctorId);
      const patient = patients.find((p) => p.id === input.patientId);

      if (!doctor) {
        return { success: false, error: 'Selected doctor could not be found.' };
      }
      if (!patient) {
        return { success: false, error: 'Selected patient could not be found.' };
      }

      // Check slot availability
      const check = canBookSlot(doctor, input.date, input.timeSlot, appointments);
      if (!check.canBook) {
        return { success: false, error: check.errorReason || 'Time slot is no longer available.' };
      }

      const appointmentNumber = `APT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const newAppointment: Appointment = {
        id: 'apt-' + Date.now(),
        appointmentNumber,
        patientId: patient.id,
        patientName: patient.name,
        patientNumber: patient.patientNumber,
        patientPhone: patient.phone,
        patientAge: patient.age,
        patientGender: patient.gender,
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorSpecialty: doctor.specialty,
        date: input.date,
        timeSlot: input.timeSlot,
        durationMinutes: doctor.slotDuration || 30,
        type: input.type,
        status: 'confirmed',
        priority: input.priority,
        reason: input.reason,
        symptoms: input.symptoms,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setAppointments((prev) => [newAppointment, ...prev]);

      addAuditEntry(
        input.actorName,
        input.actorRole,
        'BOOKED',
        `Booked ${input.type.replace('_', ' ')} for ${patient.name} with ${doctor.name} on ${input.date} at ${input.timeSlot}.`,
        newAppointment.id,
        newAppointment.appointmentNumber,
        { reason: input.reason, priority: input.priority }
      );

      addNotification(
        'New Appointment Booked',
        `${patient.name} booked with ${doctor.name} for ${input.date} at ${input.timeSlot}.`,
        'appointment_booked',
        input.priority === 'urgent' ? 'urgent' : 'info',
        newAppointment.id,
        newAppointment.appointmentNumber
      );

      return { success: true, appointment: newAppointment };
    },
    [doctors, patients, appointments, addAuditEntry, addNotification]
  );

  // 2. RESCHEDULE APPOINTMENT
  const rescheduleAppointment = useCallback(
    (input: RescheduleInput) => {
      const apt = appointments.find((a) => a.id === input.appointmentId);
      if (!apt) {
        return { success: false, error: 'Appointment not found.' };
      }

      const doctor = doctors.find((d) => d.id === apt.doctorId);
      if (!doctor) {
        return { success: false, error: 'Doctor not found.' };
      }

      // Check slot availability for new date/time excluding current appointment
      const check = canBookSlot(doctor, input.newDate, input.newTimeSlot, appointments, apt.id);
      if (!check.canBook) {
        return { success: false, error: check.errorReason || 'Requested new time slot is unavailable.' };
      }

      const previousDate = apt.date;
      const previousSlot = apt.timeSlot;

      const historyEntry = {
        fromDate: previousDate,
        fromSlot: previousSlot,
        toDate: input.newDate,
        toSlot: input.newTimeSlot,
        reason: input.reason,
        timestamp: new Date().toISOString(),
        rescheduledBy: `${input.actorName} (${input.actorRole})`,
      };

      setAppointments((prev) =>
        prev.map((a) => {
          if (a.id === input.appointmentId) {
            return {
              ...a,
              date: input.newDate,
              timeSlot: input.newTimeSlot,
              status: 'rescheduled',
              rescheduleHistory: [...(a.rescheduleHistory || []), historyEntry],
              updatedAt: new Date().toISOString(),
            };
          }
          return a;
        })
      );

      addAuditEntry(
        input.actorName,
        input.actorRole,
        'RESCHEDULED',
        `Rescheduled ${apt.patientName}'s appointment from ${previousDate} ${previousSlot} to ${input.newDate} ${input.newTimeSlot}. Reason: ${input.reason}`,
        apt.id,
        apt.appointmentNumber,
        { previousDate, previousSlot, newDate: input.newDate, newSlot: input.newTimeSlot, reason: input.reason }
      );

      addNotification(
        'Appointment Rescheduled',
        `${apt.patientName} moved to ${input.newDate} at ${input.newTimeSlot} with ${doctor.name}.`,
        'appointment_rescheduled',
        'info',
        apt.id,
        apt.appointmentNumber
      );

      return { success: true };
    },
    [appointments, doctors, addAuditEntry, addNotification]
  );

  // 3. CANCEL APPOINTMENT
  const cancelAppointment = useCallback(
    (input: CancelInput) => {
      const apt = appointments.find((a) => a.id === input.appointmentId);
      if (!apt) {
        return { success: false, error: 'Appointment not found.' };
      }

      setAppointments((prev) =>
        prev.map((a) => {
          if (a.id === input.appointmentId) {
            return {
              ...a,
              status: 'cancelled',
              cancellationReason: input.reason,
              cancelledAt: new Date().toISOString(),
              cancelledBy: `${input.actorName} (${input.actorRole})`,
              updatedAt: new Date().toISOString(),
            };
          }
          return a;
        })
      );

      addAuditEntry(
        input.actorName,
        input.actorRole,
        'CANCELLED',
        `Cancelled appointment ${apt.appointmentNumber} for ${apt.patientName}. Reason: ${input.reason}`,
        apt.id,
        apt.appointmentNumber,
        { reason: input.reason, freedSlot: `${apt.date} ${apt.timeSlot}` }
      );

      addNotification(
        'Appointment Cancelled',
        `Appointment for ${apt.patientName} on ${apt.date} at ${apt.timeSlot} was cancelled. Slot is now free.`,
        'appointment_cancelled',
        'warning',
        apt.id,
        apt.appointmentNumber
      );

      return { success: true };
    },
    [appointments, addAuditEntry, addNotification]
  );

  // 4. UPDATE APPOINTMENT STATUS (Check-in, No-show, etc.)
  const updateAppointmentStatus = useCallback(
    (
      appointmentId: string,
      status: AppointmentStatus,
      actorName: string,
      actorRole: 'Receptionist' | 'Doctor'
    ) => {
      const apt = appointments.find((a) => a.id === appointmentId);
      if (!apt) return;

      const now = new Date().toISOString();

      setAppointments((prev) =>
        prev.map((a) => {
          if (a.id === appointmentId) {
            return {
              ...a,
              status,
              checkedInAt: status === 'in_progress' && !a.checkedInAt ? now : a.checkedInAt,
              completedAt: status === 'completed' && !a.completedAt ? now : a.completedAt,
              updatedAt: now,
            };
          }
          return a;
        })
      );

      let action: AuditLog['action'] = 'STATUS_CHANGE';
      let notifTitle = 'Appointment Updated';
      let notifType: AppNotification['type'] = 'system';

      if (status === 'in_progress') {
        action = 'CHECKED_IN';
        notifTitle = 'Patient Checked In';
        notifType = 'checkin_alert';
      } else if (status === 'completed') {
        action = 'COMPLETED';
        notifTitle = 'Consultation Completed';
      } else if (status === 'no_show') {
        action = 'NO_SHOW';
        notifTitle = 'Patient Marked No-Show';
      }

      addAuditEntry(
        actorName,
        actorRole,
        action,
        `Status changed to "${status.replace('_', ' ')}" for ${apt.patientName} (${apt.appointmentNumber}).`,
        apt.id,
        apt.appointmentNumber,
        { oldStatus: apt.status, newStatus: status }
      );

      addNotification(
        notifTitle,
        `${apt.patientName} (${apt.appointmentNumber}) is now ${status.replace('_', ' ')}.`,
        notifType,
        'info',
        apt.id,
        apt.appointmentNumber
      );
    },
    [appointments, addAuditEntry, addNotification]
  );

  // 5. ADD CLINICAL NOTES (Doctor consultation completion)
  const addClinicalNotes = useCallback(
    (
      appointmentId: string,
      notes: ClinicalNotes,
      doctorName: string,
      autoComplete: boolean = true
    ) => {
      const apt = appointments.find((a) => a.id === appointmentId);
      if (!apt) return;

      const now = new Date().toISOString();

      setAppointments((prev) =>
        prev.map((a) => {
          if (a.id === appointmentId) {
            return {
              ...a,
              status: autoComplete ? 'completed' : a.status,
              completedAt: autoComplete ? now : a.completedAt,
              clinicalNotes: {
                ...notes,
                doctorName,
                recordedAt: now,
              },
              updatedAt: now,
            };
          }
          return a;
        })
      );

      addAuditEntry(
        doctorName,
        'Doctor',
        'NOTE_ADDED',
        `Recorded clinical notes and diagnosis for ${apt.patientName} (${apt.appointmentNumber}).`,
        apt.id,
        apt.appointmentNumber,
        { diagnosis: notes.diagnosis, prescription: notes.prescription }
      );

      addNotification(
        'Consultation Notes Added',
        `${doctorName} recorded diagnosis for ${apt.patientName}. Status marked Completed.`,
        'system',
        'info',
        apt.id,
        apt.appointmentNumber
      );
    },
    [appointments, addAuditEntry, addNotification]
  );

  // 6. UPDATE DOCTOR STATUS
  const updateDoctorStatus = useCallback(
    (
      doctorId: string,
      status: DoctorStatus,
      statusMessage?: string,
      actorName: string = 'Doctor'
    ) => {
      const doc = doctors.find((d) => d.id === doctorId);
      if (!doc) return;

      setDoctors((prev) =>
        prev.map((d) => {
          if (d.id === doctorId) {
            return {
              ...d,
              status,
              statusMessage: statusMessage !== undefined ? statusMessage : d.statusMessage,
            };
          }
          return d;
        })
      );

      addAuditEntry(
        actorName,
        'Doctor',
        'DOCTOR_AVAILABILITY_CHANGED',
        `${doc.name} updated availability to ${status.toUpperCase()} (${statusMessage || 'No note'}).`,
        undefined,
        undefined,
        { doctorId, status, statusMessage }
      );
    },
    [doctors, addAuditEntry]
  );

  // 7. UPDATE WORKING HOURS
  const updateDoctorWorkingHours = useCallback(
    (doctorId: string, workingHours: { [day: number]: WorkingHours }) => {
      const doc = doctors.find((d) => d.id === doctorId);
      if (!doc) return;

      setDoctors((prev) =>
        prev.map((d) => (d.id === doctorId ? { ...d, workingHours } : d))
      );

      addAuditEntry(
        doc.name,
        'Doctor',
        'WORKING_HOURS_UPDATED',
        `${doc.name} updated weekly working hours schedule.`
      );
    },
    [doctors, addAuditEntry]
  );

  // 8. UPDATE BREAKS
  const updateDoctorBreaks = useCallback(
    (doctorId: string, breaks: BreakTime[]) => {
      setDoctors((prev) =>
        prev.map((d) => (d.id === doctorId ? { ...d, breakTimes: breaks } : d))
      );
    },
    []
  );

  // 9. TOGGLE LEAVE DATE
  const toggleDoctorLeaveDate = useCallback(
    (doctorId: string, date: string) => {
      const doc = doctors.find((d) => d.id === doctorId);
      if (!doc) return;

      const hasLeave = doc.leaveDates.includes(date);
      const newLeaves = hasLeave
        ? doc.leaveDates.filter((d) => d !== date)
        : [...doc.leaveDates, date];

      setDoctors((prev) =>
        prev.map((d) => (d.id === doctorId ? { ...d, leaveDates: newLeaves } : d))
      );

      addAuditEntry(
        doc.name,
        'Doctor',
        'LEAVE_ADDED',
        `${doc.name} ${hasLeave ? 'removed leave on' : 'scheduled leave on'} ${date}.`
      );
    },
    [doctors, addAuditEntry]
  );

  // 10. ADD PATIENT
  const addPatient = useCallback(
    (patientData: Omit<Patient, 'id' | 'patientNumber' | 'createdAt'>): Patient => {
      const newNumber = `PAT-2026-${String(patients.length + 1).padStart(3, '0')}`;
      const newPatient: Patient = {
        ...patientData,
        id: 'pat-' + Date.now(),
        patientNumber: newNumber,
        createdAt: new Date().toISOString(),
      };

      setPatients((prev) => [newPatient, ...prev]);

      addAuditEntry(
        'Sarah Jenkins',
        'Receptionist',
        'PATIENT_REGISTERED',
        `Registered new patient ${newPatient.name} (${newPatient.patientNumber}).`
      );

      return newPatient;
    },
    [patients, addAuditEntry]
  );

  // 11. NOTIFICATIONS
  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // 12. RESET TO DEMO DATA
  const resetToDemoData = useCallback(() => {
    setDoctors(INITIAL_DOCTORS);
    setPatients(INITIAL_PATIENTS);
    setAppointments(INITIAL_APPOINTMENTS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.DOCTORS);
    localStorage.removeItem(STORAGE_KEYS.PATIENTS);
    localStorage.removeItem(STORAGE_KEYS.APPOINTMENTS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
  }, []);

  return (
    <ClinicContext.Provider
      value={{
        doctors,
        patients,
        appointments,
        auditLogs,
        notifications,
        selectedDate,
        setSelectedDate,
        bookAppointment,
        rescheduleAppointment,
        cancelAppointment,
        updateAppointmentStatus,
        addClinicalNotes,
        updateDoctorStatus,
        updateDoctorWorkingHours,
        updateDoctorBreaks,
        toggleDoctorLeaveDate,
        addPatient,
        markNotificationRead,
        markAllNotificationsRead,
        resetToDemoData,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
};

export function useClinic() {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
}
