import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db, firebaseSetupError } from '../firebase/config'
const col=uid=>{if(!db)throw Error(firebaseSetupError);return collection(db,'customers',uid,'addresses')}
export const subscribeAddresses=(uid,cb)=>onSnapshot(col(uid),snap=>cb(snap.docs.map(x=>({id:x.id,...x.data()}))))
export const saveAddress=(uid,data,id)=>id?updateDoc(doc(db,'customers',uid,'addresses',id),{...data,updatedAt:serverTimestamp()}):addDoc(col(uid),{...data,createdAt:serverTimestamp(),updatedAt:serverTimestamp()})
export const removeAddress=(uid,id)=>deleteDoc(doc(db,'customers',uid,'addresses',id))
