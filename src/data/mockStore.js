// In-memory & local-storage mock store for demo mode and when Firebase is not yet configured.
import { demoAccounts, getDemoProfileFromAccount } from './demoAccounts'

const STORAGE_KEY = 'drugtrack_mock_db_v1'

const initialCategories = [
  { id: 'cat-antibiotics', name: 'Antibiotics', description: 'Essential antimicrobial agents for treating bacterial infections.', imageUrl: '', status: 'ACTIVE' },
  { id: 'cat-analgesics', name: 'Analgesics & Pain Relief', description: 'Formulations for acute and chronic pain management, fever reduction, and inflammation control.', imageUrl: '', status: 'ACTIVE' },
  { id: 'cat-antipyretics', name: 'Antipyretics', description: 'Temperature management medications and anti-inflammatory compounds.', imageUrl: '', status: 'ACTIVE' },
  { id: 'cat-cardio', name: 'Cardiovascular & Diabetes', description: 'Vital therapies for hypertension, cardiovascular disease, and metabolic control.', imageUrl: '', status: 'ACTIVE' },
  { id: 'cat-gastro', name: 'Gastrointestinal', description: 'Gastric acid suppressants, proton pump inhibitors, and digestive tract care.', imageUrl: '', status: 'ACTIVE' },
]

const initialDrugs = [
  {
    id: 'drug-amx-500',
    name: 'Amoxicillin Trihydrate 500mg',
    genericName: 'Amoxicillin',
    brandName: 'MoxCare 500',
    categoryId: 'cat-antibiotics',
    categoryName: 'Antibiotics',
    strength: '500mg',
    dosageForm: 'Capsule',
    manufacturerId: 'demo-manufacturer',
    manufacturerName: 'Mehta Pharma Labs',
    basePrice: 45,
    prescriptionRequired: true,
    distributorId: 'demo-distributor',
    description: 'High-potency broad-spectrum penicillin antibiotic manufactured according to stringent GMP standards for bacterial infections.',
    imageUrl: '',
    status: 'ACTIVE',
    createdAt: new Date('2025-01-05').toISOString(),
  },
  {
    id: 'drug-pcm-650',
    name: 'Paracetamol 650mg Fast-Release',
    genericName: 'Paracetamol',
    brandName: 'Doloplus 650',
    categoryId: 'cat-antipyretics',
    categoryName: 'Antipyretics',
    strength: '650mg',
    dosageForm: 'Tablet',
    manufacturerId: 'demo-manufacturer',
    manufacturerName: 'Mehta Pharma Labs',
    basePrice: 30,
    prescriptionRequired: false,
    distributorId: 'demo-distributor',
    description: 'Rapidly dissolving antipyretic formulation for severe fever, headache, body aches, and post-immunization discomfort.',
    imageUrl: '',
    status: 'ACTIVE',
    createdAt: new Date('2025-01-08').toISOString(),
  },
  {
    id: 'drug-ibu-400',
    name: 'Ibuprofen 400mg Anti-inflammatory',
    genericName: 'Ibuprofen',
    brandName: 'InflaStop 400',
    categoryId: 'cat-analgesics',
    categoryName: 'Analgesics & Pain Relief',
    strength: '400mg',
    dosageForm: 'Tablet',
    manufacturerId: 'demo-manufacturer',
    manufacturerName: 'Mehta Pharma Labs',
    basePrice: 35,
    prescriptionRequired: false,
    distributorId: 'demo-distributor',
    description: 'Non-steroidal anti-inflammatory formulation for relieving musculoskeletal pain, arthritis, dental pain, and soft tissue swelling.',
    imageUrl: '',
    status: 'ACTIVE',
    createdAt: new Date('2025-01-10').toISOString(),
  },
  {
    id: 'drug-asp-75',
    name: 'Aspirin Gastro-Resistant 75mg',
    genericName: 'Aspirin',
    brandName: 'CardioGuard 75',
    categoryId: 'cat-cardio',
    categoryName: 'Cardiovascular & Diabetes',
    strength: '75mg',
    dosageForm: 'Tablet',
    manufacturerId: 'demo-manufacturer',
    manufacturerName: 'Mehta Pharma Labs',
    basePrice: 15,
    prescriptionRequired: true,
    distributorId: 'demo-distributor',
    description: 'Low-dose enteric-coated antiplatelet therapy for cardiovascular protection, stroke prevention, and coronary artery maintenance.',
    imageUrl: '',
    status: 'ACTIVE',
    createdAt: new Date('2025-01-12').toISOString(),
  },
  {
    id: 'drug-cip-500',
    name: 'Ciprofloxacin 500mg Film-Coated',
    genericName: 'Ciprofloxacin',
    brandName: 'CiproMax 500',
    categoryId: 'cat-antibiotics',
    categoryName: 'Antibiotics',
    strength: '500mg',
    dosageForm: 'Tablet',
    manufacturerId: 'demo-manufacturer',
    manufacturerName: 'Mehta Pharma Labs',
    basePrice: 65,
    prescriptionRequired: true,
    description: 'Fluoroquinolone antibiotic intended for treatment of respiratory tract infections, severe UTI, and gastrointestinal pathogen infections.',
    imageUrl: '',
    status: 'ACTIVE',
    createdAt: new Date('2025-01-15').toISOString(),
  },
  {
    id: 'drug-ome-20',
    name: 'Omeprazole Delayed-Release 20mg',
    genericName: 'Omeprazole',
    brandName: 'OmezCare 20',
    categoryId: 'cat-gastro',
    categoryName: 'Gastrointestinal',
    strength: '20mg',
    dosageForm: 'Capsule',
    manufacturerId: 'demo-manufacturer',
    manufacturerName: 'Mehta Pharma Labs',
    basePrice: 40,
    prescriptionRequired: false,
    description: 'Selective proton pump inhibitor for treatment of gastroesophageal reflux disease, gastric ulcers, and erosive esophagitis.',
    imageUrl: '',
    status: 'ACTIVE',
    createdAt: new Date('2025-01-18').toISOString(),
  },
]

