import { useEffect, useState } from 'react'
import { ANNOUNCEMENTS } from '../data/announcements'

export default function AnnouncementBanner() {
  const [announcementIndex, setAnnouncementIndex] =
    useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setAnnouncementIndex(currentIndex =>
        (currentIndex + 1) % ANNOUNCEMENTS.length
      )
    }, 12000)

    return () => {
      window.clearInterval(interval)
    }
  }, [])

  const announcement =
    ANNOUNCEMENTS[announcementIndex]

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

        <p key={announcement.id}>
          {announcement.text}
        </p>
      </div>
    </section>
  )
}