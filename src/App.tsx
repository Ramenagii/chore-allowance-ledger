import {
  BadgeDollarSign,
  CalendarDays,
  CheckCircle2,
  Download,
  Gift,
  Home,
  PawPrint,
  Printer,
  ReceiptText,
  Repeat2,
  Scale,
  Sparkles,
  Trash2,
  Upload,
  Utensils,
} from 'lucide-react'
import { useMemo, useState } from 'react'

type Kid = {
  id: string
  name: string
  age: number
  color: string
}

type Chore = {
  id: string
  title: string
  kidId: string
  points: number
  difficulty: number
  due: 'Today' | 'Overdue' | 'Optional'
  tag: string
  requiresApproval: boolean
  status: 'todo' | 'pending' | 'approved'
}

type LedgerEntry = {
  id: string
  kidId: string
  type: 'earn' | 'bonus' | 'redeem' | 'payout'
  note: string
  points: number
  money: number
  date: string
}

type Reward = {
  id: string
  title: string
  cost: number
  stock: number
  note: string
}

type AppState = {
  chores: Chore[]
  ledger: LedgerEntry[]
  rewards: Reward[]
  redemptions: string[]
}

const kids: Kid[] = [
  { id: 'ava', name: 'Ava', age: 9, color: '#38BDF8' },
  { id: 'kai', name: 'Kai', age: 7, color: '#A78BFA' },
]

const initialState: AppState = {
  chores: [
    {
      id: 'feed-cat',
      title: 'Feed the cat',
      kidId: 'kai',
      points: 3,
      difficulty: 1,
      due: 'Today',
      tag: 'pets',
      requiresApproval: true,
      status: 'todo',
    },
    {
      id: 'trash',
      title: 'Take out trash',
      kidId: 'ava',
      points: 5,
      difficulty: 3,
      due: 'Today',
      tag: 'kitchen',
      requiresApproval: true,
      status: 'todo',
    },
    {
      id: 'dishes',
      title: 'Unload dishwasher',
      kidId: 'ava',
      points: 4,
      difficulty: 2,
      due: 'Overdue',
      tag: 'kitchen',
      requiresApproval: false,
      status: 'todo',
    },
    {
      id: 'plants',
      title: 'Water balcony plants',
      kidId: 'kai',
      points: 2,
      difficulty: 1,
      due: 'Optional',
      tag: 'plants',
      requiresApproval: false,
      status: 'approved',
    },
  ],
  ledger: [
    {
      id: 'l1',
      kidId: 'ava',
      type: 'earn',
      note: 'Last week close-out',
      points: 22,
      money: 5.5,
      date: 'May 22',
    },
    {
      id: 'l2',
      kidId: 'kai',
      type: 'bonus',
      note: 'Helped set the table',
      points: 4,
      money: 1,
      date: 'May 23',
    },
    {
      id: 'l3',
      kidId: 'ava',
      type: 'redeem',
      note: 'Choose Friday movie',
      points: -12,
      money: 0,
      date: 'May 24',
    },
  ],
  rewards: [
    { id: 'movie', title: 'Choose Friday movie', cost: 12, stock: 3, note: 'Family vote tiebreaker' },
    { id: 'screen', title: '30 min screen time', cost: 8, stock: 10, note: 'One coupon per day' },
    { id: 'park', title: 'Pick the park', cost: 10, stock: 2, note: 'Weekend outing' },
  ],
  redemptions: ['Ava redeemed Choose Friday movie'],
}

const storageKey = 'chore-allowance-ledger-state'

function loadState() {
  const saved = localStorage.getItem(storageKey)
  return saved ? (JSON.parse(saved) as AppState) : initialState
}

