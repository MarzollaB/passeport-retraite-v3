import { BONUS_DESTINATIONS, REQUIRED_VISAS } from '../data/destinations'

const FLIGHT_PREFIX = 'PK2026'

export default function FlightBoard({
  completedCount,
  eventRunning,
  passportFinalized,
  cooldownSeconds,
  onStartMission,
}) {
  const destinations = [...REQUIRED_VISAS, ...BONUS_DESTINATIONS]
  const currentDestination = destinations[completedCount] ?? null
  const previousDestination = completedCount > 0 ? destinations[completedCount - 1] : null

  let status = 'EN ATTENTE'
  let statusClass = 'flight-board--waiting'

  if (passportFinalized) {
    status = 'VOYAGE TERMINÉ'
    statusClass = 'flight-board--completed'
  } else if (!eventRunning) {
    status = 'MISSIONS EN PAUSE'
    statusClass = 'flight-board--paused'
  } else if (cooldownSeconds > 0) {
    status = 'ESCALE EN PRÉPARATION'
    statusClass = 'flight-board--waiting'
  } else {
    status = 'EMBARQUEMENT OUVERT'
    statusClass = 'flight-board--boarding'
  }

  return (
    <section className={`flight-board ${statusClass}`}>
      <header className="flight-board__header">
        <div>
          <small>PK AIRLINES</small>
          <strong>TABLEAU DES EMBARQUEMENTS</strong>
        </div>
        <span>✈</span>
      </header>

      <div className="flight-board__columns">
        <span>VOL</span><span>DESTINATION</span><span>STATUT</span>
      </div>

      {previousDestination && (
        <div className="flight-board__row flight-board__row--departed">
          <strong>{FLIGHT_PREFIX}-{String(completedCount).padStart(2, '0')}</strong>
          <div>
            <span>{previousDestination.flag}</span>
            <div>
              <strong>{previousDestination.country}</strong>
              <small>Mission accomplie</small>
            </div>
          </div>
          <b>VALIDÉ</b>
        </div>
      )}

      <div className="flight-board__row flight-board__row--current">
        <strong>{FLIGHT_PREFIX}-{String(completedCount + 1).padStart(2, '0')}</strong>
        <div>
          <span>{currentDestination?.flag ?? '🏁'}</span>
          <div>
            <strong>{currentDestination?.country ?? 'Passeport complet'}</strong>
            <small>{currentDestination?.label ?? 'Toutes les escales ont été parcourues'}</small>
          </div>
        </div>
        <b>{status}</b>
      </div>

      {!passportFinalized && eventRunning && cooldownSeconds === 0 && currentDestination && (
        <button className="flight-board__button" onClick={onStartMission}>
          <span>✈</span>
          <div><small>PORTE OUVERTE</small><strong>Découvrir ma mission</strong></div>
          <i>›</i>
        </button>
      )}

      {!eventRunning && !passportFinalized && (
        <p className="flight-board__message">
          L’équipage a temporairement suspendu les départs. Votre progression est conservée.
        </p>
      )}

      {cooldownSeconds > 0 && eventRunning && !passportFinalized && (
        <p className="flight-board__message">
          Votre prochain vol sera affiché dès la fin de l’escale en cours.
        </p>
      )}

      {passportFinalized && (
        <p className="flight-board__message">
          Votre passeport est validé et votre voyage est officiellement terminé.
        </p>
      )}
    </section>
  )
}
