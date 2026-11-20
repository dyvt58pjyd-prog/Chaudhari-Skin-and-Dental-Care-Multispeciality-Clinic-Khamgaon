import React, { useState } from 'react';
import { useClinicStore } from '../../services/clinicStore';
import { BillingItem, PrescriptionItem, ToothState, ClinicalMedia } from '../../types/clinic';
import { InteractiveOdontogram } from '../Odontogram/InteractiveOdontogram';
import { ZoliQuaOdontogramWrapper } from '../Odontogram/ZoliQuaOdontogramWrapper';
import { MediaUploader } from '../ClinicalNotes/MediaUploader';
import { FollowUpScheduler } from '../ClinicalNotes/FollowUpScheduler';
import { PatientRecordsModal } from '../PatientHistory/PatientRecordsModal';
import { PrescriptionBuilder } from '../Prescription/PrescriptionBuilder';
import { sound } from '../../services/sound';
import {
  Sparkles,
  Stethoscope,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  User,
  Phone,
  Pill,
  Send,
  ArrowRight,
  ShieldCheck,
  Activity,
  Layers,
  FolderOpen,
  MapPin,
  Camera
} from 'lucide-react';

const DENTAL_RX_TEMPLATES: Record<string, { label: string; items: PrescriptionItem[] }> = {
  pulpitis: {
    label: 'Acute Pulpitis / Severe Toothache',
    items: [
      { medicine: 'Tab. Amoxicillin 500mg', dosage: '1 Capsule', timing: 'Three times daily (1-1-1)', days: 5 },
      { medicine: 'Tab. Ketorolac DT 10mg (Dispersible)', dosage: 'Dissolve in water', timing: 'SOS when acute pain occurs', days: 3 },
      { medicine: 'Tab. Pantoprazole 40mg', dosage: '1 Tablet', timing: 'Before breakfast (1-0-0)', days: 5 },
    ],
  },
  extraction: {
    label: 'Post-Extraction / Surgical',
    items: [
      { medicine: 'Tab. Augmentin 625mg', dosage: '1 Tablet', timing: 'After food (1-0-1)', days: 5 },
      { medicine: 'Tab. Zerodol-SP (Aceclofenac + Serratiopeptidase)', dosage: '1 Tablet', timing: 'Twice daily (1-0-1)', days: 3 },
      { medicine: 'Chlorhexidine 0.2% Mouthwash', dosage: '10 ml rinse', timing: 'Twice daily after 24 hrs', days: 7 },
    ],
  },
  gingivitis: {
    label: 'Gingivitis / Periodontal Infection',
    items: [
      { medicine: 'Tab. Metrogyl 400mg', dosage: '1 Tablet', timing: 'After food (1-0-1)', days: 5 },
      { medicine: 'Tab. Ibuprofen 400mg', dosage: '1 Tablet', timing: 'Twice daily after meals (1-0-1)', days: 4 },
      { medicine: 'Chlorhexidine Gluconate Oral Rinse', dosage: '10 ml without water', timing: 'Morning & Night (1-0-1)', days: 14 },
    ],
  },
  pediatric: {
    label: 'Pediatric Dental Pain',
    items: [
      { medicine: 'Syp. Ibugesic Plus (Ibuprofen + Paracetamol)', dosage: '5 ml syrup', timing: 'SOS three times daily', days: 3 },
      { medicine: 'Syp. Augmentin Duo', dosage: '5 ml syrup', timing: 'Twice daily after food (1-0-1)', days: 5 },
      { medicine: 'Warm Saline Rinses', dosage: 'Half tsp salt in warm water', timing: '4 times daily', days: 5 },
    ],
  },
};

interface DentalDoctorCabinProps {
  cabinId: 'dental1' | 'dental2';
}

