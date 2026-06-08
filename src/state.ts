export type Kid = {
  id: string
  name: string
  age: number
  color: string
}

export type Chore = {
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

export type LedgerEntry = {
  id: string
  kidId: string
  type: 'earn' | 'bonus' | 'redeem' | 'payout'
  note: string
  points: number
  money: number
  date: string
}

export type Reward = {
  id: string
  title: string
  cost: number
  stock: number
  note: string
}

export type AppState = {
  chores: Chore[]
  ledger: LedgerEntry[]
  rewards: Reward[]
  redemptions: string[]
}

export const kids: Kid[] = [
  { id: 'ava', name: 'Ava', age: 9, color: '#38BDF8' },
  { id: 'kai', name: 'Kai', age: 7, color: '#A78BFA' },
]

export const defaultKid = kids[0]

export const initialState: AppState = {
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

export const storageKey = 'chore-allowance-ledger-state'

const choreStatuses: Chore['status'][] = ['todo', 'pending', 'approved']
const choreDueStates: Chore['due'][] = ['Today', 'Overdue', 'Optional']
const ledgerTypes: LedgerEntry['type'][] = ['earn', 'bonus', 'redeem', 'payout']

export function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function createEarnEntry(chore: Chore): LedgerEntry {
  return {
    id: createId('ledger'),
    kidId: chore.kidId,
    type: 'earn',
    note: chore.title,
    points: chore.points,
    money: chore.points * 0.25,
    date: 'Today',
  }
}

export function kidName(id: string) {
  return kids.find((kid) => kid.id === id)?.name ?? 'Anyone'
}

export function isAppState(value: unknown): value is AppState {
  return (
    isRecord(value) &&
    Array.isArray(value.chores) &&
    Array.isArray(value.ledger) &&
    Array.isArray(value.rewards) &&
    Array.isArray(value.redemptions) &&
    value.chores.every(isChore) &&
    value.ledger.every(isLedgerEntry) &&
    value.rewards.every(isReward) &&
    value.redemptions.every(isString)
  )
}

export function loadState() {
  try {
    const saved = localStorage.getItem(storageKey)
    if (!saved) return initialState

    const parsed = JSON.parse(saved) as unknown
    return isAppState(parsed) ? parsed : initialState
  } catch {
    return initialState
  }
}

export function writeState(nextState: AppState) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(nextState))
  } catch {
    // Keep the in-memory state usable even when storage is unavailable.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isChore(value: unknown): value is Chore {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.title) &&
    isString(value.kidId) &&
    isNumber(value.points) &&
    isNumber(value.difficulty) &&
    choreDueStates.includes(value.due as Chore['due']) &&
    isString(value.tag) &&
    typeof value.requiresApproval === 'boolean' &&
    choreStatuses.includes(value.status as Chore['status'])
  )
}

function isLedgerEntry(value: unknown): value is LedgerEntry {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.kidId) &&
    ledgerTypes.includes(value.type as LedgerEntry['type']) &&
    isString(value.note) &&
    isNumber(value.points) &&
    isNumber(value.money) &&
    isString(value.date)
  )
}

function isReward(value: unknown): value is Reward {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.title) &&
    isNumber(value.cost) &&
    isNumber(value.stock) &&
    isString(value.note)
  )
}
