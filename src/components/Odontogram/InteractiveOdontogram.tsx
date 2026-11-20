import React, { useState } from 'react';
import { ToothState, ToothSurface, SurfaceCondition, ToothWholeCondition, BillingItem } from '../../types/clinic';
import { ToothSvg } from './ToothSvg';
import { sound } from '../../services/sound';
import { Check, X, ShieldAlert, Sparkles, Layers, RefreshCw } from 'lucide-react';

interface InteractiveOdontogramProps {
  dentalState: Record<number, ToothState>;
  onDentalStateChange: (newState: Record<number, ToothState>) => void;
  billingItems: BillingItem[];
  onBillingItemsChange: (newItems: BillingItem[]) => void;
}

// Quadrant Tooth Lists
const PERMANENT_Q1 = [18, 17, 16, 15, 14, 13, 12, 11]; // Maxillary Right (patient view left)
const PERMANENT_Q2 = [21, 22, 23, 24, 25, 26, 27, 28]; // Maxillary Left (patient view right)
const PERMANENT_Q4 = [48, 47, 46, 45, 44, 43, 42, 41]; // Mandibular Right
const PERMANENT_Q3 = [31, 32, 33, 34, 35, 36, 37, 38]; // Mandibular Left

const PRIMARY_Q5 = [55, 54, 53, 52, 51]; // Primary Upper Right
const PRIMARY_Q6 = [61, 62, 63, 64, 65]; // Primary Upper Left
const PRIMARY_Q8 = [85, 84, 83, 82, 81]; // Primary Lower Right
const PRIMARY_Q7 = [71, 72, 73, 74, 75]; // Primary Lower Left

// Pricing table for auto-billing
const AUTO_BILL_PRICES: Record<string, { desc: string; amount: number; category: BillingItem['category'] }> = {
  caries: { desc: 'Tooth Filling (Composite/GIC)', amount: 1000, category: 'dental_surface' },
  composite: { desc: 'Composite Aesthetic Filling', amount: 1000, category: 'dental_surface' },
  amalgam: { desc: 'GIC / Amalgam Restoration', amount: 800, category: 'dental_surface' },
  sealant: { desc: 'Pit & Fissure Sealant', amount: 600, category: 'dental_surface' },
  missing: { desc: 'Tooth Extraction', amount: 500, category: 'dental_tooth' },
  rct: { desc: 'Root Canal Treatment (RCT)', amount: 3500, category: 'dental_tooth' },
  crown: { desc: 'Ceramic Crown / Cap', amount: 4000, category: 'dental_tooth' },
  implant: { desc: 'Titanium Dental Implant', amount: 25000, category: 'dental_tooth' },
  bridge: { desc: 'Bridge Unit / Pontic', amount: 3500, category: 'dental_tooth' },
};

