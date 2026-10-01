export const MANUFACTURER_HUB = Object.freeze({
  name: 'Francis Xavier Engineering College',
  address: 'Francis Xavier Engineering College, Tirunelveli, Tamil Nadu, India',
  latitude: 8.7139,
  longitude: 77.7567,
})

export const TIRUNELVELI_DISTRIBUTION_HUB = Object.freeze({
  name: 'Tirunelveli Distribution Hub',
  address: 'Tirunelveli Distribution Hub, Tirunelveli, Tamil Nadu, India',
  latitude: 8.7287,
  longitude: 77.7412,
})

export const TIRUNELVELI_DEFAULT_DESTINATION = Object.freeze({
  name: 'Tirunelveli Buyer Address',
  address: 'Tirunelveli, Tamil Nadu, India',
  latitude: 8.7139,
  longitude: 77.7567,
})

export const isTirunelveliCoordinate = (latitude, longitude) =>
  Number(latitude) >= 8.35 && Number(latitude) <= 9.15 && Number(longitude) >= 77.25 && Number(longitude) <= 78.15

export const DEFAULT_MAP_ZOOM = 12
