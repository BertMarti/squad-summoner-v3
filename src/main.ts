import { createApp } from 'vue'
import App from './App.vue'
import './assets/main.css' // <--- IMPORTANTE: Importar estilos globales

const app = createApp(App)
// app.use(router) // <-- BORRAR ESTA LÍNEA si existe
// app.use(pinia)  // <-- BORRAR ESTA LÍNEA si existe
app.mount('#app')