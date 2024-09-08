import { createApp } from 'vue'
import App from './App.vue'
import { registerModule } from './core/moduleLoader'
import personalFinanceModule from './modules/personal-finance'

registerModule('personalFinance', personalFinanceModule)

const app = createApp(App)
app.mount('#app')
