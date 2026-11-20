import React, { useState } from 'react';
import { DoctorRole } from './types/clinic';
import { Header } from './components/Header';
import { RoleLogin } from './components/RoleLogin';
import { ReceptionScreen } from './components/Reception/ReceptionScreen';
import { SkinDoctorCabin } from './components/Doctors/SkinDoctorCabin';
import { DentalDoctorCabin } from './components/Doctors/DentalDoctorCabin';
import { FirebaseModal } from './components/FirebaseModal';
import { ClinicInfoModal } from './components/ClinicInfoModal';
import { PatientRecordsModal } from './components/PatientHistory/PatientRecordsModal';
import { AdminScreen } from './components/Admin/AdminScreen';

export function App() {
  // Check URL query parameters for initial role e.g. ?role=reception or ?role=dental1 or ?role=admin
  const [currentRole, setCurrentRole] = useState<DoctorRole | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role') as DoctorRole;
      if (['reception', 'skin', 'dental1', 'dental2', 'admin'].includes(roleParam)) {
        return roleParam;
      }
    }
    return null;
  });

  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [isClinicInfoModalOpen, setIsClinicInfoModalOpen] = useState(false);
  const [isRecordsModalOpen, setIsRecordsModalOpen] = useState(false);

  // Sync role to URL query parameter without reload for easy bookmarking
  const handleSelectRole = (role: DoctorRole | null) => {
    setCurrentRole(role);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (role) {
        url.searchParams.set('role', role);
      } else {
        url.searchParams.delete('role');
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Header */}
      <Header
        currentRole={currentRole}
        onSelectRole={handleSelectRole}
        onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
        onOpenInfoModal={() => setIsClinicInfoModalOpen(true)}
        onOpenRecordsModal={() => setIsRecordsModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        {!currentRole && (
          <RoleLogin
            onSelectRole={handleSelectRole}
            onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
            onOpenInfoModal={() => setIsClinicInfoModalOpen(true)}
            onOpenRecordsModal={() => setIsRecordsModalOpen(true)}
          />
        )}

        {currentRole === 'reception' && <ReceptionScreen />}

        {currentRole === 'skin' && <SkinDoctorCabin />}

        {currentRole === 'dental1' && <DentalDoctorCabin cabinId="dental1" />}

        {currentRole === 'dental2' && <DentalDoctorCabin cabinId="dental2" />}

        {currentRole === 'admin' && (
          <AdminScreen onExit={() => handleSelectRole(null)} />
        )}
      </main>

      {/* Firebase Sync Settings Modal */}
      {isFirebaseModalOpen && (
        <FirebaseModal onClose={() => setIsFirebaseModalOpen(false)} />
      )}

      {/* Clinic Info, Photos & Reviews Modal */}
      {isClinicInfoModalOpen && (
        <ClinicInfoModal onClose={() => setIsClinicInfoModalOpen(false)} />
      )}

      {/* Comprehensive Patient Dossier & Past Records Modal */}
      {isRecordsModalOpen && (
        <PatientRecordsModal
          doctorRole={currentRole || undefined}
          onClose={() => setIsRecordsModalOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
