import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../firebase/config'
import { getUserProfile, updateLastLogin } from '../services/userService'

const AuthContext = createContext(null)

const demoMode = String(import.meta.env.VITE_DEMO_MODE || '').toLowerCase() === 'true'

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileError, setProfileError] = useState('')
  const [loading, setLoading] = useState(true)

  const loadProfile = async user => {
    if (!user) {
      setProfile(null)
      setProfileError('')
      return null
    }

    try {
      const data = await getUserProfile(user.uid)
      if (!data) {
        setProfile(null)
        setProfileError('Your account exists, but the DrugTrack profile document is missing.')
        return null
      }

      setProfile(data)
      setProfileError('')
      updateLastLogin(user.uid).catch(() => {})
      return data
    } catch (error) {
      setProfile(null)
      setProfileError(error.message || 'Unable to load your DrugTrack profile.')
      return null
    }
  }

  useEffect(() => {
    if (!isFirebaseConfigured || demoMode) {
      try {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('drugtrack_demo_user') : null
        if (saved) {
          const user = JSON.parse(saved)
          setCurrentUser(user)
          loadProfile(user).finally(() => setLoading(false))
          return undefined
        }
      } catch (e) {
        console.warn('Failed to load demo user', e)
      }

      setCurrentUser(null)
      setProfile(null)
      setProfileError('')
      setLoading(false)
      return undefined
    }

    return onAuthStateChanged(auth, async user => {
      setLoading(true)

      if (!user) {
        setCurrentUser(null)
        setProfile(null)
        setProfileError('')
        setLoading(false)
        return
      }

      setCurrentUser(user)
      await loadProfile(user)
      setLoading(false)
    })
  }, [])

  const value = useMemo(
    () => ({
      currentUser,
      profile,
      profileError,
      role: profile?.role,
      loading,
      isConfigured: isFirebaseConfigured,
      demoMode,
      refreshProfile: async user => {
        if (user) {
          setCurrentUser(user)
        }
        return loadProfile(user || currentUser)
      },
    }),
    [currentUser, profile, profileError, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
