import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, Users, ArrowRight, AlertCircle, MessageSquarePlus } from 'lucide-react'
import DatePicker from './DatePicker'
import { createRoom, isSupabaseConfigured } from '../lib/supabase'
import { generateDateRange } from '../utils/timeUtils'
import FeedbackModal from './FeedbackModal'

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
  const [showFeedback, setShowFeedback] = useState(false)

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
      const room = await createRoom({ title: form.title.trim(), dates, time_start: form.startHour, time_end: form.endHour })
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

      {/* ── 히어로 배너 ── */}
      <div className="rounded-3xl p-6 mb-6 overflow-hidden relative"
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          boxShadow: '0 8px 32px rgba(79,70,229,0.35)',
        }}
      >
        {/* 장식용 원 */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20"
          style={{ background: 'rgba(255,255,255,0.3)' }} />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-10"
          style={{ background: 'rgba(255,255,255,0.5)' }} />

        <div className="relative z-10">
          <p className="text-white/70 text-xs font-semibold tracking-widest uppercase mb-1">Team Scheduler</p>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">When2Work</h1>
          <p className="text-white/75 text-sm leading-relaxed">
            팀원들의 가능한 시간을 모아<br />최적의 회의 시간을 찾아드립니다.
          </p>
        </div>
      </div>

      {/* ── Supabase 미설정 경고 ── */}
      {!isSupabaseConfigured && (
        <div className="mb-5 p-4 rounded-2xl flex gap-3"
          style={{ background: '#fffbeb', border: '2px solid #fde68a' }}
        >
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-700">
            <strong>Supabase 미설정</strong> — <code className="text-xs bg-amber-100 px-1 py-0.5 rounded">.env.local</code> 파일에{' '}
            <code className="text-xs bg-amber-100 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code>과{' '}
            <code className="text-xs bg-amber-100 px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code>를 설정해주세요.
          </div>
        </div>
      )}

      {/* ── 폼 ── */}
      <div className="card p-6 space-y-5">

        {/* 방 제목 */}
        <div>
          <label className="label">
            <Users className="w-3.5 h-3.5 inline mr-1.5 text-indigo-500" />
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
              <Calendar className="w-3.5 h-3.5 inline mr-1.5 text-indigo-500" />
              시작 날짜
            </label>
            <DatePicker value={form.startDate} minDate={todayStr()} onChange={val => setForm(f => ({ ...f, startDate: val }))} />
          </div>
          <div>
            <label className="label">날짜 수 (최대 7일)</label>
            <select className="input" value={form.numDays} onChange={e => setForm(f => ({ ...f, numDays: Number(e.target.value) }))}>
              {[1, 2, 3, 4, 5, 6, 7].map(n => <option key={n} value={n}>{n}일</option>)}
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
              <span key={d} className="badge"
                style={isWeekend
                  ? { background: '#fff1f2', color: '#e11d48', border: '1.5px solid #fecdd3' }
                  : { background: '#eef2ff', color: '#4f46e5', border: '1.5px solid #c7d2fe' }
                }
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
              <Clock className="w-3.5 h-3.5 inline mr-1.5 text-indigo-500" />
              시작 시간
            </label>
            <select className="input" value={form.startHour} onChange={e => setForm(f => ({ ...f, startHour: Number(e.target.value) }))}>
              {TIME_OPTIONS.slice(0, 24).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">종료 시간</label>
            <select className="input" value={form.endHour} onChange={e => setForm(f => ({ ...f, endHour: Number(e.target.value) }))}>
              {TIME_OPTIONS.slice(1).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-2xl text-sm font-medium"
            style={{ background: '#fff1f2', color: '#e11d48', border: '1.5px solid #fecdd3' }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <button type="button" onClick={handleSubmit} className="btn-primary w-full py-4 text-base rounded-2xl"
          disabled={loading || !isSupabaseConfigured}
        >
          {loading ? '생성 중...' : '방 만들기'}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* ── 사용 방법 ── */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        {[
          { step: '1', title: '방 만들기', desc: '날짜·시간 설정 후 방 생성' },
          { step: '2', title: '링크 공유', desc: '팀원에게 링크 전달' },
          { step: '3', title: '결과 확인', desc: '겹치는 시간 확인' },
        ].map(item => (
          <div key={item.step} className="card p-4 text-center">
            <div className="w-8 h-8 rounded-2xl flex items-center justify-center text-sm font-extrabold text-white mx-auto mb-2.5"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}
            >
              {item.step}
            </div>
            <p className="font-extrabold text-sm mb-1" style={{ color: '#1a1a2e' }}>{item.title}</p>
            <p className="text-xs leading-relaxed" style={{ color: '#a0a0b0' }}>{item.desc}</p>
          </div>
        ))}
      </div>

      {/* ── 개선사항 문의 ── */}
      <button
        type="button"
        onClick={() => setShowFeedback(true)}
        className="mt-4 w-full card p-4 flex items-center gap-3 text-left transition-all duration-150 active:scale-[0.98] hover:border-indigo-200"
        style={{ cursor: 'pointer' }}
      >
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#eef2ff', border: '1.5px solid #c7d2fe' }}
        >
          <MessageSquarePlus className="w-5 h-5 text-indigo-500" />
        </div>
        <div>
          <p className="font-bold text-sm" style={{ color: '#1a1a2e' }}>개선사항이나 버그를 발견하셨나요?</p>
          <p className="text-xs mt-0.5" style={{ color: '#a0a0b0' }}>의견을 남겨주시면 검토 후 반영할게요 →</p>
        </div>
      </button>

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
    </div>
  )
}
