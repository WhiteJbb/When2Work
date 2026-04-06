import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, Users, ArrowRight, AlertCircle, MessageSquarePlus } from 'lucide-react'
import DatePicker from './DatePicker'
import { createRoom } from '../lib/supabase'
import { isSupabaseConfigured } from '../lib/supabase'
import { generateDateRange } from '../utils/timeUtils'

const TIME_OPTIONS = [
  ...Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: i === 0 ? '자정 (00:00)' : i < 12 ? `오전 ${i}시` : i === 12 ? '정오 (12:00)' : `오후 ${i - 12}시`,
  })),
  { value: 24, label: '오후 11:59 (자정 직전)' },
]

export default function CreateRoom() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    startDate: todayStr(),
    numDays: 5,
    startHour: 9,
    endHour: 24,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function todayStr() {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.title.trim()) { setError('방 제목을 입력해주세요.'); return }
    if (form.startHour >= form.endHour) { setError('종료 시간은 시작 시간보다 늦어야 합니다.'); return }

    setLoading(true)
    try {
      const dates = generateDateRange(form.startDate, form.numDays)
      const room = await createRoom({
        title: form.title.trim(),
        dates,
        time_start: form.startHour,
        time_end: form.endHour,
      })
      navigate(`/room/${room.id}`)
    } catch (err) {
      setError('방 생성에 실패했습니다. Supabase 설정을 확인해주세요.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const previewDates = generateDateRange(form.startDate, form.numDays)

  return (
    <div className="max-w-lg mx-auto">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl
                         bg-brand-100 dark:bg-brand-900/30 mb-4">
          <Calendar className="w-7 h-7 text-brand-600 dark:text-brand-400" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
          When2Work
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
          팀원들의 가능한 시간을 모아 최적의 회의 시간을 찾아드립니다.<br />
          방을 만들고 링크를 공유하세요.
        </p>
      </div>

      {/* Supabase 미설정 경고 */}
      {!isSupabaseConfigured && (
        <div className="mb-6 p-4 rounded-xl border border-amber-200 dark:border-amber-800
                         bg-amber-50 dark:bg-amber-900/20 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-700 dark:text-amber-300">
            <strong>Supabase 미설정</strong> — <code className="text-xs">.env.local</code> 파일에
            {' '}<code className="text-xs">VITE_SUPABASE_URL</code>과{' '}
            <code className="text-xs">VITE_SUPABASE_ANON_KEY</code>를 설정해주세요.
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* 방 제목 */}
        <div>
          <label className="label">
            <Users className="w-3.5 h-3.5 inline mr-1" />
            회의 제목
          </label>
          <input
            type="text"
            className="input"
            placeholder="Ex) 프로젝트 회의"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            maxLength={60}
          />
        </div>

        {/* 날짜 설정 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">
              <Calendar className="w-3.5 h-3.5 inline mr-1" />
              시작 날짜
            </label>
            <DatePicker
              value={form.startDate}
              minDate={todayStr()}
              onChange={val => setForm(f => ({ ...f, startDate: val }))}
            />
          </div>
          <div>
            <label className="label">날짜 수 (최대 7일)</label>
            <select
              className="input"
              value={form.numDays}
              onChange={e => setForm(f => ({ ...f, numDays: Number(e.target.value) }))}
            >
              {[1, 2, 3, 4, 5, 6, 7].map(n => (
                <option key={n} value={n}>{n}일</option>
              ))}
            </select>
          </div>
        </div>

        {/* 날짜 미리보기 */}
        <div className="flex flex-wrap gap-1.5">
          {previewDates.map(d => {
            const date = new Date(d + 'T00:00:00')
            const days = ['일', '월', '화', '수', '목', '금', '토']
            const isWeekend = date.getDay() === 0 || date.getDay() === 6
            return (
              <span
                key={d}
                className={`text-xs px-2 py-0.5 rounded-full font-medium
                  ${isWeekend
                    ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                    : 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                  }`}
              >
                {date.getMonth() + 1}/{date.getDate()}({days[date.getDay()]})
              </span>
            )
          })}
        </div>

        {/* 시간 범위 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">
              <Clock className="w-3.5 h-3.5 inline mr-1" />
              시작 시간
            </label>
            <select
              className="input"
              value={form.startHour}
              onChange={e => setForm(f => ({ ...f, startHour: Number(e.target.value) }))}
            >
              {TIME_OPTIONS.slice(0, 24).map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">종료 시간</label>
            <select
              className="input"
              value={form.endHour}
              onChange={e => setForm(f => ({ ...f, endHour: Number(e.target.value) }))}
            >
              {TIME_OPTIONS.slice(1).map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="text-sm text-rose-500 dark:text-rose-400 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={loading || !isSupabaseConfigured}
        >
          {loading ? '생성 중...' : '방 만들기'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* 사용 방법 */}
      <div className="mt-8 grid grid-cols-3 gap-4 text-center">
        {[
          { step: '1', title: '방 만들기', desc: '날짜와 시간 범위를 설정하고 방을 생성합니다.' },
          { step: '2', title: '링크 공유', desc: '팀원들에게 링크를 공유합니다.' },
          { step: '3', title: '결과 확인', desc: '가장 많이 겹치는 시간을 확인합니다.' },
        ].map(item => (
          <div key={item.step} className="card p-4">
            <div className="w-7 h-7 rounded-full bg-brand-600 text-white text-sm font-bold
                             flex items-center justify-center mx-auto mb-2">
              {item.step}
            </div>
            <p className="font-semibold text-sm mb-1">{item.title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* 개선사항 문의 */}
      <div className="mt-6">
        <a
          href="https://github.com/WhiteJbb/When2Work/issues/new"
          target="_blank"
          rel="noopener noreferrer"
          className="card p-4 flex items-center gap-3 hover:border-brand-400 dark:hover:border-brand-500
                     transition-colors group"
        >
          <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0
                           group-hover:bg-brand-200 dark:group-hover:bg-brand-800/40 transition-colors">
            <MessageSquarePlus className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">개선사항이나 버그를 발견하셨나요?</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">GitHub Issues에서 문의해주세요 →</p>
          </div>
        </a>
      </div>

    </div>
  )
}
