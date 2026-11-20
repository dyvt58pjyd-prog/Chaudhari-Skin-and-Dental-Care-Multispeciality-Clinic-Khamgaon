import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, Firestore } from 'firebase/firestore';
import { ClinicState } from '../types/clinic';
import { INITIAL_CLINIC_STATE } from './clinicData';

const FIREBASE_CONFIG_KEY = 'chaudhari_clinic_firebase_config';
const LOCAL_STATE_KEY = 'chaudhari_clinic_state_v1';
const SYNC_CHANNEL_NAME = 'chaudhari_clinic_realtime_bus';

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;
let broadcastChannel: BroadcastChannel | null = null;

// Initialize BroadcastChannel if in browser
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel not supported:', e);
  }
}

export function getSavedFirebaseConfig() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(FIREBASE_CONFIG_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveFirebaseConfig(config: Record<string, string> | null) {
  if (typeof window === 'undefined') return;
  if (!config) {
    localStorage.removeItem(FIREBASE_CONFIG_KEY);
    firebaseApp = null;
    firestoreDb = null;
  } else {
    localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
    initFirebase(config);
  }
}

export function initFirebase(config?: Record<string, string>): boolean {
  try {
    const cfg = config || getSavedFirebaseConfig();
    if (!cfg || !cfg.apiKey || !cfg.projectId) {
      return false;
    }
    if (getApps().length === 0) {
      firebaseApp = initializeApp(cfg);
    } else {
      firebaseApp = getApps()[0];
    }
    firestoreDb = getFirestore(firebaseApp);
    return true;
  } catch (err) {
    console.error('Failed to init Firebase:', err);
    return false;
  }
}

// Try auto-init on module load
initFirebase();

export function isFirebaseConfigured(): boolean {
  return firestoreDb !== null;
}

export function loadInitialState(): ClinicState {
  if (typeof window === 'undefined') return INITIAL_CLINIC_STATE;
  const cached = localStorage.getItem(LOCAL_STATE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (
        parsed &&
        parsed.cabins &&
        parsed.cabins.skin &&
        parsed.cabins.dental1 &&
        parsed.cabins.dental2 &&
        Array.isArray(parsed.patients)
      ) {
        return {
          ...INITIAL_CLINIC_STATE,
          ...parsed,
          cabins: {
            ...INITIAL_CLINIC_STATE.cabins,
            ...parsed.cabins,
          },
          returningDirectory: {
            ...INITIAL_CLINIC_STATE.returningDirectory,
            ...(parsed.returningDirectory || {}),
          },
        };
      }
    } catch {
      // ignore
    }
  }
  return INITIAL_CLINIC_STATE;
}

export function persistStateLocally(state: ClinicState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to persist locally:', e);
  }
}

export function syncStateOutward(state: ClinicState) {
  persistStateLocally(state);

  // 1. Broadcast across browser tabs / windows instantly
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'STATE_UPDATE', state });
    } catch (e) {
      console.warn('Broadcast error:', e);
    }
  }

  // 2. Push to Firestore if configured
  if (firestoreDb) {
    try {
      const clinicRef = doc(firestoreDb, 'clinics', 'chaudhari_khamgaon');
      setDoc(clinicRef, state, { merge: true }).catch((err) => {
        console.warn('Firestore setDoc error:', err);
      });
    } catch (e) {
      console.warn('Firestore push error:', e);
    }
  }
}

export function listenToRealtimeSync(onUpdate: (state: ClinicState) => void): () => void {
  const unsubscribers: (() => void)[] = [];

  // Listen to local BroadcastChannel (cross-tab / multi-window instant sync)
  if (broadcastChannel) {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'STATE_UPDATE' && event.data.state) {
        onUpdate(event.data.state);
      }
    };
    broadcastChannel.addEventListener('message', handleMessage);
    unsubscribers.push(() => {
      broadcastChannel?.removeEventListener('message', handleMessage);
    });
  }

  // Listen to window storage events for fallback across tabs
  if (typeof window !== 'undefined') {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === LOCAL_STATE_KEY && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          onUpdate(parsed);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    unsubscribers.push(() => window.removeEventListener('storage', handleStorage));
  }

  // Listen to Firestore real-time onSnapshot
  if (firestoreDb) {
    try {
      const clinicRef = doc(firestoreDb, 'clinics', 'chaudhari_khamgaon');
      const unsubFirestore = onSnapshot(
        clinicRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as ClinicState;
            persistStateLocally(data);
            onUpdate(data);
          }
        },
        (err) => {
          console.warn('Firestore snapshot error:', err);
        }
      );
      unsubscribers.push(unsubFirestore);
    } catch (e) {
      console.warn('Firestore subscription error:', e);
    }
  }

  return () => {
    unsubscribers.forEach((fn) => fn());
  };
}