const initialBatches = [
  {
    id: 'batch-amx-001',
    batchNumber: 'BTH-AMX-2024-001',
    drugId: 'drug-amx-500',
    drugName: 'Amoxicillin Trihydrate 500mg',
    manufacturerId: 'demo-manufacturer',
    manufacturerName: 'Mehta Pharma Labs',
    manufacturingDate: '2025-01-10',
    expiryDate: '2027-01-09',
    quantity: 10000,
    remainingQuantity: 8400,
    verificationToken: 'DT-VER-AMX-8921',
    status: 'APPROVED',
    temperatureRange: '15°C - 25°C',
    labReportUrl: '',
    createdAt: new Date('2025-01-10').toISOString(),
  },
  {
    id: 'batch-pcm-002',
    batchNumber: 'BTH-PCM-2024-002',
    drugId: 'drug-pcm-650',
    drugName: 'Paracetamol 650mg Fast-Release',
    manufacturerId: 'demo-manufacturer',
    manufacturerName: 'Mehta Pharma Labs',
    manufacturingDate: '2025-02-01',
    expiryDate: '2027-02-01',
    quantity: 20000,
    remainingQuantity: 15200,
    verificationToken: 'DT-VER-PCM-4412',
    status: 'APPROVED',
    temperatureRange: '15°C - 25°C',
    createdAt: new Date('2025-02-01').toISOString(),
  },
  {
    id: 'batch-ibu-003',
    batchNumber: 'BTH-IBU-2024-003',
    drugId: 'drug-ibu-400',
    drugName: 'Ibuprofen 400mg Anti-inflammatory',
    manufacturerId: 'demo-manufacturer',
    manufacturerName: 'Mehta Pharma Labs',
    manufacturingDate: '2025-02-15',
    expiryDate: '2027-02-14',
    quantity: 15000,
    remainingQuantity: 12000,
    verificationToken: 'DT-VER-IBU-7731',
    status: 'APPROVED',
    temperatureRange: '20°C - 25°C',
    createdAt: new Date('2025-02-15').toISOString(),
  },
  {
    id: 'batch-pcm-004',
    batchNumber: 'BTH-PCM-2024-004',
    drugId: 'drug-pcm-650',
    drugName: 'Paracetamol 650mg Fast-Release',
    manufacturerId: 'demo-manufacturer',
    manufacturerName: 'Mehta Pharma Labs',
    manufacturingDate: '2025-03-01',
    expiryDate: '2027-03-01',
    quantity: 5000,
    remainingQuantity: 4800,
    verificationToken: 'DT-VER-PCM-4413',
    status: 'APPROVED',
    temperatureRange: '15°C - 25°C',
    createdAt: new Date('2025-03-01').toISOString(),
  },
]

