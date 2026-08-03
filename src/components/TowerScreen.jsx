import { useEffect, useMemo, useState } from 'react'
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

  const displayedMessage =
    towerMessage || automaticMessages[messageIndex]

  return (
    <main className="tower-screen">
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