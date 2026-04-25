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

interface BrokerTransactionRecord {
  id?: number;
  transaction_date: string;
  settlement_date: string;
  account_id: string;
  account_type: string;
  activity_type: string;
  activity_sub_type: string;
  direction: string;
  symbol: string;
  name: string;
  currency: string;
  quantity: number;
  unit_price: number;
  commission: number;
  net_cash_amount: number;
}

export type PersistenceSource = "indexeddb" | "migrated-localstorage" | "seed";

interface LoadPortfolioResult {
  data: PortfolioData;
  source: PersistenceSource;
  lastSavedAt: number | null;
}

class FinTrackerDatabase extends Dexie {
  portfolio!: Table<PortfolioRecord, string>;
  broker_transactions!: Table<BrokerTransactionRecord, number>;

  constructor() {
    super("fintracker-db");
    this.version(1).stores({
      portfolio: "id,updatedAt",
    });
    this.version(2).stores({
      portfolio: "id,updatedAt",
      broker_transactions:
        "++id,transaction_date,settlement_date,account_id,account_type,activity_type,activity_sub_type,direction,symbol,name,currency,quantity,unit_price,commission,net_cash_amount",
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
  const updatedAt = Date.now();
  const brokerRows: BrokerTransactionRecord[] = data.transactions.map((transaction) => {
    const baseAmount = transaction.amount ?? transaction.quantity * transaction.price;
    const absoluteAmount = Math.abs(baseAmount);

    const activity_type =
      transaction.type === "buy" || transaction.type === "sell"
        ? "TRADE"
        : transaction.type === "dividend"
          ? "DIVIDEND"
          : transaction.type === "fee"
            ? "FEE"
            : "TRANSFER";

    const direction =
      transaction.type === "sell" ||
      transaction.type === "dividend" ||
      transaction.type === "deposit"
        ? "CREDIT"
        : "DEBIT";

    const signedNetCashAmount =
      transaction.type === "sell" ||
      transaction.type === "dividend" ||
      transaction.type === "deposit"
        ? absoluteAmount
        : -absoluteAmount;

    return {
      transaction_date: transaction.date,
      settlement_date: transaction.date,
      account_id: transaction.accountId,
      account_type: transaction.accountId,
      activity_type,
      activity_sub_type: transaction.type.toUpperCase(),
      direction,
      symbol: transaction.ticker,
      name: transaction.assetName,
      currency: "CAD",
      quantity: transaction.quantity,
      unit_price: transaction.price,
      commission: transaction.fees,
      net_cash_amount: signedNetCashAmount,
    };
  });

  await database.transaction(
    "rw",
    database.portfolio,
    database.broker_transactions,
    async () => {
      await database.portfolio.put({
        id: MAIN_RECORD_ID,
        data,
        updatedAt,
      });
      await database.broker_transactions.clear();
      if (brokerRows.length > 0) {
        await database.broker_transactions.bulkAdd(brokerRows);
      }
    },
  );
};
