import { collection, doc, limit, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore'
import { db, firebaseSetupError } from '../firebase/config'
export const subscribeNotifications=(uid,cb)=>{if(!db)throw Error(firebaseSetupError);const source=query(collection(db,'notifications'),where('userId','==',uid),orderBy('createdAt','desc'),limit(30));return onSnapshot(source,snap=>cb(snap.docs.map(x=>({id:x.id,...x.data()}))))}
export const markNotificationRead=id=>updateDoc(doc(db,'notifications',id),{isRead:true})
