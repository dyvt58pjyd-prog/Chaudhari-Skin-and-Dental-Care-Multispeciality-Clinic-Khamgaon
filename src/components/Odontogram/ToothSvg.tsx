import React from 'react';
import { ToothState, ToothSurface, SurfaceCondition, ToothWholeCondition } from '../../types/clinic';

interface ToothSvgProps {
  toothNo: number;
  isPediatric?: boolean;
  state?: ToothState;
  isSelected?: boolean;
  onSelectTooth?: (toothNo: number) => void;
  onSurfaceClick?: (toothNo: number, surface: ToothSurface) => void;
}

// Color coding mapping for surfaces
const SURFACE_COLORS: Record<SurfaceCondition, string> = {
  healthy: '#1e293b',    // Slate 800 (clean tooth)
  caries: '#ef4444',     // Red 500 (decay)
  composite: '#3b82f6',  // Blue 500 (composite filling)
  amalgam: '#f59e0b',    // Amber / Silver 500 (amalgam / GIC)
  sealant: '#10b981',    // Emerald 500 (sealant)
};

export const ToothSvg: React.FC<ToothSvgProps> = ({
  toothNo,
  state,
  isSelected = false,
  onSelectTooth,
  onSurfaceClick,
}) => {
  const toothState: ToothState = state || {
    toothNo,
    wholeCondition: 'healthy',
    surfaces: {
      buccal: 'healthy',
      lingual: 'healthy',
      mesial: 'healthy',
      distal: 'healthy',
      occlusal: 'healthy',
    },
  };

  const isUpper = toothNo < 30 || (toothNo >= 50 && toothNo < 70);
  const toothDigit = toothNo % 10;
  const isMolar = toothDigit >= 6;
  const isPremolar = toothDigit === 4 || toothDigit === 5;
  const isAnterior = toothDigit <= 3;

  const wholeCond = toothState.wholeCondition;

  // Has any finding
  const hasFinding =
    wholeCond !== 'healthy' ||
    Object.values(toothState.surfaces).some((v) => v !== 'healthy');

  return (
    <div
      className={`relative flex flex-col items-center p-1.5 rounded-xl transition-all cursor-pointer select-none ${
        isSelected
          ? 'bg-cyan-950/60 ring-2 ring-cyan-400 shadow-lg shadow-cyan-950/50'
          : hasFinding
          ? 'bg-slate-800/90 ring-1 ring-amber-400/50'
          : 'bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800'
      }`}
      onClick={() => onSelectTooth?.(toothNo)}
    >
      {/* FDI Tooth Number */}
      <div className="flex items-center justify-between w-full px-1 mb-1">
        <span
          className={`text-xs font-black font-mono tracking-tight ${
            isSelected
              ? 'text-cyan-300'
              : hasFinding
              ? 'text-amber-300'
              : 'text-slate-400'
          }`}
        >
          {toothNo}
        </span>
        {wholeCond !== 'healthy' && (
          <span className="text-[10px] font-bold uppercase px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {wholeCond}
          </span>
        )}
      </div>

      {/* Anatomical Crown + Root Graphic */}
      <div className="w-12 h-16 relative flex items-center justify-center">
        <svg
          viewBox="0 0 48 64"
          className="w-full h-full overflow-visible transition-transform duration-200"
          style={{ transform: isUpper ? 'none' : 'rotate(180deg)' }}
        >
          <defs>
            {/* Crown Metallic Gradient */}
            <linearGradient id={`goldGrad-${toothNo}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            {/* Implant Titanium Gradient */}
            <linearGradient id={`titaniumGrad-${toothNo}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="50%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
          </defs>

          {/* 1. ROOT PATHS */}
          {wholeCond === 'implant' ? (
            /* Titanium Implant Screw graphic replacing the root */
            <g className="implant-screw">
              {/* Implant collar */}
              <rect x="18" y="2" width="12" height="6" rx="1" fill={`url(#titaniumGrad-${toothNo})`} stroke="#334155" strokeWidth="1" />
              {/* Threaded cylinder */}
              <path
                d="M19 8 L29 8 L28 32 L20 32 Z"
                fill={`url(#titaniumGrad-${toothNo})`}
                stroke="#334155"
                strokeWidth="1"
              />
              {/* Screw thread ridges */}
              <line x1="18" y1="12" x2="30" y2="12" stroke="#1e293b" strokeWidth="1.5" />
              <line x1="19" y1="16" x2="29" y2="16" stroke="#1e293b" strokeWidth="1.5" />
              <line x1="20" y1="20" x2="28" y2="20" stroke="#1e293b" strokeWidth="1.5" />
              <line x1="21" y1="24" x2="27" y2="24" stroke="#1e293b" strokeWidth="1.5" />
              <line x1="22" y1="28" x2="26" y2="28" stroke="#1e293b" strokeWidth="1.5" />
              <circle cx="24" cy="33" r="2" fill="#64748b" />
            </g>
          ) : isMolar ? (
            /* Multi-rooted Molar (2 or 3 roots) */
            <g>
              <path
                d="M14 34 C12 20 8 10 11 4 C14 8 18 18 20 34"
                fill={wholeCond === 'missing' ? 'none' : '#334155'}
                stroke={wholeCond === 'missing' ? '#475569' : '#64748b'}
                strokeWidth="1.5"
                strokeDasharray={wholeCond === 'missing' ? '2 2' : undefined}
              />
              <path
                d="M28 34 C30 18 34 8 37 4 C40 10 36 20 34 34"
                fill={wholeCond === 'missing' ? 'none' : '#334155'}
                stroke={wholeCond === 'missing' ? '#475569' : '#64748b'}
                strokeWidth="1.5"
                strokeDasharray={wholeCond === 'missing' ? '2 2' : undefined}
              />
              <path
                d="M20 34 C21 22 23 12 24 6 C25 12 27 22 28 34"
                fill={wholeCond === 'missing' ? 'none' : '#1e293b'}
                stroke={wholeCond === 'missing' ? '#475569' : '#64748b'}
                strokeWidth="1"
              />
              {/* RCT Gutta-Percha vertical red lines */}
              {wholeCond === 'rct' && (
                <g>
                  <path d="M12 7 C14 16 16 26 17 33" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                  <path d="M24 8 C24 16 24 26 24 33" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
                  <path d="M36 7 C34 16 32 26 31 33" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                </g>
              )}
            </g>
          ) : isPremolar ? (
            /* Bifid / Single Premolar root */
            <g>
              <path
                d="M16 34 C16 18 20 6 24 4 C28 6 32 18 32 34 Z"
                fill={wholeCond === 'missing' ? 'none' : '#334155'}
                stroke={wholeCond === 'missing' ? '#475569' : '#64748b'}
                strokeWidth="1.5"
                strokeDasharray={wholeCond === 'missing' ? '2 2' : undefined}
              />
              {wholeCond === 'rct' && (
                <path d="M24 6 L24 33" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
              )}
            </g>
          ) : (
            /* Anterior Single Tapered Root */
            <g>
              <path
                d="M17 34 C18 16 21 5 24 3 C27 5 30 16 31 34 Z"
                fill={wholeCond === 'missing' ? 'none' : '#334155'}
                stroke={wholeCond === 'missing' ? '#475569' : '#64748b'}
                strokeWidth="1.5"
                strokeDasharray={wholeCond === 'missing' ? '2 2' : undefined}
              />
              {wholeCond === 'rct' && (
                <path d="M24 5 L24 33" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
              )}
            </g>
          )}

          {/* 2. CROWN ANATOMICAL BODY */}
          <path
            d="M12 34 C10 42 12 58 17 61 C20 62 28 62 31 61 C36 58 38 42 36 34 C32 35 16 35 12 34 Z"
            fill={
              wholeCond === 'crown'
                ? `url(#goldGrad-${toothNo})`
                : wholeCond === 'missing'
                ? 'none'
                : '#1e293b'
            }
            stroke={
              wholeCond === 'crown'
                ? '#f59e0b'
                : wholeCond === 'missing'
                ? '#475569'
                : isSelected
                ? '#38bdf8'
                : '#64748b'
            }
            strokeWidth={wholeCond === 'crown' ? '2' : '1.5'}
            strokeDasharray={wholeCond === 'missing' ? '2 2' : undefined}
          />

          {/* Crown porcelain shine lines */}
          {wholeCond === 'crown' && (
            <g>
              <path d="M15 40 C14 48 16 54 18 57" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
              <circle cx="28" cy="42" r="1.5" fill="#ffffff" opacity="0.9" />
            </g>
          )}

          {/* Bridge pontic horizontal bar indicator */}
          {wholeCond === 'bridge' && (
            <rect x="2" y="38" width="44" height="6" rx="2" fill="#06b6d4" stroke="#0891b2" strokeWidth="1.5" opacity="0.9" />
          )}

          {/* Missing / Extracted "X" OVERLAY */}
          {wholeCond === 'missing' && (
            <g className="missing-x">
              <line x1="8" y1="10" x2="40" y2="58" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="40" y1="10" x2="8" y2="58" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
            </g>
          )}
        </svg>
      </div>

      {/* 3. INTERACTIVE 5-SURFACE OCCLUSAL DIAGRAM */}
      <div
        className="w-10 h-10 mt-1 relative flex items-center justify-center"
        title={`Tooth ${toothNo} 5-Surface Occlusal Chart`}
        onClick={(e) => e.stopPropagation()}
      >
        <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow">
          {/* Top: Buccal / Labial */}
          <polygon
            points="4,4 36,4 27,13 13,13"
            fill={SURFACE_COLORS[toothState.surfaces.buccal]}
            stroke="#475569"
            strokeWidth="1"
            className="hover:opacity-80 transition cursor-pointer"
            onClick={() => onSurfaceClick?.(toothNo, 'buccal')}
          >
            <title>Buccal (Top)</title>
          </polygon>

          {/* Bottom: Lingual / Palatal */}
          <polygon
            points="13,27 27,27 36,36 4,36"
            fill={SURFACE_COLORS[toothState.surfaces.lingual]}
            stroke="#475569"
            strokeWidth="1"
            className="hover:opacity-80 transition cursor-pointer"
            onClick={() => onSurfaceClick?.(toothNo, 'lingual')}
          >
            <title>Lingual (Bottom)</title>
          </polygon>

          {/* Left: Mesial / Distal */}
          <polygon
            points="4,4 13,13 13,27 4,36"
            fill={SURFACE_COLORS[toothState.surfaces.mesial]}
            stroke="#475569"
            strokeWidth="1"
            className="hover:opacity-80 transition cursor-pointer"
            onClick={() => onSurfaceClick?.(toothNo, 'mesial')}
          >
            <title>Mesial (Left)</title>
          </polygon>

          {/* Right: Distal / Mesial */}
          <polygon
            points="27,13 36,4 36,36 27,27"
            fill={SURFACE_COLORS[toothState.surfaces.distal]}
            stroke="#475569"
            strokeWidth="1"
            className="hover:opacity-80 transition cursor-pointer"
            onClick={() => onSurfaceClick?.(toothNo, 'distal')}
          >
            <title>Distal (Right)</title>
          </polygon>

          {/* Center: Occlusal / Incisal */}
          <rect
            x="13"
            y="13"
            width="14"
            height="14"
            fill={SURFACE_COLORS[toothState.surfaces.occlusal]}
            stroke="#64748b"
            strokeWidth="1"
            className="hover:opacity-80 transition cursor-pointer"
            onClick={() => onSurfaceClick?.(toothNo, 'occlusal')}
          >
            <title>Occlusal (Center)</title>
          </rect>
        </svg>
      </div>
    </div>
  );
};
