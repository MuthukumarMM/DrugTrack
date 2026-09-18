import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { getMockCart, setMockCart, subscribeStore } from '../data/mockStore'
import { shouldUseMockStore } from '../firebase/mode'

const total = items => items.reduce((s, x) => s + x.quantity * x.unitPrice, 0)

export const subscribeCart = (id, cb) => {
  if (shouldUseMockStore() || !db) {
    return subscribeStore(() => {
      cb(getMockCart(id))
    })
  }
  try {
    return onSnapshot(
      doc(db, 'carts', id),
      s => cb(s.exists() ? s.data() : { customerId: id, items: [], subtotal: 0 }),
      error => {
        console.warn(`Firestore subscribeCart error for ${id}:`, error?.message || error)
        cb(getMockCart(id))
      },
    )
  } catch (error) {
    console.warn(`Firestore subscribeCart sync error for ${id}:`, error?.message || error)
    cb(getMockCart(id))
    return () => {}
  }
}

export const addToCart = async (id, item) => {
  if (shouldUseMockStore() || !db) {
    const cart = getMockCart(id)
    const found = cart.items.find(x => x.inventoryId === item.inventoryId)
    const items = found
      ? cart.items.map(x => (x.inventoryId === item.inventoryId ? { ...x, quantity: x.quantity + item.quantity } : x))
      : [...cart.items, item]
    if (item.availableQuantity < (found ? found.quantity + item.quantity : item.quantity)) {
      throw Error('Insufficient stock available.')
    }
    return setMockCart(id, { customerId: id, items, subtotal: total(items) })
  }
  try {
    const s = await getDoc(doc(db, 'carts', id))
    const cart = s.exists() ? s.data() : { items: [] }
    const found = cart.items.find(x => x.inventoryId === item.inventoryId)
    const items = found
      ? cart.items.map(x => (x.inventoryId === item.inventoryId ? { ...x, quantity: x.quantity + item.quantity } : x))
      : [...cart.items, item]
    if (item.availableQuantity < (found ? found.quantity + item.quantity : item.quantity)) {
      throw Error('Insufficient stock available.')
    }
    return setDoc(doc(db, 'carts', id), { customerId: id, items, subtotal: total(items), updatedAt: serverTimestamp() })
  } catch (error) {
    console.warn(`Firestore addToCart error for ${id}:`, error?.message || error)
    const cart = getMockCart(id)
    const found = cart.items.find(x => x.inventoryId === item.inventoryId)
    const items = found
      ? cart.items.map(x => (x.inventoryId === item.inventoryId ? { ...x, quantity: x.quantity + item.quantity } : x))
      : [...cart.items, item]
    return setMockCart(id, { customerId: id, items, subtotal: total(items) })
  }
}

export const setCartQuantity = async (id, inventoryId, quantity) => {
  if (shouldUseMockStore() || !db) {
    const cart = getMockCart(id)
    const items = cart.items.map(x => (x.inventoryId === inventoryId ? { ...x, quantity } : x)).filter(x => x.quantity > 0)
    return setMockCart(id, { items, subtotal: total(items) })
  }
  try {
    const s = await getDoc(doc(db, 'carts', id))
    const items = s.data().items.map(x => (x.inventoryId === inventoryId ? { ...x, quantity } : x)).filter(x => x.quantity > 0)
    return updateDoc(doc(db, 'carts', id), { items, subtotal: total(items), updatedAt: serverTimestamp() })
  } catch (error) {
    console.warn(`Firestore setCartQuantity error for ${id}:`, error?.message || error)
    const cart = getMockCart(id)
    const items = cart.items.map(x => (x.inventoryId === inventoryId ? { ...x, quantity } : x)).filter(x => x.quantity > 0)
    return setMockCart(id, { items, subtotal: total(items) })
  }
}

export const clearCart = async id => {
  if (shouldUseMockStore() || !db) {
    return setMockCart(id, { customerId: id, items: [], subtotal: 0 })
  }
  try {
    return await setDoc(doc(db, 'carts', id), { customerId: id, items: [], subtotal: 0, updatedAt: serverTimestamp() }, { merge: true })
  } catch (error) {
    console.warn(`Firestore clearCart error for ${id}:`, error?.message || error)
    return setMockCart(id, { customerId: id, items: [], subtotal: 0 })
  }
}

