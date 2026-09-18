import { createRecord, deleteRecord, getRecords, subscribeRecords, updateRecord, where, orderBy } from './firestoreCrud'

const C = 'drugBatches'

export const createBatch = async data => {
  const token =
    data.verificationToken ||
    `DT-VER-${String(data.batchNumber || 'BATCH').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const qrCodeUrl =
    data.qrCodeUrl ||
    `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(baseUrl + '/verify/' + token)}`

  return createRecord(C, {
    ...data,
    verificationToken: token,
    qrCodeUrl,
  })
}

export const updateBatch = (id, data) => updateRecord(C, id, data)
export const deleteBatch = id => deleteRecord(C, id)

export const getBatches = manufacturerId =>
  getRecords(C, manufacturerId ? [where('manufacturerId', '==', manufacturerId)] : [orderBy('createdAt', 'desc')])

export const subscribeBatches = (cb, manufacturerId) =>
  subscribeRecords(C, cb, manufacturerId ? [where('manufacturerId', '==', manufacturerId)] : [orderBy('createdAt', 'desc')])
