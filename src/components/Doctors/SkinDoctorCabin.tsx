import React, { useState } from 'react';
import { useClinicStore } from '../../services/clinicStore';
import { BillingItem, PrescriptionItem, ClinicalMedia } from '../../types/clinic';
import { sound } from '../../services/sound';
import { MediaUploader } from '../ClinicalNotes/MediaUploader';
import { FollowUpScheduler } from '../ClinicalNotes/FollowUpScheduler';
import { PatientRecordsModal } from '../PatientHistory/PatientRecordsModal';
import { PrescriptionBuilder } from '../Prescription/PrescriptionBuilder';
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
  FolderOpen,
  MapPin,
  Camera,
  CalendarCheck
} from 'lucide-react';

const SKIN_RX_TEMPLATES: Record<string, { label: string; items: PrescriptionItem[] }> = {
  acne: {
    label: 'Acne Vulgaris',
    items: [
      { medicine: 'Adapalene 0.1% + Clindamycin 1% Gel', dosage: 'Apply thin layer', timing: 'At night (HS)', days: 30 },
      { medicine: 'Cap. Doxycycline 100mg', dosage: '1 Capsule', timing: 'After lunch (1-0-0)', days: 15 },
      { medicine: 'Salicylic Acid 2% Foaming Face Wash', dosage: 'Gentle wash', timing: 'Twice daily', days: 30 },
    ],
  },
  fungal: {
    label: 'Fungal / Tinea Infection',
    items: [
      { medicine: 'Tab. Itraconazole 200mg', dosage: '1 Tablet', timing: 'After breakfast & dinner (1-0-1)', days: 10 },
      { medicine: 'Luliconazole 1% Cream', dosage: 'Apply locally', timing: 'Twice daily', days: 21 },
      { medicine: 'Ketoconazole 2% Soap', dosage: 'Bathing soap', timing: 'Daily', days: 30 },
    ],
  },
  hairfall: {
    label: 'Hair Fall / Alopecia',
    items: [
      { medicine: 'Minoxidil 5% Topical Solution', dosage: '1 ml spray', timing: 'Twice daily on dry scalp', days: 60 },
      { medicine: 'Cap. Biotin with Zinc & Multivitamins', dosage: '1 Capsule', timing: 'After lunch (0-1-0)', days: 30 },
      { medicine: 'Peptide Pro-Hair Serum', dosage: '5-6 drops', timing: 'At bedtime', days: 30 },
    ],
  },
  allergy: {
    label: 'Allergic Dermatitis / Urticaria',
    items: [
      { medicine: 'Tab. Bilastine 20mg', dosage: '1 Tablet', timing: 'Empty stomach (1-0-0)', days: 10 },
      { medicine: 'Calamine + Pramoxine Soothing Lotion', dosage: 'Apply gently', timing: 'Three times daily (TDS)', days: 14 },
      { medicine: 'Hydrocortisone 1% Cream', dosage: 'Thin layer', timing: 'Twice daily x 5 days only', days: 5 },
    ],
  },
};

