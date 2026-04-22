import { useEffect, useMemo, useState } from 'react'
import type { Account } from '../../types/portfolio'
import type { PersistenceSource } from '../../utils/storage'

interface HeaderProps {
  accounts: Account[]
  selectedAccount: string
  onSelectAccount: (value: string) => void
  darkMode: boolean
  onToggleTheme: () => void
  persistenceSource: PersistenceSource
  lastSavedAt: number | null
}

const persistenceSourceLabel: Record<PersistenceSource, string> = {
  indexeddb: 'Loaded from IndexedDB',
  'migrated-localstorage': 'Migrated from localStorage',
  seed: 'Loaded seed data',
}

const getRelativeSavedLabel = (lastSavedAt: number | null, now: number): string => {
  if (!lastSavedAt) return 'Not saved yet'
  const diffSeconds = Math.max(0, Math.floor((now - lastSavedAt) / 1000))
  if (diffSeconds < 10) return 'Saved just now'
  if (diffSeconds < 60) return `Saved ${diffSeconds}s ago`
  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `Saved ${diffMinutes}m ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `Saved ${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `Saved ${diffDays}d ago`
}

export const Header = ({ accounts, selectedAccount, onSelectAccount, darkMode, onToggleTheme, persistenceSource, lastSavedAt }: HeaderProps) => {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 5000)
    return () => window.clearInterval(interval)
  }, [])

  const lastSavedLabel = useMemo(() => getRelativeSavedLabel(lastSavedAt, now), [lastSavedAt, now])

  return (
    <header className='mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:flex-row md:items-center md:justify-between'>
      <div>
        <h2 className='text-xl font-semibold text-slate-900 dark:text-slate-100'>Portfolio Overview</h2>
        <p className='text-sm text-slate-500 dark:text-slate-400'>Track accounts, holdings, and performance in one place.</p>
        <div className='mt-1 flex flex-wrap items-center gap-2'>
          <p className='inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300'>
            {persistenceSourceLabel[persistenceSource]}
          </p>
          <p className='inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300'>
            {lastSavedLabel}
          </p>
        </div>
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        <label className='text-sm text-slate-600 dark:text-slate-300' htmlFor='account-filter'>
          Account
        </label>
        <select
          id='account-filter'
          className='rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800'
          value={selectedAccount}
          onChange={(event) => onSelectAccount(event.target.value)}
        >
          <option value='all'>All accounts</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
        <button type='button' className='rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600' onClick={onToggleTheme}>
          {darkMode ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </header>
  )
}
