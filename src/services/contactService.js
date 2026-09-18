import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db, firebaseSetupError } from '../firebase/config'
export const submitContactMessage=data=>{if(!db)throw Error(firebaseSetupError);return addDoc(collection(db,'contactMessages'),{...data,createdAt:serverTimestamp()})}
