import type { ReactNode } from 'react'

interface ChartCardProps {
  title: string
  children: ReactNode
}

export const ChartCard = ({ title, children }: ChartCardProps) => (
  <section className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900'>
    <h3 className='mb-3 text-base font-semibold text-slate-900 dark:text-slate-100'>{title}</h3>
    <div className='h-72'>{children}</div>
  </section>
)
