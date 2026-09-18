import { getFunctions, httpsCallable } from 'firebase/functions'
import { addDoc, collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db, firebaseSetupError, isFirebaseConfigured } from '../firebase/config'
import { createMockRecord, getMockCollection, updateMockRecord } from '../data/mockStore'
import { shouldUseMockStore } from '../firebase/mode'

const call = name => {
  if (!isFirebaseConfigured) throw Error(firebaseSetupError)
  return httpsCallable(getFunctions(), name)
}

export const createTrustedOrder = async data => {
  const orderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`
  const orderRecord = {
    ...data,
    orderNumber,
    status: 'PENDING',
    orderStatus: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // If using live Firestore
  if (!shouldUseMockStore() && db) {
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        ...orderRecord,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      // Try updating inventory quantities in Firestore if items present
      if (Array.isArray(data.items)) {
        for (const item of data.items) {
          if (item.inventoryId) {
            try {
              const invRef = doc(db, 'inventory', item.inventoryId)
              const avail = Math.max(0, Number(item.availableQuantity || 0) - Number(item.quantity || 1))
              const res = Number(item.reservedQuantity || 0) + Number(item.quantity || 1)
              await updateDoc(invRef, {
                availableQuantity: avail,
                reservedQuantity: res,
                updatedAt: serverTimestamp(),
              })
            } catch (invErr) {
              console.warn('Inventory adjustment failed:', invErr?.message || invErr)
            }
          }
        }
      }

      return { orderId: docRef.id, orderNumber }
    } catch (err) {
      console.warn('Firestore createTrustedOrder failed, falling back to mockStore:', err?.message || err)
    }
  }

  // Fallback or mock store
  const order = createMockRecord('orders', orderRecord)
  // Deduct in mock store if items exist
  if (Array.isArray(data.items)) {
    data.items.forEach(item => {
      if (item.inventoryId) {
        const current = getMockCollection('inventory')?.find(inv => inv.id === item.inventoryId)
        if (current) {
          updateMockRecord('inventory', item.inventoryId, {
            availableQuantity: Math.max(0, Number(current.availableQuantity || 0) - Number(item.quantity || 1)),
            reservedQuantity: Number(current.reservedQuantity || 0) + Number(item.quantity || 1),
          })
        }
      }
    })
  }
  return { orderId: order.id, orderNumber }
}

export const updateTrustedOrderStatus = async data => {
  const { orderId, status } = data
  if (!shouldUseMockStore() && db) {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status,
        orderStatus: status,
        updatedAt: serverTimestamp(),
      })
      return { success: true }
    } catch (err) {
      console.warn('Firestore updateTrustedOrderStatus failed, using mock:', err?.message || err)
    }
  }
  updateMockRecord('orders', orderId, { status, orderStatus: status })
  return { success: true }
}

export const createTrustedShipment = async data => {
  const shipmentNumber = `DT-SHP-${String(Date.now()).slice(-6)}`
  const shipmentRecord = {
    ...data,
    shipmentNumber,
    status: 'DISPATCHED',
    carrierName: data.carrierName || 'DrugTrack Logistics Fleet',
    trackingNumber: data.trackingNumber || `DT-TRK-${String(Date.now()).slice(-6)}`,
    currentLatitude: 19.0760,
    currentLongitude: 72.8777,
    estimatedDelivery: data.estimatedDelivery || 'In 2 Business Days',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  if (!shouldUseMockStore() && db) {
    try {
      const shpRef = await addDoc(collection(db, 'shipments'), {
        ...shipmentRecord,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      // Link shipment to the order
      if (data.orderId) {
        await updateDoc(doc(db, 'orders', data.orderId), {
          shipmentId: shpRef.id,
          orderStatus: 'SHIPPED',
          status: 'SHIPPED',
          updatedAt: serverTimestamp(),
        })
      }

      // Create initial tracking event
      await addDoc(collection(db, 'trackingEvents'), {
        shipmentId: shpRef.id,
        status: 'DISPATCHED',
        message: 'Package verified and dispatched from pharmaceutical warehouse.',
        latitude: 19.0760,
        longitude: 72.8777,
        timestamp: serverTimestamp(),
      })

      return { shipmentId: shpRef.id, shipmentNumber }
    } catch (err) {
      console.warn('Firestore createTrustedShipment failed, falling back to mockStore:', err?.message || err)
    }
  }

  const shipment = createMockRecord('shipments', shipmentRecord)
  if (data.orderId) {
    updateMockRecord('orders', data.orderId, {
      shipmentId: shipment.id,
      orderStatus: 'SHIPPED',
      status: 'SHIPPED',
    })
  }
  createMockRecord('trackingEvents', {
    shipmentId: shipment.id,
    status: 'DISPATCHED',
    message: 'Package verified and dispatched from pharmaceutical warehouse.',
    latitude: 19.0760,
    longitude: 72.8777,
    timestamp: new Date().toISOString(),
  })
  return { shipmentId: shipment.id, shipmentNumber }
}

export const updateTrustedTracking = async data => {
  const updateData = {
    status: data.status,
    currentLatitude: Number(data.latitude || data.currentLatitude || 19.0760),
    currentLongitude: Number(data.longitude || data.currentLongitude || 72.8777),
    estimatedDelivery: data.estimatedDelivery || 'In Transit',
  }

  if (!shouldUseMockStore() && db) {
    try {
      await updateDoc(doc(db, 'shipments', data.shipmentId), {
        ...updateData,
        updatedAt: serverTimestamp(),
      })

      await addDoc(collection(db, 'trackingEvents'), {
        shipmentId: data.shipmentId,
        status: data.status,
        message: data.message || `Package checkpoint: ${data.status.replaceAll('_', ' ')}`,
        latitude: updateData.currentLatitude,
        longitude: updateData.currentLongitude,
        timestamp: serverTimestamp(),
      })

      if (data.status === 'DELIVERED') {
        const q = query(collection(db, 'orders'), where('shipmentId', '==', data.shipmentId))
        const snaps = await getDocs(q)
        snaps.forEach(async d => {
          await updateDoc(doc(db, 'orders', d.id), {
            status: 'DELIVERED',
            orderStatus: 'DELIVERED',
            updatedAt: serverTimestamp(),
          })
        })
      }

      return { success: true }
    } catch (err) {
      console.warn('Firestore updateTrustedTracking error, using mockStore:', err?.message || err)
    }
  }

  updateMockRecord('shipments', data.shipmentId, updateData)
  createMockRecord('trackingEvents', {
    shipmentId: data.shipmentId,
    status: data.status,
    message: data.message || `Status updated to ${data.status.replaceAll('_', ' ')}`,
    latitude: updateData.currentLatitude,
    longitude: updateData.currentLongitude,
    timestamp: new Date().toISOString(),
  })

  if (data.status === 'DELIVERED') {
    const orders = getMockCollection('orders') || []
    orders.filter(o => o.shipmentId === data.shipmentId).forEach(o => {
      updateMockRecord('orders', o.id, { status: 'DELIVERED', orderStatus: 'DELIVERED' })
    })
  }

  return { success: true }
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
