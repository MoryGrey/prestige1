// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Инициализация Firebase
firebase.initializeApp({
  apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "prestige-taxi.firebaseapp.com",
  projectId: "prestige-taxi",
  storageBucket: "prestige-taxi.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
});

const messaging = firebase.messaging();

// Обработчик фоновых сообщений
messaging.onBackgroundMessage((payload) => {
  console.log('Получено фоновое сообщение:', payload);
  
  const notificationTitle = payload.notification.title || 'Новый заказ!';
  const notificationOptions = {
    body: payload.notification.body || 'Поступил новый заказ такси',
    icon: payload.notification.icon || '/logo.png',
    badge: '/logo.png',
    tag: 'new-order',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'Посмотреть'
      },
      {
        action: 'dismiss',
        title: 'Закрыть'
      }
    ],
    data: payload.data || {}
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Обработчик клика по уведомлению
self.addEventListener('notificationclick', (event) => {
  console.log('Клик по уведомлению:', event);
  
  event.notification.close();
  
  if (event.action === 'view') {
    // Открываем страницу управления заказами
    event.waitUntil(
      clients.openWindow('/index.html#admin')
    );
  }
}); 