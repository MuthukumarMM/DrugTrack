import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const projectId = process.env.GCLOUD_PROJECT || 'drugtrack-new'
const authUrl = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key'
const functionsUrl = `http://127.0.0.1:5001/${projectId}/us-central1`
const password = 'TestPass123!'

initializeApp({ projectId })
const db = getFirestore()

async function createAuthUser(email) {
  const response = await fetch(authUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  })
  const result = await response.json()
  if (!response.ok) throw new Error(`Auth emulator user creation failed: ${JSON.stringify(result)}`)
  return result
}

async function callFunction(name, token, data) {
  const response = await fetch(`${functionsUrl}/${name}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ data }),
  })
  const result = await response.json()
  if (!response.ok || result.error) throw new Error(`${name} failed: ${JSON.stringify(result)}`)
  return result.result
}

const customer = await createAuthUser(`customer-${Date.now()}@emulator.local`)
const manufacturer = await createAuthUser(`manufacturer-${Date.now()}@emulator.local`)
const inventoryId = `inventory-${Date.now()}`
const drugId = `drug-${Date.now()}`
const batchId = `batch-${Date.now()}`
const cartId = customer.localId

await db.doc(`users/${customer.localId}`).set({ uid: customer.localId, role: 'CUSTOMER', status: 'ACTIVE' })
await db.doc(`users/${manufacturer.localId}`).set({ uid: manufacturer.localId, role: 'MANUFACTURER', status: 'ACTIVE' })
await db.doc(`drugs/${drugId}`).set({ name: 'Emulator Test Medicine', manufacturerId: manufacturer.localId, status: 'ACTIVE' })
await db.doc(`drugBatches/${batchId}`).set({ drugId, manufacturerId: manufacturer.localId, batchNumber: 'EMU-001', expiryDate: '2030-01-01', status: 'ACTIVE', qualityStatus: 'APPROVED' })
await db.doc(`inventory/${inventoryId}`).set({ drugId, batchId, ownerId: manufacturer.localId, ownerType: 'MANUFACTURER', quantity: 10, reservedQuantity: 0, sellingPrice: 25, expiryDate: '2030-01-01' })
await db.doc(`carts/${cartId}`).set({ customerId: customer.localId, items: [{ inventoryId, quantity: 2, unitPrice: 25 }] })

const orderResult = await callFunction('createOrder', customer.idToken, {
  address: { fullName: 'Emulator Customer', phone: '9999999999', addressLine1: '1 Test Street', city: 'Pune', state: 'Maharashtra', postalCode: '411001', country: 'India' },
  paymentMethod: 'CASH_ON_DELIVERY',
})

const orderId = orderResult.orderId
const created = (await db.doc(`orders/${orderId}`).get()).data()
if (!created || created.manufacturerId !== manufacturer.localId || created.orderStatus !== 'PENDING') {
  throw new Error(`Created order contract failed: ${JSON.stringify(created)}`)
}

await callFunction('updateOrderStatus', manufacturer.idToken, { orderId, status: 'UNDER_REVIEW' })
await callFunction('updateOrderStatus', manufacturer.idToken, { orderId, status: 'APPROVED' })

const approved = (await db.doc(`orders/${orderId}`).get()).data()
if (approved.orderStatus !== 'APPROVED' || approved.status !== 'APPROVED') {
  throw new Error(`Approval contract failed: ${JSON.stringify(approved)}`)
}

console.log(JSON.stringify({ ok: true, collection: 'orders', orderId, orderNumber: approved.orderNumber, manufacturerId: approved.manufacturerId, status: approved.orderStatus }))
