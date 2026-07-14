import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCalculatorStore } from '../../stores/useCalculatorStore'
import { useThemeStore } from '../../stores/useThemeStore'
import type { WaiverRule, WaiverPolicy } from '../../types'

interface Props {
  semesterGpa: number
  semesterName?: string
}

export function ScholarshipWaiver({ semesterGpa, semesterName = 'Current Semester' }: Props) {
  const { isDark } = useThemeStore()
  const { gradingPolicy, setGradingPolicy } = useCalculatorStore()

  // Pull waiver policy or define a default one
  const initialPolicy = gradingPolicy?.waiver_policy || {
    has_waiver: false,
    rules: [
      { gpa_threshold: 3.50, waiver_percentage: 20, details: '20% Waiver' },
      { gpa_threshold: 3.75, waiver_percentage: 50, details: '50% Waiver' },
      { gpa_threshold: 3.90, waiver_percentage: 100, details: '100% Waiver' },
    ],
    details: 'Enter custom scholarship/waiver rules for this scale.',
  }

  const [policy, setPolicy] = useState<WaiverPolicy>({
    has_waiver: initialPolicy.has_waiver,
    rules: [...initialPolicy.rules].sort((a, b) => b.gpa_threshold - a.gpa_threshold),
    details: initialPolicy.details,
    source_url: initialPolicy.source_url,
  })

  const [isEditing, setIsEditing] = useState(false)
  const [newThreshold, setNewThreshold] = useState('')
  const [newPercentage, setNewPercentage] = useState('')
  const [newDetails, setNewDetails] = useState('')

  // Sync state if store updates
  useEffect(() => {
    if (gradingPolicy?.waiver_policy) {
      setPolicy({
        has_waiver: gradingPolicy.waiver_policy.has_waiver,
        rules: [...gradingPolicy.waiver_policy.rules].sort((a, b) => b.gpa_threshold - a.gpa_threshold),
        details: gradingPolicy.waiver_policy.details,
        source_url: gradingPolicy.waiver_policy.source_url,
      })
    }
  }, [gradingPolicy])

  // Calculate matching waiver percentage
  let matchedRule: WaiverRule | null = null
  if (policy.has_waiver || gradingPolicy?.country === 'Manual Mode' || !gradingPolicy?.waiver_policy) {
    // Find the highest threshold that the student's GPA satisfies
    const sorted = [...policy.rules].sort((a, b) => b.gpa_threshold - a.gpa_threshold)
    for (const r of sorted) {
      if (semesterGpa >= r.gpa_threshold) {
        matchedRule = r
        break
      }
    }
  }

  const handleToggleWaiver = () => {
    const nextVal = !policy.has_waiver
    const nextPolicy = { ...policy, has_waiver: nextVal }
    setPolicy(nextPolicy)
    updateStorePolicy(nextPolicy)
  }

  const handleAddRule = () => {
    const thresh = parseFloat(newThreshold)
    const pct = parseInt(newPercentage)
    if (isNaN(thresh) || isNaN(pct)) return

    const newRule: WaiverRule = {
      gpa_threshold: thresh,
      waiver_percentage: pct,
      details: newDetails || `${pct}% tuition waiver for GPA ≥ ${thresh.toFixed(2)}`,
    }

    const nextRules = [...policy.rules, newRule].sort((a, b) => b.gpa_threshold - a.gpa_threshold)
    const nextPolicy = { ...policy, rules: nextRules, has_waiver: true }
    setPolicy(nextPolicy)
    updateStorePolicy(nextPolicy)

    setNewThreshold('')
    setNewPercentage('')
    setNewDetails('')
  }

  const handleRemoveRule = (index: number) => {
    const nextRules = policy.rules.filter((_, i) => i !== index)
    const nextPolicy = { ...policy, rules: nextRules }
    setPolicy(nextPolicy)
    updateStorePolicy(nextPolicy)
  }

  const updateStorePolicy = (updatedPolicy: WaiverPolicy) => {
    if (gradingPolicy) {
      setGradingPolicy({
        ...gradingPolicy,
        waiver_policy: updatedPolicy,
      })
    }
  }

  const textColor = isDark ? 'text-white' : 'text-slate-900'
  const cardBg = isDark ? 'bg-white/4 border-white/8 shadow-xl' : 'bg-white border-slate-200/80 shadow-md'
  const inputCls = `rounded-lg px-2.5 py-1.5 text-xs outline-none transition-colors border ${
    isDark ? 'bg-white/5 border-white/8 text-white focus:border-violet-500/40' : 'bg-white border-slate-200 text-slate-800 focus:border-violet-400'
  }`

  // Waiver ribbon styling
  const waiverPercent = matchedRule ? matchedRule.waiver_percentage : 0
  const waiverStyle =
    waiverPercent === 100
      ? 'from-amber-400 to-yellow-600 text-white border-amber-400/30'
      : waiverPercent >= 50
      ? 'from-violet-500 to-purple-700 text-white border-violet-500/30'
      : waiverPercent > 0
      ? 'from-blue-500 to-indigo-700 text-white border-blue-500/30'
      : isDark
      ? 'from-slate-800 to-slate-900 text-slate-400 border-white/5'
      : 'from-slate-100 to-slate-200 text-slate-500 border-slate-200'

  return (
    <motion.div
      className={`rounded-3xl border overflow-hidden p-5 ${cardBg}`}
      layout
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <i className="fa-solid fa-award text-violet-400"></i>
          </div>
          <div>
            <h3 className={`font-black text-sm ${textColor}`}>Tuition Waiver & Scholarship</h3>
            <p className="text-[10px] text-slate-500">Estimations based on university criteria</p>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
            isEditing
              ? 'bg-violet-600 text-white border-violet-500'
              : isDark
              ? 'bg-white/5 border-white/8 text-slate-400 hover:text-white'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <i className="fa-solid fa-pen-to-square text-[10px]"></i>
          {isEditing ? 'Done' : 'Manage Rules'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!isEditing ? (
          <motion.div
            key="display"
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Status Card */}
            <div className={`p-4 rounded-2xl border bg-gradient-to-br flex items-center justify-between gap-4 ${waiverStyle}`}>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-widest opacity-85">{semesterName} Status</div>
                <div className="text-2xl font-black mt-1">
                  {waiverPercent > 0 ? `${waiverPercent}% Tuition Waiver` : 'No Waiver Standard'}
                </div>
                <p className="text-xs opacity-85 mt-1 max-w-[280px]">
                  {matchedRule
                    ? `Congrats! Your GPA of ${semesterGpa.toFixed(2)} met the threshold of ≥ ${matchedRule.gpa_threshold.toFixed(2)}.`
                    : `Requires minimum GPA of ${policy.rules[policy.rules.length - 1]?.gpa_threshold.toFixed(2) || '3.50'} to qualify.`}
                </p>
              </div>
              <div className="text-4xl pr-1">
                {waiverPercent === 100 ? '👑' : waiverPercent >= 50 ? '🏅' : waiverPercent > 0 ? '✨' : '📚'}
              </div>
            </div>

            {/* University rules list */}
            {policy.has_waiver ? (
              <div className="space-y-2">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">University Policy Criteria</div>
                <div className="grid gap-2">
                  {policy.rules.map((r, i) => {
                    const isActive = semesterGpa >= r.gpa_threshold && (!matchedRule || r.gpa_threshold === matchedRule.gpa_threshold)
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs transition-all ${
                          isActive
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : isDark ? 'bg-white/3 border-white/5 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        {isActive ? (
                          <i className="fa-solid fa-circle-check text-emerald-400 text-base flex-shrink-0"></i>
                        ) : (
                          <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${isDark ? 'border-white/10' : 'border-slate-300'}`} />
                        )}
                        <div className="flex-1 flex justify-between items-center">
                          <span className="font-bold">GPA ≥ {r.gpa_threshold.toFixed(2)}</span>
                          <span className={`font-black ${isActive ? 'text-emerald-400' : isDark ? 'text-white' : 'text-slate-900'}`}>
                            {r.waiver_percentage}% Waiver
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {policy.details && (
                  <p className="text-[10px] text-slate-500 italic mt-2 leading-relaxed bg-white/2 p-2 rounded-lg border border-white/5">
                    * {policy.details}
                  </p>
                )}
                {policy.source_url && (
                  <a
                    href={policy.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] text-violet-400 hover:underline block pt-1 font-bold"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square mr-1"></i>
                    View Official Scholarship Documentation
                  </a>
                )}
              </div>
            ) : (
              <div className="text-center py-4 space-y-2">
              <i className="fa-solid fa-circle-question text-slate-600 text-2xl mx-auto block text-center"></i>
                <p className={`text-xs ${textColor} font-semibold`}>No waiver rules defined</p>
                <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                  Click 'Manage Rules' above to add tuition waiver percentages for your grade scale thresholds.
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="edit"
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/2">
              <span className={`text-xs font-bold ${textColor}`}>Enable Waiver Calculations</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${policy.has_waiver ? 'bg-violet-500' : isDark ? 'bg-white/10' : 'bg-slate-300'}`}
                  onClick={handleToggleWaiver}
                >
                  <motion.div
                    className="w-4 h-4 rounded-full bg-white shadow-sm"
                    animate={{ x: policy.has_waiver ? 16 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </div>
              </label>
            </div>

            {/* List rules with delete option */}
            <div className="space-y-2">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Waiver Percentage Rules</div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                {policy.rules.map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-2 px-3 rounded-xl border text-xs ${
                      isDark ? 'bg-white/3 border-white/5 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span>
                      GPA ≥ <strong>{r.gpa_threshold.toFixed(2)}</strong> → <strong>{r.waiver_percentage}%</strong> Waiver
                    </span>
                    <button
                      onClick={() => handleRemoveRule(i)}
                      className="p-1 rounded-md text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add new rule */}
            <div className="p-3.5 rounded-2xl border border-dashed border-violet-500/20 bg-violet-500/5 space-y-3">
              <div className="text-[10px] text-violet-400 font-bold uppercase tracking-wider">Add Waiver Rule</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[8px] text-slate-500 block mb-0.5 font-bold uppercase">GPA Threshold</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="10"
                    placeholder="3.85"
                    value={newThreshold}
                    onChange={(e) => setNewThreshold(e.target.value)}
                    className={`w-full ${inputCls}`}
                  />
                </div>
                <div>
                  <label className="text-[8px] text-slate-500 block mb-0.5 font-bold uppercase">Waiver %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="50"
                    value={newPercentage}
                    onChange={(e) => setNewPercentage(e.target.value)}
                    className={`w-full ${inputCls}`}
                  />
                </div>
              </div>
              <div>
                <label className="text-[8px] text-slate-500 block mb-0.5 font-bold uppercase">Label Details (Optional)</label>
                <input
                  type="text"
                  placeholder="50% tuition waiver"
                  value={newDetails}
                  onChange={(e) => setNewDetails(e.target.value)}
                  className={`w-full ${inputCls}`}
                />
              </div>
                <button
                onClick={handleAddRule}
                className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
              >
                <i className="fa-solid fa-plus text-xs"></i> Add Rule
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
