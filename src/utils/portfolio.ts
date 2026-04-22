import type { Asset, Holding, PortfolioMetrics, Transaction } from '../types/portfolio'

const round = (value: number): number => Math.round(value * 100) / 100

export const getDividendAmount = (transaction: Transaction): number => {
  if (transaction.amount !== undefined) return transaction.amount
  return transaction.quantity * transaction.price
}

export const getCashFlowAmount = (transaction: Transaction): number => {
  if (transaction.amount !== undefined) return transaction.amount
  return transaction.quantity * transaction.price
}

export const deriveHoldings = (
  transactions: Transaction[],
  assets: Asset[],
  accountFilter = 'all',
): Holding[] => {
  const assetMap = new Map(assets.map((asset) => [asset.ticker.toUpperCase(), asset]))
  const sortedTransactions = [...transactions].sort((a, b) => a.date.localeCompare(b.date))

  const state = new Map<string, { quantity: number; costBasis: number }>()

  for (const transaction of sortedTransactions) {
    if (accountFilter !== 'all' && transaction.accountId !== accountFilter) continue
    if (!transaction.ticker || !assetMap.has(transaction.ticker.toUpperCase())) continue

    const key = `${transaction.accountId}-${transaction.ticker.toUpperCase()}`
    const current = state.get(key) ?? { quantity: 0, costBasis: 0 }

    if (transaction.type === 'buy') {
      current.quantity += transaction.quantity
      current.costBasis += transaction.quantity * transaction.price + transaction.fees
    } else if (transaction.type === 'sell' && current.quantity > 0) {
      const sellQty = Math.min(transaction.quantity, current.quantity)
      const avgCost = current.costBasis / current.quantity
      current.quantity -= sellQty
      current.costBasis -= avgCost * sellQty
      if (current.quantity <= 0.000001) {
        current.quantity = 0
        current.costBasis = 0
      }
    }

    state.set(key, current)
  }

  return [...state.entries()]
    .filter(([, value]) => value.quantity > 0)
    .map(([key, value]) => {
      const [accountId, ticker] = key.split('-')
      const asset = assetMap.get(ticker)
      if (!asset) return null
      const marketValue = value.quantity * asset.currentPrice
      const gainLoss = marketValue - value.costBasis
      const gainLossPct = value.costBasis > 0 ? (gainLoss / value.costBasis) * 100 : 0

      return {
        key,
        ticker,
        name: asset.name,
        assetType: asset.assetType,
        quantity: round(value.quantity),
        averageCost: value.quantity > 0 ? round(value.costBasis / value.quantity) : 0,
        currentPrice: round(asset.currentPrice),
        marketValue: round(marketValue),
        gainLoss: round(gainLoss),
        gainLossPct: round(gainLossPct),
        accountId,
      }
    })
    .filter((holding): holding is Holding => Boolean(holding))
}

export const calculatePortfolioMetrics = (holdings: Holding[]): PortfolioMetrics => {
  const totalValue = holdings.reduce((sum, holding) => sum + holding.marketValue, 0)
  const totalCost = holdings.reduce((sum, holding) => sum + holding.averageCost * holding.quantity, 0)
  const totalGainLoss = totalValue - totalCost
  const totalGainLossPct = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0

  return {
    totalValue: round(totalValue),
    totalCost: round(totalCost),
    totalGainLoss: round(totalGainLoss),
    totalGainLossPct: round(totalGainLossPct),
  }
}

export const getAllocationBy = (holdings: Holding[], key: 'assetType' | 'accountId') => {
  const bucket = new Map<string, number>()
  for (const holding of holdings) {
    bucket.set(holding[key], (bucket.get(holding[key]) ?? 0) + holding.marketValue)
  }
  return [...bucket.entries()].map(([name, value]) => ({ name, value: round(value) })).sort((a, b) => b.value - a.value)
}

export const getPortfolioHistory = (transactions: Transaction[], assets: Asset[], accountFilter = 'all') => {
  const assetMap = new Map(assets.map((asset) => [asset.ticker.toUpperCase(), asset]))
  const sortedTransactions = [...transactions]
    .filter((transaction) => accountFilter === 'all' || transaction.accountId === accountFilter)
    .sort((a, b) => a.date.localeCompare(b.date))

  const quantityByKey = new Map<string, number>()
  const history = new Map<string, number>()

  for (const transaction of sortedTransactions) {
    const month = transaction.date.slice(0, 7)
    const ticker = transaction.ticker.toUpperCase()
    const asset = assetMap.get(ticker)
    const key = `${transaction.accountId}-${ticker}`

    if (asset && (transaction.type === 'buy' || transaction.type === 'sell')) {
      const previous = quantityByKey.get(key) ?? 0
      const updated = transaction.type === 'buy' ? previous + transaction.quantity : Math.max(0, previous - transaction.quantity)
      quantityByKey.set(key, updated)
    }

    let value = 0
    quantityByKey.forEach((quantity, quantityKey) => {
      const [, quantityTicker] = quantityKey.split('-')
      const pricedAsset = assetMap.get(quantityTicker)
      if (pricedAsset) value += quantity * pricedAsset.currentPrice
    })

    history.set(month, round(value))
  }

  return [...history.entries()].map(([month, value]) => ({ month, value }))
}

export const getMonthlyContributions = (transactions: Transaction[], accountFilter = 'all') => {
  const byMonth = new Map<string, number>()
  for (const transaction of transactions) {
    if (accountFilter !== 'all' && transaction.accountId !== accountFilter) continue
    const month = transaction.date.slice(0, 7)
    const amount = getCashFlowAmount(transaction)
    if (transaction.type === 'deposit') byMonth.set(month, (byMonth.get(month) ?? 0) + amount)
    if (transaction.type === 'withdrawal') byMonth.set(month, (byMonth.get(month) ?? 0) - amount)
  }

  return [...byMonth.entries()].map(([month, value]) => ({ month, value: round(value) }))
}

export const getDividendIncome = (transactions: Transaction[], accountFilter = 'all') => {
  const byMonth = new Map<string, number>()
  for (const transaction of transactions) {
    if (accountFilter !== 'all' && transaction.accountId !== accountFilter) continue
    if (transaction.type !== 'dividend') continue
    const month = transaction.date.slice(0, 7)
    byMonth.set(month, (byMonth.get(month) ?? 0) + getDividendAmount(transaction))
  }

  return [...byMonth.entries()].map(([month, value]) => ({ month, value: round(value) }))
}

export const getPerformanceByAccount = (holdings: Holding[]) => {
  const bucket = new Map<string, { value: number; gainLoss: number }>()

  for (const holding of holdings) {
    const current = bucket.get(holding.accountId) ?? { value: 0, gainLoss: 0 }
    current.value += holding.marketValue
    current.gainLoss += holding.gainLoss
    bucket.set(holding.accountId, current)
  }

  return [...bucket.entries()].map(([accountId, values]) => ({
    accountId,
    value: round(values.value),
    gainLoss: round(values.gainLoss),
  }))
}
