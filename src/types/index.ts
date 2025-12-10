export interface LogEntry {
  ts: string
  text: string
}

export interface ProcessItem {
  id: number | string
  name: string
  emoji?: string
  detail?: string
  status?: 'queued' | 'running' | 'done' | 'cancelled'
}

export interface Mission {
  game: string
  subGame: string
  customGameName: string
  recruits: string
  time: string
}
