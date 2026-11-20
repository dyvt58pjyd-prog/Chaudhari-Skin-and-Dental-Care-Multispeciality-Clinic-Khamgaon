import React from 'react';
import { Patient } from '../types/clinic';
import { CLINIC_INFO } from '../services/clinicData';
import { QrCode, X, Check, Smartphone } from 'lucide-react';

interface UPIModalProps {
  patient: Patient;
  onConfirmPayment: () => void;
  onClose: () => void;
}

export const UPIModal: React.FC<UPIModalProps> = ({ patient, onConfirmPayment, onClose }) => {
  // UPI payment intent link
  const upiIntent = `upi://pay?pa=${CLINIC_INFO.upiId}&pn=Chaudhari%20Clinic&am=${patient.totalAmount}&cu=INR&tn=Token%20${patient.tokenNumber}`;
  // QR image url fallback
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(upiIntent)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-cyan-800/80 rounded-3xl w-full max-w-md max-h-[95vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-extrabold text-white">UPI / Scanner Payment</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Body */}
        <div className="p-6 flex flex-col items-center text-center">
          <p className="text-sm font-semibold text-slate-300 mb-1">
            Scan with GPay, PhonePe, Paytm, or BHIM
          </p>
          <div className="text-3xl font-black font-mono text-cyan-400 mb-4 tracking-tight">
            ₹ {patient.totalAmount.toLocaleString('en-IN')}
          </div>

          {/* QR Code Container */}
          <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-cyan-500/30 flex items-center justify-center">
            <img
              src={qrUrl}
              alt="UPI QR Code"
              className="w-56 h-56 object-contain rounded-lg"
              loading="eager"
            />
          </div>

          <div className="mt-4 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400">Clinic UPI ID: </span>
            <span className="font-mono font-bold text-cyan-300">{CLINIC_INFO.upiId}</span>
          </div>

          <p className="text-xs text-slate-400 mt-2">
            Patient: <strong className="text-white">{patient.name}</strong> (Token #{patient.tokenNumber})
          </p>
        </div>

        {/* Footer Confirmation */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex gap-3">
          <button
            type="button"
            onClick={onConfirmPayment}
            className="w-full touch-btn bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 text-base shadow-lg shadow-emerald-950/60 active:scale-95 transition"
          >
            <Check className="w-6 h-6" />
            CONFIRM ₹{patient.totalAmount} RECEIVED VIA UPI
          </button>
        </div>
      </div>
    </div>
  );
};
