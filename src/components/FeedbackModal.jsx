import { useState } from 'react'
import { X, MessageSquarePlus, Send, CheckCircle, AlertCircle } from 'lucide-react'

const EMAILJS_SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const EMAILJS_PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

export default function FeedbackModal({ onClose }) {
  const [form, setForm] = useState({ type: '개선사항', message: '', contact: '' })
  const [status, setStatus] = useState('idle') // idle | sending | success | error

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="relative w-full max-w-md card p-6 shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h2 className="font-bold text-slate-900 dark:text-slate-50">개선사항 / 버그 제보</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {status === 'success' ? (
          <div className="py-8 flex flex-col items-center gap-3 text-center">
            <CheckCircle className="w-12 h-12 text-green-500" />
            <p className="font-semibold text-slate-900 dark:text-slate-50">전송 완료!</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">소중한 의견 감사합니다. 검토 후 반영하겠습니다.</p>
            <button onClick={onClose} className="mt-2 btn-primary">닫기</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 유형 */}
            <div>
              <label className="label">유형</label>
              <div className="flex gap-2">
                {['개선사항', '버그 제보', '기타'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: t }))}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors
                      ${form.type === t
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-brand-400'
                      }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* 내용 */}
            <div>
              <label className="label">내용 <span className="text-rose-400">*</span></label>
              <textarea
                className="input resize-none"
                rows={4}
                placeholder="어떤 점이 불편하셨나요? 자유롭게 적어주세요."
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                maxLength={1000}
              />
              <p className="text-right text-xs text-slate-400 mt-1">{form.message.length}/1000</p>
            </div>

            {/* 연락처 (선택) */}
            <div>
              <label className="label">연락처 <span className="text-slate-400 font-normal">(선택)</span></label>
              <input
                type="text"
                className="input"
                placeholder="이메일 또는 연락처 (답장 원하시면 입력)"
                value={form.contact}
                onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
              />
            </div>

            {status === 'error' && (
              <p className="text-sm text-rose-500 dark:text-rose-400 flex items-center gap-1.5">
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