const initialInventory = [
  {
    id: 'inv-amx-01',
    drugId: 'drug-amx-500',
    batchId: 'batch-amx-001',
    drugName: 'Amoxicillin Trihydrate 500mg',
    batchNumber: 'BTH-AMX-2024-001',
    ownerId: 'demo-pharmacy',
    ownerType: 'PHARMACY',
    ownerName: 'Nair Care Pharmacy',
    quantity: 250,
    reservedQuantity: 10,
    reorderLevel: 50,
    sellingPrice: 45,
    unitPrice: 45,
    expiryDate: '2027-01-09',
    status: 'IN_STOCK',
    createdAt: new Date('2025-02-10').toISOString(),
  },
  {
    id: 'inv-pcm-02',
    drugId: 'drug-pcm-650',
    batchId: 'batch-pcm-004',
    drugName: 'Paracetamol 650mg Fast-Release',
    batchNumber: 'BTH-PCM-2024-004',
    ownerId: 'demo-pharmacy',
    ownerType: 'PHARMACY',
    ownerName: 'Nair Care Pharmacy',
    quantity: 500,
    reservedQuantity: 20,
    reorderLevel: 100,
    sellingPrice: 30,
    unitPrice: 30,
    expiryDate: '2027-03-01',
    status: 'IN_STOCK',
    createdAt: new Date('2025-02-12').toISOString(),
  },
  {
    id: 'inv-ibu-03',
    drugId: 'drug-ibu-400',
    batchId: 'batch-ibu-003',
    drugName: 'Ibuprofen 400mg Anti-inflammatory',
    batchNumber: 'BTH-IBU-2024-003',
    ownerId: 'demo-pharmacy',
    ownerType: 'PHARMACY',
    ownerName: 'Nair Care Pharmacy',
    quantity: 320,
    reservedQuantity: 15,
    reorderLevel: 60,
    sellingPrice: 35,
    unitPrice: 35,
    expiryDate: '2027-02-14',
    status: 'IN_STOCK',
    createdAt: new Date('2025-02-14').toISOString(),
  },
  {
    id: 'inv-asp-04',
    drugId: 'drug-asp-75',
    batchId: 'batch-amx-001',
    drugName: 'Aspirin Gastro-Resistant 75mg',
    batchNumber: 'BTH-AMX-2024-001',
    ownerId: 'demo-hospital',
    ownerType: 'HOSPITAL',
    ownerName: 'CityCare Multispeciality Hospital',
    quantity: 600,
    reservedQuantity: 0,
    reorderLevel: 80,
    sellingPrice: 15,
    unitPrice: 15,
    expiryDate: '2027-01-09',
    status: 'IN_STOCK',
    createdAt: new Date('2025-02-15').toISOString(),
  },
  {
    id: 'inv-cip-05',
    drugId: 'drug-cip-500',
    batchId: 'batch-amx-001',
    drugName: 'Ciprofloxacin 500mg Film-Coated',
    batchNumber: 'BTH-AMX-2024-001',
    ownerId: 'demo-distributor',
    ownerType: 'DISTRIBUTOR',
    ownerName: 'Kapoor Health Distributors',
    quantity: 180,
    reservedQuantity: 0,
    reorderLevel: 40,
    sellingPrice: 65,
    unitPrice: 65,
    expiryDate: '2027-01-09',
    status: 'IN_STOCK',
    createdAt: new Date('2025-02-16').toISOString(),
  },
  {
    id: 'inv-ome-06',
    drugId: 'drug-ome-20',
    batchId: 'batch-amx-001',
    drugName: 'Omeprazole Delayed-Release 20mg',
    batchNumber: 'BTH-AMX-2024-001',
    ownerId: 'demo-pharmacy',
    ownerType: 'PHARMACY',
    ownerName: 'Nair Care Pharmacy',
    quantity: 220,
    reservedQuantity: 5,
    reorderLevel: 50,
    sellingPrice: 40,
    unitPrice: 40,
    expiryDate: '2027-01-09',
    status: 'IN_STOCK',
    createdAt: new Date('2025-02-18').toISOString(),
  },
]

const initialCatalogue = initialInventory.map(inv => {
  const drug = initialDrugs.find(d => d.id === inv.drugId) || {}
  const batch = initialBatches.find(b => b.id === inv.batchId) || {}
  return {
    id: `cat-${inv.id}`,
    inventoryId: inv.id,
    drugId: inv.drugId,
    batchId: inv.batchId,
    name: drug.name || inv.drugName,
    genericName: drug.genericName || '',
    brandName: drug.brandName || '',
    categoryId: drug.categoryId || 'cat-antibiotics',
    categoryName: drug.categoryName || 'General',
    strength: drug.strength || '',
    dosageForm: drug.dosageForm || '',
    price: inv.sellingPrice || 40,
    basePrice: drug.basePrice || inv.sellingPrice || 40,
    availableQuantity: inv.quantity - (inv.reservedQuantity || 0),
    quantity: inv.quantity,
    prescriptionRequired: Boolean(drug.prescriptionRequired),
    description: drug.description || '',
    sellerId: inv.ownerId,
    sellerType: inv.ownerType,
    sellerName: inv.ownerName,
    manufacturerId: drug.manufacturerId || 'demo-manufacturer',
    manufacturerName: drug.manufacturerName || 'Mehta Pharma Labs',
    distributorId: drug.distributorId || 'demo-distributor',
    distributorName: 'Kapoor Health Distributors',
    batchNumber: batch.batchNumber || inv.batchNumber,
    expiryDate: inv.expiryDate,
    updatedAt: new Date().toISOString(),
  }
})

