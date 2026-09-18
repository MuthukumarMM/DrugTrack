import { collection, doc, getDocs, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db } from '../firebase/config'
import { getMockCollection, getMockRecord, subscribeStore } from '../data/mockStore'
import { shouldUseMockStore } from '../firebase/mode'

const mapDocs = snapshot => snapshot.docs.map(item => ({ id: item.id, ...item.data() }))

export const subscribeOrders = (userId, callback, seller = false) => {
  if (shouldUseMockStore() || !db) {
    return subscribeStore(store => {
      const orders = (store.orders || []).filter(o => (seller ? o.sellerId === userId : o.customerId === userId))
      callback(orders)
    })
  }
  try {
    return onSnapshot(
      query(collection(db, 'orders'), where(seller ? 'sellerId' : 'customerId', '==', userId), orderBy('createdAt', 'desc'), limit(50)),
      snapshot => callback(mapDocs(snapshot)),
      error => {
        console.warn(`Firestore subscribeOrders error for ${userId}:`, error?.message || error)
        const orders = (getMockCollection('orders') || []).filter(o => (seller ? o.sellerId === userId : o.customerId === userId))
        callback(orders)
      },
    )
  } catch (error) {
    console.warn('Firestore subscribeOrders sync error:', error?.message || error)
    const orders = (getMockCollection('orders') || []).filter(o => (seller ? o.sellerId === userId : o.customerId === userId))
    callback(orders)
    return () => {}
  }
}

export const subscribeAllOrders = callback => {
  if (shouldUseMockStore() || !db) {
    return subscribeStore(store => {
      callback(store.orders || [])
    })
  }
  try {
    return onSnapshot(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100)),
      snapshot => callback(mapDocs(snapshot)),
      error => {
        console.warn('Firestore subscribeAllOrders error:', error?.message || error)
        callback(getMockCollection('orders') || [])
      },
    )
  } catch (error) {
    console.warn('Firestore subscribeAllOrders sync error:', error?.message || error)
    callback(getMockCollection('orders') || [])
    return () => {}
  }
}

export const subscribeOrder = (id, callback) => {
  if (shouldUseMockStore() || !db) {
    return subscribeStore(store => {
      const order = (store.orders || []).find(o => o.id === id || o.orderNumber === id) || null
      callback(order)
    })
  }
  try {
    return onSnapshot(
      doc(db, 'orders', id),
      snapshot => callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null),
      error => {
        console.warn(`Firestore subscribeOrder error for ${id}:`, error?.message || error)
        const order = (getMockCollection('orders') || []).find(o => o.id === id || o.orderNumber === id) || null
        callback(order)
      },
    )
  } catch (error) {
    console.warn(`Firestore subscribeOrder sync error for ${id}:`, error?.message || error)
    const order = (getMockCollection('orders') || []).find(o => o.id === id || o.orderNumber === id) || null
    callback(order)
    return () => {}
  }
}

export const getOrder = async id => {
  if (shouldUseMockStore() || !db) {
    return getMockRecord('orders', id) || (getMockCollection('orders') || []).find(o => o.orderNumber === id) || null
  }
  try {
    const snapshot = await getDocs(query(collection(db, 'orders'), where('__name__', '==', id)))
    return snapshot.docs[0] ? { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } : null
  } catch (error) {
    console.warn(`Firestore getOrder error for ${id}:`, error?.message || error)
    return getMockRecord('orders', id) || (getMockCollection('orders') || []).find(o => o.orderNumber === id) || null
  }
}
