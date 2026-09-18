import { collection, doc, getDoc, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db, firebaseSetupError } from '../firebase/config'
const requireDb=()=>{if(!db)throw Error(firebaseSetupError);return db}
export const subscribeCatalogue=(callback,count=48)=>onSnapshot(query(collection(requireDb(),'catalogue'),orderBy('updatedAt','desc'),limit(count)),snap=>callback(snap.docs.map(x=>({id:x.id,...x.data()}))))
export const getCatalogueListing=async id=>{const snap=await getDoc(doc(requireDb(),'catalogue',id));return snap.exists()?{id:snap.id,...snap.data()}:null}
