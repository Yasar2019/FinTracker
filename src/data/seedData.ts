import type { PortfolioData } from '../types/portfolio'

export const seedData: PortfolioData = {
  accounts: [
    { id: 'tfsa', name: 'TFSA' },
    { id: 'rrsp', name: 'RRSP' },
    { id: 'fhsa', name: 'FHSA' },
    { id: 'cash', name: 'Cash' },
    { id: 'margin', name: 'Margin' },
  ],
  assets: [
    { ticker: 'AAPL', name: 'Apple Inc.', assetType: 'stocks', currentPrice: 191.2 },
    { ticker: 'MSFT', name: 'Microsoft Corp.', assetType: 'stocks', currentPrice: 424.15 },
    { ticker: 'VFV', name: 'Vanguard S&P 500 ETF', assetType: 'ETFs', currentPrice: 134.8 },
    { ticker: 'XIU', name: 'iShares S&P/TSX 60 ETF', assetType: 'ETFs', currentPrice: 36.4 },
    { ticker: 'BTC', name: 'Bitcoin', assetType: 'crypto', currentPrice: 93250 },
    { ticker: 'ZAG', name: 'BMO Aggregate Bond ETF', assetType: 'bonds', currentPrice: 14.85 },
    { ticker: 'CASH', name: 'Cash Position', assetType: 'cash', currentPrice: 1 },
  ],
  transactions: [
    { id: 't1', date: '2025-01-03', ticker: 'CASH', assetName: 'Cash Position', type: 'deposit', quantity: 1, price: 5000, fees: 0, accountId: 'tfsa', notes: 'Initial funding', amount: 5000 },
    { id: 't2', date: '2025-01-08', ticker: 'VFV', assetName: 'Vanguard S&P 500 ETF', type: 'buy', quantity: 20, price: 126.4, fees: 4.99, accountId: 'tfsa', notes: 'Core ETF buy' },
    { id: 't3', date: '2025-01-10', ticker: 'MSFT', assetName: 'Microsoft Corp.', type: 'buy', quantity: 6, price: 398.1, fees: 4.99, accountId: 'rrsp', notes: 'Long-term position' },
    { id: 't4', date: '2025-01-18', ticker: 'BTC', assetName: 'Bitcoin', type: 'buy', quantity: 0.04, price: 88200, fees: 12, accountId: 'margin', notes: 'Small crypto allocation' },
    { id: 't5', date: '2025-02-02', ticker: 'AAPL', assetName: 'Apple Inc.', type: 'buy', quantity: 10, price: 178.6, fees: 4.99, accountId: 'fhsa', notes: 'Tech exposure' },
    { id: 't6', date: '2025-02-16', ticker: 'XIU', assetName: 'iShares S&P/TSX 60 ETF', type: 'buy', quantity: 45, price: 33.5, fees: 4.99, accountId: 'tfsa', notes: 'Canadian equity allocation' },
    { id: 't7', date: '2025-03-01', ticker: 'VFV', assetName: 'Vanguard S&P 500 ETF', type: 'buy', quantity: 10, price: 129.2, fees: 4.99, accountId: 'tfsa', notes: 'Monthly contribution' },
    { id: 't8', date: '2025-03-12', ticker: 'AAPL', assetName: 'Apple Inc.', type: 'dividend', quantity: 10, price: 0.24, fees: 0, accountId: 'fhsa', notes: 'Quarterly dividend', amount: 2.4 },
    { id: 't9', date: '2025-03-21', ticker: 'MSFT', assetName: 'Microsoft Corp.', type: 'sell', quantity: 1, price: 412.3, fees: 4.99, accountId: 'rrsp', notes: 'Trim position' },
    { id: 't10', date: '2025-04-02', ticker: 'ZAG', assetName: 'BMO Aggregate Bond ETF', type: 'buy', quantity: 100, price: 14.2, fees: 4.99, accountId: 'rrsp', notes: 'Reduce volatility' },
    { id: 't11', date: '2025-04-06', ticker: 'CASH', assetName: 'Cash Position', type: 'withdrawal', quantity: 1, price: 300, fees: 0, accountId: 'cash', notes: 'Emergency expense', amount: 300 },
    { id: 't12', date: '2025-04-10', ticker: 'CASH', assetName: 'Cash Position', type: 'fee', quantity: 1, price: 8.95, fees: 0, accountId: 'margin', notes: 'Brokerage account fee', amount: 8.95 },
  ],
}
