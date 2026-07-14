import { motion } from 'framer-motion'
import { useThemeStore } from '../../stores/useThemeStore'
import type { GradeMapping } from '../../types'

interface Props {
  gradeMapping: GradeMapping[]
  gradingScale: string
  passMark: number
}

export function GradeTable({ gradeMapping, gradingScale, passMark }: Props) {
  const { isDark } = useThemeStore()
  const scale = parseFloat(gradingScale) || 4

  function colorFor(pt: number): string {
    const r = pt / scale
    if (r >= 0.9) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
    if (r >= 0.7) return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
    if (r >= 0.5) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
    if (r > 0) return 'text-orange-400 bg-orange-400/10 border-orange-400/20'
    return 'text-red-400 bg-red-400/10 border-red-400/20'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Grade Scale</h4>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <i className="fa-solid fa-circle-info"></i> Pass: {passMark}%
        </div>
      </div>
      <div className="space-y-1">
        {gradeMapping.map((g, i) => (
          <motion.div
            key={g.letter}
            className={`flex items-center gap-2.5 p-2 rounded-xl border ${isDark ? 'bg-white/2 border-white/5' : 'bg-slate-50 border-slate-100'}`}
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.025 }}
          >
            <div className={`w-10 text-center font-bold text-xs py-0.5 rounded-lg border ${colorFor(g.point)}`}>
              {g.letter}
            </div>
            <div className="w-16 text-[11px] text-slate-500">{g.marks}</div>
            <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: g.point === 0 ? '#ef4444' : `hsl(${(g.point / scale) * 130}, 65%, 55%)` }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(4, (g.point / scale) * 100)}%` }}
                transition={{ delay: i * 0.04, duration: 0.4, ease: 'easeOut' }}
              />
            </div>
            <div className={`w-10 text-right text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {g.point.toFixed(2)}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
