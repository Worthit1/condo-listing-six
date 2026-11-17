import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDMbT0qgK4BoJNTCqtmne3gh-7LwaCkS4k",
  authDomain: "condo-listing-six.firebaseapp.com",
  projectId: "condo-listing-six",
  storageBucket: "condo-listing-six.firebasestorage.app",
  messagingSenderId: "898646335773",
  appId: "1:898646335773:web:aff756decbaef9a54b01f4"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);