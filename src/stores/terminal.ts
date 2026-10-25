import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTerminalStore = defineStore('terminal', () => {
  const terminalText = ref('')
  const logLines = ref<{ ts: string; text: string }[]>([
    { ts: new Date().toLocaleTimeString(), text: 'Sistema iniciado.' },
  ])

  function setText(t: string) {
    terminalText.value = t
  }

  function addLog(text: string) {
    const ts = new Date().toLocaleTimeString()
    logLines.value.unshift({ ts, text })
    if (logLines.value.length > 300) logLines.value.pop()
  }

  return { terminalText, logLines, setText, addLog }
})
