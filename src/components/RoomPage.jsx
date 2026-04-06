import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Copy, Check, RefreshCw, Save,
  BarChart2, Calendar, AlertCircle, Loader2, Trash2
} from 'lucide-react'
import { getRoom, getAvailabilities, upsertAvailability, deleteRoom } from '../lib/supabase'
import TimeGrid from './TimeGrid'
import ResultsView from './ResultsView'

const TABS = [
  { id: 'input',   label: '내 시간 입력', icon: Calendar },
  { id: 'results', label: '결과 보기',    icon: BarChart2 },
]

export default function RoomPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [availabilities, setAvailabilities] = useState([])
  const [avLoading, setAvLoading] = useState(false)
  const [name, setName] = useState(() => localStorage.getItem('w2w-name') || '')
  const [selected, setSelected] = useState(new Set())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [tab, setTab] = useState('input')
  const [copied, setCopied] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function load() {
      try { setRoom(await getRoom(id)) }
      catch { setError('방을 찾을 수 없습니다.') }
      finally { setLoading(false) }
    }
    load()
  }, [id])

  const loadAvailabilities = useCallback(async () => {
    if (!id) return
    setAvLoading(true)
    try {
      const data = await getAvailabilities(id)
      setAvailabilities(data)
      const myName = localStorage.getItem('w2w-name')
      if (myName) {
        const mine = data.find(d => d.name === myName)
        if (mine) setSelected(new Set(mine.slots))
      }
    } catch (e) { console.error(e) }
    finally { setAvLoading(false) }
  }, [id])

  useEffect(() => { loadAvailabilities() }, [loadAvailabilities])

  async function handleSave() {
    if (!name.trim()) { setSaveError('이름을 입력해주세요.'); return }
    setSaving(true); setSaveError('')
    try {
      localStorage.setItem('w2w-name', name.trim())
      await upsertAvailability({ room_id: id, name: name.trim(), slots: [...selected] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      await loadAvailabilities()
    } catch { setSaveError('저장에 실패했습니다. 다시 시도해주세요.') }
    finally { setSaving(false) }
  }

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleDelete() {
    setDeleting(true)
    try { await deleteRoom(id); navigate('/') }
    catch { alert('삭제에 실패했습니다.') }
    finally { setDeleting(false); setShowDeleteConfirm(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
    </div>
  )

  if (error || !room) return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4"
        style={{ background: '#fff1f2', border: '2px solid #fecdd3' }}
      >
        <AlertCircle className="w-8 h-8 text-rose-400" />
      </div>
      <h2 className="text-xl font-extrabold mb-2" style={{ color: '#1a1a2e' }}>방을 찾을 수 없습니다</h2>
      <p className="text-sm mb-6" style={{ color: '#a0a0b0' }}>{error}</p>
      <a href="#/" className="btn-primary">홈으로 돌아가기</a>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-4">

      {/* ── 방 헤더 배너 ── */}
      <div className="rounded-3xl p-5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          boxShadow: '0 6px 24px rgba(79,70,229,0.3)',
        }}
      >
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-20"
          style={{ background: 'rgba(255,255,255,0.4)' }} />
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold text-white truncate">{room.title}</h1>
            <p className="text-white/65 text-xs mt-1 font-medium">
              {room.dates[0]} ~ {room.dates[room.dates.length - 1]}
              &nbsp;·&nbsp; {room.time_start}:00 ~ {room.time_end}:00
              &nbsp;·&nbsp; <span className="text-white font-bold">{availabilities.length}명 응답</span>
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)' }}
            >
              {copied ? <><Check className="w-3.5 h-3.5" /> 복사됨</> : <><Copy className="w-3.5 h-3.5" /> 링크 복사</>}
            </button>
            <button onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center px-3 py-2 rounded-2xl text-xs font-bold transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fca5a5', border: '1.5px solid rgba(255,255,255,0.2)' }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 삭제 확인 모달 ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
        >
          <div className="card p-6 max-w-sm w-full">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: '#fff1f2', border: '2px solid #fecdd3' }}
            >
              <Trash2 className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="text-lg font-extrabold mb-1" style={{ color: '#1a1a2e' }}>방을 삭제하시겠습니까?</h3>
            <p className="text-sm mb-5" style={{ color: '#a0a0b0' }}>
              모든 참여자 데이터가 함께 삭제되며 복구할 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting} className="btn-secondary flex-1">취소</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 btn-primary"
                style={{ background: '#e11d48', boxShadow: '0 4px 16px rgba(225,29,72,0.35)' }}
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 탭 ── */}
      <div className="card p-1.5 flex gap-1.5">
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); if (t.id === 'results') loadAvailabilities() }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 active:scale-95"
              style={active ? {
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
              } : {
                color: '#a0a0b0',
              }}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {t.id === 'results' && availabilities.length > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-extrabold"
                  style={active
                    ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                    : { background: '#eef2ff', color: '#4f46e5' }
                  }
                >
                  {availabilities.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── 입력 탭 ── */}
      {tab === 'input' && (
        <div className="space-y-4">
          <div className="card p-5">
            <label className="label">내 이름</label>
            <div className="flex gap-3">
              <input
                type="text" className="input flex-1" placeholder="홍길동"
                value={name} onChange={e => setName(e.target.value)} maxLength={20}
              />
              <button onClick={handleSave} disabled={saving || selected.size === 0} className="btn-primary flex-shrink-0">
                {saving
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : saved
                  ? <><Check className="w-4 h-4" /> 저장됨</>
                  : <><Save className="w-4 h-4" /> 저장</>
                }
              </button>
            </div>
            {saveError && (
              <div className="mt-2 flex items-center gap-1.5 text-xs font-medium p-2.5 rounded-xl"
                style={{ background: '#fff1f2', color: '#e11d48' }}
              >
                <AlertCircle className="w-3.5 h-3.5" /> {saveError}
              </div>
            )}
            {selected.size > 0 && (
              <p className="mt-2 text-xs font-medium" style={{ color: '#a0a0b0' }}>
                {selected.size}개 슬롯 선택됨 ({Math.floor(selected.size / 2)}시간 {selected.size % 2 * 30 > 0 ? '30분' : ''})
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 px-1">
            <div className="flex items-center gap-2 text-xs font-medium" style={{ color: '#a0a0b0' }}>
              <span className="inline-block w-3 h-3 rounded bg-indigo-500" />
              드래그하여 가능한 시간을 선택하세요.
            </div>
            {selected.size > 0 && (
              <button onClick={() => setSelected(new Set())} className="btn-secondary text-xs py-2 px-3">
                <RefreshCw className="w-3.5 h-3.5" /> 초기화
              </button>
            )}
          </div>

          <TimeGrid
            mode="select"
            dates={room.dates} startHour={room.time_start} endHour={room.time_end}
            selected={selected} onSelectionChange={setSelected}
          />
        </div>
      )}

      {/* ── 결과 탭 ── */}
      {tab === 'results' && (
        avLoading
          ? <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
          : <ResultsView room={room} availabilities={availabilities} />
      )}
    </div>
  )
}
