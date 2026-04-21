import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import type { Holding, PortfolioMetrics, Transaction } from '../types/portfolio'
import { formatCurrency, formatPercent } from '../utils/format'
import { KpiCard } from '../components/common/KpiCard'

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6', '#64748b']

interface DashboardPageProps {
  holdings: Holding[]
  transactions: Transaction[]
  metrics: PortfolioMetrics
  allocationByAsset: Array<{ name: string; value: number }>
  allocationByAccount: Array<{ name: string; value: number }>
  accountLookup: Map<string, string>
}

export const DashboardPage = ({ holdings, transactions, metrics, allocationByAsset, allocationByAccount, accountLookup }: DashboardPageProps) => {
  const winners = [...holdings].sort((a, b) => b.gainLossPct - a.gainLossPct).slice(0, 3)
  const losers = [...holdings].sort((a, b) => a.gainLossPct - b.gainLossPct).slice(0, 3)
  const recentTransactions = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7)

  return (
    <div className='space-y-6'>
      <section className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
        <KpiCard label='Total portfolio value' value={metrics.totalValue} />
        <KpiCard label='Total gain / loss ($)' value={metrics.totalGainLoss} />
        <KpiCard label='Total gain / loss (%)' value={metrics.totalGainLossPct} isPercent />
        <KpiCard label='Holdings count' value={holdings.length} />
      </section>

      <section className='grid gap-4 xl:grid-cols-2'>
        <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900'>
          <h3 className='mb-3 text-base font-semibold'>Allocation by asset class</h3>
          <div className='h-72'>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={allocationByAsset} dataKey='value' nameKey='name' outerRadius={95} label>
                  {allocationByAsset.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900'>
          <h3 className='mb-3 text-base font-semibold'>Allocation by account</h3>
          <div className='h-72'>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={allocationByAccount.map((item) => ({ ...item, name: accountLookup.get(item.name) ?? item.name }))} dataKey='value' nameKey='name' outerRadius={95} label>
                  {allocationByAccount.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className='grid gap-4 xl:grid-cols-3'>
        <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900'>
          <h3 className='mb-3 font-semibold'>Top winners</h3>
          <ul className='space-y-2 text-sm'>
            {winners.map((holding) => (
              <li key={holding.key} className='flex items-center justify-between'>
                <span>{holding.ticker}</span>
                <span className='font-medium text-emerald-600'>{formatPercent(holding.gainLossPct)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900'>
          <h3 className='mb-3 font-semibold'>Top losers</h3>
          <ul className='space-y-2 text-sm'>
            {losers.map((holding) => (
              <li key={holding.key} className='flex items-center justify-between'>
                <span>{holding.ticker}</span>
                <span className='font-medium text-rose-500'>{formatPercent(holding.gainLossPct)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900'>
          <h3 className='mb-3 font-semibold'>Cost basis</h3>
          <p className='text-2xl font-semibold'>{formatCurrency(metrics.totalCost)}</p>
          <p className='mt-2 text-sm text-slate-500'>Unrealized P/L: {formatCurrency(metrics.totalGainLoss)}</p>
        </div>
      </section>

      <section className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900'>
        <h3 className='mb-3 font-semibold'>Recent transactions</h3>
        <div className='overflow-x-auto'>
          <table className='min-w-full text-sm'>
            <thead>
              <tr className='border-b border-slate-200 text-left dark:border-slate-700'>
                <th className='py-2'>Date</th>
                <th>Type</th>
                <th>Ticker</th>
                <th>Account</th>
                <th className='text-right'>Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((transaction) => {
                const amount = transaction.amount ?? transaction.quantity * transaction.price
                return (
                  <tr key={transaction.id} className='border-b border-slate-100 dark:border-slate-800'>
                    <td className='py-2'>{transaction.date}</td>
                    <td className='capitalize'>{transaction.type}</td>
                    <td>{transaction.ticker || '—'}</td>
                    <td>{accountLookup.get(transaction.accountId) ?? transaction.accountId}</td>
                    <td className='text-right'>{formatCurrency(amount)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
