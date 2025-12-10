import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const isDark = ref(true)
  function toggleTheme(){ isDark.value = !isDark.value }
  return { isDark, toggleTheme }
})
