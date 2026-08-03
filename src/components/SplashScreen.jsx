export default function SplashScreen({
  visible,
  onContinue,
}) {
  return (
    <div
      className={`splash-screen ${
        visible ? 'visible' : 'hidden'
      }`}
    >
      <div className="boarding-card">
        <div className="boarding-logo">✈</div>

        <h2>Patricia Airlines</h2>

        <h1>Le Passeport de Patricia</h1>

        <p className="boarding-quote">
          Après avoir bien travaillé,
          <br />
          il est temps de bien s&apos;amuser !
        </p>

        <button
          type="button"
          className="splash-continue"
          onClick={onContinue}
        >
          Toucher pour embarquer
          <span>✈</span>
        </button>
      </div>
    </div>
  )
}