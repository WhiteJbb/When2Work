import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Sun, Moon, Bell, MessageSquarePlus } from 'lucide-react'
import FeedbackModal from './FeedbackModal'
import { useTheme } from '../context/ThemeContext'

export default function Layout({ children }) {
  const [showFeedback, setShowFeedback] = useState(false)
  const { theme, toggle } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#111]">

      {/* ── PC 상단 네비바 (md 이상) ── */}
      <header className="hidden md:block sticky top-0 z-40 bg-white dark:bg-[#111]"
        style={{ borderBottom: '1.5px solid #f0f0f0' }}
      >
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-75 transition-opacity">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-extrabold"
              style={{ background: 'linear-gradient(135deg, #34d5b7, #0ecfb0)', boxShadow: '0 3px 10px rgba(14,207,176,0.35)' }}
            >W</div>
            <span className="font-extrabold text-lg tracking-tight" style={{ color: '#111' }}>When2Work</span>
          </Link>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowFeedback(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold transition-all active:scale-95"
              style={{ borderRadius: '999px', background: '#edfdf8', color: '#0ecfb0', border: '1.5px solid #a8f2e4' }}
            >
              <MessageSquarePlus className="w-4 h-4" /> 의견 보내기
            </button>
            <button onClick={toggle}
              className="w-9 h-9 flex items-center justify-center rounded-full transition-all"
              style={{ background: '#f5f5f5', color: '#888' }}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── 모바일 상단 (md 미만) ── */}
      <header className="md:hidden sticky top-0 z-40 bg-white dark:bg-[#111]">
        <div className="max-w-lg mx-auto px-5 h-12 flex items-center justify-between">
          {!isHome ? (
            <button onClick={() => navigate(-1)}
              className="text-sm font-bold transition-opacity hover:opacity-60"
              style={{ color: '#111' }}
            >← 뒤로</button>
          ) : (
            <span className="font-extrabold text-base" style={{ color: '#111' }}>When2Work</span>
          )}
          <div className="flex items-center gap-2">
            <button onClick={toggle}
              className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{ background: '#f5f5f5', color: '#888' }}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{ background: '#f5f5f5', color: '#888' }}
            >
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── 메인 ── */}
      <main className="flex-1 w-full mx-auto
                       px-5 pb-28 max-w-lg
                       md:px-6 md:pb-10 md:max-w-5xl">
        {children}
      </main>

      {/* ── 모바일 하단 탭바 (md 미만만 표시) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#111]"
        style={{ borderTop: '1px solid #f0f0f0', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-lg mx-auto px-6 h-16 flex items-center justify-around relative">
          <Link to="/"
            className="flex flex-col items-center gap-0.5 transition-all active:scale-90"
            style={{ color: isHome ? '#0ecfb0' : '#bbb' }}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-extrabold">홈</span>
          </Link>

          {/* 중앙 FAB */}
          <button onClick={() => setShowFeedback(true)}
            className="absolute left-1/2 -translate-x-1/2 -top-5 w-14 h-14 flex items-center justify-center text-white transition-all active:scale-90"
            style={{
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #34d5b7, #0ecfb0)',
              boxShadow: '0 4px 20px rgba(14,207,176,0.45)',
              fontSize: '22px',
            }}
          >💬</button>

          <span className="w-14" />

          <button onClick={toggle}
            className="flex flex-col items-center gap-0.5 active:scale-90"
            style={{ color: '#bbb' }}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span className="text-[10px] font-extrabold">테마</span>
          </button>
        </div>
      </nav>

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
    </div>
  )
}