const initialAddresses = [
  {
    id: 'addr-1',
    userId: 'demo-customer',
    fullName: 'Aisha Verma',
    phone: '+91 98765 11001',
    addressLine1: '12 Rosewood Avenue, Palayamkottai',
    addressLine2: 'Near Orchid Tower',
    city: 'Tirunelveli',
    state: 'Tamil Nadu',
    postalCode: '411045',
    country: 'India',
    isDefault: true,
  },
]

const initialOrders = [
  {
    id: 'ord-1001',
    orderNumber: 'ORD-1001',
    customerId: 'demo-customer',
    customerName: 'Aisha Verma',
    sellerId: 'demo-pharmacy',
    sellerName: 'Nair Care Pharmacy',
    status: 'UNDER_REVIEW',
    orderStatus: 'UNDER_REVIEW',
    items: [
      {
        drugId: 'drug-amx-500',
        drugName: 'Amoxicillin Trihydrate 500mg',
        quantity: 2,
        unitPrice: 45,
        batchNumber: 'BTH-AMX-2024-001',
      },
      {
        drugId: 'drug-pcm-650',
        drugName: 'Paracetamol 650mg Fast-Release',
        quantity: 1,
        unitPrice: 30,
        batchNumber: 'BTH-PCM-2024-002',
      },
    ],
    totalAmount: 120,
    deliveryAddress: '12 Rosewood Avenue, Baner, Pune, Maharashtra 411045',
    assignedDeliveryStaffId: 'demo-delivery-staff',
    deliveryStaffName: 'Kiran Shah',
    trackingNumber: 'DT-TRK-771822',
    currentLocation: 'Baner Main Road, 2.4 km away',
    estimatedDeliveryTime: '25 mins',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ord-1002',
    orderNumber: 'ORD-1002',
    customerId: 'demo-customer',
    customerName: 'Aisha Verma',
    sellerId: 'demo-pharmacy',
    sellerName: 'Nair Care Pharmacy',
    status: 'APPROVED',
    orderStatus: 'APPROVED',
    items: [
      {
        drugId: 'drug-ibu-400',
        drugName: 'Ibuprofen 400mg Anti-inflammatory',
        quantity: 1,
        unitPrice: 35,
        batchNumber: 'BTH-IBU-2024-003',
      },
    ],
    totalAmount: 35,
    deliveryAddress: '12 Rosewood Avenue, Baner, Pune, Maharashtra 411045',
    assignedDeliveryStaffId: 'demo-delivery-staff',
    deliveryStaffName: 'Kiran Shah',
    trackingNumber: 'DT-TRK-661204',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 80000000).toISOString(),
  },
]

