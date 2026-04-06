import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
      className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-150 active:scale-90"
      style={{
        background: theme === 'dark' ? '#3a3a3c' : '#f4f4f8',
        border: '2px solid',
        borderColor: theme === 'dark' ? '#48484a' : '#e8e8f0',
        color: theme === 'dark' ? '#a5b4fc' : '#6366f1',
      }}
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}
