import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDgdDe9yCY_AJl68LA22UjH2ssYpKiODjI",
  authDomain: "scrappify-bb0d4.firebaseapp.com",
  projectId: "scrappify-bb0d4",
  storageBucket: "scrappify-bb0d4.firebasestorage.app",
  messagingSenderId: "605793044917",
  appId: "1:605793044917:web:7c13c05c0ee904dee831fc",
  measurementId: "G-F7HVF655E6"
};

const app = initializeApp(firebaseConfig);

let messaging = null;

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  messaging = getMessaging(app);
}

export { messaging };
