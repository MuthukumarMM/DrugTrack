import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase/config'
import { subscribeStore } from '../data/mockStore'
import { shouldUseMockStore } from '../firebase/mode'

export const subscribeShipmentReviews = (shipmentIds, callback) => {
  const ids = new Set((shipmentIds || []).filter(Boolean))
  if (shouldUseMockStore() || !db) {
    return subscribeStore(store => {
      callback((store.reviews || []).filter(review => ids.has(review.shipmentId)))
    })
  }

  if (!ids.size) {
    callback([])
    return () => {}
  }

  const reviewMap = new Map()
  const unsubscribe = [...ids].map(shipmentId => onSnapshot(
    query(collection(db, 'reviews'), where('shipmentId', '==', shipmentId)),
    snapshot => {
      snapshot.docs.forEach(item => reviewMap.set(item.id, { id: item.id, ...item.data() }))
      callback([...reviewMap.values()])
    },
    error => console.warn(`Firestore review subscription error for ${shipmentId}:`, error?.message || error),
  ))

  return () => unsubscribe.forEach(stop => stop())
}
