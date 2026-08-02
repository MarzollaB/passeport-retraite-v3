export default function SplashScreen({ visible }) {
  return (
    <div className={`splash-screen ${visible ? 'visible' : 'hidden'}`}>
      <div className="boarding-card">
        <div className="boarding-logo">✈</div>
        <h2>Patricia Airlines</h2>
        <h1>Le Passeport de Patricia</h1>
        <p className="boarding-quote">
          Après avoir bien travaillé,<br />
          il est temps de bien s&apos;amuser !
        </p>
        <div className="boarding-loader">
          <span>🛂 Préparation de l&apos;embarquement...</span>
        </div>
      </div>
    </div>
  )
}
