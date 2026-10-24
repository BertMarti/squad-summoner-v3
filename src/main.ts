import { createApp } from 'vue'
import { createPinia } from 'pinia'
// Fuente servida desde la propia web (sin Google Fonts: privacidad y CSP estricta).
import '@fontsource/chakra-petch/latin-400.css'
import '@fontsource/chakra-petch/latin-600.css'
import '@fontsource/chakra-petch/latin-700.css'
import App from './App.vue'
import './assets/main.css'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
