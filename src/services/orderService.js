import { collection, doc, getDocs, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db, firebaseSetupError } from '../firebase/config'

const need = () => {
  if (!db) throw Error(firebaseSetupError)
  return db
}

const mapDocs = snapshot => snapshot.docs.map(item => ({ id: item.id, ...item.data() }))

export const subscribeOrders = (userId, callback, seller = false) =>
  onSnapshot(
    query(collection(need(), 'orders'), where(seller ? 'sellerId' : 'customerId', '==', userId), orderBy('createdAt', 'desc'), limit(50)),
    snapshot => callback(mapDocs(snapshot)),
  )

export const subscribeAllOrders = callback =>
  onSnapshot(query(collection(need(), 'orders'), orderBy('createdAt', 'desc'), limit(100)), snapshot => callback(mapDocs(snapshot)))

export const subscribeOrder = (id, callback) =>
  onSnapshot(doc(need(), 'orders', id), snapshot => callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null))

export const getOrder = id =>
  getDocs(query(collection(need(), 'orders'), where('__name__', '==', id))).then(snapshot =>
    snapshot.docs[0] ? { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } : null,
  )
