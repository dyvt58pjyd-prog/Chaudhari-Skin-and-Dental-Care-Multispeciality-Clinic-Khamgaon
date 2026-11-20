import React, { useState } from 'react';
import { useClinicStore } from '../../services/clinicStore';
import { CLINIC_INFO, CLINIC_DOCTORS, CLINIC_SERVICES_CATALOG } from '../../services/clinicData';
import { MEDICINE_DATABASE, MedicineItem } from '../../services/medicineDatabase';
import { ROLE_PINS } from '../../services/auth';
import { sound } from '../../services/sound';
import {
  ShieldCheck,
  DollarSign,
  Users,
  Settings,
  Database,
  Lock,
  Plus,
  Trash2,
  Edit,
  Save,
  RotateCcw,
  Download,
  Upload,
  Activity,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  Stethoscope,
  Pill,
  MapPin,
  ExternalLink,
  ChevronRight,
  LogOut,
  AlertTriangle
} from 'lucide-react';

interface AdminScreenProps {
  onExit: () => void;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({ onExit }) => {
  const {
    state,
    cabins,
    patients,
    waitingPatients,
    billedPatients,
    completedPatients,
    followUpPatients,
    resetDemoData,
    isFirebase
  } = useClinicStore();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'doctors' | 'pricing' | 'formulary' | 'profile' | 'system'>('dashboard');
  const [saveAlert, setSaveAlert] = useState<string | null>(null);

  // Profile Form States
  const [clinicName, setClinicName] = useState(CLINIC_INFO.name);
  const [clinicAddress, setClinicAddress] = useState(CLINIC_INFO.address);
  const [clinicPhone, setClinicPhone] = useState(CLINIC_INFO.phone);
  const [clinicAltPhone, setClinicAltPhone] = useState(CLINIC_INFO.altPhone);
  const [clinicUpi, setClinicUpi] = useState(CLINIC_INFO.upiId);
  const [clinicReviewUrl, setClinicReviewUrl] = useState(CLINIC_INFO.googleReviewUrl);

  // Pricing Catalog State
  const [skinServices, setSkinServices] = useState([...CLINIC_SERVICES_CATALOG.skin]);
  const [dentalServices, setDentalServices] = useState([...CLINIC_SERVICES_CATALOG.dental]);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState<'skin' | 'dental'>('dental');

  // Custom Medicine State
  const [customMedicines, setCustomMedicines] = useState<MedicineItem[]>([...MEDICINE_DATABASE]);
  const [searchMedQuery, setSearchMedQuery] = useState('');
  const [newMedName, setNewMedName] = useState('');
  const [newMedGeneric, setNewMedGeneric] = useState('');
  const [newMedType, setNewMedType] = useState<MedicineItem['type']>('tablet');
  const [newMedDosage, setNewMedDosage] = useState('1 Tablet');
  const [newMedInstructions, setNewMedInstructions] = useState('Take after food with water');

  // Financial Calculations
  const totalRevenue = completedPatients.reduce((sum, p) => sum + p.totalAmount, 0);
  const cashRevenue = completedPatients.filter((p) => p.paymentStatus === 'cash').reduce((sum, p) => sum + p.totalAmount, 0);
  const upiRevenue = completedPatients.filter((p) => p.paymentStatus === 'upi').reduce((sum, p) => sum + p.totalAmount, 0);
  const pendingRevenue = billedPatients.reduce((sum, p) => sum + p.totalAmount, 0);

  const skinRevenue = completedPatients.filter((p) => p.doctorId === 'skin').reduce((sum, p) => sum + p.totalAmount, 0);
  const dental1Revenue = completedPatients.filter((p) => p.doctorId === 'dental1').reduce((sum, p) => sum + p.totalAmount, 0);
  const dental2Revenue = completedPatients.filter((p) => p.doctorId === 'dental2').reduce((sum, p) => sum + p.totalAmount, 0);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playSuccessSound();
    CLINIC_INFO.name = clinicName;
    CLINIC_INFO.address = clinicAddress;
    CLINIC_INFO.phone = clinicPhone;
    CLINIC_INFO.altPhone = clinicAltPhone;
    CLINIC_INFO.upiId = clinicUpi;
    CLINIC_INFO.googleReviewUrl = clinicReviewUrl;
    triggerNotification('Clinic profile and branding settings updated successfully!');
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim() || !newServicePrice) return;
    sound.playTapSound();
    const item = {
      name: newServiceName.trim(),
      price: Number(newServicePrice),
      desc: 'Custom clinic procedure',
    };
    if (newServiceCategory === 'skin') {
      setSkinServices((prev) => [...prev, item]);
    } else {
      setDentalServices((prev) => [...prev, item]);
    }
    setNewServiceName('');
    setNewServicePrice('');
    triggerNotification(`Added "${item.name}" (₹${item.price}) to ${newServiceCategory.toUpperCase()} catalog!`);
  };

  const handleAddCustomMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) return;
    sound.playTapSound();
    const newMed: MedicineItem = {
      id: `med-custom-${Date.now()}`,
      name: newMedName.trim(),
      generic: newMedGeneric.trim() || newMedName.trim(),
      type: newMedType,
      category: newMedType === 'shampoo' || newMedType === 'cream' || newMedType === 'gel' ? 'skin' : 'general',
      defaultDosage: newMedDosage,
      morning: true,
      afternoon: false,
      night: true,
      timingCode: '1-0-1',
      foodRelation: newMedType === 'shampoo' || newMedType === 'cream' ? 'topical' : 'after_food',
      defaultDays: 5,
      instructions: newMedInstructions,
    };
    MEDICINE_DATABASE.unshift(newMed);
    setCustomMedicines([...MEDICINE_DATABASE]);
    setNewMedName('');
    setNewMedGeneric('');
    triggerNotification(`Added "${newMed.name}" to global medicine formulary!`);
  };

  const triggerNotification = (msg: string) => {
    setSaveAlert(msg);
    setTimeout(() => setSaveAlert(null), 4000);
  };

  const handleExportDatabase = () => {
    sound.playTapSound();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `chaudhari_clinic_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerNotification('Database backup downloaded successfully as JSON!');
  };

  const filteredMeds = customMedicines.filter((m) =>
    m.name.toLowerCase().includes(searchMedQuery.toLowerCase()) ||
    m.generic.toLowerCase().includes(searchMedQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-slate-900 border-2 border-indigo-500/60 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-600/20 border-2 border-indigo-500/50 flex items-center justify-center text-2xl sm:text-3xl shadow-lg flex-shrink-0">
            🛡️
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black text-white">ADMIN CONSOLE</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase bg-indigo-500 text-slate-950">
                PIN 4326
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 hidden xs:block">
              Manage Doctors, Pricing Catalogs, Medicine Formularies, Daily Queue & System Settings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onExit}
            className="touch-btn px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 hover:border-red-500 text-red-300 hover:text-white text-xs font-black flex items-center gap-1.5 transition select-none active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>EXIT ADMIN</span>
          </button>
        </div>
      </div>

      {saveAlert && (
        <div className="bg-emerald-950 border border-emerald-500 text-emerald-300 px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg animate-gentle-pulse">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{saveAlert}</span>
        </div>
      )}

      {/* Admin Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar whitespace-nowrap pb-1 sm:flex-wrap">
        {[
          { key: 'dashboard', label: '📊 Financial & Queue Analytics', icon: Activity },
          { key: 'doctors', label: '👨‍⚕️ Doctors & PIN Security', icon: Stethoscope },
          { key: 'pricing', label: '💰 Procedure Pricing Catalog', icon: DollarSign },
          { key: 'formulary', label: '💊 Medicine & Shampoo Formulary', icon: Pill },
          { key: 'profile', label: '🏥 Clinic Profile & Branding', icon: Settings },
          { key: 'system', label: '⚙️ Cloud Sync, Backup & Reset', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                sound.playTapSound();
                setActiveTab(tab.key as typeof activeTab);
              }}
              className={`px-4 py-3 rounded-t-2xl text-xs font-black flex items-center gap-2 border-t border-x transition select-none ${
                isActive
                  ? 'bg-slate-900 border-indigo-500 text-indigo-300 shadow-lg'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: EXECUTIVE FINANCIAL & QUEUE DASHBOARD             */}
      {/* ======================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Revenue KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                Total Collections Today
              </span>
              <div className="text-3xl font-black font-mono text-emerald-400 mt-2">
                ₹ {totalRevenue.toLocaleString('en-IN')}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800">
                <span>Cash: ₹{cashRevenue}</span>
                <span>UPI: ₹{upiRevenue}</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                Pending Bills at Counter
              </span>
              <div className="text-3xl font-black font-mono text-amber-400 mt-2">
                ₹ {pendingRevenue.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800">
                {billedPatients.length} patient(s) waiting to pay at reception
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                Total Patients in Clinic
              </span>
              <div className="text-3xl font-black font-mono text-cyan-400 mt-2">
                {patients.length}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800">
                <span>Waiting: {waitingPatients.length}</span>
                <span>Completed: {completedPatients.length}</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                Follow-ups Scheduled
              </span>
              <div className="text-3xl font-black font-mono text-purple-400 mt-2">
                {followUpPatients.length}
              </div>
              <div className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800">
                Appointments tracked across Khamgaon
              </div>
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Department Revenue Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-purple-900/60">
                <span className="text-xs font-bold text-purple-300 block">🩺 Skin & Hair Cabin</span>
                <div className="text-2xl font-black font-mono text-white mt-1">₹ {skinRevenue.toLocaleString('en-IN')}</div>
                <p className="text-[11px] text-slate-400 mt-1">Dr. Rajanikant Chaudhari</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-900/60">
                <span className="text-xs font-bold text-cyan-300 block">🦷 Dental Cabin 1</span>
                <div className="text-2xl font-black font-mono text-white mt-1">₹ {dental1Revenue.toLocaleString('en-IN')}</div>
                <p className="text-[11px] text-slate-400 mt-1">Dr. Shrutika Tulaskar</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-900/60">
                <span className="text-xs font-bold text-emerald-300 block">🦷 Dental Cabin 2</span>
                <div className="text-2xl font-black font-mono text-white mt-1">₹ {dental2Revenue.toLocaleString('en-IN')}</div>
                <p className="text-[11px] text-slate-400 mt-1">Dr. Priyanka Chaudhari</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: DOCTORS & SECURITY PIN MANAGEMENT                 */}
      {/* ======================================================== */}
      {activeTab === 'doctors' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-400" />
                Department Access PIN Codes
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Security PIN codes are confidential and hidden from staff in the user interface.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { role: 'skin', name: 'Dr. Rajanikant Chaudhari', title: 'Skin & Hair Doctor', pin: ROLE_PINS.skin, cabin: 'Skin Cabin', icon: '🩺' },
                { role: 'dental1', name: 'Dr. Shrutika Tulaskar (Chaudhari)', title: 'Dental Doctor 1', pin: ROLE_PINS.dental1, cabin: 'Dental Cabin 1', icon: '🦷' },
                { role: 'dental2', name: 'Dr. Priyanka Chaudhari (Anokar)', title: 'Dental Doctor 2', pin: ROLE_PINS.dental2, cabin: 'Dental Cabin 2', icon: '🦷' },
                { role: 'reception', name: 'Front Desk Reception', title: 'Reception Desk', pin: ROLE_PINS.reception, cabin: 'Counter', icon: '🖥️' },
                { role: 'admin', name: 'Administrator Profile', title: 'Master Admin Console', pin: ROLE_PINS.admin, cabin: 'Management', icon: '⚙️' },
              ].map((item) => (
                <div key={item.role} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-indigo-300">
                      PIN: {item.pin}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">{item.name}</h4>
                    <p className="text-xs text-slate-400">{item.title}</p>
                  </div>
                  <div className="text-[11px] text-slate-500 font-bold uppercase">
                    Cabin: {item.cabin}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: PROCEDURE PRICING CATALOG (RATE LIST)            */}
      {/* ======================================================== */}
      {activeTab === 'pricing' && (
        <div className="space-y-6">
          {/* Add New Procedure Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              Add New Procedure to Rate List
            </h3>

            <form onSubmit={handleAddService} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="Procedure Name (e.g. Tooth Whitening, Hydrafacial)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-bold"
                  required
                />
              </div>

              <div>
                <input
                  type="number"
                  value={newServicePrice}
                  onChange={(e) => setNewServicePrice(e.target.value)}
                  placeholder="Standard Fee (₹)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono font-bold"
                  required
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={newServiceCategory}
                  onChange={(e) => setNewServiceCategory(e.target.value as 'skin' | 'dental')}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
                >
                  <option value="dental">Dental</option>
                  <option value="skin">Skin</option>
                </select>

                <button
                  type="submit"
                  className="flex-1 touch-btn bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md"
                >
                  + ADD
                </button>
              </div>
            </form>
          </div>

          {/* Pricing Catalog Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dental Procedures */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span>🦷 Dental Surgery Rate List</span>
                  <span className="text-xs text-cyan-400 font-mono">({dentalServices.length})</span>
                </h4>
              </div>

              <div className="divide-y divide-slate-800 max-h-96 overflow-y-auto text-xs">
                {dentalServices.map((svc, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{svc.name}</div>
                      <div className="text-[11px] text-slate-400">{svc.desc}</div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <span className="font-mono font-black text-emerald-400 text-sm">₹ {svc.price}</span>
                      <button
                        type="button"
                        onClick={() => setDentalServices((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skin Procedures */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span>🩺 Dermatology & Cosmetology Rate List</span>
                  <span className="text-xs text-purple-400 font-mono">({skinServices.length})</span>
                </h4>
              </div>

              <div className="divide-y divide-slate-800 max-h-96 overflow-y-auto text-xs">
                {skinServices.map((svc, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{svc.name}</div>
                      <div className="text-[11px] text-slate-400">{svc.desc}</div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <span className="font-mono font-black text-purple-300 text-sm">₹ {svc.price}</span>
                      <button
                        type="button"
                        onClick={() => setSkinServices((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: MEDICINE & SHAMPOO FORMULARY DATABASE             */}
      {/* ======================================================== */}
      {activeTab === 'formulary' && (
        <div className="space-y-6">
          {/* Add Medicine Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" />
              Add New Medicine / Shampoo / Cream to Database
            </h3>

            <form onSubmit={handleAddCustomMedicine} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <input
                  type="text"
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  placeholder="Medicine / Shampoo Name (e.g. Scalpe+, Nizral, Zerodol)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <input
                  type="text"
                  value={newMedGeneric}
                  onChange={(e) => setNewMedGeneric(e.target.value)}
                  placeholder="Generic Salt Formulation"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={newMedType}
                  onChange={(e) => setNewMedType(e.target.value as MedicineItem['type'])}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
                >
                  <option value="tablet">Tablet</option>
                  <option value="capsule">Capsule</option>
                  <option value="shampoo">Shampoo</option>
                  <option value="cream">Cream</option>
                  <option value="gel">Gel</option>
                  <option value="mouthwash">Mouthwash</option>
                  <option value="toothpaste">Toothpaste</option>
                  <option value="syrup">Syrup</option>
                  <option value="lotion">Lotion</option>
                </select>

                <button
                  type="submit"
                  className="flex-1 touch-btn bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs rounded-xl shadow-md"
                >
                  + ADD TO RX
                </button>
              </div>
            </form>
          </div>

          {/* Searchable Formulary List */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-850 pb-3">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <span>Active Medicines Database ({filteredMeds.length} items)</span>
              </h4>

              <input
                type="text"
                value={searchMedQuery}
                onChange={(e) => setSearchMedQuery(e.target.value)}
                placeholder="Search across all 150+ clinic medicines..."
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white w-72 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="divide-y divide-slate-800 max-h-96 overflow-y-auto text-xs">
              {filteredMeds.map((med) => (
                <div key={med.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{med.name}</span>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {med.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">{med.generic}</div>
                    <div className="text-[10px] text-slate-500">
                      Standard: {med.defaultDosage} • {med.timingCode} • {med.defaultDays} days
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-950 text-cyan-300 border border-slate-800 flex-shrink-0">
                    {med.category.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: CLINIC PROFILE & BRANDING                         */}
      {/* ======================================================== */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-850 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-white">Clinic Identity & Public Settings</h3>
              <p className="text-xs text-slate-400">Printed on receipts and included in patient WhatsApp notifications</p>
            </div>
            <button
              type="submit"
              className="touch-btn px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-2 shadow-lg"
            >
              <Save className="w-4 h-4" />
              <span>SAVE PROFILE</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 font-bold block mb-1">Clinic Full Name:</label>
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">UPI ID for Reception QR Payments:</label>
              <input
                type="text"
                value={clinicUpi}
                onChange={(e) => setClinicUpi(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-slate-400 font-bold block mb-1">Clinic Complete Address:</label>
              <input
                type="text"
                value={clinicAddress}
                onChange={(e) => setClinicAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Primary Reception Phone:</label>
              <input
                type="text"
                value={clinicPhone}
                onChange={(e) => setClinicPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Google Review Link:</label>
              <input
                type="text"
                value={clinicReviewUrl}
                onChange={(e) => setClinicReviewUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* TAB 6: BACKUP, RESET & SYSTEM CONTROLS                   */}
      {/* ======================================================== */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              Clinic Database Backup & Export
            </h3>
            <p className="text-xs text-slate-400">
              Download complete local database containing all patients, visit records, and prescriptions as a timestamped JSON file.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={handleExportDatabase}
                className="touch-btn px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-2 shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>DOWNLOAD FULL DATABASE BACKUP (JSON)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to reload realistic Khamgaon clinic demo queue and records?')) {
                    resetDemoData();
                    triggerNotification('Clinic data reset to sample demonstration state!');
                  }
                }}
                className="touch-btn px-6 py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 transition"
              >
                <RotateCcw className="w-4 h-4 text-cyan-400" />
                <span>RELOAD DEMO DATA</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Multi-Device Real-Time Sync Status
            </h4>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div className="flex items-center gap-2 text-emerald-300 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Instant Multi-Window / Multi-Tab Synchronization Active</span>
              </div>
              <p className="text-slate-400">
                Any changes made at Reception (new patients, billing) or inside Doctor Cabins (odontogram, prescriptions) synchronize across windows instantly without page reload.
              </p>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                Cloud Provider: {isFirebase ? 'Firebase Firestore (Online Sync)' : 'BroadcastChannel + Local Storage (Zero-Config)'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
