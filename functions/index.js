import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { onDocumentCreated, onDocumentWritten } from 'firebase-functions/v2/firestore'
import { initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import QRCode from 'qrcode'
import nodemailer from 'nodemailer'
import crypto from 'node:crypto'
initializeApp()
const db = getFirestore()
const role = async uid => (await db.doc(`users/${uid}`).get()).data()?.role
const number = () => `DT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

export const syncCatalogue = onDocumentWritten('inventory/{inventoryId}', async event => {
  const listingRef=db.doc(`catalogue/${event.params.inventoryId}`)
  if (!event.data?.after.exists) return listingRef.delete()
  const inventory=event.data.after.data(), drugSnap=await db.doc(`drugs/${inventory.drugId}`).get()
  if (!drugSnap.exists || drugSnap.data().status!=='ACTIVE') return listingRef.delete()
  const drug=drugSnap.data(), available=Math.max(0,Number(inventory.quantity||0)-Number(inventory.reservedQuantity||0))
  return listingRef.set({inventoryId:event.params.inventoryId,drugId:inventory.drugId,batchId:inventory.batchId,name:drug.name,genericName:drug.genericName||'',brandName:drug.brandName||'',categoryId:drug.categoryId||'',dosageForm:drug.dosageForm||'',strength:drug.strength||'',imageUrl:drug.imageUrl||'',prescriptionRequired:!!drug.prescriptionRequired,price:Number(inventory.sellingPrice||drug.basePrice||0),availableQuantity:available,status:available?'IN_STOCK':'OUT_OF_STOCK',updatedAt:FieldValue.serverTimestamp()})
})

const historyActor = status => {
  if (['UNDER_REVIEW', 'APPROVED', 'PROCESSING', 'PACKED', 'READY_FOR_DISTRIBUTOR'].includes(status)) return 'MANUFACTURER'
  if (['DISTRIBUTOR_RECEIVED', 'DISTRIBUTOR_ACCEPTED', 'DISTRIBUTOR_PROCESSING', 'READY_FOR_DELIVERY'].includes(status)) return 'DISTRIBUTOR'
  if (['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status)) return 'DELIVERY_STAFF'
  if (['RECIPIENT_CONFIRMED', 'COMPLETED'].includes(status)) return 'RECIPIENT'
  return 'SYSTEM'
}

export const recordOrderStatusHistory = onDocumentWritten('orders/{orderId}', async event => {
  if (!event.data?.before.exists || !event.data.after.exists) return null
  const before = event.data.before.data()
  const after = event.data.after.data()
  const status = after.orderStatus || after.status
  if (!status || status === (before.orderStatus || before.status)) return null
  const history = after.orderHistory || []
  if (history.at(-1)?.status === status) return null
  return event.data.after.ref.update({
    orderHistory: [...history, {
      status,
      at: new Date().toISOString(),
      actorId: after.updatedBy || '',
      actorRole: historyActor(status),
      message: `Order moved to ${status.replaceAll('_', ' ').toLowerCase()}.`,
    }],
  })
})

export const sendContactMessageEmail = onDocumentCreated('contactMessages/{messageId}', async event => {
  const message = event.data?.data()
  if (!message) return
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !CONTACT_TO_EMAIL) {
    console.warn('Contact email skipped: SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and CONTACT_TO_EMAIL must be configured.')
    return
  }
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT || 587) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  })
  await transporter.sendMail({
    from: CONTACT_FROM_EMAIL || SMTP_USER,
    to: CONTACT_TO_EMAIL,
    replyTo: message.email || undefined,
    subject: `[DrugTrack Contact] ${message.subject || 'New message'}`,
    text: `Name: ${message.name || ''}\nEmail: ${message.email || ''}\nPhone: ${message.phone || ''}\n\n${message.message || ''}`,
  })
})

export const generateBatchVerification = onCall(async request=>{if(!request.auth)throw new HttpsError('unauthenticated','Sign in required.');const{batchId}=request.data||{},uid=request.auth.uid,userRole=await role(uid),batchRef=db.doc(`drugBatches/${batchId}`),batch=await batchRef.get();if(!batch.exists)throw new HttpsError('not-found','Batch not found.');if(!(userRole==='ADMIN'||(userRole==='MANUFACTURER'&&batch.data().manufacturerId===uid)))throw new HttpsError('permission-denied','Not authorized.');const drug=await db.doc(`drugs/${batch.data().drugId}`).get();if(!drug.exists)throw new HttpsError('failed-precondition','Drug record not found.');const token=crypto.randomBytes(24).toString('hex'),verificationRef=db.collection('batchVerifications').doc(token),safe={token,batchId,drugName:drug.data().name,brandName:drug.data().brandName||'',manufacturerName:batch.data().manufacturerName||'',batchNumber:batch.data().batchNumber,manufacturingDate:batch.data().manufacturingDate,expiryDate:batch.data().expiryDate,status:batch.data().status||'ACTIVE',qualityStatus:batch.data().qualityStatus||'PENDING',createdAt:FieldValue.serverTimestamp()};const png=await QRCode.toBuffer(JSON.stringify({type:'drugtrack-batch',token}));const file=getStorage().bucket().file(`qr/batches/${batchId}/${token}.png`);await file.save(png,{contentType:'image/png',metadata:{cacheControl:'public,max-age=31536000'}});await verificationRef.set({...safe,qrStoragePath:file.name});await batchRef.update({verificationToken:token,qrStoragePath:file.name,updatedAt:FieldValue.serverTimestamp()});return{token,verificationUrl:`/verify/${token}`}
})
export const verifyBatch = onCall(async request=>{const{token}=request.data||{};if(!token)throw new HttpsError('invalid-argument','Verification token required.');const snap=await db.doc(`batchVerifications/${token}`).get();if(!snap.exists)return{valid:false,status:'NOT_FOUND'};const x=snap.data(),expiry=x.expiryDate?new Date(x.expiryDate):null,status=expiry&&expiry<new Date()?'EXPIRED':x.status;await db.collection('verificationAttempts').add({token,batchId:x.batchId,status,createdAt:FieldValue.serverTimestamp()});return{valid:status==='ACTIVE'||status==='APPROVED',drugName:x.drugName,brandName:x.brandName,manufacturerName:x.manufacturerName,batchNumber:x.batchNumber,manufacturingDate:x.manufacturingDate,expiryDate:x.expiryDate,status}
})

export const createOrder = onCall(async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to place an order.')
  const uid = request.auth.uid
  const userRole = await role(uid)
  if (!['CUSTOMER', 'PHARMACY', 'HOSPITAL'].includes(userRole)) throw new HttpsError('permission-denied', 'This account cannot place orders.')
  const { address, paymentMethod = 'CASH_ON_DELIVERY', buyerName = '', orderTarget = 'MANUFACTURER' } = request.data || {}
  if (!address?.fullName || !address?.phone || !address?.addressLine1 || !address?.city || !address?.state || !address?.postalCode || !address?.country) throw new HttpsError('invalid-argument', 'A complete delivery address is required.')
  const cartRef = db.doc(`carts/${uid}`), orderRef = db.collection('orders').doc()
  await db.runTransaction(async tx => {
    const cart = await tx.get(cartRef), items = cart.exists ? cart.data().items || [] : []
    if (!items.length) throw new HttpsError('failed-precondition', 'Your cart is empty.')
    const trusted=[]
    for (const item of items) { const inventoryRef=db.doc(`inventory/${item.inventoryId}`), inventory=await tx.get(inventoryRef); if(!inventory.exists) throw new HttpsError('not-found','Inventory is unavailable.'); const stock=inventory.data(), available=Number(stock.quantity)-Number(stock.reservedQuantity||0); if(!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>available) throw new HttpsError('failed-precondition','Insufficient stock available.'); const drug=await tx.get(db.doc(`drugs/${stock.drugId}`)); if(!drug.exists||drug.data().status!=='ACTIVE') throw new HttpsError('failed-precondition','A medicine is unavailable.'); trusted.push({inventoryRef,stock,item:{inventoryId:item.inventoryId,drugId:stock.drugId,batchId:stock.batchId,manufacturerId:drug.data().manufacturerId,distributorId:drug.data().distributorId||stock.distributorId||(stock.ownerType==='DISTRIBUTOR'?stock.ownerId:null),sellerId:stock.ownerId,sellerType:stock.ownerType,quantity:item.quantity,unitPrice:Number(stock.sellingPrice),total:Number(stock.sellingPrice)*item.quantity,drugName:drug.data().name,imageUrl:drug.data().imageUrl||'',availableQuantity:available,reservedQuantity:Number(stock.reservedQuantity||0),expiryDate:stock.expiryDate||null,recallStatus:stock.recallStatus||'NOT_RECALLED'}}) }
    if(new Set(trusted.map(x=>x.item.sellerId)).size!==1) throw new HttpsError('failed-precondition','Checkout supports one seller at a time.')
    const distributorIds=trusted.map(x=>x.item.distributorId).filter(Boolean);if(new Set(distributorIds).size>1) throw new HttpsError('failed-precondition','Checkout supports one distributor at a time.');const distributorId=distributorIds[0]||null, subtotal=trusted.reduce((sum,x)=>sum+x.item.total,0), data={orderNumber:number(),customerId:uid,buyerId:uid,buyerName,buyerRole:userRole,orderTarget,sellerId:trusted[0].item.sellerId,sellerType:trusted[0].item.sellerType,manufacturerId:trusted[0].item.manufacturerId,distributorId,destinationType:userRole,destinationId:uid,items:trusted.map(x=>x.item),subtotal,deliveryFee:0,totalAmount:subtotal,paymentMethod,paymentStatus:'PENDING',status:'PENDING',orderStatus:'PENDING',orderHistory:[{status:'PENDING',at:FieldValue.serverTimestamp(),actorId:uid,actorRole:userRole,message:`${userRole} order placed for manufacturer approval.`}],deliveryAddress:address,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()}
    trusted.forEach(({inventoryRef,stock,item})=>tx.update(inventoryRef,{reservedQuantity:Number(stock.reservedQuantity||0)+item.quantity,updatedAt:FieldValue.serverTimestamp()}));tx.set(orderRef,data);tx.set(cartRef,{customerId:uid,items:[],subtotal:0,updatedAt:FieldValue.serverTimestamp()},{merge:true});tx.set(db.collection('notifications').doc(),{userId:uid,type:'ORDER_PLACED',title:'Order placed',message:`Your order ${data.orderNumber} was placed.`,relatedId:orderRef.id,isRead:false,createdAt:FieldValue.serverTimestamp()});tx.set(db.collection('auditLogs').doc(),{userId:uid,userRole,action:'CREATE_ORDER',entityType:'order',entityId:orderRef.id,description:`Created ${data.orderNumber}`,metadata:{},timestamp:FieldValue.serverTimestamp()})
  });return {orderId:orderRef.id}
})

const transitions = { PENDING:['UNDER_REVIEW','CANCELLED'], UNDER_REVIEW:['APPROVED','REJECTED','CANCELLED'], APPROVED:['PROCESSING'], PROCESSING:['PACKED','DISTRIBUTOR_PROCESSING','CANCELLED'], PACKED:['READY_FOR_DISTRIBUTOR'], READY_FOR_DISTRIBUTOR:['DISTRIBUTOR_RECEIVED'], DISTRIBUTOR_RECEIVED:['DISTRIBUTOR_ACCEPTED','REJECTED'], DISTRIBUTOR_ACCEPTED:['DISTRIBUTOR_PROCESSING'], DISTRIBUTOR_PROCESSING:['READY_FOR_DELIVERY'], READY_FOR_DELIVERY:[], DELIVERED:['RECIPIENT_CONFIRMED'], RECIPIENT_CONFIRMED:['COMPLETED'], REJECTED:[], COMPLETED:[], CANCELLED:[] }

const validationFailure = (code, message) => ({ code, message })

const validateOrderItems = async (tx, order) => {
  const failures=[]
  for (const item of order.items||[]) {
    const inventoryRef=db.doc(`inventory/${item.inventoryId}`), inventorySnap=await tx.get(inventoryRef)
    if (!inventorySnap.exists) { failures.push(validationFailure('OUT_OF_STOCK','Inventory record is unavailable.')); continue }
    const inventory=inventorySnap.data(), reserved=Number(inventory.reservedQuantity||0)
    if (reserved<Number(item.quantity||0)) failures.push(validationFailure('INSUFFICIENT_RESERVED_STOCK',`${item.drugName||'Medicine'} does not have enough reserved stock.`))
    const batchSnap=await tx.get(db.doc(`drugBatches/${item.batchId||inventory.batchId}`))
    if (!batchSnap.exists) { failures.push(validationFailure('BATCH_UNAVAILABLE',`${item.drugName||'Medicine'} batch is unavailable.`)); continue }
    const batch=batchSnap.data(), expiry=batch.expiryDate||inventory.expiryDate
    if (expiry&&new Date(expiry)<new Date()) failures.push(validationFailure('BATCH_EXPIRED',`${item.drugName||'Medicine'} batch has expired.`))
    if (batch.recalled===true||batch.recallStatus==='RECALLED'||batch.status==='RECALLED'||batch.qualityStatus==='RECALLED') failures.push(validationFailure('BATCH_RECALLED',`${item.drugName||'Medicine'} batch is recalled.`))
  }
  return failures
}

export const updateOrderStatus = onCall(async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required.')
  const { orderId, status, rejectionReason = '', validationReason = '' } = request.data || {}, uid=request.auth.uid, userRole=await role(uid)
  if (!orderId || !status) throw new HttpsError('invalid-argument', 'Order and status are required.')
  const orderRef=db.doc(`orders/${orderId}`)
  let result={ok:true,status}
  await db.runTransaction(async tx=>{const snap=await tx.get(orderRef);if(!snap.exists)throw new HttpsError('not-found','Order not found.');const order=snap.data(), isSeller=order.sellerId===uid, isManufacturer=order.manufacturerId===uid, isDistributor=order.distributorId===uid;const canReview=userRole==='MANUFACTURER'&&isManufacturer;const canDistributor=userRole==='DISTRIBUTOR'&&isDistributor;const canOperate=userRole==='ADMIN'||isSeller;if(!(canOperate||canReview||canDistributor))throw new HttpsError('permission-denied','You cannot update this order.');if(['UNDER_REVIEW','APPROVED','REJECTED','PROCESSING','PACKED','READY_FOR_DISTRIBUTOR'].includes(status)&&!(canReview||userRole==='ADMIN'))throw new HttpsError('permission-denied','Only the manufacturer or admin can update this stage.');if(['DISTRIBUTOR_RECEIVED','DISTRIBUTOR_ACCEPTED','DISTRIBUTOR_PROCESSING','READY_FOR_DELIVERY'].includes(status)&&!(canDistributor||userRole==='ADMIN'))throw new HttpsError('permission-denied','Only the assigned distributor can update this order.');if(status==='READY_FOR_DISTRIBUTOR'&&!order.distributorId)throw new HttpsError('failed-precondition','No distributor is assigned to this product.');const current=order.orderStatus||order.status;if(!transitions[current]?.includes(status))throw new HttpsError('failed-precondition','Invalid order status transition.');let failures=[];if(status==='UNDER_REVIEW'||status==='APPROVED')failures=await validateOrderItems(tx,order);if(status==='APPROVED'&&failures.length)throw new HttpsError('failed-precondition',`Validation failed: ${failures.map(item=>item.code).join(', ')}`,{failures});if(status==='REJECTED'&&(!String(rejectionReason).trim()||!String(validationReason).trim()))throw new HttpsError('invalid-argument','Rejection and validation reasons are required.');if(status==='CANCELLED'||status==='REJECTED'){for(const item of order.items||[]){const invRef=db.doc(`inventory/${item.inventoryId}`),inv=await tx.get(invRef);if(inv.exists)tx.update(invRef,{reservedQuantity:Math.max(0,Number(inv.data().reservedQuantity||0)-Number(item.quantity)),updatedAt:FieldValue.serverTimestamp()})}}const update={status,orderStatus:status,updatedAt:FieldValue.serverTimestamp()};if(status==='REJECTED'){update.rejectionReason=String(rejectionReason).trim();update.validationReason=String(validationReason).trim()}tx.update(orderRef,update);const recipients=new Set([order.customerId,order.manufacturerId,order.distributorId].filter(Boolean));recipients.delete(uid);for(const userId of recipients)tx.set(db.collection('notifications').doc(),{userId,type:`ORDER_${status}`,title:status==='REJECTED'?'Order rejected':'Order update',message:status==='REJECTED'?`Order ${order.orderNumber} was rejected: ${String(rejectionReason).trim()}`:`Order ${order.orderNumber} is ${status.replaceAll('_',' ').toLowerCase()}.`,relatedId:orderId,isRead:false,createdAt:FieldValue.serverTimestamp()});tx.set(db.collection('auditLogs').doc(),{userId:uid,userRole,action:`ORDER_${status}`,entityType:'order',entityId:orderId,description:`${status} ${order.orderNumber}`,metadata:{rejectionReason:String(rejectionReason).trim(),validationReason:String(validationReason).trim(),failures},timestamp:FieldValue.serverTimestamp()});result={ok:true,status,failures}});return result
})

export const createOrderShipment = onCall(async request=>{if(!request.auth)throw new HttpsError('unauthenticated','Sign in required.');const{orderId,carrierName,trackingNumber,estimatedDelivery,source={},destination={}}=request.data||{},uid=request.auth.uid,userRole=await role(uid),orderRef=db.doc(`orders/${orderId}`),order=await orderRef.get();if(!order.exists)throw new HttpsError('not-found','Order not found.');const data=order.data();if(!(userRole==='ADMIN'||data.distributorId===uid))throw new HttpsError('permission-denied','Only the assigned distributor can prepare this shipment.');if(data.orderStatus!=='READY_FOR_DELIVERY')throw new HttpsError('failed-precondition','Order is not ready for delivery.');const shipmentRef=db.collection('shipments').doc(),shipment={shipmentNumber:number(),orderId,orderNumber:data.orderNumber,customerId:data.customerId,recipient:data.deliveryAddress,sourceId:uid,sourceName:source.name||'Francis Xavier Engineering College',sourceAddress:source.address||'Francis Xavier Engineering College, Tirunelveli, Tamil Nadu, India',sourceLatitude:Number(source.latitude)||8.7139,sourceLongitude:Number(source.longitude)||77.7567,destinationId:data.customerId,destination:destination,destinationAddress:destination.displayName||'',destinationLatitude:Number(destination.latitude),destinationLongitude:Number(destination.longitude),distributorId:uid,assignedDeliveryStaffId:null,carrierName:carrierName||'DrugTrack Logistics',trackingNumber:trackingNumber||`DT-TRK-${String(Date.now()).slice(-6)}`,status:'ASSIGNED',estimatedDelivery:estimatedDelivery||'Not set',currentLatitude:Number(source.latitude)||8.7139,currentLongitude:Number(source.longitude)||77.7567,simulatedGps:false,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()};await db.runTransaction(async tx=>{tx.set(shipmentRef,shipment);tx.update(orderRef,{shipmentId:shipmentRef.id,updatedAt:FieldValue.serverTimestamp()});tx.set(db.collection('auditLogs').doc(),{userId:uid,userRole,action:'CREATE_SHIPMENT',entityType:'shipment',entityId:shipmentRef.id,description:`Created ${shipment.shipmentNumber}`,metadata:{orderId},timestamp:FieldValue.serverTimestamp()})});return{shipmentId:shipmentRef.id,shipmentNumber:shipment.shipmentNumber}
})

export const assignShipment = onCall(async request=>{if(!request.auth)throw new HttpsError('unauthenticated','Sign in required.');const{shipmentId,deliveryStaffId}=request.data||{},uid=request.auth.uid,userRole=await role(uid),ref=db.doc(`shipments/${shipmentId}`),snap=await ref.get();if(!snap.exists)throw new HttpsError('not-found','Shipment not found.');const shipment=snap.data(),staff=await db.doc(`users/${deliveryStaffId}`).get();if(!(userRole==='ADMIN'||shipment.distributorId===uid))throw new HttpsError('permission-denied','Not authorized.');if(!staff.exists||staff.data().role!=='DELIVERY_STAFF')throw new HttpsError('failed-precondition','A valid delivery staff account is required.');await ref.update({assignedDeliveryStaffId:deliveryStaffId,status:'ASSIGNED',updatedAt:FieldValue.serverTimestamp()});await db.collection('notifications').add({userId:deliveryStaffId,type:'DELIVERY_ASSIGNED',title:'Delivery assigned',message:`Shipment ${shipment.shipmentNumber} is assigned to you.`,relatedId:shipmentId,isRead:false,createdAt:FieldValue.serverTimestamp()});return{ok:true}
})

export const updateShipmentStatus = onCall(async request=>{if(!request.auth)throw new HttpsError('unauthenticated','Sign in required.');const{shipmentId,status,latitude,longitude,message,estimatedDelivery}=request.data||{},uid=request.auth.uid,userRole=await role(uid),ref=db.doc(`shipments/${shipmentId}`),snap=await ref.get();if(!snap.exists)throw new HttpsError('not-found','Shipment not found.');const shipment=snap.data(),isStaff=shipment.assignedDeliveryStaffId===uid,isDistributor=shipment.distributorId===uid;if(!(userRole==='ADMIN'||isStaff||isDistributor))throw new HttpsError('permission-denied','Not authorized to update this shipment.');const allowed={ASSIGNED:['ACCEPTED'],ACCEPTED:['PICKED_UP'],PICKED_UP:['IN_TRANSIT'],IN_TRANSIT:['OUT_FOR_DELIVERY'],OUT_FOR_DELIVERY:['DELIVERED'],DELIVERED:[]};if(!allowed[shipment.status]?.includes(status))throw new HttpsError('failed-precondition','Invalid shipment transition.');const lat=Number(latitude),lng=Number(longitude);await db.runTransaction(async tx=>{tx.update(ref,{status,currentLatitude:Number.isFinite(lat)?lat:null,currentLongitude:Number.isFinite(lng)?lng:null,estimatedDelivery:estimatedDelivery||shipment.estimatedDelivery||null,updatedAt:FieldValue.serverTimestamp()});tx.set(db.collection('trackingEvents').doc(),{shipmentId,status,latitude:Number.isFinite(lat)?lat:null,longitude:Number.isFinite(lng)?lng:null,message:message||`Shipment ${status.replaceAll('_',' ').toLowerCase()}`,timestamp:FieldValue.serverTimestamp(),updatedBy:uid,updatedByRole:userRole});const orderRef=db.doc(`orders/${shipment.orderId}`),order=await tx.get(orderRef);if(order.exists){const orderStatus=status==='DELIVERED'?'DELIVERED':status==='OUT_FOR_DELIVERY'?'READY_FOR_DELIVERY':order.data().orderStatus;tx.update(orderRef,{orderStatus:orderStatus,status:orderStatus,updatedAt:FieldValue.serverTimestamp()});tx.set(db.collection('notifications').doc(),{userId:order.data().customerId,type:`SHIPMENT_${status}`,title:'Shipment update',message:`Shipment ${shipment.shipmentNumber} is ${status.replaceAll('_',' ').toLowerCase()}.`,relatedId:shipment.orderId,isRead:false,createdAt:FieldValue.serverTimestamp()})}});return{ok:true,status}
})

export const confirmDelivery = onCall(async request=>{if(!request.auth)throw new HttpsError('unauthenticated','Sign in required.');const{orderId}=request.data||{},uid=request.auth.uid,ref=db.doc(`orders/${orderId}`),snap=await ref.get();if(!snap.exists)throw new HttpsError('not-found','Order not found.');const order=snap.data();if(order.customerId!==uid)throw new HttpsError('permission-denied','Only the recipient can confirm this order.');if(order.orderStatus!=='DELIVERED')throw new HttpsError('failed-precondition','The order has not been delivered.');await db.runTransaction(async tx=>{tx.update(ref,{status:'RECIPIENT_CONFIRMED',orderStatus:'RECIPIENT_CONFIRMED',recipientConfirmedAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});tx.set(db.collection('auditLogs').doc(),{userId:uid,userRole:'CUSTOMER',action:'RECIPIENT_CONFIRMED',entityType:'order',entityId:orderId,description:`Recipient confirmed ${order.orderNumber}`,metadata:{},timestamp:FieldValue.serverTimestamp()});if(order.distributorId)tx.set(db.collection('notifications').doc(),{userId:order.distributorId,type:'RECIPIENT_CONFIRMED',title:'Delivery confirmed',message:`The recipient confirmed order ${order.orderNumber}.`,relatedId:orderId,isRead:false,createdAt:FieldValue.serverTimestamp()})});return{ok:true}
})

export const createReview = onCall(async request=>{if(!request.auth)throw new HttpsError('unauthenticated','Sign in required.');const{orderId,shipmentId,deliveryRating,serviceRating,comment}=request.data||{},uid=request.auth.uid,deliveryScore=Number(deliveryRating),serviceScore=Number(serviceRating),orderRef=db.doc(`orders/${orderId}`),order=await orderRef.get();if(!order.exists||order.data().customerId!==uid)throw new HttpsError('permission-denied','Only the recipient can review this order.');if(order.data().orderStatus!=='RECIPIENT_CONFIRMED')throw new HttpsError('failed-precondition','Confirm receipt before reviewing.');if(![deliveryScore,serviceScore].every(score=>Number.isInteger(score)&&score>=1&&score<=5))throw new HttpsError('invalid-argument','Ratings must be between 1 and 5.');const existing=await db.collection('reviews').where('orderId','==',orderId).limit(1).get();if(!existing.empty)throw new HttpsError('already-exists','This order already has a review.');await db.runTransaction(async tx=>{tx.set(db.collection('reviews').doc(),{orderId,shipmentId:shipmentId||order.data().shipmentId||null,userId:uid,customerId:uid,deliveryRating:deliveryScore,serviceRating:serviceScore,comment:String(comment||'').trim(),createdAt:FieldValue.serverTimestamp()});tx.update(orderRef,{status:'COMPLETED',orderStatus:'COMPLETED',completedAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});tx.set(db.collection('auditLogs').doc(),{userId:uid,userRole:'CUSTOMER',action:'CREATE_REVIEW',entityType:'review',entityId:orderId,description:`Review submitted for ${order.data().orderNumber}`,metadata:{deliveryRating:deliveryScore,serviceRating:serviceScore},timestamp:FieldValue.serverTimestamp()});if(order.data().manufacturerId)tx.set(db.collection('notifications').doc(),{userId:order.data().manufacturerId,type:'ORDER_COMPLETED',title:'Order completed',message:`Order ${order.data().orderNumber} has been completed by the recipient.`,relatedId:orderId,isRead:false,createdAt:FieldValue.serverTimestamp()})});return{ok:true}
})

export const createShipment = onCall(async () => { throw new HttpsError('failed-precondition', 'Use createOrderShipment for the connected order workflow.') })

export const assignDeliveryStaff = onCall(async () => { throw new HttpsError('failed-precondition', 'Use assignShipment for the connected order workflow.') })

export const updateShipmentTracking = onCall(async () => { throw new HttpsError('failed-precondition', 'Use updateShipmentStatus for the connected order workflow.') })
