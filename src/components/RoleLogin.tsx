import React, { useState } from 'react';
import { DoctorRole } from '../types/clinic';
import { useClinicStore } from '../services/clinicStore';
import { sound } from '../services/sound';
import { CLINIC_INFO } from '../services/clinicData';
import { PinModal } from './PinModal';
import { saveActiveSession } from '../services/auth';
import {
  Lock,
  ArrowRight,
  RotateCcw,
  Cloud,
  Star,
  Info,
  MapPin,
  FolderOpen
} from 'lucide-react';

interface RoleLoginProps {
  onSelectRole: (role: DoctorRole) => void;
  onOpenFirebaseModal: () => void;
  onOpenInfoModal: () => void;
  onOpenRecordsModal: () => void;
}

export const RoleLogin: React.FC<RoleLoginProps> = ({
  onSelectRole,
  onOpenFirebaseModal,
  onOpenInfoModal,
  onOpenRecordsModal,
}) => {
  const { cabins, waitingPatients, billedPatients, resetDemoData, isFirebase } = useClinicStore();

  // State for PIN modal prompt
  const [pendingRole, setPendingRole] = useState<DoctorRole | null>(null);

  const handleCardClick = (role: DoctorRole) => {
    sound.playTapSound();
    setPendingRole(role);
  };

  const handlePinSuccess = () => {
    if (pendingRole) {
      saveActiveSession(pendingRole);
      onSelectRole(pendingRole);
      setPendingRole(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 flex flex-col items-center">
      {/* Clinic Title & Khamgaon Location */}
      <div className="text-center mb-8 space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-xs font-black uppercase tracking-wider mb-1 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          Khamgaon Multispeciality Healthcare
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tight">
          {CLINIC_INFO.name.toUpperCase()}
        </h1>

        <p className="text-base sm:text-lg font-bold text-cyan-400">
          Skin, Hair & Advanced Multispeciality Dental Care
        </p>

        {/* Address & Verified Badge */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1 text-xs text-slate-300">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-cyan-400" />
            {CLINIC_INFO.address}
          </span>
          <span>•</span>
          <button
            type="button"
            onClick={onOpenInfoModal}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-600 text-amber-300 font-bold hover:bg-amber-900 transition"
          >
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>5.0 / 5.0 (4 Reviews & Photos)</span>
          </button>
        </div>
      </div>

      {/* Role Prompt */}
      <div className="text-center mb-6">
        <h2 className="text-lg font-black text-white flex items-center justify-center gap-2">
          <Lock className="w-4 h-4 text-cyan-400" />
          Secure Department Access
        </h2>
        <p className="text-xs text-slate-400">
          Each department requires its authorized security PIN to enter
        </p>
      </div>

      {/* 4 GIANT ROLE CARDS (WITH PIN AUTHENTICATION) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full mb-10">
        {/* CARD 1: RECEPTION (FRONT DESK) */}
        <div
          onClick={() => handleCardClick('reception')}
          className="group touch-btn min-h-[250px] bg-slate-900 hover:bg-slate-850 border-2 border-slate-800 hover:border-cyan-400 rounded-3xl p-6 cursor-pointer transition-all duration-200 shadow-xl hover:shadow-cyan-950/60 flex flex-col justify-between select-none relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-14 h-14 rounded-2xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-3xl group-hover:scale-105 transition-transform">
                🖥️
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-950 border border-slate-700 text-slate-400 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-cyan-400" />
                PIN
              </span>
            </div>
            <h3 className="text-xl font-black text-white tracking-tight group-hover:text-cyan-300">
              RECEPTION
            </h3>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              Front Desk & Billing
            </p>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Patients in Line:</span>
              <span className="font-mono font-black text-cyan-400">
                {waitingPatients.length}
              </span>
            </div>
            {billedPatients.length > 0 && (
              <div className="flex items-center justify-between text-xs font-bold text-amber-400 bg-amber-950/40 px-2 py-1 rounded-lg border border-amber-900/50">
                <span>Collect Money:</span>
                <span>{billedPatients.length} Bills</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs font-black text-cyan-400 pt-1 group-hover:translate-x-1 transition-transform">
              <span>ENTER PIN TO ACCESS</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* CARD 2: SKIN DOCTOR */}
        <div
          onClick={() => handleCardClick('skin')}
          className="group touch-btn min-h-[250px] bg-slate-900 hover:bg-slate-850 border-2 border-slate-800 hover:border-purple-400 rounded-3xl p-6 cursor-pointer transition-all duration-200 shadow-xl hover:shadow-purple-950/60 flex flex-col justify-between select-none relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-3xl group-hover:scale-105 transition-transform">
                🩺
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-950 border border-slate-700 text-slate-400 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-purple-400" />
                PIN
              </span>
            </div>
            <h3 className="text-xl font-black text-white tracking-tight group-hover:text-purple-300">
              SKIN DOCTOR
            </h3>
            <p className="text-xs font-bold text-purple-300 mt-1">
              Dr. Rajanikant Chaudhari
            </p>
            <p className="text-[11px] text-slate-400">
              Skin, Hair & Cosmetology
            </p>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Cabin Status:</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  cabins.skin.status === 'free'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-red-600 text-white animate-pulse'
                }`}
              >
                {cabins.skin.status === 'free' ? 'FREE' : 'BUSY'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-black text-purple-400 pt-1 group-hover:translate-x-1 transition-transform">
              <span>ENTER PIN TO ACCESS</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* CARD 3: DENTAL DOCTOR 1 */}
        <div
          onClick={() => handleCardClick('dental1')}
          className="group touch-btn min-h-[250px] bg-slate-900 hover:bg-slate-850 border-2 border-slate-800 hover:border-cyan-400 rounded-3xl p-6 cursor-pointer transition-all duration-200 shadow-xl hover:shadow-cyan-950/60 flex flex-col justify-between select-none relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-14 h-14 rounded-2xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-3xl group-hover:scale-105 transition-transform">
                🦷
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-950 border border-slate-700 text-slate-400 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-cyan-400" />
                PIN
              </span>
            </div>
            <h3 className="text-xl font-black text-white tracking-tight group-hover:text-cyan-300">
              DENTAL DOCTOR 1
            </h3>
            <p className="text-xs font-bold text-cyan-300 mt-1">
              Dr. Shrutika Tulaskar (Chaudhari)
            </p>
            <p className="text-[11px] text-slate-400">
              Dental Doctor (Cabin 1)
            </p>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Chair Status:</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  cabins.dental1.status === 'free'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-red-600 text-white animate-pulse'
                }`}
              >
                {cabins.dental1.status === 'free' ? 'FREE' : 'BUSY'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-black text-cyan-400 pt-1 group-hover:translate-x-1 transition-transform">
              <span>ENTER PIN TO ACCESS</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* CARD 4: DENTAL DOCTOR 2 */}
        <div
          onClick={() => handleCardClick('dental2')}
          className="group touch-btn min-h-[250px] bg-slate-900 hover:bg-slate-850 border-2 border-slate-800 hover:border-emerald-400 rounded-3xl p-6 cursor-pointer transition-all duration-200 shadow-xl hover:shadow-emerald-950/60 flex flex-col justify-between select-none relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-3xl group-hover:scale-105 transition-transform">
                🦷
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-950 border border-slate-700 text-slate-400 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-emerald-400" />
                PIN
              </span>
            </div>
            <h3 className="text-xl font-black text-white tracking-tight group-hover:text-emerald-300">
              DENTAL DOCTOR 2
            </h3>
            <p className="text-xs font-bold text-emerald-300 mt-1">
              Dr. Priyanka Chaudhari (Anokar)
            </p>
            <p className="text-[11px] text-slate-400">
              Dental Doctor (Cabin 2)
            </p>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Chair Status:</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  cabins.dental2.status === 'free'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-red-600 text-white animate-pulse'
                }`}
              >
                {cabins.dental2.status === 'free' ? 'FREE' : 'BUSY'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-black text-emerald-400 pt-1 group-hover:translate-x-1 transition-transform">
              <span>ENTER PIN TO ACCESS</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* MASTER ADMIN CONSOLE CARD (LOCKED BY PIN 4326) */}
      <div
        onClick={() => handleCardClick('admin')}
        className="group touch-btn w-full bg-slate-900 hover:bg-slate-850 border-2 border-indigo-900/80 hover:border-indigo-400 rounded-3xl p-5 sm:p-6 cursor-pointer transition-all duration-200 shadow-xl hover:shadow-indigo-950/60 flex flex-col md:flex-row items-center justify-between gap-4 mb-8 select-none relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-3xl group-hover:scale-105 transition-transform flex-shrink-0">
            🛡️
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-indigo-400" />
                ADMIN PROFILE (PIN 4326)
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                Clinic Administrator
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight group-hover:text-indigo-300">
              ADMIN CONSOLE & MASTER SYSTEM SETTINGS
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Financial Collections, Doctor Access PINs, Procedure Pricing Catalog, 150+ Formulary Database, Clinic Branding & Backup
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto justify-between sm:justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
          <div className="text-right hidden lg:block">
            <div className="text-xs font-mono font-bold text-indigo-400">
              CONFIDENTIAL PIN: 4326
            </div>
            <div className="text-[10px] text-slate-500">
              Authorized personnel only
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-900/50 group-hover:translate-x-1 transition-transform">
            <span>ENTER ADMIN PIN</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Footer Utilities */}
      <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
        <button
          type="button"
          onClick={onOpenRecordsModal}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 hover:text-white flex items-center gap-2 hover:border-slate-700 transition"
        >
          <FolderOpen className="w-4 h-4 text-cyan-400" />
          <span>Patient Medical Records Directory</span>
        </button>

        <button
          type="button"
          onClick={onOpenInfoModal}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 flex items-center gap-2 hover:border-slate-700 transition"
        >
          <Info className="w-4 h-4 text-cyan-400" />
          <span>Clinic Profile, Photos & Catalog</span>
        </button>

        <button
          type="button"
          onClick={onOpenFirebaseModal}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 flex items-center gap-2 hover:border-slate-700 transition"
        >
          <Cloud className="w-4 h-4 text-cyan-400" />
          <span>Sync: </span>
          <strong className="text-emerald-400">
            {isFirebase ? 'Cloud Firestore Connected' : 'Local Fast Bus'}
          </strong>
        </button>

        <button
          type="button"
          onClick={resetDemoData}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 flex items-center gap-2 hover:border-slate-700 transition"
        >
          <RotateCcw className="w-4 h-4 text-amber-400" />
          <span>Reset Sample Khamgaon Demo Patients</span>
        </button>
      </div>

      {/* PIN Prompt Modal */}
      {pendingRole && (
        <PinModal
          role={pendingRole}
          onSuccess={handlePinSuccess}
          onCancel={() => setPendingRole(null)}
        />
      )}
    </div>
  );
};
