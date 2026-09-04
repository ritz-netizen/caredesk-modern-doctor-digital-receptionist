import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Search,
  PlusCircle,
  UserCheck,
  Stethoscope,
  ChevronDown,
  Menu,
  Sparkles,
  Building2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useClinic } from '../../context/ClinicContext';
import { NotificationDropdown } from './NotificationDropdown';
import { formatDate } from '../../utils/dateFormatter';

interface HeaderProps {
  onOpenBooking: () => void;
  onToggleMobileMenu: () => void;
  onSearchSelect?: (term: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenBooking,
  onToggleMobileMenu,
  onSearchSelect
}) => {
  const { role, currentDoctor, receptionistName, allDoctors, switchUser } = useAuth();
  const { selectedDate, setSelectedDate, appointments, patients, doctors } = useClinic();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter search results
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();

    const matchedPatients = patients
      .filter((p) => p.name.toLowerCase().includes(q) || p.patientNumber.toLowerCase().includes(q) || p.phone.includes(q))
      .slice(0, 3)
      .map((p) => ({ type: 'Patient' as const, title: p.name, sub: `${p.patientNumber} · ${p.phone}`, item: p }));

    const matchedAppointments = appointments
      .filter((a) => a.appointmentNumber.toLowerCase().includes(q) || a.patientName.toLowerCase().includes(q) || a.doctorName.toLowerCase().includes(q))
      .slice(0, 3)
      .map((a) => ({ type: 'Appointment' as const, title: `${a.appointmentNumber} · ${a.patientName}`, sub: `${a.date} at ${a.timeSlot} (${a.doctorName})`, item: a }));

    const matchedDoctors = doctors
      .filter((d) => d.name.toLowerCase().includes(q) || d.specialty.toLowerCase().includes(q))
      .slice(0, 2)
      .map((d) => ({ type: 'Doctor' as const, title: d.name, sub: `${d.specialty} · ${d.roomNumber}`, item: d }));

    return [...matchedPatients, ...matchedAppointments, ...matchedDoctors];
  }, [searchQuery, patients, appointments, doctors]);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-xs backdrop-blur-md">
      <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">
                  Care<span className="text-teal-600">Desk</span>
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 rounded">
                  CLINIC OS
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-400 font-medium">
                St. Jude Medical Center
              </p>
            </div>
          </div>
        </div>

        {/* Middle: Global Quick Search & Date Selector */}
        <div className="flex-1 max-w-xl mx-2 hidden md:flex items-center gap-3">
          {/* Quick Search */}
          <div className="relative flex-1" ref={searchRef}>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search patient, doctor, appointment #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
              />
            </div>

            {/* Autocomplete Dropdown */}
            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                <div className="p-2 border-b border-slate-100 bg-slate-50 text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                  Search Matches ({searchResults.length})
                </div>
                <div className="divide-y divide-slate-50 max-h-60 overflow-y-auto">
                  {searchResults.map((res, i) => (
                    <div
                      key={i}
                      className="p-2.5 hover:bg-teal-50/50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      onClick={() => {
                        if (onSearchSelect) onSearchSelect(res.title);
                        setIsSearchFocused(false);
                        setSearchQuery('');
                      }}
                    >
                      <div>
                        <span className="font-semibold text-slate-800">{res.title}</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">{res.sub}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                        {res.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Operational Date Picker */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <CalendarIcon className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            />
            {selectedDate !== '2026-09-05' && (
              <button
                onClick={() => setSelectedDate('2026-09-05')}
                className="text-[10px] text-teal-600 hover:text-teal-800 font-semibold underline ml-1"
                title="Reset to clinic operational date"
              >
                Today
              </button>
            )}
          </div>
        </div>

        {/* Right: Quick Action, Notifications, Role Switcher */}
        <div className="flex items-center gap-2.5">
          {/* Quick Book Appointment CTA */}
          <button
            onClick={onOpenBooking}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-semibold shadow-xs shadow-teal-600/20 transition-all duration-150"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Book Appointment</span>
          </button>

          {/* Notifications Dropdown */}
          <NotificationDropdown />

          <div className="h-6 w-px bg-slate-200 mx-0.5 hidden sm:block" />

          {/* Active Role & User Switcher */}
          <div className="relative" ref={roleDropdownRef}>
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all text-left"
              title="Switch user role"
            >
              {role === 'receptionist' ? (
                <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
              ) : (
                <img
                  src={currentDoctor?.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150'}
                  alt={currentDoctor?.name || 'Doctor'}
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200 flex-shrink-0"
                />
              )}

              <div className="hidden sm:block">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-800 leading-tight">
                    {role === 'receptionist' ? 'Reception Desk' : currentDoctor?.name}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-teal-600 bg-teal-50 px-1 rounded">
                    {role === 'receptionist' ? 'Desk' : 'MD'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  {role === 'receptionist' ? 'Sarah J. (Front Desk)' : currentDoctor?.specialty}
                </p>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {/* Role Dropdown Menu */}
            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Switch Workspace Role
                  </span>
                </div>

                {/* Receptionist Option */}
                <button
                  onClick={() => {
                    switchUser('receptionist');
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-colors ${
                    role === 'receptionist'
                      ? 'bg-teal-50 text-teal-900 border border-teal-100'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Receptionist View</div>
                    <div className="text-[11px] text-slate-500">{receptionistName}</div>
                  </div>
                </button>

                <div className="px-3 pt-3 pb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Switch Doctor View
                  </span>
                </div>

                {/* Doctors List */}
                <div className="max-h-56 overflow-y-auto space-y-1">
                  {allDoctors.map((doc) => {
                    const isCurrent = role === 'doctor' && currentDoctor?.id === doc.id;
                    return (
                      <button
                        key={doc.id}
                        onClick={() => {
                          switchUser('doctor', doc.id);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-xl flex items-center gap-2.5 transition-colors ${
                          isCurrent
                            ? 'bg-teal-50 text-teal-900 border border-teal-100'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <img
                          src={doc.avatar}
                          alt={doc.name}
                          className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-slate-900 truncate">
                            {doc.name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {doc.specialty} · {doc.roomNumber}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
