/**
 * Set Firebase Auth custom claims for an admin/editor user.
 *
 * Usage:
 *   node scripts/set-admin-claim.js <uid> [role]
 *
 *   role defaults to 'admin'. Use 'editor' for limited access.
 *
 * Examples:
 *   node scripts/set-admin-claim.js abc123xyz           # sets role: admin
 *   node scripts/set-admin-claim.js abc123xyz editor    # sets role: editor
 *
 * Requires serviceAccountKey.json in the project root.
 */

import admin from 'firebase-admin'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const serviceAccount = require('../serviceAccountKey.json')

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db   = admin.firestore()
const auth = admin.auth()
const TS   = admin.firestore.FieldValue.serverTimestamp()

const VALID_ROLES = ['admin', 'editor']

async function run() {
  const uid  = process.argv[2]
  const role = process.argv[3] ?? 'admin'

  if (!uid) {
    console.error('❌  Usage: node scripts/set-admin-claim.js <uid> [admin|editor]')
    process.exit(1)
  }

  if (!VALID_ROLES.includes(role)) {
    console.error(`❌  Invalid role "${role}". Must be one of: ${VALID_ROLES.join(', ')}`)
    process.exit(1)
  }

  // 1. Set the custom claim on Firebase Auth
  await auth.setCustomUserClaims(uid, { role })
  console.log(`✔  Custom claim set: { role: '${role}' } → uid: ${uid}`)

  // 2. Look up the user to get email
  const userRecord = await auth.getUser(uid)
  console.log(`✔  User found: ${userRecord.email}`)

  // 3. Upsert the adminUsers Firestore profile
  await db.collection('adminUsers').doc(uid).set({
    email:       userRecord.email,
    displayName: userRecord.displayName ?? userRecord.email,
    role,
    active:      true,
    updatedAt:   TS,
  }, { merge: true })
  console.log(`✔  adminUsers/${uid} upserted`)

  // 4. Write an audit log entry
  await db.collection('auditLogs').add({
    action:    'create',
    entity:    'adminUsers',
    entityId:  uid,
    meta:      { role, email: userRecord.email, setBy: 'set-admin-claim script' },
    userId:    'admin-sdk',
    userEmail: 'admin-sdk',
    createdAt: TS,
  })
  console.log('✔  auditLogs entry written')

  console.log(`\n✅  Done! User ${userRecord.email} now has role: ${role}`)
  console.log('   ⚠️  The user must sign out and back in for the claim to take effect.')

  process.exit(0)
}

run().catch(err => {
  console.error('❌  Failed:', err.message)
  process.exit(1)
})
