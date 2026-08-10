import { useEffect, useMemo, useRef, useState } from 'react'
import { AUTO_TOWER_MESSAGES } from '../data/towerMessages'

function shuffle(array) {
  const copy = [...array]

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(
      Math.random() * (index + 1)
    )

    ;[copy[index], copy[randomIndex]] = [
      copy[randomIndex],
      copy[index],
    ]
  }

  return copy
}

function playAirportChime() {
  const AudioContext =
    window.AudioContext || window.webkitAudioContext

  if (!AudioContext) return

  const context = new AudioContext()
  const now = context.currentTime

  function playTone(frequency, start, duration) {
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, now + start)

    gain.gain.setValueAtTime(0.0001, now + start)
    gain.gain.exponentialRampToValueAtTime(
      0.22,
      now + start + 0.02
    )
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + start + duration
    )

    oscillator.connect(gain)
    gain.connect(context.destination)

    oscillator.start(now + start)
    oscillator.stop(now + start + duration)
  }

  playTone(659, 0, 0.55)
  playTone(523, 0.62, 0.65)
}

export default function TowerScreen({
  eventRunning,
  towerMessage,
  stats,
}) {
  const automaticMessages = useMemo(
    () => shuffle(AUTO_TOWER_MESSAGES),
    []
  )

  const [messageIndex, setMessageIndex] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [soundEnabled, setSoundEnabled] = useState(false)
  const lastSpokenMessageId = useRef(null)

  useEffect(() => {
    const clockInterval = window.setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => {
      window.clearInterval(clockInterval)
    }
  }, [])

  useEffect(() => {
    if (towerMessage) return undefined

    const messageInterval = window.setInterval(() => {
      setMessageIndex(currentIndex =>
        (currentIndex + 1) % automaticMessages.length
      )
    }, 20000)

    return () => {
      window.clearInterval(messageInterval)
    }
  }, [automaticMessages.length, towerMessage])

  useEffect(() => {
    if (!soundEnabled) return
  
    if (!towerMessage?.id || !towerMessage?.text) return
  
    if (lastSpokenMessageId.current === towerMessage.id) {
      return
    }
  
    lastSpokenMessageId.current = towerMessage.id
  
    if (!('speechSynthesis' in window)) return
  
    window.speechSynthesis.cancel()
  
    playAirportChime()
  
    const timer = window.setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(
        towerMessage.text
      )
  
      utterance.lang = 'fr-FR'
      utterance.rate = 0.92
      utterance.pitch = 1
      utterance.volume = 1
  
      const voices = window.speechSynthesis.getVoices()
  
      const frenchVoice =
        voices.find(
          voice =>
            voice.lang.toLowerCase().startsWith('fr') &&
            voice.name.toLowerCase().includes('female')
        ) ||
        voices.find(
          voice =>
            voice.lang.toLowerCase().startsWith('fr-fr')
        ) ||
        voices.find(
          voice =>
            voice.lang.toLowerCase().startsWith('fr')
        )
  
      if (frenchVoice) {
        utterance.voice = frenchVoice
      }
  
      window.speechSynthesis.speak(utterance)
    }, 1500)
  
    return () => {
      window.clearTimeout(timer)
    }
  }, [towerMessage, soundEnabled])

  const displayedMessage =
    towerMessage || automaticMessages[messageIndex]

  return (
    <main className="tower-screen">
      {!soundEnabled && (
  <button
    type="button"
    className="tower-sound-button"
    onClick={() => {
      setSoundEnabled(true)

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()

        const testMessage = new SpeechSynthesisUtterance(
          'Son de la tour activé.'
        )

        testMessage.lang = 'fr-FR'
        testMessage.volume = 0.01

        window.speechSynthesis.speak(testMessage)
      }

      playAirportChime()
    }}
  >
    🔊 Activer le son de la tour
  </button>
)}
      <div className="tower-screen__background">
        <span className="tower-screen__route tower-screen__route--one" />
        <span className="tower-screen__route tower-screen__route--two" />
        <span className="tower-screen__route tower-screen__route--three" />
      </div>

      <header className="tower-header">
        <div className="tower-header__brand">
          <span className="tower-header__plane">✈</span>

          <div>
            <small>PATRICIA AIRLINES</small>
            <h1>Tour de contrôle</h1>
          </div>
        </div>

        <div className="tower-header__status">
          <span
            className={
              eventRunning
                ? 'tower-status tower-status--active'
                : 'tower-status'
            }
          >
            <i />
            {eventRunning
              ? 'MISSIONS OUVERTES'
              : 'MISSIONS EN PAUSE'}
          </span>

          <time>
            {currentTime.toLocaleTimeString('fr-BE', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </time>
        </div>
      </header>

      <section
        className={`tower-message ${
          towerMessage
            ? 'tower-message--priority'
            : ''
        }`}
      >
        <div
          className="tower-message__icon"
          key={`${displayedMessage?.id}-icon`}
        >
          {displayedMessage?.icon || '✈'}
        </div>

        <div
          className="tower-message__content"
          key={displayedMessage?.id}
        >
          <small>
            {towerMessage
              ? 'ANNONCE DE L’ÉQUIPAGE'
              : displayedMessage?.title}
          </small>

          <h2>
            {displayedMessage?.text}
          </h2>
        </div>
      </section>

      <section className="tower-stats">
        <article>
          <span>👥</span>
          <strong>{stats.participants}</strong>
          <small>Voyageurs embarqués</small>
        </article>

        <article>
          <span>✦</span>
          <strong>{stats.missions}</strong>
          <small>Missions accomplies</small>
        </article>

        <article>
          <span>🛂</span>
          <strong>{stats.passports}</strong>
          <small>Passeports validés</small>
        </article>

        <article>
          <span>📖</span>
          <strong>{stats.memories}</strong>
          <small>Anecdotes partagées</small>
        </article>
      </section>

      <footer className="tower-footer">
        <div>
          <strong>Patricia Airlines © 2026</strong>

          <p>
            Un voyage se mesure moins en kilomètres
            <br />
            qu’en souvenirs partagés.
          </p>
        </div>

        <small>
          Création &amp; développement : © Benoît Marzolla
        </small>
      </footer>
    </main>
  )
}