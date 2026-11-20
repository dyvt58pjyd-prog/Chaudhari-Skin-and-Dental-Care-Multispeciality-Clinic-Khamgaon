import React, { useState } from 'react';
import { CLINIC_INFO, CLINIC_SERVICES_CATALOG } from '../services/clinicData';
import {
  Building2,
  MapPin,
  Clock,
  Phone,
  Star,
  ExternalLink,
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  Share2,
  Image as ImageIcon
} from 'lucide-react';

interface ClinicInfoModalProps {
  onClose: () => void;
}

export const ClinicInfoModal: React.FC<ClinicInfoModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'photos' | 'services' | 'reviews'>('overview');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white leading-tight">
                {CLINIC_INFO.name}
              </h3>
              <p className="text-xs text-cyan-400 font-medium">
                {CLINIC_INFO.tagline}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 text-xs font-bold px-4 pt-2 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-t-xl transition ${
              activeTab === 'overview'
                ? 'bg-slate-900 text-cyan-400 border-t-2 border-cyan-400 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview & Timings
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`px-4 py-2.5 rounded-t-xl transition flex items-center gap-1.5 ${
              activeTab === 'photos'
                ? 'bg-slate-900 text-cyan-400 border-t-2 border-cyan-400 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Clinic Photos ({CLINIC_INFO.photos.length})
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2.5 rounded-t-xl transition ${
              activeTab === 'services'
                ? 'bg-slate-900 text-cyan-400 border-t-2 border-cyan-400 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Full Rate Catalog
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2.5 rounded-t-xl transition flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'bg-slate-900 text-cyan-400 border-t-2 border-cyan-400 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            Reviews (5.0 ★)
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Address card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider block">
                      Exact Clinic Address:
                    </span>
                    <p className="text-sm font-bold text-white mt-0.5">
                      {CLINIC_INFO.address}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Landmark: <strong className="text-slate-300">{CLINIC_INFO.landmark}</strong> • Buldhana District
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-2">
                  <a
                    href={CLINIC_INFO.googleReviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-300 text-xs font-bold hover:bg-cyan-900 transition"
                  >
                    <span>Google Maps & Reviews</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={CLINIC_INFO.justdialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950 border border-amber-800 text-amber-300 text-xs font-bold hover:bg-amber-900 transition"
                  >
                    <span>Justdial Verified Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Timings */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-start gap-2.5">
                  <Clock className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider block">
                      Clinic Operational Hours:
                    </span>
                    <p className="text-xs font-semibold text-slate-200 mt-1">
                      {CLINIC_INFO.timings.weekdays}
                    </p>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">
                      {CLINIC_INFO.timings.sunday}
                    </p>
                  </div>
                </div>
              </div>

              {/* Doctors in attendance */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider block">
                  Doctors in Daily Attendance:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="font-bold text-cyan-300 block">Dr. Chaudhari (Dermatology)</span>
                    <span className="text-slate-400 text-[11px]">Skin, Hair, Acne, Laser & Chemical Peels</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="font-bold text-cyan-300 block">Dr. Chaudhari (Dental Surgery)</span>
                    <span className="text-slate-400 text-[11px]">BDS, Senior Dental Surgeon • Endodontics, Implants</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PHOTOS */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Official photos of Chaudhari Skin And Dental Care Multispeciality Clinic from verified Justdial directory listing:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {CLINIC_INFO.photos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="group bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-lg"
                  >
                    <div className="relative aspect-video bg-slate-900 overflow-hidden">
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur-sm text-[10px] font-bold text-cyan-300 border border-slate-800">
                        {photo.type}
                      </span>
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-bold text-white truncate">{photo.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SERVICES & RATES */}
          {activeTab === 'services' && (
            <div className="space-y-5">
              {/* Dental */}
              <div>
                <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>🦷</span> Dental Care Procedures & Standard Rates
                </h4>
                <div className="divide-y divide-slate-800 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                  {CLINIC_SERVICES_CATALOG.dental.map((srv, i) => (
                    <div key={i} className="p-3 flex items-center justify-between gap-2 text-xs">
                      <div>
                        <div className="font-bold text-white">{srv.name}</div>
                        <div className="text-[11px] text-slate-400">{srv.desc}</div>
                      </div>
                      <span className="font-mono font-bold text-emerald-400 text-sm flex-shrink-0">
                        ₹ {srv.price.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skin */}
              <div>
                <h4 className="text-xs font-black text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>🩺</span> Skin & Hair Procedures & Standard Rates
                </h4>
                <div className="divide-y divide-slate-800 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                  {CLINIC_SERVICES_CATALOG.skin.map((srv, i) => (
                    <div key={i} className="p-3 flex items-center justify-between gap-2 text-xs">
                      <div>
                        <div className="font-bold text-white">{srv.name}</div>
                        <div className="text-[11px] text-slate-400">{srv.desc}</div>
                      </div>
                      <span className="font-mono font-bold text-purple-300 text-sm flex-shrink-0">
                        ₹ {srv.price.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {/* Aggregate Score Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 to-slate-950 border border-amber-500/40 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black text-amber-400 font-mono">5.0</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 font-semibold mt-1">
                    Based on verified patient reviews on Google & Justdial
                  </p>
                </div>

                <a
                  href={CLINIC_INFO.googleReviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg transition flex items-center gap-1.5"
                >
                  <span>Leave Review</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Reviews List */}
              <div className="space-y-3">
                {CLINIC_INFO.reviews.map((rev, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{rev.author}</span>
                      <div className="flex">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed italic">
                      &quot;{rev.comment}&quot;
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Khamgaon, Maharashtra • PIN 444303</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
