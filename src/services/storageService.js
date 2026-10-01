import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from '../firebase/config'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

export function validateFile(file, { allowedTypes = ALLOWED_TYPES, maxSize = MAX_FILE_SIZE_BYTES } = {}) {
  if (!file) throw new Error('No file selected.')
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type (${file.type || 'unknown'}). Allowed: JPG, PNG, WEBP, PDF.`)
  }
  if (file.size > maxSize) {
    const maxMb = Math.round(maxSize / (1024 * 1024))
    throw new Error(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed is ${maxMb}MB.`)
  }
  return true
}

export async function uploadFile(storagePath, file) {
  validateFile(file)

  if (storage) {
    try {
      const storageRef = ref(storage, storagePath)
      const snapshot = await uploadBytes(storageRef, file)
      const downloadUrl = await getDownloadURL(snapshot.ref)
      return {
        url: downloadUrl,
        name: file.name,
        size: file.size,
        type: file.type,
      }
    } catch (err) {
      console.warn('Firebase storage upload failed, using local reader fallback:', err?.message || err)
    }
  }

  // Fallback if storage not enabled: convert to base64 data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve({
        url: reader.result,
        name: file.name,
        size: file.size,
        type: file.type,
      })
    }
    reader.onerror = () => reject(new Error('Failed to read file locally.'))
    reader.readAsDataURL(file)
  })
}

export async function uploadPrescription(userId, file) {
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const path = `prescriptions/${userId || 'guest'}/${Date.now()}_${safeName}`
  return uploadFile(path, file)
}

export async function uploadBatchImage(batchId, file) {
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const path = `batches/${batchId || 'common'}/${Date.now()}_${safeName}`
  return uploadFile(path, file)
}

export async function uploadDrugImage(drugId, file) {
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const path = `drugs/${drugId || 'new'}/${Date.now()}_${safeName}`
  return uploadFile(path, file)
}