export const DentalDoctorCabin: React.FC<DentalDoctorCabinProps> = ({ cabinId }) => {
  const { cabins, patients, finishDoctorConsultation, sendNextPatientToCabin, waitingCount } = useClinicStore();
  const dentalCabin = cabins[cabinId];
  const currentPatient = patients.find((p) => p.id === dentalCabin.currentPatientId);

  // Doctor exact name
  const doctorName =
    cabinId === 'dental1'
      ? 'Dr. Shrutika Tulaskar (Chaudhari)'
      : 'Dr. Priyanka Chaudhari (Anokar)';

  // Odontogram mode switcher: 'interactive' (rapid touch + auto-billing) vs 'zoliqua' (deep library editor)
  const [activeOdontoTab, setActiveOdontoTab] = useState<'interactive' | 'zoliqua'>('interactive');

  // Draft dental state & billing items
  const [dentalState, setDentalState] = useState<Record<number, ToothState>>(
    currentPatient?.dentalState || {}
  );
  const [billingItems, setBillingItems] = useState<BillingItem[]>([
    {
      id: `default-${cabinId}-consult`,
      description: 'Dental Consultation & Diagnosis',
      category: 'consult',
      amount: 300,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [rxList, setRxList] = useState<PrescriptionItem[]>([]);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [photos, setPhotos] = useState<ClinicalMedia[]>([]);
  const [followUpDate, setFollowUpDate] = useState<string | undefined>(undefined);
  const [followUpNotes, setFollowUpNotes] = useState<string | undefined>(undefined);

  const [customFeeName, setCustomFeeName] = useState('');
  const [customFeeAmount, setCustomFeeAmount] = useState('');
  const [isRecordsModalOpen, setIsRecordsModalOpen] = useState(false);

  // Add standard procedure fee
  const addFee = (desc: string, amount: number, category: BillingItem['category'] = 'procedure') => {
    sound.playTapSound();
    setBillingItems((prev) => [
      ...prev,
      {
        id: `fee-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        description: desc,
        category,
        amount,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const removeFee = (id: string) => {
    sound.playTapSound();
    setBillingItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddCustomFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFeeName.trim() || !customFeeAmount) return;
    addFee(customFeeName.trim(), Number(customFeeAmount), 'custom');
    setCustomFeeName('');
    setCustomFeeAmount('');
  };

  const applyRxTemplate = (templateKey: string) => {
    sound.playTapSound();
    const tpl = DENTAL_RX_TEMPLATES[templateKey];
    if (tpl) {
      setRxList(tpl.items);
      if (!diagnosis) {
        setDiagnosis(tpl.label);
      }
    }
  };

  const totalBill = billingItems.reduce((acc, item) => acc + item.amount, 0);

  const handleFinishConsultation = () => {
    if (!currentPatient) return;
    sound.playTapSound();
    finishDoctorConsultation(
      cabinId,
      billingItems,
      rxList,
      doctorNotes,
      photos,
      followUpDate,
      followUpNotes,
      diagnosis,
      dentalState
    );
  };

  const countWaiting = waitingCount[cabinId];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Cabin Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-3xl">
            🦷
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white">{doctorName.toUpperCase()}</h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  dentalCabin.status === 'free'
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-red-600 text-white font-black animate-pulse'
                }`}
              >
                {dentalCabin.status === 'free' ? 'CHAIR FREE' : 'PATIENT ON CHAIR'}
              </span>
            </div>
            <p className="text-xs text-cyan-400 mt-0.5 font-bold">
              {cabinId === 'dental1' ? 'Dental Cabin 1 • Senior Dental Surgeon' : 'Dental Cabin 2 • Dental Surgeon'}
              <span className="text-slate-400 font-normal"> • Chaudhari Multispeciality Clinic, Khamgaon</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsRecordsModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 text-xs font-bold flex items-center gap-1.5 hover:border-slate-700 transition"
          >
            <FolderOpen className="w-4 h-4 text-cyan-400" />
            <span>Patient Records</span>
          </button>

          <span className="text-xs font-bold text-slate-400 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
            Waiting Outside: <strong className="text-cyan-400">{countWaiting}</strong>
          </span>
          {dentalCabin.status === 'free' && countWaiting > 0 && (
            <button
              type="button"
              onClick={() => sendNextPatientToCabin(cabinId)}
              className="touch-btn px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-950/60"
            >
              <span>CALL NEXT PATIENT</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {!currentPatient ? (
        /* Empty Cabin State */
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-12 text-center shadow-xl">
          <div className="w-20 h-20 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-4 text-3xl">
            ✓
          </div>
          <h3 className="text-2xl font-black text-white">Dental Chair is Free & Ready</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mt-2">
            The reception desk will send the next patient to {doctorName}. Once sent, the patient&apos;s odontogram, clinical notes, and itemized bill will open immediately.
          </p>

          {countWaiting > 0 && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => sendNextPatientToCabin(cabinId)}
                className="touch-btn px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-950/60 inline-flex items-center gap-2"
              >
                <span>SEND NEXT PATIENT INSIDE ({countWaiting} Waiting)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Active Patient In Dental Chair */
        <div className="space-y-6">
          {/* Patient Details Top Bar */}
          <div className="bg-slate-900 border-2 border-cyan-800/60 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-cyan-500 text-slate-950 font-black text-xl sm:text-2xl font-mono flex items-center justify-center shadow-lg flex-shrink-0">
                #{currentPatient.tokenNumber}
              </div>
              <div>
                <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider">
                  Patient On Dental Chair
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  {currentPatient.name}
                  {currentPatient.age && (
                    <span className="text-sm font-bold text-slate-300">
                      ({currentPatient.age} Yrs)
                    </span>
                  )}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1">
                  <span className="flex items-center gap-1 font-mono text-cyan-300">
                    <Phone className="w-3.5 h-3.5" />
                    +91 {currentPatient.phone}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    City: {currentPatient.city || 'Khamgaon'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Entered: {dentalCabin.enteredTime || 'Just now'}
                  </span>
                </div>
              </div>
            </div>

            {/* View Mode Toggle Switcher & Records trigger */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRecordsModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Past Visits</span>
              </button>

              <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setActiveOdontoTab('interactive');
                    sound.playTapSound();
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                    activeOdontoTab === 'interactive'
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🦷 Touch Chart (Auto-Bill)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveOdontoTab('zoliqua');
                    sound.playTapSound();
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                    activeOdontoTab === 'zoliqua'
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🔬 ZoliQua Odontogram</span>
                </button>
              </div>
            </div>

            {/* Returning Patient History Banner (Arranged by latest date) */}
            {currentPatient.pastVisits && currentPatient.pastVisits.length > 0 && (
              <div className="w-full mt-2 pt-3 border-t border-cyan-800/40 flex flex-wrap items-center justify-between gap-2 bg-cyan-950/20 p-3 rounded-2xl">
                <div className="flex items-center gap-2 text-xs text-amber-300 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping flex-shrink-0" />
                  <span>
                    RETURNING PATIENT: {currentPatient.pastVisits.length} Previous Dental Visit(s) on File
                  </span>
                  <span className="text-slate-300 font-normal">
                    • Last visit ({currentPatient.pastVisits[0].date}): &ldquo;<strong className="text-white">{currentPatient.pastVisits[0].diagnosis || 'Dental Procedure'}</strong>&rdquo;
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRecordsModalOpen(true)}
                  className="text-xs font-black text-cyan-300 hover:underline flex items-center gap-1"
                >
                  <span>Review Past Visits (Latest First) &rarr;</span>
                </button>
              </div>
            )}
          </div>

          {/* DENTAL ODONTOGRAM SECTION */}
          {activeOdontoTab === 'interactive' ? (
            <InteractiveOdontogram
              dentalState={dentalState}
              onDentalStateChange={setDentalState}
              billingItems={billingItems}
              onBillingItemsChange={setBillingItems}
            />
          ) : (
            <ZoliQuaOdontogramWrapper />
          )}

          {/* CLINICAL NOTES, MEDIA ATTACHMENTS & FOLLOW-UP */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Col: Clinical Findings, Media & Follow-up */}
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
                <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-cyan-400" />
                  Dental Examination & Clinical Notes
                </h4>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Dental Diagnosis / Complaint:
                  </label>
                  <input
                    type="text"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Acute Irreversible Pulpitis #46, Generalized Chronic Periodontitis"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Intraoral Observations & Treatment Plan:
                  </label>
                  <textarea
                    rows={3}
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    placeholder="e.g. Tenderness on vertical percussion on tooth 46. Rotary biomechanical preparation initiated with Protaper Gold. Irrigation with 3% NaOCl and saline..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Photos & Radiographs (IOPAs, Intraoral shots) */}
              <MediaUploader
                photos={photos}
                onPhotosChange={setPhotos}
                label="Attach Intraoral Photos, Radiographs & IOPAs"
              />

              {/* Next Checkup & Follow-up */}
              <FollowUpScheduler
                followUpDate={followUpDate}
                followUpNotes={followUpNotes}
                department="dental"
                onChange={(d, n) => {
                  setFollowUpDate(d);
                  setFollowUpNotes(n);
                }}
              />
            </div>

            {/* Right Col: Quick Rx & Itemized Bill */}
            <div className="space-y-4 flex flex-col justify-between">
              {/* Advanced Dental Prescription System */}
              <PrescriptionBuilder
                rxList={rxList}
                onChange={setRxList}
                department="dental"
                templates={DENTAL_RX_TEMPLATES}
              />

              {/* Dental Fees & Submit */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    Quick Dental Procedure Fees
                  </h4>
                  <span className="text-xs text-slate-400">1-Tap adds to bill</span>
                </div>

                {/* Quick Fee Buttons */}
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => addFee('Dental Consultation', 300, 'consult')}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex flex-col items-center justify-center transition active:scale-95"
                  >
                    <span className="text-xs font-bold text-slate-300">Consult</span>
                    <span className="text-xs font-black font-mono text-emerald-400">₹ 300</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addFee('Scaling & Polishing', 800, 'procedure')}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex flex-col items-center justify-center transition active:scale-95"
                  >
                    <span className="text-xs font-bold text-slate-300">Scaling</span>
                    <span className="text-xs font-black font-mono text-cyan-400">₹ 800</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addFee('Tooth Filling (Composite)', 1000, 'procedure')}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex flex-col items-center justify-center transition active:scale-95"
                  >
                    <span className="text-xs font-bold text-slate-300">Filling</span>
                    <span className="text-xs font-black font-mono text-cyan-400">₹ 1,000</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addFee('Root Canal Treatment (RCT)', 3500, 'procedure')}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex flex-col items-center justify-center transition active:scale-95"
                  >
                    <span className="text-xs font-bold text-slate-300">RCT</span>
                    <span className="text-xs font-black font-mono text-red-400">₹ 3,500</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addFee('Ceramic Crown', 4000, 'procedure')}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex flex-col items-center justify-center transition active:scale-95"
                  >
                    <span className="text-xs font-bold text-slate-300">Crown</span>
                    <span className="text-xs font-black font-mono text-amber-400">₹ 4,000</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addFee('Tooth Extraction', 500, 'procedure')}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex flex-col items-center justify-center transition active:scale-95"
                  >
                    <span className="text-xs font-bold text-slate-300">Extraction</span>
                    <span className="text-xs font-black font-mono text-rose-400">₹ 500</span>
                  </button>
                </div>

                {/* Custom Fee Line */}
                <form onSubmit={handleAddCustomFee} className="flex gap-2">
                  <input
                    type="text"
                    value={customFeeName}
                    onChange={(e) => setCustomFeeName(e.target.value)}
                    placeholder="Custom procedure (e.g. Bleaching)"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  <input
                    type="number"
                    value={customFeeAmount}
                    onChange={(e) => setCustomFeeAmount(e.target.value)}
                    placeholder="₹ Fee"
                    className="w-24 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
                  >
                    + Add
                  </button>
                </form>

                {/* Running Itemized Bill */}
                <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800 space-y-1.5 max-h-36 overflow-y-auto text-xs">
                  {billingItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs py-1 border-b border-slate-900"
                    >
                      <span className="text-slate-300 font-medium">{item.description}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">₹{item.amount}</span>
                        <button
                          type="button"
                          onClick={() => removeFee(item.id)}
                          className="text-slate-600 hover:text-red-400 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total & Giant Submit Button */}
                <div className="pt-2 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                      TOTAL BILL TO SEND TO RECEPTION:
                    </span>
                    <span className="text-3xl font-black font-mono text-cyan-400">
                      ₹ {totalBill.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleFinishConsultation}
                    className="w-full touch-btn bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-base font-black rounded-2xl shadow-xl shadow-emerald-950/80 flex items-center justify-center gap-2 cursor-pointer transition select-none"
                  >
                    <CheckCircle className="w-6 h-6" />
                    <span>✅ FINISH & SEND BILL TO RECEPTION (₹ {totalBill})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Returning Patient History Banner (Arranged by latest date) */}
            {currentPatient.pastVisits && currentPatient.pastVisits.length > 0 && (
              <div className="w-full mt-2 pt-3 border-t border-cyan-800/40 flex flex-wrap items-center justify-between gap-2 bg-cyan-950/20 p-3 rounded-2xl">
                <div className="flex items-center gap-2 text-xs text-amber-300 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping flex-shrink-0" />
                  <span>
                    RETURNING PATIENT: {currentPatient.pastVisits.length} Previous Dental Visit(s) on File
                  </span>
                  <span className="text-slate-300 font-normal">
                    • Last visit ({currentPatient.pastVisits[0].date}): &ldquo;<strong className="text-white">{currentPatient.pastVisits[0].diagnosis || 'Dental Procedure'}</strong>&rdquo;
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRecordsModalOpen(true)}
                  className="text-xs font-black text-cyan-300 hover:underline flex items-center gap-1"
                >
                  <span>Review Past Visits (Latest First) &rarr;</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Patient History Records Modal */}
      {isRecordsModalOpen && (
        <PatientRecordsModal
          doctorRole={cabinId}
          initialPatientId={currentPatient?.id}
          onClose={() => setIsRecordsModalOpen(false)}
        />
      )}
    </div>
  );
};
