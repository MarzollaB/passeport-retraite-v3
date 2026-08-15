export default function Layout({ children, compact = false }) {
  return (
    <main className={`page layout ${compact ? 'page--compact' : ''}`}>
      <header className="topbar">
        <span>PK AIRLINES</span>
        <span>VOL PK 1608</span>
      </header>
      {children}
    </main>
  )
}
