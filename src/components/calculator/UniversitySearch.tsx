import { useState } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '../../stores/useThemeStore'
import type { UniversityInfo } from '../../types'

interface Props {
  universities: UniversityInfo[]
  selected: UniversityInfo | null
  onSelect: (u: UniversityInfo) => void
  level: string
  country: string
}

const TYPE_COLORS: Record<string, string> = {
  public: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  private: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  national: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  international: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
}

export function UniversitySearch({ universities, selected, onSelect, level, country }: Props) {
  const { isDark } = useThemeStore()
  const [search, setSearch] = useState('')

  const filtered = universities.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.city?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
          <i className="fa-solid fa-building text-blue-400"></i>
        </div>
        <div>
          <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>University</h3>
          <p className="text-[11px] text-slate-500">{level} in {country}</p>
        </div>
      </div>

      {/* Search */}
      <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 mb-3 border transition-colors ${
        isDark ? 'bg-white/5 border-white/8 focus-within:border-blue-500/40' : 'bg-blue-50 border-blue-200/60 focus-within:border-blue-400'
      }`}>
        <i className="fa-solid fa-magnifying-glass text-slate-500 flex-shrink-0"></i>
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="flex-1 bg-transparent text-xs outline-none text-foreground placeholder-slate-500"
        />
      </div>

      {/* List */}
      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
        {filtered.map((u, i) => {
          const sel = selected?.name === u.name
          return (
            <motion.button
              key={u.name}
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => onSelect(u)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left border transition-all ${
                sel
                  ? isDark ? 'bg-blue-500/15 border-blue-500/35 shadow-lg shadow-blue-500/10' : 'bg-blue-100 border-blue-300'
                  : isDark ? 'bg-white/2 border-white/5 hover:bg-white/6 hover:border-white/12' : 'bg-white border-slate-100 hover:bg-blue-50/60'
              }`}
              whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.995 }}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                sel ? 'bg-blue-500 text-white' : 'bg-blue-500/15 text-blue-400'
              }`}>
                {u.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-xs truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{u.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {u.city && (
                    <span className="flex items-center gap-0.5 text-[10px] text-slate-500">
                      <i className="fa-solid fa-location-dot text-[9px] mr-0.5"></i>{u.city}
                    </span>
                  )}
                  {u.type && (
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border capitalize ${TYPE_COLORS[u.type] || TYPE_COLORS.public}`}>
                      {u.type}
                    </span>
                  )}
                </div>
              </div>
              {sel && <i className="fa-solid fa-chevron-right text-xs text-blue-400 flex-shrink-0"></i>}
            </motion.button>
          )
        })}
        {!filtered.length && (
          <p className="text-center py-6 text-sm text-slate-500">No matches for "{search}"</p>
        )}
      </div>
    </div>
  )
}
