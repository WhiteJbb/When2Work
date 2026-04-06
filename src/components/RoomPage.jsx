import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Copy, Check, RefreshCw, Save, ChevronRight,
  BarChart2, Calendar, AlertCircle, Loader2, Trash2
} from 'lucide-react'
import { getRoom, getAvailabilities, upsertAvailability, deleteRoom } from '../lib/supabase'
import TimeGrid from './TimeGrid'
import ResultsView from './ResultsView'

const TABS = [
  { id: 'input', label: '내 시간 입력', icon: Calendar },
  { id: 'results', label: '결과 보기', icon: BarChart2 },
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
      try {
        const r = await getRoom(id)
        setRoom(r)
      } catch {
        setError('방을 찾을 수 없습니다.')
      } finally {
        setLoading(false)
      }
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
    } catch (e) {
      console.error(e)
    } finally {
      setAvLoading(false)
    }
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
    } catch {
      setSaveError('저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteRoom(id)
      navigate('/')
    } catch {
      alert('삭제에 실패했습니다.')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#6366f1' }} />
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2" style={{ color: '#e2e8f0' }}>방을 찾을 수 없습니다</h2>
        <p className="text-sm mb-6" style={{ color: '#64748b' }}>{error}</p>
        <a href="#/" className="btn-primary">홈으로 돌아가기</a>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── 방 헤더 ── */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate" style={{ color: '#e2e8f0' }}>
              {room.title}
            </h1>
            <p className="text-sm mt-1" style={{ color: '#64748b' }}>
              {room.dates[0]} ~ {room.dates[room.dates.length - 1]}
              &nbsp;·&nbsp; {room.time_start}:00 ~ {room.time_end}:00
              &nbsp;·&nbsp;
              <span style={{ color: '#a5b4fc' }}>{availabilities.length}명 응답</span>
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={handleCopy} className="btn-secondary text-xs">
              {copied
                ? <><Check className="w-3.5 h-3.5" style={{ color: '#34d399' }} /> 복사됨</>
                : <><Copy className="w-3.5 h-3.5" /> 링크 복사</>
              }
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-secondary text-xs"
              style={{ color: '#f87171' }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 삭제 확인 모달 ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
        >
          <div className="card p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2" style={{ color: '#e2e8f0' }}>방을 삭제하시겠습니까?</h3>
            <p className="text-sm mb-6" style={{ color: '#64748b' }}>
              모든 참여자 데이터가 함께 삭제되며 복구할 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting} className="btn-secondary flex-1">취소</button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn-primary flex-1"
                style={{ background: 'linear-gradient(135deg, #e11d48, #be123c)', boxShadow: '0 0 20px rgba(225,29,72,0.3)' }}
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 탭 ── */}
      <div className="flex gap-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); if (t.id === 'results') loadAvailabilities() }}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all duration-150"
              style={active ? {
                color: '#a5b4fc',
                borderBottom: '2px solid #6366f1',
                textShadow: '0 0 20px rgba(99,102,241,0.5)',
              } : {
                color: '#475569',
              }}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {t.id === 'results' && availabilities.length > 0 && (
                <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}
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
        <div className="space-y-5">
          <div className="card p-5">
            <label className="label">내 이름</label>
            <div className="flex gap-3">
              <input
                type="text"
                className="input flex-1"
                placeholder="홍길동"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={20}
              />
              <button
                onClick={handleSave}
                disabled={saving || selected.size === 0}
                className="btn-primary flex-shrink-0"
              >
                {saving
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : saved
                  ? <><Check className="w-4 h-4" /> 저장됨</>
                  : <><Save className="w-4 h-4" /> 저장</>
                }
              </button>
            </div>
            {saveError && (
              <p className="mt-2 text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {saveError}
              </p>
            )}
            {selected.size > 0 && (
              <p className="mt-2 text-xs" style={{ color: '#64748b' }}>
                {selected.size}개 슬롯 선택됨 ({Math.floor(selected.size / 2)}시간 {selected.size % 2 * 30 > 0 ? '30분' : ''})
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 px-1">
            <div className="flex items-center gap-2 text-xs" style={{ color: '#475569' }}>
              <span className="inline-block w-3 h-3 rounded-sm"
                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 0 6px rgba(99,102,241,0.5)' }}
              />
              <span>클릭하거나 드래그하여 가능한 시간을 선택하세요.</span>
              <span className="opacity-50">· 선택 해제: 선택된 셀을 다시 드래그</span>
            </div>
            {selected.size > 0 && (
              <button onClick={() => setSelected(new Set())} className="btn-secondary text-xs py-1.5 px-3 flex-shrink-0">
                <RefreshCw className="w-3.5 h-3.5" /> 선택 초기화
              </button>
            )}
          </div>

          <TimeGrid
            mode="select"
            dates={room.dates}
            startHour={room.time_start}
            endHour={room.time_end}
            selected={selected}
            onSelectionChange={setSelected}
          />
        </div>
      )}

      {/* ── 결과 탭 ── */}
      {tab === 'results' && (
        <div>
          {avLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#6366f1' }} />
            </div>
          ) : (
            <ResultsView room={room} availabilities={availabilities} />
          )}
        </div>
      )}
    </div>
  )
}
