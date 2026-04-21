import { seedData } from '../data/seedData'
import type { PortfolioData } from '../types/portfolio'

const STORAGE_KEY = 'fintracker-data-v1'

export const loadPortfolioData = (): PortfolioData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedData
    const parsed = JSON.parse(raw) as PortfolioData
    if (!parsed.accounts || !parsed.assets || !parsed.transactions) return seedData
    return parsed
  } catch {
    return seedData
  }
}

export const savePortfolioData = (data: PortfolioData): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
