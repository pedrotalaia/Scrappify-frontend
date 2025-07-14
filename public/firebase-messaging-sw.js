importScripts('https://www.gstatic.com/firebasejs/9.21.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.21.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDgdDe9cY_AJ1i8LA2UHJ2ssYpk10DJI",
  authDomain: "scrappify-bb0d4.firebaseapp.com",
  projectId: "scrappify-bb0d4",
  storageBucket: "scrappify-bb0d4.firebasestorage.app",
  messagingSenderId: "605793044917",
  appId: "1:605793044917:web:7c13c05c0ee904dee831fc",
  measurementId: "G-F7HVF655E6"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'Background Message Title';
  const notificationOptions = {
    body: payload.notification?.body || 'Background Message body.',
    icon: '/firebase-logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