const initialShipments = [
  {
    id: 'shp-1001',
    shipmentNumber: 'DT-SHP-771822',
    orderId: 'ord-1001',
    orderNumber: 'ORD-1001',
    assignedDeliveryStaffId: 'demo-delivery-staff',
    deliveryStaffName: 'Kiran Shah',
    recipientName: 'Aisha Verma',
    recipientPhone: '+91 98765 11001',
    destinationAddress: '12 Rosewood Avenue, Baner, Pune, Maharashtra',
    status: 'IN_DELIVERY',
    currentLatitude: 18.5596,
    currentLongitude: 73.7799,
    destinationLatitude: 18.5642,
    destinationLongitude: 73.7845,
    estimatedDelivery: '25 mins',
    temperature: '21.4°C (Optimal)',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const initialTrackingEvents = [
  {
    id: 'evt-1',
    shipmentId: 'shp-1001',
    status: 'DISPATCHED',
    message: 'Package picked up from Nair Care Pharmacy central depot.',
    latitude: 18.5204,
    longitude: 73.8567,
    timestamp: new Date(Date.now() - 3000000).toISOString(),
  },
  {
    id: 'evt-2',
    shipmentId: 'shp-1001',
    status: 'IN_TRANSIT',
    message: 'Cold chain integrity verified (21.4°C). In transit via delivery partner.',
    latitude: 18.552,
    longitude: 73.801,
    timestamp: new Date(Date.now() - 1500000).toISOString(),
  },
  {
    id: 'evt-3',
    shipmentId: 'shp-1001',
    status: 'OUT_FOR_DELIVERY',
    message: 'Out for delivery in Baner ward with rider Kiran Shah.',
    latitude: 18.5596,
    longitude: 73.7799,
    timestamp: new Date(Date.now() - 300000).toISOString(),
  },
]

const initialNotifications = [
  {
    id: 'notif-1',
    userId: 'demo-customer',
    title: 'Order Dispatched',
    message: 'Your order ORD-1001 containing Amoxicillin & Paracetamol is out for delivery.',
    isRead: false,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'notif-2',
    userId: 'demo-manufacturer',
    title: 'Batch Verification Approved',
    message: 'Quality control verified Batch BTH-AMX-2024-001. QR verification tokens are active.',
    isRead: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
]

// Build user table from demoAccounts
const initialUsers = demoAccounts.map(getDemoProfileFromAccount)

function loadStore() {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (raw) {
      return JSON.parse(raw)
    }
  } catch (e) {
    console.warn('Failed to load mock store from localStorage', e)
  }

  return {
    categories: initialCategories,
    drugs: initialDrugs,
    drugBatches: initialBatches,
    inventory: initialInventory,
    catalogue: initialCatalogue,
    addresses: initialAddresses,
    orders: initialOrders,
    shipments: initialShipments,
    trackingEvents: initialTrackingEvents,
    notifications: initialNotifications,
    users: initialUsers,
    carts: {},
    auditLogs: [],
  }
}

let store = loadStore()
const listeners = new Set()

function persistStore() {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
    }
  } catch (e) {
    console.warn('Failed to persist mock store', e)
  }
  notifySubscribers()
}

function notifySubscribers() {
  listeners.forEach(fn => {
    try {
      fn(store)
    } catch (err) {
      console.error('Error in mockStore listener:', err)
    }
  })
}

export function subscribeStore(fn) {
  listeners.add(fn)
  fn(store)
  return () => listeners.delete(fn)
}

export function getMockCollection(collectionName) {
  return store[collectionName] || []
}

export function getMockRecord(collectionName, id) {
  const col = store[collectionName]
  if (Array.isArray(col)) {
    return col.find(item => item.id === id || item.uid === id) || null
  }
  if (col && typeof col === 'object') {
    return col[id] || null
  }
  return null
}

export function createMockRecord(collectionName, data) {
  const id = data.id || `${collectionName.slice(0, 4)}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const record = { ...data, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }

  if (!store[collectionName]) {
    store[collectionName] = []
  }

  if (Array.isArray(store[collectionName])) {
    store[collectionName] = [record, ...store[collectionName]]
  } else {
    store[collectionName][id] = record
  }

  persistStore()
  return record
}

export function updateMockRecord(collectionName, id, updates) {
  const col = store[collectionName]
  if (Array.isArray(col)) {
    store[collectionName] = col.map(item => {
      if (item.id === id || item.uid === id) {
        return { ...item, ...updates, updatedAt: new Date().toISOString() }
      }
      return item
    })
  } else if (col && typeof col === 'object') {
    store[collectionName][id] = { ...col[id], ...updates, updatedAt: new Date().toISOString() }
  }

  persistStore()
  return true
}

export function deleteMockRecord(collectionName, id) {
  const col = store[collectionName]
  if (Array.isArray(col)) {
    store[collectionName] = col.filter(item => item.id !== id && item.uid !== id)
  } else if (col && typeof col === 'object') {
    delete store[collectionName][id]
  }

  persistStore()
  return true
}

export function getMockCart(customerId) {
  return store.carts?.[customerId] || { customerId, items: [], subtotal: 0 }
}

export function setMockCart(customerId, cartData) {
  if (!store.carts) store.carts = {}
  store.carts[customerId] = {
    ...cartData,
    customerId,
    updatedAt: new Date().toISOString(),
  }
  persistStore()
  return store.carts[customerId]
}

export function resetMockStore() {
  store = {
    categories: initialCategories,
    drugs: initialDrugs,
    drugBatches: initialBatches,
    inventory: initialInventory,
    catalogue: initialCatalogue,
    addresses: initialAddresses,
    orders: initialOrders,
    shipments: initialShipments,
    trackingEvents: initialTrackingEvents,
    notifications: initialNotifications,
    users: initialUsers,
    carts: {},
    auditLogs: [],
  }
  persistStore()
}
