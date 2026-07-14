import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { WorldMap } from '../components/map/WorldMap'
import { FloatingGradeCards } from '../components/cards/FloatingGradeCards'
import { useCalculatorStore } from '../stores/useCalculatorStore'
import { useThemeStore } from '../stores/useThemeStore'
import { getCountryFlag } from '../lib/utils'

const TYPEWRITER = ['Bangladesh HSC', 'USA Bachelor', 'India Engineering', 'Japan Graduate', 'Germany ECTS', 'UK First Class']

const FEATURES = [
  { icon: 'fa-solid fa-globe', title: 'Any Country', desc: '195+ countries, AI discovers the education system in real-time' },
  { icon: 'fa-solid fa-microchip', title: 'AI-Powered', desc: 'Gemini AI fetches official grading policies from university sources' },
  { icon: 'fa-solid fa-bolt', title: 'Zero Database', desc: 'No pre-built data. Everything is dynamically fetched by AI' },
  { icon: 'fa-solid fa-graduation-cap', title: 'Export Results', desc: 'Download your CGPA as PDF, PNG, or CSV' },
]

export function LandingPage() {
  const navigate = useNavigate()
  const { isDark } = useThemeStore()
  const { setCountry } = useCalculatorStore()
  const [selected, setSelected] = useState('')
  const [tIdx, setTIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setTIdx((i) => (i + 1) % TYPEWRITER.length), 2600)
    return () => clearInterval(t)
  }, [])

  const handleCountrySelect = (name: string, code: string) => {
    setSelected(name)
    setCountry(name, code)
    setTimeout(() => navigate(`/calculator/${encodeURIComponent(name)}`), 350)
  }

  const textColor = isDark ? 'text-white' : 'text-slate-900'
  const subColor = isDark ? 'text-slate-400' : 'text-slate-600'
  const cardBg = isDark ? 'bg-white/3 border-white/8' : 'bg-white/60 border-black/8 shadow-sm'

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FloatingGradeCards selectedCountry={selected} />

      {/* Hero */}
      <section className="relative z-10 pt-6 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8 bg-violet-500/10 border border-violet-500/25 text-violet-400"
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          >
            <i className="fa-solid fa-wand-magic-sparkles text-xs"></i>
            AI-Powered · No Database · 195+ Countries
          </motion.div>

          {/* Headline */}
          <motion.h1
            className={`text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-5 ${textColor}`}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          >
            <span className="gradient-text">Global AI</span>
            <br />
            GPA Calculator
          </motion.h1>

          {/* Typewriter */}
          <motion.p
            className={`text-lg sm:text-xl mb-4 ${subColor}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          >
            Calculate for{' '}
            <AnimatePresence mode="wait">
              <motion.span
                key={tIdx}
                className="font-bold gradient-text"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {TYPEWRITER[tIdx]}
              </motion.span>
            </AnimatePresence>
          </motion.p>

          <motion.p
            className={`text-sm max-w-xl mx-auto mb-10 leading-relaxed ${subColor}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
          >
            Pick a country → AI finds education levels → AI finds universities →
            AI fetches official grading rules → Your calculator is built automatically.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-3 mb-16"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          >
            <motion.button
              onClick={() => document.getElementById('world-map')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm shadow-xl shadow-violet-500/35 hover:shadow-violet-500/55 transition-shadow"
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            >
              <i className="fa-solid fa-globe"></i> Pick a Country <i className="fa-solid fa-arrow-right"></i>
            </motion.button>
            <motion.button
              onClick={() => navigate('/calculator')}
              className={`flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-sm border transition-all ${
                isDark ? 'border-white/15 text-slate-300 hover:bg-white/5' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            >
              <i className="fa-solid fa-graduation-cap"></i> Open Calculator
            </motion.button>
          </motion.div>

          {/* Feature cards */}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
          >
            {FEATURES.map(({ icon, title, desc }, i) => (
              <motion.div
                key={title}
                className={`p-4 rounded-2xl border text-left ${cardBg}`}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 + i * 0.08 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
              >
                <i className={`${icon} text-lg text-violet-400 mb-2`}></i>
                <p className={`font-bold text-xs mb-1 ${textColor}`}>{title}</p>
                <p className={`text-[10px] leading-relaxed ${subColor}`}>{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Scroll indicator */}
      <motion.div
        className="flex justify-center mb-6 relative z-10"
        animate={{ y: [0, 7, 0] }} transition={{ duration: 2, repeat: Infinity }}
      >
        <i className="fa-solid fa-chevron-down text-lg text-violet-400/50"></i>
      </motion.div>

      {/* World Map */}
      <section id="world-map" className="relative z-10 px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          >
            <h2 className={`text-3xl font-bold mb-2 ${textColor}`}>🌍 Select Your Country</h2>
            <p className={`text-sm ${subColor}`}>Click any country — AI handles everything else</p>

            <AnimatePresence>
              {selected && (
                <motion.div
                  className="mt-4 inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-violet-500/15 border border-violet-500/30"
                  initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }} transition={{ type: 'spring' }}
                >
                  <span className="text-xl">{getCountryFlag(selected.slice(0, 2).toUpperCase())}</span>
                  <span className="text-sm font-semibold text-violet-300">{selected}</span>
                  <motion.button
                    onClick={() => navigate(`/calculator/${encodeURIComponent(selected)}`)}
                    className="flex items-center gap-1.5 bg-violet-500 text-white px-3 py-1 rounded-xl text-xs font-bold hover:bg-violet-400 transition-colors"
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  >
                    Continue <i className="fa-solid fa-arrow-right text-[10px]"></i>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
          >
            <WorldMap onCountrySelect={handleCountrySelect} selectedCountry={selected} />
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            className={`text-3xl font-bold text-center mb-12 ${textColor}`}
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          >
            How It Works
          </motion.h2>
          <div className="grid sm:grid-cols-4 gap-6 relative">
            {[
              { n: '1', emoji: '🌍', title: 'Pick Country', desc: 'Click the interactive world map' },
              { n: '2', emoji: '🤖', title: 'AI Discovers', desc: 'Education levels extracted by Gemini AI' },
              { n: '3', emoji: '🏛️', title: 'Pick University', desc: 'From AI-generated top universities list' },
              { n: '4', emoji: '✨', title: 'Calculate', desc: 'Dynamic calculator built from official policy' },
            ].map(({ n, emoji, title, desc }, i) => (
              <motion.div
                key={n}
                className={`relative p-6 rounded-2xl border text-center ${cardBg}`}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                {i < 3 && (
                  <div className={`hidden sm:block absolute top-8 -right-3 text-2xl z-10 ${isDark ? 'text-violet-800' : 'text-violet-300'}`}>→</div>
                )}
                <div className="text-4xl mb-3">{emoji}</div>
                <div className="text-violet-400 text-xs font-bold tracking-wider mb-2">STEP {n}</div>
                <div className={`font-bold mb-1.5 ${textColor}`}>{title}</div>
                <div className={`text-xs leading-relaxed ${subColor}`}>{desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}