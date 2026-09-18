import { db, isFirebaseConfigured } from './config'

export const isDemoMode = String(import.meta.env.VITE_DEMO_MODE || '').toLowerCase() === 'true'

export function shouldUseMockStore() {
  if (!isFirebaseConfigured || !db || isDemoMode) return true
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('drugtrack_demo_user')
      if (saved) return true
    }
  } catch {
    return false
  }
  return false
}

