importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAuVnkAuj2OaBfLDMxXjaMWLPbSyOfStbk",
  authDomain: "awmu-b93ec.firebaseapp.com",
  projectId: "awmu-b93ec",
  storageBucket: "awmu-b93ec.firebasestorage.app",
  messagingSenderId: "107082595348",
  appId: "1:107082595348:web:ad71fdb56509c2c7c23b01",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "AwMu";
  const body = payload.notification?.body || "New message";
  self.registration.showNotification(title, {
    body,
    icon: "/icon.svg",
    badge: "/icon.svg",
    data: { chatId: payload.data?.chatId || "" },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const chatId = event.notification.data?.chatId;
  const url = chatId ? `/chats/${chatId}` : "/chats";
  event.waitUntil(clients.openWindow(url));
});
