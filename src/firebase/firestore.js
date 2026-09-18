import { db, firebaseSetupError } from './config'
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
const requireDb = () => { if (!db) throw new Error(firebaseSetupError); return db }
export const getDocument = async (collection, id) => { const snap = await getDoc(doc(requireDb(), collection, id)); return snap.exists() ? { id: snap.id, ...snap.data() } : null }
export const setDocument = (collection, id, data, options = {}) => setDoc(doc(requireDb(), collection, id), data, options)
export const updateDocument = (collection, id, data) => updateDoc(doc(requireDb(), collection, id), { ...data, updatedAt: serverTimestamp() })
export { serverTimestamp }
