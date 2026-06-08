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
import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  createEarnEntry,
  createId,
  defaultKid,
  initialState,
  kidName,
  kids,
  loadState,
  writeState,
} from './state'
import type { AppState, LedgerEntry, Reward } from './state'

type Toast = {
  id: string
  message: string
  actionLabel?: string
  onAction?: () => void
}

function staggerStyle(index: number, step = 70): CSSProperties {
  return { '--delay': `${index * step}ms` } as CSSProperties
}

function barStyle(width: number, color: string): CSSProperties {
  return {
    '--target-width': `${Math.min(width, 100)}%`,
    background: color,
  } as CSSProperties
}

function App() {
  const [state, setState] = useState<AppState>(loadState)
  const [selectedKid, setSelectedKid] = useState('all')
  const [rewardKidId, setRewardKidId] = useState(defaultKid.id)
  const [toast, setToast] = useState<Toast | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [latestLedgerId, setLatestLedgerId] = useState<string | null>(null)
  const [highlightRewardId, setHighlightRewardId] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return undefined

    const timeout = window.setTimeout(() => setToast(null), toast.actionLabel ? 5200 : 3200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    if (!highlightRewardId) return undefined

    const timeout = window.setTimeout(() => setHighlightRewardId(null), 900)
    return () => window.clearTimeout(timeout)
  }, [highlightRewardId])

  const persist = (nextState: AppState) => {
    setState(nextState)
    writeState(nextState)
  }

  const updatePersistedState = (updater: (current: AppState) => AppState) => {
    setState((current) => {
      const nextState = updater(current)
      writeState(nextState)
      return nextState
    })
  }

  const showToast = (message: string, action?: Omit<Toast, 'id' | 'message'>) => {
    setToast({ id: createId('toast'), message, ...action })
  }

  const filteredChores = state.chores.filter((chore) => selectedKid === 'all' || chore.kidId === selectedKid)
  const pendingChores = state.chores.filter((chore) => chore.status === 'pending')
  const pendingCount = pendingChores.length
  const attentionCount = state.chores.filter((chore) => chore.status !== 'approved').length
  const approvedPoints = state.chores
    .filter((chore) => chore.status === 'approved')
    .reduce((total, chore) => total + chore.points, 0)

  const kidBalances = useMemo(
    () =>
      kids.reduce<Record<string, number>>((balances, kid) => {
        balances[kid.id] = state.ledger
          .filter((entry) => entry.kidId === kid.id)
          .reduce((total, entry) => total + entry.points, 0)
        return balances
      }, {}),
    [state.ledger],
  )

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

  const rewardKid = kids.find((kid) => kid.id === rewardKidId) ?? defaultKid
  const rewardKidBalance = kidBalances[rewardKid.id] ?? 0
  const heroSummary =
    attentionCount === 1
      ? 'One chore needs attention before allowance close-out.'
      : `${attentionCount} chores need attention before allowance close-out.`

  const selectKid = (kidId: string) => {
    setSelectedKid(kidId)
    if (kidId !== 'all') {
      setRewardKidId(kidId)
    }
  }

  const markDone = (id: string) => {
    const chore = state.chores.find((item) => item.id === id)
    if (!chore || chore.status !== 'todo') return

    if (chore.requiresApproval) {
      updatePersistedState((current) => ({
        ...current,
        chores: current.chores.map((item) => (item.id === id ? { ...item, status: 'pending' } : item)),
      }))
      showToast(`${chore.title} is waiting for approval.`)
      return
    }

    const ledgerEntry = createEarnEntry(chore)
    updatePersistedState((current) => ({
      ...current,
      chores: current.chores.map((item) => (item.id === id ? { ...item, status: 'approved' } : item)),
      ledger: [ledgerEntry, ...current.ledger],
    }))
    setLatestLedgerId(ledgerEntry.id)
    showToast(`${chore.title} was marked done.`)
  }

  const approve = (id: string) => {
    const chore = state.chores.find((item) => item.id === id)
    if (!chore || chore.status !== 'pending' || approvingId) return

    setApprovingId(id)
    window.setTimeout(() => {
      const ledgerEntry = createEarnEntry(chore)
      updatePersistedState((current) => ({
        ...current,
        chores: current.chores.map((item) => (item.id === id ? { ...item, status: 'approved' } : item)),
        ledger: [ledgerEntry, ...current.ledger],
      }))
      setLatestLedgerId(ledgerEntry.id)
      setApprovingId(null)
      showToast(`${kidName(chore.kidId)} earned ${chore.points} points.`)
    }, 220)
  }

  const redeem = (reward: Reward) => {
    if (reward.stock === 0) {
      showToast(`${reward.title} is out of stock.`)
      return
    }

    if (rewardKidBalance < reward.cost) {
      showToast(`${rewardKid.name} needs ${reward.cost - rewardKidBalance} more points for ${reward.title}.`)
      return
    }

    const previousState = state
    const ledgerEntry: LedgerEntry = {
      id: createId('redeem'),
      kidId: rewardKid.id,
      type: 'redeem',
      note: reward.title,
      points: -reward.cost,
      money: 0,
      date: 'Today',
    }
    const nextState = {
      ...state,
      rewards: state.rewards.map((item) =>
        item.id === reward.id ? { ...item, stock: Math.max(0, item.stock - 1) } : item,
      ),
      ledger: [ledgerEntry, ...state.ledger],
      redemptions: [`${rewardKid.name} redeemed ${reward.title}`, ...state.redemptions],
    }

    persist(nextState)
    setLatestLedgerId(ledgerEntry.id)
    setHighlightRewardId(reward.id)
    showToast(`${rewardKid.name} redeemed ${reward.title}.`, {
      actionLabel: 'Undo',
      onAction: () => {
        persist(previousState)
        setLatestLedgerId(null)
        setHighlightRewardId(null)
        showToast('Redemption undone.')
      },
    })
  }

  const resetDemo = () => {
    const previousState = state
    persist(initialState)
    setLatestLedgerId(null)
    showToast('Demo data restored.', {
      actionLabel: 'Undo',
      onAction: () => {
        persist(previousState)
        showToast('Reset undone.')
      },
    })
  }

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'chore-allowance-ledger-backup.json'
    link.click()
    URL.revokeObjectURL(url)
    showToast('Backup downloaded.')
  }

  const printCoupon = () => {
    window.print()
    showToast('Printable coupon opened.')
  }

  return (
    <main>
      <header className="shell-header reveal-item" style={staggerStyle(0)}>
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

      <section className="hero-band reveal-item" style={staggerStyle(1)} aria-label="Today summary">
        <div>
          <p className="eyebrow">Today mode</p>
          <h2>{heroSummary}</h2>
        </div>
        <div className="summary-grid">
          <Stat icon={<CheckCircle2 />} label="Approved" value={`${approvedPoints} pts`} delay={0} />
          <Stat icon={<ReceiptText />} label="Pending" value={`${pendingCount}`} delay={1} />
          <Stat icon={<BadgeDollarSign />} label="Rate" value="$0.25" delay={2} />
        </div>
      </section>

      <nav className="kid-tabs reveal-item" style={staggerStyle(2)} aria-label="Filter chores by kid">
        <button className={selectedKid === 'all' ? 'active' : ''} onClick={() => selectKid('all')}>
          Everyone
        </button>
        {kids.map((kid) => (
          <button
            className={selectedKid === kid.id ? 'active' : ''}
            key={kid.id}
            onClick={() => selectKid(kid.id)}
          >
            <span style={{ background: kid.color }} />
            {kid.name}
          </button>
        ))}
      </nav>

      <section className="dashboard">
        <div className="panel today-panel reveal-item" style={staggerStyle(3)}>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Focus list</p>
              <h3>Today</h3>
            </div>
            <CalendarDays size={22} />
          </div>
          <div className="chore-list" key={selectedKid}>
            {filteredChores.map((chore, index) => (
              <article className="chore-card" key={chore.id} style={staggerStyle(index, 55)}>
                <div className="chore-icon">{tagIcon(chore.tag)}</div>
                <div className="chore-main">
                  <div>
                    <h4>{chore.title}</h4>
                    <p>
                      {kidName(chore.kidId)} - {chore.points} pts - difficulty {chore.difficulty}
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
            {filteredChores.length === 0 && <p className="empty">No chores match this filter right now.</p>}
          </div>
        </div>

        <div className="panel approvals-panel reveal-item" style={staggerStyle(4)}>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Parent queue</p>
              <h3>Approvals</h3>
            </div>
            <Sparkles size={22} />
          </div>
          <div className="approval-list">
            {pendingChores.map((chore, index) => (
              <article
                className={`approval-card ${approvingId === chore.id ? 'is-leaving' : ''}`}
                key={chore.id}
                style={staggerStyle(index, 60)}
              >
                <div>
                  <strong>{kidName(chore.kidId)} marked done</strong>
                  <p>{chore.title}</p>
                </div>
                <button disabled={approvingId === chore.id} onClick={() => approve(chore.id)}>
                  Approve
                </button>
              </article>
            ))}
            {pendingCount === 0 && <p className="empty">Nice. Nothing is waiting on a grown-up.</p>}
          </div>
        </div>

        <div className="panel allowance-panel reveal-item" style={staggerStyle(5)}>
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
            {state.ledger.slice(0, 5).map((entry, index) => (
              <div
                className={`ledger-row ${entry.id === latestLedgerId ? 'is-new' : ''}`}
                key={entry.id}
                style={staggerStyle(index, 50)}
              >
                <div>
                  <strong>{entry.note}</strong>
                  <p>
                    {kidName(entry.kidId)} - {entry.date}
                  </p>
                </div>
                <span className={entry.points < 0 ? 'negative' : ''}>{entry.points} pts</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel rewards-panel reveal-item" style={staggerStyle(6)}>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Reward store</p>
              <h3>Coupons</h3>
            </div>
            <Gift size={22} />
          </div>
          <label className="reward-context">
            <span>Redeem for</span>
            <select value={rewardKidId} onChange={(event) => setRewardKidId(event.target.value)}>
              {kids.map((kid) => (
                <option key={kid.id} value={kid.id}>
                  {kid.name} ({kidBalances[kid.id] ?? 0} pts)
                </option>
              ))}
            </select>
          </label>
          <div className="reward-grid">
            {state.rewards.map((reward, index) => {
              const isOutOfStock = reward.stock === 0
              const isAffordable = rewardKidBalance >= reward.cost
              const unavailableReason = isOutOfStock
                ? 'Out of stock'
                : isAffordable
                  ? `${reward.stock} left`
                  : `${reward.cost - rewardKidBalance} more pts needed`

              return (
                <article
                  className={`reward-card ${highlightRewardId === reward.id ? 'is-redeemed' : ''}`}
                  key={reward.id}
                  style={staggerStyle(index, 60)}
                >
                  <Gift size={20} />
                  <h4>{reward.title}</h4>
                  <p>{reward.note}</p>
                  <small>{unavailableReason}</small>
                  <div>
                    <span>{reward.cost} pts</span>
                    <button onClick={() => redeem(reward)} disabled={isOutOfStock || !isAffordable}>
                      Redeem
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
          <button className="print-button" onClick={printCoupon}>
            <Printer size={18} />
            Print latest coupon
          </button>
        </div>

        <div className="panel fairness-panel reveal-item" style={staggerStyle(7)}>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">This week</p>
              <h3>Fairness</h3>
            </div>
            <Scale size={22} />
          </div>
          <div className="bars">
            {kidTotals.map((kid, index) => (
              <div className="bar-row" key={kid.id} style={staggerStyle(index, 80)}>
                <span>{kid.name}</span>
                <div>
                  <i style={barStyle(kid.points * 8, kid.color)} />
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

      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <span>{toast.message}</span>
          {toast.actionLabel && toast.onAction && (
            <button onClick={toast.onAction} type="button">
              {toast.actionLabel}
            </button>
          )}
        </div>
      )}
    </main>
  )
}

function Stat({ icon, label, value, delay }: { icon: ReactNode; label: string; value: string; delay: number }) {
  return (
    <div className="stat" style={staggerStyle(delay, 80)}>
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function tagIcon(tag: string) {
  if (tag === 'pets') return <PawPrint size={22} />
  if (tag === 'kitchen') return <Utensils size={22} />
  if (tag === 'plants') return <Home size={22} />
  return <Trash2 size={22} />
}

export default App
