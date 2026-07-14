import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '../../stores/useThemeStore'

const CARDS = [
  { 
    country: 'Bangladesh', 
    flag: '🇧🇩', 
    system: 'GPA 5.00 / Honours 4.00', 
    tags: ['SSC', 'HSC', 'National Uni', 'BUET'], 
    quote: '"Success is the sum of small efforts repeated daily."', 
    color: '#10b981' // Green
  },
  { 
    country: 'USA', 
    flag: '🇺🇸', 
    system: 'GPA 4.00 Scale', 
    tags: ['Ivy League', 'Credits', 'High School'], 
    quote: '"The expert in anything was once a beginner."', 
    color: '#3b82f6' // Blue
  },
  { 
    country: 'India', 
    flag: '🇮🇳', 
    system: '10.0 CGPA / Percentage', 
    tags: ['IIT', 'CBSE', 'VTU', 'KTU'], 
    quote: '"Education is the key to unlocking the golden door of freedom."', 
    color: '#f59e0b' // Saffron/Orange
  },
  { 
    country: 'Germany', 
    flag: '🇩🇪', 
    system: '1.0 to 5.0 (ECTS)', 
    tags: ['TUM', 'Universität', 'Bachelor', 'Master'], 
    quote: '"What we learn with pleasure we never forget."', 
    color: '#eab308' // Yellow
  },
  { 
    country: 'Australia', 
    flag: '🇦🇺', 
    system: 'GPA 7.00 Scale', 
    tags: ['HD', 'D', 'Credit', 'Pass'], 
    quote: '"An investment in knowledge pays the best interest."', 
    color: '#06b6d4' // Cyan
  },
  { 
    country: 'Japan', 
    flag: '🇯🇵', 
    system: '4.0 / 4.3 / 4.5 GPA', 
    tags: ['S-A-B-C-F', 'Kyoto U', 'Todai'], 
    quote: '"Fall seven times, stand up eight."', 
    color: '#ef4444' // Red
  },
  { 
    country: 'UK', 
    flag: '🇬🇧', 
    system: '1st / 2:1 / 2:2 / 3rd Class', 
    tags: ['Honours Degree', 'Oxbridge', 'LSE'], 
    quote: '"Learning never exhausts the mind."', 
    color: '#6366f1' // Indigo
  },
  { 
    country: 'Canada', 
    flag: '🇨🇦', 
    system: 'GPA 4.33 / 9.0 Scale', 
    tags: ['McGill', 'UofT', 'Percentage'], 
    quote: '"The beautiful thing about learning is nobody can take it away."', 
    color: '#ec4899' // Pink/Maple Red
  },
]

const POS = [
  { x: -380, y: -200, rot: -7, delay: 0 },
  { x: 380, y: -240, rot: 6, delay: 0.3 },
  { x: -420, y: 50, rot: -5, delay: 0.6 },
  { x: 440, y: 30, rot: 8, delay: 0.9 },
  { x: -320, y: 250, rot: -4, delay: 1.2 },
  { x: 340, y: 230, rot: 5, delay: 1.5 },
  { x: -100, y: -300, rot: 3, delay: 0.4 },
  { x: 100, y: 320, rot: -6, delay: 1.1 },
]

interface FloatingGradeCardsProps {
  selectedCountry?: string
}

export function FloatingGradeCards({ selectedCountry }: FloatingGradeCardsProps) {
  const { isDark } = useThemeStore()
  const [cards, setCards] = useState(CARDS.slice(0, 6))

  useEffect(() => {
    if (selectedCountry) {
      const match = CARDS.find((c) => c.country.toLowerCase() === selectedCountry.toLowerCase())
      if (match) {
        setCards([match, ...CARDS.filter((c) => c !== match).slice(0, 5)])
        return
      }
    }
    setCards(CARDS.slice(0, 6))
  }, [selectedCountry])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute top-1/2 left-1/2">
        <AnimatePresence>
          {cards.map((card, i) => {
            const p = POS[i]
            return (
              <motion.div
                key={`${card.country}-${i}`}
                className={`absolute w-52 rounded-2xl p-4 border backdrop-blur-lg shadow-xl cursor-pointer pointer-events-auto transition-shadow`}
                style={{
                  left: p.x - 104,
                  top: p.y - 80,
                  borderColor: `${card.color}35`,
                  background: isDark
                    ? `linear-gradient(135deg, ${card.color}15, ${card.color}05)`
                    : `linear-gradient(135deg, ${card.color}10, ${card.color}03)`,
                }}
                initial={{ opacity: 0, scale: 0.5, rotate: p.rot }}
                animate={{
                  opacity: [0, 0.9, 0.9],
                  scale: 1,
                  rotate: [p.rot, p.rot + 0.8, p.rot - 0.8, p.rot],
                  y: [0, -12, 5, 0],
                }}
                exit={{ opacity: 0, scale: 0.4 }}
                transition={{
                  opacity: { duration: 0.5, delay: p.delay, times: [0, 0.3, 1] },
                  scale: { duration: 0.5, delay: p.delay, type: 'spring' },
                  rotate: { duration: 10 + i, repeat: Infinity, ease: 'easeInOut', delay: p.delay },
                  y: { duration: 7 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: p.delay },
                }}
                whileHover={{
                  scale: 1.1,
                  rotate: 0,
                  boxShadow: `0 20px 40px ${card.color}25`,
                  borderColor: `${card.color}65`,
                  backgroundColor: isDark 
                    ? `linear-gradient(135deg, ${card.color}25, ${card.color}10)` 
                    : `linear-gradient(135deg, ${card.color}20, ${card.color}08)`,
                  zIndex: 40,
                  transition: { duration: 0.25, ease: 'easeOut' }
                }}
              >
                {/* Card header */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{card.flag}</span>
                  <div>
                    <p className={`text-xs font-black leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{card.country}</p>
                    <p className="text-[9px] font-bold" style={{ color: card.color }}>{card.system}</p>
                  </div>
                </div>

                {/* Educational Quote */}
                <div className={`text-[10px] italic leading-snug mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {card.quote}
                </div>

                {/* Badges/Tags */}
                <div className="flex flex-wrap gap-1">
                  {card.tags.map((t) => (
                    <span 
                      key={t} 
                      className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${isDark ? 'text-white/80' : 'text-slate-800'}`} 
                      style={{ background: `${card.color}20` }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
