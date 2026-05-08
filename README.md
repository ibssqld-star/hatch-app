# 🐾 Hatch

A therapeutic pet-care app for teens with support needs, built for IBSS QLD.

Teens care for a virtual pet while working toward real-life goals — with support workers and managers guiding the process behind the scenes.

---

## Apps

| App | Who | What they do |
|-----|-----|------|
| **Manager** | IBSS Manager | Create teens & SWs, assign SWs, approve goals, add progress notes |
| **Support Worker** | Support Worker | View assigned teens, create goals (pending approval), approve completions, add notes |
| **Teen** | Teen participant | Care for their pet, complete goals, play games, use the shop |

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and pick your role.

---

## How It Works

### Shared Storage
All three apps share storage under the `hatch_` prefix. In Claude artifacts this uses `window.storage`; locally it falls back to `localStorage`.

### Key storage keys
| Key | Contents |
|-----|----------|
| `hatch_user:{username}` | Full user record |
| `hatch_allTeens` | Array of teen user records |
| `hatch_allSWs` | Array of SW user records |
| `hatch_allManagers` | Array of manager records |
| `hatch_goals:{teenUsername}` | Array of goals for a teen |
| `hatch_lastSession:manager` | Last logged-in manager |
| `hatch_lastSession:sw` | Last logged-in SW |
| `hatch_lastSession:teen` | Last logged-in teen |

### Goal Status Flow
```
pending  →  active  →  pending_completion  →  completed
  ↑            ↑               ↑
SW creates   Manager        Teen marks done
             approves       SW or Manager approves
```

### Ticket Rewards
| Action | Tickets |
|--------|---------|
| Teen completes a goal | +5 |
| Manager approves a goal | +2 |
| Manager approves a completion | +2 |
| SW approves a completion | Teen +5 |

---

## Project Structure

```
hatch-app/
├── src/
│   ├── main.jsx          # App selector (Manager / SW / Teen)
│   ├── HatchManager.jsx  # Manager app
│   ├── HatchSW.jsx       # Support Worker app
│   └── HatchTeen.jsx     # Teen app
├── index.html
├── vite.config.js
└── package.json
```

---

## Built With
- React 18
- Vite
- Lucide React (icons)
- Tone.js (audio in teen app)

---

*IBSS QLD PTY LTD — Independence and Beyond Support Services*
