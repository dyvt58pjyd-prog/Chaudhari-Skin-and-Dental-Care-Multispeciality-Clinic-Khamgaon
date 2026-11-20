export type DoctorRole = 'reception' | 'skin' | 'dental1' | 'dental2' | 'admin';

export interface BillingItem {
  id: string;
  description: string;
  category: 'consult' | 'procedure' | 'dental_surface' | 'dental_tooth' | 'rx' | 'custom';
  toothNo?: number;
  surface?: string;
  amount: number;
  createdAt: string;
}

export interface PrescriptionItem {
  id?: string;
  medicine: string;
  type?: 'tablet' | 'capsule' | 'syrup' | 'cream' | 'ointment' | 'shampoo' | 'gel' | 'lotion' | 'drops' | 'mouthwash' | 'toothpaste' | 'spray' | 'soap' | 'powder' | 'other';
  dosage: string;
  morning?: boolean;
  afternoon?: boolean;
  night?: boolean;
  timing: string; // e.g. "1-0-1 After Food"
  timingCode?: string; // e.g. "1-0-1", "1-0-0", "0-0-1", "SOS"
  foodRelation?: 'after_food' | 'before_food' | 'with_food' | 'as_needed' | 'topical';
  days: number;
  instructions?: string;
  category?: 'skin' | 'dental' | 'hair' | 'general';
}

export interface ClinicalMedia {
  id: string;
  url: string; // Data URI (Base64) or remote URL
  caption: string;
  timestamp: string;
  type: 'clinical_photo' | 'xray' | 'dermatoscope' | 'intraoral' | 'document';
}

export interface VisitRecord {
  id: string;
  visitNumber?: number;
  date: string; // e.g. "2026-11-20"
  time: string; // e.g. "10:15 AM"
  doctorId: 'skin' | 'dental1' | 'dental2';
  doctorTitle: string;
  age?: number | string;
  city?: string;
  chiefComplaint?: string;
  diagnosis?: string;
  doctorNotes?: string;
  photos: ClinicalMedia[];
  rxItems: PrescriptionItem[];
  billingItems: BillingItem[];
  totalAmount: number;
  paymentStatus?: 'cash' | 'upi' | 'pending';
  paymentRef?: string;
  followUpDate?: string;
  followUpNotes?: string;
  dentalState?: Record<number, ToothState>;
}

export interface Patient {
  id: string;
  tokenNumber: number;
  date?: string; // Date of registration / visit e.g. "2026-11-20"
  name: string;
  age?: number | string;
  city?: string;
  gender?: string;
  phone: string;
  doctorId: 'skin' | 'dental1' | 'dental2';
  status: 'waiting' | 'in_cabin' | 'billed' | 'completed';
  arrivalTime: string;
  cabinEnteredTime?: string;
  billedTime?: string;
  completedTime?: string;
  billingItems: BillingItem[];
  totalAmount: number;
  paymentStatus?: 'pending' | 'cash' | 'upi';
  paymentRef?: string;
  paidAt?: string;
  rxItems: PrescriptionItem[];
  doctorNotes?: string;
  diagnosis?: string;
  chiefComplaint?: string;
  photos: ClinicalMedia[];
  followUpDate?: string;
  followUpNotes?: string;
  pastVisits: VisitRecord[];
  dentalState?: Record<number, ToothState>;
}

export type ToothSurface = 'buccal' | 'lingual' | 'mesial' | 'distal' | 'occlusal';

export type SurfaceCondition = 'healthy' | 'caries' | 'composite' | 'amalgam' | 'sealant';

export type ToothWholeCondition = 'healthy' | 'missing' | 'rct' | 'crown' | 'implant' | 'bridge';

export interface ToothState {
  toothNo: number;
  wholeCondition: ToothWholeCondition;
  surfaces: {
    buccal: SurfaceCondition;
    lingual: SurfaceCondition;
    mesial: SurfaceCondition;
    distal: SurfaceCondition;
    occlusal: SurfaceCondition;
  };
  notes?: string;
}

export interface Cabin {
  id: 'skin' | 'dental1' | 'dental2';
  name: string;
  doctorTitle: string;
  status: 'free' | 'busy';
  currentPatientId: string | null;
  currentPatientName: string | null;
  currentPatientToken: number | null;
  enteredTime: string | null;
}

export interface ClinicState {
  cabins: Record<'skin' | 'dental1' | 'dental2', Cabin>;
  patients: Patient[];
  returningDirectory: Record<string, string>; // phone -> name
  lastUpdated: string;
}
