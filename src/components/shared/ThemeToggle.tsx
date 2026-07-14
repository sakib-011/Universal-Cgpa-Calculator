import { motion } from 'framer-motion'
import { useThemeStore } from '../../stores/useThemeStore'

export function ThemeToggle() {
  const { isDark, toggle } = useThemeStore()
  return (
    <motion.button
      onClick={toggle}
      aria-label="Toggle theme"
      className={`relative flex items-center w-14 h-7 rounded-full px-0.5 transition-colors duration-500 ${
        isDark ? 'bg-violet-900/70 border border-violet-700/40' : 'bg-slate-200 border border-slate-300'
      }`}
      whileTap={{ scale: 0.92 }}
    >
      <motion.div
        className={`w-6 h-6 rounded-full flex items-center justify-center shadow ${
          isDark ? 'bg-violet-500' : 'bg-white'
        }`}
        animate={{ x: isDark ? 28 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {isDark
          ? <i className="fa-solid fa-moon text-xs text-white"></i>
          : <i className="fa-solid fa-sun text-xs text-amber-500"></i>}
      </motion.div>
    </motion.button>
  )
}
