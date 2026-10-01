import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase/config'
import { subscribeStore } from '../data/mockStore'
import { shouldUseMockStore } from '../firebase/mode'

export const subscribeContactMessages = callback => {
  if (shouldUseMockStore() || !db) {
    return subscribeStore(store => callback(store.contactMessages || []))
  }
  return onSnapshot(
    query(collection(db, 'contactMessages'), orderBy('createdAt', 'desc')),
    snapshot => callback(snapshot.docs.map(item => ({ id: item.id, ...item.data() }))),
    error => {
      console.warn('Firestore contact message subscription error:', error?.message || error)
      callback([])
    },
  )
}
