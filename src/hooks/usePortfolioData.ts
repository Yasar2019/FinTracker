import { useEffect, useMemo, useState } from "react";
import { seedData } from "../data/seedData";
import type { Asset, PortfolioData, Transaction } from "../types/portfolio";
import {
  loadPortfolioData,
  savePortfolioData,
  type PersistenceSource,
} from "../utils/storage";
import {
  calculatePortfolioMetrics,
  deriveHoldings,
  getAllocationBy,
  getDividendIncome,
  getMonthlyContributions,
  getPerformanceByAccount,
  getPortfolioHistory,
} from "../utils/portfolio";

export const usePortfolioData = () => {
  const [data, setData] = useState<PortfolioData>(seedData);
  const [isHydrated, setIsHydrated] = useState(false);
  const [persistenceSource, setPersistenceSource] =
    useState<PersistenceSource>("seed");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const {
        data: nextData,
        source,
        lastSavedAt: loadedLastSavedAt,
      } = await loadPortfolioData();
      if (cancelled) return;
      setData(nextData);
      setPersistenceSource(source);
      setLastSavedAt(loadedLastSavedAt);
      setIsHydrated(true);
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const persist = async () => {
      await savePortfolioData(data);
      setLastSavedAt(Date.now());
    };
    void persist();
  }, [data, isHydrated]);

  const filteredTransactions = useMemo(
    () =>
      selectedAccount === "all"
        ? data.transactions
        : data.transactions.filter(
            (transaction) => transaction.accountId === selectedAccount,
          ),
    [data.transactions, selectedAccount],
  );

  const holdings = useMemo(
    () => deriveHoldings(data.transactions, data.assets, selectedAccount),
    [data.assets, data.transactions, selectedAccount],
  );
  const metrics = useMemo(
    () => calculatePortfolioMetrics(holdings),
    [holdings],
  );

  const analytics = useMemo(
    () => ({
      allocationByAsset: getAllocationBy(holdings, "assetType"),
      allocationByAccount: getAllocationBy(holdings, "accountId"),
      portfolioHistory: getPortfolioHistory(
        data.transactions,
        data.assets,
        selectedAccount,
      ),
      contributionHistory: getMonthlyContributions(
        data.transactions,
        selectedAccount,
      ),
      dividendHistory: getDividendIncome(data.transactions, selectedAccount),
      performanceByAccount: getPerformanceByAccount(holdings),
    }),
    [data.assets, data.transactions, holdings, selectedAccount],
  );

  const upsertTransaction = (transaction: Transaction) => {
    setData((previous) => {
      const existingIndex = previous.transactions.findIndex(
        (item) => item.id === transaction.id,
      );
      if (existingIndex >= 0) {
        const nextTransactions = [...previous.transactions];
        nextTransactions[existingIndex] = transaction;
        return { ...previous, transactions: nextTransactions };
      }
      return {
        ...previous,
        transactions: [transaction, ...previous.transactions],
      };
    });
  };

  const deleteTransaction = (id: string) => {
    setData((previous) => ({
      ...previous,
      transactions: previous.transactions.filter(
        (transaction) => transaction.id !== id,
      ),
    }));
  };

  const updateAssetPrice = (ticker: string, price: number) => {
    setData((previous) => ({
      ...previous,
      assets: previous.assets.map((asset) =>
        asset.ticker === ticker
          ? {
              ...asset,
              currentPrice: Number.isFinite(price) ? price : asset.currentPrice,
            }
          : asset,
      ),
    }));
  };

  const updateAssetPrices = (pricesByTicker: Record<string, number>) => {
    if (Object.keys(pricesByTicker).length === 0) return;
    setData((previous) => ({
      ...previous,
      assets: previous.assets.map((asset) => {
        const nextPrice = pricesByTicker[asset.ticker.toUpperCase()];
        if (!Number.isFinite(nextPrice)) return asset;
        return { ...asset, currentPrice: nextPrice };
      }),
    }));
  };

  const replaceData = (nextData: PortfolioData) => setData(nextData);

  const upsertAsset = (asset: Asset) => {
    setData((previous) => {
      const index = previous.assets.findIndex(
        (item) => item.ticker === asset.ticker,
      );
      if (index >= 0) {
        const nextAssets = [...previous.assets];
        nextAssets[index] = asset;
        return { ...previous, assets: nextAssets };
      }
      return { ...previous, assets: [...previous.assets, asset] };
    });
  };

  return {
    data,
    filteredTransactions,
    holdings,
    metrics,
    analytics,
    persistenceSource,
    lastSavedAt,
    selectedAccount,
    setSelectedAccount,
    upsertTransaction,
    deleteTransaction,
    updateAssetPrice,
    updateAssetPrices,
    replaceData,
    upsertAsset,
  };
};
