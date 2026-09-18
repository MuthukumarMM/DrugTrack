import { getDocument, serverTimestamp, setDocument, updateDocument } from '../firebase/firestore'
import { ACCOUNT_STATUS } from '../constants/statuses'
import { getDemoAccountByUid, getDemoProfileFromAccount } from '../data/demoAccounts'

const organizationCollections = { MANUFACTURER:'manufacturers', WAREHOUSE_MANAGER:'warehouses', DISTRIBUTOR:'distributors', PHARMACY:'pharmacies', HOSPITAL:'hospitals', DELIVERY_STAFF:'deliveryStaff', CUSTOMER:'customers' }
const isDemoMode = String(import.meta.env.VITE_DEMO_MODE || '').toLowerCase() === 'true'

export const getUserProfile = async uid => {
  if (isDemoMode) {
    const demoAccount = getDemoAccountByUid(uid)
    if (demoAccount) {
      return getDemoProfileFromAccount(demoAccount)
    }
  }

  return getDocument('users', uid)
}

export const createUserProfile = (user, profile) => setDocument('users', user.uid, { uid:user.uid, email:user.email, displayName:profile.displayName, phone:profile.phone || '', role:profile.role, status: profile.role === 'CUSTOMER' || isDemoMode ? ACCOUNT_STATUS.ACTIVE : ACCOUNT_STATUS.PENDING_VERIFICATION, photoURL:user.photoURL || '', createdAt:serverTimestamp(), updatedAt:serverTimestamp(), lastLoginAt:serverTimestamp() })
export const updateLastLogin = uid => {
  if (isDemoMode && getDemoAccountByUid(uid)) return Promise.resolve()
  return updateDocument('users', uid, { lastLoginAt:serverTimestamp() })
}
export const updateUserProfile = (uid, data) => updateDocument('users', uid, { displayName:data.displayName || '', phone:data.phone || '', photoURL:data.photoURL || '' })
export const createOrganizationProfile = (user, profile) => { const collection = organizationCollections[profile.role]; if (!collection) return Promise.resolve(); const common={ userId:user.uid, email:user.email, phone:profile.phone || '', createdAt:serverTimestamp(), updatedAt:serverTimestamp() }; if(profile.role==='CUSTOMER')return setDocument(collection,user.uid,{...common,displayName:profile.displayName}); if(profile.role==='DELIVERY_STAFF')return setDocument(collection,user.uid,{...common,displayName:profile.displayName,organizationId:profile.organizationId||'',verificationStatus:'PENDING'}); const shared={...common,licenseNumber:profile.licenseNumber||'',address:profile.address||'',city:profile.city||'',state:profile.state||'',country:profile.country||'',verificationStatus:isDemoMode ? 'APPROVED' : 'PENDING'}; const data=profile.role==='MANUFACTURER'?{...shared,companyName:profile.organizationName||'',registrationNumber:profile.registrationNumber||''}:profile.role==='WAREHOUSE_MANAGER'?{...shared,warehouseName:profile.organizationName||'',managerName:profile.displayName}:profile.role==='DISTRIBUTOR'?{...shared,companyName:profile.organizationName||'',warehouseAddress:profile.address||''}:profile.role==='PHARMACY'?{...shared,pharmacyName:profile.organizationName||'',pharmacistName:profile.contactPerson||'',latitude:null,longitude:null}: {...shared,hospitalName:profile.organizationName||'',pharmacyDepartment:'',contactPerson:profile.contactPerson||'',latitude:null,longitude:null}; return setDocument(collection,user.uid,data) }
