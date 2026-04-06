import { useState } from 'react'
import { X, MessageSquarePlus, Send, CheckCircle, AlertCircle } from 'lucide-react'

const EMAILJS_SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const EMAILJS_PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

const TYPES = [
  { label: '💡 개선사항', value: '개선사항' },
  { label: '🐛 버그 제보', value: '버그 제보' },
  { label: '💬 기타',     value: '기타' },
]

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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* 오버레이 */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="relative w-full sm:max-w-md rounded-t-[2rem] sm:rounded-3xl bg-white dark:bg-[#2c2c2e] p-6"
        style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}
      >
        {/* 드래그 핸들 */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full sm:hidden"
          style={{ background: '#e8e8f0' }}
        />

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: '#eef2ff', border: '1.5px solid #c7d2fe' }}
            >
              <MessageSquarePlus className="w-4 h-4 text-indigo-500" />
            </div>
            <h2 className="font-extrabold text-base" style={{ color: '#1a1a2e' }}>의견 보내기</h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-2xl flex items-center justify-center transition-colors active:scale-90"
            style={{ background: '#f4f4f8', border: '1.5px solid #e8e8f0' }}
          >
            <X className="w-4 h-4" style={{ color: '#a0a0b0' }} />
          </button>
        </div>

        {status === 'success' ? (
          <div className="py-10 flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
              style={{ background: '#f0fdf4', border: '2px solid #bbf7d0', boxShadow: '0 4px 20px rgba(34,197,94,0.15)' }}
            >
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <p className="font-extrabold text-lg mt-1" style={{ color: '#1a1a2e' }}>전송 완료!</p>
            <p className="text-sm" style={{ color: '#a0a0b0' }}>소중한 의견 감사합니다. 검토 후 반영하겠습니다.</p>
            <button onClick={onClose} className="btn-primary mt-3 px-10">닫기</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* 유형 선택 */}
            <div className="flex gap-2">
              {TYPES.map(t => (
                <button key={t.value} type="button"
                  onClick={() => setForm(f => ({ ...f, type: t.value }))}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all duration-150 active:scale-95"
                  style={form.type === t.value ? {
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: '#ffffff',
                    boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
                    border: '2px solid transparent',
                  } : {
                    background: '#f4f4f8',
                    color: '#a0a0b0',
                    border: '2px solid #e8e8f0',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* 내용 */}
            <div>
              <label className="label">
                내용 <span className="text-rose-500">*</span>
              </label>
              <textarea
                className="input resize-none"
                rows={4}
                placeholder="어떤 점이 불편하셨나요? 자유롭게 적어주세요."
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                maxLength={1000}
              />
              <p className="text-right text-xs mt-1 font-medium" style={{ color: '#c0c0d0' }}>
                {form.message.length}/1000
              </p>
            </div>

            {/* 연락처 */}
            <div>
              <label className="label">
                연락처 <span className="font-medium" style={{ color: '#c0c0d0' }}>(선택)</span>
              </label>
              <input
                type="text" className="input"
                placeholder="이메일 또는 연락처 (답장 원하시면 입력)"
                value={form.contact}
                onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
              />
            </div>

            {status === 'error' && (
              <div className="flex items-center gap-2 p-3 rounded-2xl text-sm font-medium"
                style={{ background: '#fff1f2', color: '#e11d48', border: '1.5px solid #fecdd3' }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                전송에 실패했습니다. 잠시 후 다시 시도해주세요.
              </div>
            )}

            <button type="submit" className="btn-primary w-full py-4 rounded-2xl"
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
