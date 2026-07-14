import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '../../stores/useThemeStore'
import toast from 'react-hot-toast'

const EMOJIS = [
  { rating: 1, char: '😢', text: 'Bad' },
  { rating: 2, char: '😕', text: 'Poor' },
  { rating: 3, char: '😐', text: 'OK' },
  { rating: 4, char: '🙂', text: 'Good' },
  { rating: 5, char: '😍', text: 'Amazing!' },
]

export function FeedbackModal({ onClose }: { onClose: () => void }) {
  const { isDark } = useThemeStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [successMode, setSuccessMode] = useState<'email' | 'local'>('email')

  const handleSubmit = async () => {
    if (!rating) {
      toast.error('Please pick a rating emoji!')
      return
    }
    if (!comment.trim()) {
      toast.error('Please share some feedback details!')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, rating, comment }),
      })

      if (response.ok) {
        setSuccessMode('email')
        toast.success('Feedback email sent successfully!')
        setDone(true)
        setTimeout(() => {
          onClose()
        }, 2500)
      } else {
        throw new Error('Server returned error')
      }
    } catch (err) {
      // Fallback local save in localStorage if server is offline
      const local = JSON.parse(localStorage.getItem('gpa-feedback-fallback') || '[]')
      local.push({ name, email, rating, comment, timestamp: new Date().toISOString() })
      localStorage.setItem('gpa-feedback-fallback', JSON.stringify(local))
      
      setSuccessMode('local')
      toast.success('Saved offline: Feedback saved locally!')
      setDone(true)
      setTimeout(() => onClose(), 2500)
    } finally {
      setSubmitting(false)
    }
  }

  const glass = isDark 
    ? 'bg-slate-950/95 border-white/10 shadow-[0_0_50px_-12px_rgba(139,92,246,0.15)]' 
    : 'bg-white/95 border-slate-200 shadow-2xl shadow-slate-200'
  const inputBg = isDark 
    ? 'bg-white/5 border-white/8 text-white focus:border-violet-500/40 focus:bg-white/8' 
    : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-violet-400 focus:bg-white'
  const textColor = isDark ? 'text-white' : 'text-slate-900'
  const subColor = isDark ? 'text-slate-400' : 'text-slate-600'

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        className={`relative w-full max-w-md rounded-3xl p-6 border backdrop-blur-xl ${glass}`}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      >
        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="text-center relative">
                <span className="absolute -top-2 -right-2 text-[9px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/25 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"></span>
                  Direct Email active
                </span>

                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-violet-500/30">
                  <i className="fa-solid fa-comments text-xl text-white"></i>
                </div>
                <h2 className={`text-xl font-black gradient-text ${textColor}`}>Share Your Feedback</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Your comments will be sent directly to <strong>sakibshourov001@gmail.com</strong>
                </p>
              </div>

              {/* Rating Emojis */}
              <div className="space-y-2 bg-white/3 border border-white/5 dark:bg-white/2 rounded-2xl p-3.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-center block">
                  How is your experience?
                </label>
                <div className="flex justify-between px-1">
                  {EMOJIS.map((e) => {
                    const active = rating === e.rating
                    return (
                      <button
                        key={e.rating}
                        type="button"
                        onClick={() => setRating(e.rating)}
                        className="flex flex-col items-center gap-1 group focus:outline-none"
                      >
                        <motion.span
                          className={`text-3xl p-1 rounded-xl transition-all ${
                            active ? 'bg-violet-600/30 scale-125 border border-violet-500/40 shadow-md shadow-violet-500/10' : 'grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:scale-110'
                          }`}
                          whileTap={{ scale: 0.9 }}
                        >
                          {e.char}
                        </motion.span>
                        <span className={`text-[8px] font-bold tracking-wider ${active ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                          {e.text}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Form Input fields */}
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] text-slate-500 mb-1 block font-bold uppercase tracking-wider">Your Name</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Sakib Shourov"
                      className={`w-full rounded-xl px-3.5 py-2.5 text-xs outline-none border ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 mb-1 block font-bold uppercase tracking-wider">Your Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. sakib@gmail.com"
                      className={`w-full rounded-xl px-3.5 py-2.5 text-xs outline-none border ${inputBg}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-slate-500 mb-1 block font-bold uppercase tracking-wider">Message</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us what you loved, or suggest new features you want us to add..."
                    rows={3}
                    className={`w-full rounded-xl px-3.5 py-2.5 text-xs outline-none border resize-none ${inputBg}`}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl text-xs font-bold text-slate-400 border border-white/10 hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <motion.button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/25 transition-all flex items-center justify-center gap-1.5"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                >
                  {submitting ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin"></i> Sending...
                    </>
                  ) : (
                    <>
                      Send Email <i className="fa-solid fa-paper-plane text-[10px]"></i>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-10 text-center space-y-4"
            >
              {successMode === 'email' ? (
                <>
                  <motion.div
                    className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 text-3xl font-bold"
                    initial={{ rotate: -90, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: 'spring', delay: 0.15 }}
                  >
                    ✓
                  </motion.div>
                  <div>
                    <h3 className={`text-lg font-bold ${textColor}`}>Email Sent Successfully!</h3>
                    <p className={`text-xs leading-relaxed max-w-xs mx-auto ${subColor}`}>
                      Your feedback has been emailed directly to <strong>sakibshourov001@gmail.com</strong>
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <motion.div
                    className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center mx-auto text-amber-400 text-3xl"
                    initial={{ rotate: -90, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: 'spring', delay: 0.15 }}
                  >
                    💾
                  </motion.div>
                  <div>
                    <h3 className={`text-lg font-bold ${textColor}`}>Saved Offline!</h3>
                    <p className={`text-xs leading-relaxed max-w-xs mx-auto ${subColor}`}>
                      The feedback mail server is currently offline. Your comments have been safely saved to local storage!
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
