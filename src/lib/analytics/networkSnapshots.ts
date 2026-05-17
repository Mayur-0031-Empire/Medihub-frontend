import type { ChartDatum } from "@/lib/analytics/appointmentAnalytics";
import {
  doctorsPerHospital,
  specialtiesByHospital,
  specialtiesNetworkWide,
} from "@/lib/analytics/networkAnalytics";
import { toDateInputValue } from "@/lib/analytics/dateRange";
import type { PublicDoctorProfile } from "@/types/appointment";

const STORAGE_KEY = "medihub-network-snapshots";

type NetworkSnapshot = {
  savedAt: string;
  doctorCount: number;
  byHospital: ChartDatum[];
  hospitalSpecialties: ChartDatum[];
  specialties: ChartDatum[];
};

type SnapshotStore = Record<string, NetworkSnapshot>;

function loadStore(): SnapshotStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as SnapshotStore;
  } catch {
    return {};
  }
}

function saveStore(store: SnapshotStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore quota */
  }
}

export function saveNetworkSnapshot(doctors: PublicDoctorProfile[], day = new Date()): void {
  const key = toDateInputValue(day);
  const store = loadStore();
  store[key] = {
    savedAt: new Date().toISOString(),
    doctorCount: doctors.length,
    byHospital: doctorsPerHospital(doctors),
    hospitalSpecialties: specialtiesByHospital(doctors),
    specialties: specialtiesNetworkWide(doctors),
  };
  saveStore(store);
}

export function loadNetworkSnapshot(day: Date): NetworkSnapshot | null {
  const key = toDateInputValue(day);
  return loadStore()[key] ?? null;
}

/** Nearest saved snapshot on or before the given day (for viewing back data). */
export function loadNetworkSnapshotOnOrBefore(day: Date): { snapshot: NetworkSnapshot; dateKey: string } | null {
  const store = loadStore();
  const target = toDateInputValue(day);
  const keys = Object.keys(store).filter((k) => k <= target).sort();
  if (keys.length === 0) return null;
  const dateKey = keys[keys.length - 1]!;
  return { snapshot: store[dateKey]!, dateKey };
}
