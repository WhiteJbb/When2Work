// ─── 날짜 유틸 ────────────────────────────────────────────────────────────────

export function generateDateRange(startDate, numDays) {
  const dates = []
  const start = new Date(startDate + 'T00:00:00')
  for (let i = 0; i < numDays; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${day}`)
  }
  return dates
}

const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토']

export function formatDateHeader(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return {
    weekday: WEEKDAYS_KO[d.getDay()],
    month: d.getMonth() + 1,
    day: d.getDate(),
    isWeekend: d.getDay() === 0 || d.getDay() === 6,
  }
}

export function formatDateFull(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS_KO[d.getDay()]})`
}

// ─── 시간 슬롯 유틸 ──────────────────────────────────────────────────────────

export function generateTimeSlots(startHour, endHour) {
  const slots = []
  for (let h = startHour; h < endHour; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  return slots
}

export function formatTimeLabel(timeStr) {
  const [h] = timeStr.split(':')
  const hour = parseInt(h, 10)
  if (hour === 0) return '자정'
  if (hour === 12) return '정오'
  if (hour < 12) return `오전 ${hour}시`
  return `오후 ${hour - 12}시`
}

// 슬롯 ID = "YYYY-MM-DD|HH:mm"
export function slotId(date, time) {
  return `${date}|${time}`
}

export function parseSlotId(id) {
  const [date, time] = id.split('|')
  return { date, time }
}

// ─── 히트맵 분석 ─────────────────────────────────────────────────────────────

/**
 * availabilities: [{ name, slots: string[] }]
 * → 각 슬롯에 몇 명이 가능한지 맵 반환
 */
export function buildHeatmap(availabilities) {
  const map = {}
  for (const av of availabilities) {
    for (const slot of av.slots) {
      map[slot] = (map[slot] || [])
      map[slot].push(av.name)
    }
  }
  return map
}

/**
 * 가장 많은 사람이 가능한 연속 슬롯 블록을 찾아 상위 N개 반환
 * minSlots: 최소 연속 슬롯 수 (기본 2 = 1시간)
 */
export function findBestSlots(heatmap, availabilities, topN = 3, minSlots = 2) {
  if (!availabilities.length) return []

  // 날짜별로 슬롯 그룹화
  const byDate = {}
  for (const [key, names] of Object.entries(heatmap)) {
    const { date, time } = parseSlotId(key)
    if (!byDate[date]) byDate[date] = []
    byDate[date].push({ time, names, count: names.length })
  }

  const blocks = []

  for (const [date, slots] of Object.entries(byDate)) {
    // 시간순 정렬
    slots.sort((a, b) => a.time.localeCompare(b.time))

    // 연속 슬롯 묶기
    let i = 0
    while (i < slots.length) {
      let j = i
      const startNames = new Set(slots[i].names)

      // 다음 슬롯과 30분 차이인지 확인하며 연속 블록 탐색
      while (j + 1 < slots.length) {
        const curr = slots[j].time
        const next = slots[j + 1].time
        if (!isConsecutive(curr, next)) break
        // 교집합
        const intersection = slots[j + 1].names.filter(n => startNames.has(n))
        if (intersection.length === 0) break
        // 교집합으로 업데이트
        for (const n of [...startNames]) {
          if (!intersection.includes(n)) startNames.delete(n)
        }
        j++
      }

      const slotCount = j - i + 1
      if (slotCount >= minSlots && startNames.size > 0) {
        blocks.push({
          date,
          startTime: slots[i].time,
          endTime: addMinutes(slots[j].time, 30),
          participants: [...startNames],
          count: startNames.size,
          durationMins: slotCount * 30,
        })
      }
      i = j + 1
    }
  }

  // 참여 인원 수 → 길이 → 날짜순 정렬
  blocks.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count
    if (b.durationMins !== a.durationMins) return b.durationMins - a.durationMins
    return a.date.localeCompare(b.date)
  })

  return blocks.slice(0, topN)
}

function isConsecutive(time1, time2) {
  return addMinutes(time1, 30) === time2
}

function addMinutes(timeStr, mins) {
  const [h, m] = timeStr.split(':').map(Number)
  const total = h * 60 + m + mins
  const nh = Math.floor(total / 60)
  const nm = total % 60
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
}

// ─── 색상 ─────────────────────────────────────────────────────────────────────

/**
 * 참여 비율(0~1)을 인디고 계열 색으로 변환
 * isDark: 다크 모드 여부
 */
export function heatColor(ratio, isDark) {
  if (ratio === 0) return isDark ? '#1e293b' : '#f1f5f9' // slate-800 / slate-100
  // 0 초과 → 인디고 계열
  const alpha = 0.2 + ratio * 0.8
  return `rgba(99, 102, 241, ${alpha})`
}
