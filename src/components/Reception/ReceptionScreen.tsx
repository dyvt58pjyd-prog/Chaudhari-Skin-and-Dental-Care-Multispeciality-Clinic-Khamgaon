import React, { useState } from 'react';
import { useClinicStore } from '../../services/clinicStore';
import { DoctorRole, Patient } from '../../types/clinic';
import { sound } from '../../services/sound';
import { BillReceiptModal } from '../BillReceiptModal';
import { UPIModal } from '../UPIModal';
import { PatientRecordsModal } from '../PatientHistory/PatientRecordsModal';
import confetti from 'canvas-confetti';
import {
  UserPlus,
  Stethoscope,
  Sparkles,
  Phone,
  User,
  ArrowRight,
  Clock,
  DollarSign,
  Printer,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Coins,
  QrCode,
  CalendarCheck,
  FolderOpen,
  MapPin
} from 'lucide-react';

const COMMON_CITIES = ['Khamgaon', 'Shegaon', 'Malkapur', 'Nandura', 'Jalgaon Jamod', 'Buldhana'];

export const ReceptionScreen: React.FC = () => {
  const {
    cabins,
    patients,
    waitingPatients,
    billedPatients,
    completedPatients,
    followUpPatients,
    waitingCount,
    returningDirectory,
    addPatient,
    sendNextPatientToCabin,
    markBillPaid,
  } = useClinicStore();

  // Block 1 Form State: Name, Age, City, Mobile, Doctor
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientCity, setPatientCity] = useState('Khamgaon');
  const [patientGender, setPatientGender] = useState('Male');
  const [mobileNumber, setMobileNumber] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<'skin' | 'dental1' | 'dental2'>('skin');
  const [justAddedAlert, setJustAddedAlert] = useState<string | null>(null);

  // Modal states for printing/UPI/Records
  const [activeReceiptPatient, setActiveReceiptPatient] = useState<Patient | null>(null);
  const [activeUPIPatient, setActiveUPIPatient] = useState<Patient | null>(null);
  const [isRecordsOpen, setIsRecordsOpen] = useState(false);

  // Auto-fill returning patient name when 10 digits entered
  const handleMobileChange = (val: string) => {
    const cleanDigits = val.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(cleanDigits);

    if (cleanDigits.length === 10) {
      if (returningDirectory[cleanDigits]) {
        setPatientName(returningDirectory[cleanDigits]);
        sound.playTapSound();
      }
    }
  };

  const handleAddPatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      alert('Please enter patient name');
      return;
    }
    if (!mobileNumber || mobileNumber.length < 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }

    const patient = addPatient(mobileNumber, patientName, patientAge, patientCity, selectedDoctor, patientGender);
    setJustAddedAlert(
      `Token #${patient.tokenNumber} (${patient.name}${patient.age ? ', ' + patient.age + 'y' : ''}, ${patient.city || 'Khamgaon'}) added to line!`
    );
    setMobileNumber('');
    setPatientName('');
    setPatientAge('');

    setTimeout(() => {
      setJustAddedAlert(null);
    }, 4000);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#3b82f6', '#f59e0b', '#38bdf8'],
    });
  };

  const handleCashPayment = (patient: Patient) => {
    sound.playTapSound();
    markBillPaid(patient.id, 'cash');
    triggerConfetti();
    setActiveReceiptPatient({ ...patient, paymentStatus: 'cash' });
  };

  const handleUPIPaymentInit = (patient: Patient) => {
    sound.playTapSound();
    setActiveUPIPatient(patient);
  };

  const handleUPIPaymentConfirmed = (patient: Patient) => {
    markBillPaid(patient.id, 'upi');
    triggerConfetti();
    setActiveUPIPatient(null);
    setActiveReceiptPatient({ ...patient, paymentStatus: 'upi' });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Banner Bar with Quick Records & Follow-ups Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-300">
            Reception Desk Active
          </span>
          <span className="text-xs text-slate-400">• Total in Clinic: <strong>{waitingPatients.length + billedPatients.length}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          {followUpPatients.length > 0 && (
            <button
              type="button"
              onClick={() => setIsRecordsOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-900 transition"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{followUpPatients.length} Follow-ups Scheduled</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsRecordsOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-700/80 text-cyan-300 text-xs font-bold flex items-center gap-1.5 hover:bg-cyan-900 transition"
          >
            <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Search Patient Records</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* BLOCK 1: ADD NEW / RETURNING PATIENT (NAME, AGE, CITY, MOBILE, DOCTOR) */}
      {/* ======================================================== */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                1. Register & Add Patient to Line
              </h2>
              <p className="text-xs text-slate-400">
                Record Patient Name, Age, City, Mobile Number, and Select Consulting Doctor.
              </p>
            </div>
          </div>

          {justAddedAlert && (
            <div className="bg-emerald-950/80 border border-emerald-600 text-emerald-300 px-4 py-2 rounded-2xl text-xs font-black animate-gentle-pulse flex items-center gap-2 shadow-lg shadow-emerald-950/60">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {justAddedAlert}
            </div>
          )}
        </div>

        <form onSubmit={handleAddPatientSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Input 1: Patient Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <User className="w-4 h-4 text-cyan-400" />
                1. Patient Name
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Rameshwar Patil"
                className="w-full touch-btn px-4 bg-slate-950 border-2 border-slate-700 focus:border-cyan-400 rounded-2xl text-base font-bold text-white placeholder-slate-600 shadow-inner transition focus:outline-none"
                required
              />
            </div>

            {/* Input 2: Age & Gender */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>2. Age</span>
                <div className="flex gap-1.5 text-[10px] normal-case">
                  <button
                    type="button"
                    onClick={() => setPatientGender('Male')}
                    className={`px-2 py-0.5 rounded font-bold ${patientGender === 'Male' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setPatientGender('Female')}
                    className={`px-2 py-0.5 rounded font-bold ${patientGender === 'Female' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                  >
                    Female
                  </button>
                </div>
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                placeholder="Years (e.g. 42)"
                className="w-full touch-btn px-4 bg-slate-950 border-2 border-slate-700 focus:border-cyan-400 rounded-2xl text-base font-mono font-bold text-white placeholder-slate-600 shadow-inner transition focus:outline-none"
              />
            </div>

            {/* Input 3: City of Patient */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-cyan-400" />
                3. City / Town
              </label>
              <input
                type="text"
                value={patientCity}
                onChange={(e) => setPatientCity(e.target.value)}
                placeholder="e.g. Khamgaon, Shegaon"
                className="w-full touch-btn px-4 bg-slate-950 border-2 border-slate-700 focus:border-cyan-400 rounded-2xl text-base font-bold text-white placeholder-slate-600 shadow-inner transition focus:outline-none"
              />
              {/* Quick City suggestions */}
              <div className="flex flex-wrap gap-1 pt-1">
                {COMMON_CITIES.slice(0, 4).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setPatientCity(c)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${patientCity === c ? 'bg-cyan-950 border border-cyan-600 text-cyan-300' : 'bg-slate-950 text-slate-400 hover:text-white'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Input 4: Mobile Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-cyan-400" />
                4. Mobile Number
                {returningDirectory[mobileNumber] && (
                  <span className="text-[10px] font-bold text-emerald-400 normal-case bg-emerald-950 px-1 py-0.5 rounded border border-emerald-800">
                    ✓ Recognized
                  </span>
                )}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono font-bold text-base select-none">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={mobileNumber}
                  onChange={(e) => handleMobileChange(e.target.value)}
                  placeholder="98220 12345"
                  className="w-full touch-btn pl-14 pr-4 bg-slate-950 border-2 border-slate-700 focus:border-cyan-400 rounded-2xl text-base font-mono font-bold text-white placeholder-slate-600 tracking-wider shadow-inner transition focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Input 5: Select Doctor which they are coming to consult */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>5. Doctor to Consult (3 Giant Tap Cards):</span>
              <span className="text-slate-400 font-normal">Tap to choose</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* SKIN DOCTOR */}
              <div
                onClick={() => {
                  setSelectedDoctor('skin');
                  sound.playTapSound();
                }}
                className={`touch-btn p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 select-none ${
                  selectedDoctor === 'skin'
                    ? 'bg-purple-950/70 border-purple-400 ring-2 ring-purple-500/40 shadow-lg shadow-purple-950/60'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-2xl ${
                    selectedDoctor === 'skin'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  🩺
                </div>
                <div className="flex-1">
                  <div className="font-black text-sm text-white">SKIN DOCTOR</div>
                  <div className="text-xs text-slate-400">Dr. Chaudhari (Skin & Hair)</div>
                  <div className="text-[11px] font-semibold text-purple-400 mt-0.5">
                    {waitingCount.skin} in line
                  </div>
                </div>
              </div>

              {/* DENTAL DOCTOR 1 */}
              <div
                onClick={() => {
                  setSelectedDoctor('dental1');
                  sound.playTapSound();
                }}
                className={`touch-btn p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 select-none ${
                  selectedDoctor === 'dental1'
                    ? 'bg-cyan-950/70 border-cyan-400 ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-950/60'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-2xl ${
                    selectedDoctor === 'dental1'
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  🦷
                </div>
                <div className="flex-1">
                  <div className="font-black text-sm text-white">DENTAL CABIN 1</div>
                  <div className="text-xs text-slate-400">Senior Dental Surgeon</div>
                  <div className="text-[11px] font-semibold text-cyan-400 mt-0.5">
                    {waitingCount.dental1} in line
                  </div>
                </div>
              </div>

              {/* DENTAL DOCTOR 2 */}
              <div
                onClick={() => {
                  setSelectedDoctor('dental2');
                  sound.playTapSound();
                }}
                className={`touch-btn p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 select-none ${
                  selectedDoctor === 'dental2'
                    ? 'bg-emerald-950/70 border-emerald-400 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-950/60'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-2xl ${
                    selectedDoctor === 'dental2'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  🦷
                </div>
                <div className="flex-1">
                  <div className="font-black text-sm text-white">DENTAL CABIN 2</div>
                  <div className="text-xs text-slate-400">Associate Dental Surgeon</div>
                  <div className="text-[11px] font-semibold text-emerald-400 mt-0.5">
                    {waitingCount.dental2} in line
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Big Green Add Button */}
          <button
            type="submit"
            className="w-full touch-btn bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white text-lg font-black tracking-wide rounded-2xl shadow-xl shadow-emerald-950/60 transition flex items-center justify-center gap-2 cursor-pointer select-none"
          >
            <UserPlus className="w-6 h-6" />
            + ADD TO LINE
          </button>
        </form>
      </section>

      {/* ======================================================== */}
      {/* BLOCK 2: 3 CABIN BOXES (SEND NEXT PATIENT INSIDE)      */}
      {/* ======================================================== */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                2. Cabin Status & Send Next Patient
              </h2>
              <p className="text-xs text-slate-400">
                Pulsing green button sends the next waiting patient into that doctor&apos;s cabin.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(['skin', 'dental1', 'dental2'] as const).map((cabinId) => {
            const cabin = cabins[cabinId];
            const isFree = cabin.status === 'free';
            const countWaiting = waitingCount[cabinId];
            const nextPatient = waitingPatients.find((p) => p.doctorId === cabinId);
            const activePatient = patients?.find((p) => p.id === cabin.currentPatientId);

            return (
              <div
                key={cabinId}
                className={`rounded-3xl p-5 border-2 flex flex-col justify-between transition-all shadow-xl ${
                  isFree
                    ? 'bg-slate-950/80 border-emerald-500/40'
                    : 'bg-red-950/30 border-red-500/60'
                }`}
              >
                <div>
                  {/* Top Bar: Cabin Title & Status Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-extrabold text-white text-base flex items-center gap-2">
                      <span className="text-xl">{cabinId === 'skin' ? '🩺' : '🦷'}</span>
                      {cabin.name.toUpperCase()}
                    </span>

                    {/* Status Badge: GREEN = FREE, RED = BUSY */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow ${
                        isFree
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : 'bg-red-600 text-white font-black animate-pulse'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-current" />
                      {isFree ? 'FREE' : 'BUSY'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 font-medium mb-4">
                    {cabin.doctorTitle}
                  </p>

                  {/* Current In Cabin or Waiting Outside Info */}
                  <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 mb-4 min-h-[96px] flex flex-col justify-center">
                    {isFree ? (
                      <div className="text-center">
                        <span className="text-emerald-400 font-black text-sm block">
                          CABIN IS FREE & READY
                        </span>
                        <span className="text-xs text-slate-400 font-semibold mt-0.5 block">
                          {countWaiting > 0
                            ? `👤 ${countWaiting} patient(s) waiting outside`
                            : 'No patients waiting outside'}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-[11px] font-extrabold text-red-400 uppercase tracking-wider block">
                          CURRENT PATIENT INSIDE:
                        </span>
                        <div className="text-base font-black text-white truncate">
                          {cabin.currentPatientName}
                          {activePatient?.age ? ` (${activePatient.age}y)` : ''}
                          {activePatient?.city ? ` • ${activePatient.city}` : ''}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                          <span className="font-mono text-cyan-300">
                            Token #{cabin.currentPatientToken}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            {cabin.enteredTime || 'Just now'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Send Next Patient Button or Status Indicator */}
                <div>
                  {isFree && countWaiting > 0 ? (
                    <button
                      type="button"
                      onClick={() => sendNextPatientToCabin(cabinId)}
                      className="w-full touch-btn bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-sm font-black rounded-2xl shadow-xl shadow-emerald-950/80 animate-gentle-pulse flex items-center justify-center gap-2 cursor-pointer transition select-none"
                    >
                      <span>SEND NEXT PATIENT INSIDE</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  ) : isFree && countWaiting === 0 ? (
                    <div className="touch-btn rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-center text-xs text-slate-500 font-bold">
                      Queue Empty for this Cabin
                    </div>
                  ) : (
                    <div className="touch-btn rounded-2xl bg-red-950/40 border border-red-900/40 flex items-center justify-center text-xs text-red-300 font-black">
                      Doctor Currently Examining
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ======================================================== */}
      {/* BLOCK 3: COLLECT BILL MONEY (SUBMITTED BY DOCTORS)       */}
      {/* ======================================================== */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                3. Collect Bill Money
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 shadow">
                  YELLOW = COLLECT MONEY
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pops up instantly when doctor finishes checkup. Tap Cash or UPI to complete payment.
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-extrabold text-amber-400">
              {billedPatients.length} Pending Bills
            </span>
          </div>
        </div>

        {billedPatients.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/50 rounded-2xl border border-slate-800 text-slate-500">
            <p className="text-base font-bold text-slate-400">No Pending Bills</p>
            <p className="text-xs text-slate-500 mt-1">
              When a doctor submits a bill from their cabin, it will instantly pop up here with a chime!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {billedPatients.map((patient) => {
              const docIcon = patient.doctorId === 'skin' ? '🩺' : '🦷';
              const docName =
                patient.doctorId === 'skin'
                  ? 'Skin Doctor'
                  : patient.doctorId === 'dental1'
                  ? 'Dental Doctor 1'
                  : 'Dental Doctor 2';

              return (
                <div
                  key={patient.id}
                  className="bg-amber-950/30 border-2 border-amber-500 rounded-3xl p-5 shadow-2xl shadow-amber-950/40 flex flex-col justify-between transition-all"
                >
                  <div>
                    {/* Header: Name + Age + City + Doctor Icon */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="text-lg font-black text-white leading-tight">
                          {patient.name}
                          {patient.age ? ` (${patient.age}y)` : ''}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          {patient.city || 'Khamgaon'} • Token #{patient.tokenNumber} • Ph: {patient.phone}
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl flex-shrink-0" title={docName}>
                        {docIcon}
                      </div>
                    </div>

                    {/* Huge Total Amount in ₹ */}
                    <div className="bg-slate-950/90 rounded-2xl p-4 border border-amber-500/50 my-4 text-center">
                      <span className="text-[11px] font-black text-amber-400 uppercase tracking-widest block">
                        TOTAL AMOUNT TO COLLECT
                      </span>
                      <div className="text-4xl font-black font-mono text-white mt-1">
                        ₹ {patient.totalAmount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {patient.billingItems.length > 0
                          ? `${patient.billingItems.length} item(s) submitted by ${docName}`
                          : 'Consultation & Examination'}
                      </div>
                    </div>
                  </div>

                  {/* 2 Giant Payment Buttons */}
                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => handleCashPayment(patient)}
                      className="w-full touch-btn bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-base font-black rounded-2xl shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 cursor-pointer transition select-none"
                    >
                      <DollarSign className="w-5 h-5 text-emerald-200" />
                      💵 CASH RECEIVED
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUPIPaymentInit(patient)}
                      className="w-full touch-btn bg-cyan-600 hover:bg-cyan-500 active:scale-[0.98] text-white text-base font-black rounded-2xl shadow-lg shadow-cyan-950/60 flex items-center justify-center gap-2 cursor-pointer transition select-none"
                    >
                      <QrCode className="w-5 h-5 text-cyan-200" />
                      📱 UPI / SCANNER RECEIVED
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Recently Completed / Paid Section */}
        {completedPatients.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-800">
            <h3 className="text-sm font-extrabold text-slate-300 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Paid Bills Today (Reprint / Resend WhatsApp)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {completedPatients.slice(-6).reverse().map((patient) => (
                <div
                  key={patient.id}
                  className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3"
                >
                  <div className="truncate">
                    <div className="text-xs font-bold text-white truncate">
                      {patient.name} {patient.age ? `(${patient.age}y)` : ''} • {patient.city || 'Khamgaon'}
                    </div>
                    <div className="text-[11px] text-emerald-400 font-mono font-bold">
                      ₹{patient.totalAmount} ({patient.paymentStatus?.toUpperCase()})
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveReceiptPatient(patient)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1 flex-shrink-0"
                  >
                    <Printer className="w-3.5 h-3.5 text-cyan-400" />
                    Receipt
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scheduled Follow-up Patients Tracker */}
        {followUpPatients.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-emerald-400 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4" />
                Scheduled Follow-up Appointments ({followUpPatients.length})
              </h3>
              <span className="text-xs text-slate-400">
                1-Tap to add returning patient to waiting line or send WhatsApp reminder
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {followUpPatients.map((patient) => {
                const docName =
                  patient.doctorId === 'skin'
                    ? 'Dr. Rajanikant Chaudhari (Skin)'
                    : patient.doctorId === 'dental1'
                    ? 'Dr. Shrutika Tulaskar (Dental 1)'
                    : 'Dr. Priyanka Chaudhari (Dental 2)';

                const reminderText = encodeURIComponent(
                  `Namaste ${patient.name},\n\n` +
                  `This is a gentle reminder from *Chaudhari Skin & Dental Care Multispeciality Clinic*, Khamgaon.\n\n` +
                  `Your follow-up appointment is scheduled for: *${patient.followUpDate}*\n` +
                  `Doctor: *${docName}*\n` +
                  `Planned Checkup / Procedure: *${patient.followUpNotes || 'Treatment Review'}*\n\n` +
                  `Clinic Address: Near Dr. Chande Clinic, Shriram Chowk, Farshi Road, Shivalay Vihar, Khamgaon.\n` +
                  `Timings: 10:00 AM - 02:00 PM & 05:00 PM - 09:00 PM\n\n` +
                  `Please let us know if you need to reschedule. Thank you!`
                );

                return (
                  <div
                    key={patient.id}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-900/60 flex flex-col justify-between gap-3 shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-white">
                          {patient.name} {patient.age ? `(${patient.age}y)` : ''}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                          Due: {patient.followUpDate}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        Ph: +91 {patient.phone} • {patient.city || 'Khamgaon'} • {docName}
                      </div>
                      {patient.followUpNotes && (
                        <div className="text-xs text-emerald-300/90 italic mt-1 bg-emerald-950/30 p-1.5 rounded-lg border border-emerald-900/40">
                          Plan: {patient.followUpNotes}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 border-t border-slate-900">
                      <button
                        type="button"
                        onClick={() => {
                          addPatient(patient.phone, patient.name, patient.age || '', patient.city || 'Khamgaon', patient.doctorId, patient.gender);
                          sound.playTapSound();
                          setJustAddedAlert(`Returning patient ${patient.name} added to line for follow-up!`);
                          setTimeout(() => setJustAddedAlert(null), 4000);
                        }}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>+ Add to Line</span>
                      </button>

                      <a
                        href={`https://wa.me/91${patient.phone}?text=${reminderText}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 text-center"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp Reminder</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Bill Receipt Modal */}
      {activeReceiptPatient && (
        <BillReceiptModal
          patient={activeReceiptPatient}
          onClose={() => setActiveReceiptPatient(null)}
        />
      )}

      {/* UPI Scanner Modal */}
      {activeUPIPatient && (
        <UPIModal
          patient={activeUPIPatient}
          onConfirmPayment={() => handleUPIPaymentConfirmed(activeUPIPatient)}
          onClose={() => setActiveUPIPatient(null)}
        />
      )}

      {/* Patient Medical Records Modal */}
      {isRecordsOpen && (
        <PatientRecordsModal
          doctorRole="reception"
          onClose={() => setIsRecordsOpen(false)}
        />
      )}
    </div>
  );
};
