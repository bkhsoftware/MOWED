import { createApp } from 'vue';
import App from './App.vue';
import store from './store';
import ModuleRegistry from './core/ModuleRegistry';
import PersonalFinance from './modules/PersonalFinance';

// Register modules
ModuleRegistry.registerModule(new PersonalFinance());

const app = createApp(App);
app.use(store);
app.mount('#app');
