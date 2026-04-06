import { Link } from 'react-router-dom'
import { Calendar } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800
                          bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-lg text-brand-600 dark:text-brand-400
                       hover:opacity-80 transition-opacity"
          >
            <Calendar className="w-5 h-5" />
            When2Work
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-4 text-center
                          text-xs text-slate-400 dark:text-slate-600">
        <span>When2Work — 팀 일정 조율 도구</span>
        <span className="mx-2">·</span>
        <a
          href="https://github.com/WhiteJbb/When2Work/issues/new"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors underline underline-offset-2"
        >
          개선사항 / 버그 제보
        </a>
      </footer>
    </div>
  )
}
