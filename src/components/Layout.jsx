import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import FeedbackModal from './FeedbackModal'

export default function Layout({ children }) {
  const [showFeedback, setShowFeedback] = useState(false)

  return (
    <div className="min-h-screen flex flex-col relative">

      {/* ── 배경 앰비언트 오브 ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        {/* 좌상단 보라 오브 */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-20
                        dark:opacity-20 opacity-10"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', filter: 'blur(60px)' }}
        />
        {/* 우하단 인디고 오브 */}
        <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full opacity-15
                        dark:opacity-15 opacity-8"
          style={{ background: 'radial-gradient(circle, #4f46e5 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
        {/* 중앙 로즈 오브 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }}
        />
      </div>

      {/* ── 네비바 ── */}
      <header className="sticky top-0 z-40"
        style={{
          background: 'rgba(8, 8, 21, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-lg transition-opacity hover:opacity-80"
            style={{ color: '#a5b4fc' }}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 0 12px rgba(99,102,241,0.5)' }}>
              <Calendar className="w-4 h-4 text-white" />
            </div>
            When2Work
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* ── 메인 ── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        {children}
      </main>

      {/* ── 푸터 ── */}
      <footer className="py-4 text-center text-xs"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          color: '#475569',
        }}
      >
        <span>When2Work — 팀 일정 조율 도구</span>
        <span className="mx-2">·</span>
        <button
          onClick={() => setShowFeedback(true)}
          className="transition-colors hover:text-brand-400 underline underline-offset-2"
        >
          개선사항 / 버그 제보
        </button>
      </footer>

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
    </div>
  )
}