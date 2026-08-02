export function readLocal(key, fallback) {
  try {
    const value = window.localStorage.getItem(`patricia-airlines:${key}`)
    return value ? { ...fallback, ...JSON.parse(value) } : fallback
  } catch {
    return fallback
  }
}

export function writeLocal(key, value) {
  try {
    window.localStorage.setItem(`patricia-airlines:${key}`, JSON.stringify(value))
  } catch {
    // Le stockage local reste facultatif.
  }
}

export function clearLocal() {
  try {
    Object.keys(window.localStorage)
      .filter(key => key.startsWith('patricia-airlines:'))
      .forEach(key => window.localStorage.removeItem(key))
  } catch {
    // Rien à faire.
  }
}