export const InteractiveOdontogram: React.FC<InteractiveOdontogramProps> = ({
  dentalState,
  onDentalStateChange,
  billingItems,
  onBillingItemsChange,
}) => {
  const [isPediatric, setIsPediatric] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(46); // default to 46 for fast interaction
  const [activeBrush, setActiveBrush] = useState<SurfaceCondition>('caries');

  // Helper to get or create tooth record
  const getTooth = (tNo: number): ToothState => {
    return (
      dentalState[tNo] || {
        toothNo: tNo,
        wholeCondition: 'healthy',
        surfaces: {
          buccal: 'healthy',
          lingual: 'healthy',
          mesial: 'healthy',
          distal: 'healthy',
          occlusal: 'healthy',
        },
      }
    );
  };

  // Surface click handler (auto-bills if new condition applied)
  const handleSurfaceClick = (toothNo: number, surface: ToothSurface) => {
    sound.playTapSound();
    const current = getTooth(toothNo);
    const prevCondition = current.surfaces[surface];
    const newCondition = prevCondition === activeBrush ? 'healthy' : activeBrush;

    const updatedTooth: ToothState = {
      ...current,
      surfaces: {
        ...current.surfaces,
        [surface]: newCondition,
      },
    };

    const updatedMap = { ...dentalState, [toothNo]: updatedTooth };
    onDentalStateChange(updatedMap);
    setSelectedTooth(toothNo);

    // AUTO-BILLING LINK:
    // If a billable condition is added, add to billingItems
    const billId = `bill-t${toothNo}-${surface}`;
    let updatedBilling = billingItems.filter((item) => item.id !== billId);

    if (newCondition !== 'healthy' && AUTO_BILL_PRICES[newCondition]) {
      const priceMeta = AUTO_BILL_PRICES[newCondition];
      const surfaceName = surface.charAt(0).toUpperCase() + surface.slice(1);
      updatedBilling.push({
        id: billId,
        description: `${priceMeta.desc} (Tooth ${toothNo} - ${surfaceName})`,
        category: priceMeta.category,
        toothNo,
        surface,
        amount: priceMeta.amount,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }

    onBillingItemsChange(updatedBilling);
  };

  // Whole-tooth condition handler (auto-bills)
  const handleWholeCondition = (toothNo: number, condition: ToothWholeCondition) => {
    sound.playTapSound();
    const current = getTooth(toothNo);
    const newCond = current.wholeCondition === condition ? 'healthy' : condition;

    const updatedTooth: ToothState = {
      ...current,
      wholeCondition: newCond,
    };

    const updatedMap = { ...dentalState, [toothNo]: updatedTooth };
    onDentalStateChange(updatedMap);

    // AUTO-BILLING LINK for whole tooth:
    const billId = `bill-t${toothNo}-whole`;
    let updatedBilling = billingItems.filter((item) => item.id !== billId);

    if (newCond !== 'healthy' && AUTO_BILL_PRICES[newCond]) {
      const priceMeta = AUTO_BILL_PRICES[newCond];
      updatedBilling.push({
        id: billId,
        description: `${priceMeta.desc} (Tooth ${toothNo})`,
        category: priceMeta.category,
        toothNo,
        amount: priceMeta.amount,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }

    onBillingItemsChange(updatedBilling);
  };

  // Clear single tooth
  const handleClearTooth = (toothNo: number) => {
    sound.playTapSound();
    const updatedMap = { ...dentalState };
    delete updatedMap[toothNo];
    onDentalStateChange(updatedMap);

    // Remove all billing items for this tooth
    const updatedBilling = billingItems.filter((item) => item.toothNo !== toothNo);
    onBillingItemsChange(updatedBilling);
  };

  // Active tooth state
  const activeToothState = selectedTooth ? getTooth(selectedTooth) : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
      {/* Top Controls: Arch Type & Surface Brush Tool */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
        {/* Adult vs Pediatric switch */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setIsPediatric(false);
              setSelectedTooth(11);
              sound.playTapSound();
            }}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2 ${
              !isPediatric
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Adult (32 Teeth)
          </button>
          <button
            type="button"
            onClick={() => {
              setIsPediatric(true);
              setSelectedTooth(51);
              sound.playTapSound();
            }}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2 ${
              isPediatric
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            Pediatric (20 Teeth)
          </button>
        </div>

        {/* Surface Painting Brush Selector */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
            Surface Brush:
          </span>
          <button
            type="button"
            onClick={() => {
              setActiveBrush('caries');
              sound.playTapSound();
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition ${
              activeBrush === 'caries'
                ? 'bg-red-600 text-white ring-2 ring-red-400 shadow-md shadow-red-950'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
            Caries (Decay) ₹1000
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveBrush('composite');
              sound.playTapSound();
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition ${
              activeBrush === 'composite'
                ? 'bg-blue-600 text-white ring-2 ring-blue-400 shadow-md shadow-blue-950'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
            Composite ₹1000
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveBrush('amalgam');
              sound.playTapSound();
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition ${
              activeBrush === 'amalgam'
                ? 'bg-amber-600 text-white ring-2 ring-amber-400 shadow-md shadow-amber-950'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            GIC / Amalgam ₹800
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveBrush('sealant');
              sound.playTapSound();
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition ${
              activeBrush === 'sealant'
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-md shadow-emerald-950'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            Sealant ₹600
          </button>
        </div>
      </div>

      {/* ODONTOGRAM DENTAL GRID */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[760px] flex flex-col gap-4">
          {/* MAXILLARY ARCH (UPPER JAW) */}
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2 px-3">
              <span>Quadrant 1 (Patient Right / Doctor Left)</span>
              <span className="text-cyan-400 font-black">MAXILLARY ARCH (UPPER)</span>
              <span>Quadrant 2 (Patient Left / Doctor Right)</span>
            </div>

            <div className="flex items-center justify-between gap-1">
              {/* Q1 / Q5 */}
              <div className="flex items-center gap-1 flex-1 justify-end">
                {(!isPediatric ? PERMANENT_Q1 : PRIMARY_Q5).map((tNo) => (
                  <ToothSvg
                    key={tNo}
                    toothNo={tNo}
                    isPediatric={isPediatric}
                    state={dentalState[tNo]}
                    isSelected={selectedTooth === tNo}
                    onSelectTooth={setSelectedTooth}
                    onSurfaceClick={handleSurfaceClick}
                  />
                ))}
              </div>

              {/* Midline Divider */}
              <div className="w-1.5 self-stretch bg-cyan-500/40 rounded-full mx-1.5 shadow-sm shadow-cyan-500" />

              {/* Q2 / Q6 */}
              <div className="flex items-center gap-1 flex-1 justify-start">
                {(!isPediatric ? PERMANENT_Q2 : PRIMARY_Q6).map((tNo) => (
                  <ToothSvg
                    key={tNo}
                    toothNo={tNo}
                    isPediatric={isPediatric}
                    state={dentalState[tNo]}
                    isSelected={selectedTooth === tNo}
                    onSelectTooth={setSelectedTooth}
                    onSurfaceClick={handleSurfaceClick}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* MANDIBULAR ARCH (LOWER JAW) */}
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between gap-1">
              {/* Q4 / Q8 */}
              <div className="flex items-center gap-1 flex-1 justify-end">
                {(!isPediatric ? PERMANENT_Q4 : PRIMARY_Q8).map((tNo) => (
                  <ToothSvg
                    key={tNo}
                    toothNo={tNo}
                    isPediatric={isPediatric}
                    state={dentalState[tNo]}
                    isSelected={selectedTooth === tNo}
                    onSelectTooth={setSelectedTooth}
                    onSurfaceClick={handleSurfaceClick}
                  />
                ))}
              </div>

              {/* Midline Divider */}
              <div className="w-1.5 self-stretch bg-cyan-500/40 rounded-full mx-1.5 shadow-sm shadow-cyan-500" />

              {/* Q3 / Q7 */}
              <div className="flex items-center gap-1 flex-1 justify-start">
                {(!isPediatric ? PERMANENT_Q3 : PRIMARY_Q7).map((tNo) => (
                  <ToothSvg
                    key={tNo}
                    toothNo={tNo}
                    isPediatric={isPediatric}
                    state={dentalState[tNo]}
                    isSelected={selectedTooth === tNo}
                    onSelectTooth={setSelectedTooth}
                    onSurfaceClick={handleSurfaceClick}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-widest text-slate-400 mt-2 px-3">
              <span>Quadrant 4 (Patient Right / Doctor Left)</span>
              <span className="text-cyan-400 font-black">MANDIBULAR ARCH (LOWER)</span>
              <span>Quadrant 3 (Patient Left / Doctor Right)</span>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK TOOTH ACTION BAR (When a tooth is selected) */}
      {selectedTooth && (
        <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-cyan-800/60 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-cyan-500 text-slate-950 font-black font-mono flex items-center justify-center text-base">
                {selectedTooth}
              </span>
              <div>
                <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                  Tooth #{selectedTooth} Quick Charting
                  <span className="text-xs font-normal text-slate-400">
                    (Auto-adds fee to patient bill)
                  </span>
                </h4>
                <p className="text-xs text-slate-400">
                  Click any of the 5 surfaces directly on the tooth diagram or apply whole-tooth conditions below:
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleClearTooth(selectedTooth)}
              className="text-xs font-bold text-slate-400 hover:text-red-400 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-red-900/50 bg-slate-900"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Tooth
            </button>
          </div>

          {/* Whole-Tooth Condition Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {/* 1. RCT */}
            <button
              type="button"
              onClick={() => handleWholeCondition(selectedTooth, 'rct')}
              className={`p-2.5 rounded-xl text-xs font-extrabold flex flex-col items-center justify-center gap-1 transition ${
                activeToothState?.wholeCondition === 'rct'
                  ? 'bg-red-600 text-white ring-2 ring-red-400 shadow-lg shadow-red-950'
                  : 'bg-slate-900 text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span className="text-sm">⚡ RCT (Canal)</span>
              <span className="text-[11px] opacity-90 font-mono">₹ 3,500</span>
            </button>

            {/* 2. Crown / Cap */}
            <button
              type="button"
              onClick={() => handleWholeCondition(selectedTooth, 'crown')}
              className={`p-2.5 rounded-xl text-xs font-extrabold flex flex-col items-center justify-center gap-1 transition ${
                activeToothState?.wholeCondition === 'crown'
                  ? 'bg-amber-600 text-white ring-2 ring-amber-300 shadow-lg shadow-amber-950'
                  : 'bg-slate-900 text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span className="text-sm">👑 Crown / Cap</span>
              <span className="text-[11px] opacity-90 font-mono">₹ 4,000</span>
            </button>

            {/* 3. Extraction / Missing */}
            <button
              type="button"
              onClick={() => handleWholeCondition(selectedTooth, 'missing')}
              className={`p-2.5 rounded-xl text-xs font-extrabold flex flex-col items-center justify-center gap-1 transition ${
                activeToothState?.wholeCondition === 'missing'
                  ? 'bg-rose-700 text-white ring-2 ring-rose-400 shadow-lg shadow-rose-950'
                  : 'bg-slate-900 text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span className="text-sm">❌ Extraction (X)</span>
              <span className="text-[11px] opacity-90 font-mono">₹ 500</span>
            </button>

            {/* 4. Dental Implant */}
            <button
              type="button"
              onClick={() => handleWholeCondition(selectedTooth, 'implant')}
              className={`p-2.5 rounded-xl text-xs font-extrabold flex flex-col items-center justify-center gap-1 transition ${
                activeToothState?.wholeCondition === 'implant'
                  ? 'bg-cyan-600 text-white ring-2 ring-cyan-300 shadow-lg shadow-cyan-950'
                  : 'bg-slate-900 text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span className="text-sm">🔩 Implant</span>
              <span className="text-[11px] opacity-90 font-mono">₹ 25,000</span>
            </button>

            {/* 5. Bridge */}
            <button
              type="button"
              onClick={() => handleWholeCondition(selectedTooth, 'bridge')}
              className={`p-2.5 rounded-xl text-xs font-extrabold flex flex-col items-center justify-center gap-1 transition ${
                activeToothState?.wholeCondition === 'bridge'
                  ? 'bg-teal-600 text-white ring-2 ring-teal-300 shadow-lg shadow-teal-950'
                  : 'bg-slate-900 text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span className="text-sm">🌉 Bridge Pontic</span>
              <span className="text-[11px] opacity-90 font-mono">₹ 3,500</span>
            </button>

            {/* 6. Clean / Healthy */}
            <button
              type="button"
              onClick={() => handleWholeCondition(selectedTooth, 'healthy')}
              className="p-2.5 rounded-xl text-xs font-extrabold flex flex-col items-center justify-center gap-1 bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
            >
              <span className="text-sm">✨ Healthy / Reset</span>
              <span className="text-[11px] opacity-70">Normal</span>
            </button>
          </div>
        </div>
      )}

      {/* Legend Footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
        <span className="font-bold text-slate-300">Legend:</span>
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            Caries (Red)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            Composite (Blue)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            GIC / Amalgam (Amber)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Sealant (Green)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-red-400 font-bold">X</span>
            Extracted
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-red-400 font-bold">|||</span>
            RCT
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-amber-400 font-bold">👑</span>
            Crown
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-cyan-400 font-bold">🔩</span>
            Implant
          </span>
        </div>
      </div>
    </div>
  );
};
