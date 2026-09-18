import { signInWithEmail, signOutUser as firebaseSignOutUser, signUpWithEmail, resetPassword } from '../firebase/auth'
import { validateDemoLogin } from '../data/demoAccounts'
import { createOrganizationProfile, createUserProfile } from './userService'

const demoMode = String(import.meta.env.VITE_DEMO_MODE || '').toLowerCase() === 'true'

export const registerUser = async profile => { const user = await signUpWithEmail(profile); try { await createUserProfile(user, profile); await createOrganizationProfile(user, profile) } catch (error) { await user.delete(); throw error } return user }

export const loginUser = async (email, password) => {
  const trimmedEmail = String(email || '').trim()
  const safePassword = String(password || '')

  if (demoMode) {
    const demoAccount = validateDemoLogin(trimmedEmail, safePassword)
    if (demoAccount) {
      return {
        user: {
          uid: demoAccount.uid,
          email: demoAccount.email,
          displayName: demoAccount.displayName,
          photoURL: '',
        },
      }
    }
  }

  return signInWithEmail(trimmedEmail, safePassword)
}

export const signOutUser = () => {
  if (demoMode) return Promise.resolve()
  return firebaseSignOutUser()
}

export { resetPassword }
