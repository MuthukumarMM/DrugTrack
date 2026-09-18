import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db, firebaseSetupError } from '../firebase/config'
const requireDb=()=>{if(!db)throw new Error(firebaseSetupError);return db}
export const createRecord=(name,data)=>addDoc(collection(requireDb(),name),{...data,createdAt:serverTimestamp(),updatedAt:serverTimestamp()})
export const updateRecord=(name,id,data)=>updateDoc(doc(requireDb(),name,id),{...data,updatedAt:serverTimestamp()})
export const deleteRecord=(name,id)=>deleteDoc(doc(requireDb(),name,id))
export const getRecord=async(name,id)=>{const s=await getDoc(doc(requireDb(),name,id));return s.exists()?{id:s.id,...s.data()}:null}
export const getRecords=async(name,constraints=[])=>{const s=await getDocs(query(collection(requireDb(),name),...constraints));return s.docs.map(d=>({id:d.id,...d.data()}))}
export const subscribeRecords=(name,callback,constraints=[])=>onSnapshot(query(collection(requireDb(),name),...constraints),s=>callback(s.docs.map(d=>({id:d.id,...d.data()}))))
export { where,orderBy }
