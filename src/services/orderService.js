import { collection, doc, getDocs, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db } from '../firebase/config'
import { getMockCollection, getMockRecord, subscribeStore } from '../data/mockStore'
import { shouldUseMockStore } from '../firebase/mode'
import { normalizeOrderStatus } from '../constants/statuses'

const mapDocs = snapshot => snapshot.docs.map(item => {
  const record = { id: item.id, ...item.data() }
  const normalizedStatus = normalizeOrderStatus(record.orderStatus || record.status)
  return { ...record, orderStatus: normalizedStatus, status: normalizedStatus }
})

export const subscribeOrders = (userId, callback, seller = false, field) => {
  const ownerField = field || (seller ? 'sellerId' : 'customerId')
  if (shouldUseMockStore() || !db) {
    return subscribeStore(store => {
      const orders = (store.orders || []).filter(o => o[ownerField] === userId || (!seller && ownerField === 'customerId' && o.buyerId === userId)).map(order => {
        const normalizedStatus = normalizeOrderStatus(order.orderStatus || order.status)
        return { ...order, orderStatus: normalizedStatus, status: normalizedStatus }
      })
      callback(orders)
    })
  }
  try {
    return onSnapshot(
      query(collection(db, 'orders'), where(ownerField, '==', userId), orderBy('createdAt', 'desc'), limit(50)),
      snapshot => callback(mapDocs(snapshot)),
      error => {
        console.warn(`Firestore subscribeOrders error for ${userId}:`, error?.message || error)
        callback([])
      },
    )
  } catch (error) {
    console.warn('Firestore subscribeOrders sync error:', error?.message || error)
    callback([])
    return () => {}
  }
}

export const subscribeAllOrders = callback => {
  if (shouldUseMockStore() || !db) {
    return subscribeStore(store => {
      callback((store.orders || []).map(order => {
        const normalizedStatus = normalizeOrderStatus(order.orderStatus || order.status)
        return { ...order, orderStatus: normalizedStatus, status: normalizedStatus }
      }))
    })
  }
  try {
    return onSnapshot(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100)),
      snapshot => callback(mapDocs(snapshot)),
      error => {
        console.warn('Firestore subscribeAllOrders error:', error?.message || error)
        callback([])
      },
    )
  } catch (error) {
    console.warn('Firestore subscribeAllOrders sync error:', error?.message || error)
    callback([])
    return () => {}
  }
}

export const subscribeOrder = (id, callback) => {
  if (shouldUseMockStore() || !db) {
    return subscribeStore(store => {
      const order = (store.orders || []).find(o => o.id === id || o.orderNumber === id) || null
      if (!order) {
        callback(null)
        return
      }
      const normalizedStatus = normalizeOrderStatus(order.orderStatus || order.status)
      callback({ ...order, orderStatus: normalizedStatus, status: normalizedStatus })
    })
  }
  try {
    return onSnapshot(
      doc(db, 'orders', id),
      snapshot => callback(snapshot.exists() ? mapDocs({ docs: [snapshot] })[0] : null),
      error => {
        console.warn(`Firestore subscribeOrder error for ${id}:`, error?.message || error)
        callback(null)
      },
    )
  } catch (error) {
    console.warn(`Firestore subscribeOrder sync error for ${id}:`, error?.message || error)
    callback(null)
    return () => {}
  }
}

export const getOrder = async id => {
  if (shouldUseMockStore() || !db) {
    const order = getMockRecord('orders', id) || (getMockCollection('orders') || []).find(o => o.orderNumber === id) || null
    if (!order) return null
    const normalizedStatus = normalizeOrderStatus(order.orderStatus || order.status)
    return { ...order, orderStatus: normalizedStatus, status: normalizedStatus }
  }
  try {
    const snapshot = await getDocs(query(collection(db, 'orders'), where('__name__', '==', id)))
    return snapshot.docs[0] ? { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } : null
  } catch (error) {
    console.warn(`Firestore getOrder error for ${id}:`, error?.message || error)
    return null
  }
}
