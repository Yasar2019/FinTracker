export const currencyFormatter = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 2,
})

export const percentFormatter = new Intl.NumberFormat('en-CA', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const numberFormatter = new Intl.NumberFormat('en-CA', {
  maximumFractionDigits: 2,
})

export const formatCurrency = (value: number) => currencyFormatter.format(value || 0)
export const formatPercent = (value: number) => percentFormatter.format((value || 0) / 100)
export const formatNumber = (value: number) => numberFormatter.format(value || 0)
