import { getFunctions, httpsCallable } from 'firebase/functions'
import { firebaseSetupError, isFirebaseConfigured } from '../firebase/config'
const call=name=>{if(!isFirebaseConfigured)throw Error(firebaseSetupError);return httpsCallable(getFunctions(),name)}
export const createTrustedOrder=async data=>(await call('createOrder')(data)).data
export const updateTrustedOrderStatus=async data=>(await call('updateOrderStatus')(data)).data
export const createTrustedShipment=async data=>(await call('createShipment')(data)).data
export const updateTrustedTracking=async data=>(await call('updateShipmentTracking')(data)).data
export const verifyBatch=async token=>(await call('verifyBatch')({token})).data
export const generateBatchVerification=async batchId=>(await call('generateBatchVerification')({batchId})).data
