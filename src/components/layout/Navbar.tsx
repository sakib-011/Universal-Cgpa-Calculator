import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '../../stores/useThemeStore'
import { ThemeToggle } from '../shared/ThemeToggle'
import { FeedbackModal } from '../shared/FeedbackModal'

export function Navbar() {
  const { pathname } = useLocation()
  const { isDark } = useThemeStore()
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const isActive = (to: string) =>
    to === '/' ? pathname === '/' : pathname.startsWith(to)

  const glassClass = isDark
    ? 'bg-slate-900/70 border-white/10'
    : 'bg-white/80 border-black/10'

  return (
    <>
      <motion.nav
        className={`fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-5xl rounded-2xl px-4 py-2.5 backdrop-blur-xl border shadow-xl ${glassClass}`}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 0.1 }}
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/40 group-hover:shadow-violet-500/60 transition-shadow">
              <i className="fa-solid fa-calculator text-sm text-white"></i>
            </div>
            <span className="font-black text-sm gradient-text hidden sm:block">GPA Calculator</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive('/')
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                  : isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <i className="fa-solid fa-globe text-xs"></i>
              Home
            </Link>

            {/* Dropdown for Calculator */}
            <div
              className="relative"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <button
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive('/calculator')
                    ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                    : isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <i className="fa-solid fa-calculator text-xs"></i>
                Calculator
                <i className="fa-solid fa-chevron-down text-[8px] ml-0.5"></i>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    className={`absolute left-0 mt-1 w-48 rounded-xl border p-1 shadow-2xl backdrop-blur-xl z-50 ${
                      isDark ? 'bg-slate-900/90 border-white/10' : 'bg-white/95 border-slate-200'
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Link
                      to="/calculator"
                      onClick={() => setDropdownOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                        isDark ? 'text-slate-300 hover:text-white hover:bg-white/5' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <i className="fa-solid fa-wand-magic-sparkles text-[10px] text-violet-400"></i>
                      AI Auto-Scraper
                    </Link>
                    <Link
                      to="/calculator/Manual%20Mode"
                      onClick={() => setDropdownOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                        isDark ? 'text-slate-300 hover:text-white hover:bg-white/5' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <i className="fa-solid fa-calculator text-[10px] text-violet-400"></i>
                      Custom Calculator
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              to="/history"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive('/history')
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                  : isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <i className="fa-solid fa-clock-rotate-left text-xs"></i>
              History
            </Link>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => setFeedbackOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isDark ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <i className="fa-solid fa-comments text-[10px]"></i>
              <span className="hidden sm:block">Feedback</span>
            </motion.button>
            <ThemeToggle />
            <button
              className="md:hidden text-slate-400 hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <i className="fa-solid fa-xmark text-base"></i> : <i className="fa-solid fa-bars text-base"></i>}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              className="md:hidden mt-2 pt-2 border-t border-white/10 flex flex-col gap-1"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                  isActive('/') ? 'bg-violet-500/20 text-violet-400' : isDark ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                <i className="fa-solid fa-globe w-4 text-center"></i>
                Home
              </Link>
              <Link
                to="/calculator"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                  pathname === '/calculator' ? 'bg-violet-500/20 text-violet-400' : isDark ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                <i className="fa-solid fa-wand-magic-sparkles w-4 text-center"></i>
                AI Auto-Scraper
              </Link>
              <Link
                to="/calculator/Manual%20Mode"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                  pathname.includes('Manual%20Mode') ? 'bg-violet-500/20 text-violet-400' : isDark ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                <i className="fa-solid fa-calculator w-4 text-center"></i>
                Custom Calculator
              </Link>
              <Link
                to="/history"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                  isActive('/history') ? 'bg-violet-500/20 text-violet-400' : isDark ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                <i className="fa-solid fa-clock-rotate-left w-4 text-center"></i>
                History
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <AnimatePresence>
        {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
      </AnimatePresence>
    </>
  )
}
