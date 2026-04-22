import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts'
import type { Holding } from '../types/portfolio'
import { ChartCard } from '../components/charts/ChartCard'
import { formatCurrency } from '../utils/format'

interface AnalyticsPageProps {
  holdings: Holding[]
  portfolioHistory: Array<{ month: string; value: number }>
  performanceByAccount: Array<{ accountId: string; value: number; gainLoss: number }>
  contributionHistory: Array<{ month: string; value: number }>
  dividendHistory: Array<{ month: string; value: number }>
}

export const AnalyticsPage = ({ holdings, portfolioHistory, performanceByAccount, contributionHistory, dividendHistory }: AnalyticsPageProps) => {
  const gainLossByHolding = holdings.map((holding) => ({ ticker: holding.ticker, gainLoss: holding.gainLoss }))

  return (
    <div className='grid gap-4 xl:grid-cols-2'>
      <ChartCard title='Portfolio value over time'>
        <ResponsiveContainer>
          <LineChart data={portfolioHistory}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='month' />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
            <Line type='monotone' dataKey='value' stroke='#2563eb' strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title='Gain/loss by holding'>
        <ResponsiveContainer>
          <BarChart data={gainLossByHolding}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='ticker' />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
            <Bar dataKey='gainLoss' fill='#10b981' />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title='Performance by account'>
        <ResponsiveContainer>
          <BarChart data={performanceByAccount}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='accountId' />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
            <Bar dataKey='value' fill='#6366f1' />
            <Bar dataKey='gainLoss' fill='#f59e0b' />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title='Monthly contribution trend'>
        <ResponsiveContainer>
          <LineChart data={contributionHistory}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='month' />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
            <Line type='monotone' dataKey='value' stroke='#8b5cf6' strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {dividendHistory.length > 0 ? (
        <ChartCard title='Dividend income by month'>
          <ResponsiveContainer>
            <BarChart data={dividendHistory}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='month' />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
              <Bar dataKey='value' fill='#14b8a6' />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : null}
    </div>
  )
}
