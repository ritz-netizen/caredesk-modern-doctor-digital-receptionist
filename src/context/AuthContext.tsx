import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, Doctor } from '../types';
import { INITIAL_DOCTORS } from '../data/mockData';

interface AuthContextType {
  role: UserRole;
  currentDoctor: Doctor | null;
  receptionistName: string;
  setRole: (role: UserRole) => void;
  setCurrentDoctorId: (doctorId: string) => void;
  allDoctors: Doctor[];
  switchUser: (role: UserRole, doctorId?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode; doctors: Doctor[] }> = ({
  children,
  doctors
}) => {
  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem('curaflow_user_role');
    return (saved as UserRole) || 'receptionist';
  });

  const [currentDoctorId, setCurrentDoctorIdState] = useState<string>(() => {
    const saved = localStorage.getItem('curaflow_doctor_id');
    return saved || INITIAL_DOCTORS[0].id;
  });

  const receptionistName = 'Sarah Jenkins (Lead Receptionist)';

  useEffect(() => {
    localStorage.setItem('curaflow_user_role', role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem('curaflow_doctor_id', currentDoctorId);
  }, [currentDoctorId]);

  const currentDoctor = doctors.find((d) => d.id === currentDoctorId) || doctors[0] || null;

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
  };

  const setCurrentDoctorId = (id: string) => {
    setCurrentDoctorIdState(id);
  };

  const switchUser = (newRole: UserRole, doctorId?: string) => {
    setRoleState(newRole);
    if (doctorId) {
      setCurrentDoctorIdState(doctorId);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        currentDoctor,
        receptionistName,
        setRole,
        setCurrentDoctorId,
        allDoctors: doctors,
        switchUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
