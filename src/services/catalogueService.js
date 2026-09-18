import { collection, doc, getDoc, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase/config'
import { getMockCollection, getMockRecord, subscribeStore } from '../data/mockStore'
import { shouldUseMockStore } from '../firebase/mode'

export const subscribeCatalogue = (callback, count = 48) => {
  if (shouldUseMockStore() || !db) {
    return subscribeStore(store => {
      const items = (store.catalogue || []).slice(0, count)
      callback(items)
    })
  }
  try {
    return onSnapshot(
      query(collection(db, 'catalogue'), orderBy('updatedAt', 'desc'), limit(count)),
      snap => callback(snap.docs.map(x => ({ id: x.id, ...x.data() }))),
      error => {
        console.warn('Firestore subscribeCatalogue error:', error?.message || error)
        const items = (getMockCollection('catalogue') || []).slice(0, count)
        callback(items)
      },
    )
  } catch (error) {
    console.warn('Firestore subscribeCatalogue sync error:', error?.message || error)
    const items = (getMockCollection('catalogue') || []).slice(0, count)
    callback(items)
    return () => {}
  }
}

export const getCatalogueListing = async id => {
  if (shouldUseMockStore() || !db) {
    return getMockRecord('catalogue', id)
  }
  try {
    const snap = await getDoc(doc(db, 'catalogue', id))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  } catch (error) {
    console.warn(`Firestore getCatalogueListing error on ${id}:`, error?.message || error)
    return getMockRecord('catalogue', id)
  }
}

