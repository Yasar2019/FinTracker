import Papa from 'papaparse'
import {
  ASSET_TYPES,
  TRANSACTION_TYPES,
  type Account,
  type Asset,
  type PortfolioData,
  type Transaction,
} from '../types/portfolio'

interface CsvRow {
  date?: string
  ticker?: string
  assetName?: string
  type?: string
  quantity?: string
  price?: string
  fees?: string
  account?: string
  notes?: string
  amount?: string
  assetType?: string
  currentPrice?: string
}

const parseNumber = (value: string | undefined, fallback = 0): number => {
  if (!value) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toId = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export const exportTransactionsCsv = (transactions: Transaction[]): string =>
  Papa.unparse(
    transactions.map((transaction) => ({
      date: transaction.date,
      ticker: transaction.ticker,
      assetName: transaction.assetName,
      type: transaction.type,
      quantity: transaction.quantity,
      price: transaction.price,
      fees: transaction.fees,
      account: transaction.accountId,
      notes: transaction.notes,
      amount: transaction.amount ?? '',
    })),
  )

export const exportDataJson = (data: PortfolioData): string => JSON.stringify(data, null, 2)

export const parseTransactionsCsv = (input: string, currentData: PortfolioData): { data?: PortfolioData; error?: string } => {
  const parsed = Papa.parse<CsvRow>(input, { header: true, skipEmptyLines: true })
  if (parsed.errors.length > 0) return { error: `CSV parsing failed: ${parsed.errors[0].message}` }

  const accountMap = new Map(currentData.accounts.map((account) => [account.id, account]))
  const assetMap = new Map(currentData.assets.map((asset) => [asset.ticker.toUpperCase(), asset]))
  const importedTransactions: Transaction[] = []

  for (const row of parsed.data) {
    if (!row.date || !row.type || !row.account) return { error: 'Each row requires date, type, and account fields.' }
    const type = row.type.toLowerCase()
    if (!TRANSACTION_TYPES.includes(type as Transaction['type'])) return { error: `Invalid transaction type: ${row.type}` }

    const accountName = row.account.trim()
    const accountId = toId(accountName)
    if (!accountMap.has(accountId)) accountMap.set(accountId, { id: accountId, name: accountName } as Account)

    const ticker = (row.ticker ?? '').toUpperCase().trim()
    const assetName = (row.assetName ?? ticker ?? 'Imported Asset').trim()

    if ((type === 'buy' || type === 'sell' || type === 'dividend') && !ticker) return { error: `Ticker is required for ${type} transactions.` }

    if (ticker && !assetMap.has(ticker)) {
      const assetTypeRaw = (row.assetType ?? 'other').toLowerCase()
      const assetType = ASSET_TYPES.includes(assetTypeRaw as Asset['assetType']) ? (assetTypeRaw as Asset['assetType']) : 'other'
      const currentPrice = parseNumber(row.currentPrice, parseNumber(row.price, 0))
      assetMap.set(ticker, { ticker, name: assetName, assetType, currentPrice })
    }

    importedTransactions.push({
      id: crypto.randomUUID(),
      date: row.date,
      ticker,
      assetName,
      type: type as Transaction['type'],
      quantity: parseNumber(row.quantity, 0),
      price: parseNumber(row.price, 0),
      fees: parseNumber(row.fees, 0),
      accountId,
      notes: row.notes ?? '',
      amount: row.amount ? parseNumber(row.amount, 0) : undefined,
    })
  }

  return {
    data: {
      accounts: [...accountMap.values()],
      assets: [...assetMap.values()],
      transactions: [...currentData.transactions, ...importedTransactions],
    },
  }
}
