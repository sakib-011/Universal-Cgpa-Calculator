import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SubjectRow } from './SubjectRow'
import { useCalculatorStore } from '../../stores/useCalculatorStore'
import { useThemeStore } from '../../stores/useThemeStore'

interface Props {
  onCalculate: () => void
}

export function DynamicCalculator({ onCalculate }: Props) {
  const { isDark } = useThemeStore()
  const {
    gradingPolicy, semesters, subjects,
    addSemester, removeSemester,
    addSubject, removeSubject, updateSubject,
  } = useCalculatorStore()
  const [inputMode, setInputMode] = useState<'marks' | 'letter'>('marks')
  const [expanded, setExpanded] = useState<Set<string>>(new Set(semesters.map((s) => s.id)))

  if (!gradingPolicy) return null

  const totalCredits = gradingPolicy.semester_based
    ? semesters.reduce((sum, sem) => sum + sem.subjects.reduce((sSum, s) => sSum + (s.credit || 0), 0), 0)
    : subjects.reduce((sum, s) => sum + (s.credit || 0), 0)

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }

  const textColor = isDark ? 'text-white' : 'text-slate-900'
  const subBg = isDark ? 'bg-white/3 border-white/6' : 'bg-slate-50 border-slate-200/60'
  const addBtnCls = isDark
    ? 'text-violet-400 bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/20'
    : 'text-violet-600 bg-violet-50 border-violet-200 hover:bg-violet-100'

  const tableHead = (
    <thead>
      <tr className={`text-[10px] uppercase tracking-wider border-b ${isDark ? 'text-slate-500 border-white/8' : 'text-slate-400 border-slate-200'}`}>
        <th className="pb-2 px-1.5 text-left w-6">#</th>
        <th className="pb-2 px-1.5 text-left">Subject</th>
        <th className="pb-2 px-1.5 text-left w-16">Cr</th>
        <th className="pb-2 px-1.5 text-left w-24">{inputMode === 'marks' ? 'Marks' : 'Grade'}</th>
        <th className="pb-2 px-1.5 text-center w-16">GP</th>
        <th className="pb-2 px-1.5 text-left w-20">Type</th>
        {gradingPolicy.retake && <th className="pb-2 px-1.5 text-center w-12">Re</th>}
        <th className="pb-2 px-1.5 w-8" />
      </tr>
    </thead>
  )

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 font-semibold">Input:</span>
          <div className={`flex rounded-xl p-0.5 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
            {(['marks', 'letter'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setInputMode(m)}
                className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-all capitalize ${
                  inputMode === m
                    ? 'bg-violet-600 text-white shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {m === 'marks' ? '% Marks' : 'Letter'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <span className={`px-2 py-0.5 rounded-md border ${isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-200'}`}>
            Scale: {gradingPolicy.grading_scale}
          </span>
          <span className={`px-2 py-0.5 rounded-md border ${isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-200'} font-bold text-violet-400`}>
            Total Credits: {totalCredits.toFixed(1)}
          </span>
          {gradingPolicy.semester_based && (
            <span className="px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-400 font-semibold">
              Semester
            </span>
          )}
        </div>
      </div>

      {/* Semester-based */}
      {gradingPolicy.semester_based ? (
        <div className="space-y-3">
          {semesters.map((sem, si) => {
            const semCredits = sem.subjects.reduce((sum, s) => sum + (s.credit || 0), 0)
            return (
              <motion.div
                key={sem.id}
                className={`rounded-2xl border overflow-hidden ${subBg}`}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: si * 0.06 }}
              >
                {/* Semester header */}
                <div
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${isDark ? 'hover:bg-white/3' : 'hover:bg-slate-100'}`}
                  onClick={() => toggle(sem.id)}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
                      <i className="fa-solid fa-book-open text-violet-400 text-xs"></i>
                    </div>
                    <span className={`font-semibold text-sm ${textColor}`}>{sem.name}</span>
                    <span className="text-[10px] text-slate-500">({sem.subjects.length})</span>
                    <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
                      {semCredits.toFixed(1)} Cr
                    </span>
                  </div>
                <div className="flex items-center gap-1.5">
                  {semesters.length > 1 && (
                    <motion.button
                      onClick={(e) => { e.stopPropagation(); removeSemester(sem.id) }}
                      className="p-1 rounded-md text-red-400/40 hover:text-red-400 hover:bg-red-400/10 transition-all"
                      whileHover={{ scale: 1.1 }}
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </motion.button>
                  )}
                  <i className={`fa-solid ${expanded.has(sem.id) ? 'fa-chevron-up' : 'fa-chevron-down'} text-slate-500 text-xs`}></i>
                </div>
              </div>

              <AnimatePresence>
                {expanded.has(sem.id) && (
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 pt-0">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[480px]">
                          {tableHead}
                          <tbody>
                            <AnimatePresence>
                              {sem.subjects.map((s, i) => (
                                <SubjectRow
                                  key={s.id}
                                  subject={s}
                                  gradeMapping={gradingPolicy.grade_mapping}
                                  inputMode={inputMode}
                                  onUpdate={(u) => updateSubject(s.id, u, sem.id)}
                                  onRemove={() => removeSubject(s.id, sem.id)}
                                  index={i}
                                  showRetake={gradingPolicy.retake}
                                />
                              ))}
                            </AnimatePresence>
                          </tbody>
                        </table>
                      </div>
                      <motion.button
                        onClick={() => addSubject(sem.id)}
                        className={`mt-2 flex items-center gap-1.5 text-[10px] font-semibold px-3 py-2 rounded-lg border transition-all ${addBtnCls}`}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      >
                        <i className="fa-solid fa-plus text-[10px]"></i> Add Subject
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )})}

          <motion.button
            onClick={addSemester}
            className={`w-full py-3 rounded-2xl border-2 border-dashed text-xs font-semibold transition-all ${
              isDark ? 'border-white/8 text-slate-500 hover:border-violet-500/30 hover:text-violet-400' : 'border-slate-300 text-slate-500 hover:border-violet-400 hover:text-violet-600'
            }`}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          >
            <i className="fa-solid fa-plus text-[10px] mr-1.5"></i> Add Semester
          </motion.button>
        </div>
      ) : (
        /* Non-semester */
        <div className={`rounded-2xl border overflow-hidden ${subBg}`}>
          <div className="p-3 overflow-x-auto">
            <table className="w-full min-w-[480px]">
              {tableHead}
              <tbody>
                <AnimatePresence>
                  {subjects.map((s, i) => (
                    <SubjectRow
                      key={s.id}
                      subject={s}
                      gradeMapping={gradingPolicy.grade_mapping}
                      inputMode={inputMode}
                      onUpdate={(u) => updateSubject(s.id, u)}
                      onRemove={() => removeSubject(s.id)}
                      index={i}
                      showRetake={gradingPolicy.retake}
                    />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          <div className={`px-3 pb-3 pt-1 border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
            <motion.button
              onClick={() => addSubject()}
              className={`flex items-center gap-1.5 text-[10px] font-semibold px-3 py-2 rounded-lg border transition-all ${addBtnCls}`}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            >
              <i className="fa-solid fa-plus text-[10px]"></i> Add Subject
            </motion.button>
          </div>
        </div>
      )}

      {/* Calculate */}
      <motion.button
        onClick={onCalculate}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-violet-500/30 transition-all"
        whileHover={{ scale: 1.02, boxShadow: '0 20px 60px rgba(124,58,237,0.4)' }}
        whileTap={{ scale: 0.98 }}
      >
        <i className="fa-solid fa-calculator mr-2"></i>Calculate GPA / CGPA
      </motion.button>
    </div>
  )
}
