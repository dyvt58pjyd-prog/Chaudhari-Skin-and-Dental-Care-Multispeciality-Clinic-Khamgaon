import React, { useState } from 'react';
import { DoctorRole } from '../types/clinic';
import { CLINIC_INFO } from '../services/clinicData';
import { ROLE_LABELS, clearActiveSession, saveActiveSession } from '../services/auth';
import { sound } from '../services/sound';
import { useClinicStore } from '../services/clinicStore';
import { PinModal } from './PinModal';
import {
  ExternalLink,
  RotateCcw,
  Cloud,
  LogOut,
  Star,
  Info,
  FolderOpen,
  Lock,
  CalendarCheck,
  ShieldCheck
} from 'lucide-react';

interface HeaderProps {
  currentRole: DoctorRole | null;
  onSelectRole: (role: DoctorRole | null) => void;
  onOpenFirebaseModal: () => void;
  onOpenInfoModal: () => void;
  onOpenRecordsModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onSelectRole,
  onOpenFirebaseModal,
  onOpenInfoModal,
  onOpenRecordsModal,
}) => {
  const { isFirebase, resetDemoData, followUpPatients } = useClinicStore();
  const [isAdminPinOpen, setIsAdminPinOpen] = useState(false);

  const handleLogout = () => {
    sound.playTapSound();
    clearActiveSession();
    onSelectRole(null);
  };

  const handleOpenNewWindow = () => {
    sound.playTapSound();
    window.open(window.location.href, '_blank', 'width=1150,height=850');
  };

  const currentRoleMeta = currentRole ? ROLE_LABELS[currentRole] : null;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-3 py-2.5 sm:px-4 sm:py-3 select-none">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        {/* Left: Clinic Branding */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 p-0.5 shadow-md shadow-cyan-950 flex-shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-base sm:text-lg font-black text-cyan-400">
              CD
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-xs sm:text-base font-black tracking-tight text-white line-clamp-1">
                <span className="inline sm:hidden">CHAUDHARI CLINIC</span>
                <span className="hidden sm:inline">{CLINIC_INFO.name.toUpperCase()}</span>
              </h1>
              <span className="text-[9px] sm:text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 flex-shrink-0">
                Khamgaon
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2 mt-0.5">
              <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-sm">
                Near Dr. Chande Clinic, Shriram Chowk, Shivalay Vihar
              </p>
              <button
                type="button"
                onClick={onOpenInfoModal}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/60 hover:bg-amber-900/60 px-1.5 py-0.5 rounded border border-amber-800/60 transition"
              >
                <Star className="w-2.5 h-2.5 fill-amber-400" />
                <span>5.0 ★ Photos</span>
              </button>
            </div>
          </div>
        </div>

        {/* Center: Department Lock Status */}
        {currentRole && currentRoleMeta && (
          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-xl sm:rounded-2xl border border-cyan-800/60 shadow-inner">
            <span className="text-sm sm:text-base">{currentRoleMeta.icon}</span>
            <div>
              <div className="text-[11px] sm:text-xs font-black text-white flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-400" />
                <span>{currentRoleMeta.name.toUpperCase()}</span>
              </div>
              <div className="text-[9px] sm:text-[10px] text-slate-400 hidden xs:block">{currentRoleMeta.dept}</div>
            </div>
          </div>
        )}

        {/* Right Tools: Patient Records, Admin Console, Live Sync, Reset, Lock / Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Patient Records Button */}
          <button
            type="button"
            onClick={onOpenRecordsModal}
            title="Search and view longitudinal patient medical records, photos, and follow-ups"
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-300 text-xs font-bold transition shadow-sm active:scale-95"
          >
            <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Records</span>
            {followUpPatients.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-black font-mono">
                {followUpPatients.length}
              </span>
            )}
          </button>

          {/* Admin Console Button (Protected by PIN 4326) */}
          <button
            type="button"
            onClick={() => {
              sound.playTapSound();
              if (currentRole === 'admin') return;
              setIsAdminPinOpen(true);
            }}
            title="Clinic Administrator Console (PIN 4326)"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-bold transition shadow-sm active:scale-95 ${
              currentRole === 'admin'
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-indigo-900/50'
                : 'bg-indigo-950/70 hover:bg-indigo-900 border-indigo-800 text-indigo-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Admin (4326)</span>
          </button>

          {/* Clinic Info Modal */}
          <button
            type="button"
            onClick={onOpenInfoModal}
            title="View Clinic Photos, Address, Timings & Services Catalog"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-300 hover:border-slate-700 hover:text-cyan-300 transition"
          >
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Info & Photos</span>
          </button>

          {/* Sync indicator */}
          <button
            type="button"
            onClick={onOpenFirebaseModal}
            title="Real-time multi-device sync active. Click to configure Firebase."
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-300 hover:border-slate-700 transition"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sync</span>
          </button>

          {/* New Window button for multi-screen testing */}
          <button
            type="button"
            onClick={handleOpenNewWindow}
            title="Open in new window to test multi-device real-time sync side-by-side"
            className="hidden lg:flex p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-slate-700 transition"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          {/* Reset Demo Data button */}
          <button
            type="button"
            onClick={resetDemoData}
            title="Reset pre-loaded Khamgaon clinic patients"
            className="hidden md:flex p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-slate-700 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Lock / Logout Button (Securely exits department) */}
          {currentRole && (
            <button
              type="button"
              onClick={handleLogout}
              className="px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl bg-red-950/70 hover:bg-red-900/80 border border-red-800 text-xs font-black text-red-300 hover:text-white flex items-center gap-1 sm:gap-1.5 transition active:scale-95 shadow-sm"
              title="Lock department and return to role login screen"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock / Logout</span>
              <span className="inline sm:hidden">Lock</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin PIN Verification Modal */}
      {isAdminPinOpen && (
        <PinModal
          role="admin"
          onSuccess={() => {
            saveActiveSession('admin');
            onSelectRole('admin');
            setIsAdminPinOpen(false);
          }}
          onCancel={() => setIsAdminPinOpen(false)}
        />
      )}
    </header>
  );
};
