import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const projectId = process.env.GCLOUD_PROJECT || 'drugtrack-new'
initializeApp({ projectId })
const auth = getAuth()
const db = getFirestore()

const accounts = [
  { email: 'customer.demo@drugtrack.local', password: 'Customer@123', role: 'CUSTOMER', displayName: 'Aisha Verma' },
  { email: 'manufacturer.demo@drugtrack.local', password: 'Manufacturer@123', role: 'MANUFACTURER', displayName: 'Rohan Mehta' },
]

for (const account of accounts) {
  let user
  try {
    user = await auth.getUserByEmail(account.email)
    await auth.updateUser(user.uid, { password: account.password, displayName: account.displayName, disabled: false })
  } catch (error) {
    if (error.code !== 'auth/user-not-found') throw error
    user = await auth.createUser({ email: account.email, password: account.password, displayName: account.displayName })
  }
  await db.doc(`users/${user.uid}`).set({ uid: user.uid, email: account.email, displayName: account.displayName, role: account.role, status: 'ACTIVE' }, { merge: true })
  console.log(`${account.role}: ${account.email} / ${account.password}`)
}
