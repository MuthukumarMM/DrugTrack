import { collection, doc, onSnapshot, query, where, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'
import { createTrustedShipment, updateTrustedShipmentStatus } from './functionsService'
import { getMockCollection, subscribeStore } from '../data/mockStore'
import { shouldUseMockStore } from '../firebase/mode'
import { MANUFACTURER_HUB } from '../constants/tracking'

export const geocodeAddress = async address => {
  const queryText = typeof address === 'string'
    ? address
    : [address?.addressLine1, address?.addressLine2, address?.city, address?.state, address?.postalCode, address?.country].filter(Boolean).join(', ')
  if (!queryText.trim()) return null
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=in&viewbox=77.55,8.90,77.95,8.55&q=${encodeURIComponent(queryText)}`)
    if (!response.ok) return null
    const results = await response.json()
    const first = results[0]
    if (!first) return null
    return { latitude: Number(first.lat), longitude: Number(first.lon), displayName: first.display_name }
  } catch (error) {
    console.warn('Unable to geocode delivery address:', error?.message || error)
    return null
  }
}

export const resolveShipmentCoordinates = async address => {
  const destination = await geocodeAddress(address)
  return {
    source: MANUFACTURER_HUB,
    destination: destination || { latitude: null, longitude: null, displayName: '' },
  }
}

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

