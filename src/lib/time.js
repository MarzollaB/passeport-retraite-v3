import { CONFIG } from './config'

export function randomCooldownSeconds() {
  if (CONFIG.demoMode) return CONFIG.demoCooldownSeconds

  const min = CONFIG.cooldownMinMinutes * 60
  const max = CONFIG.cooldownMaxMinutes * 60
  return Math.floor(Math.random() * (max - min + 1)) + min
}
