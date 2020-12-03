import firebase from 'firebase-admin';
import app from './app';

const serviceAccount = require('../../easy-3e6d3-firebase-adminsdk-gcs05-1225a2de68.json');

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: 'https://easy-3e6d3.firebaseio.com',
});

app.listen(3000, () => console.log('Server listening on 3000'));
