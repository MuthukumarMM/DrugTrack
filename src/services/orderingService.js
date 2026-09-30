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
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore'
import { db } from '../firebase/config'

// ============ ORDER SERVICE ============

const ORDERS_COLLECTION = 'orders'

// Create an order
export const createOrder = async (orderData) => {
  try {
    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
      ...orderData,
      orderNumber: `ORD-${Date.now()}`,
      status: 'PENDING', // PENDING → CONFIRMED → PROCESSING → SHIPPED → IN_DELIVERY → DELIVERED
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: orderData.customerId,
      items: orderData.items || [],
      totalAmount: orderData.totalAmount || 0,
      deliveryAddress: orderData.deliveryAddress || '',
    })
    return { id: docRef.id, ...orderData }
  } catch (error) {
    console.error('Error creating order:', error)
    throw error
  }
}

// Get order by ID
export const getOrder = async (orderId) => {
  try {
    const docSnap = await getDoc(doc(db, ORDERS_COLLECTION, orderId))
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null
  } catch (error) {
    console.error('Error getting order:', error)
    throw error
  }
}

// Get orders for a customer
export const getCustomerOrders = async (customerId) => {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error getting customer orders:', error)
    throw error
  }
}

// Get orders for a manufacturer
export const getManufacturerOrders = async (manufacturerId) => {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('manufacturerId', '==', manufacturerId),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error getting manufacturer orders:', error)
    throw error
  }
}

// Get orders for a distributor
export const getDistributorOrders = async (distributorId) => {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('distributorId', '==', distributorId),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error getting distributor orders:', error)
    throw error
  }
}

// Get all orders (for admin)
export const getAllOrders = async () => {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error getting all orders:', error)
    throw error
  }
}

// Update order status
export const updateOrderStatus = async (orderId, status, additionalData = {}) => {
  try {
    await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
      status,
      updatedAt: serverTimestamp(),
      ...additionalData,
    })
    return true
  } catch (error) {
    console.error('Error updating order status:', error)
    throw error
  }
}

// Update order with tracking info
export const updateOrderTracking = async (orderId, trackingData) => {
  try {
    await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
      ...trackingData,
      updatedAt: serverTimestamp(),
    })
    return true
  } catch (error) {
    console.error('Error updating order tracking:', error)
    throw error
  }
}

// Get orders by status
export const getOrdersByStatus = async (status) => {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error getting orders by status:', error)
    throw error
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
    console.error('Error getting order history:', error)
    throw error
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
    console.error('Error getting order stats:', error)
    throw error
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
