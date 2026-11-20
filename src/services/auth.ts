import { DoctorRole } from '../types/clinic';

export const ROLE_PINS: Record<DoctorRole, string> = {
  skin: '1234',
  dental1: '4321',
  dental2: '0000',
  reception: '1111',
  admin: '4326',
};

export const ROLE_LABELS: Record<DoctorRole, { name: string; doctorName: string; dept: string; icon: string }> = {
  reception: {
    name: 'Reception Desk',
    doctorName: 'Front Desk Executive',
    dept: 'Patient Line & Billing Counter',
    icon: '🖥️'
  },
  skin: {
    name: 'Skin Doctor',
    doctorName: 'Dr. Rajanikant Chaudhari',
    dept: 'Dermatology & Cosmetology',
    icon: '🩺'
  },
  dental1: {
    name: 'Dental Doctor 1',
    doctorName: 'Dr. Shrutika Tulaskar (Chaudhari)',
    dept: 'Dental Surgeon (Cabin 1)',
    icon: '🦷'
  },
  dental2: {
    name: 'Dental Doctor 2',
    doctorName: 'Dr. Priyanka Chaudhari (Anokar)',
    dept: 'Dental Surgeon (Cabin 2)',
    icon: '🦷'
  },
  admin: {
    name: 'Admin Console',
    doctorName: 'Clinic Administrator / Director',
    dept: 'System Settings, Pricing, Queue & Reports',
    icon: '⚙️'
  },
};

const SESSION_KEY = 'chaudhari_active_role_session';

export function verifyRolePin(role: DoctorRole, pin: string): boolean {
  return ROLE_PINS[role] === pin.trim();
}

export function saveActiveSession(role: DoctorRole) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY, role);
  }
}

export function clearActiveSession() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

export function getActiveSession(): DoctorRole | null {
  if (typeof window !== 'undefined') {
    const saved = sessionStorage.getItem(SESSION_KEY) as DoctorRole;
    if (['reception', 'skin', 'dental1', 'dental2', 'admin'].includes(saved)) {
      return saved;
    }
  }
  return null;
}
