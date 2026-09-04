import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Clock,
  History,
  Activity,
  RotateCcw,
  Stethoscope,
  ChevronRight,
  X,
  Building,
  CalendarCheck2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useClinic } from '../../context/ClinicContext';

export type NavTab =
  | 'dashboard'
  | 'appointments'
  | 'availability'
  | 'calendar'
  | 'patients'
  | 'audit'
  | 'doctor-schedule';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile
}) => {
  const { role, currentDoctor, receptionistName } = useAuth();
  const { appointments, selectedDate, resetToDemoData } = useClinic();

  // Calculate today's pending or in-progress count
  const todayAppointments = appointments.filter((a) => a.date === selectedDate);
  const waitingCount = todayAppointments.filter((a) => a.status === 'in_progress' || a.status === 'confirmed').length;

  const receptionistNav = [
    { id: 'dashboard' as NavTab, label: 'Reception Dashboard', icon: LayoutDashboard, badge: undefined },
    { id: 'appointments' as NavTab, label: 'Appointments & Queue', icon: CalendarCheck2, badge: waitingCount > 0 ? waitingCount : undefined },
    { id: 'availability' as NavTab, label: 'Doctor Availability', icon: Activity, badge: undefined },
    { id: 'calendar' as NavTab, label: 'Master Schedule', icon: CalendarDays, badge: undefined },
    { id: 'patients' as NavTab, label: 'Patient Directory', icon: Users, badge: undefined },
    { id: 'audit' as NavTab, label: 'Audit Trail & Logs', icon: History, badge: undefined },
  ];

  const doctorNav = [
    { id: 'dashboard' as NavTab, label: "My Patient Queue", icon: LayoutDashboard, badge: waitingCount > 0 ? waitingCount : undefined },
    { id: 'doctor-schedule' as NavTab, label: 'My Hours & Leaves', icon: Clock, badge: undefined },
    { id: 'calendar' as NavTab, label: 'Clinic Schedule', icon: CalendarDays, badge: undefined },
    { id: 'patients' as NavTab, label: 'Patients Directory', icon: Users, badge: undefined },
    { id: 'audit' as NavTab, label: 'Audit Trail', icon: History, badge: undefined },
  ];

  const navItems = role === 'receptionist' ? receptionistNav : doctorNav;

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200/80">
      {/* Clinic Branch Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Downtown Clinic</h4>
            <p className="text-[10px] text-slate-400">Wing A & B · Floor 1-4</p>
          </div>
        </div>
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User Context Banner */}
      <div className="p-3 mx-3 my-3 rounded-xl bg-gradient-to-br from-slate-50 to-teal-50/40 border border-teal-100/60">
        <div className="flex items-center gap-2">
          {role === 'receptionist' ? (
            <div className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          )}
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Current Workspace
          </span>
        </div>
        <div className="mt-1 text-xs font-bold text-slate-900 truncate">
          {role === 'receptionist' ? 'Receptionist Station' : currentDoctor?.name}
        </div>
        <div className="text-[11px] text-slate-500 truncate">
          {role === 'receptionist' ? 'Front Desk & Patient Flow' : currentDoctor?.specialty}
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {!isActive && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Utilities */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
        <button
          onClick={() => {
            if (window.confirm('Reset all demo data (doctors, appointments, patients) back to original state?')) {
              resetToDemoData();
            }
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo Data</span>
        </button>

        <div className="text-center text-[10px] text-slate-400">
          CareDesk Health v1.0 · HIPAA Compliant
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0 h-[calc(100vh-61px)] sticky top-[61px]">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] h-full z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
