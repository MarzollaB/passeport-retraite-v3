const CONFETTI_PIECES = Array.from({ length: 28 }, (_, index) => index)

export default function PassportCelebration() {
  return (
    <div className="passport-celebration" aria-hidden="true">
      <div className="passport-celebration__confetti">
        {CONFETTI_PIECES.map(index => (
          <span
            key={index}
            style={{
              '--confetti-index': index,
              '--confetti-delay': `${(index % 7) * 70}ms`,
              '--confetti-left': `${(index * 37) % 100}%`,
              '--confetti-rotation': `${(index * 47) % 360}deg`,
            }}
          />
        ))}
      </div>

      <div className="passport-celebration__stamp">
        <small>PK Airlines</small>
        <strong>PASSEPORT</strong>
        <span>VALIDÉ</span>
        <b>16 AOÛT 2026</b>
      </div>
    </div>
  )
}
