import { useState } from 'react'
import { Users, Star, Clock } from 'lucide-react'
import TimeGrid from './TimeGrid'
import { buildHeatmap, findBestSlots, parseSlotId, formatDateFull, formatTimeLabel } from '../utils/timeUtils'

export default function ResultsView({ room, availabilities }) {
  const [hoveredSlot, setHoveredSlot] = useState(null)

  const heatmap = buildHeatmap(availabilities)
  const bestSlots = findBestSlots(heatmap, availabilities, 5, 2)

  const hoveredInfo = hoveredSlot ? heatmap[hoveredSlot] || [] : null

  const totalCount = availabilities.length

  return (
    <div className="space-y-6">
      {/* 참여자 목록 */}
      <div className="card p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-500" />
          참여자 ({totalCount}명)
        </h3>
        {availabilities.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">아직 응답자가 없습니다.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availabilities.map(av => (
              <span
                key={av.id}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
                           bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                {av.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 히트맵 범례 */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>0명</span>
        <div className="flex gap-0.5">
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map(r => (
            <div
              key={r}
              className="w-6 h-4 rounded"
              style={{ backgroundColor: r === 0 ? '#f1f5f9' : `rgba(99, 102, 241, ${0.2 + r * 0.8})` }}
            />
          ))}
        </div>
        <span>{totalCount}명</span>
        {hoveredInfo !== null && (
          <span className="ml-auto font-medium text-slate-700 dark:text-slate-300">
            {hoveredInfo.length > 0
              ? `${hoveredInfo.length}명 가능: ${hoveredInfo.join(', ')}`
              : '가능한 사람 없음'
            }
          </span>
        )}
      </div>

      {/* 히트맵 그리드 */}
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
        <div className="card p-10 text-center text-slate-400 dark:text-slate-500">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">아직 가능한 시간을 입력한 참여자가 없습니다.</p>
        </div>
      )}

      {/* 추천 시간대 */}
      {bestSlots.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            추천 시간대
          </h3>
          <div className="space-y-2">
            {bestSlots.map((slot, i) => (
              <div
                key={`${slot.date}-${slot.startTime}-${i}`}
                className={`card p-4 flex items-center gap-4 ${i === 0 ? 'ring-2 ring-brand-400 dark:ring-brand-500' : ''}`}
              >
                {/* 순위 뱃지 */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                  ${i === 0
                    ? 'bg-amber-400 text-white'
                    : i === 1
                    ? 'bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-200'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                  {i + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">
                    {formatDateFull(slot.date)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {slot.startTime} ~ {slot.endTime}
                    {' '}({slot.durationMins}분)
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-brand-600 dark:text-brand-400 text-lg leading-none">
                    {slot.count}<span className="text-sm font-normal text-slate-400">/{totalCount}</span>
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">명 가능</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
