import React, { useState } from 'react';
import { Stethoscope, CheckCircle2, FileText, Pill, Calendar, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useClinic } from '../../context/ClinicContext';
import { useAuth } from '../../context/AuthContext';
import { Appointment, ClinicalNotes } from '../../types';
import { formatDate, formatTimeSlot } from '../../utils/dateFormatter';

interface ConsultationNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess?: () => void;
}

export const ConsultationNotesModal: React.FC<ConsultationNotesModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onSuccess,
}) => {
  const { addClinicalNotes } = useClinic();
  const { currentDoctor } = useAuth();

  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [advice, setAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (appointment?.clinicalNotes) {
      setDiagnosis(appointment.clinicalNotes.diagnosis || '');
      setPrescription(appointment.clinicalNotes.prescription || '');
      setAdvice(appointment.clinicalNotes.advice || '');
      setFollowUpDate(appointment.clinicalNotes.followUpDate || '');
    } else {
      setDiagnosis('');
      setPrescription('');
      setAdvice('');
      setFollowUpDate('');
    }
    setErrorMessage(null);
  }, [appointment, isOpen]);

  if (!appointment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis.trim()) {
      setErrorMessage('Please enter a clinical diagnosis or observation.');
      return;
    }

    setIsSubmitting(true);
    const doctorName = currentDoctor?.name || appointment.doctorName;

    const notes: ClinicalNotes = {
      diagnosis: diagnosis.trim(),
      prescription: prescription.trim() || undefined,
      advice: advice.trim() || undefined,
      followUpDate: followUpDate || undefined,
    };

    addClinicalNotes(appointment.id, notes, doctorName, true);
    setIsSubmitting(false);

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-slate-900">
          <Stethoscope className="w-5 h-5 text-teal-600" />
          <span>Patient Consultation & Prescription Record</span>
        </div>
      }
      subtitle={`Patient: ${appointment.patientName} (${appointment.patientNumber}) · Token: ${appointment.appointmentNumber}`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Patient & Complaint Recap */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900">
              {appointment.patientName}, {appointment.patientAge}y ({appointment.patientGender})
            </span>
            <span className="text-teal-700 font-semibold">{appointment.type.replace('_', ' ')}</span>
          </div>
          <div className="text-slate-600">
            <strong>Chief Complaint:</strong> {appointment.reason}
          </div>
          {appointment.symptoms && (
            <div className="text-slate-500 italic">
              <strong>Reported Symptoms:</strong> {appointment.symptoms}
            </div>
          )}
        </div>

        {/* Diagnosis */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Clinical Diagnosis / Findings <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={2}
            placeholder="e.g. Mild essential hypertension; resting heart rate 78 bpm; ECG sinus rhythm normal..."
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        {/* Prescription */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
            <Pill className="w-3.5 h-3.5 text-teal-600" />
            Rx / Prescribed Medications
          </label>
          <textarea
            rows={3}
            placeholder="e.g.
1. Tab Amlodipine 5mg - 1 tablet once daily in morning (30 days)
2. Tab Paracetamol 500mg - 1 tablet SOS for mild headache"
            value={prescription}
            onChange={(e) => setPrescription(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        {/* Advice & Lifestyle */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-teal-600" />
            Clinical Advice & Dietary Guidelines
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Low sodium diet, 30 min light walking daily, avoid heavy lifting..."
            value={advice}
            onChange={(e) => setAdvice(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        {/* Follow-up Date */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
            Recommended Follow-Up Date (Optional)
          </label>
          <input
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 cursor-pointer"
          />
        </div>

        {/* Submit */}
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
            disabled={isSubmitting || !diagnosis.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-teal-600/30 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Complete Consultation & Save</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
