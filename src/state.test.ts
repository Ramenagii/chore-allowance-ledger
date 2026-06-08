import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createEarnEntry,
  initialState,
  isAppState,
  kidName,
  loadState,
  storageKey,
  writeState,
} from './state'

describe('chore ledger state', () => {
  beforeEach(() => {
    const store = new Map<string, string>()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    vi.stubGlobal('localStorage', {
      clear: vi.fn(() => store.clear()),
      getItem: vi.fn((key: string) => store.get(key) ?? null),
      removeItem: vi.fn((key: string) => store.delete(key)),
      setItem: vi.fn((key: string, value: string) => {
        store.set(key, value)
      }),
    })
  })

  it('validates the seeded demo state shape', () => {
    expect(isAppState(initialState)).toBe(true)
  })

  it('rejects imported state with invalid chore statuses', () => {
    const imported = structuredClone(initialState)
    imported.chores[0].status = 'done' as never

    expect(isAppState(imported)).toBe(false)
  })

  it('creates allowance ledger entries from approved chores', () => {
    const chore = initialState.chores.find((item) => item.id === 'trash')
    expect(chore).toBeDefined()

    const entry = createEarnEntry(chore!)

    expect(entry).toMatchObject({
      kidId: 'ava',
      type: 'earn',
      note: 'Take out trash',
      points: 5,
      money: 1.25,
      date: 'Today',
    })
    expect(entry.id).toMatch(/^ledger-\d+-[a-z0-9]{5}$/)
  })

  it('loads valid saved state and falls back on corrupt saved JSON', () => {
    const saved = {
      ...initialState,
      redemptions: ['Kai redeemed 30 min screen time'],
    }

    localStorage.setItem(storageKey, JSON.stringify(saved))
    expect(loadState().redemptions).toEqual(['Kai redeemed 30 min screen time'])

    localStorage.setItem(storageKey, '{bad json')
    expect(loadState()).toBe(initialState)
  })

  it('keeps running if localStorage write fails', () => {
    const failingStorage = {
      clear: vi.fn(),
      getItem: vi.fn(),
      removeItem: vi.fn(),
      setItem: vi.fn(() => {
        throw new Error('storage unavailable')
      }),
    }
    vi.stubGlobal('localStorage', failingStorage)

    expect(() => writeState(initialState)).not.toThrow()
    expect(failingStorage.setItem).toHaveBeenCalledWith(storageKey, JSON.stringify(initialState))
  })

  it('falls back to demo state when localStorage read fails', () => {
    vi.stubGlobal('localStorage', {
      clear: vi.fn(),
      getItem: vi.fn(() => {
        throw new Error('storage unavailable')
      }),
      removeItem: vi.fn(),
      setItem: vi.fn(),
    })

    expect(loadState()).toBe(initialState)
  })

  it('resolves known kid names and falls back for unknown ids', () => {
    expect(kidName('kai')).toBe('Kai')
    expect(kidName('missing')).toBe('Anyone')
  })
})
