import { useEffect, useMemo, useState } from 'react'
import { ANNOUNCEMENTS } from '../data/announcements'

function shuffle(array) {
  const copy = [...array]

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(
      Math.random() * (index + 1)
    )

    ;[copy[index], copy[randomIndex]] = [
      copy[randomIndex],
      copy[index],
    ]
  }

  return copy
}

export default function AnnouncementBanner() {
  const shuffledAnnouncements = useMemo(
    () => shuffle(ANNOUNCEMENTS),
    []
  )

  const [announcementIndex, setAnnouncementIndex] =
    useState(0)

  const [isChanging, setIsChanging] = useState(false)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIsChanging(true)

      window.setTimeout(() => {
        setAnnouncementIndex(currentIndex =>
          (currentIndex + 1) %
          shuffledAnnouncements.length
        )

        setIsChanging(false)
      }, 320)
    }, 12000)

    return () => {
      window.clearInterval(interval)
    }
  }, [shuffledAnnouncements.length])

  const announcement =
    shuffledAnnouncements[announcementIndex]

  if (!announcement) return null

  return (
    <section
      className="announcement-banner"
      aria-live="polite"
    >
      <div className="announcement-banner__icon">
        ✈
      </div>

      <div className="announcement-banner__content">
        <small>MESSAGE DE L’ÉQUIPAGE</small>

        <div
          className={`announcement-display ${
            isChanging
              ? 'announcement-display--changing'
              : ''
          }`}
        >
          <div className="announcement-display__top" />

          <p key={announcement.id}>
            {announcement.text}
          </p>

          <div className="announcement-display__bottom" />
        </div>
      </div>
    </section>
  )
}