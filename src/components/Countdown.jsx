export default function Countdown({ seconds }) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  const formatted = `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`

  return (
    <section className="countdown-card">
      <div className="route-line"><span>ESCALE</span><i /><span>PROCHAIN VOL</span></div>
      <strong>{formatted}</strong>
      <small>Profitez de la soirée avant la prochaine mission.</small>
    </section>
  )
}
