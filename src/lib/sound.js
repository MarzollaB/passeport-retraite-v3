let audioContext = null

function getAudioContext() {
  if (typeof window === 'undefined') return null

  const AudioContext =
    window.AudioContext || window.webkitAudioContext

  if (!AudioContext) return null

  if (!audioContext) {
    audioContext = new AudioContext()
  }

  return audioContext
}

export async function unlockSound() {
  try {
    const context = getAudioContext()

    if (!context) return

    if (context.state === 'suspended') {
      await context.resume()
    }

    const oscillator = context.createOscillator()
    const gain = context.createGain()

    gain.gain.setValueAtTime(
      0.0001,
      context.currentTime
    )

    oscillator.connect(gain)
    gain.connect(context.destination)

    oscillator.start()
    oscillator.stop(
      context.currentTime + 0.01
    )
  } catch {
    // Le son reste facultatif.
  }
}

export async function playStampSound() {
  try {
    const context = getAudioContext()

    if (!context) return

    if (context.state === 'suspended') {
      await context.resume()
    }

    const now = context.currentTime

    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = 'triangle'

    oscillator.frequency.setValueAtTime(
      125,
      now
    )

    oscillator.frequency.exponentialRampToValueAtTime(
      48,
      now + 0.16
    )

    gain.gain.setValueAtTime(
      0.0001,
      now
    )

    gain.gain.exponentialRampToValueAtTime(
      0.38,
      now + 0.008
    )

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + 0.18
    )

    oscillator.connect(gain)
    gain.connect(context.destination)

    oscillator.start(now)
    oscillator.stop(now + 0.19)
  } catch {
    // Aucune erreur sonore ne bloque l’application.
  }
}