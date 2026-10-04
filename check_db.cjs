const admin = require('firebase-admin');
const fs = require('fs');

if (fs.existsSync('./serviceAccountKey.json')) {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
} else {
    admin.initializeApp();
}

const db = admin.firestore();

async function check() {
  const txs = await db.collection('transactions').orderBy('date', 'desc').limit(5).get();
  txs.forEach(doc => {
    console.log(doc.id, doc.data().type, doc.data().gameDetails ? 'Has gameDetails' : 'No gameDetails');
  });
}

check().catch(console.error);
