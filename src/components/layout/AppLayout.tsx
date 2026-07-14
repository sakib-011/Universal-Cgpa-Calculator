import { Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Navbar } from './Navbar'
import { AuroraBackground } from '../animations/AuroraBackground'
import { useThemeStore } from '../../stores/useThemeStore'

export function AppLayout() {
  const { isDark } = useThemeStore()
  return (
    <div className={isDark ? 'dark' : ''}>
      <AuroraBackground />
      <Navbar />
      <main className="relative z-10 pt-24 pb-16 min-h-screen">
        <Outlet />
      </main>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: isDark ? '#1a1a2e' : '#ffffff',
            color: isDark ? '#f1f5f9' : '#0f172a',
            border: isDark ? '1px solid rgba(139,92,246,0.2)' : '1px solid #e2e8f0',
            borderRadius: '12px',
          },
        }}
      />
    </div>
  )
}
