import { useEffect, useRef, useCallback } from 'react'
import { generateTimeSlots, formatDateHeader, slotId } from '../utils/timeUtils'
import { useTheme } from '../context/ThemeContext'
import { heatColor } from '../utils/timeUtils'

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
  const lastPosRef = useRef(null)

  function getPosFromPoint(clientX, clientY) {
    if (!gridRef.current) return null
    const dateCols = [...gridRef.current.querySelectorAll('[data-date-col]')]
    let dateStr = null
    for (const col of dateCols) {
      const r = col.getBoundingClientRect()
      if (clientX >= r.left && clientX < r.right) { dateStr = col.dataset.dateCol; break }
    }
    if (!dateStr) return null
    const cells = [...gridRef.current.querySelectorAll(`[data-date-col="${dateStr}"] [data-cell-id]`)]
    for (let i = 0; i < cells.length; i++) {
      const r = cells[i].getBoundingClientRect()
      if (clientY >= r.top && clientY < r.bottom) return { dateStr, rowIdx: i }
    }
    if (cells.length === 0) return null
    const firstRect = cells[0].getBoundingClientRect()
    const lastRect = cells[cells.length - 1].getBoundingClientRect()
    if (clientY < firstRect.top) return { dateStr, rowIdx: 0 }
    if (clientY >= lastRect.bottom) return { dateStr, rowIdx: cells.length - 1 }
    return null
  }

  function applyTo(clientX, clientY) {
    const pos = getPosFromPoint(clientX, clientY)
    if (!pos) return
    const prev = lastPosRef.current
    const ids = []
    if (prev?.dateStr === pos.dateStr) {
      const minRow = Math.min(prev.rowIdx, pos.rowIdx)
      const maxRow = Math.max(prev.rowIdx, pos.rowIdx)
      for (let r = minRow; r <= maxRow; r++) ids.push(slotId(pos.dateStr, timeSlots[r]))
    } else {
      ids.push(slotId(pos.dateStr, timeSlots[pos.rowIdx]))
    }
    onSelectionChange(prev => {
      const next = new Set(prev)
      for (const id of ids) dragMode.current === 'add' ? next.add(id) : next.delete(id)
      return next
    })
    lastPosRef.current = pos
  }

  const handleMouseDown = useCallback((id) => (e) => {
    if (mode !== 'select') return
    e.preventDefault()
    isDragging.current = true
    dragMode.current = selected.has(id) ? 'remove' : 'add'
    const [dateStr, time] = id.split('|')
    lastPosRef.current = { dateStr, rowIdx: timeSlots.indexOf(time) }
    onSelectionChange(prev => {
      const next = new Set(prev)
      dragMode.current === 'add' ? next.add(id) : next.delete(id)
      return next
    })
  }, [mode, selected, onSelectionChange, timeSlots])

  const handleMouseMove = useCallback((e) => {
    if (mode !== 'select' || !isDragging.current) return
    applyTo(e.clientX, e.clientY)
  }, [mode])

  const handleTouchStart = useCallback((id) => (e) => {
    if (mode !== 'select') return
    e.preventDefault()
    isDragging.current = true
    dragMode.current = selected.has(id) ? 'remove' : 'add'
    const [dateStr, time] = id.split('|')
    lastPosRef.current = { dateStr, rowIdx: timeSlots.indexOf(time) }
    onSelectionChange(prev => {
      const next = new Set(prev)
      dragMode.current === 'add' ? next.add(id) : next.delete(id)
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

  const CELL_H = 32

  function getCellStyle(date, time) {
    const id = slotId(date, time)
    if (mode === 'select') {
      if (selected.has(id)) {
        return {
          background: 'linear-gradient(135deg, rgba(99,102,241,0.85), rgba(79,70,229,0.85))',
          boxShadow: isDark ? '0 0 8px rgba(99,102,241,0.5)' : 'none',
        }
      }
      return {}
    }
    const names = heatmap[id] || []
    const ratio = totalParticipants > 0 ? names.length / totalParticipants : 0
    return { backgroundColor: heatColor(ratio, isDark) }
  }

  function getCellBg(hourIndex) {
    if (isDark) {
      return hourIndex % 2 === 0
        ? 'rgba(255,255,255,0.02)'
        : 'rgba(255,255,255,0.04)'
    }
    return hourIndex % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.04)'
  }

  const headerStyle = isDark ? {
    background: 'rgba(8,8,21,0.9)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '2px solid rgba(99,102,241,0.2)',
  } : {
    background: 'rgba(248,250,255,0.9)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '2px solid rgba(99,102,241,0.15)',
  }

  const timeLabelColStyle = isDark ? {
    background: 'rgba(255,255,255,0.02)',
    borderRight: '2px solid rgba(255,255,255,0.06)',
  } : {
    background: 'rgba(0,0,0,0.02)',
    borderRight: '2px solid rgba(0,0,0,0.06)',
  }

  const hourBorderStyle = isDark
    ? '2px solid rgba(255,255,255,0.06)'
    : '2px solid rgba(0,0,0,0.06)'

  const halfBorderStyle = isDark
    ? '1px dashed rgba(255,255,255,0.05)'
    : '1px dashed rgba(0,0,0,0.06)'

  return (
    <div className="overflow-auto rounded-xl"
      style={{
        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(99,102,241,0.15)',
        boxShadow: isDark ? '0 4px 32px rgba(0,0,0,0.4)' : '0 4px 16px rgba(99,102,241,0.08)',
      }}
    >
      <div
        ref={gridRef}
        className="relative"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        style={{ minWidth: `${dates.length * 64 + 70}px` }}
      >
        {/* ── 헤더: 날짜 ── */}
        <div className="flex sticky top-0 z-10 shadow-sm" style={headerStyle}>
          <div className="w-[70px] flex-shrink-0" />
          {dates.map(d => {
            const { weekday, month, day, isWeekend } = formatDateHeader(d)
            return (
              <div
                key={d}
                className="flex-1 min-w-[64px] text-center py-3"
                style={{
                  borderLeft: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                  color: isWeekend
                    ? '#fb7185'
                    : isDark ? '#cbd5e1' : '#475569',
                }}
              >
                <p className="text-sm font-bold">{weekday}</p>
                <p className="text-xs mt-0.5 opacity-60">{month}/{day}</p>
              </div>
            )
          })}
        </div>

        {/* ── 그리드 바디 ── */}
        <div className="flex">

          {/* 시간 라벨 열 */}
          <div className="w-[70px] flex-shrink-0" style={timeLabelColStyle}>
            {timeSlots.map((time, idx) => {
              const isHourStart = idx % 2 === 0
              return (
                <div
                  key={time}
                  className="relative"
                  style={{
                    height: `${CELL_H}px`,
                    borderTop: idx > 0 && isHourStart ? hourBorderStyle : undefined,
                  }}
                >
                  {isHourStart && (
                    <span className="absolute top-1 right-3 text-[12px] font-semibold leading-none whitespace-nowrap px-1 py-0.5 rounded"
                      style={{ color: isDark ? '#64748b' : '#94a3b8' }}
                    >
                      {time}
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
              className="flex-1 min-w-[64px]"
              style={{ borderLeft: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }}
            >
              {timeSlots.map((time, idx) => {
                const id = slotId(date, time)
                const isHourStart = idx % 2 === 0
                const hourIndex = Math.floor(idx / 2)
                const cellStyle = getCellStyle(date, time)
                const isSelected = mode === 'select' && selected.has(id)

                return (
                  <div
                    key={time}
                    data-cell-id={id}
                    style={{
                      height: `${CELL_H}px`,
                      backgroundColor: isSelected ? undefined : getCellBg(hourIndex),
                      borderTop: idx > 0 && isHourStart ? hourBorderStyle : undefined,
                      borderBottom: isHourStart && !isSelected ? halfBorderStyle : undefined,
                      cursor: mode === 'select' ? 'crosshair' : 'default',
                      transition: 'background 0.1s',
                      ...cellStyle,
                    }}
                    className={`w-full box-border select-none-touch`}
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
