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
  [key: string]: string | undefined
  date?: string
  transaction_date?: string
  settlement_date?: string
  ticker?: string
  symbol?: string
  assetName?: string
  name?: string
  type?: string
  activity_type?: string
  activity_sub_type?: string
  direction?: string
  quantity?: string
  price?: string
  unit_price?: string
  fees?: string
  commission?: string
  account?: string
  account_id?: string
  account_type?: string
  notes?: string
  amount?: string
  net_cash_amount?: string
  currency?: string
  assetType?: string
  currentPrice?: string
}

type PapaParseErrorCode = 'UndetectableDelimiter' | 'TooFewFields' | 'TooManyFields' | 'InvalidQuotes' | 'MissingQuotes' | 'FieldMismatch'

const parseNumber = (value: string | undefined, fallback = 0): number => {
  if (!value) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const normalizeHeaderKey = (value: string): string => value.trim().toLowerCase().replace(/[\s-]+/g, '_')

const getValueByHeader = (row: CsvRow, key: string): string | undefined => {
  if (row[key] !== undefined) return row[key]
  const normalizedTarget = normalizeHeaderKey(key)
  for (const [header, value] of Object.entries(row)) {
    if (normalizeHeaderKey(header) === normalizedTarget) return value
  }
  return undefined
}

const getFirstValue = (row: CsvRow, keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = getValueByHeader(row, key)
    if (value !== undefined && value !== null && String(value).trim() !== '') return String(value)
  }
  return undefined
}

const inferTransactionType = (row: CsvRow): Transaction['type'] | undefined => {
  const rawType = (row.type ?? '').toLowerCase().trim()
  if (TRANSACTION_TYPES.includes(rawType as Transaction['type'])) return rawType as Transaction['type']

  const subtype = ((row.activity_sub_type ?? '').toLowerCase() + ' ' + (row.activity_type ?? '').toLowerCase()).trim()
  const direction = (row.direction ?? '').toLowerCase().trim()
  const symbol = (row.symbol ?? row.ticker ?? '').trim()
  const netCash = parseNumber(row.net_cash_amount, Number.NaN)

  if (subtype.includes('buy') || subtype.includes('purchase')) return 'buy'
  if (subtype.includes('sell')) return 'sell'
  if (subtype.includes('dividend') || subtype.includes('distribution')) return 'dividend'
  if (subtype.includes('fee') || subtype.includes('commission') || subtype.includes('charge')) return 'fee'
  if (subtype.includes('deposit') || subtype.includes('contribution') || subtype.includes('funding')) return 'deposit'
  if (subtype.includes('withdrawal') || subtype.includes('withdraw')) return 'withdrawal'

  if (symbol) {
    if (direction.includes('credit')) return 'sell'
    if (direction.includes('debit')) return 'buy'
    if (Number.isFinite(netCash)) return netCash >= 0 ? 'sell' : 'buy'
  }

  if (direction.includes('credit')) return 'deposit'
  if (direction.includes('debit')) return 'withdrawal'
  if (Number.isFinite(netCash)) return netCash >= 0 ? 'deposit' : 'withdrawal'

  return undefined
}

const inferAssetType = (row: CsvRow): Asset['assetType'] => {
  const assetTypeRaw = (row.assetType ?? '').trim()
  if (assetTypeRaw) {
    const matched = ASSET_TYPES.find((value) => value.toLowerCase() === assetTypeRaw.toLowerCase())
    if (matched) return matched
  }

  const ticker = (row.symbol ?? row.ticker ?? '').toUpperCase().trim()
  if (ticker === 'BTC' || ticker === 'ETH' || ticker === 'SOL' || ticker === 'XRP' || ticker === 'DOGE') return 'crypto'
  return 'other'
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
  const parsed = Papa.parse<CsvRow>(input, {
    header: true,
    skipEmptyLines: 'greedy',
    delimiter: '',
    delimitersToGuess: [',', ';', '\t', '|'],
  })

  const blockingError = parsed.errors.find((error) => {
    const code = error.code as PapaParseErrorCode
    return !['FieldMismatch', 'TooFewFields', 'TooManyFields'].includes(code)
  })
  if (blockingError) return { error: `CSV parsing failed: ${blockingError.message}` }

  const accountMap = new Map(currentData.accounts.map((account) => [account.id, account]))
  const assetMap = new Map(currentData.assets.map((asset) => [asset.ticker.toUpperCase(), asset]))
  const importedTransactions: Transaction[] = []

  for (const row of parsed.data) {
    const looksEmpty = Object.values(row).every((value) => String(value ?? '').trim() === '')
    if (looksEmpty) continue

    const date = getFirstValue(row, ['date', 'transaction_date', 'settlement_date'])
    const type = inferTransactionType(row)
    const accountRaw = getFirstValue(row, ['account', 'account_type', 'account_id'])

    if (!date || !type || !accountRaw) {
      continue
    }
    if (!TRANSACTION_TYPES.includes(type as Transaction['type'])) return { error: `Invalid transaction type: ${type}` }

    const accountName = accountRaw.trim()
    const accountId = toId(accountName)
    if (!accountMap.has(accountId)) accountMap.set(accountId, { id: accountId, name: accountName } as Account)

    const ticker = getFirstValue(row, ['ticker', 'symbol'])?.toUpperCase().trim() ?? ''
    const assetName = (getFirstValue(row, ['assetName', 'name']) ?? ticker ?? 'Imported Asset').trim()

    if ((type === 'buy' || type === 'sell') && !ticker) return { error: `Ticker is required for ${type} transactions.` }

    if (ticker && !assetMap.has(ticker)) {
      const assetType = inferAssetType(row)
      const currentPrice = parseNumber(row.currentPrice, parseNumber(getFirstValue(row, ['price', 'unit_price']), 0))
      assetMap.set(ticker, { ticker, name: assetName, assetType, currentPrice })
    }

    const amountValue = parseNumber(getFirstValue(row, ['amount', 'net_cash_amount']), Number.NaN)
    const normalizedAmount = Number.isFinite(amountValue) ? Math.abs(amountValue) : undefined

    importedTransactions.push({
      id: crypto.randomUUID(),
      date,
      ticker,
      assetName,
      type: type as Transaction['type'],
      quantity: parseNumber(row.quantity, 0),
      price: parseNumber(getFirstValue(row, ['price', 'unit_price']), 0),
      fees: parseNumber(getFirstValue(row, ['fees', 'commission']), 0),
      accountId,
      notes: row.notes ?? '',
      amount: normalizedAmount,
    })
  }

  if (importedTransactions.length === 0) {
    return { error: 'No importable transaction rows were found. Check delimiter/header format from broker export.' }
  }

  return {
    data: {
      accounts: [...accountMap.values()],
      assets: [...assetMap.values()],
      transactions: [...currentData.transactions, ...importedTransactions],
    },
  }
}
