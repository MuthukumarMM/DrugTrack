import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db } from '../firebase/config'
import { createMockRecord, deleteMockRecord, getMockCollection, subscribeStore, updateMockRecord } from '../data/mockStore'
import { shouldUseMockStore } from '../firebase/mode'

export const subscribeAddresses = (uid, cb) => {
  if (shouldUseMockStore() || !db) {
    return subscribeStore(store => {
      const list = (store.addresses || []).filter(a => a.userId === uid)
      cb(list)
    })
  }
  try {
    const col = query(collection(db, 'addresses'), where('userId', '==', uid))
    return onSnapshot(
      col,
      snap => cb(snap.docs.map(x => ({ id: x.id, ...x.data() }))),
      error => {
        console.warn(`Firestore subscribeAddresses error for ${uid}:`, error?.message || error)
        const list = (getMockCollection('addresses') || []).filter(a => a.userId === uid)
        cb(list)
      },
    )
  } catch (error) {
    console.warn(`Firestore subscribeAddresses sync error for ${uid}:`, error?.message || error)
    const list = (getMockCollection('addresses') || []).filter(a => a.userId === uid)
    cb(list)
    return () => {}
  }
}

export const saveAddress = async (uid, data, id) => {
  if (shouldUseMockStore() || !db) {
    if (id) {
      updateMockRecord('addresses', id, data)
      return Promise.resolve()
    }
    createMockRecord('addresses', { ...data, userId: uid })
    return Promise.resolve()
  }
  try {
    const col = collection(db, 'addresses')
    return id
      ? await updateDoc(doc(db, 'addresses', id), { ...data, userId: uid, updatedAt: serverTimestamp() })
      : await addDoc(col, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  } catch (error) {
    console.warn(`Firestore saveAddress error for ${uid}:`, error?.message || error)
    if (id) {
      updateMockRecord('addresses', id, data)
    } else {
      createMockRecord('addresses', { ...data, userId: uid })
    }
  }
}

export const removeAddress = async (uid, id) => {
  if (shouldUseMockStore() || !db) {
    deleteMockRecord('addresses', id)
    return Promise.resolve()
  }
  try {
    return await deleteDoc(doc(db, 'addresses', id))
  } catch (error) {
    console.warn(`Firestore removeAddress error for ${uid}/${id}:`, error?.message || error)
    deleteMockRecord('addresses', id)
  }
}

