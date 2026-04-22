import type { Asset } from "../types/portfolio";

const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3/simple/price";
const ALL_ORIGINS_RAW_URL = "https://api.allorigins.win/raw?url=";

const CRYPTO_TICKER_TO_ID: Record<string, string> = {
  ADA: "cardano",
  BNB: "binancecoin",
  BTC: "bitcoin",
  DOGE: "dogecoin",
  ETH: "ethereum",
  LTC: "litecoin",
  SOL: "solana",
  XRP: "ripple",
};

const toStooqSymbolCandidates = (
  ticker: string,
  assetType: Asset["assetType"],
): string[] => {
  const normalizedTicker = ticker.trim().toLowerCase();
  const normalizedType = assetType.toLowerCase();

  if (!normalizedTicker) return [];

  if (normalizedType.includes("etf") || normalizedType === "bonds") {
    return [
      `${normalizedTicker}.ca`,
      `${normalizedTicker}.us`,
      normalizedTicker,
    ];
  }

  if (normalizedType === "stocks") {
    return [
      `${normalizedTicker}.us`,
      `${normalizedTicker}.ca`,
      normalizedTicker,
    ];
  }

  return [`${normalizedTicker}.us`, `${normalizedTicker}.ca`, normalizedTicker];
};

const parseStooqClosePrice = (content: string): number | null => {
  const firstLine = content.trim().split("\n")[0] ?? "";
  const columns = firstLine.split(",");
  const closeValue = Number(columns[6]);
  return Number.isFinite(closeValue) && closeValue > 0 ? closeValue : null;
};

const fetchStooqClose = async (symbol: string): Promise<number | null> => {
  const stooqUrl = `https://stooq.com/q/l/?s=${encodeURIComponent(symbol)}&i=d`;
  const proxiedUrl = `${ALL_ORIGINS_RAW_URL}${encodeURIComponent(stooqUrl)}`;

  try {
    const response = await fetch(proxiedUrl);
    if (!response.ok) return null;
    const content = await response.text();
    return parseStooqClosePrice(content);
  } catch {
    return null;
  }
};

const fetchCryptoPricesCad = async (
  tickers: string[],
): Promise<Record<string, number>> => {
  const tickerToPrice: Record<string, number> = {};
  const ids = tickers
    .map((ticker) => CRYPTO_TICKER_TO_ID[ticker])
    .filter(
      (value, index, array) => Boolean(value) && array.indexOf(value) === index,
    );

  if (ids.length === 0) return tickerToPrice;

  try {
    const response = await fetch(
      `${COINGECKO_BASE_URL}?ids=${ids.join(",")}&vs_currencies=cad`,
    );
    if (!response.ok) return tickerToPrice;

    const payload = (await response.json()) as Record<string, { cad?: number }>;
    for (const ticker of tickers) {
      const id = CRYPTO_TICKER_TO_ID[ticker];
      if (!id) continue;
      const price = payload[id]?.cad;
      if (typeof price === "number" && Number.isFinite(price) && price > 0) {
        tickerToPrice[ticker] = price;
      }
    }
  } catch {
    return tickerToPrice;
  }

  return tickerToPrice;
};

export interface MarketPriceRefreshResult {
  pricesByTicker: Record<string, number>;
  updatedCount: number;
  skippedTickers: string[];
}

export const fetchLatestMarketPrices = async (
  assets: Asset[],
): Promise<MarketPriceRefreshResult> => {
  const pricesByTicker: Record<string, number> = {};
  const skippedTickers: string[] = [];

  const uniqueAssets = assets.filter(
    (asset, index, array) =>
      array.findIndex((item) => item.ticker === asset.ticker) === index,
  );
  const cryptoTickers = uniqueAssets
    .filter((asset) => asset.assetType.toLowerCase() === "crypto")
    .map((asset) => asset.ticker.toUpperCase());

  const cryptoPrices = await fetchCryptoPricesCad(cryptoTickers);
  for (const [ticker, price] of Object.entries(cryptoPrices)) {
    pricesByTicker[ticker] = price;
  }

  for (const asset of uniqueAssets) {
    const ticker = asset.ticker.toUpperCase();
    const normalizedType = asset.assetType.toLowerCase();

    if (normalizedType === "cash") continue;
    if (normalizedType === "crypto" && pricesByTicker[ticker]) continue;

    const candidates = toStooqSymbolCandidates(ticker, asset.assetType);
    let foundPrice: number | null = null;

    for (const candidate of candidates) {
      foundPrice = await fetchStooqClose(candidate);
      if (foundPrice) break;
    }

    if (
      typeof foundPrice === "number" &&
      Number.isFinite(foundPrice) &&
      foundPrice > 0
    ) {
      pricesByTicker[ticker] = foundPrice;
    } else {
      skippedTickers.push(ticker);
    }
  }

  return {
    pricesByTicker,
    updatedCount: Object.keys(pricesByTicker).length,
    skippedTickers,
  };
};
