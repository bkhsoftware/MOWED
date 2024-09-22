import { createApp } from 'vue'
import App from './App.vue'
import store from './store'
import { registerModules } from './registerModules'

const app = createApp(App)

registerModules()

app.use(store)

store.dispatch('initStore').then(() => {
  app.mount('#app')
})

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }, err => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}
