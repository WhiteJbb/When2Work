import { useEffect, useRef, useState, useCallback } from 'react'
import { generateTimeSlots, formatDateHeader, formatTimeLabel, slotId } from '../utils/timeUtils'
import { useTheme } from '../context/ThemeContext'
import { heatColor } from '../utils/timeUtils'

/**
 * TimeGrid — 드래그로 시간 선택 또는 히트맵 표시
 *
 * Props:
 *  mode: 'select' | 'results'
 *  dates: string[]
 *  startHour: number
 *  endHour: number
 *  selected: Set<string>        (select 모드)
 *  onSelectionChange: (Set) =>  (select 모드)
 *  heatmap: { [slotId]: string[] }  (results 모드)
 *  totalParticipants: number        (results 모드)
 *  onCellHover: (slotId|null) =>    (results 모드)
 */
export default function TimeGrid({
  mode = 'select',
  dates,
  startHour,
  endHour,
  selected = new Set(),
  onSelectionChange,
  heatmap = {},
  totalParticipants = 0,
  onCellHover,
}) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const timeSlots = generateTimeSlots(startHour, endHour)

  // ─── 드래그 상태 ──────────────────────────────────────────────────────────
  const isDragging = useRef(false)
  const dragMode = useRef('add')
  const gridRef = useRef(null)

  const lastPosRef = useRef(null) // { dateStr, rowIdx }

  // 좌표 → { dateStr, rowIdx } 계산
  function getPosFromPoint(clientX, clientY) {
    if (!gridRef.current) return null

    const dateCols = [...gridRef.current.querySelectorAll('[data-date-col]')]
    let dateStr = null
    for (const col of dateCols) {
      const r = col.getBoundingClientRect()
      if (clientX >= r.left && clientX < r.right) {
        dateStr = col.dataset.dateCol
        break
      }
    }
    if (!dateStr) return null

    // 모든 셀을 순회해서 y 좌표가 속하는 셀 찾기
    const cells = [...gridRef.current.querySelectorAll(`[data-date-col="${dateStr}"] [data-cell-id]`)]
    for (let i = 0; i < cells.length; i++) {
      const r = cells[i].getBoundingClientRect()
      if (clientY >= r.top && clientY < r.bottom) {
        return { dateStr, rowIdx: i }
      }
    }
    // 그리드 위/아래 경계 클램핑
    if (cells.length === 0) return null
    const firstRect = cells[0].getBoundingClientRect()
    const lastRect = cells[cells.length - 1].getBoundingClientRect()
    if (clientY < firstRect.top) return { dateStr, rowIdx: 0 }
    if (clientY >= lastRect.bottom) return { dateStr, rowIdx: cells.length - 1 }

    return null
  }

  // 이전 위치 → 현재 위치 사이 모든 셀에 드래그 모드 적용 (보간)
  function applyTo(clientX, clientY) {
    const pos = getPosFromPoint(clientX, clientY)
    if (!pos) return

    const prev = lastPosRef.current
    const ids = []

    if (prev?.dateStr === pos.dateStr) {
      // 같은 열: 이전 행과 현재 행 사이 전부 채움
      const minRow = Math.min(prev.rowIdx, pos.rowIdx)
      const maxRow = Math.max(prev.rowIdx, pos.rowIdx)
      for (let r = minRow; r <= maxRow; r++) {
        ids.push(slotId(pos.dateStr, timeSlots[r]))
      }
    } else {
      ids.push(slotId(pos.dateStr, timeSlots[pos.rowIdx]))
    }

    onSelectionChange(prev => {
      const next = new Set(prev)
      for (const id of ids) {
        if (dragMode.current === 'add') next.add(id)
        else next.delete(id)
      }
      return next
    })

    lastPosRef.current = pos
  }

  // 마우스 이벤트
  const handleMouseDown = useCallback((id) => (e) => {
    if (mode !== 'select') return
    e.preventDefault()
    isDragging.current = true
    dragMode.current = selected.has(id) ? 'remove' : 'add'
    const [dateStr, time] = id.split('|')
    lastPosRef.current = { dateStr, rowIdx: timeSlots.indexOf(time) }
    onSelectionChange(prev => {
      const next = new Set(prev)
      if (dragMode.current === 'add') next.add(id)
      else next.delete(id)
      return next
    })
  }, [mode, selected, onSelectionChange, timeSlots])

  const handleMouseMove = useCallback((e) => {
    if (mode !== 'select' || !isDragging.current) return
    applyTo(e.clientX, e.clientY)
  }, [mode])

  // 터치 이벤트
  const handleTouchStart = useCallback((id) => (e) => {
    if (mode !== 'select') return
    e.preventDefault()
    isDragging.current = true
    dragMode.current = selected.has(id) ? 'remove' : 'add'
    const [dateStr, time] = id.split('|')
    lastPosRef.current = { dateStr, rowIdx: timeSlots.indexOf(time) }
    onSelectionChange(prev => {
      const next = new Set(prev)
      if (dragMode.current === 'add') next.add(id)
      else next.delete(id)
      return next
    })
  }, [mode, selected, onSelectionChange, timeSlots])

  const handleTouchMove = useCallback((e) => {
    if (mode !== 'select' || !isDragging.current) return
    e.preventDefault()
    const touch = e.touches[0]
    applyTo(touch.clientX, touch.clientY)
  }, [mode])

  useEffect(() => {
    const onUp = () => { isDragging.current = false }
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchend', onUp)
    }
  }, [])

  const CELL_H = 32 // px per 30-min slot (가독성 향상을 위해 증가)

  // 시간 슬롯을 1시간 단위 그룹으로 묶기
  const hourGroups = []
  for (let i = 0; i < timeSlots.length; i += 2) {
    hourGroups.push({
      label: timeSlots[i],           // "09:00"
      slots: timeSlots.slice(i, i + 2), // [":00", ":30"]
      hourIndex: i / 2,
    })
  }

  function getCellStyle(date, time) {
    const id = slotId(date, time)
    if (mode === 'select') {
      return selected.has(id) ? { backgroundColor: '#6366f1' } : {}
    }
    const names = heatmap[id] || []
    const ratio = totalParticipants > 0 ? names.length / totalParticipants : 0
    return { backgroundColor: heatColor(ratio, isDark) }
  }

  function getCellHoverClass(date, time) {
    if (mode !== 'select') return ''
    const id = slotId(date, time)
    return selected.has(id)
      ? 'hover:brightness-110'
      : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'
  }

  function getCellClass(date, time, isHalfHour, hourIndex) {
    const id = slotId(date, time)
    const base = 'w-full select-none-touch transition-all duration-100 box-border'
    const cursor = mode === 'select' ? 'cursor-crosshair' : 'cursor-default'
    // :00 셀: 하단에 점선 구분선, :30 셀: 하단 없음 (그룹 경계는 hourGroup border로)
    const divider = !isHalfHour
      ? 'border-b border-dashed border-slate-300 dark:border-slate-600/70'
      : ''

    if (mode === 'select') {
      const isSelected = selected.has(id)
      const bgBase = hourIndex % 2 === 0
        ? 'bg-white dark:bg-slate-900'
        : 'bg-slate-50/80 dark:bg-slate-800/50'
      const hover = getCellHoverClass(date, time)
      return `${base} ${cursor} ${divider} ${isSelected ? 'shadow-inner' : bgBase} ${hover}`
    }
    return `${base} ${cursor} ${divider}`
  }

  return (
    <div className="overflow-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <div
        ref={gridRef}
        className="relative"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        style={{ minWidth: `${dates.length * 64 + 70}px` }}
      >
        {/* ── 헤더: 날짜 ── */}
        <div className="flex sticky top-0 z-10 bg-white dark:bg-slate-900 border-b-2 border-slate-300 dark:border-slate-700 shadow-sm">
          <div className="w-[70px] flex-shrink-0" />
          {dates.map(d => {
            const { weekday, month, day, isWeekend } = formatDateHeader(d)
            return (
              <div
                key={d}
                className={`flex-1 min-w-[64px] text-center py-3 border-l border-slate-200 dark:border-slate-800
                  ${isWeekend ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-700 dark:text-slate-300'}`}
              >
                <p className="text-sm font-bold">{weekday}</p>
                <p className="text-xs opacity-70 mt-0.5">{month}/{day}</p>
              </div>
            )
          })}
        </div>

        {/* ── 그리드 바디: 시간 그룹 단위 ── */}
        <div className="flex">

          {/* 시간 라벨 열 */}
          <div className="w-[70px] flex-shrink-0 bg-slate-50/50 dark:bg-slate-900/50 border-r-2 border-slate-300 dark:border-slate-700">
            {timeSlots.map((time, idx) => {
              const isHourStart = idx % 2 === 0
              const hourLabel = isHourStart ? time : null
              const showTopBorder = idx > 0 && isHourStart
              
              return (
                <div
                  key={time}
                  className={`relative ${showTopBorder ? 'border-t-2 border-slate-300 dark:border-slate-600' : ''}`}
                  style={{ height: `${CELL_H}px` }}
                >
                  {hourLabel && (
                    <span className="absolute top-1 right-3 text-[13px] font-bold
                                     text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900
                                     px-1.5 py-0.5 leading-none whitespace-nowrap rounded">
                      {hourLabel}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* 날짜별 열 */}
          {dates.map(date => (
            <div
              key={date}
              data-date-col={date}
              className="flex-1 min-w-[64px] border-l border-slate-200 dark:border-slate-800"
            >
              {timeSlots.map((time, idx) => {
                const id = slotId(date, time)
                const isHourStart = idx % 2 === 0
                const showTopBorder = idx > 0 && isHourStart
                const showHalfHourDivider = idx % 2 === 0
                const hourIndex = Math.floor(idx / 2)
                
                return (
                  <div
                    key={time}
                    data-cell-id={id}
                    style={{ height: `${CELL_H}px`, ...getCellStyle(date, time) }}
                    className={`${getCellClass(date, time, !showHalfHourDivider, hourIndex)} ${showTopBorder ? 'border-t-2 border-slate-300 dark:border-slate-600' : ''}`}
                    onMouseDown={handleMouseDown(id)}
                    onTouchStart={handleTouchStart(id)}
                    onMouseOver={() => onCellHover?.(id)}
                    onMouseLeave={() => onCellHover?.(null)}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
