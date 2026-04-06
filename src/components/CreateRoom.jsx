import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import DatePicker from './DatePicker'
import { createRoom, isSupabaseConfigured } from '../lib/supabase'
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
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', startDate: todayStr(), numDays: 5, startHour: 9, endHour: 24 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function todayStr() {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
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
      setError('방 생성에 실패했습니다.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const previewDates = generateDateRange(form.startDate, form.numDays)

  const FormContent = (
    <div className="space-y-4">
      <div>
        <label className="label">📌 회의 제목</label>
        <input type="text" className="input" placeholder="Ex) 프로젝트 킥오프 미팅"
          value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} maxLength={60}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">📅 시작 날짜</label>
          <DatePicker value={form.startDate} minDate={todayStr()} onChange={val => setForm(f => ({...f, startDate: val}))} />
        </div>
        <div>
          <label className="label">📆 날짜 수</label>
          <select className="input" value={form.numDays} onChange={e => setForm(f => ({...f, numDays: Number(e.target.value)}))}>
            {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n}일</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {previewDates.map(d => {
          const date = new Date(d + 'T00:00:00')
          const days = ['일','월','화','수','목','금','토']
          const isWeekend = date.getDay() === 0 || date.getDay() === 6
          return (
            <span key={d} className="text-xs font-bold px-2.5 py-1"
              style={{
                borderRadius: '999px',
                ...(isWeekend
                  ? { background: '#fff1f2', color: '#e11d48', border: '1.5px solid #fecdd3' }
                  : { background: '#edfdf8', color: '#0ecfb0', border: '1.5px solid #a8f2e4' })
              }}
            >
              {date.getMonth()+1}/{date.getDate()}({days[date.getDay()]})
            </span>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">🕘 시작 시간</label>
          <select className="input" value={form.startHour} onChange={e => setForm(f => ({...f, startHour: Number(e.target.value)}))}>
            {TIME_OPTIONS.slice(0,24).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">🕙 종료 시간</label>
          <select className="input" value={form.endHour} onChange={e => setForm(f => ({...f, endHour: Number(e.target.value)}))}>
            {TIME_OPTIONS.slice(1).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 text-sm font-semibold"
          style={{ borderRadius: '999px', background: '#fff1f2', color: '#e11d48', border: '1.5px solid #fecdd3' }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <button onClick={handleSubmit} className="btn-primary w-full py-4 text-base"
        disabled={loading || !isSupabaseConfigured}
      >
        {loading ? '생성 중...' : '방 만들기 🚀'}
      </button>
    </div>
  )

  return (
    <div className="pb-4">

      {/* ══════════════════════════════════
          PC 레이아웃 (md 이상)
      ══════════════════════════════════ */}
      <div className="hidden md:block pt-10">
        <div className="grid grid-cols-2 gap-10 items-start">

          {/* 왼쪽: 소개 */}
          <div>
            <p className="section-sub mb-2">Team Scheduler</p>
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight mb-4" style={{ color: '#111' }}>
              언제 모일 수<br />있나요? 🗓️
            </h1>
            <p className="text-sm font-medium mb-8" style={{ color: '#aaa' }}>
              방을 만들고 팀원에게 링크를 공유하세요.<br />
              모두가 가능한 최적의 시간을 찾아드립니다.
            </p>

            {/* 히어로 카드 */}
            <div className="rounded-3xl p-6 relative overflow-hidden mb-6"
              style={{
                background: 'linear-gradient(145deg, #a8f2e4 0%, #0ecfb0 60%, #08b094 100%)',
                boxShadow: '0 8px 32px rgba(14,207,176,0.35)',
              }}
            >
              <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
              <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <div className="relative z-10">
                <p className="text-4xl mb-3">🗓️</p>
                <p className="font-extrabold text-white text-xl leading-tight">팀 일정 조율,<br />더 쉽게</p>
                <p className="text-white/70 text-sm font-semibold mt-2">링크 하나로 모두의 가능 시간 수집</p>
              </div>
            </div>

            {/* 스텝 */}
            <div className="space-y-3">
              {[
                { step:'01', title:'방 만들기', desc:'날짜 범위와 시간대를 설정해서 방을 생성해요.' },
                { step:'02', title:'링크 공유', desc:'생성된 링크를 팀원들에게 보내요.' },
                { step:'03', title:'결과 확인', desc:'모두가 가능한 최적의 시간을 확인해요.' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: '#f9f9f9' }}>
                  <span className="text-sm font-extrabold w-8 flex-shrink-0" style={{ color: '#0ecfb0' }}>{s.step}</span>
                  <div>
                    <p className="font-extrabold text-sm" style={{ color: '#111' }}>{s.title}</p>
                    <p className="text-xs font-medium mt-0.5" style={{ color: '#aaa' }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 오른쪽: 인라인 폼 */}
          <div className="card p-6">
            <p className="font-extrabold text-lg mb-5" style={{ color: '#111' }}>🗓️ 방 만들기</p>
            {!isSupabaseConfigured && (
              <div className="mb-4 p-3 rounded-2xl flex gap-2"
                style={{ background: '#fffbeb', border: '1.5px solid #fde68a' }}
              >
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-amber-700">Supabase 미설정 — <code>.env.local</code>을 확인해주세요.</p>
              </div>
            )}
            {FormContent}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════
          모바일 레이아웃 (md 미만)
      ══════════════════════════════════ */}
      <div className="md:hidden">
        <div className="pt-2 pb-6">
          <p className="section-sub mb-1">Team Scheduler</p>
          <h1 className="section-title">언제 모일 수 있나요?</h1>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-5 p-4 rounded-2xl flex gap-3"
            style={{ background: '#fffbeb', border: '1.5px solid #fde68a' }}
          >
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-amber-700">Supabase 미설정</p>
          </div>
        )}

        {/* 히어로 카드 + 사이드 그리드 */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          <button onClick={() => setShowForm(true)}
            className="col-span-3 rounded-3xl p-5 text-left relative overflow-hidden transition-all active:scale-[0.97]"
            style={{
              background: 'linear-gradient(145deg, #a8f2e4 0%, #0ecfb0 60%, #08b094 100%)',
              minHeight: '200px',
              boxShadow: '0 6px 24px rgba(14,207,176,0.35)',
            }}
          >
            <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
            <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="text-3xl mb-2">🗓️</div>
              <div>
                <p className="font-extrabold text-white text-base leading-tight">방 만들기</p>
                <p className="text-white/70 text-xs font-semibold mt-1">날짜·시간 설정 후 팀원 초대</p>
              </div>
            </div>
          </button>

          <div className="col-span-2 flex flex-col gap-3">
            <div className="card flex-1 p-4 flex flex-col justify-between">
              <div className="text-2xl">🔗</div>
              <div>
                <p className="font-extrabold text-sm" style={{ color: '#111' }}>링크 공유</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: '#aaa' }}>팀원에게 전달</p>
              </div>
            </div>
            <div className="card flex-1 p-4 flex flex-col justify-between">
              <div className="text-2xl">✅</div>
              <div>
                <p className="font-extrabold text-sm" style={{ color: '#111' }}>결과 확인</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: '#aaa' }}>최적 시간 발견</p>
              </div>
            </div>
          </div>
        </div>

        {/* 이용 방법 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="section-sub">When2Work 소개</p>
              <p className="section-title text-lg">이렇게 사용해요</p>
            </div>
          </div>
          <div className="card p-4 space-y-3">
            {[
              { step:'01', title:'방 만들기', desc:'날짜 범위와 시간대를 설정해서 방을 생성해요.' },
              { step:'02', title:'링크 공유', desc:'생성된 링크를 팀원들에게 보내요.' },
              { step:'03', title:'결과 확인', desc:'모두가 가능한 최적의 시간을 확인해요.' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-extrabold w-7 flex-shrink-0" style={{ color: '#0ecfb0' }}>{s.step}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-sm" style={{ color: '#111' }}>{s.title}</p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: '#aaa' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 바텀시트 폼 */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
              onClick={() => setShowForm(false)}
            />
            <div className="relative w-full max-w-lg bg-white dark:bg-[#1e1e1e] px-5 pt-6 pb-10"
              style={{ borderRadius: '28px 28px 0 0', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 -4px 40px rgba(0,0,0,0.12)' }}
            >
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full" style={{ background: '#e0e0e0' }} />
              <div className="flex items-center justify-between mb-5">
                <p className="font-extrabold text-lg" style={{ color: '#111' }}>🗓️ 방 만들기</p>
                <button onClick={() => setShowForm(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full active:scale-90"
                  style={{ background: '#f5f5f5', color: '#888', fontSize: '18px' }}
                >×</button>
              </div>
              {FormContent}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}