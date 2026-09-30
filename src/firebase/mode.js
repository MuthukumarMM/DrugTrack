import { db, isFirebaseConfigured } from './config'

const requestedDemoMode = String(import.meta.env.VITE_DEMO_MODE || '').toLowerCase()

export const isDemoMode = requestedDemoMode === 'true' || (!isFirebaseConfigured && requestedDemoMode !== 'false')

export function shouldUseMockStore() {
  return !isFirebaseConfigured || !db || isDemoMode
}

