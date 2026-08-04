import { useEffect, useRef, useState } from 'react'

export default function TravelerNav({
  participant,
  onHome,
  onPassport,
  onProfile,
  onChangeTraveler,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function closeMenu(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', closeMenu)

    return () => {
      document.removeEventListener('pointerdown', closeMenu)
    }
  }, [])

  if (!participant) return null

  return (
    <div className="traveler-nav-shell">
      <nav className="traveler-nav">
        <div className="traveler-nav__brand">
          <span>✈</span>
          <strong>PATRICIA AIRLINES</strong>
          <small>VOL PK 1608</small>
        </div>

        <button
          className="traveler-nav__home"
          type="button"
          onClick={onHome}
        >
          <span>⌂</span>
          Accueil
        </button>

        <div
          className="traveler-nav__user"
          ref={menuRef}
        >
          <button
            className="traveler-nav__profile"
            type="button"
            aria-expanded={menuOpen}
            onClick={() =>
              setMenuOpen(current => !current)
            }
          >
            <span>👤</span>
            <strong>{participant.firstName}</strong>
            <i>{menuOpen ? '▴' : '▾'}</i>
          </button>

          {menuOpen && (
            <div className="traveler-nav__menu">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  onPassport()
                }}
              >
                <span>🛂</span>
                Voir mon passeport
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  onProfile()
                }}
              >
                <span>👤</span>
                Mon profil
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  onChangeTraveler()
                }}
              >
                <span>⇄</span>
                Changer de voyageur
              </button>
            </div>
          )}
        </div>
      </nav>
    </div>
  )
}