const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'holdings', label: 'Holdings' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'analytics', label: 'Analytics' },
] as const

export type PageId = (typeof NAV_ITEMS)[number]['id']

interface SidebarProps {
  activePage: PageId
  onNavigate: (pageId: PageId) => void
}

export const Sidebar = ({ activePage, onNavigate }: SidebarProps) => (
  <aside className='w-full border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 lg:w-64 lg:border-b-0 lg:border-r lg:py-6'>
    <div className='mb-6 flex items-center justify-between lg:block'>
      <div>
        <p className='text-xs uppercase tracking-widest text-slate-400'>FinTracker</p>
        <h1 className='text-xl font-semibold text-slate-900 dark:text-slate-100'>Investment Tracker</h1>
      </div>
    </div>

    <nav className='grid grid-cols-2 gap-2 lg:grid-cols-1'>
      {NAV_ITEMS.map((item) => {
        const active = activePage === item.id
        return (
          <button
            key={item.id}
            type='button'
            onClick={() => onNavigate(item.id)}
            className={`rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
              active
                ? 'bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {item.label}
          </button>
        )
      })}
    </nav>
  </aside>
)
