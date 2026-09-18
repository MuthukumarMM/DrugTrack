import { db } from './config'
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { getMockRecord, createMockRecord, updateMockRecord } from '../data/mockStore'
import { shouldUseMockStore } from './mode'

export const getDocument = async (collection, id) => {
  if (shouldUseMockStore() || !db) {
    return getMockRecord(collection, id)
  }
  try {
    const snap = await getDoc(doc(db, collection, id))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  } catch (error) {
    console.warn(`Firestore getDocument failed for ${collection}/${id}:`, error?.message || error)
    return getMockRecord(collection, id)
  }
}

export const setDocument = async (collection, id, data, options = {}) => {
  if (shouldUseMockStore() || !db) {
    const existing = getMockRecord(collection, id)
    if (existing && options.merge) {
      updateMockRecord(collection, id, data)
      return Promise.resolve()
    }
    createMockRecord(collection, { ...data, id, uid: id })
    return Promise.resolve()
  }
  try {
    return await setDoc(doc(db, collection, id), data, options)
  } catch (error) {
    console.warn(`Firestore setDocument failed for ${collection}/${id}:`, error?.message || error)
    updateMockRecord(collection, id, data)
  }
}

export const updateDocument = async (collection, id, data) => {
  if (shouldUseMockStore() || !db) {
    updateMockRecord(collection, id, data)
    return Promise.resolve()
  }
  try {
    return await updateDoc(doc(db, collection, id), { ...data, updatedAt: serverTimestamp() })
  } catch (error) {
    console.warn(`Firestore updateDocument failed for ${collection}/${id}:`, error?.message || error)
    updateMockRecord(collection, id, data)
  }
}

export { serverTimestamp }
