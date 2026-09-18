import { auth, firebaseSetupError } from './config'
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth'
const requireAuth = () => { if (!auth) throw new Error(firebaseSetupError); return auth }
export const signUpWithEmail = async ({ email, password, displayName }) => { const credential = await createUserWithEmailAndPassword(requireAuth(), email, password); await updateProfile(credential.user, { displayName }); return credential.user }
export const signInWithEmail = (email, password) => signInWithEmailAndPassword(requireAuth(), email, password)
export const signOutUser = () => signOut(requireAuth())
export const resetPassword = email => sendPasswordResetEmail(requireAuth(), email)
