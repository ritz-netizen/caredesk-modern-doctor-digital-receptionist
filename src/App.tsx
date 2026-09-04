import React, { useState } from 'react';
import { ClinicProvider, useClinic } from './context/ClinicContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { Sidebar, NavTab } from './components/common/Sidebar';
import { ReceptionistDashboard } from './components/receptionist/ReceptionistDashboard';
import { DoctorDashboard } from './components/doctor/DoctorDashboard';
import { DoctorScheduleManager } from './components/doctor/DoctorScheduleManager';
import { ScheduleCalendar } from './components/calendar/ScheduleCalendar';
import { PatientManagement } from './components/patients/PatientManagement';
import { AuditTrailView } from './components/audit/AuditTrailView';
import { QuickBookingModal } from './components/receptionist/QuickBookingModal';
import { RescheduleModal } from './components/receptionist/RescheduleModal';
import { CancelModal } from './components/receptionist/CancelModal';
import { AppointmentDetailsModal } from './components/receptionist/AppointmentDetailsModal';
import { DoctorAvailabilityCard } from './components/receptionist/DoctorAvailabilityCard';
import { Appointment } from './types';
import { Stethoscope, Activity, CalendarCheck2 } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { role } = useAuth();
  const { doctors, updateAppointmentStatus } = useClinic();
  const { receptionistName } = useAuth();

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Modal States
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [preselectedDoctorId, setPreselectedDoctorId] = useState<string | undefined>(undefined);
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null);
  const [cancelApt, setCancelApt] = useState<Appointment | null>(null);
  const [detailsApt, setDetailsApt] = useState<Appointment | null>(null);

  // Handle open booking with optional doctor pre-selection
  const handleOpenBooking = (doctorId?: string) => {
    setPreselectedDoctorId(doctorId);
    setIsBookingOpen(true);
  };

  // Handle successful booking
  const handleBookingSuccess = (newApt: Appointment) => {
    setDetailsApt(newApt); // automatically show newly booked slip!
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation Bar */}
      <Header
        onOpenBooking={() => handleOpenBooking()}
        onToggleMobileMenu={() => setMobileSidebarOpen(true)}
      />

      {/* Main Body */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Left Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Dynamic Content View Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {/* RECEPTIONIST VIEWS */}
          {role === 'receptionist' && (
            <>
              {(currentTab === 'dashboard' || currentTab === 'appointments') && (
                <ReceptionistDashboard
                  onOpenBooking={handleOpenBooking}
                  onOpenReschedule={(apt) => setRescheduleApt(apt)}
                  onOpenCancel={(apt) => setCancelApt(apt)}
                  onOpenDetails={(apt) => setDetailsApt(apt)}
                />
              )}

              {currentTab === 'availability' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                      <Activity className="w-6 h-6 text-teal-600" />
                      Doctor Real-Time Availability & Duty Status
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Monitor which doctors are available, in consultation, on break, or on leave.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {doctors.map((doc) => (
                      <DoctorAvailabilityCard
                        key={doc.id}
                        doctor={doc}
                        onBookWithDoctor={(docId) => handleOpenBooking(docId)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {currentTab === 'calendar' && <ScheduleCalendar />}

              {currentTab === 'patients' && (
                <PatientManagement
                  onBookForPatient={(patId) => {
                    handleOpenBooking();
                  }}
                />
              )}

              {currentTab === 'audit' && <AuditTrailView />}
            </>
          )}

          {/* DOCTOR VIEWS */}
          {role === 'doctor' && (
            <>
              {currentTab === 'dashboard' && <DoctorDashboard />}

              {currentTab === 'doctor-schedule' && <DoctorScheduleManager />}

              {currentTab === 'calendar' && <ScheduleCalendar />}

              {currentTab === 'patients' && (
                <PatientManagement
                  onBookForPatient={() => {
                    handleOpenBooking();
                  }}
                />
              )}

              {currentTab === 'audit' && <AuditTrailView />}
            </>
          )}
        </main>
      </div>

      {/* GLOBAL MODALS */}
      {/* 1. Quick Booking Modal */}
      <QuickBookingModal
        isOpen={isBookingOpen}
        onClose={() => {
          setIsBookingOpen(false);
          setPreselectedDoctorId(undefined);
        }}
        preselectedDoctorId={preselectedDoctorId}
        onBookingSuccess={handleBookingSuccess}
      />

      {/* 2. Safe Reschedule Modal */}
      <RescheduleModal
        isOpen={!!rescheduleApt}
        onClose={() => setRescheduleApt(null)}
        appointment={rescheduleApt}
      />

      {/* 3. Safe Cancellation Modal */}
      <CancelModal
        isOpen={!!cancelApt}
        onClose={() => setCancelApt(null)}
        appointment={cancelApt}
      />

      {/* 4. Appointment Slip & Details Modal */}
      <AppointmentDetailsModal
        isOpen={!!detailsApt}
        onClose={() => setDetailsApt(null)}
        appointment={detailsApt}
        onCheckIn={(aptId) => {
          updateAppointmentStatus(aptId, 'in_progress', receptionistName, 'Receptionist');
        }}
        onOpenReschedule={(apt) => setRescheduleApt(apt)}
        onOpenCancel={(apt) => setCancelApt(apt)}
      />
    </div>
  );
};

export function App() {
  return (
    <ClinicProvider>
      <ClinicConsumerWrapper />
    </ClinicProvider>
  );
}

const ClinicConsumerWrapper: React.FC = () => {
  const { doctors } = useClinic();
  return (
    <AuthProvider doctors={doctors}>
      <MainAppContent />
    </AuthProvider>
  );
};

export default App;
