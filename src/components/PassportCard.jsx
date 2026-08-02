export default function PassportCard({ participant, passportNumber }) {
  return (
    <section className="passport-card" aria-label="Passeport">
      <div className="passport-card__cover">
        <div className="passport-emblem">✦</div>
        <p>PASSEPORT</p>
        <h2>PATRICIA AIRLINES</h2>
        <span>VISA RETRAITE</span>
      </div>

      <div className="passport-card__identity">
        <div className="passport-number">
          <span>N° de passeport</span>
          <strong>{passportNumber}</strong>
        </div>
        <div>
          <span>Nom</span>
          <strong>{participant.lastName}</strong>
        </div>
        <div>
          <span>Prénom</span>
          <strong>{participant.firstName}</strong>
        </div>
        <div className="passport-card__group">
          <span>Groupe</span>
          <strong>{participant.groupName}</strong>
        </div>
        <div className="passport-stamp">VALIDÉ<br />16 AOÛT 2026</div>
      </div>
    </section>
  )
}
