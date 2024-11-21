const admin = require('firebase-admin');
const serviceAccount = require('./restapi-gdsctest-firebase-adminsdk-hvu70-2de9a8e7bd.json'); // Pastikan path file JSON benar

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://restapi-gdsctest-default-rtdb.firebaseio.com/' // Pastikan URL ini benar
});

const db = admin.database();
module.exports = db;
