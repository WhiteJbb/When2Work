import { useState } from 'react'
import { X, MessageSquarePlus, Send, CheckCircle, AlertCircle } from 'lucide-react'

const EMAILJS_SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const EMAILJS_PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

export default function FeedbackModal({ onClose }) {
  const [form, setForm] = useState({ type: '개선사항', message: '', contact: '' })
  const [status, setStatus] = useState('idle')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.message.trim()) return
    setStatus('sending')
    try {
      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id:  EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id:     EMAILJS_PUBLIC_KEY,
          template_params: {
            feedback_type:    form.type,
            feedback_message: form.message,
            contact:          form.contact || '(미입력)',
          },
        }),
      })
      if (!res.ok) throw new Error('전송 실패')
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  const TYPES = [
    { label: '💡 개선사항', value: '개선사항' },
    { label: '🐛 버그 제보', value: '버그 제보' },
    { label: '💬 기타',     value: '기타' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* 오버레이 */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      {/* 모달 */}
      <div
        className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6"
        style={{
          background: 'rgba(15, 15, 30, 0.92)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          boxShadow: '0 -8px 48px rgba(99,102,241,0.15), 0 4px 32px rgba(0,0,0,0.5)',
        }}
      >
        {/* 드래그 핸들 (모바일) */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full sm:hidden"
          style={{ background: 'rgba(255,255,255,0.2)' }}
        />

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}
            >
              <MessageSquarePlus className="w-4 h-4" style={{ color: '#a5b4fc' }} />
            </div>
            <h2 className="font-bold text-base" style={{ color: '#e2e8f0' }}>의견 보내기</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <X className="w-4 h-4" style={{ color: '#64748b' }} />
          </button>
        </div>

        {status === 'success' ? (
          <div className="py-10 flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', boxShadow: '0 0 32px rgba(52,211,153,0.2)' }}
            >
              <CheckCircle className="w-8 h-8" style={{ color: '#34d399' }} />
            </div>
            <p className="font-bold text-lg mt-1" style={{ color: '#e2e8f0' }}>전송 완료!</p>
            <p className="text-sm" style={{ color: '#64748b' }}>소중한 의견 감사합니다. 검토 후 반영하겠습니다.</p>
            <button onClick={onClose} className="btn-primary mt-3 px-8">닫기</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* 유형 */}
            <div className="flex gap-2">
              {TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: t.value }))}
                  className="flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-150"
                  style={form.type === t.value ? {
                    background: 'rgba(99,102,241,0.25)',
                    border: '1px solid rgba(99,102,241,0.5)',
                    color: '#a5b4fc',
                    boxShadow: '0 0 12px rgba(99,102,241,0.2)',
                  } : {
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#64748b',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* 내용 */}
            <div>
              <label className="label">
                내용 <span style={{ color: '#f87171' }}>*</span>
              </label>
              <textarea
                className="input resize-none"
                rows={4}
                placeholder="어떤 점이 불편하셨나요? 자유롭게 적어주세요."
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                maxLength={1000}
              />
              <p className="text-right text-xs mt-1" style={{ color: '#475569' }}>{form.message.length}/1000</p>
            </div>

            {/* 연락처 */}
            <div>
              <label className="label">
                연락처 <span className="font-normal" style={{ color: '#475569' }}>(선택)</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="이메일 또는 연락처 (답장 원하시면 입력)"
                value={form.contact}
                onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
              />
            </div>

            {status === 'error' && (
              <p className="text-sm text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                전송에 실패했습니다. 잠시 후 다시 시도해주세요.
              </p>
            )}

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={status === 'sending' || !form.message.trim()}
            >
              {status === 'sending' ? '전송 중...' : '제출하기'}
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
