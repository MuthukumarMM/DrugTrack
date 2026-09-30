import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { connectAuthEmulator } from 'firebase/auth'
import { connectFirestoreEmulator } from 'firebase/firestore'
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions'

const useEmulators = String(import.meta.env.VITE_USE_FIREBASE_EMULATORS || '').toLowerCase() === 'true'
const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (useEmulators ? 'demo-api-key' : ''),
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (useEmulators ? 'demo-project.firebaseapp.com' : ''),
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || (useEmulators ? 'demo-project' : ''),
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || (useEmulators ? 'demo-project.appspot.com' : ''),
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || (useEmulators ? '000000000000' : ''),
	appId: import.meta.env.VITE_FIREBASE_APP_ID || (useEmulators ? 'demo-app-id' : ''),
}
export const isFirebaseConfigured = useEmulators || Object.values(firebaseConfig).every(Boolean)
const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null
export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null
export const storage = app ? getStorage(app) : null
export const functions = app ? getFunctions(app) : null
export const isUsingFirebaseEmulators = useEmulators

if (useEmulators && auth && db && functions) {
	connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
	connectFirestoreEmulator(db, '127.0.0.1', 8080)
	connectFunctionsEmulator(functions, '127.0.0.1', 5001)
}

export const firebaseSetupError = 'Firebase is not configured. Copy .env.example to .env and add your Firebase web app values.'
