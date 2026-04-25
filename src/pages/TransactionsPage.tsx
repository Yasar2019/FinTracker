import { useEffect, useMemo, useState } from 'react'
import { ASSET_TYPES, TRANSACTION_TYPES, type Account, type Asset, type AssetType, type Transaction } from '../types/portfolio'
import { formatCurrency } from '../utils/format'

interface TransactionsPageProps {
  transactions: Transaction[]
  accounts: Account[]
  assets: Asset[]
  onSaveTransaction: (transaction: Transaction) => void
  onDeleteTransaction: (id: string) => void
  onDeleteTransactions: (ids: string[]) => void
  onUpsertAsset: (asset: Asset) => void
}

interface FormValues {
  id: string
  date: string
  ticker: string
  assetName: string
  type: Transaction['type']
  quantity: string
  price: string
  fees: string
  accountId: string
  notes: string
  amount: string
  assetType: AssetType
}

const emptyForm = (accountId?: string): FormValues => ({
  id: '',
  date: new Date().toISOString().slice(0, 10),
  ticker: '',
  assetName: '',
  type: 'buy',
  quantity: '',
  price: '',
  fees: '0',
  accountId: accountId ?? '',
  notes: '',
  amount: '',
  assetType: 'stocks',
})

export const TransactionsPage = ({ transactions, accounts, assets, onSaveTransaction, onDeleteTransaction, onDeleteTransactions, onUpsertAsset }: TransactionsPageProps) => {
  const [form, setForm] = useState<FormValues>(() => emptyForm(accounts[0]?.id))
  const [error, setError] = useState('')
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | Transaction['type']>('all')
  const [tickerFilter, setTickerFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const assetByTicker = useMemo(() => new Map(assets.map((asset) => [asset.ticker, asset])), [assets])

  const resetForm = () => {
    setForm(emptyForm(accounts[0]?.id))
    setError('')
  }

  const editTransaction = (transaction: Transaction) => {
    const existingAsset = assetByTicker.get(transaction.ticker)
    setForm({
      id: transaction.id,
      date: transaction.date,
      ticker: transaction.ticker,
      assetName: transaction.assetName,
      type: transaction.type,
      quantity: String(transaction.quantity),
      price: String(transaction.price),
      fees: String(transaction.fees),
      accountId: transaction.accountId,
      notes: transaction.notes,
      amount: transaction.amount !== undefined ? String(transaction.amount) : '',
      assetType: existingAsset?.assetType ?? 'other',
    })
  }

  const saveTransaction = () => {
    if (!form.date || !form.accountId || !form.type) {
      setError('Date, account, and transaction type are required.')
      return
    }
    if ((form.type === 'buy' || form.type === 'sell' || form.type === 'dividend') && !form.ticker.trim()) {
      setError(`Ticker is required for ${form.type} transactions.`)
      return
    }

    const quantity = Number(form.quantity || 0)
    const price = Number(form.price || 0)
    const fees = Number(form.fees || 0)
    const amount = form.amount ? Number(form.amount) : undefined

    const transaction: Transaction = {
      id: form.id || crypto.randomUUID(),
      date: form.date,
      ticker: form.ticker.trim().toUpperCase(),
      assetName: form.assetName.trim() || form.ticker.trim().toUpperCase(),
      type: form.type,
      quantity: Number.isFinite(quantity) ? quantity : 0,
      price: Number.isFinite(price) ? price : 0,
      fees: Number.isFinite(fees) ? fees : 0,
      accountId: form.accountId,
      notes: form.notes,
      amount: amount !== undefined && Number.isFinite(amount) ? amount : undefined,
    }

    onSaveTransaction(transaction)

    if (transaction.ticker) {
      onUpsertAsset({ ticker: transaction.ticker, name: transaction.assetName || transaction.ticker, assetType: form.assetType, currentPrice: transaction.price })
    }

    resetForm()
  }

  const tickerOptions = useMemo(
    () => [...new Set(transactions.map((transaction) => transaction.ticker).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [transactions],
  )

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return transactions.filter((transaction) => {
      if (typeFilter !== 'all' && transaction.type !== typeFilter) return false
      if (tickerFilter !== 'all' && transaction.ticker !== tickerFilter) return false
      if (fromDate && transaction.date < fromDate) return false
      if (toDate && transaction.date > toDate) return false
      if (!normalizedSearch) return true

      return [
        transaction.date,
        transaction.type,
        transaction.ticker,
        transaction.assetName,
        transaction.accountId,
        transaction.notes,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)
    })
  }, [transactions, searchTerm, typeFilter, tickerFilter, fromDate, toDate])

  const sortedTransactions = [...filteredTransactions].sort((a, b) => b.date.localeCompare(a.date))
  const allVisibleSelected = sortedTransactions.length > 0 && sortedTransactions.every((transaction) => selectedTransactionIds.includes(transaction.id))

  useEffect(() => {
    const validIds = new Set(transactions.map((transaction) => transaction.id))
    setSelectedTransactionIds((previous) => previous.filter((id) => validIds.has(id)))
  }, [transactions])

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedTransactionIds([])
      return
    }
    setSelectedTransactionIds(sortedTransactions.map((transaction) => transaction.id))
  }

  const toggleSelectTransaction = (id: string) => {
    setSelectedTransactionIds((previous) => (previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]))
  }

  const deleteSelectedTransactions = () => {
    onDeleteTransactions(selectedTransactionIds)
    setSelectedTransactionIds([])
  }

  const resetFilters = () => {
    setSearchTerm('')
    setTypeFilter('all')
    setTickerFilter('all')
    setFromDate('')
    setToDate('')
  }

  return (
    <div className='space-y-4'>
      <section className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900'>
        <h3 className='mb-3 text-base font-semibold'>Add / Edit transaction</h3>
        <div className='grid gap-3 md:grid-cols-3'>
          <input type='date' className='rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800' value={form.date} onChange={(event) => setForm((previous) => ({ ...previous, date: event.target.value }))} />
          <select className='rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800' value={form.type} onChange={(event) => setForm((previous) => ({ ...previous, type: event.target.value as Transaction['type'] }))}>
            {TRANSACTION_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <select className='rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800' value={form.accountId} onChange={(event) => setForm((previous) => ({ ...previous, accountId: event.target.value }))}>
            {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
          </select>
          <input placeholder='Ticker' className='rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase dark:border-slate-600 dark:bg-slate-800' value={form.ticker} onChange={(event) => setForm((previous) => ({ ...previous, ticker: event.target.value.toUpperCase() }))} />
          <input placeholder='Asset name' className='rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800' value={form.assetName} onChange={(event) => setForm((previous) => ({ ...previous, assetName: event.target.value }))} />
          <select className='rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800' value={form.assetType} onChange={(event) => setForm((previous) => ({ ...previous, assetType: event.target.value as AssetType }))}>
            {ASSET_TYPES.map((assetType) => <option key={assetType} value={assetType}>{assetType}</option>)}
          </select>
          <input type='number' step='0.0001' placeholder='Quantity' className='rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800' value={form.quantity} onChange={(event) => setForm((previous) => ({ ...previous, quantity: event.target.value }))} />
          <input type='number' step='0.01' placeholder='Price' className='rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800' value={form.price} onChange={(event) => setForm((previous) => ({ ...previous, price: event.target.value }))} />
          <input type='number' step='0.01' placeholder='Fees' className='rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800' value={form.fees} onChange={(event) => setForm((previous) => ({ ...previous, fees: event.target.value }))} />
          <input type='number' step='0.01' placeholder='Amount (optional)' className='rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800' value={form.amount} onChange={(event) => setForm((previous) => ({ ...previous, amount: event.target.value }))} />
          <input placeholder='Notes' className='md:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800' value={form.notes} onChange={(event) => setForm((previous) => ({ ...previous, notes: event.target.value }))} />
        </div>
        {error ? <p className='mt-3 text-sm text-rose-500'>{error}</p> : null}
        <div className='mt-3 flex gap-2'>
          <button type='button' className='rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900' onClick={saveTransaction}>{form.id ? 'Update transaction' : 'Add transaction'}</button>
          {form.id ? <button type='button' className='rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600' onClick={resetForm}>Cancel edit</button> : null}
        </div>
      </section>

      <section className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900'>
        <div className='mb-3 grid gap-2 md:grid-cols-5'>
          <input
            type='text'
            placeholder='Search notes, ticker, type...'
            className='rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800'
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <select
            className='rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800'
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as 'all' | Transaction['type'])}
          >
            <option value='all'>All types</option>
            {TRANSACTION_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <select
            className='rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800'
            value={tickerFilter}
            onChange={(event) => setTickerFilter(event.target.value)}
          >
            <option value='all'>All tickers</option>
            {tickerOptions.map((ticker) => <option key={ticker} value={ticker}>{ticker}</option>)}
          </select>
          <input
            type='date'
            className='rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800'
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
          />
          <div className='flex gap-2'>
            <input
              type='date'
              className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800'
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
            />
            <button type='button' className='rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-600' onClick={resetFilters}>
              Reset
            </button>
          </div>
        </div>

        <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
          <h3 className='text-base font-semibold'>Transaction history ({sortedTransactions.length})</h3>
          <button
            type='button'
            className='rounded-lg bg-rose-100 px-3 py-2 text-xs font-medium text-rose-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-rose-900/40 dark:text-rose-200'
            disabled={selectedTransactionIds.length === 0}
            onClick={deleteSelectedTransactions}
          >
            Delete selected ({selectedTransactionIds.length})
          </button>
        </div>
        <div className='overflow-x-auto'>
          <table className='min-w-full text-sm'>
            <thead>
              <tr className='border-b border-slate-200 text-left dark:border-slate-700'>
                <th className='py-2 pr-2'>
                  <input type='checkbox' aria-label='Select all transactions' checked={allVisibleSelected} onChange={toggleSelectAllVisible} />
                </th>
                <th className='py-2'>Date</th>
                <th>Type</th>
                <th>Ticker</th>
                <th className='text-right'>Qty</th>
                <th className='text-right'>Price</th>
                <th className='text-right'>Fees</th>
                <th>Account</th>
                <th className='text-right'>Value</th>
                <th className='text-right'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map((transaction) => (
                <tr key={transaction.id} className='border-b border-slate-100 dark:border-slate-800'>
                  <td className='py-2 pr-2'>
                    <input
                      type='checkbox'
                      aria-label={`Select transaction ${transaction.id}`}
                      checked={selectedTransactionIds.includes(transaction.id)}
                      onChange={() => toggleSelectTransaction(transaction.id)}
                    />
                  </td>
                  <td className='py-2'>{transaction.date}</td>
                  <td className='capitalize'>{transaction.type}</td>
                  <td>{transaction.ticker || '—'}</td>
                  <td className='text-right'>{transaction.quantity}</td>
                  <td className='text-right'>{formatCurrency(transaction.price)}</td>
                  <td className='text-right'>{formatCurrency(transaction.fees)}</td>
                  <td>{transaction.accountId}</td>
                  <td className='text-right'>{formatCurrency(transaction.amount ?? transaction.price * transaction.quantity)}</td>
                  <td>
                    <div className='flex justify-end gap-2'>
                      <button type='button' className='rounded bg-slate-100 px-2 py-1 text-xs dark:bg-slate-700' onClick={() => editTransaction(transaction)}>Edit</button>
                      <button type='button' className='rounded bg-rose-100 px-2 py-1 text-xs text-rose-600 dark:bg-rose-900/40' onClick={() => onDeleteTransaction(transaction.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
