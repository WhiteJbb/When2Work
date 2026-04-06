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
    <div className="space-y-6">

      {/* ── 참여자 목록 ── */}
      <div className="card p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: '#94a3b8' }}>
          <Users className="w-4 h-4" style={{ color: '#6366f1' }} />
          참여자 ({totalCount}명)
        </h3>
        {availabilities.length === 0 ? (
          <p className="text-sm" style={{ color: '#475569' }}>아직 응답자가 없습니다.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availabilities.map(av => (
              <span
                key={av.id}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  background: 'rgba(99,102,241,0.15)',
                  color: '#a5b4fc',
                  border: '1px solid rgba(99,102,241,0.25)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#6366f1', boxShadow: '0 0 4px rgba(99,102,241,0.8)' }} />
                {av.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── 히트맵 범례 ── */}
      <div className="flex items-center gap-2 text-xs" style={{ color: '#475569' }}>
        <span>0명</span>
        <div className="flex gap-0.5">
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map(r => (
            <div
              key={r}
              className="w-6 h-4 rounded"
              style={{ backgroundColor: r === 0 ? 'rgba(255,255,255,0.05)' : `rgba(99, 102, 241, ${0.15 + r * 0.85})` }}
            />
          ))}
        </div>
        <span>{totalCount}명</span>
        {hoveredInfo !== null && (
          <span className="ml-auto font-medium" style={{ color: '#a5b4fc' }}>
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
          dates={room.dates}
          startHour={room.time_start}
          endHour={room.time_end}
          heatmap={heatmap}
          totalParticipants={totalCount}
          onCellHover={setHoveredSlot}
        />
      ) : (
        <div className="card p-10 text-center">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: '#6366f1' }} />
          <p className="text-sm" style={{ color: '#475569' }}>아직 가능한 시간을 입력한 참여자가 없습니다.</p>
        </div>
      )}

      {/* ── 추천 시간대 ── */}
      {bestSlots.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: '#94a3b8' }}>
            <Star className="w-4 h-4 text-amber-400" />
            추천 시간대
          </h3>
          <div className="space-y-2">
            {bestSlots.map((slot, i) => (
              <div
                key={`${slot.date}-${slot.startTime}-${i}`}
                className="card p-4 flex items-center gap-4"
                style={slot.isHighlighted ? {
                  background: 'rgba(99,102,241,0.1)',
                  border: '1px solid rgba(99,102,241,0.3)',
                  boxShadow: '0 0 20px rgba(99,102,241,0.1)',
                } : {}}
              >
                {/* 순위 뱃지 */}
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={
                    slot.isHighlighted
                      ? { background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', boxShadow: '0 0 12px rgba(99,102,241,0.5)' }
                      : i === 0
                      ? { background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', boxShadow: '0 0 8px rgba(245,158,11,0.4)' }
                      : i === 1
                      ? { background: 'rgba(148,163,184,0.2)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.3)' }
                      : { background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }
                  }
                >
                  {slot.isHighlighted ? '★' : i + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>
                    {formatDateFull(slot.date)}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                    {slot.startTime} ~ {slot.endTime} ({slot.durationMins}분)
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-lg leading-none" style={{ color: '#a5b4fc' }}>
                    {slot.count}<span className="text-sm font-normal" style={{ color: '#475569' }}>/{totalCount}</span>
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#475569' }}>명 가능</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
