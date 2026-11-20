import React, { useState } from 'react';
import { getSavedFirebaseConfig, saveFirebaseConfig, isFirebaseConfigured } from '../services/firebase';
import { Cloud, CheckCircle, X, ShieldAlert, Radio } from 'lucide-react';
import { sound } from '../services/sound';

interface FirebaseModalProps {
  onClose: () => void;
}

export const FirebaseModal: React.FC<FirebaseModalProps> = ({ onClose }) => {
  const currentConfig = getSavedFirebaseConfig();
  const [configText, setConfigText] = useState(
    currentConfig ? JSON.stringify(currentConfig, null, 2) : ''
  );
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleSave = () => {
    sound.playTapSound();
    try {
      if (!configText.trim()) {
        saveFirebaseConfig(null);
        setStatusMsg('Firebase credentials removed. Using local real-time sync.');
        return;
      }
      const parsed = JSON.parse(configText);
      saveFirebaseConfig(parsed);
      setStatusMsg('Firebase credentials saved successfully! Firestore real-time sync active.');
    } catch {
      setStatusMsg('Error: Please enter a valid JSON config.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-6 h-6 text-cyan-400" />
            <h3 className="text-lg font-extrabold text-white">Real-Time Sync Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-800/60 flex items-start gap-3">
            <Radio className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5 animate-pulse" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-cyan-200">
                Instant Multi-Device Sync Active!
              </p>
              <p className="text-slate-300">
                The app automatically synchronizes patient queues, cabin FREE/BUSY states, bills, and dental charts across all tabs and windows with zero delay.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Firebase Project Configuration (Optional for Cloud Android / Cellular Sync):
            </label>
            <textarea
              rows={6}
              value={configText}
              onChange={(e) => setConfigText(e.target.value)}
              placeholder={`{\n  "apiKey": "AIzaSy...",\n  "projectId": "chaudhari-clinic",\n  "messagingSenderId": "...",\n  "appId": "..."\n}`}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {statusMsg && (
            <p className="text-xs font-bold text-emerald-400 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-800">
              {statusMsg}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
            <span>Current Cloud Status:</span>
            <span
              className={`font-bold px-2.5 py-1 rounded-full ${
                isFirebaseConfigured()
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {isFirebaseConfigured() ? 'Cloud Firestore Connected' : 'Local Fast Bus (Active)'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold shadow-md shadow-cyan-900/50"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
