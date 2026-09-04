import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  Coffee,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  CalendarOff,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useClinic } from '../../context/ClinicContext';
import { WorkingHours, BreakTime } from '../../types';
import { formatDate } from '../../utils/dateFormatter';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const DoctorScheduleManager: React.FC = () => {
  const { currentDoctor } = useAuth();
  const { updateDoctorWorkingHours, updateDoctorBreaks, toggleDoctorLeaveDate } = useClinic();

  const [workingHours, setWorkingHours] = useState<{ [day: number]: WorkingHours }>(
    currentDoctor?.workingHours || {
      0: { isWorking: false, start: '09:00', end: '17:00' },
      1: { isWorking: true, start: '09:00', end: '17:00' },
      2: { isWorking: true, start: '09:00', end: '17:00' },
      3: { isWorking: true, start: '09:00', end: '17:00' },
      4: { isWorking: true, start: '09:00', end: '17:00' },
      5: { isWorking: true, start: '09:00', end: '17:00' },
      6: { isWorking: true, start: '09:00', end: '14:00' },
    }
  );

  const [breaks, setBreaks] = useState<BreakTime[]>(currentDoctor?.breakTimes || []);
  const [newLeaveDate, setNewLeaveDate] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync if current doctor changes
  React.useEffect(() => {
    if (currentDoctor) {
      setWorkingHours(currentDoctor.workingHours);
      setBreaks(currentDoctor.breakTimes || []);
    }
  }, [currentDoctor]);

  if (!currentDoctor) return null;

  const handleWorkingHourChange = (
    dayIndex: number,
    field: keyof WorkingHours,
    value: boolean | string
  ) => {
    setWorkingHours((prev) => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        [field]: value,
      },
    }));
    setSaveSuccess(false);
  };

  const handleAddBreak = () => {
    const newBreak: BreakTime = {
      id: 'break-' + Date.now(),
      title: 'Break',
      start: '13:00',
      end: '14:00',
    };
    setBreaks([...breaks, newBreak]);
    setSaveSuccess(false);
  };

  const handleRemoveBreak = (id: string) => {
    setBreaks(breaks.filter((b) => b.id !== id));
    setSaveSuccess(false);
  };

  const handleBreakChange = (id: string, field: keyof BreakTime, value: string) => {
    setBreaks(
      breaks.map((b) => {
        if (b.id === id) {
          return { ...b, [field]: value };
        }
        return b;
      })
    );
    setSaveSuccess(false);
  };

  const handleSaveSchedule = () => {
    updateDoctorWorkingHours(currentDoctor.id, workingHours);
    updateDoctorBreaks(currentDoctor.id, breaks);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeaveDate) return;
    toggleDoctorLeaveDate(currentDoctor.id, newLeaveDate);
    setNewLeaveDate('');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-teal-600" />
            Working Hours & Shift Configuration
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure your active shift hours, daily break times, and block leave days. Time slots are generated strictly within these hours.
          </p>
        </div>

        <button
          onClick={handleSaveSchedule}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/30 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Save Schedule Settings</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Your working hours and break schedules have been successfully updated!</span>
        </div>
      )}

      {/* SECTION 1: Weekly Working Hours */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-teal-600" />
          Weekly Operating Shift
        </h3>

        <div className="divide-y divide-slate-100">
          {DAYS.map((dayName, idx) => {
            const config = workingHours[idx] || { isWorking: false, start: '09:00', end: '17:00' };
            return (
              <div
                key={dayName}
                className={`py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                  !config.isWorking ? 'opacity-60 bg-slate-50/50 px-3 rounded-xl' : ''
                }`}
              >
                <div className="w-36 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id={`day-${idx}`}
                    checked={config.isWorking}
                    onChange={(e) => handleWorkingHourChange(idx, 'isWorking', e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 cursor-pointer"
                  />
                  <label htmlFor={`day-${idx}`} className="font-bold text-slate-800 cursor-pointer">
                    {dayName}
                  </label>
                </div>

                {config.isWorking ? (
                  <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500 font-medium">Shift Start:</span>
                      <input
                        type="time"
                        value={config.start}
                        onChange={(e) => handleWorkingHourChange(idx, 'start', e.target.value)}
                        className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white"
                      />
                    </div>
                    <span className="text-slate-400">to</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500 font-medium">Shift End:</span>
                      <input
                        type="time"
                        value={config.end}
                        onChange={(e) => handleWorkingHourChange(idx, 'end', e.target.value)}
                        className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-slate-400 italic">Day Off / Clinic Closed</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Daily Breaks (Lunch, Procedures) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Coffee className="w-4 h-4 text-indigo-600" />
              Daily Breaks & Blocked Hours
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Patients cannot book appointment slots that overlap with scheduled breaks.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddBreak}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Break</span>
          </button>
        </div>

        {breaks.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs text-slate-400 border border-dashed border-slate-200">
            No break intervals configured. Click "+ Add Break" to block lunch or tea times.
          </div>
        ) : (
          <div className="space-y-3">
            {breaks.map((b) => (
              <div
                key={b.id}
                className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <input
                  type="text"
                  value={b.title}
                  placeholder="Break Title (e.g. Lunch Break)"
                  onChange={(e) => handleBreakChange(b.id, 'title', e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                />

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">From:</span>
                  <input
                    type="time"
                    value={b.start}
                    onChange={(e) => handleBreakChange(b.id, 'start', e.target.value)}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                  />
                  <span className="text-slate-400">to</span>
                  <input
                    type="time"
                    value={b.end}
                    onChange={(e) => handleBreakChange(b.id, 'end', e.target.value)}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveBreak(b.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 ml-2 transition-colors"
                    title="Remove Break"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: Scheduled Leaves & Emergency Offs */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CalendarOff className="w-4 h-4 text-purple-600" />
            Scheduled Leaves & Off Days
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Dates blocked here prevent receptionists or patients from booking any appointments on that full day.
          </p>
        </div>

        {/* Add Leave Date Form */}
        <form onSubmit={handleAddLeave} className="flex items-center gap-3">
          <input
            type="date"
            required
            value={newLeaveDate}
            onChange={(e) => setNewLeaveDate(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500/20"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Leave Date</span>
          </button>
        </form>

        {/* Scheduled Leaves List */}
        {currentDoctor.leaveDates && currentDoctor.leaveDates.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-2">
            {currentDoctor.leaveDates.map((leaveDate) => (
              <div
                key={leaveDate}
                className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-semibold flex items-center gap-2"
              >
                <span>{formatDate(leaveDate, 'EEE, MMMM d, yyyy')}</span>
                <button
                  type="button"
                  onClick={() => toggleDoctorLeaveDate(currentDoctor.id, leaveDate)}
                  className="text-purple-400 hover:text-purple-700 transition-colors"
                  title="Remove Leave"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No scheduled leave dates.</p>
        )}
      </div>
    </div>
  );
};
