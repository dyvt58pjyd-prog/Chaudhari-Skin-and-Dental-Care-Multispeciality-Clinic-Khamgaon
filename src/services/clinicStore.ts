import { useState, useEffect, useCallback } from 'react';
import { ClinicState, Patient, BillingItem, PrescriptionItem, ToothState, DoctorRole, ClinicalMedia, VisitRecord } from '../types/clinic';
import { INITIAL_CLINIC_STATE } from './clinicData';
import { loadInitialState, syncStateOutward, listenToRealtimeSync, isFirebaseConfigured } from './firebase';
import { sound } from './sound';

// Global memory state for instantaneous access across components
let globalState: ClinicState = loadInitialState();
const listeners = new Set<(state: ClinicState) => void>();

function notifyAll() {
  listeners.forEach((listener) => listener(globalState));
  syncStateOutward(globalState);
}

// Subscribe to real-time sync updates from Firestore / BroadcastChannel
listenToRealtimeSync((incomingState) => {
  if (incomingState && incomingState.lastUpdated) {
    if (incomingState.lastUpdated !== globalState.lastUpdated) {
      const prevBilledCount = globalState.patients.filter((p) => p.status === 'billed').length;
      const newBilledCount = incomingState.patients.filter((p) => p.status === 'billed').length;
      if (newBilledCount > prevBilledCount) {
        sound.playCashChime();
      }

      globalState = incomingState;
      listeners.forEach((l) => l(globalState));
    }
  }
});

