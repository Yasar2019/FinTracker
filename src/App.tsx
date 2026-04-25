import { useEffect, useMemo, useRef, useState } from 'react'
import { Header } from './components/layout/Header'
import { Sidebar, type PageId } from './components/layout/Sidebar'
import { usePortfolioData } from './hooks/usePortfolioData'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { DashboardPage } from './pages/DashboardPage'
import { HoldingsPage } from './pages/HoldingsPage'
import { TransactionsPage } from './pages/TransactionsPage'
import { exportDataJson, exportTransactionsCsv, parseTransactionsCsv } from './utils/importExport'
import { fetchLatestMarketPrices } from './utils/marketPrices'

const downloadTextFile = (filename: string, content: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function App() {
  const [activePage, setActivePage] = useState<PageId>('dashboard')
  const [darkMode, setDarkMode] = useState<boolean>(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [importError, setImportError] = useState('')
  const [priceRefreshMessage, setPriceRefreshMessage] = useState('')
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    data,
    filteredTransactions,
    holdings,
    metrics,
    analytics,
    persistenceSource,
    lastSavedAt,
    selectedAccount,
    setSelectedAccount,
    upsertTransaction,
    deleteTransaction,
    deleteTransactions,
    updateAssetPrice,
    updateAssetPrices,
    replaceData,
    upsertAsset,
  } = usePortfolioData()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const accountLookup = useMemo(() => new Map(data.accounts.map((account) => [account.id, account.name])), [data.accounts])

  const handleCsvImport = (file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = parseTransactionsCsv(String(reader.result || ''), data)
      if (result.error) {
        setImportError(result.error)
        return
      }
      if (result.data) {
        replaceData(result.data)
        setImportError('')
      }
    }
    reader.readAsText(file)
  }

  const renderPage = () => {
    if (activePage === 'dashboard') {
      return <DashboardPage holdings={holdings} transactions={filteredTransactions} metrics={metrics} allocationByAsset={analytics.allocationByAsset} allocationByAccount={analytics.allocationByAccount} accountLookup={accountLookup} />
    }
    if (activePage === 'holdings') {
      return <HoldingsPage holdings={holdings} accountLookup={accountLookup} onPriceUpdate={updateAssetPrice} />
    }
    if (activePage === 'transactions') {
      return <TransactionsPage transactions={filteredTransactions} accounts={data.accounts} assets={data.assets} onSaveTransaction={upsertTransaction} onDeleteTransaction={deleteTransaction} onDeleteTransactions={deleteTransactions} onUpsertAsset={upsertAsset} />
    }
    return <AnalyticsPage holdings={holdings} portfolioHistory={analytics.portfolioHistory} performanceByAccount={analytics.performanceByAccount} contributionHistory={analytics.contributionHistory} dividendHistory={analytics.dividendHistory} />
  }

  const refreshMarketPrices = async () => {
    setIsRefreshingPrices(true)
    setPriceRefreshMessage('Refreshing prices...')

    try {
      const result = await fetchLatestMarketPrices(data.assets)
      updateAssetPrices(result.pricesByTicker)

      if (result.updatedCount === 0) {
        setPriceRefreshMessage('No free price source returned a usable quote for current assets.')
      } else if (result.skippedTickers.length > 0) {
        setPriceRefreshMessage(`Updated ${result.updatedCount} assets. Skipped: ${result.skippedTickers.join(', ')}.`)
      } else {
        setPriceRefreshMessage(`Updated ${result.updatedCount} assets from free market-price sources.`)
      }
    } catch {
      setPriceRefreshMessage('Price refresh failed. Kept existing values.')
    } finally {
      setIsRefreshingPrices(false)
    }
  }

  return (
    <div className='min-h-screen bg-slate-100 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100'>
      <div className='mx-auto flex min-h-screen w-full max-w-screen-2xl flex-col lg:flex-row'>
        <Sidebar activePage={activePage} onNavigate={setActivePage} />

        <main className='flex-1 p-4 md:p-6'>
          <Header accounts={data.accounts} selectedAccount={selectedAccount} onSelectAccount={setSelectedAccount} darkMode={darkMode} onToggleTheme={() => setDarkMode((previous) => !previous)} persistenceSource={persistenceSource} lastSavedAt={lastSavedAt} />

          <section className='mb-4 flex flex-wrap items-center gap-2'>
            <button type='button' className='rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600' onClick={() => downloadTextFile('fintracker-data.json', exportDataJson(data), 'application/json')}>Export JSON</button>
            <button type='button' className='rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600' onClick={() => downloadTextFile('fintracker-transactions.csv', exportTransactionsCsv(data.transactions), 'text/csv')}>Export CSV</button>
            <button type='button' className='rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600' onClick={() => fileInputRef.current?.click()}>Import CSV</button>
            <button type='button' className='rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 disabled:opacity-60' onClick={() => void refreshMarketPrices()} disabled={isRefreshingPrices}>
              {isRefreshingPrices ? 'Refreshing prices...' : 'Refresh Prices'}
            </button>
            <input ref={fileInputRef} type='file' accept='.csv,text/csv' className='hidden' onChange={(event) => handleCsvImport(event.target.files?.[0])} />
            {importError ? <p className='text-sm text-rose-500'>{importError}</p> : null}
            {priceRefreshMessage ? <p className='text-sm text-slate-500 dark:text-slate-400'>{priceRefreshMessage}</p> : null}
          </section>

          {renderPage()}
        </main>
      </div>
    </div>
  )
}

export default App
