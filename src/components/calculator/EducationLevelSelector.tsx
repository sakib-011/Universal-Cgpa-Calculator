import { motion } from 'framer-motion'
import { useThemeStore } from '../../stores/useThemeStore'

interface Props {
  levels: string[]
  selected: string
  onSelect: (level: string) => void
  country: string
}

const ICONS: Record<string, string> = {
  primary: '📚', psc: '📖', jsc: '📝', ssc: '🎓', hsc: '🎒', diploma: '📋',
  honours: '🏛️', bba: '💼', mba: '📊', masters: '🎓', medical: '🏥',
  engineering: '⚙️', 'high school': '🏫', associate: '📄', bachelor: '🎓',
  master: '🔬', phd: '🔭', graduate: '🎓', mbbs: '🩺', bsc: '🔬',
  msc: '🧪', llb: '⚖️', btech: '💻',
}

function getIcon(lvl: string): string {
  const k = lvl.toLowerCase()
  for (const [key, v] of Object.entries(ICONS)) {
    if (k.includes(key)) return v
  }
  return '📚'
}

export function EducationLevelSelector({ levels, selected, onSelect, country }: Props) {
  const { isDark } = useThemeStore()

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
          <i className="fa-solid fa-graduation-cap text-violet-400"></i>
        </div>
        <div>
          <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Education Level</h3>
          <p className="text-[11px] text-slate-500">AI-discovered for {country}</p>
        </div>
      </div>

      <motion.div
        className="flex flex-wrap gap-2"
        initial="hidden" animate="show"
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }}
      >
        {levels.map((lvl) => {
          const active = selected === lvl
          return (
            <motion.button
              key={lvl}
              variants={{ hidden: { opacity: 0, scale: 0.85, y: 8 }, show: { opacity: 1, scale: 1, y: 0 } }}
              onClick={() => onSelect(lvl)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                active
                  ? 'bg-violet-600 text-white border-violet-400 shadow-lg shadow-violet-500/25'
                  : isDark
                  ? 'bg-white/5 text-slate-300 border-white/8 hover:bg-violet-500/15 hover:border-violet-500/30 hover:text-violet-300'
                  : 'bg-violet-50 text-slate-700 border-violet-200/60 hover:bg-violet-100 hover:border-violet-300'
              }`}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            >
              <span className="text-sm">{getIcon(lvl)}</span>
              {lvl}
              {active && <i className="fa-solid fa-chevron-right text-[10px] ml-0.5"></i>}
            </motion.button>
          )
        })}
      </motion.div>
    </div>
  )
}
