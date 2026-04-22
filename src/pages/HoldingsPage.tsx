import { useMemo, useState } from 'react'
import type { AssetType, Holding } from '../types/portfolio'
import { ASSET_TYPES } from '../types/portfolio'
import { formatCurrency, formatNumber, formatPercent } from '../utils/format'

const assetTypeBadgeClasses: Record<AssetType, string> = {
  stocks: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200',
  ETFs: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200',
  crypto: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
  cash: 'bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200',
  'mutual funds': 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-200',
  bonds: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
  other: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-200',
}

type SortKey = keyof Holding

interface HoldingsPageProps {
  holdings: Holding[]
  accountLookup: Map<string, string>
  onPriceUpdate: (ticker: string, price: number) => void
}

export const HoldingsPage = ({ holdings, accountLookup, onPriceUpdate }: HoldingsPageProps) => {
  const [search, setSearch] = useState('')
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortKey>('marketValue')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const filteredHoldings = useMemo(() => {
    const term = search.toLowerCase().trim()
    const base = holdings.filter((holding) => {
      const matchesSearch = !term || holding.ticker.toLowerCase().includes(term) || holding.name.toLowerCase().includes(term) || (accountLookup.get(holding.accountId) ?? holding.accountId).toLowerCase().includes(term)
      const matchesType = assetTypeFilter === 'all' || holding.assetType === assetTypeFilter
      return matchesSearch && matchesType
    })

    base.sort((a, b) => {
      const aValue = a[sortBy]
      const bValue = b[sortBy]
      if (typeof aValue === 'number' && typeof bValue === 'number') return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      return sortDirection === 'asc' ? String(aValue).localeCompare(String(bValue)) : String(bValue).localeCompare(String(aValue))
    })

    return base
  }, [accountLookup, assetTypeFilter, holdings, search, sortBy, sortDirection])

  const changeSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDirection((previous) => (previous === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortBy(key)
    setSortDirection('desc')
  }

  return (
    <div className='space-y-4'>
      <section className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900'>
        <h3 className='mb-3 text-base font-semibold'>Filters</h3>
        <div className='grid gap-3 md:grid-cols-3'>
          <input className='rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800' placeholder='Search ticker, name, account...' value={search} onChange={(event) => setSearch(event.target.value)} />
          <select value={assetTypeFilter} onChange={(event) => setAssetTypeFilter(event.target.value)} className='rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800'>
            <option value='all'>All asset categories</option>
            {ASSET_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
      </section>

      <section className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900'>
        <h3 className='mb-3 text-base font-semibold'>Holdings</h3>
        <div className='overflow-x-auto'>
          <table className='min-w-full text-sm'>
            <thead>
              <tr className='border-b border-slate-200 dark:border-slate-700'>
                <th className='py-2 text-left'><button type='button' onClick={() => changeSort('ticker')}>Ticker</button></th>
                <th className='text-left'><button type='button' onClick={() => changeSort('name')}>Name</button></th>
                <th className='text-left'><button type='button' onClick={() => changeSort('assetType')}>Asset</button></th>
                <th className='text-right'><button type='button' onClick={() => changeSort('quantity')}>Qty</button></th>
                <th className='text-right'><button type='button' onClick={() => changeSort('averageCost')}>Avg cost</button></th>
                <th className='text-right'><button type='button' onClick={() => changeSort('currentPrice')}>Current</button></th>
                <th className='text-right'><button type='button' onClick={() => changeSort('marketValue')}>Market value</button></th>
                <th className='text-right'><button type='button' onClick={() => changeSort('gainLoss')}>Gain/Loss $</button></th>
                <th className='text-right'><button type='button' onClick={() => changeSort('gainLossPct')}>Gain/Loss %</button></th>
                <th className='text-left'><button type='button' onClick={() => changeSort('accountId')}>Account</button></th>
              </tr>
            </thead>
            <tbody>
              {filteredHoldings.map((holding) => (
                <tr key={holding.key} className='border-b border-slate-100 dark:border-slate-800'>
                  <td className='py-2 font-medium'>{holding.ticker}</td>
                  <td>{holding.name}</td>
                  <td><span className={`rounded-full px-2 py-1 text-xs font-medium ${assetTypeBadgeClasses[holding.assetType]}`}>{holding.assetType}</span></td>
                  <td className='text-right'>{formatNumber(holding.quantity)}</td>
                  <td className='text-right'>{formatCurrency(holding.averageCost)}</td>
                  <td className='text-right'>{formatCurrency(holding.currentPrice)}</td>
                  <td className='text-right'>{formatCurrency(holding.marketValue)}</td>
                  <td className={`text-right font-medium ${holding.gainLoss >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{formatCurrency(holding.gainLoss)}</td>
                  <td className={`text-right font-medium ${holding.gainLossPct >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{formatPercent(holding.gainLossPct)}</td>
                  <td>{accountLookup.get(holding.accountId) ?? holding.accountId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900'>
        <h3 className='mb-3 text-base font-semibold'>Editable current prices</h3>
        <div className='grid gap-3 md:grid-cols-3'>
          {holdings.map((holding) => (
            <label key={holding.key} className='flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700'>
              <span className='mr-3 text-sm font-medium'>{holding.ticker}</span>
              <input type='number' step='0.01' className='w-28 rounded border border-slate-300 bg-white px-2 py-1 text-right text-sm dark:border-slate-600 dark:bg-slate-800' defaultValue={holding.currentPrice} onBlur={(event) => onPriceUpdate(holding.ticker, Number(event.target.value))} />
            </label>
          ))}
        </div>
      </section>
    </div>
  )
}
