import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { createMockRecord } from '../data/mockStore'
import { shouldUseMockStore } from '../firebase/mode'

export const submitContactMessage = async data => {
  if (shouldUseMockStore() || !db) {
    createMockRecord('contactMessages', { ...data, emailStatus: 'STORED_FOR_REVIEW' })
    return Promise.resolve({ id: `msg-${Date.now()}` })
  }
  try {
    return await addDoc(collection(db, 'contactMessages'), { ...data, emailStatus: 'PENDING', createdAt: serverTimestamp() })
  } catch (error) {
    console.warn('Firestore submitContactMessage error:', error?.message || error)
    createMockRecord('contactMessages', data)
    return { id: `msg-${Date.now()}` }
  }
}

