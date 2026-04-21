import { formatCurrency, formatPercent } from '../../utils/format'

interface KpiCardProps {
  label: string
  value: number
  isPercent?: boolean
}

export const KpiCard = ({ label, value, isPercent }: KpiCardProps) => {
  const positive = value >= 0
  return (
    <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900'>
      <p className='text-sm text-slate-500 dark:text-slate-400'>{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${positive ? 'text-emerald-600' : 'text-rose-500'} dark:text-inherit`}>
        {isPercent ? formatPercent(value) : formatCurrency(value)}
      </p>
    </div>
  )
}
