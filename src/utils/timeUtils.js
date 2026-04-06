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
 * 겹치는 구간을 분리하여 각 구간별로 가능한 사람 수 계산
 * minSlots: 최소 연속 슬롯 수 (기본 2 = 1시간)
 */
export function findBestSlots(heatmap, availabilities, topN = 5, minSlots = 2) {
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

    // 연속된 슬롯들을 그룹화
    let i = 0
    while (i < slots.length) {
      const group = [slots[i]]
      let j = i + 1
      
      // 연속된 슬롯들을 모음
      while (j < slots.length && isConsecutive(slots[j - 1].time, slots[j].time)) {
        group.push(slots[j])
        j++
      }

      // 이 그룹 내에서 모든 가능한 구간 찾기
      if (group.length >= minSlots) {
        // 각 시작점에서
        for (let start = 0; start < group.length; start++) {
          // 각 끝점까지
          for (let end = start + minSlots - 1; end < group.length; end++) {
            // 이 구간의 교집합 계산
            let commonNames = new Set(group[start].names)
            for (let k = start + 1; k <= end; k++) {
              const intersection = [...commonNames].filter(n => group[k].names.includes(n))
              commonNames = new Set(intersection)
            }

            if (commonNames.size > 0) {
              blocks.push({
                date,
                startTime: group[start].time,
                endTime: addMinutes(group[end].time, 30),
                participants: [...commonNames].sort(),
                count: commonNames.size,
                durationMins: (end - start + 1) * 30,
              })
            }
          }
        }
      }

      i = j
    }
  }

  // 겹치는 구간 제거: 같은 참여자 집합이면서 한 구간이 다른 구간을 완전히 포함하는 경우
  const filtered = []
  
  for (const block of blocks) {
    let isSubset = false
    
    for (const other of blocks) {
      if (block === other) continue
      if (block.date !== other.date) continue
      if (block.participants.join(',') !== other.participants.join(',')) continue
      
      // other가 block을 완전히 포함하는지 확인
      if (other.startTime <= block.startTime && other.endTime >= block.endTime && 
          other.durationMins > block.durationMins) {
        isSubset = true
        break
      }
    }
    
    if (!isSubset) {
      filtered.push(block)
    }
  }

  // 참여 인원 수 → 길이 → 날짜순 정렬
  filtered.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count
    if (b.durationMins !== a.durationMins) return b.durationMins - a.durationMins
    return a.date.localeCompare(b.date)
  })

  // 최고 인원수와 시간 찾기
  const maxCount = filtered.length > 0 ? filtered[0].count : 0
  const maxDuration = filtered.filter(b => b.count === maxCount).reduce((max, b) => Math.max(max, b.durationMins), 0)
  
  // 강조 표시 추가
  const result = filtered.slice(0, topN).map(block => ({
    ...block,
    isHighlighted: block.count === maxCount && block.durationMins === maxDuration
  }))

  return result
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
