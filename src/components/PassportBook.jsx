import { BONUS_DESTINATIONS, REQUIRED_VISAS } from '../data/destinations'

export default function PassportBook({
  participant,
  passportNumber,
  completedCount,
  passportFinalized,
  isStamping,
  onValidate,
}) {
  const passportCanBeValidated = completedCount >= REQUIRED_VISAS.length

  return (
    <section className="passport-book">
      <div className="passport-book__binding" />

      <article className="passport-page passport-page--identity">
        <div className="passport-page__watermark">✦</div>
        <p className="passport-page__heading">Patricia Airlines</p>
        <h2>Passeport de voyage</h2>

        <div className="passport-photo-placeholder">
          <span>✈</span>
          <small>VOYAGEUR</small>
        </div>

        <dl className="passport-identity">
          <div><dt>Nom</dt><dd>{participant.lastName}</dd></div>
          <div><dt>Prénom</dt><dd>{participant.firstName}</dd></div>
          <div><dt>Groupe</dt><dd>{participant.groupName}</dd></div>
          <div><dt>N° du passeport</dt><dd>{passportNumber}</dd></div>
          <div>
            <dt>Statut</dt>
            <dd>{passportFinalized ? 'Voyage terminé' : 'Voyageur en activité'}</dd>
          </div>
        </dl>

        <div className="passport-authority">
          <span>Autorité émettrice</span>
          <strong>Patricia Airlines</strong>
          <small>Émis le 16 août 2026</small>
        </div>

        <div className="passport-machine-line">
          PK&lt;{participant.lastName.toUpperCase()}&lt;&lt;{participant.firstName.toUpperCase()}
        </div>
      </article>

      <article className="passport-page passport-page--visas">
        <header className="passport-visas__header">
          <div>
            <p className="passport-page__heading">Contrôle des frontières</p>
            <h2>Visas obligatoires</h2>
          </div>
          <span className="passport-score">
            {completedCount} mission{completedCount > 1 ? 's' : ''}
          </span>
        </header>

        <div className="visa-grid">
          {REQUIRED_VISAS.map((destination, index) => {
            const earned = completedCount > index
            return (
              <div className={`visa-slot ${earned ? 'visa-slot--earned' : ''}`} key={destination.id}>
                <div className="visa-slot__flag">{destination.flag}</div>
                <div><small>{destination.label}</small><strong>{destination.country}</strong></div>
                {earned ? (
                  <div className="visa-stamp"><span>VALIDÉ</span><strong>{destination.country}</strong></div>
                ) : (
                  <div className="visa-slot__empty">À obtenir</div>
                )}
              </div>
            )
          })}
        </div>

        <section className="bonus-section">
          <div className="bonus-section__heading">
            <div><p className="passport-page__heading">Carnet d’escales</p><h3>Voyages bonus</h3></div>
            <span>{Math.max(0, completedCount - REQUIRED_VISAS.length)} / {BONUS_DESTINATIONS.length}</span>
          </div>

          <div className="bonus-grid">
            {BONUS_DESTINATIONS.map((destination, index) => {
              const earned = completedCount > index + REQUIRED_VISAS.length
              return (
                <div className={`bonus-stamp ${earned ? 'bonus-stamp--earned' : ''}`} key={destination.id}>
                  {earned ? (
                    <><span>{destination.flag}</span><strong>{destination.country}</strong><small>{destination.label}</small></>
                  ) : (
                    <><span>?</span><strong>Escale secrète</strong><small>Mission bonus</small></>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {!passportFinalized && (
          <div className="passport-validation">
            {!passportCanBeValidated ? (
              <p>
                Encore <strong>{REQUIRED_VISAS.length - completedCount}</strong> mission
                {REQUIRED_VISAS.length - completedCount > 1 ? 's' : ''} pour valider ce passeport.
              </p>
            ) : (
              <p>
                Les trois visas sont obtenus. Validez définitivement votre passeport lorsque vous quittez la soirée.
              </p>
            )}

            <button
              className="button button--gold"
              onClick={onValidate}
              disabled={!passportCanBeValidated || isStamping}
            >
              {isStamping ? '🛂 Apposition des tampons…' : '🛂 Valider définitivement mon passeport'}
            </button>
          </div>
        )}

        {passportFinalized && (
          <div className="passport-final-status">
            <span>✓</span>
            <div>
              <strong>Passeport officiellement validé</strong>
              <small>{completedCount} mission{completedCount > 1 ? 's' : ''} accomplie{completedCount > 1 ? 's' : ''}</small>
            </div>
          </div>
        )}
      </article>
    </section>
  )
}
