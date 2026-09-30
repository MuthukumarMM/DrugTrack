import { collection, doc, onSnapshot, query, where, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'
import { createTrustedShipment, updateTrustedShipmentStatus } from './functionsService'
import { getMockCollection, subscribeStore } from '../data/mockStore'
import { shouldUseMockStore } from '../firebase/mode'

export const createShipment = async data => {
  return createTrustedShipment(data)
}

export const subscribeShipment = (id, cb) => {
  if (shouldUseMockStore() || !db) {
    return subscribeStore(store => {
      const shp = (store.shipments || []).find(s => s.id === id || s.shipmentNumber === id) || null
      cb(shp)
    })
  }
  try {
    return onSnapshot(
      doc(db, 'shipments', id),
      s => cb(s.exists() ? { id: s.id, ...s.data() } : null),
      error => {
        console.warn(`Firestore subscribeShipment error for ${id}:`, error?.message || error)
        const shp = (getMockCollection('shipments') || []).find(s => s.id === id || s.shipmentNumber === id) || null
        cb(shp)
      },
    )
  } catch (error) {
    console.warn(`Firestore subscribeShipment sync error for ${id}:`, error?.message || error)
    const shp = (getMockCollection('shipments') || []).find(s => s.id === id || s.shipmentNumber === id) || null
    cb(shp)
    return () => {}
  }
}

export const subscribeAssignedShipments = (uid, cb) => {
  if (shouldUseMockStore() || !db) {
    return subscribeStore(store => {
      const list = (store.shipments || []).filter(s => s.assignedDeliveryStaffId === uid)
      cb(list)
    })
  }
  try {
    return onSnapshot(
      query(collection(db, 'shipments'), where('assignedDeliveryStaffId', '==', uid), orderBy('updatedAt', 'desc')),
      s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      error => {
        console.warn(`Firestore subscribeAssignedShipments error for ${uid}:`, error?.message || error)
        const list = (getMockCollection('shipments') || []).filter(s => s.assignedDeliveryStaffId === uid)
        cb(list)
      },
    )
  } catch (error) {
    console.warn(`Firestore subscribeAssignedShipments sync error for ${uid}:`, error?.message || error)
    const list = (getMockCollection('shipments') || []).filter(s => s.assignedDeliveryStaffId === uid)
    cb(list)
    return () => {}
  }
}

export const subscribeTrackingEvents = (id, cb) => {
  if (shouldUseMockStore() || !db) {
    return subscribeStore(store => {
      const events = (store.trackingEvents || []).filter(e => e.shipmentId === id)
      cb(events)
    })
  }
  try {
    return onSnapshot(
      query(collection(db, 'trackingEvents'), where('shipmentId', '==', id), orderBy('timestamp', 'desc')),
      s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      error => {
        console.warn(`Firestore subscribeTrackingEvents error for ${id}:`, error?.message || error)
        const events = (getMockCollection('trackingEvents') || []).filter(e => e.shipmentId === id)
        cb(events)
      },
    )
  } catch (error) {
    console.warn(`Firestore subscribeTrackingEvents sync error for ${id}:`, error?.message || error)
    const events = (getMockCollection('trackingEvents') || []).filter(e => e.shipmentId === id)
    cb(events)
    return () => {}
  }
}

export const updateTracking = (id, data) =>
  updateTrustedShipmentStatus({
    shipmentId: id,
    status: data.status,
    latitude: Number(data.currentLatitude || data.latitude),
    longitude: Number(data.currentLongitude || data.longitude),
    message: data.message || '',
    estimatedDelivery: data.estimatedDelivery || null,
  })

