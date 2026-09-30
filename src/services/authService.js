import { signInWithEmail, signOutUser as firebaseSignOutUser, signUpWithEmail, resetPassword } from '../firebase/auth'
import { validateDemoLogin } from '../data/demoAccounts'
import { createOrganizationProfile, createUserProfile } from './userService'
import { isDemoMode } from '../firebase/mode'

function authMessage(error) {
  const messages = {
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/user-not-found': 'No Firebase account exists for this email.',
    'auth/wrong-password': 'The password is incorrect.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/user-disabled': 'This Firebase account has been disabled.',
    'auth/operation-not-allowed': 'Email/password sign-in is not enabled in Firebase Authentication.',
    'auth/too-many-requests': 'Too many sign-in attempts. Wait a moment and try again.',
    'auth/invalid-api-key': 'The Firebase API key is invalid for this project.',
    'auth/network-request-failed': 'Firebase could not be reached. Check your connection or use the local emulator.',
  }
  return messages[error?.code] || error?.message || 'Unable to sign in.'
}

export const registerUser = async profile => { const user = await signUpWithEmail(profile); try { await createUserProfile(user, profile); await createOrganizationProfile(user, profile) } catch (error) { await user.delete(); throw error } return user }

export const loginUser = async (email, password) => {
  const trimmedEmail = String(email || '').trim()
  const safePassword = String(password || '')

  if (isDemoMode) {
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

  try {
    return await signInWithEmail(trimmedEmail, safePassword)
  } catch (error) {
    throw new Error(authMessage(error))
  }
}

export const signOutUser = () => {
  if (isDemoMode) return Promise.resolve()
  return firebaseSignOutUser()
}

export { resetPassword }