export function useClinicStore() {
  const [state, setState] = useState<ClinicState>(globalState);

  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  // 1. Add new or returning patient to line (Name, Age, City, Mobile, Doctor)
  const addPatient = useCallback((
    phone: string,
    name: string,
    age: string | number,
    city: string,
    doctorId: 'skin' | 'dental1' | 'dental2',
    gender?: string
  ) => {
    sound.playTapSound();
    const tokenNumber = (globalState.patients.length > 0
      ? Math.max(...globalState.patients.map((p) => p.tokenNumber || 0))
      : 0) + 1;

    // Check if patient with this phone exists in past records to link past visits
    const matchingPatients = globalState.patients.filter((p) => p.phone === phone.trim());
    let allPastVisits: VisitRecord[] = [];
    matchingPatients.forEach((p) => {
      if (p.pastVisits && p.pastVisits.length > 0) {
        allPastVisits.push(...p.pastVisits);
      }
      if ((p.status === 'completed' || p.status === 'billed') && p.totalAmount > 0) {
        const alreadyExists = allPastVisits.some((v) => v.id === `visit-${p.id}` || (v.date === p.date && v.time === p.arrivalTime));
        if (!alreadyExists) {
          allPastVisits.push({
            id: `visit-${p.id}`,
            visitNumber: 1,
            date: p.date || new Date().toISOString().split('T')[0],
            time: p.completedTime || p.billedTime || p.arrivalTime,
            doctorId: p.doctorId,
            doctorTitle: p.doctorId === 'skin' ? 'Dr. Rajanikant Chaudhari (Skin Doctor)' : p.doctorId === 'dental1' ? 'Dr. Shrutika Tulaskar (Dental Doctor)' : 'Dr. Priyanka Chaudhari (Dental Doctor)',
            age: p.age,
            city: p.city,
            diagnosis: p.diagnosis,
            doctorNotes: p.doctorNotes,
            photos: p.photos || [],
            rxItems: p.rxItems || [],
            billingItems: p.billingItems || [],
            totalAmount: p.totalAmount,
            paymentStatus: p.paymentStatus,
            paymentRef: p.paymentRef,
            followUpDate: p.followUpDate,
            followUpNotes: p.followUpNotes,
            dentalState: p.dentalState,
          });
        }
      }
    });

    // Deduplicate and sort descending (LATEST FIRST)
    const uniquePastVisits = Array.from(new Map(allPastVisits.map((v) => [v.id, v])).values()).sort((a, b) => {
      return new Date(`${b.date}T${b.time || '00:00'}`).getTime() - new Date(`${a.date}T${a.time || '00:00'}`).getTime();
    });

    const currentDate = new Date().toISOString().split('T')[0];

    const newPatient: Patient = {
      id: `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tokenNumber,
      date: currentDate,
      name: name.trim() || `Patient #${tokenNumber}`,
      age: age ? String(age).trim() : undefined,
      city: city ? String(city).trim() : 'Khamgaon',
      gender: gender || 'Male',
      phone: phone.trim(),
      doctorId,
      status: 'waiting',
      arrivalTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      billingItems: [],
      totalAmount: 0,
      rxItems: [],
      photos: [],
      pastVisits: uniquePastVisits,
    };

    const updatedDirectory = { ...globalState.returningDirectory };
    if (phone.length === 10) {
      updatedDirectory[phone] = newPatient.name;
    }

    globalState = {
      ...globalState,
      patients: [...globalState.patients, newPatient],
      returningDirectory: updatedDirectory,
      lastUpdated: new Date().toISOString(),
    };
    notifyAll();
    return newPatient;
  }, []);

  // 2. Send Next Patient Inside a Cabin (Turns cabin RED BUSY)
  const sendNextPatientToCabin = useCallback((cabinId: 'skin' | 'dental1' | 'dental2') => {
    sound.playCabinChime();

    // Find next waiting patient for this cabin
    const nextPatient = globalState.patients.find(
      (p) => p.doctorId === cabinId && p.status === 'waiting'
    );
    if (!nextPatient) return null;

    const enteredTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updatedPatients = globalState.patients.map((p) => {
      if (p.id === nextPatient.id) {
        return {
          ...p,
          status: 'in_cabin' as const,
          cabinEnteredTime: enteredTime,
        };
      }
      return p;
    });

    const updatedCabin = {
      ...globalState.cabins[cabinId],
      status: 'busy' as const,
      currentPatientId: nextPatient.id,
      currentPatientName: nextPatient.name,
      currentPatientToken: nextPatient.tokenNumber,
      enteredTime,
    };

    globalState = {
      ...globalState,
      cabins: {
        ...globalState.cabins,
        [cabinId]: updatedCabin,
      },
      patients: updatedPatients,
      lastUpdated: new Date().toISOString(),
    };
    notifyAll();
    return nextPatient;
  }, []);

  // 3. Update current draft billing/rx/photos while patient is in cabin
  const updatePatientDraft = useCallback((
    patientId: string,
    billingItems: BillingItem[],
    rxItems: PrescriptionItem[],
    doctorNotes?: string,
    photos?: ClinicalMedia[],
    followUpDate?: string,
    followUpNotes?: string,
    diagnosis?: string,
    dentalState?: Record<number, ToothState>
  ) => {
    const totalAmount = billingItems.reduce((acc, item) => acc + item.amount, 0);

    const updatedPatients = globalState.patients.map((p) => {
      if (p.id === patientId) {
        return {
          ...p,
          billingItems,
          totalAmount,
          rxItems,
          doctorNotes: doctorNotes !== undefined ? doctorNotes : p.doctorNotes,
          photos: photos !== undefined ? photos : (p.photos || []),
          followUpDate: followUpDate !== undefined ? followUpDate : p.followUpDate,
          followUpNotes: followUpNotes !== undefined ? followUpNotes : p.followUpNotes,
          diagnosis: diagnosis !== undefined ? diagnosis : p.diagnosis,
          dentalState: dentalState !== undefined ? dentalState : p.dentalState,
        };
      }
      return p;
    });

    globalState = {
      ...globalState,
      patients: updatedPatients,
      lastUpdated: new Date().toISOString(),
    };
    notifyAll();
  }, []);

  // 4. Finish Doctor Consultation & Send Bill to Reception (Cabin turns GREEN FREE)
  const finishDoctorConsultation = useCallback((
    cabinId: 'skin' | 'dental1' | 'dental2',
    billingItems: BillingItem[],
    rxItems: PrescriptionItem[],
    doctorNotes?: string,
    photos: ClinicalMedia[] = [],
    followUpDate?: string,
    followUpNotes?: string,
    diagnosis?: string,
    dentalState?: Record<number, ToothState>
  ) => {
    sound.playCashChime();

    const cabin = globalState.cabins[cabinId];
    const patientId = cabin.currentPatientId;
    if (!patientId) return;

    const currentPatient = globalState.patients.find((p) => p.id === patientId);
    if (!currentPatient) return;

    const billedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentDate = new Date().toISOString().split('T')[0];
    const totalAmount = billingItems.reduce((acc, item) => acc + item.amount, 0);

    // Create a permanently preserved VisitRecord
    const newVisitRecord: VisitRecord = {
      id: `visit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: currentDate,
      time: billedTime,
      doctorId: cabinId,
      doctorTitle: cabin.doctorTitle,
      diagnosis,
      doctorNotes,
      photos: [...photos],
      rxItems: [...rxItems],
      billingItems: [...billingItems],
      totalAmount,
      followUpDate,
      followUpNotes,
      dentalState,
    };

    const updatedPastVisits = [...(currentPatient.pastVisits || []), newVisitRecord];

    const updatedPatients = globalState.patients.map((p) => {
      if (p.id === patientId) {
        return {
          ...p,
          status: 'billed' as const,
          billingItems,
          totalAmount,
          rxItems,
          doctorNotes,
          photos,
          followUpDate,
          followUpNotes,
          diagnosis,
          dentalState,
          billedTime,
          pastVisits: updatedPastVisits,
        };
      }
      return p;
    });

    const updatedCabin = {
      ...globalState.cabins[cabinId],
      status: 'free' as const,
      currentPatientId: null,
      currentPatientName: null,
      currentPatientToken: null,
      enteredTime: null,
    };

    globalState = {
      ...globalState,
      cabins: {
        ...globalState.cabins,
        [cabinId]: updatedCabin,
      },
      patients: updatedPatients,
      lastUpdated: new Date().toISOString(),
    };
    notifyAll();
  }, []);

  // 5. Reception collects bill payment (CASH or UPI)
  const markBillPaid = useCallback((
    patientId: string,
    paymentMethod: 'cash' | 'upi',
    paymentRef?: string
  ) => {
    sound.playSuccessSound();

    const completedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updatedPatients = globalState.patients.map((p) => {
      if (p.id === patientId) {
        return {
          ...p,
          status: 'completed' as const,
          paymentStatus: paymentMethod,
          paymentRef: paymentRef || (paymentMethod === 'cash' ? 'CASH-COUNTER' : `UPI-${Date.now().toString().slice(-6)}`),
          paidAt: completedTime,
          completedTime,
        };
      }
      return p;
    });

    globalState = {
      ...globalState,
      patients: updatedPatients,
      lastUpdated: new Date().toISOString(),
    };
    notifyAll();
  }, []);

  // 6. Reset to realistic Demo State
  const resetDemoData = useCallback(() => {
    sound.playTapSound();
    globalState = {
      ...INITIAL_CLINIC_STATE,
      lastUpdated: new Date().toISOString(),
    };
    notifyAll();
  }, []);

  // Derived helpers
  const waitingPatients = state.patients.filter((p) => p.status === 'waiting');
  const billedPatients = state.patients.filter((p) => p.status === 'billed');
  const completedPatients = state.patients.filter((p) => p.status === 'completed');
  const followUpPatients = state.patients.filter((p) => Boolean(p.followUpDate));

  const waitingCount = {
    skin: waitingPatients.filter((p) => p.doctorId === 'skin').length,
    dental1: waitingPatients.filter((p) => p.doctorId === 'dental1').length,
    dental2: waitingPatients.filter((p) => p.doctorId === 'dental2').length,
  };

  return {
    state,
    cabins: state.cabins,
    patients: state.patients,
    waitingPatients,
    billedPatients,
    completedPatients,
    followUpPatients,
    waitingCount,
    returningDirectory: state.returningDirectory,
    isFirebase: isFirebaseConfigured(),
    addPatient,
    sendNextPatientToCabin,
    updatePatientDraft,
    finishDoctorConsultation,
    markBillPaid,
    resetDemoData,
  };
}
