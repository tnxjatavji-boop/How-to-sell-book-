const admin = require('firebase-admin');
const fs = require('fs');

if (fs.existsSync('./firebase-applet-config.json')) {
    const config = require('./firebase-applet-config.json');
    admin.initializeApp({
      projectId: config.projectId,
      credential: admin.credential.applicationDefault() // we don't have the cert here, wait.
    });
}

