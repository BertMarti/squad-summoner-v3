import { defineStore } from 'pinia'
import { reactive } from 'vue'
import type { Mission } from '@/types'

export const useMissionStore = defineStore('mission', () => {
  const mission = reactive<Mission>({ game: '', subGame: '', customGameName: '', recruits: '', time: '' })

  function update(data: Partial<Mission>) {
    Object.assign(mission, data)
  }

  return { mission, update }
})
