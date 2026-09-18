import { collection, doc, limit, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore'
import { db } from '../firebase/config'
import { getMockCollection, subscribeStore, updateMockRecord } from '../data/mockStore'
import { shouldUseMockStore } from '../firebase/mode'

export const subscribeNotifications = (uid, cb) => {
  if (shouldUseMockStore() || !db) {
    return subscribeStore(store => {
      const list = (store.notifications || []).filter(n => n.userId === uid)
      cb(list)
    })
  }
  try {
    const source = query(collection(db, 'notifications'), where('userId', '==', uid), orderBy('createdAt', 'desc'), limit(30))
    return onSnapshot(
      source,
      snap => cb(snap.docs.map(x => ({ id: x.id, ...x.data() }))),
      error => {
        console.warn(`Firestore subscribeNotifications error for ${uid}:`, error?.message || error)
        const list = (getMockCollection('notifications') || []).filter(n => n.userId === uid)
        cb(list)
      },
    )
  } catch (error) {
    console.warn(`Firestore subscribeNotifications sync error for ${uid}:`, error?.message || error)
    const list = (getMockCollection('notifications') || []).filter(n => n.userId === uid)
    cb(list)
    return () => {}
  }
}

export const markNotificationRead = async id => {
  if (shouldUseMockStore() || !db) {
    updateMockRecord('notifications', id, { isRead: true })
    return Promise.resolve()
  }
  try {
    return await updateDoc(doc(db, 'notifications', id), { isRead: true })
  } catch (error) {
    console.warn(`Firestore markNotificationRead error for ${id}:`, error?.message || error)
    updateMockRecord('notifications', id, { isRead: true })
    return Promise.resolve()
  }
}

