import type { Account } from '../../types/portfolio'

interface HeaderProps {
  accounts: Account[]
  selectedAccount: string
  onSelectAccount: (value: string) => void
  darkMode: boolean
  onToggleTheme: () => void
}

export const Header = ({ accounts, selectedAccount, onSelectAccount, darkMode, onToggleTheme }: HeaderProps) => (
  <header className='mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:flex-row md:items-center md:justify-between'>
    <div>
      <h2 className='text-xl font-semibold text-slate-900 dark:text-slate-100'>Portfolio Overview</h2>
      <p className='text-sm text-slate-500 dark:text-slate-400'>Track accounts, holdings, and performance in one place.</p>
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
