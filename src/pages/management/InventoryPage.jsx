import { useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  createInventory,
  deleteInventory,
  expiryState,
  subscribeInventory,
  updateInventory,
} from '../../services/inventoryService'
import RecordsPage from './RecordsPage'

const baseFields = [
  { name: 'drugId', label: 'Drug ID', required: true },
  { name: 'batchId', label: 'Batch ID', required: true },
  { name: 'quantity', label: 'Quantity', type: 'number', min: 0, required: true },
  { name: 'reservedQuantity', label: 'Reserved Quantity', type: 'number', min: 0, required: true },
  { name: 'reorderLevel', label: 'Reorder Level', type: 'number', min: 0, required: true },
  { name: 'sellingPrice', label: 'Selling Price (Rs.)', type: 'number', min: 0, required: true },
  { name: 'storageLocation', label: 'Storage Location (Aisle/Bin)' },
  { name: 'expiryDate', label: 'Expiry Date', type: 'date', required: true },
  { name: 'department', label: 'Department / Section' },
  { name: 'emergencyStock', label: 'Emergency Reserve', type: 'number', min: 0 },
]

const adminFields = [
  { name: 'ownerType', label: 'Facility Type', required: true },
  { name: 'ownerId', label: 'Owner UID', required: true },
  ...baseFields,
]

export default function InventoryPage({ admin = false }) {
  const { currentUser, role } = useAuth()
  const fields = useMemo(() => (admin ? adminFields : baseFields), [admin])

  const clean = d => {
    const x = {
      ...d,
      ownerType: admin ? d.ownerType : role,
      ownerId: admin ? d.ownerId : currentUser?.uid,
      quantity: Number(d.quantity),
      reservedQuantity: Number(d.reservedQuantity || 0),
      reorderLevel: Number(d.reorderLevel || 0),
      sellingPrice: Number(d.sellingPrice),
      emergencyStock: Number(d.emergencyStock || 0),
      expiryStatus: expiryState(d.expiryDate),
    }

    if (x.reservedQuantity > x.quantity) {
      throw new Error('Reserved quantity cannot exceed total physical quantity.')
    }

    return x
  }

  const roleName = (role || '').replace(/_/g, ' ')

  return (
    <RecordsPage
      title={admin ? 'Global Inventory Records' : `${roleName} Inventory`}
      description="Private, real-time organization stock, shelf allocations, reorder thresholds, and batch tracking."
      fields={fields}
      subscribe={cb => subscribeInventory(cb, admin ? undefined : currentUser?.uid)}
      create={d => createInventory(clean(d))}
      update={(id, d) => updateInventory(id, clean(d))}
      remove={deleteInventory}
      defaults={{
        ownerType: '',
        ownerId: '',
        drugId: '',
        batchId: '',
        quantity: '',
        reservedQuantity: '0',
        reorderLevel: '10',
        sellingPrice: '',
        storageLocation: '',
        expiryDate: '',
        department: '',
        emergencyStock: '0',
      }}
    />
  )
}
