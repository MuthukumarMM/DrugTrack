import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db } from '../firebase/config'
import { createMockRecord, deleteMockRecord, getMockCollection, getMockRecord, subscribeStore, updateMockRecord } from '../data/mockStore'
import { shouldUseMockStore } from '../firebase/mode'

export const createRecord = async (name, data) => {
  if (shouldUseMockStore() || !db) {
    return createMockRecord(name, data)
  }
  try {
    return await addDoc(collection(db, name), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  } catch (error) {
    console.warn(`Firestore createRecord failed on ${name}:`, error?.message || error)
    return createMockRecord(name, data)
  }
}

export const updateRecord = async (name, id, data) => {
  if (shouldUseMockStore() || !db) {
    updateMockRecord(name, id, data)
    return Promise.resolve()
  }
  try {
    return await updateDoc(doc(db, name, id), { ...data, updatedAt: serverTimestamp() })
  } catch (error) {
    console.warn(`Firestore updateRecord failed on ${name}/${id}:`, error?.message || error)
    updateMockRecord(name, id, data)
    return Promise.resolve()
  }
}

export const deleteRecord = async (name, id) => {
  if (shouldUseMockStore() || !db) {
    deleteMockRecord(name, id)
    return Promise.resolve()
  }
  try {
    return await deleteDoc(doc(db, name, id))
  } catch (error) {
    console.warn(`Firestore deleteRecord failed on ${name}/${id}:`, error?.message || error)
    deleteMockRecord(name, id)
    return Promise.resolve()
  }
}

export const getRecord = async (name, id) => {
  if (shouldUseMockStore() || !db) {
    return getMockRecord(name, id)
  }
  try {
    const s = await getDoc(doc(db, name, id))
    return s.exists() ? { id: s.id, ...s.data() } : null
  } catch (error) {
    console.warn(`Firestore getRecord failed on ${name}/${id}:`, error?.message || error)
    return getMockRecord(name, id)
  }
}

export const getRecords = async (name, constraints = []) => {
  if (shouldUseMockStore() || !db) {
    return getMockCollection(name) || []
  }
  try {
    const s = await getDocs(query(collection(db, name), ...constraints))
    return s.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (error) {
    console.warn(`Firestore getRecords failed on ${name}:`, error?.message || error)
    return getMockCollection(name) || []
  }
}

export const subscribeRecords = (name, callback, constraints = []) => {
  if (shouldUseMockStore() || !db) {
    return subscribeStore(store => {
      callback(store[name] || [])
    })
  }
  try {
    return onSnapshot(
      query(collection(db, name), ...constraints),
      s => callback(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      error => {
        console.warn(`Firestore onSnapshot failed on ${name}:`, error?.message || error)
        callback(getMockCollection(name) || [])
      },
    )
  } catch (error) {
    console.warn(`Firestore subscribeRecords sync error on ${name}:`, error?.message || error)
    callback(getMockCollection(name) || [])
    return () => {}
  }
}

export { where, orderBy }
