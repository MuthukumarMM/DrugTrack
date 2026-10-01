const fallbackImages = {
  'cat-antibiotics': '/medicine-images/antibiotic.svg',
  'cat-antipyretics': '/medicine-images/tablet.svg',
  'cat-analgesics': '/medicine-images/capsule.svg',
  'cat-cardio': '/medicine-images/heart.svg',
  'cat-gastro': '/medicine-images/medicine.svg',
}

const genericImage = '/medicine-images/medicine.svg'

export const getMedicineImage = item => {
  const imageUrl = String(item?.imageUrl || '')
  if (imageUrl && !imageUrl.includes('images.unsplash.com')) return imageUrl
  return fallbackImages[item?.categoryId] || genericImage
}
