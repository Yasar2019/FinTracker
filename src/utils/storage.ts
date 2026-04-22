import Dexie, { type Table } from "dexie";
import { seedData } from "../data/seedData";
import type { PortfolioData } from "../types/portfolio";

const LEGACY_STORAGE_KEY = "fintracker-data-v1";
const MAIN_RECORD_ID = "main";

interface PortfolioRecord {
  id: string;
  data: PortfolioData;
  updatedAt: number;
}

export type PersistenceSource = "indexeddb" | "migrated-localstorage" | "seed";

interface LoadPortfolioResult {
  data: PortfolioData;
  source: PersistenceSource;
  lastSavedAt: number | null;
}

class FinTrackerDatabase extends Dexie {
  portfolio!: Table<PortfolioRecord, string>;

  constructor() {
    super("fintracker-db");
    this.version(1).stores({
      portfolio: "id,updatedAt",
    });
  }
}

const database = new FinTrackerDatabase();

const isValidPortfolioData = (
  value: PortfolioData | null,
): value is PortfolioData => {
  if (!value) return false;
  return (
    Array.isArray(value.accounts) &&
    Array.isArray(value.assets) &&
    Array.isArray(value.transactions)
  );
};

const readLegacyLocalStorage = (): PortfolioData | null => {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PortfolioData;
    return isValidPortfolioData(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const loadPortfolioData = async (): Promise<LoadPortfolioResult> => {
  try {
    const existing = await database.portfolio.get(MAIN_RECORD_ID);
    const existingData = existing?.data ?? null;
    if (isValidPortfolioData(existingData)) {
      return {
        data: existingData,
        source: "indexeddb",
        lastSavedAt: existing?.updatedAt ?? null,
      };
    }

    const migrated = readLegacyLocalStorage();
    if (migrated) {
      const updatedAt = Date.now();
      await database.portfolio.put({
        id: MAIN_RECORD_ID,
        data: migrated,
        updatedAt,
      });
      return {
        data: migrated,
        source: "migrated-localstorage",
        lastSavedAt: updatedAt,
      };
    }

    const updatedAt = Date.now();
    await database.portfolio.put({
      id: MAIN_RECORD_ID,
      data: seedData,
      updatedAt,
    });
    return { data: seedData, source: "seed", lastSavedAt: updatedAt };
  } catch {
    return { data: seedData, source: "seed", lastSavedAt: null };
  }
};

export const savePortfolioData = async (data: PortfolioData): Promise<void> => {
  await database.portfolio.put({
    id: MAIN_RECORD_ID,
    data,
    updatedAt: Date.now(),
  });
};
