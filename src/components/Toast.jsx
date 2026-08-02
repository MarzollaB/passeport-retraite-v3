import { useEffect } from 'react'

export default function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return undefined
    const timer = window.setTimeout(onClose, 4200)
    return () => window.clearTimeout(timer)
  }, [message, onClose])

  if (!message) return null

  return (
    <button className="toast" onClick={onClose}>
      <span>✦</span>
      <strong>{message}</strong>
    </button>
  )
}
