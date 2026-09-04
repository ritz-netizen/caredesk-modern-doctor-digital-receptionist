import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  Mail,
  Calendar,
  Heart,
  AlertCircle,
  FileText,
  Clock,
  ChevronRight,
  Stethoscope,
  PlusCircle,
  ShieldAlert
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { Patient, Appointment } from '../../types';
import { Modal } from '../common/Modal';
import { AppointmentStatusBadge } from '../common/StatusBadge';
import { formatDate, formatTimeSlot, formatDateTime } from '../../utils/dateFormatter';

interface PatientManagementProps {
  onBookForPatient: (patientId: string) => void;
}

export const PatientManagement: React.FC<PatientManagementProps> = ({ onBookForPatient }) => {
  const { patients, appointments, addPatient } = useClinic();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Patient Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [dob, setDob] = useState('1990-01-01');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('Spouse');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // Search filter
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase().trim();
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.patientNumber.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.email.toLowerCase().includes(q)
    );
  }, [patients, searchQuery]);

  // Handle Add Patient
  const handleSavePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !age || !phone.trim()) return;

    const newPat = addPatient({
      name: name.trim(),
      age: Number(age),
      gender,
      dateOfBirth: dob,
      phone: phone.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@patient.com`,
      bloodGroup,
      allergies: allergies ? allergies.split(',').map((s) => s.trim()) : [],
      address: address.trim() || 'Downtown Area',
      emergencyContact: {
        name: emergencyName.trim() || 'Relative',
        relation: emergencyRelation,
        phone: emergencyPhone.trim() || phone.trim(),
      },
    });

    setIsAddModalOpen(false);
    setSelectedPatient(newPat);

    // Reset Form
    setName('');
    setAge('');
    setPhone('');
    setEmail('');
    setAllergies('');
    setAddress('');
  };

  // Appointments for selected patient
  const patientAppointments = useMemo(() => {
    if (!selectedPatient) return [];
    return appointments.filter((a) => a.patientId === selectedPatient.id);
  }, [selectedPatient, appointments]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-teal-600" />
            Patient Directory & Medical Profiles
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage patient records, demographic history, clinical allergies, and appointment trails.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/30 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Search Bar & Stats */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient by name, ID (e.g. PAT-2026-001), or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-800">{filteredPatients.length}</span> registered patients
        </div>
      </div>

      {/* Patient Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredPatients.map((patient) => {
          const aptCount = appointments.filter((a) => a.patientId === patient.id).length;
          return (
            <div
              key={patient.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-teal-50 text-teal-800 px-2 py-0.5 rounded-md border border-teal-200/60">
                      {patient.patientNumber}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{patient.name}</h3>
                    <p className="text-xs text-slate-500">
                      {patient.age} yrs · {patient.gender} · Blood Group: {patient.bloodGroup}
                    </p>
                  </div>

                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                    {aptCount} visits
                  </span>
                </div>

                <div className="mt-3.5 space-y-1.5 text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{patient.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{patient.email}</span>
                  </div>
                </div>

                {patient.allergies && patient.allergies.length > 0 && (
                  <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                    <span className="text-[10px] text-slate-400">Allergies:</span>
                    {patient.allergies.map((alg) => (
                      <span
                        key={alg}
                        className="text-[10px] font-semibold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200"
                      >
                        {alg}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedPatient(patient)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-teal-700 hover:bg-teal-50 border border-teal-200/80 transition-colors"
                >
                  Medical Profile
                </button>

                <button
                  onClick={() => onBookForPatient(patient.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Book Slot</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: ADD PATIENT MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-slate-900">
            <UserPlus className="w-5 h-5 text-teal-600" />
            <span>Register New Patient</span>
          </div>
        }
        subtitle="Create electronic patient record with medical history"
        maxWidth="2xl"
      >
        <form onSubmit={handleSavePatient} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Patient Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Age <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                placeholder="e.g. 42"
                value={age}
                onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
              >
                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                placeholder="patient@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Allergies & Medical Warnings (Comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Penicillin, Sulfa drugs, Latex"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Residential Address</label>
            <input
              type="text"
              placeholder="Street address, city, state"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
            />
          </div>

          {/* Emergency Contact */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase block">
              Emergency Contact
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Contact Name"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              />
              <input
                type="text"
                placeholder="Relation (e.g. Spouse)"
                value={emergencyRelation}
                onChange={(e) => setEmergencyRelation(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              />
              <input
                type="tel"
                placeholder="Emergency Phone"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/30"
            >
              Save Patient
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: PATIENT PROFILE & APPOINTMENT HISTORY */}
      {selectedPatient && (
        <Modal
          isOpen={!!selectedPatient}
          onClose={() => setSelectedPatient(null)}
          title={
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs bg-teal-50 text-teal-800 px-2 py-0.5 rounded-md border border-teal-200">
                {selectedPatient.patientNumber}
              </span>
              <span>{selectedPatient.name}</span>
            </div>
          }
          subtitle={`Patient record registered on ${formatDate(selectedPatient.createdAt)}`}
          maxWidth="3xl"
        >
          <div className="space-y-5">
            {/* Demographic Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Age / Gender</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {selectedPatient.age} Years ({selectedPatient.gender})
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Blood Group</span>
                <span className="font-bold text-rose-700 mt-0.5 block">
                  {selectedPatient.bloodGroup}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Phone</span>
                <span className="font-bold text-slate-900 mt-0.5 block font-mono">
                  {selectedPatient.phone}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Emergency Contact</span>
                <span className="font-bold text-slate-900 mt-0.5 block truncate">
                  {selectedPatient.emergencyContact?.name} ({selectedPatient.emergencyContact?.relation})
                </span>
              </div>
            </div>

            {/* Allergies Warning */}
            {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>
                  <strong>Clinical Allergies Reported:</strong>{' '}
                  {selectedPatient.allergies.join(', ')}
                </span>
              </div>
            )}

            {/* Appointment History Timeline */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  Appointment History & Consultation Visits ({patientAppointments.length})
                </h4>
                <button
                  onClick={() => {
                    const id = selectedPatient.id;
                    setSelectedPatient(null);
                    onBookForPatient(id);
                  }}
                  className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Book New Appointment
                </button>
              </div>

              {patientAppointments.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                  No appointments on record for this patient yet.
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {patientAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-teal-300 shadow-2xs transition-colors text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded">
                            {apt.appointmentNumber}
                          </span>
                          <span className="font-bold text-slate-900">
                            {formatDate(apt.date)} @ {formatTimeSlot(apt.timeSlot)}
                          </span>
                        </div>
                        <AppointmentStatusBadge status={apt.status} />
                      </div>

                      <div className="text-slate-600 flex items-center gap-2">
                        <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                        <span>{apt.doctorName} ({apt.doctorSpecialty})</span>
                        <span>·</span>
                        <span className="capitalize">{apt.type.replace('_', ' ')}</span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-lg text-slate-700">
                        <strong>Reason:</strong> {apt.reason}
                      </div>

                      {apt.clinicalNotes && (
                        <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-200/80 text-emerald-950 space-y-1">
                          <div>
                            <strong>Diagnosis:</strong> {apt.clinicalNotes.diagnosis}
                          </div>
                          {apt.clinicalNotes.prescription && (
                            <div className="text-[11px] text-slate-600">
                              <strong>Prescription:</strong> {apt.clinicalNotes.prescription}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Close Profile
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
