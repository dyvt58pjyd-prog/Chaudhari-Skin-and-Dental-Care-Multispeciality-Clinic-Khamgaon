import React from 'react';
import { sound } from '../../services/sound';
import { Calendar, Clock, Bell, Check, Sparkles, AlertCircle, FileText } from 'lucide-react';

interface FollowUpSchedulerProps {
  followUpDate: string | undefined;
  followUpNotes: string | undefined;
  onChange: (date: string | undefined, notes: string | undefined) => void;
  department?: 'skin' | 'dental';
}

export const FollowUpScheduler: React.FC<FollowUpSchedulerProps> = ({
  followUpDate,
  followUpNotes,
  onChange,
  department = 'dental',
}) => {
  // Helper to calculate date string for quick days
  const addDaysToToday = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const handleQuickDays = (days: number, defaultNote?: string) => {
    sound.playTapSound();
    const dateStr = addDaysToToday(days);
    onChange(dateStr, followUpNotes || defaultNote || 'Follow-up review & progress assessment');
  };

  const handleQuickReason = (reason: string) => {
    sound.playTapSound();
    onChange(followUpDate || addDaysToToday(7), reason);
  };

  // Pre-configured common clinic procedures for follow-up
  const quickReasons = department === 'skin' ? [
    'Chemical Peel Session #2',
    'PRP Hair / Skin Therapy Session #2',
    'Tinea / Fungal Scraping & Clearance Check',
    'Acne Retinoid Tolerance & Comedone Review',
    'Wart / RF Cautery Wound Check',
    'Laser Skin Session #2',
    'SOS - Only if itching or rash persists',
  ] : [
    'RCT Sitting 2 (Biomechanic Prep & Irrigation)',
    'RCT Final Sitting (Obturation & Core Buildup)',
    'Crown / Cap Impression or Cementation',
    'Post-Extraction Suture Removal & Socket Check',
    'Full Mouth Scaling Review & Gum Polish',
    'Implant Healing & Osseointegration Check',
    'SOS - If throbbing tooth pain persists',
  ];

  // Common patient pre-visit instructions
  const quickInstructions = department === 'skin' ? [
    'Wash scalp with medicated shampoo in the morning before coming',
    'Do not apply any cream or makeup 4 hours before procedure',
    'Strictly avoid direct sunlight and apply SPF 50 sunscreen',
    'Bring all previous prescription slips & blood reports',
  ] : [
    'Do warm saline mouth rinses 3 to 4 times a day',
    'Do not chew hard or sticky food on treated tooth',
    'Bring previous dental X-rays & IOPA radiographs',
    'Take morning dose after light breakfast before coming',
  ];

  const getDayName = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-slate-950 p-4 sm:p-5 rounded-3xl border border-slate-800 space-y-4 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
        <label className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>Next Checkup & Follow-up Scheduler (पुढील तपासणी)</span>
        </label>
        {followUpDate && (
          <button
            type="button"
            onClick={() => {
              sound.playTapSound();
              onChange(undefined, undefined);
            }}
            className="text-[11px] text-red-400 hover:underline font-bold"
          >
            Clear Follow-up
          </button>
        )}
      </div>

      {/* 1. Quick Interval Presets */}
      <div>
        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">
          1-Tap Quick Intervals:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { days: 3, label: '+ 3 Days (Acute Pain / Post-Op)' },
            { days: 7, label: '+ 1 Week (RCT / Suture Removal)' },
            { days: 15, label: '+ 15 Days (Crown / Peel Review)' },
            { days: 30, label: '+ 1 Month (PRP / Maintenance)' },
          ].map((item) => (
            <button
              key={item.days}
              type="button"
              onClick={() => handleQuickDays(item.days)}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500 text-xs font-extrabold text-slate-200 text-left transition select-none"
            >
              <span className="block text-emerald-400 font-mono">+{item.days}d</span>
              <span className="text-[10px] text-slate-400 font-normal truncate block">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Date Picker & Planned Procedure Reason */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="text-[11px] text-slate-300 font-bold block mb-1">
            Exact Follow-up Date (तारीख):
          </label>
          <input
            type="date"
            value={followUpDate || ''}
            onChange={(e) => {
              sound.playTapSound();
              onChange(e.target.value || undefined, followUpNotes);
            }}
            className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none"
          />
          {followUpDate && (
            <span className="text-[11px] font-bold text-emerald-400 mt-1 block">
              📅 {getDayName(followUpDate)}
            </span>
          )}
        </div>

        <div>
          <label className="text-[11px] text-slate-300 font-bold block mb-1">
            Procedure Planned / Clinical Purpose (उपचार हेतू):
          </label>
          <input
            type="text"
            value={followUpNotes || ''}
            onChange={(e) => onChange(followUpDate, e.target.value)}
            placeholder="e.g. RCT Sitting 2, Crown Cementation, Suture Removal..."
            className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          />
        </div>
      </div>

      {/* 3. 1-Tap Procedure Reasons */}
      <div>
        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Click to autofill planned procedure:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {quickReasons.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => handleQuickReason(reason)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 transition"
            >
              {reason}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Pre-visit Instructions */}
      <div>
        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5 flex items-center gap-1">
          <FileText className="w-3 h-3 text-cyan-400" />
          Quick patient advice for next visit:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {quickInstructions.map((inst) => (
            <button
              key={inst}
              type="button"
              onClick={() => {
                sound.playTapSound();
                const current = followUpNotes || '';
                const updated = current ? `${current}; ${inst}` : inst;
                onChange(followUpDate || addDaysToToday(7), updated);
              }}
              className="px-2 py-0.5 rounded text-[10px] bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition"
            >
              + {inst}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Active Follow-up Confirmation Banner */}
      {followUpDate && (
        <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/70 text-xs text-emerald-300 flex items-start gap-2.5 shadow-md">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-black text-white block">
              Follow-up confirmed for {getDayName(followUpDate)}
            </span>
            <span className="text-[11px] text-emerald-200 mt-0.5 block">
              Plan: {followUpNotes || 'Routine Clinical Review'}
            </span>
            <span className="text-[10px] text-emerald-400/80 mt-1 block">
              ✓ This follow-up will be printed automatically on the patient bill and included in their WhatsApp receipt!
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
