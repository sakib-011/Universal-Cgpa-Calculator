import { motion } from 'framer-motion'
import { useThemeStore } from '../../stores/useThemeStore'
import type { SubjectEntry, GradeMapping } from '../../types'

interface Props {
  subject: SubjectEntry
  gradeMapping: GradeMapping[]
  inputMode: 'marks' | 'letter'
  onUpdate: (updates: Partial<SubjectEntry>) => void
  onRemove: () => void
  index: number
  showRetake?: boolean
}

export function SubjectRow({ subject, gradeMapping, inputMode, onUpdate, onRemove, index, showRetake }: Props) {
  const { isDark } = useThemeStore()

  const inputCls = `w-full rounded-lg px-2 py-1.5 text-xs outline-none transition-colors border ${
    isDark
      ? 'bg-white/5 border-white/8 text-white focus:border-violet-500/40'
      : 'bg-white border-slate-200 text-slate-800 focus:border-violet-400'
  }`

  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ delay: index * 0.02 }}
      className={`border-b group ${isDark ? 'border-white/5' : 'border-slate-100'}`}
    >
      {/* # */}
      <td className="py-2 px-1.5 text-[10px] text-slate-500 font-mono w-6">{index + 1}</td>

      {/* Name */}
      <td className="py-2 px-1.5">
        <input
          type="text" value={subject.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder={`Subject ${index + 1}`}
          className={inputCls}
        />
      </td>

      {/* Credit */}
      <td className="py-2 px-1.5 w-16">
        <input
          type="number" value={subject.credit}
          onChange={(e) => onUpdate({ credit: parseFloat(e.target.value) || 0 })}
          min={0} max={20} step={0.5}
          className={inputCls}
        />
      </td>

      {/* Marks or Grade */}
      <td className="py-2 px-1.5 w-24">
        {inputMode === 'marks' ? (
          <input
            type="number" value={subject.marks ?? ''}
            onChange={(e) => {
              const m = parseFloat(e.target.value)
              if (!isNaN(m)) onUpdate({ marks: m })
              else onUpdate({ marks: undefined, letterGrade: undefined, gradePoint: undefined })
            }}
            placeholder="0-100" min={0} max={100}
            className={inputCls}
          />
        ) : (
          <select
            value={subject.letterGrade ?? ''}
            onChange={(e) => onUpdate({ letterGrade: e.target.value })}
            className={`${inputCls} cursor-pointer`}
          >
            <option value="">—</option>
            {gradeMapping.map((g) => (
              <option key={g.letter} value={g.letter}>{g.letter}</option>
            ))}
          </select>
        )}
      </td>

      {/* Grade Point */}
      <td className="py-2 px-1.5 w-16">
        <div className={`text-center py-1.5 rounded-lg text-xs font-bold ${
          subject.gradePoint !== undefined
            ? subject.gradePoint > 0
              ? 'text-emerald-400 bg-emerald-400/10'
              : 'text-red-400 bg-red-400/10'
            : isDark ? 'text-slate-600 bg-white/3' : 'text-slate-400 bg-slate-50'
        }`}>
          {subject.gradePoint !== undefined ? subject.gradePoint.toFixed(2) : '—'}
        </div>
      </td>

      {/* Type */}
      <td className="py-2 px-1.5 w-20">
        <select
          value={subject.type}
          onChange={(e) => onUpdate({ type: e.target.value as SubjectEntry['type'] })}
          className={`${inputCls} cursor-pointer`}
        >
          <option value="theory">Theory</option>
          <option value="lab">Lab</option>
          <option value="thesis">Thesis</option>
          <option value="optional">Optional</option>
        </select>
      </td>

      {/* Retake */}
      {showRetake && (
        <td className="py-2 px-1.5 text-center w-12">
          <input
            type="checkbox" checked={!!subject.isRetake}
            onChange={(e) => onUpdate({ isRetake: e.target.checked })}
            className="w-3.5 h-3.5 accent-violet-500 cursor-pointer"
          />
        </td>
      )}

      {/* Delete */}
      <td className="py-2 px-1.5 w-8">
        <motion.button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-red-400/50 hover:text-red-400 hover:bg-red-400/10 transition-all"
          whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }}
        >
          <i className="fa-solid fa-trash-can text-xs"></i>
        </motion.button>
      </td>
    </motion.tr>
  )
}
