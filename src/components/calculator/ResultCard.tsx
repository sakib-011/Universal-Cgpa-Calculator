import { motion } from 'framer-motion'
import { useThemeStore } from '../../stores/useThemeStore'
import { useCalculatorStore } from '../../stores/useCalculatorStore'
import { formatGPA } from '../../lib/utils'
import { exportToPDF, exportToPNG, exportToCSV } from '../../services/exportService'
import { ScholarshipWaiver } from './ScholarshipWaiver'
import type { CalculationResult } from '../../types'
import toast from 'react-hot-toast'

interface Props {
  result: CalculationResult
  onReset: () => void
}

function gpaColor(gpa: number, scale: number): string {
  const r = gpa / scale
  if (r >= 0.9) return 'from-emerald-500 to-teal-500'
  if (r >= 0.75) return 'from-blue-500 to-violet-500'
  if (r >= 0.6) return 'from-yellow-500 to-orange-500'
  if (r >= 0.4) return 'from-orange-500 to-red-500'
  return 'from-red-600 to-rose-700'
}

function gpaLabel(gpa: number, scale: number): string {
  const r = gpa / scale
  if (r >= 0.9) return '🏆 Excellent'
  if (r >= 0.75) return '⭐ Very Good'
  if (r >= 0.6) return '👍 Good'
  if (r >= 0.4) return '📚 Average'
  return '📖 Needs Improvement'
}

export function ResultCard({ result, onReset }: Props) {
  const { isDark } = useThemeStore()
  const { gradingPolicy, subjects, semesters } = useCalculatorStore()
  const scale = parseFloat(gradingPolicy?.grading_scale ?? '4') || 4

  const doExport = async (type: 'pdf' | 'png' | 'csv') => {
    try {
      if (type === 'pdf') { await exportToPDF('result-card'); toast.success('PDF saved!') }
      else if (type === 'png') { await exportToPNG('result-card'); toast.success('PNG saved!') }
      else if (gradingPolicy) { exportToCSV(subjects, semesters, result, gradingPolicy); toast.success('CSV saved!') }
    } catch { toast.error('Export failed') }
  }

  const stats = [
    { label: 'Total Credits', value: result.totalCredits.toFixed(1), icon: 'fa-book-open' },
    { label: 'Earned', value: result.earnedCredits.toFixed(1), icon: 'fa-chart-line' },
    { label: 'Last GPA', value: formatGPA(result.gpa, scale), icon: 'fa-trophy' },
  ]

  const exports = [
    { type: 'pdf' as const, label: 'PDF', icon: 'fa-file-pdf', color: 'violet' },
    { type: 'png' as const, label: 'PNG', icon: 'fa-image', color: 'blue' },
    { type: 'csv' as const, label: 'CSV', icon: 'fa-file-csv', color: 'emerald' },
  ]

  return (
    <motion.div
      id="result-card"
      className={`rounded-3xl overflow-hidden border shadow-2xl ${isDark ? 'border-white/10' : 'border-slate-200'}`}
      initial={{ opacity: 0, scale: 0.92, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
    >
      {/* CGPA Hero */}
      <div className={`relative p-6 sm:p-8 text-center bg-gradient-to-br ${gpaColor(result.cgpa, scale)} overflow-hidden`}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-white/30" />
          <div className="absolute -bottom-12 -right-12 w-36 h-36 rounded-full bg-white/20" />
        </div>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: 'spring' }}>
          <i className="fa-solid fa-trophy text-white/80 text-3xl sm:text-4xl mx-auto mb-3 block"></i>
        </motion.div>
        <motion.div
          className="text-5xl sm:text-6xl font-black text-white mb-1.5 tabular-nums"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        >
          {formatGPA(result.cgpa, scale)}
        </motion.div>
        <p className="text-white/70 text-sm font-medium">CGPA out of {scale.toFixed(2)}</p>
        <p className="text-white/90 text-base font-bold mt-1">{gpaLabel(result.cgpa, scale)}</p>
      </div>

      {/* Stats */}
      <div className={`grid grid-cols-3 divide-x ${isDark ? 'divide-white/8 bg-white/3' : 'divide-slate-200 bg-slate-50'}`}>
        {stats.map(({ label, value, icon }) => (
          <div key={label} className="flex flex-col items-center py-4 px-2">
            <i className={`fa-solid ${icon} text-slate-500 text-xs mb-1.5`}></i>
            <div className={`text-lg sm:text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</div>
            <div className="text-[9px] sm:text-[10px] text-slate-500 text-center">{label}</div>
          </div>
        ))}
      </div>

      {/* Semester bars */}
      {result.semesterResults.length > 1 && (
        <div className={`p-4 sm:p-5 border-t ${isDark ? 'border-white/8' : 'border-slate-200'}`}>
          <h4 className={`text-xs font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <i className="fa-solid fa-chart-bar mr-1.5 text-violet-400"></i>Semester Breakdown
          </h4>
          <div className="space-y-2.5">
            {result.semesterResults.map((sem, i) => (
              <motion.div key={sem.semesterId} className="flex items-center gap-2 sm:gap-3"
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              >
                <span className="text-[10px] text-slate-500 w-16 sm:w-20 truncate">{sem.semesterName}</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(sem.gpa / scale) * 100}%` }}
                    transition={{ delay: i * 0.04 + 0.25, duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
                <span className={`text-xs font-bold w-10 text-right ${isDark ? 'text-white' : 'text-slate-800'}`}>{formatGPA(sem.gpa, scale)}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Tuition Waiver Estimation */}
      <div className={`p-4 sm:p-5 border-t ${isDark ? 'border-white/8' : 'border-slate-200'}`}>
        <ScholarshipWaiver
          semesterGpa={result.gpa}
          semesterName={result.semesterResults.length > 0 ? result.semesterResults[result.semesterResults.length - 1].semesterName : 'Overall'}
        />
      </div>

      {/* Export buttons */}
      <div className={`flex items-center gap-2 sm:gap-2.5 p-3 sm:p-4 border-t ${isDark ? 'border-white/8' : 'border-slate-200'}`}>
        {exports.map(({ type, label, icon, color }) => (
          <motion.button
            key={type}
            onClick={() => doExport(type)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-2.5 rounded-xl text-xs font-semibold border transition-all
              bg-${color}-500/10 text-${color}-400 border-${color}-500/20 hover:bg-${color}-500/20`}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          >
            <i className={`fa-solid ${icon} text-xs`}></i>
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden text-[10px]">{label}</span>
          </motion.button>
        ))}
        <motion.button
          onClick={onReset}
          className={`p-2 sm:p-2.5 rounded-xl transition-all ${isDark ? 'text-slate-500 hover:text-white hover:bg-white/8' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'}`}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          title="New Calculation"
        >
          <i className="fa-solid fa-rotate-right text-sm"></i>
        </motion.button>
      </div>
    </motion.div>
  )
}
