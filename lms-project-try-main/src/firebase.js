
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyD0-BU6nAAYs2FWYd5c-cO4TeWWYOEZqJY',
  authDomain: 'lmsauth-bbe7f.firebaseapp.com',
  projectId: 'lmsauth-bbe7f',
  storageBucket: 'lmsauth-bbe7f.firebasestorage.app',
  messagingSenderId: '756168071556',
  appId: '1:756168071556:web:422142e676c74d8d3625d1',
  measurementId: 'G-DN81K3YVFD',
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

export { app, auth }
