// Pharmaceutical Ordering System Services

import { 
  collection, 
  addDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { createMockRecord, getMockCollection, getMockRecord, updateMockRecord } from '../data/mockStore'
import { shouldUseMockStore } from '../firebase/mode'

// ============ ORDER SERVICE ============

const ORDERS_COLLECTION = 'orders'

// Create an order
export const createOrder = async (orderData) => {
  try {
    if (shouldUseMockStore() || !db) {
      return createMockRecord(ORDERS_COLLECTION, {
        ...orderData,
        orderNumber: `ORD-${Date.now()}`,
        status: 'PENDING',
        items: orderData.items || [],
        totalAmount: orderData.totalAmount || 0,
        deliveryAddress: orderData.deliveryAddress || '',
      })
    }
    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
      ...orderData,
      orderNumber: `ORD-${Date.now()}`,
      status: 'PENDING',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: orderData.customerId,
      items: orderData.items || [],
      totalAmount: orderData.totalAmount || 0,
      deliveryAddress: orderData.deliveryAddress || '',
    })
    return { id: docRef.id, ...orderData }
  } catch (error) {
    console.warn('Error creating order in Firestore, falling back to mock:', error?.message || error)
    return createMockRecord(ORDERS_COLLECTION, {
      ...orderData,
      orderNumber: `ORD-${Date.now()}`,
      status: 'PENDING',
      items: orderData.items || [],
      totalAmount: orderData.totalAmount || 0,
      deliveryAddress: orderData.deliveryAddress || '',
    })
  }
}

// Get order by ID
export const getOrder = async (orderId) => {
  try {
    if (shouldUseMockStore() || !db) {
      return getMockRecord(ORDERS_COLLECTION, orderId)
    }
    const docSnap = await getDoc(doc(db, ORDERS_COLLECTION, orderId))
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null
  } catch (error) {
    console.warn('Error getting order from Firestore, falling back to mock:', error?.message || error)
    return getMockRecord(ORDERS_COLLECTION, orderId)
  }
}

// Get orders for a customer
export const getCustomerOrders = async (customerId) => {
  try {
    if (shouldUseMockStore() || !db) {
      return (getMockCollection(ORDERS_COLLECTION) || []).filter(o => o.customerId === customerId)
    }
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.warn('Error getting customer orders from Firestore, falling back to mock:', error?.message || error)
    return (getMockCollection(ORDERS_COLLECTION) || []).filter(o => o.customerId === customerId)
  }
}

// Get orders for a manufacturer
export const getManufacturerOrders = async (manufacturerId) => {
  try {
    if (shouldUseMockStore() || !db) {
      return (getMockCollection(ORDERS_COLLECTION) || []).filter(o => o.manufacturerId === manufacturerId || o.sellerId === manufacturerId)
    }
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('manufacturerId', '==', manufacturerId),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.warn('Error getting manufacturer orders from Firestore, falling back to mock:', error?.message || error)
    return (getMockCollection(ORDERS_COLLECTION) || []).filter(o => o.manufacturerId === manufacturerId || o.sellerId === manufacturerId)
  }
}

// Get orders for a distributor
export const getDistributorOrders = async (distributorId) => {
  try {
    if (shouldUseMockStore() || !db) {
      return (getMockCollection(ORDERS_COLLECTION) || []).filter(o => o.distributorId === distributorId || o.sellerId === distributorId)
    }
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('distributorId', '==', distributorId),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.warn('Error getting distributor orders from Firestore, falling back to mock:', error?.message || error)
    return (getMockCollection(ORDERS_COLLECTION) || []).filter(o => o.distributorId === distributorId || o.sellerId === distributorId)
  }
}

