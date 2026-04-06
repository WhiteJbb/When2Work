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

  // 다크/라이트 색상 토큰
  const colors = isDark ? {
    gridBorder: '#3a3a3c',
    headerBg: '#2c2c2e',
    timeLabelBg: '#2c2c2e',
    timeLabelBorder: '#3a3a3c',
    hourBorder: '#3a3a3c',
    halfBorder: '#333335',
    colBorder: '#3a3a3c',
    cellEven: '#1c1c1e',
    cellOdd: '#252527',
    timeText: '#636366',
    weekdayText: '#aeaeb2',
    weekendText: '#f87171',
  } : {
    gridBorder: '#e8e8f0',
    headerBg: '#ffffff',
    timeLabelBg: '#fafafa',
    timeLabelBorder: '#e8e8f0',
    hourBorder: '#e0e0ec',
    halfBorder: '#ececf4',
    colBorder: '#ececf4',
    cellEven: '#ffffff',
    cellOdd: '#fafafa',
    timeText: '#b0b0c0',
    weekdayText: '#3d3d56',
    weekendText: '#e11d48',
  }

  function getCellStyle(date, time, hourIndex) {
    const id = slotId(date, time)
    if (mode === 'select') {
      if (selected.has(id)) {
        return {
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
        }
      }
      return { backgroundColor: hourIndex % 2 === 0 ? colors.cellEven : colors.cellOdd }
    }
    const names = heatmap[id] || []
    const ratio = totalParticipants > 0 ? names.length / totalParticipants : 0
    if (ratio === 0) return { backgroundColor: hourIndex % 2 === 0 ? colors.cellEven : colors.cellOdd }
    return { backgroundColor: isDark
      ? `rgba(79,70,229,${0.15 + ratio * 0.75})`
      : `rgba(79,70,229,${0.12 + ratio * 0.78})`
    }
  }

  return (
    <div className="overflow-auto rounded-3xl"
      style={{ border: `1.5px solid ${colors.gridBorder}`, boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}
    >
      <div ref={gridRef} className="relative" onMouseMove={handleMouseMove} onTouchMove={handleTouchMove}
        style={{ minWidth: `${dates.length * 64 + 70}px` }}
      >
        {/* ── 헤더 ── */}
        <div className="flex sticky top-0 z-10"
          style={{ background: colors.headerBg, borderBottom: `2px solid ${colors.hourBorder}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
        >
          <div className="w-[70px] flex-shrink-0" />
          {dates.map(d => {
            const { weekday, month, day, isWeekend } = formatDateHeader(d)
            return (
              <div key={d} className="flex-1 min-w-[64px] text-center py-3"
                style={{ borderLeft: `1.5px solid ${colors.colBorder}` }}
              >
                <p className="text-sm font-extrabold" style={{ color: isWeekend ? colors.weekendText : colors.weekdayText }}>{weekday}</p>
                <p className="text-xs mt-0.5 font-medium opacity-50" style={{ color: isWeekend ? colors.weekendText : colors.weekdayText }}>{month}/{day}</p>
              </div>
            )
          })}
        </div>

        {/* ── 바디 ── */}
        <div className="flex">
          {/* 시간 라벨 */}
          <div className="w-[70px] flex-shrink-0"
            style={{ background: colors.timeLabelBg, borderRight: `2px solid ${colors.timeLabelBorder}` }}
          >
            {timeSlots.map((time, idx) => {
              const isHourStart = idx % 2 === 0
              return (
                <div key={time} className="relative"
                  style={{
                    height: `${CELL_H}px`,
                    borderTop: idx > 0 && isHourStart ? `2px solid ${colors.hourBorder}` : undefined,
                  }}
                >
                  {isHourStart && (
                    <span className="absolute top-1 right-3 text-[11px] font-bold leading-none whitespace-nowrap"
                      style={{ color: colors.timeText }}
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
            <div key={date} data-date-col={date} className="flex-1 min-w-[64px]"
              style={{ borderLeft: `1.5px solid ${colors.colBorder}` }}
            >
              {timeSlots.map((time, idx) => {
                const id = slotId(date, time)
                const isHourStart = idx % 2 === 0
                const hourIndex = Math.floor(idx / 2)
                const isSelected = mode === 'select' && selected.has(id)

                return (
                  <div key={time} data-cell-id={id}
                    style={{
                      height: `${CELL_H}px`,
                      borderTop: idx > 0 && isHourStart ? `2px solid ${colors.hourBorder}` : undefined,
                      borderBottom: isHourStart && !isSelected ? `1px solid ${colors.halfBorder}` : undefined,
                      cursor: mode === 'select' ? 'crosshair' : 'default',
                      transition: 'background 0.08s',
                      ...getCellStyle(date, time, hourIndex),
                    }}
                    className="w-full box-border select-none-touch"
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
