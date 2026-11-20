import React, { useState, useRef, useEffect } from 'react';
import { PrescriptionItem } from '../../types/clinic';
import { MEDICINE_DATABASE, searchMedicines, MedicineItem } from '../../services/medicineDatabase';
import { sound } from '../../services/sound';
import {
  Pill,
  Search,
  Plus,
  Trash2,
  Check,
  Sun,
  Sunset,
  Moon,
  Clock,
  Sparkles,
  Info,
  ChevronDown,
  X,
  FileText
} from 'lucide-react';

interface PrescriptionBuilderProps {
  rxList: PrescriptionItem[];
  onChange: (items: PrescriptionItem[]) => void;
  department: 'skin' | 'dental';
  templates?: Record<string, { label: string; items: PrescriptionItem[] }>;
}

export const PrescriptionBuilder: React.FC<PrescriptionBuilderProps> = ({
  rxList,
  onChange,
  department,
  templates,
}) => {
  // Autocomplete search states
  const [query, setQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineItem | null>(null);

  // Dosage configurator states
  const [medicineName, setMedicineName] = useState('');
  const [medicineType, setMedicineType] = useState<PrescriptionItem['type']>('tablet');
  const [dosage, setDosage] = useState('1 Tablet');
  const [morning, setMorning] = useState(true);
  const [afternoon, setAfternoon] = useState(false);
  const [night, setNight] = useState(true);
  const [foodRelation, setFoodRelation] = useState<PrescriptionItem['foodRelation']>('after_food');
  const [days, setDays] = useState(5);
  const [instructions, setInstructions] = useState('Take after food with water');
  const [timingCode, setTimingCode] = useState('1-0-1');

  // Filter & Search suggestions
  const searchResults = searchMedicines(query, department);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update timingCode when morning/afternoon/night changes
  const updateDosageIndicators = (m: boolean, a: boolean, n: boolean) => {
    setMorning(m);
    setAfternoon(a);
    setNight(n);
    const code = `${m ? '1' : '0'}-${a ? '1' : '0'}-${n ? '1' : '0'}`;
    setTimingCode(code);
  };

  // Quick preset frequency handlers
  const handlePresetCode = (code: string) => {
    sound.playTapSound();
    setTimingCode(code);
    if (code === '1-0-1') {
      setMorning(true);
      setAfternoon(false);
      setNight(true);
    } else if (code === '1-1-1') {
      setMorning(true);
      setAfternoon(true);
      setNight(true);
    } else if (code === '1-0-0') {
      setMorning(true);
      setAfternoon(false);
      setNight(false);
    } else if (code === '0-0-1') {
      setMorning(false);
      setAfternoon(false);
      setNight(true);
    } else if (code === '0-1-0') {
      setMorning(false);
      setAfternoon(true);
      setNight(false);
    } else if (code === 'SOS') {
      setMorning(false);
      setAfternoon(false);
      setNight(false);
    }
  };

  // Select item from catalog
  const handleSelectMedicine = (med: MedicineItem) => {
    sound.playTapSound();
    setSelectedMedicine(med);
    setMedicineName(med.name);
    setMedicineType(med.type);
    setDosage(med.defaultDosage);
    setMorning(med.morning);
    setAfternoon(med.afternoon);
    setNight(med.night);
    setTimingCode(med.timingCode);
    setFoodRelation(med.foodRelation);
    setDays(med.defaultDays);
    setInstructions(med.instructions);
    setQuery(med.name);
    setIsDropdownOpen(false);
  };

  // Select custom medicine typed by doctor
  const handleCustomMedicine = (customName: string) => {
    sound.playTapSound();
    setSelectedMedicine(null);
    setMedicineName(customName.trim());
    setQuery(customName.trim());
    setIsDropdownOpen(false);

    // Auto-guess type from name if possible
    const lower = customName.toLowerCase();
    if (lower.includes('shampoo')) {
      setMedicineType('shampoo');
      setDosage('5-10 ml');
      setFoodRelation('topical');
      setTimingCode('Twice Weekly');
      setMorning(false);
      setAfternoon(false);
      setNight(false);
      setInstructions('Apply on wet scalp, leave for 5 mins before rinsing');
    } else if (lower.includes('cream') || lower.includes('ointment')) {
      setMedicineType('cream');
      setDosage('Apply thin layer');
      setFoodRelation('topical');
      setInstructions('Apply on affected areas twice daily');
    } else if (lower.includes('gel')) {
      setMedicineType('gel');
      setDosage('Apply thin layer');
      setFoodRelation('topical');
    } else if (lower.includes('mouthwash') || lower.includes('rinse')) {
      setMedicineType('mouthwash');
      setDosage('10 ml');
      setFoodRelation('topical');
      setInstructions('Rinse vigorously for 60 seconds, do not rinse with water for 30 mins');
    } else if (lower.includes('syp') || lower.includes('syrup')) {
      setMedicineType('syrup');
      setDosage('5 ml');
      setFoodRelation('after_food');
    } else if (lower.includes('cap')) {
      setMedicineType('capsule');
      setDosage('1 Capsule');
    } else {
      setMedicineType('tablet');
      setDosage('1 Tablet');
    }
  };

  // Add constructed item to Rx list
  const handleAddMedicine = () => {
    const finalName = medicineName.trim() || query.trim();
    if (!finalName) return;

    sound.playTapSound();

    // Human readable timing text
    let foodText = '';
    if (foodRelation === 'after_food') foodText = 'After Food';
    else if (foodRelation === 'before_food') foodText = 'Before Food (Empty Stomach)';
    else if (foodRelation === 'with_food') foodText = 'With Food / Milk';
    else if (foodRelation === 'topical') foodText = 'External Apply (Topical)';
    else if (foodRelation === 'as_needed') foodText = 'When Needed (SOS)';

    const timingSummary = `${timingCode} ${foodText}`.trim();

    const newItem: PrescriptionItem = {
      id: `rx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      medicine: finalName,
      type: medicineType,
      dosage: dosage.trim() || 'As directed',
      morning,
      afternoon,
      night,
      timing: timingSummary,
      timingCode,
      foodRelation,
      days: Number(days) || 5,
      instructions: instructions.trim(),
      category: department,
    };

    onChange([...rxList, newItem]);

    // Reset input fields for next medicine
    setQuery('');
    setMedicineName('');
    setSelectedMedicine(null);
    setInstructions('Take after food with water');
    updateDosageIndicators(true, false, true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Apply template
  const applyTemplate = (templateKey: string) => {
    if (!templates || !templates[templateKey]) return;
    sound.playTapSound();
    const tpl = templates[templateKey];
    onChange([...rxList, ...tpl.items]);
  };

  // Helper for type icons
  const getTypeBadge = (type?: string) => {
    switch (type) {
      case 'shampoo':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-teal-900/60 text-teal-300 border border-teal-700/50">🧴 SHAMPOO</span>;
      case 'cream':
      case 'ointment':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-purple-900/60 text-purple-300 border border-purple-700/50">🧴 CREAM</span>;
      case 'gel':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-cyan-900/60 text-cyan-300 border border-cyan-700/50">🧪 GEL</span>;
      case 'mouthwash':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-900/60 text-blue-300 border border-blue-700/50">💧 MOUTHWASH</span>;
      case 'toothpaste':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">🪥 PASTE</span>;
      case 'syrup':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-900/60 text-amber-300 border border-amber-700/50">🍯 SYRUP</span>;
      case 'capsule':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">💊 CAPSULE</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-800 text-slate-300 border border-slate-700">💊 TABLET</span>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-extrabold text-white flex items-center gap-2">
              Advanced Clinical Prescription (Rx)
            </h4>
            <p className="text-xs text-slate-400">
              Instant medicine & shampoo search, M-A-N dosage controls, & custom formulations
            </p>
          </div>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-800 text-cyan-300 font-bold">
          {rxList.length} Prescribed
        </span>
      </div>

      {/* Quick 1-Tap Templates If Provided */}
      {templates && Object.keys(templates).length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              1-Tap Common Protocols:
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(templates).map(([key, tpl]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyTemplate(key)}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-cyan-950/50 border border-slate-800 hover:border-cyan-500/60 text-left transition group"
              >
                <div className="text-xs font-extrabold text-white group-hover:text-cyan-300 truncate">
                  {tpl.label}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  +{tpl.items.length} medicines
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Medicine Search & Autocomplete Box */}
      <div className="relative" ref={dropdownRef}>
        <label className="text-xs font-black uppercase tracking-wider text-slate-300 block mb-1.5 flex items-center justify-between">
          <span>Search or Type Medicine Name / Shampoo / Cream:</span>
          <span className="text-[10px] text-cyan-400 font-normal">
            Database contains 150+ Khamgaon clinic medicines
          </span>
        </label>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4 text-cyan-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setMedicineName(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (searchResults.length > 0 && query.trim()) {
                  handleSelectMedicine(searchResults[0]);
                } else if (query.trim()) {
                  handleCustomMedicine(query);
                }
              }
            }}
            placeholder="Type e.g. Scalpe, Augmentin, Zerodol, Lulifin, Minoxidil, Kenacort..."
            className="w-full bg-slate-950 border-2 border-slate-700 focus:border-cyan-500 rounded-2xl pl-10 pr-10 py-3 text-sm font-bold text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setMedicineName('');
                setIsDropdownOpen(false);
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {isDropdownOpen && (
          <div className="absolute z-50 left-0 right-0 mt-2 max-h-72 overflow-y-auto bg-slate-950 border-2 border-cyan-500/80 rounded-2xl shadow-2xl divide-y divide-slate-800">
            {/* Custom Medicine Option when query is typed */}
            {query.trim() && (
              <button
                type="button"
                onClick={() => handleCustomMedicine(query)}
                className="w-full p-3.5 text-left bg-cyan-950/40 hover:bg-cyan-900/50 flex items-center justify-between text-cyan-300 transition"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span className="text-xs font-black">
                    Use custom medicine: &ldquo;<strong className="text-white underline">{query}</strong>&rdquo;
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Custom Entry
                </span>
              </button>
            )}

            {searchResults.length > 0 ? (
              searchResults.map((med) => (
                <button
                  key={med.id}
                  type="button"
                  onClick={() => handleSelectMedicine(med)}
                  className="w-full p-3 text-left hover:bg-slate-900 flex items-start justify-between gap-3 transition group"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-black text-white group-hover:text-cyan-300 flex items-center gap-2">
                      <span>{med.name}</span>
                      {med.brand && (
                        <span className="text-[10px] font-normal text-slate-400">
                          ({med.brand})
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {med.generic}
                    </div>
                    <div className="text-[10px] text-cyan-400/90 font-mono">
                      Std: {med.defaultDosage} • {med.timingCode} • {med.defaultDays} days
                    </div>
                  </div>
                  <div className="flex-shrink-0 pt-0.5">
                    {getTypeBadge(med.type)}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                No exact match found in catalog. Click &ldquo;Use custom medicine&rdquo; above to prescribe any medicine or cream.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Medicine Info Banner */}
      {medicineName && (
        <div className="p-3 rounded-2xl bg-slate-950 border border-cyan-500/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
              Rx
            </div>
            <div>
              <div className="text-xs font-black text-white flex items-center gap-2">
                {medicineName}
                {getTypeBadge(medicineType)}
              </div>
              <div className="text-[11px] text-slate-400">
                Configure dosage schedule below before adding to prescription:
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setMedicineName('');
              setQuery('');
              setSelectedMedicine(null);
            }}
            className="text-xs text-slate-400 hover:text-red-400 px-2 py-1"
          >
            Clear
          </button>
        </div>
      )}

      {/* DOSAGE CONFIGURATOR CARD (Morning / Afternoon / Night Indicators) */}
      <div className="bg-slate-950 rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-4">
        {/* Row 1: Dosage Form & Strength Text */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">
              Dosage Form (औषध प्रकार):
            </label>
            <select
              value={medicineType}
              onChange={(e) => setMedicineType(e.target.value as PrescriptionItem['type'])}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="tablet">💊 Tablet (गोळी)</option>
              <option value="capsule">💊 Capsule (कॅप्सूल)</option>
              <option value="syrup">🍯 Syrup / Suspension (सिरप)</option>
              <option value="shampoo">🧴 Shampoo (केसांचा शाम्पू)</option>
              <option value="cream">🧴 Cream / Ointment (क्रीम / मलम)</option>
              <option value="gel">🧪 Gel (जेल)</option>
              <option value="lotion">🧴 Lotion / Solution (लोशन)</option>
              <option value="mouthwash">💧 Mouthwash / Gargle (माउथवॉश)</option>
              <option value="toothpaste">🪥 Toothpaste / Dental Paste (पेस्ट)</option>
              <option value="drops">💧 Drops (थेंब)</option>
              <option value="soap">🧼 Medicated Soap (साबण)</option>
              <option value="powder">🍚 Dusting Powder (पावडर)</option>
              <option value="spray">💨 Spray (स्प्रे)</option>
              <option value="other">📋 Other (इतर)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">
              Dose Quantity / Amount:
            </label>
            <input
              type="text"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="e.g. 1 Tablet, 5 ml, Apply thin layer, 10 ml rinse"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Row 2: MORNING - AFTERNOON - NIGHT INDICATORS (The required boxes) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              Dosage Timing Indicators (सकाळ - दुपार - रात्र):
            </label>
            <span className="text-xs font-mono font-black px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-800">
              Badge: [{timingCode}]
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Morning Box */}
            <button
              type="button"
              onClick={() => updateDosageIndicators(!morning, afternoon, night)}
              className={`p-3.5 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition select-none ${
                morning
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-950/40'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1">
                <Sun className={`w-4 h-4 ${morning ? 'text-amber-400 animate-spin-slow' : 'text-slate-500'}`} />
                <span className="text-xs font-black">MORNING</span>
              </div>
              <span className="text-[11px] font-bold">सकाळ</span>
              <span className={`text-sm font-black font-mono px-2 py-0.5 rounded ${
                morning ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                {morning ? '1' : '0'}
              </span>
            </button>

            {/* Afternoon Box */}
            <button
              type="button"
              onClick={() => updateDosageIndicators(morning, !afternoon, night)}
              className={`p-3.5 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition select-none ${
                afternoon
                  ? 'bg-orange-500/20 border-orange-500 text-orange-300 shadow-lg shadow-orange-950/40'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1">
                <Sunset className={`w-4 h-4 ${afternoon ? 'text-orange-400' : 'text-slate-500'}`} />
                <span className="text-xs font-black">AFTERNOON</span>
              </div>
              <span className="text-[11px] font-bold">दुपार</span>
              <span className={`text-sm font-black font-mono px-2 py-0.5 rounded ${
                afternoon ? 'bg-orange-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                {afternoon ? '1' : '0'}
              </span>
            </button>

            {/* Night Box */}
            <button
              type="button"
              onClick={() => updateDosageIndicators(morning, afternoon, !night)}
              className={`p-3.5 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition select-none ${
                night
                  ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-950/40'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1">
                <Moon className={`w-4 h-4 ${night ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span className="text-xs font-black">NIGHT</span>
              </div>
              <span className="text-[11px] font-bold">रात्र</span>
              <span className={`text-sm font-black font-mono px-2 py-0.5 rounded ${
                night ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {night ? '1' : '0'}
              </span>
            </button>
          </div>

          {/* Quick Frequency Code Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Quick Presets:</span>
            {[
              { label: '1-0-1 (Two times)', code: '1-0-1' },
              { label: '1-1-1 (Three times)', code: '1-1-1' },
              { label: '1-0-0 (Morning)', code: '1-0-0' },
              { label: '0-0-1 (Night / HS)', code: '0-0-1' },
              { label: '0-1-0 (Afternoon)', code: '0-1-0' },
              { label: 'SOS (When needed)', code: 'SOS' },
              { label: 'Twice a week (Shampoo)', code: 'Twice Weekly' },
            ].map((p) => (
              <button
                key={p.code}
                type="button"
                onClick={() => handlePresetCode(p.code)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                  timingCode === p.code
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Food Relation & Duration Days */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Meal Relation */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1.5">
              Meal Relation (जेवणाशी संबंध):
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { key: 'after_food', label: '🍽️ After Food (जेवणानंतर)' },
                { key: 'before_food', label: '🥣 Before Food (उपाशी पोटी)' },
                { key: 'with_food', label: '🥛 With Milk / Food' },
                { key: 'topical', label: '🧴 External Apply (लावणे)' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    sound.playTapSound();
                    setFoodRelation(item.key as PrescriptionItem['foodRelation']);
                  }}
                  className={`p-2 rounded-xl text-[11px] font-bold border text-left transition ${
                    foodRelation === item.key
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-extrabold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration Days */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1.5">
              Duration in Days (दिवस):
            </label>
            <div className="flex items-center gap-1.5 mb-2">
              {[3, 5, 7, 10, 15, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    sound.playTapSound();
                    setDays(d);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
                    days === d
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400">Custom days:</span>
              <input
                type="number"
                min="1"
                max="180"
                value={days}
                onChange={(e) => setDays(Number(e.target.value) || 1)}
                className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-white text-center focus:outline-none focus:border-cyan-500"
              />
              <span className="text-xs text-slate-400 font-bold">days total</span>
            </div>
          </div>
        </div>

        {/* Row 4: Doctor Instructions & Advice */}
        <div>
          <label className="text-[11px] font-bold text-slate-400 block mb-1">
            Doctor Instructions / Remarks for Patient:
          </label>
          <input
            type="text"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g. Leave lather for 5 mins before rinse; Avoid direct sun; Take with lukewarm water"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Big Add Button */}
        <button
          type="button"
          onClick={handleAddMedicine}
          disabled={!medicineName.trim() && !query.trim()}
          className="w-full touch-btn py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 disabled:pointer-events-none text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-cyan-950/60 active:scale-98 transition"
        >
          <Plus className="w-5 h-5" />
          <span>+ ADD MEDICINE TO PRESCRIPTION</span>
        </button>
      </div>

      {/* ACTIVE PRESCRIBED MEDICINES LIST */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-cyan-400" />
            Current Prescribed Medicines ({rxList.length}):
          </span>
          {rxList.length > 0 && (
            <button
              type="button"
              onClick={() => {
                sound.playTapSound();
                onChange([]);
              }}
              className="text-xs text-red-400 hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {rxList.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-950 border border-dashed border-slate-800 text-center">
            <Pill className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-bold">No medicines prescribed yet</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Search any medicine, shampoo, or cream above, or click a 1-tap protocol to auto-fill.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {rxList.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs flex items-start justify-between gap-3 shadow-md"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-white text-sm">
                      {idx + 1}. {item.medicine}
                    </span>
                    {getTypeBadge(item.type)}
                  </div>

                  {/* Timing & M-A-N Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Visual M-A-N badge */}
                    <div className="inline-flex items-center divide-x divide-slate-800 bg-slate-900 rounded-lg border border-slate-700/80 text-[10px] font-mono font-bold overflow-hidden">
                      <span className={`px-1.5 py-0.5 ${item.morning ? 'bg-amber-500/20 text-amber-300 font-black' : 'text-slate-500'}`}>
                        ☀️ {item.morning ? '1' : '0'}
                      </span>
                      <span className={`px-1.5 py-0.5 ${item.afternoon ? 'bg-orange-500/20 text-orange-300 font-black' : 'text-slate-500'}`}>
                        🌤️ {item.afternoon ? '1' : '0'}
                      </span>
                      <span className={`px-1.5 py-0.5 ${item.night ? 'bg-indigo-500/20 text-indigo-300 font-black' : 'text-slate-500'}`}>
                        🌙 {item.night ? '1' : '0'}
                      </span>
                    </div>

                    <span className="text-[11px] font-bold text-cyan-300">
                      {item.dosage}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-[11px] font-semibold text-slate-300">
                      {item.timing}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-[11px] font-mono font-black text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      {item.days} Days
                    </span>
                  </div>

                  {item.instructions && (
                    <p className="text-[11px] text-slate-400 italic">
                      Advice: {item.instructions}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sound.playTapSound();
                    onChange(rxList.filter((_, i) => i !== idx));
                  }}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-900 transition flex-shrink-0"
                  title="Remove medicine"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
