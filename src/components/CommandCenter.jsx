import { useState } from 'react'
import {
  MESSAGE_DURATIONS,
  PRESET_TOWER_MESSAGES,
} from '../data/towerMessages'
import {
  supabase,
  supabaseEnabled,
} from '../lib/supabase'

export default function CommandCenter({
  eventRunning,
  towerMessage,
  onSetEventRunning,
}) {
  const [selectedMessageId, setSelectedMessageId] =
    useState(PRESET_TOWER_MESSAGES[0]?.id || '')

  const [selectedDuration, setSelectedDuration] =
    useState(5)

  const [isSending, setIsSending] = useState(false)

  const selectedMessage =
    PRESET_TOWER_MESSAGES.find(
      message => message.id === selectedMessageId
    ) || null

  async function broadcastMessage() {
    if (!supabaseEnabled || !selectedMessage) return

    const expiresAt = new Date(
      Date.now() + selectedDuration * 60 * 1000
    ).toISOString()

    setIsSending(true)

    const { error } = await supabase
      .from('event_settings')
      .update({
        tower_message_id: selectedMessage.id,
        tower_message_icon: selectedMessage.icon,
        tower_message_title: selectedMessage.title,
        tower_message_text: selectedMessage.text,
        tower_message_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1)

    setIsSending(false)

    if (error) {
      window.alert(
        'Le message n’a pas pu être diffusé.'
      )
    }
  }

  async function clearMessage() {
    if (!supabaseEnabled) return

    setIsSending(true)

    const { error } = await supabase
      .from('event_settings')
      .update({
        tower_message_id: null,
        tower_message_icon: null,
        tower_message_title: null,
        tower_message_text: null,
        tower_message_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1)

    setIsSending(false)

    if (error) {
      window.alert(
        'L’annonce n’a pas pu être supprimée.'
      )
    }
  }

  return (
    <main className="command-center">
      <header className="command-center__header">
        <div>
          <small>PATRICIA AIRLINES</small>
          <h1>Poste de commandement</h1>
        </div>

        <span
          className={`command-center__status ${
            eventRunning
              ? 'command-center__status--active'
              : ''
          }`}
        >
          <i />
          {eventRunning ? 'MISSIONS OUVERTES' : 'EN PAUSE'}
        </span>
      </header>

      <section className="command-section">
        <p className="command-section__label">
          CONTRÔLE DES MISSIONS
        </p>

        <button
          className={`command-main-button ${
            eventRunning
              ? 'command-main-button--pause'
              : 'command-main-button--start'
          }`}
          onClick={() =>
            onSetEventRunning(!eventRunning)
          }
        >
          {eventRunning
            ? '⏸ Mettre les missions en pause'
            : '▶ Démarrer les missions'}
        </button>
      </section>

      <section className="command-section">
        <p className="command-section__label">
          DIFFUSER UNE ANNONCE
        </p>

        <div className="command-message-grid">
          {PRESET_TOWER_MESSAGES.map(message => (
            <button
              key={message.id}
              className={`command-message-button ${
                selectedMessageId === message.id
                  ? 'command-message-button--selected'
                  : ''
              }`}
              onClick={() =>
                setSelectedMessageId(message.id)
              }
            >
              <span>{message.icon}</span>
              <strong>{message.label}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="command-section">
        <p className="command-section__label">
          DURÉE D’AFFICHAGE
        </p>

        <div className="command-duration-grid">
          {MESSAGE_DURATIONS.map(duration => (
            <button
              key={duration.minutes}
              className={
                selectedDuration === duration.minutes
                  ? 'command-duration-button command-duration-button--selected'
                  : 'command-duration-button'
              }
              onClick={() =>
                setSelectedDuration(duration.minutes)
              }
            >
              {duration.label}
            </button>
          ))}
        </div>

        {selectedMessage && (
          <section className="command-preview">
            <span>{selectedMessage.icon}</span>

            <div>
              <small>APERÇU SUR LE PROJECTEUR</small>
              <strong>{selectedMessage.title}</strong>
              <p>{selectedMessage.text}</p>
            </div>
          </section>
        )}

        <button
          className="command-broadcast-button"
          onClick={broadcastMessage}
          disabled={
            !supabaseEnabled ||
            !selectedMessage ||
            isSending
          }
        >
          {isSending
            ? 'Diffusion en cours…'
            : `📡 Diffuser pendant ${selectedDuration} minutes`}
        </button>
      </section>

      {towerMessage && (
        <section className="command-active-message">
          <div>
            <small>ANNONCE ACTUELLEMENT DIFFUSÉE</small>

            <strong>
              {towerMessage.icon}{' '}
              {towerMessage.title}
            </strong>

            <p>{towerMessage.text}</p>
          </div>

          <button
            onClick={clearMessage}
            disabled={isSending}
          >
            Arrêter
          </button>
        </section>
      )}

      <p className="command-connection">
        {supabaseEnabled
          ? '● Tour de contrôle connectée'
          : '● Supabase non connecté'}
      </p>
    </main>
  )
}