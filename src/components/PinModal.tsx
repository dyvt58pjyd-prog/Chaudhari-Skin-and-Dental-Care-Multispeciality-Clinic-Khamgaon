import React, { useState, useEffect } from 'react';
import { DoctorRole } from '../types/clinic';
import { ROLE_LABELS, verifyRolePin } from '../services/auth';
import { sound } from '../services/sound';
import { Lock, Delete, X, ShieldAlert, Check } from 'lucide-react';

interface PinModalProps {
  role: DoctorRole;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({ role, onSuccess, onCancel }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const roleMeta = ROLE_LABELS[role];

  const handleDigit = (digit: string) => {
    sound.playTapSound();
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);

      // Auto-submit on 4th digit
      if (nextPin.length === 4) {
        checkPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    sound.playTapSound();
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    sound.playTapSound();
    setPin('');
    setError(false);
  };

  const checkPin = (enteredPin: string) => {
    if (verifyRolePin(role, enteredPin)) {
      sound.playSuccessSound();
      onSuccess();
    } else {
      sound.playTapSound();
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setPin(''), 600);
    }
  };

  // Support physical keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className={`bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-sm max-h-[95vh] overflow-y-auto shadow-2xl flex flex-col transition-transform ${
          shake ? 'animate-bounce' : ''
        }`}
      >
        {/* Header */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-base">
              {roleMeta.icon}
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white leading-tight">
                {roleMeta.name}
              </h3>
              <p className="text-[11px] text-slate-400">{roleMeta.dept}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pin Prompt & Masked Dots */}
        <div className="p-6 flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mb-3">
            <Lock className="w-6 h-6" />
          </div>

          <h4 className="text-base font-black text-white">Enter Department PIN</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Security PIN required to access this department
          </p>

          {/* 4 Masked Dots */}
          <div className="flex items-center gap-4 my-5">
            {[0, 1, 2, 3].map((idx) => {
              const filled = idx < pin.length;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-150 ${
                    filled
                      ? 'bg-cyan-400 ring-4 ring-cyan-500/30 scale-110'
                      : 'bg-slate-800 border-2 border-slate-700'
                  }`}
                />
              );
            })}
          </div>

          {error && (
            <p className="text-xs font-bold text-red-400 bg-red-950/60 border border-red-900 px-3 py-1.5 rounded-xl mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              Incorrect PIN. Access Denied.
            </p>
          )}

          {/* Touch Number Pad (3x4 Grid) */}
          <div className="grid grid-cols-3 gap-2.5 w-full mt-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleDigit(num)}
                className="touch-btn h-14 bg-slate-950 hover:bg-slate-800 active:bg-cyan-950 border border-slate-800 hover:border-slate-700 rounded-2xl text-xl font-bold font-mono text-white transition active:scale-95 shadow-sm"
              >
                {num}
              </button>
            ))}

            {/* Clear */}
            <button
              type="button"
              onClick={handleClear}
              className="touch-btn h-14 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-2xl text-xs font-bold transition active:scale-95"
            >
              Clear
            </button>

            {/* Zero */}
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="touch-btn h-14 bg-slate-950 hover:bg-slate-800 active:bg-cyan-950 border border-slate-800 hover:border-slate-700 rounded-2xl text-xl font-bold font-mono text-white transition active:scale-95 shadow-sm"
            >
              0
            </button>

            {/* Backspace */}
            <button
              type="button"
              onClick={handleBackspace}
              className="touch-btn h-14 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-2xl flex items-center justify-center transition active:scale-95"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Security notice */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 w-full text-center">
            <span className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" />
              Confidential Authorized Access Only
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
