import { useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { createBatch, deleteBatch, subscribeBatches, updateBatch } from '../../services/batchService'
import RecordsPage from './RecordsPage'

const baseFields = [
  { name: 'drugId', label: 'Drug ID', required: true },
  { name: 'batchNumber', label: 'Batch Number', required: true },
  { name: 'manufacturingDate', label: 'Manufacturing Date', type: 'date', required: true },
  { name: 'expiryDate', label: 'Expiry Date', type: 'date', required: true },
  { name: 'quantityProduced', label: 'Quantity Produced', type: 'number', min: 1, required: true },
  { name: 'availableQuantity', label: 'Available Quantity', type: 'number', min: 0, required: true },
  { name: 'reservedQuantity', label: 'Reserved Quantity', type: 'number', min: 0, required: true },
  { name: 'unitPrice', label: 'Unit Price (Rs.)', type: 'number', min: 0, required: true },
]

export default function BatchPage({ admin = false }) {
  const { currentUser } = useAuth()
  const owner = admin ? undefined : currentUser?.uid

  const fields = useMemo(() => {
    if (admin) {
      return [{ name: 'manufacturerId', label: 'Manufacturer UID' }, ...baseFields]
    }
    return baseFields
  }, [admin])

  const validate = d => {
    const x = {
      ...d,
      manufacturerId: admin ? d.manufacturerId || currentUser?.uid : currentUser?.uid,
      quantityProduced: Number(d.quantityProduced),
      availableQuantity: Number(d.availableQuantity),
      reservedQuantity: Number(d.reservedQuantity || 0),
      unitPrice: Number(d.unitPrice),
      qualityStatus: d.qualityStatus || 'APPROVED',
      status: d.status || 'ACTIVE',
    }

    if (new Date(x.expiryDate) <= new Date(x.manufacturingDate)) {
      throw new Error('Expiry date must be after manufacturing date.')
    }
    if (x.availableQuantity > x.quantityProduced) {
      throw new Error('Available quantity cannot exceed quantity produced.')
    }
    if (x.reservedQuantity > x.availableQuantity) {
      throw new Error('Reserved quantity cannot exceed available quantity.')
    }

    return x
  }

  return (
    <RecordsPage
      title={admin ? 'Global Drug Batches' : 'Manufacturing Batches'}
      description="Validated pharmaceutical batch records with batch traceability, expiry stamps, and production metrics."
      fields={fields}
      subscribe={cb => subscribeBatches(cb, owner)}
      create={d => createBatch(validate(d))}
      update={(id, d) => updateBatch(id, validate(d))}
      remove={deleteBatch}
      defaults={{
        drugId: '',
        batchNumber: '',
        manufacturingDate: '',
        expiryDate: '',
        quantityProduced: '',
        availableQuantity: '',
        reservedQuantity: '0',
        unitPrice: '',
      }}
    />
  )
}
