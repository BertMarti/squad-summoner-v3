import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './assets/main.css' // <--- IMPORTANTE: Importar estilos globales

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
// app.use(router) // <-- BORRAR ESTA LÍNEA si existe
app.mount('#app')