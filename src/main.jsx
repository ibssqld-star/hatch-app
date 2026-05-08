import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import HatchManager from './hatch-manager-v4 (2)'
import HatchSW from './hatch-sw-v4 (5)'
import HatchTeen from './HatchTeen'

const T = {
  bg: '#050b14', surface: '#0d1825', card: '#14233a',
  border: 'rgba(255,255,255,0.06)', text: '#e8ecf3',
  muted: '#8a96b0', teal: '#00E5B4', blue: '#00BFFF', purple: '#8B7CF8',
}

function AppSelector() {
  const [app, setApp] = useState(null)

  if (app === 'manager') return <HatchManager />
  if (app === 'sw')      return <HatchSW />
  if (app === 'teen')    return <HatchTeen />

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🐾</div>
        <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 36, color: T.text, marginBottom: 8 }}>Hatch</h1>
        <p style={{ color: T.muted, fontSize: 15, marginBottom: 40 }}>Who are you?</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { key: 'manager', emoji: '🏢', label: 'Manager',        sub: 'Oversee, approve & support',    color: T.teal },
            { key: 'sw',      emoji: '🤝', label: 'Support Worker', sub: 'Guide and create goals',         color: T.blue },
            { key: 'teen',    emoji: '🐣', label: 'Teen',           sub: 'Care for your pet & reach goals', color: T.purple },
          ].map(({ key, emoji, label, sub, color }) => (
            <button key={key} onClick={() => setApp(key)} style={{
              background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16,
              padding: '20px 24px', cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 16,
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = color}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
            >
              <div style={{ fontSize: 36, width: 52, height: 52, background: T.card, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{emoji}</div>
              <div>
                <div style={{ color: T.text, fontFamily: 'Syne', fontWeight: 800, fontSize: 18, marginBottom: 3 }}>{label}</div>
                <div style={{ color: T.muted, fontSize: 13 }}>{sub}</div>
              </div>
            </button>
          ))}
        </div>
        <p style={{ color: T.muted, fontSize: 11, marginTop: 32 }}>IBSS QLD · Hatch v1.0</p>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppSelector />
  </React.StrictMode>
)
