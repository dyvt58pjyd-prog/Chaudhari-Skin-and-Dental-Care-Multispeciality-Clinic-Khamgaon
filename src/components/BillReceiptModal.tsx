import React from 'react';
import { Patient } from '../types/clinic';
import { CLINIC_INFO } from '../services/clinicData';
import { Printer, MessageCircle, X, CheckCircle, ShieldCheck } from 'lucide-react';

interface BillReceiptModalProps {
  patient: Patient;
  onClose: () => void;
}

export const BillReceiptModal: React.FC<BillReceiptModalProps> = ({ patient, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const generateWhatsAppMessage = () => {
    const itemsList = patient.billingItems
      .map((item, idx) => `${idx + 1}. ${item.description} - ₹${item.amount}`)
      .join('%0A');

    const rxSummary = patient.rxItems && patient.rxItems.length > 0
      ? `%0A--------------------------------%0A` +
        `*PRESCRIBED MEDICINES (Rx):*%0A` +
        patient.rxItems.map((rx, idx) => `${idx + 1}. *${rx.medicine}* (${rx.dosage})%0A   Dosage: ${rx.timing} [${rx.days} Days]${rx.instructions ? '%0A   Advice: ' + rx.instructions : ''}`).join('%0A') +
        `%0A`
      : '';

    const followUpSummary = patient.followUpDate
      ? `--------------------------------%0A` +
        `*NEXT SCHEDULED FOLLOW-UP:*%0A` +
        `Date: *${patient.followUpDate}*%0A` +
        `Plan: ${patient.followUpNotes || 'Clinical Review'}%0A`
      : '';

    const msg = `*${CLINIC_INFO.name}*%0A${CLINIC_INFO.tagline}%0A${CLINIC_INFO.address}%0A%0A` +
      `*PATIENT RECEIPT*%0A` +
      `Date: ${new Date().toLocaleDateString('en-IN')}%0A` +
      `Patient Name: *${patient.name}*%0A` +
      `Phone: ${patient.phone}%0A` +
      `Token No: #${patient.tokenNumber}%0A` +
      `--------------------------------%0A` +
      `*SERVICES / PROCEDURES:*%0A` +
      `${itemsList || 'Consultation & Clinic Services - ₹' + patient.totalAmount}%0A` +
      `${rxSummary}` +
      `--------------------------------%0A` +
      `*TOTAL AMOUNT PAID: ₹${patient.totalAmount}*%0A` +
      `Payment Mode: ${patient.paymentStatus?.toUpperCase() || 'PAID'}%0A` +
      `Payment Ref: ${patient.paymentRef || 'CH-PAID'}%0A` +
      `${followUpSummary}%0A` +
      `Thank you for trusting Chaudhari Skin & Dental Care!%0A%0A` +
      `⭐ *Please share your valuable review with us on Google:*%0A` +
      `${CLINIC_INFO.googleReviewUrl}`;

    return `https://wa.me/91${patient.phone}?text=${msg}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60 rounded-t-3xl">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
            <h3 className="text-lg font-extrabold text-white">Tax Receipt & Bill Summary</h3>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Paper */}
        <div className="p-6 bg-white text-slate-900 m-4 rounded-2xl shadow-inner font-sans printable-area">
          {/* Clinic Header */}
          <div className="text-center pb-4 border-b-2 border-slate-900">
            <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">
              {CLINIC_INFO.name}
            </h2>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {CLINIC_INFO.subtitle}
            </p>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              {CLINIC_INFO.address}
            </p>
            <p className="text-[11px] text-slate-500">
              {CLINIC_INFO.district} | Ph: {CLINIC_INFO.phone}
            </p>
          </div>

          {/* Receipt Info Bar */}
          <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-400 text-xs">
            <div>
              <p><span className="font-bold text-slate-600">Bill No:</span> CH-{patient.tokenNumber}-{Date.now().toString().slice(-4)}</p>
              <p><span className="font-bold text-slate-600">Patient:</span> <strong className="text-slate-900 text-sm">{patient.name}</strong> {patient.age ? `(${patient.age} Yrs / ${patient.gender || 'M'})` : ''}</p>
              <p><span className="font-bold text-slate-600">City / Area:</span> {patient.city || 'Khamgaon'}</p>
              <p><span className="font-bold text-slate-600">Mobile:</span> {patient.phone}</p>
            </div>
            <div className="text-right">
              <p><span className="font-bold text-slate-600">Date:</span> {new Date().toLocaleDateString('en-IN')}</p>
              <p><span className="font-bold text-slate-600">Time:</span> {patient.completedTime || patient.billedTime || 'Today'}</p>
              <p><span className="font-bold text-slate-600">Token:</span> #{patient.tokenNumber}</p>
              <p><span className="font-bold text-slate-600">Dept:</span> {patient.doctorId === 'skin' ? 'Skin & Cosmetology' : 'Dental Surgery'}</p>
            </div>
          </div>

          {/* Itemized Procedures / Charges */}
          <div className="py-4 border-b border-slate-300">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-400 text-slate-700 font-bold">
                  <th className="text-left py-1.5">#</th>
                  <th className="text-left py-1.5">Service / Procedure</th>
                  <th className="text-right py-1.5">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patient.billingItems.length > 0 ? (
                  patient.billingItems.map((item, idx) => (
                    <tr key={item.id} className="py-1">
                      <td className="py-1.5 text-slate-500">{idx + 1}</td>
                      <td className="py-1.5 font-semibold text-slate-800">
                        {item.description}
                      </td>
                      <td className="py-1.5 text-right font-mono font-bold text-slate-900">
                        ₹ {item.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-2 text-slate-500">1</td>
                    <td className="py-2 font-semibold text-slate-800">Doctor Consultation & Clinic Checkup</td>
                    <td className="py-2 text-right font-mono font-bold text-slate-900">₹ {patient.totalAmount}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Prescribed Medicines (Rx) on Receipt */}
          {patient.rxItems && patient.rxItems.length > 0 && (
            <div className="py-3 border-b border-slate-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase text-slate-800 tracking-wider">
                  Prescribed Medicines (Rx)
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">
                  {patient.rxItems.length} items prescribed
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-800">
                {patient.rxItems.map((rx, i) => (
                  <div key={i} className="flex items-start justify-between gap-2 border-b border-dashed border-slate-200 pb-1">
                    <div>
                      <div className="font-bold text-slate-900">
                        {i + 1}. {rx.medicine}
                      </div>
                      <div className="text-[10px] text-slate-600">
                        {rx.dosage} • {rx.timing} • {rx.days} Days
                      </div>
                      {rx.instructions && (
                        <div className="text-[10px] text-slate-500 italic">
                          Advice: {rx.instructions}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-[10px] font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 flex-shrink-0">
                      {rx.timingCode || (rx.morning || rx.afternoon || rx.night ? `${rx.morning ? 1 : 0}-${rx.afternoon ? 1 : 0}-${rx.night ? 1 : 0}` : 'Rx')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total & Payment Badge */}
          <div className="pt-3 flex justify-between items-center">
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-black text-xs uppercase border border-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                PAID via {patient.paymentStatus?.toUpperCase() || 'CASH'}
              </span>
              <p className="text-[10px] text-slate-500 mt-1">Ref: {patient.paymentRef}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-bold block">NET AMOUNT PAID</span>
              <span className="text-2xl font-black text-slate-950 font-mono">
                ₹ {patient.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Follow-up Section on Printed Bill */}
          {patient.followUpDate && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">
                  Next Scheduled Follow-up (पुढील तपासणी भेट):
                </span>
                <span className="text-sm font-black text-emerald-950">
                  📅 {patient.followUpDate}
                  {patient.followUpNotes ? ` — ${patient.followUpNotes}` : ''}
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 border border-emerald-300">
                Appointment Confirmed
              </span>
            </div>
          )}

          {/* Signatures */}
          <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-end text-[11px] text-slate-500">
            <div>
              <p>Generated by Chaudhari Clinic HMS</p>
              <p className="text-[10px] text-slate-400">Computer generated receipt</p>
            </div>
            <div className="text-center">
              <div className="w-32 border-b border-slate-800 mb-1"></div>
              <p className="font-bold text-slate-800">Authorized Signature</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-5 border-t border-slate-800 flex flex-col sm:flex-row gap-3 bg-slate-950/80 rounded-b-3xl">
          <button
            onClick={handlePrint}
            className="flex-1 touch-btn bg-slate-800 hover:bg-slate-700 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 text-base shadow-lg transition active:scale-95"
          >
            <Printer className="w-5 h-5 text-cyan-400" />
            🖨️ PRINT BILL
          </button>

          <a
            href={generateWhatsAppMessage()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 touch-btn bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 text-base shadow-lg shadow-emerald-950/50 transition active:scale-95 text-center"
          >
            <MessageCircle className="w-5 h-5" />
            📲 SEND WHATSAPP + REVIEW LINK
          </a>
        </div>
      </div>
    </div>
  );
};