export const SkinDoctorCabin: React.FC = () => {
  const { cabins, patients, finishDoctorConsultation, sendNextPatientToCabin, waitingCount } = useClinicStore();
  const skinCabin = cabins.skin;
  const currentPatient = patients.find((p) => p.id === skinCabin.currentPatientId);

  // Draft items in cabin
  const [billingItems, setBillingItems] = useState<BillingItem[]>([
    {
      id: 'default-skin-consult',
      description: 'Dermatology Consultation',
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

  // Quick fee add
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

  // Rx templates
  const applyRxTemplate = (templateKey: string) => {
    sound.playTapSound();
    const tpl = SKIN_RX_TEMPLATES[templateKey];
    if (tpl) {
      setRxList(tpl.items);
      if (!diagnosis) {
        setDiagnosis(tpl.label);
      }
    }
  };

  const totalBill = billingItems.reduce((acc, item) => acc + item.amount, 0);

  // Submit bill to reception and preserve visit record
  const handleFinishConsultation = () => {
    if (!currentPatient) return;
    sound.playTapSound();
    finishDoctorConsultation(
      'skin',
      billingItems,
      rxList,
      doctorNotes,
      photos,
      followUpDate,
      followUpNotes,
      diagnosis
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Cabin Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-3xl">
            🩺
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white">SKIN & HAIR CABIN</h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  skinCabin.status === 'free'
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-red-600 text-white font-black animate-pulse'
                }`}
              >
                {skinCabin.status === 'free' ? 'CABIN FREE' : 'PATIENT INSIDE'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Dr. Chaudhari (Consultant Dermatologist) • Near Dr. Chande Clinic, Khamgaon
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
            Waiting Outside: <strong className="text-purple-400">{waitingCount.skin}</strong>
          </span>
          {skinCabin.status === 'free' && waitingCount.skin > 0 && (
            <button
              type="button"
              onClick={() => sendNextPatientToCabin('skin')}
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
          <h3 className="text-2xl font-black text-white">Cabin is Free & Sanitized</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mt-2">
            The reception desk will send the next patient inside. Once sent, the patient profile, clinical notes, media uploader, and prescription card will appear here automatically.
          </p>

          {waitingCount.skin > 0 && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => sendNextPatientToCabin('skin')}
                className="touch-btn px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-950/60 inline-flex items-center gap-2"
              >
                <span>SEND NEXT PATIENT INSIDE ({waitingCount.skin} Waiting)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Active Patient In Cabin */
        <div className="space-y-6">
          {/* Patient Details Card */}
          <div className="bg-slate-900 border-2 border-purple-800/60 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-purple-600 text-white font-black text-xl sm:text-2xl font-mono flex items-center justify-center shadow-lg flex-shrink-0">
                #{currentPatient.tokenNumber}
              </div>
              <div>
                <span className="text-xs font-extrabold text-purple-400 uppercase tracking-wider">
                  Active Dermatology Consultation
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
                    <MapPin className="w-3.5 h-3.5 text-purple-400" />
                    City: {currentPatient.city || 'Khamgaon'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Entered: {skinCabin.enteredTime || 'Just now'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRecordsModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <FolderOpen className="w-4 h-4" />
                <span>View Past Visits & Photos</span>
              </button>
            </div>

            {/* Returning Patient History Banner (Arranged by latest date) */}
            {currentPatient.pastVisits && currentPatient.pastVisits.length > 0 && (
              <div className="w-full mt-3 pt-3 border-t border-purple-800/40 flex flex-wrap items-center justify-between gap-2 bg-purple-950/20 p-3 rounded-2xl">
                <div className="flex items-center gap-2 text-xs text-amber-300 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping flex-shrink-0" />
                  <span>
                    RETURNING PATIENT: {currentPatient.pastVisits.length} Previous Visit(s) on File
                  </span>
                  <span className="text-slate-300 font-normal">
                    • Last visit ({currentPatient.pastVisits[0].date}): &ldquo;<strong className="text-white">{currentPatient.pastVisits[0].diagnosis || 'Consultation'}</strong>&rdquo;
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

          {/* Clinical Notes & Media Upload */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Col: Clinical Notes, Diagnosis, Media & Follow-up */}
            <div className="space-y-4">
              {/* Diagnosis & Notes */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
                <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-purple-400" />
                  Clinical Diagnosis & Examination Notes
                </h4>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Clinical Diagnosis / Problem:
                  </label>
                  <input
                    type="text"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Severe Grade III Acne Vulgaris, Tinea Cruris, Telogen Effluvium"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Detailed Examination Observations:
                  </label>
                  <textarea
                    rows={3}
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    placeholder="e.g. Multiple inflammatory papules and comedones on bilateral cheeks and forehead. Advised strict sun protection, non-comedogenic cleanser..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Media & Photos Uploader */}
              <MediaUploader
                photos={photos}
                onPhotosChange={setPhotos}
                label="Attach Patient Clinical Photos / Dermatoscope"
              />

              {/* Follow-up Scheduling */}
              <FollowUpScheduler
                followUpDate={followUpDate}
                followUpNotes={followUpNotes}
                department="skin"
                onChange={(d, n) => {
                  setFollowUpDate(d);
                  setFollowUpNotes(n);
                }}
              />
            </div>

            {/* Right Col: 1-Tap Rx Templates & Billing */}
            <div className="space-y-4 flex flex-col justify-between">
              {/* Advanced Prescription System */}
              <PrescriptionBuilder
                rxList={rxList}
                onChange={setRxList}
                department="skin"
                templates={SKIN_RX_TEMPLATES}
              />

              {/* Procedures & Billing */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    Quick Procedure & Fee Buttons
                  </h4>
                  <span className="text-xs text-slate-400">1-Tap adds to bill</span>
                </div>

                {/* 4 Quick Fee Buttons */}
                <div className="grid grid-cols-2 gap-2.5 mb-3">
                  <button
                    type="button"
                    onClick={() => addFee('Skin Consultation', 300, 'consult')}
                    className="touch-btn p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 flex flex-col items-center justify-center transition active:scale-95"
                  >
                    <span className="text-xs font-bold text-slate-300">Consultation</span>
                    <span className="text-sm font-black font-mono text-emerald-400">₹ 300</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addFee('Chemical Peel Session', 1500, 'procedure')}
                    className="touch-btn p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 flex flex-col items-center justify-center transition active:scale-95"
                  >
                    <span className="text-xs font-bold text-slate-300">Chemical Peel</span>
                    <span className="text-sm font-black font-mono text-purple-300">₹ 1,500</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addFee('PRP Hair / Skin Therapy', 2500, 'procedure')}
                    className="touch-btn p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 flex flex-col items-center justify-center transition active:scale-95"
                  >
                    <span className="text-xs font-bold text-slate-300">PRP Therapy</span>
                    <span className="text-sm font-black font-mono text-purple-300">₹ 2,500</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addFee('Laser Skin Session', 2000, 'procedure')}
                    className="touch-btn p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 flex flex-col items-center justify-center transition active:scale-95"
                  >
                    <span className="text-xs font-bold text-slate-300">Laser Session</span>
                    <span className="text-sm font-black font-mono text-purple-300">₹ 2,000</span>
                  </button>
                </div>

                {/* Custom Fee Line */}
                <form onSubmit={handleAddCustomFee} className="flex gap-2">
                  <input
                    type="text"
                    value={customFeeName}
                    onChange={(e) => setCustomFeeName(e.target.value)}
                    placeholder="Custom procedure name"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  <input
                    type="number"
                    value={customFeeAmount}
                    onChange={(e) => setCustomFeeAmount(e.target.value)}
                    placeholder="₹ Amount"
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
                <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800 space-y-1.5 max-h-36 overflow-y-auto">
                  {billingItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs py-1 border-b border-slate-900"
                    >
                      <span className="text-slate-300">{item.description}</span>
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
                      TOTAL BILL TO SEND:
                    </span>
                    <span className="text-3xl font-black font-mono text-purple-300">
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
          </div>
        </div>
      )}

      {/* Patient Records Modal */}
      {isRecordsModalOpen && (
        <PatientRecordsModal
          doctorRole="skin"
          initialPatientId={currentPatient?.id}
          onClose={() => setIsRecordsModalOpen(false)}
        />
      )}
    </div>
  );
};
