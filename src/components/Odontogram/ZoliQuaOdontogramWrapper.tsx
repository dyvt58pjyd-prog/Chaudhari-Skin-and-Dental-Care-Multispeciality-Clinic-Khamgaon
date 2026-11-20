import React from 'react';
import { OdontogramShell } from 'react-advanced-odontogram';
import 'react-advanced-odontogram/style.css';

interface ZoliQuaOdontogramWrapperProps {
  onBackToQuickBilling?: () => void;
}

export const ZoliQuaOdontogramWrapper: React.FC<ZoliQuaOdontogramWrapperProps> = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-extrabold text-cyan-400 flex items-center gap-2">
            <span>🔬</span> Official ZoliQua Advanced Odontogram & Perio Chart
          </h3>
          <p className="text-xs text-slate-400">
            Full anatomical SVG templates, ICDAS caries severity, periodontal pocket probing, and HL7 FHIR export.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 bg-cyan-950 border border-cyan-800 text-cyan-300 rounded-lg font-mono">
            FDI Standard
          </span>
          <span className="text-xs px-2.5 py-1 bg-emerald-950 border border-emerald-800 text-emerald-300 rounded-lg font-bold">
            Dark Slate Active
          </span>
        </div>
      </div>

      {/* Embedded OdontogramShell container */}
      <div className="min-h-[620px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
        <OdontogramShell
          language="en"
          numberingSystem="FDI"
          darkMode={true}
          enableNotes={true}
          enableIcdas={true}
        />
      </div>
    </div>
  );
};
