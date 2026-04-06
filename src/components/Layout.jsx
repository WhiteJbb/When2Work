import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import FeedbackModal from './FeedbackModal'

export default function Layout({ children }) {
  const [showFeedback, setShowFeedback] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── 네비바 ── */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#1c1c1e]"
        style={{ borderBottom: '1.5px solid #ececf4', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 3px 10px rgba(99,102,241,0.4)' }}
            >
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight" style={{ color: '#1a1a2e' }}>
              When2Work
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* ── 메인 ── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6">
        {children}
      </main>

      {/* ── 푸터 ── */}
      <footer className="py-5 text-center text-xs"
        style={{ borderTop: '1.5px solid #ececf4', color: '#a0a0b0' }}
      >
        <span className="font-medium">When2Work</span>
        <span className="mx-2 opacity-40">·</span>
        <button
          onClick={() => setShowFeedback(true)}
          className="font-semibold transition-colors hover:text-indigo-500 underline underline-offset-2"
        >
          개선사항 / 버그 제보
        </button>
      </footer>

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
    </div>
  )
}
