export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'rescheduled'
  | 'cancelled'
  | 'no_show';

export type AppointmentType =
  | 'new_consultation'
  | 'follow_up'
  | 'routine_checkup'
  | 'emergency'
  | 'teleconsultation';

export type PriorityLevel = 'normal' | 'urgent';

export type DoctorStatus =
  | 'available'
  | 'in_consultation'
  | 'on_break'
  | 'on_leave'
  | 'unavailable';

export interface WorkingHours {
  isWorking: boolean;
  start: string; // "09:00"
  end: string;   // "17:00"
}

export interface BreakTime {
  id: string;
  title: string;
  start: string; // "13:00"
  end: string;   // "14:00"
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  qualification: string;
  roomNumber: string;
  phone: string;
  email: string;
  avatar: string;
  status: DoctorStatus;
  statusMessage?: string;
  consultationFee: number;
  slotDuration: number; // in minutes, e.g. 30
  workingHours: { [dayOfWeek: number]: WorkingHours }; // 0=Sunday, 1=Monday ... 6=Saturday
  breakTimes: BreakTime[];
  leaveDates: string[]; // YYYY-MM-DD
}

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface Patient {
  id: string;
  patientNumber: string; // PAT-2026-001
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string; // YYYY-MM-DD
  phone: string;
  email: string;
  bloodGroup: string;
  allergies: string[];
  address: string;
  emergencyContact: EmergencyContact;
  createdAt: string;
}

export interface ClinicalNotes {
  diagnosis?: string;
  prescription?: string;
  advice?: string;
  followUpDate?: string;
  recordedAt?: string;
  doctorName?: string;
}

export interface RescheduleHistory {
  fromSlot: string;
  fromDate: string;
  toSlot: string;
  toDate: string;
  reason: string;
  timestamp: string;
  rescheduledBy: string;
}

export interface Appointment {
  id: string;
  appointmentNumber: string; // APT-2026-0101
  patientId: string;
  patientName: string;
  patientNumber: string;
  patientPhone: string;
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other';
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:mm (e.g. 09:30)
  durationMinutes: number;
  type: AppointmentType;
  status: AppointmentStatus;
  priority: PriorityLevel;
  reason: string;
  symptoms?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  rescheduleHistory?: RescheduleHistory[];
  clinicalNotes?: ClinicalNotes;
  checkedInAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type AuditAction =
  | 'BOOKED'
  | 'RESCHEDULED'
  | 'CANCELLED'
  | 'STATUS_CHANGE'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'NOTE_ADDED'
  | 'DOCTOR_AVAILABILITY_CHANGED'
  | 'WORKING_HOURS_UPDATED'
  | 'LEAVE_ADDED'
  | 'PATIENT_REGISTERED';

export interface AuditLog {
  id: string;
  appointmentId?: string;
  appointmentNumber?: string;
  timestamp: string;
  actorRole: 'Receptionist' | 'Doctor' | 'System';
  actorName: string;
  action: AuditAction;
  description: string;
  details?: Record<string, any>;
}

export type NotificationType =
  | 'appointment_booked'
  | 'appointment_rescheduled'
  | 'appointment_cancelled'
  | 'upcoming_reminder'
  | 'checkin_alert'
  | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  appointmentId?: string;
  appointmentNumber?: string;
  priority: 'info' | 'warning' | 'urgent';
}

export type UserRole = 'receptionist' | 'doctor';

export interface CurrentUser {
  role: UserRole;
  name: string;
  doctorId?: string;
  doctor?: Doctor;
}

export interface TimeSlotOption {
  time: string; // "09:30"
  formattedTime: string; // "09:30 AM"
  available: boolean;
  reason?: string; // "Booked", "Break", "Past", "Off Hours"
  appointmentId?: string;
}
