import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Sun, Moon, Bell } from 'lucide-react'
import FeedbackModal from './FeedbackModal'
import { useTheme } from '../context/ThemeContext'

export default function Layout({ children }) {
  const [showFeedback, setShowFeedback] = useState(false)
  const { theme, toggle } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#ffffff' }}>

      {/* ── 최소화된 상단 ── */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#111]">
        <div className="max-w-lg mx-auto px-5 h-12 flex items-center justify-between">
          {!isHome ? (
            <button onClick={() => navigate(-1)}
              className="text-sm font-bold flex items-center gap-1 transition-opacity hover:opacity-60"
              style={{ color: '#111' }}
            >
              ← 뒤로
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button onClick={toggle}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90"
              style={{ background: '#f5f5f5', color: '#888' }}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{ background: '#f5f5f5', color: '#888' }}
            >
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── 메인 ── */}
      <main className="flex-1 max-w-lg mx-auto w-full px-5 pb-28">
        {children}
      </main>

      {/* ── 하단 탭바 ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#111]"
        style={{ borderTop: '1px solid #f0f0f0', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-lg mx-auto px-6 h-16 flex items-center justify-around relative">

          {/* 홈 */}
          <Link to="/"
            className="flex flex-col items-center gap-0.5 transition-all active:scale-90"
            style={{ color: isHome ? '#0ecfb0' : '#bbbbbb' }}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-extrabold">홈</span>
          </Link>

          {/* 중앙 FAB */}
          <button
            onClick={() => setShowFeedback(true)}
            className="absolute left-1/2 -translate-x-1/2 -top-5 w-14 h-14 flex flex-col items-center justify-center text-white font-extrabold transition-all active:scale-90 shadow-lg"
            style={{
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #34d5b7, #0ecfb0)',
              boxShadow: '0 4px 20px rgba(14,207,176,0.45)',
              fontSize: '22px',
              lineHeight: 1,
            }}
          >
            💬
          </button>

          {/* 빈 공간 (FAB 자리) */}
          <span className="w-14" />

          {/* 더보기 / 정보 */}
          <button
            onClick={toggle}
            className="flex flex-col items-center gap-0.5 transition-all active:scale-90"
            style={{ color: '#bbbbbb' }}
          >
            {theme === 'dark'
              ? <Sun className="w-5 h-5" />
              : <Moon className="w-5 h-5" />
            }
            <span className="text-[10px] font-extrabold">테마</span>
          </button>
        </div>
      </nav>

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
    </div>
  )
}
