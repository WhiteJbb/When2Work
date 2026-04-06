import { useState } from 'react'
import TimeGrid from './TimeGrid'
import { buildHeatmap, findBestSlots, formatDateFull } from '../utils/timeUtils'

export default function ResultsView({ room, availabilities }) {
  const [hoveredSlot, setHoveredSlot] = useState(null)

  const heatmap = buildHeatmap(availabilities)
  const bestSlots = findBestSlots(heatmap, availabilities, 5, 2)
  const hoveredInfo = hoveredSlot ? heatmap[hoveredSlot] || [] : null
  const totalCount = availabilities.length

  return (
    <div className="space-y-5">

      {/* ── 참여자 ── */}
      <div className="card p-4">
        <p className="font-extrabold text-base mb-3" style={{ color:'#111' }}>
          👥 참여자 <span style={{ color:'#0ecfb0' }}>{totalCount}명</span>
        </p>
        {availabilities.length === 0 ? (
          <p className="text-sm font-medium" style={{ color:'#bbb' }}>아직 응답자가 없습니다.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availabilities.map(av => (
              <span key={av.id} className="text-xs font-bold px-3 py-1.5"
                style={{ borderRadius:'999px', background:'#edfdf8', color:'#0ecfb0', border:'1.5px solid #a8f2e4' }}
              >
                {av.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── 범례 ── */}
      <div className="flex items-center gap-2 text-xs font-semibold px-1" style={{ color:'#bbb' }}>
        <span>0명</span>
        <div className="flex gap-0.5">
          {[0,0.2,0.4,0.6,0.8,1].map(r => (
            <div key={r} className="w-6 h-4 rounded-lg"
              style={{ backgroundColor: r===0 ? '#f5f5f5' : `rgba(14,207,176,${0.15+r*0.8})` }}
            />
          ))}
        </div>
        <span>{totalCount}명</span>
        {hoveredInfo !== null && (
          <span className="ml-auto font-extrabold" style={{ color:'#0ecfb0' }}>
            {hoveredInfo.length > 0 ? `${hoveredInfo.length}명 가능: ${hoveredInfo.join(', ')}` : '가능한 사람 없음'}
          </span>
        )}
      </div>

      {/* ── 그리드 ── */}
      {availabilities.length > 0 ? (
        <TimeGrid mode="results" dates={room.dates} startHour={room.time_start} endHour={room.time_end}
          heatmap={heatmap} totalParticipants={totalCount} onCellHover={setHoveredSlot}
        />
      ) : (
        <div className="card p-10 text-center">
          <p className="text-4xl mb-3">🕐</p>
          <p className="text-sm font-semibold" style={{ color:'#bbb' }}>아직 입력한 참여자가 없습니다.</p>
        </div>
      )}

      {/* ── 추천 시간대 ── */}
      {bestSlots.length > 0 && (
        <div>
          <div className="mb-3 px-1">
            <p className="section-sub">AI 추천</p>
            <p className="section-title text-lg">추천 시간대 ⭐</p>
          </div>
          <div className="space-y-2.5">
            {bestSlots.map((slot, i) => (
              <div key={`${slot.date}-${slot.startTime}-${i}`}
                className="card p-4 flex items-center gap-4"
                style={slot.isHighlighted ? {
                  border: '2px solid #a8f2e4', background: '#edfdf8',
                  boxShadow: '0 4px 16px rgba(14,207,176,0.15)'
                } : {}}
              >
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-extrabold flex-shrink-0"
                  style={
                    slot.isHighlighted
                      ? { background: '#0ecfb0', color: '#fff', boxShadow: '0 4px 12px rgba(14,207,176,0.4)' }
                      : i === 0
                      ? { background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', boxShadow: '0 4px 12px rgba(245,158,11,0.35)' }
                      : { background: '#f5f5f5', color: '#aaa', border: '1.5px solid #ebebeb' }
                  }
                >
                  {slot.isHighlighted ? '★' : i+1}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-sm" style={{ color:'#111' }}>{formatDateFull(slot.date)}</p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color:'#bbb' }}>
                    {slot.startTime} ~ {slot.endTime} · {slot.durationMins}분
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="font-extrabold text-2xl leading-none" style={{ color:'#0ecfb0' }}>
                    {slot.count}<span className="text-sm font-bold" style={{ color:'#a8f2e4' }}>/{totalCount}</span>
                  </p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color:'#bbb' }}>명 가능</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