// Get all orders (for admin)
export const getAllOrders = async () => {
  try {
    if (shouldUseMockStore() || !db) {
      return getMockCollection(ORDERS_COLLECTION) || []
    }
    const q = query(
      collection(db, ORDERS_COLLECTION),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.warn('Error getting all orders from Firestore, falling back to mock:', error?.message || error)
    return getMockCollection(ORDERS_COLLECTION) || []
  }
}

// Update order status
export const updateOrderStatus = async (orderId, status, additionalData = {}) => {
  try {
    if (shouldUseMockStore() || !db) {
      updateMockRecord(ORDERS_COLLECTION, orderId, { status, ...additionalData })
      return true
    }
    await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
      status,
      updatedAt: serverTimestamp(),
      ...additionalData,
    })
    return true
  } catch (error) {
    console.warn('Error updating order status in Firestore, falling back to mock:', error?.message || error)
    updateMockRecord(ORDERS_COLLECTION, orderId, { status, ...additionalData })
    return true
  }
}

// Update order with tracking info
export const updateOrderTracking = async (orderId, trackingData) => {
  try {
    if (shouldUseMockStore() || !db) {
      updateMockRecord(ORDERS_COLLECTION, orderId, trackingData)
      return true
    }
    await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
      ...trackingData,
      updatedAt: serverTimestamp(),
    })
    return true
  } catch (error) {
    console.warn('Error updating order tracking in Firestore, falling back to mock:', error?.message || error)
    updateMockRecord(ORDERS_COLLECTION, orderId, trackingData)
    return true
  }
}

// Get orders by status
export const getOrdersByStatus = async (status) => {
  try {
    if (shouldUseMockStore() || !db) {
      return (getMockCollection(ORDERS_COLLECTION) || []).filter(o => o.status === status)
    }
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.warn('Error getting orders by status in Firestore, falling back to mock:', error?.message || error)
    return (getMockCollection(ORDERS_COLLECTION) || []).filter(o => o.status === status)
  }
}

// ============ ORDER HISTORY SERVICE ============

export const getOrderHistory = async (customerId) => {
  try {
    const orders = await getCustomerOrders(customerId)
    return orders.map(order => ({
      ...order,
      formattedDate: order.createdAt?.toDate?.().toLocaleDateString?.() || new Date(order.createdAt).toLocaleDateString(),
    }))
  } catch (error) {
    console.warn('Error getting order history, falling back to mock:', error?.message || error)
    const orders = (getMockCollection(ORDERS_COLLECTION) || []).filter(o => o.customerId === customerId)
    return orders.map(order => ({
      ...order,
      formattedDate: new Date(order.createdAt || Date.now()).toLocaleDateString(),
    }))
  }
}

// ============ ORDER STATISTICS ============

export const getOrderStats = async () => {
  try {
    const allOrders = await getAllOrders()
    return {
      totalOrders: allOrders.length,
      pending: allOrders.filter(o => o.status === 'PENDING').length,
      confirmed: allOrders.filter(o => o.status === 'CONFIRMED').length,
      processing: allOrders.filter(o => o.status === 'PROCESSING').length,
      shipped: allOrders.filter(o => o.status === 'SHIPPED').length,
      inDelivery: allOrders.filter(o => o.status === 'IN_DELIVERY').length,
      delivered: allOrders.filter(o => o.status === 'DELIVERED').length,
      totalRevenue: allOrders
        .filter(o => o.status === 'DELIVERED')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    }
  } catch (error) {
    console.warn('Error getting order stats, falling back to mock:', error?.message || error)
    const allOrders = getMockCollection(ORDERS_COLLECTION) || []
    return {
      totalOrders: allOrders.length,
      pending: allOrders.filter(o => o.status === 'PENDING').length,
      confirmed: allOrders.filter(o => o.status === 'CONFIRMED').length,
      processing: allOrders.filter(o => o.status === 'PROCESSING').length,
      shipped: allOrders.filter(o => o.status === 'SHIPPED').length,
      inDelivery: allOrders.filter(o => o.status === 'IN_DELIVERY').length,
      delivered: allOrders.filter(o => o.status === 'DELIVERED').length,
      totalRevenue: allOrders
        .filter(o => o.status === 'DELIVERED')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    }
  }
}


export default {
  createOrder,
  getOrder,
  getCustomerOrders,
  getManufacturerOrders,
  getDistributorOrders,
  getAllOrders,
  updateOrderStatus,
  updateOrderTracking,
  getOrdersByStatus,
  getOrderHistory,
  getOrderStats,
}
