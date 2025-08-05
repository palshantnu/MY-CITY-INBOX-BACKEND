// firebaseAdmin.js
const admin = require('firebase-admin');
const serviceAccount = require('./my-city-inbox-firebase-adminsdk-fbsvc-eceb399263.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
