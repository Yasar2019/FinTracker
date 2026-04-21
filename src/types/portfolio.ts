export const ASSET_TYPES = ['stocks', 'ETFs', 'crypto', 'cash', 'mutual funds', 'bonds', 'other'] as const
export const TRANSACTION_TYPES = ['buy', 'sell', 'dividend', 'deposit', 'withdrawal', 'fee'] as const

export type AssetType = (typeof ASSET_TYPES)[number]
export type TransactionType = (typeof TRANSACTION_TYPES)[number]

export interface Account {
  id: string
  name: string
}

export interface Asset {
  ticker: string
  name: string
  assetType: AssetType
  currentPrice: number
}

export interface Transaction {
  id: string
  date: string
  ticker: string
  assetName: string
  type: TransactionType
  quantity: number
  price: number
  fees: number
  accountId: string
  notes: string
  amount?: number
}

export interface PortfolioData {
  accounts: Account[]
  assets: Asset[]
  transactions: Transaction[]
}

export interface Holding {
  key: string
  ticker: string
  name: string
  assetType: AssetType
  quantity: number
  averageCost: number
  currentPrice: number
  marketValue: number
  gainLoss: number
  gainLossPct: number
  accountId: string
}

export interface PortfolioMetrics {
  totalValue: number
  totalCost: number
  totalGainLoss: number
  totalGainLossPct: number
}
