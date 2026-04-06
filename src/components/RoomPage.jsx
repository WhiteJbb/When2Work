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

  // 방 데이터
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 참여자 데이터
  const [availabilities, setAvailabilities] = useState([])
  const [avLoading, setAvLoading] = useState(false)

  // 입력 상태
  const [name, setName] = useState(() => localStorage.getItem('w2w-name') || '')
  const [selected, setSelected] = useState(new Set())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  // UI 상태
  const [tab, setTab] = useState('input')
  const [copied, setCopied] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // ─── 데이터 로드 ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const r = await getRoom(id)
        setRoom(r)
      } catch (e) {
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

      // 내 이름으로 저장된 슬롯이 있으면 불러오기
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

  useEffect(() => {
    loadAvailabilities()
  }, [loadAvailabilities])

  // ─── 저장 ────────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!name.trim()) { setSaveError('이름을 입력해주세요.'); return }
    setSaving(true)
    setSaveError('')
    try {
      localStorage.setItem('w2w-name', name.trim())
      await upsertAvailability({
        room_id: id,
        name: name.trim(),
        slots: [...selected],
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      await loadAvailabilities()
    } catch (e) {
      setSaveError('저장에 실패했습니다. 다시 시도해주세요.')
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  // ─── 링크 복사 ───────────────────────────────────────────────────────────────
  function handleCopy() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // ─── 방 삭제 ─────────────────────────────────────────────────────────────────
  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteRoom(id)
      navigate('/')
    } catch (e) {
      alert('삭제에 실패했습니다.')
      console.error(e)
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  // ─── 렌더 ────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">방을 찾을 수 없습니다</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{error}</p>
        <a href="#/" className="btn-primary">홈으로 돌아가기</a>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 방 헤더 */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 truncate">
              {room.title}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {room.dates[0]} ~ {room.dates[room.dates.length - 1]} &nbsp;·&nbsp;
              {room.time_start}:00 ~ {room.time_end}:00
              &nbsp;·&nbsp; {availabilities.length}명 응답
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleCopy}
              className="btn-secondary text-xs"
            >
              {copied
                ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> 복사됨</>
                : <><Copy className="w-3.5 h-3.5" /> 링크 복사</>
              }
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-secondary text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2">
              방을 삭제하시겠습니까?
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              모든 참여자 데이터가 함께 삭제되며 복구할 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="btn-secondary flex-1"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn-primary flex-1 bg-rose-600 hover:bg-rose-700 active:bg-rose-800"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 탭 */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1">
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id)
                if (t.id === 'results') loadAvailabilities()
              }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors
                ${active
                  ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-500'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {t.id === 'results' && availabilities.length > 0 && (
                <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/40
                                  text-brand-600 dark:text-brand-400 font-semibold">
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
          {/* 이름 입력 */}
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
              <p className="mt-2 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {saveError}
              </p>
            )}
            {selected.size > 0 && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {selected.size}개 슬롯 선택됨 ({Math.floor(selected.size / 2)}시간 {selected.size % 2 * 30 > 0 ? '30분' : ''})
              </p>
            )}
          </div>

          {/* 사용법 안내 */}
          <div className="flex items-center justify-between gap-4 px-1">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-block w-3 h-3 rounded-sm bg-brand-500" />
              <span>클릭하거나 드래그하여 가능한 시간을 선택하세요.</span>
              <span className="opacity-70">· 선택 해제: 선택된 셀을 다시 드래그</span>
            </div>
            {selected.size > 0 && (
              <button
                onClick={() => setSelected(new Set())}
                className="btn-secondary text-xs py-1.5 px-3 flex-shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" /> 선택 초기화
              </button>
            )}
          </div>

          {/* 그리드 */}
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
              <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            </div>
          ) : (
            <ResultsView room={room} availabilities={availabilities} />
          )}
        </div>
      )}
    </div>
  )
}
