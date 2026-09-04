import React, { useState, useMemo, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  UserPlus,
  Stethoscope,
  CheckCircle,
  AlertCircle,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Phone,
  FileText
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useClinic } from '../../context/ClinicContext';
import { useAuth } from '../../context/AuthContext';
import { AppointmentType, PriorityLevel, Patient, Appointment } from '../../types';
import { generateDoctorSlots } from '../../utils/availability';
import { getTimePeriod, formatTimeSlot, formatDate } from '../../utils/dateFormatter';
import { DoctorStatusBadge } from '../common/StatusBadge';

interface QuickBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedDoctorId?: string;
  onBookingSuccess: (appointment: Appointment) => void;
}

export const QuickBookingModal: React.FC<QuickBookingModalProps> = ({
  isOpen,
  onClose,
  preselectedDoctorId,
  onBookingSuccess,
}) => {
  const { doctors, patients, appointments, selectedDate, bookAppointment, addPatient } = useClinic();
  const { role, receptionistName, currentDoctor } = useAuth();

  // Form State
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [isAddingNewPatient, setIsAddingNewPatient] = useState(false);

  // New Patient Form
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientAge, setNewPatientAge] = useState<number | ''>('');
  const [newPatientGender, setNewPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientBloodGroup, setNewPatientBloodGroup] = useState('O+');
  const [newPatientAllergies, setNewPatientAllergies] = useState('');

  // Booking fields
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(preselectedDoctorId || doctors[0]?.id || '');
  const [bookingDate, setBookingDate] = useState<string>(selectedDate || '2026-09-05');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [appointmentType, setAppointmentType] = useState<AppointmentType>('new_consultation');
  const [priority, setPriority] = useState<PriorityLevel>('normal');
  const [reason, setReason] = useState<string>('');
  const [symptoms, setSymptoms] = useState<string>('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset or preset doctor on open
  useEffect(() => {
    if (preselectedDoctorId) {
      setSelectedDoctorId(preselectedDoctorId);
    } else if (doctors.length > 0 && !selectedDoctorId) {
      setSelectedDoctorId(doctors[0].id);
    }
  }, [preselectedDoctorId, doctors]);

  // Available specialties
  const specialties = useMemo(() => {
    const list = Array.from(new Set(doctors.map((d) => d.specialty)));
    return ['All', ...list];
  }, [doctors]);

  // Filtered doctors based on specialty
  const filteredDoctors = useMemo(() => {
    if (selectedSpecialty === 'All') return doctors;
    return doctors.filter((d) => d.specialty === selectedSpecialty);
  }, [doctors, selectedSpecialty]);

  // Current selected doctor object
  const currentSelectedDoctor = useMemo(() => {
    return doctors.find((d) => d.id === selectedDoctorId) || doctors[0];
  }, [doctors, selectedDoctorId]);

  // Filtered patients for search
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients.slice(0, 5);
    const q = patientSearch.toLowerCase();
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.patientNumber.toLowerCase().includes(q) ||
        p.phone.includes(q)
    );
  }, [patients, patientSearch]);

  // Selected patient object
  const currentSelectedPatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId);
  }, [patients, selectedPatientId]);

  // Calculate dynamic slots strictly preventing double-booking
  const availableSlots = useMemo(() => {
    if (!currentSelectedDoctor || !bookingDate) return [];
    return generateDoctorSlots(currentSelectedDoctor, bookingDate, appointments);
  }, [currentSelectedDoctor, bookingDate, appointments]);

  // Group slots by period
  const groupedSlots = useMemo(() => {
    const morning = availableSlots.filter((s) => getTimePeriod(s.time) === 'Morning');
    const afternoon = availableSlots.filter((s) => getTimePeriod(s.time) === 'Afternoon');
    const evening = availableSlots.filter((s) => getTimePeriod(s.time) === 'Evening');
    return { morning, afternoon, evening };
  }, [availableSlots]);

  // Handle Quick Patient Creation
  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim() || !newPatientPhone.trim() || !newPatientAge) {
      setErrorMessage('Please provide patient name, age, and phone number.');
      return;
    }

    const created = addPatient({
      name: newPatientName.trim(),
      age: Number(newPatientAge),
      gender: newPatientGender,
      dateOfBirth: '1990-01-01',
      phone: newPatientPhone.trim(),
      email: `${newPatientName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      bloodGroup: newPatientBloodGroup,
      allergies: newPatientAllergies ? newPatientAllergies.split(',').map((s) => s.trim()) : [],
      address: 'City Clinic Center',
      emergencyContact: {
        name: 'Family Member',
        relation: 'Relative',
        phone: newPatientPhone.trim(),
      },
    });

    setSelectedPatientId(created.id);
    setIsAddingNewPatient(false);
    setErrorMessage(null);
  };

  // Submit Booking
  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedPatientId) {
      setErrorMessage('Please select or register a patient.');
      return;
    }
    if (!selectedDoctorId) {
      setErrorMessage('Please select a doctor.');
      return;
    }
    if (!bookingDate) {
      setErrorMessage('Please choose an appointment date.');
      return;
    }
    if (!selectedTimeSlot) {
      setErrorMessage('Please select an available time slot.');
      return;
    }
    if (!reason.trim()) {
      setErrorMessage('Please enter the reason for visit.');
      return;
    }

    setIsSubmitting(true);

    const actorName = role === 'receptionist' ? receptionistName : currentDoctor?.name || 'Doctor';
    const actorRole = role === 'receptionist' ? 'Receptionist' : 'Doctor';

    const res = bookAppointment({
      patientId: selectedPatientId,
      doctorId: selectedDoctorId,
      date: bookingDate,
      timeSlot: selectedTimeSlot,
      type: appointmentType,
      priority,
      reason: reason.trim(),
      symptoms: symptoms.trim() || undefined,
      actorName,
      actorRole,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to book appointment.');
      return;
    }

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0d9488', '#14b8a6', '#0ea5e9', '#6366f1'],
      });
    } catch {
      // ignore
    }

    if (res.appointment) {
      onBookingSuccess(res.appointment);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-slate-900">
          <Sparkles className="w-5 h-5 text-teal-600" />
          <span>Book Patient Appointment</span>
        </div>
      }
      subtitle="Real-time schedule allocation with conflict prevention"
      maxWidth="3xl"
    >
      <form onSubmit={handleBook} className="space-y-6">
        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* SECTION 1: Patient Selection */}
        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <User className="w-4 h-4 text-teal-600" />
              1. Select or Add Patient <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setIsAddingNewPatient(!isAddingNewPatient)}
              className="text-xs font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {isAddingNewPatient ? 'Cancel New Patient' : '+ Register New Patient'}
            </button>
          </div>

          {isAddingNewPatient ? (
            <div className="bg-white p-4 rounded-xl border border-teal-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-800">
                <UserPlus className="w-4 h-4" /> Quick Patient Registration
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-500 font-medium">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 font-medium">Age</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 35"
                    value={newPatientAge}
                    onChange={(e) => setNewPatientAge(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 font-medium">Gender</label>
                  <select
                    value={newPatientGender}
                    onChange={(e) => setNewPatientGender(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-500 font-medium">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 000-0000"
                    value={newPatientPhone}
                    onChange={(e) => setNewPatientPhone(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 font-medium">Blood Group</label>
                  <select
                    value={newPatientBloodGroup}
                    onChange={(e) => setNewPatientBloodGroup(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  >
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 font-medium">Allergies (comma-sep)</label>
                  <input
                    type="text"
                    placeholder="e.g. Penicillin, Peanuts"
                    value={newPatientAllergies}
                    onChange={(e) => setNewPatientAllergies(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleCreatePatient}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors"
                >
                  Save & Select Patient
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Patient Quick Search */}
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search existing patients by name, patient ID, or phone..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="w-full pl-8 pr-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              {/* Patient Selection Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {filteredPatients.map((p) => {
                  const isSelected = selectedPatientId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPatientId(p.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                        isSelected
                          ? 'bg-teal-50/90 border-teal-500 ring-1 ring-teal-500 text-slate-900 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-teal-300 text-slate-700'
                      }`}
                    >
                      <div className="truncate">
                        <div className="font-bold flex items-center gap-1.5 truncate">
                          <span>{p.name}</span>
                          <span className="text-[10px] font-normal px-1 rounded bg-slate-100 text-slate-600">
                            {p.patientNumber}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {p.age} yrs · {p.gender} · {p.phone}
                        </div>
                      </div>
                      {isSelected && <CheckCircle className="w-4 h-4 text-teal-600 flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {currentSelectedPatient && (
                <div className="mt-2 text-xs text-teal-700 font-medium flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Selected: <span className="font-bold">{currentSelectedPatient.name}</span> (
                  {currentSelectedPatient.patientNumber}) · Blood Group: {currentSelectedPatient.bloodGroup}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION 2: Doctor & Date Selection */}
        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70 space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Stethoscope className="w-4 h-4 text-teal-600" />
            2. Choose Doctor & Date <span className="text-rose-500">*</span>
          </label>

          {/* Specialty Filter */}
          <div className="flex flex-wrap gap-1.5">
            {specialties.map((spec) => (
              <button
                key={spec}
                type="button"
                onClick={() => setSelectedSpecialty(spec)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedSpecialty === spec
                    ? 'bg-teal-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>

          {/* Doctor Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {filteredDoctors.map((doc) => {
              const isSelected = selectedDoctorId === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => {
                    setSelectedDoctorId(doc.id);
                    setSelectedTimeSlot(''); // reset slot when doctor changes
                  }}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 text-xs ${
                    isSelected
                      ? 'bg-teal-50 border-teal-500 ring-1 ring-teal-500 text-slate-900 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-teal-300 text-slate-700'
                  }`}
                >
                  <img
                    src={doc.avatar}
                    alt={doc.name}
                    className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-200 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 truncate">{doc.name}</div>
                    <div className="text-[11px] text-teal-700 font-medium truncate">
                      {doc.specialty}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {doc.roomNumber} · ${doc.consultationFee}
                    </div>
                  </div>
                  <DoctorStatusBadge status={doc.status} showDotOnly />
                </div>
              );
            })}
          </div>

          {/* Appointment Date Selector */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <CalendarIcon className="w-4 h-4 text-teal-600" />
              <span>Select Date:</span>
            </div>
            <input
              type="date"
              required
              value={bookingDate}
              onChange={(e) => {
                setBookingDate(e.target.value);
                setSelectedTimeSlot(''); // reset slot when date changes
              }}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
            />
            <span className="text-[11px] text-slate-500 font-medium">
              {formatDate(bookingDate, 'EEEE, MMMM d, yyyy')}
            </span>
          </div>
        </div>

        {/* SECTION 3: Dynamic Slot Picker (Zero Double-Booking Guard) */}
        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-600" />
              3. Available Time Slots <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-500">
              {availableSlots.filter((s) => s.available).length} slots available on this date
            </span>
          </div>

          {availableSlots.length === 0 ? (
            <div className="p-6 bg-white rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
              {currentSelectedDoctor?.leaveDates?.includes(bookingDate) ? (
                <span className="text-rose-600 font-semibold">
                  {currentSelectedDoctor.name} is on scheduled leave on this date.
                </span>
              ) : (
                <span>No working hours scheduled for this doctor on this day.</span>
              )}
            </div>
          ) : (
            <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
              {/* Morning Slots */}
              {groupedSlots.morning.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Morning (Before 12:00 PM)
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {groupedSlots.morning.map((slot) => {
                      const isSelected = selectedTimeSlot === slot.time;
                      return (
                        <button
                          type="button"
                          key={slot.time}
                          disabled={!slot.available}
                          onClick={() => setSelectedTimeSlot(slot.time)}
                          className={`px-2 py-2 rounded-xl text-xs font-semibold text-center transition-all ${
                            isSelected
                              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30 ring-2 ring-teal-600 ring-offset-1'
                              : slot.available
                              ? 'bg-teal-50/70 text-teal-800 border border-teal-200 hover:bg-teal-100 hover:border-teal-300'
                              : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed line-through opacity-70'
                          }`}
                          title={!slot.available ? slot.reason || 'Unavailable' : 'Available'}
                        >
                          <div>{slot.formattedTime}</div>
                          {!slot.available && (
                            <div className="text-[9px] font-normal no-underline text-slate-500 mt-0.5">
                              {slot.reason || 'Booked'}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Afternoon Slots */}
              {groupedSlots.afternoon.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Afternoon (12:00 PM - 05:00 PM)
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {groupedSlots.afternoon.map((slot) => {
                      const isSelected = selectedTimeSlot === slot.time;
                      return (
                        <button
                          type="button"
                          key={slot.time}
                          disabled={!slot.available}
                          onClick={() => setSelectedTimeSlot(slot.time)}
                          className={`px-2 py-2 rounded-xl text-xs font-semibold text-center transition-all ${
                            isSelected
                              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30 ring-2 ring-teal-600 ring-offset-1'
                              : slot.available
                              ? 'bg-teal-50/70 text-teal-800 border border-teal-200 hover:bg-teal-100 hover:border-teal-300'
                              : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed line-through opacity-70'
                          }`}
                          title={!slot.available ? slot.reason || 'Unavailable' : 'Available'}
                        >
                          <div>{slot.formattedTime}</div>
                          {!slot.available && (
                            <div className="text-[9px] font-normal no-underline text-slate-500 mt-0.5">
                              {slot.reason || 'Booked'}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Evening Slots */}
              {groupedSlots.evening.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Evening (After 05:00 PM)
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {groupedSlots.evening.map((slot) => {
                      const isSelected = selectedTimeSlot === slot.time;
                      return (
                        <button
                          type="button"
                          key={slot.time}
                          disabled={!slot.available}
                          onClick={() => setSelectedTimeSlot(slot.time)}
                          className={`px-2 py-2 rounded-xl text-xs font-semibold text-center transition-all ${
                            isSelected
                              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30 ring-2 ring-teal-600 ring-offset-1'
                              : slot.available
                              ? 'bg-teal-50/70 text-teal-800 border border-teal-200 hover:bg-teal-100 hover:border-teal-300'
                              : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed line-through opacity-70'
                          }`}
                          title={!slot.available ? slot.reason || 'Unavailable' : 'Available'}
                        >
                          <div>{slot.formattedTime}</div>
                          {!slot.available && (
                            <div className="text-[9px] font-normal no-underline text-slate-500 mt-0.5">
                              {slot.reason || 'Booked'}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedTimeSlot && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-teal-700 font-semibold">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>
                Verified Conflict-Free Slot: {formatTimeSlot(selectedTimeSlot)} on{' '}
                {formatDate(bookingDate, 'MMM d, yyyy')}
              </span>
            </div>
          )}
        </div>

        {/* SECTION 4: Visit Details */}
        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70 space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-teal-600" />
            4. Appointment Type & Reason <span className="text-rose-500">*</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-600 font-semibold mb-1 block">
                Appointment Type
              </label>
              <select
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value as AppointmentType)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                <option value="new_consultation">New Consultation</option>
                <option value="follow_up">Follow Up</option>
                <option value="routine_checkup">Routine Checkup</option>
                <option value="emergency">Emergency Consultation</option>
                <option value="teleconsultation">Teleconsultation / Video</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-600 font-semibold mb-1 block">Priority</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPriority('normal')}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    priority === 'normal'
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('urgent')}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    priority === 'urgent'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-rose-50'
                  }`}
                >
                  Urgent Priority
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-600 font-semibold mb-1 block">
              Reason for Visit <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Chest discomfort on walking, annual blood pressure review..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-600 font-semibold mb-1 block">
              Symptoms / Medical Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Specific symptoms reported, onset duration, relevant medical history..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !selectedTimeSlot || !selectedPatientId}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-teal-600/30 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Confirm & Book Appointment</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
