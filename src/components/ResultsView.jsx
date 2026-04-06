import { useState } from 'react'
import { Users, Star, Clock } from 'lucide-react'
import TimeGrid from './TimeGrid'
import { buildHeatmap, findBestSlots, formatDateFull } from '../utils/timeUtils'

export default function ResultsView({ room, availabilities }) {
  const [hoveredSlot, setHoveredSlot] = useState(null)

  const heatmap = buildHeatmap(availabilities)
  const bestSlots = findBestSlots(heatmap, availabilities, 5, 2)
  const hoveredInfo = hoveredSlot ? heatmap[hoveredSlot] || [] : null
  const totalCount = availabilities.length

  return (
    <div className="space-y-4">

      {/* ── 참여자 목록 ── */}
      <div className="card p-5">
        <p className="section-title flex items-center gap-2 mb-3">
          <span className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: '#eef2ff' }}
          >
            <Users className="w-4 h-4 text-indigo-500" />
          </span>
          참여자 {totalCount}명
        </p>
        {availabilities.length === 0 ? (
          <p className="text-sm" style={{ color: '#a0a0b0' }}>아직 응답자가 없습니다.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availabilities.map(av => (
              <span key={av.id} className="badge badge-indigo">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1" />
                {av.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── 히트맵 범례 ── */}
      <div className="flex items-center gap-2 text-xs font-medium px-1" style={{ color: '#a0a0b0' }}>
        <span>0명</span>
        <div className="flex gap-0.5">
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map(r => (
            <div key={r} className="w-6 h-4 rounded"
              style={{ backgroundColor: r === 0 ? '#f4f4f8' : `rgba(79, 70, 229, ${0.15 + r * 0.85})` }}
            />
          ))}
        </div>
        <span>{totalCount}명</span>
        {hoveredInfo !== null && (
          <span className="ml-auto font-bold" style={{ color: '#4f46e5' }}>
            {hoveredInfo.length > 0
              ? `${hoveredInfo.length}명 가능: ${hoveredInfo.join(', ')}`
              : '가능한 사람 없음'
            }
          </span>
        )}
      </div>

      {/* ── 히트맵 그리드 ── */}
      {availabilities.length > 0 ? (
        <TimeGrid
          mode="results"
          dates={room.dates} startHour={room.time_start} endHour={room.time_end}
          heatmap={heatmap} totalParticipants={totalCount} onCellHover={setHoveredSlot}
        />
      ) : (
        <div className="card p-10 text-center">
          <div className="w-14 h-14 rounded-3xl flex items-center justify-center mx-auto mb-3"
            style={{ background: '#f4f4f8' }}
          >
            <Clock className="w-7 h-7" style={{ color: '#c7d2fe' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: '#a0a0b0' }}>아직 가능한 시간을 입력한 참여자가 없습니다.</p>
        </div>
      )}

      {/* ── 추천 시간대 ── */}
      {bestSlots.length > 0 && (
        <div>
          <p className="section-title flex items-center gap-2 mb-3 px-1">
            <span className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ background: '#fffbeb' }}
            >
              <Star className="w-4 h-4 text-amber-400" />
            </span>
            추천 시간대
          </p>
          <div className="space-y-2.5">
            {bestSlots.map((slot, i) => (
              <div
                key={`${slot.date}-${slot.startTime}-${i}`}
                className="card p-4 flex items-center gap-4"
                style={slot.isHighlighted ? {
                  border: '2px solid #c7d2fe',
                  background: '#f8f7ff',
                  boxShadow: '0 4px 20px rgba(99,102,241,0.12)',
                } : {}}
              >
                {/* 순위 뱃지 */}
                <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-extrabold flex-shrink-0"
                  style={
                    slot.isHighlighted
                      ? { background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color:'#fff', boxShadow:'0 4px 12px rgba(99,102,241,0.4)' }
                      : i === 0
                      ? { background: 'linear-gradient(135deg,#f59e0b,#d97706)', color:'#fff', boxShadow:'0 4px 12px rgba(245,158,11,0.35)' }
                      : i === 1
                      ? { background: '#f1f5f9', color:'#64748b', border:'2px solid #e2e8f0' }
                      : { background: '#f4f4f8', color:'#a0a0b0', border:'2px solid #ececf4' }
                  }
                >
                  {slot.isHighlighted ? '★' : i + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-sm" style={{ color: '#1a1a2e' }}>
                    {formatDateFull(slot.date)}
                  </p>
                  <p className="text-xs mt-0.5 font-medium" style={{ color: '#a0a0b0' }}>
                    {slot.startTime} ~ {slot.endTime} · {slot.durationMins}분
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="font-extrabold text-xl leading-none" style={{ color: '#4f46e5' }}>
                    {slot.count}
                    <span className="text-sm font-bold" style={{ color: '#c7d2fe' }}>/{totalCount}</span>
                  </p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: '#a0a0b0' }}>명 가능</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
