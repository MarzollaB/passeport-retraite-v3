export default function StampReveal({ destination, completedCount, onContinue }) {
  if (!destination) return null
  const passportReady = completedCount >= 3

  return (
    <section className="stamp-reveal">
      <div className="stamp-reveal__plane">✈</div>
      <p className="eyebrow">Mission accomplie</p>
      <h1>Nouveau tampon obtenu</h1>

      <div className={`stamp-reveal__stamp ${
        destination.type === 'visa'
          ? 'stamp-reveal__stamp--visa'
          : 'stamp-reveal__stamp--bonus'
      }`}>
        <span className="stamp-reveal__flag">{destination.flag}</span>
        <small>{destination.type === 'visa' ? destination.label : 'Nouvelle escale'}</small>
        <strong>{destination.country}</strong>
        <span className="stamp-reveal__validated">VALIDÉ</span>
      </div>

      {passportReady && completedCount === 3 && (
        <section className="stamp-reveal__message">
          <span>🛂</span>
          <div>
            <strong>Les trois visas sont obtenus</strong>
            <p>Votre passeport peut désormais être validé lorsque vous quitterez la soirée.</p>
          </div>
        </section>
      )}

      {destination.type === 'bonus' && (
        <p className="stamp-reveal__bonus-text">
          Cette escale bonus compte pour le titre de <strong>Grand Voyageur</strong>.
        </p>
      )}

      <button className="button button--gold" onClick={onContinue}>
        Continuer mon voyage
      </button>
    </section>
  )
}