function App() {
  const [state, setState] = useState<AppState>(loadState)
  const [selectedKid, setSelectedKid] = useState('all')

  const persist = (nextState: AppState) => {
    setState(nextState)
    localStorage.setItem(storageKey, JSON.stringify(nextState))
  }

  const filteredChores = state.chores.filter((chore) => selectedKid === 'all' || chore.kidId === selectedKid)
  const pendingCount = state.chores.filter((chore) => chore.status === 'pending').length
  const approvedPoints = state.chores
    .filter((chore) => chore.status === 'approved')
    .reduce((total, chore) => total + chore.points, 0)

  const kidTotals = useMemo(
    () =>
      kids.map((kid) => {
        const chores = state.chores.filter((chore) => chore.kidId === kid.id)
        const points = chores.reduce((total, chore) => total + chore.points, 0)
        const difficulty = chores.reduce((total, chore) => total + chore.difficulty, 0)
        const missed = chores.filter((chore) => chore.due === 'Overdue').length
        return { ...kid, points, difficulty, missed, count: chores.length }
      }),
    [state.chores],
  )

  const markDone = (id: string) => {
    const next = {
      ...state,
      chores: state.chores.map((chore) =>
        chore.id === id ? { ...chore, status: chore.requiresApproval ? ('pending' as const) : ('approved' as const) } : chore,
      ),
    }
    persist(next)
  }

  const approve = (id: string) => {
    const chore = state.chores.find((item) => item.id === id)
    if (!chore) return
    const nextLedger: LedgerEntry = {
      id: `ledger-${Date.now()}`,
      kidId: chore.kidId,
      type: 'earn',
      note: chore.title,
      points: chore.points,
      money: chore.points * 0.25,
      date: 'Today',
    }
    persist({
      ...state,
      chores: state.chores.map((item) => (item.id === id ? { ...item, status: 'approved' } : item)),
      ledger: [nextLedger, ...state.ledger],
    })
  }

  const redeem = (reward: Reward) => {
    const next = {
      ...state,
      rewards: state.rewards.map((item) =>
        item.id === reward.id ? { ...item, stock: Math.max(0, item.stock - 1) } : item,
      ),
      ledger: [
        {
          id: `redeem-${Date.now()}`,
          kidId: 'ava',
          type: 'redeem' as const,
          note: reward.title,
          points: -reward.cost,
          money: 0,
          date: 'Today',
        },
        ...state.ledger,
      ],
      redemptions: [`Ava redeemed ${reward.title}`, ...state.redemptions],
    }
    persist(next)
  }

  const resetDemo = () => persist(initialState)

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'chore-allowance-ledger-backup.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main>
      <header className="shell-header">
        <div className="brand">
          <span className="logo-mark">
            <Scale size={21} />
          </span>
          <div>
            <h1>Home Ops Ledger</h1>
            <p>Keep it fair, keep it calm.</p>
          </div>
        </div>
        <div className="toolbar" aria-label="Ledger actions">
          <button onClick={exportBackup} title="Download backup">
            <Download size={18} />
            Export
          </button>
          <button onClick={resetDemo} title="Restore demo data">
            <Upload size={18} />
            Reset
          </button>
        </div>
      </header>

      <section className="hero-band" aria-label="Today summary">
        <div>
          <p className="eyebrow">Today mode</p>
          <h2>Three chores need attention before allowance close-out.</h2>
        </div>
        <div className="summary-grid">
          <Stat icon={<CheckCircle2 />} label="Approved" value={`${approvedPoints} pts`} />
          <Stat icon={<ReceiptText />} label="Pending" value={`${pendingCount}`} />
          <Stat icon={<BadgeDollarSign />} label="Rate" value="$0.25" />
        </div>
      </section>

      <nav className="kid-tabs" aria-label="Filter chores by kid">
        <button className={selectedKid === 'all' ? 'active' : ''} onClick={() => setSelectedKid('all')}>
          Everyone
        </button>
        {kids.map((kid) => (
          <button
            className={selectedKid === kid.id ? 'active' : ''}
            key={kid.id}
            onClick={() => setSelectedKid(kid.id)}
          >
            <span style={{ background: kid.color }} />
            {kid.name}
          </button>
        ))}
      </nav>

      <section className="dashboard">
        <div className="panel today-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Focus list</p>
              <h3>Today</h3>
            </div>
            <CalendarDays size={22} />
          </div>
          <div className="chore-list">
            {filteredChores.map((chore) => (
              <article className="chore-card" key={chore.id}>
                <div className="chore-icon">{tagIcon(chore.tag)}</div>
                <div className="chore-main">
                  <div>
                    <h4>{chore.title}</h4>
                    <p>
                      {kidName(chore.kidId)} · {chore.points} pts · difficulty {chore.difficulty}
                    </p>
                  </div>
                  <span className={`badge ${chore.due.toLowerCase()}`}>{chore.due}</span>
                </div>
                <button
                  className="primary-action"
                  disabled={chore.status !== 'todo'}
                  onClick={() => markDone(chore.id)}
                >
                  {chore.status === 'pending' ? 'Ask a grown-up' : chore.status === 'approved' ? 'Done' : 'Mark done'}
                </button>
              </article>
            ))}
          </div>
        </div>

        <div className="panel approvals-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Parent queue</p>
              <h3>Approvals</h3>
            </div>
            <Sparkles size={22} />
          </div>
          {state.chores
            .filter((chore) => chore.status === 'pending')
            .map((chore) => (
              <article className="approval-card" key={chore.id}>
                <div>
                  <strong>{kidName(chore.kidId)} marked done</strong>
                  <p>{chore.title}</p>
                </div>
                <button onClick={() => approve(chore.id)}>Approve</button>
              </article>
            ))}
          {pendingCount === 0 && <p className="empty">Nice. Nothing is waiting on a grown-up.</p>}
        </div>

        <div className="panel allowance-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Weekly close</p>
              <h3>Allowance</h3>
            </div>
            <ReceiptText size={22} />
          </div>
          <div className="money-row">
            <span>Projected payout</span>
            <strong>${(approvedPoints * 0.25).toFixed(2)}</strong>
          </div>
          <div className="ledger">
            {state.ledger.slice(0, 5).map((entry) => (
              <div className="ledger-row" key={entry.id}>
                <div>
                  <strong>{entry.note}</strong>
                  <p>
                    {kidName(entry.kidId)} · {entry.date}
                  </p>
                </div>
                <span className={entry.points < 0 ? 'negative' : ''}>{entry.points} pts</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel rewards-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Reward store</p>
              <h3>Coupons</h3>
            </div>
            <Gift size={22} />
          </div>
          <div className="reward-grid">
            {state.rewards.map((reward) => (
              <article className="reward-card" key={reward.id}>
                <Gift size={20} />
                <h4>{reward.title}</h4>
                <p>{reward.note}</p>
                <div>
                  <span>{reward.cost} pts</span>
                  <button onClick={() => redeem(reward)} disabled={reward.stock === 0}>
                    Redeem
                  </button>
                </div>
              </article>
            ))}
          </div>
          <button className="print-button" onClick={() => window.print()}>
            <Printer size={18} />
            Print latest coupon
          </button>
        </div>

        <div className="panel fairness-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">This week</p>
              <h3>Fairness</h3>
            </div>
            <Scale size={22} />
          </div>
          <div className="bars">
            {kidTotals.map((kid) => (
              <div className="bar-row" key={kid.id}>
                <span>{kid.name}</span>
                <div>
                  <i style={{ width: `${kid.points * 8}%`, background: kid.color }} />
                </div>
                <strong>{kid.points} pts</strong>
              </div>
            ))}
          </div>
          <article className="swap-card">
            <Repeat2 size={20} />
            <div>
              <strong>Similar effort swap</strong>
              <p>Swap trash duty with feeding the cat to bring weekly totals within 4 points.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="coupon-sheet" aria-label="Printable coupon preview">
        <div>
          <Gift size={28} />
          <p>Reward coupon</p>
          <h3>{state.redemptions[0] ?? 'No redemption yet'}</h3>
          <span>Signature ____________________</span>
        </div>
      </section>
    </main>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="stat">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function kidName(id: string) {
  return kids.find((kid) => kid.id === id)?.name ?? 'Anyone'
}

function tagIcon(tag: string) {
  if (tag === 'pets') return <PawPrint size={22} />
  if (tag === 'kitchen') return <Utensils size={22} />
  if (tag === 'plants') return <Home size={22} />
  return <Trash2 size={22} />
}

export default App
