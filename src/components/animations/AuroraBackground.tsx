import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '../../stores/useThemeStore'

interface Particle {
  x: number; y: number; vx: number; vy: number
  r: number; color: string; alpha: number
}

export function AuroraBackground() {
  const { isDark } = useThemeStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Particle[]>([])
  const frame = useRef(0)
  const mouse = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const colors = isDark
      ? ['#7c3aed', '#9333ea', '#ec4899', '#06b6d4', '#818cf8']
      : ['#c4b5fd', '#e879f9', '#fbcfe8', '#a5f3fc', '#a5b4fc']

    particles.current = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.8 + 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.5 + 0.1,
    }))

    const onMouse = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('mousemove', onMouse)

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Aurora blobs
      const blobs = [
        { x: canvas.width * 0.15, y: canvas.height * 0.25, r: 380, c: isDark ? '#6d28d9' : '#c4b5fd' },
        { x: canvas.width * 0.82, y: canvas.height * 0.18, r: 300, c: isDark ? '#be185d' : '#f0abfc' },
        { x: canvas.width * 0.5, y: canvas.height * 0.75, r: 340, c: isDark ? '#0284c7' : '#7dd3fc' },
      ]
      blobs.forEach(({ x, y, r, c }) => {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r)
        g.addColorStop(0, `${c}25`)
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      })

      // Mouse glow
      const mg = ctx.createRadialGradient(mouse.current.x, mouse.current.y, 0, mouse.current.x, mouse.current.y, 160)
      mg.addColorStop(0, isDark ? '#8b5cf618' : '#c4b5fd28')
      mg.addColorStop(1, 'transparent')
      ctx.fillStyle = mg
      ctx.beginPath()
      ctx.arc(mouse.current.x, mouse.current.y, 160, 0, Math.PI * 2)
      ctx.fill()

      // Particles
      particles.current.forEach((p) => {
        p.x = (p.x + p.vx + canvas.width) % canvas.width
        p.y = (p.y + p.vy + canvas.height) % canvas.height
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `${p.color}${Math.floor(p.alpha * 255).toString(16).padStart(2, '0')}`
        ctx.fill()
      })

      // Connections
      for (let i = 0; i < particles.current.length; i++) {
        for (let j = i + 1; j < particles.current.length; j++) {
          const a = particles.current[i], b = particles.current[j]
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d < 90) {
            ctx.beginPath()
            ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = isDark ? `rgba(139,92,246,${0.07 * (1 - d / 90)})` : `rgba(167,139,250,${0.1 * (1 - d / 90)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      frame.current = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(frame.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouse)
    }
  }, [isDark])

  return (
    <div className="fixed inset-0 -z-10">
      <div className={`absolute inset-0 transition-colors duration-700 ${
        isDark ? 'bg-[#07071a]' : 'bg-[#f5f3ff]'
      }`} />
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  )
}

export function AnimatedMesh() {
  const { isDark } = useThemeStore()
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[
        { x: '-10%', y: '-10%', color: isDark ? '#7c3aed22' : '#c4b5fd33', delay: 0 },
        { x: '70%', y: '-5%', color: isDark ? '#ec489922' : '#fbcfe833', delay: 2 },
        { x: '40%', y: '60%', color: isDark ? '#06b6d422' : '#67e8f933', delay: 1 },
      ].map((b, i) => (
        <motion.div
          key={i}
          className="absolute w-[500px] h-[500px] rounded-full blur-3xl"
          style={{ left: b.x, top: b.y, background: `radial-gradient(circle, ${b.color}, transparent)` }}
          animate={{ x: [0, 40, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 8 + i * 2, repeat: Infinity, ease: 'easeInOut', delay: b.delay }}
        />
      ))}
    </div>
  )
}
