import { forwardRef, useEffect, useState } from 'react'
import HTMLFlipBook from 'react-pageflip'
import { CONFIG } from '../lib/config'
import { supabase, supabaseEnabled } from '../lib/supabase'

const BookPage = forwardRef(function BookPage(
  { children, className = '' },
  ref
) {
  return (
    <div
      ref={ref}
      className={`mimou-book-page ${className}`}
    >
      <div className="mimou-book-page__inner">
        {children}
      </div>
    </div>
  )
})

export default function MimouPage() {
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [pinOpen, setPinOpen] = useState(false)

  const [journalEntries, setJournalEntries] = useState([])
  const [privateMessages, setPrivateMessages] = useState([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [journalPageIndex, setJournalPageIndex] = useState(0)
  const [privatePageIndex, setPrivatePageIndex] = useState(0)

  useEffect(() => {
    if (!supabaseEnabled) return

    async function loadJournal() {
      const { data, error: journalError } = await supabase
        .from('journal_entries')
        .select('*')
        .order('created_at', { ascending: false })

      if (journalError) {
        console.error(journalError)
        return
      }

      setJournalEntries(data || [])
    }

    loadJournal()
  }, [])

  async function unlockMimou() {
    if (!pin.trim()) {
      setError('Entre le code d’accès.')
      return
    }

    if (!supabaseEnabled) {
      setError('Supabase n’est pas disponible.')
      return
    }

    setLoading(true)
    setError('')

    const { data, error: privateError } = await supabase.rpc(
      'get_private_messages',
      {
        p_pin: pin.trim()
      }
    )

    if (privateError) {
      console.error(privateError)
      setError('Code incorrect.')
      setLoading(false)
      return
    }

    setPrivateMessages(data || [])
    setUnlocked(true)
    setPin('')
    setPinOpen(false)
    setLoading(false)
  }

  const journalWindowStart = journalPageIndex * 10

const journalFirstPage = journalEntries.slice(
  journalWindowStart,
  journalWindowStart + 5
)

const journalSecondPage = journalEntries.slice(
  journalWindowStart + 5,
  journalWindowStart + 10
)

const hasPreviousJournalPages =
  journalPageIndex > 0

const hasNextJournalPages =
  journalWindowStart + 10 < journalEntries.length

const privateWindowStart = privatePageIndex * 6

const visiblePrivateMessages = privateMessages.slice(
  privateWindowStart,
  privateWindowStart + 6
)

const hasPreviousPrivateMessages =
  privatePageIndex > 0

const hasNextPrivateMessages =
  privateWindowStart + 6 < privateMessages.length

  return (
    <main className="mimou-page">

<div className="mimou-background-collage" aria-hidden="true">
  <img src="/images/Mimou-01.jpeg" alt="" />
  <img src="/images/Mimou-02.jpeg" alt="" />
  <img src="/images/Mimou-03.jpeg" alt="" />
  <img src="/images/Mimou-04.jpeg" alt="" />
  <img src="/images/Mimou-05.jpeg" alt="" />
  <img src="/images/Mimou-06.jpeg" alt="" />
  <img src="/images/Mimou-07.jpeg" alt="" />
  <img src="/images/Mimou-08.jpeg" alt="" />
  <img src="/images/Mimou-09.jpeg" alt="" />
</div>

      <div className="mimou-book-wrapper">

        <HTMLFlipBook
          width={430}
          height={620}
          size="stretch"
          minWidth={290}
          maxWidth={480}
          minHeight={430}
          maxHeight={700}
          showCover
          mobileScrollSupport={false}
          disableFlipByClick
          className="mimou-book"
        >

          {/* 1 — COUVERTURE */}

          <BookPage className="mimou-cover">
            <div className="mimou-cover__photo">
              <img
                src="/images/mimou-bebe.jpeg"
                alt="Patricia enfant"
              />
            </div>

            <div className="mimou-cover__content">
              <span className="mimou-cover__plane">
                ✈
              </span>

              <h1>Pour Mimou</h1>

              <p>
                En souvenir d’une soirée
                <br />
                de consécration professionnelle
              </p>

              <span className="mimou-cover__hint">
                Tourne la page →
              </span>
            </div>
          </BookPage>

          {/* 2 — CARNET COLLECTIF */}

<BookPage>
  <div className="mimou-page-heading">
    <span>📖</span>

    <div>
      <small>Carnet collectif</small>
      <h2>Ce qu’ils ont raconté</h2>
    </div>
  </div>

  {journalPageIndex === 0 && (
    <p className="mimou-intro">
      Des souvenirs, des anecdotes et quelques mots
      laissés par les voyageurs de PK Airlines.
    </p>
  )}

  <div className="mimou-entry-list">
    {journalFirstPage.length === 0 ? (
      <p className="mimou-empty">
        Les premiers souvenirs apparaîtront ici
        pendant la soirée.
      </p>
    ) : (
      journalFirstPage.map(entry => (
        <article
          className="mimou-entry"
          key={entry.id}
        >
          {entry.label && (
            <small>{entry.label}</small>
          )}

          <p>{entry.content}</p>

          <footer>
            <strong>
              {entry.author_name || 'Voyageur'}
            </strong>

            {entry.author_group && (
              <span>{entry.author_group}</span>
            )}
          </footer>
        </article>
      ))
    )}
  </div>

  <span className="mimou-page-number">
    {journalWindowStart + 1}
  </span>
</BookPage>

{/* 3 — CARNET COLLECTIF SUITE */}

<BookPage>
  <div className="mimou-page-heading">
    <span>💬</span>

    <div>
      <small>Carnet collectif</small>
      <h2>Encore quelques souvenirs…</h2>
    </div>
  </div>

  <div className="mimou-entry-list">
    {journalSecondPage.length === 0 ? (
      <p className="mimou-empty">
        Cette page se remplira au fil de la soirée.
      </p>
    ) : (
      journalSecondPage.map(entry => (
        <article
          className="mimou-entry"
          key={entry.id}
        >
          {entry.label && (
            <small>{entry.label}</small>
          )}

          <p>{entry.content}</p>

          <footer>
            <strong>
              {entry.author_name || 'Voyageur'}
            </strong>

            {entry.author_group && (
              <span>{entry.author_group}</span>
            )}
          </footer>
        </article>
      ))
    )}
  </div>

  {(hasPreviousJournalPages || hasNextJournalPages) && (
    <div className="mimou-journal-navigation">
      {hasPreviousJournalPages && (
        <button
          type="button"
          onClick={() => {
            setJournalPageIndex(index =>
              Math.max(0, index - 1)
            )
          }}
        >
          ← Précédents
        </button>
      )}

      {hasNextJournalPages && (
        <button
          type="button"
          onClick={() => {
            setJournalPageIndex(index => index + 1)
          }}
        >
          Suivants →
        </button>
      )}
    </div>
  )}

  <span className="mimou-page-number">
    {journalWindowStart + 2}
  </span>
</BookPage>

          {/* 4 — PHOTOS */}

          <BookPage>
            <div className="mimou-page-heading">
              <span>📸</span>

              <div>
                <small>Album de bord</small>
                <h2>Les photos de la soirée</h2>
              </div>
            </div>

            <div className="mimou-photo-page">
              <div className="mimou-polaroid">
                <span>📷</span>
              </div>

              <p>
                Les voyageurs peuvent déposer leurs photos
                dans l’album commun de Patricia.
              </p>

              <a
                className="mimou-album-button"
                href={CONFIG.albumUrl}
                target="_blank"
                rel="noreferrer"
              >
                📸 Voir toutes les photos
              </a>
            </div>

            <span className="mimou-page-number">
              3
            </span>
          </BookPage>

          {/* 5 — COURRIER PRIVÉ */}

          <BookPage>
            <div className="mimou-page-heading">
              <span>💌</span>

              <div>
                <small>Courrier confidentiel</small>
                <h2>Rien que pour Mimou</h2>
              </div>
            </div>

            {!unlocked ? (
              <div className="mimou-lock">
                <div className="mimou-lock__icon">
                  🔐
                </div>

                <p>
                  Ces mots ont été confiés à Patricia
                  uniquement.
                </p>

                <button
                  type="button"
                  className="mimou-pin-trigger"
                  onClick={() => {
                    setError('')
                    setPinOpen(true)
                  }}
                >
                  <span>Code d’accès</span>

                  <strong>••••</strong>

                  <small>
                    Toucher pour saisir le code
                  </small>
                </button>
              </div>
            ) : (
              <div className="mimou-entry-list">
  {visiblePrivateMessages.length === 0 ? (
    <p className="mimou-empty">
      Aucun petit mot privé pour le moment.
    </p>
  ) : (
    visiblePrivateMessages.map(message => (
      <article
        className="mimou-entry mimou-entry--private"
        key={message.id}
      >
        <p>{message.content}</p>

        <footer>
          <strong>
            {message.author_name || 'Voyageur'}
          </strong>

          {message.author_group && (
            <span>{message.author_group}</span>
          )}
        </footer>
      </article>
    ))
  )}

  {(hasPreviousPrivateMessages ||
    hasNextPrivateMessages) && (
    <div className="mimou-journal-navigation">
      {hasPreviousPrivateMessages && (
        <button
          type="button"
          onClick={() => {
            setPrivatePageIndex(index =>
              Math.max(0, index - 1)
            )
          }}
        >
          ← Précédents
        </button>
      )}

      {hasNextPrivateMessages && (
        <button
          type="button"
          onClick={() => {
            setPrivatePageIndex(index => index + 1)
          }}
        >
          Suivants →
        </button>
      )}
    </div>
  )}
</div>
            )}

            <span className="mimou-page-number">
              4
            </span>
          </BookPage>

          {/* 6 — QUATRIÈME DE COUVERTURE */}

          <BookPage className="mimou-back-cover">
            <div className="mimou-back-cover__content">
              <span>✈</span>

              <p>PK Airlines</p>

              <h2>
                Bien travailler,
                <br />
                bien s’amuser.
              </h2>

              <small>Vol PK 1608</small>
            </div>
          </BookPage>

        </HTMLFlipBook>
      </div>

      {/* SAISIE DU CODE — HORS DU LIVRE */}

      {pinOpen && (
        <div
          className="mimou-pin-overlay"
          onClick={() => {
            if (!loading) {
              setPinOpen(false)
              setError('')
            }
          }}
        >
          <div
            className="mimou-pin-dialog"
            onClick={event =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className="mimou-pin-close"
              onClick={() => {
                if (!loading) {
                  setPinOpen(false)
                  setError('')
                }
              }}
              aria-label="Fermer"
            >
              ×
            </button>

            <div className="mimou-pin-dialog__icon">
              💌
            </div>

            <small>
              Courrier confidentiel
            </small>

            <h2>Rien que pour Mimou</h2>

            <p>
              Entre ton code pour ouvrir les petits mots
              qui t’ont été confiés.
            </p>

            <label htmlFor="mimou-pin">
              Code d’accès
            </label>

            <input
              id="mimou-pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              value={pin}
              onChange={event => {
                setPin(event.target.value)
                setError('')
              }}
              onKeyDown={event => {
                if (
                  event.key === 'Enter' &&
                  !loading
                ) {
                  unlockMimou()
                }
              }}
              placeholder="••••"
            />

            {error && (
              <p className="mimou-error">
                {error}
              </p>
            )}

            <button
              type="button"
              className="mimou-unlock-button"
              onClick={unlockMimou}
              disabled={loading}
            >
              {loading
                ? 'Ouverture…'
                : '🔓 Ouvrir le courrier'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}