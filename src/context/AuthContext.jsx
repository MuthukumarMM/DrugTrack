import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../firebase/config'
import { getUserProfile, updateLastLogin } from '../services/userService'
import { isDemoMode } from '../firebase/mode'

const AuthContext = createContext(null)
const DEMO_SESSION_KEY = 'drugtrack_demo_user'

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileError, setProfileError] = useState('')
  const [loading, setLoading] = useState(true)

  const clearSession = () => {
    if (isDemoMode) sessionStorage.removeItem(DEMO_SESSION_KEY)
    setCurrentUser(null)
    setProfile(null)
    setProfileError('')
  }

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
        setProfileError('Your Firebase account exists, but the DrugTrack profile document is missing.')
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

  const setAuthenticatedUser = async user => {
    if (!user) {
      clearSession()
      return null
    }
    if (isDemoMode) sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user))
    setCurrentUser(user)
    return loadProfile(user)
  }

  useEffect(() => {
    if (isDemoMode) {
      let savedUser = null
      try {
        savedUser = JSON.parse(sessionStorage.getItem(DEMO_SESSION_KEY) || 'null')
      } catch {
        sessionStorage.removeItem(DEMO_SESSION_KEY)
      }
      if (savedUser?.uid) {
        setCurrentUser(savedUser)
        loadProfile(savedUser).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
      return undefined
    }

    if (!isFirebaseConfigured) {
      setCurrentUser(null)
      setProfile(null)
      setProfileError('Firebase environment values are not configured.')
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
      isDemoMode,
      setAuthenticatedUser,
      clearSession,
      refreshProfile: user => loadProfile(user || currentUser),
    }),
    [currentUser, profile, profileError, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
