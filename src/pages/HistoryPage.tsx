import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useHistoryStore } from '../stores/useHistoryStore'
import { useThemeStore } from '../stores/useThemeStore'
import { formatGPA, getCountryFlag, getCountryCodeFromName } from '../lib/utils'

export function HistoryPage() {
  const { isDark } = useThemeStore()
  const { entries, remove, clear } = useHistoryStore()
  const navigate = useNavigate()

  const textColor = isDark ? 'text-white' : 'text-slate-900'
  const subColor = isDark ? 'text-slate-400' : 'text-slate-600'
  const cardBg = isDark ? 'bg-white/4 border-white/8' : 'bg-white border-slate-200/80 shadow-sm'

  if (!entries.length) {
    return (
      <div className="max-w-2xl mx-auto px-4 text-center pt-20">
        <div className="text-6xl mb-6">📭</div>
        <h2 className={`text-2xl font-bold mb-3 ${textColor}`}>No History Yet</h2>
        <p className={`text-sm mb-8 ${subColor}`}>
          Your past GPA calculations will appear here. They're saved in your browser.
        </p>
        <motion.button
          onClick={() => navigate('/')}
          className="px-8 py-3 rounded-2xl bg-violet-600 text-white font-bold hover:bg-violet-500 transition-colors"
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
        >
          Start Calculating
        </motion.button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <i className="fa-solid fa-clock text-violet-400"></i>
          </div>
          <div>
            <h1 className={`text-xl font-black ${textColor}`}>Calculation History</h1>
            <p className={`text-xs ${subColor}`}>{entries.length} saved result{entries.length !== 1 ? 's' : ''} · Stored in browser</p>
          </div>
        </div>

        <motion.button
          onClick={clear}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-400 border border-red-400/20 bg-red-400/5 hover:bg-red-400/15 transition-all"
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        >
          <i className="fa-solid fa-circle-xmark"></i>
          Clear All
        </motion.button>
      </div>

      {/* Entries */}
      <div className="space-y-3">
        <AnimatePresence>
          {entries.map((entry, idx) => {
            const isManual = entry.country === 'Manual Mode' || entry.countryCode === 'MM'
            const scale = parseFloat(entry.gradingPolicy?.grading_scale ?? '4') || 4
            const flag = isManual ? '⚡' : getCountryFlag(entry.countryCode || getCountryCodeFromName(entry.country))
            const date = new Date(entry.timestamp)
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

            return (
              <motion.div
                key={entry.id}
                className={`rounded-2xl border p-5 ${cardBg} group transition-all hover:border-violet-500/30`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ delay: idx * 0.04 }}
                layout
              >
                <div className="flex items-start gap-4">
                  {/* Country + Flag */}
                  <div className="text-3xl flex-shrink-0">{flag}</div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className={`font-bold text-sm ${textColor}`}>{entry.country}</h3>
                      {entry.level && (
                        <span className="flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400">
                          <i className="fa-solid fa-graduation-cap text-[9px]"></i>
                          {entry.level}
                        </span>
                      )}
                    </div>

                    {entry.university && (
                      <p className={`flex items-center gap-1.5 text-xs mb-2 ${subColor}`}>
                        <i className="fa-solid fa-building text-[10px]"></i>
                        {entry.university}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{dateStr} at {timeStr}</span>
                      <span>·</span>
                      <span>{entry.result.totalCredits} credits</span>
                    </div>
                  </div>

                  {/* CGPA badge */}
                  <div className="flex flex-col items-end gap-2">
                    <div className={`px-4 py-2 rounded-xl text-center ${
                      entry.result.cgpa / scale >= 0.75
                        ? 'bg-emerald-500/15 border border-emerald-500/25'
                        : entry.result.cgpa / scale >= 0.5
                        ? 'bg-amber-500/15 border border-amber-500/25'
                        : 'bg-red-500/15 border border-red-500/25'
                    }`}>
                      <div className={`text-xl font-black ${
                        entry.result.cgpa / scale >= 0.75 ? 'text-emerald-400' :
                        entry.result.cgpa / scale >= 0.5 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {formatGPA(entry.result.cgpa, scale)}
                      </div>
                      <div className="text-[9px] text-slate-500 font-semibold">CGPA / {scale.toFixed(1)}</div>
                    </div>

                    <motion.button
                      onClick={() => remove(entry.id)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 transition-all"
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </motion.button>
                  </div>
                </div>

                {/* Semester bars */}
                {entry.result.semesterResults && entry.result.semesterResults.length > 1 && (
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-end gap-1.5 h-12">
                    {entry.result.semesterResults.map((sem) => (
                      <div
                        key={sem.semesterId}
                        className="flex-1 rounded-t-sm bg-gradient-to-t from-violet-600 to-violet-400 min-w-[6px]"
                        style={{ height: `${Math.max(8, (sem.gpa / scale) * 100)}%` }}
                        title={`${sem.semesterName}: ${formatGPA(sem.gpa, scale)}`}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
