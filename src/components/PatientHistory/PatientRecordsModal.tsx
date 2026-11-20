import React, { useState } from 'react';
import { DoctorRole, Patient, VisitRecord } from '../../types/clinic';
import { useClinicStore } from '../../services/clinicStore';
import { sound } from '../../services/sound';
import {
  FolderOpen,
  Search,
  User,
  Phone,
  Calendar,
  Clock,
  Pill,
  Image as ImageIcon,
  DollarSign,
  Maximize2,
  X,
  CheckCircle,
  FileText,
  Activity,
  CalendarCheck,
  Printer,
  ChevronDown,
  ChevronUp,
  MapPin,
  Sparkles,
  ShieldCheck,
  Stethoscope,
  ExternalLink
} from 'lucide-react';

interface PatientRecordsModalProps {
  initialPatientId?: string;
  doctorRole?: DoctorRole;
  onClose: () => void;
}

export const PatientRecordsModal: React.FC<PatientRecordsModalProps> = ({
  initialPatientId,
  doctorRole,
  onClose,
}) => {
  const { patients } = useClinicStore();

  // Strict Department Access:
  // - Skin doctor can ONLY access skin department records
  // - Dental doctors (both Doctor 1 & Doctor 2) can access ALL dental department records (Cabins 1 & 2)
  // - Reception & Admin can view across departments
  const allowedDept: 'all' | 'skin' | 'dental' =
    doctorRole === 'skin'
      ? 'skin'
      : doctorRole === 'dental1' || doctorRole === 'dental2'
      ? 'dental'
      : 'all';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState<'all' | 'skin' | 'dental' | 'dental1' | 'dental2' | 'followups'>(
    allowedDept === 'skin' ? 'skin' : allowedDept === 'dental' ? 'dental' : 'all'
  );
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'prescriptions' | 'photos' | 'billing'>('timeline');
  const [mobileView, setMobileView] = useState<'list' | 'detail'>(initialPatientId ? 'detail' : 'list');

  // Filter patients with strict department isolation
  const filteredPatients = patients.filter((p) => {
    // 1. Department Boundary Check:
    if (allowedDept === 'skin' && p.doctorId !== 'skin') return false;
    if (allowedDept === 'dental' && p.doctorId !== 'dental1' && p.doctorId !== 'dental2') return false;

    // 2. Search match
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      (p.city && p.city.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // 3. Sub-filter within allowed scope
    if (allowedDept === 'all') {
      if (filterDept === 'skin') return p.doctorId === 'skin';
      if (filterDept === 'dental') return p.doctorId === 'dental1' || p.doctorId === 'dental2';
    } else if (allowedDept === 'dental') {
      if (filterDept === 'dental1') return p.doctorId === 'dental1';
      if (filterDept === 'dental2') return p.doctorId === 'dental2';
    }

    if (filterDept === 'followups') return Boolean(p.followUpDate);
    return true;
  });

  const [selectedPatientId, setSelectedPatientId] = useState<string>(() => {
    if (initialPatientId && filteredPatients.some((p) => p.id === initialPatientId)) {
      return initialPatientId;
    }
    return filteredPatients.length > 0 ? filteredPatients[0].id : '';
  });

  const selectedPatient = filteredPatients.find((p) => p.id === selectedPatientId) || filteredPatients[0];

  // Helper to compile and sort ALL visits of this person with LATEST DATE FIRST (filtered strictly by allowed department)
  const getCompiledVisits = (patient: Patient): Array<VisitRecord & { isCurrentActive?: boolean }> => {
    if (!patient) return [];

    const visits: Array<VisitRecord & { isCurrentActive?: boolean }> = [];

    // Check if current visit is within allowed department
    const isCurrentAllowed =
      allowedDept === 'all' ||
      (allowedDept === 'skin' && patient.doctorId === 'skin') ||
      (allowedDept === 'dental' && (patient.doctorId === 'dental1' || patient.doctorId === 'dental2'));

    // 1. If patient has an active or completed visit in the current session
    if (isCurrentAllowed && (patient.totalAmount > 0 || (patient.rxItems && patient.rxItems.length > 0) || patient.doctorNotes || patient.diagnosis)) {
      visits.push({
        id: `current-${patient.id}`,
        visitNumber: (patient.pastVisits?.length || 0) + 1,
        date: patient.date || new Date().toISOString().split('T')[0],
        time: patient.completedTime || patient.billedTime || patient.arrivalTime,
        doctorId: patient.doctorId,
        doctorTitle: patient.doctorId === 'skin'
          ? 'Dr. Rajanikant Chaudhari (Skin Doctor)'
          : patient.doctorId === 'dental1'
          ? 'Dr. Shrutika Tulaskar (Dental Doctor 1)'
          : 'Dr. Priyanka Chaudhari (Dental Doctor 2)',
        age: patient.age,
        city: patient.city,
        chiefComplaint: patient.chiefComplaint,
        diagnosis: patient.diagnosis,
        doctorNotes: patient.doctorNotes,
        photos: patient.photos || [],
        rxItems: patient.rxItems || [],
        billingItems: patient.billingItems || [],
        totalAmount: patient.totalAmount,
        paymentStatus: patient.paymentStatus,
        paymentRef: patient.paymentRef,
        followUpDate: patient.followUpDate,
        followUpNotes: patient.followUpNotes,
        dentalState: patient.dentalState,
        isCurrentActive: true,
      });
    }

    // 2. Add all past visits recorded historically (strictly matching allowed department)
    if (patient.pastVisits && patient.pastVisits.length > 0) {
      patient.pastVisits.forEach((v) => {
        const isPastAllowed =
          allowedDept === 'all' ||
          (allowedDept === 'skin' && v.doctorId === 'skin') ||
          (allowedDept === 'dental' && (v.doctorId === 'dental1' || v.doctorId === 'dental2'));

        if (isPastAllowed && !visits.some((existing) => existing.id === v.id)) {
          visits.push({ ...v, isCurrentActive: false });
        }
      });
    }

    // 3. Sort strictly by date and time in descending order: LATEST / NEWEST VISIT FIRST!
    return visits.sort((a, b) => {
      const timeA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
      const timeB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
      return timeB - timeA;
    });
  };

  const compiledVisits = selectedPatient ? getCompiledVisits(selectedPatient) : [];

  // Helper to format friendly dates
  const formatDateDisplay = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const calculateDaysAgo = (dateStr: string) => {
    try {
      const visitDate = new Date(dateStr);
      const today = new Date();
      const diffTime = today.getTime() - visitDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return 'Today (आज)';
      if (diffDays === 1) return 'Yesterday (काल)';
      return `${diffDays} days ago (${diffDays} दिवसांपूर्वी)`;
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-6xl h-[92vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              allowedDept === 'skin'
                ? 'bg-purple-600/20 border border-purple-500/40 text-purple-400'
                : allowedDept === 'dental'
                ? 'bg-cyan-600/20 border border-cyan-500/40 text-cyan-400'
                : 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-400'
            }`}>
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  Patient Medical & Dental Records
                </h3>
                {allowedDept === 'skin' && (
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-700 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5 text-purple-400" />
                    Skin Records Only (Dr. Rajanikant Chaudhari)
                  </span>
                )}
                {allowedDept === 'dental' && (
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5 text-cyan-400" />
                    Dental Records Only (Shared: Dr. Shrutika & Dr. Priyanka)
                  </span>
                )}
                {allowedDept === 'all' && (
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                    All Departments (Reception / Admin)
                  </span>
                )}
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                  Arranged by Latest Date
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {allowedDept === 'skin' && 'Confidential dermatology consultations, trichology, prescriptions & follow-ups'}
                {allowedDept === 'dental' && 'Shared dental surgery dossiers, odontograms, clinical X-rays & follow-ups across Cabin 1 & 2'}
                {allowedDept === 'all' && 'Preserved History, Old vs New Consultations, Prescriptions (Rx) & Follow-ups'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master-Detail Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Panel: Search & Patient List */}
          <div className={`w-full md:w-80 border-r border-slate-800 flex flex-col bg-slate-950/70 ${mobileView === 'detail' ? 'hidden md:flex' : 'flex'}`}>
            {/* Search input */}
            <div className="p-3 border-b border-slate-800 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, phone, city..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              {/* Filter Tabs by Department Permission */}
              <div className="flex gap-1 text-[11px] font-bold">
                {allowedDept === 'all' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setFilterDept('all')}
                      className={`flex-1 py-1 rounded-lg text-center transition ${
                        filterDept === 'all'
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      All ({patients.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterDept('skin')}
                      className={`flex-1 py-1 rounded-lg text-center transition ${
                        filterDept === 'skin'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      Skin
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterDept('dental')}
                      className={`flex-1 py-1 rounded-lg text-center transition ${
                        filterDept === 'dental'
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      Dental
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterDept('followups')}
                      className={`flex-1 py-1 rounded-lg text-center transition ${
                        filterDept === 'followups'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      Follow-ups
                    </button>
                  </>
                )}

                {allowedDept === 'skin' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setFilterDept('skin')}
                      className={`flex-1 py-1.5 rounded-lg text-center transition ${
                        filterDept === 'skin'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      All Skin Records ({patients.filter((p) => p.doctorId === 'skin').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterDept('followups')}
                      className={`flex-1 py-1.5 rounded-lg text-center transition ${
                        filterDept === 'followups'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      Follow-ups ({patients.filter((p) => p.doctorId === 'skin' && p.followUpDate).length})
                    </button>
                  </>
                )}

                {allowedDept === 'dental' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setFilterDept('dental')}
                      className={`flex-1 py-1 rounded-lg text-center transition ${
                        filterDept === 'dental'
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      All Dental ({patients.filter((p) => p.doctorId === 'dental1' || p.doctorId === 'dental2').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterDept('dental1')}
                      className={`flex-1 py-1 rounded-lg text-center transition ${
                        filterDept === 'dental1'
                          ? 'bg-cyan-700 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      Cabin 1
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterDept('dental2')}
                      className={`flex-1 py-1 rounded-lg text-center transition ${
                        filterDept === 'dental2'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      Cabin 2
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterDept('followups')}
                      className={`flex-1 py-1 rounded-lg text-center transition ${
                        filterDept === 'followups'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      Follow-ups
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Patients Scroll List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-850 p-2 space-y-1">
              {filteredPatients.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No patient records match query
                </div>
              ) : (
                filteredPatients.map((p) => {
                  const isSelected = selectedPatient?.id === p.id;
                  const docIcon = p.doctorId === 'skin' ? '🩺' : '🦷';
                  const totalVisitsCount = (p.pastVisits?.length || 0) + (p.totalAmount > 0 ? 1 : 0);

                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        sound.playTapSound();
                        setSelectedPatientId(p.id);
                        setMobileView('detail');
                      }}
                      className={`p-3 rounded-xl cursor-pointer transition flex items-center justify-between gap-2 select-none ${
                        isSelected
                          ? 'bg-cyan-950/80 border border-cyan-500/50 shadow-md'
                          : 'hover:bg-slate-900 border border-transparent text-slate-300'
                      }`}
                    >
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-white truncate">
                            {p.name}
                          </span>
                          <span className="text-xs">{docIcon}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                          <span>{p.phone}</span>
                          <span>•</span>
                          <span>{p.city || 'Khamgaon'}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-800">
                            {totalVisitsCount > 1 ? `${totalVisitsCount} Visits` : '1 Visit'}
                          </span>
                          {p.followUpDate && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 font-bold">
                              <CalendarCheck className="w-3 h-3" />
                              {p.followUpDate}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                          {p.status}
                        </span>
                        {p.totalAmount > 0 && (
                          <div className="text-[11px] font-mono font-bold text-emerald-400 mt-1">
                            ₹{p.totalAmount}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Detailed Dossier Arranged by Latest Date */}
          <div className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 bg-slate-900/60 ${mobileView === 'list' ? 'hidden md:block' : 'block'}`}>
            {selectedPatient ? (
              <>
                {/* Mobile Back to List Button */}
                <button
                  type="button"
                  onClick={() => setMobileView('list')}
                  className="md:hidden w-full mb-2 px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 hover:border-cyan-400 text-cyan-300 text-xs font-black flex items-center justify-between transition active:scale-95 shadow-sm"
                >
                  <span className="flex items-center gap-1.5">
                    <span>←</span>
                    <span>Back to Patient Records List</span>
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {filteredPatients.length} Patients
                  </span>
                </button>

                {/* 1. Patient Top Profile Summary Card */}
                <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-cyan-600/20 border-2 border-cyan-500/40 text-cyan-400 font-black text-2xl font-mono flex items-center justify-center shadow-lg">
                      #{selectedPatient.tokenNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-2xl font-black text-white">
                          {selectedPatient.name}
                        </h4>
                        {selectedPatient.age && (
                          <span className="text-sm font-bold text-slate-300">
                            ({selectedPatient.age} Yrs / {selectedPatient.gender || 'M'})
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1 font-mono text-cyan-300">
                          <Phone className="w-3.5 h-3.5" />
                          +91 {selectedPatient.phone}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-purple-400" />
                          City: <strong className="text-white">{selectedPatient.city || 'Khamgaon'}</strong>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          Registered: {selectedPatient.date || 'Today'} at {selectedPatient.arrivalTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Badges: Total Visits & Next Follow-up */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        TOTAL VISITS ON FILE
                      </span>
                      <span className="text-base font-black text-white font-mono">
                        {compiledVisits.length} Records
                      </span>
                    </div>

                    {selectedPatient.followUpDate && (
                      <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/60 text-right">
                        <span className="text-[10px] font-extrabold uppercase text-emerald-400 tracking-wider block flex items-center gap-1">
                          <CalendarCheck className="w-3.5 h-3.5" />
                          SCHEDULED FOLLOW-UP
                        </span>
                        <span className="text-sm font-black text-white font-mono">
                          {formatDateDisplay(selectedPatient.followUpDate)}
                        </span>
                        {selectedPatient.followUpNotes && (
                          <p className="text-[11px] text-emerald-300 italic mt-0.5 truncate max-w-xs">
                            {selectedPatient.followUpNotes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Navigation Tabs (Timeline, All Prescriptions, Photos, Billing) */}
                <div className="flex border-b border-slate-800 gap-2 overflow-x-auto no-scrollbar whitespace-nowrap pb-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('timeline')}
                    className={`px-4 py-2.5 rounded-t-2xl text-xs font-black flex items-center gap-2 border-t border-x transition ${
                      activeTab === 'timeline'
                        ? 'bg-slate-900 border-slate-700 text-cyan-400 shadow-md'
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Visits Timeline (Arranged by Latest Date)</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-950 text-cyan-300 font-mono">
                      {compiledVisits.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('prescriptions')}
                    className={`px-4 py-2.5 rounded-t-2xl text-xs font-black flex items-center gap-2 border-t border-x transition ${
                      activeTab === 'prescriptions'
                        ? 'bg-slate-900 border-slate-700 text-cyan-400 shadow-md'
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <Pill className="w-4 h-4 text-cyan-400" />
                    <span>All Prescriptions History</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('photos')}
                    className={`px-4 py-2.5 rounded-t-2xl text-xs font-black flex items-center gap-2 border-t border-x transition ${
                      activeTab === 'photos'
                        ? 'bg-slate-900 border-slate-700 text-cyan-400 shadow-md'
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4 text-purple-400" />
                    <span>Clinical Photos & X-Rays</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('billing')}
                    className={`px-4 py-2.5 rounded-t-2xl text-xs font-black flex items-center gap-2 border-t border-x transition ${
                      activeTab === 'billing'
                        ? 'bg-slate-900 border-slate-700 text-cyan-400 shadow-md'
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <DollarSign className="w-4 h-4 text-amber-400" />
                    <span>Invoices & Payments</span>
                  </button>
                </div>

                {/* TAB 1: VISITS TIMELINE (Arranged from Latest to Oldest) */}
                {activeTab === 'timeline' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                      <span className="font-bold flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        Showing {compiledVisits.length} consultation visit records (Latest at top):
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Sorted reverse chronologically
                      </span>
                    </div>

                    {compiledVisits.length === 0 ? (
                      <div className="p-12 text-center bg-slate-950 rounded-3xl border border-slate-800 text-slate-500">
                        <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-700" />
                        <p className="font-bold text-sm">No historical visits recorded yet</p>
                        <p className="text-xs text-slate-600 mt-1">
                          Visits, clinical diagnoses, and prescriptions will appear here permanently.
                        </p>
                      </div>
                    ) : (
                      compiledVisits.map((visit, idx) => {
                        const isLatest = idx === 0;
                        const docIcon = visit.doctorId === 'skin' ? '🩺' : '🦷';

                        return (
                          <div
                            key={visit.id || idx}
                            className={`rounded-3xl p-5 border-2 transition shadow-xl space-y-4 ${
                              isLatest
                                ? 'bg-slate-950 border-cyan-500/80 shadow-cyan-950/40 relative'
                                : 'bg-slate-950/80 border-slate-800'
                            }`}
                          >
                            {/* Visit Header Banner */}
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                              <div className="flex items-center gap-3">
                                {/* Large Status Icon */}
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold border ${
                                  isLatest
                                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500'
                                    : 'bg-slate-900 text-slate-400 border-slate-700'
                                }`}>
                                  {docIcon}
                                </div>

                                <div>
                                  <div className="flex items-center gap-2">
                                    {isLatest ? (
                                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-slate-950 animate-pulse">
                                        🟢 LATEST VISIT (NEW RECORD)
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-800 text-slate-400 border border-slate-700">
                                        ⚪ PREVIOUS VISIT #{compiledVisits.length - idx} (OLD RECORD)
                                      </span>
                                    )}
                                    <span className="text-xs text-slate-400 font-mono">
                                      {calculateDaysAgo(visit.date)}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 mt-1">
                                    <h5 className="text-base font-black text-white">
                                      {formatDateDisplay(visit.date)}
                                    </h5>
                                    <span className="text-slate-500">•</span>
                                    <span className="text-xs text-slate-300 font-mono">
                                      {visit.time}
                                    </span>
                                    <span className="text-slate-500">•</span>
                                    <span className="text-xs text-cyan-300 font-bold">
                                      {visit.doctorTitle}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Billed Amount & Payment Badge */}
                              <div className="text-right">
                                {visit.totalAmount > 0 && (
                                  <div className="text-lg font-black font-mono text-white">
                                    ₹ {visit.totalAmount.toLocaleString('en-IN')}
                                  </div>
                                )}
                                <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                                  visit.paymentStatus === 'cash' || visit.paymentStatus === 'upi'
                                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                                    : 'bg-amber-950 text-amber-300 border-amber-700'
                                }`}>
                                  <ShieldCheck className="w-3 h-3" />
                                  {visit.paymentStatus?.toUpperCase() || 'PENDING'}
                                </span>
                              </div>
                            </div>

                            {/* Diagnosis & Chief Complaint */}
                            {(visit.diagnosis || visit.chiefComplaint) && (
                              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                                {visit.chiefComplaint && (
                                  <div>
                                    <span className="font-extrabold text-slate-400">Chief Complaint: </span>
                                    <span className="text-slate-200">{visit.chiefComplaint}</span>
                                  </div>
                                )}
                                {visit.diagnosis && (
                                  <div>
                                    <span className="font-extrabold text-amber-400">Clinical Diagnosis: </span>
                                    <span className="text-white font-bold">{visit.diagnosis}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Doctor Notes & Examination */}
                            {visit.doctorNotes && (
                              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs">
                                <span className="font-bold text-slate-400 block mb-1">
                                  Doctor Examination Findings & Procedure Notes:
                                </span>
                                <p className="text-slate-200 whitespace-pre-line leading-relaxed">
                                  {visit.doctorNotes}
                                </p>
                              </div>
                            )}

                            {/* Prescriptions (Rx) For This Specific Visit */}
                            {visit.rxItems && visit.rxItems.length > 0 && (
                              <div className="space-y-2">
                                <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                                  <Pill className="w-3.5 h-3.5" />
                                  Prescriptions Issued on this Date ({visit.rxItems.length}):
                                </span>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {visit.rxItems.map((rx, rxIdx) => (
                                    <div
                                      key={rxIdx}
                                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-bold text-white">
                                          {rxIdx + 1}. {rx.medicine}
                                        </span>
                                        {rx.type && (
                                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                                            {rx.type}
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex flex-wrap items-center gap-2">
                                        {/* M-A-N Indicators */}
                                        {(rx.morning !== undefined || rx.timingCode) && (
                                          <div className="inline-flex items-center divide-x divide-slate-800 bg-slate-950 rounded border border-slate-700 text-[10px] font-mono font-bold">
                                            <span className={`px-1.5 py-0.5 ${rx.morning ? 'bg-amber-500/20 text-amber-300 font-black' : 'text-slate-500'}`}>
                                              ☀️ {rx.morning ? '1' : '0'}
                                            </span>
                                            <span className={`px-1.5 py-0.5 ${rx.afternoon ? 'bg-orange-500/20 text-orange-300 font-black' : 'text-slate-500'}`}>
                                              🌤️ {rx.afternoon ? '1' : '0'}
                                            </span>
                                            <span className={`px-1.5 py-0.5 ${rx.night ? 'bg-indigo-500/20 text-indigo-300 font-black' : 'text-slate-500'}`}>
                                              🌙 {rx.night ? '1' : '0'}
                                            </span>
                                          </div>
                                        )}
                                        <span className="text-cyan-300 font-bold">{rx.dosage}</span>
                                        <span className="text-slate-500">•</span>
                                        <span className="text-slate-300">{rx.timing}</span>
                                        <span className="text-slate-500">•</span>
                                        <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">
                                          {rx.days}d
                                        </span>
                                      </div>

                                      {rx.instructions && (
                                        <p className="text-[10px] text-slate-400 italic">
                                          Advice: {rx.instructions}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Procedures & Charges on this Date */}
                            {visit.billingItems && visit.billingItems.length > 0 && (
                              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                                <span className="font-bold text-slate-400 block mb-1">
                                  Procedures Performed on {visit.date}:
                                </span>
                                <div className="divide-y divide-slate-800">
                                  {visit.billingItems.map((item) => (
                                    <div key={item.id} className="py-1 flex justify-between">
                                      <span className="text-slate-300">{item.description}</span>
                                      <span className="font-mono font-bold text-white">₹{item.amount}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Attached Photos / Radiographs on this Date */}
                            {visit.photos && visit.photos.length > 0 && (
                              <div>
                                <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
                                  Photos & Radiographs Attached on {visit.date}:
                                </span>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                  {visit.photos.map((item) => (
                                    <div
                                      key={item.id}
                                      onClick={() => setLightboxUrl(item.url)}
                                      className="aspect-square rounded-xl overflow-hidden border border-slate-700 bg-slate-900 cursor-pointer hover:border-cyan-400 transition relative"
                                    >
                                      <img src={item.url} alt="" className="w-full h-full object-cover" />
                                      <span className="absolute bottom-0 inset-x-0 p-0.5 bg-black/70 text-[9px] text-center text-slate-300 truncate">
                                        {item.type}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Scheduled Follow-up on this Visit */}
                            {visit.followUpDate && (
                              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-600/60 text-xs flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <CalendarCheck className="w-4 h-4 text-emerald-400" />
                                  <div>
                                    <span className="font-bold text-white">
                                      Follow-up Scheduled for {formatDateDisplay(visit.followUpDate)}
                                    </span>
                                    {visit.followUpNotes && (
                                      <span className="text-emerald-300 block text-[11px]">
                                        Plan: {visit.followUpNotes}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* TAB 2: ALL PRESCRIPTIONS (Grouped Chronologically) */}
                {activeTab === 'prescriptions' && (
                  <div className="space-y-4">
                    <h5 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                      <Pill className="w-4 h-4" />
                      Prescription History Across All Visits (Latest First)
                    </h5>

                    {compiledVisits.flatMap((v) => v.rxItems || []).length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-6 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                        No medications prescribed yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {compiledVisits.map((v, vIdx) => {
                          if (!v.rxItems || v.rxItems.length === 0) return null;
                          return (
                            <div key={v.id || vIdx} className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-2">
                              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                                <span className="text-xs font-black text-white flex items-center gap-2">
                                  <span>📅 {formatDateDisplay(v.date)}</span>
                                  {vIdx === 0 && (
                                    <span className="text-[10px] px-2 py-0.2 rounded bg-emerald-950 text-emerald-300 font-bold">
                                      LATEST
                                    </span>
                                  )}
                                </span>
                                <span className="text-[11px] text-cyan-300 font-bold">{v.doctorTitle}</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                {v.rxItems.map((rx, idx) => (
                                  <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                                    <div className="font-bold text-white text-sm">{rx.medicine}</div>
                                    <div className="text-[11px] text-cyan-300 mt-0.5">
                                      {rx.dosage} • {rx.timing} • {rx.days} days
                                    </div>
                                    {rx.instructions && (
                                      <div className="text-[10px] text-slate-400 italic mt-0.5">
                                        Advice: {rx.instructions}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: PHOTOS & RADIOGRAPHS GALLERY */}
                {activeTab === 'photos' && (
                  <div className="space-y-4">
                    <h5 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4" />
                      All Clinical Photos & X-Rays (Latest First)
                    </h5>

                    {compiledVisits.flatMap((v) => v.photos || []).length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-6 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                        No photos or X-rays attached to any visit.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {compiledVisits.flatMap((v) =>
                          (v.photos || []).map((photo) => ({
                            ...photo,
                            visitDate: v.date,
                            visitDoc: v.doctorTitle,
                          }))
                        ).map((item) => (
                          <div
                            key={item.id}
                            onClick={() => setLightboxUrl(item.url)}
                            className="aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 cursor-pointer hover:border-purple-400 transition relative group shadow-md"
                          >
                            <img src={item.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-cyan-300 uppercase">
                              {item.visitDate}
                            </span>
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                              <Maximize2 className="w-6 h-6 text-white" />
                            </div>
                            <span className="absolute bottom-0 inset-x-0 p-1 bg-black/80 text-[10px] text-center text-slate-300 truncate">
                              {item.caption || item.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: BILLING & INVOICES */}
                {activeTab === 'billing' && (
                  <div className="space-y-4">
                    <h5 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4" />
                      All Invoices & Payment Receipts
                    </h5>

                    <div className="space-y-2.5">
                      {compiledVisits.map((v, idx) => (
                        <div key={v.id || idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-black text-white text-sm">
                              Visit on {formatDateDisplay(v.date)} at {v.time}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {v.doctorTitle} • {v.billingItems?.length || 0} services
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-base font-black font-mono text-emerald-400">
                              ₹ {v.totalAmount.toLocaleString('en-IN')}
                            </div>
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                              {v.paymentStatus || 'Pending'} ({v.paymentRef || 'CH-RECEIPT'})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                Select a patient from the list on the left to view medical dossier
              </div>
            )}
          </div>
        </div>

        {/* Lightbox Modal for Full Resolution Photo View */}
        {lightboxUrl && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={() => setLightboxUrl(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh]">
              <img
                src={lightboxUrl}
                alt="Enlarged clinical photo"
                className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-slate-700"
              />
              <button
                onClick={() => setLightboxUrl(null)}
                className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-800 text-white hover:bg-slate-700 flex items-center justify-center shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
