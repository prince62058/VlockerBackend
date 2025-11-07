// const admin = require('firebase-admin');

// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert({
//       projectId: process.env.FIREBASE_PROJECT_ID,
//       clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//       privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
//     }),
//     databaseURL: process.env.FIREBASE_DATABASE_URL,
//   });
// }

// module.exports = admin;


const admin = require('firebase-admin');
const fs=require('fs')
const path=require('path')

const serviceAccountPath = path.join(process.cwd(), 'secrets', 'serviceAccountKey.json')
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

module.exports=admin
