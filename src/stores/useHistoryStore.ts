import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { HistoryEntry } from '../types'

interface HistoryStore {
  entries: HistoryEntry[]
  add: (e: HistoryEntry) => void
  remove: (id: string) => void
  clear: () => void
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set) => ({
      entries: [],
      add: (e) => set((s) => ({ entries: [e, ...s.entries].slice(0, 50) })),
      remove: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
      clear: () => set({ entries: [] }),
    }),
    { name: 'gpa-history' }
  )
)
