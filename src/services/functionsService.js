import { getFunctions, httpsCallable } from 'firebase/functions'
import { collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db, firebaseSetupError, functions, isFirebaseConfigured } from '../firebase/config'
import { createMockRecord, getMockCollection, updateMockRecord } from '../data/mockStore'
import { shouldUseMockStore } from '../firebase/mode'
import { normalizeOrderStatus } from '../constants/statuses'

const call = name => {
  if (!isFirebaseConfigured) throw Error(firebaseSetupError)
  return httpsCallable(functions || getFunctions(), name)
}

const toCanonicalOrder = record => {
  const nextStatus = normalizeOrderStatus(record.orderStatus || record.status)
  return { ...record, status: nextStatus, orderStatus: nextStatus }
}

const appendOrderHistory = (order, status, actor = {}) => ({
  orderHistory:
    order.orderHistory?.at(-1)?.status === status
      ? order.orderHistory
      : [
          ...(order.orderHistory || []),
          {
            status,
            at: new Date().toISOString(),
            actorId: actor.actorId || '',
            actorRole: actor.actorRole || '',
            message: actor.message || `Order moved to ${status.replaceAll('_', ' ').toLowerCase()}.`,
          },
        ],
})

export const createTrustedOrder = async data => {
  const payload = {
    buyerId: data.buyerId || data.customerId || data.userId,
    buyerRole: data.buyerRole || 'CUSTOMER',
    orderTarget: data.orderTarget || 'MANUFACTURER',
    address: data.address || data.deliveryAddress || {},
    paymentMethod: data.paymentMethod || 'CASH_ON_DELIVERY',
    items: Array.isArray(data.items) ? data.items.map(item => ({
      inventoryId: item.inventoryId,
      drugId: item.drugId,
      batchId: item.batchId,
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unitPrice || item.price || 0),
      total: Number(item.total || (Number(item.quantity || 0) * Number(item.unitPrice || item.price || 0))),
      drugName: item.drugName || item.name || '',
      imageUrl: item.imageUrl || '',
    })) : [],
    subtotal: Number(data.subtotal || 0),
    totalAmount: Number(data.totalAmount || data.total || 0),
    deliveryAddress: data.address || data.deliveryAddress || {},
  }

  if (!shouldUseMockStore() && db && isFirebaseConfigured) {
    try {
      const fn = call('createOrder')
      const result = await fn(payload)
      const orderId = result?.data?.orderId
      const orderNumber = result?.data?.orderNumber
      return { orderId, orderNumber }
    } catch (err) {
      throw err
    }
  }

  const orderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`
  const firstItem = data.items?.[0] || {}
  const orderRecord = toCanonicalOrder({
    ...data,
    orderNumber,
    customerId: data.customerId || payload.buyerId,
    buyerId: payload.buyerId,
    buyerRole: payload.buyerRole,
    orderTarget: payload.orderTarget,
    destinationType: payload.buyerRole,
    destinationId: payload.buyerId,
    sellerId: data.sellerId || firstItem.sellerId || '',
    sellerType: data.sellerType || firstItem.sellerType || '',
    sellerName: data.sellerName || firstItem.sellerName || '',
    manufacturerId: data.manufacturerId || firstItem.manufacturerId || 'demo-manufacturer',
    manufacturerName: data.manufacturerName || firstItem.manufacturerName || 'Mehta Pharma Labs',
    distributorId: data.distributorId || firstItem.distributorId || 'demo-distributor',
    distributorName: data.distributorName || firstItem.distributorName || 'Kapoor Health Distributors',
    items: payload.items,
    subtotal: payload.subtotal,
    deliveryFee: Math.max(0, Number(data.totalAmount || 0) - payload.subtotal),
    totalAmount: payload.totalAmount,
    deliveryAddress: payload.deliveryAddress,
    paymentMethod: payload.paymentMethod,
    status: 'PENDING',
    orderStatus: 'PENDING',
    orderHistory: [{
      status: 'PENDING',
      at: new Date().toISOString(),
      actorId: payload.buyerId,
      actorRole: payload.buyerRole,
      message: 'Order placed and awaiting manufacturer review.',
    }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  const order = createMockRecord('orders', orderRecord)
  if (Array.isArray(data.items)) {
    data.items.forEach(item => {
      if (item.inventoryId) {
        const current = getMockCollection('inventory')?.find(inv => inv.id === item.inventoryId)
        if (current) {
          updateMockRecord('inventory', item.inventoryId, {
            reservedQuantity: Number(current.reservedQuantity || 0) + Number(item.quantity || 1),
          })
        }
      }
    })
  }
  return { orderId: order.id, orderNumber }
}

export const updateTrustedOrderStatus = async data => {
  const { orderId, status, rejectionReason, validationReason } = data
  const nextStatus = normalizeOrderStatus(status)
  if (!shouldUseMockStore() && db && isFirebaseConfigured) {
    try {
      const fn = call('updateOrderStatus')
      const result = await fn({ orderId, status: nextStatus, rejectionReason, validationReason })
      return result?.data || { success: true, status: nextStatus }
    } catch (err) {
      throw err
    }
  }
  const existing = getMockCollection('orders')?.find(order => order.id === orderId)
  const target = toCanonicalOrder({
    ...existing,
    status: nextStatus,
    orderStatus: nextStatus,
    rejectionReason,
    ...appendOrderHistory(existing || {}, nextStatus, {
      actorId: data.actorId,
      actorRole: data.actorRole,
      message: rejectionReason || undefined,
    }),
  })
  updateMockRecord('orders', orderId, target)
  return { success: true, status: nextStatus }
}

export const createTrustedShipment = async data => {
  if (!shouldUseMockStore() && db && isFirebaseConfigured) {
    const result = await call('createOrderShipment')({
      orderId: data.orderId,
      carrierName: data.carrierName,
      trackingNumber: data.trackingNumber,
      estimatedDelivery: data.estimatedDelivery,
    })
    return result.data
  }
  const order = getMockCollection('orders')?.find(item => item.id === data.orderId)
  const shipment = createMockRecord('shipments', {
    ...data,
    orderNumber: order?.orderNumber || data.orderId,
    customerId: order?.customerId || order?.buyerId || '',
    recipient: order?.deliveryAddress || {},
    shipmentNumber: `DT-SHP-${String(Date.now()).slice(-6)}`,
    status: 'ASSIGNED',
    simulatedGps: true,
  })
  updateMockRecord('orders', data.orderId, {
    shipmentId: shipment.id,
    orderStatus: 'READY_FOR_DELIVERY',
    status: 'READY_FOR_DELIVERY',
    ...appendOrderHistory(order || {}, 'READY_FOR_DELIVERY', { actorRole: 'DISTRIBUTOR' }),
  })
  return { shipmentId: shipment.id, shipmentNumber: shipment.shipmentNumber }
}

export const assignTrustedShipment = async data => {
  if (!shouldUseMockStore() && db && isFirebaseConfigured) return (await call('assignShipment')(data)).data
  updateMockRecord('shipments', data.shipmentId, { assignedDeliveryStaffId: data.deliveryStaffId, status: 'ASSIGNED' })
  return { ok: true }
}

export const updateTrustedShipmentStatus = async data => {
  if (!shouldUseMockStore() && db && isFirebaseConfigured) return (await call('updateShipmentStatus')(data)).data
  const shipment = getMockCollection('shipments')?.find(item => item.id === data.shipmentId)
  updateMockRecord('shipments', data.shipmentId, {
    status: data.status,
    currentLatitude: Number(data.latitude),
    currentLongitude: Number(data.longitude),
    estimatedDelivery: data.estimatedDelivery || null,
  })
  if (shipment?.orderId) {
    const order = getMockCollection('orders')?.find(item => item.id === shipment.orderId)
    const orderStatus = data.status === 'DELIVERED'
      ? 'DELIVERED'
      : ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(data.status)
        ? data.status
        : order?.orderStatus
    if (orderStatus && orderStatus !== order?.orderStatus) {
      updateMockRecord('orders', shipment.orderId, {
        status: orderStatus,
        orderStatus,
        ...appendOrderHistory(order || {}, orderStatus, { actorRole: 'DELIVERY_STAFF' }),
      })
    }
  }
  createMockRecord('trackingEvents', { shipmentId: data.shipmentId, status: data.status, message: data.message || '', timestamp: new Date().toISOString() })
  return { ok: true, status: data.status }
}

export const confirmTrustedDelivery = async orderId => {
  if (!shouldUseMockStore() && db && isFirebaseConfigured) return (await call('confirmDelivery')({ orderId })).data
  const order = getMockCollection('orders')?.find(item => item.id === orderId)
  updateMockRecord('orders', orderId, {
    orderStatus: 'RECIPIENT_CONFIRMED',
    status: 'RECIPIENT_CONFIRMED',
    ...appendOrderHistory(order || {}, 'RECIPIENT_CONFIRMED', { actorRole: 'RECIPIENT' }),
  })
  return { ok: true }
}

export const createTrustedReview = async data => {
  if (!shouldUseMockStore() && db && isFirebaseConfigured) return (await call('createReview')(data)).data
  const order = getMockCollection('orders')?.find(item => item.id === data.orderId)
  updateMockRecord('orders', data.orderId, {
    orderStatus: 'COMPLETED',
    status: 'COMPLETED',
    ...appendOrderHistory(order || {}, 'COMPLETED', { actorRole: 'RECIPIENT', message: 'Recipient rated the delivery and completed the order.' }),
  })
  createMockRecord('reviews', { ...data, userId: data.userId || 'demo-customer' })
  return { ok: true }
}

export const updateTrustedTracking = async data => {
  const updateData = {
    status: data.status,
    latitude: Number(data.latitude || data.currentLatitude),
    longitude: Number(data.longitude || data.currentLongitude),
    estimatedDelivery: data.estimatedDelivery || null,
    message: data.message || '',
  }

  return updateTrustedShipmentStatus({ shipmentId: data.shipmentId, ...updateData })
}

export const verifyBatch = async token => {
  const clean = (token || '').trim()
  if (!clean) {
    return { valid: false, status: 'INVALID_TOKEN', message: 'Please enter a valid verification token.' }
  }

  let found = null

  // 1. Try real Firestore first
  if (!shouldUseMockStore() && db) {
    try {
      const q1 = query(collection(db, 'drugBatches'), where('verificationToken', '==', clean))
      const snap1 = await getDocs(q1)
      if (!snap1.empty) {
        found = { id: snap1.docs[0].id, ...snap1.docs[0].data() }
      } else {
        const q2 = query(collection(db, 'drugBatches'), where('batchNumber', '==', clean))
        const snap2 = await getDocs(q2)
        if (!snap2.empty) {
          found = { id: snap2.docs[0].id, ...snap2.docs[0].data() }
        }
      }
    } catch (err) {
      console.warn('Firestore batch lookup error:', err?.message || err)
    }
  }

  // 2. Try mock collection if not found
  if (!found) {
    const batches = getMockCollection('drugBatches') || []
    found = batches.find(
      b =>
        b.verificationToken?.toLowerCase() === clean.toLowerCase() ||
        b.batchNumber?.toLowerCase() === clean.toLowerCase() ||
        b.id?.toLowerCase() === clean.toLowerCase(),
    )
  }

  // If found either in Firestore or MockStore
  if (found) {
    const isExpired = found.expiryDate && new Date(found.expiryDate) < new Date()
    return {
      valid: !isExpired,
      status: isExpired ? 'EXPIRED' : (found.status || 'VERIFIED_AUTHENTIC'),
      drugName: found.drugName || 'Verified Pharmaceutical Product',
      batchNumber: found.batchNumber || clean,
      manufacturerName: found.manufacturerName || 'GMP Certified Laboratory',
      manufacturingDate: found.manufacturingDate || '2025-01-01',
      expiryDate: found.expiryDate || '2027-01-01',
      temperatureRange: found.temperatureRange || '15°C - 25°C',
      verificationToken: clean,
      message: isExpired
        ? 'Warning: This batch has passed its certified expiry date and cannot be dispensed.'
        : 'Genuine pharmaceutical batch authenticated by DrugTrack security infrastructure.',
    }
  }

  // If not found anywhere -> Invalid token
  return {
    valid: false,
    status: 'INVALID_TOKEN',
    message: `No authentic batch record found matching verification token "${clean}". Please verify the QR code or serial number.`,
  }
}

export const generateBatchVerification = async batchId => {
  const token = `DT-VER-${String(batchId || 'BATCH').slice(-4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    (typeof window !== 'undefined' ? window.location.origin : '') + '/verify/' + token,
  )}`

  if (!shouldUseMockStore() && db) {
    try {
      await updateDoc(doc(db, 'drugBatches', batchId), {
        verificationToken: token,
        qrCodeUrl,
        updatedAt: serverTimestamp(),
      })
      return { token, qrCodeUrl }
    } catch (err) {
      console.warn('Firestore generateBatchVerification error, fallback to mock:', err?.message || err)
    }
  }

  updateMockRecord('drugBatches', batchId, { verificationToken: token, qrCodeUrl })
  return { token, qrCodeUrl }
}
